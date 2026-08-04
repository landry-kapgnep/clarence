// Orchestrateur partagé par les 3 adaptateurs (CSV/XLSX/DOCX) : traite tout
// un fichier comme UN document virtuel pour que maskText assigne des
// placeholders cohérents partout (voir docs/cadrage-mvp.md §4) — jamais un
// appel par cellule/paragraphe isolé, qui numéroterait les placeholders au
// hasard d'une unité à l'autre pour une même valeur répétée.
import { detectRegex } from '../engine/regex-detect.js';
import { detectPhonesIntl } from '../engine/phone-intl.js';
import { detectNER } from '../engine/ner.js';
import { mergeEntities } from '../engine/merge.js';
import { selectActive, forcedMasks, filterByRules } from '../engine/selection.js';
import { maskText, propagatedSpans } from '../engine/masking.js';

// Séparateur entre unités : caractères de la zone d'usage privé Unicode,
// jamais présents dans un vrai document, encadrés de retours à la ligne.
// Frontière dure qu'aucune entité ni propagation de maskText ne franchit,
// donc masked.split(UNIT_SEP) retrouve exactement le texte de chaque unité.
// Les retours à la ligne donnent en plus une frontière visible au tokenizer du
// modèle (les caractères de zone privée, eux, sont ignorés par lui : sans eux
// les unités lui apparaissent collées). NB : cela n'a PAS suffi à corriger les
// noms ratés en tête d'unité — la vraie cause était le fenêtrage de détection,
// voir detectNerPerUnit ci-dessous.
export const UNIT_SEP = '\n\u{E000}\u{E004}\u{E000}\n';

// Détection NER unité par unité, et NON sur le texte combiné.
//
// Mesuré sur un vrai CV (38 unités) : le texte combiné donnait 7 entités et
// AUCUN nom de personne, alors que le même modèle détecte parfaitement le nom
// quand l'unité est isolée. Par unité : 22 entités, nom trouvé, pour seulement
// +24 % de temps. Un contexte propre vaut mieux qu'une grande fenêtre — testé
// aussi en lots de 150/300/600 caractères : tous échouaient à trouver le nom.
// (Le masquage, lui, reste fait sur le texte combiné : c'est de là que vient
// la cohérence des placeholders, indépendamment de la détection.)
//
// Deux garde-fous pour les fichiers à nombreuses cellules (CSV/XLSX), où un
// appel par cellule serait prohibitif :
//  - unités sans aucune suite de 2 lettres (nombres, dates, codes) : ignorées ;
//  - textes identiques (valeurs répétées d'une colonne) : détectés une seule fois.
// `structurel` : champ OPTIONNEL que les adaptateurs peuvent poser sur une
// unité qui décrit la STRUCTURE du document (en-tête de colonne, ligne de
// sommaire) plutôt que son contenu. Une telle unité est épargnée par la passe
// contextuelle.
//
// Sans ça, le modèle confond « la case qui S'APPELLE Date de naissance » avec
// « une case qui CONTIENT une date de naissance » : le libellé ressemble
// presque mot pour mot à la catégorie cherchée, donc il sort à un score élevé.
// Mesuré au banc sur un export RH : 43 masques pour 62 mots, en-têtes
// (Matricule, Service, Salaire) masqués — fichier « sûr » et illisible.
//
// La couche DÉTERMINISTE continue de tourner sur TOUT le document : un en-tête
// qui contiendrait par accident un email ou un IBAN reste masqué.
//
// ── PISTE TESTÉE ET REJETÉE, ne pas la refaire : donner le libellé de colonne
// comme CONTEXTE à la cellule (« Date de naissance : 1988-03-14 ») dégrade la
// détection au lieu de l'aider, parce que le libellé capte l'attention du
// modèle à la place de la valeur. Mesuré :
//     « EMP-0012 » seul                       → entreprise 0,57  (masqué)
//     « Matricule : EMP-0012 »                → entreprise 0,32  (FUITE)
//     « 1988-03-14 » seul                     → date de naissance 0,59 (masqué)
//     « Date de naissance : 1988-03-14 »      → 0,74 sur le LIBELLÉ, 0,15 sur
//                                               la vraie date (FUITE)
// L'isolement de la cellule est donc un ATOUT du zero-shot, pas un manque.
// Date nue, sans le moindre mot autour : 1988-03-14, 14/03/1988, 1988/03/14.
const DATE_NUE = /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/;

// Faut-il payer une inférence sur cette unité ?
//
// Le garde-fou d'origine exigeait DEUX LETTRES consécutives — pensé pour ne pas
// payer une passe modèle sur les milliers de cellules numériques d'un CSV. Il
// avait un angle mort grave : une cellule contenant UNIQUEMENT une date de
// naissance n'a aucune lettre, donc elle n'était JAMAIS soumise au modèle.
//
// C'est précisément le cas que le zero-shot est censé débloquer, et qui sert
// d'exemple de référence dans CLAUDE.md : « 1988-03-14 » seul sort à 0,59,
// au-dessus du seuil. Le modèle savait le faire ; on ne le lui demandait pas.
// Le banc le comptait comme un raté du modèle — c'était un raté du filtre.
function meriteUnePasseContextuelle(text) {
  return /\p{L}{2}/u.test(text) || DATE_NUE.test(text);
}

async function detectNerPerUnit(units, ranges, nerPipeline, onProgress, detect, disabledTypes) {
  const out = [];
  const cache = new Map();
  for (let i = 0; i < units.length; i++) {
    const { text, structurel } = units[i];
    if (!structurel && meriteUnePasseContextuelle(text)) {
      if (!cache.has(text)) cache.set(text, await detect(text, nerPipeline, { disabledTypes }));
      const base = ranges[i].start;
      for (const e of cache.get(text)) {
        out.push({ ...e, start: e.start + base, end: e.end + base });
      }
    }
    if (onProgress) await onProgress({ done: i + 1, total: units.length });
  }
  return out;
}

function joinWithSentinel(units) {
  let combined = '';
  const ranges = [];
  for (const u of units) {
    if (u.text.includes(UNIT_SEP)) {
      throw new Error(`anonymizeUnits : le texte de l'unité "${u.id}" contient déjà le séparateur interne réservé`);
    }
    const start = combined.length;
    combined += u.text;
    ranges.push({ id: u.id, start, end: combined.length });
    combined += UNIT_SEP;
  }
  return { combined, ranges };
}

// units : [{ id, text }].
//
// Retourne { results, mapping } :
// - results : [{ id, text, maskedText, entities }] dans l'ordre d'entrée.
//   `entities` : offsets LOCAUX à l'unité + placeholder — utile à DOCX qui
//   doit redistribuer sur des runs ; CSV/XLSX n'utilisent que `maskedText`.
// - mapping : table de correspondance complète, identique à celle de maskText.
//
// Limite connue et assumée : `entities` ne couvre que les valeurs
// explicitement détectées (regex/NER) sur le document combiné — PAS les
// répétitions rattrapées uniquement par la propagation de maskText (elle,
// bien incluse dans `maskedText`). Sans impact pour CSV/XLSX ; pour DOCX,
// une répétition non détectée dans SON PROPRE paragraphe pourrait ne pas
// être masquée dans le fichier réécrit — limite documentée, pas cachée.
// Options de règles personnalisées (mêmes primitives que le mode texte,
// voir selection.js — logique zéro tolérance partagée, jamais dupliquée) :
// - forceTerms    : termes « toujours masquer » (recherche littérale, toutes occurrences) ;
// - disabledTypes : Set de types que l'utilisateur choisit de NE PAS masquer ;
// - keepValues    : valeurs « ne jamais masquer » (les masques forcés restent intouchables).
// onProgress (optionnel) : transmis à detectNER, pour afficher l'avancement
// (le NER est le poste long — voir commentaire dans ner.js).
export async function anonymizeUnits(units, { nerPipeline, nerDetect, maskOpts, forceTerms, disabledTypes, keepValues, onProgress } = {}) {
  const nonEmpty = units.filter(u => u.text.length > 0);
  const { combined, ranges } = joinWithSentinel(nonEmpty);

  // Structuré = regex FR + téléphones internationaux (libphonenumber).
  const regexEntities = [...detectRegex(combined), ...detectPhonesIntl(combined)];
  const nerEntities = nerPipeline
    ? await detectNerPerUnit(nonEmpty, ranges, nerPipeline, onProgress, nerDetect || detectNER, disabledTypes)
    : [];
  const forced = forcedMasks(combined, forceTerms || []);
  const selected = selectActive(mergeEntities(regexEntities, nerEntities), forced, new Set());
  const active = filterByRules(selected, {
    disabledTypes: disabledTypes || new Set(),
    keepValues: keepValues || []
  });
  const { masked, mapping } = maskText(combined, active, maskOpts);

  const placeholderByEntity = new Map(mapping.map(m => [`${m.type}|${m.value}`, m.placeholder]));
  const entitiesByUnitId = new Map(ranges.map(r => [r.id, []]));
  for (const e of active) {
    const range = ranges.find(r => e.start >= r.start && e.end <= r.end);
    if (!range) continue; // défensif : ne devrait jamais arriver (séparateur infranchissable)
    entitiesByUnitId.get(range.id).push({
      start: e.start - range.start,
      end: e.end - range.start,
      placeholder: placeholderByEntity.get(`${e.type}|${e.value}`)
    });
  }

  // Complément INDISPENSABLE : les occurrences rattrapées par la propagation.
  // Les adaptateurs qui réécrivent un fichier (PDF reconstruit, DOCX) partent
  // de cette liste d'entités, PAS de maskedText. Sans ce complément, une valeur
  // détectée dans une unité mais répétée sans contexte dans une autre restait
  // EN CLAIR dans le fichier produit, tout en apparaissant masquée dans
  // l'aperçu — divergence constatée sur un vrai rapport de stage (nom du
  // tuteur masqué page 5, en clair page 1). C'était la limite « connue et
  // assumée » documentée ici ; elle ne l'est plus, parce que c'est une fuite.
  for (let i = 0; i < nonEmpty.length; i++) {
    const dejaVues = entitiesByUnitId.get(ranges[i].id);
    for (const s of propagatedSpans(nonEmpty[i].text, mapping, dejaVues)) {
      dejaVues.push(s);
    }
    dejaVues.sort((a, b) => a.start - b.start);
  }

  const maskedParts = masked.split(UNIT_SEP);
  const results = nonEmpty.map((u, i) => ({
    id: u.id,
    text: u.text,
    maskedText: maskedParts[i],
    entities: entitiesByUnitId.get(u.id)
  }));

  const emptyResults = units
    .filter(u => u.text.length === 0)
    .map(u => ({ id: u.id, text: u.text, maskedText: u.text, entities: [] }));

  return { results: [...results, ...emptyResults], mapping };
}
