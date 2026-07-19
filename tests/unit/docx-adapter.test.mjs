import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { unzipSync, strFromU8 } from 'fflate';
import { extractTextUnits, applyMask, stripMetadata } from '../../src/files/docx-adapter.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'echantillon.docx');
const fxBuffer = () => new Uint8Array(readFileSync(fixturePath)).buffer;
const domOpts = { DOMParser, XMLSerializer };

// Faux pipeline NER déterministe : reconnaît "Jean Dupont" comme PER, comme
// les autres tests unitaires (ner-chunk.test.mjs) — pas de vrai modèle ici.
const fakePipe = async chunk => chunk.includes('Jean Dupont')
  ? [{ entity: 'B-PER', word: 'Jean', score: 0.99 }, { entity: 'I-PER', word: 'Dupont', score: 0.98 }]
  : [];

test('reconstitue le paragraphe malgré le nom coupé sur 2 runs de mise en forme différente', () => {
  const { units } = extractTextUnits(fxBuffer(), domOpts);
  const p0 = units.find(u => u.id === 'word/document.xml#p0');
  assert.ok(p0, 'le premier paragraphe doit produire une unité');
  assert.equal(p0.text, "Bonjour, je m'appelle Jean Dupont, contactez-moi.");
});

test('le texte supprimé (suivi des modifications) est absent des unités extraites', () => {
  const { units } = extractTextUnits(fxBuffer(), domOpts);
  assert.equal(units.some(u => u.text.includes('Paul Ancien')), false);
  assert.equal(units.some(u => u.id === 'word/document.xml#p1'), false, 'le paragraphe entièrement supprimé ne produit aucune unité');
});

test('le tableau est traité sans cas spécial : la cellule IBAN produit une unité', () => {
  const { units } = extractTextUnits(fxBuffer(), domOpts);
  const cell = units.find(u => u.text.includes('FR76'));
  assert.ok(cell, 'la cellule de tableau doit produire une unité comme un paragraphe normal');
});

test('pipeline complet : le nom coupé sur 2 runs est masqué sans laisser de résidu dans aucun run', async () => {
  const buf = fxBuffer();
  const { units } = extractTextUnits(buf, domOpts);
  const { results } = await anonymizeUnits(units, { nerPipeline: fakePipe });
  const resultsById = new Map(results.map(r => [r.id, { entities: r.entities }]));

  const outBuf = applyMask(buf, resultsById, domOpts);
  const zip = unzipSync(new Uint8Array(outBuf));
  const docXml = strFromU8(zip['word/document.xml']);

  // zéro fuite : ni "Jean" ni "Dupont" nulle part dans la partie XML entière
  // (pas seulement le premier run — c'est le test qui détecterait un résidu
  // laissé dans le run "Dupont" en gras par une redistribution incorrecte).
  assert.equal(docXml.includes('Jean'), false, 'fuite : "Jean"');
  assert.equal(docXml.includes('Dupont'), false, 'fuite : "Dupont"');
  assert.match(docXml, /\[PERSONNE_1\]/);
});

test('pipeline complet : l\'IBAN dans le tableau est masqué (détection regex seule)', async () => {
  const buf = fxBuffer();
  const { units } = extractTextUnits(buf, domOpts);
  const { results } = await anonymizeUnits(units); // regex seul, sans nerPipeline
  const resultsById = new Map(results.map(r => [r.id, { entities: r.entities }]));

  const outBuf = applyMask(buf, resultsById, domOpts);
  const zip = unzipSync(new Uint8Array(outBuf));
  const docXml = strFromU8(zip['word/document.xml']);
  assert.equal(docXml.includes('FR76 3000 6000 0112 3456 7890 189'), false);
  assert.match(docXml, /\[IBAN_1\]/);
});

test('le prologue XML n\'est jamais dupliqué en sortie', async () => {
  const buf = fxBuffer();
  const { units } = extractTextUnits(buf, domOpts);
  const { results } = await anonymizeUnits(units); // regex seul suffit pour ce test
  const resultsById = new Map(results.map(r => [r.id, { entities: r.entities }]));
  const outBuf = applyMask(buf, resultsById, domOpts);
  const zip = unzipSync(new Uint8Array(outBuf));
  const docXml = strFromU8(zip['word/document.xml']);
  assert.equal((docXml.match(/<\?xml/g) || []).length, 1, 'un seul prologue XML attendu');
});

test('stripMetadata retire commentaire (partie + ancres), docProps, et le texte supprimé', () => {
  const outBuf = stripMetadata(fxBuffer(), domOpts);
  const zip = unzipSync(new Uint8Array(outBuf));

  assert.equal('word/comments.xml' in zip, false);
  const docXml = strFromU8(zip['word/document.xml']);
  assert.equal(docXml.includes('commentRangeStart'), false);
  assert.equal(docXml.includes('commentReference'), false);
  assert.equal(docXml.includes('Paul Ancien'), false, 'le texte supprimé ne doit jamais survivre');

  const core = strFromU8(zip['docProps/core.xml']);
  const app = strFromU8(zip['docProps/app.xml']);
  assert.equal(core.includes('Jean Dupont'), false);
  assert.equal(app.includes('Acme Consulting SARL'), false);

  // le texte "utile" (non supprimé) doit rester intact : stripMetadata seul
  // ne masque rien, ce n'est pas son rôle
  assert.ok(docXml.includes('Jean') && docXml.includes('Dupont'), 'stripMetadata seul ne doit pas masquer le texte');
});
