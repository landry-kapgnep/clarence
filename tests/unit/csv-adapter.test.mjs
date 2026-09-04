import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractTextUnits, applyMask, stripMetadata } from '../../src/files/csv-adapter.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

const fx = f => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', f), 'utf8');

test('détecte le BOM, le délimiteur ; et un champ cité avec virgule + retour à la ligne', () => {
  const { units, meta } = extractTextUnits(fx('echantillon.csv'));
  assert.equal(meta.delimiter, ';');
  assert.equal(meta.hasBOM, true);
  assert.equal(meta.eol, '\r\n');
  // le champ cité contenant une virgule ET un retour à la ligne doit rester une seule cellule
  const notes = units.find(u => u.text.includes('8 bis avenue Foch'));
  assert.ok(notes, 'le champ multi-ligne cité doit être reconstitué en une seule unité');
  assert.ok(notes.text.includes('75116 Paris'));
});

test('cellules vides ignorées, en-têtes traités comme des cellules normales', () => {
  const { units } = extractTextUnits(fx('echantillon.csv'));
  assert.ok(units.some(u => u.text === 'Nom'), 'un en-tête littéral ne doit jamais faire planter le sniff/parse');
  assert.equal(units.some(u => u.text === ''), false, 'aucune unité pour une cellule vide');
});

test('stripMetadata est un passthrough (le CSV ne porte aucune métadonnée)', () => {
  const text = fx('echantillon.csv');
  assert.equal(stripMetadata(text), text);
});

test('pipeline complet : les valeurs PII de la fixture ne fuient nulle part en sortie, les en-têtes et la ligne sans PII restent intacts', async () => {
  const csvText = fx('echantillon.csv');
  const { units } = extractTextUnits(csvText);
  const { results } = await anonymizeUnits(units); // regex seul (pas de nerPipeline) - comme fixtures.test.mjs

  const resultsById = new Map(results.map(r => [r.id, { maskedText: r.maskedText }]));
  const output = applyMask(csvText, resultsById);

  for (const pii of [
    'julien.marchand@monentreprise.fr', 'rose.fontaine@example.com',
    '06 12 34 56 78', '07 89 12 34 56'
  ]) {
    assert.equal(output.includes(pii), false, 'fuite : ' + pii);
  }
  assert.ok(output.includes('Nom;Email;Telephone;Notes'), 'en-tête inchangé');
  assert.ok(output.includes('Point hebdomadaire sur la roadmap produit et le budget'), 'ligne sans PII inchangée');
  assert.equal(output.charCodeAt(0), 0xFEFF, 'BOM préservé en sortie');
});

test('aller-retour structurel : ré-analyser la sortie donne le même nombre de lignes/colonnes', async () => {
  const csvText = fx('echantillon.csv');
  const before = extractTextUnits(csvText).meta.rows;
  const { units } = extractTextUnits(csvText);
  const { results } = await anonymizeUnits(units);
  const resultsById = new Map(results.map(r => [r.id, { maskedText: r.maskedText }]));
  const output = applyMask(csvText, resultsById);
  const after = extractTextUnits(output).meta.rows;
  assert.equal(after.length, before.length);
  assert.deepEqual(after.map(r => r.length), before.map(r => r.length));
});

// --- En-tête de colonnes marqué « structurel ».
// Mesuré au banc : sans ce marquage, un export RH ressortait avec 43 masques
// pour 62 mots - « Matricule », « Salaire », « Date de naissance » masqués.
// Le fichier était sûr et illisible pour le LLM à qui on le destine.
test('la ligne d\'en-tête est marquée structurelle, pas les données', () => {
  const { units } = extractTextUnits('Nom,Email,Ville\nDupont,a@b.example,Lyon\n');
  const entete = units.filter(u => u.id.startsWith('r0'));
  const donnees = units.filter(u => !u.id.startsWith('r0'));
  assert.ok(entete.every(u => u.structurel === true), 'en-tête non marqué');
  assert.ok(donnees.every(u => !u.structurel), 'des données marquées à tort');
});

test('sans signature d\'en-tête, AUCUNE ligne n\'est exemptée (prudence anti-fuite)', () => {
  // Se tromper ici ferait sauter la détection sur de vraies personnes.
  const cas = [
    'Dupont,a@b.example,Lyon\nMartin,c@d.example,Paris\n', // 1re ligne = données (email, donc pas un libellé)
    'Nom,Email,Ville\n',                                   // une seule ligne : rien ne prouve que c'est un en-tête
    'Nom,Nom,Ville\nDupont,Martin,Lyon\n',                 // libellés en doublon → suspect
    '2024,Total,Ville\n1988,120,Lyon\n'                    // chiffres dans la 1re ligne → données
  ];
  for (const csv of cas) {
    const { units } = extractTextUnits(csv);
    assert.ok(units.every(u => !u.structurel), 'exemption abusive sur : ' + JSON.stringify(csv));
  }
});
