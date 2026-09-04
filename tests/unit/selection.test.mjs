// Zéro tolérance : selectActive décide de ce qui est masqué.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectActive, entityKey, forcedMasks, filterByRules } from '../../src/engine/selection.js';

const auto = (type, value, start, source = 'regex') =>
  ({ type, value, start, end: start + value.length, source });
const manual = (value, start) =>
  ({ type: 'PERSONNALISE', value, start, end: start + value.length, source: 'manuel' });

test('sans retrait ni manuel : tout passe, trié', () => {
  const a = [auto('EMAIL', 'a@b.fr', 20), auto('TELEPHONE', '0612345678', 0)];
  assert.deepEqual(selectActive(a, [], new Set()).map(e => e.type), ['TELEPHONE', 'EMAIL']);
});

test('un retrait exclut la détection automatique visée, et elle seule', () => {
  const a = [auto('EMAIL', 'a@b.fr', 20), auto('TELEPHONE', '0612345678', 0)];
  const removed = new Set([entityKey(a[0])]);
  assert.deepEqual(selectActive(a, [], removed).map(e => e.type), ['TELEPHONE']);
});

test('un masque manuel a priorité sur une détection qui le chevauche', () => {
  const a = [auto('EMAIL', 'a@b.fr', 10)];
  const m = [manual('xx a@b.fr xx', 7)]; // chevauche l’email
  const out = selectActive(a, m, new Set());
  assert.equal(out.length, 1);
  assert.equal(out[0].source, 'manuel');
});

test('un masque manuel retiré ne masque plus (et la détection auto réapparaît)', () => {
  const a = [auto('EMAIL', 'a@b.fr', 10)];
  const m = [manual('xx a@b.fr xx', 7)];
  const removed = new Set([entityKey(m[0])]);
  const out = selectActive(a, m, removed);
  assert.equal(out.length, 1);
  assert.equal(out[0].source, 'regex');
});

test('deux masques manuels identiques → un seul survit (anti-doublon)', () => {
  const m = [manual('secret', 5), manual('secret', 5)];
  assert.equal(selectActive([], m, new Set()).length, 1);
});

test('résultat toujours sans chevauchement', () => {
  const a = [auto('TELEPHONE', '0612345678', 0), auto('CARTE_BANCAIRE', '4242424242424242', 5)];
  const out = selectActive(a, [], new Set());
  for (let i = 1; i < out.length; i++) assert.ok(out[i].start >= out[i - 1].end);
});

// ===== Masquage personnalisé
test('forcedMasks : capte toutes les occurrences d\'un terme, ignore le vide', () => {
  const text = 'Projet ORION, phase ORION 2, fin ORION.';
  const out = forcedMasks(text, ['ORION', '', '  ']);
  assert.equal(out.length, 3);
  assert.ok(out.every(e => e.value === 'ORION' && e.source === 'manuel'));
  assert.deepEqual(out.map(e => e.start), [7, 20, 33]);
});

test('forcedMasks branché dans selectActive : le terme forcé est masqué comme un manuel', () => {
  const text = 'contactez Dupont-Martin svp';
  const forced = forcedMasks(text, ['Dupont-Martin']);
  const out = selectActive([], forced, new Set());
  assert.equal(out.length, 1);
  assert.equal(out[0].value, 'Dupont-Martin');
});

test('filterByRules : un type désactivé n\'est plus masqué', () => {
  const es = [auto('PER', 'Jean', 0), auto('LOC', 'Lyon', 10)];
  const out = filterByRules(es, { disabledTypes: new Set(['LOC']) });
  assert.deepEqual(out.map(e => e.type), ['PER']);
});

test('filterByRules : une valeur « à garder » est épargnée (insensible à la casse)', () => {
  const es = [auto('ORG', 'Innovatech', 0), auto('PER', 'Jean', 20)];
  const out = filterByRules(es, { keepValues: ['innovatech'] });
  assert.deepEqual(out.map(e => e.value), ['Jean']);
});

test('filterByRules : un masque MANUEL survit même si son type/valeur est filtré', () => {
  const es = [{ type: 'PERSONNALISE', value: 'Lyon', start: 0, end: 4, source: 'manuel' }];
  const out = filterByRules(es, { disabledTypes: new Set(['PERSONNALISE']), keepValues: ['lyon'] });
  assert.equal(out.length, 1, 'la volonté explicite de l\'utilisateur prime');
});

// --- « NE JAMAIS MASQUER » : correspondance par suite de MOTS, pas par égalité.
//
// Bug mesuré sur un vrai mémoire : 14 termes saisis, 6 appliqués seulement. Le
// modèle détecte « Joss Moorkens » ou « Google Translate » en entier, tandis
// que l'utilisateur saisit « Moorkens » ou « Google ». L'égalité stricte ne
// pouvait rien matcher, et la consigne restait sans effet sans que rien ne le
// Signale - on croit sa règle appliquée alors qu'elle ne l'est pas.
const ent = (value, type = 'PER', source = 'ner') =>
  ({ type, value, start: 0, end: value.length, source });

test('un terme gardé épargne l\'entité qui le CONTIENT', () => {
  const out = filterByRules([ent('Joss Moorkens')], { keepValues: ['Moorkens'] });
  assert.deepEqual(out, []);
});

test('un terme gardé épargne l\'entité CONTENUE dedans', () => {
  // L'utilisateur saisit le nom complet, le modèle n'a détecté que le patronyme.
  const out = filterByRules([ent('Moorkens')], { keepValues: ['Joss Moorkens'] });
  assert.deepEqual(out, []);
});

test('la correspondance porte sur des MOTS ENTIERS, jamais des fragments', () => {
  // Sans frontière de mot, « MT » épargnerait « Amtrak » et « Smith » - et le
  // sur-masquage deviendrait du sous-masquage silencieux.
  const gardes = filterByRules(
    [ent('Amtrak', 'ORG'), ent('Smith'), ent('MT', 'ORG')],
    { keepValues: ['MT'] }
  ).map(e => e.value);
  assert.deepEqual(gardes, ['Amtrak', 'Smith']);
});

test('la casse et les accents ne font pas échouer la règle', () => {
  const out = filterByRules([ent('Sterenn QUÉMERAIS')], { keepValues: ['quémerais'] });
  assert.deepEqual(out, []);
});

test('« toujours masquer » l\'emporte sur « ne jamais masquer »', () => {
  // Garde-fou du risque assumé : garder « Paris » épargnerait « Paris Dupont ».
  // Un masque manuel reprend la main - l'utilisateur a le dernier mot.
  const out = filterByRules(
    [{ ...ent('Paris Dupont'), source: 'manuel' }],
    { keepValues: ['Paris'] }
  );
  assert.equal(out.length, 1);
});

test('un terme gardé ne désactive pas les entités SANS RAPPORT', () => {
  const gardes = filterByRules(
    [ent('Joss Moorkens'), ent('Sterenn Quémerais')],
    { keepValues: ['Moorkens'] }
  ).map(e => e.value);
  assert.deepEqual(gardes, ['Sterenn Quémerais']);
});

// --- NOS PROPRES PLACEHOLDERS NE SE REMASQUENT PAS ------------------------
//
// Défaut constaté sur un vrai CV repassé une seconde fois dans l'outil : le
// modèle voyait « [PERSONNE_2] », y trouvait une entité, et on écrivait
// « [[PERSONNE_1]] ». La table disait alors « [PERSONNE_1] → PERSONNE_2 »,
// c'est-à-dire rien - et la réinjection était morte, la table du premier
// passage ayant disparu avec la popup.
test('un placeholder déjà posé n’est jamais remasqué', () => {
  const ents = [
    { source: 'ner', type: 'PER', value: 'PERSONNE_2' },
    { source: 'ner', type: 'LOC', value: '[LIEU_5]' },
    { source: 'regex', type: 'EMAIL', value: 'EMAIL_1' },
    { source: 'ner', type: 'ORG', value: 'Semantikmatch' }
  ];
  const out = filterByRules(ents, {});
  assert.deepEqual(out.map(e => e.value), ['Semantikmatch']);
});

test('la garde vaut AUSSI pour une sélection manuelle', () => {
  // Une sélection manuelle est d'ordinaire souveraine, mais masquer un
  // placeholder ne rend service dans aucun cas : ça ne peut que détruire.
  const ents = [{ source: 'manuel', type: 'PER', value: '[PERSONNE_1]' }];
  assert.equal(filterByRules(ents, {}).length, 0);
});

test('un mot qui RESSEMBLE à un placeholder sans en être un reste masqué', () => {
  // Le motif exige le suffixe numérique ET un libellé connu : sans lui, on
  // démasquerait des valeurs légitimes.
  const ents = ['PERSONNE', '[PERSONNE]', 'Personne', 'INCONNU_3', 'LIEU_X']
    .map(value => ({ source: 'ner', type: 'ORG', value }));
  assert.equal(filterByRules(ents, {}).length, 5);
});

// Déclarer son identité ne doit pas rendre ses données moins masquées.
//
// Fuite mesurée sur un vrai CV le 04/09/2026. L'utilisateur déclare son nom de
// famille ; ce terme est cherché littéralement, donc il matche aussi à
// l'intérieur de son adresse e-mail. La règle d'origine jetait toute détection
// chevauchant un masque manuel - l'entité EMAIL disparaissait, et le document
// livré portait « adrien.[PERSONNALISE_1].pro@gmail.com » là où il portait
// « [EMAIL_1] » sans le profil. La fonctionnalité censée mieux protéger
// protégeait moins, et pour l'utilisateur le plus prudent.
test('un masque forcé contenu dans une détection ne la découpe pas', () => {
  const email = { source: 'regex', type: 'EMAIL', value: 'adrien.mesnard@exemple.fr', start: 10, end: 35 };
  const forceInterne = { source: 'manuel', type: 'PERSONNALISE', value: 'mesnard', start: 17, end: 24 };
  const actives = selectActive([email], [forceInterne], new Set());
  assert.deepEqual(actives.map(e => e.type), ['EMAIL'],
    'l’e-mail doit survivre : il masque déjà tout ce que le terme forcé masquerait');
});

test('un masque forcé qui COUVRE la détection reste souverain', () => {
  // L'inverse doit continuer de valoir : quand l'utilisateur force un terme plus
  // large que ce que le moteur a trouvé, c'est lui qui décide.
  const petit = { source: 'ner', type: 'ORG', value: 'Zephyr', start: 10, end: 16 };
  const forceLarge = { source: 'manuel', type: 'PERSONNALISE', value: 'projet Zephyr', start: 3, end: 16 };
  const actives = selectActive([petit], [forceLarge], new Set());
  assert.deepEqual(actives.map(e => e.type), ['PERSONNALISE']);
});

test('deux spans identiques : le manuel l’emporte, comme avant', () => {
  const a = { source: 'ner', type: 'ORG', value: 'Zephyr', start: 3, end: 9 };
  const m = { source: 'manuel', type: 'PERSONNALISE', value: 'Zephyr', start: 3, end: 9 };
  assert.deepEqual(selectActive([a], [m], new Set()).map(e => e.type), ['PERSONNALISE']);
});
