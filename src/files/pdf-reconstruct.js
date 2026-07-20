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
    pages.push({ pageNum, width: viewport.width, height: viewport.height, units });
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
