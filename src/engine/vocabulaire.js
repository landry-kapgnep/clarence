// « Ce candidat est-il fait de mots ordinaires ? » Le signal qui manque au
// modèle contextuel et qui explique une bonne part de son bruit.
//
// Sur un vrai CV, 10 des 20 valeurs masquées étaient fausses (`Développeur
// Data`, `Anglais C1`, `Bénévole terrain`…), toutes faites de mots du
// dictionnaire. Les vraies (`MESNARD`, `Sorbonne`, `Twini`, `UNODC`) n'en
// contiennent aucun. Un seuil ne les sépare pas : `Spécialités` sort à 0,77
// contre 0,68 pour `Sorbonne Paris Nord`.
//
// JAMAIS SUR LES PERSONNES. Beaucoup de patronymes français sont des mots
// courants (Blanc, Petit, Bernard, Roux), et « Pierre Blanc » est jugé
// « vocabulaire ». Appliquer ce filtre aux PER produirait des fuites.
// L'appelant restreint l'usage aux types qui ne sont pas des personnes.
//
// Ce qu'on perd, assumé : les organisations dont le nom EST un mot courant
// (Orange, Total, Le Monde). Rattrapables par « toujours masquer » et par la
// table des corrections.
import { LEXIQUE_COURANT } from './lexique.js';

// Suffixes dérivationnels du français, là où le lexique est mince : issu d'un
// vocabulaire sur 104 langues, il ignore « bénévole » ou « conteneurisée ».
//
// SIX SUFFIXES ONT ÉTÉ RETIRÉS, NE PAS LES REMETTRE : `-elle`, `-ance`,
// `-ence`, `-ique`, `-aire`, `-euse`. Ils collident avec des toponymes et
// faisaient cesser de masquer Sarcelles, Provence ou Villetaneuse. Le piège
// s'est refermé trois fois.
//
// La liste restante n'apporte plus rien au banc (mesuré) ; la retirer demande
// de reconstruire le jeu d'entraînement. Voir roadmap-detection.md, annexe.
const SUFFIXES_COMMUNS =
  /(?:ment|tion|sion|isme|iste|ateur|eur|trice|able|ible|ité|isée|isé|ifié|logie|graphie)s?$/i;

// Mots-outils : ni identifiants ni discriminants. « Canal acoustique de
// données » ne doit pas échouer le test à cause de « de ».
const MOTS_OUTILS = /^(?:de|du|des|d|la|le|les|l|un|une|et|à|au|aux|en|sur|pour|par|dans|avec)$/i;

// Les deux moitiés sont exposées séparément : le lexique est multilingue, les
// suffixes ne valent que pour le français. Le filtre de précision a besoin de
// les distinguer pour mesurer ce que chacune apporte.
export const auLexique = (mot) => LEXIQUE_COURANT.has(String(mot || '').trim().toLowerCase());
export const aSuffixeCommun = (mot) => SUFFIXES_COMMUNS.test(String(mot || '').trim());

// Partagé avec le filtre de précision : deux découpages différents
// produiraient deux vérités différentes sur le même texte.
export function motsSignificatifs(valeur) {
  return String(valeur || '')
    .split(/[\s&'’/,.-]+/)
    .filter(m => /\p{L}{2}/u.test(m) && !MOTS_OUTILS.test(m));
}

export function estMotCourant(mot) {
  const nu = String(mot || '').trim();
  if (!nu) return false;
  return auLexique(nu) || aSuffixeCommun(nu);
}

// Tous les mots significatifs doivent être courants. Un seul mot inconnu suffit
// à rendre le candidat suspect, donc à le laisser masquer : le doute profite
// au masquage.
export function estVocabulaireCourant(valeur) {
  const mots = motsSignificatifs(valeur);
  return mots.length > 0 && mots.every(estMotCourant);
}
