// Regroupement d'inférences : plusieurs textes en UN seul passage du modèle.
//
// POURQUOI. Le coût d'une inférence est « ~37 ms fixes + k × longueur » - les
// 37 ms sont payés à chaque appel, quelle que soit la taille du texte. Sur un
// mémoire de 75 pages découpé en ~470 unités × 2 groupes de labels, cela fait
// ~940 appels, soit **~35 s de surcoût fixe pur**, avant le moindre calcul
// utile. Et un GPU nourri d'une unité de 90 caractères est massivement
// sous-employé.
//
// GLiNER.js sait nativement traiter un lot : `inference({ texts: [...] })`
// construit UN tenseur et lance UN `onnxWrapper.run()` (voir lib/model.ts). Ce
// module se contente donc de rassembler les appels concurrents.
//
// CE QUE CE N'EST PAS. Ce n'est pas le « regroupement d'unités » déjà mesuré et
// REJETÉ (voir anonymize-units.js) : là, on concaténait les textes en un seul,
// et le modèle perdait les entités isolées. Ici chaque texte reste une entrée
// distincte du lot, analysée indépendamment ; seul le transport change. La
// preuve que la qualité est intacte est au banc, pas dans ce commentaire.
//
// PIÈGE DU REMBOURRAGE (padding). `inputLength = Math.max(...textLengths)` :
// un lot est calculé à la longueur de son PLUS LONG texte. Mettre une cellule
// de 20 caractères avec une fenêtre de 900 fait payer 900 à la cellule. D'où le
// tri par longueur et le budget ci-dessous - sans quoi le regroupement peut
// coûter plus cher qu'il ne rapporte.

// Taille de lot, CHOISIE PAR MESURE et non au jugé. 240 unités réalistes
// (longueurs d'un vrai mémoire), même modèle fp16, deux tirages concordants :
//
//   lot  1 → 18,8 s      lot 16 → 7,5-8,2 s
//   lot  8 → 7,1-7,4 s   lot 24 → 7,6-7,8 s      lot 32 → 7,5-7,8 s
//
// Le gain est là dès 8 (×2,6), puis la courbe s'aplatit et remonte légèrement :
// plus le lot est gros, plus il mélange des longueurs éloignées, et plus le
// rembourrage gaspille. Inutile de monter - 8 tient aussi moins de mémoire.
//
// Contrôle de non-régression de la mesure : 570 spans produits, IDENTIQUES à
// toutes les tailles de lot. Le regroupement ne change pas la détection.
const TAILLE_LOT = 8;

// Borne le coût RÉEL d'un lot une fois rembourré (taille × plus long texte).
// À 8000, une fenêtre pleine de 1000 caractères part par 8 - au-delà, le
// rembourrage coûterait plus que le groupage ne rapporte.
const BUDGET = 8000;

// Découpe une liste d'appels en lots homogènes.
//
// Tri par longueur : des textes de tailles voisines dans un même lot, pour que
// le rembourrage reste marginal. Le budget borne `taille du lot × plus long
// texte`, c'est-à-dire le VRAI coût du lot une fois rembourré - borner le seul
// nombre d'éléments laisserait passer 16 × 1000 caractères.
export function decouperEnLots(items, { maxLot = TAILLE_LOT, budget = BUDGET } = {}) {
  const tries = [...items].sort((a, b) => a.text.length - b.text.length);
  const lots = [];
  let lot = [];
  let plusLong = 0;

  for (const it of tries) {
    const maxSiAjoute = Math.max(plusLong, it.text.length);
    const coutSiAjoute = (lot.length + 1) * maxSiAjoute;
    // Un lot d'UN élément est toujours autorisé, même hors budget : sinon un
    // texte plus long que le budget ne partirait jamais.
    if (lot.length && (lot.length >= maxLot || coutSiAjoute > budget)) {
      lots.push(lot);
      lot = [];
      plusLong = 0;
    }
    lot.push(it);
    plusLong = Math.max(plusLong, it.text.length);
  }
  if (lot.length) lots.push(lot);
  return lots;
}

// Met les tâches BOUT À BOUT : la suivante ne démarre qu'une fois la précédente
// terminée, succès ou échec.
//
// POURQUOI C'EST OBLIGATOIRE ET PAS UNE PRÉCAUTION. ORT n'autorise qu'UNE
// inférence à la fois : son fournisseur WebGPU pose un marqueur global et lève
// `Session already started` si un second `run` démarre pendant le premier.
// Tant que la détection était séquentielle, le cas ne pouvait pas se produire ;
// le regroupement en lots l'a rendu atteignable, et le traitement échouait au
// bout de deux secondes.
//
// La sérialisation vit ici, au plus près du modèle, et NON chez l'appelant :
// c'est une contrainte du moteur d'exécution. La placer en amont obligerait
// chaque futur appelant à la connaître - et à la réintroduire en l'oubliant.
export function serialiser() {
  let file = Promise.resolve();
  return tache => {
    // Le maillon suivant part que le précédent réussisse ou échoue : une erreur
    // ne doit pas bloquer la file pour de bon.
    const resultat = file.then(tache, tache);
    file = resultat.then(() => {}, () => {});
    return resultat;
  };
}

// Emballe un `runBatch(texts, labels) → spans[][]` en un pipeline classique
// `(text, labels) → spans`, en rassemblant les appels concurrents.
//
// `planifier` est injectable pour que les tests pilotent le déclenchement au
// lieu d'attendre un vrai timer.
export function createBatchedPipeline(runBatch, opts = {}) {
  const {
    maxLot = TAILLE_LOT,
    budget = BUDGET,
    // setTimeout(0) et non queueMicrotask : les appels suivants d'un même
    // `detectGliner` naissent en réagissant à la résolution du lot précédent,
    // donc dans des microtâches successives. Un vidage en microtâche partirait
    // avec un lot presque vide. Le retard (~0-4 ms) est négligeable face aux
    // 37 ms fixes qu'un appel isolé coûterait.
    planifier = f => setTimeout(f, 0)
  } = opts;

  // Clé = jeu de labels : un lot ne peut porter qu'UN jeu d'entités (c'est une
  // entrée du modèle, pas un paramètre de post-traitement). Les groupes
  // disjoints de gliner.js sont donc regroupés séparément - ce qui tombe bien,
  // c'est déjà ainsi qu'ils doivent rester (voir GROUPES).
  const attente = new Map();
  let planifie = false;
  let enCours = false;

  // UN SEUL vidage à la fois - c'est une correction de bug, pas une élégance.
  //
  // La version précédente remettait `planifie` à faux dès son ENTRÉE : les
  // appels nés pendant ses `await` programmaient un SECOND vidage, qui postait
  // son lot alors que le premier n'avait pas répondu. Deux inférences se
  // chevauchaient et ORT levait « Session already started » - son fournisseur
  // WebGPU pose un marqueur global et n'en tolère qu'une à la fois. Le
  // traitement échouait au bout de deux secondes.
  //
  // Le worker sérialise aussi de son côté (`serialiser`) et c'est LUI qui fait
  // autorité : la contrainte appartient au moteur d'exécution, pas à l'appelant.
  // Cette boucle-ci évite en plus d'empiler des lots pour rien.
  async function vider() {
    if (enCours) return;
    enCours = true;
    try {
      // `while` plutôt qu'un seul passage : ce qui arrive pendant nos attentes
      // est traité dans la foulée, sans reprogrammer de minuterie.
      while (attente.size) {
        const paquets = [...attente.values()];
        attente.clear();
        for (const items of paquets) {
          for (const lot of decouperEnLots(items, { maxLot, budget })) {
            try {
              const res = await runBatch(lot.map(i => i.text), lot[0].labels);
              // Le modèle renvoie un tableau indexé COMME l'entrée. Une absence
              // devient une liste vide plutôt qu'`undefined` : l'appelant boucle
              // dessus sans garde.
              lot.forEach((it, i) => it.resolve(res?.[i] || []));
            } catch (e) {
              // Un lot en échec ne doit pas laisser ses promesses en suspens :
              // la détection se figerait sans le moindre message.
              lot.forEach(it => it.reject(e));
            }
          }
        }
      }
    } finally {
      enCours = false;
      planifie = false;
    }
  }

  return function pipelineGroupe(text, labels) {
    return new Promise((resolve, reject) => {
      const cle = (labels || []).join(' ');
      if (!attente.has(cle)) attente.set(cle, []);
      attente.get(cle).push({ text, labels, resolve, reject });
      // Rien à programmer si un vidage tourne déjà : sa boucle prendra ces
      // appels au tour suivant.
      if (!planifie && !enCours) {
        planifie = true;
        planifier(vider);
      }
    });
  };
}
