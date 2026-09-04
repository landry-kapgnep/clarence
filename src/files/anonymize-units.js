// Orchestrateur partagé par les 3 adaptateurs (CSV/XLSX/DOCX) : traite tout
// un fichier comme UN document virtuel pour que maskText assigne des
// placeholders cohérents partout — le LLM doit pouvoir suivre la même personne
// d'un bout à l'autre du fichier. Jamais un appel par cellule/paragraphe
// isolé, qui numéroterait les placeholders au hasard d'une unité à l'autre
// pour une même valeur répétée.
import { detectRegex } from '../engine/regex-detect.js';
import { detectPhonesIntl } from '../engine/phone-intl.js';
import { detectNER } from '../engine/ner.js';
import { mergeEntities } from '../engine/merge.js';
import { selectActive, forcedMasks, filterByRules } from '../engine/selection.js';
import { maskText, propagatedSpans } from '../engine/masking.js';
import { verifierAnnulation } from '../engine/annulation.js';

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
// d'exemple de référence dans docs/notes-techniques.md : « 1988-03-14 » seul sort à 0,59,
// au-dessus du seuil. Le modèle savait le faire ; on ne le lui demandait pas.
// Le banc le comptait comme un raté du modèle — c'était un raté du filtre.
function meriteUnePasseContextuelle(text) {
  return /\p{L}{2}/u.test(text) || DATE_NUE.test(text);
}

// Unités lancées DE FRONT. Elles ne sont pas traitées en parallèle par le
// modèle — c'est le regroupement en lots (src/engine/batch.js) qui a besoin
// d'appels concurrents pour avoir quelque chose à rassembler. Sans vague, la
// boucle `await` séquentielle ne présente jamais qu'un seul texte à la fois et
// le lot reste de taille 1.
//
// Chaque unité peut engendrer plusieurs appels (une passe par groupe de
// labels) : une vague de 24 alimente donc des lots confortables sans faire
// enfler la mémoire.
const VAGUE = 24;

async function detectNerPerUnit(units, ranges, nerPipeline, onProgress, detect, disabledTypes, signal, intitules = new Set()) {
  // Le cache mémorise la PROMESSE, pas le résultat : deux unités au texte
  // identique lancées dans la même vague se partagent une seule inférence.
  // Avec la valeur résolue, elles rateraient toutes les deux le cache et
  // paieraient deux fois.
  const cache = new Map();
  // Résultats rangés PAR INDICE puis aplatis dans l'ordre : la concurrence ne
  // doit pas rendre l'ordre de sortie dépendant de l'ordonnancement. Un ordre
  // instable changerait l'issue des chevauchements en aval, donc le masquage.
  const parUnite = new Array(units.length);
  let faits = 0;

  for (let debut = 0; debut < units.length; debut += VAGUE) {
    // Point de reprise : une vague est l'unité de travail la plus fine qu'on
    // puisse interrompre proprement (les inférences d'un lot déjà parti vont au
    // bout, mais aucune nouvelle n'est lancée).
    verifierAnnulation(signal);
    const fin = Math.min(debut + VAGUE, units.length);
    const vague = [];

    for (let i = debut; i < fin; i++) {
      const { text, structurel } = units[i];
      if (structurel || !meriteUnePasseContextuelle(text)) continue;
      if (!cache.has(text)) cache.set(text, detect(text, nerPipeline, { disabledTypes }));
      const indice = i;
      vague.push(cache.get(text).then(entites => {
        const base = ranges[indice].start;
        parUnite[indice] = entites
          // INTITULÉ NOYÉ DANS UN PARAGRAPHE. « SOMMAIRE » recollé au texte qui
          // suit n'est plus une unité à lui seul, donc `structurel` ne peut plus
          // l'épargner — mais il reste EN TÊTE de son unité. Deux conditions,
          // toutes deux nécessaires :
          //   - l'entité commence à l'offset 0 de l'unité : un nom cité en plein
          //     texte n'est jamais concerné ;
          //   - sa valeur est EXACTEMENT un intitulé relevé : on n'emporte pas
          //     les mots voisins (« ÉTAT CIVIL Née » ≠ « ÉTAT CIVIL », donc
          //     conservé).
          .filter(e => !(e.start === 0 && intitules.has(e.value)))
          .map(e => ({ ...e, start: e.start + base, end: e.end + base }));
      }));
    }

    await Promise.all(vague);

    // La progression avance par vague, pas par unité : rendre la main entre
    // chaque unité n'aurait plus de sens puisqu'elles avancent ensemble.
    faits = fin;
    if (onProgress) await onProgress({ done: faits, total: units.length });
  }

  const out = [];
  for (const entites of parUnite) if (entites) out.push(...entites);
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
// signal (optionnel) : AbortSignal. Un traitement abandonné doit s'ARRÊTER, pas
// seulement voir son résultat ignoré — sinon il continue d'occuper le modèle et
// le run suivant attend derrière lui (voir src/engine/annulation.js).
export async function anonymizeUnits(units, { nerPipeline, nerDetect, maskOpts, forceTerms, disabledTypes, keepValues, onProgress, signal, arbitre, intitules, entitesConnues } = {}) {
  const nonEmpty = units.filter(u => u.text.length > 0);
  const { combined, ranges } = joinWithSentinel(nonEmpty);

  // Structuré = regex FR + téléphones internationaux (libphonenumber).
  const regexEntities = [...detectRegex(combined), ...detectPhonesIntl(combined)];

  // `entitesConnues` : sortie contextuelle d'un appel PRÉCÉDENT sur les MÊMES
  // unités. Fournie, elle court-circuite entièrement la détection.
  //
  // À quoi ça sert : régénérer le fichier quand l'utilisateur retire un masque
  // depuis la table de correspondance. Sans ça, décocher « ChatGPT » relancerait
  // 45 secondes d'inférence pour un résultat que le modèle a déjà donné — et le
  // geste cesserait d'être utilisable.
  //
  // Les offsets sont absolus dans `combined`, qui ne dépend que de `units` :
  // tant que les unités sont identiques, les entités restent valides. Le jour
  // où l'appelant changerait les unités, il ne doit PAS repasser ce cache.
  let nerEntities;
  if (entitesConnues) {
    nerEntities = entitesConnues;
  } else {
    nerEntities = nerPipeline
      ? await detectNerPerUnit(nonEmpty, ranges, nerPipeline, onProgress, nerDetect || detectNER, disabledTypes, signal, new Set(intitules || []))
      : [];

    // `arbitre` (optionnel) : seconde opinion sur les entités que le modèle
    // vient de proposer, pour écarter « Analyste », « Poste occupé » et
    // consorts. Injecté par l'appelant plutôt que branché ici, parce qu'il est
    // propre à GLiNER : le moteur BERT de repli n'a pas de labels à
    // interroger. Appliqué AVANT la fusion, donc uniquement au contextuel — le
    // déterministe n'est jamais soumis à l'avis d'un modèle.
    //
    // Il reçoit AUSSI le texte complet du document. Le filtre de précision qui
    // s'y branche pèse des caractéristiques qui n'existent qu'à cette échelle —
    // combien de fois la valeur revient, si ses mots apparaissent ailleurs en
    // minuscules — et qui seraient toutes nulles sur une unité isolée. Les
    // arbitres qui n'en ont pas besoin ignorent simplement l'argument.
    if (arbitre && nerEntities.length) {
      verifierAnnulation(signal);
      nerEntities = await arbitre(nerEntities, combined);
    }
  }
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

  // `entitesContextuelles` est rendue pour que l'appelant puisse REJOUER le
  // masquage sans repayer la détection (voir `entitesConnues` plus haut).
  return { results: [...results, ...emptyResults], mapping, entitesContextuelles: nerEntities };
}
