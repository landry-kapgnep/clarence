// Build de l'extension : bundle la popup (moteur + Transformers.js en local,
// exigence MV3 : aucun code distant) et copie les runtimes WASM en vendor/.
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

// Nettoyage des sorties JS précédentes : les chunks du code-splitting ont des
// noms hashés qui changent à chaque build ; sans ça les anciens s'accumulent.
// Les fichiers statiques (popup.html/css, img/, fonts/) ne sont pas touchés.
for (const f of readdirSync('extension/popup')) {
  if (f.endsWith('.js')) rmSync(`extension/popup/${f}`);
}

// splitting : les adaptateurs de fichiers (CSV/XLSX/DOCX + xlsx ~980 Ko) sont
// importés dynamiquement par la popup et sortent donc en chunks séparés,
// chargés seulement au passage en mode Fichier — le mode texte (gratuit) reste
// léger. entryPoints en objet pour forcer le nom de sortie « popup.js ».
await build({
  // ner-worker : entry séparé, chargé via new Worker(). Transformers.js n'est
  // importé QUE par lui → il quitte le bundle popup (ouverture plus rapide) et
  // le modèle tourne hors du thread principal (UI fluide pendant la détection).
  entryPoints: { popup: 'src/popup/main.js', 'ner-worker': 'src/worker/ner-worker.js' },
  outdir: 'extension/popup',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome120',
  logLevel: 'info'
});

mkdirSync('extension/vendor', { recursive: true });

// DEUX runtimes ONNX cohabitent, et c'est voulu :
//  - 1.14 (embarqué par Transformers.js) pour le moteur BERT de repli ;
//  - 1.19 (embarqué par gliner) pour le moteur GLiNER par défaut.
// Leurs binaires portent des noms DIFFÉRENTS, donc aucune collision dans
// vendor/. Un binaire manquant = extension cassée en silence au runtime (la
// CSP MV3 interdit d'aller le chercher sur un CDN), d'où l'échec bruyant.
const WASM = [
  ['node_modules/@xenova/transformers/dist', 'ort-wasm.wasm'],
  ['node_modules/@xenova/transformers/dist', 'ort-wasm-simd.wasm'],
  // npm peut hisser ou imbriquer la dépendance selon l'arbre : on essaie les
  // deux emplacements plutôt que de coder en dur un résultat de hoisting.
  [['node_modules/gliner/node_modules/onnxruntime-web/dist',
    'node_modules/onnxruntime-web/dist'], 'ort-wasm-simd-threaded.wasm'],
  // Binaire JSEP : c'est LUI qui porte l'accélération WebGPU d'ORT 1.19. Sans
  // lui, `executionProvider: 'webgpu'` échoue au démarrage et on retombe en
  // WASM — donc silencieusement lent, sans que rien ne le signale.
  [['node_modules/gliner/node_modules/onnxruntime-web/dist',
    'node_modules/onnxruntime-web/dist'], 'ort-wasm-simd-threaded.jsep.wasm']
];
for (const [dirs, f] of WASM) {
  const candidats = Array.isArray(dirs) ? dirs : [dirs];
  const source = candidats.map(d => `${d}/${f}`).find(existsSync);
  if (!source) {
    throw new Error(`build : binaire WASM introuvable (${f}) — cherché dans ${candidats.join(', ')}`);
  }
  cpSync(source, `extension/vendor/${f}`);
}
// Worker pdfjs : exigé en navigateur (v6 refuse de démarrer sans workerSrc —
// pas de repli automatique, contrairement à Node). Servi depuis vendor/ comme
// les .wasm : local, CSP 'self', jamais de code distant (MV3).
cpSync('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'extension/vendor/pdf.worker.min.mjs');
console.log('Build OK → extension/');
