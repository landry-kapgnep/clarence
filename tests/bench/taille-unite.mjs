// Balayage de la taille d'unité - le compromis rappel / bruit, chiffré.
//
//     node tests/bench/taille-unite.mjs [cv.pdf]
//
// La question. P8 a ALLONGÉ les paragraphes pour réduire le bruit (un mémoire
// découpé en lignes faisait masquer 39 % du document). P17 a mesuré l'inverse :
// le même texte, mêmes labels, donne 0,453 sur une unité de 340 caractères et
// 0,531 sur 48 - le signal se dilue avec la longueur. Les deux objectifs
// s'opposent donc, et personne n'a mesuré où se croisent les courbes.
//
// Ce qu'on mesure, et pourquoi seulement ça. La couche déterministe (regex,
// validateurs) ne dépend pas du découpage : elle tourne sur le document
// combiné. Seule la couche contextuelle est concernée, donc c'est elle seule
// qu'on note ici - mélanger les deux diluerait l'effet qu'on cherche à voir.
//
// Ce n'est pas le banc. Le banc mesure ce qui est livré, de bout en bout.
// Ici on force un découpage qui n'existe dans aucun adaptateur, pour savoir s'il
// vaudrait la peine d'en construire un. Les chiffres ne sont donc pas
// comparables à ceux de `npm run bench`.
import { readFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  detectGliner, GLINER_MODEL, GLINER_VARIANTE, TYPES_PEU_FIABLES, arbitrerFauxPositifs
} from '../../src/engine/gliner.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';
import { composerArbitre } from '../../src/engine/precision.js';
import { extractTextUnits } from '../../src/files/pdf-adapter.js';
import { CORPUS } from './verite-terrain.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const TAILLES = [200, 340, 600, 1000];

// Types produits par le déterministe : hors sujet ici, le découpage ne les
// touche pas. On ne note donc que ce que la couche contextuelle doit trouver.
const STRUCTURES = new Set(['EMAIL', 'TELEPHONE', 'IBAN', 'CARTE_BANCAIRE', 'NIR',
  'SIRET_SIREN', 'ID_NATIONAL', 'REFERENCE', 'CODE_POSTAL_VILLE', 'BIC', 'IP', 'MAC', 'PSEUDO']);

async function charger() {
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const tr = await import('@xenova/transformers');
  tr.env.allowLocalModels = false; tr.env.useBrowserCache = false;
  const inst = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: {
      modelPath: join(ici, '.modeles', `gliner_small-v2-${GLINER_VARIANTE}.onnx`),
      executionProvider: 'cpu'
    },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level', maxWidth: 12
  });
  await inst.initialize();
  const d = inst?.model?.processor?.wordsSplitter;
  if (!d || !(d.whitespacePattern instanceof RegExp)) {
    throw new Error('découpeur GLiNER introuvable — on mesurerait un moteur dégradé');
  }
  d.whitespacePattern = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;
  return createBatchedPipeline(async (t, l) => {
    const r = await inst.inference({ texts: t, entities: l, threshold: 0.05 });
    return t.map((_, i) => r[i] || []);
  });
}

// Regroupe des lignes en fenêtres d'environ `taille` caractères. On ne coupe
// Jamais au milieu d'une ligne : un fragment tronqué produit du charabia, et
// c'est déjà la cause connue du bruit sur les PDF multi-colonnes (P1bis).
function fenetrer(lignes, taille) {
  const out = [];
  let courant = '';
  for (const l of lignes) {
    if (courant && (courant.length + l.length + 1) > taille) { out.push(courant); courant = ''; }
    courant = courant ? courant + '\n' + l : l;
  }
  if (courant.trim()) out.push(courant);
  return out;
}

async function texteDe(fichier) {
  const chemin = fichier.startsWith('.') ? join(ici, fichier) : join(ici, 'corpus', fichier);
  if (extname(fichier).toLowerCase() === '.pdf') {
    const b = readFileSync(chemin);
    const { units } = await extractTextUnits(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    return units.map(u => u.text);
  }
  return readFileSync(chemin, 'utf8').split('\n').filter(l => l.trim());
}

const pipe = await charger();
const off = new Set(TYPES_PEU_FIABLES);
const arbitre = composerArbitre(pipe, arbitrerFauxPositifs);

async function mesurer(lignes, taille) {
  const fenetres = fenetrer(lignes, taille);
  let brut = [];
  for (const f of fenetres) brut.push(...await detectGliner(f, pipe, { disabledTypes: off }));
  const gardes = await arbitre(brut, lignes.join('\n'));
  return { valeurs: gardes.map(e => e.value), unites: fenetres.length };
}

// --- Corpus du banc --------------------------------------------------------
const docs = CORPUS.filter(d => !d.fichier.endsWith('.csv'));  // cellules : le
// découpage n'a pas de sens sur un CSV, chaque cellule est déjà une unité.

console.log('BALAYAGE — corpus du banc (couche CONTEXTUELLE seule)\n');
console.log('taille   unités   contextuel trouvé   termes préservés');
console.log('─'.repeat(62));

const parTaille = {};
for (const taille of TAILLES) {
  let aTrouver = 0, trouves = 0, aGarder = 0, gardes = 0, unites = 0;
  const rates = [], surmasques = [];
  for (const doc of docs) {
    const lignes = await texteDe(doc.fichier);
    const { valeurs, unites: n } = await mesurer(lignes, taille);
    unites += n;
    const couvre = v => valeurs.some(x => x.includes(v) || v.includes(x));
    for (const e of doc.aMasquer.filter(e => !STRUCTURES.has(e.type))) {
      aTrouver++;
      if (couvre(e.valeur)) trouves++; else rates.push(e.valeur);
    }
    for (const t of doc.aGarder || []) {
      aGarder++;
      if (!couvre(t)) gardes++; else surmasques.push(t);
    }
  }
  parTaille[taille] = { rates, surmasques };
  console.log(String(taille).padEnd(9) + String(unites).padEnd(9)
    + `${trouves}/${aTrouver} (${Math.round(trouves / aTrouver * 100)} %)`.padEnd(20)
    + `${gardes}/${aGarder} (${Math.round(gardes / aGarder * 100)} %)`);
}

console.log('\nCE QUI CHANGE D’UNE TAILLE À L’AUTRE');
for (const t of TAILLES) {
  console.log(`\n  ${t} c.`);
  console.log('    ratés     : ' + (parTaille[t].rates.join(' · ') || '—'));
  console.log('    sur-masqué: ' + (parTaille[t].surmasques.join(' · ') || '—'));
}

// --- CV réel ---------------------------------------------------------------
if (process.argv[2]) {
  const VRAIES = ['KAPGNEP', 'Semantikmatch', 'Sorbonne', 'UNODC', 'Twini', 'SafePrompt', 'Île-de-France'];
  const FAUSSES = ['Bénévole terrain', 'IA', 'Ollama', 'JaCoCo', 'BDD', 'LAMP',
                   'Profil R&D', 'NSI', 'Sankey', 'Cohortes', 'Data Engineer'];
  const b = readFileSync(process.argv[2]);
  const { units } = await extractTextUnits(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const lignes = units.map(u => u.text);

  console.log('\n\nBALAYAGE — CV réel\n');
  console.log('taille   unités   vraies trouvées   faux positifs connus');
  console.log('─'.repeat(60));
  for (const taille of TAILLES) {
    const { valeurs, unites } = await mesurer(lignes, taille);
    const couvre = v => valeurs.some(x => x.includes(v));
    const v = VRAIES.filter(couvre).length, f = FAUSSES.filter(couvre).length;
    console.log(String(taille).padEnd(9) + String(unites).padEnd(9)
      + `${v}/${VRAIES.length}`.padEnd(18) + `${f}/${FAUSSES.length}`);
  }
}
