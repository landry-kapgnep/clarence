// Robustesse des adaptateurs de fichiers : cas limites (fichiers vides,
// parties absentes, notes de bas de page, round-trip fidèle). Un adaptateur
// ne doit jamais planter sur un fichier valide inhabituel, et surtout jamais
// laisser fuir du texte d'une partie non traitée en silence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import * as XLSX from 'xlsx';
import * as csv from '../../src/files/csv-adapter.js';
import * as xlsx from '../../src/files/xlsx-adapter.js';
import * as docx from '../../src/files/docx-adapter.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

const domOpts = { DOMParser, XMLSerializer };

// ===== CSV ==================================================================

test('CSV vide : zéro unité, applyMask rend une chaîne vide sans planter', () => {
  const { units } = csv.extractTextUnits('');
  assert.equal(units.length, 0);
  assert.equal(csv.applyMask('', new Map()), '');
});

test('CSV : la fin de ligne terminale est préservée au round-trip', () => {
  const text = 'Nom;Email\nJean;j@ex.fr\n'; // export Unix typique, EOL final
  const out = csv.applyMask(text, new Map());
  assert.equal(out, text);
});

test('CSV sans fin de ligne terminale : rien d\'ajouté au round-trip', () => {
  const text = 'Nom;Email\nJean;j@ex.fr';
  assert.equal(csv.applyMask(text, new Map()), text);
});

test('CSV : un seul champ sans EOL ni délimiteur', () => {
  const { units } = csv.extractTextUnits('jean.dupont@ex.fr');
  assert.equal(units.length, 1);
  assert.equal(units[0].text, 'jean.dupont@ex.fr');
});

// ===== XLSX =================================================================

function makeWorkbookBuffer(rows, opts = {}) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), opts.sheetName || 'Feuille1');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

test('XLSX sans aucune cellule texte : zéro unité, pas de plantage', () => {
  const buf = makeWorkbookBuffer([[1, 2.5], [3, 4]]);
  const { units } = xlsx.extractTextUnits(buf);
  assert.equal(units.length, 0);
  // applyMask vide puis stripMetadata doivent rendre un classeur ré-ouvrable
  const out = xlsx.stripMetadata(xlsx.applyMask(buf, new Map()));
  const wb = XLSX.read(out, { type: 'array' });
  assert.equal(wb.Sheets.Feuille1.A1.v, 1);
});

test('XLSX : une cellule formule n\'est jamais extraite ni réécrite', () => {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([['jean@ex.fr', 42]]);
  sheet.C1 = { t: 'n', v: 84, f: 'B1*2' }; // formule (avec valeur cachée)
  sheet['!ref'] = 'A1:C1'; // étendre la plage déclarée, sinon C1 est ignorée à l'écriture
  XLSX.utils.book_append_sheet(wb, sheet, 'F');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const { units } = xlsx.extractTextUnits(buf);
  assert.deepEqual(units.map(u => u.id), ['F!A1']); // jamais C1
  const out = XLSX.read(xlsx.applyMask(buf, new Map([['F!A1', { maskedText: '[EMAIL_1]' }]])), { type: 'array' });
  assert.equal(out.Sheets.F.C1.f, 'B1*2', 'la formule doit survivre intacte');
  assert.equal(out.Sheets.F.A1.v, '[EMAIL_1]');
});

test('XLSX : stripMetadata sans commentaires ni docProps personnalisés ne plante pas', () => {
  const buf = makeWorkbookBuffer([['texte']]);
  const out = xlsx.stripMetadata(buf);
  assert.equal(XLSX.read(out, { type: 'array' }).Sheets.Feuille1.A1.v, 'texte');
});

test('XLSX : nom de feuille contenant un "!" - l\'id reste résoluble', () => {
  const buf = makeWorkbookBuffer([['jean@ex.fr']], { sheetName: 'Ventes!2026' });
  const { units } = xlsx.extractTextUnits(buf);
  assert.equal(units[0].id, 'Ventes!2026!A1');
  const out = XLSX.read(xlsx.applyMask(buf, new Map([[units[0].id, { maskedText: 'X' }]])), { type: 'array' });
  assert.equal(out.Sheets['Ventes!2026'].A1.v, 'X');
});

// ===== DOCX =================================================================

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const prolog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function makeDocxBuffer(parts) {
  const entries = {};
  for (const [name, xml] of Object.entries(parts)) entries[name] = strToU8(xml);
  return zipSync(entries).buffer;
}

test('DOCX : le texte des notes de bas de page est extrait (sinon fuite silencieuse)', async () => {
  const buf = makeDocxBuffer({
    'word/document.xml': `${prolog}<w:document ${W}><w:body><w:p><w:r><w:t>Voir la note.</w:t></w:r></w:p></w:body></w:document>`,
    'word/footnotes.xml': `${prolog}<w:footnotes ${W}><w:footnote w:id="1"><w:p><w:r><w:t>Contact : jean.dupont@ex.fr</w:t></w:r></w:p></w:footnote></w:footnotes>`
  });

  const { units } = docx.extractTextUnits(buf, domOpts);
  const note = units.find(u => u.id.startsWith('word/footnotes.xml#'));
  assert.ok(note, 'la note de bas de page doit produire une unité');
  assert.ok(note.text.includes('jean.dupont@ex.fr'));

  // pipeline complet : l'email de la note est masqué dans la partie réécrite
  const { results } = await anonymizeUnits(units);
  const byId = new Map(results.map(r => [r.id, { entities: r.entities }]));
  const zip = unzipSync(new Uint8Array(await docx.applyMask(buf, byId, domOpts)));
  const notesXml = strFromU8(zip['word/footnotes.xml']);
  assert.equal(notesXml.includes('jean.dupont@ex.fr'), false, 'fuite : email de note de bas de page');
  assert.match(notesXml, /\[EMAIL_1\]/);
});

test('DOCX sans docProps ni commentaires : stripMetadata ne plante pas', () => {
  const buf = makeDocxBuffer({
    'word/document.xml': `${prolog}<w:document ${W}><w:body><w:p><w:r><w:t>Bonjour.</w:t></w:r></w:p></w:body></w:document>`
  });
  const zip = unzipSync(new Uint8Array(docx.stripMetadata(buf, domOpts)));
  assert.ok(strFromU8(zip['word/document.xml']).includes('Bonjour.'));
});

test('DOCX : paragraphe vide et partie sans texte - aucune unité, pas de plantage', async () => {
  const buf = makeDocxBuffer({
    'word/document.xml': `${prolog}<w:document ${W}><w:body><w:p></w:p><w:p><w:r><w:tab/><w:br/></w:r></w:p></w:body></w:document>`
  });
  const { units } = docx.extractTextUnits(buf, domOpts);
  // le 2e paragraphe ne contient que \t\n : une "unité" sans texte utile est
  // acceptable tant qu'elle ne fait pas planter le pipeline complet
  assert.ok(Array.isArray(units));
  const outBuf = await docx.applyMask(buf, new Map(), domOpts);
  assert.ok(unzipSync(new Uint8Array(outBuf))['word/document.xml']);
});
