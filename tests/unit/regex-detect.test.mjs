import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { mergeEntities } from '../../src/engine/merge.js';

const find = (text, type) => detectRegex(text).filter(e => e.type === type);
// Après fusion : dédoublonne les chevauchements (un motif nu + un motif
// contextuel peuvent matcher le même span → une seule entité au final).
const findMerged = (text, type) => mergeEntities(detectRegex(text), []).filter(e => e.type === type);

// --- IBAN : masqué sur structure même si le mod-97 échoue (priorité zéro-fuite).
test('IBAN valide : détecté et marqué validated=true', () => {
  const [e] = find('IBAN FR76 3000 6000 0112 3456 7890 189', 'IBAN');
  assert.ok(e);
  assert.equal(e.validated, true);
});

test('IBAN à structure correcte mais mod-97 invalide : détecté quand même (validated=false)', () => {
  // Numéros fabriqués (échouent le checksum) — doivent tout de même être masqués.
  for (const v of [
    'FR76 3000 6000 0123 4567 8901 234',
    'FR76 1007 1002 0001 2345 6789 099',
    'FR76 3000 4000 2000 1122 3344 556'
  ]) {
    const [e] = find(`Mon IBAN : ${v}`, 'IBAN');
    assert.ok(e, 'non détecté : ' + v);
    assert.equal(e.value, v);
    assert.equal(e.validated, false, 'checksum invalide attendu : ' + v);
  }
});

// --- NIR : idem, masqué sur structure.
test('NIR à structure correcte mais clé invalide : détecté quand même (validated=false)', () => {
  const [e] = find('Sécurité sociale 2 91 07 13 055 123 45', 'NIR');
  assert.ok(e);
  assert.equal(e.validated, false);
});

test('NIR valide : détecté et validated=true', () => {
  const [e] = find('NIR 1 85 05 78 006 084 91', 'NIR');
  assert.ok(e);
  assert.equal(e.validated, true);
});

// --- Carte NUE (sans libellé) : reste STRICTE (structure faible, Luhn
// indispensable anti-FP). Avec un libellé « Carte/Visa », voir le test contexte.
test('carte nue Luhn-invalide (aucun libellé) : jamais détectée', () => {
  assert.equal(find('Le nombre 4242 4242 4242 4243 ici', 'CARTE_BANCAIRE').length, 0);
});

test('carte Luhn-valide : toujours détectée (une seule après fusion)', () => {
  assert.equal(findMerged('Carte 4242 4242 4242 4242', 'CARTE_BANCAIRE').length, 1);
});

// --- Carte/SIREN avec contexte : masqués même si Luhn échoue.
test('carte Luhn-invalide MAIS précédée de « Visa: » : détectée (contexte)', () => {
  const [e] = find('Visa: 4970123456789012', 'CARTE_BANCAIRE');
  assert.ok(e);
  assert.equal(e.value, '4970123456789012');
});

test('SIREN Luhn-invalide MAIS précédé de « Siren: » : détecté (contexte)', () => {
  const [e] = find('Siren: 44322199800012', 'SIRET_SIREN');
  assert.ok(e);
  assert.equal(e.value, '44322199800012');
});

// --- MONTANT : point décimal international + virgule FR.
test('MONTANT accepte le point décimal (6540.00 EUR) sans laisser fuir les chiffres', () => {
  const [e] = find('Salaire net : 6540.00 EUR', 'MONTANT');
  assert.ok(e);
  assert.equal(e.value.trim(), '6540.00 EUR');
});

test('MONTANT garde la virgule FR et les milliers (1 240,50 €)', () => {
  const [e] = find("Litige : 1 240,50 €", 'MONTANT');
  assert.ok(e);
  assert.equal(e.value.trim(), '1 240,50 €');
});

// --- TELEPHONE : ne mange plus un fragment au milieu d'un long nombre.
test('le téléphone ne matche pas un fragment de 10 chiffres au milieu d\'une carte', () => {
  assert.equal(find('4970123456789012', 'TELEPHONE').length, 0);
});
