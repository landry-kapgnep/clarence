// Ce qu'on peut dire d'un candidat sans le modèle : la matière première du
// filtre de précision.
//
// Les signaux sont individuellement faibles (« acoustique » se fragmente en
// trois morceaux comme « Mesnard », « Sorbonne » n'en fait qu'un) ; les
// combiner est ce qu'un classifieur fait mieux qu'une suite de `if`.
//
// Ce module ne décide rien et ne charge rien, il rend des nombres. La décision
// vit dans precision.js, les poids sont appris hors ligne. C'est la leçon
// d'`encodeImage` : la décision sortie en fonction pure est celle qu'on peut
// tester.
//
// Chaque caractéristique a été choisie pour ne PAS dépendre d'une langue :
// casse, longueur, nombre de mots, chiffres, ponctuation interne, occurrences.
// « Le même mot apparaît-il ailleurs en minuscules dans ce document ? » est
// auto-calibré, le document servant de dictionnaire à lui-même. Seuls les
// suffixes sont propres au français, isolés dans leur propre caractéristique
// pour qu'on puisse mesurer ce qu'ils apportent.
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

// Contexte du document entier, calculé une fois pour toutes.
//
// Deux des caractéristiques les plus utiles ne peuvent PAS se lire sur le
// candidat seul : combien de fois il revient, et si ses mots apparaissent
// ailleurs en minuscules. C'est la raison pour laquelle le filtre se branche au
// niveau de `anonymizeUnits` et pas dans `detectGliner`, qui ne voit qu'une
// unité à la fois.
//
// `sousMots` (optionnel) : vocabulaire de sous-mots (WordPiece) permettant de
// mesurer la fragmentation. Injecté plutôt qu'importé - il pèse ~1 Mo, et on ne
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

// Nombre de morceaux WordPiece d'un mot, par segmentation gloutonne. Un mot
// connu du vocabulaire fait 1 morceau, un mot inventé se casse en plusieurs.
//
// Signal faible, et c'est pour ça qu'il est ici plutôt que dans une règle :
// « Semantikmatch » 5 morceaux contre « terrain » 1, mais aussi « acoustique »
// 3 (nom commun) contre « Sorbonne » 1 (nom propre). Il informe, il ne tranche
// pas.
//
// NE PAS MINUSCULISER, piège commis puis mesuré. Le vocabulaire est cased :
// « Unternehmen » y figure, « unternehmen » non. Minusculiser avant de
// segmenter rendait 2 morceaux pour le mot allemand le plus banal, donc
// mesurait la casse au lieu de la rareté.
//
// On segmente trois formes (surface, minuscule, capitale initiale) et on garde
// le minimum. La troisième n'est pas un luxe : « SPRACHEN » ne retrouve que
// « Sprachen », et les intitulés en capitales sont justement là où le
// sur-masquage se concentre.
function segmenter(mot, sousMots) {
  let i = 0, n = 0;
  while (i < mot.length) {
    let j = mot.length;
    let trouve = null;
    while (j > i) {
      const piece = i === 0 ? mot.slice(i, j) : '##' + mot.slice(i, j);
      if (sousMots.has(piece)) { trouve = j; break; }
      j--;
    }
    // Inconnu jusqu'au caractère près : le tokenizer rendrait [UNK]. On compte
    // le maximum, c'est le cas le plus « étranger au vocabulaire » possible.
    if (trouve === null) return mot.length;
    n++;
    i = trouve;
  }
  return n || 1;
}

export function morceaux(mot, sousMots) {
  if (!sousMots) return 1;
  const brut = String(mot || '');
  if (!brut) return 1;
  const bas = brut.toLowerCase();
  const titre = bas[0].toUpperCase() + bas.slice(1);
  let mini = segmenter(brut, sousMots);
  for (const forme of [bas, titre]) {
    if (forme === brut) continue;
    mini = Math.min(mini, segmenter(forme, sousMots));
    if (mini === 1) break;
  }
  return mini;
}

// L'ordre des clés fait foi. Les poids appris sont un tableau de nombres aligné
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
  // un intitulé de rubrique, pas une identité. Échelle logarithmique - passer
  // de 1 à 3 occurrences en dit bien plus que de 30 à 32.
  const occ = Math.max(...mots.map(m => ctx.comptes.get(m.toLowerCase()) || 1), 1);

  const morceauxMoyens = ctx.sousMots && n
    ? mots.reduce((s, m) => s + morceaux(m, ctx.sousMots), 0) / n
    : 1;

  return {
    // - ce que dit le vocabulaire -
    partLexique: part(nbLexique, n),
    partSuffixe: part(nbSuffixe, n),
    aucunCourant: n && nbLexique + nbSuffixe === 0 ? 1 : 0,
    // - ce que dit la forme -
    toutCapitales: valeur === valeur.toUpperCase() && /\p{Lu}/u.test(valeur) ? 1 : 0,
    casseDeTitre: n && mots.every(m => /^\p{Lu}/u.test(m)) ? 1 : 0,
    aChiffre: /\d/.test(valeur) ? 1 : 0,
    liaisonInterne: LIAISON.test(valeur) ? 1 : 0,
    nbMots: borne(n, 5),
    longueur: borne(valeur.length, 40),
    fragmentation: borne(morceauxMoyens - 1, 3),
    // - ce que dit le document -
    occurrences: borne(Math.log1p(occ - 1), Math.log1p(19)),
    minusculeAilleurs: part(nbMinusculeAilleurs, n),
    // - ce que dit le modèle -
    // En dernier, et volontairement : mesuré sur un vrai CV, le score seul ne
    // sépare rien (vraies 0,738 · fausses 0,648, et le meilleur score du
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
