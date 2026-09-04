// Téléphones internationaux via libphonenumber-js. Zéro tolérance : cette
// passe s'ajoute à la regex FR, elle ne doit rien casser (les pièges des
// fixtures doivent rester non détectés) tout en couvrant les autres pays.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPhonesIntl } from '../../src/engine/phone-intl.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { maskText } from '../../src/engine/masking.js';

const vals = text => detectPhonesIntl(text).map(e => e.value);

test('téléphones internationaux détectés (US, UK, DE, FR)', () => {
  assert.deepEqual(vals('call +1 (415) 555-2671 please'), ['+1 (415) 555-2671']);
  assert.deepEqual(vals('Call me on +44 20 7183 8750 tomorrow'), ['+44 20 7183 8750']);
  assert.deepEqual(vals('Telefon: +49 30 901820'), ['+49 30 901820']);
  assert.deepEqual(vals('joignable au +33 7 89 12 34 56'), ['+33 7 89 12 34 56']);
});

test('numéro plausible mais invalide masqué quand même (zéro-fuite)', () => {
  // Central US impossible (019) : la bibliothèque le juge non valide, on le
  // masque tout de même - même principe que l'IBAN à checksum invalide.
  const [e] = detectPhonesIntl('telephone +1 (551) 019-2834 for contact');
  assert.equal(e.value, '+1 (551) 019-2834');
  assert.equal(e.validated, false, 'validated doit rester honnête');
});

test('AUCUN faux positif sur les pièges des fixtures', () => {
  assert.deepEqual(vals('La référence 483 921 657 ne doit pas bouger'), [], 'SIREN Luhn-invalide');
  assert.deepEqual(vals('commande 4970123456789012'), [], 'suite de chiffres type carte');
  assert.deepEqual(vals('Le montant est de 1 240,50 € pour 2026'), [], 'montant + année');
  assert.deepEqual(vals('SIRET 732 829 320 00074 enregistré'), [], 'SIRET valide');
});

test('les numéros FR nationaux restent couverts par la regex existante', () => {
  // libphonenumber (sans pays par défaut) ne les voit pas : c'est voulu, la
  // regex FR s'en charge. On vérifie la couverture combinée.
  const text = 'Mon numéro est 06 12 34 56 78 merci';
  const merged = mergeEntities([...detectRegex(text), ...detectPhonesIntl(text)], []);
  assert.ok(merged.some(e => e.type === 'TELEPHONE' && e.value.includes('06 12 34 56 78')));
});

test('pipeline combiné : FR et international masqués ensemble, sans doublon', () => {
  const text = 'FR 06 12 34 56 78 et US +1 (415) 555-2671';
  const merged = mergeEntities([...detectRegex(text), ...detectPhonesIntl(text)], []);
  const { masked } = maskText(text, merged);
  assert.equal(masked.includes('06 12 34 56 78'), false, 'numéro FR non masqué');
  assert.equal(masked.includes('555-2671'), false, 'numéro US non masqué');
  assert.match(masked, /\[TELEPHONE_1\].*\[TELEPHONE_2\]/s);
});
