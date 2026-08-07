// Adaptateur PDF → Markdown. Contrairement à CSV/XLSX/DOCX, la sortie n'est
// JAMAIS une réécriture du fichier d'origine : c'est un nouveau document texte
// (.md). Pas de problème de réinjection dans un format contraint (aucune
// redistribution sur des runs nécessaire) — le seul vrai risque est la
// fidélité de l'extraction, pas la réécriture.
//
// Worker pdfjs : en NAVIGATEUR, la v6 exige GlobalWorkerOptions.workerSrc
// (aucun repli automatique — vérifié en vrai Chrome, l'extension plantait) ;
// en Node (tests), elle s'en passe toute seule. On pointe donc vers le worker
// embarqué dans vendor/ (copié par build.mjs, comme les .wasm du NER)
// uniquement quand l'API d'extension existe. Local, CSP 'self', zéro code
// distant. Validé : le bundle esbuild ne contient ni eval() ni new Function().
//
// Limites assumées et documentées, jamais silencieuses :
// - PDF scanné (sans couche texte) → aucune unité extraite ; le garde-fou
//   générique de processFile() ("Aucun texte à analyser") s'applique déjà,
//   aucun code spécifique requis ici.
// - PDF chiffré/protégé → getDocument(...).promise rejette, remonte dans le
//   catch générique de processFile().
// - Mise en page multi-colonnes NON gérée : le regroupement par Y sur toute
//   la largeur de page mélangerait l'ordre de lecture des colonnes. Hors
//   scope v1, comme les zones de texte/notes pour DOCX à l'origine.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.mjs');
}

// Un écart vertical supérieur à ce multiple de la taille de police de la
// ligne précédente marque un nouveau paragraphe (ligne vide en Markdown) ;
// en dessous, c'est un simple retour à la ligne dans le même paragraphe.
//
// Ne sert plus que de REPLI : ce ratio compare l'écart à la taille de POLICE,
// alors que l'interligne est une propriété de la mise en page. Voir
// paragraphGapThreshold ci-dessous.
export const PARAGRAPH_GAP_RATIO = 1.6;
// Nombre d'écarts minimum pour que la médiane du document soit fiable.
const MIN_ECARTS_CALIBRAGE = 8;
// Au-delà de ce multiple de l'interligne du document, c'est un vrai saut de
// paragraphe. Mesuré, borné des DEUX côtés : à 1.5 la colonne droite du CV du
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
  // ce calcul fait pour nous — préféré quand disponible.
  return item.height || Math.abs(item.transform?.[3]) || 1;
}

// Faut-il un espace entre deux fragments consécutifs d'une même ligne ?
// pdfjs découpe parfois UN SEUL mot en plusieurs items (kerning, changement de
// fonte) : y insérer un espace systématiquement coupait le mot (« Semantikmatch »
// → « Sem antik... »), cassant la détection PII (fuite partielle) ET la
// lisibilité. On n'insère un espace que si l'écart horizontal réel dépasse un
// seuil relatif à la taille de police ; deux fragments collés = même mot.
export function needsSpace(a, b) {
  const gap = b.x - (a.x + (a.width || 0));
  return gap > Math.max(1, (a.size || 10) * 0.2);
}

// Une ligne qui se termine par un mot COUPÉ EN FIN DE LIGNE (typographie
// justifiée, fréquente dans une colonne étroite de CV) doit être RECOLLÉE à la
// ligne suivante, sans quoi le fragment isolé est soumis tel quel au modèle
// contextuel, qui l'étiquette avec confiance : constaté sur un vrai CV,
// « matisée » (fin d'« automatisée ») → donnée de santé à 0,70, « plicative »
// (fin d'« applicative ») → entreprise à 0,70 — AU-DESSUS du score du vrai nom
// du candidat sur ce même document (0,47). Ce n'est donc pas cosmétique : ça
// rend la détection contextuelle non fiable sur le document le plus sensible.
//
// Signal fiable pour distinguer ce cas d'un tiret de séparation ordinaire : un
// trait d'union COLLÉ à la dernière lettre, sans espace avant lui. Un tiret de
// séparation réel en français est toujours entouré d'espaces (« Anglais - C1 »,
// « Concours d'éloquence - Double lauréat ») — il ne déclenche donc jamais ce
// motif. On exige en plus que la ligne suivante commence par une minuscule :
// une vraie coupure de mot continue toujours en minuscule ; une nouvelle
// phrase ou un titre commencerait par une majuscule.
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
  // Seuil calibré sur l'interligne de CETTE colonne (voir paragraphGapThreshold).
  const seuilEcart = paragraphGapThreshold(lines, dominantSize);
  for (const line of lines) {
    const isHeading = line.size >= dominantSize * HEADING_SIZE_RATIO;
    const gap = prevY === null ? Infinity : prevY - line.y;
    // TENTÉ ET REJETÉ (06/08/2026) : couper le paragraphe sur un intitulé, pour
    // que `marquerIntitules` ait plus d'unités à épargner. Ça DOUBLE bien le
    // nombre d'unités neutralisées (6 → 16), mais le total masqué remonte
    // (69 → 70) et la composition empire : « Éléonore » et « Vaquier »
    // ressortent SEULS, « IBAN » et « Montant » deviennent des lieux. Découper
    // davantage fragmente le document, et la fragmentation PDF fait monter le
    // bruit au-dessus du signal (gotcha P1bis de CLAUDE.md). Ne pas retenter
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

// Seuil d'écart vertical au-delà duquel deux lignes appartiennent à des
// paragraphes DIFFÉRENTS — calibré sur le document lui-même.
//
// POURQUOI. Le seuil historique (`taille de police × 1.6`) mesurait la mauvaise
// grandeur : l'interligne dépend de la mise en page, pas du corps du texte. Sur
// un vrai mémoire en interligne 1,5 — police 11, écart réel 19,0 contre un
// seuil à 17,7 — CHAQUE LIGNE devenait un paragraphe. Conséquences mesurées sur
// 75 pages : 1 782 « paragraphes » de 91 caractères médians dont 52 % coupaient
// une phrase en cours, 8 088 placeholders (39 % du document masqué, articles
// compris) et 11 minutes de traitement. Le modèle recevait des demi-phrases
// sans contexte et étiquetait au hasard. Tout document en interligne 1,5 ou
// double était touché ; le corpus du banc, en interligne simple, ne pouvait pas
// le voir.
//
// COMMENT. La médiane des écarts d'une colonne EST son interligne (c'est la
// valeur la plus fréquente, les sauts de paragraphe étant minoritaires). On
// compare donc à elle.
//
// Deux garde-fous, chacun issu d'une mesure :
//  - `Math.max` avec l'ancien seuil : le seuil ne peut que CROÎTRE. Le
//    changement peut donc uniquement fusionner des lignes, jamais fragmenter
//    davantage qu'avant. Protège les pages à interligne irrégulier
//    (bibliographies, tableaux), où la médiane est basse et l'ancien repli
//    reprend la main.
//  - `MIN_ECARTS_CALIBRAGE` : sur peu de lignes la médiane tombe sur l'écart de
//    PARAGRAPHE au lieu de l'interligne. Mesuré sur tests/fixtures/echantillon.pdf
//    (4 et 2 écarts) : sans cette garde tout fusionnait en une seule unité.
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
// Heuristique GÉOMÉTRIQUE (donc testable sans le modèle) : on cherche une
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
  // les deux côtés substantiels — sinon c'est du mono-colonne mal aligné.
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
// entre extractTextUnits et applyMask — même convention que les 3 autres
// adaptateurs). Retourne une structure ordonnée par page puis paragraphe.
async function parseStructure(buffer) {
  // pdfjs-dist détache l'ArrayBuffer sous-jacent après le parsing (transfert
  // interne) — sans copie ici, un 2e appel sur le même buffer (extractTextUnits
  // PUIS applyMask, convention stateless commune aux 4 adaptateurs) plante
  // avec "Cannot perform Construct on a detached ArrayBuffer". slice(0) donne
  // à pdfjs une copie jetable, jamais l'original du caller.
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  }).promise;

  const units = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Taille dominante calculée sur TOUTE la page (référence stable pour la
    // détection de titre), avant le découpage en colonnes.
    const allLines = groupIntoLines(textContent.items);
    if (!allLines.length) continue;
    const dominantSize = median(allLines.map(l => l.size));

    // Chaque groupe de colonnes est regroupé en lignes PUIS paragraphes
    // séparément, et concaténé dans l'ordre de lecture (bande titre, gauche,
    // droite) — jamais de fusion d'une colonne à l'autre.
    let paraIndex = 0;
    for (const columnItems of splitIntoColumns(textContent.items)) {
      const lines = groupIntoLines(columnItems);
      if (!lines.length) continue;
      for (const p of groupIntoParagraphs(lines, dominantSize)) {
        units.push({ id: `page${pageNum}#para${paraIndex++}`, text: p.text, isHeading: p.isHeading });
      }
    }
  }
  return units;
}

// INTITULÉS DE SECTION — reconnus à leur PLACE, jamais à leur sens.
//
// LE PROBLÈME. Soumis seuls, « SOMMAIRE », « COMPÉTENCES », « LANGUES »
// sortent du modèle en ENTREPRISE ou LIEU avec des scores élevés (0,50 à 0,79
// mesurés) — au-dessus de vraies entités. Résultat : un CV dont les titres de
// rubrique sont maquillés en placeholders, illisible pour le LLM.
//
// CE QUI NE MARCHE PAS, et qui a été mesuré avant d'en arriver ici :
//  - monter le seuil : les faux positifs sortent AU-DESSUS des vrais ;
//  - des labels leurres (« titre de section », « métier ») : 6 cas sur 21 ;
//  - reposer la question en « nom propre / nom commun » : GLiNER EXTRAIT des
//    entités, il ne CLASSE pas — il répond « nom propre » à tout, et son score
//    est même anti-corrélé (les faux positifs sortent plus haut que les vrais) ;
//  - la fertilité du tokenizer : fuit sur Ali, Kim, Anna, Rose, Petit, Lille.
// Les quatre jugent le mot ISOLÉ. Or un humain reconnaît un intitulé à sa
// position dans la page, pas au mot lui-même.
//
// LA RÈGLE. Cinq conditions, toutes déterministes :
//  (1) PAS un titre en gros corps — c'est le garde-fou essentiel : le nom en
//      tête d'un CV en est un (« ÉLÉONORE VASSEUR » corps 21 contre corps 8
//      des rubriques), et il DOIT rester masqué ;
//  (2) court : 3 mots au plus ;
//  (3) aucune ponctuation de phrase ;
//  (4) entièrement en capitales ;
//  (5) le document en contient AU MOINS DEUX — un motif de mise en page, pas
//      un mot isolé qu'on écarterait par accident.
//
// CE QUE ÇA NE DÉSACTIVE PAS. `structurel` ne saute que la passe CONTEXTUELLE :
// `detectRegex` tourne sur le document combiné entier. Une ligne « BIC :
// AGRIFRPP882 » attrapée par la règle reste donc protégée par le déterministe.
//
// RISQUE ASSUMÉ, mesuré nul sur tout le corpus mais réel : un nom en capitales
// dans le corps du texte (bloc de signature, liste d'auteurs) ne serait plus
// masqué automatiquement. Le profil d'identité et « toujours masquer » le
// forcent toujours, eux.
const PONCTUATION_PHRASE = /[.!?,;]/;

export function ressembleAUnIntitule(texte) {
  const t = (texte || '').trim();
  if (!t || PONCTUATION_PHRASE.test(t)) return false;
  if (t.split(/\s+/).length > 3) return false;
  if (!/\p{L}/u.test(t)) return false;
  return t === t.toUpperCase();
}

// Marque `structurel` les unités qui forment le squelette du document.
// Partagé par les DEUX chemins PDF (Markdown et reconstruction) : ils ont déjà
// divergé une fois sur le découpage (leçon P1bis).
export function marquerIntitules(units) {
  const candidats = units.filter(u => !u.isHeading && ressembleAUnIntitule(u.text));
  if (candidats.length < 2) return units;
  for (const u of candidats) u.structurel = true;
  return units;
}

// { units: [{id, text, structurel?}] } — `isHeading` n'est pas exposé (interface
// commune aux 4 adaptateurs), applyMask le re-dérive via parseStructure.
export async function extractTextUnits(buffer) {
  const structured = marquerIntitules(await parseStructure(buffer));
  return { units: structured.map(({ id, text, structurel }) => ({ id, text, structurel })) };
}

// resultsById : Map<id, { maskedText }>. Ignore le buffer PDF d'origine pour
// la RÉÉCRITURE (jamais réutilisé comme contenant) mais le ré-analyse pour
// retrouver la structure (ordre, titres) — repli sur le texte original si une
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
