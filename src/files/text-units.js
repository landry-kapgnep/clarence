// Primitive partagée par les 3 adaptateurs (CSV/XLSX/DOCX) : reconstitue un
// texte à partir d'une liste de "runs" contigus, et redistribue des entités
// détectées (offsets dans le texte reconstitué) sur ces runs d'origine.
//
// Cas d'usage : pour CSV/XLSX, runs = [{ id, text: uniteEntière }] (dégénère
// en simple découpe). Pour DOCX, runs = les <w:r> réels d'un paragraphe —
// Word coupe souvent un nom sur plusieurs runs de mise en forme différente.

// runs: [{ id, text }] → { text, ranges: [{ id, start, end }] }
export function joinRuns(runs) {
  let text = '';
  const ranges = [];
  for (const r of runs) {
    const start = text.length;
    text += r.text;
    ranges.push({ id: r.id, start, end: text.length });
  }
  return { text, ranges };
}

// entities : triées, sans chevauchement, { start, end, placeholder } dans le
// référentiel du texte reconstitué par joinRuns(runs).
//
// Règle : une entité à cheval sur plusieurs runs pose son placeholder complet
// UNE SEULE FOIS, sur le run où elle COMMENCE ; les runs suivants qu'elle
// traverse ne gardent que leur texte situé APRÈS la fin de l'entité (jamais de
// répétition du placeholder, jamais de résidu de la valeur d'origine).
export function distributeEntitiesOverRuns(runs, entities) {
  const { ranges } = joinRuns(runs);
  let entityIdx = 0;

  return runs.map((run, i) => {
    const { start: runStart, end: runEnd } = ranges[i];
    let out = '';
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
