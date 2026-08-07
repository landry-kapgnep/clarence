// Ces listes pilotent « toujours masquer » et « ne jamais masquer ». Un
// découpage trop gourmand fabrique des fragments qui masquent n'importe quoi ;
// un découpage trop strict fait qu'un terme saisi ne s'applique jamais et que
// l'utilisateur croit à tort son document protégé. D'où des tests serrés.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTermes, ajouterTerme } from '../../src/popup/termes.js';

test('la TABULATION sépare les termes — la saisie en vrac demandée', () => {
  assert.deepEqual(parseTermes('ChatGPT\tMT\tOpenAI'), ['ChatGPT', 'MT', 'OpenAI']);
});

test('le saut de ligne reste accepté — les profils enregistrés en dépendent', () => {
  // Casser ce format viderait silencieusement les règles déjà enregistrées.
  assert.deepEqual(parseTermes('ChatGPT\nMT'), ['ChatGPT', 'MT']);
  assert.deepEqual(parseTermes('ChatGPT\r\nMT'), ['ChatGPT', 'MT']);
});

test('les deux séparateurs se mélangent sans problème', () => {
  assert.deepEqual(parseTermes('A\tB\nC\t\tD\n\n E '), ['A', 'B', 'C', 'D', 'E']);
});

test('les espaces de tête et de queue sont retirés', () => {
  // Une saisie rapide en laisse toujours, et « ChatGPT » avec une espace
  // finale ne correspondrait à rien dans le document.
  assert.deepEqual(parseTermes('  ChatGPT  \t  MT '), ['ChatGPT', 'MT']);
});

test('un terme contenant une VIRGULE ou un POINT-VIRGULE reste entier', () => {
  // « Dupont, Marie » et « Legrand & Fils, S.A. » sont des termes plausibles.
  // Les découper produirait des fragments (« Marie », « S.A. ») qui
  // masqueraient n'importe quoi dans le document.
  assert.deepEqual(parseTermes('Dupont, Marie\tLegrand & Fils, S.A.'),
    ['Dupont, Marie', 'Legrand & Fils, S.A.']);
});

test('une saisie vide ou blanche ne produit aucun terme', () => {
  // Un terme vide passerait en règle « masquer la chaîne vide » : catastrophe.
  for (const v of ['', '   ', '\t\t', '\n\n', null, undefined]) {
    assert.deepEqual(parseTermes(v), [], JSON.stringify(v));
  }
});

test('ajouterTerme : ajoute sans toucher à ce qui est déjà saisi', () => {
  assert.equal(ajouterTerme('ChatGPT', 'MT'), 'ChatGPT\nMT');
});

test('ajouterTerme : jamais de doublon', () => {
  assert.equal(ajouterTerme('ChatGPT\nMT', 'MT'), 'ChatGPT\nMT');
  // Le terme saisi à la tabulation compte comme déjà présent.
  assert.equal(ajouterTerme('ChatGPT\tMT', 'MT'), 'ChatGPT\tMT');
});

test('ajouterTerme : un champ vide donne le terme seul', () => {
  assert.equal(ajouterTerme('', 'ChatGPT'), 'ChatGPT');
  assert.equal(ajouterTerme(undefined, 'ChatGPT'), 'ChatGPT');
});

test('ajouterTerme : un terme vide ne modifie rien', () => {
  assert.equal(ajouterTerme('ChatGPT', '   '), 'ChatGPT');
});
