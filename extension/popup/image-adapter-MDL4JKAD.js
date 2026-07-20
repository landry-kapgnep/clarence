import "./chunk-TRTQSARU.js";

// src/files/image-adapter.js
async function stripMetadata(buffer, opts = {}) {
  const mime = opts.mime === "image/jpeg" || opts.mime === "image/jpg" ? "image/jpeg" : "image/png";
  const blob = new Blob([buffer], { type: mime });
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const outBlob = mime === "image/jpeg" ? await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 }) : await canvas.convertToBlob({ type: "image/png" });
  return outBlob.arrayBuffer();
}
async function extractTextUnits() {
  return { units: [] };
}
async function applyMask(buffer) {
  return buffer;
}
export {
  applyMask,
  extractTextUnits,
  stripMetadata
};
