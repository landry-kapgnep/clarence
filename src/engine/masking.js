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
  DATE: 'DATE', ID_NATIONAL: 'ID_NATIONAL',
  // Apportés par le NER zero-shot (gliner.js), hors de portée des catégories
  // figées du modèle BERT. SANTE et NATIONALITE sont des données sensibles au
  // sens RGPD (art. 9), d'où leur masquage par défaut.
  POSTE: 'POSTE', NATIONALITE: 'NATIONALITE',
  ETABLISSEMENT: 'ETABLISSEMENT', SANTE: 'SANTE'
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

  // Passe 2 — propagation (voir propagatedSpans). Appliquée de droite à gauche
  // pour que les positions calculées restent valides pendant la substitution.
  const spans = propagatedSpans(out, mapping);
  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    out = out.slice(0, s.start) + s.placeholder + out.slice(s.end);
  }

  return { masked: out, mapping };
}

// Propagation : toute occurrence d'une valeur DÉJÀ mappée est masquée aussi,
// même là où la détection l'a ratée (répétition sans contexte, titre de page…).
//
// Partagé entre maskText et anonymizeUnits, et c'est le POINT CRITIQUE : les
// adaptateurs qui réécrivent un fichier (PDF reconstruit, DOCX) ne repartent
// pas de la chaîne masquée mais de la liste d'entités. Tant que la propagation
// ne vivait que dans maskText, ces occurrences fuyaient dans le fichier final
// alors qu'elles étaient bien masquées dans l'aperçu — constaté sur un vrai
// rapport de stage, où un nom de tuteur détecté page 5 restait en clair
// page 1. Une seule implémentation, donc, qui ne peut plus diverger.
//
// - valeurs les plus longues d'abord (« Rose Fontaine » avant « Rose ») ;
// - frontières Unicode incluant « _ » : jamais de match à l'intérieur d'un
//   placeholder déjà posé ([NIR_1]) ni en milieu de mot (Lyonnais) ;
// - INSENSIBLE À LA CASSE : « Meteojob » et « meteojob » dans une URL sont la
//   même entité. Sans ça, la seconde était masquée et la première laissée en
//   clair dans le même document (constaté).
//
// occupied : spans déjà couverts, à ne pas re-masquer (entités détectées).
// Retourne [{ start, end, placeholder }] trié, sans chevauchement.
export function propagatedSpans(text, mapping, occupied = []) {
  const spans = [];
  const taken = occupied.map(o => ({ start: o.start, end: o.end }));
  const ordered = [...mapping].sort((a, b) => b.value.length - a.value.length);
  for (const { placeholder, value } of ordered) {
    if (!value) continue;
    const re = new RegExp(
      '(?<![\\p{L}\\p{N}_])' + escapeRe(value) + '(?![\\p{L}\\p{N}_])', 'giu'
    );
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (!taken.some(t => start < t.end && end > t.start)) {
        spans.push({ start, end, placeholder });
        taken.push({ start, end });
      }
      if (re.lastIndex === m.index) re.lastIndex++; // garde-fou anti-boucle
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}

// Désanonymisation : substitution en UN SEUL passage — une valeur restituée
// qui contiendrait elle-même un motif [TYPE_N] ne doit pas être re-substituée.
export function reinject(text, mapping) {
  if (!mapping.length) return text;
  const byPlaceholder = new Map(mapping.map(m => [m.placeholder, m.value]));
  const re = new RegExp(mapping.map(m => escapeRe(m.placeholder)).join('|'), 'g');
  return text.replace(re, ph => byPlaceholder.get(ph) ?? ph);
}
