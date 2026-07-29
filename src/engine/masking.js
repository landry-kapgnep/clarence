// Masquage cohérent + table de mapping (cadrage §4).
//
// - Placeholders typés et numérotés : [PERSONNE_1], [EMAIL_1]…
// - Option pseudonymes réalistes (opts.pseudonymize) pour certains types.
// - Même valeur (même type) → même substitut partout, y compris les
//   occurrences que la détection aurait ratées (propagation par valeur).
// - La table de mapping vit uniquement en mémoire, jamais persistée/transmise.

const TYPE_LABELS = {
  PER: 'PERSONNE', ORG: 'ENTREPRISE', LOC: 'LIEU', MISC: 'DIVERS',
  EMAIL: 'EMAIL', TELEPHONE: 'TELEPHONE', IBAN: 'IBAN',
  CARTE_BANCAIRE: 'CARTE', NIR: 'NIR', SIRET_SIREN: 'SIRET',
  CODE_POSTAL_VILLE: 'CODE_POSTAL', MONTANT: 'MONTANT',
  ADRESSE: 'ADRESSE', DATE_NAISSANCE: 'DATE_NAISSANCE', REFERENCE: 'REFERENCE',
  IP: 'IP', MAC: 'MAC', BIC: 'BIC', PSEUDO: 'PSEUDO',
  DATE: 'DATE', ID_NATIONAL: 'ID_NATIONAL'
};

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// entities : sortie de mergeEntities/selectActive (triées, sans chevauchement).
// opts.pseudonymize : fn(type, value) → pseudo réaliste ou null (→ placeholder).
// Retourne { masked, mapping } ; mapping = [{ placeholder, value, type, realistic }].
export function maskText(text, entities, opts = {}) {
  const pseudonymize = opts.pseudonymize || null;
  const byValue = new Map();
  const counters = new Map();
  const mapping = [];

  // Passe 1 — remplacement des entités détectées, substitut cohérent par valeur.
  let out = '';
  let cursor = 0;
  for (const e of entities) {
    const label = TYPE_LABELS[e.type] || e.type;
    const key = label + ' ' + e.value;
    let ph = byValue.get(key);
    if (!ph) {
      ph = pseudonymize ? pseudonymize(e.type, e.value) : null;
      const realistic = ph !== null && ph !== undefined;
      if (!realistic) {
        const n = (counters.get(label) || 0) + 1;
        counters.set(label, n);
        ph = '[' + label + '_' + n + ']';
      }
      byValue.set(key, ph);
      mapping.push({ placeholder: ph, value: e.value, type: e.type, realistic });
    }
    out += text.slice(cursor, e.start) + ph;
    cursor = e.end;
  }
  out += text.slice(cursor);

  // Passe 2 — propagation : toute occurrence restante d'une valeur déjà mappée
  // est masquée aussi (rattrape les ratés de détection sur les répétitions).
  // Valeurs les plus longues d'abord ("Rose Fontaine" avant "Rose") ;
  // frontières Unicode incluant "_" pour ne jamais matcher à l'intérieur
  // d'un placeholder déjà posé ([NIR_1], etc.) ni en milieu de mot (Lyonnais).
  const ordered = [...mapping].sort((a, b) => b.value.length - a.value.length);
  for (const { placeholder, value } of ordered) {
    const re = new RegExp(
      '(?<![\\p{L}\\p{N}_])' + escapeRe(value) + '(?![\\p{L}\\p{N}_])', 'gu'
    );
    out = out.replace(re, placeholder);
  }

  return { masked: out, mapping };
}

// Désanonymisation : substitution en UN SEUL passage — une valeur restituée
// qui contiendrait elle-même un motif [TYPE_N] ne doit pas être re-substituée.
export function reinject(text, mapping) {
  if (!mapping.length) return text;
  const byPlaceholder = new Map(mapping.map(m => [m.placeholder, m.value]));
  const re = new RegExp(mapping.map(m => escapeRe(m.placeholder)).join('|'), 'g');
  return text.replace(re, ph => byPlaceholder.get(ph) ?? ph);
}
