import {
  env,
  pipeline
} from "./chunk-SU3B537L.js";
import {
  decouperEnLots,
  recollerScores
} from "./chunk-YCFOBLJG.js";
import "./chunk-PIRHQTI4.js";

// src/worker/compression-worker.js
var compresseur = null;
var pGarder = (o) => o.entity === "LABEL_1" ? o.score : 1 - o.score;
async function init({ wasmPath, model }) {
  if (compresseur) return;
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.backends.onnx.wasm.wasmPaths = wasmPath;
  env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1)) : 1;
  compresseur = await pipeline("token-classification", model, { quantized: true });
}
async function tokensDe(texte) {
  const mots = String(texte || "").split(/\s+/).filter(Boolean);
  const flux = [];
  for (const lot of decouperEnLots(mots)) {
    const morceau = lot.join(" ");
    const enc = await compresseur.tokenizer(morceau);
    const tous = compresseur.tokenizer.model.convert_ids_to_tokens(
      Array.from(enc.input_ids.data, Number)
    );
    const sorties = (await compresseur(morceau)).map((o) => ({
      index: o.index,
      garder: pGarder(o)
    }));
    flux.push(...recollerScores(tous, sorties));
  }
  return flux;
}
self.addEventListener("message", async (ev) => {
  const msg = ev.data;
  if (!msg) return;
  if (msg.type === "initCompression") {
    try {
      await init(msg);
      self.postMessage({ type: "compressionReady" });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err?.message || err) });
    }
    return;
  }
  if (msg.type === "compress") {
    try {
      if (!compresseur) throw new Error("mod\xE8le de compression non charg\xE9");
      self.postMessage({ type: "result", id: msg.id, flux: await tokensDe(msg.text) });
    } catch (err) {
      self.postMessage({ type: "error", id: msg.id, message: String(err?.message || err) });
    }
  }
});
