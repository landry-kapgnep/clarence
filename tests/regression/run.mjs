// Non-régression sur de vrais documents - le filet que le banc ne peut pas tendre.
//
// Pourquoi ce harnais existe, en plus de `npm run bench`.
//
// Le banc tourne sur 7 documents synthétiques, écrits en connaissant le moteur.
// C'est un biais structurel, et le banc l'admet lui-même en pied de page :
// « 7 documents synthétiques ne prédisent PAS le fichier d'un inconnu ». Le
// fait est vérifiable : tous les défauts réels de la session du 07-08/08 ont
// été trouvés sur de vrais documents (un mémoire de 75 pages, un mémoire
// anglais de 21 pages), aucun sur le corpus.
//
// Ce harnais ne mesure PAS la justesse - sans vérité terrain sur un document
// quelconque, personne ne sait ce qui aurait dû être masqué. Il mesure la
// Stabilité : la sortie a-t-elle changé depuis la dernière fois ? C'est
// beaucoup moins ambitieux, et beaucoup plus utile qu'il n'y paraît - ça
// attrape la régression silencieuse, celle qui passe les 360 tests unitaires
// et le banc sans laisser de trace.
//
// ── CE QUI EST COMMITTÉ ET CE QUI NE L'EST PAS ─────────────────────────────
// Les documents vivent dans `corpus/`, ignoré par git : ce sont de vrais
// fichiers, parfois personnels, et la règle du projet est absolue - jamais de
// données réelles dans le dépôt, même anonymisées.
//
// Les instantanés, eux, sont committés - mais ils ne contiennent QUE des
// empreintes des valeurs masquées, jamais les valeurs elles-mêmes. Sinon
// l'instantané deviendrait exactement ce qu'on refuse de committer : une liste
// de noms, d'adresses et d'identifiants réels. `--detail` réaffiche les vraies
// valeurs en local, depuis le corpus, quand il faut comprendre un écart.
//
// Lancer :
//   npm run regression              compare à l'instantané, échoue s'il bouge
//   npm run regression -- --maj     réécrit les instantanés (après un changement voulu)
//   npm run regression -- --detail  montre les valeurs en clair (local uniquement)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';

import { detectGliner, GLINER_MODEL, GLINER_VARIANTE, glinerModelUrl,
         TYPES_PEU_FIABLES, arbitrerFauxPositifs } from '../../src/engine/gliner.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';
import { composerArbitre } from '../../src/engine/precision.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

const ici = dirname(fileURLToPath(import.meta.url));
const CORPUS = join(ici, 'corpus');
const INSTANTANES = join(ici, 'instantanes');
const MAJ = process.argv.includes('--maj');
const DETAIL = process.argv.includes('--detail');

const empreinte = s => createHash('sha256').update(s).digest('hex').slice(0, 12);

// Miroir en clair - jamais committé (.gitignore), écrit à côté de l'instantané.
// Il n'existe que pour répondre à « quelle valeur n'est plus masquée ? », que
// les empreintes seules ne peuvent pas dire. Même statut que corpus/ : local,
// utile, hors du dépôt.
const cheminMiroir = nom => join(INSTANTANES, `${nom}.clair.json`);
const lireMiroir = nom => {
  const f = cheminMiroir(nom);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
};

// ── Chargement du moteur, identique au banc ────────────────────────────────
// Même modèle, même variante, même correctif de découpeur : un harnais qui
// mesurerait un moteur différent de celui qu'on livre ne prouverait rien.
const DECOUPEUR = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

async function chargerMoteur() {
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const tr = await import('@xenova/transformers');
  tr.env.allowLocalModels = false;
  tr.env.useBrowserCache = false;

  const cache = join(ici, '..', 'bench', '.modeles');
  const fichier = join(cache, `gliner_small-v2-${GLINER_VARIANTE}.onnx`);
  if (!existsSync(fichier)) {
    mkdirSync(cache, { recursive: true });
    console.error(`[téléchargement du modèle (${GLINER_VARIANTE}), une seule fois…]`);
    const res = await fetch(glinerModelUrl());
    if (!res.ok) throw new Error(`modèle : HTTP ${res.status}`);
    writeFileSync(fichier, Buffer.from(await res.arrayBuffer()));
  }

  const inst = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: { modelPath: fichier, executionProvider: 'cpu' },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level',
    maxWidth: 12
  });
  await inst.initialize();
  const d = inst?.model?.processor?.wordsSplitter;
  if (!d || !(d.whitespacePattern instanceof RegExp)) {
    throw new Error('GLiNER.js : découpeur introuvable — le harnais mesurerait un moteur dégradé');
  }
  d.whitespacePattern = DECOUPEUR;

  return createBatchedPipeline(async (textes, labels) => {
    const r = await inst.inference({ texts: textes, entities: labels, threshold: 0.05, flatNer: false });
    return textes.map((_, i) => r[i] || []);
  });
}

// ── Traitement d'un document, par le MÊME chemin que la popup ──────────────
async function analyser(chemin, pipe) {
  const ext = extname(chemin).toLowerCase();
  const octets = readFileSync(chemin);
  const buffer = octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength);

  let adaptateur;
  if (ext === '.pdf') adaptateur = await import('../../src/files/pdf-adapter.js');
  else if (ext === '.csv') adaptateur = await import('../../src/files/csv-adapter.js');
  else if (ext === '.xlsx') adaptateur = await import('../../src/files/xlsx-adapter.js');
  else if (ext === '.docx') adaptateur = await import('../../src/files/docx-adapter.js');
  else return null;

  const entree = (ext === '.csv') ? readFileSync(chemin, 'utf8') : buffer;
  const { units, intitules } = await adaptateur.extractTextUnits(entree);
  const { mapping, results } = await anonymizeUnits(units, {
    nerPipeline: pipe,
    nerDetect: detectGliner,
    intitules,
    disabledTypes: new Set(TYPES_PEU_FIABLES),
    arbitre: composerArbitre(pipe, arbitrerFauxPositifs)
  });

  const parType = {};
  for (const m of mapping) parType[m.type] = (parType[m.type] || 0) + 1;

  return {
    // Empreinte de la source : si le document change, l'écart d'instantané
    // n'est pas une régression du moteur, et il faut le dire tout de suite.
    empreinteSource: empreinte(octets),
    unites: units.length,
    valeursMasquees: mapping.length,
    parType,
    // Empreintes seulement - jamais les valeurs (voir l'en-tête).
    valeurs: mapping.map(m => `${m.type}:${empreinte(m.value)}`).sort(),
    // Gardé hors instantané, pour --detail uniquement.
    _clair: mapping.map(m => `${m.type}:${m.value}`).sort(),
    // La sortie, pour trancher « absorbée » contre « fuitée » (voir comparer).
    _sortie: results.map(r => r.maskedText).join('\n')
  };
}

// ── Comparaison ────────────────────────────────────────────────────────────
function comparer(nom, avant, apres, clair, sortie) {
  const ecarts = [];
  if (avant.empreinteSource !== apres.empreinteSource) {
    ecarts.push('LE DOCUMENT SOURCE A CHANGÉ — l\'écart ne vient pas du moteur');
  }
  if (avant.valeursMasquees !== apres.valeursMasquees) {
    ecarts.push(`valeurs masquées : ${avant.valeursMasquees} -> ${apres.valeursMasquees}`);
  }
  const avantSet = new Set(avant.valeurs), apresSet = new Set(apres.valeurs);
  const parties = avant.valeurs.filter(v => !apresSet.has(v));
  const nouvelles = apres.valeurs.filter(v => !avantSet.has(v));

  // Le sens de l'écart est ce qui compte : « ne masque plus » est un risque de
  // Fuite, « masque en plus » est un risque de sur-masquage. Jamais mis dans
  // le même sac.
  //
  // Mais une valeur qui quitte le mapping n'est pas forcément en clair : elle
  // peut avoir été absorbée par un span plus long ou reclassée sous un autre
  // type. Le mapping est indexé par `type:valeur`, il ne sait pas voir la
  // différence - et il criait donc « risque de fuite » sur des changements
  // parfaitement sains (constaté le 08/08 : « 41001 » et une affiliation
  // universitaire, toutes deux encore masquées).
  //
  // Le miroir permet de trancher pour de bon : on retrouve la valeur en clair,
  // et on regarde si elle est présente dans la sortie. Absente = absorbée.
  // Présente = fuite, et c'est la seule qui mérite le mot.
  const miroir = lireMiroir(nom);
  const fuites = [], absorbees = [];
  for (const v of parties) {
    const valeur = miroir?.[v];
    const texte = valeur?.slice(valeur.indexOf(':') + 1);
    // Sans miroir on ne peut pas trancher : on garde l'alerte la plus grave.
    if (!texte || sortie?.includes(texte)) fuites.push(valeur || v);
    else absorbees.push(valeur || v);
  }
  if (fuites.length) ecarts.push(`✘ FUITE — ${fuites.length} valeur(s) en clair dans la sortie`);
  if (absorbees.length) ecarts.push(`${absorbees.length} valeur(s) sortie(s) du mapping mais TOUJOURS masquée(s) (absorbées ou reclassées)`);
  if (nouvelles.length) ecarts.push(`masque ${nouvelles.length} valeur(s) EN PLUS`);

  if (DETAIL && clair) {
    const parEmpreinte = new Map(apres.valeurs.map((v, i) => [v, clair[i]]));
    // Ce qui a disparu est le sens dangereux, et c'est celui que l'instantané
    // ne sait pas nommer : il ne contient que des empreintes, et une valeur
    // qui n'est plus masquée n'est plus dans la passe courante non plus. D'où
    // le miroir en clair, écrit à côté de l'instantané et ignoré par git (voir
    // .gitignore) - les vraies valeurs ne doivent jamais entrer dans le dépôt.
    // Sans lui, le harnais criait « risque de fuite » sans pouvoir dire de
    // quoi : défaut constaté à l'usage le 08/08, sur son deuxième vrai écart.
    for (const v of fuites.slice(0, 15)) ecarts.push(`   ✘ ${v}`);
    for (const v of absorbees.slice(0, 15)) ecarts.push(`   − ${v}`);
    for (const v of nouvelles.slice(0, 15)) ecarts.push(`   + ${parEmpreinte.get(v) || v}`);
  }
  return ecarts;
}

// ── Boucle principale ──────────────────────────────────────────────────────
if (!existsSync(CORPUS)) mkdirSync(CORPUS, { recursive: true });
const documents = readdirSync(CORPUS)
  .filter(f => ['.pdf', '.csv', '.xlsx', '.docx'].includes(extname(f).toLowerCase()));

if (!documents.length) {
  console.log(`\nAucun document dans ${CORPUS}`);
  console.log('Dépose-y de VRAIS fichiers (le dossier est ignoré par git), puis :');
  console.log('  npm run regression -- --maj    pour créer les instantanés\n');
  process.exit(0);
}

mkdirSync(INSTANTANES, { recursive: true });
const pipe = await chargerMoteur();

let regressions = 0, crees = 0, stables = 0;
for (const fichier of documents) {
  const nom = basename(fichier, extname(fichier));
  const cheminInstantane = join(INSTANTANES, `${nom}.json`);
  const apres = await analyser(join(CORPUS, fichier), pipe);
  if (!apres) continue;
  const { _clair, _sortie, ...aEcrire } = apres;

  if (!existsSync(cheminInstantane) || MAJ) {
    writeFileSync(cheminInstantane, JSON.stringify(aEcrire, null, 2) + '\n');
    // Miroir local : empreinte → valeur en clair, pour pouvoir nommer plus tard
    // une valeur qui aurait cessé d'être masquée. Hors dépôt.
    writeFileSync(cheminMiroir(nom), JSON.stringify(
      Object.fromEntries(apres.valeurs.map((v, i) => [v, _clair[i]])), null, 2) + '\n');
    console.log(`  ${existsSync(cheminInstantane) && MAJ ? 'mis à jour' : 'créé'.padEnd(10)}  ${fichier}`);
    crees++;
    continue;
  }

  const avant = JSON.parse(readFileSync(cheminInstantane, 'utf8'));
  const ecarts = comparer(nom, avant, aEcrire, _clair, _sortie);
  if (ecarts.length) {
    regressions++;
    console.log(`\n  ÉCART  ${fichier}`);
    for (const e of ecarts) console.log(`         ${e}`);
  } else {
    stables++;
    console.log(`  stable      ${fichier}  (${apres.valeursMasquees} valeurs, ${apres.unites} unités)`);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  stables ${stables}   écarts ${regressions}   instantanés écrits ${crees}`);
console.log(`${'═'.repeat(60)}`);
if (regressions) {
  console.log('\nUn écart n\'est pas forcément un bug — mais il doit être EXPLIQUÉ.');
  console.log('S\'il est voulu : npm run regression -- --maj');
  console.log('Pour voir les valeurs en clair (local) : npm run regression -- --detail\n');
  process.exit(1);
}
