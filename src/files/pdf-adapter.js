// Adaptateur PDF → Markdown. La sortie n'est jamais une réécriture du fichier
// d'origine mais un nouveau document texte, donc pas de redistribution sur des
// runs : le seul vrai risque est la fidélité de l'extraction.
//
// En navigateur, pdfjs v6 exige `GlobalWorkerOptions.workerSrc` sans repli
// (vérifié en vrai Chrome, l'extension plantait) ; en Node il s'en passe. On
// pointe donc vers le worker de vendor/ uniquement quand l'API d'extension
// existe. Local, CSP 'self', zéro code distant.
//
// Limites assumées : un PDF scanné ne rend aucune unité (le garde-fou de
// processFile s'applique), un PDF chiffré fait rejeter getDocument, et la mise
// en page multi-colonnes n'est pas gérée ici - le regroupement par Y sur toute
// la largeur mélangerait l'ordre de lecture.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configuration pdfjs, en un seul endroit. Les deux chemins PDF (Markdown et
// reconstruction) la faisaient chacun de leur côté ; c'est le motif qui a déjà
// divergé une fois dans ce projet (leçon P1bis, deux fois payée). Fonctions
// partagées appelées par les deux, plutôt qu'un effet de bord d'import dont
// l'ordre déciderait du résultat.
export function configurerPdfjs() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.mjs');
}
configurerPdfjs();

// ── Ressources externes de pdfjs ───────────────────────────────────────────
//
// pdfjs va chercher quatre familles de ressources par URL, sans repli en
// navigateur. `workerSrc` est la seule qui plante bruyamment, les autres
// dégradent en silence.
//
// Elles ne vont PAS sur `GlobalWorkerOptions`, qui n'accepte que `workerSrc` et
// `workerPort` : ce sont des paramètres de `getDocument()`. Erreur commise ici,
// et rien ne signalait que la valeur partait à la poubelle.
//
//   standard_fonts/  sans elles pdfjs mesure mal la largeur des glyphes, dont
//                    dépendent `tailleQuiTient` et `calculerBornes`
//   cmaps/           encodages CID, PDF asiatiques
//   iccs/            profils colorimétriques
//   wasm/            décodeurs JBIG2 / jpeg2000, sinon une image de PDF scanné
//                    ne se décode pas
//
// En Node on pointe vers node_modules, pour que le banc mesure les mêmes
// largeurs que le navigateur. Et pdfjs y lit le disque : il lui faut un chemin
// de fichier, pas une URL `file://`.
function racineNode() {
  return decodeURIComponent(new URL('../../node_modules/pdfjs-dist/', import.meta.url).pathname)
    .replace(/^\/([A-Za-z]:)/, '$1');
}

export function ressourcesPdfjs() {
  // La barre oblique finale n'est PAS optionnelle : pdfjs concatène le nom de
  // fichier directement derrière.
  const base = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
    ? (d) => chrome.runtime.getURL(`vendor/${d}/`)
    : (d) => `${racineNode()}${d}/`;
  return {
    standardFontDataUrl: base('standard_fonts'),
    cMapUrl: base('cmaps'),
    cMapPacked: true,           // pdfjs-dist livre des .bcmap compressés
    iccUrl: base('iccs'),
    wasmUrl: base('wasm'),
  };
}

// Un écart vertical supérieur à ce multiple de la taille de police de la
// ligne précédente marque un nouveau paragraphe (ligne vide en Markdown) ;
// en dessous, c'est un simple retour à la ligne dans le même paragraphe.
//
// Ne sert plus que de repli : ce ratio compare l'écart à la taille de police,
// alors que l'interligne est une propriété de la mise en page. Voir
// paragraphGapThreshold ci-dessous.
export const PARAGRAPH_GAP_RATIO = 1.6;
// Nombre d'écarts minimum pour que la médiane du document soit fiable.
const MIN_ECARTS_CALIBRAGE = 8;
// Au-delà de ce multiple de l'interligne du document, c'est un vrai saut de
// paragraphe. Mesuré, borné des deux côtés : à 1.5 la colonne droite du CV du
// banc s'effondre de 6 à 2 unités (médiane 369 caractères), ce qui est
// exactement la régression déjà mesurée dans anonymize-units.js en groupant
// les unités. Ne pas monter sans re-mesurer sur cv-fr.pdf.
const ECART_PARAGRAPHE_RATIO = 1.3;
// Une ligne dont la police dépasse ce ratio par rapport à la taille
// dominante de la page est traitée comme un titre (heuristique best-effort,
// jamais bloquante si elle se trompe).
export const HEADING_SIZE_RATIO = 1.3;

function fontSizeOf(item) {
  // item.transform = [a,b,c,d,e,f] ; pour du texte non pivoté, |d| donne la
  // taille de police effective. item.height (si fourni par pdfjs) est déjà
  // ce calcul fait pour nous - préféré quand disponible.
  return item.height || Math.abs(item.transform?.[3]) || 1;
}

// Faut-il un espace entre deux fragments consécutifs d'une même ligne ?
// pdfjs découpe parfois un seul mot en plusieurs items (kerning, changement de
// fonte) : y insérer un espace systématiquement coupait le mot (« Semantikmatch »
// → « Sem antik... »), cassant la détection PII (fuite partielle) ET la
// lisibilité. On n'insère un espace que si l'écart horizontal réel dépasse un
// seuil relatif à la taille de police ; deux fragments collés = même mot.
export function needsSpace(a, b) {
  const gap = b.x - (a.x + (a.width || 0));
  return gap > Math.max(1, (a.size || 10) * 0.2);
}

// Recolle un mot coupé en fin de ligne. Un fragment isolé par la césure est
// soumis tel quel au modèle, qui l'étiquette avec confiance AU-DESSUS du vrai
// nom du candidat. Chiffres : docs/roadmap-detection.md, annexe.
//
// Signal retenu : trait d'union collé à la dernière lettre, sans espace avant,
// et ligne suivante commençant par une minuscule. Un tiret de séparation
// français est toujours entouré d'espaces (« Anglais - C1 »), il ne déclenche
// donc jamais ce motif.
const FIN_DE_MOT_COUPE = /\p{L}-$/u;
export function isLineWrapHyphen(texteAvant, texteApres) {
  return FIN_DE_MOT_COUPE.test(texteAvant) && /^\p{Ll}/u.test(texteApres);
}

function joinParts(parts) {
  let out = '';
  parts.forEach((p, i) => {
    if (i > 0 && needsSpace(parts[i - 1], p)) out += ' ';
    out += p.str;
  });
  return out.replace(/\s+/g, ' ').trim();
}

// Regroupe les items d'une page en lignes (par coordonnée Y, tolérance 3px),
// triées par X, avec jointure sensible aux écarts (voir needsSpace).
export function groupIntoLines(items) {
  const lines = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < 3);
    if (!line) { line = { y, parts: [] }; lines.push(line); }
    line.parts.push({ x: item.transform[4], y, str: item.str, size: fontSizeOf(item), width: item.width || 0 });
  }
  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => {
    const parts = [...l.parts].sort((a, b) => a.x - b.x);
    return {
      y: l.y,
      // parts exposé pour la reconstruction PDF (pdf-reconstruct.js) : dessiner
      // chaque fragment à sa position. Le chemin Markdown, lui, n'utilise que text.
      parts,
      text: joinParts(parts),
      // Taille dominante de la ligne : la plus fréquente parmi ses fragments.
      size: parts.map(p => p.size).sort((a, b) => a - b)[Math.floor(parts.length / 2)]
    };
  }).filter(l => l.text.length > 0);
}

// Regroupe les lignes d'une page en paragraphes, avec détection de titre.
function groupIntoParagraphs(lines, dominantSize) {
  const paragraphs = [];
  let current = null;
  let prevY = null;
  // Seuil calibré sur l'interligne de cette colonne (voir paragraphGapThreshold).
  const seuilEcart = paragraphGapThreshold(lines, dominantSize);
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    // Tenté et rejeté (06/08/2026) : couper le paragraphe sur un intitulé, pour
    // que `marquerIntitules` ait plus d'unités à épargner. Ça double bien le
    // nombre d'unités neutralisées (6 → 16), mais le total masqué remonte
    // (69 → 70) et la composition empire : « Éléonore » et « Vaquier »
    // ressortent seuls, « IBAN » et « Montant » deviennent des lieux. Découper
    // davantage fragmente le document, et la fragmentation PDF fait monter le
    // bruit au-dessus du signal (gotcha P1bis de docs/notes-techniques.md). Ne pas retenter
    // sans re-mesurer CE chiffre.
    const isNewParagraph = isHeading || !current ||
      current.isHeading !== isHeading ||
      gap > seuilEcart;
    if (isNewParagraph) {
      current = { text: line.text, isHeading };
      paragraphs.push(current);
    } else if (isLineWrapHyphen(current.text, line.text)) {
      current.text = current.text.slice(0, -1) + line.text; // retire le trait d'union collé
    } else {
      current.text += ' ' + line.text;
    }
    prevY = line.y;
  }
  return paragraphs;
}

export function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] || 11;
}

// Seuil d'écart vertical entre deux paragraphes, calibré sur le document.
//
// L'ancien seuil (police × 1.6) mesurait la mauvaise grandeur : l'interligne
// dépend de la mise en page, pas du corps. Sur un mémoire en interligne 1,5,
// chaque ligne devenait un paragraphe. Mesuré sur 75 pages : 1 782 unités de
// 91 caractères dont 52 % coupaient une phrase, 8 088 placeholders et 11
// minutes. Le corpus du banc, en interligne simple, ne pouvait pas le voir.
//
// La médiane des écarts d'une colonne EST son interligne. On compare à elle.
//
// Deux garde-fous : `Math.max` avec l'ancien seuil, qui ne peut donc que
// CROÎTRE (le changement fusionne, il ne fragmente jamais plus qu'avant) ; et
// `MIN_ECARTS_CALIBRAGE`, parce que sur peu de lignes la médiane tombe sur
// l'écart de paragraphe et tout fusionnait en une seule unité.
export function paragraphGapThreshold(lines, dominantSize) {
  const repli = dominantSize * PARAGRAPH_GAP_RATIO;
  const ecarts = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].y - lines[i].y;
    if (gap > 0) ecarts.push(gap);
  }
  if (ecarts.length < MIN_ECARTS_CALIBRAGE) return repli;
  return Math.max(median(ecarts) * ECART_PARAGRAPHE_RATIO, repli);
}

// Détection de mise en page à 2 colonnes (fréquent sur les CV/rapports). Sans
// elle, le regroupement par Y fusionne la colonne gauche et droite sur la même
// ligne → charabia illisible ET contexte incohérent qui sabote le NER.
// Heuristique géométrique (donc testable sans le modèle) : on cherche une
// gouttière verticale au centre que peu d'items franchissent.
// Retourne un tableau ORDONNÉ de groupes d'items en ordre de lecture :
//  - mono-colonne → [tousLesItems] ;
//  - bi-colonne   → [bandePleineLargeur (titre), colonneGauche, colonneDroite].
// Limite assumée : ne gère que 1 ou 2 colonnes (3+ colonnes très rares).
export function splitIntoColumns(items) {
  const withGeom = items.filter(i => i.str && i.str.trim()).map(i => ({
    item: i, x: i.transform[4], w: i.width || 0
  }));
  if (withGeom.length < 8) return [items]; // trop peu pour trancher : mono-colonne

  const pageMinX = Math.min(...withGeom.map(g => g.x));
  const pageMaxX = Math.max(...withGeom.map(g => g.x + g.w));
  const pageWidth = pageMaxX - pageMinX;
  if (pageWidth <= 0) return [items];
  const gutter = pageMinX + pageWidth / 2;

  // Un item "pleine largeur" (titre, bandeau) traverse largement la gouttière :
  // on le sort des colonnes pour le garder en tête, à sa place verticale.
  const fullWidth = withGeom.filter(g => g.w >= pageWidth * 0.55);
  const columnItems = withGeom.filter(g => g.w < pageWidth * 0.55);
  const crossing = columnItems.filter(g => g.x < gutter && g.x + g.w > gutter);
  const left = columnItems.filter(g => g.x + g.w / 2 < gutter);
  const right = columnItems.filter(g => g.x + g.w / 2 >= gutter);

  // 2 colonnes seulement si la gouttière est nette (peu de franchissements) et
  // les deux côtés substantiels - sinon c'est du mono-colonne mal aligné.
  const isTwoColumn = columnItems.length >= 8 &&
    crossing.length / columnItems.length < 0.1 &&
    left.length >= 4 && right.length >= 4;

  if (!isTwoColumn) return [items];
  return [
    fullWidth.map(g => g.item),
    left.map(g => g.item),
    right.map(g => g.item)
  ].filter(group => group.length > 0);
}

// Ré-extrait tout depuis les octets bruts à chaque appel (aucun état partagé
// entre extractTextUnits et applyMask - même convention que les 3 autres
// adaptateurs). Retourne une structure ordonnée par page puis paragraphe.
async function parseStructure(buffer) {
  // pdfjs-dist détache l'ArrayBuffer sous-jacent après le parsing (transfert
  // interne) - sans copie ici, un 2e appel sur le même buffer (extractTextUnits
  // Puis applyMask, convention stateless commune aux 4 adaptateurs) plante
  // avec "Cannot perform Construct on a detached ArrayBuffer". slice(0) donne
  // à pdfjs une copie jetable, jamais l'original du caller.
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    ...ressourcesPdfjs()
  }).promise;

  const units = [];
  // Intitulés repérés au niveau de la ligne, avant le regroupement en
  // paragraphes - voir `relevesDesIntitules` pour le pourquoi.
  const intitules = new Set();
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Taille dominante calculée sur toute la page (référence stable pour la
    // détection de titre), avant le découpage en colonnes.
    const allLines = groupIntoLines(textContent.items);
    if (!allLines.length) continue;
    const dominantSize = median(allLines.map(l => l.size));

    // Chaque groupe de colonnes est regroupé en lignes puis paragraphes
    // séparément, et concaténé dans l'ordre de lecture (bande titre, gauche,
    // droite) - jamais de fusion d'une colonne à l'autre.
    let paraIndex = 0;
    for (const columnItems of splitIntoColumns(textContent.items)) {
      const lines = groupIntoLines(columnItems);
      if (!lines.length) continue;
      // Relevé avant le regroupement : c'est tout l'objet du mécanisme.
      releverIntitules(lines, dominantSize, intitules);
      for (const p of groupIntoParagraphs(lines, dominantSize)) {
        units.push({ id: `page${pageNum}#para${paraIndex++}`, text: p.text, isHeading: p.isHeading });
      }
    }
  }
  units.intitules = intitulesRetenus(intitules);
  return units;
}

// Intitulés de section, reconnus à leur PLACE et jamais à leur sens.
//
// Soumis seuls, « SOMMAIRE » ou « COMPÉTENCES » sortent en ENTREPRISE ou LIEU
// entre 0,50 et 0,79, au-dessus de vraies entités. Quatre approches lexicales
// ont été mesurées et échouent : elles jugent le mot isolé, alors qu'un humain
// reconnaît un intitulé à sa position.
//
// Cinq conditions déterministes : (1) pas un titre en gros corps, garde-fou
// essentiel puisque le nom en tête d'un CV en est un ; (2) trois mots au plus ;
// (3) aucune ponctuation de phrase ; (4) tout en capitales ; (5) le document en
// contient au moins deux, donc c'est un motif de mise en page.
//
// `structurel` ne saute que la passe contextuelle, `detectRegex` tourne partout.
// Risque assumé, mesuré nul : un nom en capitales dans un bloc de signature ne
// serait plus masqué automatiquement.
const PONCTUATION_PHRASE = /[.!?,;:]/;

// Un numéro de rubrique final est légitime (« ANNEXE 2 ») ; des chiffres
// ailleurs trahissent un identifiant (« EMP-0012 »).
//
// Deux chiffres au plus, et c'est un test qui l'a imposé : sans cette borne,
// « TEL 0612345678 » voyait son numéro pris pour une numérotation de section et
// passait pour un intitulé. Une section va rarement au-delà de 99 ; un
// identifiant, presque toujours.
const NUMERO_DE_RUBRIQUE = /\s+\d{1,2}$/;

export function ressembleAUnIntitule(texte) {
  const t = (texte || '').trim();
  if (!t || PONCTUATION_PHRASE.test(t)) return false;
  if (t.split(/\s+/).length > 3) return false;
  if (!/\p{L}/u.test(t)) return false;
  // Aucun chiffre hors numéro de rubrique final : un intitulé ne porte pas de
  // matricule. « ANNEXE 2 » reste accepté, « EMP-0012 » est écarté.
  if (/\d/.test(t.replace(NUMERO_DE_RUBRIQUE, ''))) return false;
  return t === t.toUpperCase();
}

// Ce que `marquerIntitules` ne peut pas résoudre seul.
//
// Il n'épargne une unité que si l'unité ENTIÈRE est un intitulé. Or
// `groupIntoParagraphs` recolle souvent l'intitulé au texte suivant :
// « SOMMAIRE » devient le début de « SOMMAIRE Introduction et contexte… ».
// Mesure : 6 unités épargnées, et SOMMAIRE, ANNEXE, COORDONNÉES, SPRACHEN
// restaient masqués.
//
// Couper le paragraphe sur un intitulé a été essayé et rejeté : 6 → 16 unités
// épargnées, mais le total masqué remonte (69 → 70) et la composition empire
// (« Éléonore » et « Vaquier » ressortent seuls). Fragmenter davantage fait
// monter le bruit au-dessus du signal (P1bis).
//
// On relève donc les lignes qui ressemblent à un intitulé AVANT le
// regroupement, sans toucher au découpage, et on transmet la liste à l'aval.
// Seules les entités qui tombent exactement sur un intitulé, en tête de leur
// unité, sont écartées. La double condition est le garde-fou : « en tête »
// interdit d'écarter un nom en plein texte, « exactement » interdit d'emporter
// les mots voisins.
const RUBRIQUE_TITRE = /^(\p{Lu}{3,})(\s+\d{1,2})?\s*[—–-]\s+\p{L}/u;

export function formesDeRubrique(texte) {
  const m = RUBRIQUE_TITRE.exec((texte || '').trim());
  if (!m) return [];
  return m[2] ? [m[1], `${m[1]}${m[2]}`] : [m[1]];
}

// Le relevé, en un seul endroit. Les deux chemins PDF (Markdown et
// reconstruction) le faisaient chacun de leur côté, à l'identique - et ont
// aussitôt divergé dès qu'on a touché à la règle : le mot de rubrique n'existait
// que du côté Markdown, donc le mode « Préserver » continuait de masquer
// « ANNEXE » pendant que l'autre l'épargnait. Même leçon que P1bis, deuxième
// occurrence. Une seule fonction, appelée des deux côtés.
export function releverIntitules(lines, dominantSize, dans = new Set()) {
  for (const l of lines) {
    const titre = l.size >= dominantSize * HEADING_SIZE_RATIO;
    if (!titre) {
      if (ressembleAUnIntitule(l.text)) dans.add(l.text.trim());
      continue;
    }
    // Ligne qui EST un titre : on ne relève que son mot de rubrique, jamais la
    // ligne entière - voir formesDeRubrique pour le contre-exemple qui interdit
    // d'épargner les titres en bloc.
    for (const forme of formesDeRubrique(l.text)) dans.add(forme);
  }
  return dans;
}

export function intitulesRetenus(candidats) {
  // Même règle des « au moins deux » que marquerIntitules : un mot isolé en
  // capitales n'est pas un motif de mise en page, et pourrait être un patronyme.
  return candidats.size >= 2 ? [...candidats] : [];
}

// Marque `structurel` les unités qui forment le squelette du document.
// Partagé par les deux chemins PDF (Markdown et reconstruction) : ils ont déjà
// divergé une fois sur le découpage (leçon P1bis).
export function marquerIntitules(units) {
  const candidats = units.filter(u => !u.isHeading && ressembleAUnIntitule(u.text));
  if (candidats.length < 2) return units;
  for (const u of candidats) u.structurel = true;
  return units;
}

// { units: [{id, text, structurel?}] } - `isHeading` n'est pas exposé (interface
// commune aux 4 adaptateurs), applyMask le re-dérive via parseStructure.
export async function extractTextUnits(buffer) {
  const structured = await parseStructure(buffer);
  marquerIntitules(structured);
  return {
    units: structured.map(({ id, text, structurel }) => ({ id, text, structurel })),
    // Transmis à anonymizeUnits : permet d'écarter un intitulé même quand le
    // regroupement l'a noyé dans un paragraphe plus long.
    intitules: structured.intitules || []
  };
}

// resultsById : Map<id, { maskedText }>. Ignore le buffer PDF d'origine pour
// la réécriture (jamais réutilisé comme contenant) mais le ré-analyse pour
// retrouver la structure (ordre, titres) - repli sur le texte original si une
// unité est absente de resultsById (ne devrait pas arriver en usage normal).
export async function applyMask(buffer, resultsById) {
  const structured = await parseStructure(buffer);
  return structured
    .map(u => {
      const text = resultsById.get(u.id)?.maskedText ?? u.text;
      return u.isHeading ? `## ${text}` : text;
    })
    .join('\n\n');
}

// Pas de métadonnées à nettoyer : la sortie est un texte neuf, rien du PDF
// d'origine n'est jamais transporté dedans.
export function stripMetadata(markdown) {
  return markdown;
}
