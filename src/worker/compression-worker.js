// Worker de COMPRESSION DE PROMPT (LLMLingua-2), volontairement séparé du
// worker de détection.
//
// POURQUOI UN FICHIER À PART, et pas juste un second Worker sur le même code.
// `ner-worker.js` importe `gliner` en tête de module, et cet import installe
// ONNX Runtime 1.19. Transformers.js, lui, embarque ORT 1.14. Les deux dans le
// même graphe de modules = initialisation en échec — c'est l'erreur
// « Compression indisponible » constatée à l'usage. Lancer un SECOND worker sur
// le même fichier n'y changeait rien : le thread est neuf, le graphe de modules
// est identique. Il faut un point d'entrée qui n'importe QUE Transformers.js.
//
// Ce worker ne fait que l'inférence. Le découpage, le recollage des scores et
// la décision de conservation vivent dans src/engine/compression.js, purs et
// testés.
import { pipeline, env } from '@xenova/transformers';
import { decouperEnLots, recollerScores } from '../engine/compression.js';

let compresseur = null;

// LABEL_1 = « garder ». La config du modèle n'a pas d'id2label : la
// correspondance a été établie par sonde (docs/spike-llmlingua2.md), en
// vérifiant que les mots pleins reçoivent LABEL_1 et les mots outils LABEL_0.
const pGarder = o => (o.entity === 'LABEL_1' ? o.score : 1 - o.score);

async function init({ wasmPath, model }) {
  if (compresseur) return;
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.backends.onnx.wasm.wasmPaths = wasmPath;
  // Multi-thread seulement si la page est isolée (SharedArrayBuffer) — jamais
  // garanti pour une page d'extension. Repli à 1, comme le moteur BERT.
  env.backends.onnx.wasm.numThreads = self.crossOriginIsolated
    ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
    : 1;
  compresseur = await pipeline('token-classification', model, { quantized: true });
}

// Rend le flux COMPLET de tokens scorés attendu par le moteur.
//
// Deux pièges silencieux, tous deux mesurés au spike, tous deux produisant une
// ABSENCE de compression sans lever d'erreur :
//   - le modèle plafonne à 512 POSITIONS, pas 512 mots → lots de 120 ;
//   - le pipeline OMET des tokens de sa sortie (le champ `index` saute) → on
//     retokenise soi-même et on recolle par index.
// Les deux gardes vivent dans le moteur, testées ; ici on ne fait que les
// appeler — les dupliquer rejouerait la divergence P1bis.
async function tokensDe(texte) {
  const mots = String(texte || '').split(/\s+/).filter(Boolean);
  const flux = [];
  for (const lot of decouperEnLots(mots)) {
    const morceau = lot.join(' ');
    const enc = await compresseur.tokenizer(morceau);
    const tous = compresseur.tokenizer.model.convert_ids_to_tokens(
      Array.from(enc.input_ids.data, Number));
    const sorties = (await compresseur(morceau)).map(o => ({
      index: o.index, garder: pGarder(o)
    }));
    flux.push(...recollerScores(tous, sorties));
  }
  return flux;
}

self.addEventListener('message', async ev => {
  const msg = ev.data;
  if (!msg) return;

  if (msg.type === 'initCompression') {
    try {
      await init(msg);
      self.postMessage({ type: 'compressionReady' });
    } catch (err) {
      // Échec signalé, jamais silencieux : l'appelant décoche l'option et le
      // DIT. Une compression qui ne s'applique pas sans prévenir laisserait
      // croire à un gain inexistant.
      self.postMessage({ type: 'error', message: String(err?.message || err) });
    }
    return;
  }

  if (msg.type === 'compress') {
    try {
      if (!compresseur) throw new Error('modèle de compression non chargé');
      self.postMessage({ type: 'result', id: msg.id, flux: await tokensDe(msg.text) });
    } catch (err) {
      self.postMessage({ type: 'error', id: msg.id, message: String(err?.message || err) });
    }
  }
});
