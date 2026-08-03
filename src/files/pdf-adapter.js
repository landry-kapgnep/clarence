// Adaptateur PDF → Markdown. Contrairement à CSV/XLSX/DOCX, la sortie n'est
// JAMAIS une réécriture du fichier d'origine : c'est un nouveau document texte
// (.md). Pas de problème de réinjection dans un format contraint (aucune
// redistribution sur des runs nécessaire) — le seul vrai risque est la
// fidélité de l'extraction, pas la réécriture.
//
// Worker pdfjs : en NAVIGATEUR, la v6 exige GlobalWorkerOptions.workerSrc
// (aucun repli automatique — vérifié en vrai Chrome, l'extension plantait) ;
// en Node (tests), elle s'en passe toute seule. On pointe donc vers le worker
// embarqué dans vendor/ (copié par build.mjs, comme les .wasm du NER)
// uniquement quand l'API d'extension existe. Local, CSP 'self', zéro code
// distant. Validé : le bundle esbuild ne contient ni eval() ni new Function().
//
// Limites assumées et documentées, jamais silencieuses :
// - PDF scanné (sans couche texte) → aucune unité extraite ; le garde-fou
//   générique de processFile() ("Aucun texte à analyser") s'applique déjà,
//   aucun code spécifique requis ici.
// - PDF chiffré/protégé → getDocument(...).promise rejette, remonte dans le
//   catch générique de processFile().
// - Mise en page multi-colonnes NON gérée : le regroupement par Y sur toute
//   la largeur de page mélangerait l'ordre de lecture des colonnes. Hors
//   scope v1, comme les zones de texte/notes pour DOCX à l'origine.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.mjs');
}

// Un écart vertical supérieur à ce multiple de la taille de police de la
// ligne précédente marque un nouveau paragraphe (ligne vide en Markdown) ;
// en dessous, c'est un simple retour à la ligne dans le même paragraphe.
export const PARAGRAPH_GAP_RATIO = 1.6;
// Une ligne dont la police dépasse ce ratio par rapport à la taille
// dominante de la page est traitée comme un titre (heuristique best-effort,
// jamais bloquante si elle se trompe).
export const HEADING_SIZE_RATIO = 1.3;

function fontSizeOf(item) {
  // item.transform = [a,b,c,d,e,f] ; pour du texte non pivoté, |d| donne la
  // taille de police effective. item.height (si fourni par pdfjs) est déjà
  // ce calcul fait pour nous — préféré quand disponible.
  return item.height || Math.abs(item.transform?.[3]) || 1;
}

// Faut-il un espace entre deux fragments consécutifs d'une même ligne ?
// pdfjs découpe parfois UN SEUL mot en plusieurs items (kerning, changement de
// fonte) : y insérer un espace systématiquement coupait le mot (« Semantikmatch »
// → « Sem antik... »), cassant la détection PII (fuite partielle) ET la
// lisibilité. On n'insère un espace que si l'écart horizontal réel dépasse un
// seuil relatif à la taille de police ; deux fragments collés = même mot.
export function needsSpace(a, b) {
  const gap = b.x - (a.x + (a.width || 0));
  return gap > Math.max(1, (a.size || 10) * 0.2);
}

// Une ligne qui se termine par un mot COUPÉ EN FIN DE LIGNE (typographie
// justifiée, fréquente dans une colonne étroite de CV) doit être RECOLLÉE à la
// ligne suivante, sans quoi le fragment isolé est soumis tel quel au modèle
// contextuel, qui l'étiquette avec confiance : constaté sur un vrai CV,
// « matisée » (fin d'« automatisée ») → donnée de santé à 0,70, « plicative »
// (fin d'« applicative ») → entreprise à 0,70 — AU-DESSUS du score du vrai nom
// du candidat sur ce même document (0,47). Ce n'est donc pas cosmétique : ça
// rend la détection contextuelle non fiable sur le document le plus sensible.
//
// Signal fiable pour distinguer ce cas d'un tiret de séparation ordinaire : un
// trait d'union COLLÉ à la dernière lettre, sans espace avant lui. Un tiret de
// séparation réel en français est toujours entouré d'espaces (« Anglais - C1 »,
// « Concours d'éloquence - Double lauréat ») — il ne déclenche donc jamais ce
// motif. On exige en plus que la ligne suivante commence par une minuscule :
// une vraie coupure de mot continue toujours en minuscule ; une nouvelle
// phrase ou un titre commencerait par une majuscule.
const FIN_DE_MOT_COUPE = /\p{L}-$/u;
export function isLineWrapHyphen(texteAvant, texteApres) {
  return FIN_DE_MOT_COUPE.test(texteAvant) && /^\p{Ll}/u.test(texteApres);
}

function joinParts(parts) {
  let out = '';
  parts.forEach((p, i) => {
    if (i > 0 && needsSpace(parts[i - 1], p)) out += ' ';
    out += p.str;
  });
  return out.replace(/\s+/g, ' ').trim();
}

// Regroupe les items d'une page en lignes (par coordonnée Y, tolérance 3px),
// triées par X, avec jointure sensible aux écarts (voir needsSpace).
export function groupIntoLines(items) {
  const lines = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < 3);
    if (!line) { line = { y, parts: [] }; lines.push(line); }
    line.parts.push({ x: item.transform[4], y, str: item.str, size: fontSizeOf(item), width: item.width || 0 });
  }
  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => {
    const parts = [...l.parts].sort((a, b) => a.x - b.x);
    return {
      y: l.y,
      // parts exposé pour la reconstruction PDF (pdf-reconstruct.js) : dessiner
      // chaque fragment à sa position. Le chemin Markdown, lui, n'utilise que text.
      parts,
      text: joinParts(parts),
      // Taille dominante de la ligne : la plus fréquente parmi ses fragments.
      size: parts.map(p => p.size).sort((a, b) => a - b)[Math.floor(parts.length / 2)]
    };
  }).filter(l => l.text.length > 0);
}

// Regroupe les lignes d'une page en paragraphes, avec détection de titre.
function groupIntoParagraphs(lines, dominantSize) {
  const paragraphs = [];
  let current = null;
  let prevY = null, prevSize = null;
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    const isNewParagraph = isHeading || !current ||
      current.isHeading !== isHeading ||
      gap > (prevSize || line.size) * PARAGRAPH_GAP_RATIO;
    if (isNewParagraph) {
      current = { text: line.text, isHeading };
      paragraphs.push(current);
    } else if (isLineWrapHyphen(current.text, line.text)) {
      current.text = current.text.slice(0, -1) + line.text; // retire le trait d'union collé
    } else {
      current.text += ' ' + line.text;
    }
    prevY = line.y;
    prevSize = line.size;
  }
  return paragraphs;
}

export function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] || 11;
}

// Détection de mise en page à 2 colonnes (fréquent sur les CV/rapports). Sans
// elle, le regroupement par Y fusionne la colonne gauche et droite sur la même
// ligne → charabia illisible ET contexte incohérent qui sabote le NER.
// Heuristique GÉOMÉTRIQUE (donc testable sans le modèle) : on cherche une
// gouttière verticale au centre que peu d'items franchissent.
// Retourne un tableau ORDONNÉ de groupes d'items en ordre de lecture :
//  - mono-colonne → [tousLesItems] ;
//  - bi-colonne   → [bandePleineLargeur (titre), colonneGauche, colonneDroite].
// Limite assumée : ne gère que 1 ou 2 colonnes (3+ colonnes très rares).
export function splitIntoColumns(items) {
  const withGeom = items.filter(i => i.str && i.str.trim()).map(i => ({
    item: i, x: i.transform[4], w: i.width || 0
  }));
  if (withGeom.length < 8) return [items]; // trop peu pour trancher : mono-colonne

  const pageMinX = Math.min(...withGeom.map(g => g.x));
  const pageMaxX = Math.max(...withGeom.map(g => g.x + g.w));
  const pageWidth = pageMaxX - pageMinX;
  if (pageWidth <= 0) return [items];
  const gutter = pageMinX + pageWidth / 2;

  // Un item "pleine largeur" (titre, bandeau) traverse largement la gouttière :
  // on le sort des colonnes pour le garder en tête, à sa place verticale.
  const fullWidth = withGeom.filter(g => g.w >= pageWidth * 0.55);
  const columnItems = withGeom.filter(g => g.w < pageWidth * 0.55);
  const crossing = columnItems.filter(g => g.x < gutter && g.x + g.w > gutter);
  const left = columnItems.filter(g => g.x + g.w / 2 < gutter);
  const right = columnItems.filter(g => g.x + g.w / 2 >= gutter);

  // 2 colonnes seulement si la gouttière est nette (peu de franchissements) et
  // les deux côtés substantiels — sinon c'est du mono-colonne mal aligné.
  const isTwoColumn = columnItems.length >= 8 &&
    crossing.length / columnItems.length < 0.1 &&
    left.length >= 4 && right.length >= 4;

  if (!isTwoColumn) return [items];
  return [
    fullWidth.map(g => g.item),
    left.map(g => g.item),
    right.map(g => g.item)
  ].filter(group => group.length > 0);
}

// Ré-extrait tout depuis les octets bruts à chaque appel (aucun état partagé
// entre extractTextUnits et applyMask — même convention que les 3 autres
// adaptateurs). Retourne une structure ordonnée par page puis paragraphe.
async function parseStructure(buffer) {
  // pdfjs-dist détache l'ArrayBuffer sous-jacent après le parsing (transfert
  // interne) — sans copie ici, un 2e appel sur le même buffer (extractTextUnits
  // PUIS applyMask, convention stateless commune aux 4 adaptateurs) plante
  // avec "Cannot perform Construct on a detached ArrayBuffer". slice(0) donne
  // à pdfjs une copie jetable, jamais l'original du caller.
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  }).promise;

  const units = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Taille dominante calculée sur TOUTE la page (référence stable pour la
    // détection de titre), avant le découpage en colonnes.
    const allLines = groupIntoLines(textContent.items);
    if (!allLines.length) continue;
    const dominantSize = median(allLines.map(l => l.size));

    // Chaque groupe de colonnes est regroupé en lignes PUIS paragraphes
    // séparément, et concaténé dans l'ordre de lecture (bande titre, gauche,
    // droite) — jamais de fusion d'une colonne à l'autre.
    let paraIndex = 0;
    for (const columnItems of splitIntoColumns(textContent.items)) {
      const lines = groupIntoLines(columnItems);
      if (!lines.length) continue;
      for (const p of groupIntoParagraphs(lines, dominantSize)) {
        units.push({ id: `page${pageNum}#para${paraIndex++}`, text: p.text, isHeading: p.isHeading });
      }
    }
  }
  return units;
}

// { units: [{id, text}] } — le flag isHeading n'est pas exposé ici (interface
// commune aux 4 adaptateurs), applyMask le re-dérive via parseStructure.
export async function extractTextUnits(buffer) {
  const structured = await parseStructure(buffer);
  return { units: structured.map(({ id, text }) => ({ id, text })) };
}

// resultsById : Map<id, { maskedText }>. Ignore le buffer PDF d'origine pour
// la RÉÉCRITURE (jamais réutilisé comme contenant) mais le ré-analyse pour
// retrouver la structure (ordre, titres) — repli sur le texte original si une
// unité est absente de resultsById (ne devrait pas arriver en usage normal).
export async function applyMask(buffer, resultsById) {
  const structured = await parseStructure(buffer);
  return structured
    .map(u => {
      const text = resultsById.get(u.id)?.maskedText ?? u.text;
      return u.isHeading ? `## ${text}` : text;
    })
    .join('\n\n');
}

// Pas de métadonnées à nettoyer : la sortie est un texte neuf, rien du PDF
// d'origine n'est jamais transporté dedans.
export function stripMetadata(markdown) {
  return markdown;
}
