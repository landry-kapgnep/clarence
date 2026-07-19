// Harnais : passe regex + passe NER sur les 3 fixtures, sortie lisible.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detectRegex } from '../src/engine/regex-detect.js';
import { detectNER, NER_MODEL } from '../src/engine/ner.js';
import { mergeEntities } from '../src/engine/merge.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = [
  'texte1-cas-complet.txt',
  'texte2-noms-difficiles.txt',
  'texte3-zero-faux-positif.txt'
];

const withNER = process.argv.includes('--ner');
let nerPipeline = null;
if (withNER) {
  const { pipeline, env } = await import('@xenova/transformers');
  env.allowLocalModels = false;
  console.error(`[chargement NER ${NER_MODEL}…]`);
  nerPipeline = await pipeline('token-classification', NER_MODEL);
  console.error('[NER chargé]');
}

for (const f of fixtures) {
  const text = readFileSync(join(here, 'fixtures', f), 'utf8');
  const regexE = detectRegex(text);
  const nerE = nerPipeline ? await detectNER(text, nerPipeline) : [];
  const merged = mergeEntities(regexE, nerE);
  console.log(`\n===== ${f} =====`);
  if (merged.length === 0) { console.log('(aucune entité)'); continue; }
  for (const e of merged) {
    const score = e.source === 'ner' ? ` score=${(e.score * 100).toFixed(0)}%` : '';
    console.log(`  [${e.source}] ${e.type.padEnd(18)} "${e.value}" @${e.start}-${e.end}${score}`);
  }
}
