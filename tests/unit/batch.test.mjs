// Le regroupement en lots est sur le CHEMIN D'UNE FUITE : si les résultats
// d'un lot sont redistribués de travers, les entités d'un texte atterrissent
// sur un autre - masquage faux d'un côté, donnée en clair de l'autre. D'où une
// couverture au niveau des validateurs, pas au niveau « UI ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBatchedPipeline, decouperEnLots, serialiser } from '../../src/engine/batch.js';

// --- Non-concurrence : ORT n'exécute QU'UNE inférence à la fois. Son
// fournisseur WebGPU pose un marqueur global et lève « Session already
// started » si un second `run` démarre pendant le premier. Vécu en vrai
// Chrome : le traitement échouait au bout de deux secondes, juste après
// l'ajout du regroupement en lots. Ces tests figent les deux garde-fous.

test('serialiser : deux tâches ne se CHEVAUCHENT jamais', async () => {
  let enVol = 0;
  let maxEnVol = 0;
  const enFile = serialiser();
  const tache = () => enFile(async () => {
    maxEnVol = Math.max(maxEnVol, ++enVol);
    await new Promise(r => setTimeout(r, 5));
    enVol--;
  });
  await Promise.all([tache(), tache(), tache(), tache()]);
  assert.equal(maxEnVol, 1, 'une seule inférence à la fois, sinon ORT lève');
});

test('serialiser : une tâche en ÉCHEC ne bloque pas la file', async () => {
  const enFile = serialiser();
  const echec = enFile(async () => { throw new Error('boom'); });
  await assert.rejects(echec);
  assert.equal(await enFile(async () => 'ok'), 'ok',
    'sinon une seule erreur figerait toute la détection restante');
});

test('serialiser : l\'ordre de soumission est respecté', async () => {
  const enFile = serialiser();
  const vus = [];
  await Promise.all([1, 2, 3].map(n => enFile(async () => {
    await new Promise(r => setTimeout(r, (4 - n) * 3));
    vus.push(n);
  })));
  assert.deepEqual(vus, [1, 2, 3]);
});

test('le batcher ne lance JAMAIS deux lots en parallèle', async () => {
  // REPRODUCTION EXACTE du bug. Il ne suffit pas d'envoyer beaucoup d'appels
  // d'un coup : ceux-là partent dans un seul vidage, qui enchaîne ses lots
  // proprement même avec l'ancien code. Le défaut n'apparaît que quand des
  // appels naissent PENDANT le vidage - c'est le cas réel, chaque unité
  // relançant une passe en réagissant à la résolution de la précédente.
  //
  // Avec l'ancien code (`planifie = false` dès l'entrée de `vider`), ces
  // retardataires programmaient un SECOND vidage qui postait son lot avant la
  // réponse du premier → deux inférences en vol → « Session already started ».
  let enVol = 0;
  let maxEnVol = 0;
  const pipe = createBatchedPipeline(async textes => {
    maxEnVol = Math.max(maxEnVol, ++enVol);
    await new Promise(r => setTimeout(r, 10));
    enVol--;
    return textes.map(() => []);
  }, { maxLot: 2 });

  const enCours = [pipe('a', ['person']), pipe('b', ['person'])];
  // Le premier lot est parti et attend : on injecte pendant son attente.
  await new Promise(r => setTimeout(r, 5));
  enCours.push(pipe('c', ['person']), pipe('d', ['person']));
  await new Promise(r => setTimeout(r, 5));
  enCours.push(pipe('e', ['person']));

  await Promise.all(enCours);
  assert.equal(maxEnVol, 1, 'deux lots simultanés = « Session already started » en Chrome');
});

test('les appels arrivés PENDANT un vidage sont quand même traités', async () => {
  // Le corollaire du verrou : si on refuse de programmer un second vidage, la
  // boucle doit reprendre les retardataires - sinon leur promesse ne se résout
  // jamais et la détection se fige.
  const pipe = createBatchedPipeline(
    async textes => { await new Promise(r => setTimeout(r, 5)); return textes.map(t => [t]); },
    { maxLot: 2 }
  );
  const premiers = [pipe('a', ['person']), pipe('b', ['person'])];
  // Arrive alors que le premier lot est déjà parti.
  await new Promise(r => setTimeout(r, 1));
  const retardataire = pipe('c', ['person']);
  const res = await Promise.all([...premiers, retardataire]);
  assert.deepEqual(res, [['a'], ['b'], ['c']]);
});

const items = (...longueurs) => longueurs.map((n, i) => ({ text: 'x'.repeat(n), i }));

test('decouperEnLots : respecte le nombre maximum par lot', () => {
  const lots = decouperEnLots(items(10, 10, 10, 10, 10), { maxLot: 2, budget: 1e6 });
  assert.deepEqual(lots.map(l => l.length), [2, 2, 1]);
});

test('decouperEnLots : borne le coût REMBOURRÉ, pas le nombre d\'éléments', () => {
  // 4 textes de 100 : à 4 par lot le coût rembourré serait 400, au-dessus du
  // budget 250. On doit donc couper avant.
  const lots = decouperEnLots(items(100, 100, 100, 100), { maxLot: 16, budget: 250 });
  for (const lot of lots) {
    const plusLong = Math.max(...lot.map(i => i.text.length));
    assert.ok(lot.length * plusLong <= 250 || lot.length === 1,
      'un lot ne doit pas dépasser le budget une fois rembourré');
  }
});

test('decouperEnLots : un texte plus long que le budget part quand même, seul', () => {
  const lots = decouperEnLots(items(5000), { maxLot: 16, budget: 100 });
  assert.equal(lots.length, 1);
  assert.equal(lots[0].length, 1, 'sinon ce texte ne serait jamais soumis — fuite silencieuse');
});

test('decouperEnLots : regroupe les longueurs VOISINES (limite le rembourrage)', () => {
  const lots = decouperEnLots(items(1000, 10, 1000, 10), { maxLot: 2, budget: 1e6 });
  // Trié par longueur : les deux courts ensemble, les deux longs ensemble.
  const tailles = lots.map(l => l.map(i => i.text.length).sort((a, b) => a - b));
  assert.deepEqual(tailles, [[10, 10], [1000, 1000]]);
});

test('chaque appel reçoit LE résultat de SON texte, pas celui du voisin', async () => {
  // Le runBatch renvoie une marque dérivée du texte : tout croisement se voit.
  const pipe = createBatchedPipeline(
    async textes => textes.map(t => [{ spanText: t, score: 1 }]),
    { planifier: f => setTimeout(f, 0) }
  );
  const textes = ['alpha', 'bravo', 'charlie', 'delta', 'echo'];
  const res = await Promise.all(textes.map(t => pipe(t, ['person'])));
  assert.deepEqual(res.map(r => r[0].spanText), textes);
});

test('les appels concurrents partent en UN seul lot', async () => {
  let appels = 0;
  const pipe = createBatchedPipeline(async textes => {
    appels++;
    return textes.map(() => []);
  });
  await Promise.all(['a', 'b', 'c', 'd'].map(t => pipe(t, ['person'])));
  assert.equal(appels, 1, '4 appels concurrents doivent coûter UNE inférence');
});

test('des jeux de labels DIFFÉRENTS ne sont jamais mélangés dans un lot', async () => {
  // Un lot ne porte qu'un jeu d'entités : c'est une entrée du modèle. Les
  // mélanger ferait chercher les mauvais labels sur la moitié des textes.
  const vus = [];
  const pipe = createBatchedPipeline(async (textes, labels) => {
    vus.push({ labels, n: textes.length });
    return textes.map(() => []);
  });
  await Promise.all([
    pipe('a', ['person']), pipe('b', ['person']),
    pipe('c', ['date of birth'])
  ]);
  assert.equal(vus.length, 2, 'deux jeux de labels = deux inférences');
  const parLabel = Object.fromEntries(vus.map(v => [v.labels.join(), v.n]));
  assert.deepEqual(parLabel, { person: 2, 'date of birth': 1 });
});

test('un lot en échec rejette TOUS ses appels (jamais de promesse en suspens)', async () => {
  const pipe = createBatchedPipeline(async () => { throw new Error('boom'); });
  const resultats = await Promise.allSettled([
    pipe('a', ['person']), pipe('b', ['person'])
  ]);
  assert.deepEqual(resultats.map(r => r.status), ['rejected', 'rejected'],
    'une promesse jamais résolue figerait la détection sans message');
});

test('un résultat manquant devient une liste vide, jamais undefined', async () => {
  // L'appelant boucle sur le retour sans garde : un `undefined` planterait la
  // détection au milieu d'un document.
  const pipe = createBatchedPipeline(async () => []);
  assert.deepEqual(await pipe('a', ['person']), []);
});
