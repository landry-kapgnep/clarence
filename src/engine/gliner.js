// Détection contextuelle par ner zero-shot (GLiNER).
//
// Différence de fond avec ner.js : le modèle BERT a 4 catégories figées
// (PER/ORG/LOC/MISC) apprises à l'entraînement. GLiNER reçoit les catégories
// cherchées au moment de l'appel, en langage courant. Conséquence directe :
// il sait qualifier une valeur isolée, sans phrase autour - une cellule de
// tableau, un nom en tête de CV - ce qu'aucune catégorie figée ni aucun motif
// à mot-clé de contexte ne peut faire (mesuré : « Kowalski » seul → 0,93 ;
// « 1988-03-14 » seul → date de naissance 0,59).
//
// Contrat de sortie identique à detectNER : tout l'aval (merge, selection,
// masking) est donc inchangé et les deux moteurs sont interchangeables.
import { chunkText, snapToWordBoundaries, bridgeNameParts } from './ner.js';
import { estVocabulaireCourant } from './vocabulaire.js';

export const GLINER_MODEL = 'onnx-community/gliner_small-v2';

// VARIANTE DE POIDS - ici et nulle part ailleurs, parce que le banc doit noter
// le modèle réellement livré. Tant que la variante vivait dans main.js, le banc
// mesurait `quantized` pendant que la popup chargeait autre chose : la porte de
// qualité notait un modèle qu'on n'expédiait pas.
//
// Mesuré sur un mémoire réel de 75 pages, en vrai Chrome, une variable à la
// fois (voir docs/verification-chrome.md §A0) :
//   quantized (int8) + wasm   → 5 min 45
//   quantized (int8) + webgpu → 5 min 36  (aucun gain : le fournisseur WebGPU
//                                          d'ORT supporte mal l'int8, la
//                                          plupart des nœuds retombent en CPU)
//   fp16 + webgpu             → 2 min 01  (×2,8 - le GPU sert enfin)
//
// Le fp16 pèse 292 Mo au lieu de 175 : le surcoût est payé UNE fois (Cache
// API), le gain à chaque document. Arbitrage tranché par la mesure.
export const VARIANTES_MODELE = {
  quantized: 'model_quantized.onnx',  // 175 Mo, int8
  fp16: 'model_fp16.onnx',            // 292 Mo - défaut
  fp32: 'model.onnx'                  // 583 Mo
};
export const GLINER_VARIANTE = 'fp16';

export const glinerModelUrl = (variante = GLINER_VARIANTE) =>
  `https://huggingface.co/${GLINER_MODEL}/resolve/main/onnx/${VARIANTES_MODELE[variante]}`;

// Seuil par défaut, calé sur les fixtures propres : au-dessus du pire faux
// positif observé et sous la plus faible vraie valeur à conserver (la cellule
// de date nue, 0,59). Chaque groupe peut le surcharger - voir GROUPES.
export const GLINER_THRESHOLD = 0.5;

// GROUPES DE LABELS DISJOINTS - le point le moins intuitif de ce module.
//
// Les labels se concurrencent à l'intérieur d'un même appel : mesuré sur nos
// fixtures, passer de 3 à 10 labels fait tomber « Semantikmatch » de 0,85 à
// 0,45 et « Rose Fontaine » de 0,61 à 0,25, tout en faisant monter le bruit
// (le garde-fou « zéro faux positif » sortait alors « point » à 0,43 et
// « roadmap technique » à 0,40). Un jeu large en une passe dégrade donc
// activement la détection - contre-intuitif, mais reproductible.
//
// D'où trois passes à groupes disjoints, qui conservent chacune leurs scores
// hauts ET laissent le garde-fou à zéro. Le surcoût est celui de l'encodage du
// texte, pas des labels : ~8 ms par passe sur une unité courte.
//
// Ne pas fusionner ces groupes « pour aller plus vite » sans re-mesurer.
export const GROUPES = [
  {
    // Le cœur : ce que le NER BERT couvrait, en mieux sur les valeurs isolées.
    //
    // UN SEUIL APPARTIENT À UNE VARIANTE DE POIDS. Le 0,38 calibré en int8
    // faisait tomber le préservé de 98 à 93 % une fois passé en fp16. Changer
    // de variante sans rebalayer, c'est troquer de la qualité contre de la
    // vitesse sans s'en apercevoir.
    //
    // 0,46 est le plus bas d'un plateau, donc le plus détectant à qualité
    // égale. Balayage complet et le cas à revérifier avant de descendre :
    // docs/roadmap-detection.md, annexe.
    seuil: 0.46,
    labels: ['person', 'company', 'location'],
    types: { person: 'PER', company: 'ORG', location: 'LOC' },
    // Voir `pertinent` plus bas : un texte sans la moindre majuscule ne peut
    // produire aucun nom propre, donc aucune entité de ce groupe.
    pertinent: t => /\p{Lu}/u.test(t)
  },
  {
    // Seul : associé à d'autres labels il perd sa précision, et « address »
    // faisait monter le bruit du garde-fou à 0,47 (trop près du seuil).
    // Les adresses restent couvertes par le motif ADRESSE, déterministe.
    labels: ['date of birth'],
    types: { 'date of birth': 'DATE_NAISSANCE' },
    // Une date porte toujours au moins l'année : sans chiffre, rien à trouver.
    // 65 % des unités d'un vrai mémoire sont dans ce cas - 54 % du texte.
    pertinent: t => /\d/.test(t)
  },
  {
    // Catégories sensibles au sens RGPD (santé, origine) + contexte pro.
    // Vérifié : zéro faux positif sur les 3 fixtures ET sur une ligne de
    // stack technique (« React, Docker, Prisma… »).
    labels: ['job title', 'nationality', 'school', 'medical condition'],
    types: {
      'job title': 'POSTE',
      nationality: 'NATIONALITE',
      school: 'ETABLISSEMENT',
      'medical condition': 'SANTE'
    }
  }
];

// Types que le modèle ne détecte PAS de façon fiable : proposés dans l'UI mais
// décochés par défaut. Mesuré sur un compte rendu RH :
//
//   « diabète de type 2 »   → job title          0,04
//   « aide-soignante »      → medical condition  0,08
//   « portugaise »          → nationalité        0,02
//   « suivi psychologique » → donnée de santé    0,28
//
// Types que le modèle ne détecte PAS de façon fiable : proposés dans l'UI mais
// décochés par défaut.
//
// Il inverse poste et donnée de santé en français, et place les vraies valeurs
// entre 0,02 et 0,31, très en dessous du plancher de bruit. Aucun seuil ne les
// sépare. Désactivés, le rappel est inchangé et le préservé monte de 93 à 96 %.
//
// Les laisser actifs serait de la fausse confiance : l'utilisateur croirait ses
// données de santé protégées. Chiffres : roadmap-detection.md, annexe.
// produits par le modèle sont des noms communs par nature (« développeur »,
// « diabète », « française ») et ne peuvent pas être filtrés ainsi.
const TYPES_NOMS_PROPRES = new Set(['PER', 'ORG', 'LOC']);

// Écarte les spans sans majuscule quand le type exige un nom propre.
//
// « person » désigne toute expression qui RÉFÈRE à une personne : le modèle
// sort « vendor », « candidate », « leadership ». Notre besoin porte sur les
// entités nommées.
//
// Limite assumée : un nom tout en minuscules n'est plus détecté par cette
// couche. Le déterministe n'est pas concerné, le profil d'identité masque le
// nom de l'utilisateur, et le sur-masquage rendait les documents inexploitables.
// Une date de naissance est un jour situé dans une année. « Contient un
// chiffre » laissait passer « ANNEXE 2 », « 2021 » et « 12 mars ».
//
// Aucune liste de mois, le projet devant rester multilingue : on se contente de
// la structure, une date numérique ou une année accompagnée d'un quantième.
//   « March 14, 1988 », « 14. März 1988 » → acceptés
//   « 2021 », « ANNEXE 2 », « 12 mars »   → refusés
const DATE_NUMERIQUE = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/;
const ANNEE = /(?:1[89]|20)\d{2}/;

// Deux années = une plage, jamais une naissance. Mesuré sur un vrai CV :
// « Oct. 2025 - Janv. 2026 » sortait en DATE DE NAISSANCE. La règle « une année
// + un autre nombre » était satisfaite… par la seconde année, prise pour un
// quantième. Or personne ne naît sur une période, et la conséquence n'est pas
// qu'un masque de trop : le type étant faux, l'option Pseudonymes fabriquait
// une fausse date de naissance à la place d'une période d'expérience, ce qui
// altère le sens du document pour le LLM.
//
// Le test reste sans aucune liste de mois - c'est la structure qui parle, donc
// il vaut dans toutes les langues.
const ANNEES = /(?:1[89]|20)\d{2}/g;

function estUneDate(valeur) {
  const annees = String(valeur || '').match(ANNEES) || [];
  if (annees.length > 1) return false;
  if (DATE_NUMERIQUE.test(valeur)) return true;
  if (annees.length !== 1) return false;
  // Un autre nombre que l'année elle-même : le jour du mois.
  return /\d/.test(String(valeur).replace(annees[0], ''));
}

// PRONOMS - jamais un nom propre, quelle que soit la confiance du modèle.
//
// Mesuré sur un vrai mémoire : « I've » sort en PERSONNE, quatre fois. Le
// modèle voit un pronom en tête de phrase, donc en majuscule, et le prend pour
// un nom. Aucun seuil ne sépare ce cas - c'est une question de nature, pas de
// score.
//
// UNE LISTE STATIQUE EST ADMISSIBLE ICI, et seulement parce que la classe est
// Fermée : même règle que honorifics.js et que les opérateurs logiques de
// compression.js. Une langue compte une poignée de pronoms et n'en invente pas,
// contrairement aux noms, aux entreprises ou aux sigles - qu'on refuse
// catégoriquement de lister.
//
// Ne pas y glisser de noms communs (« Universities », « Contents »…) : ce sont
// des classes ouvertes, et leur place est dans un profil éditable, jamais ici.
const PRONOMS = new Set([
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'he', 'him', 'his',
  'she', 'her', 'hers', 'it', 'its', 'we', 'us', 'our', 'ours', 'they', 'them',
  'their', 'theirs', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose',
  'je', 'me', 'moi', 'tu', 'toi', 'il', 'elle', 'on', 'nous', 'vous', 'ils',
  'elles', 'lui', 'leur', 'leurs', 'celui', 'celle', 'ceux', 'celles', 'ceci',
  'cela', 'qui', 'que', 'dont',
  'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sein', 'ihre'
]);

// Les contractions anglaises (« I've », « he's », « they'll ») portent encore un
// pronom : on compare sur la partie qui précède l'apostrophe. « O'Brien » n'est
// pas concerné, « O » n'étant pas un pronom.
export function estPronom(valeur) {
  const nu = String(valeur || '').trim().toLowerCase();
  const avantApostrophe = nu.split(/['’]/)[0];
  return PRONOMS.has(nu) || (nu.includes("'") || nu.includes('’')
    ? PRONOMS.has(avantApostrophe) : false);
}

// Types soumis au filtre de vocabulaire (P14). PER en est exclu volontairement :
// beaucoup de patronymes français sont des mots courants - Blanc, Petit,
// Bernard, Roux - et « Pierre Blanc » serait jugé « vocabulaire », donc laissé
// en clair. Le filtre y produirait des fuites, pas du confort.
//
// ORG et LOC, eux, portent le gros du bruit ET la donnée la moins sensible :
// une raison sociale ou une ville ne sont pas des données personnelles au sens
// du RGPD, alors que le bruit qu'on retire rendait le document inexploitable.
const TYPES_FILTRES_PAR_VOCABULAIRE = new Set(['ORG', 'LOC']);

function estPlausiblePourLeType(type, valeur) {
  if (TYPES_NOMS_PROPRES.has(type)) {
    if (estPronom(valeur)) return false;
    if (!/\p{Lu}/u.test(valeur)) return false;
    // Un nom propre n'est pas fait de mots du dictionnaire. Voir
    // vocabulaire.js pour la mesure qui a mené ici, et pour ce qu'on y perd.
    if (TYPES_FILTRES_PAR_VOCABULAIRE.has(type) && estVocabulaireCourant(valeur)) return false;
    return true;
  }
  if (type === 'DATE_NAISSANCE') return estUneDate(valeur);
  return true;
}

// glinerPipeline : (text, labels) → [{ spanText, start, end, label, score }].
// Injecté comme dans ner.js pour rester testable en Node sans charger 183 Mo.
// disabledTypes est utilisé ici, et pas seulement en aval, pour éviter une
// inférence inutile. onProgress est awaité et rend la main à l'UI.
// Copie désaccentuée, à longueur strictement égale.
//
// Le checkpoint est un deberta anglophone et les accents lui coûtent cher :
// « ELEONORE VASSEUR » sort à 0,618, « ÉLÉONORE VASSEUR » à 0,418, pour un
// seuil à 0,46. Le nom fuyait (P10). L'accentuation retire environ 0,20 et
// certains cas atterrissent juste sous la barre.
//
// Longueur préservée, et c'est l'intérêt : les offsets du modèle restent
// valides sur les deux textes, sans recalage. À ne pas confondre avec la
// minusculisation, rejetée au spike POS.
export function desaccentuer(texte) {
  let sortie = '';
  for (const ch of texte) {
    const nu = ch.normalize('NFD').replace(/\p{M}+/gu, '');
    sortie += nu.length === ch.length ? nu : ch;
  }
  return sortie;
}

// Copie à casse adoucie, à longueur strictement égale. Même axe que
// `desaccentuer`, et celle des deux qui porte le plus.
//
// Mesuré sur un casier judiciaire, un formulaire aux valeurs en capitales,
// classe de document absente du corpus :
//   « ADRIEN MESNARD »   company 0,72   →  person   0,99
//   « FOSSES »           person  0,36   →  location 0,70
// Le nom sortait en ENTREPRISE, donc pseudonyme de société et pas de
// décomposition par composant : le prénom isolé n'était jamais masqué.
//
// Pas de minusculisation complète (spike POS : +7 démasquages, 3 fuites). On
// garde l'initiale majuscule, dont un modèle « cased » se sert pour délimiter
// un nom propre. Longueur préservée, `toLowerCase()` pouvant allonger.
// Trois lettres au moins, en dessous ce sont des sigles.
const MOT_TOUT_CAPITALES = /\p{Lu}[\p{Lu}'’-]{2,}/gu;

export function adoucirCasse(texte) {
  return String(texte || '').replace(MOT_TOUT_CAPITALES, (mot) => {
    const lettres = [...mot];
    const suite = lettres.slice(1).map(ch => {
      const bas = ch.toLowerCase();
      return bas.length === ch.length ? bas : ch;
    }).join('');
    return lettres[0] + suite;
  });
}

export async function detectGliner(text, glinerPipeline, { onProgress, disabledTypes } = {}) {
  if (!glinerPipeline) return [];
  const desactives = disabledTypes || new Set();
  const groupesActifs = GROUPES.filter(g => typesDuGroupe(g).some(t => !desactives.has(t)));
  if (!groupesActifs.length) return [];

  const chunks = chunkText(text);
  // Total exact des passes qui seront réellement exécutées : compter
  // `chunks × groupes` inclurait celles que `pertinent` va sauter, et la barre
  // de progression n'atteindrait jamais 100 %.
  let total = 0;
  for (const { text: c } of chunks) {
    for (const g of groupesActifs) if (!g.pertinent || g.pertinent(c)) total++;
  }
  const all = [];
  let done = 0;

  for (const { offset, text: chunk } of chunks) {
    const duChunk = [];
    const chunkNu = desaccentuer(chunk);
    const chunkCasse = adoucirCasse(chunk);
    // Les variantes ne sont ajoutées QUE si elles changent quelque chose : une
    // prose sans accent ni capitales ne paie aucune passe supplémentaire, et le
    // coût se concentre sur les documents qui en ont besoin (formulaires, CV).
    const variantes = [chunk];
    if (chunkNu !== chunk) variantes.push(chunkNu);
    if (chunkCasse !== chunk) variantes.push(chunkCasse);
    for (const groupe of groupesActifs) {
      // Ne pas payer une inférence dont on jettera le résultat.
      //
      // `estPlausiblePourLeType` écarte déjà, après coup, les spans sans
      // majuscule (noms propres) ou sans chiffre (date de naissance). Si le
      // texte entier n'en contient aucun, la passe ne peut rien produire qui
      // survive à ce filtre : on la saute. Zéro perte par construction - c'est
      // la même règle, appliquée avant la dépense au lieu d'après.
      //
      // Mesuré sur un mémoire de 75 pages : le groupe « date de naissance »
      // coûte autant que le groupe identité (25,0 contre 25,4 ms/unité) alors
      // qu'il n'a qu'un label - le coût suit la longueur du texte, pas le
      // nombre de labels. Or 65 % des unités n'ont aucun chiffre.
      if (groupe.pertinent && !groupe.pertinent(chunk)) continue;
      const seuil = groupe.seuil ?? GLINER_THRESHOLD;
      // Passes supplémentaires sur les copies désaccentuée (P10) et à casse
      // adoucie (P12). La longueur étant préservée dans les deux cas, toutes
      // partagent le même repère d'offsets et la valeur se relit sur
      // l'original - c'est ce qui rend l'axe utilisable.
      for (const variante of variantes) {
        const spans = await glinerPipeline(variante, groupe.labels);
        for (const s of spans || []) {
          const type = groupe.types[s.label];
          // Un label inconnu ne doit jamais devenir une entité sans type, et un
          // type désactivé ne doit pas sortir d'ici non plus. Ce n'est pas une
          // optimisation, c'est une correction de fuite.
          //
          // Le saut de groupe plus haut n'écarte une passe que si TOUS ses
          // types sont désactivés. Un groupe partiellement actif produit donc
          // encore des entités de types désactivés, qui entrent dans la
          // résolution des chevauchements où « le plus long gagne », y battent
          // une détection d'un type actif, puis sont jetées par filterByRules.
          // La valeur n'est alors plus masquée par personne.
          //
          // Mesuré : l'utilisateur avait décoché ETABLISSEMENT en laissant
          // SANTE, « ETABLISSEMENT : Sorbonne Paris Nord » évinçait le
          // « LIEU : Sorbonne Paris Nord », puis disparaissait. Le nom de
          // l'université partait en clair.
          if (!type || desactives.has(type) || s.score < seuil) continue;
          // La valeur se relit toujours sur le texte d'origine : c'est le texte
          // accentué qu'il faudra masquer, pas la copie de travail.
          const valeur = chunk.slice(s.start, s.end);
          if (!estPlausiblePourLeType(type, valeur)) continue;
          duChunk.push({
            type,
            value: valeur,
            start: s.start,
            end: s.end,
            source: 'ner',
            score: s.score,
            validated: 'n/a'
          });
        }
      }
      if (onProgress) await onProgress({ done: ++done, total });
    }

    // Chevauchements entre groupes (ex. « Université de Bordeaux » vu comme
    // ETABLISSEMENT et comme ORG) : même règle que partout dans ce projet -
    // le span le plus long gagne, le score ne départage qu'à égalité.
    duChunk.sort((a, b) =>
      a.start - b.start ||
      (b.end - b.start) - (a.end - a.start) ||
      b.score - a.score
    );
    const gardes = [];
    for (const e of duChunk) {
      if (gardes.some(k => e.start < k.end && e.end > k.start)) continue;
      gardes.push(e);
    }
    for (const e of gardes) all.push({ ...e, start: e.start + offset, end: e.end + offset });
  }

  // Assurance : le découpeur de mots de la lib est corrigé côté worker (voir
  // ner-worker.js), mais un span à cheval sur une frontière de mot resterait
  // une fuite partielle. Mécanisme partagé avec le moteur BERT.
  snapToWordBoundaries(text, all);

  // Recollage des noms détectés en deux morceaux. Cas réel : sur un CV,
  // « ADRIEN MESNARD » sort en deux spans distincts (0,47 et 0,36) - sans
  // pontage, seul le prénom passerait le seuil et le patronyme fuirait en
  // clair à côté du placeholder. Mécanisme partagé avec le moteur BERT.
  bridgeNameParts(text, all);

  // Dédoublonnage des zones de recouvrement entre fenêtres.
  const vus = new Set();
  return all
    .filter(e => {
      const k = `${e.start}:${e.end}:${e.type}`;
      if (vus.has(k)) return false;
      vus.add(k);
      return true;
    })
    .sort((a, b) => a.start - b.start);
}

// --- ARBITRAGE DES FAUX POSITIFS -----------------------------------------
//
// Le label « person » désigne toute expression qui RÉFÈRE à une personne : le
// modèle sort « Analyste », « Second candidat », « Poste occupé ». Aucun seuil
// ne les écarte, ils sortent au-dessus de vraies entités (« Réunion » 0,961
// contre « Villetaneuse » 0,699).
//
// Passe séparée et pas des labels ajoutés au groupe identité : les labels se
// concurrencent dans un même appel. Face à « person », un label « job title »
// sort à 0,000. Seul, il répond.
//
// Coût : une inférence par valeur distincte, pas par occurrence, sur un texte
// très court, et les appels partent en lot.
//
// Ne touche jamais le déterministe : on n'arbitre que `source === 'ner'`.
export const LABELS_LEURRE = ['job title', 'section heading', 'common noun', 'skill or hobby'];

// Mesuré sur 21 faux positifs et 15 vraies entités du document piégé :
// 6 faux positifs écartés, aucune vraie entité perdue. Le gain est modeste
// mais il est gratuit en risque - c'est ce qui l'a fait retenir.
export async function arbitrerFauxPositifs(entities, glinerPipeline) {
  if (!glinerPipeline || !entities?.length) return entities || [];
  const labelsPII = GROUPES[0].labels;
  const tous = [...labelsPII, ...LABELS_LEURRE];

  const candidats = [...new Set(
    entities.filter(e => e.source === 'ner' && TYPES_NOMS_PROPRES.has(e.type)).map(e => e.value)
  )];
  if (!candidats.length) return entities;

  const rejete = new Set();
  await Promise.all(candidats.map(async valeur => {
    let spans;
    try {
      spans = await glinerPipeline(valeur, tous);
    } catch {
      return; // en cas d'échec on GARDE l'entité : ne jamais démasquer sur une erreur
    }
    let pii = 0, leurre = 0;
    for (const s of spans || []) {
      // Seul le span qui couvre tout le candidat compte : un fragment ne dit
      // rien de la nature de l'expression entière.
      if ((s.spanText || '').trim() !== valeur.trim()) continue;
      if (LABELS_LEURRE.includes(s.label)) leurre = Math.max(leurre, s.score);
      else pii = Math.max(pii, s.score);
    }
    if (leurre > pii) rejete.add(valeur);
  }));

  return entities.filter(e => !rejete.has(e.value));
}
