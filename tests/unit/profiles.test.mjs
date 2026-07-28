// Profils d'anonymisation : logique pure (le stockage chrome.storage est
// navigateur-only, testé en manuel). On vérifie le semis des défauts, la
// non-écrasement de l'existant, et la normalisation défensive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedDefaults, defaultProfiles, normalizeProfile } from '../../src/popup/profiles.js';

test('seedDefaults ajoute les profils par défaut sur une liste vide', () => {
  const list = seedDefaults([]);
  const names = list.map(p => p.name);
  assert.ok(names.includes('Vierge'));
  assert.ok(names.includes('Développeur / Tech'));
});

test('seedDefaults n\'écrase PAS un profil existant du même nom (édition utilisateur préservée)', () => {
  const edited = { name: 'Développeur / Tech', alwaysKeep: ['MonTermeAMoi'], alwaysMask: [], disabledTypes: [], realistic: true };
  const list = seedDefaults([edited]);
  const tech = list.find(p => p.name === 'Développeur / Tech');
  assert.deepEqual(tech.alwaysKeep, ['MonTermeAMoi'], 'la version éditée doit survivre');
  assert.equal(tech.realistic, true);
  // « Vierge » (manquant) doit tout de même être ajouté
  assert.ok(list.some(p => p.name === 'Vierge'));
});

test('le profil Tech par défaut contient bien des technos courantes', () => {
  const tech = defaultProfiles().find(p => p.name === 'Développeur / Tech');
  for (const t of ['React', 'Docker', 'Prisma', 'Ollama', 'Python']) {
    assert.ok(tech.alwaysKeep.includes(t), 'manque : ' + t);
  }
});

test('normalizeProfile est défensif (types invalides, champs manquants)', () => {
  const p = normalizeProfile({ name: '  Perso  ', alwaysKeep: ['a', 3, null], alwaysMask: 'pasuntableau', realistic: 1 });
  assert.equal(p.name, 'Perso');
  assert.deepEqual(p.alwaysKeep, ['a']); // 3 et null filtrés
  assert.deepEqual(p.alwaysMask, []);    // string → tableau vide
  assert.equal(p.realistic, true);
  assert.deepEqual(p.disabledTypes, []);
});

test('normalizeProfile : nom vide → « Sans nom »', () => {
  assert.equal(normalizeProfile({ name: '   ' }).name, 'Sans nom');
});
