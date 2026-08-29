// FILTRE DE PRÉCISION, étape 1 — fabriquer le jeu d'entraînement.
//
//     node tools/filtre/construire-jeu.mjs [nbDocuments] > jeu.jsonl
//
// LA SUBTILITÉ QUI DÉCIDE DE TOUT. On n'entraîne PAS sur les entités de
// référence du corpus : ça apprendrait à reconnaître une entité, ce que le
// modèle sait déjà faire. On entraîne sur LES CANDIDATS QUE NOTRE DÉTECTEUR
// PRODUIT RÉELLEMENT, chacun étiqueté vrai/faux par comparaison aux spans
// connus par construction. L'objectif n'est pas la détection : c'est de
// reconnaître LES ERREURS DE NOTRE PROPRE DÉTECTEUR.
//
// D'où trois exigences de fidélité, qui font la valeur de ce script :
//   1. le vrai modèle, la vraie variante de poids, le vrai découpeur corrigé —
//      exactement comme le banc (un pipeline simulé ne mesurerait rien) ;
//   2. la détection UNITÉ PAR UNITÉ, comme `anonymizeUnits` en production, et
//      pas sur le document entier (mesuré : le texte combiné perd les noms) ;
//   3. l'ARBITRE passe AVANT nous, comme en production. Sans ça, le filtre
//      apprendrait à écarter des faux positifs que l'arbitre a déjà retirés,
//      et surestimerait son propre apport.
//
// DES DOCUMENTS, PAS DES LIGNES. Deux des caractéristiques les plus utiles —
// combien de fois la valeur revient, et si ses mots apparaissent ailleurs en
// minuscules — n'existent qu'à l'échelle du document. Une ligne isolée les
// rendrait toutes les deux nulles, et le filtre s'entraînerait sur un signal
// qu'il ne verrait jamais en production.
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ligne, GABARITS, SECTIONS_PAR_DOC } from '../corpus/generer.mjs';
import {
  detectGliner, GLINER_MODEL, GLINER_VARIANTE, glinerModelUrl,
  TYPES_PEU_FIABLES, arbitrerFauxPositifs
} from '../../src/engine/gliner.js';
import { createBatchedPipeline } from '../../src/engine/batch.js';
import { contexteDocument, vecteur, NOMS_CARACTERISTIQUES } from '../../src/engine/caracteristiques.js';

const ici = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ici, '..', '..');
const DECOUPEUR_UNICODE = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;

// Le vocabulaire de sous-mots sert à mesurer la fragmentation. Il est OPTIONNEL
// et hors dépôt : s'il manque, la caractéristique vaut 0 partout et
// l'entraînement le dira (poids nul). C'est justement la question qu'on veut
// trancher — vaut-elle le mégaoctet qu'elle coûterait à embarquer ?
function chargerSousMots() {
  const chemin = join(RACINE, 'tools', 'llmlingua2-onnx', 'vocab.txt');
  if (!existsSync(chemin)) {
    console.error('[vocab.txt absent — fragmentation mesurée à 0, voir tools/filtre/README.md]');
    return null;
  }
  const v = new Set(readFileSync(chemin, 'utf8').split('\n').map(l => l.trim()).filter(Boolean));
  console.error(`[vocabulaire de sous-mots : ${v.size} entrées]`);
  return v;
}

// --- Le vrai moteur, chargé comme au banc ---------------------------------
async function chargerGliner() {
  await import('onnxruntime-node');
  const { Gliner } = await import('gliner/node');
  const transformers = await import('@xenova/transformers');
  transformers.env.allowLocalModels = false;
  transformers.env.useBrowserCache = false;

  const cache = join(RACINE, 'tests', 'bench', '.modeles');
  const fichier = join(cache, `gliner_small-v2-${GLINER_VARIANTE}.onnx`);
  if (!existsSync(fichier)) {
    mkdirSync(cache, { recursive: true });
    console.error(`[téléchargement du modèle (${GLINER_VARIANTE})…]`);
    const res = await fetch(glinerModelUrl());
    if (!res.ok) throw new Error(`téléchargement : HTTP ${res.status}`);
    writeFileSync(fichier, Buffer.from(await res.arrayBuffer()));
  }

  console.error(`[chargement de ${GLINER_MODEL}…]`);
  const instance = new Gliner({
    tokenizerPath: GLINER_MODEL,
    onnxSettings: { modelPath: fichier, executionProvider: 'cpu' },
    transformersSettings: { allowLocalModels: false, useBrowserCache: false },
    modelType: 'span-level', maxWidth: 12
  });
  await instance.initialize();

  // MÊME garde-fou qu'au banc : sans le découpeur corrigé, la détection
  // française est silencieusement dégradée et le jeu apprendrait sur un moteur
  // qui n'est pas celui qu'on livre.
  const decoupeur = instance?.model?.processor?.wordsSplitter;
  if (!decoupeur || !(decoupeur.whitespacePattern instanceof RegExp)) {
    throw new Error('GLiNER.js : découpeur introuvable — le jeu porterait sur un moteur dégradé');
  }
  decoupeur.whitespacePattern = DECOUPEUR_UNICODE;
  console.error('[modèle prêt]');

  return createBatchedPipeline(async (textes, labels) => {
    const res = await instance.inference({ texts: textes, entities: labels, threshold: 0.05 });
    return textes.map((_, i) => res[i] || []);
  });
}

// --- Fabrication d'un document synthétique --------------------------------
//
// Un document = plusieurs lignes d'UN MÊME type (un CV a des sections de CV).
// Les gabarits viennent du générateur committé, jamais réécrits ici : deux
// jeux de gabarits divergeraient, et on entraînerait sur autre chose que ce
// qu'on croit.
const tirer = (a) => a[Math.floor(Math.random() * a.length)];

// ⚠️ LE PRÉFIXE « [SECTION] » EST RETIRÉ, et c'est un point de fidélité, pas un
// détail. Le générateur le pose parce que l'affinage de GLiNER (phase 3) en a
// besoin — forme choisie par mesure. Mais l'inférence D'AUJOURD'HUI ne préfixe
// rien : un intitulé y est une unité à part, marquée `structurel` et épargnée
// par la passe contextuelle. Le garder ferait apprendre au filtre des faux
// positifs que l'utilisateur ne rencontre jamais (« EXPÉRIENCES
// PROFESSIONNELLES » pris pour une entreprise) et fausserait tous les chiffres.
function document() {
  const type = tirer(Object.keys(SECTIONS_PAR_DOC));
  const sections = SECTIONS_PAR_DOC[type];
  const nb = 6 + Math.floor(Math.random() * 10);
  const unites = [];
  for (let i = 0; i < nb; i++) {
    const section = tirer(sections);
    const l = ligne(section, tirer(GABARITS[section]));
    const d = l.prefixeLongueur;
    unites.push({
      texte: l.texte.slice(d),
      spans: l.spans.map(sp => ({ ...sp, start: sp.start - d, end: sp.end - d }))
    });
  }
  // Garde-fou : après décalage, chaque span doit encore se relire EXACTEMENT.
  // Un décalage silencieux étiquetterait le jeu à côté, et rien ne le dirait —
  // même raisonnement que le garde-fou d'alignement du générateur.
  for (const u of unites) {
    for (const sp of u.spans) {
      if (u.texte.slice(sp.start, sp.end) !== sp.valeur) {
        throw new Error('span décalé après retrait du préfixe : '
          + `« ${u.texte.slice(sp.start, sp.end)} » au lieu de « ${sp.valeur} »`);
      }
    }
  }
  return { type, unites, texte: unites.map(u => u.texte).join('\n') };
}

// --- Étiquetage -----------------------------------------------------------
//
// Un candidat est VRAI s'il recouvre une entité réellement placée par le
// générateur. On accepte le recouvrement partiel : « Fontaine » proposé sur
// « Rose Fontaine » reste une vraie détection (frontière imparfaite, pas faux
// positif) — un critère d'égalité stricte compterait comme erreurs des cas où
// le masquage protège bel et bien la donnée.
//
// ⚠️ N'IMPORTE QUEL TYPE D'ENTITÉ COMPTE, pas seulement celui du candidat. Ce
// qui est jugé n'est pas « le modèle a-t-il trouvé la bonne étiquette ? » mais
// « faut-il masquer ici ? ». Un nom vu comme ENTREPRISE reste masqué, donc
// protégé ; le filtre ne doit surtout pas apprendre à le retirer. Une première
// version ne retenait que PER/ORG/LOC et étiquetait donc « faux » un candidat
// posé sur un e-mail ou une date de naissance — lui apprenant à démasquer.
const TYPES_CANDIDATS = new Set(['PER', 'ORG', 'LOC']);

function estVrai(candidat, spans) {
  return spans.some(s => candidat.start < s.end && candidat.end > s.start);
}

// --- Programme ------------------------------------------------------------
const nbDocs = Number(process.argv[2]) || 200;
const sousMots = chargerSousMots();
const pipe = await chargerGliner();
const desactives = new Set(TYPES_PEU_FIABLES);

const stats = { docs: 0, candidats: 0, vrais: 0, faux: 0, parType: {} };
const debut = Date.now();

for (let d = 0; d < nbDocs; d++) {
  const doc = document();
  const ctx = contexteDocument(doc.texte, { sousMots });

  // Détection unité par unité, comme en production.
  let candidats = [];
  for (const u of doc.unites) {
    const trouves = await detectGliner(u.texte, pipe, { disabledTypes: desactives });
    for (const e of trouves) candidats.push({ ...e, spans: u.spans });
  }

  // L'arbitre passe AVANT nous, exactement comme dans anonymizeUnits.
  const apresArbitre = await arbitrerFauxPositifs(candidats, pipe);

  for (const c of apresArbitre) {
    if (!TYPES_CANDIDATS.has(c.type)) continue;
    const y = estVrai(c, c.spans) ? 1 : 0;
    stats.candidats++;
    stats[y ? 'vrais' : 'faux']++;
    (stats.parType[c.type] ||= { vrais: 0, faux: 0 })[y ? 'vrais' : 'faux']++;
    process.stdout.write(JSON.stringify({
      type: c.type,
      valeur: c.value,
      y,
      x: vecteur(c, ctx)
    }) + '\n');
  }

  stats.docs++;
  if (stats.docs % 10 === 0) {
    const s = (Date.now() - debut) / 1000;
    console.error(`  ${stats.docs}/${nbDocs} documents · ${stats.candidats} candidats `
      + `(${stats.faux} faux) · ${s.toFixed(0)} s`);
  }
}

console.error(`\n${stats.docs} documents · ${stats.candidats} candidats `
  + `· ${stats.vrais} vrais / ${stats.faux} faux`);
for (const [t, v] of Object.entries(stats.parType)) {
  const total = v.vrais + v.faux;
  console.error(`  ${t.padEnd(4)} ${String(total).padStart(5)} candidats · `
    + `${((v.faux / total) * 100).toFixed(1)} % de faux positifs`);
}
console.error(`caractéristiques : ${NOMS_CARACTERISTIQUES.join(', ')}`);
