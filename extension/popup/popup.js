import {
  NER_MODEL,
  OperationAnnulee,
  bridgeNameParts,
  chunkText,
  detectNER,
  detectPhonesIntl,
  detectRegex,
  entityKey,
  estAnnulation,
  filterByRules,
  forcedMasks,
  isHonorificAt,
  maskText,
  mergeEntities,
  reinject,
  selectActive,
  snapToWordBoundaries,
  verifierAnnulation
} from "./chunk-BIY2U3A5.js";
import {
  createBatchedPipeline
} from "./chunk-IT5BP6N7.js";
import {
  COMPRESSION_MODEL,
  compresser,
  compresserSegments
} from "./chunk-VTU65RIR.js";
import "./chunk-PIRHQTI4.js";

// src/engine/gliner.js
var GLINER_MODEL = "onnx-community/gliner_small-v2";
var VARIANTES_MODELE = {
  quantized: "model_quantized.onnx",
  // 175 Mo, int8
  fp16: "model_fp16.onnx",
  // 292 Mo — défaut
  fp32: "model.onnx"
  // 583 Mo
};
var GLINER_VARIANTE = "fp16";
var glinerModelUrl = (variante = GLINER_VARIANTE) => `https://huggingface.co/${GLINER_MODEL}/resolve/main/onnx/${VARIANTES_MODELE[variante]}`;
var GLINER_THRESHOLD = 0.5;
var GROUPES = [
  {
    // Le cœur : ce que le NER BERT couvrait déjà, en mieux sur les valeurs
    // isolées.
    //
    // Seuil ABAISSÉ à 0,45 une première fois (nom de CV isolé, 0,47), puis à
    // 0,38 le 05/08/2026 — trouvé sur un vrai rapport (`rapport-fr.txt`) : le
    // patronyme « ROUSSEAU » matche le motif BIC et annule « Amandine
    // ROUSSEAU » dans la fusion (voir merge.js), mais le nom lui-même ne
    // dépassait le seuil sur AUCUNE de ses 3 occurrences (0,364 / 0,398).
    // « Nadia Belkacem » (`dossier-rh.txt`) était dans le même cas.
    //
    // Seuil choisi par balayage sur le banc COMPLET, pas par extrapolation :
    // 0,45 → 0,40 → 0,38 → 0,36 → 0,35. 0,38 est le point pivot exact où les
    // deux noms sont trouvés SANS qu'aucun faux positif n'apparaisse. En
    // dessous (0,36), « CERTIFICAT DE SCOLARITE » (titre en capitales) devient
    // un faux positif PER et le préservé de `certificat-fr.txt` chute de
    // 100 % à 67 %. Ne pas descendre sans re-vérifier CE cas précis.
    //
    // Effet mesuré : rappel contextuel 78 → 83 %, préservé INCHANGÉ (98 %),
    // structuré inchangé. Plus aucune fuite partielle sur les 7 documents.
    //
    // RECALIBRÉ à 0,46 le 06/08/2026 en passant les poids de int8 à fp16.
    // LEÇON GÉNÉRALE : **un seuil appartient à une variante de poids.** Le fp16
    // est numériquement plus précis, tous les scores remontent, et le 0,38
    // calibré sur l'int8 devenait trop bas — préservé 98 % → 93 %
    // (« SOMMAIRE » et « Docker » sur-masqués en plus). Changer de variante
    // SANS rebalayer, c'est troquer de la qualité contre de la vitesse sans
    // s'en apercevoir.
    //
    // Balayage sur le banc complet, en fp16 :
    //   0,38 → 83 % / 93 %      0,42 → 83 % / 93 %
    //   0,45 → 83 % / 96 %      0,46 → 83 % / **98 %**  ← retenu
    //   0,47 / 0,48 → identiques à 0,46 (plateau)
    //   0,50 → casse le STRUCTURÉ (19/20) : rédhibitoire, non négociable
    // 0,46 est le plus BAS du plateau — donc le plus détectant à qualité égale,
    // conformément à « zéro-fuite > faux positifs ».
    seuil: 0.46,
    labels: ["person", "company", "location"],
    types: { person: "PER", company: "ORG", location: "LOC" },
    // Voir `pertinent` plus bas : un texte sans la moindre majuscule ne peut
    // produire aucun nom propre, donc aucune entité de ce groupe.
    pertinent: (t) => new RegExp("\\p{Lu}", "u").test(t)
  },
  {
    // Seul : associé à d'autres labels il perd sa précision, et « address »
    // faisait monter le bruit du garde-fou à 0,47 (trop près du seuil).
    // Les adresses restent couvertes par le motif ADRESSE, déterministe.
    labels: ["date of birth"],
    types: { "date of birth": "DATE_NAISSANCE" },
    // Une date porte toujours au moins l'année : sans chiffre, rien à trouver.
    // 65 % des unités d'un vrai mémoire sont dans ce cas — 54 % du texte.
    pertinent: (t) => /\d/.test(t)
  },
  {
    // Catégories sensibles au sens RGPD (santé, origine) + contexte pro.
    // Vérifié : zéro faux positif sur les 3 fixtures ET sur une ligne de
    // stack technique (« React, Docker, Prisma… »).
    labels: ["job title", "nationality", "school", "medical condition"],
    types: {
      "job title": "POSTE",
      nationality: "NATIONALITE",
      school: "ETABLISSEMENT",
      "medical condition": "SANTE"
    }
  }
];
var TYPES_PEU_FIABLES = ["POSTE", "NATIONALITE", "ETABLISSEMENT", "SANTE"];
var typesDuGroupe = (g) => Object.values(g.types);
var TYPES_NOMS_PROPRES = /* @__PURE__ */ new Set(["PER", "ORG", "LOC"]);
var DATE_NUMERIQUE = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/;
var ANNEE = /(?:1[89]|20)\d{2}/;
function estUneDate(valeur) {
  if (DATE_NUMERIQUE.test(valeur)) return true;
  const annee = ANNEE.exec(valeur);
  if (!annee) return false;
  const reste = valeur.slice(0, annee.index) + valeur.slice(annee.index + annee[0].length);
  return /\d/.test(reste);
}
var PRONOMS = /* @__PURE__ */ new Set([
  "i",
  "me",
  "my",
  "mine",
  "myself",
  "you",
  "your",
  "yours",
  "he",
  "him",
  "his",
  "she",
  "her",
  "hers",
  "it",
  "its",
  "we",
  "us",
  "our",
  "ours",
  "they",
  "them",
  "their",
  "theirs",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "je",
  "me",
  "moi",
  "tu",
  "toi",
  "il",
  "elle",
  "on",
  "nous",
  "vous",
  "ils",
  "elles",
  "lui",
  "leur",
  "leurs",
  "celui",
  "celle",
  "ceux",
  "celles",
  "ceci",
  "cela",
  "qui",
  "que",
  "dont",
  "yo",
  "tu",
  "el",
  "ella",
  "nosotros",
  "vosotros",
  "ellos",
  "ellas",
  "ich",
  "du",
  "er",
  "sie",
  "es",
  "wir",
  "ihr",
  "sein",
  "ihre"
]);
function estPronom(valeur) {
  const nu = String(valeur || "").trim().toLowerCase();
  const avantApostrophe = nu.split(/['’]/)[0];
  return PRONOMS.has(nu) || (nu.includes("'") || nu.includes("\u2019") ? PRONOMS.has(avantApostrophe) : false);
}
function estPlausiblePourLeType(type, valeur) {
  if (TYPES_NOMS_PROPRES.has(type)) {
    if (estPronom(valeur)) return false;
    return new RegExp("\\p{Lu}", "u").test(valeur);
  }
  if (type === "DATE_NAISSANCE") return estUneDate(valeur);
  return true;
}
function desaccentuer(texte) {
  let sortie = "";
  for (const ch of texte) {
    const nu = ch.normalize("NFD").replace(new RegExp("\\p{M}+", "gu"), "");
    sortie += nu.length === ch.length ? nu : ch;
  }
  return sortie;
}
async function detectGliner(text, glinerPipeline, { onProgress, disabledTypes: disabledTypes2 } = {}) {
  if (!glinerPipeline) return [];
  const desactives = disabledTypes2 || /* @__PURE__ */ new Set();
  const groupesActifs = GROUPES.filter((g) => typesDuGroupe(g).some((t) => !desactives.has(t)));
  if (!groupesActifs.length) return [];
  const chunks = chunkText(text);
  let total = 0;
  for (const { text: c } of chunks) {
    for (const g of groupesActifs) if (!g.pertinent || g.pertinent(c)) total++;
  }
  const all = [];
  let done = 0;
  for (const { offset, text: chunk } of chunks) {
    const duChunk = [];
    const chunkNu = desaccentuer(chunk);
    for (const groupe of groupesActifs) {
      if (groupe.pertinent && !groupe.pertinent(chunk)) continue;
      const seuil = groupe.seuil ?? GLINER_THRESHOLD;
      for (const variante of chunkNu === chunk ? [chunk] : [chunk, chunkNu]) {
        const spans = await glinerPipeline(variante, groupe.labels);
        for (const s of spans || []) {
          const type = groupe.types[s.label];
          if (!type || s.score < seuil) continue;
          const valeur = chunk.slice(s.start, s.end);
          if (!estPlausiblePourLeType(type, valeur)) continue;
          duChunk.push({
            type,
            value: valeur,
            start: s.start,
            end: s.end,
            source: "ner",
            score: s.score,
            validated: "n/a"
          });
        }
      }
      if (onProgress) await onProgress({ done: ++done, total });
    }
    duChunk.sort(
      (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || b.score - a.score
    );
    const gardes = [];
    for (const e of duChunk) {
      if (gardes.some((k) => e.start < k.end && e.end > k.start)) continue;
      gardes.push(e);
    }
    for (const e of gardes) all.push({ ...e, start: e.start + offset, end: e.end + offset });
  }
  snapToWordBoundaries(text, all);
  bridgeNameParts(text, all);
  const vus = /* @__PURE__ */ new Set();
  return all.filter((e) => {
    const k = `${e.start}:${e.end}:${e.type}`;
    if (vus.has(k)) return false;
    vus.add(k);
    return true;
  }).sort((a, b) => a.start - b.start);
}
var LABELS_LEURRE = ["job title", "section heading", "common noun", "skill or hobby"];
async function arbitrerFauxPositifs(entities, glinerPipeline) {
  if (!glinerPipeline || !entities?.length) return entities || [];
  const labelsPII = GROUPES[0].labels;
  const tous = [...labelsPII, ...LABELS_LEURRE];
  const candidats = [...new Set(
    entities.filter((e) => e.source === "ner" && TYPES_NOMS_PROPRES.has(e.type)).map((e) => e.value)
  )];
  if (!candidats.length) return entities;
  const rejete = /* @__PURE__ */ new Set();
  await Promise.all(candidats.map(async (valeur) => {
    let spans;
    try {
      spans = await glinerPipeline(valeur, tous);
    } catch {
      return;
    }
    let pii = 0, leurre = 0;
    for (const s of spans || []) {
      if ((s.spanText || "").trim() !== valeur.trim()) continue;
      if (LABELS_LEURRE.includes(s.label)) leurre = Math.max(leurre, s.score);
      else pii = Math.max(pii, s.score);
    }
    if (leurre > pii) rejete.add(valeur);
  }));
  return entities.filter((e) => !rejete.has(e.value));
}

// src/popup/poids.js
var NIVEAUX = {
  leger: { libelle: "L\xE9ger", classe: "poids-leger" },
  moyen: { libelle: "Moyen", classe: "poids-moyen" },
  lourd: { libelle: "Lourd", classe: "poids-lourd" },
  tresLourd: { libelle: "Tr\xE8s lourd", classe: "poids-tres-lourd" }
};
var SEUILS_PAGES = [
  [8, "leger"],
  [25, "moyen"],
  [60, "lourd"]
];
var SEUILS_CARACTERES = [
  [15e3, "leger"],
  [6e4, "moyen"],
  [15e4, "lourd"]
];
var SEUILS_OCTETS = [
  [40 * 1024, "leger"],
  [200 * 1024, "moyen"],
  [800 * 1024, "lourd"]
];
function classer(valeur, seuils) {
  for (const [max, cle] of seuils) if (valeur <= max) return cle;
  return "tresLourd";
}
var SANS_TEXTE = /* @__PURE__ */ new Set(["jpg", "jpeg", "png", "webp"]);
function poidsDeTraitement({ ext, taille = 0, pages = null, caracteres = null }) {
  const e = (ext || "").toLowerCase();
  if (SANS_TEXTE.has(e)) return { cle: "leger", ...NIVEAUX.leger, base: "image" };
  if (pages != null) {
    return { cle: classer(pages, SEUILS_PAGES), ...NIVEAUX[classer(pages, SEUILS_PAGES)], base: "pages" };
  }
  if (caracteres != null) {
    const cle2 = classer(caracteres, SEUILS_CARACTERES);
    return { cle: cle2, ...NIVEAUX[cle2], base: "caracteres" };
  }
  const cle = classer(taille, SEUILS_OCTETS);
  return { cle, ...NIVEAUX[cle], base: "octets" };
}
function expliquerPoids(poids) {
  switch (poids.base) {
    case "image":
      return "Une image n\u2019a pas de texte \xE0 analyser : seules les m\xE9tadonn\xE9es sont retir\xE9es.";
    case "pages":
      return "Estim\xE9 d\u2019apr\xE8s le nombre de pages. Ce qui compte est la quantit\xE9 de texte, pas le poids du fichier.";
    case "caracteres":
      return "Estim\xE9 d\u2019apr\xE8s la quantit\xE9 de texte \xE0 analyser.";
    default:
      return "Estim\xE9 d\u2019apr\xE8s la taille du fichier \u2014 approximatif pour ce format, dont le texte est compress\xE9.";
  }
}

// src/popup/termes.js
var SEPARATEURS = /[,;\t\r\n]+/;
function parseTermes(valeur) {
  return (valeur || "").split(SEPARATEURS).map((s) => s.trim()).filter(Boolean);
}
function ajouterTerme(valeur, terme) {
  const t = (terme || "").trim();
  if (!t) return valeur || "";
  const existants = parseTermes(valeur);
  if (existants.includes(t)) return valeur || "";
  return [...existants, t].join(", ");
}

// src/engine/pseudonyms.js
var LOCALES = {
  fr: {
    prenoms: [
      "Alexandre",
      "Antoine",
      "Baptiste",
      "Cl\xE9ment",
      "\xC9tienne",
      "Gabriel",
      "Hugo",
      "Jules",
      "Louis",
      "Lucas",
      "Maxime",
      "Nathan",
      "Paul",
      "Rapha\xEBl",
      "Romain",
      "Thomas",
      "Victor",
      "Julien",
      "Quentin",
      "Vincent",
      "Am\xE9lie",
      "Camille",
      "Charlotte",
      "Chlo\xE9",
      "\xC9lise",
      "Emma",
      "In\xE8s",
      "Juliette",
      "L\xE9a",
      "Louise",
      "Lucie",
      "Manon",
      "Mathilde",
      "No\xE9mie",
      "Pauline",
      "Marion",
      "H\xE9l\xE8ne",
      "Nathalie",
      "Aur\xE9lie",
      "\xC9milie"
    ],
    noms: [
      "Bernard",
      "Blanc",
      "Bonnet",
      "Chevalier",
      "Deschamps",
      "Dubois",
      "Dumont",
      "Durand",
      "Faure",
      "Fournier",
      "Garnier",
      "Gauthier",
      "Girard",
      "Lambert",
      "Lefebvre",
      "Legrand",
      "Lemaire",
      "Mercier",
      "Moreau",
      "Morel",
      "Petit",
      "Renard",
      "Richard",
      "Robin",
      "Rousseau",
      "Roux",
      "Simon",
      "Barbier",
      "Boyer",
      "Brun",
      "Colin",
      "Denis",
      "Leroy",
      "Perrin"
    ],
    villes: [
      "Paris",
      "Lyon",
      "Marseille",
      "Toulouse",
      "Bordeaux",
      "Lille",
      "Nantes",
      "Strasbourg",
      "Nice",
      "Montpellier",
      "Rennes",
      "Reims",
      "Grenoble",
      "Dijon",
      "Angers",
      "Tours",
      "Orl\xE9ans",
      "Metz"
    ],
    orgs: [
      "Nordis Conseil",
      "Alphatec",
      "Groupe Verti\xE8re",
      "Solunea",
      "Castel & Fils",
      "Novaris SARL",
      "Ateliers Brossard",
      "Delmont Industries",
      "Cabinet Ferrand",
      "Tessalis",
      "Ormeau Digital",
      "Clavier & Associ\xE9s",
      "Sequoia Services",
      "Baltane",
      "Comptoir Lorrain",
      "Studio Amarante"
    ],
    rues: [
      "rue des Acacias",
      "avenue des Peupliers",
      "boulevard Saint-Michel",
      "rue de la Fontaine",
      "impasse des Lilas",
      "chemin des Vignes",
      "place du March\xE9",
      "rue des \xC9coles",
      "avenue de la R\xE9publique",
      "rue du Moulin",
      "all\xE9e des Charmes",
      "quai des Brumes"
    ],
    emailDomains: ["exemple-mail.fr", "courriel-temp.fr", "boite-anonyme.fr", "pseudo-mail.fr"],
    mois: [
      "janvier",
      "f\xE9vrier",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "ao\xFBt",
      "septembre",
      "octobre",
      "novembre",
      "d\xE9cembre"
    ],
    phone: (h2, i) => {
      const digitsAt = (hh, n) => String(hh % 10 ** n).padStart(n, "0");
      const d = digitsAt(h2 + i * 104729 >>> 0, 8);
      const prefix = (h2 + i) % 2 === 0 ? "06" : "07";
      return `${prefix} ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
    }
  },
  en: {
    prenoms: [
      "James",
      "John",
      "Robert",
      "Michael",
      "William",
      "David",
      "Daniel",
      "Matthew",
      "Andrew",
      "Joseph",
      "Henry",
      "Samuel",
      "Benjamin",
      "Oliver",
      "Jack",
      "Thomas",
      "Charles",
      "George",
      "Edward",
      "Nathan",
      "Mary",
      "Jennifer",
      "Elizabeth",
      "Susan",
      "Jessica",
      "Sarah",
      "Karen",
      "Emma",
      "Olivia",
      "Emily",
      "Charlotte",
      "Grace",
      "Hannah",
      "Alice",
      "Rachel",
      "Laura",
      "Amy",
      "Claire",
      "Victoria",
      "Sophie"
    ],
    noms: [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Miller",
      "Davis",
      "Wilson",
      "Anderson",
      "Taylor",
      "Thomas",
      "Moore",
      "Jackson",
      "Martin",
      "Lee",
      "Walker",
      "Hall",
      "Allen",
      "Young",
      "King",
      "Wright",
      "Scott",
      "Green",
      "Baker",
      "Adams",
      "Nelson",
      "Carter",
      "Mitchell",
      "Roberts",
      "Turner",
      "Phillips",
      "Campbell",
      "Parker"
    ],
    villes: [
      "London",
      "Manchester",
      "Birmingham",
      "Leeds",
      "Bristol",
      "Liverpool",
      "New York",
      "Boston",
      "Chicago",
      "Austin",
      "Seattle",
      "Denver",
      "Toronto",
      "Vancouver",
      "Dublin",
      "Edinburgh",
      "Cardiff",
      "Glasgow"
    ],
    orgs: [
      "Northbridge Consulting",
      "Alphatech Ltd",
      "Verti\xE8re Group",
      "Solunea Inc",
      "Castel & Co",
      "Novaris Partners",
      "Brossard Studios",
      "Delmont Industries",
      "Ferrand Associates",
      "Tessalis",
      "Ormeau Digital",
      "Sequoia Services",
      "Baltane Corp",
      "Amarante Studio",
      "Fenwick & Partners",
      "Harlow Digital"
    ],
    rues: [
      "Acacia Street",
      "Poplar Avenue",
      "Saint Michael Boulevard",
      "Fountain Road",
      "Lilac Court",
      "Vineyard Lane",
      "Market Square",
      "School Street",
      "Republic Avenue",
      "Mill Road",
      "Elm Way",
      "Harbour Drive"
    ],
    emailDomains: ["example-mail.com", "temp-inbox.com", "anon-mailbox.com", "pseudo-mail.com"],
    mois: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    phone: (h2, i) => {
      const digitsAt = (hh, n) => String(hh % 10 ** n).padStart(n, "0");
      const area = 200 + (h2 + i) % 700;
      const d = digitsAt(h2 + i * 104729 >>> 0, 7);
      return `(${area}) ${d.slice(0, 3)}-${d.slice(3, 7)}`;
    }
  }
};
var REALISTIC_TYPES = /* @__PURE__ */ new Set([
  "PER",
  "ORG",
  "LOC",
  "ADRESSE",
  "EMAIL",
  "TELEPHONE",
  "DATE_NAISSANCE"
]);
var stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
function createPseudonymizer({ seed = "clarence", avoid = () => false, locale = "fr" } = {}) {
  const L = LOCALES[locale] || LOCALES.fr;
  const used = /* @__PURE__ */ new Set();
  const fnv = (str) => {
    let h = 2166136261;
    for (const c of seed + " " + str) {
      h ^= c.codePointAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  };
  const pick = (arr, h, i = 0) => arr[(h + i * 13) % arr.length];
  function unique(gen, h) {
    for (let i = 0; i < 300; i++) {
      const v = gen(h, i);
      if (v && !used.has(v) && !avoid(v)) {
        used.add(v);
        return v;
      }
    }
    return null;
  }
  const tokenMap = /* @__PURE__ */ new Map();
  const PARTICULES = /* @__PURE__ */ new Set([
    "de",
    "du",
    "des",
    "la",
    "le",
    "von",
    "van",
    "da",
    "di",
    "d'",
    "l'",
    "del",
    "bin",
    "ben"
  ]);
  const estConserve = (token, rang, total) => total > 1 && rang < total - 1 && PARTICULES.has(token.toLowerCase()) || isHonorificAt(token, rang, total);
  const applyCase = (pseudo, original) => original === original.toUpperCase() && new RegExp("\\p{L}{2}", "u").test(original) ? pseudo.toUpperCase() : pseudo;
  function pseudoToken(token, rang, total) {
    const isLast = rang === total - 1;
    if (estConserve(token, rang, total)) return token;
    const key = token.toLowerCase();
    if (tokenMap.has(key)) return applyCase(tokenMap.get(key), token);
    const estPatronyme = total > 1 ? isLast : token === token.toUpperCase() && new RegExp("\\p{L}{2}", "u").test(token);
    const pool = estPatronyme ? L.noms : L.prenoms;
    const v = unique((h2, i) => pick(pool, h2, i), fnv("PER_TOKEN:" + key));
    if (!v) return null;
    tokenMap.set(key, v);
    return applyCase(v, token);
  }
  const generators = {
    // Composition composant par composant (voir tokenMap ci-dessus). Les
    // séparateurs d'origine (espaces, traits d'union) sont préservés pour que
    // « Marc-Antoine » reste un composé à trait d'union.
    PER: (h, original) => {
      const parts = String(original).split(/([\s\-]+)/);
      const mots = parts.filter((p, i) => i % 2 === 0 && p);
      if (!mots.length) return null;
      let out = "";
      let rang = 0;
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
          out += parts[i];
          continue;
        }
        if (!parts[i]) continue;
        const p = pseudoToken(parts[i], rang, mots.length);
        if (!p) return null;
        out += p;
        rang++;
      }
      return !avoid(out) ? out : null;
    },
    ORG: (h) => unique((h2, i) => pick(L.orgs, h2, i), h),
    LOC: (h) => unique((h2, i) => pick(L.villes, h2, i), h),
    ADRESSE: (h) => unique((h2, i) => `${(h2 + i * 7) % 98 + 1} ${pick(L.rues, h2 >>> 3, i)}`, h),
    EMAIL: (h) => unique((h2, i) => {
      const prenom = stripAccents(pick(L.prenoms, h2, i));
      const nom = stripAccents(pick(L.noms, (h2 >>> 7) + i, i));
      return `${prenom}.${nom}@${pick(L.emailDomains, h2 >>> 11, i)}`;
    }, h),
    TELEPHONE: (h) => unique((h2, i) => L.phone(h2, i), h),
    // Le FORMAT d'origine est reproduit, pas seulement la nature de la donnée :
    // « january 1 2002 » devenait « 13/10/1976 », ce qui saute aux yeux au
    // milieu d'un texte anglais et trahit le passage de l'outil.
    DATE_NAISSANCE: (h, original) => unique((h2, i) => {
      const j = (h2 + i) % 28 + 1;
      const m = ((h2 >>> 4) + i) % 12 + 1;
      const a = 1965 + ((h2 >>> 9) + i) % 40;
      const litteral = new RegExp("\\p{L}{3}", "u").test(original);
      if (litteral) {
        const nom = L.mois[m - 1];
        const source = original.match(new RegExp("\\p{L}{3,}", "u"))?.[0] || "";
        const moisCase = source === source.toUpperCase() ? nom.toUpperCase() : source[0] === source[0].toLowerCase() ? nom.toLowerCase() : nom;
        return locale === "en" ? `${moisCase} ${j} ${a}` : `${j} ${moisCase} ${a}`;
      }
      const sep = original.includes("-") ? "-" : "/";
      return `${String(j).padStart(2, "0")}${sep}${String(m).padStart(2, "0")}${sep}${a}`;
    }, h)
  };
  return function pseudonymFor(type, value) {
    if (!REALISTIC_TYPES.has(type)) return null;
    const gen = generators[type];
    if (!gen) return null;
    return gen(fnv(type + ":" + value), value);
  };
}

// src/popup/profiles.js
var PROFILES_KEY = "clarenceProfiles";
var TECH_KEEP = [
  "React",
  "Angular",
  "Vue",
  "Svelte",
  "Node",
  "Node.js",
  "Deno",
  "Next.js",
  "Python",
  "Java",
  "Kotlin",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Scala",
  "C++",
  "C#",
  "FastAPI",
  "Django",
  "Flask",
  "Fastify",
  "Express",
  "Spring",
  "Laravel",
  "Symfony",
  "Prisma",
  "Sequelize",
  "Hibernate",
  "TypeORM",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "MariaDB",
  "Redis",
  "SQLite",
  "Elasticsearch",
  "Cassandra",
  "Docker",
  "Kubernetes",
  "Podman",
  "Terraform",
  "Ansible",
  "Ollama",
  "PyTorch",
  "TensorFlow",
  "Keras",
  "Scikit-learn",
  "NumPy",
  "Pandas",
  "Hugging Face",
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Jenkins",
  "CircleCI",
  "Linux",
  "Ubuntu",
  "Debian",
  "Bash",
  "Nginx",
  "Apache",
  "AWS",
  "Azure",
  "GCP",
  "Vercel",
  "Netlify",
  "Heroku",
  "Cloudflare",
  "Kafka",
  "Spark",
  "Airflow",
  "Hadoop",
  "Hive",
  "Sqoop",
  "RabbitMQ",
  "GraphQL",
  "Power BI",
  "Tableau",
  "Excel",
  "n8n",
  "Zapier",
  "Figma",
  "GPT-4o",
  "Llama",
  "Mistral",
  "Claude",
  "Gemini",
  "Transformers.js",
  "WebAssembly"
];
var PUBLIC_KEEP = [
  "ChatGPT",
  "OpenAI",
  "GPT-4",
  "GPT-4o",
  "Claude",
  "Anthropic",
  "Gemini",
  "Copilot",
  "Mistral",
  "LLaMA",
  "DeepSeek",
  "DeepL",
  "Google Translate",
  "Google",
  "Microsoft",
  "Meta",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Bing",
  "YouTube",
  "Reddit",
  "Wikipedia",
  "Twitter",
  "Slack",
  "Zoom",
  "Teams"
];
function defaultProfiles() {
  return [
    { name: "Vierge", alwaysKeep: [], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: "D\xE9veloppeur / Tech", alwaysKeep: [...TECH_KEEP, ...PUBLIC_KEEP], alwaysMask: [], disabledTypes: [], realistic: false },
    // Un document qui PARLE d'IA ou de plateformes n'est pas forcément un
    // document technique : ce profil sert le rédacteur, l'étudiant, le
    // chercheur — sans leur imposer la liste des frameworks.
    { name: "R\xE9daction / Recherche", alwaysKeep: [...PUBLIC_KEEP], alwaysMask: [], disabledTypes: [], realistic: false }
  ];
}
function normalizeProfile(p) {
  const arr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  return {
    name: typeof p?.name === "string" && p.name.trim() ? p.name.trim() : "Sans nom",
    alwaysKeep: arr(p?.alwaysKeep),
    alwaysMask: arr(p?.alwaysMask),
    disabledTypes: arr(p?.disabledTypes),
    realistic: !!p?.realistic
  };
}
function seedDefaults(existing) {
  const list = (Array.isArray(existing) ? existing : []).map(normalizeProfile);
  const names = new Set(list.map((p) => p.name));
  for (const d of defaultProfiles()) if (!names.has(d.name)) list.push(d);
  return list;
}
function hasStore() {
  return typeof chrome !== "undefined" && chrome.storage?.local;
}
async function loadProfiles() {
  if (!hasStore()) return seedDefaults([]);
  const r = await chrome.storage.local.get(PROFILES_KEY).catch(() => ({}));
  const seeded = seedDefaults(r?.[PROFILES_KEY]);
  if (!r?.[PROFILES_KEY]) await chrome.storage.local.set({ [PROFILES_KEY]: seeded }).catch(() => {
  });
  return seeded;
}
async function saveAllProfiles(list) {
  if (!hasStore()) return;
  await chrome.storage.local.set({ [PROFILES_KEY]: list.map(normalizeProfile) }).catch(() => {
  });
}
async function upsertProfile(profile) {
  const list = await loadProfiles();
  const p = normalizeProfile(profile);
  const idx = list.findIndex((x) => x.name === p.name);
  if (idx >= 0) list[idx] = p;
  else list.push(p);
  await saveAllProfiles(list);
  return list;
}
async function deleteProfile(name) {
  const list = (await loadProfiles()).filter((p) => p.name !== name);
  await saveAllProfiles(list);
  return list;
}

// src/popup/identity.js
var IDENTITY_KEY = "clarenceIdentity";
var IDENTITY_FIELDS = [
  ["prenom", "Pr\xE9nom(s)"],
  ["nom", "Nom(s) de famille"],
  ["emails", "Emails"],
  ["telephones", "T\xE9l\xE9phones"],
  ["adresse", "Adresse postale"],
  ["ville", "Ville"],
  ["dateNaissance", "Date de naissance"],
  ["employeurs", "Employeur(s), entreprise(s)"],
  ["ecoles", "\xC9cole(s), universit\xE9(s)"],
  ["pseudos", "Pseudos, handles (GitHub, LinkedIn\u2026)"],
  ["autres", "Autres termes \xE0 toujours masquer"]
];
var splitLines = (v) => String(v ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
function normalizeIdentity(raw) {
  const champs = {};
  for (const [key] of IDENTITY_FIELDS) {
    champs[key] = splitLines(Array.isArray(raw?.champs?.[key]) ? raw.champs[key].join("\n") : raw?.champs?.[key]);
  }
  const status = ["configur\xE9", "refus\xE9"].includes(raw?.status) ? raw.status : "neuf";
  return { status, champs };
}
var MIN_TERM_LENGTH = 2;
function identityTerms(identity) {
  const { champs } = normalizeIdentity(identity);
  const vus = /* @__PURE__ */ new Set();
  const out = [];
  for (const [key] of IDENTITY_FIELDS) {
    for (const terme of champs[key]) {
      if (terme.length < MIN_TERM_LENGTH) continue;
      const k = terme.toLowerCase();
      if (vus.has(k)) continue;
      vus.add(k);
      out.push(terme);
    }
  }
  return out;
}
function caseVariants(terme) {
  const title = terme.replace(
    new RegExp("\\p{L}[\\p{L}'\u2019-]*", "gu"),
    (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
  );
  return [terme, terme.toUpperCase(), terme.toLowerCase(), title];
}
function identitySearchTerms(identity) {
  const vus = /* @__PURE__ */ new Set();
  const out = [];
  for (const terme of identityTerms(identity)) {
    for (const v of caseVariants(terme)) {
      if (vus.has(v)) continue;
      vus.add(v);
      out.push(v);
    }
  }
  return out;
}
function hasStore2() {
  return typeof chrome !== "undefined" && chrome.storage?.local;
}
async function loadIdentity() {
  if (!hasStore2()) return normalizeIdentity(null);
  const r = await chrome.storage.local.get(IDENTITY_KEY).catch(() => ({}));
  return normalizeIdentity(r?.[IDENTITY_KEY]);
}
async function saveIdentity(identity) {
  if (!hasStore2()) return;
  await chrome.storage.local.set({ [IDENTITY_KEY]: normalizeIdentity(identity) }).catch(() => {
  });
}
async function clearIdentity() {
  if (!hasStore2()) return;
  await chrome.storage.local.remove(IDENTITY_KEY).catch(() => {
  });
}

// src/popup/main.js
var currentText = "";
var autoEntities = [];
var manualEntities = [];
var removedKeys = /* @__PURE__ */ new Set();
var disabledTypes = new Set(TYPES_PEU_FIABLES);
var TYPE_DISPLAY = {
  PER: "Noms",
  ORG: "Entreprises",
  LOC: "Lieux",
  EMAIL: "Emails",
  TELEPHONE: "T\xE9l\xE9phones",
  IBAN: "IBAN",
  CARTE_BANCAIRE: "Cartes",
  NIR: "NIR",
  SIRET_SIREN: "SIRET/SIREN",
  CODE_POSTAL_VILLE: "Code postal",
  MONTANT: "Montants",
  ADRESSE: "Adresses",
  DATE_NAISSANCE: "Dates naiss.",
  REFERENCE: "R\xE9f\xE9rences",
  IP: "IP",
  MAC: "MAC",
  BIC: "BIC",
  PSEUDO: "Pseudos/handles",
  DATE: "Dates sensibles",
  ID_NATIONAL: "ID nationaux",
  // Apportés par la détection zero-shot. Décocher un de ces types SAUTE
  // l'inférence correspondante (voir GROUPES dans engine/gliner.js) : on ne
  // paie que ce qu'on demande.
  POSTE: "Postes",
  NATIONALITE: "Nationalit\xE9s",
  ETABLISSEMENT: "\xC9tablissements",
  SANTE: "Sant\xE9",
  MISC: "Divers",
  PERSONNALISE: "Perso"
};
var parseLines = parseTermes;
var APERCUS_TERMES = [
  ["docKeep", "docKeepLus"],
  ["docMask", "docMaskLus"],
  ["fileAlwaysKeep", "fileAlwaysKeepLus"],
  ["fileAlwaysMask", "fileAlwaysMaskLus"]
];
function rendreApercuTermes() {
  for (const [idChamp, idApercu] of APERCUS_TERMES) {
    const champ = $(idChamp), apercu = $(idApercu);
    if (!champ || !apercu) continue;
    const termes = parseTermes(champ.value);
    apercu.textContent = termes.length ? `${termes.length} terme${termes.length > 1 ? "s" : ""} : ${termes.join(" \xB7 ")}` : "";
  }
}
var nerPipe = null;
var nerLoading = false;
var pseudoSeed = Math.random().toString(36).slice(2);
function maskOptions() {
  if (!$("realisticToggle")?.checked) return {};
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      // anti-collision : jamais un pseudo déjà présent dans le texte réel
      avoid: (v) => currentText.includes(v),
      locale: $("pseudoLocale")?.value || "fr"
    })
  };
}
var lastMapping = [];
var lastReinjected = "";
var overlayKind = null;
chrome.storage?.session?.get("clarenceMapping").then((r) => {
  if (Array.isArray(r?.clarenceMapping) && r.clarenceMapping.length && !lastMapping.length) {
    lastMapping = r.clarenceMapping;
  }
}).catch(() => {
});
var $ = (id) => document.getElementById(id);
if (new URLSearchParams(location.search).has("panel")) {
  document.body.classList.add("panel-mode");
  document.documentElement.classList.add("panel-mode");
  document.documentElement.style.background = "#FFFAF2";
  const shell = document.querySelector(".popup-shell");
  const announce = () => window.parent.postMessage(
    { clarencePanelHeight: shell.offsetHeight },
    "*"
  );
  new ResizeObserver(announce).observe(shell);
  window.addEventListener("load", announce);
  document.addEventListener("toggle", () => {
    announce();
    setTimeout(announce, 0);
  }, true);
}
var keyOf = entityKey;
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function activeEntities() {
  const forced = forcedMasks(
    currentText,
    [...parseLines($("alwaysMask")?.value), ...identityForceTerms()]
  );
  const sel = selectActive(autoEntities, [...manualEntities, ...forced], removedKeys);
  return filterByRules(sel, { disabledTypes, keepValues: parseLines($("alwaysKeep")?.value) });
}
function renderTypeChips(boxId, disabledSet) {
  const box = $(boxId);
  if (!box) return;
  box.innerHTML = Object.entries(TYPE_DISPLAY).filter(([t]) => t !== "PERSONNALISE").map(([t, label]) => {
    const off = disabledSet.has(t);
    return `<label class="type-chip ${off ? "off" : ""}"><input type="checkbox" data-type="${t}" ${off ? "" : "checked"}><span class="square-checkbox" aria-hidden="true"></span><span class="checkbox-label-text">${esc(label)}</span></label>`;
  }).join("");
}
renderTypeChips("typeToggles", disabledTypes);
function annotateHTML(text, entities) {
  let html = "";
  let cursor = 0;
  for (const e of entities) {
    html += esc(text.slice(cursor, e.start));
    html += `<mark class="src-${e.source}" data-key="${keyOf(e)}" title="${e.type} \u2014 clic pour retirer">${esc(e.value)}</mark>`;
    cursor = e.end;
  }
  html += esc(text.slice(cursor));
  return html;
}
var PREVIEW_LIMIT = 500;
function clipToLimit(text, entities, limit) {
  if (text.length <= limit) return { text, entities, truncated: false };
  const clipped = text.slice(0, limit);
  const kept = [];
  for (const e of entities) {
    if (e.start >= limit) break;
    kept.push(e.end <= limit ? e : { ...e, end: limit, value: text.slice(e.start, limit) });
  }
  return { text: clipped, entities: kept, truncated: true };
}
function overlayContentFor(kind) {
  if (kind === "annotated") {
    return { title: "D\xE9tections compl\xE8tes", html: annotateHTML(currentText, activeEntities()) };
  }
  if (kind === "masked") {
    const { masked } = maskText(currentText, activeEntities(), maskOptions());
    return { title: "Texte propre complet", text: masked, copy: () => navigator.clipboard.writeText(masked) };
  }
  if (kind === "reinjected") {
    return { title: "R\xE9ponse d\xE9sanonymis\xE9e compl\xE8te", text: lastReinjected, copy: () => navigator.clipboard.writeText(lastReinjected) };
  }
  return null;
}
function openOverlay(kind) {
  const data = overlayContentFor(kind);
  if (!data) return;
  overlayKind = kind;
  $("overlayTitle").textContent = data.title;
  if (data.html != null) $("overlayBody").innerHTML = data.html;
  else $("overlayBody").textContent = data.text;
  $("overlayCopyBtn").hidden = !data.copy;
  $("overlayCopyBtn").onclick = data.copy || null;
  $("overlay").hidden = false;
}
function closeOverlay() {
  overlayKind = null;
  $("overlay").hidden = true;
}
function refreshOverlayIfOpen() {
  if (overlayKind) openOverlay(overlayKind);
}
function render() {
  const entities = activeEntities();
  $("results").hidden = false;
  $("textOptions").hidden = false;
  $("reinjectSection").hidden = false;
  renderTypeChips("typeToggles", disabledTypes);
  const annPreview = clipToLimit(currentText, entities, PREVIEW_LIMIT);
  $("annotated").innerHTML = annotateHTML(annPreview.text, annPreview.entities) + (annPreview.truncated ? "\u2026" : "");
  $("annotatedMoreBtn").hidden = !annPreview.truncated;
  const { masked, mapping } = maskText(currentText, entities, maskOptions());
  const maskedTruncated = masked.length > PREVIEW_LIMIT;
  $("masked").textContent = maskedTruncated ? masked.slice(0, PREVIEW_LIMIT) + "\u2026" : masked;
  $("maskedMoreBtn").hidden = !maskedTruncated;
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {
  });
  $("mappingWrap").innerHTML = mapping.length ? `<table>${mapping.map(
    (m) => `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td></tr>`
  ).join("")}</table>` : "<p>Aucun masque actif.</p>";
  $("status").textContent = entities.length ? `${entities.length} \xE9l\xE9ment(s) masqu\xE9(s).` : "Rien d\xE9tect\xE9 \u2014 ajoute un masque manuel si besoin.";
  $("status").className = "status";
  refreshOverlayIfOpen();
}
var MAX_INPUT = 8e3;
var ACCELERATEUR = "webgpu";
var GLINER_MODEL_URL = glinerModelUrl();
var nerWorker = null;
var nerReqId = 0;
var nerEngine = null;
var nerPending = /* @__PURE__ */ new Map();
function createNerWorker() {
  const worker = new Worker(chrome.runtime.getURL("popup/ner-worker.js"), { type: "module" });
  worker.addEventListener("message", (ev) => {
    const msg = ev.data || {};
    if (msg.type === "progress" && msg.total) {
      const pct = Math.round(msg.loaded / msg.total * 100);
      setStatus(`Mod\xE8le\u2026 ${pct} %`);
      const ratio = msg.loaded / msg.total;
      if (!$("fileMode")?.hidden) avancerEtape("detection", ratio);
      else setTextProgress(ratio);
      return;
    }
    if (msg.type === "result" || msg.type === "error" && msg.id != null) {
      const p = nerPending.get(msg.id);
      if (!p) return;
      nerPending.delete(msg.id);
      msg.type === "result" ? p.resolve(msg.spansBatch ?? msg.spans ?? msg.tokens ?? msg.flux) : p.reject(new Error(msg.message));
    }
  });
  return worker;
}
function startEngine(engine) {
  const worker = createNerWorker();
  return new Promise((resolve, reject) => {
    const onInit = (ev) => {
      const msg = ev.data || {};
      if (msg.type === "ready") {
        worker.removeEventListener("message", onInit);
        resolve(worker);
      } else if (msg.type === "error" && msg.id == null) {
        worker.removeEventListener("message", onInit);
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.addEventListener("message", onInit);
    worker.addEventListener("error", (e) => {
      worker.terminate();
      reject(new Error(e.message || "worker de d\xE9tection indisponible"));
    });
    worker.postMessage({
      type: "init",
      engine,
      wasmPath: chrome.runtime.getURL("vendor/"),
      model: engine === "gliner" ? GLINER_MODEL : NER_MODEL,
      modelUrl: engine === "gliner" ? GLINER_MODEL_URL : null,
      accelerateur: ACCELERATEUR
    });
  });
}
async function ensureNER() {
  if (nerPipe || nerLoading) return;
  nerLoading = true;
  setStatus("Chargement du mod\xE8le\u2026 (~180 Mo au premier usage)");
  try {
    let worker = null;
    try {
      worker = await startEngine("gliner");
      nerEngine = "gliner";
    } catch (err) {
      console.warn("GLiNER indisponible, repli sur le NER BERT :", err);
      worker = await startEngine("bert");
      nerEngine = "bert";
    }
    nerWorker = worker;
    const envoyer = (charge) => new Promise((resolve, reject) => {
      if (!nerWorker) return reject(new OperationAnnulee());
      const id = ++nerReqId;
      nerPending.set(id, { resolve, reject });
      nerWorker.postMessage({ type: "run", id, ...charge });
    });
    nerPipe = nerEngine === "gliner" ? createBatchedPipeline((texts, labels) => envoyer({ texts, labels })) : (text, labels) => envoyer({ text, labels });
  } catch (err) {
    console.error(err);
  } finally {
    nerLoading = false;
  }
}
var compressionInfo = null;
var compressionEchouee = null;
function crochetCompression() {
  if (!$("fileCompress")?.checked || !compressionWorker) return null;
  const taux = Number($("fileCompressTaux")?.value || 0.5);
  let fait = 0;
  return async (segments, info) => {
    fait++;
    if (info?.total) await compressionProgress({ fait, total: info.total });
    try {
      const r = await compresserSegments(segments, compressionPipeline(), { taux });
      compressionInfo = {
        avant: (compressionInfo?.avant || 0) + r.tokensAvant,
        apres: (compressionInfo?.apres || 0) + r.tokensApres
      };
      return r.segments;
    } catch (err) {
      console.error("[clarence] compression interrompue :", err);
      compressionEchouee = compressionEchouee || String(err?.message || err);
      return segments;
    }
  };
}
var compressionWorker = null;
var compressionReqId = 0;
var compressionPending = /* @__PURE__ */ new Map();
async function ensureCompression() {
  if (compressionWorker) return { ok: true };
  const worker = new Worker(chrome.runtime.getURL("popup/compression-worker.js"), { type: "module" });
  worker.addEventListener("message", (ev) => {
    const msg = ev.data || {};
    if (msg.type === "progress" && msg.total) {
      const pct = Math.round(msg.loaded / msg.total * 100);
      fileSetStatus(`Mod\xE8le de compression\u2026 ${pct} %`);
      return;
    }
    if (msg.id == null) return;
    const p = compressionPending.get(msg.id);
    if (!p) return;
    compressionPending.delete(msg.id);
    msg.type === "result" ? p.resolve(msg.flux) : p.reject(new Error(msg.message));
  });
  const issue = await new Promise((resolve) => {
    const onReady = (ev) => {
      const msg = ev.data || {};
      if (msg.type === "compressionReady") {
        worker.removeEventListener("message", onReady);
        resolve({ ok: true });
      } else if (msg.type === "error" && msg.id == null) {
        worker.removeEventListener("message", onReady);
        console.error("[clarence] compression indisponible :", msg.message);
        worker.terminate();
        resolve({ ok: false, message: msg.message });
      }
    };
    const minuteur = setTimeout(() => {
      worker.removeEventListener("message", onReady);
      worker.terminate();
      resolve({ ok: false, message: "d\xE9lai d\xE9pass\xE9 au chargement du mod\xE8le" });
    }, 18e4);
    worker.addEventListener("message", onReady);
    worker.postMessage({
      type: "initCompression",
      wasmPath: chrome.runtime.getURL("vendor/"),
      model: COMPRESSION_MODEL
    });
    const stop = () => clearTimeout(minuteur);
    worker.addEventListener("message", stop, { once: true });
  });
  if (issue.ok) compressionWorker = worker;
  return issue;
}
var compressionPipeline = () => (texte) => new Promise((resolve, reject) => {
  if (!compressionWorker) return reject(new Error("compression non charg\xE9e"));
  const id = ++compressionReqId;
  compressionPending.set(id, { resolve, reject });
  compressionWorker.postMessage({ type: "compress", id, text: texte });
});
function purgerWorkerNer(raison) {
  for (const p of nerPending.values()) p.reject(raison);
  nerPending.clear();
  if (nerWorker) nerWorker.terminate();
  nerWorker = null;
  nerPipe = null;
  nerEngine = null;
  nerLoading = false;
}
function contextualDetector() {
  return nerEngine === "gliner" ? detectGliner : detectNER;
}
function arbitreContextuel() {
  if (nerEngine !== "gliner" || !nerPipe) return void 0;
  return (entities) => arbitrerFauxPositifs(entities, nerPipe);
}
function detectContextual(text, opts = {}) {
  if (!nerPipe) return [];
  return contextualDetector()(text, nerPipe, opts);
}
async function analyze() {
  const text = $("input").value;
  if (!text.trim()) return;
  if (text.length > MAX_INPUT) {
    setStatus(`Texte trop long (${text.length.toLocaleString("fr-FR")} caract\xE8res, max ${MAX_INPUT.toLocaleString("fr-FR")}). D\xE9coupe-le.`, "error");
    return;
  }
  if (text !== currentText) {
    manualEntities = [];
    removedKeys = /* @__PURE__ */ new Set();
  }
  currentText = text;
  const btn = $("analyzeBtn");
  btn.disabled = true;
  setProcessing(true);
  try {
    await ensureNER();
    const rx = [...detectRegex(text), ...detectPhonesIntl(text)];
    const ner = await detectContextual(text, {
      disabledTypes,
      onProgress: ({ done, total }) => {
        setTextProgress(total ? done / total : null);
        return new Promise((r) => setTimeout(r, 0));
      }
    });
    autoEntities = mergeEntities(rx, ner);
    render();
    renderEngineBadge("engineBadge");
  } catch (err) {
    console.error(err);
    $("results").hidden = true;
    setStatus("Analyse \xE9chou\xE9e \u2014 rien n\u2019a \xE9t\xE9 masqu\xE9, ne colle pas ce texte. D\xE9tail dans la console.", "error");
  } finally {
    setProcessing(false);
    setTextProgress(null);
    btn.disabled = false;
  }
}
function maskSelection() {
  const ta = $("input");
  const s = ta.selectionStart, e = ta.selectionEnd;
  if (ta.value !== currentText) {
    setStatus("Lance Analyser d\u2019abord, puis s\xE9lectionne le passage.", "error");
    return;
  }
  if (s === e) {
    setStatus("S\xE9lectionne d\u2019abord un passage dans la zone de texte.", "error");
    return;
  }
  if (manualEntities.some((m) => m.start === s && m.end === e)) {
    setStatus("Ce passage est d\xE9j\xE0 masqu\xE9.", "error");
    return;
  }
  manualEntities.push({
    type: "PERSONNALISE",
    value: currentText.slice(s, e),
    start: s,
    end: e,
    source: "manuel"
  });
  render();
}
async function copyClean() {
  const { masked } = maskText(currentText, activeEntities(), maskOptions());
  await navigator.clipboard.writeText(masked);
  $("copyStatus").textContent = "Copi\xE9 \u2014 relis avant de coller.";
  $("copyStatus").className = "status active";
  setTimeout(() => {
    $("copyStatus").textContent = "";
  }, 4e3);
}
function setStatus(msg, cls = "") {
  $("status").textContent = msg;
  $("status").className = "status " + cls;
}
var ENGINE_MESSAGES = {
  bert: {
    cls: "fallback",
    texte: "D\xE9tection de secours active \u2014 le moteur principal n'a pas pu d\xE9marrer. Les noms isol\xE9s sans phrase autour (titre de CV, cellule de tableau) risquent d'\xEAtre manqu\xE9s. Relis attentivement."
  },
  none: {
    cls: "none",
    texte: "D\xE9tection des noms INDISPONIBLE \u2014 seules les donn\xE9es structur\xE9es (emails, IBAN, t\xE9l\xE9phones\u2026) ont \xE9t\xE9 rep\xE9r\xE9es. Relis attentivement avant de coller."
  }
};
function renderEngineBadge(id) {
  const el = $(id);
  if (!el) return;
  const etat = !nerPipe ? "none" : nerEngine === "bert" ? "bert" : null;
  if (!etat) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.className = "engine-badge " + ENGINE_MESSAGES[etat].cls;
  el.textContent = ENGINE_MESSAGES[etat].texte;
}
$("analyzeBtn").addEventListener("click", analyze);
$("realisticToggle").addEventListener("change", () => {
  if (currentText) render();
});
$("alwaysMask")?.addEventListener("input", () => {
  if (currentText) render();
});
$("alwaysKeep")?.addEventListener("input", () => {
  if (currentText) render();
});
$("typeToggles")?.addEventListener("change", (ev) => {
  const cb = ev.target.closest("input[data-type]");
  if (!cb) return;
  if (cb.checked) disabledTypes.delete(cb.dataset.type);
  else disabledTypes.add(cb.dataset.type);
  if (currentText) render();
  else renderTypeChips("typeToggles", disabledTypes);
});
$("maskSelBtn").addEventListener("click", maskSelection);
$("copyBtn").addEventListener("click", copyClean);
$("toggleReinjectBtn").addEventListener("click", () => {
  const zone = $("reinjectZone");
  zone.hidden = !zone.hidden;
  $("toggleReinjectBtn").textContent = zone.hidden ? "D\xE9sanonymiser une r\xE9ponse\u2026" : "Masquer la d\xE9sanonymisation";
});
$("reinjectBtn").addEventListener("click", () => {
  const txt = $("reinjectInput").value;
  if (!txt.trim()) return;
  const st = $("reinjectStatus");
  if (!lastMapping.length) {
    st.textContent = "Aucune correspondance en m\xE9moire \u2014 analyse un texte d\u2019abord.";
    st.className = "status error";
    return;
  }
  const found = lastMapping.filter((m) => txt.includes(m.placeholder)).length;
  lastReinjected = reinject(txt, lastMapping);
  const truncated = lastReinjected.length > PREVIEW_LIMIT;
  $("reinjected").hidden = false;
  $("reinjected").textContent = truncated ? lastReinjected.slice(0, PREVIEW_LIMIT) + "\u2026" : lastReinjected;
  $("reinjectedMoreBtn").hidden = !truncated;
  $("copyReinjectBtn").hidden = false;
  st.textContent = found ? `${found} placeholder(s) restitu\xE9(s).` : "Aucun placeholder connu dans ce texte (la table correspond \xE0 la derni\xE8re anonymisation).";
  st.className = "status " + (found ? "active" : "error");
  refreshOverlayIfOpen();
});
$("copyReinjectBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(lastReinjected);
  const st = $("reinjectStatus");
  st.textContent = "Copi\xE9.";
  st.className = "status active";
});
document.addEventListener("click", (ev) => {
  const mark = ev.target.closest("mark");
  if (!mark) return;
  removedKeys.add(mark.dataset.key);
  render();
});
for (const [btnId, kind] of [
  ["annotatedMoreBtn", "annotated"],
  ["maskedMoreBtn", "masked"],
  ["reinjectedMoreBtn", "reinjected"]
]) {
  $(btnId).addEventListener("click", () => openOverlay(kind));
}
$("overlayCloseBtn").addEventListener("click", closeOverlay);
$("overlay").addEventListener("click", (ev) => {
  if (ev.target === $("overlay")) closeOverlay();
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && overlayKind) closeOverlay();
});
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var FILE_TYPES = {
  csv: { mime: "text/csv;charset=utf-8", text: true, load: () => import("./csv-adapter-WGD4I4OD.js") },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", text: false, load: () => import("./xlsx-adapter-6GL77ULE.js") },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", text: false, load: () => import("./docx-adapter-DOKUCGU6.js") },
  // PDF : seul format dont la sortie n'est pas une réécriture du fichier
  // d'origine mais un nouveau document (.md) — outExt gère ce cas particulier
  // dans processFile() (nom de fichier ET extension de sortie changent).
  pdf: { mime: "text/markdown;charset=utf-8", text: false, load: () => import("./pdf-adapter-AJNLKGKK.js"), outExt: ".md" },
  // Images : metadataOnly → processFile() court-circuite le pipeline de
  // détection/masquage (une image n'a pas d'unités PII textuelles) et appelle
  // uniquement stripMetadata (re-encodage canvas, retire EXIF/GPS/chunks).
  jpg: { mime: "image/jpeg", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") },
  jpeg: { mime: "image/jpeg", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") },
  png: { mime: "image/png", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") }
};
var chosenFile = null;
var fileRun = null;
var fileRunId = 0;
var fileOutBlob = null;
var fileOutName = "";
var fileDisabledTypes = new Set(TYPES_PEU_FIABLES);
renderTypeChips("fileTypeToggles", fileDisabledTypes);
$("fileTypeToggles")?.addEventListener("change", (ev) => {
  const cb = ev.target.closest("input[data-type]");
  if (!cb) return;
  if (cb.checked) fileDisabledTypes.delete(cb.dataset.type);
  else fileDisabledTypes.add(cb.dataset.type);
  renderTypeChips("fileTypeToggles", fileDisabledTypes);
  invalidateFileResult();
});
function invalidateFileResult() {
  if (annulerRunFichier("Options modifi\xE9es \u2014 relance l\u2019anonymisation.")) return;
  if (!fileOutBlob) return;
  fileOutBlob = null;
  compressionInfo = null;
  compressionEchouee = null;
  fileOutName = "";
  $("fileResults").hidden = true;
  $("dragCard").hidden = true;
  fileSetStatus("Options modifi\xE9es \u2014 relance.");
}
for (const id of ["pdfModeLight", "pdfModePreserve", "fileRealisticToggle", "filePseudoLocale"]) {
  $(id)?.addEventListener("change", invalidateFileResult);
}
for (const id of ["fileAlwaysMask", "fileAlwaysKeep", "docKeep", "docMask"]) {
  $(id)?.addEventListener("input", invalidateFileResult);
}
function fileSetStatus(msg, cls = "") {
  $("fileStatus").textContent = msg;
  $("fileStatus").className = "status " + cls;
}
function extOf(name) {
  const m = /\.([^.]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}
function afficherPoids(file, ext) {
  const badge = $("filePoids");
  const rendre = (poids) => {
    badge.textContent = poids.libelle;
    badge.className = `poids-badge ${poids.classe}`;
    badge.title = expliquerPoids(poids);
    badge.hidden = false;
  };
  rendre(poidsDeTraitement({ ext, taille: file.size }));
  if (ext !== "pdf") return;
  const pourCeFichier = chosenFile;
  (async () => {
    try {
      const pdfjs = await import("./pdf-ITQTBJLX.js");
      if (chrome?.runtime?.getURL) {
        pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.min.mjs");
      }
      const buf = await pourCeFichier.arrayBuffer();
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buf),
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true
      }).promise;
      if (chosenFile !== pourCeFichier) return;
      rendre(poidsDeTraitement({ ext, taille: file.size, pages: doc.numPages }));
    } catch {
    }
  })();
}
function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
function setChosenFile(file) {
  if (!file) return;
  const ext = extOf(file.name);
  if (!FILE_TYPES[ext]) {
    fileSetStatus("Format non pris en charge.", "error");
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    fileSetStatus(`Fichier trop lourd (${humanSize(file.size)}, max ${humanSize(MAX_FILE_BYTES)}).`, "error");
    return;
  }
  annulerRunFichier("");
  fileRegen = null;
  chosenFile = file;
  fileOutBlob = null;
  compressionInfo = null;
  compressionEchouee = null;
  if ($("docKeep")) $("docKeep").value = "";
  if ($("docMask")) $("docMask").value = "";
  rendreApercuTermes();
  const fileNameEl = $("fileName");
  const fileMainEl = fileNameEl?.querySelector(".file-name-main");
  const fileExtEl = fileNameEl?.querySelector(".file-name-ext");
  const lastDot = file.name.lastIndexOf(".");
  if (fileMainEl && fileExtEl) {
    if (lastDot > 0 && lastDot < file.name.length - 1) {
      const ext2 = file.name.slice(lastDot + 1).toLowerCase();
      fileMainEl.textContent = file.name.slice(0, lastDot);
      fileExtEl.textContent = `.${ext2}`;
      fileExtEl.hidden = false;
      fileExtEl.className = `file-name-ext file-name-ext--${ext2}`;
    } else {
      fileMainEl.textContent = file.name;
      fileExtEl.textContent = "";
      fileExtEl.hidden = true;
      fileExtEl.className = "file-name-ext";
    }
  } else {
    fileNameEl.textContent = file.name;
  }
  $("fileSize").textContent = humanSize(file.size);
  afficherPoids(file, ext);
  $("fileChosen").hidden = false;
  $("fileOptions").hidden = !!FILE_TYPES[ext].metadataOnly;
  $("pdfModeChoice").hidden = ext !== "pdf";
  majVisibiliteCompression(ext);
  $("fileAnalyzeBtn").textContent = FILE_TYPES[ext].metadataOnly ? "Nettoyer les m\xE9tadonn\xE9es" : "Anonymiser le fichier";
  $("fileResults").hidden = true;
  fileSetStatus("");
}
function fileMaskOptions(units = []) {
  if (!$("fileRealisticToggle")?.checked) return {};
  const joined = units.map((u) => u.text).join("\n");
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      avoid: (v) => joined.includes(v),
      locale: $("filePseudoLocale")?.value || "fr"
    })
  };
}
var fileRegen = null;
var termesAGarder = () => [
  ...parseLines($("fileAlwaysKeep")?.value),
  ...parseLines($("docKeep")?.value)
];
var termesAMasquer = () => [
  ...parseLines($("fileAlwaysMask")?.value),
  ...parseLines($("docMask")?.value),
  ...identityForceTerms()
];
async function retirerDuMasquage(valeur) {
  const champ = $("docKeep");
  if (!fileRegen || !champ) return;
  const avant = champ.value;
  champ.value = ajouterTerme(avant, valeur);
  if (champ.value === avant) return;
  rendreApercuTermes();
  const btn = $("fileAnalyzeBtn");
  btn.disabled = true;
  fileSetStatus("Mise \xE0 jour du fichier\u2026");
  try {
    const r = fileRegen;
    const keepValues = termesAGarder();
    const forceTerms = termesAMasquer();
    let mapping;
    if (r.mode === "pdf") {
      const { reconstructPdf } = await import("./pdf-reconstruct-JVUDTBKP.js");
      const pdflib = await import("./es-RR6ZCDY3.js");
      const res = await reconstructPdf(r.tampon.slice(0), {
        entitesConnues: r.entites,
        maskOpts: fileMaskOptions(),
        forceTerms,
        keepValues,
        disabledTypes: fileDisabledTypes,
        deps: { PDFDocument: pdflib.PDFDocument, StandardFonts: pdflib.StandardFonts }
      });
      fileOutBlob = new Blob([res.buffer], { type: "application/pdf" });
      mapping = res.mapping;
    } else {
      const { anonymizeUnits } = await import("./anonymize-units-MAGN2IQP.js");
      const { results, mapping: m } = await anonymizeUnits(r.units, {
        entitesConnues: r.entites,
        intitules: r.intitules,
        maskOpts: fileMaskOptions(r.units),
        forceTerms,
        keepValues,
        disabledTypes: fileDisabledTypes
      });
      const byId = new Map(results.map((x) => [x.id, { maskedText: x.maskedText, entities: x.entities }]));
      const masked = await r.adapter.applyMask(r.input, byId);
      fileOutBlob = new Blob([await r.adapter.stripMetadata(masked)], { type: r.kind.mime });
      mapping = m;
    }
    showFileResults(mapping, r.kind.mime.startsWith("text/"));
    fileSetStatus(`\xAB ${valeur} \xBB n\u2019est plus masqu\xE9.`);
  } catch (err) {
    console.error(err);
    champ.value = avant;
    rendreApercuTermes();
    fileSetStatus("Mise \xE0 jour impossible. D\xE9tail en console.", "error");
  } finally {
    btn.disabled = false;
  }
}
function compressionApplicable(ext) {
  return !!(ext && FILE_TYPES[ext] && !FILE_TYPES[ext].metadataOnly);
}
function majVisibiliteCompression(ext) {
  const bloc = $("fileCompressBtn");
  if (!bloc) return;
  bloc.hidden = !compressionApplicable(ext);
  if (bloc.hidden && $("fileCompress")) $("fileCompress").checked = false;
  majVisibiliteTaux();
}
function majSousOptions() {
  const paires = [
    ["fileCompress", "fileCompressTauxLabel"],
    ["fileRealisticToggle", "filePseudoLocaleLabel"],
    ["realisticToggle", "pseudoLocaleLabel"]
  ];
  for (const [idCase, idSousOption] of paires) {
    const l = $(idSousOption);
    if (l) l.hidden = !$(idCase)?.checked;
  }
}
var majVisibiliteTaux = majSousOptions;
function formatDuree(ms) {
  const s = ms / 1e3;
  if (s < 10) return `${s.toFixed(1)} s`;
  if (s < 60) return `${Math.round(s)} s`;
  const min = Math.floor(s / 60);
  const reste = Math.round(s % 60);
  return reste ? `${min} min ${reste}` : `${min} min`;
}
function showFileResults(mapping, copyable, duree) {
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {
  });
  const triees = [...mapping].sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
  $("fileMappingWrap").innerHTML = mapping.length ? `<table>${triees.map(
    (m) => `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td><td class="map-occ">${m.occurrences || 1}\xD7</td><td><button type="button" class="map-retirer" data-valeur="${esc(m.value)}" title="Ne plus masquer ce terme dans tout le document">ne plus masquer</button></td></tr>`
  ).join("")}</table>` : "<p>Aucun masque actif.</p>";
  const suffixe = (duree ? ` ${duree}.` : "") + (compressionEchouee ? ` \u26A0 Compression indisponible : ${compressionEchouee}.` : "") + (compressionInfo ? ` \u2248 ${compressionInfo.avant} \u2192 ${compressionInfo.apres} tokens (\u2212${Math.round((1 - compressionInfo.apres / compressionInfo.avant) * 100)} %).` : "");
  $("fileSummary").textContent = (mapping.length ? `${mapping.length} valeurs masqu\xE9es, m\xE9tadonn\xE9es nettoy\xE9es.` : "Aucune donn\xE9e sensible d\xE9tect\xE9e \u2014 m\xE9tadonn\xE9es nettoy\xE9es.") + suffixe;
  $("fileSummary").className = "status active";
  $("fileResults").hidden = false;
  $("fileCopyBtn").hidden = !copyable;
  $("reinjectSection").hidden = false;
  $("dragCard").hidden = !document.body.classList.contains("panel-mode");
}
function setProgress(trackId, fillId, ratio) {
  const track = $(trackId);
  const fill = $(fillId);
  if (!track || !fill) return;
  if (ratio == null) {
    track.hidden = true;
    fill.style.transform = "scaleX(0)";
    return;
  }
  track.hidden = false;
  fill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}
var setTextProgress = (r) => setProgress("textProgress", "textProgressFill", r);
var etapes = [];
function declarerEtapes(liste) {
  etapes = liste.map((e) => ({ ...e, etat: "attente", ratio: 0 }));
  rendreEtapes();
}
function majEtape(id, champs) {
  const e = etapes.find((x) => x.id === id);
  if (!e) return;
  Object.assign(e, champs);
  rendreEtapes();
}
var avancerEtape = (id, ratio) => majEtape(id, { etat: "cours", ratio: ratio ?? 0 });
var terminerEtape = (id) => majEtape(id, { etat: "faite", ratio: 1 });
var effacerEtapes = () => {
  etapes = [];
  rendreEtapes();
};
function rendreEtapes() {
  const hote = $("fileEtapes");
  if (!hote) return;
  hote.textContent = "";
  for (const e of etapes) {
    if (e.etat === "attente") continue;
    if (e.etat === "faite") {
      const puce = document.createElement("div");
      puce.className = "etape-faite";
      puce.append(e.libelle);
      const coche = document.createElement("span");
      coche.className = "coche";
      coche.setAttribute("aria-hidden", "true");
      coche.textContent = "\u2713";
      puce.append(coche);
      hote.append(puce);
      continue;
    }
    const bloc = document.createElement("div");
    bloc.className = "etape";
    const libelle = document.createElement("div");
    libelle.className = "etape-libelle";
    libelle.textContent = e.libelle;
    const piste = document.createElement("div");
    piste.className = "progress-track";
    const jauge = document.createElement("div");
    jauge.className = `progress-fill${e.teinte ? " " + e.teinte : ""}`;
    jauge.style.transform = `scaleX(${Math.max(0, Math.min(1, e.ratio))})`;
    piste.append(jauge);
    bloc.append(libelle, piste);
    hote.append(bloc);
  }
}
var compressionProgress = ({ fait, total }) => {
  if (total && fait >= total) terminerEtape("compression");
  else avancerEtape("compression", total ? fait / total : 0);
  return new Promise((r) => setTimeout(r, 0));
};
var nerProgress = ({ done, total }) => {
  if (total && done >= total) terminerEtape("detection");
  else avancerEtape("detection", total ? done / total : 0);
  return new Promise((r) => setTimeout(r, 0));
};
var LETTER_GRID_LETTERS = ["c", "l", "a", "r", "e", "n"];
var LETTER_GRID_CELL = 16;
var LETTER_GRID_FONT_PX = 9;
var LETTER_GRID_TICK_MS = 300;
var LETTER_GRID_VIRTUAL_PX = 1800;
var LETTER_GRID_ROWS_PER_BLOB = 4.5;
var LETTER_GRID_R = [2.4, 4.6];
var LETTER_GRID_THRESHOLD = 0.34;
var LETTER_GRID_JITTER = 0.22;
var LETTER_GRID_STRAY_COUNT = [4, 7];
var LETTER_GRID_DRIFT_MAX = 0.1;
var LETTER_GRID_DRIFT_ACCEL = 0.03;
var LETTER_GRID_DRIFT_RANGE = 1.4;
var LETTER_GRID_EASE = 0.22;
var LETTER_GRID_CLEAR_PAD = 0;
var LETTER_GRID_OPAQUE_A = 0.85;
var LETTER_GRID_TINT_VARS = ["--seal-lit", "--moss", "--tan", "--paper-dim"];
var LETTER_GRID_TINT_TARGET = "cell";
var LETTER_GRID_TINT_EVERY_MS = [1600, 4400];
var LETTER_GRID_TINT_CELLS = [1, 3];
var LETTER_GRID_TINT_LIFE_MS = [600, 1800];
var LETTER_GRID_TINT_BUSY_EVERY_MS = [280, 900];
var LETTER_GRID_TINT_BUSY_CELLS = [3, 7];
var LETTER_GRID_TINT_BUSY_LIFE_MS = [900, 2400];
var LETTER_GRID_TINT_MAX_SHARE = 0.3;
var letterGridCanvas = null;
var letterGridCtx = null;
var letterGridTimer = null;
var letterGridCols = 0;
var letterGridRows = 0;
var letterGridSeed = 0;
var letterGridBalls = null;
var letterGridStrays = null;
var letterGridBlocked = null;
var letterGridCellFill = "#000105";
var letterGridLetterFill = "#FFFFFF";
var letterGridPalette = [];
var letterGridTints = /* @__PURE__ */ new Map();
var letterGridPainted = [];
var letterGridNextTint = 0;
function letterGridRandLetter(exclude) {
  let l;
  do {
    l = LETTER_GRID_LETTERS[Math.random() * LETTER_GRID_LETTERS.length | 0];
  } while (l === exclude);
  return l;
}
function letterGridHash(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647 | 0;
  h = (h ^ h >>> 13) * 1274126177;
  h = h ^ h >>> 16;
  return (h >>> 0) / 4294967295 * 2 - 1;
}
function letterGridMask(cx, cy) {
  let field = 0;
  for (const b of letterGridBalls) {
    const dx = (cx - b.x) / b.r, dy = (cy - b.y) / b.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1) {
      const k = 1 - d2;
      field += k * k;
    }
  }
  return field + letterGridHash(cx, cy, letterGridSeed) * LETTER_GRID_JITTER > LETTER_GRID_THRESHOLD;
}
function letterGridBuildBalls(cols, rowsVirtual) {
  const n = Math.max(3, Math.round(rowsVirtual / LETTER_GRID_ROWS_PER_BLOB));
  const [rmin, rmax] = LETTER_GRID_R;
  const balls = [];
  for (let i = 0; i < n; i++) {
    const x0 = Math.random() * cols;
    const y0 = Math.random() * rowsVirtual;
    balls.push({ x0, y0, x: x0, y: y0, vx: 0, vy: 0, r: rmin + Math.random() * (rmax - rmin) });
  }
  return balls;
}
function letterGridStrayIsFree(col, row, strays) {
  if (letterGridMask(col, row)) return false;
  if (strays.some((s) => s.col === col && s.row === row)) return false;
  for (let dc = -2; dc <= 2; dc++) {
    for (let dr = -2; dr <= 2; dr++) {
      if (letterGridMask(col + dc, row + dr)) return false;
    }
  }
  return true;
}
function letterGridBuildStrays(cols, rowsVirtual) {
  const [min, max] = LETTER_GRID_STRAY_COUNT;
  const target = min + (Math.random() * (max - min + 1) | 0);
  const strays = [];
  let attempts = 0;
  while (strays.length < target && attempts < target * 120) {
    attempts++;
    const col = Math.random() * cols | 0;
    const row = Math.random() * rowsVirtual | 0;
    if (!letterGridStrayIsFree(col, row, strays)) continue;
    strays.push({ col, row, letter: letterGridRandLetter() });
  }
  return strays;
}
function letterGridIsOpaque(el) {
  const m = /^rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
  if (!m) return false;
  const parts = m[1].split(",").map(parseFloat);
  return (parts.length > 3 ? parts[3] : 1) >= LETTER_GRID_OPAQUE_A;
}
function letterGridComputeBlocked(host, cellCss) {
  const blocked = /* @__PURE__ */ new Set();
  const wrap = document.querySelector(".wrap");
  if (!wrap) return blocked;
  const base = host.getBoundingClientRect();
  const pad = LETTER_GRID_CLEAR_PAD;
  const add = (r) => {
    if (r.width <= 0 || r.height <= 0) return;
    const c0 = Math.floor((r.left - base.left - pad) / cellCss);
    const c1 = Math.ceil((r.right - base.left + pad) / cellCss);
    const r0 = Math.floor((r.top - base.top - pad) / cellCss);
    const r1 = Math.ceil((r.bottom - base.top + pad) / cellCss);
    for (let col = c0; col < c1; col++) {
      for (let row = r0; row < r1; row++) blocked.add(col + "," + row);
    }
  };
  const opaque = /* @__PURE__ */ new Map();
  const hidden = (node) => {
    for (let el = node.parentElement; el && el !== wrap; el = el.parentElement) {
      if (el.id === "letterBg") return true;
      let v = opaque.get(el);
      if (v === void 0) {
        v = letterGridIsOpaque(el);
        opaque.set(el, v);
      }
      if (v) return true;
    }
    return false;
  };
  const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || hidden(n)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) add(r);
  }
  for (const img of wrap.querySelectorAll("img")) {
    if (!hidden(img)) add(img.getBoundingClientRect());
  }
  for (const t of wrap.querySelectorAll("table")) {
    if (!hidden(t)) add(t.getBoundingClientRect());
  }
  return blocked;
}
function letterGridPaintCell(col, row, letter, cellPx, tint) {
  const ctx = letterGridCtx;
  const x = col * cellPx, y = row * cellPx;
  ctx.fillStyle = tint && LETTER_GRID_TINT_TARGET === "cell" ? tint : letterGridCellFill;
  ctx.fillRect(x, y, cellPx, cellPx);
  ctx.fillStyle = tint && LETTER_GRID_TINT_TARGET === "letter" ? tint : letterGridLetterFill;
  ctx.fillText(letter, x + cellPx / 2, y + cellPx / 2 + 1);
}
function letterGridTintOf(key, now) {
  const t = letterGridTints.get(key);
  return t && t.until > now ? t.color : null;
}
function letterGridScheduleTints(now, processing) {
  if (now < letterGridNextTint) return;
  const [every0, every1] = processing ? LETTER_GRID_TINT_BUSY_EVERY_MS : LETTER_GRID_TINT_EVERY_MS;
  letterGridNextTint = now + every0 + Math.random() * (every1 - every0);
  for (const [key, t] of letterGridTints) {
    if (t.until <= now) letterGridTints.delete(key);
  }
  if (!letterGridPainted.length || !letterGridPalette.length) return;
  const [cmin, cmax] = processing ? LETTER_GRID_TINT_BUSY_CELLS : LETTER_GRID_TINT_CELLS;
  const [life0, life1] = processing ? LETTER_GRID_TINT_BUSY_LIFE_MS : LETTER_GRID_TINT_LIFE_MS;
  const room = Math.floor(letterGridPainted.length * LETTER_GRID_TINT_MAX_SHARE) - letterGridTints.size;
  const n = Math.min(cmin + (Math.random() * (cmax - cmin + 1) | 0), room);
  for (let i = 0; i < n; i++) {
    letterGridTints.set(letterGridPainted[Math.random() * letterGridPainted.length | 0], {
      color: letterGridPalette[Math.random() * letterGridPalette.length | 0],
      until: now + life0 + Math.random() * (life1 - life0)
    });
  }
}
function letterGridRedraw() {
  const cellPx = letterGridCanvas.width / letterGridCols;
  const now = performance.now();
  letterGridCtx.clearRect(0, 0, letterGridCanvas.width, letterGridCanvas.height);
  letterGridPainted.length = 0;
  for (let col = 0; col < letterGridCols; col++) {
    for (let row = 0; row < letterGridRows; row++) {
      const key = col + "," + row;
      if (letterGridBlocked.has(key)) continue;
      if (!letterGridMask(col, row)) continue;
      letterGridPainted.push(key);
      letterGridPaintCell(col, row, letterGridRandLetter(), cellPx, letterGridTintOf(key, now));
    }
  }
  for (const s of letterGridStrays) {
    if (s.row >= letterGridRows) continue;
    const key = s.col + "," + s.row;
    if (letterGridBlocked.has(key)) continue;
    letterGridPainted.push(key);
    s.letter = letterGridRandLetter(s.letter);
    letterGridPaintCell(s.col, s.row, s.letter, cellPx, letterGridTintOf(key, now));
  }
}
function letterGridStepBall(b, processing) {
  if (processing) {
    b.vx += (Math.random() * 2 - 1) * LETTER_GRID_DRIFT_ACCEL;
    b.vy += (Math.random() * 2 - 1) * LETTER_GRID_DRIFT_ACCEL;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > LETTER_GRID_DRIFT_MAX) {
      b.vx = b.vx / speed * LETTER_GRID_DRIFT_MAX;
      b.vy = b.vy / speed * LETTER_GRID_DRIFT_MAX;
    }
    b.x += b.vx;
    b.y += b.vy;
    const R = LETTER_GRID_DRIFT_RANGE;
    if (b.x < b.x0 - R) {
      b.x = b.x0 - R;
      b.vx = Math.abs(b.vx);
    }
    if (b.x > b.x0 + R) {
      b.x = b.x0 + R;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y < b.y0 - R) {
      b.y = b.y0 - R;
      b.vy = Math.abs(b.vy);
    }
    if (b.y > b.y0 + R) {
      b.y = b.y0 + R;
      b.vy = -Math.abs(b.vy);
    }
  } else {
    b.vx = 0;
    b.vy = 0;
    b.x += (b.x0 - b.x) * LETTER_GRID_EASE;
    b.y += (b.y0 - b.y) * LETTER_GRID_EASE;
    if (Math.abs(b.x0 - b.x) < 0.02 && Math.abs(b.y0 - b.y) < 0.02) {
      b.x = b.x0;
      b.y = b.y0;
    }
  }
}
function letterGridTick() {
  const processing = document.body.classList.contains("processing");
  for (const b of letterGridBalls) letterGridStepBall(b, processing);
  letterGridScheduleTints(performance.now(), processing);
  letterGridRedraw();
}
function letterGridResize() {
  const host = $("letterBg");
  if (!host || !letterGridCanvas) return;
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  const dpr = window.devicePixelRatio || 1;
  const cellPx = Math.round(LETTER_GRID_CELL * dpr);
  letterGridCols = Math.ceil(w * dpr / cellPx);
  letterGridRows = Math.ceil(h * dpr / cellPx);
  letterGridCanvas.width = letterGridCols * cellPx;
  letterGridCanvas.height = letterGridRows * cellPx;
  letterGridCanvas.style.width = letterGridCanvas.width / dpr + "px";
  letterGridCanvas.style.height = letterGridCanvas.height / dpr + "px";
  const css = getComputedStyle(document.body);
  letterGridCtx.textAlign = "center";
  letterGridCtx.textBaseline = "middle";
  letterGridCtx.font = `${Math.round(LETTER_GRID_FONT_PX * dpr)}px ${css.fontFamily}`;
  letterGridCellFill = css.getPropertyValue("--seal").trim() || "#000105";
  letterGridLetterFill = css.getPropertyValue("--paper").trim() || "#FFFFFF";
  letterGridPalette = LETTER_GRID_TINT_VARS.map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  letterGridBlocked = letterGridComputeBlocked(host, cellPx / dpr);
  letterGridRedraw();
}
function letterGridMount() {
  const host = $("letterBg");
  if (!host || !host.clientWidth) return;
  letterGridCanvas = document.createElement("canvas");
  host.appendChild(letterGridCanvas);
  letterGridCtx = letterGridCanvas.getContext("2d");
  for (const id of ["letterBgGlow", "letterBgBlur"]) {
    if (!host.querySelector("#" + id)) {
      const couche = document.createElement("div");
      couche.id = id;
      host.appendChild(couche);
    }
  }
  const dpr = window.devicePixelRatio || 1;
  const cellPx = Math.round(LETTER_GRID_CELL * dpr);
  const cols = Math.ceil(host.clientWidth * dpr / cellPx);
  const rowsVirtual = Math.ceil(LETTER_GRID_VIRTUAL_PX / LETTER_GRID_CELL);
  letterGridSeed = Math.random() * 1e6 | 0;
  letterGridBalls = letterGridBuildBalls(cols, rowsVirtual);
  letterGridStrays = letterGridBuildStrays(cols, rowsVirtual);
  letterGridResize();
  let resizeT = null;
  new ResizeObserver(() => {
    clearTimeout(resizeT);
    resizeT = setTimeout(letterGridResize, 120);
  }).observe(document.querySelector(".wrap"));
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    letterGridTimer = setInterval(letterGridTick, LETTER_GRID_TICK_MS);
  }
}
var LETTER_BG_BLUR_RADIUS = 110;
var letterBgBlurPos = null;
var letterBgBlurRaf = 0;
function applyLetterBgBlur() {
  letterBgBlurRaf = 0;
  const blur = document.querySelector("#letterBgBlur");
  if (!blur || !letterBgBlurPos) return;
  blur.style.setProperty("--letterBgBlur-x", `${letterBgBlurPos.x}px`);
  blur.style.setProperty("--letterBgBlur-y", `${letterBgBlurPos.y}px`);
  blur.style.setProperty("--letterBgBlur-radius", `${LETTER_BG_BLUR_RADIUS}px`);
}
function updateLetterBgBlur(evt) {
  const host = document.querySelector("#letterBg");
  if (!host) return;
  const rect = host.getBoundingClientRect();
  letterBgBlurPos = {
    x: Math.max(0, Math.min(rect.width, evt.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, evt.clientY - rect.top))
  };
  if (!letterBgBlurRaf) letterBgBlurRaf = requestAnimationFrame(applyLetterBgBlur);
}
function resetLetterBgBlur() {
  const blur = document.querySelector("#letterBgBlur");
  if (!blur) return;
  if (letterBgBlurRaf) {
    cancelAnimationFrame(letterBgBlurRaf);
    letterBgBlurRaf = 0;
  }
  letterBgBlurPos = null;
  blur.style.setProperty("--letterBgBlur-radius", "0px");
}
function initLetterBgBlur() {
  const wrap = document.querySelector(".wrap");
  if (!wrap) return;
  wrap.addEventListener("pointermove", updateLetterBgBlur, { passive: true });
  wrap.addEventListener("pointerleave", resetLetterBgBlur);
  wrap.addEventListener("pointerenter", updateLetterBgBlur, { passive: true });
}
letterGridMount();
initLetterBgBlur();
function setProcessing(on) {
  document.body.classList.toggle("processing", !!on);
}
function setAnalyzeBtnLoading(loading) {
  const btn = $("fileAnalyzeBtn");
  if (loading) {
    if (!btn.classList.contains("loading")) btn.dataset.label = btn.textContent;
    btn.classList.add("loading");
    btn.innerHTML = '<span class="dots"><i></i><i></i><i></i><i></i><i></i></span>';
  } else {
    btn.classList.remove("loading");
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}
function annulerRunFichier(motif) {
  if (!fileRun) return false;
  const run = fileRun;
  fileRun = null;
  run.controller.abort(new OperationAnnulee());
  purgerWorkerNer(new OperationAnnulee());
  setProcessing(false);
  effacerEtapes();
  setAnalyzeBtnLoading(false);
  $("fileAnalyzeBtn").disabled = false;
  $("fileCancelBtn").hidden = true;
  fileSetStatus(motif === void 0 ? "Traitement annul\xE9 \u2014 aucun fichier produit." : motif);
  return true;
}
async function processFile() {
  if (!chosenFile) return;
  annulerRunFichier("");
  fileRegen = null;
  const source = chosenFile;
  const run = { id: ++fileRunId, controller: new AbortController() };
  fileRun = run;
  const signal = run.controller.signal;
  const courant = () => fileRun === run;
  const ext = extOf(source.name);
  const kind = FILE_TYPES[ext];
  const btn = $("fileAnalyzeBtn");
  btn.disabled = true;
  $("fileCancelBtn").hidden = false;
  setProcessing(true);
  setAnalyzeBtnLoading(true);
  const debut = performance.now();
  declarerEtapes([
    { id: "detection", libelle: "D\xE9tection" },
    ...$("fileCompress")?.checked && !FILE_TYPES[extOf(source.name)]?.metadataOnly ? [{ id: "compression", libelle: "R\xE9duction des tokens", teinte: "teinte-tan" }] : []
  ]);
  fileSetStatus("Lecture du fichier\u2026");
  try {
    const adapter = await kind.load();
    verifierAnnulation(signal);
    if (kind.metadataOnly) {
      fileSetStatus("M\xE9tadonn\xE9es\u2026");
      const cleaned2 = await adapter.stripMetadata(await source.arrayBuffer(), { mime: kind.mime });
      verifierAnnulation(signal);
      fileOutBlob = new Blob([cleaned2], { type: kind.mime });
      fileOutName = source.name.replace(/(\.[^.]+)$/, "-nettoye$1");
      $("fileMappingWrap").innerHTML = "<p>Image : m\xE9tadonn\xE9es (EXIF/GPS/appareil) retir\xE9es. Le contenu visuel n'est pas modifi\xE9.</p>";
      $("fileSummary").textContent = `M\xE9tadonn\xE9es retir\xE9es (EXIF, GPS, appareil). Trait\xE9 en ${formatDuree(performance.now() - debut)}.`;
      $("fileSummary").className = "status active";
      $("fileResults").hidden = false;
      $("fileCopyBtn").hidden = true;
      $("dragCard").hidden = !document.body.classList.contains("panel-mode");
      fileSetStatus("");
      return;
    }
    if ($("fileCompress")?.checked) {
      fileSetStatus("Pr\xE9paration\u2026");
      const dispo = await ensureCompression();
      if (!dispo.ok) {
        $("fileCompress").checked = false;
        compressionEchouee = dispo.message || "raison inconnue";
      }
      verifierAnnulation(signal);
    }
    if (ext === "pdf" && $("pdfModePreserve")?.checked) {
      fileSetStatus("Lecture du PDF\u2026");
      await ensureNER();
      verifierAnnulation(signal);
      const { reconstructPdf } = await import("./pdf-reconstruct-JVUDTBKP.js");
      const pdflib = await import("./es-RR6ZCDY3.js");
      const tampon = await source.arrayBuffer();
      const { buffer: outBuf, mapping: mapping2, entitesContextuelles: entitesContextuelles2 } = await reconstructPdf(tampon, {
        signal,
        nerPipeline: nerPipe,
        nerDetect: contextualDetector(),
        arbitre: arbitreContextuel(),
        onProgress: nerProgress,
        // Manquait entièrement : le PDF reconstruit ignorait la case
        // Pseudonymes, contrairement aux autres formats. Toujours [TYPE_N].
        // SANS argument : `units` n'existe pas encore sur ce chemin (il est
        // déclaré plus bas, pour l'autre branche) — le lui passer plantait en
        // « Cannot access 'units' before initialization ». reconstructPdf
        // extrait ses propres unités en interne.
        maskOpts: fileMaskOptions(),
        forceTerms: termesAMasquer(),
        disabledTypes: fileDisabledTypes,
        keepValues: termesAGarder(),
        compresserUnite: crochetCompression(),
        deps: { PDFDocument: pdflib.PDFDocument, StandardFonts: pdflib.StandardFonts }
      });
      verifierAnnulation(signal);
      fileOutBlob = new Blob([outBuf], { type: "application/pdf" });
      fileOutName = source.name.replace(/(\.[^.]+)$/, "-anonymise$1");
      fileRegen = { mode: "pdf", tampon, entites: entitesContextuelles2, source, kind, ext };
      showFileResults(mapping2, false, formatDuree(performance.now() - debut));
      renderEngineBadge("fileEngineBadge");
      fileSetStatus("");
      return;
    }
    const { anonymizeUnits } = await import("./anonymize-units-MAGN2IQP.js");
    const input = kind.text ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(await source.arrayBuffer()) : await source.arrayBuffer();
    const { units, intitules } = await adapter.extractTextUnits(input);
    if (!units.length) {
      fileSetStatus("Aucun texte \xE0 analyser.", "error");
      return;
    }
    fileSetStatus("D\xE9tection en cours\u2026");
    await ensureNER();
    verifierAnnulation(signal);
    const { results, mapping, entitesContextuelles } = await anonymizeUnits(units, {
      signal,
      nerPipeline: nerPipe,
      nerDetect: contextualDetector(),
      arbitre: arbitreContextuel(),
      intitules,
      onProgress: nerProgress,
      maskOpts: fileMaskOptions(units),
      // Règles personnalisées : mêmes primitives que le mode texte
      // (selection.js), appliquées au document combiné entier.
      forceTerms: termesAMasquer(),
      disabledTypes: fileDisabledTypes,
      keepValues: termesAGarder()
    });
    if ($("fileCompress")?.checked && compressionWorker && ext !== "docx") {
      fileSetStatus("Compression du texte\u2026");
      const taux = Number($("fileCompressTaux")?.value || 0.5);
      let avant = 0, apres = 0;
      try {
        let fait = 0;
        for (const r of results) {
          const c = await compresser(r.maskedText, compressionPipeline(), { taux });
          r.maskedText = c.texte;
          avant += c.tokensAvant;
          apres += c.tokensApres;
          await compressionProgress({ fait: ++fait, total: results.length });
          verifierAnnulation(signal);
        }
        compressionInfo = { avant, apres };
        terminerEtape("compression");
      } catch (err) {
        if (estAnnulation(err)) throw err;
        console.error("[clarence] compression interrompue :", err);
        compressionEchouee = String(err?.message || err);
      }
    }
    terminerEtape("detection");
    const byId = new Map(results.map((r) => [r.id, { maskedText: r.maskedText, entities: r.entities }]));
    fileSetStatus("R\xE9\xE9criture du fichier\u2026");
    const masked = await adapter.applyMask(input, byId, { compresserUnite: crochetCompression() });
    const cleaned = await adapter.stripMetadata(masked);
    verifierAnnulation(signal);
    fileOutBlob = new Blob([cleaned], { type: kind.mime });
    fileOutName = kind.outExt ? source.name.replace(/\.[^.]+$/, "-anonymise" + kind.outExt) : source.name.replace(/(\.[^.]+)$/, "-anonymise$1");
    fileRegen = {
      mode: "standard",
      input,
      units,
      intitules,
      entites: entitesContextuelles,
      adapter,
      source,
      kind,
      ext
    };
    showFileResults(mapping, kind.mime.startsWith("text/"), formatDuree(performance.now() - debut));
    renderEngineBadge("fileEngineBadge");
    fileSetStatus("");
  } catch (err) {
    if (estAnnulation(err)) return;
    console.error(err);
    if (!courant()) return;
    fileOutBlob = null;
    compressionInfo = null;
    compressionEchouee = null;
    $("fileResults").hidden = true;
    $("dragCard").hidden = true;
    fileSetStatus("\xC9chec \u2014 fichier non anonymis\xE9. D\xE9tail en console.", "error");
  } finally {
    if (courant()) {
      fileRun = null;
      setProcessing(false);
      setAnalyzeBtnLoading(false);
      btn.disabled = false;
      $("fileCancelBtn").hidden = true;
    }
  }
}
async function downloadFile() {
  if (!fileOutBlob) return;
  const url = URL.createObjectURL(fileOutBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileOutName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
for (const btn of document.querySelectorAll(".mode-btn")) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    for (const b of document.querySelectorAll(".mode-btn")) b.classList.toggle("active", b === btn);
    $("textMode").hidden = mode !== "text";
    $("fileMode").hidden = mode !== "file";
    $("reinjectZone").hidden = true;
    $("toggleReinjectBtn").textContent = "D\xE9sanonymiser une r\xE9ponse\u2026";
  });
}
$("filePickBtn").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (ev) => setChosenFile(ev.target.files[0]));
for (const [idChamp] of APERCUS_TERMES) {
  $(idChamp)?.addEventListener("input", rendreApercuTermes);
}
rendreApercuTermes();
$("fileCancelBtn").addEventListener("click", () => annulerRunFichier());
$("fileMappingWrap").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".map-retirer");
  if (btn) retirerDuMasquage(btn.dataset.valeur);
});
$("fileResetBtn").addEventListener("click", () => {
  annulerRunFichier("");
  chosenFile = null;
  fileOutBlob = null;
  compressionInfo = null;
  compressionEchouee = null;
  $("fileInput").value = "";
  $("fileChosen").hidden = true;
  $("filePoids").hidden = true;
  $("fileOptions").hidden = true;
  $("fileResults").hidden = true;
  $("fileCopyBtn").hidden = true;
  $("dragCard").hidden = true;
  fileSetStatus("");
});
for (const id of ["pdfModeLight", "pdfModePreserve"]) {
  $(id)?.addEventListener("change", () => majVisibiliteCompression(extOf(chosenFile?.name || "")));
}
for (const id of ["fileCompress", "fileRealisticToggle", "realisticToggle"]) {
  $(id)?.addEventListener("change", majSousOptions);
}
majSousOptions();
$("fileAnalyzeBtn").addEventListener("click", processFile);
$("fileDownloadBtn").addEventListener("click", downloadFile);
$("fileCopyBtn").addEventListener("click", async () => {
  if (!fileOutBlob) return;
  await navigator.clipboard.writeText(await fileOutBlob.text());
  $("fileCopyStatus").textContent = "Copi\xE9.";
  $("fileCopyStatus").className = "status active";
  setTimeout(() => {
    $("fileCopyStatus").textContent = "";
  }, 4e3);
});
$("dragCard").addEventListener("click", () => {
  if (!fileOutBlob) return;
  window.parent.postMessage({ clarenceDeliverFile: { blob: fileOutBlob, name: fileOutName } }, "*");
  fileSetStatus("Envoi dans la page\u2026");
});
window.addEventListener("message", (ev) => {
  const result = ev.data && ev.data.clarenceDeliverResult;
  if (!result) return;
  fileSetStatus(
    result.delivered ? "Fichier transmis \xE0 la page \u2014 v\xE9rifie qu'il appara\xEEt bien avant d'envoyer." : "Aucun champ de fichier d\xE9tect\xE9 sur la page. Ouvre d'abord le menu \xAB joindre \xBB du site, ou utilise le t\xE9l\xE9chargement.",
    result.delivered ? "active" : "error"
  );
});
var dropzone = $("dropzone");
for (const evName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(evName, (ev) => {
    ev.preventDefault();
    dropzone.classList.add("dragover");
  });
}
for (const evName of ["dragleave", "drop"]) {
  dropzone.addEventListener(evName, (ev) => {
    ev.preventDefault();
    dropzone.classList.remove("dragover");
  });
}
dropzone.addEventListener("drop", (ev) => {
  const file = ev.dataTransfer?.files?.[0];
  if (file) setChosenFile(file);
});
async function bindProfileBar(cfg) {
  const sel = $(cfg.selectId);
  if (!sel) return;
  let profiles = await loadProfiles();
  const refill = (selected) => {
    sel.innerHTML = '<option value="">(personnalis\xE9)</option>' + profiles.map((p) => `<option${p.name === selected ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  };
  refill();
  sel.addEventListener("change", () => {
    const p = profiles.find((x) => x.name === sel.value);
    if (p) cfg.apply(p);
  });
  $(cfg.saveId)?.addEventListener("click", async () => {
    let name = sel.value;
    if (!name) {
      name = (window.prompt("Nom du profil ?") || "").trim();
      if (!name) return;
    }
    profiles = await upsertProfile({ name, ...cfg.read() });
    refill(name);
  });
  $(cfg.newId)?.addEventListener("click", async () => {
    const name = (window.prompt("Nom du nouveau profil ?") || "").trim();
    if (!name) return;
    profiles = await upsertProfile({ name, ...cfg.read() });
    refill(name);
  });
  $(cfg.deleteId)?.addEventListener("click", async () => {
    if (!sel.value) return;
    if (!window.confirm(`Supprimer le profil \xAB ${sel.value} \xBB ?`)) return;
    profiles = await deleteProfile(sel.value);
    refill();
  });
}
bindProfileBar({
  selectId: "profileSelect",
  saveId: "profileSaveBtn",
  newId: "profileNewBtn",
  deleteId: "profileDeleteBtn",
  read: () => ({
    alwaysKeep: parseLines($("alwaysKeep")?.value),
    alwaysMask: parseLines($("alwaysMask")?.value),
    disabledTypes: [...disabledTypes],
    realistic: !!$("realisticToggle")?.checked
  }),
  apply: (p) => {
    if ($("alwaysKeep")) $("alwaysKeep").value = p.alwaysKeep.join("\n");
    if ($("alwaysMask")) $("alwaysMask").value = p.alwaysMask.join("\n");
    disabledTypes = new Set(p.disabledTypes);
    if ($("realisticToggle")) $("realisticToggle").checked = p.realistic;
    majSousOptions();
    rendreApercuTermes();
    renderTypeChips("typeToggles", disabledTypes);
    if (currentText) render();
  }
});
bindProfileBar({
  selectId: "fileProfileSelect",
  saveId: "fileProfileSaveBtn",
  newId: "fileProfileNewBtn",
  deleteId: "fileProfileDeleteBtn",
  read: () => ({
    alwaysKeep: parseLines($("fileAlwaysKeep")?.value),
    alwaysMask: parseLines($("fileAlwaysMask")?.value),
    disabledTypes: [...fileDisabledTypes],
    realistic: !!$("fileRealisticToggle")?.checked
  }),
  apply: (p) => {
    if ($("fileAlwaysKeep")) $("fileAlwaysKeep").value = p.alwaysKeep.join("\n");
    if ($("fileAlwaysMask")) $("fileAlwaysMask").value = p.alwaysMask.join("\n");
    fileDisabledTypes = new Set(p.disabledTypes);
    if ($("fileRealisticToggle")) $("fileRealisticToggle").checked = p.realistic;
    majSousOptions();
    rendreApercuTermes();
    renderTypeChips("fileTypeToggles", fileDisabledTypes);
  }
});
var identityCache = { status: "neuf", champs: {} };
function identityForceTerms() {
  return identitySearchTerms(identityCache);
}
function buildIdentityForm() {
  const wrap = $("identityFields");
  if (!wrap) return;
  wrap.innerHTML = IDENTITY_FIELDS.map(([key, label]) => `
    <div class="identity-field-${key}">
      <label class="field-label" for="identity_${key}">${esc(label)}</label>
      <textarea class="mini" id="identity_${key}" placeholder="Un terme par ligne"></textarea>
    </div>`).join("");
}
function fillIdentityForm() {
  for (const [key] of IDENTITY_FIELDS) {
    const el = $(`identity_${key}`);
    if (el) el.value = (identityCache.champs[key] || []).join("\n");
  }
}
function readIdentityForm() {
  const champs = {};
  for (const [key] of IDENTITY_FIELDS) champs[key] = $(`identity_${key}`)?.value ?? "";
  return champs;
}
function openIdentityModal() {
  buildIdentityForm();
  fillIdentityForm();
  $("identityOverlay").hidden = false;
}
async function initIdentity() {
  identityCache = await loadIdentity();
  if (identityCache.status === "neuf") openIdentityModal();
}
$("identityOpenBtn")?.addEventListener("click", openIdentityModal);
$("identitySaveBtn")?.addEventListener("click", async () => {
  identityCache = { status: "configur\xE9", champs: readIdentityForm() };
  await saveIdentity(identityCache);
  identityCache = await loadIdentity();
  $("identityOverlay").hidden = true;
});
$("identityLaterBtn")?.addEventListener("click", async () => {
  identityCache = { ...identityCache, status: "refus\xE9" };
  await saveIdentity(identityCache);
  $("identityOverlay").hidden = true;
});
$("identityClearBtn")?.addEventListener("click", async () => {
  if (!window.confirm("Effacer toutes les informations d'identit\xE9 stock\xE9es ?")) return;
  await clearIdentity();
  identityCache = { status: "refus\xE9", champs: {} };
  await saveIdentity(identityCache);
  fillIdentityForm();
});
initIdentity();
