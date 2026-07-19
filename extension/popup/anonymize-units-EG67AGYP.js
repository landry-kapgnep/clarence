import {
  detectNER,
  detectRegex,
  filterByRules,
  forcedMasks,
  maskText,
  mergeEntities,
  selectActive
} from "./chunk-KNKQTNVF.js";
import "./chunk-JSBRDJBE.js";

// src/files/anonymize-units.js
var UNIT_SEP = "\uE000\uE004\uE000";
function joinWithSentinel(units) {
  let combined = "";
  const ranges = [];
  for (const u of units) {
    if (u.text.includes(UNIT_SEP)) {
      throw new Error(`anonymizeUnits : le texte de l'unit\xE9 "${u.id}" contient d\xE9j\xE0 le s\xE9parateur interne r\xE9serv\xE9`);
    }
    const start = combined.length;
    combined += u.text;
    ranges.push({ id: u.id, start, end: combined.length });
    combined += UNIT_SEP;
  }
  return { combined, ranges };
}
async function anonymizeUnits(units, { nerPipeline, maskOpts, forceTerms, disabledTypes, keepValues } = {}) {
  const nonEmpty = units.filter((u) => u.text.length > 0);
  const { combined, ranges } = joinWithSentinel(nonEmpty);
  const regexEntities = detectRegex(combined);
  const nerEntities = nerPipeline ? await detectNER(combined, nerPipeline) : [];
  const forced = forcedMasks(combined, forceTerms || []);
  const selected = selectActive(mergeEntities(regexEntities, nerEntities), forced, /* @__PURE__ */ new Set());
  const active = filterByRules(selected, {
    disabledTypes: disabledTypes || /* @__PURE__ */ new Set(),
    keepValues: keepValues || []
  });
  const { masked, mapping } = maskText(combined, active, maskOpts);
  const placeholderByEntity = new Map(mapping.map((m) => [`${m.type}|${m.value}`, m.placeholder]));
  const entitiesByUnitId = new Map(ranges.map((r) => [r.id, []]));
  for (const e of active) {
    const range = ranges.find((r) => e.start >= r.start && e.end <= r.end);
    if (!range) continue;
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
  const emptyResults = units.filter((u) => u.text.length === 0).map((u) => ({ id: u.id, text: u.text, maskedText: u.text, entities: [] }));
  return { results: [...results, ...emptyResults], mapping };
}
export {
  UNIT_SEP,
  anonymizeUnits
};
