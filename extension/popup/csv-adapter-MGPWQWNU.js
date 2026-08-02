import "./chunk-PIRHQTI4.js";

// src/files/csv-adapter.js
function sniffDelimiter(text) {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? "";
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return semi > comma ? ";" : ",";
}
function sniffEOL(text) {
  if (text.includes("\r\n")) return "\r\n";
  if (text.includes("\n")) return "\n";
  if (text.includes("\r")) return "\r";
  return "\n";
}
function parseCSV(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;
  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r" || c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += c === "\r" && text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
var BOM = String.fromCharCode(65279);
function serializeCSV(rows, { delimiter, eol, hasBOM, trailingEOL }) {
  const lines = rows.map((row) => row.map((field) => {
    const needsQuote = field.includes(delimiter) || field.includes('"') || field.includes("\n") || field.includes("\r");
    return needsQuote ? '"' + field.replace(/"/g, '""') + '"' : field;
  }).join(delimiter));
  return (hasBOM ? BOM : "") + lines.join(eol) + (trailingEOL ? eol : "");
}
function parseMeta(csvText) {
  const hasBOM = csvText.charCodeAt(0) === 65279;
  const body = hasBOM ? csvText.slice(1) : csvText;
  const delimiter = sniffDelimiter(body);
  const eol = sniffEOL(body);
  const rows = parseCSV(body, delimiter);
  const trailingEOL = /\r\n$|\n$|\r$/.test(body);
  return { rows, delimiter, eol, hasBOM, trailingEOL };
}
function extractTextUnits(csvText) {
  const meta = parseMeta(csvText);
  const units = [];
  meta.rows.forEach((row, r) => row.forEach((cell, c) => {
    if (cell.length > 0) units.push({ id: `r${r}c${c}`, text: cell });
  }));
  return { units, meta };
}
function applyMask(csvText, resultsById) {
  const { rows, delimiter, eol, hasBOM, trailingEOL } = parseMeta(csvText);
  for (const [id, { maskedText }] of resultsById) {
    const m = /^r(\d+)c(\d+)$/.exec(id);
    if (!m) continue;
    const [, r, c] = m;
    if (rows[r] && rows[r][c] !== void 0) rows[r][c] = maskedText;
  }
  return serializeCSV(rows, { delimiter, eol, hasBOM, trailingEOL });
}
function stripMetadata(csvText) {
  return csvText;
}
export {
  applyMask,
  extractTextUnits,
  stripMetadata
};
