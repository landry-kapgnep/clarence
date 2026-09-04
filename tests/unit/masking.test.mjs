// Zéro tolérance : la cohérence du masquage/mapping est critique (docs/notes-techniques.md §Tests).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskText, reinject } from '../../src/engine/masking.js';

const e = (type, value, start, source = 'ner') =>
  ({ type, value, start, end: start + value.length, source, score: 0.99 });

test('placeholder typé et numéroté', () => {
  const { masked, mapping } = maskText('Contact : jean@acme.fr', [e('EMAIL', 'jean@acme.fr', 10, 'regex')]);
  assert.equal(masked, 'Contact : [EMAIL_1]');
  assert.deepEqual(mapping, [{
    placeholder: '[EMAIL_1]', value: 'jean@acme.fr', type: 'EMAIL',
    realistic: false, occurrences: 1
  }]);
});

test('même valeur → même placeholder partout (cohérence)', () => {
  const text = 'Jean Dupont a signé. Merci Jean Dupont.';
  const { masked, mapping } = maskText(text, [e('PER', 'Jean Dupont', 0), e('PER', 'Jean Dupont', 27)]);
  assert.equal(masked, '[PERSONNE_1] a signé. Merci [PERSONNE_1].');
  assert.equal(mapping.length, 1);
});

test('valeurs distinctes → numéros distincts', () => {
  const { masked } = maskText('Jean Dupont et Marie Curie.', [e('PER', 'Jean Dupont', 0), e('PER', 'Marie Curie', 15)]);
  assert.equal(masked, '[PERSONNE_1] et [PERSONNE_2].');
});

test('propagation : occurrence non détectée masquée quand même', () => {
  const text = 'Jean Dupont a signé. Merci Jean Dupont.';
  const { masked } = maskText(text, [e('PER', 'Jean Dupont', 0)]);
  assert.equal(masked, '[PERSONNE_1] a signé. Merci [PERSONNE_1].');
});

test('propagation : pas de sur-masquage en milieu de mot (Lyon vs Lyonnais)', () => {
  const { masked } = maskText('Basé à Lyon, le club Lyonnais. Lyon encore.', [e('LOC', 'Lyon', 7)]);
  assert.equal(masked, 'Basé à [LIEU_1], le club Lyonnais. [LIEU_1] encore.');
});

test('propagation : "Rose Fontaine" remplacé avant "Rose" (longueur d abord)', () => {
  const text = 'Rose Fontaine est là. Rose confirme. Rose Fontaine aussi.';
  const { masked } = maskText(text, [e('PER', 'Rose Fontaine', 0), e('PER', 'Rose', 22)]);
  assert.equal(masked, '[PERSONNE_1] est là. [PERSONNE_2] confirme. [PERSONNE_1] aussi.');
});

test('aucune valeur du mapping ne subsiste dans le texte masqué', () => {
  const text = 'Julien Marchand, IBAN FR76 3000 6000 0112 3456 7890 189, Julien Marchand.';
  const ents = [
    e('PER', 'Julien Marchand', 0),
    e('IBAN', 'FR76 3000 6000 0112 3456 7890 189', 22, 'regex'),
    e('PER', 'Julien Marchand', 58)
  ];
  const { masked, mapping } = maskText(text, ents);
  for (const { value } of mapping) {
    assert.equal(masked.includes(value), false, 'fuite : ' + value);
  }
});

test('reinject restitue exactement le texte d origine', () => {
  const text = 'Jean Dupont (jean@acme.fr) travaille chez Acme SARL. Jean Dupont valide.';
  const ents = [
    e('PER', 'Jean Dupont', 0),
    e('EMAIL', 'jean@acme.fr', 13, 'regex'),
    e('ORG', 'Acme SARL', 42),
    e('PER', 'Jean Dupont', 53)
  ];
  const { masked, mapping } = maskText(text, ents);
  assert.equal(reinject(masked, mapping), text);
});

test('le placeholder lui-même n est jamais corrompu par la propagation', () => {
  const { masked } = maskText('Code 42 attribué. Encore 42.', [e('MISC', '42', 5)]);
  assert.equal(masked, 'Code [DIVERS_1] attribué. Encore [DIVERS_1].');
});

test('reinject en un seul passage : une valeur restituée contenant un motif [TYPE_N] n est pas re-substituée', () => {
  const mapping = [
    { placeholder: '[PERSONNE_1]', value: 'voir [EMAIL_1]', type: 'PER' },
    { placeholder: '[EMAIL_1]', value: 'jean@acme.fr', type: 'EMAIL' }
  ];
  const out = reinject('Réf : [PERSONNE_1] et [EMAIL_1].', mapping);
  assert.equal(out, 'Réf : voir [EMAIL_1] et jean@acme.fr.');
});

// --- Fuite trouvée par le banc : la propagation ne travaillait que sur la
// valeur entière. « Marcus Whitfield » masqué à sa première occurrence, mais
// « Marcus » réutilisé seul plus loin restait en clair - forme d'usage très
// courante dans un mail ou un rapport.
test('un prénom réutilisé SEUL plus loin est masqué aussi', () => {
  const texte = 'Please welcome Marcus Whitfield to the team.\n'
    + 'Marcus previously worked at another company.';
  const per = { type: 'PER', value: 'Marcus Whitfield', start: 15, end: 31, source: 'ner' };
  const { masked } = maskText(texte, [per]);
  assert.doesNotMatch(masked, /\bMarcus\b/, 'le prénom seul fuit : ' + masked);
  assert.equal((masked.match(/\[PERSONNE_1\]/g) || []).length, 2);
});

test('la propagation par composant est SENSIBLE À LA CASSE', () => {
  // Sans cette garde, « Rose Fontaine » ferait disparaître toutes les « rose »
  // du document - le sur-masquage qu'on passe la session à combattre.
  const texte = 'Rose Fontaine cultive une rose ancienne dans son jardin.';
  const per = { type: 'PER', value: 'Rose Fontaine', start: 0, end: 13, source: 'ner' };
  const { masked } = maskText(texte, [per]);
  assert.match(masked, /une rose ancienne/, 'le nom commun en minuscules doit survivre');
});

test('particules et civilités ne sont jamais propagées seules', () => {
  const texte = 'Madame de La Villardière parle. Le rapport de la commission de ce mois.';
  const per = { type: 'PER', value: 'Madame de La Villardière', start: 0, end: 24, source: 'ner' };
  const { masked } = maskText(texte, [per]);
  assert.match(masked, /Le rapport de la commission de ce mois/,
    'particules propagées à tort : ' + masked);
});

test('avec pseudonymes, le composant reçoit SON pseudonyme, pas le nom complet', () => {
  const texte = 'Contact : Marcus Whitfield. Marcus rappellera demain.';
  const per = { type: 'PER', value: 'Marcus Whitfield', start: 10, end: 26, source: 'ner' };
  const { masked } = maskText(texte, [per], {
    pseudonymize: (type, v) => (v === 'Marcus Whitfield' ? 'Noémie Rousseau' : null)
  });
  assert.match(masked, /Contact : Noémie Rousseau\./);
  assert.match(masked, /Noémie rappellera demain/, 'attendu « Noémie » seul, obtenu : ' + masked);
});

// --- COMPTEUR D'OCCURRENCES. Il sert à trier la table de correspondance par
// fréquence, et ce tri porte une découverte mesurée sur un vrai mémoire :
// le sur-masquage se concentre en tête de distribution (« ChatGPT » masqué
// 41 fois, « MT » 25 fois), alors que la vraie donnée personnelle de ce
// document n'apparaissait qu'UNE fois. Trier par fréquence met donc les
// corrections les plus rentables en premier.
test('les occurrences sont comptées, propagation COMPRISE', () => {
  // « Rose Fontaine » n'est détecté qu'une fois ; la seconde occurrence est
  // rattrapée par la propagation. Le compteur doit voir les deux, sinon il
  // décrit la détection au lieu de décrire le document livré.
  const texte = 'Rose Fontaine a signé. Merci à Rose Fontaine.';
  const { mapping } = maskText(texte, [e('PER', 'Rose Fontaine', 0)]);
  assert.equal(mapping.length, 1);
  assert.equal(mapping[0].occurrences, 2);
});

test('le compteur distingue bien les valeurs entre elles', () => {
  const texte = 'Paul écrit à Marie. Paul insiste. Paul rappelle Marie.';
  const { mapping } = maskText(texte, [e('PER', 'Paul', 0), e('PER', 'Marie', 13)]);
  const parValeur = Object.fromEntries(mapping.map(m => [m.value, m.occurrences]));
  assert.deepEqual(parValeur, { Paul: 3, Marie: 2 });
});

test('un pseudonyme réaliste est compté comme un placeholder', () => {
  // Le pseudonyme n'est pas entre crochets et peut contenir des caractères que
  // le compteur ne doit pas interpréter - d'où la recherche littérale.
  const texte = 'Paul écrit. Paul répond.';
  const { mapping } = maskText(texte, [e('PER', 'Paul', 0)], {
    pseudonymize: () => 'Noémie R. (a+b)'
  });
  assert.equal(mapping[0].occurrences, 2);
});
