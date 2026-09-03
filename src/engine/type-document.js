// « À quoi ressemble ce document ? » — pour PROPOSER le bon profil.
//
// D'OÙ ÇA VIENT. L'idée d'origine était d'entraîner un modèle PAR FORMAT (un
// pour les CV, un pour l'administratif, un pour le scolaire), parce qu'un même
// mot doit être masqué ici et ignoré là. L'intuition est juste ; le modèle
// n'est pas la bonne pièce pour la porter. Mesuré sur un vrai CV : les faux
// positifs qui restent sont `IA`, `Ollama`, `BDD`, `NSI` — des acronymes d'un
// seul mot qu'AUCUN signal contextuel ne distingue de `UNODC` ou `Twini`, qui
// sont de vraies entités. Un modèle entraîné là-dessus apprendrait à jeter les
// vraies, donc à fuir.
//
// Ce qui les traite déjà, et bien, c'est la liste éditable d'un PROFIL —
// c'est-à-dire exactement « masqué dans un CV, ignoré dans un dossier admin ».
// La pièce qui manquait n'était donc pas un modèle : c'était de savoir QUEL
// profil proposer. Ce module répond à ça, sans ML, en quelques signaux.
//
// ⚠️ RÈGLE NON NÉGOCIABLE : CE MODULE NE DÉCIDE JAMAIS D'UN MASQUAGE. Il
// propose un profil, que l'utilisateur accepte ou non. Une suggestion fausse
// coûte un clic ; un masquage changé en silence casserait l'UX de relecture qui
// est la colonne vertébrale du produit (cadrage §5). Il rend `null` — « je ne
// sais pas » — plutôt que de deviner : une mauvaise suggestion est pire que pas
// de suggestion du tout.
//
// STRUCTURE D'ABORD, MOTS ENSUITE. Les signaux structurels (points de suite
// d'un sommaire, paires libellé/valeur, densité de puces, plages de dates,
// en-têtes d'e-mail) ne dépendent d'aucune langue et portent l'essentiel du
// verdict. Les mots-clés complètent, et ils sont regroupés PAR LANGUE, déclarés
// comme tels — ajouter une langue est alors un geste explicite et localisé, pas
// une réécriture.

import { FORMATS, motsDeForme } from './vocabulaire-formats.js';

// --- Signaux STRUCTURELS, indépendants de la langue -----------------------

// Points de suite d'un sommaire : « Introduction......3 ». Marqueur très sûr
// d'un rapport ou d'un mémoire ; aucun CV n'en porte.
const POINTS_DE_SUITE = /\.{4,}\s*\d+\s*$/;

// En-têtes d'e-mail. La forme est normalisée (RFC 5322), donc les noms de
// champs valent dans toutes les langues même quand le corps ne le fait pas.
const ENTETE_EMAIL = /^(?:From|To|Cc|Subject|Sent|De|À|Objet|Envoyé)\s*:/i;

// Paire libellé/valeur : « Nom          MARCHESSEAU », « Poste occupé : … ».
// C'est la forme des formulaires et des dossiers, pas de la prose.
const PAIRE_LIBELLE = /^\s*[^\s:][^:\n]{1,28}(?::\s+|\s{2,})\S/;

// Puces : la signature typographique d'un CV et de ses rubriques.
const PUCE = /^\s*[•·▪◦‣*·]|(?:\s[•·▪◦‣]\s)/;

// Plage de dates « Janv. 2025 - Mars 2026 » : un CV en est fait, un formulaire
// n'en a pas. Sans nom de mois — c'est la STRUCTURE année-tiret-année qui parle.
const PLAGE_DE_DATES = /(?:1[89]|20)\d{2}\s*[-–—à]\s*(?:(?:1[89]|20)\d{2}|en cours|présent|aujourd)/i;

// --- Marqueurs LEXICAUX : DÉRIVÉS de la source unique ---------------------
//
// Ils ne sont plus déclarés ici. Les mots qui reconnaissent un format sont
// exactement ceux qu'il ne faut pas y masquer, donc ils vivent dans
// `vocabulaire-formats.js`, d'où les profils les tirent aussi. Deux listes
// auraient divergé — le motif que ce projet a déjà payé plusieurs fois.

// NORMALISATION, et pourquoi elle n'est pas cosmétique.
//
// ⚠️ LE DÉFAUT QU'ELLE FERME. La première version testait `texte.includes(mot)`,
// une SOUS-CHAÎNE sans frontière de mot. Le marqueur bancaire « rib » matchait
// donc « contribuer », « distribution », « attribué » — mesuré : 0,8 point de
// « bancaire » sur une note de service qui n'a rien de bancaire. Le verdict
// n'était sauvé que par l'écart minimal, c'est-à-dire par chance.
//
// Le risque MONTE avec chaque langue ajoutée : plus il y a de marqueurs courts,
// plus il y a de mots d'une autre langue qui les contiennent par accident.
//
// On remplace donc tout ce qui n'est ni lettre ni chiffre par une espace, et on
// entoure d'espaces : chercher « rib » revient alors à chercher « ␣rib␣ », que
// « contribuer » ne contient pas. Les marqueurs de plusieurs mots survivent,
// leurs espaces internes étant préservés.
const normaliser = (t) => ' ' + String(t || '').toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';

// Normalisés UNE FOIS au chargement.
const MARQUEURS_NORMALISES = Object.fromEntries(
  FORMATS.map(f => [f, motsDeForme(f).map(m => normaliser(m).slice(1, -1))]));

export const TYPES = ['cv', 'administratif', 'scolaire', 'bancaire', 'email'];

// Écart minimal entre le premier et le second type pour oser proposer.
//
// POURQUOI UN ÉCART ET PAS UN SEUIL ABSOLU. Un document peut cocher beaucoup de
// cases sans être caractéristique — un rapport de stage porte des mots de CV
// (« stage », « tuteur ») ET des mots de rapport. Ce qui autorise à proposer,
// ce n'est pas « j'ai beaucoup de points » mais « un type se détache ». Sous
// cet écart, on rend `null`, et l'utilisateur choisit lui-même.
export const ECART_MINIMAL = 1.5;

const compterLignes = (lignes, motif) => lignes.filter(l => motif.test(l)).length;

// `entites` (optionnel) : la liste déjà détectée. Sert UNIQUEMENT au type
// bancaire, où la densité d'IBAN et de montants est le signal décisif — et il
// est déterministe, validé mod-97, donc bien plus sûr que n'importe quel mot.
export function analyserTypeDocument(texte, { entites = [] } = {}) {
  const brut = String(texte || '');
  const lignes = brut.split(/\r?\n/).filter(l => l.trim());
  if (lignes.length < 3) return { type: null, score: 0, indices: [] };

  const normalise = normaliser(brut);
  const n = lignes.length;
  const points = { cv: 0, administratif: 0, scolaire: 0, bancaire: 0, email: 0 };
  const indices = [];
  const noter = (type, valeur, raison) => {
    if (valeur <= 0) return;
    points[type] += valeur;
    indices.push({ type, raison, valeur: Number(valeur.toFixed(2)) });
  };

  // ── Structure ──
  const sommaire = compterLignes(lignes, POINTS_DE_SUITE);
  noter('scolaire', Math.min(sommaire, 8) * 0.6, `${sommaire} ligne(s) de sommaire`);

  // Les en-têtes d'e-mail ne comptent qu'en TÊTE du document : « Objet : » au
  // milieu d'un rapport est une phrase, pas un en-tête.
  const enTete = compterLignes(lignes.slice(0, 8), ENTETE_EMAIL);
  noter('email', enTete >= 2 ? 3 + enTete : 0, `${enTete} en-tête(s) d'e-mail`);

  const paires = compterLignes(lignes, PAIRE_LIBELLE) / n;
  noter('administratif', paires > 0.3 ? paires * 4 : 0, `${(paires * 100).toFixed(0)} % de paires libellé/valeur`);

  const puces = compterLignes(lignes, PUCE) / n;
  noter('cv', puces > 0.1 ? puces * 6 : 0, `${(puces * 100).toFixed(0)} % de lignes à puces`);

  const plages = compterLignes(lignes, PLAGE_DE_DATES);
  noter('cv', Math.min(plages, 5) * 0.5, `${plages} plage(s) de dates`);

  // Prose longue : un mémoire écrit des paragraphes, un CV des fragments.
  const longueurMoyenne = brut.length / n;
  noter('scolaire', longueurMoyenne > 120 ? 1.5 : 0, `lignes longues (${longueurMoyenne.toFixed(0)} c.)`);
  noter('cv', longueurMoyenne < 70 ? 1 : 0, `lignes courtes (${longueurMoyenne.toFixed(0)} c.)`);

  // ── Déterministe : la densité d'IBAN et de montants ──
  const bancaires = entites.filter(e => e.type === 'IBAN' || e.type === 'BIC').length;
  const montants = entites.filter(e => e.type === 'MONTANT').length;
  noter('bancaire', bancaires * 2 + (montants > 5 ? 2 : 0),
    `${bancaires} IBAN/BIC, ${montants} montant(s)`);

  // ── Mots-clés, cinq langues, comparés MOT À MOT ──
  for (const [type, marqueurs] of Object.entries(MARQUEURS_NORMALISES)) {
    const trouves = marqueurs.filter(m => normalise.includes(' ' + m + ' '));
    noter(type, trouves.length * 0.8, `mots : ${trouves.join(', ')}`);
  }

  const classement = Object.entries(points).sort((a, b) => b[1] - a[1]);
  const [premier, valeurPremier] = classement[0];
  const ecart = valeurPremier - classement[1][1];
  const sur = indices.filter(i => i.type === premier);

  return {
    type: ecart >= ECART_MINIMAL && valeurPremier > 0 ? premier : null,
    score: Number(valeurPremier.toFixed(2)),
    ecart: Number(ecart.toFixed(2)),
    indices: sur,
    classement: classement.map(([t, v]) => [t, Number(v.toFixed(2))])
  };
}
