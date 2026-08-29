// Pourquoi le filtre a-t-il retiré CE candidat ? — le journal d'explication
// branché sur les documents du banc.
//
//     node tools/filtre/diagnostiquer.mjs [fichier…]
//
// Existe parce qu'un filtre qui DÉMASQUE doit pouvoir se justifier candidat par
// candidat. Sans ça, une régression au banc se diagnostique par hypothèses ;
// avec ça, elle se lit.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  detectGliner, GLINER_MODEL, GLINER_VARIANTE, glinerModelUrl,
  TYPES_PEU_FIABLES, arbitrerFauxPositifs
} from '../../src/engine/gliner.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';
import { filtrerParPrecision, POIDS } from '../../src/engine/precision.js';
import { contexteDocument, caracteristiques } from '../../src/engine/caracteristiques.js';

const ici = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ici, '..', '..');
const DECOUPEUR_UNICODE = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

async function chargerGliner() {
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const tr = await import('@xenova/transformers');
  tr.env.allowLocalModels = false; tr.env.useBrowserCache = false;
  const cache = join(RACINE, 'tests', 'bench', '.modeles');
  const fichier = join(cache, `gliner_small-v2-${GLINER_VARIANTE}.onnx`);
  if (!existsSync(fichier)) {
    mkdirSync(cache, { recursive: true });
    const res = await fetch(glinerModelUrl());
    writeFileSync(fichier, Buffer.from(await res.arrayBuffer()));
  }
  const inst = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: { modelPath: fichier, executionProvider: 'cpu' },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level', maxWidth: 12
  });
  await inst.initialize();
  inst.model.processor.wordsSplitter.whitespacePattern = DECOUPEUR_UNICODE;
  return createBatchedPipeline(async (t, l) => {
    const r = await inst.inference({ texts: t, entities: l, threshold: 0.05 });
    return t.map((_, i) => r[i] || []);
  });
}

const fichiers = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [join(RACINE, 'tests/bench/corpus/rapport-fr.txt'),
     join(RACINE, 'tests/bench/corpus/tableau-rh.csv')];

const pipe = await chargerGliner();
const off = new Set(TYPES_PEU_FIABLES);

for (const f of fichiers) {
  const texte = readFileSync(f, 'utf8');
  // Découpage en lignes non vides : approximation des unités, suffisante pour
  // un diagnostic (le banc, lui, passe par les vrais adaptateurs).
  const unites = texte.split('\n').filter(l => l.trim());
  let candidats = [];
  for (const u of unites) candidats.push(...await detectGliner(u, pipe, { disabledTypes: off }));
  const apresArbitre = await arbitrerFauxPositifs(candidats, pipe);

  const journal = [];
  filtrerParPrecision(apresArbitre, texte, { journal });

  console.log(`\n── ${basename(f)} — ${apresArbitre.length} candidats, ${journal.length} retirés`);
  const ctx = contexteDocument(texte);
  for (const j of journal) {
    const c = caracteristiques({ value: j.valeur, score: 0.7 }, ctx);
    const dominantes = Object.entries(POIDS.poids)
      .map(([n, w]) => [n, w * (c[n] ?? 0)])
      .filter(([, a]) => a < -0.4)
      .sort((a, b) => a[1] - b[1])
      .map(([n, a]) => `${n} ${a.toFixed(1)}`);
    console.log(`   ${j.p.toFixed(3)}  ${j.type.padEnd(4)} « ${j.valeur} »`);
    console.log(`          ${dominantes.join(' · ') || '(rien de saillant)'}`);
  }
}
