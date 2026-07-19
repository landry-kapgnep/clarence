// Zéro tolérance : selectActive décide de ce qui est masqué.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectActive, entityKey, forcedMasks, filterByRules } from '../../src/engine/selection.js';

const auto = (type, value, start, source = 'regex') =>
  ({ type, value, start, end: start + value.length, source });
const manual = (value, start) =>
  ({ type: 'PERSONNALISE', value, start, end: start + value.length, source: 'manuel' });

test('sans retrait ni manuel : tout passe, trié', () => {
  const a = [auto('EMAIL', 'a@b.fr', 20), auto('TELEPHONE', '0612345678', 0)];
  assert.deepEqual(selectActive(a, [], new Set()).map(e => e.type), ['TELEPHONE', 'EMAIL']);
});

test('un retrait exclut la détection automatique visée, et elle seule', () => {
  const a = [auto('EMAIL', 'a@b.fr', 20), auto('TELEPHONE', '0612345678', 0)];
  const removed = new Set([entityKey(a[0])]);
  assert.deepEqual(selectActive(a, [], removed).map(e => e.type), ['TELEPHONE']);
});

test('un masque manuel a priorité sur une détection qui le chevauche', () => {
  const a = [auto('EMAIL', 'a@b.fr', 10)];
  const m = [manual('xx a@b.fr xx', 7)]; // chevauche l’email
  const out = selectActive(a, m, new Set());
  assert.equal(out.length, 1);
  assert.equal(out[0].source, 'manuel');
});

test('un masque manuel retiré ne masque plus (et la détection auto réapparaît)', () => {
  const a = [auto('EMAIL', 'a@b.fr', 10)];
  const m = [manual('xx a@b.fr xx', 7)];
  const removed = new Set([entityKey(m[0])]);
  const out = selectActive(a, m, removed);
  assert.equal(out.length, 1);
  assert.equal(out[0].source, 'regex');
});

test('deux masques manuels identiques → un seul survit (anti-doublon)', () => {
  const m = [manual('secret', 5), manual('secret', 5)];
  assert.equal(selectActive([], m, new Set()).length, 1);
});

test('résultat toujours sans chevauchement', () => {
  const a = [auto('TELEPHONE', '0612345678', 0), auto('CARTE_BANCAIRE', '4242424242424242', 5)];
  const out = selectActive(a, [], new Set());
  for (let i = 1; i < out.length; i++) assert.ok(out[i].start >= out[i - 1].end);
});

// ===== Masquage personnalisé
test('forcedMasks : capte toutes les occurrences d\'un terme, ignore le vide', () => {
  const text = 'Projet ORION, phase ORION 2, fin ORION.';
  const out = forcedMasks(text, ['ORION', '', '  ']);
  assert.equal(out.length, 3);
  assert.ok(out.every(e => e.value === 'ORION' && e.source === 'manuel'));
  assert.deepEqual(out.map(e => e.start), [7, 20, 33]);
});

test('forcedMasks branché dans selectActive : le terme forcé est masqué comme un manuel', () => {
  const text = 'contactez Dupont-Martin svp';
  const forced = forcedMasks(text, ['Dupont-Martin']);
  const out = selectActive([], forced, new Set());
  assert.equal(out.length, 1);
  assert.equal(out[0].value, 'Dupont-Martin');
});

test('filterByRules : un type désactivé n\'est plus masqué', () => {
  const es = [auto('PER', 'Jean', 0), auto('LOC', 'Lyon', 10)];
  const out = filterByRules(es, { disabledTypes: new Set(['LOC']) });
  assert.deepEqual(out.map(e => e.type), ['PER']);
});

test('filterByRules : une valeur « à garder » est épargnée (insensible à la casse)', () => {
  const es = [auto('ORG', 'Innovatech', 0), auto('PER', 'Jean', 20)];
  const out = filterByRules(es, { keepValues: ['innovatech'] });
  assert.deepEqual(out.map(e => e.value), ['Jean']);
});

test('filterByRules : un masque MANUEL survit même si son type/valeur est filtré', () => {
  const es = [{ type: 'PERSONNALISE', value: 'Lyon', start: 0, end: 4, source: 'manuel' }];
  const out = filterByRules(es, { disabledTypes: new Set(['PERSONNALISE']), keepValues: ['lyon'] });
  assert.equal(out.length, 1, 'la volonté explicite de l\'utilisateur prime');
});
