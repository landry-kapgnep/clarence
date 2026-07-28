import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { maskText } from '../../src/engine/masking.js';

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

// --- PSEUDO : handles de profil (fuite constatée sur un vrai CV, le nom en
// minuscules dans une URL n'étant jamais vu par le NER).
test('handle LinkedIn/GitHub détecté, domaine préservé', () => {
  const [li] = find('linkedin.com/in/landry-kapgnep', 'PSEUDO');
  assert.equal(li.value, 'landry-kapgnep');
  const [gh] = find('github.com/landry-kapgnep', 'PSEUDO');
  assert.equal(gh.value, 'landry-kapgnep');
});

test('URL complète avec https/www : le handle seul est capté', () => {
  const [e] = find('https://www.linkedin.com/in/marie-dupont-123', 'PSEUDO');
  assert.equal(e.value, 'marie-dupont-123');
});

test('un domaine sans handle ne déclenche rien', () => {
  assert.equal(find('on parle de github.com/ ici', 'PSEUDO').length, 0);
  assert.equal(find('le site github.com est connu', 'PSEUDO').length, 0);
});

test('le même handle sur deux plateformes reçoit un seul placeholder', () => {
  const text = 'linkedin.com/in/jdupont et github.com/jdupont';
  const { masked } = maskText(text, mergeEntities(detectRegex(text), []));
  assert.equal(masked, 'linkedin.com/in/[PSEUDO_1] et github.com/[PSEUDO_1]');
});

// --- IBAN international (liste blanche de pays).
test('IBAN suisse à structure correcte : détecté même si mod-97 échoue', () => {
  const [e] = find('Coordonnées : CH76 0023 4000 W123 4567 8 (UBS)', 'IBAN');
  assert.ok(e);
  assert.equal(e.value, 'CH76 0023 4000 W123 4567 8');
});

test('IBAN belge valide (mod-97) détecté, forme sans espaces', () => {
  const [e] = find('IBAN BE71096123456769 pour le virement', 'IBAN');
  assert.ok(e);
  assert.equal(e.validated, true);
});

test('code pays inconnu : pas un IBAN (XX76… ignoré)', () => {
  assert.equal(find('Réf XX76 0023 4000 1234 5678 90', 'IBAN').length, 0);
});

// --- IP v4.
test('IP valide détectée, IP à octet impossible rejetée', () => {
  assert.equal(find('depuis 192.168.1.104 hier', 'IP').length, 1);
  assert.equal(find('depuis 999.168.1.104 hier', 'IP').length, 0);
});

// --- MAC.
test('adresse MAC détectée (les deux séparateurs)', () => {
  assert.equal(find('MAC: 00:1A:2B:3C:4D:5E', 'MAC').length, 1);
  assert.equal(find('MAC: 00-1a-2b-3c-4d-5e', 'MAC').length, 1);
});

test('un hexa isolé de 2 caractères n\'est pas une MAC', () => {
  assert.equal(find('code AB tout seul', 'MAC').length, 0);
});

// --- BIC. findMerged : le motif nu (liste blanche) et le motif contextuel
// (« BIC: ») peuvent matcher le même span — une seule entité après fusion.
test('BIC détecté (8 et 11 caractères), mot en majuscules rejeté', () => {
  assert.equal(findMerged('BIC: BNPAPRRPXXX', 'BIC').length, 1, 'pays hors liste mais libellé BIC explicite');
  assert.equal(findMerged('BIC: SOGEFRPP', 'BIC').length, 1);
  assert.equal(findMerged('virement via SOGEFRPP hier', 'BIC').length, 1, 'BIC nu à pays connu, sans libellé');
  assert.equal(findMerged('MOT PASSWORD ici', 'BIC').length, 0, 'PASSWORD ne doit pas matcher (pays "WO" inconnu, pas de libellé)');
});
