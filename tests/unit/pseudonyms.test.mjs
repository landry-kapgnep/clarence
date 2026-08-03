// Option pseudonymes réalistes : déterminisme, unicité, anti-collision,
// et garantie que les types structurés critiques restent en placeholders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPseudonymizer } from '../../src/engine/pseudonyms.js';
import { maskText, reinject } from '../../src/engine/masking.js';

const e = (type, value, start, source = 'ner') =>
  ({ type, value, start, end: start + value.length, source, score: 0.99 });

test('déterminisme : même seed + même valeur → même pseudo', () => {
  const a = createPseudonymizer({ seed: 's1' });
  const b = createPseudonymizer({ seed: 's1' });
  assert.equal(a('PER', 'Jean Dupont'), b('PER', 'Jean Dupont'));
});

test('unicité : deux valeurs distinctes → deux pseudos distincts', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.notEqual(p('PER', 'Jean Dupont'), p('PER', 'Marie Curie'));
});

test('anti-collision : un pseudo présent dans le texte d origine est refusé', () => {
  const texte = 'Basé à Lyon avec Paul Mercier.';
  const p = createPseudonymizer({ seed: 's1', avoid: v => texte.includes(v) });
  const ville = p('LOC', 'Bordeaux');
  assert.notEqual(ville, 'Lyon');
  const nom = p('PER', 'Quelqu’un D’Autre');
  assert.notEqual(nom, 'Paul Mercier');
});

test('types structurés critiques → null (placeholder obligatoire)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  for (const t of ['IBAN', 'CARTE_BANCAIRE', 'NIR', 'SIRET_SIREN', 'REFERENCE', 'MONTANT', 'CODE_POSTAL_VILLE']) {
    assert.equal(p(t, '123'), null, t);
  }
});

test('maskText réaliste : nom pseudonymisé, IBAN en placeholder, désanonymisation exacte', () => {
  const text = 'Jean Dupont, IBAN FR76 3000 6000 0112 3456 7890 189. Merci Jean Dupont.';
  const ents = [
    e('PER', 'Jean Dupont', 0),
    e('IBAN', 'FR76 3000 6000 0112 3456 7890 189', text.indexOf('FR76'), 'regex'),
    e('PER', 'Jean Dupont', text.indexOf('Jean Dupont', 20))
  ];
  const p = createPseudonymizer({ seed: 's1', avoid: v => text.includes(v) });
  const { masked, mapping } = maskText(text, ents, { pseudonymize: p });
  // le nom est réaliste (pas un placeholder), cohérent sur les 2 occurrences
  const per = mapping.find(m => m.type === 'PER');
  assert.equal(per.realistic, true);
  assert.ok(!per.placeholder.startsWith('['));
  assert.equal(masked.split(per.placeholder).length - 1, 2);
  // l'IBAN reste en placeholder
  const iban = mapping.find(m => m.type === 'IBAN');
  assert.equal(iban.realistic, false);
  assert.equal(iban.placeholder, '[IBAN_1]');
  // aucune valeur réelle ne fuit
  assert.equal(masked.includes('Jean Dupont'), false);
  // aller-retour exact
  assert.equal(reinject(masked, mapping), text);
});

test('format de date préservé (séparateur)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('DATE_NAISSANCE', '12/03/1985'), /^\d{2}\/\d{2}\/\d{4}$/);
  assert.match(p('DATE_NAISSANCE', '12-03-1985'), /^\d{2}-\d{2}-\d{4}$/);
});

test('téléphone pseudo au format FR mobile', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('TELEPHONE', '06 12 34 56 78'), /^0[67](?: \d{2}){4}$/);
});

// --- Locale des pseudonymes (constaté : toujours franco-français, même sur
// un document rédigé en anglais — ça casse l'illusion de cohérence).
test('locale par défaut = fr (non-régression)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('TELEPHONE', '06 12 34 56 78'), /^0[67](?: \d{2}){4}$/);
});

test('locale "en" produit des noms/villes/téléphones anglophones', () => {
  const p = createPseudonymizer({ seed: 's1', locale: 'en' });
  const nom = p('PER', 'Jean Dupont');
  assert.ok(!/[éèêàçÀ-ÿ]/.test(nom), 'accent français dans un pseudo anglophone : ' + nom);
  assert.match(p('TELEPHONE', '555-1234'), /^\(\d{3}\) \d{3}-\d{4}$/);
  const email = p('EMAIL', 'jean@exemple.fr');
  assert.match(email, /@.+\.com$/);
});

test('une locale inconnue retombe silencieusement sur fr (jamais de plantage)', () => {
  const p = createPseudonymizer({ seed: 's1', locale: 'xx' });
  assert.match(p('TELEPHONE', '06 12 34 56 78'), /^0[67](?: \d{2}){4}$/);
});

test('déterminisme préservé PAR locale (même seed+valeur+locale → même pseudo)', () => {
  const a = createPseudonymizer({ seed: 's1', locale: 'en' });
  const b = createPseudonymizer({ seed: 's1', locale: 'en' });
  assert.equal(a('PER', 'Jean Dupont'), b('PER', 'Jean Dupont'));
});
