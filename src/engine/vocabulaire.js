// « Ce candidat est-il fait de mots ordinaires ? » — le signal qui manque au
// modèle contextuel, et qui explique la moitié de son bruit.
//
// LE CONSTAT QUI A MENÉ ICI (18/08/2026, mesuré sur un vrai CV). Sur 20 valeurs
// masquées avec le profil « Développeur / Tech », dix étaient fausses :
// `Développeur Data`, `IA`, `Anglais C1`, `Développement & Web`, `Allemand`,
// `Mars 2026`, `Bénévole terrain`, `Canal acoustique de données`,
// `Stack conteneurisée`. Toutes composées de mots du dictionnaire. Les vraies
// — `KAPGNEP`, `Sorbonne`, `Twini`, `UNODC`, `SafePrompt` — n'en contiennent
// aucun.
//
// ⚠️ POURQUOI PAS UN SEUIL. Mesuré sur le même document : les vraies valeurs
// sortent à 0,738 de moyenne, les fausses à 0,648, et LE MEILLEUR SCORE DU
// DOCUMENT est un faux positif. `Spécialités` (0,77) et `Bénévole terrain`
// (0,76) battent `Sorbonne Paris Nord` (0,68). Aucun réglage de seuil ne
// sépare ces deux populations — c'est ce qui a justifié de chercher un signal
// d'une autre nature.
//
// ⚠️ JAMAIS SUR LES PERSONNES, et c'est la limite la plus importante de ce
// module. Beaucoup de patronymes français SONT des mots courants — Blanc,
// Petit, Bernard, Roux, Leroy, et notre propre vivier de pseudonymes en est
// plein. Testé : « Pierre Blanc » est jugé « vocabulaire ». Appliquer ce filtre
// aux PER produirait donc des fuites, pas du confort. L'appelant restreint
// l'usage aux types dont la valeur n'est pas une personne.
//
// CE QU'ON PERD, ASSUMÉ ET MESURÉ : les entités dont le nom EST un mot courant
// — `Orange`, `Total`, `Le Monde`. Employeurs plausibles sur un CV, donc de
// vraies pertes. Elles restent rattrapables par le profil d'identité
// (« toujours masquer ») et par la table des corrections. L'arbitrage est
// explicite : ces valeurs sont des ORGANISATIONS, pas des données
// personnelles au sens du RGPD, alors que le bruit qu'on retire, lui, rendait
// le document inexploitable.
import { LEXIQUE_COURANT } from './lexique.js';

// Suffixes DÉRIVATIONNELS du français. Ils complètent le lexique là où il est
// mince : issu d'un vocabulaire réparti sur 104 langues, il ignore
// « bénévole », « acoustique » ou « conteneurisée ». Un nom propre ne porte
// pratiquement jamais ces terminaisons — c'est une propriété de la
// MORPHOLOGIE, pas une liste d'exceptions.
//
// ⚠️ CINQ SUFFIXES ONT ÉTÉ RETIRÉS APRÈS MESURE, et il ne faut pas les
// remettre : `-elle`, `-ance`, `-ence`, `-ique`, `-aire`. Ils collident
// frontalement avec des NOMS DE LIEUX — Sarcelles, France, Provence, Belgique,
// Martinique, Saint-Nazaire. Le banc l'a montré immédiatement : avec `-elle`,
// « Sarcelles » cessait d'être masqué.
//
// Le coût de ce retrait est connu et accepté : « Canal acoustique de données »
// survit comme faux positif, faute de `-ique`. Un faux positif visible vaut
// mieux qu'une ville laissée en clair.
//
// Mesuré : le lexique seul attrapait 5 faux positifs sur 10 ; avec les
// suffixes restants, 6 sur 9, sans perdre aucune vraie valeur.
const SUFFIXES_COMMUNS =
  /(?:ment|tion|sion|isme|iste|ateur|eur|euse|trice|able|ible|ité|isée|isé|ifié|logie|graphie)s?$/i;

// Mots-outils : ni identifiants ni discriminants. « Canal acoustique DE
// données » ne doit pas échouer le test à cause de « de ».
const MOTS_OUTILS = /^(?:de|du|des|d|la|le|les|l|un|une|et|à|au|aux|en|sur|pour|par|dans|avec)$/i;

export function estMotCourant(mot) {
  const nu = String(mot || '').trim();
  if (!nu) return false;
  return LEXIQUE_COURANT.has(nu.toLowerCase()) || SUFFIXES_COMMUNS.test(nu);
}

// Un candidat relève-t-il du vocabulaire ordinaire ?
//
// TOUS ses mots significatifs doivent l'être. Un seul mot inconnu du lexique
// suffit à le rendre suspect, donc à le laisser masquer : le doute profite
// toujours au masquage, conformément à « zéro-fuite d'abord ».
export function estVocabulaireCourant(valeur) {
  const mots = String(valeur || '')
    .split(/[\s&'’/,.-]+/)
    .filter(m => /\p{L}{2}/u.test(m) && !MOTS_OUTILS.test(m));
  return mots.length > 0 && mots.every(estMotCourant);
}
