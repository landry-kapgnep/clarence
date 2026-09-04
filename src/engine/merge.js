// Fusion des passes + résolution des chevauchements.
//
// Règles (issues de la validation des fixtures, 2026-07-15) :
// 1. Le regex (déterministe) a priorité sur le NER en cas de chevauchement.
// 2. Entre entités regex qui se chevauchent, le span le plus long gagne
//    (ex. TELEPHONE détecté à l'intérieur d'un IBAN → l'IBAN gagne).
// 3. Sur un span strictement identique, priorité par type (ex. un 14 chiffres
//    Luhn-valide matche SIRET et CARTE_bancaire - même checksum - on garde
//    SIRET_SIREN, plus probable en contexte FR ; la valeur est masquée dans
//    tous les cas, seul le libellé du placeholder change).

const TYPE_PRIORITY = [
  'NIR', 'ID_NATIONAL', 'IBAN', 'SIRET_SIREN', 'CARTE_BANCAIRE', 'EMAIL', 'TELEPHONE',
  'BIC', 'IP', 'MAC', 'PSEUDO',
  'DATE_NAISSANCE', 'DATE', 'ADRESSE', 'CODE_POSTAL_VILLE', 'REFERENCE', 'MONTANT',
  // Types contextuels (NER/GLiNER) : toujours après les types regex, pour que
  // le déterministe l'emporte à span identique (cadrage §8).
  'PER', 'ORG', 'LOC',
  'SANTE', 'NATIONALITE', 'ETABLISSEMENT', 'POSTE',
  'MISC'
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

// Le déterministe prime, avec une exception non négociable : une entité
// contextuelle qui DÉBORDE de l'entité regex n'est jamais supprimée, sinon la
// partie non couverte reste en clair.
//
// Cas réel : « ROUSSEAU » matche le motif BIC et annulait « Amandine
// ROUSSEAU » détecté à 0,64. La sortie disait « Amandine [BIC_1] », le prénom
// en clair à côté d'un placeholder qui annonce son propre patronyme. Le banc
// comptait pourtant la valeur comme masquée, ne cherchant que la chaîne
// entière.
//
// Quand la contextuelle contient la regex, on garde la plus large : tout est
// masqué, seul le libellé est moins précis. À span identique ou en
// chevauchement partiel, le déterministe garde la main.
const contient = (ext, int) =>
  ext.start <= int.start && ext.end >= int.end &&
  (ext.end - ext.start) > (int.end - int.start);

export function mergeEntities(regexEntities, nerEntities) {
  const nerKept = nerEntities.filter(ne =>
    !regexEntities.some(re =>
      ne.start < re.end && ne.end > re.start && !contient(ne, re)
    )
  );
  return resolveOverlaps([...regexEntities, ...nerKept]);
}
