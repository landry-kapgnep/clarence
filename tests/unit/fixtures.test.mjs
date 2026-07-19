// Intégration : les 3 textes de référence (passe regex + fusion, NER hors sandbox).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { maskText } from '../../src/engine/masking.js';

const fx = f => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', f), 'utf8');

test('texte 1 — toutes les catégories structurées, sans doublon ni chevauchement', () => {
  const merged = mergeEntities(detectRegex(fx('texte1-cas-complet.txt')), []);
  assert.deepEqual(merged.map(e => e.type).sort(), [
    'ADRESSE', 'CARTE_BANCAIRE', 'CODE_POSTAL_VILLE', 'EMAIL', 'IBAN',
    'MONTANT', 'NIR', 'REFERENCE', 'SIRET_SIREN', 'TELEPHONE'
  ]);
  for (let i = 1; i < merged.length; i++) {
    assert.ok(merged[i].start >= merged[i - 1].end, 'chevauchement résiduel');
  }
});

test('texte 1 — le masquage ne laisse fuir aucune valeur structurée', () => {
  const text = fx('texte1-cas-complet.txt');
  const { masked, mapping } = maskText(text, mergeEntities(detectRegex(text), []));
  for (const { value } of mapping) {
    assert.equal(masked.includes(value), false, 'fuite : ' + value);
  }
});

test('texte 2 — email, téléphone, code postal ; piège Luhn rejeté', () => {
  const merged = mergeEntities(detectRegex(fx('texte2-noms-difficiles.txt')), []);
  assert.deepEqual(merged.map(e => e.type).sort(), ['ADRESSE', 'CODE_POSTAL_VILLE', 'EMAIL', 'TELEPHONE']);
  assert.equal(merged.some(e => e.value.includes('483 921 657')), false);
});

test('texte 3 — zéro détection', () => {
  assert.equal(detectRegex(fx('texte3-zero-faux-positif.txt')).length, 0);
});
