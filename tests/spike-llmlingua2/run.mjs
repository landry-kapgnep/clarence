// SPIKE LLMLingua-2 — compression de prompt par modèle, exécutée côté client.
//
// `node tests/spike-llmlingua2/run.mjs`
//
// POURQUOI CE SPIKE. La mesure du 09/08 a montré qu'il n'y a AUCUN gain en
// tokens du côté du texte : la conversion Markdown rend −1 %, les en-têtes
// répétés 1 %, le sommaire 1 % (voir CLAUDE.md). LLMLingua-2 est le seul levier
// d'un ordre de grandeur supérieur qu'ait donné la recherche.
//
// LE MODÈLE. `microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank`,
// Apache 2.0 — MÊME architecture et MÊME tâche (classification de tokens) que
// notre moteur BERT de repli, donc le worker existant saurait l'héberger. Il
// est EXTRACTIF : il ne peut que supprimer des mots, jamais en écrire, donc
// aucune hallucination possible (contrairement à un résumé par LLM).
// Le dépôt officiel n'a pas de poids ONNX ; on passe par une conversion
// communautaire (voir MODELE ci-dessous, et la réserve de licence dans le
// verdict).
//
// LABEL_1 = « garder ». La config n'a pas d'id2label : identifié par sonde, en
// vérifiant que les mots pleins reçoivent LABEL_1 et les mots outils LABEL_0.
//
// Méthode reprise du spike GLiNER-PII : on mesure, on ne suppose pas — et on
// consigne même en cas de NO-GO.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline, env } from '@xenova/transformers';

const ici = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ici, '..', '..');
env.allowLocalModels = false;
env.cacheDir = join(RACINE, 'tests/bench/.modeles/hf');

const MODELE = 'ldenoue/llmlingua-2-bert-base-multilingual-cased-meetingbank';
const MOTS_PAR_LOT = 300;   // le modèle plafonne à 512 positions

console.error(`[chargement de ${MODELE}…]`);
const pipe = await pipeline('token-classification', MODELE, { quantized: true });

const pGarder = o => (o.entity === 'LABEL_1' ? o.score : 1 - o.score);

// Sans découpage explicite le pipeline TRONQUE en silence au-delà de 512
// positions, et la mesure porterait sur un extrait. Même piège que le NER BERT.
async function etiqueter(texte) {
  const mots = texte.split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < mots.length; i += MOTS_PAR_LOT) {
    out.push(...await pipe(mots.slice(i, i + MOTS_PAR_LOT).join(' ')));
  }
  return out;
}

// Sous-mots WordPiece → mots, avec la proba MAXIMALE du groupe : si un seul
// morceau est jugé porteur, le mot l'est.
function parMot(tokens) {
  const mots = [];
  for (const t of tokens) {
    const b = String(t.word);
    if (b.startsWith('##') && mots.length) {
      const d = mots[mots.length - 1];
      d.texte += b.slice(2); d.p = Math.max(d.p, pGarder(t)); d.n++;
    } else mots.push({ texte: b, p: pGarder(t), n: 1 });
  }
  return mots;
}

// OPÉRATEURS LOGIQUES — conservation forcée.
//
// Le défaut disqualifiant mesuré ici est l'INVERSION SILENCIEUSE du sens :
// « n'est pas allergique » devient « allergique ». Une liste statique est
// admissible dans ce projet à une condition (voir honorifics.js) : que la
// classe soit FERMÉE. Les négations et connecteurs logiques la remplissent —
// une langue en compte une poignée et n'en invente pas, contrairement aux noms
// ou aux entreprises.
const LOGIQUES = new Set([
  'ne', 'n', 'pas', 'plus', 'jamais', 'aucun', 'aucune', 'ni', 'sans', 'sauf',
  'si', 'mais', 'or', 'donc', 'car', 'toutefois', 'cependant', 'néanmoins',
  'hormis', 'excepté', 'tout', 'toute', 'tous', 'toutes', 'chaque', 'seulement',
  'not', 'no', 'never', 'none', 'neither', 'nor', 'without', 'except', 'unless',
  'if', 'but', 'however', 'although', 'though', 'only', 'all', 'every', 'each',
  'nunca', 'ningún', 'ninguna', 'sin', 'salvo', 'excepto', 'pero', 'aunque',
  'sólo', 'solo', 'todo', 'toda', 'cada',
  'nicht', 'kein', 'keine', 'keinen', 'nie', 'niemals', 'ohne', 'außer',
  'wenn', 'falls', 'aber', 'jedoch', 'obwohl', 'nur', 'alle', 'jeder'
]);
const estLogique = t => LOGIQUES.has(t.toLowerCase().replace(/['’]/g, ''));
// Le crochet ouvrant d'un placeholder flotte autour du seuil (0,42 à 0,80) :
// forcé, sinon « [PERSONNE_1] » ressort « PERSONNE_1] » et ne se réinjecte plus.
const conserve = (m, force) => m.p >= 0.5 || (force && (estLogique(m.texte) || m.texte === '['));

const titre = t => console.log(`\n${'═'.repeat(74)}\n  ${t}\n${'═'.repeat(74)}`);

// ── 1. Survie des placeholders (rédhibitoire) ──────────────────────────────
titre('1. SURVIE DES PLACEHOLDERS — sans elle, plus de réinjection');
const MASQUE = `Le dossier de [PERSONNE_1] a été transmis à [ENTREPRISE_1] le 12 mars.
Merci d'adresser toute correspondance à [EMAIL_1] ou par téléphone au [TELEPHONE_1].
Le virement sera effectué sur le compte [IBAN_1] avant la fin du mois.
[PERSONNE_2], responsable du service, confirmera la réception du dossier.
La réunion se tiendra dans les locaux de [ENTREPRISE_2] à [LIEU_1] la semaine prochaine.`;

const motsM = parMot(await etiqueter(MASQUE));
const attendus = [...MASQUE.matchAll(/\[[A-Z_]+_\d+\]/g)].map(m => m[0]);
for (const force of [false, true]) {
  const garde = motsM.filter(m => conserve(m, force)).map(m => m.texte).join('');
  const intacts = attendus.filter(ph => garde.includes(ph)).length;
  console.log(`  ${force ? 'crochet forcé  ' : 'seuil naturel  '} ${intacts}/${attendus.length} placeholders intacts`);
}

// ── 2. Taux de compression, au token du modèle ─────────────────────────────
titre('2. COMPRESSION — mesurée au TOKEN, pas au caractère');
console.log('\ndocument              langue   tokens   gardés    ratio   mots gardés');
console.log('─'.repeat(74));
for (const [nom, langue] of [['rapport-fr.txt', 'fr'], ['certificat-fr.txt', 'fr'],
                             ['dossier-rh.txt', 'fr'], ['email-pro-en.txt', 'en']]) {
  const chemin = join(RACINE, 'tests/bench/corpus', nom);
  if (!existsSync(chemin)) { console.log(`  (absent) ${nom}`); continue; }
  const brut = await etiqueter(readFileSync(chemin, 'utf8'));
  const mots = parMot(brut);
  const gardes = mots.filter(m => conserve(m, true));
  const t = gardes.reduce((s, m) => s + m.n, 0);
  console.log(`${nom.padEnd(22)} ${langue.padEnd(8)} ${String(brut.length).padStart(5)} ` +
    `${String(t).padStart(8)}    ×${(brut.length / t).toFixed(2)}   ${gardes.length}/${mots.length}`);
}

// ── 3. Inversion de sens, et la parade ─────────────────────────────────────
titre('3. INVERSION DU SENS — le défaut disqualifiant, et sa parade');
const PIEGES = [
  ['négation + exception', "La demande a été refusée, sauf si le dossier est complété avant le 3 mai."],
  ['négation médicale', "Le patient n'est pas allergique à la pénicilline mais l'est aux sulfamides."],
  ['double négation', "Le contrat ne prévoit pas de clause de non-concurrence pour ce poste."],
  ['interdiction', "Il ne faut jamais transmettre ce document sans l'accord écrit du responsable."],
  ['conditionnel EN', "The refund is not available unless the request is filed within 30 days."],
  ['négation DE', "Der Vertrag enthält keine Wettbewerbsklausel, aber eine Geheimhaltungspflicht."]
];
let avecT = 0, sansT = 0;
for (const [quoi, p] of PIEGES) {
  const mots = parMot(await pipe(p));
  const sans = mots.filter(m => conserve(m, false));
  const avec = mots.filter(m => conserve(m, true));
  sansT += sans.reduce((s, m) => s + m.n, 0);
  avecT += avec.reduce((s, m) => s + m.n, 0);
  console.log(`\n── ${quoi}\n   original : ${p}`);
  console.log(`   SANS     : ${sans.map(m => m.texte).join(' ')}`);
  console.log(`   AVEC     : ${avec.map(m => m.texte).join(' ')}`);
}
console.log(`\n  Coût de la parade : ${sansT} → ${avecT} tokens (+${Math.round((avecT / sansT - 1) * 100)} %)`);
console.log('═'.repeat(74));
