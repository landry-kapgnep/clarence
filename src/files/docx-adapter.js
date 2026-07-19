// Adaptateur DOCX — Phase 3, la vraie difficulté : Word coupe une phrase sur
// plusieurs <w:r> (runs) de façon arbitraire (correcteur, mise en forme,
// suivi des modifications), donc "Jean Dupont" est souvent scindé entre deux
// runs. Voir distributeEntitiesOverRuns (text-units.js) pour la redistribution.
//
// DOMParser/XMLSerializer n'existent pas sous Node : injectables en option
// (défaut globalThis), même convention que detectNER(text, nerPipeline) qui
// injecte déjà son pipeline. Les tests passent @xmldom/xmldom (devDependency
// uniquement, jamais bundlée dans l'extension).
//
// Répartition des responsabilités (voir plan) :
// - le suivi des modifications (<w:del>/<w:ins>) est TOUJOURS retiré, y
//   compris par extractTextUnits/applyMask seuls : un <w:del> est du contenu
//   récupérable en un clic ("rejeter les modifications"), donc une vraie
//   fuite potentielle, pas juste de la métadonnée cosmétique.
// - les commentaires (ancres dans document.xml + partie word/comments*.xml)
//   ne sont PAS anonymisés en place : ils sont supprimés entièrement, et
//   uniquement par stripMetadata (usage attendu : toujours appelé avec
//   applyMask pour une anonymisation complète, comme pour XLSX/CSV).
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';
import { joinRuns, distributeEntitiesOverRuns } from './text-units.js';
import { stripCoreProps, stripAppProps, stripCommentParts } from './ooxml-metadata.js';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
// footnotes/endnotes inclus : leurs <w:p> sont des paragraphes normaux (même
// traitement), et les exclure serait une fuite SILENCIEUSE — une PII en note
// de bas de page ressortirait en clair sans que rien ne le signale.
const PART_RE = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;

function stripTrackedChanges(doc) {
  for (const del of Array.from(doc.getElementsByTagNameNS(W_NS, 'del'))) {
    del.parentNode.removeChild(del);
  }
  for (const ins of Array.from(doc.getElementsByTagNameNS(W_NS, 'ins'))) {
    const parent = ins.parentNode;
    while (ins.firstChild) parent.insertBefore(ins.firstChild, ins);
    parent.removeChild(ins);
  }
}

function removeCommentAnchors(doc) {
  for (const tag of ['commentRangeStart', 'commentRangeEnd', 'commentReference']) {
    for (const el of Array.from(doc.getElementsByTagNameNS(W_NS, tag))) {
      el.parentNode.removeChild(el);
    }
  }
}

// Un "run" ici = chaque <w:t>/<w:tab>/<w:br> individuel (pas le <w:r> XML
// entier), pour pouvoir réécrire finement. <w:tab>/<w:br> comptent comme des
// caractères atomiques '\t'/'\n' dans le texte reconstitué mais ne portent
// jamais de nouveau texte en sortie (voir applyMask) : une entité PII ne
// s'étend jamais sur une tabulation/un saut de ligne en pratique — le texte
// alentour serait de toute façon rompu comme signal de détection avant ça.
function collectRuns(paragraphEl) {
  const runs = [];
  let counter = 0;
  const walk = node => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== 1) continue;
      const local = child.localName;
      if (local === 'r') {
        for (const grandchild of Array.from(child.childNodes)) {
          if (grandchild.nodeType !== 1) continue;
          const gname = grandchild.localName;
          if (gname === 't') {
            runs.push({ id: `r${counter++}`, node: grandchild, kind: 't', text: grandchild.textContent || '' });
          } else if (gname === 'tab') {
            runs.push({ id: `r${counter++}`, node: grandchild, kind: 'tab', text: '\t' });
          } else if (gname === 'br') {
            runs.push({ id: `r${counter++}`, node: grandchild, kind: 'br', text: '\n' });
          }
        }
      } else if (local === 'hyperlink') {
        walk(child); // le texte visible d'un lien reste porteur de PII potentielle
      }
    }
  };
  walk(paragraphEl);
  return runs;
}

// XMLSerializer natif (navigateur) n'émet JAMAIS le prologue <?xml ...?>,
// même si le document original en avait un ; @xmldom (tests) le réémet, lui,
// s'il était présent à l'analyse. Il faut donc vérifier avant de préfixer,
// sous peine de dupliquer le prologue selon l'environnement d'exécution.
function withXmlProlog(serialized) {
  if (serialized.startsWith('<?xml')) return serialized;
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + serialized;
}

// Parse une partie XML, retire le suivi des modifications (toujours), et
// reconstitue la liste des runs par paragraphe (corps + tableaux + en-têtes/
// pieds : <w:tc>/<w:p> sont déjà des <w:p> normaux, aucun cas spécial requis).
function processPart(xmlString, partName, DOMParser) {
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
  stripTrackedChanges(doc);
  const paragraphs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
  const perParagraphRuns = paragraphs.map((p, i) => ({
    unitId: `${partName}#p${i}`,
    runs: collectRuns(p)
  }));
  return { doc, perParagraphRuns };
}

function partNamesOf(zipLikeKeys) {
  return zipLikeKeys.filter(p => PART_RE.test(p));
}

// { units: [{ id: 'word/document.xml#p{i}', text }] } — paragraphes vides ignorés.
export function extractTextUnits(buffer, opts = {}) {
  const DP = opts.DOMParser || globalThis.DOMParser;
  const zip = unzipSync(new Uint8Array(buffer));
  const units = [];
  for (const partName of partNamesOf(Object.keys(zip))) {
    const { perParagraphRuns } = processPart(strFromU8(zip[partName]), partName, DP);
    for (const { unitId, runs } of perParagraphRuns) {
      const { text } = joinRuns(runs.map(r => ({ id: r.id, text: r.text })));
      if (text.length > 0) units.push({ id: unitId, text });
    }
  }
  return { units };
}

// resultsById : Map<id, { entities }> (entities : offsets locaux + placeholder,
// tels que retournés par anonymizeUnits — maskedText n'est pas utilisé ici,
// c'est la redistribution par run qui reconstruit le texte final).
export function applyMask(buffer, resultsById, opts = {}) {
  const DP = opts.DOMParser || globalThis.DOMParser;
  const XS = opts.XMLSerializer || globalThis.XMLSerializer;
  const zip = unzipSync(new Uint8Array(buffer));
  const out = new Map(Object.entries(zip));

  for (const partName of partNamesOf([...out.keys()])) {
    const { doc, perParagraphRuns } = processPart(strFromU8(out.get(partName)), partName, DP);

    for (const { unitId, runs } of perParagraphRuns) {
      const result = resultsById.get(unitId);
      if (!result || runs.length === 0) continue;
      const newRuns = distributeEntitiesOverRuns(
        runs.map(r => ({ id: r.id, text: r.text })),
        result.entities || []
      );
      runs.forEach((run, i) => {
        if (run.kind !== 't') return; // tab/br : jamais réécrits
        const newText = newRuns[i].text;
        if (newText !== run.node.textContent) {
          run.node.textContent = newText;
          run.node.setAttribute('xml:space', 'preserve');
        }
      });
    }

    out.set(partName, strToU8(withXmlProlog(new XS().serializeToString(doc))));
  }

  return zipSync(Object.fromEntries(out));
}

export function stripMetadata(buffer, opts = {}) {
  const DP = opts.DOMParser || globalThis.DOMParser;
  const XS = opts.XMLSerializer || globalThis.XMLSerializer;
  const zip = unzipSync(new Uint8Array(buffer));
  let map = new Map(Object.entries(zip));

  for (const partName of partNamesOf([...map.keys()])) {
    const { doc } = processPart(strFromU8(map.get(partName)), partName, DP);
    removeCommentAnchors(doc);
    map.set(partName, strToU8(withXmlProlog(new XS().serializeToString(doc))));
  }

  if (map.has('docProps/core.xml')) {
    map.set('docProps/core.xml', strToU8(stripCoreProps(strFromU8(map.get('docProps/core.xml')))));
  }
  if (map.has('docProps/app.xml')) {
    map.set('docProps/app.xml', strToU8(stripAppProps(strFromU8(map.get('docProps/app.xml')))));
  }
  map = stripCommentParts(map);

  return zipSync(Object.fromEntries(map));
}
