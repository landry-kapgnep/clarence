// Build de l'extension : bundle la popup (moteur + Transformers.js en local,
// exigence MV3 : aucun code distant) et copie les runtimes WASM en vendor/.
import { build } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

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
  entryPoints: { popup: 'src/popup/main.js' },
  outdir: 'extension/popup',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome120',
  logLevel: 'info'
});

mkdirSync('extension/vendor', { recursive: true });
for (const f of ['ort-wasm.wasm', 'ort-wasm-simd.wasm']) {
  cpSync(`node_modules/@xenova/transformers/dist/${f}`, `extension/vendor/${f}`);
}
console.log('Build OK → extension/');
