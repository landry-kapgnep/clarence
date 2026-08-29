// Ce qu'on peut dire d'un candidat SANS le modèle — la matière première du
// filtre de précision.
//
// POURQUOI CE MODULE EXISTE. `vocabulaire.js` est un filtre à UNE
// caractéristique et à seuil binaire : « tous les mots sont-ils au
// dictionnaire ? ». Il attrape 6 faux positifs sur 9 et il a fallu lui retirer
// cinq suffixes parce qu'ils mordaient sur des noms de lieux — signe qu'une
// règle écrite à la main atteint sa limite. Les signaux qui restent sont
// individuellement FAIBLES (mesuré : « acoustique » se fragmente en 3 morceaux
// comme « Kapgnep », et « Sorbonne » n'en fait qu'un) ; les combiner est
// précisément ce qu'un classifieur fait mieux qu'une suite de `if`.
//
// RÈGLE DE CONCEPTION : ce module ne décide RIEN et ne charge RIEN. Il rend des
// nombres. La décision vit dans precision.js, les poids sont appris hors ligne.
// C'est la leçon d'`encodeImage` (fond des PNG rendu noir) : la décision sortie
// en fonction pure est celle qu'on peut tester.
//
// INDÉPENDANCE DE LA LANGUE — c'est le critère qui a présidé au choix de chaque
// caractéristique, parce que des listes statiques par langue ne passent pas
// l'échelle :
//   · le lexique est déjà multilingue (104 langues, vocabulaire mBERT) ;
//   · la casse, la longueur, le nombre de mots, les chiffres, la ponctuation
//     interne, les occurrences ne dépendent d'aucune langue ;
//   · « le même mot apparaît-il ailleurs en minuscules DANS CE DOCUMENT ? » est
//     auto-calibré : le document sert de dictionnaire à lui-même ;
//   · la fragmentation en sous-mots se mesure sur un vocabulaire multilingue ;
//   · seuls les SUFFIXES sont propres au français, et ils sont isolés dans leur
//     propre caractéristique pour qu'on puisse mesurer ce qu'ils apportent — et
//     s'en passer le jour où la mesure dit qu'ils ne servent plus.
import { auLexique, aSuffixeCommun, motsSignificatifs } from './vocabulaire.js';

// Bornage : toutes les caractéristiques vivent dans [0, 1]. Sans ça, une
// longueur en caractères pèserait mécaniquement cent fois plus qu'un booléen
// dans une régression, et les poids appris seraient illisibles.
const borne = (x, max) => Math.min(Math.max(x, 0), max) / max;
const part = (n, total) => (total ? n / total : 0);

// Ponctuation de LIAISON : « Développement & Web », « Outils & Systèmes »,
// « Python · Docker ». Un nom propre unique en porte rarement ; une rubrique de
// CV, très souvent. Signal purement typographique, donc sans langue.
const LIAISON = /[&·•/|—–+]/;

// Contexte du DOCUMENT ENTIER, calculé une fois pour toutes.
//
// Deux des caractéristiques les plus utiles ne peuvent PAS se lire sur le
// candidat seul : combien de fois il revient, et si ses mots apparaissent
// ailleurs en minuscules. C'est la raison pour laquelle le filtre se branche au
// niveau de `anonymizeUnits` et pas dans `detectGliner`, qui ne voit qu'une
// unité à la fois.
//
// `sousMots` (optionnel) : vocabulaire de sous-mots (WordPiece) permettant de
// mesurer la fragmentation. Injecté plutôt qu'importé — il pèse ~1 Mo, et on ne
// paie ce poids que si la mesure prouve qu'il gagne sa place.
export function contexteDocument(texte, { sousMots } = {}) {
  const brut = String(texte || '');
  const enMinuscules = new Set();
  const comptes = new Map();
  for (const m of brut.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []) {
    const bas = m.toLowerCase();
    comptes.set(bas, (comptes.get(bas) || 0) + 1);
    // « Minuscule » au sens strict : première lettre non capitale. Un mot en
    // début de phrase ne compte donc pas comme preuve de nom commun.
    if (m[0] === bas[0]) enMinuscules.add(bas);
  }
  return { enMinuscules, comptes, sousMots };
}

// Nombre de morceaux WordPiece d'un mot, par segmentation gloutonne — le même
// algorithme que le tokenizer du modèle. Un mot connu du vocabulaire fait 1
// morceau ; un mot inventé se casse en plusieurs.
//
// ⚠️ SIGNAL FAIBLE, MESURÉ COMME TEL, et c'est pour ça qu'il est ici plutôt que
// dans une règle : « Semantikmatch » 5 morceaux et « SafePrompt » 4 contre
// « terrain » 1 — mais aussi « acoustique » 3 et « bénévole » 3 (noms communs)
// contre « Sorbonne » 1 (nom propre). Il informe, il ne tranche pas.
export function morceaux(mot, sousMots) {
  if (!sousMots) return 1;
  const bas = String(mot || '').toLowerCase();
  if (!bas) return 1;
  let i = 0, n = 0;
  while (i < bas.length) {
    let j = bas.length;
    let trouve = null;
    while (j > i) {
      const piece = i === 0 ? bas.slice(i, j) : '##' + bas.slice(i, j);
      if (sousMots.has(piece)) { trouve = j; break; }
      j--;
    }
    // Inconnu jusqu'au caractère près : le tokenizer rendrait [UNK]. On compte
    // le maximum, c'est le cas le plus « étranger au vocabulaire » possible.
    if (trouve === null) return bas.length;
    n++;
    i = trouve;
  }
  return n || 1;
}

// L'ORDRE DES CLÉS FAIT FOI. Les poids appris sont un tableau de nombres aligné
// sur `NOMS_CARACTERISTIQUES` ; réordonner cet objet sans réentraîner
// appliquerait le poids du lexique à la casse, silencieusement. Le test unitaire
// verrouille cet ordre.
export function caracteristiques(candidat, ctx) {
  const valeur = String(candidat?.value ?? '');
  const mots = motsSignificatifs(valeur);
  const n = mots.length;

  const nbLexique = mots.filter(auLexique).length;
  const nbSuffixe = mots.filter(m => !auLexique(m) && aSuffixeCommun(m)).length;
  const nbMinusculeAilleurs = mots.filter(m => ctx.enMinuscules.has(m.toLowerCase())).length;

  // Occurrences : la valeur la plus répétée d'un document est presque toujours
  // un intitulé de rubrique, pas une identité. Échelle logarithmique — passer
  // de 1 à 3 occurrences en dit bien plus que de 30 à 32.
  const occ = Math.max(...mots.map(m => ctx.comptes.get(m.toLowerCase()) || 1), 1);

  const morceauxMoyens = ctx.sousMots && n
    ? mots.reduce((s, m) => s + morceaux(m, ctx.sousMots), 0) / n
    : 1;

  return {
    // — ce que dit le vocabulaire —
    partLexique: part(nbLexique, n),
    partSuffixe: part(nbSuffixe, n),
    aucunCourant: n && nbLexique + nbSuffixe === 0 ? 1 : 0,
    // — ce que dit la forme —
    toutCapitales: valeur === valeur.toUpperCase() && /\p{Lu}/u.test(valeur) ? 1 : 0,
    casseDeTitre: n && mots.every(m => /^\p{Lu}/u.test(m)) ? 1 : 0,
    aChiffre: /\d/.test(valeur) ? 1 : 0,
    liaisonInterne: LIAISON.test(valeur) ? 1 : 0,
    nbMots: borne(n, 5),
    longueur: borne(valeur.length, 40),
    fragmentation: borne(morceauxMoyens - 1, 3),
    // — ce que dit le document —
    occurrences: borne(Math.log1p(occ - 1), Math.log1p(19)),
    minusculeAilleurs: part(nbMinusculeAilleurs, n),
    // — ce que dit le modèle —
    // En dernier, et volontairement : mesuré sur un vrai CV, le score seul ne
    // sépare RIEN (vraies 0,738 · fausses 0,648, et le meilleur score du
    // document est un faux positif). Il n'a sa place qu'en compagnie des autres.
    score: borne(Number(candidat?.score) || 0, 1)
  };
}

export const NOMS_CARACTERISTIQUES = Object.keys(
  caracteristiques({ value: 'x', score: 0 }, contexteDocument(''))
);

export const vecteur = (candidat, ctx) => {
  const c = caracteristiques(candidat, ctx);
  return NOMS_CARACTERISTIQUES.map(k => c[k]);
};
