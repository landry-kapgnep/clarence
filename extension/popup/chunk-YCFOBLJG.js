// src/engine/compression.js
var COMPRESSION_MODEL = "ldenoue/llmlingua-2-bert-base-multilingual-cased-meetingbank";
function motsDuTexte(texte) {
  const mots = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(texte)) !== null) {
    mots.push({ texte: m[0], debut: m.index, fin: m.index + m[0].length });
  }
  return mots;
}
var OPERATEURS_LOGIQUES = /* @__PURE__ */ new Set([
  // français
  "ne",
  "n",
  "pas",
  "plus",
  "jamais",
  "aucun",
  "aucune",
  "ni",
  "sans",
  "sauf",
  "si",
  "mais",
  "or",
  "donc",
  "car",
  "toutefois",
  "cependant",
  "n\xE9anmoins",
  "hormis",
  "except\xE9",
  "tout",
  "toute",
  "tous",
  "toutes",
  "chaque",
  "seulement",
  // anglais
  "not",
  "no",
  "never",
  "none",
  "neither",
  "nor",
  "without",
  "except",
  "unless",
  "if",
  "but",
  "however",
  "although",
  "though",
  "only",
  "all",
  "every",
  "each",
  // espagnol
  "nunca",
  "ning\xFAn",
  "ninguna",
  "sin",
  "salvo",
  "excepto",
  "pero",
  "aunque",
  "s\xF3lo",
  "solo",
  "todo",
  "toda",
  "cada",
  // allemand
  "nicht",
  "kein",
  "keine",
  "keinen",
  "nie",
  "niemals",
  "ohne",
  "au\xDFer",
  "wenn",
  "falls",
  "aber",
  "jedoch",
  "obwohl",
  "nur",
  "alle",
  "jeder"
]);
var PLACEHOLDER = /\[[A-Z_]+_\d+\]/;
function estOperateurLogique(mot) {
  const nu = String(mot || "").toLowerCase().replace(/[^\p{L}]/gu, "");
  return nu.length > 0 && OPERATEURS_LOGIQUES.has(nu);
}
function estIntouchable(mot) {
  return PLACEHOLDER.test(mot) || estOperateurLogique(mot);
}
var nettoie = (t) => String(t).replace(/^##/, "");
function scoresParMot(mots, tokens) {
  const scores = new Array(mots.length).fill(null);
  let iTok = 0;
  for (let i = 0; i < mots.length; i++) {
    let couvert = "";
    let max = 0;
    const cible = mots[i].texte;
    while (iTok < tokens.length && couvert.length < cible.length) {
      const t = tokens[iTok++];
      couvert += nettoie(t.mot);
      if (t.garder > max) max = t.garder;
    }
    scores[i] = couvert.length ? max : null;
  }
  return scores;
}
var MOTS_PAR_LOT = 120;
function decouperEnLots(mots, taille = MOTS_PAR_LOT) {
  const lots = [];
  for (let i = 0; i < mots.length; i += taille) lots.push(mots.slice(i, i + taille));
  return lots;
}
function recollerScores(tokens, sorties) {
  const parIndex = new Map(sorties.map((s) => [s.index, s.garder]));
  const out = [];
  for (let i = 1; i < tokens.length - 1; i++) {
    out.push({ mot: tokens[i], garder: parIndex.get(i) ?? 0 });
  }
  return out;
}
async function compresser(texte, pipeline, options = {}) {
  const r = await compresserSegments([texte], pipeline, options);
  return { ...r, texte: r.segments[0] ?? "" };
}
async function compresserSegments(segments, pipeline, { taux = 0.5 } = {}) {
  const bornes = [];
  let texte = "";
  for (const s of segments) {
    const debut = texte.length;
    texte += (texte ? " " : "") + String(s ?? "");
    bornes.push([debut === 0 ? 0 : debut + 1, texte.length]);
  }
  const mots = motsDuTexte(texte);
  if (!mots.length) return resultat(texte, segments.map(() => ""), 0, 0);
  const tokens = pipeline ? await pipeline(texte) : [];
  const scores = scoresParMot(mots, tokens);
  const candidats = [];
  const garde = new Array(mots.length).fill(false);
  for (let i = 0; i < mots.length; i++) {
    if (estIntouchable(mots[i].texte) || scores[i] === null) garde[i] = true;
    else candidats.push({ i, s: scores[i] });
  }
  const budget = Math.max(0, Math.round(mots.length * taux) - garde.filter(Boolean).length);
  candidats.sort((a, b) => b.s - a.s);
  for (const c of candidats.slice(0, budget)) garde[c.i] = true;
  const sortie = segments.map(() => []);
  let retenus = 0;
  for (let i = 0; i < mots.length; i++) {
    if (!garde[i]) continue;
    retenus++;
    const j = bornes.findIndex(([d, f]) => mots[i].debut >= d && mots[i].debut < f);
    if (j >= 0) sortie[j].push(mots[i].texte);
  }
  return resultat(
    texte,
    sortie.map((m) => m.join(" ")),
    mots.length,
    retenus,
    scores.filter((s) => s === null).length
  );
}
function resultat(avant, segments, motsAvant, motsApres, motsSansScore = 0) {
  const apres = segments.filter(Boolean).join(" ");
  return {
    segments,
    motsAvant,
    motsApres,
    // NOMBRE DE MOTS SANS SCORE, remonté exprès. Un mot non aligné est
    // conservé — c'est le bon sens de l'échec — mais si le flux de tokens
    // s'épuise (pipeline qui tronque au-delà de 512 positions, par exemple),
    // TOUT est conservé et la compression ne mord plus, en silence. Sans ce
    // compteur, l'appelant croit compresser et ne compresse rien : exactement
    // le cas rencontré au spike sur un document de 328 mots.
    motsSansScore,
    // Estimation prudente et assumée : ~4 caractères par token. Le cadrage §10
    // impose un ordre de grandeur, jamais un chiffre garanti — le vrai compte
    // dépend du tokeniseur du modèle destinataire, qu'on ne connaît pas.
    tokensAvant: Math.round(avant.length / 4),
    tokensApres: Math.round(apres.length / 4)
  };
}

export {
  COMPRESSION_MODEL,
  decouperEnLots,
  recollerScores,
  compresser,
  compresserSegments
};
