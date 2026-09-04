// Garde-fous du filtre de précision. Zéro tolérance : ce module DÉMASQUE, donc
// une erreur ici est une fuite silencieuse - la catégorie que docs/notes-techniques.md classe
// en priorité stricte, au même titre que les validateurs et le masquage.
//
// Les tests utilisent un modèle SYNTHÉTIQUE plutôt que les poids appris : les
// garde-fous doivent tenir quels que soient les nombres, et un test qui
// dépendrait du dernier entraînement ne prouverait rien de durable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filtrerParPrecision, scorePrecision, expliquer, TYPES_FILTRES, POIDS, formeDeNomPropre
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
  // La valeur n'est PAS en casse de titre : « Modélisation applicative » ne
  // peut pas être un nom de personne, donc le garde-fou 5 la laisse évaluer.
  const ents = [ent({ type: 'ORG', value: 'Modélisation applicative' })];
  assert.equal(filtrerParPrecision(ents, 'texte', { modele: TOUT_REJETER }).length, 0);
});

test('le journal dit ce qui a été retiré et POURQUOI', () => {
  // Un mécanisme qui démasque sans pouvoir se justifier serait un contresens
  // dans un produit bâti sur l'anti-fausse-confiance.
  const modele = { seuil: 0.5, biais: 1, poids: { minusculeAilleurs: -10 } };
  const journal = [];
  const texte = 'RUBRIQUE Modélisation applicative\nje fais de la modélisation applicative.';
  filtrerParPrecision([ent({ value: 'Modélisation applicative' })], texte, { modele, journal });
  assert.equal(journal.length, 1);
  assert.equal(journal[0].valeur, 'Modélisation applicative');
  assert.equal(journal[0].motif, 'minusculeAilleurs');
  assert.ok(journal[0].p < 0.5);
});

test('scorePrecision rend 1 sans modèle - donc « garder »', () => {
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
  // basse (ici le score du modèle) n'apporte rien - apport nul, pas négatif -
  // alors qu'elle est LA raison du verdict. La comparer à zéro la rendrait
  // invisible et l'explication désignerait un coupable secondaire.
  const modele = { seuil: 0.5, biais: 0, poids: { score: 10, partLexique: -1 } };
  const ctx = contexteDocument('un texte');
  assert.equal(expliquer({ value: 'gestion', score: 0.02 }, ctx, modele), 'score');
});

// --- Les valeurs qui ont RÉELLEMENT fui, verrouillées ---------------------
//
// Ce test-ci dépend VOLONTAIREMENT des poids livrés, contrairement à tous les
// autres : c'est une porte de qualité sur le modèle expédié, pas sur la
// mécanique. Il est né d'une fuite mesurée au banc (29/08/2026, verdict NON
// PUBLIABLE) - le corpus ne contenait aucune valeur À CHIFFRES qui soit une
// vraie donnée personnelle, donc le filtre avait appris « chiffre ⇒ pas une
// entité » (poids −4,6) et retirait adresses, codes postaux et matricules.
//
// Le matricule est le plus grave des trois : le déterministe NE LE VOIT PAS
// (vérifié, detectRegex('EMP-0012') rend []), il n'était masqué que par la
// couche contextuelle. Le retirer était une fuite franche.
test('le filtre ne retire JAMAIS une valeur à chiffres qui a déjà fui', { skip: POIDS === null }, () => {
  const texte = 'Adresse 42 rue des Cordeliers, 44000 Nantes. Matricule EMP-0012.';
  const dangereuses = [
    { value: '42 rue des Cordeliers', type: 'LOC' },
    { value: '44000 Nantes', type: 'LOC' },
    { value: 'EMP-0012', type: 'ORG' }
  ].map(e => ({ ...e, source: 'ner', score: 0.6 }));

  const journal = [];
  const gardees = filtrerParPrecision(dangereuses, texte, { journal });
  assert.deepEqual(gardees, dangereuses,
    'FUITE : ' + journal.map(j => `« ${j.valeur} » retiré (${j.motif}, p=${j.p.toFixed(3)})`).join(', '));
});

test('les poids livrés ne pèsent que des caractéristiques calculables EN PRODUCTION', { skip: POIDS === null }, () => {
  // ⚠️ PIÈGE VÉCU. `fragmentation` a besoin du vocabulaire de sous-mots (~1 Mo,
  // hors dépôt). Le banc d'entraînement le charge, la production NON : elle
  // appelle filtrerParPrecision sans `sousMots`, donc la caractéristique y vaut
  // 0 en toutes circonstances. Un modèle entraîné avec de vraies valeurs et un
  // poids de −7,59 s'appliquait donc hors de son domaine - sans erreur, sans
  // signal, juste des décisions décalées.
  //
  // Si un jour on embarque le vocabulaire, ce test doit être MODIFIÉ en même
  // temps que le câblage : c'est là tout son intérêt.
  assert.ok(!('fragmentation' in POIDS.poids),
    'poids sur « fragmentation » alors que la production ne la calcule pas');
});

// --- Garde-fou 5 : la FORME d'un nom protège, pas l'étiquette -------------

test('un candidat en forme de nom de personne n’est JAMAIS filtré', () => {
  // LA FUITE QUI A IMPOSÉ CE GARDE-FOU, reproduite telle quelle. Sur
  // tests/manuel/tous-defauts.pdf, le modèle étiquette « Rose Fontaine » en
  // ENTREPRISE - le garde-fou 3 raisonne par TYPE et ne la voit donc pas - et
  // le filtre la retirait à 0,177 : « rose » est au dictionnaire, et le
  // document l'écrit lui-même en minuscules dans la phrase suivante. Les deux
  // signaux dont ce filtre tire sa valeur se retournaient contre un patronyme.
  const texte = 'Rose Fontaine cultive une rose ancienne dans son jardin.';
  const nom = [ent({ type: 'ORG', value: 'Rose Fontaine' })];
  assert.deepEqual(filtrerParPrecision(nom, texte, { modele: TOUT_REJETER }), nom);
});

test('la forme de nom : deux ou trois mots capitalisés, sans chiffre', () => {
  assert.ok(formeDeNomPropre('Rose Fontaine'));
  assert.ok(formeDeNomPropre('Pierre Blanc'));
  assert.ok(formeDeNomPropre('Jean-Marie Le Pen'));
  // Une raison sociale longue n'est plus un nom de personne.
  assert.ok(!formeDeNomPropre('Institut National des Sciences Appliquées'));
  // Un chiffre exclut : un patronyme n'en porte pas.
  assert.ok(!formeDeNomPropre('Baccalauréat Général 2016'));
  // Casse mixte ou minuscule : ce n'est pas la forme d'un nom.
  assert.ok(!formeDeNomPropre('Modélisation applicative'));
  assert.ok(!formeDeNomPropre('BULLETIN NUMÉRO'));
  assert.ok(!formeDeNomPropre('Fontaine'), 'un seul mot n’est pas une forme de nom complète');
});
