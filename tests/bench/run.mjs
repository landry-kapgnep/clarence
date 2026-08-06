// Banc d'essai — « à quelle distance sommes-nous d'une première version
// publiable ? », répondu en chiffres plutôt qu'à l'anecdote.
//
// Lancer :  npm run bench            (moteur complet, GLiNER réellement chargé)
//           npm run bench -- --regex (couche déterministe seule, rapide)
//
// POURQUOI CE BANC EXISTE. Les tests unitaires couvrent des fonctions pures ;
// ils étaient tous au vert pendant que le mode PDF « Garder la mise en page »
// plantait à l'ouverture, et pendant que la propagation ne franchissait pas la
// frontière du fichier réécrit (fuite P0). On mesurait ce qui est facile à
// mesurer, pas ce qui compte : est-ce qu'un fichier ressort propre ET encore
// exploitable.
//
// TROIS CRITÈRES, PAS UNE NOTE — c'est le point de conception central :
//  1. rappel STRUCTURÉ : exigence 100 %. Couche déterministe validée
//     mathématiquement, un raté est un bug, pas une limite ;
//  2. rappel CONTEXTUEL : mesuré et affiché, jamais promis (dépend d'un modèle) ;
//  3. UTILISABILITÉ : un document dont tout est masqué est « sûr » et inutile —
//     personne ne paie pour ça. Mesuré par les termes qui devaient survivre.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { detectRegex } from '../../src/engine/regex-detect.js';
import { detectPhonesIntl } from '../../src/engine/phone-intl.js';
import {
  detectGliner, GLINER_MODEL, TYPES_PEU_FIABLES, GLINER_VARIANTE, glinerModelUrl
} from '../../src/engine/gliner.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { selectActive, filterByRules, forcedMasks } from '../../src/engine/selection.js';
import { maskText } from '../../src/engine/masking.js';
import { anonymizeUnits } from '../../src/files/anonymize-units.js';
import { CORPUS } from './verite-terrain.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const REGEX_SEUL = process.argv.includes('--regex');

// Types produits par la couche DÉTERMINISTE (regex + validateurs). Un raté ici
// n'est jamais excusable : c'est ce sur quoi le produit peut promettre quelque
// chose. Le reste dépend d'un modèle statistique.
const TYPES_STRUCTURES = new Set([
  'EMAIL', 'TELEPHONE', 'IBAN', 'CARTE_BANCAIRE', 'NIR', 'SIRET_SIREN',
  'ID_NATIONAL', 'REFERENCE', 'CODE_POSTAL_VILLE', 'BIC', 'IP', 'MAC', 'PSEUDO'
]);

// --- Chargement du vrai moteur contextuel ---------------------------------
// Un banc qui tournerait sur un pipeline simulé ne mesurerait rien. On charge
// le modèle réellement embarqué, avec le MÊME correctif de découpeur que le
// worker de production (sans lui, la détection FR est silencieusement dégradée
// — voir le gotcha « GLiNER.js est cassé sur le français » dans CLAUDE.md).
const DECOUPEUR_UNICODE = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

async function chargerGliner() {
  // Pré-chargement du binding natif AVANT tout autre module natif : chargé
  // après, il échoue avec « The operating system cannot run %1 » sur Windows.
  // Piège déjà rencontré pendant les mesures GLiNER.
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const transformers = await import('@xenova/transformers');
  transformers.env.allowLocalModels = false;
  transformers.env.useBrowserCache = false;

  console.error(`[chargement de ${GLINER_MODEL}…]`);
  const instance = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: {
      modelPath: await modeleLocal(),
      executionProvider: 'cpu'
    },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level',
    maxWidth: 12
  });
  await instance.initialize();

  const decoupeur = instance?.model?.processor?.wordsSplitter;
  if (!decoupeur || !(decoupeur.whitespacePattern instanceof RegExp)) {
    throw new Error('GLiNER.js : découpeur introuvable — le banc mesurerait un moteur dégradé');
  }
  decoupeur.whitespacePattern = DECOUPEUR_UNICODE;
  console.error('[modèle prêt]');

  // MÊME regroupement en lots que la popup, et c'est délibéré : le banc doit
  // pouvoir prouver que grouper les inférences ne change PAS la détection.
  // Le rembourrage à la longueur du plus long texte du lot pourrait, en
  // théorie, déteindre sur les scores si le masque d'attention était imparfait.
  // C'est une hypothèse à vérifier, pas à supposer — d'où ce câblage.
  return createBatchedPipeline(async (textes, labels) => {
    const res = await instance.inference({ texts: textes, entities: labels, threshold: 0.05 });
    return textes.map((_, i) => res[i] || []);
  });
}

// Le modèle est mis en cache hors du dépôt et téléchargé une fois.
//
// La VARIANTE vient de src/engine/gliner.js, jamais codée en dur ici : le banc
// doit noter le modèle réellement livré. Quand la variante vivait dans main.js,
// le banc mesurait `quantized` pendant que la popup chargeait autre chose — une
// porte de qualité qui note un modèle qu'on n'expédie pas ne garantit rien.
// Le nom de fichier porte la variante, sinon on relirait le cache de l'ancienne.
async function modeleLocal() {
  const { existsSync, mkdirSync, writeFileSync } = await import('node:fs');
  const cache = join(here, '.modeles');
  const fichier = join(cache, `gliner_small-v2-${GLINER_VARIANTE}.onnx`);
  if (!existsSync(fichier)) {
    mkdirSync(cache, { recursive: true });
    const url = glinerModelUrl();
    console.error(`[téléchargement du modèle (variante ${GLINER_VARIANTE}), une seule fois…]`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`téléchargement du modèle : HTTP ${res.status}`);
    writeFileSync(fichier, Buffer.from(await res.arrayBuffer()));
  }
  return fichier;
}

// --- Passage d'un document dans le pipeline RÉEL --------------------------
// Le chemin fichier (CSV, PDF) passe par anonymizeUnits, exactement comme la
// popup : c'est là que vivaient les bugs qui n'apparaissaient pas en texte.
async function anonymiser(fichier, glinerPipe) {
  const chemin = join(here, 'corpus', fichier);
  const ext = extname(fichier).toLowerCase();
  // Le banc mesure ce qui est RÉELLEMENT LIVRÉ : les types que la popup
  // décoche par défaut (TYPES_PEU_FIABLES) ne doivent pas être mesurés comme
  // actifs, sinon le chiffre décrit un produit que personne n'utilise.
  const parDefaut = new Set(TYPES_PEU_FIABLES);
  const detecter = glinerPipe
    ? (t, _pipe, opts) => detectGliner(t, glinerPipe, { ...opts, disabledTypes: parDefaut })
    : async () => [];

  // PDF : on passe par la RECONSTRUCTION (« Garder la mise en page »), pas par
  // l'extraction Markdown. C'est délibéré et c'est le point le plus important
  // du banc : ce chemin réécrit le fichier à partir de la LISTE D'ENTITÉS, pas
  // de `maskedText`. C'est là que vivait la fuite P0 (une valeur rattrapée par
  // propagation restait en clair dans le fichier livré tout en apparaissant
  // masquée dans l'aperçu). Un banc qui lirait `maskedText` ne verrait jamais
  // cette classe de bug — donc il passerait à côté de sa raison d'être.
  // On relit ensuite le PDF produit : c'est ce que l'utilisateur reçoit.
  if (ext === '.pdf') {
    const { reconstructPdf } = await import('../../src/files/pdf-reconstruct.js');
    const { PDFDocument, StandardFonts } = await import('pdf-lib');
    const { buffer } = await reconstructPdf(new Uint8Array(readFileSync(chemin)).buffer, {
      nerPipeline: glinerPipe || null,
      nerDetect: detecter,
      deps: { PDFDocument, StandardFonts }
    });
    return await texteDuPdf(buffer);
  }

  if (ext === '.csv') {
    const adapter = await import('../../src/files/csv-adapter.js');
    const { units } = await adapter.extractTextUnits(readFileSync(chemin, 'utf8'));
    const { results } = await anonymizeUnits(units, {
      nerPipeline: glinerPipe || null,
      nerDetect: detecter
    });
    return results.map(r => r.maskedText).join('\n');
  }

  const texte = readFileSync(chemin, 'utf8');
  const rx = [...detectRegex(texte), ...detectPhonesIntl(texte)];
  const ner = glinerPipe ? await detectGliner(texte, glinerPipe, { disabledTypes: parDefaut }) : [];
  const actives = filterByRules(
    selectActive(mergeEntities(rx, ner), forcedMasks(texte, []), new Set()),
    {}
  );
  return maskText(texte, actives).masked;
}

// Relit le texte d'un PDF produit : on vérifie ce que l'utilisateur reçoit
// réellement, pas ce que le pipeline croit avoir écrit.
async function texteDuPdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    out += tc.items.map(it => it.str).join(' ') + '\n';
  }
  return out;
}

// Une valeur est « fuitée » si elle subsiste dans la sortie. Comparaison
// insensible à la casse ET aux espaces.
//
// Pourquoi insensible aux espaces : la reconstruction PDF dessine chaque
// fragment à sa position D'ORIGINE (limite de fidélité déjà documentée et
// acceptée) — un mot recollé par isLineWrapHyphen (« inno-» + « vante » →
// « innovante ») reste donc deux OBJETS TEXTE séparés dans le PDF final,
// à leurs positions de lignes respectives. Relu naïvement via
// `items.map(i=>i.str).join(' ')`, ça redonne « inno vante » — un faux
// négatif du BANC, pas une régression du produit (vérifié : le texte soumis
// à la détection contient bien « innovante » d'un seul tenant). Sans cette
// normalisation, le banc aurait crié au bug sur un correctif qui marche.
const normalise = s => s.toLowerCase().replace(/\s+/g, '');
const presente = (sortie, valeur) => normalise(sortie).includes(normalise(valeur));

// FUITE PARTIELLE — le trou que ce banc avait dans sa propre vérité terrain.
//
// Chercher la valeur ENTIÈRE ne suffit pas : « Amandine ROUSSEAU » comptait
// comme masquée alors que la sortie disait « Amandine [BIC_1] » — le prénom
// en clair trois fois dans le document, à côté du placeholder qui désigne son
// propre patronyme. Du point de vue de l'utilisateur c'est une fuite entière :
// dans un rapport de stage, un prénom accolé à un identifiant suffit
// largement à désigner la personne. Le banc affichait pourtant 100 %.
//
// Un nom est le seul type dont CHAQUE composant identifie séparément (un
// numéro tronqué, une adresse tronquée, non). On ne vérifie donc les
// composants que pour les PER — ailleurs, « rue » ou « des » déclencheraient
// des fausses alertes en cascade.
const PARTICULES = new Set([
  'de', 'du', 'des', 'la', 'le', 'van', 'von', 'da', 'di', 'bin', 'al',
  'monsieur', 'madame', 'mademoiselle', 'docteur', 'mr', 'mrs', 'miss', 'dr'
]);

function composantsIdentifiants(valeur) {
  return valeur
    .split(/[\s'’]+/)
    .filter(m => m.length >= 4 && !PARTICULES.has(m.toLowerCase()));
}

// Retourne les composants d'un nom restés en clair dans la sortie.
function fuitePartielle(sortie, entree) {
  if (entree.type !== 'PER') return [];
  const parts = composantsIdentifiants(entree.valeur);
  // Un nom d'un seul composant n'a pas de « partiel » : `presente` suffit.
  if (parts.length < 2) return [];
  return parts.filter(p => presente(sortie, p));
}

const pct = (n, d) => (d === 0 ? 100 : (n / d) * 100);
const fmt = v => `${v.toFixed(0)}%`.padStart(4);

async function main() {
  const glinerPipe = REGEX_SEUL ? null : await chargerGliner();
  console.log(`\nMoteur : ${REGEX_SEUL ? 'REGEX SEUL (--regex)' : 'regex + GLiNER'}\n`);

  const global = { struct: [0, 0], ctx: [0, 0], garde: [0, 0] };
  const fuitesStructurees = [];

  for (const doc of CORPUS) {
    const sortie = await anonymiser(doc.fichier, glinerPipe);

    // Une valeur est fuitée si elle subsiste ENTIÈRE, ou — pour un nom — si un
    // seul de ses composants reste en clair (voir fuitePartielle).
    const partielles = new Map();
    for (const v of doc.aMasquer) {
      // Si la valeur ENTIÈRE subsiste, ce n'est pas une fuite « partielle »
      // mais un raté complet — ne pas brouiller les deux dans l'affichage.
      if (presente(sortie, v.valeur)) continue;
      const restes = fuitePartielle(sortie, v);
      if (restes.length) partielles.set(v, restes);
    }
    const fuites = doc.aMasquer.filter(v => presente(sortie, v.valeur) || partielles.has(v));
    const struct = doc.aMasquer.filter(v => TYPES_STRUCTURES.has(v.type));
    const ctx = doc.aMasquer.filter(v => !TYPES_STRUCTURES.has(v.type));
    const fuitesStruct = fuites.filter(v => TYPES_STRUCTURES.has(v.type));
    const fuitesCtx = fuites.filter(v => !TYPES_STRUCTURES.has(v.type));
    const perdus = doc.aGarder.filter(t => !presente(sortie, t));

    global.struct[0] += struct.length - fuitesStruct.length;
    global.struct[1] += struct.length;
    global.ctx[0] += ctx.length - fuitesCtx.length;
    global.ctx[1] += ctx.length;
    global.garde[0] += doc.aGarder.length - perdus.length;
    global.garde[1] += doc.aGarder.length;
    fuitesStruct.forEach(v => fuitesStructurees.push(`${doc.fichier} → ${v.type} « ${v.valeur} »`));

    // Proportion du document remplacée par des placeholders : indicateur
    // d'utilisabilité (un document trop masqué n'apprend plus rien au LLM).
    const placeholders = (sortie.match(/\[[A-Z_]+_\d+\]/g) || []).length;
    const mots = sortie.split(/\s+/).filter(Boolean).length;

    console.log(`── ${doc.fichier}`);
    console.log(`   ${doc.quoi}`);
    console.log(`   structuré  ${fmt(pct(struct.length - fuitesStruct.length, struct.length))}` +
                `   contextuel ${fmt(pct(ctx.length - fuitesCtx.length, ctx.length))}` +
                `   préservé   ${fmt(pct(doc.aGarder.length - perdus.length, doc.aGarder.length))}` +
                `   (${placeholders} masques / ${mots} mots)`);
    for (const v of fuitesStruct) console.log(`   ✘ FUITE STRUCTURÉE  ${v.type} « ${v.valeur} »`);
    for (const v of fuitesCtx) {
      const restes = partielles.get(v);
      console.log(restes
        ? `   ✘ FUITE PARTIELLE   ${v.type} « ${v.valeur} » → en clair : ${restes.map(r => `« ${r} »`).join(', ')}`
        : `   ~ raté contextuel    ${v.type} « ${v.valeur} »`);
    }
    for (const t of perdus) console.log(`   ~ sur-masqué         « ${t} »`);
    console.log('');
  }

  const rStruct = pct(global.struct[0], global.struct[1]);
  const rCtx = pct(global.ctx[0], global.ctx[1]);
  const rGarde = pct(global.garde[0], global.garde[1]);

  console.log('═'.repeat(66));
  console.log(`  Rappel STRUCTURÉ    ${fmt(rStruct)}   (${global.struct[0]}/${global.struct[1]})   exigence : 100 %`);
  console.log(`  Rappel CONTEXTUEL   ${fmt(rCtx)}   (${global.ctx[0]}/${global.ctx[1]})   mesuré, jamais promis`);
  console.log(`  Termes PRÉSERVÉS    ${fmt(rGarde)}   (${global.garde[0]}/${global.garde[1]})   utilisabilité`);
  console.log('═'.repeat(66));

  if (rStruct < 100) {
    console.log('\n  ✘ NON PUBLIABLE — le déterministe laisse fuir. Ce sont des bugs, pas des limites :');
    fuitesStructurees.forEach(f => console.log(`      ${f}`));
  } else {
    console.log('\n  ✔ Aucune fuite sur le structuré.');
  }
  console.log(`\n  Rappel : ${CORPUS.length} documents synthétiques ne prédisent PAS le fichier d'un inconnu.`);
  console.log('  Ce banc empêche les régressions et donne un plancher — il ne remplace pas');
  console.log('  un test sur de vrais fichiers de gens qui ne sont pas nous.\n');
}

main().catch(e => { console.error('\nÉCHEC DU BANC :', e.message); process.exit(1); });
