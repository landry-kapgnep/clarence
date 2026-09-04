// L'indicateur de poids est une PROMESSE IMPLICITE faite à l'utilisateur : s'il
// annonce « Léger » sur un document qui prend une minute, il détruit exactement
// la confiance qu'il devait construire. D'où des tests calés sur les documents
// réels dont on connaît le temps de traitement.
import test from 'node:test';
import assert from 'node:assert/strict';
import { poidsDeTraitement, expliquerPoids, NIVEAUX } from '../../src/popup/poids.js';

test('le mémoire réel (75 pages, ~45 s) tombe en TRÈS LOURD', () => {
  // C'est le document qui a motivé toute la campagne de performance :
  // l'utilisateur doit le voir venir avant de cliquer.
  assert.equal(poidsDeTraitement({ ext: 'pdf', pages: 75 }).cle, 'tresLourd');
});

test('le document piégé (6 pages, quelques secondes) tombe en LÉGER', () => {
  assert.equal(poidsDeTraitement({ ext: 'pdf', pages: 6 }).cle, 'leger');
});

test('une IMAGE est toujours légère, quelle que soit sa taille', () => {
  // Aucune inférence n'est faite sur une image : seules les métadonnées EXIF
  // sont retirées. Annoncer « Très lourd » sur une photo de 12 Mo serait faux.
  const p = poidsDeTraitement({ ext: 'jpg', taille: 12 * 1024 * 1024 });
  assert.equal(p.cle, 'leger');
  assert.match(expliquerPoids(p), /métadonnées/);
});

test('la taille en octets ne prime JAMAIS sur un signal plus fiable', () => {
  // Le piège central : un PDF de 5 Mo plein d'images se traite vite, un PDF de
  // 430 Ko et 75 pages de prose est le plus lourd qu'on ait mesuré.
  const gros = poidsDeTraitement({ ext: 'pdf', taille: 5 * 1024 * 1024, pages: 3 });
  const petit = poidsDeTraitement({ ext: 'pdf', taille: 430 * 1024, pages: 75 });
  assert.equal(gros.cle, 'leger');
  assert.equal(petit.cle, 'tresLourd');
});

test('les quatre niveaux sont atteignables et ordonnés', () => {
  const cles = [6, 20, 50, 200].map(pages => poidsDeTraitement({ ext: 'pdf', pages }).cle);
  assert.deepEqual(cles, ['leger', 'moyen', 'lourd', 'tresLourd']);
});

test('chaque niveau porte un libellé et une classe CSS', () => {
  for (const [cle, n] of Object.entries(NIVEAUX)) {
    assert.ok(n.libelle, `libellé manquant pour ${cle}`);
    assert.match(n.classe, /^poids-/, `classe CSS invalide pour ${cle}`);
  }
});

test('sans aucun signal, on retombe sur la taille sans planter', () => {
  const p = poidsDeTraitement({ ext: 'docx', taille: 500 * 1024 });
  assert.equal(p.cle, 'lourd');
  // L'explication doit dire que c'est approximatif : un classement opaque
  // n'est pas contestable par l'utilisateur.
  assert.match(expliquerPoids(p), /approximatif/);
});

test('un appel sans rien ne lève pas', () => {
  assert.equal(poidsDeTraitement({}).cle, 'leger');
});
