import {
  detectNER,
  detectPhonesIntl,
  detectRegex,
  filterByRules,
  forcedMasks,
  maskText,
  mergeEntities,
  propagatedSpans,
  selectActive,
  verifierAnnulation
} from "./chunk-GWTDFSIC.js";

// src/files/anonymize-units.js
var UNIT_SEP = "\n\uE000\uE004\uE000\n";
var DATE_NUE = /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/;
function meriteUnePasseContextuelle(text) {
  return new RegExp("\\p{L}{2}", "u").test(text) || DATE_NUE.test(text);
}
var VAGUE = 24;
async function detectNerPerUnit(units, ranges, nerPipeline, onProgress, detect, disabledTypes, signal, intitules = /* @__PURE__ */ new Set()) {
  const cache = /* @__PURE__ */ new Map();
  const parUnite = new Array(units.length);
  let faits = 0;
  for (let debut = 0; debut < units.length; debut += VAGUE) {
    verifierAnnulation(signal);
    const fin = Math.min(debut + VAGUE, units.length);
    const vague = [];
    for (let i = debut; i < fin; i++) {
      const { text, structurel } = units[i];
      if (structurel || !meriteUnePasseContextuelle(text)) continue;
      if (!cache.has(text)) cache.set(text, detect(text, nerPipeline, { disabledTypes }));
      const indice = i;
      vague.push(cache.get(text).then((entites) => {
        const base = ranges[indice].start;
        parUnite[indice] = entites.filter((e) => !(e.start === 0 && intitules.has(e.value))).map((e) => ({ ...e, start: e.start + base, end: e.end + base }));
      }));
    }
    await Promise.all(vague);
    faits = fin;
    if (onProgress) await onProgress({ done: faits, total: units.length });
  }
  const out = [];
  for (const entites of parUnite) if (entites) out.push(...entites);
  return out;
}
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
async function anonymizeUnits(units, { nerPipeline, nerDetect, maskOpts, forceTerms, disabledTypes, keepValues, onProgress, signal, arbitre, intitules, entitesConnues } = {}) {
  const nonEmpty = units.filter((u) => u.text.length > 0);
  const { combined, ranges } = joinWithSentinel(nonEmpty);
  const regexEntities = [...detectRegex(combined), ...detectPhonesIntl(combined)];
  let nerEntities;
  if (entitesConnues) {
    nerEntities = entitesConnues;
  } else {
    nerEntities = nerPipeline ? await detectNerPerUnit(nonEmpty, ranges, nerPipeline, onProgress, nerDetect || detectNER, disabledTypes, signal, new Set(intitules || [])) : [];
    if (arbitre && nerEntities.length) {
      verifierAnnulation(signal);
      nerEntities = await arbitre(nerEntities, combined);
    }
  }
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
  for (let i = 0; i < nonEmpty.length; i++) {
    const dejaVues = entitiesByUnitId.get(ranges[i].id);
    for (const s of propagatedSpans(nonEmpty[i].text, mapping, dejaVues)) {
      dejaVues.push(s);
    }
    dejaVues.sort((a, b) => a.start - b.start);
  }
  const maskedParts = masked.split(UNIT_SEP);
  const results = nonEmpty.map((u, i) => ({
    id: u.id,
    text: u.text,
    maskedText: maskedParts[i],
    entities: entitiesByUnitId.get(u.id)
  }));
  const emptyResults = units.filter((u) => u.text.length === 0).map((u) => ({ id: u.id, text: u.text, maskedText: u.text, entities: [] }));
  return { results: [...results, ...emptyResults], mapping, entitesContextuelles: nerEntities };
}

export {
  UNIT_SEP,
  anonymizeUnits
};
