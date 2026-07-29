// Orchestrateur partagé par les 3 adaptateurs (CSV/XLSX/DOCX) : traite tout
// un fichier comme UN document virtuel pour que maskText assigne des
// placeholders cohérents partout (voir docs/cadrage-mvp.md §4) — jamais un
// appel par cellule/paragraphe isolé, qui numéroterait les placeholders au
// hasard d'une unité à l'autre pour une même valeur répétée.
import { detectRegex } from '../engine/regex-detect.js';
import { detectPhonesIntl } from '../engine/phone-intl.js';
import { detectNER } from '../engine/ner.js';
import { mergeEntities } from '../engine/merge.js';
import { selectActive, forcedMasks, filterByRules } from '../engine/selection.js';
import { maskText } from '../engine/masking.js';

// Séparateur entre unités : caractères de la zone d'usage privé Unicode,
// jamais présents dans un vrai document, encadrés de retours à la ligne.
// Frontière dure qu'aucune entité ni propagation de maskText ne franchit,
// donc masked.split(UNIT_SEP) retrouve exactement le texte de chaque unité.
// Les retours à la ligne donnent en plus une frontière visible au tokenizer du
// modèle (les caractères de zone privée, eux, sont ignorés par lui : sans eux
// les unités lui apparaissent collées). NB : cela n'a PAS suffi à corriger les
// noms ratés en tête d'unité — la vraie cause était le fenêtrage de détection,
// voir detectNerPerUnit ci-dessous.
export const UNIT_SEP = '\n\u{E000}\u{E004}\u{E000}\n';

// Détection NER unité par unité, et NON sur le texte combiné.
//
// Mesuré sur un vrai CV (38 unités) : le texte combiné donnait 7 entités et
// AUCUN nom de personne, alors que le même modèle détecte parfaitement le nom
// quand l'unité est isolée. Par unité : 22 entités, nom trouvé, pour seulement
// +24 % de temps. Un contexte propre vaut mieux qu'une grande fenêtre — testé
// aussi en lots de 150/300/600 caractères : tous échouaient à trouver le nom.
// (Le masquage, lui, reste fait sur le texte combiné : c'est de là que vient
// la cohérence des placeholders, indépendamment de la détection.)
//
// Deux garde-fous pour les fichiers à nombreuses cellules (CSV/XLSX), où un
// appel par cellule serait prohibitif :
//  - unités sans aucune suite de 2 lettres (nombres, dates, codes) : ignorées ;
//  - textes identiques (valeurs répétées d'une colonne) : détectés une seule fois.
async function detectNerPerUnit(units, ranges, nerPipeline, onProgress) {
  const out = [];
  const cache = new Map();
  for (let i = 0; i < units.length; i++) {
    const text = units[i].text;
    if (/\p{L}{2}/u.test(text)) {
      if (!cache.has(text)) cache.set(text, await detectNER(text, nerPipeline));
      const base = ranges[i].start;
      for (const e of cache.get(text)) {
        out.push({ ...e, start: e.start + base, end: e.end + base });
      }
    }
    if (onProgress) await onProgress({ done: i + 1, total: units.length });
  }
  return out;
}

function joinWithSentinel(units) {
  let combined = '';
  const ranges = [];
  for (const u of units) {
    if (u.text.includes(UNIT_SEP)) {
      throw new Error(`anonymizeUnits : le texte de l'unité "${u.id}" contient déjà le séparateur interne réservé`);
    }
    const start = combined.length;
    combined += u.text;
    ranges.push({ id: u.id, start, end: combined.length });
    combined += UNIT_SEP;
  }
  return { combined, ranges };
}

// units : [{ id, text }].
//
// Retourne { results, mapping } :
// - results : [{ id, text, maskedText, entities }] dans l'ordre d'entrée.
//   `entities` : offsets LOCAUX à l'unité + placeholder — utile à DOCX qui
//   doit redistribuer sur des runs ; CSV/XLSX n'utilisent que `maskedText`.
// - mapping : table de correspondance complète, identique à celle de maskText.
//
// Limite connue et assumée : `entities` ne couvre que les valeurs
// explicitement détectées (regex/NER) sur le document combiné — PAS les
// répétitions rattrapées uniquement par la propagation de maskText (elle,
// bien incluse dans `maskedText`). Sans impact pour CSV/XLSX ; pour DOCX,
// une répétition non détectée dans SON PROPRE paragraphe pourrait ne pas
// être masquée dans le fichier réécrit — limite documentée, pas cachée.
// Options de règles personnalisées (mêmes primitives que le mode texte,
// voir selection.js — logique zéro tolérance partagée, jamais dupliquée) :
// - forceTerms    : termes « toujours masquer » (recherche littérale, toutes occurrences) ;
// - disabledTypes : Set de types que l'utilisateur choisit de NE PAS masquer ;
// - keepValues    : valeurs « ne jamais masquer » (les masques forcés restent intouchables).
// onProgress (optionnel) : transmis à detectNER, pour afficher l'avancement
// (le NER est le poste long — voir commentaire dans ner.js).
export async function anonymizeUnits(units, { nerPipeline, maskOpts, forceTerms, disabledTypes, keepValues, onProgress } = {}) {
  const nonEmpty = units.filter(u => u.text.length > 0);
  const { combined, ranges } = joinWithSentinel(nonEmpty);

  // Structuré = regex FR + téléphones internationaux (libphonenumber).
  const regexEntities = [...detectRegex(combined), ...detectPhonesIntl(combined)];
  const nerEntities = nerPipeline ? await detectNerPerUnit(nonEmpty, ranges, nerPipeline, onProgress) : [];
  const forced = forcedMasks(combined, forceTerms || []);
  const selected = selectActive(mergeEntities(regexEntities, nerEntities), forced, new Set());
  const active = filterByRules(selected, {
    disabledTypes: disabledTypes || new Set(),
    keepValues: keepValues || []
  });
  const { masked, mapping } = maskText(combined, active, maskOpts);

  const placeholderByEntity = new Map(mapping.map(m => [`${m.type}|${m.value}`, m.placeholder]));
  const entitiesByUnitId = new Map(ranges.map(r => [r.id, []]));
  for (const e of active) {
    const range = ranges.find(r => e.start >= r.start && e.end <= r.end);
    if (!range) continue; // défensif : ne devrait jamais arriver (séparateur infranchissable)
    entitiesByUnitId.get(range.id).push({
      start: e.start - range.start,
      end: e.end - range.start,
      placeholder: placeholderByEntity.get(`${e.type}|${e.value}`)
    });
  }

  const maskedParts = masked.split(UNIT_SEP);
  const results = nonEmpty.map((u, i) => ({
    id: u.id,
    text: u.text,
    maskedText: maskedParts[i],
    entities: entitiesByUnitId.get(u.id)
  }));

  const emptyResults = units
    .filter(u => u.text.length === 0)
    .map(u => ({ id: u.id, text: u.text, maskedText: u.text, entities: [] }));

  return { results: [...results, ...emptyResults], mapping };
}
