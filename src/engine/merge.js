// Fusion des passes + résolution des chevauchements.
//
// Règles (issues de la validation des fixtures, 2026-07-15) :
// 1. Le regex (déterministe) a priorité sur le NER en cas de chevauchement.
// 2. Entre entités regex qui se chevauchent, le span le plus long gagne
//    (ex. TELEPHONE détecté à l'intérieur d'un IBAN → l'IBAN gagne).
// 3. Sur un span strictement identique, priorité par type (ex. un 14 chiffres
//    Luhn-valide matche SIRET et CARTE_BANCAIRE — même checksum — on garde
//    SIRET_SIREN, plus probable en contexte FR ; la valeur est masquée dans
//    tous les cas, seul le libellé du placeholder change).

const TYPE_PRIORITY = [
  'NIR', 'IBAN', 'SIRET_SIREN', 'CARTE_BANCAIRE', 'EMAIL', 'TELEPHONE',
  'BIC', 'IP', 'MAC',
  'DATE_NAISSANCE', 'ADRESSE', 'CODE_POSTAL_VILLE', 'REFERENCE', 'MONTANT',
  'PER', 'ORG', 'LOC', 'MISC'
];
const rank = t => {
  const i = TYPE_PRIORITY.indexOf(t);
  return i === -1 ? TYPE_PRIORITY.length : i;
};

// Réduit une liste d'entités (toutes sources) à un ensemble sans chevauchement.
export function resolveOverlaps(entities) {
  const sorted = [...entities].sort((a, b) =>
    a.start - b.start ||
    (b.end - b.start) - (a.end - a.start) ||
    (a.source === 'regex' ? 0 : 1) - (b.source === 'regex' ? 0 : 1) ||
    rank(a.type) - rank(b.type)
  );
  const kept = [];
  for (const e of sorted) {
    if (kept.some(k => e.start < k.end && e.end > k.start)) continue;
    kept.push(e);
  }
  return kept.sort((a, b) => a.start - b.start);
}

export function mergeEntities(regexEntities, nerEntities) {
  const nerKept = nerEntities.filter(
    ne => !regexEntities.some(re => ne.start < re.end && ne.end > re.start)
  );
  return resolveOverlaps([...regexEntities, ...nerKept]);
}
