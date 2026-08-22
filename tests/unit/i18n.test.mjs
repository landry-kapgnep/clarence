// Catalogues de traduction : cohérence avec la page ET entre eux.
//
// Ce sont trois fichiers séparés qui doivent rester d'accord — popup.html,
// _locales/fr et _locales/en. Rien dans l'outillage ne le garantit : une clé
// ajoutée à la page sans message affiche la clé brute, une clé traduite mais
// disparue de la page pourrit le catalogue, et une balise oubliée dans une
// traduction casse la mise en forme d'une infobulle. Aucun de ces trois cas
// ne plante — ils se voient à l'écran, ou pas du tout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const html = lire('../../extension/popup/popup.html');
const fr = JSON.parse(lire('../../extension/_locales/fr/messages.json'));
const en = JSON.parse(lire('../../extension/_locales/en/messages.json'));

// Clés utilisées par le manifeste, absentes de la page par construction.
const HORS_PAGE = new Set(['extName', 'extDescription']);

const clesDeLaPage = () => new Set(
  [...html.matchAll(/data-i18n(?:-html|-title|-placeholder|-aria)?="([^"]+)"/g)].map(m => m[1])
);

test('toute clé de la page a un message français', () => {
  const absentes = [...clesDeLaPage()].filter(k => !fr[k]);
  assert.deepEqual(absentes, [], 'clés sans message : ' + absentes.join(', '));
});

test('aucun message français orphelin', () => {
  const page = clesDeLaPage();
  const orphelines = Object.keys(fr).filter(k => !page.has(k) && !HORS_PAGE.has(k));
  assert.deepEqual(orphelines, [], 'messages inutilisés : ' + orphelines.join(', '));
});

test('les deux catalogues portent exactement les mêmes clés', () => {
  const a = Object.keys(fr).sort(), b = Object.keys(en).sort();
  assert.deepEqual(b.filter(k => !fr[k]), [], 'clés anglaises sans équivalent français');
  assert.deepEqual(a.filter(k => !en[k]), [], 'clés françaises non traduites');
});

test('aucun message vide', () => {
  for (const [nom, cat] of [['fr', fr], ['en', en]]) {
    for (const [k, v] of Object.entries(cat)) {
      assert.ok(v?.message?.trim(), `${nom}/${k} est vide`);
    }
  }
});

test('les balises des messages riches survivent à la traduction', () => {
  // Un <strong> oublié dans une traduction ne plante pas : l'infobulle perd
  // simplement son emphase, ou pire, affiche une balise ouverte.
  const balises = s => (s.match(/<\/?[a-z]+>/g) || []).sort().join(',');
  for (const k of Object.keys(fr)) {
    assert.equal(balises(en[k].message), balises(fr[k].message),
      `balises différentes entre fr et en pour « ${k} »`);
  }
});

test('le manifeste déclare une langue par défaut', () => {
  // Obligatoire dès qu'un dossier _locales existe : sans elle, Chrome REFUSE
  // de charger l'extension.
  const manifest = JSON.parse(lire('../../extension/manifest.json'));
  assert.equal(manifest.default_locale, 'fr');
  assert.match(manifest.name, /^__MSG_/);
  assert.match(manifest.description, /^__MSG_/);
});
