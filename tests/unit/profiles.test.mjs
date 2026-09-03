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

// --- Profils PAR FORMAT, et leur vocabulaire partagé ----------------------

test('les profils par format existent et sont proposables', async () => {
  const { PROFIL_POUR_TYPE } = await import('../../src/popup/profiles.js');
  const noms = new Set(defaultProfiles().map(p => p.name));
  for (const [type, profil] of Object.entries(PROFIL_POUR_TYPE)) {
    if (profil === null) continue;
    assert.ok(noms.has(profil), `« ${profil} », proposé pour « ${type} », n’existe pas`);
  }
});

test('les mots de forme viennent de la source PARTAGÉE avec la détection', async () => {
  // Le point de conception : les mots qui reconnaissent un format sont ceux
  // qu'il ne faut pas y masquer. Deux listes auraient divergé.
  const { motsDeForme } = await import('../../src/engine/vocabulaire-formats.js');
  const cv = defaultProfiles().find(p => p.name === 'CV / Résumé');
  const bas = new Set(cv.alwaysKeep.map(t => t.toLowerCase()));
  for (const m of motsDeForme('cv')) {
    assert.ok(bas.has(m), `« ${m} » manque au profil CV`);
  }
});

test('les cinq langues sont représentées dans le profil CV', async () => {
  const cv = defaultProfiles().find(p => p.name === 'CV / Résumé');
  const bas = cv.alwaysKeep.map(t => t.toLowerCase());
  for (const [langue, mot] of [['fr', 'expériences professionnelles'], ['en', 'work experience'],
                               ['es', 'experiencia laboral'], ['de', 'berufserfahrung'],
                               ['pt', 'experiência profissional']]) {
    assert.ok(bas.includes(mot), `${langue} absent du profil CV`);
  }
});

// ⚠️ LA LISTE BLANCHE EST UN VECTEUR DE FUITE, pas une commodité : ce qu'on y
// écrit ne sera JAMAIS masqué, pour personne. Un mot trop générique qui se
// trouve dans une vraie entité la démasquerait.
//
// CE QUE CE TEST PROUVE, ET CE QU'IL NE PROUVE PAS. Il vérifie que les mots de
// forme n'ouvrent pas les entités PLAUSIBLES — noms d'école, d'employeur, de
// personne, de ville, y compris ceux qui ont réellement fui dans ce projet. Il
// ne prouve pas l'absence totale de risque : « Cabinet Introduction & Associés »
// serait bel et bien démasqué par « introduction ». Ce mot est admis quand même,
// et le compromis est explicite — il est déjà dans STRUCTURE_KEEP depuis des
// mois, la détection de type en a besoin, et masquer chaque intitulé
// « INTRODUCTION » coûterait bien plus qu'une raison sociale improbable.
test('aucun mot de forme ne démasque une entité plausible', async () => {
  const { filterByRules } = await import('../../src/engine/selection.js');
  const { TOUS_LES_MOTS_DE_FORME } = await import('../../src/engine/vocabulaire-formats.js');
  const pieges = ['Sorbonne Paris Nord', 'Semantikmatch', 'Korrigane Labs',
                  'Rose Fontaine', 'Villetaneuse', 'Médecins Sans Frontières',
                  'Startup Twini', 'Formations Dupont SARL', 'Crédit Agricole'];
  const ents = pieges.map(value => ({ source: 'ner', type: 'ORG', value }));
  const gardees = filterByRules(ents, { keepValues: TOUS_LES_MOTS_DE_FORME });
  assert.deepEqual(gardees.map(e => e.value), pieges,
    'un mot de forme a démasqué une entité plausible');
});

// ⚠️ NE PAS PROPOSER UN RECUL — la règle qui empêche la suggestion de nuire.
//
// Comparer les NOMS ne suffit pas : les profils de MÉTIER portent eux aussi le
// vocabulaire de leur format. « Développeur / Tech » contient tout le
// vocabulaire CV, donc proposer « CV / Résumé » à quelqu'un déjà dessus lui
// ferait PERDRE sa liste de technos — et remasquerait « Ollama », « JaCoCo »,
// « BDD », constaté sur un vrai CV. La bonne question n'est pas « le profil
// est-il différent ? » mais « couvre-t-il déjà ce format ? ».
test('un profil qui couvre déjà le format ne doit pas recevoir de suggestion', async () => {
  const { motsDeForme } = await import('../../src/engine/vocabulaire-formats.js');
  const couvre = (nom, format) => {
    const p = defaultProfiles().find(x => x.name === nom);
    const deja = new Set(p.alwaysKeep.map(t => t.toLowerCase()));
    return motsDeForme(format).every(m => deja.has(m));
  };
  // Ceux-là se taisent : ils portent déjà le vocabulaire du format.
  assert.ok(couvre('Développeur / Tech', 'cv'), 'Dev/Tech devrait couvrir le CV');
  assert.ok(couvre('CV / Résumé', 'cv'));
  assert.ok(couvre('École / Études', 'scolaire'));
  assert.ok(couvre('Administratif', 'administratif'));
  assert.ok(couvre('Relevé bancaire', 'bancaire'));
  // Ceux-là non : la suggestion a une vraie valeur à apporter.
  assert.ok(!couvre('Vierge', 'cv'));
  assert.ok(!couvre('Relevé bancaire', 'cv'));
  assert.ok(!couvre('Développeur / Tech', 'bancaire'));
});
