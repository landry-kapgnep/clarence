// Civilités : liste partagée entre la détection déterministe et la
// pseudonymisation. Le risque n'est pas la couverture (classe fermée) mais
// les collisions : un mot courant pris pour une civilité fabrique une PII
// fantôme, et un vrai patronyme pris pour une civilité fuit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HONORIFICS, isHonorificAt, normalizeHonorific } from '../../src/engine/honorifics.js';
import { detectRegex } from '../../src/engine/regex-detect.js';
import { createPseudonymizer } from '../../src/engine/pseudonyms.js';

const per = t => detectRegex(t).filter(e => e.type === 'PER').map(e => e.value);

test('civilités multilingues détectées en déterministe (pas seulement le français)', () => {
  assert.deepEqual(per('Mr Smith arrive demain'), ['Smith']);
  assert.deepEqual(per('Herr Schmidt travaille ici'), ['Schmidt']);
  assert.deepEqual(per('Sra. Garcia a signé'), ['Garcia']);
  assert.deepEqual(per('Signora Rossi est absente'), ['Rossi']);
  assert.deepEqual(per('M. Dupont a signé'), ['Dupont']); // non-régression FR
});

// --- LA règle qui protège les vrais noms : la position, pas l'appartenance.
test('un mot de la liste employé comme PATRONYME est pseudonymisé, pas conservé', () => {
  // « Miss » est une civilité devant un nom, mais un vrai patronyme en fin de
  // nom ou employé seul. Le conserver serait une fuite.
  assert.equal(isHonorificAt('miss', 0, 2), true, 'devant un nom → civilité');
  assert.equal(isHonorificAt('Miss', 1, 2), false, 'en fin de nom → patronyme');
  assert.equal(isHonorificAt('Miss', 0, 1), false, 'seul → patronyme');
});

test('le pseudonymiseur applique cette règle (anti-fuite sur « John Miss »)', () => {
  const p = createPseudonymizer({ seed: 's1', locale: 'en' });
  assert.ok(p('PER', 'miss Deva').startsWith('miss '), 'civilité en tête non conservée');
  const patronyme = p('PER', 'John Miss');
  assert.equal(/miss/i.test(patronyme), false, 'le vrai patronyme « Miss » a fuité : ' + patronyme);
  assert.equal(/miss/i.test(p('PER', 'Miss')), false, '« Miss » seul a fuité');
});

// --- Collisions : le vrai danger d'une liste statique.
test('AUCUNE PII fantôme sur les collisions connues', () => {
  // « fr » avait été mis dans la liste : le « .fr » d'un email faisait passer
  // les deux mots suivants pour un nom (« Mon IBAN » sur la fixture 1).
  assert.deepEqual(per('contact : julien@monentreprise.fr. Mon dossier avance'), []);
  assert.deepEqual(per('Mon IBAN est FR76 3000 6000 0112 3456 7890 189'), []);
  // Abréviations exigeant leur point, sinon collision avec des mots courants.
  assert.deepEqual(per('Le PR Manager valide'), []);
  assert.deepEqual(per('Sr Developer chez Acme'), []);
  assert.deepEqual(per('un capteur de 50 mm Hg'), []);
});

test('la normalisation ignore casse et points', () => {
  assert.equal(normalizeHonorific('  Mme. '), 'mme');
  assert.equal(normalizeHonorific('DR'), 'dr');
  assert.ok(HONORIFICS.has(normalizeHonorific('Sra.')));
});
