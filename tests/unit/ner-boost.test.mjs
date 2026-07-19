// boostCase : aide le NER (modèle "cased") à repérer des noms écrits sans
// majuscule, sans jamais changer la longueur du texte (offsets préservés).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boostCase } from '../../src/engine/ner.js';

test('capitalise un nom minuscule', () => {
  const boosted = boostCase('contact : jean dupont');
  assert.ok(boosted.includes('Jean Dupont'));
});

test('préserve la longueur exacte (offsets valides)', () => {
  const text = 'je m\'appelle jean dupont et j\'habite à lyon';
  assert.equal(boostCase(text).length, text.length);
});

test('ne touche pas aux mots-outils courants (même autour d\'un nom boosté)', () => {
  const boosted = boostCase('le contact de jean dupont pour le dossier');
  assert.ok(boosted.startsWith('le '));
  assert.ok(boosted.includes(' de '));
  assert.ok(boosted.includes('Jean Dupont'));
});

test('ne touche pas à un mot déjà capitalisé', () => {
  assert.equal(boostCase('Jean Dupont'), 'Jean Dupont');
});

test('ne touche pas aux chiffres ni à la ponctuation', () => {
  const text = 'iban fr76 3000, tél. 06-12-34';
  const boosted = boostCase(text);
  assert.ok(boosted.includes('3000'));
  assert.ok(boosted.includes('06-12-34'));
});

test('ne capitalise pas un mot d\'une seule lettre', () => {
  assert.ok(boostCase('y a-t-il un souci').startsWith('y '));
});
