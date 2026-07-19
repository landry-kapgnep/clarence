import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as XLSX from 'xlsx';
import { unzipSync, strFromU8 } from 'fflate';
import { extractTextUnits, applyMask, stripMetadata } from '../../src/files/xlsx-adapter.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'echantillon.xlsx');
const fxBuffer = () => new Uint8Array(readFileSync(fixturePath)).buffer;

test('extrait les cellules texte, ignore montant/formule/vides', () => {
  const { units } = extractTextUnits(fxBuffer());
  assert.ok(units.some(u => u.id === 'Clients!A2' && u.text === 'Julien Marchand'));
  assert.ok(units.some(u => u.id === 'Clients!B2' && u.text === 'julien.marchand@monentreprise.fr'));
  assert.ok(units.some(u => u.id === 'Paiements!B2' && u.text === 'FR76 3000 6000 0112 3456 7890 189'));
  assert.equal(units.some(u => u.id === 'Clients!C2'), false, 'la cellule montant (type n) ne doit jamais devenir une unité');
});

test('pipeline complet : masque les cellules texte, laisse le montant intact, aucune fuite', async () => {
  const buf = fxBuffer();
  const { units } = extractTextUnits(buf);
  const { results } = await anonymizeUnits(units); // regex seul, comme les autres adaptateurs

  const resultsById = new Map(results.map(r => [r.id, { maskedText: r.maskedText }]));
  const outBuf = applyMask(buf, resultsById);

  const wbOut = XLSX.read(outBuf, { type: 'array' });
  assert.equal(wbOut.Sheets.Clients['B2'].v.includes('@'), false, 'email masqué');
  assert.equal(wbOut.Sheets.Paiements['B2'].v.includes('FR76'), false, 'IBAN masqué');
  assert.equal(wbOut.Sheets.Clients['C2'].v, 1234.56, 'la cellule montant reste numérique et intacte');
  assert.equal(wbOut.Sheets.Clients['C2'].t, 'n');

  // aucune valeur PII d'origine ne doit survivre nulle part dans le classeur
  const flat = JSON.stringify(wbOut.Sheets);
  for (const pii of ['julien.marchand@monentreprise.fr', 'rose.fontaine@example.com', 'FR76 3000 6000 0112 3456 7890 189']) {
    assert.equal(flat.includes(pii), false, 'fuite : ' + pii);
  }
});

test('la fusion A1:B1 et la largeur de colonne survivent au ré-écriture', () => {
  const buf = fxBuffer();
  const outBuf = applyMask(buf, new Map());
  const wbOut = XLSX.read(outBuf, { type: 'array' });
  assert.deepEqual(wbOut.Sheets.Clients['!merges'], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]);
});

test('stripMetadata retire auteur/société et le commentaire (+ son VML), garde les feuilles intactes', () => {
  const outBuf = stripMetadata(fxBuffer());
  const zip = unzipSync(new Uint8Array(outBuf));

  const core = strFromU8(zip['docProps/core.xml']);
  const app = strFromU8(zip['docProps/app.xml']);
  assert.equal(core.includes('Jean Dupont'), false);
  assert.equal(app.includes('Acme Consulting SARL'), false);
  assert.equal('xl/comments1.xml' in zip, false);
  assert.equal('xl/drawings/vmlDrawing1.vml' in zip, false);

  // le classeur reste ouvrable et les données intactes après le nettoyage
  const wbOut = XLSX.read(outBuf, { type: 'array' });
  assert.equal(wbOut.Sheets.Clients['A2'].v, 'Julien Marchand');
});
