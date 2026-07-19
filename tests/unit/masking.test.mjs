// Zéro tolérance : la cohérence du masquage/mapping est critique (CLAUDE.md §Tests).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskText, reinject } from '../../src/engine/masking.js';

const e = (type, value, start, source = 'ner') =>
  ({ type, value, start, end: start + value.length, source, score: 0.99 });

test('placeholder typé et numéroté', () => {
  const { masked, mapping } = maskText('Contact : jean@acme.fr', [e('EMAIL', 'jean@acme.fr', 10, 'regex')]);
  assert.equal(masked, 'Contact : [EMAIL_1]');
  assert.deepEqual(mapping, [{ placeholder: '[EMAIL_1]', value: 'jean@acme.fr', type: 'EMAIL', realistic: false }]);
});

test('même valeur → même placeholder partout (cohérence)', () => {
  const text = 'Jean Dupont a signé. Merci Jean Dupont.';
  const { masked, mapping } = maskText(text, [e('PER', 'Jean Dupont', 0), e('PER', 'Jean Dupont', 27)]);
  assert.equal(masked, '[PERSONNE_1] a signé. Merci [PERSONNE_1].');
  assert.equal(mapping.length, 1);
});

test('valeurs distinctes → numéros distincts', () => {
  const { masked } = maskText('Jean Dupont et Marie Curie.', [e('PER', 'Jean Dupont', 0), e('PER', 'Marie Curie', 15)]);
  assert.equal(masked, '[PERSONNE_1] et [PERSONNE_2].');
});

test('propagation : occurrence non détectée masquée quand même', () => {
  const text = 'Jean Dupont a signé. Merci Jean Dupont.';
  const { masked } = maskText(text, [e('PER', 'Jean Dupont', 0)]);
  assert.equal(masked, '[PERSONNE_1] a signé. Merci [PERSONNE_1].');
});

test('propagation : pas de sur-masquage en milieu de mot (Lyon vs Lyonnais)', () => {
  const { masked } = maskText('Basé à Lyon, le club Lyonnais. Lyon encore.', [e('LOC', 'Lyon', 7)]);
  assert.equal(masked, 'Basé à [LIEU_1], le club Lyonnais. [LIEU_1] encore.');
});

test('propagation : "Rose Fontaine" remplacé avant "Rose" (longueur d abord)', () => {
  const text = 'Rose Fontaine est là. Rose confirme. Rose Fontaine aussi.';
  const { masked } = maskText(text, [e('PER', 'Rose Fontaine', 0), e('PER', 'Rose', 22)]);
  assert.equal(masked, '[PERSONNE_1] est là. [PERSONNE_2] confirme. [PERSONNE_1] aussi.');
});

test('aucune valeur du mapping ne subsiste dans le texte masqué', () => {
  const text = 'Julien Marchand, IBAN FR76 3000 6000 0112 3456 7890 189, Julien Marchand.';
  const ents = [
    e('PER', 'Julien Marchand', 0),
    e('IBAN', 'FR76 3000 6000 0112 3456 7890 189', 22, 'regex'),
    e('PER', 'Julien Marchand', 58)
  ];
  const { masked, mapping } = maskText(text, ents);
  for (const { value } of mapping) {
    assert.equal(masked.includes(value), false, 'fuite : ' + value);
  }
});

test('reinject restitue exactement le texte d origine', () => {
  const text = 'Jean Dupont (jean@acme.fr) travaille chez Acme SARL. Jean Dupont valide.';
  const ents = [
    e('PER', 'Jean Dupont', 0),
    e('EMAIL', 'jean@acme.fr', 13, 'regex'),
    e('ORG', 'Acme SARL', 42),
    e('PER', 'Jean Dupont', 53)
  ];
  const { masked, mapping } = maskText(text, ents);
  assert.equal(reinject(masked, mapping), text);
});

test('le placeholder lui-même n est jamais corrompu par la propagation', () => {
  const { masked } = maskText('Code 42 attribué. Encore 42.', [e('MISC', '42', 5)]);
  assert.equal(masked, 'Code [DIVERS_1] attribué. Encore [DIVERS_1].');
});

test('reinject en un seul passage : une valeur restituée contenant un motif [TYPE_N] n est pas re-substituée', () => {
  const mapping = [
    { placeholder: '[PERSONNE_1]', value: 'voir [EMAIL_1]', type: 'PER' },
    { placeholder: '[EMAIL_1]', value: 'jean@acme.fr', type: 'EMAIL' }
  ];
  const out = reinject('Réf : [PERSONNE_1] et [EMAIL_1].', mapping);
  assert.equal(out, 'Réf : voir [EMAIL_1] et jean@acme.fr.');
});
