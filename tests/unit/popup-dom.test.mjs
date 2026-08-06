// Le SEUL test qui touche src/popup/main.js — et il ne l'exécute pas.
//
// main.js dépend de `chrome.*` : il n'est pas testable en Node, et c'est
// précisément là qu'un plantage a déjà cassé tout le mode PDF « Préserver »
// avec 230 tests au vert (voir docs/verification-chrome.md). On ne peut pas
// tout couvrir, mais UNE classe de bug est vérifiable sans navigateur : un
// `$('idQuiNExistePas')` renvoie null, et le premier accès à `.hidden` ou
// `.addEventListener` fait planter la popup — en Chrome uniquement.
//
// C'est arrivé à chaque ajout d'élément (le bouton Annuler en est un). Ce test
// coûte quelques millisecondes et ferme la porte.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const js = readFileSync(join(racine, 'src/popup/main.js'), 'utf8');
const html = readFileSync(join(racine, 'extension/popup/popup.html'), 'utf8');

const idsDuHtml = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
// `$('...')` est le raccourci de getElementById utilisé partout dans main.js.
const idsUtilises = [...new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]))];

test('tout id référencé par la popup existe dans popup.html', () => {
  const manquants = idsUtilises.filter(id => !idsDuHtml.has(id));
  assert.deepEqual(manquants, [],
    `ids introuvables dans popup.html : ${manquants.join(', ')} — la popup planterait en Chrome`);
});

test('le test lui-même voit bien quelque chose (garde anti-faux-vert)', () => {
  // Si le motif d'extraction cassait, la liste deviendrait vide et le test
  // ci-dessus passerait toujours — un vert qui ne vérifie rien est pire que
  // pas de test du tout.
  assert.ok(idsUtilises.length > 40, `trop peu d'ids extraits (${idsUtilises.length})`);
  assert.ok(idsUtilises.includes('fileCancelBtn'), 'le bouton Annuler doit être vu');
});
