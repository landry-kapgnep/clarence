// bridgeNameParts : recollage déterministe des noms détectés en morceaux.
// Partagé par les deux moteurs contextuels (BERT et GLiNER), donc toute
// régression ici touche les deux.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bridgeNameParts } from '../../src/engine/ner.js';

const loc = (text, value) => {
  const start = text.indexOf(value);
  return [{ type: 'LOC', value, start, end: start + value.length, source: 'ner' }];
};

test('un patronyme pris pour un LIEU est réabsorbé avec le prénom et ses particules', () => {
  const t = 'Encadré par Sébastien de La Villardière cette année.';
  const [e] = bridgeNameParts(t, loc(t, 'Villardière'));
  assert.equal(e.type, 'PER');
  assert.equal(e.value, 'Sébastien de La Villardière');
});

// --- Trouvé par le banc (sur-masquage). « SIGLE de Ville » est le squelette
// de la moitié des noms d'établissements français ; le pontage en faisait des
// PERSONNE, donc le placeholder avalait le sigle avec la ville.
test('un SIGLE devant une particule n\'est pas un prénom (IUT de Villetaneuse)', () => {
  const t = 'Composante : IUT de Villetaneuse';
  const [e] = bridgeNameParts(t, loc(t, 'Villetaneuse'));
  assert.equal(e.type, 'LOC', 'le sigle a été pris pour un prénom');
  assert.equal(e.value, 'Villetaneuse', 'la ville reste masquée en LIEU, le sigle survit');
});

test('idem pour les autres formes courantes (CHU, ENS)', () => {
  for (const [texte, ville] of [['le CHU de Nantes', 'Nantes'], ['ENS de Lyon', 'Lyon']]) {
    const [e] = bridgeNameParts(texte, loc(texte, ville));
    assert.equal(e.type, 'LOC', texte);
    assert.equal(e.value, ville, texte);
  }
});

test('un prénom TOUT-MAJUSCULE suivi du patronyme est toujours recollé (sens avant)', () => {
  const t = 'LANDRY KAPGNEP, développeur';
  const start = t.indexOf('LANDRY');
  const [e] = bridgeNameParts(t, [
    { type: 'PER', value: 'LANDRY', start, end: start + 6, source: 'ner' }
  ]);
  assert.equal(e.value, 'LANDRY KAPGNEP');
});
