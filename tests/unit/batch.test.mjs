// Le regroupement en lots est sur le CHEMIN D'UNE FUITE : si les résultats
// d'un lot sont redistribués de travers, les entités d'un texte atterrissent
// sur un autre — masquage faux d'un côté, donnée en clair de l'autre. D'où une
// couverture au niveau des validateurs, pas au niveau « UI ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBatchedPipeline, decouperEnLots } from '../../src/engine/batch.js';

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
