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
  // Pipeline BERT simulé : renvoie des tokens, pas des spans.
  const pipeBert = async chunk => chunk.includes('Dupont')
    ? [{ entity: 'B-PER', word: 'Jean', score: 0.99 }, { entity: 'I-PER', word: 'Dupont', score: 0.98 }]
    : [];
  const { results } = await anonymizeUnits(
    [{ id: 'a', text: 'Contact : Jean Dupont' }],
    { nerPipeline: pipeBert }
  );
  assert.equal(results[0].maskedText, 'Contact : [PERSONNE_1]');
});

// --- Propagation dans les ENTITÉS, pas seulement dans la chaîne masquée.
// Régression réelle (rapport de stage, 26 pages) : le nom du tuteur était
// détecté dans un paragraphe rédigé mais restait en clair en page de garde,
// où il n'apparaît qu'après un libellé, sans phrase autour. L'aperçu le
// montrait masqué ; le PDF reconstruit, qui repart des entités et non de
// maskedText, le laissait lisible. C'est une fuite, pas une imperfection.
test('une occurrence rattrapée par propagation est présente dans les ENTITÉS', async () => {
  const pipe = async (t) => t.includes('Le tuteur Stéphane Ureña encadre')
    ? [{ entity: 'B-PER', word: 'Stéphane', score: 0.99 },
       { entity: 'I-PER', word: 'Ureña', score: 0.98 }]
    : [];
  const { results } = await anonymizeUnits([
    { id: 'garde', text: 'Tuteur entreprise : Stéphane Ureña' },
    { id: 'corps', text: 'Le tuteur Stéphane Ureña encadre le stage.' }
  ], { nerPipeline: pipe });

  const garde = results.find(r => r.id === 'garde');
  assert.equal(garde.maskedText, 'Tuteur entreprise : [PERSONNE_1]');
  // Le point qui manquait : l'entité doit exister pour que PDF/DOCX la réécrivent.
  assert.equal(garde.entities.length, 1, 'occurrence propagée absente des entités');
  assert.equal(garde.text.slice(garde.entities[0].start, garde.entities[0].end), 'Stéphane Ureña');
  assert.equal(garde.entities[0].placeholder, '[PERSONNE_1]');
});

test('la propagation ignore la casse (même entité écrite différemment)', async () => {
  // Cas réel : « meteojob » détecté dans une URL était masqué, « Meteojob »
  // en début de ligne restait en clair - la même valeur, dans le même document.
  const pipe = async (t) => t.includes('www.meteojob.com')
    ? [{ entity: 'B-ORG', word: 'meteojob', score: 0.95 }]
    : [];
  const { results } = await anonymizeUnits([
    { id: 'url', text: 'source https://www.meteojob.com/blog' },
    { id: 'titre', text: 'Meteojob reste une source publique.' }
  ], { nerPipeline: pipe });

  const titre = results.find(r => r.id === 'titre');
  assert.ok(titre.maskedText.startsWith('[ENTREPRISE_1]'), 'casse différente non propagée');
  assert.equal(titre.entities.length, 1);
});

test('la propagation ne double JAMAIS une entité déjà détectée', async () => {
  const pipe = async (t) => t.includes('Rose Fontaine')
    ? [{ entity: 'B-PER', word: 'Rose', score: 0.99 },
       { entity: 'I-PER', word: 'Fontaine', score: 0.98 }]
    : [];
  const { results } = await anonymizeUnits(
    [{ id: 'a', text: 'Rose Fontaine signe.' }], { nerPipeline: pipe });
  assert.equal(results[0].entities.length, 1, 'entité dupliquée par la propagation');
});

// --- L'arbitre reçoit le DOCUMENT, pas seulement les entités --------------
//
// Ajouté quand le filtre de précision s'est branché ici. Deux de ses
// caractéristiques (occurrences, « le mot apparaît-il ailleurs en minuscules
// dans ce document ? ») n'existent qu'à l'échelle du document : si
// l'orchestrateur oubliait ce second argument, le filtre continuerait de
// tourner mais sur un contexte vide - il déciderait donc sur des chiffres
// faux, sans la moindre erreur pour le signaler. Exactement le genre de
// dégradation silencieuse que ce projet paie cher.
test('l’arbitre reçoit le texte COMBINÉ de toutes les unités', async () => {
  const units = [
    { id: 'a', text: 'Première unité avec jean@acme.fr' },
    { id: 'b', text: 'Seconde unité, du texte ordinaire' }
  ];
  let vu = null;
  await anonymizeUnits(units, {
    nerPipeline: {},
    nerDetect: async () => [{ type: 'ORG', value: 'X', start: 0, end: 1, source: 'ner', score: 0.9 }],
    arbitre: (entites, texte) => { vu = texte; return entites; }
  });
  assert.ok(vu, 'l’arbitre n’a pas reçu de texte');
  assert.ok(vu.includes('Première unité'), 'la 1re unité manque au contexte');
  assert.ok(vu.includes('Seconde unité'), 'la 2de unité manque au contexte');
});

test('un arbitre à un seul paramètre continue de fonctionner', async () => {
  // Compatibilité descendante : le banc, les tests d'injection et de
  // régression injectent tous un arbitre qui ignore le second argument.
  const units = [{ id: 'a', text: 'Texte avec jean@acme.fr' }];
  const { results } = await anonymizeUnits(units, {
    nerPipeline: {},
    nerDetect: async () => [{ type: 'ORG', value: 'Acme', start: 0, end: 4, source: 'ner', score: 0.9 }],
    arbitre: (entites) => entites.filter(e => e.type !== 'ORG')
  });
  assert.equal(results[0].maskedText, 'Texte avec [EMAIL_1]');
});
