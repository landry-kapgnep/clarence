// Moteur de compression : pipeline SIMULÉ, aucun modèle chargé.
// Les trois règles dures sont ici - placeholders intacts, opérateurs logiques
// conservés, et échec d'alignement qui garde au lieu de supprimer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compresser, motsDuTexte, scoresParMot,
  estOperateurLogique, estIntouchable, OPERATEURS_LOGIQUES,
  decouperEnLots, recollerScores, MOTS_PAR_LOT, compresserSegments
} from '../../src/engine/compression.js';

// Pipeline simulé : un token par mot, score fourni par une table (0 par défaut,
// donc « à supprimer » sauf mention contraire).
const fauxPipe = (scores = {}) => async (texte) =>
  texte.split(/\s+/).filter(Boolean).map(m => ({ mot: m, garder: scores[m] ?? 0 }));

test('motsDuTexte : positions exactes, ponctuation attachée au mot', () => {
  const m = motsDuTexte('Bonjour  Marie, ça va.');
  assert.deepEqual(m.map(x => x.texte), ['Bonjour', 'Marie,', 'ça', 'va.']);
  assert.equal(m[1].debut, 9);
  assert.equal(m[1].fin, 15);
});

test('motsDuTexte : texte vide ou tout blanc', () => {
  assert.deepEqual(motsDuTexte(''), []);
  assert.deepEqual(motsDuTexte('   \n\t '), []);
});

// --- PLACEHOLDERS ---------------------------------------------------------
// C'est LE piège du spike : décider token par token puis rejoindre par des
// espaces rendait « [ PERSONNE _ 1 ] ». En décidant au niveau du mot, le
// placeholder est indivisible.

test('un placeholder est UN mot, donc jamais coupé', () => {
  const m = motsDuTexte('Le dossier de [PERSONNE_1] est prêt.');
  assert.ok(m.some(x => x.texte === '[PERSONNE_1]'),
    'le placeholder doit rester un seul mot');
});

test('un placeholder survit même avec un score nul', async () => {
  const r = await compresser('Le dossier de [PERSONNE_1] est prêt', fauxPipe(), { taux: 0 });
  assert.ok(r.texte.includes('[PERSONNE_1]'),
    'même à taux 0, un placeholder ne peut pas être supprimé');
});

test('un placeholder avec ponctuation attachée reste intact', async () => {
  const r = await compresser('Salut [PERSONNE_2], bonjour', fauxPipe(), { taux: 0 });
  assert.ok(r.texte.includes('[PERSONNE_2],'));
});

test('estIntouchable reconnaît tous les types de placeholder', () => {
  for (const p of ['[PERSONNE_1]', '[IBAN_12]', '[DATE_NAISSANCE_3]', '[SIRET_SIREN_1]']) {
    assert.equal(estIntouchable(p), true, p);
  }
  assert.equal(estIntouchable('PERSONNE_1'), false, 'sans crochets, ce n\'est pas un placeholder');
});

// --- OPÉRATEURS LOGIQUES --------------------------------------------------
// Sans eux, « n'est pas allergique » devient « allergique » : le LLM lit
// l'inverse, et l'utilisateur ne peut pas le voir.

test('les négations survivent à un score nul', async () => {
  const r = await compresser(
    "Le patient n' est pas allergique à la pénicilline", fauxPipe(), { taux: 0 });
  for (const mot of ["n'", 'pas']) {
    assert.ok(r.texte.split(/\s+/).includes(mot), `« ${mot} » doit survivre`);
  }
});

test('les connecteurs des quatre langues sont couverts', () => {
  for (const mot of ['ne', 'pas', 'jamais', 'sauf', 'mais', 'sans',
                     'not', 'unless', 'but', 'never',
                     'pero', 'aunque', 'sin',
                     'nicht', 'keine', 'aber', 'ohne']) {
    assert.equal(estOperateurLogique(mot), true, mot);
  }
});

test('la ponctuation attachée n\'empêche pas la reconnaissance', () => {
  assert.equal(estOperateurLogique('pas,'), true);
  assert.equal(estOperateurLogique("n'"), true);
  assert.equal(estOperateurLogique('mais...'), true);
});

test('un mot ordinaire n\'est PAS un opérateur logique', () => {
  for (const mot of ['dossier', 'patient', 'pénicilline', 'entreprise', '']) {
    assert.equal(estOperateurLogique(mot), false, mot);
  }
});

test('la classe reste FERMÉE : pas de mot « important » glissé dedans', () => {
  // Garde-fou contre l'élargissement - la règle du projet n'autorise une liste
  // statique QUE pour une classe fermée (cf. honorifics.js).
  for (const mot of ['important', 'urgent', 'confidentiel', 'attention', 'clause']) {
    assert.equal(OPERATEURS_LOGIQUES.has(mot), false,
      `« ${mot} » n'est pas un opérateur logique : la liste ne doit pas s'ouvrir`);
  }
});

// --- CLASSEMENT ET TAUX ---------------------------------------------------

test('à taux 1, tout est conservé', async () => {
  const t = 'le chat dort sur le tapis rouge';
  const r = await compresser(t, fauxPipe(), { taux: 1 });
  assert.equal(r.texte, t);
  assert.equal(r.motsApres, r.motsAvant);
});

test('les mots les mieux notés sont gardés en priorité', async () => {
  const r = await compresser('alpha beta gamma delta',
    fauxPipe({ alpha: 0.1, beta: 0.9, gamma: 0.8, delta: 0.2 }), { taux: 0.5 });
  const gardes = r.texte.split(/\s+/);
  assert.ok(gardes.includes('beta') && gardes.includes('gamma'));
  assert.ok(!gardes.includes('alpha') && !gardes.includes('delta'));
});

test('l\'ORDRE des mots est préservé, jamais celui du classement', async () => {
  const r = await compresser('alpha beta gamma',
    fauxPipe({ alpha: 0.5, beta: 0.9, gamma: 0.7 }), { taux: 1 });
  assert.equal(r.texte, 'alpha beta gamma');
});

test('les intouchables ne sont pas évincés par le budget', async () => {
  // 6 mots, taux 0,34 → budget très serré, mais 2 intouchables présents.
  const r = await compresser('alpha [EMAIL_1] beta pas gamma delta',
    fauxPipe({ alpha: 0.9, beta: 0.8, gamma: 0.7, delta: 0.6 }), { taux: 0.34 });
  assert.ok(r.texte.includes('[EMAIL_1]'));
  assert.ok(r.texte.split(/\s+/).includes('pas'));
});

test('compte des mots et estimation de tokens cohérents', async () => {
  const r = await compresser('alpha beta gamma delta',
    fauxPipe({ alpha: 0.9, beta: 0.9 }), { taux: 0.5 });
  assert.equal(r.motsAvant, 4);
  assert.equal(r.motsApres, 2);
  assert.ok(r.tokensApres < r.tokensAvant);
});

test('texte vide : aucune erreur', async () => {
  const r = await compresser('', fauxPipe(), { taux: 0.5 });
  assert.equal(r.texte, '');
  assert.equal(r.motsAvant, 0);
});

test('sans pipeline, rien n\'est supprimé (repli sûr)', async () => {
  const t = 'le chat dort sur le tapis';
  const r = await compresser(t, null, { taux: 0.2 });
  assert.equal(r.texte, t, 'sans modèle on ne devine pas : on garde tout');
});

// --- ALIGNEMENT -----------------------------------------------------------

test('scoresParMot regroupe les sous-mots WordPiece par le MAXIMUM', () => {
  const mots = motsDuTexte('acceptée demande');
  const tokens = [
    { mot: 'accept', garder: 0.4 }, { mot: '##ée', garder: 0.9 },
    { mot: 'demande', garder: 0.7 }
  ];
  assert.deepEqual(scoresParMot(mots, tokens), [0.9, 0.7]);
});

test('alignement perdu → le mot est GARDÉ, jamais supprimé', async () => {
  // Le pipeline rend moins de tokens que de mots : les derniers n'ont plus de
  // score. Supprimer par défaut pourrait retourner une phrase ; on garde.
  const pipe = async () => [{ mot: 'alpha', garder: 0.9 }];
  const r = await compresser('alpha beta gamma', pipe, { taux: 0.1 });
  assert.ok(r.texte.includes('beta') && r.texte.includes('gamma'),
    'un mot sans score doit être conservé');
});

// --- ADAPTATION DU MODÈLE -------------------------------------------------
// Les deux pannes évitées ici ne lèvent AUCUNE erreur : elles rendent un texte
// non compressé, en silence. C'est exactement pour ça qu'elles sont testées.

test('decouperEnLots : lots de 120 mots par défaut, dernier partiel', () => {
  const mots = Array.from({ length: 250 }, (_, i) => `m${i}`);
  const lots = decouperEnLots(mots);
  assert.equal(lots.length, 3);
  assert.equal(lots[0].length, 120);
  assert.equal(lots[2].length, 10);
  // Aucun mot perdu ni dupliqué : un lot manquant ferait taire la compression
  // sur toute une portion du document.
  assert.deepEqual(lots.flat(), mots);
});

test('decouperEnLots : liste vide et liste plus courte qu\'un lot', () => {
  assert.deepEqual(decouperEnLots([]), []);
  assert.deepEqual(decouperEnLots(['a', 'b']), [['a', 'b']]);
});

test('recollerScores : [CLS] et [SEP] sont écartés', () => {
  const out = recollerScores(['[CLS]', 'le', 'chat', '[SEP]'],
    [{ index: 1, garder: 0.2 }, { index: 2, garder: 0.9 }]);
  assert.deepEqual(out, [{ mot: 'le', garder: 0.2 }, { mot: 'chat', garder: 0.9 }]);
});

test('recollerScores : un token OMIS par le pipeline reçoit 0, sans décaler', () => {
  // Le cas réel : le pipeline saute l'index 2 (un tiret cadratin). Sans ce
  // recollage, tout ce qui suit se retrouvait décalé d'un cran.
  const out = recollerScores(['[CLS]', 'coût', '—', 'élevé', '[SEP]'],
    [{ index: 1, garder: 0.9 }, { index: 3, garder: 0.8 }]);
  assert.deepEqual(out, [
    { mot: 'coût', garder: 0.9 },
    { mot: '—', garder: 0 },
    { mot: 'élevé', garder: 0.8 }
  ]);
});

test('recollerScores : le flux rendu couvre TOUS les tokens du texte', () => {
  const tokens = ['[CLS]', 'a', 'b', 'c', 'd', '[SEP]'];
  // Le pipeline n'en rend que deux : le flux doit quand même en faire quatre.
  const out = recollerScores(tokens, [{ index: 1, garder: 0.5 }]);
  assert.equal(out.length, 4, 'un flux troué désynchroniserait l\'alignement');
  assert.deepEqual(out.map(o => o.mot), ['a', 'b', 'c', 'd']);
});

// --- SEGMENTS (mise en page préservée) ------------------------------------
// DOCX et PDF « Préserver » ne réécrivent pas un texte : ils redessinent des
// FRAGMENTS à leurs positions. Sans restitution par segment, l'option ne
// pouvait exister que sur les sorties texte - ce qui la vide de son intérêt,
// puisque l'utilisateur veut moins de tokens dans le fichier qu'il ENVOIE.

test('compresserSegments : chaque mot retourne dans SON segment', async () => {
  const r = await compresserSegments(['alpha beta', 'gamma delta'],
    fauxPipe({ alpha: 0.9, beta: 0.1, gamma: 0.1, delta: 0.9 }), { taux: 0.5 });
  assert.deepEqual(r.segments, ['alpha', 'delta']);
});

test('compresserSegments : un segment entièrement supprimé rend une chaîne vide', async () => {
  const r = await compresserSegments(['garder', 'jeter ceci'],
    fauxPipe({ garder: 0.9 }), { taux: 0.34 });
  assert.equal(r.segments.length, 2);
  assert.equal(r.segments[1], '', 'le fragment ne sera simplement pas dessiné');
});

test('compresserSegments : le nombre de segments rendus est TOUJOURS celui reçu', async () => {
  // Un décalage ici collerait le texte d'un fragment sur un autre - donc du
  // texte à la mauvaise position dans le document reconstruit.
  const entree = ['un', '', 'deux trois', 'quatre'];
  const r = await compresserSegments(entree, fauxPipe(), { taux: 1 });
  assert.equal(r.segments.length, entree.length);
});

test('compresserSegments : un placeholder reste dans son segment d\u2019origine', async () => {
  const r = await compresserSegments(['texte [PERSONNE_1] ici', 'autre'],
    fauxPipe(), { taux: 0 });
  assert.ok(r.segments[0].includes('[PERSONNE_1]'));
  assert.ok(!r.segments[1].includes('[PERSONNE_1]'));
});

test('compresser reste un cas particulier de compresserSegments', async () => {
  // Une seule implémentation : deux copies « identiques » divergent toujours.
  const r = await compresser('alpha beta', fauxPipe({ alpha: 0.9 }), { taux: 0.5 });
  assert.equal(r.texte, 'alpha');
  assert.equal(r.motsAvant, 2);
});
