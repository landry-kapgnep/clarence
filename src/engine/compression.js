// Compression de prompt — supprime les mots peu porteurs pour réduire le coût
// en tokens du texte collé dans un LLM.
//
// POURQUOI. Mesuré le 09/08 : il n'y a AUCUN gain en tokens du côté du texte
// (conversion Markdown −1 %, en-têtes répétés 1 %, sommaire 1 %). Un modèle de
// compression est le seul levier d'un ordre de grandeur supérieur — ×1,5 à ×5,9
// mesurés au spike (docs/spike-llmlingua2.md).
//
// EXTRACTIF, jamais génératif : on ne peut que SUPPRIMER des mots, jamais en
// écrire. Aucune hallucination possible, contrairement à un résumé par LLM —
// c'est ce qui rend l'idée compatible avec le principe du cadrage §8.
//
// TROIS CONTRAINTES PRODUIT (CLAUDE.md, posées avant tout code) : option
// explicite jamais par défaut, prose appauvrie annoncée, et transformation
// d'EXPORT — on relit le texte masqué, lisible, et la compression ne touche que
// ce qui part au presse-papiers. Ce module ne fait que la transformation ; c'est
// à l'appelant de respecter les deux autres.
//
// LE PIPELINE EST INJECTÉ, comme dans gliner.js et ner.js : le moteur reste
// testable en Node sans charger 170 Mo.

// ── Découpage en MOTS, et pourquoi pas en tokens ───────────────────────────
//
// Le spike a fait l'erreur : décider token par token puis rejoindre par des
// espaces transforme « [PERSONNE_1] » en « [ PERSONNE _ 1 ] », ce qui détruit
// le placeholder qu'on venait justement de conserver.
//
// En décidant au niveau du MOT — une suite de caractères non blancs du texte
// d'origine — un placeholder est UN mot : le garder le garde entier, sans
// aucun recollage. La ponctuation attachée suit le mot, ce qui est le
// comportement voulu (« acceptée. » se garde avec son point).
export function motsDuTexte(texte) {
  const mots = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(texte)) !== null) {
    mots.push({ texte: m[0], debut: m.index, fin: m.index + m[0].length });
  }
  return mots;
}

// ── Opérateurs logiques — conservation FORCÉE ──────────────────────────────
//
// LE DÉFAUT QUE ÇA CORRIGE, et il est disqualifiant sans ça : le modèle
// supprime des mots qui portent toute la polarité de la phrase. Mesuré au
// spike, « Le patient n'est pas allergique à la pénicilline mais l'est aux
// sulfamides » ressortait « patient allergique à pénicilline sulfamides » —
// le LLM lit exactement l'inverse.
//
// C'est le pire cas possible pour cet outil : l'erreur est SILENCIEUSE et
// l'utilisateur ne peut pas la rattraper, puisqu'on ne relit pas un texte
// compressé. Une fuite se voit à la relecture ; une négation retournée, non.
//
// UNE LISTE STATIQUE EST ADMISSIBLE ICI, et seulement parce que la classe est
// FERMÉE — même règle que honorifics.js : une langue compte une poignée de
// négations et de connecteurs et n'en invente pas, contrairement aux noms, aux
// entreprises ou aux technos qu'on refuse catégoriquement de lister.
// NE PAS ÉTENDRE cette liste à des mots « importants » : ce serait rouvrir la
// classe et refaire l'erreur qu'on évite partout ailleurs.
export const OPERATEURS_LOGIQUES = new Set([
  // français
  'ne', 'n', 'pas', 'plus', 'jamais', 'aucun', 'aucune', 'ni', 'sans', 'sauf',
  'si', 'mais', 'or', 'donc', 'car', 'toutefois', 'cependant', 'néanmoins',
  'hormis', 'excepté', 'tout', 'toute', 'tous', 'toutes', 'chaque', 'seulement',
  // anglais
  'not', 'no', 'never', 'none', 'neither', 'nor', 'without', 'except', 'unless',
  'if', 'but', 'however', 'although', 'though', 'only', 'all', 'every', 'each',
  // espagnol
  'nunca', 'ningún', 'ninguna', 'sin', 'salvo', 'excepto', 'pero', 'aunque',
  'sólo', 'solo', 'todo', 'toda', 'cada',
  // allemand
  'nicht', 'kein', 'keine', 'keinen', 'nie', 'niemals', 'ohne', 'außer',
  'wenn', 'falls', 'aber', 'jedoch', 'obwohl', 'nur', 'alle', 'jeder'
]);

// La ponctuation attachée ne doit pas empêcher la reconnaissance : « pas, » est
// une négation. On compare sur les lettres seules.
const PLACEHOLDER = /\[[A-Z_]+_\d+\]/;

export function estOperateurLogique(mot) {
  const nu = String(mot || '').toLowerCase().replace(/[^\p{L}]/gu, '');
  return nu.length > 0 && OPERATEURS_LOGIQUES.has(nu);
}

// Un mot INTOUCHABLE ne peut jamais être supprimé, quel que soit son score.
export function estIntouchable(mot) {
  return PLACEHOLDER.test(mot) || estOperateurLogique(mot);
}

// ── Alignement des tokens du modèle sur les mots ───────────────────────────
//
// Le modèle rend des sous-mots WordPiece (« accept », « ##ée », « . ») qui ne
// coïncident pas avec notre découpage par blancs. On avance donc un curseur :
// on consomme des tokens jusqu'à couvrir le mot courant.
//
// EN CAS DE DÉSYNCHRONISATION on GARDE le mot. C'est le bon sens de l'échec :
// garder coûte quelques tokens, supprimer par erreur peut retourner une phrase.
const nettoie = t => String(t).replace(/^##/, '');

export function scoresParMot(mots, tokens) {
  const scores = new Array(mots.length).fill(null);
  let iTok = 0;
  for (let i = 0; i < mots.length; i++) {
    let couvert = '';
    let max = 0;
    const cible = mots[i].texte;
    while (iTok < tokens.length && couvert.length < cible.length) {
      const t = tokens[iTok++];
      couvert += nettoie(t.mot);
      // Score du groupe = le MAXIMUM : si un seul morceau d'un mot est jugé
      // porteur, le mot l'est. Prendre la moyenne diluerait un mot rare dont
      // seule une syllabe compte.
      if (t.garder > max) max = t.garder;
    }
    // `null` = alignement perdu → l'appelant garde le mot.
    scores[i] = couvert.length ? max : null;
  }
  return scores;
}

// ── Compression ────────────────────────────────────────────────────────────
//
// `taux` est un taux de CONSERVATION visé (0,3 = garder ~30 % des mots), pas un
// seuil brut. Le spike a montré pourquoi : au seuil naturel du modèle, le taux
// est SUBI et varie de ×1,25 à ×5,89 selon le document — sur l'un d'eux il ne
// restait que 47 mots sur 515, ce qui est intenable. L'utilisateur doit choisir
// son compromis, pas le découvrir.
//
// pipeline : (texte) => [{ mot, garder }] où `garder` est la probabilité de
// conservation dans [0,1]. Injecté (voir en-tête).
export async function compresser(texte, pipeline, { taux = 0.5 } = {}) {
  const mots = motsDuTexte(texte);
  if (!mots.length) return resultat(texte, '', mots.length, 0);

  const tokens = pipeline ? await pipeline(texte) : [];
  const scores = scoresParMot(mots, tokens);

  // Les intouchables sont hors classement : ils ne consomment pas le budget et
  // ne peuvent pas en être évincés.
  const candidats = [];
  const garde = new Array(mots.length).fill(false);
  for (let i = 0; i < mots.length; i++) {
    if (estIntouchable(mots[i].texte) || scores[i] === null) garde[i] = true;
    else candidats.push({ i, s: scores[i] });
  }

  const budget = Math.max(0, Math.round(mots.length * taux) - garde.filter(Boolean).length);
  candidats.sort((a, b) => b.s - a.s);
  for (const c of candidats.slice(0, budget)) garde[c.i] = true;

  // Reconstruction : les mots retenus, dans l'ordre, séparés par une espace.
  // C'est ce que produit un texte compressé — et comme un placeholder est UN
  // mot, il ressort intact.
  const retenus = mots.filter((_, i) => garde[i]).map(m => m.texte);
  return resultat(texte, retenus.join(' '), mots.length, retenus.length,
    scores.filter(s => s === null).length);
}

function resultat(avant, apres, motsAvant, motsApres, motsSansScore = 0) {
  return {
    texte: apres,
    motsAvant,
    motsApres,
    // NOMBRE DE MOTS SANS SCORE, remonté exprès. Un mot non aligné est
    // conservé — c'est le bon sens de l'échec — mais si le flux de tokens
    // s'épuise (pipeline qui tronque au-delà de 512 positions, par exemple),
    // TOUT est conservé et la compression ne mord plus, en silence. Sans ce
    // compteur, l'appelant croit compresser et ne compresse rien : exactement
    // le cas rencontré au spike sur un document de 328 mots.
    motsSansScore,
    // Estimation prudente et assumée : ~4 caractères par token. Le cadrage §10
    // impose un ordre de grandeur, jamais un chiffre garanti — le vrai compte
    // dépend du tokeniseur du modèle destinataire, qu'on ne connaît pas.
    tokensAvant: Math.round(avant.length / 4),
    tokensApres: Math.round(apres.length / 4)
  };
}
