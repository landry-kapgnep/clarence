// Reconstruction PDF anonymisé, avec préservation des images (Stage B) -
// alternative à la sortie Markdown de pdf-adapter.js quand l'utilisateur veut
// Garder le contenu visuel plutôt qu'alléger les tokens.
//
// Sécurité (raison d'être de l'approche) : on NE caviarde PAS le PDF d'origine
// (un rectangle noir laisse le texte extractable en dessous = fuite). On
// reconstruit des pages neuves → aucun texte d'origine ne subsiste, seul le
// texte anonymisé est écrit. Contrepartie assumée : fidélité visuelle dégradée
// (police unique Helvetica, positions par fragment, pas de kerning fin).
//
// pdf-lib est injecté (deps) - comme DOMParser pour DOCX - pour rester testable
// en Node. Le ré-encodage canvas des images (Stage B) est navigateur-only.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { groupIntoLines, splitIntoColumns, median, needsSpace, isLineWrapHyphen, paragraphGapThreshold, marquerIntitules, releverIntitules, intitulesRetenus, HEADING_SIZE_RATIO, configurerPdfjs, ressourcesPdfjs } from './pdf-adapter.js';
import { joinRuns, distributeEntitiesOverRuns } from './text-units.js';
import { anonymizeUnits } from './anonymize-units.js';
import { verifierAnnulation } from '../engine/annulation.js';

// Worker et polices standard : configuration partagée avec pdf-adapter, jamais
// dupliquée ici (voir le commentaire de configurerPdfjs).
configurerPdfjs();

// StandardFonts.Helvetica encode WinAnsi/CP1252 - le français passe quasi tout,
// mais quelques caractères typographiques feraient planter drawText. On les
// normalise (guillemets courbes, tiret cadratin, points de suspension) et on
// remplace le reste hors-Latin1 par '?' plutôt que de laisser une exception
// interrompre toute la page.
function sanitizeForWinAnsi(str) {
  return str
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?');
}

// Regroupe les lignes en paragraphes EN CONSERVANT leurs fragments (parts),
// contrairement à groupIntoParagraphs de pdf-adapter qui ne garde que le texte.
// Un paragraphe = une unité de détection ; ses parts = les "runs" à redessiner.
function paragraphsWithParts(lines, dominantSize) {
  const paragraphs = [];
  let current = null, prevY = null;
  // Même seuil que groupIntoParagraphs (Markdown) : les deux chemins ont déjà
  // divergé une fois sur la jointure des lignes (P1bis), d'où le helper partagé.
  const seuilEcart = paragraphGapThreshold(lines, dominantSize);
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    // Même découpage que groupIntoParagraphs, y compris ce qu'on a refusé d'y
    // mettre : couper sur un intitulé de rubrique a été mesuré puis rejeté
    // (voir le commentaire là-bas). Les deux chemins restent alignés.
    const isNew = isHeading || !current || current.isHeading !== isHeading ||
      gap > seuilEcart;
    if (isNew) { current = { isHeading, lines: [line] }; paragraphs.push(current); }
    else current.lines.push(line);
    prevY = line.y;
  }
  return paragraphs;
}

// Un paragraphe → { id, text, runs }. runs alternent fragments dessinables
// (avec géométrie x/y/size) et séparateurs ' ' non dessinés, de sorte que
// joinRuns(runs).text === le texte donné à la détection : les offsets des
// entités retombent exactement sur les bons fragments (distributeEntitiesOverRuns).
function paragraphToRuns(para, id) {
  const runs = [];
  let n = 0;
  para.lines.forEach((line, li) => {
    line.parts.forEach((p, pi) => {
      // Séparateur ' ' entre fragments : entre deux lignes (frontière de mot),
      // Sauf si la ligne précédente se termine par un mot coupé en fin de
      // ligne (isLineWrapHyphen) - le trait d'union collé au dernier fragment
      // déjà poussé est alors retiré et les deux morceaux recollés sans
      // espace, exactement comme pour needsSpace au sein d'une même ligne
      // (fix fuite partielle P1/P1bis : sans ça, la détection voit « auto- »
      // et « matisée » séparément au lieu d'« automatisée »).
      if (li > 0 && pi === 0) {
        const precedent = runs[runs.length - 1];
        if (precedent && isLineWrapHyphen(precedent.text, p.str)) {
          precedent.text = precedent.text.slice(0, -1);
        } else {
          runs.push({ id: `s${n++}`, text: ' ', draw: false });
        }
      }
      else if (pi > 0 && needsSpace(line.parts[pi - 1], p)) runs.push({ id: `s${n++}`, text: ' ', draw: false });
      runs.push({ id: `r${n++}`, text: p.str, draw: true, x: p.x, y: p.y, size: p.size });
    });
  });
  return { id, text: joinRuns(runs).text, runs };
}

// Multiplication de deux matrices affines 2D [a,b,c,d,e,f].
function matMul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}

// Position/taille de chaque image via interprétation de la matrice de
// transformation courante (CTM) sur la liste d'opérateurs - validé au spike.
// Une image occupe le carré unité [0,1]² transformé par le CTM au moment du
// paint. Défensif : toute image problématique est simplement ignorée (les
// images sont un bonus, la sécurité tient sur le texte reconstruit).
async function extractImages(page) {
  const out = [];
  let opList;
  try { opList = await page.getOperatorList(); } catch { return out; }
  const OPS = pdfjsLib.OPS;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const refs = [];
  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i], args = opList.argsArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = matMul(ctm, args);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
      // min-corner + dimensions absolues : gère le retournement vertical
      // classique des images PDF (le bitmap pdfjs est déjà décodé à l'endroit).
      const x = Math.min(ctm[4], ctm[4] + ctm[0]);
      const y = Math.min(ctm[5], ctm[5] + ctm[3]);
      refs.push({ name: args[0], x, y, w: Math.abs(ctm[0]), h: Math.abs(ctm[3]) });
    }
  }
  for (const ref of refs) {
    // objs.get est à callback : en navigateur (worker réel) l'objet peut ne
    // jamais arriver → le callback ne se déclenche pas et on bloquerait
    // indéfiniment. Timeout défensif : mieux vaut perdre une image que figer
    // tout le traitement (l'utilisateur croirait à un plantage).
    const bitmap = await Promise.race([
      new Promise(res => { try { page.objs.get(ref.name, obj => res(obj || null)); } catch { res(null); } }),
      new Promise(res => setTimeout(() => res(null), 8000))
    ]).catch(() => null);
    // Deux formes possibles selon l'environnement (vérifié dans la source
    // pdfjs, qui poste `{bitmap, data}`) : en navigateur l'image arrive
    // décodée en ImageBitmap (`bitmap`), en Node en données brutes (`data`).
    // Ne tester que `data` écartait toutes les images en Chrome - le bug.
    if (bitmap && (bitmap.data || bitmap.bitmap) && bitmap.width && bitmap.height && ref.w > 1 && ref.h > 1) {
      out.push({ ...ref, bitmap });
    }
  }
  return out;
}

// Au-delà, l'image est redimensionnée : borne le temps d'encodage et le poids
// du PDF de sortie (une image de 4000px n'apporte rien de plus à un LLM).
const MAX_IMG_DIM = 1600;

// Convertit les données brutes pdfjs en rgba (kind 2 = RGB, 3 = rgba).
function rawToRgba({ width, height, kind, data }) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === 3) rgba.set(data.subarray(0, rgba.length));
  else if (kind === 2) {
    for (let i = 0, j = 0; i < width * height; i++) {
      rgba[j++] = data[i * 3]; rgba[j++] = data[i * 3 + 1]; rgba[j++] = data[i * 3 + 2]; rgba[j++] = 255;
    }
  } else return null; // 1bpp gris/masques : non gérés (rare)
  return rgba;
}

// Ré-encode une image pdfjs via canvas. Navigateur uniquement (OffscreenCanvas)
// - comme image-adapter.js ; strippe toute métadonnée au passage.
// Retourne { bytes, jpeg } ou null.
async function encodeImage(img) {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const srcW = img.width, srcH = img.height;
  if (!srcW || !srcH) return null;
  const scale = Math.min(1, MAX_IMG_DIM / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0, w, h); // navigateur : déjà décodé
  } else {
    const rgba = rawToRgba(img);
    if (!rgba) return null;
    const src = new OffscreenCanvas(srcW, srcH);
    src.getContext('2d').putImageData(new ImageData(rgba, srcW, srcH), 0, 0);
    ctx.drawImage(src, 0, 0, w, h);
  }

  // Jpeg pour les grandes images (photos/scans) : un PNG sans perte ferait
  // exploser le poids du PDF de sortie.
  //
  // Mais la taille n'est pas le bon critère seul - bug constaté à l'usage : le
  // fond transparent d'un PNG ressortait noir. Le seuil décidait sur les
  // dimensions, alors que ce qui compte est la présence d'un canal alpha. Un
  // canvas non peint vaut rgba(0,0,0,0) ; la conversion en jpeg supprime l'alpha
  // en gardant le RGB tel quel, donc (0,0,0) - du noir opaque partout où la
  // source était transparente. Toute image de plus de 128×128 était concernée,
  // c'est-à-dire presque toutes.
  //
  // On mesure donc la transparence au lieu de la déduire. Le surcoût en poids
  // quand une grande image est transparente est assumé : un aplat noir à la
  // place d'un logo est un défaut visible, quelques kilo-octets ne le sont pas.
  const pixels = ctx.getImageData(0, 0, w, h).data;
  const useJpeg = !aDeLaTransparence(pixels) && w * h > 128 * 128;
  const blob = await canvas.convertToBlob(useJpeg ? { type: 'image/jpeg', quality: 0.82 } : { type: 'image/png' });
  return { bytes: await blob.arrayBuffer(), jpeg: useJpeg };
}

// Un seul pixel non opaque suffit à interdire le jpeg (voir encodeImage).
// Exporté pour être testable en Node : `encodeImage` dépend d'OffscreenCanvas,
// donc du navigateur, et n'a jamais pu être couvert - c'est exactement pour ça
// que le bug a survécu.
export function aDeLaTransparence(rgba) {
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 255) return true;
  return false;
}

// Marge de sécurité à droite, en points : sous cette valeur on considère que le
// fragment touche le bord.
const MARGE_DROITE = 2;
// Plancher de réduction. En dessous, un fragment deviendrait illisible ; on
// préfère alors le laisser déborder plutôt que d'écrire en corps 2.
const REDUCTION_MIN = 0.45;

// Taille de police à laquelle un fragment tient dans la page.
//
// P7. Un placeholder est presque toujours plus long que la valeur qu'il
// remplace, et chaque fragment est redessiné à SA position d'origine : un
// fragment en fin de ligne finit hors page. Deux conséquences longtemps prises
// pour deux bugs : le texte déborde visuellement, et `getTextContent()` ne
// retourne pas les glyphes hors cadre - d'où les « placeholders tronqués »
// comptés à 422/4118 sur un mémoire, qui n'étaient pas coupés mais hors page.
//
// Vérifié en isolant pdf-lib et pdfjs : le même texte de 393 pt à x=40 ressort
// tronqué sur une page de 420 pt, intact sur 600.
//
// Réduire la taille le rend visible ET de nouveau extractible, donc restaure la
// réversibilité. Le 5e argument est une borne droite absolue, pas forcément le
// bord de page.
export function tailleQuiTient(font, texte, taille, x, borne) {
  const dispo = borne - x - MARGE_DROITE;
  if (dispo <= 0) return taille;
  const largeur = font.widthOfTextAtSize(texte, taille);
  if (largeur <= dispo) return taille;
  return Math.max(taille * (dispo / largeur), taille * REDUCTION_MIN);
}

// Écart en points sous lequel deux fragments sont réputés à la même hauteur.
const MEME_LIGNE = 2;

// Borne droite d'un fragment : le début du prochain fragment à la même hauteur,
// à défaut le bord de page.
//
// `tailleQuiTient` ne bornait qu'au bord de page, donc un placeholder plus long
// que la valeur remplacée restait dans la page mais mordait sur le voisin.
//
// La portée est la PAGE, pas le paragraphe : deux fragments à la même hauteur
// appartiennent souvent à des unités différentes (deux colonnes, un titre
// courant et un numéro de page). Une première version ne comparait qu'à
// l'intérieur d'une unité et laissait la colonne gauche mordre sur la droite.
//
// On ne cherche pas à reconstituer les lignes logiques, indécidable dans un
// PDF, et on n'en a pas besoin : seule compte la superposition géométrique.
//
// ON RÉTRÉCIT, on ne déplace pas : repousser le fragment suivant crée un autre
// chevauchement plus loin. Indexé par bande, sinon c'est quadratique.
export function calculerBornes(runs, textes, largeurPage) {
  const bandes = new Map();
  for (let i = 0; i < runs.length; i++) {
    if (!textes[i]) continue;
    const b = Math.round(runs[i].y / MEME_LIGNE);
    if (!bandes.has(b)) bandes.set(b, []);
    bandes.get(b).push(i);
  }

  return runs.map((run, i) => {
    if (!textes[i]) return largeurPage;
    let borne = largeurPage;
    const b = Math.round(run.y / MEME_LIGNE);
    for (const voisine of [b - 1, b, b + 1]) {
      for (const j of bandes.get(voisine) || []) {
        if (j === i) continue;
        if (Math.abs(runs[j].y - run.y) > MEME_LIGNE) continue;
        if (runs[j].x <= run.x) continue;
        if (runs[j].x < borne) borne = runs[j].x;
      }
    }
    return borne;
  });
}

// Ré-extrait la structure géométrique page par page (convention stateless ;
// buffer.slice(0) car pdfjs détache - cf. gotcha docs/notes-techniques.md).
async function parsePages(buffer, signal) {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false, isEvalSupported: false, disableFontFace: true,
    ...ressourcesPdfjs()
  }).promise;

  const pages = [];
  const intitulesVus = new Set();
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    // L'extraction d'un gros PDF est déjà longue avant la détection : sans
    // point de reprise ici, annuler pendant la lecture ne ferait rien de
    // visible pendant des dizaines de secondes.
    verifierAnnulation(signal);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const images = await extractImages(page);
    const allLines = groupIntoLines(textContent.items);
    const dominantSize = median(allLines.map(l => l.size));

    const units = [];
    let paraIdx = 0;
    for (const columnItems of splitIntoColumns(textContent.items)) {
      const lines = groupIntoLines(columnItems);
      // Relevé avant le regroupement, par la fonction partagée avec le chemin
      // Markdown. Les deux boucles étaient dupliquées « à l'identique » et ont
      // divergé dès la première évolution de la règle - deuxième occurrence de
      // la leçon P1bis. Ne pas la recopier ici.
      releverIntitules(lines, dominantSize, intitulesVus);
      for (const para of paragraphsWithParts(lines, dominantSize)) {
        const unit = paragraphToRuns(para, `page${pageNum}#para${paraIdx++}`);
        // Conservé pour `marquerIntitules` : c'est le garde-fou qui épargne le
        // nom en gros corps d'un CV.
        unit.isHeading = para.isHeading;
        units.push(unit);
      }
    }
    pages.push({ pageNum, width: viewport.width, height: viewport.height, units, images });
  }
  pages.intitules = intitulesRetenus(intitulesVus);
  return pages;
}

// Reconstruit un PDF anonymisé. deps.PDFDocument / deps.rgb / deps.StandardFonts
// injectés (pdf-lib). Options de détection identiques aux autres formats.
// Retourne { buffer: ArrayBuffer, mapping }.
export async function reconstructPdf(buffer, opts = {}) {
  const { PDFDocument, StandardFonts } = opts.deps;
  const { signal } = opts;
  // Compression de prompt, optionnelle. Reçoit les textes des fragments d'UNE
  // unité et rend la même liste, mots peu porteurs retirés. Injectée plutôt que
  // branchée ici : le modèle vit dans un worker, ce module reste testable.
  //
  // Elle s'applique après le masquage et avant le dessin - c'est le seul point
  // où l'on connaît à la fois le texte final et le fragment dont il provient.
  // Sans elle, l'option n'existerait que pour les sorties texte, ce qui la vide
  // de son sens : l'utilisateur veut moins de tokens dans le fichier qu'il
  // envoie réellement.
  const { compresserUnite } = opts;
  const pages = await parsePages(buffer, signal);

  // UNE seule passe de détection sur toutes les unités de toutes les pages
  // (placeholders cohérents inter-pages, comme les autres adaptateurs).
  // `marquerIntitules` travaille sur le document entier, pas page par page :
  // sa règle des « au moins deux » n'a de sens qu'à cette échelle.
  const allUnits = marquerIntitules(pages.flatMap(p => p.units))
    .map(u => ({ id: u.id, text: u.text, structurel: u.structurel }));
  const { results, mapping, entitesContextuelles } = await anonymizeUnits(allUnits, {
    nerPipeline: opts.nerPipeline,
    nerDetect: opts.nerDetect,
    onProgress: opts.onProgress,
    maskOpts: opts.maskOpts,
    forceTerms: opts.forceTerms,
    disabledTypes: opts.disabledTypes,
    keepValues: opts.keepValues,
    arbitre: opts.arbitre,
    intitules: pages.intitules,
    entitesConnues: opts.entitesConnues,
    signal
  });
  const entitiesById = new Map(results.map(r => [r.id, r.entities || []]));

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // Total d'unités, calculé d'avance : le crochet de compression est appelé une
  // fois par unité et n'a aucun moyen de connaître l'échelle. Sans elle, sa
  // barre de progression n'aurait rien à mesurer.
  const totalUnites = pages.reduce((n, p) => n + p.units.length, 0);
  let uniteFaite = 0;

  for (const page of pages) {
    // Le ré-encodage des images est le second poste long : il doit s'arrêter
    // aussi, sinon « Annuler » resterait sans effet visible sur un PDF illustré.
    verifierAnnulation(signal);
    const pdfPage = pdfDoc.addPage([page.width, page.height]);

    // Images d'abord (en fond), texte par-dessus. Encodage en parallèle (le
    // ré-encodage canvas est le poste coûteux), dessin ensuite dans l'ordre.
    // Défensif : une image qui échoue (format non géré, canvas absent en Node)
    // est ignorée sans interrompre la reconstruction du texte.
    const encoded = await Promise.all((page.images || []).map(async img => {
      try { return { img, enc: await encodeImage(img.bitmap) }; }
      catch { return { img, enc: null }; }
    }));
    for (const { img, enc } of encoded) {
      if (!enc) continue;
      try {
        const embedded = enc.jpeg ? await pdfDoc.embedJpg(enc.bytes) : await pdfDoc.embedPng(enc.bytes);
        pdfPage.drawImage(embedded, { x: img.x, y: img.y, width: img.w, height: img.h });
      } catch { /* image ignorée, jamais bloquant */ }
    }

    // Tous les fragments dessinables de la page sont rassemblés avant le
    // dessin : la borne d'un fragment dépend de ses voisins géométriques, qui
    // appartiennent souvent à une autre unité (colonnes, cellules d'un
    // tableau). Voir calculerBornes.
    const aDessiner = [];
    for (const unit of page.units) {
      const masked = distributeEntitiesOverRuns(unit.runs, entitiesById.get(unit.id) || []);
      let textes = unit.runs.map((run, i) =>
        run.draw ? sanitizeForWinAnsi(masked[i].text) : '');
      // L'unité entière est soumise d'un coup : le modèle décide au contexte, et
      // fragment par fragment il n'en aurait aucun.
      if (compresserUnite) {
        textes = await compresserUnite(textes, { fait: ++uniteFaite, total: totalUnites });
      }
      unit.runs.forEach((run, i) => {
        if (textes[i]) aDessiner.push({ run, texte: textes[i] });
      });
    }

    const bornes = calculerBornes(
      aDessiner.map(f => f.run), aDessiner.map(f => f.texte), page.width);
    aDessiner.forEach(({ run, texte }, i) => {
      try {
        const size = tailleQuiTient(font, texte, run.size, run.x, bornes[i]);
        pdfPage.drawText(texte, { x: run.x, y: run.y, size, font });
      } catch { /* fragment non dessinable : ignoré, jamais bloquant */ }
    });
  }

  const bytes = await pdfDoc.save();
  // `entitesContextuelles` remontée telle quelle : permet de régénérer le PDF
  // après un démasquage sans repayer la détection (voir anonymize-units.js).
  return {
    buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    mapping,
    entitesContextuelles
  };
}
