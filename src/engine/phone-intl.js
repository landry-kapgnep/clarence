// Détection des téléphones au format international (+XX), tous pays, via
// libphonenumber-js (portage JS de la référence Google, métadonnées maintenues
// par la bibliothèque - nous n'avons aucun motif par pays à écrire ni à suivre).
//
// Pourquoi en complément et non en remplacement de la regex FR de
// regex-detect.js : mesuré sur des cas réels,
//  - sans pays par défaut, la bibliothèque ne capte QUE le format international,
//    donc zéro faux positif sur nos pièges (« 483 921 657 » SIREN invalide,
//    « 4970123456789012 » carte, « 1 240,50 € ») - vérifié par test ;
//  - avec un pays par défaut (FR), elle prend « 483 921 657 » pour un numéro
//    français et casserait la fixture « zéro faux positif ». Écarté.
// La regex FR continue donc de couvrir les numéros nationaux (06…, 0033…), et
// cette passe ajoute le reste du monde.
//
// extended: true → accepte les numéros plausibles mais non strictement valides
// (ex. « +1 (551) 019-2834 », central US impossible). Priorité zéro-fuite,
// même logique que maskIfStructureMatches pour l'IBAN/NIR : mieux vaut masquer
// un numéro fictif que laisser fuir un vrai numéro mal formé.
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
