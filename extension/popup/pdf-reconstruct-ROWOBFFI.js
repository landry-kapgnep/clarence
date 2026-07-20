import {
  distributeEntitiesOverRuns,
  joinRuns
} from "./chunk-3WGABFPD.js";
import {
  GlobalWorkerOptions,
  HEADING_SIZE_RATIO,
  OPS,
  PARAGRAPH_GAP_RATIO,
  getDocument,
  groupIntoLines,
  median,
  splitIntoColumns
} from "./chunk-Q2XSYSNP.js";
import {
  anonymizeUnits
} from "./chunk-UUTHDNLH.js";
import "./chunk-KNKQTNVF.js";
import "./chunk-TRTQSARU.js";

// src/files/pdf-reconstruct.js
if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
  GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.min.mjs");
}
function sanitizeForWinAnsi(str) {
  return str.replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"').replace(/[–—―]/g, "-").replace(/…/g, "...").replace(/ /g, " ").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}
function paragraphsWithParts(lines, dominantSize) {
  const paragraphs = [];
  let current = null, prevY = null, prevSize = null;
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    const isNew = isHeading || !current || current.isHeading !== isHeading || gap > (prevSize || line.size) * PARAGRAPH_GAP_RATIO;
    if (isNew) {
      current = { isHeading, lines: [line] };
      paragraphs.push(current);
    } else current.lines.push(line);
    prevY = line.y;
    prevSize = line.size;
  }
  return paragraphs;
}
function paragraphToRuns(para, id) {
  const runs = [];
  let n = 0;
  para.lines.forEach((line, li) => {
    line.parts.forEach((p, pi) => {
      if (li > 0 && pi === 0) runs.push({ id: `s${n++}`, text: " ", draw: false });
      else if (pi > 0) runs.push({ id: `s${n++}`, text: " ", draw: false });
      runs.push({ id: `r${n++}`, text: p.str, draw: true, x: p.x, y: p.y, size: p.size });
    });
  });
  return { id, text: joinRuns(runs).text, runs };
}
function matMul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}
async function extractImages(page) {
  const out = [];
  let opList;
  try {
    opList = await page.getOperatorList();
  } catch {
    return out;
  }
  const OPS2 = OPS;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const refs = [];
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i], args = opList.argsArray[i];
    if (fn === OPS2.save) stack.push(ctm.slice());
    else if (fn === OPS2.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS2.transform) ctm = matMul(ctm, args);
    else if (fn === OPS2.paintImageXObject || fn === OPS2.paintJpegXObject) {
      const x = Math.min(ctm[4], ctm[4] + ctm[0]);
      const y = Math.min(ctm[5], ctm[5] + ctm[3]);
      refs.push({ name: args[0], x, y, w: Math.abs(ctm[0]), h: Math.abs(ctm[3]) });
    }
  }
  for (const ref of refs) {
    const bitmap = await new Promise((res) => {
      try {
        page.objs.get(ref.name, (obj) => res(obj || null));
      } catch {
        res(null);
      }
    }).catch(() => null);
    if (bitmap && bitmap.data && bitmap.width && bitmap.height && ref.w > 1 && ref.h > 1) {
      out.push({ ...ref, bitmap });
    }
  }
  return out;
}
async function bitmapToPng(bitmap) {
  if (typeof OffscreenCanvas === "undefined") return null;
  const { width, height, kind, data } = bitmap;
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === 3) {
    rgba.set(data.subarray(0, rgba.length));
  } else if (kind === 2) {
    for (let i = 0, j = 0; i < width * height; i++) {
      rgba[j++] = data[i * 3];
      rgba[j++] = data[i * 3 + 1];
      rgba[j++] = data[i * 3 + 2];
      rgba[j++] = 255;
    }
  } else {
    return null;
  }
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
  return (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer();
}
async function parsePages(buffer) {
  const pdf = await getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  }).promise;
  const pages = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const images = await extractImages(page);
    const allLines = groupIntoLines(textContent.items);
    const dominantSize = median(allLines.map((l) => l.size));
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
async function reconstructPdf(buffer, opts = {}) {
  const { PDFDocument, StandardFonts } = opts.deps;
  const pages = await parsePages(buffer);
  const allUnits = pages.flatMap((p) => p.units.map((u) => ({ id: u.id, text: u.text })));
  const { results, mapping } = await anonymizeUnits(allUnits, {
    nerPipeline: opts.nerPipeline,
    maskOpts: opts.maskOpts,
    forceTerms: opts.forceTerms,
    disabledTypes: opts.disabledTypes,
    keepValues: opts.keepValues
  });
  const entitiesById = new Map(results.map((r) => [r.id, r.entities || []]));
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (const page of pages) {
    const pdfPage = pdfDoc.addPage([page.width, page.height]);
    for (const img of page.images || []) {
      try {
        const png = await bitmapToPng(img.bitmap);
        if (!png) continue;
        const embedded = await pdfDoc.embedPng(png);
        pdfPage.drawImage(embedded, { x: img.x, y: img.y, width: img.w, height: img.h });
      } catch {
      }
    }
    for (const unit of page.units) {
      const masked = distributeEntitiesOverRuns(unit.runs, entitiesById.get(unit.id) || []);
      unit.runs.forEach((run, i) => {
        if (!run.draw) return;
        const text = sanitizeForWinAnsi(masked[i].text);
        if (!text) return;
        try {
          pdfPage.drawText(text, { x: run.x, y: run.y, size: run.size, font });
        } catch {
        }
      });
    }
  }
  const bytes = await pdfDoc.save();
  return { buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), mapping };
}
export {
  reconstructPdf
};
