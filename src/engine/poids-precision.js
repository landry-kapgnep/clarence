// FICHIER GÉNÉRÉ — ne pas modifier à la main.
//
//     ECRIRE=1 node tools/filtre/entrainer.mjs tools/filtre/jeu.jsonl
//
// Poids du filtre de précision (voir src/engine/precision.js). `null` rendrait
// le filtre inerte, comportement sûr par défaut.
//
// Variante « sans-les-deux », entraînée sur 555 candidats, évaluée sur
// 104 SÉPARÉS PAR VALEUR. Au seuil ci-dessous : 36/56
// faux positifs retirés, 0/48 vraie(s) entité(s) perdue(s).
//
// Le seuil n'est pas un optimum de F-mesure : c'est le plus agressif dont la
// perte reste sous la tolérance énoncée (0.5 % des vraies entités).
export const POIDS = {
  seuil: 0.21,
  biais: -2.7269,
  poids: {
    partLexique: -0.8536,
    aucunCourant: 2.5650,
    toutCapitales: 0.0000,
    casseDeTitre: -2.6142,
    aChiffre: 4.4330,
    liaisonInterne: -0.0844,
    nbMots: 10.2502,
    longueur: -8.0767,
    occurrences: -1.8454,
    minusculeAilleurs: -4.1860,
    score: 4.2489
  }
};
