import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinRuns, distributeEntitiesOverRuns } from '../../src/files/text-units.js';

test('joinRuns reconstitue le texte et les bornes de chaque run', () => {
  const { text, ranges } = joinRuns([{ id: 'a', text: 'Hello ' }, { id: 'b', text: 'World' }]);
  assert.equal(text, 'Hello World');
  assert.deepEqual(ranges, [
    { id: 'a', start: 0, end: 6 },
    { id: 'b', start: 6, end: 11 }
  ]);
});

test('entité entièrement dans un seul run', () => {
  const runs = [{ id: 'a', text: 'Contact: Jean Dupont ici' }];
  const out = distributeEntitiesOverRuns(runs, [{ start: 9, end: 20, placeholder: '[PERSONNE_1]' }]);
  assert.equal(out.map(r => r.text).join(''), 'Contact: [PERSONNE_1] ici');
});

test('entité à cheval sur 2 runs : placeholder une seule fois, sur le run de départ', () => {
  const runs = [{ id: 'a', text: 'Jean ' }, { id: 'b', text: 'Dupont' }];
  const out = distributeEntitiesOverRuns(runs, [{ start: 0, end: 11, placeholder: '[PERSONNE_1]' }]);
  assert.deepEqual(out, [{ id: 'a', text: '[PERSONNE_1]' }, { id: 'b', text: '' }]);
  // zéro fuite : aucun fragment de "Jean" ou "Dupont" ne doit survivre nulle part
  const joined = out.map(r => r.text).join('');
  assert.equal(joined.includes('Jean'), false);
  assert.equal(joined.includes('Dupont'), false);
});

test('entité à cheval sur 3+ runs', () => {
  const runs = [{ id: 'a', text: 'Jo' }, { id: 'b', text: 'sé' }, { id: 'c', text: 'phine' }];
  const out = distributeEntitiesOverRuns(runs, [{ start: 0, end: 9, placeholder: '[X]' }]);
  assert.deepEqual(out, [{ id: 'a', text: '[X]' }, { id: 'b', text: '' }, { id: 'c', text: '' }]);
});

test('entité exactement alignée sur une frontière de run', () => {
  const runs = [{ id: 'a', text: 'Hello ' }, { id: 'b', text: 'World' }];
  const out = distributeEntitiesOverRuns(runs, [{ start: 6, end: 11, placeholder: '[Y]' }]);
  assert.deepEqual(out, [{ id: 'a', text: 'Hello ' }, { id: 'b', text: '[Y]' }]);
});

test('deux entités adjacentes dans le même run', () => {
  const runs = [{ id: 'a', text: 'Jean Pierre' }];
  const out = distributeEntitiesOverRuns(runs, [
    { start: 0, end: 4, placeholder: '[P1]' },
    { start: 5, end: 11, placeholder: '[P2]' }
  ]);
  assert.equal(out.map(r => r.text).join(''), '[P1] [P2]');
});

test('run sans aucune entité reste inchangé', () => {
  const runs = [{ id: 'a', text: 'rien à voir ici' }];
  const out = distributeEntitiesOverRuns(runs, []);
  assert.deepEqual(out, [{ id: 'a', text: 'rien à voir ici' }]);
});

test('run vide ne casse pas la boucle', () => {
  const runs = [{ id: 'a', text: '' }, { id: 'b', text: 'Jean' }];
  const out = distributeEntitiesOverRuns(runs, [{ start: 0, end: 4, placeholder: '[P1]' }]);
  assert.deepEqual(out, [{ id: 'a', text: '' }, { id: 'b', text: '[P1]' }]);
});
