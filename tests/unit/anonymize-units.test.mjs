// L'orchestrateur traite tout le fichier comme un seul document virtuel :
// zéro tolérance sur la cohérence des placeholders inter-unités (voir
// anonymize-units.js), donc testé avec la même rigueur que src/engine/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeUnits, UNIT_SEP } from '../../src/files/anonymize-units.js';

test('masque une valeur détectée et localise l\'entité dans son unité', async () => {
  const units = [{ id: 'a', text: 'Contact: jean@acme.fr' }];
  const { results, mapping } = await anonymizeUnits(units);
  assert.equal(results[0].maskedText, 'Contact: [EMAIL_1]');
  assert.deepEqual(mapping.map(m => m.value), ['jean@acme.fr']);
  assert.deepEqual(results[0].entities, [{ start: 9, end: 21, placeholder: '[EMAIL_1]' }]);
});

test('même valeur répétée dans deux unités différentes → même placeholder', async () => {
  const units = [
    { id: 'a', text: 'Contact: jean@acme.fr' },
    { id: 'b', text: 'Encore jean@acme.fr pour confirmation' }
  ];
  const { results, mapping } = await anonymizeUnits(units);
  assert.equal(mapping.length, 1, 'une seule entrée de mapping pour la même valeur');
  assert.equal(results[0].maskedText, 'Contact: [EMAIL_1]');
  assert.equal(results[1].maskedText, 'Encore [EMAIL_1] pour confirmation');
});

test('unité vide passe inchangée, sans planter', async () => {
  const units = [{ id: 'a', text: '' }, { id: 'b', text: 'rien à masquer ici' }];
  const { results } = await anonymizeUnits(units);
  assert.deepEqual(results.find(r => r.id === 'a'), { id: 'a', text: '', maskedText: '', entities: [] });
  assert.equal(results.find(r => r.id === 'b').maskedText, 'rien à masquer ici');
});

test('unité sans PII reste inchangée', async () => {
  const units = [{ id: 'a', text: 'La réunion est prévue vendredi.' }];
  const { results } = await anonymizeUnits(units);
  assert.equal(results[0].maskedText, 'La réunion est prévue vendredi.');
  assert.deepEqual(results[0].entities, []);
});

test('refuse un texte contenant déjà le séparateur interne', async () => {
  const units = [{ id: 'a', text: `piégé ${UNIT_SEP} dedans` }];
  await assert.rejects(() => anonymizeUnits(units), /séparateur interne/);
});
