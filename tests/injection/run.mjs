// Rappel mesuré par INJECTION CONTRÔLÉE - de la vraie prose, une vérité
// terrain parfaite.
//
// LE PROBLÈME QUE ÇA RÉSOUT. Le banc mesure sur des documents que j'ai écrits :
// biais structurel. Le harnais de non-régression mesure sur de vrais documents,
// mais sans vérité terrain - il dit si la sortie BOUGE, jamais si elle est
// JUSTE. Il manquait une mesure de justesse sur de la langue authentique.
//
// LE PRINCIPE. On prend de la vraie prose (les documents de
// tests/regression/corpus, déjà en place et ignorés par git), on y INJECTE des
// PII synthétiques à des positions connues, et on vérifie qu'elles ressortent
// masquées. La prose est authentique - ses tournures, sa ponctuation, ses
// fragments d'extraction PDF - mais on sait exactement ce qui doit disparaître.
//
// CE QUE ÇA NE MESURE PAS, et il faut le dire : le SUR-masquage. On ne connaît
// la vérité que sur ce qu'on a injecté ; le reste du document garde son statut
// inconnu. C'est donc une mesure de RAPPEL, pas de précision. Le sur-masquage
// se mesure ailleurs - sur tests/manuel/tous-defauts.pdf, où la vérité terrain
// est écrite à la main dans les deux sens.
//
// POURQUOI DES PII SYNTHÉTIQUES ET RECONNAISSABLES. Règle du projet : jamais de
// données de test qui ressemblent à du réel. Les valeurs ci-dessous sont
// fabriquées - carte 4242…, domaines en .example, IBAN et NIR à structure
// valide mais sans titulaire.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { detectGliner, GLINER_MODEL, GLINER_VARIANTE, glinerModelUrl,
         TYPES_PEU_FIABLES, arbitrerFauxPositifs } from '../../src/engine/gliner.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';
import { composerArbitre } from '../../src/engine/precision.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { detectPhonesIntl } from '../../src/engine/phone-intl.js';

const ici = dirname(fileURLToPath(import.meta.url));
const CORPUS = join(ici, '..', 'regression', 'corpus');

// ── Les PII injectées ──────────────────────────────────────────────────────
// Chaque entrée : la phrase porteuse (dans la langue visée) et la valeur qui
// DOIT ressortir masquée. La phrase porteuse compte : une valeur jetée sans
// contexte ne teste pas la même chose qu'une valeur dans une vraie phrase.
const INJECTIONS = [
  // ── Structuré : la couche déterministe, exigence 100 %
  ['fr', 'Le virement a été fait sur le compte FR76 3000 6000 0112 3456 7890 189 hier.', 'FR76 3000 6000 0112 3456 7890 189', 'structuré'],
  ['fr', 'Merci de confirmer au 06 44 55 66 77 avant vendredi.', '06 44 55 66 77', 'structuré'],
  ['fr', 'Son numéro de sécurité sociale est 1 88 03 44 109 019 91 selon le dossier.', '1 88 03 44 109 019 91', 'structuré'],
  ['fr', 'Écrivez à camille.dubois@exemple-cabinet.example pour la suite.', 'camille.dubois@exemple-cabinet.example', 'structuré'],
  ['fr', 'La carte utilisée se termine par 4242 4242 4242 4242 selon le relevé.', '4242 4242 4242 4242', 'structuré'],
  ['en', 'Please reach out at 617-555-0148 during office hours.', '617-555-0148', 'structuré'],
  ['en', 'The record lists SSN 123-45-6789 for that employee.', '123-45-6789', 'structuré'],
  ['es', 'El DNI que figura en el expediente es 12345678Z desde 2019.', '12345678Z', 'structuré'],
  ['de', 'Die Steuer-ID lautet 12345678901 laut Unterlagen.', '12345678901', 'structuré'],

  // ── Contextuel : le modèle, mesuré et jamais promis
  ['fr', 'La réunion était présidée par Amandine Rousseau, arrivée en mars.', 'Amandine Rousseau', 'contextuel'],
  ['fr', 'Le dossier a été transmis à Korrigane Labs pour instruction.', 'Korrigane Labs', 'contextuel'],
  ['en', 'The audit was carried out by Kwame Nkrumah-Boateng last quarter.', 'Kwame Nkrumah-Boateng', 'contextuel'],
  ['en', 'She joined Ravenscroft & Bell shortly after graduating.', 'Ravenscroft & Bell', 'contextuel'],
  ['es', 'El informe fue firmado por María del Carmen Ruiz Salinas en Madrid.', 'María del Carmen Ruiz Salinas', 'contextuel'],
  ['de', 'Der Vertrag wurde von Jürgen Müller in Hamburg unterzeichnet.', 'Jürgen Müller', 'contextuel']
];

const DECOUPEUR = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

async function chargerMoteur() {
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const tr = await import('@xenova/transformers');
  tr.env.allowLocalModels = false;
  tr.env.useBrowserCache = false;
  const fichier = join(ici, '..', 'bench', '.modeles', `gliner_small-v2-${GLINER_VARIANTE}.onnx`);
  if (!existsSync(fichier)) throw new Error(`modèle absent — lancer d'abord npm run bench`);
  const inst = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: { modelPath: fichier, executionProvider: 'cpu' },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level', maxWidth: 12
  });
  await inst.initialize();
  const d = inst?.model?.processor?.wordsSplitter;
  if (!d) throw new Error('GLiNER.js : découpeur introuvable');
  d.whitespacePattern = DECOUPEUR;
  return createBatchedPipeline(async (t, l) => {
    const r = await inst.inference({ texts: t, entities: l, threshold: 0.05, flatNer: false });
    return t.map((_, i) => r[i] || []);
  });
}

// ── Extraction de la prose porteuse ────────────────────────────────────────
async function proseDe(chemin) {
  const octets = readFileSync(chemin);
  const buffer = octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength);
  const { extractTextUnits } = await import('../../src/files/pdf-adapter.js');
  const { units } = await extractTextUnits(buffer);
  // On ne garde que les unités assez longues pour être de la vraie prose :
  // un fragment de trois mots ne fournirait aucun contexte au modèle.
  return units.filter(u => u.text.length > 120).map(u => u.text);
}

const pdfs = existsSync(CORPUS)
  ? readdirSync(CORPUS).filter(f => extname(f).toLowerCase() === '.pdf')
  : [];
if (!pdfs.length) {
  console.log(`\nAucun PDF dans ${CORPUS} — dépose-y de vrais documents (dossier ignoré par git).\n`);
  process.exit(0);
}

const prose = [];
for (const f of pdfs) prose.push(...await proseDe(join(CORPUS, f)));
if (prose.length < INJECTIONS.length) {
  console.log(`\nProse insuffisante (${prose.length} paragraphes) pour ${INJECTIONS.length} injections.\n`);
  process.exit(0);
}
console.log(`prose porteuse : ${prose.length} paragraphes réels tirés de ${pdfs.length} document(s)\n`);

const pipe = await chargerMoteur();

// Chaque PII est injectée dans un paragraphe RÉEL, à la suite de son texte.
// On garde une unité par injection pour que l'échec soit attribuable.
const unites = INJECTIONS.map(([langue, phrase, valeur, couche], i) => ({
  id: `inj${i}`,
  text: `${prose[i % prose.length]} ${phrase}`,
  _meta: { langue, valeur, couche }
}));

const { results } = await anonymizeUnits(unites.map(({ id, text }) => ({ id, text })), {
  nerPipeline: pipe, nerDetect: detectGliner,
  disabledTypes: new Set(TYPES_PEU_FIABLES),
  arbitre: composerArbitre(pipe, arbitrerFauxPositifs)
});
const parId = new Map(results.map(r => [r.id, r.maskedText]));

const bilan = {};
console.log('couche      langue  résultat  valeur injectée');
console.log('─'.repeat(72));
for (const u of unites) {
  const { langue, valeur, couche } = u._meta;
  const sortie = parId.get(u.id) || '';
  const masquee = !sortie.includes(valeur);
  (bilan[couche] ||= { ok: 0, total: 0 });
  bilan[couche].total++;
  if (masquee) bilan[couche].ok++;
  console.log(`${couche.padEnd(11)} ${langue.padEnd(7)} ${masquee ? 'masquée ' : 'FUITE   '}  ${valeur}`);
}

console.log('\n' + '═'.repeat(72));
for (const [couche, { ok, total }] of Object.entries(bilan)) {
  const pct = Math.round((ok / total) * 100);
  const exigence = couche === 'structuré' ? '   exigence : 100 %' : '   mesuré, jamais promis';
  console.log(`  Rappel ${couche.toUpperCase().padEnd(12)} ${String(pct).padStart(3)} %   (${ok}/${total})${exigence}`);
}
console.log('═'.repeat(72));
console.log('\nCette mesure porte sur le RAPPEL seul : on ne connaît la vérité que');
console.log('sur ce qu\'on a injecté. Le sur-masquage se mesure sur tous-defauts.pdf.\n');

// Le structuré est validé mathématiquement : un raté y est un bug, pas une
// limite de modèle. Il fait donc échouer la commande, contrairement au
// contextuel qui dépend d'un modèle statistique.
if (bilan['structuré'] && bilan['structuré'].ok < bilan['structuré'].total) process.exit(1);
