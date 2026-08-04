import {
  distributeEntitiesOverRuns,
  joinRuns
} from "./chunk-3WGABFPD.js";
import {
  GlobalWorkerOptions,
  HEADING_SIZE_RATIO,
  OPS,
  getDocument,
  groupIntoLines,
  isLineWrapHyphen,
  median,
  needsSpace,
  paragraphGapThreshold,
  splitIntoColumns
} from "./chunk-MN45A56O.js";
import {
  anonymizeUnits
} from "./chunk-WJQYGZYI.js";
import "./chunk-52CH5O3L.js";
import "./chunk-PIRHQTI4.js";

// src/files/pdf-reconstruct.js
if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
  GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.min.mjs");
}
function sanitizeForWinAnsi(str) {
  return str.replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"').replace(/[–—―]/g, "-").replace(/…/g, "...").replace(/ /g, " ").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}
function paragraphsWithParts(lines, dominantSize) {
  const paragraphs = [];
  let current = null, prevY = null;
  const seuilEcart = paragraphGapThreshold(lines, dominantSize);
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    const isNew = isHeading || !current || current.isHeading !== isHeading || gap > seuilEcart;
    if (isNew) {
      current = { isHeading, lines: [line] };
      paragraphs.push(current);
    } else current.lines.push(line);
    prevY = line.y;
  }
  return paragraphs;
}
function paragraphToRuns(para, id) {
  const runs = [];
  let n = 0;
  para.lines.forEach((line, li) => {
    line.parts.forEach((p, pi) => {
      if (li > 0 && pi === 0) {
        const precedent = runs[runs.length - 1];
        if (precedent && isLineWrapHyphen(precedent.text, p.str)) {
          precedent.text = precedent.text.slice(0, -1);
        } else {
          runs.push({ id: `s${n++}`, text: " ", draw: false });
        }
      } else if (pi > 0 && needsSpace(line.parts[pi - 1], p)) runs.push({ id: `s${n++}`, text: " ", draw: false });
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
    const bitmap = await Promise.race([
      new Promise((res) => {
        try {
          page.objs.get(ref.name, (obj) => res(obj || null));
        } catch {
          res(null);
        }
      }),
      new Promise((res) => setTimeout(() => res(null), 8e3))
    ]).catch(() => null);
    if (bitmap && (bitmap.data || bitmap.bitmap) && bitmap.width && bitmap.height && ref.w > 1 && ref.h > 1) {
      out.push({ ...ref, bitmap });
    }
  }
  return out;
}
var MAX_IMG_DIM = 1600;
function rawToRgba({ width, height, kind, data }) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === 3) rgba.set(data.subarray(0, rgba.length));
  else if (kind === 2) {
    for (let i = 0, j = 0; i < width * height; i++) {
      rgba[j++] = data[i * 3];
      rgba[j++] = data[i * 3 + 1];
      rgba[j++] = data[i * 3 + 2];
      rgba[j++] = 255;
    }
  } else return null;
  return rgba;
}
async function encodeImage(img) {
  if (typeof OffscreenCanvas === "undefined") return null;
  const srcW = img.width, srcH = img.height;
  if (!srcW || !srcH) return null;
  const scale = Math.min(1, MAX_IMG_DIM / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0, w, h);
  } else {
    const rgba = rawToRgba(img);
    if (!rgba) return null;
    const src = new OffscreenCanvas(srcW, srcH);
    src.getContext("2d").putImageData(new ImageData(rgba, srcW, srcH), 0, 0);
    ctx.drawImage(src, 0, 0, w, h);
  }
  const useJpeg = w * h > 128 * 128;
  const blob = await canvas.convertToBlob(useJpeg ? { type: "image/jpeg", quality: 0.82 } : { type: "image/png" });
  return { bytes: await blob.arrayBuffer(), jpeg: useJpeg };
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
    nerDetect: opts.nerDetect,
    onProgress: opts.onProgress,
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
    const encoded = await Promise.all((page.images || []).map(async (img) => {
      try {
        return { img, enc: await encodeImage(img.bitmap) };
      } catch {
        return { img, enc: null };
      }
    }));
    for (const { img, enc } of encoded) {
      if (!enc) continue;
      try {
        const embedded = enc.jpeg ? await pdfDoc.embedJpg(enc.bytes) : await pdfDoc.embedPng(enc.bytes);
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
