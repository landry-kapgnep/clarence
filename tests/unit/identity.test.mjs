// Profil d'identité : la donnée la plus sensible de l'extension. Zéro
// tolérance sur identityTerms (alimente forcedMasks, donc le masquage).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIdentity, identityTerms, identitySearchTerms, IDENTITY_FIELDS, MIN_TERM_LENGTH } from '../../src/popup/identity.js';
import { forcedMasks, selectActive } from '../../src/engine/selection.js';
import { maskText } from '../../src/engine/masking.js';

test('normalizeIdentity : entrée nulle → statut neuf, tous champs vides', () => {
  const id = normalizeIdentity(null);
  assert.equal(id.status, 'neuf');
  for (const [key] of IDENTITY_FIELDS) assert.deepEqual(id.champs[key], []);
});

test('normalizeIdentity : statut inconnu ramené à neuf, champs inattendus ignorés', () => {
  const id = normalizeIdentity({ status: 'pirate', champs: { nom: 'Kapgnep', inconnu: 'x' } });
  assert.equal(id.status, 'neuf');
  assert.deepEqual(id.champs.nom, ['Kapgnep']);
  assert.equal('inconnu' in id.champs, false);
});

test('champs multi-lignes : un terme par ligne, vides retirés, tableaux acceptés', () => {
  const id = normalizeIdentity({ status: 'configuré', champs: {
    emails: 'perso@mail.fr\n\n  pro@mail.fr  ',
    pseudos: ['landry-kapgnep', '', 'lkap']
  }});
  assert.deepEqual(id.champs.emails, ['perso@mail.fr', 'pro@mail.fr']);
  assert.deepEqual(id.champs.pseudos, ['landry-kapgnep', 'lkap']);
});

test('identityTerms : GARDE-FOU - un terme trop court ne sort JAMAIS', () => {
  // Une initiale (« L ») en recherche littérale masquerait une lettre sur
  // deux du document entier. Ce test protège ce garde-fou.
  const terms = identityTerms({ status: 'configuré', champs: {
    prenom: 'L\nLandry', nom: 'K', autres: 'ab'
  }});
  assert.deepEqual(terms, ['Landry', 'ab']);
  for (const t of terms) assert.ok(t.length >= MIN_TERM_LENGTH);
});

test('identityTerms : dédoublonnage insensible à la casse, premier gagnant', () => {
  const terms = identityTerms({ status: 'configuré', champs: {
    nom: 'Kapgnep', pseudos: 'kapgnep\nKAPGNEP', employeurs: 'Semantikmatch'
  }});
  assert.deepEqual(terms, ['Kapgnep', 'Semantikmatch']);
});

test('bout en bout : identité → forcedMasks → toutes les occurrences masquées', () => {
  // Le chemin réel de production (identitySearchTerms, avec variantes de
  // casse) : les termes déclarés doivent masquer chaque occurrence,
  // indépendamment de tout modèle et de tout score.
  const texte = 'LANDRY KAPGNEP — contact : landry.kapgnep.pro@gmail.com. Landry travaille chez Semantikmatch.';
  const terms = identitySearchTerms({ status: 'configuré', champs: {
    prenom: 'Landry', nom: 'Kapgnep',
    emails: 'landry.kapgnep.pro@gmail.com', employeurs: 'Semantikmatch'
  }});
  const forced = forcedMasks(texte, terms);
  const actives = selectActive([], forced, new Set());
  const { masked } = maskText(texte, actives);
  assert.ok(!/landry/i.test(masked), 'le prénom fuit : ' + masked);
  assert.ok(!/kapgnep/i.test(masked), 'le nom fuit : ' + masked);
  assert.ok(!masked.includes('Semantikmatch'), 'l\'employeur fuit : ' + masked);
});

test('identitySearchTerms : les variantes de casse couvrent le CV en MAJUSCULES', () => {
  // LE cas qui a motivé ce module : l'utilisateur déclare « Landry Kapgnep »,
  // son CV titre « LANDRY KAPGNEP ». forcedMasks est littéral - sans les
  // variantes générées, le nom fuirait.
  const texte = 'LANDRY KAPGNEP — Landry Kapgnep — landry kapgnep.';
  const terms = identitySearchTerms({ status: 'configuré', champs: { prenom: 'Landry', nom: 'Kapgnep' } });
  assert.ok(terms.includes('LANDRY'), 'variante MAJUSCULES absente');
  assert.ok(terms.includes('landry'), 'variante minuscules absente');
  const forced = forcedMasks(texte, terms);
  const { masked } = maskText(texte, selectActive([], forced, new Set()));
  assert.ok(!/landry/i.test(masked), 'une variante de casse fuit : ' + masked);
  assert.ok(!/kapgnep/i.test(masked), 'une variante de casse fuit : ' + masked);
});

test('identitySearchTerms : casse Titre générée pour un terme déclaré en majuscules', () => {
  const terms = identitySearchTerms({ status: 'configuré', champs: { employeurs: 'ACME CORP' } });
  assert.ok(terms.includes('Acme Corp'));
  assert.ok(terms.includes('acme corp'));
});

// --- COMPOSANTS D'UN NOM MULTI-MOTS (P12) ---------------------------------
// Trouvé sur un vrai casier judiciaire : un formulaire éclate le nom sur deux
// lignes (« Nom KAPGNEP », « Prénom(s) LANDRY »). Qui saisit son nom complet
// dans une seule case ne voyait masquer NI l'un NI l'autre, forcedMasks étant
// littéral. Le garde-fou déterministe manquait là où il servait le plus.

test('un nom complet saisi dans UNE case protège chacun de ses composants', () => {
  const texte = 'IDENTITÉ  Nom  KAPGNEP  Prénom(s)  LANDRY  Sexe  Masculin';
  const terms = identitySearchTerms({
    status: 'configuré', champs: { prenom: 'Landry Kapgnep' }
  });
  const { masked } = maskText(texte, selectActive([], forcedMasks(texte, terms), new Set()));
  assert.ok(!/landry/i.test(masked), 'le prénom isolé fuit : ' + masked);
  assert.ok(!/kapgnep/i.test(masked), 'le patronyme isolé fuit : ' + masked);
  // Le libellé du formulaire, lui, doit survivre.
  assert.match(masked, /Masculin/);
});

test('les particules et civilités ne deviennent PAS des termes isolés', () => {
  // Masquer « de » ou « M » séparément couperait le document en morceaux.
  const terms = identitySearchTerms({
    status: 'configuré', champs: { nom: 'M. Charles de La Fontaine' }
  });
  for (const interdit of ['de', 'De', 'DE', 'M.', 'la', 'La']) {
    assert.ok(!terms.includes(interdit), `particule/civilité isolée : « ${interdit} »`);
  }
  assert.ok(terms.includes('Charles'));
  // Dernier composant : « Fontaine » est un vrai patronyme, jamais une
  // particule - c'est la règle de position, pas la seule appartenance.
  assert.ok(terms.includes('Fontaine'));
});

test('« Le » en DERNIER composant reste masqué (règle de position)', () => {
  const terms = identitySearchTerms({
    status: 'configuré', champs: { nom: 'Marie Le' }
  });
  assert.ok(terms.includes('Le'), 'un patronyme qui ressemble à une particule doit être masqué');
});

test('les champs NON décomposables restent cherchés en entier', () => {
  // Décomposer une adresse masquerait « rue » et « des » partout ; décomposer
  // un employeur masquerait « Labs ». Ces champs gardent leur terme complet.
  const terms = identitySearchTerms({
    status: 'configuré',
    champs: { adresse: '18 rue des Glycines', employeurs: 'Korrigane Labs' }
  });
  for (const interdit of ['rue', 'des', 'Glycines', 'Labs', 'Korrigane']) {
    assert.ok(!terms.includes(interdit), `composant isolé indésirable : « ${interdit} »`);
  }
  assert.ok(terms.includes('18 rue des Glycines'));
  assert.ok(terms.includes('Korrigane Labs'));
});
