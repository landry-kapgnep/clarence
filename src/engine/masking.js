// Masquage cohérent + table de mapping (cadrage §4).
//
// - Placeholders typés et numérotés : [PERSONNE_1], [EMAIL_1]…
// - Option pseudonymes réalistes (opts.pseudonymize) pour certains types.
// - Même valeur (même type) → même substitut partout, y compris les
//   occurrences que la détection aurait ratées (propagation par valeur).
// - La table de mapping vit uniquement en mémoire, jamais persistée/transmise.

import { HONORIFICS } from './honorifics.js';

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

// Nos propres placeholders - à ne jamais remasquer.
//
// Le défaut qu'on ferme (01/09/2026, constaté sur un vrai CV repassé une
// seconde fois). Le modèle voit « [PERSONNE_2] », y trouve une entité, et on
// écrit « [[PERSONNE_1]] ». Trois conséquences, la dernière étant grave :
//   · le document devient illisible (crochets imbriqués) ;
//   · la table de correspondance dit « [PERSONNE_1] → PERSONNE_2 », donc rien ;
//   · la réinjection est morte. La table du premier passage a disparu avec la
//     popup : plus rien ne relie « [PERSONNE_1] » au vrai nom.
//
// Le geste est banal - on anonymise, le résultat ne convient pas, on repasse la
// sortie. Un outil doit reconnaître ce qu'il a lui-même écrit.
//
// Le motif est construit à partir de type_labels, jamais recopié : ajouter un
// type sans mettre le motif à jour rouvrirait le trou en silence.
const MOTIF_PLACEHOLDER = new RegExp(
  '^\\[?(?:' + [...new Set(Object.values(TYPE_LABELS))].join('|') + ')_\\d+\\]?$');

// Les crochets sont OPTIONNELS : le recalage sur les frontières de mot
// (snapToWordBoundaries) les retire souvent, si bien que le candidat arrive
// sous la forme « PERSONNE_2 » et non « [PERSONNE_2] ».
export const estPlaceholder = (valeur) => MOTIF_PLACEHOLDER.test(String(valeur || '').trim());

// entities : sortie de mergeEntities/selectActive (triées, sans chevauchement).
// opts.pseudonymize : fn(type, value) → pseudo réaliste ou null (→ placeholder).
// Retourne { masked, mapping } ; mapping = [{ placeholder, value, type, realistic }].
// Compte les occurrences d'un placeholder dans le texte masqué.
//
// `indexOf` en boucle et non une RegExp : un pseudonyme réaliste (« Noémie
// Rousseau ») n'est pas échappé et contiendrait des métacaractères, et un
// placeholder porte des crochets - deux façons de casser une RegExp construite
// à la volée. La recherche littérale n'a pas ce problème.
function compterOccurrences(texte, aiguille) {
  if (!aiguille) return 0;
  let n = 0, i = texte.indexOf(aiguille);
  while (i !== -1) { n++; i = texte.indexOf(aiguille, i + aiguille.length); }
  return n;
}

export function maskText(text, entities, opts = {}) {
  const pseudonymize = opts.pseudonymize || null;
  const byValue = new Map();
  const counters = new Map();
  const mapping = [];

  // Passe 1 - remplacement des entités détectées, substitut cohérent par valeur.
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
      // `occurrences` est rempli plus bas, une fois la propagation faite : c'est
      // ce compteur qui permet de trier la table de correspondance par
      // fréquence. Le sur-masquage se concentre en tête de cette distribution
      // - mesuré sur un vrai mémoire, « ChatGPT » masqué 41 fois et « MT »
      // 25 fois, quand la vraie donnée personnelle n'apparaissait qu'UNE fois.
      mapping.push({ placeholder: ph, value: e.value, type: e.type, realistic, occurrences: 0 });
    }
    out += text.slice(cursor, e.start) + ph;
    cursor = e.end;
  }
  out += text.slice(cursor);

  // Passe 2 - propagation (voir propagatedSpans). Appliquée de droite à gauche
  // pour que les positions calculées restent valides pendant la substitution.
  const spans = propagatedSpans(out, mapping);
  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    out = out.slice(0, s.start) + s.placeholder + out.slice(s.end);
  }

  // Comptage après propagation : on compte ce que l'utilisateur voit vraiment
  // dans le document final, pas ce que la détection avait proposé. Les deux
  // diffèrent - la propagation rattrape des occurrences que le modèle a ratées.
  for (const m of mapping) {
    m.occurrences = compterOccurrences(out, m.placeholder);
  }

  return { masked: out, mapping };
}

// Propagation : toute occurrence d'une valeur déjà mappée est masquée aussi,
// même là où la détection l'a ratée (répétition sans contexte, titre de page…).
//
// Partagé entre maskText et anonymizeUnits, et c'est le point critique : les
// adaptateurs qui réécrivent un fichier (PDF reconstruit, DOCX) ne repartent
// pas de la chaîne masquée mais de la liste d'entités. Tant que la propagation
// ne vivait que dans maskText, ces occurrences fuyaient dans le fichier final
// alors qu'elles étaient bien masquées dans l'aperçu - constaté sur un vrai
// rapport de stage, où un nom de tuteur détecté page 5 restait en clair
// page 1. Une seule implémentation, donc, qui ne peut plus diverger.
//
// - valeurs les plus longues d'abord (« Rose Fontaine » avant « Rose ») ;
// - frontières Unicode incluant « _ » : jamais de match à l'intérieur d'un
//   placeholder déjà posé ([NIR_1]) ni en milieu de mot (Lyonnais) ;
// - insensible à la casse : « Meteojob » et « meteojob » dans une URL sont la
//   même entité. Sans ça, la seconde était masquée et la première laissée en
//   clair dans le même document (constaté).
//
// Particules et titres : jamais identifiants seuls, et propager « de » ou
// « Monsieur » masquerait la moitié d'un document. Classe fermée, donc une
// liste est ici légitime (même raisonnement que honorifics.js).
const PARTICULES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'van', 'von', 'da', 'di', 'bin', 'al', 'ben'
]);

// Composants d'un NOM propagés séparément - la fuite que le banc a révélée.
//
// La propagation ne travaillait que sur la valeur entière : « Marcus Whitfield »
// masqué à sa première occurrence, mais « Marcus » réutilisé seul dix lignes
// plus bas restait en clair. C'est une forme d'usage très courante dans un mail
// ou un rapport, et un prénom accolé au reste du document désigne la personne
// aussi sûrement que le nom complet.
//
// Trois garde-fous, chacun contre un sur-masquage identifié :
//  - sensible à la casse, contrairement à la propagation normale : sans ça,
//    « Rose Fontaine » ferait disparaître toutes les « rose » du document, et
//    « Pierre Martin » toutes les « pierre ». Un prénom réel porte sa majuscule.
//  - composants d'au moins 4 caractères : en dessous, trop de collisions avec
//    des mots courants.
//  - particules et civilités écartées (voir PARTICULES / HONORIFICS).
//
// Pseudonymes : le substitut est un nom complet (« Noémie Rousseau »), pas un
// [PERSONNE_n]. On associe alors les composants deux à deux dans l'ordre
// (« Marcus »→« Noémie »), ce qui est exact puisque pseudonyms.js construit le
// nom complet À partir de ses composants, dans l'ordre. Si les deux comptes
// diffèrent, on s'abstient plutôt que de risquer un substitut incohérent.
function composantsDeNoms(mapping) {
  const out = [];
  for (const m of mapping) {
    if (m.type !== 'PER' || !m.value) continue;
    const parts = m.value.split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;
    const subs = m.realistic ? String(m.placeholder).split(/\s+/).filter(Boolean) : null;
    if (subs && subs.length !== parts.length) continue;
    parts.forEach((p, i) => {
      if (p.length < 4) return;
      const bas = p.toLowerCase();
      if (PARTICULES.has(bas) || HONORIFICS.has(bas)) return;
      out.push({ placeholder: subs ? subs[i] : m.placeholder, value: p, exactCase: true });
    });
  }
  return out;
}

// occupied : spans déjà couverts, à ne pas re-masquer (entités détectées).
// Retourne [{ start, end, placeholder }] trié, sans chevauchement.
export function propagatedSpans(text, mapping, occupied = []) {
  const spans = [];
  const taken = occupied.map(o => ({ start: o.start, end: o.end }));
  const ordered = [...mapping, ...composantsDeNoms(mapping)]
    .sort((a, b) => b.value.length - a.value.length);
  for (const { placeholder, value, exactCase } of ordered) {
    if (!value) continue;
    const re = new RegExp(
      '(?<![\\p{L}\\p{N}_])' + escapeRe(value) + '(?![\\p{L}\\p{N}_])',
      exactCase ? 'gu' : 'giu'
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

// Désanonymisation : substitution en un seul passage - une valeur restituée
// qui contiendrait elle-même un motif [type_N] ne doit pas être re-substituée.
export function reinject(text, mapping) {
  if (!mapping.length) return text;
  const byPlaceholder = new Map(mapping.map(m => [m.placeholder, m.value]));
  const re = new RegExp(mapping.map(m => escapeRe(m.placeholder)).join('|'), 'g');
  return text.replace(re, ph => byPlaceholder.get(ph) ?? ph);
}
