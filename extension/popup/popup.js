import {
  NER_MODEL,
  bridgeNameParts,
  chunkText,
  detectNER,
  detectPhonesIntl,
  detectRegex,
  entityKey,
  filterByRules,
  forcedMasks,
  isHonorificAt,
  maskText,
  mergeEntities,
  reinject,
  selectActive,
  snapToWordBoundaries
} from "./chunk-6SRQ32UP.js";
import "./chunk-PIRHQTI4.js";

// src/engine/gliner.js
var GLINER_MODEL = "onnx-community/gliner_small-v2";
var GLINER_THRESHOLD = 0.5;
var GROUPES = [
  {
    // Le cœur : ce que le NER BERT couvrait déjà, en mieux sur les valeurs
    // isolées. Marge de bruit très confortable (pire faux positif 0,26).
    //
    // Seuil ABAISSÉ à 0,45, mesuré sur un vrai CV : un nom seul sur sa ligne,
    // en gros, sans rien autour (« LANDRY KAPGNEP », titre du document) ne
    // sort qu'à 0,47 — un titre de CV est trop court pour donner au modèle de
    // quoi être sûr. À 0,50 il FUYAIT. Le plancher de bruit du garde-fou étant
    // à 0,26, la marge reste large. Ne pas remonter sans re-tester ce cas.
    seuil: 0.45,
    labels: ["person", "company", "location"],
    types: { person: "PER", company: "ORG", location: "LOC" }
  },
  {
    // Seul : associé à d'autres labels il perd sa précision, et « address »
    // faisait monter le bruit du garde-fou à 0,47 (trop près du seuil).
    // Les adresses restent couvertes par le motif ADRESSE, déterministe.
    labels: ["date of birth"],
    types: { "date of birth": "DATE_NAISSANCE" }
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
var typesDuGroupe = (g) => Object.values(g.types);
var TYPES_NOMS_PROPRES = /* @__PURE__ */ new Set(["PER", "ORG", "LOC"]);
function estNomPropreplausible(type, valeur) {
  if (!TYPES_NOMS_PROPRES.has(type)) return true;
  return new RegExp("\\p{Lu}", "u").test(valeur);
}
async function detectGliner(text, glinerPipeline, { onProgress, disabledTypes: disabledTypes2 } = {}) {
  if (!glinerPipeline) return [];
  const desactives = disabledTypes2 || /* @__PURE__ */ new Set();
  const groupesActifs = GROUPES.filter((g) => typesDuGroupe(g).some((t) => !desactives.has(t)));
  if (!groupesActifs.length) return [];
  const chunks = chunkText(text);
  const total = chunks.length * groupesActifs.length;
  const all = [];
  let done = 0;
  for (const { offset, text: chunk } of chunks) {
    const duChunk = [];
    for (const groupe of groupesActifs) {
      const spans = await glinerPipeline(chunk, groupe.labels);
      const seuil = groupe.seuil ?? GLINER_THRESHOLD;
      for (const s of spans || []) {
        const type = groupe.types[s.label];
        if (!type || s.score < seuil) continue;
        if (!estNomPropreplausible(type, chunk.slice(s.start, s.end))) continue;
        duChunk.push({
          type,
          value: chunk.slice(s.start, s.end),
          start: s.start,
          end: s.end,
          source: "ner",
          score: s.score,
          validated: "n/a"
        });
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
function defaultProfiles() {
  return [
    { name: "Vierge", alwaysKeep: [], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: "D\xE9veloppeur / Tech", alwaysKeep: [...TECH_KEEP], alwaysMask: [], disabledTypes: [], realistic: false }
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
var disabledTypes = /* @__PURE__ */ new Set();
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
var parseLines = (v) => (v || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
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
var GLINER_MODEL_URL = `https://huggingface.co/${GLINER_MODEL}/resolve/main/onnx/model_quantized.onnx`;
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
      setStatus(`T\xE9l\xE9chargement du mod\xE8le\u2026 ${pct} % (une seule fois)`);
      const ratio = msg.loaded / msg.total;
      if (!$("fileMode")?.hidden) setFileProgress(ratio);
      else setTextProgress(ratio);
      return;
    }
    if (msg.type === "result" || msg.type === "error" && msg.id != null) {
      const p = nerPending.get(msg.id);
      if (!p) return;
      nerPending.delete(msg.id);
      msg.type === "result" ? p.resolve(msg.spans ?? msg.tokens) : p.reject(new Error(msg.message));
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
      modelUrl: engine === "gliner" ? GLINER_MODEL_URL : null
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
    nerPipe = (text, labels) => new Promise((resolve, reject) => {
      const id = ++nerReqId;
      nerPending.set(id, { resolve, reject });
      nerWorker.postMessage({ type: "run", id, text, labels });
    });
  } catch (err) {
    console.error(err);
  } finally {
    nerLoading = false;
  }
}
function contextualDetector() {
  return nerEngine === "gliner" ? detectGliner : detectNER;
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
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", text: false, load: () => import("./docx-adapter-YOBWEEHD.js") },
  // PDF : seul format dont la sortie n'est pas une réécriture du fichier
  // d'origine mais un nouveau document (.md) — outExt gère ce cas particulier
  // dans processFile() (nom de fichier ET extension de sortie changent).
  pdf: { mime: "text/markdown;charset=utf-8", text: false, load: () => import("./pdf-adapter-L6MI6LLK.js"), outExt: ".md" },
  // Images : metadataOnly → processFile() court-circuite le pipeline de
  // détection/masquage (une image n'a pas d'unités PII textuelles) et appelle
  // uniquement stripMetadata (re-encodage canvas, retire EXIF/GPS/chunks).
  jpg: { mime: "image/jpeg", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") },
  jpeg: { mime: "image/jpeg", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") },
  png: { mime: "image/png", text: false, metadataOnly: true, load: () => import("./image-adapter-2KEQSNMF.js") }
};
var chosenFile = null;
var fileOutBlob = null;
var fileOutName = "";
var fileDisabledTypes = /* @__PURE__ */ new Set();
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
  if (!fileOutBlob) return;
  fileOutBlob = null;
  fileOutName = "";
  $("fileResults").hidden = true;
  $("dragCard").hidden = true;
  fileSetStatus("Options modifi\xE9es \u2014 relance l\u2019anonymisation.");
}
for (const id of ["pdfModeLight", "pdfModePreserve", "fileRealisticToggle", "filePseudoLocale"]) {
  $(id)?.addEventListener("change", invalidateFileResult);
}
for (const id of ["fileAlwaysMask", "fileAlwaysKeep"]) {
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
function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
function setChosenFile(file) {
  if (!file) return;
  const ext = extOf(file.name);
  if (!FILE_TYPES[ext]) {
    fileSetStatus("Format non pris en charge. Accept\xE9 : CSV, XLSX, DOCX, PDF, JPG/PNG.", "error");
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    fileSetStatus(`Fichier trop lourd (${humanSize(file.size)}, max ${humanSize(MAX_FILE_BYTES)}).`, "error");
    return;
  }
  chosenFile = file;
  fileOutBlob = null;
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
  $("fileChosen").hidden = false;
  $("fileOptions").hidden = !!FILE_TYPES[ext].metadataOnly;
  $("pdfModeChoice").hidden = ext !== "pdf";
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
function showFileResults(mapping, copyable) {
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {
  });
  $("fileMappingWrap").innerHTML = mapping.length ? `<table>${mapping.map(
    (m) => `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td></tr>`
  ).join("")}</table>` : "<p>Aucun masque actif.</p>";
  $("fileSummary").textContent = mapping.length ? `${mapping.length} valeur(s) distincte(s) masqu\xE9e(s), m\xE9tadonn\xE9es nettoy\xE9es.` : "Aucune donn\xE9e sensible d\xE9tect\xE9e \u2014 m\xE9tadonn\xE9es nettoy\xE9es.";
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
var setFileProgress = (r) => setProgress("fileProgress", "fileProgressFill", r);
var setTextProgress = (r) => setProgress("textProgress", "textProgressFill", r);
var nerProgress = ({ done, total }) => {
  fileSetStatus(`D\xE9tection en cours\u2026 ${done}/${total}`);
  setFileProgress(total ? done / total : null);
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
async function processFile() {
  if (!chosenFile) return;
  const ext = extOf(chosenFile.name);
  const kind = FILE_TYPES[ext];
  const btn = $("fileAnalyzeBtn");
  btn.disabled = true;
  setProcessing(true);
  setAnalyzeBtnLoading(true);
  fileSetStatus("Lecture du fichier\u2026");
  try {
    const adapter = await kind.load();
    if (kind.metadataOnly) {
      fileSetStatus("Nettoyage des m\xE9tadonn\xE9es\u2026");
      const cleaned2 = await adapter.stripMetadata(await chosenFile.arrayBuffer(), { mime: kind.mime });
      fileOutBlob = new Blob([cleaned2], { type: kind.mime });
      fileOutName = chosenFile.name.replace(/(\.[^.]+)$/, "-nettoye$1");
      $("fileMappingWrap").innerHTML = "<p>Image : m\xE9tadonn\xE9es (EXIF/GPS/appareil) retir\xE9es. Le contenu visuel n'est pas modifi\xE9.</p>";
      $("fileSummary").textContent = "M\xE9tadonn\xE9es retir\xE9es (EXIF, GPS, appareil).";
      $("fileSummary").className = "status active";
      $("fileResults").hidden = false;
      $("fileCopyBtn").hidden = true;
      $("dragCard").hidden = !document.body.classList.contains("panel-mode");
      fileSetStatus("");
      return;
    }
    if (ext === "pdf" && $("pdfModePreserve")?.checked) {
      fileSetStatus("Reconstruction du PDF\u2026");
      await ensureNER();
      const { reconstructPdf } = await import("./pdf-reconstruct-VSWCJ2VL.js");
      const pdflib = await import("./es-RR6ZCDY3.js");
      const { buffer: outBuf, mapping: mapping2 } = await reconstructPdf(await chosenFile.arrayBuffer(), {
        nerPipeline: nerPipe,
        nerDetect: contextualDetector(),
        onProgress: nerProgress,
        // Manquait entièrement : le PDF reconstruit ignorait la case
        // Pseudonymes, contrairement aux autres formats. Toujours [TYPE_N].
        // SANS argument : `units` n'existe pas encore sur ce chemin (il est
        // déclaré plus bas, pour l'autre branche) — le lui passer plantait en
        // « Cannot access 'units' before initialization ». reconstructPdf
        // extrait ses propres unités en interne.
        maskOpts: fileMaskOptions(),
        forceTerms: [...parseLines($("fileAlwaysMask")?.value), ...identityForceTerms()],
        disabledTypes: fileDisabledTypes,
        keepValues: parseLines($("fileAlwaysKeep")?.value),
        deps: { PDFDocument: pdflib.PDFDocument, StandardFonts: pdflib.StandardFonts }
      });
      fileOutBlob = new Blob([outBuf], { type: "application/pdf" });
      fileOutName = chosenFile.name.replace(/(\.[^.]+)$/, "-anonymise$1");
      showFileResults(mapping2, false);
      renderEngineBadge("fileEngineBadge");
      fileSetStatus("");
      return;
    }
    const { anonymizeUnits } = await import("./anonymize-units-KJCHGZAJ.js");
    const input = kind.text ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(await chosenFile.arrayBuffer()) : await chosenFile.arrayBuffer();
    const { units } = await adapter.extractTextUnits(input);
    if (!units.length) {
      fileSetStatus("Aucun texte \xE0 analyser dans ce fichier.", "error");
      return;
    }
    fileSetStatus("D\xE9tection en cours\u2026");
    await ensureNER();
    const { results, mapping } = await anonymizeUnits(units, {
      nerPipeline: nerPipe,
      nerDetect: contextualDetector(),
      onProgress: nerProgress,
      maskOpts: fileMaskOptions(units),
      // Règles personnalisées : mêmes primitives que le mode texte
      // (selection.js), appliquées au document combiné entier.
      forceTerms: [...parseLines($("fileAlwaysMask")?.value), ...identityForceTerms()],
      disabledTypes: fileDisabledTypes,
      keepValues: parseLines($("fileAlwaysKeep")?.value)
    });
    const byId = new Map(results.map((r) => [r.id, { maskedText: r.maskedText, entities: r.entities }]));
    const masked = await adapter.applyMask(input, byId);
    const cleaned = await adapter.stripMetadata(masked);
    fileOutBlob = new Blob([cleaned], { type: kind.mime });
    fileOutName = kind.outExt ? chosenFile.name.replace(/\.[^.]+$/, "-anonymise" + kind.outExt) : chosenFile.name.replace(/(\.[^.]+)$/, "-anonymise$1");
    showFileResults(mapping, kind.mime.startsWith("text/"));
    renderEngineBadge("fileEngineBadge");
    fileSetStatus("");
  } catch (err) {
    console.error(err);
    fileOutBlob = null;
    $("fileResults").hidden = true;
    $("dragCard").hidden = true;
    fileSetStatus("Traitement \xE9chou\xE9 \u2014 le fichier n\u2019a pas \xE9t\xE9 anonymis\xE9. D\xE9tail dans la console.", "error");
  } finally {
    setProcessing(false);
    setFileProgress(null);
    setAnalyzeBtnLoading(false);
    btn.disabled = false;
  }
}
function downloadFile() {
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
$("fileResetBtn").addEventListener("click", () => {
  chosenFile = null;
  fileOutBlob = null;
  $("fileInput").value = "";
  $("fileChosen").hidden = true;
  $("fileOptions").hidden = true;
  $("fileResults").hidden = true;
  $("fileCopyBtn").hidden = true;
  $("dragCard").hidden = true;
  fileSetStatus("");
});
$("fileAnalyzeBtn").addEventListener("click", processFile);
$("fileDownloadBtn").addEventListener("click", downloadFile);
$("fileCopyBtn").addEventListener("click", async () => {
  if (!fileOutBlob) return;
  await navigator.clipboard.writeText(await fileOutBlob.text());
  $("fileCopyStatus").textContent = "Copi\xE9 \u2014 colle dans le chat.";
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
