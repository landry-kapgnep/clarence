// Le dépôt PUBLIÉ fonctionne-t-il, tel qu'un utilisateur le recevra ?
//
//     node tools/verifier-publication.mjs
//
// POURQUOI SÉPARÉ DES AUTRES VÉRIFICATIONS. `verifier-conversion.mjs` charge
// les poids depuis un dossier LOCAL : il valide le modèle, jamais sa
// publication. Or entre les deux il reste tout ce qui peut casser sans que le
// modèle y soit pour rien — un dépôt privé, un fichier oublié au téléversement,
// une disposition que Transformers.js ne sait pas lire (il attend le tokenizer
// à la RACINE et les poids dans `onnx/`), une licence absente de la fiche.
//
// Ce script part donc d'un cache VIDE et télécharge depuis huggingface.co,
// exactement comme le fera l'extension au premier lancement.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline, env } from '@xenova/transformers';
import { compresser, COMPRESSION_MODEL, MOTS_PAR_LOT } from '../src/engine/compression.js';

console.log(`dépôt : ${COMPRESSION_MODEL}\n`);

// ── 1. Métadonnées : public, et surtout SOUS LICENCE ───────────────────────
//
// Un dépôt sans `license:` dans sa fiche est réputé « tous droits réservés » —
// c'est précisément le défaut de la conversion communautaire qu'on a écartée.
// Publier la nôtre sans licence déclarée referait le problème qu'on corrige,
// et ça ne se voit nulle part ailleurs qu'ici.
const meta = await (await fetch(`https://huggingface.co/api/models/${COMPRESSION_MODEL}`)).json();
const licence = meta.cardData?.license;
console.log(`  accès    ${meta.private === false ? '✔ public' : '✘ PRIVÉ — l\'extension ne pourra pas le lire'}`);
console.log(`  licence  ${licence === 'apache-2.0' ? '✔ apache-2.0' : `✘ ${licence ?? 'AUCUNE'} — attendu apache-2.0`}`);

// Transformers.js lit le tokenizer à la racine et les poids dans onnx/.
const REQUIS = ['config.json', 'tokenizer.json', 'tokenizer_config.json',
                'onnx/model_quantized.onnx', 'NOTICE'];
const presents = new Set((meta.siblings || []).map(s => s.rfilename));
const manquants = REQUIS.filter(f => !presents.has(f));
console.log(`  fichiers ${manquants.length ? '✘ manquants : ' + manquants.join(', ') : '✔ tous présents'}`);

// ── 2. Chargement depuis un cache VIDE ─────────────────────────────────────
const cache = mkdtempSync(join(tmpdir(), 'clarence-pub-'));
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.cacheDir = cache;

console.log('\n  téléchargement depuis huggingface.co (179 Mo)…');
const t0 = Date.now();
const pipe = await pipeline('token-classification', COMPRESSION_MODEL, { quantized: true });
console.log(`  ✔ chargé en ${((Date.now() - t0) / 1000).toFixed(1)} s`);

// ── 3. Le moteur réel, sur le cas qui ne pardonne pas ──────────────────────
const pGarder = o => (o.entity === 'LABEL_1' ? o.score : 1 - o.score);
const adapteur = async (texte) => {
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

// Taux 0,1 : la compression la plus agressive possible. Les placeholders
// doivent survivre QUAND MÊME — sans eux la réinjection est morte, et la
// panne serait invisible puisqu'on ne relit pas un texte compressé.
const TEXTE = `Le dossier de [PERSONNE_1] a été transmis à [ENTREPRISE_1] le 12 mars.
Merci d'adresser toute correspondance à [EMAIL_1] ou par téléphone au [TELEPHONE_1].
[PERSONNE_2] confirmera la réception. Le patient n'est pas allergique à la pénicilline.`;
const attendus = [...TEXTE.matchAll(/\[[A-Z_]+_\d+\]/g)].map(m => m[0]);
const r = await compresser(TEXTE, adapteur, { taux: 0.1 });
const intacts = attendus.filter(p => r.texte.includes(p));

console.log(`\n  placeholders  ${intacts.length}/${attendus.length} intacts au taux 0,1 ${intacts.length === attendus.length ? '✔' : '✘'}`);
console.log(`  négation      ${/\bpas\b/.test(r.texte) ? '✔ « pas » conservé' : '✘ « pas » PERDU — sens inversé'}`);
console.log(`  compression   ${r.motsAvant} → ${r.motsApres} mots`);
console.log(`  sans score    ${r.motsSansScore} ${r.motsSansScore === 0 ? '✔' : '⚠ des mots n\'ont pas été notés'}`);
console.log(`\n  sortie : ${r.texte}`);

rmSync(cache, { recursive: true, force: true });

const ok = meta.private === false && licence === 'apache-2.0' && !manquants.length
  && intacts.length === attendus.length && /\bpas\b/.test(r.texte);
console.log('\n' + (ok ? '✔ Le dépôt publié est utilisable en l\'état.'
                       : '✘ Voir les ✘ ci-dessus avant de livrer.'));
process.exit(ok ? 0 : 1);
