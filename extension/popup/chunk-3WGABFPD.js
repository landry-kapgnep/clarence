// src/files/text-units.js
function joinRuns(runs) {
  let text = "";
  const ranges = [];
  for (const r of runs) {
    const start = text.length;
    text += r.text;
    ranges.push({ id: r.id, start, end: text.length });
  }
  return { text, ranges };
}
function distributeEntitiesOverRuns(runs, entities) {
  const { ranges } = joinRuns(runs);
  let entityIdx = 0;
  return runs.map((run, i) => {
    const { start: runStart, end: runEnd } = ranges[i];
    let out = "";
    let cursor = runStart;
    while (cursor < runEnd) {
      while (entityIdx < entities.length && entities[entityIdx].end <= cursor) entityIdx++;
      const e = entities[entityIdx];
      if (!e || e.start >= runEnd) {
        out += run.text.slice(cursor - runStart, runEnd - runStart);
        cursor = runEnd;
      } else if (e.start > cursor) {
        const copyEnd = Math.min(e.start, runEnd);
        out += run.text.slice(cursor - runStart, copyEnd - runStart);
        cursor = copyEnd;
      } else {
        if (cursor === e.start) out += e.placeholder;
        cursor = Math.min(e.end, runEnd);
        if (cursor >= e.end) entityIdx++;
      }
    }
    return { id: run.id, text: out };
  });
}

export {
  joinRuns,
  distributeEntitiesOverRuns
};
