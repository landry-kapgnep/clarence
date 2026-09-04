// « Ce candidat est-il fait de mots ordinaires ? » - le signal qui manque au
// modèle contextuel, et qui explique la moitié de son bruit.
//
// LE CONSTAT QUI A MENÉ ICI (18/08/2026, mesuré sur un vrai CV). Sur 20 valeurs
// masquées avec le profil « Développeur / Tech », dix étaient fausses :
// `Développeur Data`, `IA`, `Anglais C1`, `Développement & Web`, `Allemand`,
// `Mars 2026`, `Bénévole terrain`, `Canal acoustique de données`,
// `Stack conteneurisée`. Toutes composées de mots du dictionnaire. Les vraies
// - `KAPGNEP`, `Sorbonne`, `Twini`, `UNODC`, `SafePrompt` - n'en contiennent
// aucun.
//
// Pourquoi pas un seuil. Mesuré sur le même document : les vraies valeurs
// sortent à 0,738 de moyenne, les fausses à 0,648, et le meilleur score du
// Document est un faux positif. `Spécialités` (0,77) et `Bénévole terrain`
// (0,76) battent `Sorbonne Paris Nord` (0,68). Aucun réglage de seuil ne
// sépare ces deux populations - c'est ce qui a justifié de chercher un signal
// d'une autre nature.
//
// Jamais sur les personnes, et c'est la limite la plus importante de ce
// module. Beaucoup de patronymes français sont des mots courants - Blanc,
// Petit, Bernard, Roux, Leroy, et notre propre vivier de pseudonymes en est
// plein. Testé : « Pierre Blanc » est jugé « vocabulaire ». Appliquer ce filtre
// aux PER produirait donc des fuites, pas du confort. L'appelant restreint
// l'usage aux types dont la valeur n'est pas une personne.
//
// Ce qu'on perd, assumé et mesuré : les entités dont le nom EST un mot courant
// - `Orange`, `Total`, `Le Monde`. Employeurs plausibles sur un CV, donc de
// vraies pertes. Elles restent rattrapables par le profil d'identité
// (« toujours masquer ») et par la table des corrections. L'arbitrage est
// explicite : ces valeurs sont des organisations, pas des données
// personnelles au sens du RGPD, alors que le bruit qu'on retire, lui, rendait
// le document inexploitable.
import { LEXIQUE_COURANT } from './lexique.js';

// Suffixes dérivationnels du français. Ils complètent le lexique là où il est
// mince : issu d'un vocabulaire réparti sur 104 langues, il ignore
// « bénévole », « acoustique » ou « conteneurisée ». Un nom propre ne porte
// pratiquement jamais ces terminaisons - c'est une propriété de la
// MORPHOLOGIE, pas une liste d'exceptions.
//
// Six suffixes ont été retirés après mesure, et il ne faut pas les
// remettre : `-elle`, `-ance`, `-ence`, `-ique`, `-aire`, `-euse`. Ils
// collident frontalement avec des noms de lieux - Sarcelles, France, Provence,
// Belgique, Martinique, Saint-Nazaire, Villetaneuse. Le banc l'a montré
// immédiatement pour `-elle` : « Sarcelles » cessait d'être masqué.
//
// `-euse` a été retiré le 30/08/2026, et il avait survécu aux cinq autres
// parce que rien ne le vérifiait : « Villetaneuse » apparaît deux fois dans
// certificat-fr.txt, un commentaire de la vérité terrain affirmait que la ville
// est masquée, mais aucune assertion ne l'exigeait. Une fois l'assertion
// ajoutée, la fuite est apparue immédiatement - et disparaît en neutralisant
// les suffixes. Elle touche par construction tous les lieux en `-euse`
// (Villetaneuse, Bagneuse…).
//
// Leçon, la troisième fois que ce piège se referme : les suffixes dérivationnels
// du français et les toponymes français partagent leurs terminaisons. Il n'y a
// pas de liste sûre à énumérer, seulement des collisions qu'on découvre une par
// une quand un test finit par les couvrir.
//
// Le coût de ces retraits est connu et accepté : « Canal acoustique de données »
// survit comme faux positif, faute de `-ique`. Un faux positif visible vaut
// mieux qu'une ville laissée en clair.
//
// Mesuré le 30/08/2026 : cette liste n'apporte plus rien au banc. Neutralisée
// entièrement, les neuf documents rendent des constats RIGOUREUSEMENT
// Identiques - seul « Villetaneuse » change, et en mieux. Sa justification
// d'origine (« 6 faux positifs sur 9 au lieu de 5 sur 10 ») venait d'un vrai CV
// qu'on n'a plus sous la main, et la famille qu'elle visait - les groupes
// nominaux de plusieurs mots - est désormais traitée par le filtre appris
// (precision.js), qui ne s'en sert pas. La retirer complètement est le prochain
// pas logique ; il demande de reconstruire le jeu d'entraînement pour supprimer
// proprement la caractéristique `partSuffixe`, donc il n'est pas fait ici.
const SUFFIXES_COMMUNS =
  /(?:ment|tion|sion|isme|iste|ateur|eur|trice|able|ible|ité|isée|isé|ifié|logie|graphie)s?$/i;

// Mots-outils : ni identifiants ni discriminants. « Canal acoustique DE
// données » ne doit pas échouer le test à cause de « de ».
const MOTS_OUTILS = /^(?:de|du|des|d|la|le|les|l|un|une|et|à|au|aux|en|sur|pour|par|dans|avec)$/i;

// Les deux moitiés du test sont exposées séparément - le lexique est
// multilingue (104 langues, il suit gratuitement l'ajout d'une langue), les
// suffixes ne valent QUE pour le français. Le filtre de précision a besoin de
// les distinguer pour mesurer ce que chacune apporte, et donc pour pouvoir un
// jour se passer de la seconde. Voir src/engine/caracteristiques.js.
export const auLexique = (mot) => LEXIQUE_COURANT.has(String(mot || '').trim().toLowerCase());
export const aSuffixeCommun = (mot) => SUFFIXES_COMMUNS.test(String(mot || '').trim());

// Découpage d'un candidat en mots significatifs. Partagé avec le filtre de
// précision : deux découpages différents produiraient deux vérités différentes
// sur le même texte.
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

// Un candidat relève-t-il du vocabulaire ordinaire ?
//
// Tous ses mots significatifs doivent l'être. Un seul mot inconnu du lexique
// suffit à le rendre suspect, donc à le laisser masquer : le doute profite
// toujours au masquage, conformément à « zéro-fuite d'abord ».
export function estVocabulaireCourant(valeur) {
  const mots = motsSignificatifs(valeur);
  return mots.length > 0 && mots.every(estMotCourant);
}
