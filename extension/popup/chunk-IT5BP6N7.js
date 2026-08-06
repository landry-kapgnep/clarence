// src/engine/batch.js
var TAILLE_LOT = 8;
var BUDGET = 8e3;
function decouperEnLots(items, { maxLot = TAILLE_LOT, budget = BUDGET } = {}) {
  const tries = [...items].sort((a, b) => a.text.length - b.text.length);
  const lots = [];
  let lot = [];
  let plusLong = 0;
  for (const it of tries) {
    const maxSiAjoute = Math.max(plusLong, it.text.length);
    const coutSiAjoute = (lot.length + 1) * maxSiAjoute;
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
function serialiser() {
  let file = Promise.resolve();
  return (tache) => {
    const resultat = file.then(tache, tache);
    file = resultat.then(() => {
    }, () => {
    });
    return resultat;
  };
}
function createBatchedPipeline(runBatch, opts = {}) {
  const {
    maxLot = TAILLE_LOT,
    budget = BUDGET,
    // setTimeout(0) et non queueMicrotask : les appels suivants d'un même
    // `detectGliner` naissent en réagissant à la résolution du lot précédent,
    // donc dans des microtâches successives. Un vidage en microtâche partirait
    // avec un lot presque vide. Le retard (~0-4 ms) est négligeable face aux
    // 37 ms fixes qu'un appel isolé coûterait.
    planifier = (f) => setTimeout(f, 0)
  } = opts;
  const attente = /* @__PURE__ */ new Map();
  let planifie = false;
  let enCours = false;
  async function vider() {
    if (enCours) return;
    enCours = true;
    try {
      while (attente.size) {
        const paquets = [...attente.values()];
        attente.clear();
        for (const items of paquets) {
          for (const lot of decouperEnLots(items, { maxLot, budget })) {
            try {
              const res = await runBatch(lot.map((i) => i.text), lot[0].labels);
              lot.forEach((it, i) => it.resolve(res?.[i] || []));
            } catch (e) {
              lot.forEach((it) => it.reject(e));
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
      const cle = (labels || []).join(" ");
      if (!attente.has(cle)) attente.set(cle, []);
      attente.get(cle).push({ text, labels, resolve, reject });
      if (!planifie && !enCours) {
        planifie = true;
        planifier(vider);
      }
    });
  };
}

export {
  serialiser,
  createBatchedPipeline
};
