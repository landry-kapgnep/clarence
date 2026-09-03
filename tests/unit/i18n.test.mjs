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

// Les clés vivent à DEUX endroits : les attributs data-i18n de la page, et
// les appels msg('…') du code. Ne scanner que le premier ferait passer toutes
// les clés du second pour des orphelines.
const SOURCES_JS = ['../../src/popup/main.js', '../../src/popup/profiles.js'];

const clesUtilisees = () => {
  // Suffixe GÉNÉRIQUE, et non la liste des attributs connus. Cette liste avait
  // déjà pris du retard une fois : `data-i18n-alt` — qui porte le nom
  // accessible des boutons-images — n'y figurait pas, et ses clés passaient
  // pour orphelines. Un scanner qu'il faut penser à mettre à jour finit
  // toujours par mentir. Le contrat réel est « data-i18n, éventuellement
  // suivi d'un tiret et d'un nom d'attribut » : c'est ça qu'on écrit.
  const vues = new Set(
    [...html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)].map(m => m[1])
  );
  // Le HTML n'est pas tout : la popup CONSTRUIT du balisage (le formulaire
  // d'identité, les puces de types, la table des corrections). Un data-i18n
  // posé dans un gabarit JS était invisible au scanner, et sa clé passait pour
  // orpheline. Troisième angle mort de ce même scanner — d'où la règle : on
  // cherche le contrat, pas les endroits où on se souvient qu'il s'applique.
  for (const f of SOURCES_JS) {
    for (const m of lire(f).matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)) vues.add(m[1]);
  }
  for (const f of SOURCES_JS) {
    // `[,)]` et non `)` seul : un message PARAMÉTRÉ s'écrit msg('clé', [...]),
    // et le scanner le manquait — il déclarait alors orpheline une clé bel et
    // bien utilisée.
    for (const m of lire(f).matchAll(/msg\('([^']+)'\s*[,)]/g)) vues.add(m[1]);
  }
  // Les noms de profils livrés servent de clé d'AFFICHAGE, résolue au rendu
  // depuis le nom interne : ils n'apparaissent donc pas littéralement.
  for (const k of Object.keys(fr)) if (k.startsWith('profil_')) vues.add(k);
  // Même cas : le nom lisible d'un format se résout par msg('format_' + type),
  // la clé n'apparaît donc jamais littéralement dans le source.
  for (const k of Object.keys(fr)) if (k.startsWith('format_')) vues.add(k);
  return vues;
};
const clesDeLaPage = clesUtilisees;

test('toute clé utilisée a un message français', () => {
  const absentes = [...clesUtilisees()].filter(k => !fr[k]);
  assert.deepEqual(absentes, [], 'clés sans message : ' + absentes.join(', '));
});

test('aucun message français orphelin', () => {
  const page = clesUtilisees();
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
