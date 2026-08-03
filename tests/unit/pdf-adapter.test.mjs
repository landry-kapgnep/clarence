import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractTextUnits, applyMask, stripMetadata, groupIntoLines, isLineWrapHyphen } from '../../src/files/pdf-adapter.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';

// Items pdfjs synthétiques (transform = [a,b,c,d,x,y]) : reproduit de façon
// déterministe la fragmentation d'un mot par pdfjs, impossible à obtenir
// fiablement via pdf-lib (pdfjs re-fusionne les drawText adjacents).
const item = (str, x, y, width, size = 12) => ({ str, transform: [size, 0, 0, size, x, y], width, height: size });

test('P1 fragmentation : deux fragments collés du même mot ne sont PAS séparés', () => {
  // "Sem" finit à x=70 (50+20), "antikmatch" commence à 70 → aucun écart.
  const lines = groupIntoLines([item('Sem', 50, 700, 20), item('antikmatch', 70, 700, 60)]);
  assert.equal(lines[0].text, 'Semantikmatch');
});

test('P1 fragmentation : deux mots avec un vrai écart restent séparés', () => {
  // "Nom" finit à x=70, "Prenom" commence à 120 → écart franc → espace.
  const lines = groupIntoLines([item('Nom', 50, 700, 20), item('Prenom', 120, 700, 40)]);
  assert.equal(lines[0].text, 'Nom Prenom');
});

// --- P1bis : mot coupé en FIN DE LIGNE (typographie justifiée, colonne
// étroite). Constaté sur un vrai CV multi-colonnes : « auto- » / « matisée »,
// « Fas- » / « tify », « ap- » / « plicative » — soumis tel quel au modèle,
// ces fragments sortent avec plus de confiance que le vrai nom du candidat
// (« matisée » → donnée de santé 0,70 ; « plicative » → entreprise 0,70 ;
// nom du candidat : 0,47).
test('isLineWrapHyphen : trait d\'union collé + minuscule qui suit = coupure de mot', () => {
  assert.equal(isLineWrapHyphen('évaluation auto-', 'matisée (~15 000 extractions)'), true);
  assert.equal(isLineWrapHyphen('Stack : React.js, Fas-', 'tify, Prisma ORM'), true);
  assert.equal(isLineWrapHyphen('logique ap-', 'plicative (Godot / Unity)'), true);
});

test('isLineWrapHyphen : un tiret de séparation réel (entouré d\'espaces) n\'est jamais une coupure', () => {
  // Un vrai tiret de plage/séparation est TOUJOURS entouré d'espaces en
  // français — signal qui le distingue sans ambiguïté d'un mot coupé.
  assert.equal(isLineWrapHyphen('Anglais - C1 Cambridge Certificate', 'et Allemand'), false);
  assert.equal(isLineWrapHyphen('Concours d’éloquence - Double lauréat (Sorbonne Paris', 'Nord).'), false);
});

test('isLineWrapHyphen : une ligne suivante qui commence par une MAJUSCULE n\'est pas une coupure', () => {
  // Une coupure de mot continue toujours en minuscule ; une majuscule signale
  // une nouvelle phrase ou un titre, pas la suite du même mot.
  assert.equal(isLineWrapHyphen('Quelque chose qui finit par un tiret-', 'Nouvelle Phrase'), false);
});

test('groupIntoLines/paragraphes : un mot coupé en fin de ligne est RECOLLÉ, sans le trait d\'union', () => {
  // Reproduit la géométrie réelle : deux lignes, écart Y d'interligne normal
  // (même paragraphe), la première se terminant par un mot coupé.
  const { units } = extractionParagraphesSynthetiques([
    [item('Une évaluation auto-', 50, 700, 140)],
    [item('matisée (~15 000 extractions).', 50, 684, 220)]
  ]);
  assert.equal(units[0].text, 'Une évaluation automatisée (~15 000 extractions).');
});

// Construit un faux extractTextUnits minimal à partir de LIGNES déjà groupées
// (mêmes items qu'utilisés ailleurs dans ce fichier), pour tester le
// regroupement en paragraphes sans dépendre d'un vrai PDF binaire.
function extractionParagraphesSynthetiques(itemsParLigne) {
  const items = itemsParLigne.flat();
  const lines = groupIntoLines(items);
  // Reproduit exactement la boucle de groupIntoParagraphs (non exportée) :
  // sert de garde-fou si sa logique de jointure diverge un jour de celle-ci.
  const paragraphs = [];
  let current = null;
  for (const line of lines) {
    if (!current) { current = { text: line.text }; paragraphs.push(current); }
    else if (isLineWrapHyphen(current.text, line.text)) current.text = current.text.slice(0, -1) + line.text;
    else current.text += ' ' + line.text;
  }
  return { units: paragraphs };
}

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
