// Civilités (M., Mrs, Herr, Sr.…) — source de vérité UNIQUE, partagée par la
// détection déterministe (regex-detect.js) et la pseudonymisation
// (pseudonyms.js). Sans ça les deux divergeaient : le motif regex ne
// connaissait que le français, si bien que « Mr Smith » n'était pas détecté
// en déterministe, pendant que pseudonyms.js avait sa propre liste bricolée.
//
// POURQUOI UNE LISTE STATIQUE EST ACCEPTABLE ICI — et seulement ici.
// Les civilités forment une classe FERMÉE : une langue en compte une poignée
// et n'en invente pas. C'est l'inverse d'une liste de noms, d'entreprises ou
// de technos, qui sont des classes ouvertes et périment aussitôt écrites
// (raison pour laquelle le projet refuse ce genre de liste dans le moteur).
// La liste est donc incomplète en langues, jamais en concepts : ajouter une
// langue est un ajout ponctuel, pas une maintenance continue.
//
// CE QUE LA LISTE NE PEUT PAS SAVOIR, ET COMMENT ON S'EN PROTÈGE.
// « Miss », « Frau », « Don » sont aussi de vrais patronymes. Traiter un
// composant comme une civilité au seul motif qu'il est dans la liste
// laisserait fuir le nom de quelqu'un qui s'appelle réellement Miss.
// D'où `isHonorificAt` : la POSITION tranche, pas la seule appartenance —
// une civilité précède un nom, elle n'est jamais le dernier composant ni le
// seul. « miss Deva » → civilité ; « John Miss » et « Miss » seul →
// patronyme, donc pseudonymisé. En cas de doute, on masque (zéro-fuite).

// Sans point : la comparaison se fait en minuscules, points retirés.
//
// Volontairement ÉCARTÉS, parce qu'un faux positif ici crée une PII fantôme
// ou laisse fuir un vrai nom :
//  - `don`, `dame`, `lord`, `lady`, `pan`, `pani`, `bey`, `sri` : trop souvent
//    de vrais prénoms ;
//  - `fr`, `hr`, `ing`, `rev` : collisions bêtes et fréquentes. `fr` a été
//    essayé et retiré aussitôt — il faisait passer le « .fr » de
//    « monentreprise.fr » pour une civilité, et « Mon IBAN » juste après
//    devenait un nom de personne sur la fixture de référence.
const TERMES = [
  // français
  'm', 'mme', 'mlle', 'monsieur', 'madame', 'mademoiselle',
  'maitre', 'maître', 'docteur', 'professeur',
  // anglais
  'mr', 'mrs', 'ms', 'miss', 'mister', 'madam', 'sir', 'dr', 'prof', 'doctor',
  // espagnol / portugais
  'sr', 'sra', 'srta', 'senor', 'señor', 'senora', 'señora', 'senorita', 'señorita',
  'senhor', 'senhora', 'senhorita',
  // allemand / néerlandais
  'herr', 'frau', 'fraulein', 'fräulein', 'dhr', 'mevr', 'mevrouw',
  // italien
  'sig', 'sigra', 'signor', 'signora', 'signorina', 'dott', 'dottore', 'dottssa',
  // autre
  'pr'
];

// Abréviations dont le POINT EST OBLIGATOIRE dans le texte : trop courtes ou
// trop polysémiques sans lui (« M. Dupont » est une civilité, « M Dupont »
// non ; « Pr. Martin » oui, « PR Manager » non ; « Sr. Garcia » oui, « Sr
// Developer » non). Les formes anglaises Mr/Mrs/Ms/Dr en sont exemptées :
// l'usage britannique les écrit couramment sans point.
const POINT_OBLIGATOIRE = new Set([
  'm', 'pr', 'sr', 'sra', 'srta', 'sig', 'sigra', 'dott', 'dottssa', 'dhr', 'mevr'
]);

export const HONORIFICS = new Set(TERMES);

// Normalise un composant pour la comparaison : minuscules, points retirés.
export const normalizeHonorific = token =>
  String(token).toLowerCase().replace(/\./g, '').trim();

// Un composant est-il une civilité À CETTE POSITION ?
//
// rang / total : position du composant dans le nom complet (0-indexé).
// Une civilité précède toujours un nom : elle n'est ni le dernier composant,
// ni le seul. Cette règle est ce qui protège « Miss » employé comme vrai
// patronyme — voir l'en-tête du fichier.
export function isHonorificAt(token, rang, total) {
  if (total < 2 || rang >= total - 1) return false;
  return HONORIFICS.has(normalizeHonorific(token));
}

// --- Particules nobiliaires et patronymiques -------------------------------
//
// Deuxième classe FERMÉE de composants non identifiants, régie par EXACTEMENT
// la même règle de position que les civilités : « de », « van », « bin » ne
// désignent personne quand ils précèdent un nom, mais « Le » et « Da » sont
// aussi de vrais patronymes. L'appartenance à la liste ne suffit donc jamais.
//
// Vivait en local dans `pseudonyms.js`. Sortie ici quand `identity.js` en a eu
// besoin à son tour : deux copies d'une même liste finissent toujours par
// diverger, et ce projet l'a déjà payé deux fois (leçon P1bis).
export const PARTICULES = new Set([
  'de', 'du', 'des', 'la', 'le', 'von', 'van', 'da', 'di', "d'", "l'", 'del', 'bin', 'ben'
]);

// Un composant de nom est-il NON IDENTIFIANT à cette position ? — civilité ou
// particule. C'est la question que se posent `pseudonyms.js` (quel composant
// remplacer) et `identity.js` (quel composant masquer isolément) ; poser la
// même question deux fois, c'est risquer deux réponses.
export function estComposantNonIdentifiant(token, rang, total) {
  return (total > 1 && rang < total - 1 && PARTICULES.has(String(token).toLowerCase()))
    || isHonorificAt(token, rang, total);
}

// --- Fragment de regex pour la détection déterministe ----------------------
// Chaque lettre devient une classe [Xx] : la civilité doit matcher quelle que
// soit sa casse (« miss Deva », « Miss Deva », « MISS DEVA »), alors que le
// NOM qui suit doit rester sensible à la casse dans le motif appelant — un
// simple flag `i` sur tout le motif ferait matcher « monsieur bonjour ».
const anyCase = terme => terme
  .split('')
  .map(c => {
    const haut = c.toUpperCase();
    const bas = c.toLowerCase();
    return haut === bas ? c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : `[${haut}${bas}]`;
  })
  .join('');

const avecPoint = terme =>
  anyCase(terme) + (POINT_OBLIGATOIRE.has(terme) ? '\\.' : '\\.?');

// Alternation triée du plus long au plus court, sinon « m » masquerait
// « mme » dans l'alternance.
export const HONORIFIC_ALT = [...TERMES]
  .sort((a, b) => b.length - a.length)
  .map(avecPoint)
  .join('|');
