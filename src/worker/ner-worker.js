// Worker de détection contextuelle : fait tourner le modèle HORS du thread
// principal. Deux moteurs interchangeables derrière le MÊME protocole.
//
// Pourquoi hors du thread principal : sur le thread principal l'UI gèle — au
// point que les menus dépliés voyaient leur contenu coupé (la hauteur du
// panneau est annoncée par ResizeObserver → postMessage, qui ne partait
// qu'une fois le thread libéré) et que l'utilisateur croyait à un plantage.
//
// MV3 autorise bien un worker packagé dans l'extension (CSP `script-src
// 'self'`) : c'est déjà ce qu'on fait pour pdf.worker.min.mjs.
//
// Protocole :
//   { type:'init', engine:'gliner'|'bert', wasmPath, model, modelUrl }
//        → { type:'ready', engine } | { type:'error', message }
//        → { type:'progress', loaded, total }   (téléchargement du modèle)
//   { type:'run', id, text, labels }
//        → { type:'result', id, spans }   (gliner : spans décodés)
//        → { type:'result', id, tokens }  (bert : tokens bruts)
//        → { type:'error', id, message }
//
// Le worker ne fait QUE l'inférence : le fenêtrage, la reconstruction et le
// masquage restent dans src/engine (purs et testés).
import { pipeline, env } from '@xenova/transformers';
import { Gliner } from 'gliner';

let moteur = null;
let pipe = null;    // pipeline BERT (token-classification)
let gliner = null;  // instance GLiNER

// Le découpeur de mots de GLiNER.js utilise /\w+(?:[-_]\w+)*|\S/g. En
// JavaScript, \w ne couvre PAS les caractères accentués : « réunion » est
// découpé en r + é + union, « Associés » en Associ + é + s. Conséquences
// mesurées sur nos fixtures : faux positif « union » sur le garde-fou, nom
// d'entreprise tronqué, et surtout des entités PURENENT ET SIMPLEMENT RATÉES
// (« Lefèvre Consulting » invisible avant correction, 0,90 après).
// La lib est donc structurellement dégradée sur le français — bug jamais vu en
// amont parce qu'elle est testée en anglais.
const DECOUPEUR_UNICODE = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

const CACHE_MODELES = 'clarence-models';

// Le modèle GLiNER est chargé par ORT, qui n'utilise PAS le cache de
// Transformers.js : sans ça, 183 Mo seraient re-téléchargés à chaque ouverture
// de la popup. On gère donc le cache nous-mêmes (Cache API), et on passe le
// modèle en mémoire — `modelPath` accepte un Uint8Array.
async function chargerModele(url) {
  const cache = await caches.open(CACHE_MODELES);
  const enCache = await cache.match(url);
  if (enCache) return new Uint8Array(await enCache.arrayBuffer());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`téléchargement du modèle : HTTP ${res.status}`);

  // Progression : 183 Mo au premier usage, l'utilisateur doit voir que ça avance.
  const total = Number(res.headers.get('content-length')) || 0;
  if (total && res.body) {
    const morceaux = [];
    let recu = 0;
    const lecteur = res.body.getReader();
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      morceaux.push(value);
      recu += value.length;
      self.postMessage({ type: 'progress', loaded: recu, total });
    }
    const octets = new Uint8Array(recu);
    let pos = 0;
    for (const m of morceaux) { octets.set(m, pos); pos += m.length; }
    await cache.put(url, new Response(octets, { headers: { 'content-length': String(recu) } }));
    return octets;
  }

  const buf = await res.arrayBuffer();
  await cache.put(url, new Response(buf));
  return new Uint8Array(buf);
}

async function initGliner({ wasmPath, model, modelUrl }) {
  const instance = new Gliner({
    tokenizerPath: model,
    onnxSettings: {
      modelPath: await chargerModele(modelUrl),
      executionProvider: 'wasm',
      // JAMAIS le CDN par défaut de la lib : MV3 interdit le code distant.
      wasmPaths: wasmPath,
      // Mesuré : le multi-thread n'apporte rien (923 ms contre 927 ms sur une
      // fenêtre de 1000 c.), et une popup n'est de toute façon jamais
      // crossOriginIsolated. On ne s'embarrasse pas de SharedArrayBuffer.
      multiThread: false
    },
    transformersSettings: { allowLocalModels: false, useBrowserCache: true },
    // Imposés par gliner_config.json du checkpoint : span_mode "markerV0",
    // max_width 12. Le mode 'token-level' de la lib est listé comme TODO dans
    // son propre README tout en s'acceptant silencieusement — ne pas l'utiliser.
    modelType: 'span-level',
    maxWidth: 12
  });
  await instance.initialize();

  // Correction du découpeur. Si la structure interne de la lib change à une
  // mise à jour, on ÉCHOUE FORT plutôt que de tourner avec le découpeur cassé :
  // une détection FR silencieusement dégradée serait une fuite invisible.
  // L'échec déclenche le repli sur BERT côté popup.
  const decoupeur = instance?.model?.processor?.wordsSplitter;
  if (!decoupeur || !(decoupeur.whitespacePattern instanceof RegExp)) {
    throw new Error('GLiNER.js : découpeur de mots introuvable, correction accents impossible');
  }
  decoupeur.whitespacePattern = DECOUPEUR_UNICODE;

  gliner = instance;
}

async function initBert({ wasmPath, model }) {
  env.backends.onnx.wasm.wasmPaths = wasmPath;
  // Le WASM multi-thread exige SharedArrayBuffer, donc une page isolée
  // (crossOriginIsolated) — pas garanti pour une page d'extension. Test au
  // runtime avec repli à 1 : jamais de plantage, gain si disponible.
  env.backends.onnx.wasm.numThreads = self.crossOriginIsolated
    ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
    : 1;
  pipe = await pipeline('token-classification', model);
}

async function init(msg) {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  if (msg.engine === 'gliner') await initGliner(msg);
  else await initBert(msg);
  moteur = msg.engine === 'gliner' ? 'gliner' : 'bert';
}

self.addEventListener('message', async ev => {
  const msg = ev.data;
  if (!msg) return;

  if (msg.type === 'init') {
    try {
      await init(msg);
      self.postMessage({ type: 'ready', engine: moteur });
    } catch (err) {
      // Échec signalé, jamais silencieux : la popup replie sur l'autre moteur,
      // et si les deux échouent elle le dit (principe anti-fausse-confiance).
      self.postMessage({ type: 'error', message: String(err?.message || err) });
    }
    return;
  }

  if (msg.type === 'run') {
    try {
      if (moteur === 'gliner') {
        if (!gliner) throw new Error('modèle non chargé');
        // Seuil bas ici : le filtrage fin appartient au moteur pur
        // (GLINER_THRESHOLD dans src/engine/gliner.js), pas au worker.
        const res = await gliner.inference({
          texts: [msg.text],
          entities: msg.labels,
          threshold: 0.05,
          flatNer: false
        });
        self.postMessage({ type: 'result', id: msg.id, spans: res[0] || [] });
      } else {
        if (!pipe) throw new Error('modèle non chargé');
        self.postMessage({ type: 'result', id: msg.id, tokens: await pipe(msg.text) });
      }
    } catch (err) {
      self.postMessage({ type: 'error', id: msg.id, message: String(err?.message || err) });
    }
  }
});
