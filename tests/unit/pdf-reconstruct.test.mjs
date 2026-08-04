// Reconstruction PDF (Stage A, texte). Test de SÉCURITÉ central : le PDF
// reconstruit ne doit contenir AUCUN texte d'origine porteur de PII (pages
// neuves, pas de caviardage laissant le texte extractable en dessous).
// pdf-lib et pdfjs tournent en Node → entièrement testable ici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { reconstructPdf } from '../../src/files/pdf-reconstruct.js';

const deps = { PDFDocument, StandardFonts };

async function makePdf(lines) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([420, 320]);
  let y = 280;
  for (const l of lines) { page.drawText(l, { x: 40, y, size: 12, font }); y -= 28; }
  return (await doc.save()).buffer;
}

async function extractText(buf) {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
  let out = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const p = await pdf.getPage(i);
    const tc = await p.getTextContent();
    out += tc.items.map(t => t.str).join(' ') + '\n';
  }
  return out;
}

test('reconstruction : aucune PII d\'origine ne subsiste, placeholders présents', async () => {
  const inBuf = await makePdf([
    'Contact : jean.dupont@example.fr',
    'IBAN FR76 3000 6000 0112 3456 7890 189',
    'Texte sans donnee sensible ici.'
  ]);
  const { buffer, mapping } = await reconstructPdf(inBuf, { deps }); // regex seul

  const text = await extractText(buffer);
  assert.equal(text.includes('jean.dupont@example.fr'), false, 'email fuité dans le PDF reconstruit');
  assert.equal(text.includes('FR76 3000 6000 0112 3456 7890 189'), false, 'IBAN fuité');
  assert.match(text, /\[EMAIL_1\]/);
  assert.match(text, /\[IBAN_1\]/);
  assert.ok(text.includes('Texte sans donnee sensible ici'), 'le texte non sensible doit rester');
  assert.ok(mapping.length >= 2, 'la table de correspondance doit lister les valeurs masquées');
});

test('reconstruction : un PDF avec image ne plante pas ; texte anonymisé (images gérées en navigateur uniquement)', async () => {
  // 1x1 PNG. En Node (pas d'OffscreenCanvas), l'image est ignorée SANS casser
  // la reconstruction du texte — la sécurité tient sur le texte, pas l'image.
  const redPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const png = await doc.embedPng(redPng);
  const page = doc.addPage([400, 300]);
  page.drawText('Email a@b.fr avant image', { x: 40, y: 250, size: 12, font });
  page.drawImage(png, { x: 100, y: 100, width: 120, height: 80 });
  const { buffer } = await reconstructPdf((await doc.save()).buffer, { deps });
  const text = await extractText(buffer);
  assert.equal(text.includes('a@b.fr'), false);
  assert.match(text, /\[EMAIL_1\]/);
});

test('reconstruction : caractères typographiques hors WinAnsi ne font pas planter', async () => {
  // guillemets courbes, tiret cadratin, points de suspension, œ
  const inBuf = await makePdf(['Réunion « stratégie » — cœur du sujet… voir a@b.fr']);
  const { buffer } = await reconstructPdf(inBuf, { deps });
  const text = await extractText(buffer);
  assert.equal(text.includes('a@b.fr'), false, 'email fuité');
  assert.match(text, /\[EMAIL_1\]/);
  assert.ok(text.length > 0, 'la page a bien été reconstruite malgré les caractères spéciaux');
});

// --- P1bis : mot coupé en fin de ligne (typographie justifiée). Constaté sur
// un vrai CV : « auto- » / « matisée » soumis séparément au modèle sortait à
// 0,70 comme donnée de santé — AU-DESSUS du score du vrai nom du candidat
// (0,47). Le chemin de RECONSTRUCTION a sa propre logique de jointure
// (paragraphToRuns, positionnée) — testée ici séparément de groupIntoLines/
// groupIntoParagraphs (pdf-adapter.test.mjs), qui ne couvrent que le Markdown.
//
// Lignes RAPPROCHÉES (14pt, sous le seuil PARAGRAPH_GAP_RATIO×taille) pour
// rester dans le MÊME paragraphe — makePdf() espace ses lignes de 28pt,
// volontairement large ailleurs dans ce fichier, ce qui déclencherait un
// NOUVEAU paragraphe et ne testerait jamais la jointure inter-lignes.
async function makePdfParagrapheSerre(lines) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([420, 320]);
  let y = 280;
  for (const l of lines) { page.drawText(l, { x: 40, y, size: 12, font }); y -= 14; }
  return (await doc.save()).buffer;
}

test('reconstruction : un mot coupé en fin de ligne est recollé AVANT détection', async () => {
  const inBuf = await makePdfParagrapheSerre([
    'Une evaluation auto-',
    'matisee des resultats.'
  ]);
  const fakePipe = async chunk => chunk.includes('automatisee')
    ? [{ entity: 'B-MISC', word: 'chose', score: 0 }] // jamais déclenché : juste vérifier le texte vu par le pipeline
    : [];
  let texteRecu = null;
  const espion = async chunk => { texteRecu = (texteRecu || '') + chunk; return fakePipe(chunk); };

  await reconstructPdf(inBuf, { deps, nerPipeline: espion });
  assert.match(texteRecu, /\bautomatisee\b/, 'le mot coupé n\'a pas été recollé avant détection : ' + JSON.stringify(texteRecu));
  assert.doesNotMatch(texteRecu, /\bmatisee\b/, 'le fragment isolé "matisee" est encore soumis tel quel au modèle');
});

// --- Le chemin de RECONSTRUCTION a sa propre construction de paragraphes
// (paragraphsWithParts). Il doit recevoir le même seuil calibré que le chemin
// Markdown, sinon les deux divergent — ils l'ont déjà fait une fois (P1bis).
test('reconstruction : interligne 1,5 → un seul paragraphe soumis au modèle', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([460, 700]);
  let y = 650;
  // Interligne 19 pt en police 11 : au-dessus de l'ancien seuil (17,6), donc
  // AVANT correctif chaque ligne partait en unité séparée.
  const phrases = [
    'Le rapport porte sur la localisation des jeux',
    'video et sur les echanges entre studios. Il',
    'analyse le role des editeurs dans la diffusion',
    'des oeuvres a l international, en prenant pour',
    'exemple plusieurs titres recents et leurs',
    'adaptations successives sur differents marches',
    'ainsi que les choix operes par les equipes',
    'de traduction au fil des annees ecoulees',
    'depuis la sortie initiale du premier volet',
    'de la serie etudiee dans ce present travail'
  ];
  for (const p of phrases) { page.drawText(p, { x: 40, y, size: 11, font }); y -= 19; }

  const recus = [];
  const espion = async chunk => { recus.push(chunk); return []; };
  await reconstructPdf((await doc.save()).buffer, { deps, nerPipeline: espion });

  // Une seule unité de détection. On compare en minuscules : detectNER fait
  // DEUX passes par unité (texte naturel + casse boostée), donc deux chaînes
  // distinctes pour un même paragraphe.
  const distincts = new Set(recus.map(t => t.toLowerCase()));
  assert.equal(distincts.size, 1,
    'le modèle doit recevoir UN paragraphe, pas une ligne à la fois : ' +
    JSON.stringify([...distincts].slice(0, 3)));
  const [texte] = [...distincts];
  assert.match(texte, /localisation des jeux video/, 'les lignes doivent être recollées');
  assert.match(texte, /present travail$/, 'jusqu\'à la dernière');
});
