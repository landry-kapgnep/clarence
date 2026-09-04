// Poids de traitement d'un fichier : léger, moyen, lourd, très lourd.
//
// Pas une estimation de temps. Un temps annoncé est une promesse qu'on ne peut
// pas tenir (machine, WebGPU, cache du modèle), et annoncer 40 s pour en mettre
// 3 minutes met l'application en tort. Un poids décrit le fichier : vérifiable,
// il ne peut pas être démenti.
//
// Pas la taille en octets non plus, c'est le piège principal. Ce qui coûte,
// c'est la quantité de texte soumise au modèle : un PDF de 5 Mo rempli d'images
// se traite en quelques secondes, un PDF de 430 Ko et 75 pages de prose en
// prend 45. La taille se trompe dans les deux sens, on ne s'y rabat qu'à défaut.

export const NIVEAUX = {
  leger:     { libelle: 'Léger',      classe: 'poids-leger' },
  moyen:     { libelle: 'Moyen',      classe: 'poids-moyen' },
  lourd:     { libelle: 'Lourd',      classe: 'poids-lourd' },
  tresLourd: { libelle: 'Très lourd', classe: 'poids-tres-lourd' }
};

// Seuils en pages, calés sur des mesures réelles et non au jugé :
//   6 pages   (tests/manuel/tous-defauts.pdf) → quelques secondes
//   75 pages  (mémoire réel, ~190 000 caractères) → ~45 s
// Le mémoire doit donc tomber en « Très lourd » : c'est le cas qui a motivé
// tout le travail de performance, l'utilisateur doit le voir venir.
const SEUILS_PAGES = [
  [8, 'leger'],
  [25, 'moyen'],
  [60, 'lourd']
];

// Seuils en caractères de texte, pour les formats où on lit le texte
// directement (CSV, TXT). ~190 000 caractères = le mémoire = très lourd.
const SEUILS_CARACTERES = [
  [15000, 'leger'],
  [60000, 'moyen'],
  [150000, 'lourd']
];

// Seuils en octets - repli le moins fiable, réservé aux formats compressés
// (DOCX, XLSX) dont on ne connaît pas le volume de texte sans les ouvrir.
const SEUILS_OCTETS = [
  [40 * 1024, 'leger'],
  [200 * 1024, 'moyen'],
  [800 * 1024, 'lourd']
];

function classer(valeur, seuils) {
  for (const [max, cle] of seuils) if (valeur <= max) return cle;
  return 'tresLourd';
}

// Une image n'a jamais de texte à analyser : seules ses métadonnées sont
// retirées, quelle que soit sa taille. Toujours « Léger », et c'est exact.
const SANS_TEXTE = new Set(['jpg', 'jpeg', 'png', 'webp']);

// `pages` et `caracteres` sont OPTIONNELS : quand on ne les connaît pas encore
// (l'affichage est instantané, le comptage de pages arrive après), on retombe
// sur la taille. La fonction reste pure et le même appel donne toujours le même
// résultat.
export function poidsDeTraitement({ ext, taille = 0, pages = null, caracteres = null }) {
  const e = (ext || '').toLowerCase();
  if (SANS_TEXTE.has(e)) return { cle: 'leger', ...NIVEAUX.leger, base: 'image' };

  if (pages != null) {
    return { cle: classer(pages, SEUILS_PAGES), ...NIVEAUX[classer(pages, SEUILS_PAGES)], base: 'pages' };
  }
  if (caracteres != null) {
    const cle = classer(caracteres, SEUILS_CARACTERES);
    return { cle, ...NIVEAUX[cle], base: 'caracteres' };
  }
  const cle = classer(taille, SEUILS_OCTETS);
  return { cle, ...NIVEAUX[cle], base: 'octets' };
}

// Phrase affichée au survol : dit sur quoi le classement repose, pour qu'il
// reste contestable par l'utilisateur plutôt que d'être un verdict opaque.
export function expliquerPoids(poids) {
  switch (poids.base) {
    case 'image':
      return 'Une image n’a pas de texte à analyser : seules les métadonnées sont retirées.';
    case 'pages':
      return 'Estimé d’après le nombre de pages. Ce qui compte est la quantité de texte, pas le poids du fichier.';
    case 'caracteres':
      return 'Estimé d’après la quantité de texte à analyser.';
    default:
      return 'Estimé d’après la taille du fichier — approximatif pour ce format, dont le texte est compressé.';
  }
}
