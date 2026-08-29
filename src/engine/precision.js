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

// Filtre une liste d'entités. `texte` est le DOCUMENT ENTIER : deux des
// caractéristiques (occurrences, minuscules ailleurs) n'existent qu'à cette
// échelle — c'est la raison pour laquelle ce filtre se branche au niveau de
// `anonymizeUnits` et non dans `detectGliner`, qui ne voit qu'une unité.
export function filtrerParPrecision(entities, texte, { modele = POIDS, sousMots, journal } = {}) {
  if (!modele || !entities?.length) return entities || [];
  const ctx = contexteDocument(texte, { sousMots });
  return entities.filter(e => {
    // Garde-fous 2 et 3 : le déterministe et les personnes passent intacts,
    // sans même être évalués.
    if (e.source !== 'ner' || !TYPES_FILTRES.has(e.type)) return true;
    const p = scorePrecision(e, ctx, modele);
    if (p >= modele.seuil) return true;
    if (journal) journal.push({ valeur: e.value, type: e.type, p, motif: expliquer(e, ctx, modele) });
    return false;
  });
}
