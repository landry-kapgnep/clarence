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

test('la VIRGULE sépare — le séparateur qu\'on VOIT en se relisant', () => {
  // Choix REVU. La tabulation marchait — mesuré sur un vrai document, six
  // termes saisis ainsi ont bien été appliqués — mais elle est invisible : sa
  // largeur varie, on ne distingue pas une tabulation de deux, et il fallait
  // lancer le traitement pour savoir si la saisie était correcte. Or ce champ
  // sert précisément à se relire avant de lancer.
  assert.deepEqual(parseTermes('ChatGPT, MT, OpenAI'), ['ChatGPT', 'MT', 'OpenAI']);
  assert.deepEqual(parseTermes('ChatGPT,MT,,OpenAI'), ['ChatGPT', 'MT', 'OpenAI']);
});

test('point-virgule accepté aussi', () => {
  assert.deepEqual(parseTermes('A; B ;C'), ['A', 'B', 'C']);
});

test('CONTREPARTIE assumée : un terme ne peut plus contenir de virgule', () => {
  // « Dupont, Marie » devient deux termes. Côté « toujours masquer » c'est sans
  // danger (on masque davantage) ; côté « ne jamais masquer » ça peut laisser
  // en clair un fragment qu'on n'avait pas l'intention d'épargner. Le cas est
  // rare, et la virgule reste VISIBLE donc rattrapable — exactement l'inverse
  // du défaut de la tabulation.
  assert.deepEqual(parseTermes('Dupont, Marie'), ['Dupont', 'Marie']);
});

test('une saisie vide ou blanche ne produit aucun terme', () => {
  // Un terme vide passerait en règle « masquer la chaîne vide » : catastrophe.
  for (const v of ['', '   ', '\t\t', '\n\n', null, undefined]) {
    assert.deepEqual(parseTermes(v), [], JSON.stringify(v));
  }
});

test('ajouterTerme : recompose avec le séparateur VISIBLE', () => {
  // Le bouton « ne plus masquer » écrit dans ce champ : ce que l'utilisateur
  // relit doit correspondre à ce qui sera appliqué.
  assert.equal(ajouterTerme('ChatGPT', 'MT'), 'ChatGPT, MT');
  // Une saisie tabulée est normalisée en virgules au premier ajout — elle
  // devient enfin lisible.
  assert.equal(ajouterTerme('ChatGPT\tMT', 'OpenAI'), 'ChatGPT, MT, OpenAI');
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
