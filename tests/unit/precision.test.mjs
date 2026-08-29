// Garde-fous du filtre de précision. Zéro tolérance : ce module DÉMASQUE, donc
// une erreur ici est une fuite silencieuse — la catégorie que CLAUDE.md classe
// en priorité stricte, au même titre que les validateurs et le masquage.
//
// Les tests utilisent un modèle SYNTHÉTIQUE plutôt que les poids appris : les
// garde-fous doivent tenir quels que soient les nombres, et un test qui
// dépendrait du dernier entraînement ne prouverait rien de durable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filtrerParPrecision, scorePrecision, expliquer, TYPES_FILTRES, POIDS
} from '../../src/engine/precision.js';
import { contexteDocument } from '../../src/engine/caracteristiques.js';

// Modèle qui REJETTE tout ce qu'il a le droit d'évaluer : le pire cas possible.
// C'est exactement ce qu'il faut pour prouver que les garde-fous, eux, tiennent.
const TOUT_REJETER = { seuil: 0.5, biais: -20, poids: { partLexique: 0 } };

const ent = (o) => ({ source: 'ner', type: 'ORG', value: 'X', score: 0.8, ...o });

test('sans poids appris, le filtre est INERTE', () => {
  const ents = [ent({ value: 'Développement Web' })];
  assert.deepEqual(filtrerParPrecision(ents, 'texte', { modele: null }), ents);
});

test('les poids livrés sont soit null, soit complets', () => {
  // Un fichier généré à moitié écrit produirait un filtre qui décide au hasard.
  if (POIDS !== null) {
    assert.ok(typeof POIDS.seuil === 'number' && POIDS.seuil > 0 && POIDS.seuil < 1);
    assert.ok(typeof POIDS.biais === 'number' && Number.isFinite(POIDS.biais));
    assert.ok(POIDS.poids && Object.keys(POIDS.poids).length > 0);
    for (const [nom, w] of Object.entries(POIDS.poids)) {
      assert.ok(Number.isFinite(w), `poids « ${nom} » non fini`);
    }
  }
});

// --- Garde-fou 1 : il ne peut que RETIRER ---------------------------------

test('le filtre ne peut QUE retirer, jamais ajouter ni modifier', () => {
  const ents = [ent({ value: 'Alpha' }), ent({ value: 'Beta', type: 'LOC' })];
  const sortie = filtrerParPrecision(ents, 'texte', { modele: TOUT_REJETER });
  assert.ok(sortie.length <= ents.length);
  for (const e of sortie) assert.ok(ents.includes(e), 'entité recréée au lieu d’être laissée intacte');
});

// --- Garde-fou 2 : jamais le déterministe ---------------------------------

test('le déterministe traverse le filtre intact, même modèle hostile', () => {
  // Un IBAN validé mod-97 ne se discute pas avec un modèle statistique. Idem
  // pour un masque forcé par le profil d'identité.
  const deterministes = [
    { source: 'regex', type: 'IBAN', value: 'FR7630006000011234567890189' },
    { source: 'regex', type: 'EMAIL', value: 'a@b.fr' },
    { source: 'forced', type: 'ORG', value: 'Développement Web' }
  ];
  assert.deepEqual(
    filtrerParPrecision(deterministes, 'texte', { modele: TOUT_REJETER }),
    deterministes);
});

// --- Garde-fou 3 : jamais les personnes -----------------------------------

test('les PERSONNES ne sont JAMAIS filtrées', () => {
  // La limite la plus importante, héritée de vocabulaire.js : beaucoup de
  // patronymes sont des mots courants (Blanc, Petit, Roux) et notre propre
  // vivier de pseudonymes en est plein. Filtrer les PER produirait des fuites.
  const per = [ent({ type: 'PER', value: 'Pierre Blanc' }),
               ent({ type: 'PER', value: 'le' })];
  assert.deepEqual(filtrerParPrecision(per, 'texte', { modele: TOUT_REJETER }), per);
  assert.ok(!TYPES_FILTRES.has('PER'));
});

test('les types autres qu’ORG/LOC passent intacts', () => {
  const autres = ['DATE_NAISSANCE', 'POSTE', 'SANTE', 'ETABLISSEMENT', 'NATIONALITE']
    .map(type => ent({ type, value: 'valeur' }));
  assert.deepEqual(filtrerParPrecision(autres, 'texte', { modele: TOUT_REJETER }), autres);
});

// --- Le filtre agit bel et bien quand il en a le droit --------------------

test('un ORG évalué sous le seuil est retiré', () => {
  const ents = [ent({ type: 'ORG', value: 'Développement Web' })];
  assert.equal(filtrerParPrecision(ents, 'texte', { modele: TOUT_REJETER }).length, 0);
});

test('le journal dit ce qui a été retiré et POURQUOI', () => {
  // Un mécanisme qui démasque sans pouvoir se justifier serait un contresens
  // dans un produit bâti sur l'anti-fausse-confiance.
  const modele = { seuil: 0.5, biais: 1, poids: { minusculeAilleurs: -10 } };
  const journal = [];
  const texte = 'COMPÉTENCES Développement Web\nje fais du développement web.';
  filtrerParPrecision([ent({ value: 'Développement Web' })], texte, { modele, journal });
  assert.equal(journal.length, 1);
  assert.equal(journal[0].valeur, 'Développement Web');
  assert.equal(journal[0].motif, 'minusculeAilleurs');
  assert.ok(journal[0].p < 0.5);
});

test('scorePrecision rend 1 sans modèle — donc « garder »', () => {
  assert.equal(scorePrecision(ent({}), contexteDocument(''), null), 1);
  assert.equal(expliquer(ent({}), contexteDocument(''), null), null);
});

test('une liste vide ou absente ne casse rien', () => {
  assert.deepEqual(filtrerParPrecision([], 'x', { modele: TOUT_REJETER }), []);
  assert.deepEqual(filtrerParPrecision(null, 'x', { modele: TOUT_REJETER }), []);
});

test('le seuil est respecté au sens large : p === seuil garde l’entité', () => {
  // « Dans le doute on masque » vaut aussi pour l'égalité stricte.
  const modele = { seuil: 0.5, biais: 0, poids: { partLexique: 0 } };
  assert.equal(scorePrecision(ent({}), contexteDocument(''), modele), 0.5);
  assert.equal(filtrerParPrecision([ent({})], 'x', { modele }).length, 1);
});

test('l’explication voit aussi ce qui MANQUE, pas seulement ce qui pénalise', () => {
  // Piège corrigé : une caractéristique à poids POSITIF dont la valeur est
  // basse (ici le score du modèle) n'apporte rien — apport nul, pas négatif —
  // alors qu'elle est LA raison du verdict. La comparer à zéro la rendrait
  // invisible et l'explication désignerait un coupable secondaire.
  const modele = { seuil: 0.5, biais: 0, poids: { score: 10, partLexique: -1 } };
  const ctx = contexteDocument('un texte');
  assert.equal(expliquer({ value: 'gestion', score: 0.02 }, ctx, modele), 'score');
});
