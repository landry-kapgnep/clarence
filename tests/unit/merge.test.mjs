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

// --- Une entité contextuelle qui DÉBORDE d'une entité regex ne doit jamais
// être annulée : la partie non couverte resterait en clair. C'est une fuite,
// pas une question de libellé de placeholder.
test('un nom plus large qu\'un faux positif regex n\'est pas annulé', () => {
  // Le patronyme « ROUSSEAU » matche le motif BIC (8 majuscules, « SE » en
  // position 5-6). Avant correctif, il supprimait « Amandine ROUSSEAU » et la
  // sortie disait « Amandine [BIC_1] » - prénom en clair à côté du placeholder.
  const text = 'RAPPORT DE STAGE\nAmandine ROUSSEAU\nBUT 2';
  const per = {
    type: 'PER', value: 'Amandine ROUSSEAU',
    start: text.indexOf('Amandine'), end: text.indexOf('ROUSSEAU') + 8,
    source: 'ner', score: 0.64
  };
  const merged = mergeEntities(detectRegex(text), [per]);
  assert.ok(merged.some(e => e.type === 'PER' && e.value === 'Amandine ROUSSEAU'),
    'le nom complet doit survivre : ' + JSON.stringify(merged.map(e => [e.type, e.value])));
  assert.ok(!merged.some(e => e.type === 'BIC'), 'le faux positif BIC est absorbé');
});

test('à chevauchement PARTIEL, le déterministe garde la main', () => {
  // Non-régression de la règle 1 : sans débordement complet, le regex prime.
  const text = 'Mon IBAN est FR76 3000 6000 0112 3456 7890 189 merci.';
  const i = text.indexOf('FR76');
  const ner = [{ type: 'LOC', value: 'FR76 3000', start: i, end: i + 9, source: 'ner', score: 0.9 }];
  assert.deepEqual(mergeEntities(detectRegex(text), ner).map(e => e.type), ['IBAN']);
});
