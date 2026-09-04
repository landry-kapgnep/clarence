// Zéro tolérance : un bug ici = fuite silencieuse (docs/notes-techniques.md §Tests).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { luhnCheck, ibanCheck, nirCheck, dniCheck } from '../../src/engine/validators.js';

test('Luhn — carte valide (4242…)', () => {
  assert.equal(luhnCheck('4242424242424242'), true);
});
test('Luhn — carte invalide (dernier chiffre altéré)', () => {
  assert.equal(luhnCheck('4242424242424243'), false);
});
test('Luhn — SIRET valide (exemple INSEE)', () => {
  assert.equal(luhnCheck('73282932000074'), true);
});
test('Luhn — SIREN invalide (piège fixture 2)', () => {
  assert.equal(luhnCheck('483921657'), false);
});
test('Luhn — entrée non numérique refusée', () => {
  assert.equal(luhnCheck('4242ABCD42424242'), false);
});

test('IBAN — FR valide (mod-97)', () => {
  assert.equal(ibanCheck('FR76 3000 6000 0112 3456 7890 189'), true);
});
test('IBAN — invalide (un chiffre altéré)', () => {
  assert.equal(ibanCheck('FR76 3000 6000 0112 3456 7890 188'), false);
});
test('IBAN — structure invalide refusée', () => {
  assert.equal(ibanCheck('FRXX pas un iban'), false);
});

test('NIR — valide (clé 91)', () => {
  assert.equal(nirCheck('1 85 05 78 006 084 91'), true);
});
test('NIR — clé fausse refusée', () => {
  assert.equal(nirCheck('1 85 05 78 006 084 92'), false);
});
test('NIR — longueur fausse refusée', () => {
  assert.equal(nirCheck('1 85 05 78 006 084'), false);
});
test('NIR — Corse 2A accepté si clé cohérente', () => {
  const base = 1940319004021n; // 1 94 03 2A 004 021, 2A→19
  const key = String(97n - (base % 97n)).padStart(2, '0');
  assert.equal(nirCheck(`1 94 03 2A 004 021 ${key}`), true);
});

// --- DNI / NIE espagnols. Un cas valide et un invalide par validateur, comme
// pour Luhn/IBAN/NIR : la règle « zéro tolérance » du projet.
test('DNI — clé valide acceptée', () => {
  // 12345678 mod 23 = 14, quinzième lettre de TRWAGMYFPDXBNJZSQVHLCKE = Z.
  assert.equal(dniCheck('12345678Z'), true);
  assert.equal(dniCheck('00000000T'), true);
});

test('DNI — clé fausse refusée', () => {
  assert.equal(dniCheck('12345678A'), false);
});

test('NIE — le préfixe X/Y/Z compte comme un chiffre dans le calcul', () => {
  // X vaut 0, donc X1234567 se calcule comme 01234567.
  assert.equal(dniCheck('X1234567L'), true);
  assert.equal(dniCheck('X1234567A'), false);
});

test('DNI — longueur fausse refusée', () => {
  assert.equal(dniCheck('1234567Z'), false);   // 7 chiffres sans préfixe
  assert.equal(dniCheck('123456789Z'), false); // 9 chiffres
  assert.equal(dniCheck(''), false);
  assert.equal(dniCheck(null), false);
});

test('DNI — séparateurs et casse tolérés', () => {
  assert.equal(dniCheck('12345678-z'), true);
  assert.equal(dniCheck(' 12345678 Z '), true);
});
