// Filtre de vocabulaire (P14) : un nom propre n'est pas fait de mots du
// dictionnaire. Le signal qui manque au modèle contextuel, mesuré sur un vrai
// CV où dix des vingt valeurs masquées étaient du vocabulaire ordinaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estMotCourant, estVocabulaireCourant } from '../../src/engine/vocabulaire.js';
import { detectGliner } from '../../src/engine/gliner.js';

test('mots courants reconnus, noms propres non', () => {
  for (const m of ['terrain', 'données', 'allemand', 'mars', 'développement']) {
    assert.ok(estMotCourant(m), `« ${m} » devrait être courant`);
  }
  for (const m of ['Kapgnep', 'Twini', 'Semantikmatch', 'UNODC', 'Sorbonne']) {
    assert.ok(!estMotCourant(m), `« ${m} » ne devrait PAS être courant`);
  }
});

test('les suffixes dérivationnels complètent un lexique multilingue mince', () => {
  // Absents du vocabulaire mBERT (104 langues, français peu couvert), mais
  // reconnaissables à leur morphologie.
  for (const m of ['conteneurisée', 'industrialisation', 'modélisation']) {
    assert.ok(estMotCourant(m), `« ${m} » devrait être reconnu par son suffixe`);
  }
});

// LE PIÈGE QUI A ÉTÉ MESURÉ, et qui doit rester fermé. Cinq suffixes ont été
// retirés parce qu'ils collident avec des NOMS DE LIEUX. Le banc l'a signalé
// tout de suite : avec « -elle », « Sarcelles » cessait d'être masqué.
test('les noms de lieux ne passent JAMAIS pour du vocabulaire', () => {
  for (const lieu of ['Sarcelles', 'France', 'Provence', 'Belgique',
                      'Martinique', 'Nazaire', 'Sorbonne', 'Montluçon']) {
    assert.ok(!estVocabulaireCourant(lieu),
      `« ${lieu} » serait laissé en clair — suffixe trop gourmand ?`);
  }
});

test('un seul mot inconnu suffit à rendre le candidat suspect', () => {
  // Le doute profite au masquage : « Startup Twini Janv. » contient un mot
  // courant, mais « Twini » n'en est pas un.
  assert.ok(!estVocabulaireCourant('Startup Twini Janv.'));
  assert.ok(!estVocabulaireCourant('Korrigane Labs'));
});

test('les mots-outils ne font pas échouer le test', () => {
  // « Canal acoustique DE données » ne doit pas être sauvé par son « de ».
  assert.ok(estVocabulaireCourant('gestion de projet'));
});

test('faux positifs mesurés sur un vrai CV - reconnus comme vocabulaire', () => {
  for (const v of ['Anglais', 'Allemand', 'Mars 2026', 'Développement & Web',
                   'Développeur Data']) {
    assert.ok(estVocabulaireCourant(v), `« ${v} » aurait dû être écarté`);
  }
});

// --- Câblage dans le moteur ------------------------------------------------

const fakePipe = (reponses) => async (text, labels) => {
  const spans = [];
  for (const [aiguille, liste] of Object.entries(reponses)) {
    const i = text.indexOf(aiguille);
    if (i === -1) continue;
    for (const s of liste) {
      if (!labels.includes(s.label)) continue;
      spans.push({ ...s, start: i, end: i + aiguille.length, spanText: aiguille });
    }
  }
  return spans;
};

test('une ENTREPRISE faite de mots courants est écartée', async () => {
  const pipe = fakePipe({ 'Développement Web': [{ label: 'company', score: 0.9 }] });
  assert.equal((await detectGliner('Pôle Développement Web interne', pipe)).length, 0);
});

test('une PERSONNE faite de mots courants est CONSERVÉE', async () => {
  // La limite la plus importante du filtre : beaucoup de patronymes français
  // sont des mots courants (Blanc, Petit, Roux), et notre propre vivier de
  // pseudonymes en est plein. L'appliquer aux PER produirait des FUITES.
  const pipe = fakePipe({ 'Pierre Blanc': [{ label: 'person', score: 0.9 }] });
  const [e] = await detectGliner('Signé Pierre Blanc, le gérant.', pipe);
  assert.ok(e, 'un nom de personne a été écarté par le filtre de vocabulaire');
  assert.equal(e.type, 'PER');
});

test('une entreprise au nom PROPRE reste détectée', async () => {
  const pipe = fakePipe({ Semantikmatch: [{ label: 'company', score: 0.9 }] });
  const [e] = await detectGliner('Stage chez Semantikmatch en 2026.', pipe);
  assert.equal(e?.type, 'ORG');
});

// LA TROISIÈME FOIS QUE CE PIÈGE SE REFERME, et la raison pour laquelle il a
// survécu si longtemps : rien ne le vérifiait. « Villetaneuse » apparaît deux
// fois dans certificat-fr.txt et un commentaire de la vérité terrain affirmait
// que la ville est masquée - sans aucune assertion pour l'exiger. Le suffixe
// `-euse` la faisait passer pour du vocabulaire, donc P14 la laissait en clair.
//
// Les suffixes dérivationnels du français et les toponymes français PARTAGENT
// leurs terminaisons. Chaque ajout à cette liste doit venir ici avec sa ville.
test('les lieux en -euse, -elle, -ique ne passent pas pour du vocabulaire', () => {
  for (const lieu of ['Villetaneuse', 'Bagneuse', 'Sarcelles', 'Belgique',
                      'Provence', 'Martinique']) {
    assert.ok(!estVocabulaireCourant(lieu),
      `« ${lieu} » serait laissé en clair — un suffixe le prend pour un nom commun`);
  }
});
