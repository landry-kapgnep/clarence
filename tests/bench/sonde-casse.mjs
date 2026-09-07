// Sonde : que voit le modèle, et qu'est-ce que NOS filtres jettent ensuite ?
//
// Question posée : « rue de la liberté » en minuscules n'est pas détecté, la
// même chaîne en capitales l'est. Est-ce le modèle qui ne voit rien, ou nous
// qui écartons ce qu'il voit ? Les deux réponses appellent des corrections
// opposées, donc il faut mesurer avant de toucher à quoi que ce soit.
//
// On imprime, pour chaque phrase et chaque casse :
//   - ce que le modèle rend brut, avec son score ;
//   - ce qui survit à `estPlausiblePourLeType` (majuscule exigée, vocabulaire
//     courant, pronoms) ;
//   - la raison du rejet quand il y en a une.
//
// Lancement : node tests/bench/sonde-casse.mjs
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GLINER_MODEL, GLINER_VARIANTE, glinerModelUrl, GROUPES
} from '../../src/engine/gliner.js';
import { estVocabulaireCourant } from '../../src/engine/vocabulaire.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';

const here = dirname(fileURLToPath(import.meta.url));
const DECOUPEUR_UNICODE = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

const PHRASES = [
  'Je suis Philippe et je suis dans la rue de la liberté.',
  'Je suis Philippe et je suis dans la Rue de la Liberté.',
  'Je suis Philippe et je suis dans la RUE DE LA LIBERTÉ.',
  'j habite a paris et je travaille chez innovatech.',
  'J habite a Paris et je travaille chez Innovatech.',
  'contactez marie dubois au service comptabilite.',
  'Contactez Marie Dubois au service comptabilite.'
];

async function modeleLocal() {
  const { existsSync, mkdirSync, writeFileSync } = await import('node:fs');
  const cache = join(here, '.modeles');
  const fichier = join(cache, `gliner_small-v2-${GLINER_VARIANTE}.onnx`);
  if (!existsSync(fichier)) {
    mkdirSync(cache, { recursive: true });
    const res = await fetch(glinerModelUrl());
    if (!res.ok) throw new Error(`téléchargement : HTTP ${res.status}`);
    writeFileSync(fichier, Buffer.from(await res.arrayBuffer()));
  }
  return fichier;
}

async function chargerGliner() {
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const transformers = await import('@xenova/transformers');
  transformers.env.allowLocalModels = false;
  transformers.env.useBrowserCache = false;
  const instance = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: { modelPath: await modeleLocal(), executionProvider: 'cpu' },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level',
    maxWidth: 12
  });
  await instance.initialize();
  const d = instance?.model?.processor?.wordsSplitter;
  if (!d || !(d.whitespacePattern instanceof RegExp)) {
    throw new Error('découpeur introuvable : la sonde mesurerait un moteur dégradé');
  }
  d.whitespacePattern = DECOUPEUR_UNICODE;
  return createBatchedPipeline(async (textes, labels) => {
    const res = await instance.inference({ texts: textes, entities: labels, threshold: 0.05 });
    return textes.map((_, i) => res[i] || []);
  });
}

// Les trois raisons de rejet, dans l'ordre où `estPlausiblePourLeType` les
// applique. On les rejoue ici pour pouvoir NOMMER celle qui s'applique.
function raisonDuRejet(type, valeur, seuil, score) {
  if (score < seuil) return `sous le seuil (${score.toFixed(2)} < ${seuil})`;
  if (!['PER', 'ORG', 'LOC'].includes(type)) return null;
  if (!/\p{Lu}/u.test(valeur)) return 'aucune majuscule';
  if (['ORG', 'LOC'].includes(type) && estVocabulaireCourant(valeur)) {
    return 'vocabulaire courant';
  }
  return null;
}

const pipe = await chargerGliner();
const groupe = GROUPES.find(g => Object.values(g.types).includes('LOC'))
  || GROUPES[0];
const labels = groupe.labels;

console.log(`groupe testé : ${labels.join(', ')}  (seuil ${groupe.seuil})\n`);
for (const phrase of PHRASES) {
  const spans = await pipe(phrase, labels);
  console.log(phrase);
  if (!spans.length) console.log('    (le modèle ne rend rien)');
  for (const s of spans.sort((a, b) => b.score - a.score)) {
    const type = groupe.types[s.label];
    const raison = raisonDuRejet(type, s.spanText, groupe.seuil, s.score);
    console.log(`    ${(s.spanText + '                    ').slice(0, 22)}`
      + ` ${(type || s.label + '?').padEnd(6)} ${s.score.toFixed(2)}`
      + `  ${raison ? 'REJETÉ : ' + raison : 'gardé'}`);
  }
  console.log('');
}
