// SPIKE LLMLingua-2 - compression de prompt par modèle, exécutée côté client.
//
// `npm run spike:llmlingua2`
//
// Pourquoi ce spike. La mesure du 09/08 a montré qu'il n'y a aucun gain en
// tokens du côté du texte : la conversion Markdown rend −1 %, les en-têtes
// répétés 1 %, le sommaire 1 % (voir docs/notes-techniques.md). LLMLingua-2 est le seul levier
// d'un ordre de grandeur supérieur qu'ait donné la recherche.
//
// Le modèle. `microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank`,
// Apache 2.0 - même architecture et même tâche (classification de tokens) que
// notre moteur BERT de repli, donc le worker existant saurait l'héberger. Il est
// EXTRACTIF : il ne peut que supprimer des mots, jamais en écrire, donc aucune
// hallucination possible (contrairement à un résumé par LLM).
//
// Le dépôt officiel n'a PAS de poids ONNX ; on passe par une conversion
// communautaire dont la fiche ne déclare aucune licence. Développer avec, oui ;
// publier avec, non - voir docs/spike-llmlingua2.md.
//
// Label_1 = « garder ». La config n'a pas d'id2label : identifié par sonde, en
// vérifiant que les mots pleins reçoivent label_1 et les mots outils label_0.
//
// CE SCRIPT EXERCE LE MOTEUR RÉEL (src/engine/compression.js), pas une logique
// parallèle : deux implémentations « identiques » finissent toujours par
// diverger, et ce projet l'a payé deux fois (leçon P1bis).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline, env } from '@xenova/transformers';
import { compresser, motsDuTexte, estIntouchable } from '../../src/engine/compression.js';

const ici = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ici, '..', '..');
env.allowLocalModels = false;
env.cacheDir = join(RACINE, 'tests/bench/.modeles/hf');

const MODELE = 'ldenoue/llmlingua-2-bert-base-multilingual-cased-meetingbank';
console.error(`[chargement de ${MODELE}…]`);
const pipe = await pipeline('token-classification', MODELE, { quantized: true });

const pGarder = o => (o.entity === 'LABEL_1' ? o.score : 1 - o.score);

// Adaptateur vers le contrat du moteur : (texte) => [{ mot, garder }].
//
// Deux pièges, tous deux silencieux, tous deux mesurés ici :
//
// 1. Le modèle plafonne à 512 positions, pas 512 mots. En français un mot pèse
//    souvent 2 à 3 sous-mots : au-delà, le pipeline tronque sans rien dire.
//
// 2. Le pipeline OMET des tokens de sa sortie - vérifié sur le champ `index`,
//    qui saute (…6, 7, 9, 10…) : les tirets cadratins et quelques symboles
//    disparaissent. Un alignement par curseur sur ce flux troué se désynchronise
//    et ne s'en remet jamais. Conséquence observée avant correction : la moitié
//    des mots d'un document sans score, donc conservés par sécurité, donc aucune
//    compression - en silence.
//
// On retokenise donc soi-même pour obtenir le flux complet, et on y recolle les
// scores par `index`. Les tokens absents reçoivent 0 : s'ils accompagnent
// d'autres tokens du même mot, le maximum les ignore ; s'ils sont seuls (un
// tiret), les jeter est le bon comportement.
const MOTS_PAR_LOT = 120;

const adapte = async (texte) => {
  const mots = texte.split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < mots.length; i += MOTS_PAR_LOT) {
    const morceau = mots.slice(i, i + MOTS_PAR_LOT).join(' ');
    const enc = await pipe.tokenizer(morceau);
    const ids = Array.from(enc.input_ids.data, Number);
    const tous = pipe.tokenizer.model.convert_ids_to_tokens(ids);
    const scores = new Map();
    for (const o of await pipe(morceau)) scores.set(o.index, pGarder(o));
    // On saute [CLS] (0) et [SEP] (dernier) : ils ne couvrent aucun caractère.
    for (let k = 1; k < tous.length - 1; k++) {
      out.push({ mot: tous[k], garder: scores.get(k) ?? 0 });
    }
  }
  return out;
};

// Compression brute, sans aucune des protections du moteur : c'est le témoin
// qui montre ce que le modèle ferait laissé seul.
const brute = async (texte) => {
  const tokens = await adapte(texte);
  const mots = [];
  for (const t of tokens) {
    const b = String(t.mot);
    if (b.startsWith('##') && mots.length) {
      const d = mots[mots.length - 1];
      d.texte += b.slice(2); d.p = Math.max(d.p, t.garder);
    } else mots.push({ texte: b, p: t.garder });
  }
  return mots.filter(m => m.p >= 0.5).map(m => m.texte).join(' ');
};

const titre = t => console.log(`\n${'═'.repeat(74)}\n  ${t}\n${'═'.repeat(74)}`);

// ── 1. Survie des placeholders (rédhibitoire) ──────────────────────────────
titre('1. SURVIE DES PLACEHOLDERS — sans elle, plus de réinjection');
const MASQUE = `Le dossier de [PERSONNE_1] a été transmis à [ENTREPRISE_1] le 12 mars.
Merci d'adresser toute correspondance à [EMAIL_1] ou par téléphone au [TELEPHONE_1].
Le virement sera effectué sur le compte [IBAN_1] avant la fin du mois.
[PERSONNE_2], responsable du service, confirmera la réception du dossier.
La réunion se tiendra dans les locaux de [ENTREPRISE_2] à [LIEU_1] la semaine prochaine.`;

const attendus = [...MASQUE.matchAll(/\[[A-Z_]+_\d+\]/g)].map(m => m[0]);
const sansProtection = await brute(MASQUE);
console.log(`  modèle SEUL          ${attendus.filter(p => sansProtection.includes(p)).length}/${attendus.length} placeholders intacts`);
// Taux 0,1 : on demande la compression la plus agressive possible. Les
// placeholders doivent survivre quand même - c'est tout l'objet de la garde.
const viaMoteur = await compresser(MASQUE, adapte, { taux: 0.1 });
console.log(`  moteur, taux 0,1     ${attendus.filter(p => viaMoteur.texte.includes(p)).length}/${attendus.length} placeholders intacts`);
console.log(`\n  sortie : ${viaMoteur.texte}`);

// ── 2. Taux de compression sur de vrais documents ──────────────────────────
titre('2. COMPRESSION — le taux est CHOISI, pas subi');
console.log('\ndocument              langue   taux    mots        tokens estimés');
console.log('─'.repeat(74));
for (const [nom, langue] of [['rapport-fr.txt', 'fr'], ['certificat-fr.txt', 'fr'],
                             ['dossier-rh.txt', 'fr'], ['email-pro-en.txt', 'en']]) {
  const chemin = join(RACINE, 'tests/bench/corpus', nom);
  if (!existsSync(chemin)) { console.log(`  (absent) ${nom}`); continue; }
  const texte = readFileSync(chemin, 'utf8');
  for (const taux of [0.5, 0.3]) {
    const r = await compresser(texte, adapte, { taux });
    console.log(`${(taux === 0.5 ? nom : '').padEnd(22)} ${(taux === 0.5 ? langue : '').padEnd(8)} ` +
      `${taux.toFixed(1)}   ${String(r.motsApres).padStart(4)}/${String(r.motsAvant).padEnd(5)} ` +
      `${String(r.tokensAvant).padStart(6)} → ${String(r.tokensApres).padStart(5)}  ×${(r.tokensAvant / r.tokensApres).toFixed(2)}` +
      (r.motsSansScore ? `   ⚠ ${r.motsSansScore} mots sans score` : ''));
  }
}

// ── 3. Inversion de sens : le modèle seul contre le moteur ─────────────────
titre('3. INVERSION DU SENS — le défaut disqualifiant, et la garde du moteur');
const PIEGES = [
  ['négation + exception', "La demande a été refusée, sauf si le dossier est complété avant le 3 mai."],
  ['négation médicale', "Le patient n'est pas allergique à la pénicilline mais l'est aux sulfamides."],
  ['double négation', "Le contrat ne prévoit pas de clause de non-concurrence pour ce poste."],
  ['interdiction', "Il ne faut jamais transmettre ce document sans l'accord écrit du responsable."],
  ['conditionnel EN', "The refund is not available unless the request is filed within 30 days."],
  ['négation DE', "Der Vertrag enthält keine Wettbewerbsklausel, aber eine Geheimhaltungspflicht."]
];
for (const [quoi, p] of PIEGES) {
  const sans = await brute(p);
  const avec = await compresser(p, adapte, { taux: 0.5 });
  console.log(`\n── ${quoi}\n   original      : ${p}`);
  console.log(`   modèle seul   : ${sans}`);
  console.log(`   via le moteur : ${avec.texte}`);
}
console.log(`\n${'═'.repeat(74)}`);
