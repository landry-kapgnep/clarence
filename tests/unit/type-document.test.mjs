// Reconnaissance du TYPE de document, pour proposer le bon profil.
//
// Mesuré sur les VRAIS documents du banc, dont on connaît le type - pas sur des
// exemples fabriqués pour l'occasion, qui ne prouveraient que la capacité du
// module à reconnaître ce qu'on vient d'écrire pour lui.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyserTypeDocument, ECART_MINIMAL } from '../../src/engine/type-document.js';

const CORPUS = join(dirname(fileURLToPath(import.meta.url)), '..', 'bench', 'corpus');
const lire = f => readFileSync(join(CORPUS, f), 'utf8');

test('reconnaît le type des documents réels du banc', () => {
  const attendu = {
    'certificat-fr.txt': 'administratif',
    'formulaire-fr.txt': 'administratif',
    'dossier-rh.txt': 'administratif',
    'rapport-fr.txt': 'scolaire',
    'email-pro-en.txt': 'email'
  };
  for (const [fichier, type] of Object.entries(attendu)) {
    const r = analyserTypeDocument(lire(fichier));
    assert.equal(r.type, type,
      `${fichier} → « ${r.type} » au lieu de « ${type} » (classement ${JSON.stringify(r.classement)})`);
  }
});

// ⚠️ LE COMPORTEMENT LE PLUS IMPORTANT DU MODULE. Une suggestion fausse envoie
// l'utilisateur vers le mauvais vocabulaire, donc vers du sur-masquage ou une
// fuite. « Je ne sais pas » est toujours préférable - l'utilisateur choisit
// alors lui-même, ce qu'il sait très bien faire, les profils étant peu nombreux.
test('rend null plutôt que de deviner quand rien ne se détache', () => {
  for (const texte of [
    'Bonjour,\nMerci de ton message.\nÀ bientôt.',
    'ligne une\nligne deux\nligne trois\nligne quatre',
    'Le chat dort.\nIl fait beau.\nRien de particulier ici.'
  ]) {
    assert.equal(analyserTypeDocument(texte).type, null, `« ${texte.slice(0, 24)}… »`);
  }
});

test('un document trop court ne produit aucune suggestion', () => {
  assert.equal(analyserTypeDocument('').type, null);
  assert.equal(analyserTypeDocument('Une ligne').type, null);
  assert.equal(analyserTypeDocument(null).type, null);
});

// Le seuil porte sur l'ÉCART, pas sur le score absolu : un rapport de stage
// contient des mots de CV (« stage », « tuteur ») ET des mots de rapport. Ce
// qui autorise à proposer, c'est qu'un type se DÉTACHE.
test('le verdict exige un écart, pas seulement un gros score', () => {
  const r = analyserTypeDocument(lire('rapport-fr.txt'));
  assert.ok(r.ecart >= ECART_MINIMAL);
  assert.ok(r.classement[0][1] > r.classement[1][1]);
});

test('l’IBAN décide du type bancaire, et il est déterministe', () => {
  // Le seul signal vraiment sûr pour ce type : un IBAN est validé mod-97, pas
  // deviné. On ne s'en remet donc pas à des mots comme « solde » ou « crédit »,
  // qui se promènent dans n'importe quel document comptable.
  const texte = 'Relevé\nCompte courant\nOpérations du mois\nSolde créditeur\nDivers';
  const sans = analyserTypeDocument(texte);
  const avec = analyserTypeDocument(texte, {
    entites: [{ type: 'IBAN' }, { type: 'IBAN' }, { type: 'BIC' }]
  });
  assert.equal(avec.type, 'bancaire');
  assert.ok(avec.score > sans.score);
});

test('l’explication nomme les indices qui ont décidé', () => {
  // Une suggestion qu'on ne peut pas justifier n'a pas sa place dans un produit
  // bâti sur l'anti-fausse-confiance : l'utilisateur doit pouvoir voir pourquoi.
  const r = analyserTypeDocument(lire('rapport-fr.txt'));
  assert.ok(r.indices.length > 0);
  assert.ok(r.indices.every(i => i.type === r.type));
  assert.ok(r.indices.some(i => /sommaire/i.test(i.raison)));
});

test('les en-têtes d’e-mail ne comptent qu’en tête du document', () => {
  // « Objet : » au milieu d'un rapport est une phrase, pas un en-tête.
  const faux = 'RAPPORT\n' + 'blabla\n'.repeat(10) + 'Objet : divers\nDe : moi\n';
  assert.notEqual(analyserTypeDocument(faux).type, 'email');
});

// --- Cinq langues ---------------------------------------------------------
//
// ⚠️ HONNÊTETÉ SUR CE QUE CES CAS PROUVENT. Pour le français et l'anglais, les
// tests plus haut portent sur de VRAIS documents du banc. Pour l'espagnol,
// l'allemand et le portugais, on n'en a pas - ce sont des échantillons
// construits. Ils valent comme test de FUMÉE (les marqueurs sont bien câblés,
// la structure porte le verdict) et surtout comme non-régression sur les
// collisions entre langues ; ils ne mesurent pas une exactitude sur le terrain.
// Le jour où de vrais documents arrivent, ils remplacent ceux-ci.
test('reconnaît les types en espagnol, allemand et portugais', () => {
  const cas = [
    ['cv', 'CURRÍCULUM VÍTAE\nExperiencia profesional\n2019 - 2023 Analista de datos\n'
         + 'Competencias: Python, SQL\nIdiomas: inglés, francés\nFormación universitaria'],
    ['cv', 'LEBENSLAUF\nBerufserfahrung\n2019 - 2023 Datenanalyst\nKenntnisse: Python\n'
         + 'Sprachen: Englisch\nAusbildung: Universität'],
    ['cv', 'CURRÍCULO\nExperiência profissional\n2019 - 2023 Analista de dados\n'
         + 'Competências: Python\nIdiomas: inglês\nFormação superior'],
    ['scolaire', 'Inhaltsverzeichnis\nEinleitung......3\nKapitel 1......7\nFazit......42\n'
               + 'Literaturverzeichnis......45\nDanksagung an alle Beteiligten.'],
    ['administratif', 'CERTIFICADO\nEl ministerio certifica que\nNombre        MARIA LOPEZ\n'
                    + 'Expediente    2024-118\nHace constar lo siguiente']
  ];
  for (const [attendu, texte] of cas) {
    const r = analyserTypeDocument(texte);
    assert.equal(r.type, attendu,
      `« ${texte.slice(0, 22)}… » → ${r.type} (${JSON.stringify(r.classement)})`);
  }
});

// ⚠️ LE DÉFAUT QUE CE TEST FERME, et qui empire à chaque langue ajoutée. La
// première version comparait par SOUS-CHAÎNE : le marqueur bancaire « rib »
// matchait « contribuer », « distribution », « attribué » - 0,8 point de
// « bancaire » sur une note de service qui n'a rien de bancaire. Le verdict
// n'était sauvé que par l'écart minimal, c'est-à-dire par chance.
test('les marqueurs se comparent MOT À MOT, pas par sous-chaîne', () => {
  const r = analyserTypeDocument(
    'Note de service\nIl faut contribuer à la distribution des tâches.\n'
    + 'Chacun attribue son rôle.\nRien de particulier.');
  const bancaire = r.classement.find(([t]) => t === 'bancaire')[1];
  assert.equal(bancaire, 0, '« rib » a matché à l’intérieur d’un autre mot');
});

test('ajouter des langues ne dérègle pas les documents français', () => {
  // Contrôle de non-régression du câblage multilingue : les marqueurs communs à
  // plusieurs langues (« conclusion », « índice », « certificado ») sont
  // dédoublonnés, sinon ils compteraient double et fausseraient le classement.
  assert.equal(analyserTypeDocument(lire('dossier-rh.txt')).type, 'administratif');
  assert.equal(analyserTypeDocument(lire('rapport-fr.txt')).type, 'scolaire');
});
