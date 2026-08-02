// L'orchestrateur traite tout le fichier comme un seul document virtuel :
// zéro tolérance sur la cohérence des placeholders inter-unités (voir
// anonymize-units.js), donc testé avec la même rigueur que src/engine/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeUnits, UNIT_SEP } from '../../src/files/anonymize-units.js';

test('masque une valeur détectée et localise l\'entité dans son unité', async () => {
  const units = [{ id: 'a', text: 'Contact: jean@acme.fr' }];
  const { results, mapping } = await anonymizeUnits(units);
  assert.equal(results[0].maskedText, 'Contact: [EMAIL_1]');
  assert.deepEqual(mapping.map(m => m.value), ['jean@acme.fr']);
  assert.deepEqual(results[0].entities, [{ start: 9, end: 21, placeholder: '[EMAIL_1]' }]);
});

test('même valeur répétée dans deux unités différentes → même placeholder', async () => {
  const units = [
    { id: 'a', text: 'Contact: jean@acme.fr' },
    { id: 'b', text: 'Encore jean@acme.fr pour confirmation' }
  ];
  const { results, mapping } = await anonymizeUnits(units);
  assert.equal(mapping.length, 1, 'une seule entrée de mapping pour la même valeur');
  assert.equal(results[0].maskedText, 'Contact: [EMAIL_1]');
  assert.equal(results[1].maskedText, 'Encore [EMAIL_1] pour confirmation');
});

test('unité vide passe inchangée, sans planter', async () => {
  const units = [{ id: 'a', text: '' }, { id: 'b', text: 'rien à masquer ici' }];
  const { results } = await anonymizeUnits(units);
  assert.deepEqual(results.find(r => r.id === 'a'), { id: 'a', text: '', maskedText: '', entities: [] });
  assert.equal(results.find(r => r.id === 'b').maskedText, 'rien à masquer ici');
});

test('unité sans PII reste inchangée', async () => {
  const units = [{ id: 'a', text: 'La réunion est prévue vendredi.' }];
  const { results } = await anonymizeUnits(units);
  assert.equal(results[0].maskedText, 'La réunion est prévue vendredi.');
  assert.deepEqual(results[0].entities, []);
});

test('refuse un texte contenant déjà le séparateur interne', async () => {
  const units = [{ id: 'a', text: `piégé ${UNIT_SEP} dedans` }];
  await assert.rejects(() => anonymizeUnits(units), /séparateur interne/);
});

// ===== Règles personnalisées (mêmes primitives que le mode texte) =====

test('forceTerms : le terme est masqué dans TOUTES les unités où il apparaît', async () => {
  const units = [
    { id: 'a', text: 'Projet Hermes lancé.' },
    { id: 'b', text: 'Budget Hermes validé.' }
  ];
  const { results, mapping } = await anonymizeUnits(units, { forceTerms: ['Hermes'] });
  assert.equal(results[0].maskedText.includes('Hermes'), false, 'fuite unité a');
  assert.equal(results[1].maskedText.includes('Hermes'), false, 'fuite unité b');
  // même placeholder partout (cohérence inter-unités)
  const ph = mapping.find(m => m.value === 'Hermes').placeholder;
  assert.ok(results[0].maskedText.includes(ph) && results[1].maskedText.includes(ph));
});

test('disabledTypes : un type désactivé n\'est plus masqué', async () => {
  const units = [{ id: 'a', text: 'Contact: jean@acme.fr' }];
  const { results } = await anonymizeUnits(units, { disabledTypes: new Set(['EMAIL']) });
  assert.equal(results[0].maskedText, 'Contact: jean@acme.fr');
});

test('keepValues : une valeur épargnée reste en clair, les autres restent masquées', async () => {
  const units = [{ id: 'a', text: 'De jean@acme.fr à paul@acme.fr' }];
  const { results } = await anonymizeUnits(units, { keepValues: ['jean@acme.fr'] });
  assert.equal(results[0].maskedText.includes('jean@acme.fr'), true, 'valeur épargnée disparue');
  assert.equal(results[0].maskedText.includes('paul@acme.fr'), false, 'fuite de la non-épargnée');
});

test('un masque forcé reste intouchable même si son "type" serait filtré', async () => {
  // forcedMasks produit des entités PERSONNALISE/manuel : filterByRules ne
  // doit jamais les retirer (l'utilisateur a le dernier mot).
  const units = [{ id: 'a', text: 'Nom de code: Hermes' }];
  const { results } = await anonymizeUnits(units, {
    forceTerms: ['Hermes'],
    disabledTypes: new Set(['PERSONNALISE'])
  });
  assert.equal(results[0].maskedText.includes('Hermes'), false);
});

// --- Injection du moteur contextuel (GLiNER par défaut, BERT en repli).
// Le mode Fichier doit pouvoir tourner avec l'un OU l'autre sans que la couche
// fichiers connaisse le moteur : elle reçoit la fonction de détection.
test('nerDetect injecté : le mode fichier utilise le moteur fourni', async () => {
  const appels = [];
  const faux = async (text, pipeline, opts) => {
    appels.push({ text, disabledTypes: opts?.disabledTypes });
    return text.includes('Krendalyx')
      ? [{ type: 'ORG', value: 'Krendalyx', start: text.indexOf('Krendalyx'),
           end: text.indexOf('Krendalyx') + 9, source: 'ner', score: 0.9, validated: 'n/a' }]
      : [];
  };
  const { results } = await anonymizeUnits(
    [{ id: 'a', text: 'Stage chez Krendalyx' }, { id: 'b', text: 'Rien ici' }],
    { nerPipeline: () => [], nerDetect: faux, disabledTypes: new Set(['SANTE']) }
  );
  assert.equal(results.find(r => r.id === 'a').maskedText, 'Stage chez [ENTREPRISE_1]');
  assert.equal(appels.length, 2, 'une détection par unité');
  // disabledTypes doit atteindre le moteur : GLiNER s'en sert pour sauter des passes.
  assert.ok(appels[0].disabledTypes.has('SANTE'));
});

test('sans nerDetect, le moteur BERT historique reste utilisé (non-régression)', async () => {
  // Pipeline BERT simulé : renvoie des TOKENS, pas des spans.
  const pipeBert = async chunk => chunk.includes('Dupont')
    ? [{ entity: 'B-PER', word: 'Jean', score: 0.99 }, { entity: 'I-PER', word: 'Dupont', score: 0.98 }]
    : [];
  const { results } = await anonymizeUnits(
    [{ id: 'a', text: 'Contact : Jean Dupont' }],
    { nerPipeline: pipeBert }
  );
  assert.equal(results[0].maskedText, 'Contact : [PERSONNE_1]');
});
