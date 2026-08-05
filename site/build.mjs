// Build du site vitrine — PROTOTYPE, rien n'est publié.
//
// Le site réutilise le MÊME moteur que l'extension (src/engine/), sans copie :
// c'est tout l'intérêt de la démo en ligne. Aucune API chrome.* n'est touchée,
// donc le mode texte tourne tel quel dans une page web ordinaire.
//
// Seule la couche DÉTERMINISTE tourne ici (regex + validateurs) : elle est
// instantanée et ne télécharge rien. La couche contextuelle demande 183 Mo de
// modèle — c'est ce que l'extension apporte, et le site le dit au lieu de le
// masquer.
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';

const OUT = 'site/dist';
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(`${OUT}/fonts`, { recursive: true });
mkdirSync(`${OUT}/img`, { recursive: true });

// Polices du projet, pas de CDN : le site doit pouvoir tourner hors-ligne et
// ne charger AUCUNE ressource tierce — cohérent avec ce qu'il promet.
// Les fichiers variables portent des crochets dans leur nom ([wght]), illisibles
// dans une url() CSS : on les renomme à la copie.
const POLICES = [
  ['extension/popup/fonts/Syne_Mono/SyneMono-Regular.ttf', 'SyneMono.ttf'],
  ['extension/popup/fonts/stack_sans/fonts/Text/variable/StackSansText[wght].ttf', 'StackSansText.ttf'],
  ['extension/popup/fonts/stack_sans/fonts/Headline/variable/StackSansHeadline[wght].ttf', 'StackSansHeadline.ttf']
];
for (const [src, nom] of POLICES) cpSync(src, `${OUT}/fonts/${nom}`);

const IMAGES = ['ClarenceLogoRedSquareWAlt.png', 'ClarenceFairyW.png', 'ClarenceTxtW.png', 'ClarenceFlW.png'];
for (const f of IMAGES) {
  const src = `extension/popup/img/${f}`;
  if (existsSync(src)) cpSync(src, `${OUT}/img/${f}`);
}

await build({
  entryPoints: { demo: 'site/js/demo.js' },
  outdir: OUT,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome120',
  minify: true,
  logLevel: 'info'
});

cpSync('site/index.html', `${OUT}/index.html`);
cpSync('site/styles.css', `${OUT}/styles.css`);
console.log(`Site OK → ${OUT}/ (ouvrir index.html)`);
