// Option pseudonymes réalistes : déterminisme, unicité, anti-collision,
// et garantie que les types structurés critiques restent en placeholders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPseudonymizer } from '../../src/engine/pseudonyms.js';
import { maskText, reinject } from '../../src/engine/masking.js';

const e = (type, value, start, source = 'ner') =>
  ({ type, value, start, end: start + value.length, source, score: 0.99 });

test('déterminisme : même seed + même valeur → même pseudo', () => {
  const a = createPseudonymizer({ seed: 's1' });
  const b = createPseudonymizer({ seed: 's1' });
  assert.equal(a('PER', 'Jean Dupont'), b('PER', 'Jean Dupont'));
});

test('unicité : deux valeurs distinctes → deux pseudos distincts', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.notEqual(p('PER', 'Jean Dupont'), p('PER', 'Marie Curie'));
});

test('anti-collision : un pseudo présent dans le texte d origine est refusé', () => {
  const texte = 'Basé à Lyon avec Paul Mercier.';
  const p = createPseudonymizer({ seed: 's1', avoid: v => texte.includes(v) });
  const ville = p('LOC', 'Bordeaux');
  assert.notEqual(ville, 'Lyon');
  const nom = p('PER', 'Quelqu’un D’Autre');
  assert.notEqual(nom, 'Paul Mercier');
});

test('types structurés critiques → null (placeholder obligatoire)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  for (const t of ['IBAN', 'CARTE_BANCAIRE', 'NIR', 'SIRET_SIREN', 'REFERENCE', 'MONTANT', 'CODE_POSTAL_VILLE']) {
    assert.equal(p(t, '123'), null, t);
  }
});

test('maskText réaliste : nom pseudonymisé, IBAN en placeholder, désanonymisation exacte', () => {
  const text = 'Jean Dupont, IBAN FR76 3000 6000 0112 3456 7890 189. Merci Jean Dupont.';
  const ents = [
    e('PER', 'Jean Dupont', 0),
    e('IBAN', 'FR76 3000 6000 0112 3456 7890 189', text.indexOf('FR76'), 'regex'),
    e('PER', 'Jean Dupont', text.indexOf('Jean Dupont', 20))
  ];
  const p = createPseudonymizer({ seed: 's1', avoid: v => text.includes(v) });
  const { masked, mapping } = maskText(text, ents, { pseudonymize: p });
  // le nom est réaliste (pas un placeholder), cohérent sur les 2 occurrences
  const per = mapping.find(m => m.type === 'PER');
  assert.equal(per.realistic, true);
  assert.ok(!per.placeholder.startsWith('['));
  assert.equal(masked.split(per.placeholder).length - 1, 2);
  // l'IBAN reste en placeholder
  const iban = mapping.find(m => m.type === 'IBAN');
  assert.equal(iban.realistic, false);
  assert.equal(iban.placeholder, '[IBAN_1]');
  // aucune valeur réelle ne fuit
  assert.equal(masked.includes('Jean Dupont'), false);
  // aller-retour exact
  assert.equal(reinject(masked, mapping), text);
});

test('format de date préservé (séparateur)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('DATE_NAISSANCE', '12/03/1985'), /^\d{2}\/\d{2}\/\d{4}$/);
  assert.match(p('DATE_NAISSANCE', '12-03-1985'), /^\d{2}-\d{2}-\d{4}$/);
});

test('téléphone pseudo au format FR mobile', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('TELEPHONE', '06 12 34 56 78'), /^0[67](?: \d{2}){4}$/);
});

// --- Locale des pseudonymes (constaté : toujours franco-français, même sur
// un document rédigé en anglais — ça casse l'illusion de cohérence).
test('locale par défaut = fr (non-régression)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('TELEPHONE', '06 12 34 56 78'), /^0[67](?: \d{2}){4}$/);
});

test('locale "en" produit des noms/villes/téléphones anglophones', () => {
  const p = createPseudonymizer({ seed: 's1', locale: 'en' });
  const nom = p('PER', 'Jean Dupont');
  assert.ok(!/[éèêàçÀ-ÿ]/.test(nom), 'accent français dans un pseudo anglophone : ' + nom);
  assert.match(p('TELEPHONE', '555-1234'), /^\(\d{3}\) \d{3}-\d{4}$/);
  const email = p('EMAIL', 'jean@exemple.fr');
  assert.match(email, /@.+\.com$/);
});

test('une locale inconnue retombe silencieusement sur fr (jamais de plantage)', () => {
  const p = createPseudonymizer({ seed: 's1', locale: 'xx' });
  assert.match(p('TELEPHONE', '06 12 34 56 78'), /^0[67](?: \d{2}){4}$/);
});

test('déterminisme préservé PAR locale (même seed+valeur+locale → même pseudo)', () => {
  const a = createPseudonymizer({ seed: 's1', locale: 'en' });
  const b = createPseudonymizer({ seed: 's1', locale: 'en' });
  assert.equal(a('PER', 'Jean Dupont'), b('PER', 'Jean Dupont'));
});

// --- Cohérence AU NIVEAU DU COMPOSANT (constaté : « Priya Deva » → « Chloé
// Lemaire » mais « Priya » seule → « Thomas Fournier », sans aucun rapport.
// La même personne portait trois identités dans le même document.)
test('un composant de nom garde son pseudo, seul ou dans le nom complet', () => {
  const p = createPseudonymizer({ seed: 's1' });
  const complet = p('PER', 'Priya Deva');
  const [prenom, nom] = complet.split(' ');
  assert.equal(p('PER', 'Priya'), prenom, 'le prénom seul doit reprendre le même pseudo');
  assert.equal(p('PER', 'Deva'), nom, 'le patronyme seul doit reprendre le même pseudo');
});

test('l\'ordre de première rencontre n\'a pas d\'importance', () => {
  const p = createPseudonymizer({ seed: 's1' });
  const prenomSeul = p('PER', 'Priya');           // vu SEUL en premier
  const complet = p('PER', 'Priya Deva');
  assert.ok(complet.startsWith(prenomSeul), `${complet} devrait commencer par ${prenomSeul}`);
});

test('les particules nobiliaires sont conservées (lisibilité, non identifiantes)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  const v = p('PER', 'Sébastien De La Villardière');
  assert.match(v, / De La /, 'particules perdues : ' + v);
  assert.equal(v.includes('Villardière'), false, 'le vrai patronyme a fuité');
  assert.equal(v.includes('Sébastien'), false, 'le vrai prénom a fuité');
});

test('la casse TOUT-MAJUSCULE du patronyme est reproduite (convention CV FR)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  const v = p('PER', 'LANDRY KAPGNEP');
  assert.equal(v, v.toUpperCase(), 'casse non reproduite : ' + v);
  // et le composant seul reste cohérent avec le nom complet
  assert.equal(p('PER', 'KAPGNEP'), v.split(' ')[1]);
});

test('un nom à trait d\'union reste composé, et ses parties restent cohérentes', () => {
  const p = createPseudonymizer({ seed: 's1' });
  const v = p('PER', 'Marc-Antoine');
  assert.match(v, /^[^\s-]+-[^\s-]+$/, 'trait d\'union perdu : ' + v);
  assert.equal(p('PER', 'Marc'), v.split('-')[0]);
});

test('AUCUN composant réel ne subsiste dans le pseudo (anti-fuite)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  for (const vrai of ['Priya Deva', 'LANDRY KAPGNEP', 'Marc-Antoine De La Villardière']) {
    const faux = p('PER', vrai);
    for (const mot of vrai.split(/[\s-]+/)) {
      if (['De', 'La'].includes(mot)) continue; // particules gardées volontairement
      assert.equal(faux.toLowerCase().includes(mot.toLowerCase()), false,
        `« ${mot} » a fuité dans « ${faux} »`);
    }
  }
});

// --- Civilité incluse dans l'entité par le modèle contextuel.
// Cas réel : « Priya Deva » → « Clément Faure » mais « miss Deva » →
// « Amélie Faure ». Deux personnes de genres différents pour la même, dans
// le même texte — le titre était traité comme un prénom.
test('la civilité est conservée, jamais transformée en prénom', () => {
  const p = createPseudonymizer({ seed: 's1', locale: 'en' });
  const complet = p('PER', 'Priya Deva');
  const avecTitre = p('PER', 'miss Deva');
  assert.ok(avecTitre.startsWith('miss '), 'civilité perdue : ' + avecTitre);
  // et surtout : même patronyme des deux côtés → une seule personne perçue
  assert.equal(avecTitre.split(' ')[1], complet.split(' ')[1]);
});

test('civilités françaises aussi (M., Mme, Dr…)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  for (const titre of ['Monsieur', 'Mme', 'Dr']) {
    const v = p('PER', `${titre} Villardière`);
    assert.ok(v.startsWith(titre + ' '), `${titre} non conservé : ${v}`);
  }
});

// --- Format de date reproduit (une date littérale anglaise devenait
// « 13/10/1976 » au milieu d'un texte anglais).
test('une date littérale reste littérale, dans la locale choisie', () => {
  const en = createPseudonymizer({ seed: 's1', locale: 'en' });
  const v = en('DATE_NAISSANCE', 'january 1 2002');
  assert.match(v, /^[a-z]+ \d{1,2} \d{4}$/, 'format littéral EN non respecté : ' + v);
  assert.equal(v.includes('january'), false, 'le vrai mois a fuité');

  const fr = createPseudonymizer({ seed: 's1' });
  const vf = fr('DATE_NAISSANCE', '14 mars 1988');
  assert.match(vf, /^\d{1,2} \p{L}+ \d{4}$/u, 'format littéral FR non respecté : ' + vf);
});

test('une date numérique reste numérique (non-régression)', () => {
  const p = createPseudonymizer({ seed: 's1' });
  assert.match(p('DATE_NAISSANCE', '12/03/1985'), /^\d{2}\/\d{2}\/\d{4}$/);
  assert.match(p('DATE_NAISSANCE', '12-03-1985'), /^\d{2}-\d{2}-\d{4}$/);
});
