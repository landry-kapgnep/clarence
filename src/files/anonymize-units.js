// Orchestrateur partagé par les 3 adaptateurs (CSV/XLSX/DOCX) : traite tout
// un fichier comme UN document virtuel pour que maskText assigne des
// placeholders cohérents partout (voir docs/cadrage-mvp.md §4) — jamais un
// appel par cellule/paragraphe isolé, qui numéroterait les placeholders au
// hasard d'une unité à l'autre pour une même valeur répétée.
import { detectRegex } from '../engine/regex-detect.js';
import { detectNER } from '../engine/ner.js';
import { mergeEntities } from '../engine/merge.js';
import { selectActive, forcedMasks, filterByRules } from '../engine/selection.js';
import { maskText } from '../engine/masking.js';

// Séparateur entre unités : caractère de la zone d'usage privé Unicode,
// jamais présent dans un vrai document. Frontière dure qu'aucune entité ni
// aucune propagation de maskText ne peut franchir, donc masked.split(UNIT_SEP)
// retrouve exactement le texte masqué de chaque unité — propagation
// (répétitions non détectées individuellement) comprise gratuitement.
export const UNIT_SEP = '';

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
export async function anonymizeUnits(units, { nerPipeline, maskOpts, forceTerms, disabledTypes, keepValues } = {}) {
  const nonEmpty = units.filter(u => u.text.length > 0);
  const { combined, ranges } = joinWithSentinel(nonEmpty);

  const regexEntities = detectRegex(combined);
  const nerEntities = nerPipeline ? await detectNER(combined, nerPipeline) : [];
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
