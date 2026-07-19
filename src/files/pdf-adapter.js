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
const PARAGRAPH_GAP_RATIO = 1.6;
// Une ligne dont la police dépasse ce ratio par rapport à la taille
// dominante de la page est traitée comme un titre (heuristique best-effort,
// jamais bloquante si elle se trompe).
const HEADING_SIZE_RATIO = 1.3;

function fontSizeOf(item) {
  // item.transform = [a,b,c,d,e,f] ; pour du texte non pivoté, |d| donne la
  // taille de police effective. item.height (si fourni par pdfjs) est déjà
  // ce calcul fait pour nous — préféré quand disponible.
  return item.height || Math.abs(item.transform?.[3]) || 1;
}

// Regroupe les items d'une page en lignes (par coordonnée Y, tolérance 3px),
// triées par X. Un espace est TOUJOURS inséré entre deux items distincts sur
// une même ligne : une ligne accolée en trop est cosmétique, un mot collé
// risquerait de fusionner deux valeurs sensibles ou d'en manquer une —
// priorité zéro-fuite, comme pour les IBAN/NIR à structure valide (regex-detect.js).
function groupIntoLines(items) {
  const lines = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < 3);
    if (!line) { line = { y, parts: [] }; lines.push(line); }
    line.parts.push({ x: item.transform[4], str: item.str, size: fontSizeOf(item) });
  }
  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => {
    const parts = [...l.parts].sort((a, b) => a.x - b.x);
    return {
      y: l.y,
      text: parts.map(p => p.str).join(' ').replace(/\s+/g, ' ').trim(),
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
    } else {
      current.text += ' ' + line.text;
    }
    prevY = line.y;
    prevSize = line.size;
  }
  return paragraphs;
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] || 11;
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
    const lines = groupIntoLines(textContent.items);
    if (!lines.length) continue;
    const dominantSize = median(lines.map(l => l.size));
    const paragraphs = groupIntoParagraphs(lines, dominantSize);
    paragraphs.forEach((p, i) => {
      units.push({ id: `page${pageNum}#para${i}`, text: p.text, isHeading: p.isHeading });
    });
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
