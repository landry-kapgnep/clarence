// Adaptateur CSV — Phase 1 (la plus simple : texte pur, zéro métadonnée,
// zéro dépendance). Parseur/sérialiseur RFC4180 fait main : champs entre
// guillemets (délimiteur/retour à la ligne/guillemet doublé), BOM UTF-8 et
// style de fin de ligne préservés à l'identique en sortie.
//
// Interface commune aux 3 adaptateurs (voir plan) :
//   extractTextUnits(text) → { units, meta }
//   applyMask(text, resultsById) → text masqué
//   stripMetadata(text) → text inchangé (le CSV n'a pas de métadonnées)

function sniffDelimiter(text) {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? '';
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

function sniffEOL(text) {
  if (text.includes('\r\n')) return '\r\n';
  if (text.includes('\n')) return '\n';
  if (text.includes('\r')) return '\r';
  return '\n';
}

// État-machine standard RFC4180 : gère guillemets, délimiteur/retour à la
// ligne à l'intérieur d'un champ cité, et guillemet échappé par doublement.
function parseCSV(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === delimiter) { row.push(field); field = ''; i++; continue; }
    if (c === '\r' || c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
      i += (c === '\r' && text[i + 1] === '\n') ? 2 : 1;
      continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const BOM = String.fromCharCode(0xFEFF);

function serializeCSV(rows, { delimiter, eol, hasBOM, trailingEOL }) {
  const lines = rows.map(row => row.map(field => {
    const needsQuote = field.includes(delimiter) || field.includes('"') ||
      field.includes('\n') || field.includes('\r');
    return needsQuote ? '"' + field.replace(/"/g, '""') + '"' : field;
  }).join(delimiter));
  return (hasBOM ? BOM : '') + lines.join(eol) + (trailingEOL ? eol : '');
}

function parseMeta(csvText) {
  const hasBOM = csvText.charCodeAt(0) === 0xFEFF;
  const body = hasBOM ? csvText.slice(1) : csvText;
  const delimiter = sniffDelimiter(body);
  const eol = sniffEOL(body);
  const rows = parseCSV(body, delimiter);
  // Fin de ligne terminale (usuelle dans les exports Unix) : préservée à
  // l'identique, sinon le round-trip modifie le fichier hors des cellules.
  const trailingEOL = /\r\n$|\n$|\r$/.test(body);
  return { rows, delimiter, eol, hasBOM, trailingEOL };
}

// La première ligne est-elle un EN-TÊTE de colonnes plutôt que des données ?
//
// L'enjeu est asymétrique, d'où la prudence : se tromper en croyant qu'une
// ligne de DONNÉES est un en-tête ferait sauter la détection contextuelle sur
// de vraies personnes — une fuite. Se tromper dans l'autre sens ne coûte que
// du sur-masquage. On n'affirme donc « en-tête » que sur une signature nette :
// plusieurs lignes, libellés courts, tous distincts, aucun chiffre isolé et
// aucune valeur qui ressemble déjà à une donnée personnelle.
//
// Même en cas d'erreur, la couche déterministe (regex + validateurs) continue
// de tourner sur l'intégralité du fichier : un email ou un IBAN placé en
// première ligne resterait masqué.
function looksLikeHeader(rows) {
  if (rows.length < 2) return false;
  const head = rows[0].filter(c => c.length > 0);
  if (head.length < 2) return false;

  const distincts = new Set(head.map(c => c.trim().toLowerCase()));
  if (distincts.size !== head.length) return false; // doublons → plutôt des données

  return head.every(c => {
    const v = c.trim();
    if (v.length > 40) return false;          // un libellé de colonne est court
    if (/\d/.test(v)) return false;           // « 1988-03-14 », « 38000 » → données
    if (v.includes('@')) return false;        // un email n'est pas un libellé
    return /\p{L}/u.test(v);                  // et il contient des lettres
  });
}

// { units: [{ id: 'r{row}c{col}', text, structurel? }], meta }
// Cellules vides ignorées.
//
// La ligne d'en-tête est marquée `structurel` : ses libellés décrivent les
// colonnes, ils ne sont jamais des données personnelles. Sans ce marquage, le
// modèle masquait « Date de naissance », « Matricule », « Salaire » — le
// fichier ressortait sûr et illisible (voir detectNerPerUnit).
//
// Les cellules de données, elles, restent ISOLÉES : leur isolement est ce qui
// permet au zero-shot de les qualifier. Leur ajouter le libellé de colonne en
// contexte a été mesuré et REJETÉ (détail dans anonymize-units.js).
export function extractTextUnits(csvText) {
  const meta = parseMeta(csvText);
  const entete = looksLikeHeader(meta.rows);
  const units = [];
  meta.rows.forEach((row, r) => row.forEach((cell, c) => {
    if (cell.length === 0) return;
    const unit = { id: `r${r}c${c}`, text: cell };
    if (entete && r === 0) unit.structurel = true;
    units.push(unit);
  }));
  return { units, meta };
}

// resultsById : Map<id, { maskedText }> — ré-analyse le CSV depuis zéro
// (fonction pure, aucun état réutilisé entre extractTextUnits et applyMask).
export function applyMask(csvText, resultsById) {
  const { rows, delimiter, eol, hasBOM, trailingEOL } = parseMeta(csvText);
  for (const [id, { maskedText }] of resultsById) {
    const m = /^r(\d+)c(\d+)$/.exec(id);
    if (!m) continue;
    const [, r, c] = m;
    if (rows[r] && rows[r][c] !== undefined) rows[r][c] = maskedText;
  }
  return serializeCSV(rows, { delimiter, eol, hasBOM, trailingEOL });
}

export function stripMetadata(csvText) {
  return csvText; // le CSV ne porte aucune métadonnée embarquée
}
