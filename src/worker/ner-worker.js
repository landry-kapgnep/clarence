// Worker NER : fait tourner le modèle BERT HORS du thread principal.
//
// Pourquoi : le NER coûte ~1,5 s par inférence et il en faut une douzaine sur
// un document réel. Sur le thread principal, l'UI gèle — au point que les
// menus dépliés voyaient leur contenu coupé (la hauteur du panneau est
// annoncée par ResizeObserver → postMessage, qui ne partait qu'une fois le
// thread libéré) et que l'utilisateur croyait à un plantage.
//
// MV3 autorise bien un worker packagé dans l'extension (CSP `script-src
// 'self'`) : c'est déjà ce qu'on fait pour pdf.worker.min.mjs.
//
// Protocole : { type:'init', wasmPath, model } → { type:'ready' | 'error' }
//             { type:'run', id, text }         → { type:'result', id, tokens }
//                                              → { type:'error', id, message }
// Ne renvoie QUE les tokens bruts du modèle : tout le découpage en fenêtres,
// la reconstruction WordPiece et le masquage restent dans src/engine (testés).
import { pipeline, env } from '@xenova/transformers';

let pipe = null;

async function init({ wasmPath, model }) {
  // Config identique à l'ancienne version côté popup. wasmPath est TRANSMIS
  // par le thread principal : on ne dépend pas de chrome.* dans le worker
  // (disponibilité non garantie selon le contexte).
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.backends.onnx.wasm.wasmPaths = wasmPath;
  // Le WASM multi-thread exige SharedArrayBuffer, donc une page isolée
  // (crossOriginIsolated) — pas garanti pour une page d'extension. Test au
  // runtime avec repli à 1 : jamais de plantage, gain si disponible.
  env.backends.onnx.wasm.numThreads = self.crossOriginIsolated
    ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
    : 1;

  pipe = await pipeline('token-classification', model);
}

self.addEventListener('message', async ev => {
  const msg = ev.data;
  if (!msg) return;

  if (msg.type === 'init') {
    try {
      await init(msg);
      self.postMessage({ type: 'ready', threads: env.backends.onnx.wasm.numThreads });
    } catch (err) {
      // Échec signalé, jamais silencieux : la popup retombe sur le regex seul
      // avec un message explicite (principe anti-fausse-confiance).
      self.postMessage({ type: 'error', message: String(err?.message || err) });
    }
    return;
  }

  if (msg.type === 'run') {
    try {
      if (!pipe) throw new Error('modèle non chargé');
      self.postMessage({ type: 'result', id: msg.id, tokens: await pipe(msg.text) });
    } catch (err) {
      self.postMessage({ type: 'error', id: msg.id, message: String(err?.message || err) });
    }
  }
});
