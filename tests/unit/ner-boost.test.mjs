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

// --- TOUT-MAJUSCULE : fuite constatée sur un vrai CV (nom en titre jamais
// détecté car le modèle cased ne reconnaît pas « ADRIEN MESNARD »).
test('remet en Titre un patronyme écrit tout en majuscules', () => {
  assert.equal(boostCase('ADRIEN MESNARD'), 'Adrien Mesnard');
});

test('épargne les acronymes courts d\'un CV (SQL, API, JWT, BUT, IUT…)', () => {
  const text = 'SQL API JWT BUT IUT NSI PHP CTF';
  assert.equal(boostCase(text), text, 'aucun acronyme de 3 lettres ne doit être modifié');
});

test('le tout-majuscule préserve aussi la longueur (offsets valides)', () => {
  const text = 'CV de MARIE DUPONT, 06 12 34 56 78';
  assert.equal(boostCase(text).length, text.length);
  assert.ok(boostCase(text).includes('Marie Dupont'));
});

test('accents gérés en tout-majuscule (é/É de même longueur)', () => {
  const text = 'ÉLODIE LEMERCIER';
  assert.equal(boostCase(text).length, text.length);
  assert.equal(boostCase(text), 'Élodie Lemercier');
});
