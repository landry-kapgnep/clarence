// Profils d'anonymisation : logique pure (le stockage chrome.storage est
// navigateur-only, testé en manuel). On vérifie le semis des défauts, la
// non-écrasement de l'existant, et la normalisation défensive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedDefaults, defaultProfiles, normalizeProfile, empreinteDe, estProfilLivre } from '../../src/popup/profiles.js';

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


// --- BIBLIOTHÈQUE DE PROFILS LIVRÉS ---------------------------------------

test('les mots de structure de document sont dans TOUS les profils garnis', () => {
  // Un intitulé de section n'appartient pas à un type de document : il vaut
  // pour tous. En faire un profil « CV » forcerait à choisir entre lui et son
  // profil de métier, or les profils sont exclusifs.
  for (const p of defaultProfiles()) {
    if (p.name === 'Vierge') continue;
    for (const mot of ['SOMMAIRE', 'COMPÉTENCES', 'OUTILS', 'SPRACHEN']) {
      assert.ok(p.alwaysKeep.includes(mot), `${mot} absent de « ${p.name} »`);
    }
  }
});

test('le vocabulaire de PARCOURS est partagé, pas réservé au profil École', () => {
  // Mesuré sur un vrai CV de développeur : « Développeur / Tech » ne
  // récupérait que 4 des 25 termes sur-masqués et « École / Études » 7, sans
  // qu aucun couvre les deux — or le document a besoin des technos ET des
  // diplômes, et les profils sont exclusifs.
  //
  // Règle retenue : ce qui apparaît quel que soit le domaine est partagé ; ce
  // qui n apparaît que dans un document du domaine reste dans son profil.
  for (const p of defaultProfiles()) {
    if (p.name === 'Vierge') continue;
    for (const mot of ['Baccalauréat', 'Diplôme', 'Alternance', 'Cohortes']) {
      assert.ok(p.alwaysKeep.includes(mot), `${mot} absent de « ${p.name} »`);
    }
  }
  // À l inverse, le vocabulaire proprement scolaire n est PAS partagé.
  const tech = defaultProfiles().find(p => p.name === 'Développeur / Tech');
  assert.ok(!tech.alwaysKeep.includes('Contrôle continu'),
    'le vocabulaire scolaire déborde hors de son profil');
});

test('« Vierge » reste vide — c est le temoin', () => {
  const v = defaultProfiles().find(p => p.name === 'Vierge');
  assert.deepEqual(v.alwaysKeep, []);
  assert.deepEqual(v.alwaysMask, []);
});

test('aucune liste blanche ne contient de quasi-identifiant', () => {
  // LA règle du fichier : ce qui est ici ne sera JAMAIS masqué, pour personne.
  // Un nom d école, d employeur ou de ville identifie un parcours — les
  // blanchir rouvrirait le trou fermé ailleurs (P12).
  const interdits = [
    'Sorbonne', 'IUT', 'Harvard', 'Polytechnique', 'CAF', 'URSSAF',
    'Paris', 'Lyon', 'Nantes', 'Marseille', 'Bordeaux'
  ];
  for (const p of defaultProfiles()) {
    for (const terme of p.alwaysKeep) {
      assert.ok(!interdits.includes(terme),
        `« ${terme} » est un quasi-identifiant et ne doit jamais être blanchi (profil « ${p.name} »)`);
    }
  }
});

test('les cas mesurés sur de vrais documents sont couverts', () => {
  const admin = defaultProfiles().find(p => p.name === 'Administratif');
  // Sortis masqués en ENTREPRISE sur un vrai casier judiciaire.
  for (const m of ['RÉPUBLIQUE FRANÇAISE', 'MINISTÈRE', 'NÉANT', 'IDENTITÉ']) {
    assert.ok(admin.alwaysKeep.includes(m), `${m} absent du profil Administratif`);
  }
  const ecole = defaultProfiles().find(p => p.name === 'École / Études');
  // Sortis masqués sur un vrai CV.
  for (const m of ['Baccalauréat', 'Spécialités', 'Cohortes', 'Général']) {
    assert.ok(ecole.alwaysKeep.includes(m) || ecole.alwaysKeep.includes(m.replace(/s$/, '')),
      `${m} absent du profil École`);
  }
});

// --- SUPPRESSION DURABLE ---------------------------------------------------
// seedDefaults recréait tout profil livré dont le nom manquait : le supprimer
// ne servait à rien, il revenait au rechargement suivant.

test('un profil livré supprimé ne revient pas', () => {
  const list = seedDefaults([], ['Développeur / Tech']);
  assert.ok(!list.some(p => p.name === 'Développeur / Tech'), 'le profil est revenu');
  assert.ok(list.some(p => p.name === 'Administratif'), 'les autres doivent rester');
});

test('un profil écarté PUIS recréé par l utilisateur est conservé', () => {
  // Il est de nouveau présent dans la liste : la mémoire du retrait ne doit
  // pas le faire disparaître une seconde fois.
  const recree = { name: 'Développeur / Tech', alwaysKeep: ['Rust'], alwaysMask: [],
                   disabledTypes: [], realistic: false };
  const list = seedDefaults([recree], ['Développeur / Tech']);
  const trouve = list.find(p => p.name === 'Développeur / Tech');
  assert.ok(trouve, 'le profil recréé a disparu');
  assert.deepEqual(trouve.alwaysKeep, ['Rust'], 'son contenu a été écrasé');
});

test('estProfilLivre distingue livré et personnel', () => {
  assert.ok(estProfilLivre('Administratif'));
  assert.ok(!estProfilLivre('Mon profil à moi'));
});
