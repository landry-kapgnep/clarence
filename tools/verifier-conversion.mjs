// Notre conversion produit-elle le MÊME TEXTE que celle qu'elle remplace ?
//
//     node tools/verifier-conversion.mjs
//
// POURQUOI CE SCRIPT EXISTE. Une conversion qui CHARGE ne prouve rien : si elle
// notait les mots différemment, la compression changerait de comportement en
// silence — et personne ne le verrait, puisqu'on ne relit jamais un texte
// compressé (c'est la contrepartie assumée de la fonction).
//
// CE QU'ON MESURE, ET POURQUOI PAS AUTRE CHOSE. Une première version comparait
// les probabilités brutes et exigeait un écart maximal de 0,05. C'était un
// seuil INVENTÉ : deux quantifications int8 indépendantes du même modèle ne
// s'accordent jamais à ce point, et le script criait au loup pour du bruit
// numérique sans conséquence.
//
// Le seul critère qui compte est celui que l'utilisateur voit : le TEXTE
// COMPRESSÉ. On fait donc tourner le VRAI moteur (src/engine/compression.js)
// avec chaque modèle et on compare les sorties mot à mot. Les scores restent
// affichés, mais à titre indicatif.
//
// La fidélité au modèle d'origine, elle, se mesure ailleurs et contre la seule
// référence qui fasse autorité : tools/verifier-fidelite.py compare chaque
// conversion au PyTorch de Microsoft.
//
// À REJOUER si on reconvertit un jour (nouvelle version d'optimum, autre opset,
// autre recette de quantification).
import { join } from 'node:path';
import { pipeline, env } from '@xenova/transformers';
import { compresser, MOTS_PAR_LOT } from '../src/engine/compression.js';

const RACINE = join(import.meta.dirname, '..');
env.cacheDir = join(RACINE, 'tests/bench/.modeles/hf');

const ANCIEN = 'ldenoue/llmlingua-2-bert-base-multilingual-cased-meetingbank';
const NOTRE = 'llmlingua2-onnx';   // tools/llmlingua2-onnx/, produit par convertir-llmlingua2.py

const TEXTES = [
  // français accentué + placeholders : le cas qui compte pour nous
  "Le rapport de [PERSONNE_1] indique que la réunion du 14 mars s'est tenue à [VILLE_2] en présence des associés de [ENTREPRISE_3], qui ont validé le budget prévisionnel de l'exercice à venir.",
  // négation : le cas où une divergence serait silencieuse ET irrattrapable
  "Le patient n'est pas allergique à la pénicilline mais l'est aux sulfamides, et aucun traitement de substitution n'a été prescrit à ce jour.",
  // anglais : la langue d'entraînement du modèle (MeetingBank)
  "The committee reviewed the quarterly report and unanimously approved the proposed amendment to the housing ordinance, subject to a final legal review.",
];

const pGarder = o => (o.entity === 'LABEL_1' ? o.score : 1 - o.score);

// Même adaptateur que le worker : on retokenise soi-même pour obtenir le flux
// COMPLET, parce que le pipeline OMET des tokens de sa sortie (voir le
// commentaire détaillé dans tests/spike-llmlingua2/run.mjs).
const adapteur = (pipe) => async (texte) => {
  const mots = texte.split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < mots.length; i += MOTS_PAR_LOT) {
    const morceau = mots.slice(i, i + MOTS_PAR_LOT).join(' ');
    const enc = await pipe.tokenizer(morceau);
    const tous = pipe.tokenizer.model.convert_ids_to_tokens(Array.from(enc.input_ids.data, Number));
    const scores = new Map();
    for (const o of await pipe(morceau)) scores.set(o.index, pGarder(o));
    for (let k = 1; k < tous.length - 1; k++) out.push({ mot: tous[k], garder: scores.get(k) ?? 0 });
  }
  return out;
};

async function charger(id, local) {
  env.allowLocalModels = local;
  env.allowRemoteModels = !local;
  if (local) env.localModelPath = join(RACINE, 'tools');
  return pipeline('token-classification', id, { quantized: true });
}

console.error(`[chargement de ${ANCIEN} …]`);
const ancien = adapteur(await charger(ANCIEN, false));
console.error('[chargement de NOTRE conversion (locale) …]');
const notre = adapteur(await charger(NOTRE, true));

let identiques = 0, differents = 0;
for (const taux of [0.5, 0.3]) {
  console.log(`\n── taux ${taux} ${'─'.repeat(40)}`);
  for (const texte of TEXTES) {
    const a = await compresser(texte, ancien, { taux });
    const b = await compresser(texte, notre, { taux });
    const memeTexte = a.texte === b.texte;
    memeTexte ? identiques++ : differents++;
    console.log(`\n  « ${texte.slice(0, 52)}… »`);
    if (memeTexte) {
      console.log(`  ✔ sorties identiques (${a.motsApres}/${a.motsAvant} mots)`);
    } else {
      console.log(`  ⚠ sorties différentes`);
      console.log(`    ancien : ${a.texte}`);
      console.log(`    nôtre  : ${b.texte}`);
      // Quels mots exactement ? C'est ce qui dit si l'écart est anodin.
      const ma = new Set(a.texte.split(/\s+/)), mb = new Set(b.texte.split(/\s+/));
      const seulA = [...ma].filter(m => !mb.has(m)), seulB = [...mb].filter(m => !ma.has(m));
      if (seulA.length) console.log(`    seulement chez l'ancien : ${seulA.join(' · ')}`);
      if (seulB.length) console.log(`    seulement chez nous     : ${seulB.join(' · ')}`);
    }
  }
}

console.log('\n' + '═'.repeat(56));
console.log(`sorties identiques   ${identiques}/${identiques + differents}`);
console.log(differents === 0
  ? '\n✔ Les deux conversions produisent le même texte : interchangeables.'
  : "\n⚠ Des sorties diffèrent. Ce n'est pas rédhibitoire en soi (deux\n" +
    "  quantifications int8 ne sont jamais bit-à-bit identiques), mais il faut\n" +
    "  regarder les mots ci-dessus : perdre un opérateur logique ou un\n" +
    '  placeholder serait, lui, disqualifiant.');
