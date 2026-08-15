import {
  GlobalWorkerOptions,
  getDocument
} from "./chunk-GQJ4YNB7.js";

// src/files/pdf-adapter.js
function configurerPdfjs() {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return;
  GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.min.mjs");
  GlobalWorkerOptions.standardFontDataUrl = chrome.runtime.getURL("vendor/standard_fonts/");
}
configurerPdfjs();
var PARAGRAPH_GAP_RATIO = 1.6;
var MIN_ECARTS_CALIBRAGE = 8;
var ECART_PARAGRAPHE_RATIO = 1.3;
var HEADING_SIZE_RATIO = 1.3;
function fontSizeOf(item) {
  return item.height || Math.abs(item.transform?.[3]) || 1;
}
function needsSpace(a, b) {
  const gap = b.x - (a.x + (a.width || 0));
  return gap > Math.max(1, (a.size || 10) * 0.2);
}
var FIN_DE_MOT_COUPE = new RegExp("\\p{L}-$", "u");
function isLineWrapHyphen(texteAvant, texteApres) {
  return FIN_DE_MOT_COUPE.test(texteAvant) && new RegExp("^\\p{Ll}", "u").test(texteApres);
}
function joinParts(parts) {
  let out = "";
  parts.forEach((p, i) => {
    if (i > 0 && needsSpace(parts[i - 1], p)) out += " ";
    out += p.str;
  });
  return out.replace(/\s+/g, " ").trim();
}
function groupIntoLines(items) {
  const lines = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform[5];
    let line = lines.find((l) => Math.abs(l.y - y) < 3);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x: item.transform[4], y, str: item.str, size: fontSizeOf(item), width: item.width || 0 });
  }
  lines.sort((a, b) => b.y - a.y);
  return lines.map((l) => {
    const parts = [...l.parts].sort((a, b) => a.x - b.x);
    return {
      y: l.y,
      // parts exposé pour la reconstruction PDF (pdf-reconstruct.js) : dessiner
      // chaque fragment à sa position. Le chemin Markdown, lui, n'utilise que text.
      parts,
      text: joinParts(parts),
      // Taille dominante de la ligne : la plus fréquente parmi ses fragments.
      size: parts.map((p) => p.size).sort((a, b) => a - b)[Math.floor(parts.length / 2)]
    };
  }).filter((l) => l.text.length > 0);
}
function groupIntoParagraphs(lines, dominantSize) {
  const paragraphs = [];
  let current = null;
  let prevY = null;
  const seuilEcart = paragraphGapThreshold(lines, dominantSize);
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    const isNewParagraph = isHeading || !current || current.isHeading !== isHeading || gap > seuilEcart;
    if (isNewParagraph) {
      current = { text: line.text, isHeading };
      paragraphs.push(current);
    } else if (isLineWrapHyphen(current.text, line.text)) {
      current.text = current.text.slice(0, -1) + line.text;
    } else {
      current.text += " " + line.text;
    }
    prevY = line.y;
  }
  return paragraphs;
}
function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] || 11;
}
function paragraphGapThreshold(lines, dominantSize) {
  const repli = dominantSize * PARAGRAPH_GAP_RATIO;
  const ecarts = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].y - lines[i].y;
    if (gap > 0) ecarts.push(gap);
  }
  if (ecarts.length < MIN_ECARTS_CALIBRAGE) return repli;
  return Math.max(median(ecarts) * ECART_PARAGRAPHE_RATIO, repli);
}
function splitIntoColumns(items) {
  const withGeom = items.filter((i) => i.str && i.str.trim()).map((i) => ({
    item: i,
    x: i.transform[4],
    w: i.width || 0
  }));
  if (withGeom.length < 8) return [items];
  const pageMinX = Math.min(...withGeom.map((g) => g.x));
  const pageMaxX = Math.max(...withGeom.map((g) => g.x + g.w));
  const pageWidth = pageMaxX - pageMinX;
  if (pageWidth <= 0) return [items];
  const gutter = pageMinX + pageWidth / 2;
  const fullWidth = withGeom.filter((g) => g.w >= pageWidth * 0.55);
  const columnItems = withGeom.filter((g) => g.w < pageWidth * 0.55);
  const crossing = columnItems.filter((g) => g.x < gutter && g.x + g.w > gutter);
  const left = columnItems.filter((g) => g.x + g.w / 2 < gutter);
  const right = columnItems.filter((g) => g.x + g.w / 2 >= gutter);
  const isTwoColumn = columnItems.length >= 8 && crossing.length / columnItems.length < 0.1 && left.length >= 4 && right.length >= 4;
  if (!isTwoColumn) return [items];
  return [
    fullWidth.map((g) => g.item),
    left.map((g) => g.item),
    right.map((g) => g.item)
  ].filter((group) => group.length > 0);
}
async function parseStructure(buffer) {
  const pdf = await getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  }).promise;
  const units = [];
  const intitules = /* @__PURE__ */ new Set();
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const allLines = groupIntoLines(textContent.items);
    if (!allLines.length) continue;
    const dominantSize = median(allLines.map((l) => l.size));
    let paraIndex = 0;
    for (const columnItems of splitIntoColumns(textContent.items)) {
      const lines = groupIntoLines(columnItems);
      if (!lines.length) continue;
      releverIntitules(lines, dominantSize, intitules);
      for (const p of groupIntoParagraphs(lines, dominantSize)) {
        units.push({ id: `page${pageNum}#para${paraIndex++}`, text: p.text, isHeading: p.isHeading });
      }
    }
  }
  units.intitules = intitulesRetenus(intitules);
  return units;
}
var PONCTUATION_PHRASE = /[.!?,;:]/;
var NUMERO_DE_RUBRIQUE = /\s+\d{1,2}$/;
function ressembleAUnIntitule(texte) {
  const t = (texte || "").trim();
  if (!t || PONCTUATION_PHRASE.test(t)) return false;
  if (t.split(/\s+/).length > 3) return false;
  if (!new RegExp("\\p{L}", "u").test(t)) return false;
  if (/\d/.test(t.replace(NUMERO_DE_RUBRIQUE, ""))) return false;
  return t === t.toUpperCase();
}
var RUBRIQUE_TITRE = new RegExp("^(\\p{Lu}{3,})(\\s+\\d{1,2})?\\s*[\u2014\u2013-]\\s+\\p{L}", "u");
function formesDeRubrique(texte) {
  const m = RUBRIQUE_TITRE.exec((texte || "").trim());
  if (!m) return [];
  return m[2] ? [m[1], `${m[1]}${m[2]}`] : [m[1]];
}
function releverIntitules(lines, dominantSize, dans = /* @__PURE__ */ new Set()) {
  for (const l of lines) {
    const titre = l.size >= dominantSize * HEADING_SIZE_RATIO;
    if (!titre) {
      if (ressembleAUnIntitule(l.text)) dans.add(l.text.trim());
      continue;
    }
    for (const forme of formesDeRubrique(l.text)) dans.add(forme);
  }
  return dans;
}
function intitulesRetenus(candidats) {
  return candidats.size >= 2 ? [...candidats] : [];
}
function marquerIntitules(units) {
  const candidats = units.filter((u) => !u.isHeading && ressembleAUnIntitule(u.text));
  if (candidats.length < 2) return units;
  for (const u of candidats) u.structurel = true;
  return units;
}
async function extractTextUnits(buffer) {
  const structured = await parseStructure(buffer);
  marquerIntitules(structured);
  return {
    units: structured.map(({ id, text, structurel }) => ({ id, text, structurel })),
    // Transmis à anonymizeUnits : permet d'écarter un intitulé même quand le
    // regroupement l'a noyé dans un paragraphe plus long.
    intitules: structured.intitules || []
  };
}
async function applyMask(buffer, resultsById) {
  const structured = await parseStructure(buffer);
  return structured.map((u) => {
    const text = resultsById.get(u.id)?.maskedText ?? u.text;
    return u.isHeading ? `## ${text}` : text;
  }).join("\n\n");
}
function stripMetadata(markdown) {
  return markdown;
}

export {
  configurerPdfjs,
  PARAGRAPH_GAP_RATIO,
  HEADING_SIZE_RATIO,
  needsSpace,
  isLineWrapHyphen,
  groupIntoLines,
  median,
  paragraphGapThreshold,
  splitIntoColumns,
  ressembleAUnIntitule,
  formesDeRubrique,
  releverIntitules,
  intitulesRetenus,
  marquerIntitules,
  extractTextUnits,
  applyMask,
  stripMetadata
};
