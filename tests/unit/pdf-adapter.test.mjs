import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractTextUnits, applyMask, stripMetadata } from '../../src/files/pdf-adapter.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'echantillon.pdf');
const fxBuffer = () => new Uint8Array(readFileSync(fixturePath)).buffer;

// Fausse détection de noms (comme docx-adapter.test.mjs) : pas de vrai modèle NER ici.
const fakePipe = async chunk => chunk.includes('Julien Marchand')
  ? [{ entity: 'B-PER', word: 'Julien', score: 0.99 }, { entity: 'I-PER', word: 'Marchand', score: 0.98 }]
  : [];

test('extrait le titre isolé et les paragraphes correctement regroupés (interligne vs écart)', async () => {
  const { units } = await extractTextUnits(fxBuffer());
  assert.equal(units.length, 5, 'titre + 2 paragraphes p1, 2 paragraphes p2');
  assert.equal(units[0].id, 'page1#para0');
  assert.equal(units[0].text, 'RAPPORT CLIENT — CONFIDENTIEL');
  // les 3 lignes du 1er paragraphe (interligne normal) sont bien fusionnées
  assert.match(units[1].text, /Julien Marchand.*48213.*06 12 34 56 78.*julien\.marchand@monentreprise\.fr/s);
  // le 2e paragraphe (écart plus grand) est bien séparé, pas fusionné au 1er
  assert.equal(units[2].text, 'Mon IBAN pour le remboursement est FR76 3000 6000 0112 3456 7890 189.');
});

test('ordre multi-page respecté, 2 lignes courtes de la page 2 fusionnées en un paragraphe', async () => {
  const { units } = await extractTextUnits(fxBuffer());
  const p2 = units.filter(u => u.id.startsWith('page2#'));
  assert.equal(p2.length, 2);
  assert.equal(p2[0].text, 'Cordialement, Amandine Rousseau');
  assert.equal(p2[1].text, 'La réunion portera sur la stratégie produit du prochain trimestre.');
});

test('pipeline complet : titre en ## , PII masquée, aucune fuite, paragraphe sans PII intact', async () => {
  const buf = fxBuffer();
  const { units } = await extractTextUnits(buf);
  const { results, mapping } = await anonymizeUnits(units, { nerPipeline: fakePipe });
  const byId = new Map(results.map(r => [r.id, { maskedText: r.maskedText }]));
  const md = await applyMask(buf, byId);

  assert.match(md, /^## RAPPORT CLIENT — CONFIDENTIEL/, 'le titre doit être préfixé ##');
  for (const pii of [
    'Julien Marchand', '48213', '06 12 34 56 78',
    'julien.marchand@monentreprise.fr', 'FR76 3000 6000 0112 3456 7890 189'
  ]) {
    assert.equal(md.includes(pii), false, 'fuite : ' + pii);
  }
  assert.match(md, /\[PERSONNE_1\]/);
  assert.match(md, /\[REFERENCE_1\]/);
  assert.match(md, /\[IBAN_1\]/);
  // le paragraphe sans PII de la page 2 doit rester tel quel
  assert.ok(md.includes('La réunion portera sur la stratégie produit du prochain trimestre.'));
});

test('stripMetadata est un passthrough (rien à nettoyer, sortie déjà neuve)', () => {
  assert.equal(stripMetadata('## Titre\n\nTexte.'), '## Titre\n\nTexte.');
});

test('PDF sans texte extractible (page blanche) : aucune unité, pas de plantage', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]); // page vide, aucun texte dessiné
  const buf = (await doc.save()).buffer;
  const { units } = await extractTextUnits(buf);
  assert.deepEqual(units, []);
});

test("applyMask sur une unité absente de resultsById retombe sur le texte d'origine", async () => {
  const buf = fxBuffer();
  const md = await applyMask(buf, new Map()); // aucun résultat fourni
  assert.ok(md.includes('RAPPORT CLIENT — CONFIDENTIEL'));
  assert.ok(md.includes('Amandine Rousseau'));
});

// Génère une page à 2 colonnes (titre pleine largeur + colonne gauche à x=50,
// colonne droite à x=320) pour tester la détection de colonnes.
async function twoColumnBuffer() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  const T = (t, x, y) => page.drawText(t, { x, y, size: 11, font });
  page.drawText('RAPPORT DEUX COLONNES', { x: 50, y: 790, size: 18, font });
  // colonne gauche (x=50) — plusieurs lignes pour dépasser le seuil de détection
  const leftLines = ['Competences', 'Python et FastAPI', 'Docker et CI/CD',
    'SQL et PostgreSQL', 'Bases MongoDB', 'Contact : gauche@ex.fr'];
  const rightLines = ['Experiences', 'Data Engineer Semantik', 'Responsable Twini',
    'Benevole terrain MSF', 'Projets R&D divers', 'Tel : 06 12 34 56 78'];
  // les DEUX colonnes partagent les mêmes Y (côte à côte) — sans détection de
  // colonnes, chaque ligne gauche+droite fusionnerait.
  leftLines.forEach((t, i) => T(t, 50, 750 - i * 16));
  rightLines.forEach((t, i) => T(t, 320, 750 - i * 16));
  return (await doc.save()).buffer;
}

test('mise en page 2 colonnes : gauche et droite ne fusionnent pas sur la même ligne', async () => {
  const { units } = await extractTextUnits(await twoColumnBuffer());
  const joined = units.map(u => u.text).join(' | ');
  // l'email (gauche) et le téléphone (droite) étaient sur la même ligne Y :
  // sans détection de colonnes ils se retrouvaient collés. Ici, séparés.
  const emailUnit = units.find(u => u.text.includes('gauche@ex.fr'));
  const phoneUnit = units.find(u => u.text.includes('06 12 34 56 78'));
  assert.ok(emailUnit && phoneUnit);
  assert.notEqual(emailUnit.id, phoneUnit.id, 'email et téléphone dans des unités distinctes');
  assert.equal(emailUnit.text.includes('06 12 34 56 78'), false, 'la ligne gauche ne contient pas le texte de droite');
  // le titre pleine largeur reste en tête
  assert.match(units[0].text, /RAPPORT DEUX COLONNES/);
});

test("le buffer d'entrée reste réutilisable après extractTextUnits (pas de détachement)", async () => {
  const buf = fxBuffer();
  await extractTextUnits(buf); // pdfjs détache sa PROPRE copie, pas celle-ci
  const { units } = await extractTextUnits(buf); // doit encore fonctionner
  assert.ok(units.length > 0);
});
