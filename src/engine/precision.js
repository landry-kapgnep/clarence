// Filtre de précision : « ce candidat mérite-t-il d'être masqué ? »
//
// `vocabulaire.js` répond avec une seule caractéristique et un seuil binaire.
// Il a fallu lui retirer cinq suffixes qui mordaient sur des toponymes, signe
// qu'une règle écrite à la main avait atteint sa limite. Ici une douzaine de
// signaux faibles sont pesés ensemble.
//
// Régression logistique, donc une quinzaine de nombres lisibles :
// `expliquer()` rend la caractéristique qui a décidé. Dans un produit bâti sur
// l'anti-fausse-confiance, un mécanisme qui démasque sans dire pourquoi serait
// un contresens.
//
// TROIS GARDE-FOUS, dans le code et pas seulement ici :
//   1. il ne peut que retirer des candidats, jamais en ajouter ;
//   2. il ne touche jamais le déterministe : un IBAN validé mod-97 ne se
//      discute pas avec un modèle statistique ;
//   3. il ne touche jamais les personnes. « Pierre Blanc » est jugé
//      « vocabulaire » ; un filtre qui démasque des personnes fuit.
import { contexteDocument, caracteristiques } from './caracteristiques.js';
import { motsSignificatifs } from './vocabulaire.js';
import { POIDS } from './poids-precision.js';

export { POIDS };

// Types soumis au filtre. Même périmètre que le filtre de vocabulaire qu'il
// prolonge, et pour la même raison : ORG et LOC portent le gros du bruit ET la
// donnée la moins sensible - une raison sociale ou une ville ne sont pas des
// données personnelles au sens du RGPD, alors que le bruit qu'on retire rendait
// le document inexploitable.
export const TYPES_FILTRES = new Set(['ORG', 'LOC']);

// Les poids appris vivent dans `poids-precision.js`, fichier généré par
// `node tools/filtre/entrainer.mjs`. Séparés pour deux raisons : on relit les
// commentaires de ce module sans faire défiler des nombres, et on régénère les
// nombres sans risquer de toucher à la logique ni aux garde-fous.
//
// `POIDS === null` rend le filtre inerte - ne rien retirer est toujours sûr.

const sigmoide = (z) => 1 / (1 + Math.exp(-z));

// Probabilité que le candidat soit une vraie entité. Proche de 1 = on garde.
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
// ON NE PEUT PAS SE CONTENTER DES APPORTS NÉGATIFS. Une caractéristique à
// poids positif dont la valeur est basse (un score faible, aucune majuscule)
// n'apporte rien du tout - son apport vaut 0, pas moins - alors qu'elle est
// souvent LA raison pour laquelle le total reste bas. La comparer à 0 la
// rendrait donc invisible dans l'explication.
//
// On mesure donc chaque caractéristique par son écart au meilleur cas :
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

// Garde-fou 4 : un candidat d'un seul mot ne se juge pas.
//
// Le filtre perdait « Vaquier », seul dans une cellule, et « Fontaine » (de
// « Rose Fontaine »), tous deux étiquetés ENTREPRISE donc hors de portée du
// garde-fou 3 qui raisonne par type. Un patronyme mal étiqueté reste un
// patronyme.
//
// Un mot seul n'offre presque aucune prise : le lexique n'y voit rien, `nbMots`
// ne pèse qu'un cinquième, et il ne reste que le score du modèle, dont on a
// mesuré qu'il ne sépare rien. Or les candidats d'un mot sont massivement des
// patronymes et des villes.
//
// Et on ne perd rien : les faux positifs réellement attrapés sont tous des
// groupes de plusieurs mots. Les seuls candidats d'un mot que le filtre
// retirait étaient « JaCoCo » et « BDD », que les profils traitent mieux.
export const MOTS_MINIMUM = 2;

// Garde-fou 5 : la FORME d'un nom protège, pas seulement son étiquette.
//
// Sur « Rose Fontaine cultive une rose ancienne dans son jardin », le modèle
// étiquette « Rose Fontaine » en ENTREPRISE, donc le garde-fou 3, qui raisonne
// par type, ne la voit pas. Le filtre la retire à 0,177 : « rose » est au
// dictionnaire et le document l'écrit en minuscules plus loin. Les deux signaux
// dont ce filtre tire sa valeur se retournent contre un patronyme.
//
// L'erreur était de s'appuyer sur l'étiquette, que le modèle peut se tromper à
// donner, plutôt que sur la forme, qui ne ment pas.
//
// Coût mesuré : protège 458 vraies entités sur 706 pour 7 faux positifs sur
// 418. Deux à trois mots, aucun chiffre : au-delà c'est une raison sociale.
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

// Filtre une liste d'entités. `texte` est le document entier : deux des
// caractéristiques (occurrences, minuscules ailleurs) n'existent qu'à cette
// échelle - c'est la raison pour laquelle ce filtre se branche au niveau de
// `anonymizeUnits` et non dans `detectGliner`, qui ne voit qu'une unité.
export function filtrerParPrecision(entities, texte, { modele = POIDS, sousMots, journal } = {}) {
  if (!modele || !entities?.length) return entities || [];
  const ctx = contexteDocument(texte, { sousMots });
  return entities.filter(e => {
    // Garde-fous 2 à 5 : le déterministe, les types autres qu'ORG/LOC, les
    // candidats d'un seul mot et tout ce qui a la forme d'un nom propre passent
    // intacts, sans même être évalués.
    if (!filtrable(e)) return true;
    const p = scorePrecision(e, ctx, modele);
    if (p >= modele.seuil) return true;
    if (journal) journal.push({ valeur: e.value, type: e.type, p, motif: expliquer(e, ctx, modele) });
    return false;
  });
}

// La composition des deux passes, à un seul endroit.
//
// Pourquoi elle est ici et pas chez chaque appelant. Elle vivait dans main.js ;
// le banc, lui, se fabriquait son propre arbitre - sans le filtre. Résultat
// mesuré : le filtre livré ne changeait rien aux chiffres du banc, non parce
// qu'il était inefficace mais parce que le banc ne l'exécutait pas. C'est
// exactement le défaut que docs/notes-techniques.md documente (« le banc mesurait `quantized`
// pendant que la popup chargeait autre chose ») : une porte de qualité qui note
// autre chose que ce qu'on expédie ne garantit rien.
//
// L'ordre compte et n'est pas interchangeable : c'est celui sur lequel le filtre
// a été entraîné (voir tools/filtre/construire-jeu.mjs). L'arbitre réinterroge
// le modèle avec des labels leurres, le filtre pèse ensuite ce qui reste.
export function composerArbitre(pipe, arbitrerFauxPositifs) {
  if (!pipe) return undefined;
  return async (entities, texte) =>
    filtrerParPrecision(await arbitrerFauxPositifs(entities, pipe), texte);
}
