// Reconstruction PDF anonymisé, avec préservation des images (Stage B) —
// alternative à la sortie Markdown de pdf-adapter.js quand l'utilisateur veut
// GARDER le contenu visuel plutôt qu'alléger les tokens.
//
// SÉCURITÉ (raison d'être de l'approche) : on NE caviarde PAS le PDF d'origine
// (un rectangle noir laisse le texte extractable en dessous = fuite). On
// reconstruit des pages NEUVES → aucun texte d'origine ne subsiste, seul le
// texte anonymisé est écrit. Contrepartie assumée : fidélité visuelle dégradée
// (police unique Helvetica, positions par fragment, pas de kerning fin).
//
// pdf-lib est injecté (deps) — comme DOMParser pour DOCX — pour rester testable
// en Node. Le ré-encodage canvas des images (Stage B) est navigateur-only.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { groupIntoLines, splitIntoColumns, median, PARAGRAPH_GAP_RATIO, HEADING_SIZE_RATIO } from './pdf-adapter.js';
import { joinRuns, distributeEntitiesOverRuns } from './text-units.js';
import { anonymizeUnits } from './anonymize-units.js';

if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.mjs');
}

// StandardFonts.Helvetica encode WinAnsi/CP1252 — le français passe quasi tout,
// mais quelques caractères typographiques feraient planter drawText. On les
// normalise (guillemets courbes, tiret cadratin, points de suspension) et on
// remplace le reste hors-Latin1 par '?' plutôt que de laisser une exception
// interrompre toute la page.
function sanitizeForWinAnsi(str) {
  return str
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?');
}

// Regroupe les lignes en paragraphes EN CONSERVANT leurs fragments (parts),
// contrairement à groupIntoParagraphs de pdf-adapter qui ne garde que le texte.
// Un paragraphe = une unité de détection ; ses parts = les "runs" à redessiner.
function paragraphsWithParts(lines, dominantSize) {
  const paragraphs = [];
  let current = null, prevY = null, prevSize = null;
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    const isNew = isHeading || !current || current.isHeading !== isHeading ||
      gap > (prevSize || line.size) * PARAGRAPH_GAP_RATIO;
    if (isNew) { current = { isHeading, lines: [line] }; paragraphs.push(current); }
    else current.lines.push(line);
    prevY = line.y; prevSize = line.size;
  }
  return paragraphs;
}

// Un paragraphe → { id, text, runs }. runs alternent fragments dessinables
// (avec géométrie x/y/size) et séparateurs ' ' non dessinés, de sorte que
// joinRuns(runs).text === le texte donné à la détection : les offsets des
// entités retombent exactement sur les bons fragments (distributeEntitiesOverRuns).
function paragraphToRuns(para, id) {
  const runs = [];
  let n = 0;
  para.lines.forEach((line, li) => {
    line.parts.forEach((p, pi) => {
      if (li > 0 && pi === 0) runs.push({ id: `s${n++}`, text: ' ', draw: false });
      else if (pi > 0) runs.push({ id: `s${n++}`, text: ' ', draw: false });
      runs.push({ id: `r${n++}`, text: p.str, draw: true, x: p.x, y: p.y, size: p.size });
    });
  });
  return { id, text: joinRuns(runs).text, runs };
}

// Multiplication de deux matrices affines 2D [a,b,c,d,e,f].
function matMul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}

// Position/taille de chaque image via interprétation de la matrice de
// transformation courante (CTM) sur la liste d'opérateurs — validé au spike.
// Une image occupe le carré unité [0,1]² transformé par le CTM au moment du
// paint. Défensif : toute image problématique est simplement ignorée (les
// images sont un bonus, la sécurité tient sur le TEXTE reconstruit).
async function extractImages(page) {
  const out = [];
  let opList;
  try { opList = await page.getOperatorList(); } catch { return out; }
  const OPS = pdfjsLib.OPS;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const refs = [];
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i], args = opList.argsArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = matMul(ctm, args);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
      // min-corner + dimensions absolues : gère le retournement vertical
      // classique des images PDF (le bitmap pdfjs est déjà décodé à l'endroit).
      const x = Math.min(ctm[4], ctm[4] + ctm[0]);
      const y = Math.min(ctm[5], ctm[5] + ctm[3]);
      refs.push({ name: args[0], x, y, w: Math.abs(ctm[0]), h: Math.abs(ctm[3]) });
    }
  }
  for (const ref of refs) {
    const bitmap = await new Promise(res => {
      try { page.objs.get(ref.name, obj => res(obj || null)); } catch { res(null); }
    }).catch(() => null);
    if (bitmap && bitmap.data && bitmap.width && bitmap.height && ref.w > 1 && ref.h > 1) {
      out.push({ ...ref, bitmap });
    }
  }
  return out;
}

// Ré-encode un bitmap pdfjs (kind RGBA/RGB/gris) en PNG via canvas. NAVIGATEUR
// UNIQUEMENT (OffscreenCanvas) — comme image-adapter.js. Strippe toute
// métadonnée au passage. Retourne un ArrayBuffer PNG, ou null si indisponible.
async function bitmapToPng(bitmap) {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const { width, height, kind, data } = bitmap;
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === 3) { // RGBA_32BPP
    rgba.set(data.subarray(0, rgba.length));
  } else if (kind === 2) { // RGB_24BPP
    for (let i = 0, j = 0; i < width * height; i++) {
      rgba[j++] = data[i * 3]; rgba[j++] = data[i * 3 + 1]; rgba[j++] = data[i * 3 + 2]; rgba[j++] = 255;
    }
  } else { return null; } // 1bpp gris et autres : non gérés en v1 (rare)
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d').putImageData(new ImageData(rgba, width, height), 0, 0);
  return (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer();
}

// Ré-extrait la structure géométrique page par page (convention stateless ;
// buffer.slice(0) car pdfjs détache — cf. gotcha CLAUDE.md).
async function parsePages(buffer) {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false, isEvalSupported: false, disableFontFace: true
  }).promise;

  const pages = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const images = await extractImages(page);
    const allLines = groupIntoLines(textContent.items);
    const dominantSize = median(allLines.map(l => l.size));

    const units = [];
    let paraIdx = 0;
    for (const columnItems of splitIntoColumns(textContent.items)) {
      const lines = groupIntoLines(columnItems);
      for (const para of paragraphsWithParts(lines, dominantSize)) {
        units.push(paragraphToRuns(para, `page${pageNum}#para${paraIdx++}`));
      }
    }
    pages.push({ pageNum, width: viewport.width, height: viewport.height, units, images });
  }
  return pages;
}

// Reconstruit un PDF anonymisé. deps.PDFDocument / deps.rgb / deps.StandardFonts
// injectés (pdf-lib). Options de détection identiques aux autres formats.
// Retourne { buffer: ArrayBuffer, mapping }.
export async function reconstructPdf(buffer, opts = {}) {
  const { PDFDocument, StandardFonts } = opts.deps;
  const pages = await parsePages(buffer);

  // UNE seule passe de détection sur toutes les unités de toutes les pages
  // (placeholders cohérents inter-pages, comme les autres adaptateurs).
  const allUnits = pages.flatMap(p => p.units.map(u => ({ id: u.id, text: u.text })));
  const { results, mapping } = await anonymizeUnits(allUnits, {
    nerPipeline: opts.nerPipeline,
    maskOpts: opts.maskOpts,
    forceTerms: opts.forceTerms,
    disabledTypes: opts.disabledTypes,
    keepValues: opts.keepValues
  });
  const entitiesById = new Map(results.map(r => [r.id, r.entities || []]));

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([page.width, page.height]);

    // Images d'abord (en fond), texte par-dessus. Défensif : une image qui
    // échoue (format non géré, canvas absent en Node) est ignorée sans
    // interrompre la reconstruction du texte.
    for (const img of page.images || []) {
      try {
        const png = await bitmapToPng(img.bitmap);
        if (!png) continue;
        const embedded = await pdfDoc.embedPng(png);
        pdfPage.drawImage(embedded, { x: img.x, y: img.y, width: img.w, height: img.h });
      } catch { /* image ignorée, jamais bloquant */ }
    }

    for (const unit of page.units) {
      const masked = distributeEntitiesOverRuns(unit.runs, entitiesById.get(unit.id) || []);
      unit.runs.forEach((run, i) => {
        if (!run.draw) return;
        const text = sanitizeForWinAnsi(masked[i].text);
        if (!text) return;
        try {
          pdfPage.drawText(text, { x: run.x, y: run.y, size: run.size, font });
        } catch { /* fragment non dessinable : ignoré, jamais bloquant */ }
      });
    }
  }

  const bytes = await pdfDoc.save();
  return { buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), mapping };
}
