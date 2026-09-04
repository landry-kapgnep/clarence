// Caractéristiques du filtre de précision : fonctions pures, donc testables -
// c'est tout l'intérêt de les avoir sorties de la décision (leçon d'encodeImage,
// dont le bug de fond noir a vécu parce que la décision était noyée dans du code
// dépendant du navigateur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  caracteristiques, contexteDocument, morceaux, vecteur, NOMS_CARACTERISTIQUES
} from '../../src/engine/caracteristiques.js';

// Le test le plus important du fichier. Les poids appris sont un tableau
// aligné sur cet ordre. Réordonner l'objet `caracteristiques` sans réentraîner
// appliquerait le poids du lexique à la casse, celui du score aux occurrences -
// Sans aucune erreur, juste des décisions fausses. Si ce test casse, il faut
// réentraîner, pas mettre la liste à jour.
test('l’ordre des caractéristiques est verrouillé', () => {
  assert.deepEqual(NOMS_CARACTERISTIQUES, [
    'partLexique', 'partSuffixe', 'aucunCourant',
    'toutCapitales', 'casseDeTitre', 'aChiffre', 'liaisonInterne',
    'nbMots', 'longueur', 'fragmentation',
    'occurrences', 'minusculeAilleurs',
    'score'
  ]);
});

test('toutes les caractéristiques vivent dans [0, 1]', () => {
  const ctx = contexteDocument('Un texte quelconque avec Sorbonne répété Sorbonne Sorbonne.');
  for (const v of ['Sorbonne', 'CANAL ACOUSTIQUE DE DONNÉES & TRAITEMENT DU SIGNAL APPLIQUÉ',
                   '', 'X', '2026', 'a-b/c·d']) {
    for (const [nom, x] of Object.entries(caracteristiques({ value: v, score: 2 }, ctx))) {
      assert.ok(Number.isFinite(x) && x >= 0 && x <= 1,
        `« ${v} » → ${nom} = ${x}, hors de [0, 1]`);
    }
  }
});

test('le vecteur suit l’ordre déclaré', () => {
  const ctx = contexteDocument('rien');
  const c = caracteristiques({ value: 'Sorbonne', score: 0.7 }, ctx);
  assert.deepEqual(vecteur({ value: 'Sorbonne', score: 0.7 }, ctx),
    NOMS_CARACTERISTIQUES.map(k => c[k]));
});

// --- Ce que dit le vocabulaire --------------------------------------------

test('lexique et suffixes sont comptés SÉPARÉMENT', () => {
  const ctx = contexteDocument('');
  // « données » est au lexique multilingue ; « conteneurisée » n'y est pas mais
  // porte un suffixe français. La distinction est ce qui permettra de mesurer
  // si les suffixes - la seule pièce liée à une langue - servent encore.
  const donnees = caracteristiques({ value: 'données' }, ctx);
  assert.equal(donnees.partLexique, 1);
  assert.equal(donnees.partSuffixe, 0);

  const conteneurisee = caracteristiques({ value: 'conteneurisée' }, ctx);
  assert.equal(conteneurisee.partLexique, 0);
  assert.equal(conteneurisee.partSuffixe, 1);

  const kapgnep = caracteristiques({ value: 'Kapgnep' }, ctx);
  assert.equal(kapgnep.aucunCourant, 1);
});

// --- Ce que dit le document -----------------------------------------------

test('« le même mot ailleurs en minuscules » - le document se sert de dictionnaire', () => {
  // Aucune langue n'intervient ici : si le document écrit lui-même le mot en
  // minuscules ailleurs, c'est un nom commun, quelle que soit la langue.
  const ctx = contexteDocument('COMPÉTENCES Développement Web\nJe fais du développement web depuis 2019.');
  assert.equal(caracteristiques({ value: 'Développement Web' }, ctx).minusculeAilleurs, 1);
  assert.equal(caracteristiques({ value: 'Semantikmatch' }, ctx).minusculeAilleurs, 0);
});

test('une majuscule de début de phrase ne compte pas comme minuscule ailleurs', () => {
  // « Stage » en tête de phrase reste capitalisé : il ne prouve rien.
  const ctx = contexteDocument('Stage chez Twini.\nStage suivant chez Korrigane.');
  assert.equal(caracteristiques({ value: 'Stage' }, ctx).minusculeAilleurs, 0);
});

test('les occurrences montent en échelle logarithmique et saturent', () => {
  const rare = contexteDocument('Sorbonne apparaît une fois.');
  const frequent = contexteDocument(('Sorbonne ').repeat(25));
  const a = caracteristiques({ value: 'Sorbonne' }, rare).occurrences;
  const b = caracteristiques({ value: 'Sorbonne' }, frequent).occurrences;
  assert.equal(a, 0);
  assert.equal(b, 1);
  assert.ok(a < b);
});

// --- Fragmentation en sous-mots -------------------------------------------

test('la fragmentation compte les morceaux WordPiece, gloutonnement', () => {
  const vocab = new Set(['sor', '##bonne', 'terrain', 'kap', '##gne', '##p']);
  assert.equal(morceaux('terrain', vocab), 1);
  assert.equal(morceaux('sorbonne', vocab), 2);
  assert.equal(morceaux('kapgnep', vocab), 3);
});

test('sans vocabulaire de sous-mots, la fragmentation vaut 0 partout', () => {
  // Comportement voulu : le vocabulaire pèse ~1 Mo, on ne l'embarque que si la
  // mesure prouve qu'il gagne sa place. Son absence ne doit rien casser.
  const ctx = contexteDocument('Kapgnep');
  assert.equal(caracteristiques({ value: 'Kapgnep' }, ctx).fragmentation, 0);
  assert.equal(morceaux('Kapgnep', null), 1);
});

test('un mot entièrement inconnu du vocabulaire ne boucle pas', () => {
  // Cas limite réel : le tokenizer rendrait [UNK]. On veut un nombre fini, pas
  // une boucle infinie ni un NaN.
  const n = morceaux('zzz', new Set(['a']));
  assert.ok(Number.isFinite(n) && n > 0);
});

// --- Ce que dit la forme ---------------------------------------------------

test('casse et ponctuation de liaison', () => {
  const ctx = contexteDocument('');
  assert.equal(caracteristiques({ value: 'LANDRY KAPGNEP' }, ctx).toutCapitales, 1);
  assert.equal(caracteristiques({ value: 'Rose Fontaine' }, ctx).toutCapitales, 0);
  assert.equal(caracteristiques({ value: 'Rose Fontaine' }, ctx).casseDeTitre, 1);
  assert.equal(caracteristiques({ value: 'canal acoustique' }, ctx).casseDeTitre, 0);
  assert.equal(caracteristiques({ value: 'Développement & Web' }, ctx).liaisonInterne, 1);
  assert.equal(caracteristiques({ value: 'Développement Web' }, ctx).liaisonInterne, 0);
});

test('un candidat vide ne produit ni NaN ni division par zéro', () => {
  const ctx = contexteDocument('');
  for (const [nom, x] of Object.entries(caracteristiques({ value: '' }, ctx))) {
    assert.ok(Number.isFinite(x), `${nom} = ${x}`);
  }
  assert.equal(caracteristiques({}, ctx).partLexique, 0);
});

test('la fragmentation ne doit PAS mesurer la casse - piège allemand', () => {
  // Le vocabulaire est cased : « Unternehmen » y figure, « unternehmen » non.
  // Une première version minusculisait avant de segmenter et rendait donc 2
  // morceaux pour le mot allemand le plus banal qui soit. Elle mesurait la
  // casse au lieu de la rareté - et se trompait précisément sur la famille que
  // le lexique en minuscules ne peut PAS couvrir : en allemand tout nom commun
  // porte une capitale, donc aucun n'entre au lexique.
  const vocab = new Set(['Unternehmen', 'terrain', 'kap', '##gne', '##p']);
  assert.equal(morceaux('Unternehmen', vocab), 1);
  // Les capitales d'un intitulé sont de la mise en page, pas un autre mot.
  assert.equal(morceaux('UNTERNEHMEN', vocab), 1);
  assert.equal(morceaux('terrain', vocab), 1);
});
