// L'annulation touche au chemin qui décide si un fichier sort ou non : un
// traitement qu'on croit arrêté mais qui continue produit un fichier « surprise »
// (vécu), et une annulation prise pour un échec affiche un faux bug.
import test from 'node:test';
import assert from 'node:assert/strict';
import { OperationAnnulee, estAnnulation, verifierAnnulation } from '../../src/engine/annulation.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

test('verifierAnnulation ne fait rien sans signal ni sur un signal actif', () => {
  assert.doesNotThrow(() => verifierAnnulation(undefined));
  assert.doesNotThrow(() => verifierAnnulation(new AbortController().signal));
});

test('verifierAnnulation lève dès que le signal est déclenché', () => {
  const c = new AbortController();
  c.abort(new OperationAnnulee());
  assert.throws(() => verifierAnnulation(c.signal), e => estAnnulation(e));
});

test('estAnnulation reconnaît AUSSI l\'AbortError par défaut du navigateur', () => {
  // `abort()` sans raison produit un DOMException{name:'AbortError'} : sans ce
  // cas, une annulation venue d'ailleurs s'afficherait en « Traitement échoué ».
  const c = new AbortController();
  c.abort();
  assert.ok(estAnnulation(c.signal.reason));
});

test('estAnnulation ne confond PAS une vraie erreur avec une annulation', () => {
  // L'inverse serait pire que tout : un échec réel avalé en silence, et
  // l'utilisateur croit son fichier anonymisé.
  assert.equal(estAnnulation(new Error('adaptateur cassé')), false);
  assert.equal(estAnnulation(new TypeError('boom')), false);
  assert.equal(estAnnulation(null), false);
});

test('anonymizeUnits s\'ARRÊTE réellement quand le signal tombe', async () => {
  // Le vrai défaut n'était pas « le résultat est ignoré » mais « le travail
  // continue » : il occupait le modèle et le run suivant attendait derrière.
  const c = new AbortController();
  let inferences = 0;
  const units = Array.from({ length: 200 }, (_, i) => ({ id: `u${i}`, text: `Rose Fontaine ${i}` }));

  const pipeline = async () => {
    inferences++;
    if (inferences === 3) c.abort(new OperationAnnulee());
    return [];
  };

  await assert.rejects(
    anonymizeUnits(units, { nerPipeline: pipeline, signal: c.signal }),
    e => estAnnulation(e)
  );
  assert.ok(inferences < units.length,
    'les inférences doivent cesser, pas seulement voir leur résultat jeté');
});

test('anonymizeUnits déjà annulé au départ ne lance AUCUNE inférence', async () => {
  const c = new AbortController();
  c.abort(new OperationAnnulee());
  let inferences = 0;
  await assert.rejects(
    anonymizeUnits([{ id: 'u1', text: 'Rose Fontaine' }], {
      nerPipeline: async () => { inferences++; return []; },
      signal: c.signal
    }),
    e => estAnnulation(e)
  );
  assert.equal(inferences, 0);
});

test('sans signal, le comportement est INCHANGÉ', async () => {
  // Garde-fou de non-régression : tout le reste du projet appelle
  // anonymizeUnits sans signal.
  const { results } = await anonymizeUnits([{ id: 'u1', text: 'Contact : a@b.example' }], {});
  assert.equal(results.length, 1);
  assert.match(results[0].maskedText, /\[EMAIL_1\]/);
});
