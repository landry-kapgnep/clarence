// Phase 1 - Quelle forme de texte donner au modèle ?
//
//     node tests/bench/serialisation.mjs <document.pdf>
//
// La question. Le modèle ne voit qu'une suite de tokens. Or ce qui désambiguïse
// dans un document, c'est la mise en page : la section où l'on se trouve, le
// libellé qui précède une valeur. Rien de tout ça n'est dans la suite de
// tokens. Si on veut un jour l'entraîner à s'en servir, il faut d'abord décider
// Sous quelle forme le lui écrire - et le générateur de la phase 2 devra
// produire cette forme-là.
//
// Ce que ce banc ne dit pas. Ajouter du contexte dégrade un modèle non
// entraîné : mesuré sur une cellule de tableau, le libellé capte l'attention à
// la place de la valeur (0,74 contre 0,15). Ce script mesure donc l'état
// Avant entraînement. Son but n'est pas d'élire la meilleure forme - c'est
// d'écarter celles qui cassent tout, et de chiffrer le point de départ.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Un chemin Windows absolu n'est pas une URL ESM valide : on importe par URL.
const mod = (rel) => import(new URL(rel, import.meta.url).href);
const G = await mod('../../src/engine/gliner.js');
const { createBatchedPipeline } = await mod('../../src/engine/batch.js');
const { extractTextUnits, ressembleAUnIntitule } = await mod('../../src/files/pdf-adapter.js');

await import('onnxruntime-node');
const { Gliner } = await import('gliner/node');
const tr = await import('@xenova/transformers');
tr.env.allowLocalModels = false; tr.env.useBrowserCache = false;
const inst = new Gliner({
  tokenizerPath: G.GLINER_MODEL,
  onnxSettings: {
    modelPath: join(RACINE, 'tests/bench/.modeles', `gliner_small-v2-${G.GLINER_VARIANTE}.onnx`),
    executionProvider: 'cpu'
  },
  transformersSettings: { allowLocalModels: false, useBrowserCache: false },
  modelType: 'span-level', maxWidth: 12
});
await inst.initialize();
inst.model.processor.wordsSplitter.whitespacePattern = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;
const pipe = createBatchedPipeline(async (t, l) => {
  const r = await inst.inference({ texts: t, entities: l, threshold: 0.05 });
  return t.map((_, i) => r[i] || []);
});

const o = readFileSync(process.argv[2]);
const { units } = await extractTextUnits(o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength));

// Section courante : la dernière unité qui EST un intitulé. Approximation
// assumée - dans un document à colonnes, l'ordre de lecture n'est pas toujours
// celui des sections. C'est justement ce que le générateur, lui, saura poser
// exactement.
const avecSection = [];
let section = '';
for (const u of units) {
  const t = u.text.trim();
  const tete = t.split(/\s{2,}|\n/)[0].trim();
  if (ressembleAUnIntitule(tete)) section = tete;
  avecSection.push({ texte: t, section });
}

const FORMES = {
  'brut (actuel)': u => u.texte,
  'section en préfixe': u => (u.section ? `[${u.section}] ${u.texte}` : u.texte),
  'champs nommés': u => (u.section ? `section: ${u.section} | texte: ${u.texte}` : u.texte)
};

// Vraies données de CE document, relevées à la main lors de l'audit du 18/08.
const VRAIES = ['KAPGNEP', 'LANDRY', 'Sorbonne', 'UNODC', 'Twini', 'Frontières',
                'SafePrompt', 'Île-de-France', 'IUT'];
const estVraie = v => VRAIES.some(x => v.includes(x));

const off = new Set(G.TYPES_PEU_FIABLES);
console.log('forme                  détections   dont vraies   bruit');
console.log('─'.repeat(60));
const detail = {};
for (const [nom, rendre] of Object.entries(FORMES)) {
  const vues = new Map();
  for (const u of avecSection) {
    for (const e of await G.detectGliner(rendre(u), pipe, { disabledTypes: off })) {
      // Une entité trouvée dans le préfixe ajouté n'existe pas dans le
      // document : elle ne compte pas, mais elle signale une forme qui parasite.
      if (u.section && e.value.includes(u.section) && e.value.length <= u.section.length + 2) continue;
      vues.set(e.value, e.type);
    }
  }
  const vraies = [...vues.keys()].filter(estVraie);
  detail[nom] = vues;
  const bruit = vues.size - vraies.length;
  console.log(nom.padEnd(22) + String(vues.size).padStart(8)
    + String(vraies.length).padStart(14) + String(bruit).padStart(8));
}

// Ce que chaque forme change par rapport au brut : c'est là que se lit
// l'effet, pas dans les totaux.
const base = detail['brut (actuel)'];
for (const [nom, vues] of Object.entries(detail)) {
  if (nom === 'brut (actuel)') continue;
  const gagnees = [...vues.keys()].filter(v => !base.has(v));
  const perdues = [...base.keys()].filter(v => !vues.has(v));
  console.log(`\n── ${nom}`);
  console.log('   en plus  : ' + (gagnees.join(' · ') || '—'));
  console.log('   en moins : ' + (perdues.join(' · ') || '—'));
}
