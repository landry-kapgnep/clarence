// Reconstruction PDF (Stage A, texte). Test de SÉCURITÉ central : le PDF
// reconstruit ne doit contenir AUCUN texte d'origine porteur de PII (pages
// neuves, pas de caviardage laissant le texte extractable en dessous).
// pdf-lib et pdfjs tournent en Node → entièrement testable ici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { reconstructPdf, tailleQuiTient, calculerBornes, aDeLaTransparence } from '../../src/files/pdf-reconstruct.js';
import { ressourcesPdfjs } from '../../src/files/pdf-adapter.js';

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
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buf), isEvalSupported: false, ...ressourcesPdfjs()
  }).promise;
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

// --- P7 : placeholders « tronqués » — en réalité DÉBORDANTS.
//
// Un placeholder est presque toujours plus long que la valeur qu'il remplace,
// et chaque fragment est redessiné à SA position d'origine : un fragment en fin
// de ligne finit donc hors page. pdfjs.getTextContent() ne retourne pas les
// glyphes hors cadre — d'où 422 « placeholders tronqués » comptés sur un
// mémoire réel, qui n'étaient pas coupés dans le fichier mais hors page.
test('tailleQuiTient : un fragment qui déborde est réduit, un autre non', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const largeurPage = 420, x = 40;

  const court = 'court';
  assert.equal(tailleQuiTient(font, court, 12, x, largeurPage), 12,
    'un fragment qui tient ne doit PAS être réduit');

  // Chaîne construite pour DÉPASSER à coup sûr : on la mesure au lieu de la
  // supposer (une première version « visiblement trop longue » tenait en fait).
  let long = 'fragment';
  while (font.widthOfTextAtSize(long, 12) <= largeurPage - x) long += ' encore plus long';
  const reduite = tailleQuiTient(font, long, 12, x, largeurPage);
  assert.ok(reduite < 12, 'un fragment qui déborde doit être réduit');
  assert.ok(font.widthOfTextAtSize(long, reduite) <= largeurPage - x,
    'après réduction, le fragment doit tenir dans la page');
});

test('tailleQuiTient : plancher de réduction respecté (jamais de corps illisible)', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  // Fragment absurdement long : on préfère le laisser déborder plutôt que
  // d'écrire en corps 1.
  const enorme = 'x'.repeat(400);
  const t = tailleQuiTient(font, enorme, 12, 40, 420);
  assert.ok(t >= 12 * 0.45, 'la réduction ne doit pas passer sous le plancher, obtenu ' + t);
});

test('reconstruction : un placeholder en fin de ligne reste ENTIÈREMENT extractible', async () => {
  // Ligne qui remplit presque la page ; l'email en fin de ligne devient un
  // placeholder plus long, ce qui la faisait déborder — donc perdre des
  // caractères à la relecture.
  const inBuf = await makePdf([
    'Merci de bien vouloir confirmer par retour a@b.fr'
  ]);
  const { buffer, mapping } = await reconstructPdf(inBuf, { deps });
  const texte = await extractText(buffer);

  assert.match(texte, /\[EMAIL_1\]/, 'le placeholder doit être extractible en entier : ' + texte);
  for (const m of mapping) {
    assert.ok(texte.includes(m.placeholder),
      `placeholder ${m.placeholder} introuvable dans la sortie — réversibilité cassée`);
  }
});

// --- FOND NOIR DES IMAGES TRANSPARENTES -----------------------------------
// encodeImage dépend d'OffscreenCanvas (navigateur) et n'a jamais pu être
// couvert ici : c'est ce trou qui a laissé le bug vivre. La DÉCISION, elle,
// est une fonction pure — donc testable.

test('aDeLaTransparence : un seul pixel non opaque suffit', () => {
  // 2 pixels opaques.
  assert.equal(aDeLaTransparence(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255])), false);
  // Le second est totalement transparent : c'est lui qui virerait au noir.
  assert.equal(aDeLaTransparence(new Uint8ClampedArray([1, 2, 3, 255, 0, 0, 0, 0])), true);
  // Semi-transparent : le JPEG l'aplatirait aussi.
  assert.equal(aDeLaTransparence(new Uint8ClampedArray([1, 2, 3, 128])), true);
});

test('aDeLaTransparence : image vide et image pleinement opaque', () => {
  assert.equal(aDeLaTransparence(new Uint8ClampedArray([])), false);
  const opaque = new Uint8ClampedArray(400);
  for (let i = 3; i < opaque.length; i += 4) opaque[i] = 255;
  assert.equal(aDeLaTransparence(opaque), false);
});

// --- CHEVAUCHEMENT ENTRE FRAGMENTS VOISINS --------------------------------

test('calculerBornes : borne au fragment suivant de la même hauteur', () => {
  const runs = [{ x: 40, y: 100 }, { x: 150, y: 100 }, { x: 300, y: 100 }];
  const b = calculerBornes(runs, ['a', 'b', 'c'], 420);
  // Le plus PROCHE à droite gagne, pas le premier venu dans l'ordre du tableau.
  assert.equal(b[0], 150);
  assert.equal(b[1], 300);
  assert.equal(b[2], 420, 'dernier de sa ligne : le bord de page');
});

test('calculerBornes : un fragment NON dessiné rend sa place au précédent', () => {
  // Cas fréquent : une entité couvre 3 fragments, le placeholder est émis dans
  // le premier et les deux suivants ne sont pas dessinés.
  const runs = [{ x: 40, y: 100 }, { x: 150, y: 100 }, { x: 300, y: 100 }];
  assert.equal(calculerBornes(runs, ['a', '', ''], 420)[0], 420,
    'sans voisin dessiné, toute la largeur restante est disponible');
  assert.equal(calculerBornes(runs, ['a', '', 'c'], 420)[0], 300);
});

test('calculerBornes : une autre hauteur ne borne rien', () => {
  const runs = [{ x: 40, y: 100 }, { x: 60, y: 80 }];
  assert.equal(calculerBornes(runs, ['a', 'b'], 420)[0], 420,
    'un fragment de la ligne du dessous ne doit pas rétrécir celui du dessus');
});

test('calculerBornes : un fragment à GAUCHE ne borne pas', () => {
  const runs = [{ x: 200, y: 100 }, { x: 40, y: 100 }];
  assert.equal(calculerBornes(runs, ['a', 'b'], 420)[0], 420);
});

test('calculerBornes : la COLONNE VOISINE borne, même sans lien logique', () => {
  // Le cas qui a motivé le passage à une portée PAGE. Deux colonnes sont des
  // unités distinctes ; borner dans l'unité laissait la gauche mordre sur la
  // droite. On ne cherche pas à savoir si les fragments forment « une ligne » —
  // seulement si leurs plages se recoupent à la même hauteur.
  const runs = [{ x: 40, y: 500 }, { x: 320, y: 500 }];
  assert.equal(calculerBornes(runs, ['colonne gauche', 'colonne droite'], 600)[0], 320);
});

test('calculerBornes : la tolérance encaisse un décalage de ligne de base', () => {
  // Deux fragments d'une même ligne n'ont pas toujours un y au centième près.
  const runs = [{ x: 40, y: 100 }, { x: 150, y: 101.4 }];
  assert.equal(calculerBornes(runs, ['a', 'b'], 420)[0], 150);
  // Au-delà de la tolérance, ce sont deux lignes.
  const loin = [{ x: 40, y: 100 }, { x: 150, y: 108 }];
  assert.equal(calculerBornes(loin, ['a', 'b'], 420)[0], 420);
});

test('calculerBornes : l’indexation par bande ne perd aucun voisin', () => {
  // L'index range par bandes de MEME_LIGNE ; un voisin peut tomber dans la
  // bande d'à côté. On le vérifie sur 200 fragments à des y légèrement
  // dispersés, en comparant à une recherche exhaustive naïve.
  const runs = [], textes = [];
  for (let i = 0; i < 200; i++) {
    runs.push({ x: (i % 20) * 25 + 10, y: Math.floor(i / 20) * 14 + (i % 3) * 0.7 });
    textes.push('f');
  }
  const rapide = calculerBornes(runs, textes, 600);
  const naif = runs.map((r, i) => {
    let b = 600;
    runs.forEach((o, j) => {
      if (j !== i && Math.abs(o.y - r.y) <= 2 && o.x > r.x && o.x < b) b = o.x;
    });
    return b;
  });
  assert.deepEqual(rapide, naif);
});

test('un placeholder plus long que la valeur ne mord pas sur son voisin', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const runs = [{ x: 40, y: 100 }, { x: 120, y: 100 }];
  const textes = ['[PERSONNE_1]', 'suite'];
  const borne = calculerBornes(runs, textes, 420)[0];
  const size = tailleQuiTient(font, textes[0], 12, runs[0].x, borne);
  assert.ok(font.widthOfTextAtSize(textes[0], size) <= borne - runs[0].x,
    'après réduction, le fragment doit tenir AVANT le début du suivant');
});
