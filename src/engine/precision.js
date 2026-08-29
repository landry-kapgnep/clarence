// FILTRE DE PRÉCISION — « ce candidat mérite-t-il d'être masqué ? »
//
// CE QU'IL REMPLACE. `vocabulaire.js` répond à cette question avec UNE
// caractéristique et un seuil binaire : « tous les mots sont-ils au
// dictionnaire ? ». Il a fallu lui retirer cinq suffixes parce qu'ils
// mordaient sur des noms de lieux (Sarcelles, Provence, Belgique) — le signe
// qu'une règle écrite à la main avait atteint sa limite. Ici, une douzaine de
// signaux FAIBLES sont pesés ensemble, ce qu'un classifieur fait bien mieux
// qu'une suite de `if`.
//
// POURQUOI CE N'EST PAS UNE BOÎTE NOIRE, et pourquoi ça compte. Le modèle est
// une régression logistique : une quinzaine de nombres, lisibles, qu'on peut
// afficher. `expliquer()` rend la caractéristique qui a réellement décidé.
// Dans un produit dont la colonne vertébrale est l'anti-fausse-confiance
// (cadrage §5), un mécanisme qui DÉMASQUE sans pouvoir dire pourquoi serait un
// contresens.
//
// TROIS GARDE-FOUS NON NÉGOCIABLES, dans le code et pas seulement dans ce
// commentaire :
//   1. il ne peut QUE RETIRER des candidats, jamais en ajouter ;
//   2. il ne touche JAMAIS le déterministe (`source !== 'ner'` passe intact) —
//      un IBAN validé mod-97 ne se discute pas avec un modèle statistique ;
//   3. il ne touche JAMAIS les PERSONNES. Beaucoup de patronymes sont des mots
//      courants (Blanc, Petit, Roux) et notre propre vivier de pseudonymes en
//      est plein : « Pierre Blanc » est jugé « vocabulaire ». Un filtre qui
//      démasque des personnes ne rend pas service, il fuit.
import { contexteDocument, caracteristiques } from './caracteristiques.js';
import { motsSignificatifs } from './vocabulaire.js';
import { POIDS } from './poids-precision.js';

export { POIDS };

// Types soumis au filtre. Même périmètre que le filtre de vocabulaire qu'il
// prolonge, et pour la même raison : ORG et LOC portent le gros du bruit ET la
// donnée la moins sensible — une raison sociale ou une ville ne sont pas des
// données personnelles au sens du RGPD, alors que le bruit qu'on retire rendait
// le document inexploitable.
export const TYPES_FILTRES = new Set(['ORG', 'LOC']);

// Les poids appris vivent dans `poids-precision.js`, fichier GÉNÉRÉ par
// `node tools/filtre/entrainer.mjs`. Séparés pour deux raisons : on relit les
// commentaires de ce module sans faire défiler des nombres, et on régénère les
// nombres sans risquer de toucher à la logique ni aux garde-fous.
//
// `POIDS === null` rend le filtre INERTE — ne rien retirer est toujours sûr.

const sigmoide = (z) => 1 / (1 + Math.exp(-z));

// Probabilité que le candidat soit une VRAIE entité. Proche de 1 = on garde.
export function scorePrecision(candidat, ctx, modele = POIDS) {
  if (!modele) return 1;
  const c = caracteristiques(candidat, ctx);
  let z = modele.biais;
  for (const [nom, w] of Object.entries(modele.poids)) z += w * (c[nom] ?? 0);
  return sigmoide(z);
}

// Quelle caractéristique a fait pencher la décision ? Rendue à l'UI pour que
// « pourquoi ce terme n'est-il pas masqué ? » ait une réponse.
//
// ⚠️ ON NE PEUT PAS SE CONTENTER DES APPORTS NÉGATIFS. Une caractéristique à
// poids POSITIF dont la valeur est basse (un score faible, aucune majuscule)
// n'apporte rien du tout — son apport vaut 0, pas moins — alors qu'elle est
// souvent LA raison pour laquelle le total reste bas. La comparer à 0 la
// rendrait donc invisible dans l'explication.
//
// On mesure donc chaque caractéristique par son ÉCART AU MEILLEUR CAS :
//   · poids négatif → ce qu'elle retire activement    (w × x)
//   · poids positif → ce qu'elle ne rapporte PAS      (w × (x − 1))
// Les deux sont ≤ 0 et comparables entre elles ; la plus basse est celle qui
// explique le mieux la décision.
export function expliquer(candidat, ctx, modele = POIDS) {
  if (!modele) return null;
  const c = caracteristiques(candidat, ctx);
  let pire = null;
  for (const [nom, w] of Object.entries(modele.poids)) {
    const x = c[nom] ?? 0;
    const ecart = w < 0 ? w * x : w * (x - 1);
    if (ecart < 0 && (!pire || ecart < pire.ecart)) pire = { nom, ecart };
  }
  return pire?.nom ?? null;
}

// GARDE-FOU 4 — UN SEUL MOT NE SE JUGE PAS. Mesuré au banc, pas supposé.
//
// Le filtre faisait perdre deux patronymes : « Vaquier », seul dans une cellule
// de tableau, et « Fontaine » (de « Rose Fontaine ») — tous deux étiquetés
// ENTREPRISE par le modèle, donc hors de portée du garde-fou 3 qui, lui,
// raisonne par TYPE. **Un patronyme mal étiqueté reste un patronyme.**
//
// LE MÉCANISME. Un candidat d'un seul mot n'offre presque aucune prise : le
// lexique n'y voit rien, `nbMots` ne rapporte qu'un cinquième de son poids, et
// il ne reste que le score du modèle — dont on a mesuré qu'il ne sépare rien.
// Or les candidats d'un seul mot sont massivement des PATRONYMES et des VILLES,
// c'est-à-dire ce qu'il y a de plus sensible ; « Calahorra », l'unique perte de
// l'évaluation, en est un.
//
// SYMÉTRIQUEMENT, on ne perd rien : les faux positifs que le filtre attrape
// réellement sont TOUS des groupes de plusieurs mots — « Modélisation
// applicative », « Relevé de notes », « Analyse statistique des écarts »,
// « Portugais bilingue ». Les seuls candidats d'un mot qu'il retirait étaient
// « JaCoCo » et « BDD », des technologies, que les profils traitent déjà mieux.
//
// C'est donc une restriction qui coûte zéro et protège la classe la plus
// exposée. Elle vaut aussi à l'entraînement (voir tools/filtre/entrainer.mjs) :
// les chiffres annoncés doivent être ceux du filtre réellement livré.
export const MOTS_MINIMUM = 2;

// GARDE-FOU 5 — LA FORME D'UN NOM PROTÈGE, PAS SEULEMENT L'ÉTIQUETTE.
//
// LA FUITE QUI L'A IMPOSÉ, mesurée sur tests/manuel/tous-defauts.pdf, dans une
// phrase écrite exprès pour ce piège :
//     « Rose Fontaine cultive une rose ancienne dans son jardin. »
// Le modèle étiquette « Rose Fontaine » en ENTREPRISE — donc le garde-fou 3,
// qui raisonne par TYPE, ne la voit pas. Et le filtre la retire à 0,177 :
// « rose » est au dictionnaire (partLexique 0,50) et le document l'écrit
// lui-même en minuscules plus loin (minusculeAilleurs 0,50). Les deux signaux
// dont ce filtre tire sa valeur se retournent contre un patronyme.
//
// Ce n'est pas un cas tordu, c'est LA doctrine du projet qu'on contournait :
// vocabulaire.js documente déjà qu'on n'applique jamais un raisonnement de
// vocabulaire à une personne, « beaucoup de patronymes français SONT des mots
// courants — Blanc, Petit, Bernard, Roux ». L'erreur était de s'appuyer sur
// l'étiquette du modèle, qu'il peut se tromper à donner, plutôt que sur la
// FORME de la valeur, qui, elle, ne ment pas.
//
// LE COÛT EST MESURÉ, et il est dérisoire : sur le jeu d'évaluation, ce
// garde-fou protège 458 vraies entités sur 706 et ne coûte que 7 faux positifs
// sur 418 — quatre valeurs distinctes (« Développeur Linux », « Développeur
// Pandas », « Développeur Ollama », « Baccalauréat Général »).
//
// Deux à trois mots seulement : au-delà, ce n'est plus un nom mais une raison
// sociale longue (« Institut National des Sciences Appliquées »). Aucun chiffre :
// un nom de personne n'en porte pas.
export const formeDeNomPropre = (valeur) => {
  if (/\d/.test(valeur)) return false;
  const mots = motsSignificatifs(valeur);
  return mots.length >= 2 && mots.length <= 3
    && mots.every(m => /^\p{Lu}[\p{Ll}'’-]+$/u.test(m));
};

export const filtrable = (e) =>
  e.source === 'ner'
  && TYPES_FILTRES.has(e.type)
  && motsSignificatifs(e.value).length >= MOTS_MINIMUM
  && !formeDeNomPropre(e.value);

// Filtre une liste d'entités. `texte` est le DOCUMENT ENTIER : deux des
// caractéristiques (occurrences, minuscules ailleurs) n'existent qu'à cette
// échelle — c'est la raison pour laquelle ce filtre se branche au niveau de
// `anonymizeUnits` et non dans `detectGliner`, qui ne voit qu'une unité.
export function filtrerParPrecision(entities, texte, { modele = POIDS, sousMots, journal } = {}) {
  if (!modele || !entities?.length) return entities || [];
  const ctx = contexteDocument(texte, { sousMots });
  return entities.filter(e => {
    // Garde-fous 2 à 5 : le déterministe, les types autres qu'ORG/LOC, les
    // candidats d'un seul mot et tout ce qui a la FORME d'un nom propre passent
    // intacts, sans même être évalués.
    if (!filtrable(e)) return true;
    const p = scorePrecision(e, ctx, modele);
    if (p >= modele.seuil) return true;
    if (journal) journal.push({ valeur: e.value, type: e.type, p, motif: expliquer(e, ctx, modele) });
    return false;
  });
}

// LA COMPOSITION DES DEUX PASSES, À UN SEUL ENDROIT.
//
// POURQUOI ELLE EST ICI ET PAS CHEZ CHAQUE APPELANT. Elle vivait dans main.js ;
// le banc, lui, se fabriquait son propre arbitre — sans le filtre. Résultat
// mesuré : le filtre livré ne changeait RIEN aux chiffres du banc, non parce
// qu'il était inefficace mais parce que le banc ne l'exécutait pas. C'est
// exactement le défaut que CLAUDE.md documente (« le banc mesurait `quantized`
// pendant que la popup chargeait autre chose ») : une porte de qualité qui note
// autre chose que ce qu'on expédie ne garantit rien.
//
// L'ORDRE COMPTE et n'est pas interchangeable : c'est celui sur lequel le filtre
// a été entraîné (voir tools/filtre/construire-jeu.mjs). L'arbitre réinterroge
// le modèle avec des labels leurres, le filtre pèse ensuite ce qui reste.
export function composerArbitre(pipe, arbitrerFauxPositifs) {
  if (!pipe) return undefined;
  return async (entities, texte) =>
    filtrerParPrecision(await arbitrerFauxPositifs(entities, pipe), texte);
}
