// Génère tests/fixtures/echantillon.pdf via pdf-lib (reproductible, pas un
// blob opaque — même convention que gen-xlsx-fixture.mjs/gen-docx-fixture.mjs).
//
// Contient, délibérément :
// - un titre en police nettement plus grande (18pt vs 11pt du corps) — teste
//   la détection de titre par taille de police ;
// - un paragraphe de plusieurs lignes (interligne normal) suivi d'un
//   paragraphe séparé par un plus grand écart vertical — teste le
//   regroupement en paragraphes par écart Y ;
// - une IBAN et un nom sur la page 1, un second nom sur la page 2 — teste la
//   cohérence des placeholders inter-pages ;
// - un paragraphe sans aucune PII sur la page 2 — teste l'absence de faux
//   positif après conversion PDF→texte.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

function drawLines(page, lines) {
  for (const { text, y, size, bold } of lines) {
    page.drawText(text, { x: 50, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
  }
}

const page1 = doc.addPage([595, 842]);
drawLines(page1, [
  { text: 'RAPPORT CLIENT — CONFIDENTIEL', y: 780, size: 18, bold: true },
  // paragraphe 1 : 3 lignes, interligne normal (16pt, < 1.6× la taille 11)
  { text: "Bonjour, je m'appelle Julien Marchand, je vous contacte au sujet de", y: 746, size: 11 },
  { text: 'mon dossier client n°48213. Vous pouvez me joindre au 06 12 34 56 78', y: 730, size: 11 },
  { text: 'ou par email à julien.marchand@monentreprise.fr.', y: 714, size: 11 },
  // paragraphe 2 : écart de 34pt (> 1.6× 11) → nouveau paragraphe
  { text: 'Mon IBAN pour le remboursement est FR76 3000 6000 0112 3456 7890 189.', y: 680, size: 11 }
]);

const page2 = doc.addPage([595, 842]);
drawLines(page2, [
  { text: 'Cordialement,', y: 780, size: 11 },
  { text: 'Amandine Rousseau', y: 764, size: 11 },
  // paragraphe sans PII, séparé par un grand écart
  { text: 'La réunion portera sur la stratégie produit du prochain trimestre.', y: 730, size: 11 }
]);

const pdfBytes = await doc.save();
writeFileSync(join(here, 'echantillon.pdf'), pdfBytes);
console.log('echantillon.pdf généré.');
