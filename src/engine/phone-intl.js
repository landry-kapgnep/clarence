// Téléphones au format international (+XX), tous pays, via libphonenumber-js.
// Les métadonnées sont maintenues par la bibliothèque : aucun motif par pays à
// écrire ni à suivre.
//
// En COMPLÉMENT de la regex FR, pas en remplacement. Sans pays par défaut, la
// bibliothèque ne capte que le format international, donc zéro faux positif sur
// nos pièges (« 483 921 657 » SIREN, « 1 240,50 € »). Avec `defaultCountry:
// 'FR'` elle prend le SIREN pour un numéro français et casse la fixture. La
// regex FR couvre donc les numéros nationaux, cette passe le reste du monde.
//
// `extended: true` accepte les numéros plausibles mais non strictement valides.
// Priorité zéro-fuite, même logique que maskIfStructureMatches : mieux vaut
// masquer un numéro fictif que laisser fuir un vrai mal formé.
import { findNumbers } from 'libphonenumber-js';

export function detectPhonesIntl(text) {
  let matches, strict;
  try {
    matches = findNumbers(text, { extended: true });
    // En mode étendu, la bibliothèque ne renvoie PAS d'objet numéro (donc pas
    // de isValid()) : on repasse en strict pour savoir lesquels sont réellement
    // valides, et `validated` reste ainsi honnête sans deviner.
    strict = new Set(findNumbers(text).map(m => `${m.startsAt}:${m.endsAt}`));
  } catch {
    return []; // défensif : jamais bloquer l'analyse sur un souci de la lib
  }

  const out = [];
  for (const m of matches) {
    const value = text.slice(m.startsAt, m.endsAt);
    if (!value.includes('+')) continue; // format international uniquement
    out.push({
      type: 'TELEPHONE',
      value,
      start: m.startsAt,
      end: m.endsAt,
      source: 'regex', // déterministe, comme la passe structurée
      validated: strict.has(`${m.startsAt}:${m.endsAt}`)
    });
  }
  return out;
}
