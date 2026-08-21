// Profils d'anonymisation : logique pure (le stockage chrome.storage est
// navigateur-only, testé en manuel). On vérifie le semis des défauts, la
// non-écrasement de l'existant, et la normalisation défensive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedDefaults, defaultProfiles, normalizeProfile, empreinteDe } from '../../src/popup/profiles.js';

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

// --- MISE À JOUR DES PROFILS LIVRÉS ---------------------------------------
// L'ancienne version n'ajoutait un profil que si son NOM était absent :
// enrichir une liste livrée n'atteignait donc jamais une installation
// existante, et sans le moindre signe. Mesuré sur un vrai CV — « BDD », « LAMP »
// et « JaCoCo » restaient masqués malgré leur ajout aux technos.

test('un profil livré JAMAIS touché reçoit la liste à jour', () => {
  const [defaut] = defaultProfiles().filter(p => p.name === 'Développeur / Tech');
  // Une ANCIENNE version expédiée : contenu plus court, et son empreinte à
  // elle. C'est le cas réel — installé il y a des semaines, jamais édité.
  const ancienne = {
    name: 'Développeur / Tech', alwaysKeep: ['React', 'Docker'],
    alwaysMask: [], disabledTypes: [], realistic: false
  };
  ancienne.empreinte = empreinteDe(ancienne);

  const apres = seedDefaults([ancienne]).find(p => p.name === 'Développeur / Tech');
  assert.deepEqual(apres.alwaysKeep, defaut.alwaysKeep, 'liste jamais mise à jour');
  assert.ok(apres.alwaysKeep.includes('LAMP'), 'le cas qui a motivé le correctif');
  assert.equal(apres.empreinte, empreinteDe(defaut), 'empreinte non rafraîchie');
});

test('un profil livré ÉDITÉ n\'est jamais écrasé', () => {
  const [defaut] = defaultProfiles().filter(p => p.name === 'Développeur / Tech');
  const edite = { ...defaut, alwaysKeep: ['seulement-ce-que-je-veux'],
                  empreinte: empreinteDe(defaut) };
  const apres = seedDefaults([edite]).find(p => p.name === 'Développeur / Tech');
  assert.deepEqual(apres.alwaysKeep, ['seulement-ce-que-je-veux']);
});

test('un profil d\'AVANT le champ empreinte est reconnu comme intact', () => {
  // Installé avant l'introduction du champ : aucune empreinte stockée. Son
  // contenu correspond pourtant à une version expédiée — c'est ce que la
  // table EMPREINTES_HISTORIQUES sait démontrer.
  const ancien = {
    name: 'Vierge', alwaysKeep: [], alwaysMask: [], disabledTypes: [], realistic: false
  };
  const apres = seedDefaults([ancien]).find(p => p.name === 'Vierge');
  assert.ok(apres.empreinte, 'un profil intact doit repartir avec son empreinte');
});

test('un profil sans empreinte ET au contenu inconnu est laissé tel quel', () => {
  const bricole = {
    name: 'Développeur / Tech', alwaysKeep: ['Rust'], alwaysMask: [],
    disabledTypes: [], realistic: false
  };
  const apres = seedDefaults([bricole]).find(p => p.name === 'Développeur / Tech');
  assert.deepEqual(apres.alwaysKeep, ['Rust'], 'une liste inconnue a été écrasée');
});

test('un profil PERSONNEL de l\'utilisateur n\'est jamais touché', () => {
  const perso = { name: 'Mon profil', alwaysKeep: ['Acme'], alwaysMask: [],
                  disabledTypes: [], realistic: true };
  const apres = seedDefaults([perso]).find(p => p.name === 'Mon profil');
  assert.deepEqual(apres, normalizeProfile(perso));
});

test('les empreintes historiques déclarées correspondent à de VRAIES versions', () => {
  // Garde-fou : une empreinte mal recopiée rendrait la mise à jour inopérante
  // sans que rien ne le signale. Toutes doivent être des chaînes hexa de 8.
  for (const d of defaultProfiles()) {
    assert.match(empreinteDe(d), /^[0-9a-f]{8}$/);
  }
});
