import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { mergeEntities, resolveOverlaps } from '../../src/engine/merge.js';

test('chevauchement regex↔regex : le span le plus long gagne (TELEPHONE dans IBAN)', () => {
  const text = 'Mon IBAN est FR76 3000 6000 0112 3456 7890 189 merci.';
  const merged = mergeEntities(detectRegex(text), []);
  assert.deepEqual(merged.map(e => e.type), ['IBAN']);
});

test('span identique : SIRET_SIREN prioritaire sur CARTE_BANCAIRE', () => {
  const text = 'SIRET 732 829 320 00074 enregistré.';
  const merged = mergeEntities(detectRegex(text), []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].type, 'SIRET_SIREN');
});

test('le regex garde priorité sur le NER en chevauchement', () => {
  const rx = [{ type: 'EMAIL', value: 'a@b.fr', start: 10, end: 16, source: 'regex' }];
  const ner = [{ type: 'PER', value: 'a@b', start: 10, end: 13, source: 'ner', score: 0.9 }];
  assert.deepEqual(mergeEntities(rx, ner).map(e => e.type), ['EMAIL']);
});

test('entités disjointes toutes conservées et triées', () => {
  const rx = [{ type: 'EMAIL', value: 'x', start: 20, end: 21, source: 'regex' }];
  const ner = [{ type: 'PER', value: 'y', start: 0, end: 5, source: 'ner', score: 0.9 }];
  assert.deepEqual(mergeEntities(rx, ner).map(e => e.type), ['PER', 'EMAIL']);
});

test('resolveOverlaps est stable sans chevauchement', () => {
  const es = [
    { type: 'A', value: 'a', start: 0, end: 3, source: 'regex' },
    { type: 'B', value: 'b', start: 5, end: 9, source: 'regex' }
  ];
  assert.deepEqual(resolveOverlaps(es), es);
});

test('MONTANT avec € détecté (régression du fix prototype)', () => {
  const found = detectRegex("Le montant s'élève à 1 240,50 €.");
  const montants = found.filter(e => e.type === 'MONTANT');
  assert.equal(montants.length, 1);
  assert.equal(montants[0].value.trim(), '1 240,50 €');
});
