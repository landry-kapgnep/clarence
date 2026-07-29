// src/engine/validators.js
function luhnCheck(numStr) {
  let sum = 0, alt = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let n = parseInt(numStr[i], 10);
    if (Number.isNaN(n)) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function ibanCheck(iban) {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString());
  let m = 0;
  for (let i = 0; i < numeric.length; i++) m = (m * 10 + parseInt(numeric[i], 10)) % 97;
  return m === 1;
}
function nirCheck(nirRaw) {
  const nir = nirRaw.replace(/\s+/g, "");
  if (nir.length !== 15) return false;
  const base = nir.slice(0, 13).replace(/2A/i, "19").replace(/2B/i, "18");
  const key = parseInt(nir.slice(13, 15), 10);
  if (!/^\d{13}$/.test(base) || isNaN(key)) return false;
  const n = BigInt(base);
  return Number(97n - n % 97n) === key;
}

// src/engine/regex-detect.js
var STOP_NOMS_CIVILITE = /* @__PURE__ */ new Set([
  "pr\xE9sident",
  "pr\xE9sidente",
  "directeur",
  "directrice",
  "professeur",
  "docteur",
  "ministre",
  "maire",
  "universit\xE9",
  "facult\xE9"
]);
var REGEX_PATTERNS = [
  { type: "EMAIL", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, validate: null },
  // maskIfStructureMatches : la structure IBAN (pays connu + 2 chiffres + corps
  // groupé) est si distinctive qu'on masque même si le mod-97 échoue — numéro
  // fabriqué OU vrai IBAN mal recopié restent sensibles (priorité au zéro-fuite ;
  // sans ça les détecteurs plus faibles déchiquettent le numéro et en laissent
  // fuir une partie). Liste blanche de pays (SEPA + voisins usuels) : évite
  // qu'un code alphanum quelconque commençant par 2 lettres soit pris pour un
  // IBAN. Longueur minimale garantie par {3,7} groupes de 4 (≥ 16 caractères).
  {
    type: "IBAN",
    re: /\b(?:FR|MC|BE|CH|DE|ES|IT|PT|LU|NL|GB|IE|AT|DK|SE|NO|FI|PL|CZ|RO|GR|HR|HU|SK|SI|BG|LT|LV|EE|MT|CY|AD|SM)\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g,
    validate: (m) => ibanCheck(m),
    maskIfStructureMatches: true
  },
  {
    type: "CARTE_BANCAIRE",
    // Commence et finit sur un chiffre (sinon le séparateur final est avalé
    // et le span bat un SIRET identique à la résolution de chevauchement).
    re: /\b\d(?:[ -]?\d){12,18}\b/g,
    validate: (m) => {
      const digits = m.replace(/[ -]/g, "");
      return digits.length >= 13 && digits.length <= 19 && luhnCheck(digits);
    }
  },
  {
    // Structure NIR distinctive (sexe/année/mois 01-12/dép + clé) → masquage sur
    // structure même si la clé de contrôle échoue (cf. IBAN : priorité zéro-fuite).
    type: "NIR",
    re: /\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}\b/gi,
    validate: (m) => nirCheck(m),
    maskIfStructureMatches: true
  },
  {
    type: "SIRET_SIREN",
    re: /\b\d{3}[\s]?\d{3}[\s]?\d{3}(?:[\s]?\d{5})?\b/g,
    validate: (m) => {
      const digits = m.replace(/\s/g, "");
      if (digits.length !== 9 && digits.length !== 14) return false;
      return luhnCheck(digits);
    }
  },
  // (?<!\d)…(?!\d) : ne jamais matcher un « faux téléphone » constitué d'un
  // fragment de 10 chiffres pris AU MILIEU d'un nombre plus long (ex. une carte
  // ou un IBAN sans espaces) — sinon on déchiquette le numéro et on en laisse
  // fuir une partie.
  { type: "TELEPHONE", re: /(?<!\d)(?:(?:\+33|0033)[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}(?!\d)/g, validate: null },
  { type: "CODE_POSTAL_VILLE", re: /\b\d{5}\b(?=\s+[A-ZÀ-Ü][a-zà-ÿ]+)/g, validate: null },
  {
    // IPv4 : structure très reconnaissable, octets bornés à 255. Peut matcher
    // un numéro de version logicielle exotique (1.2.3.4) — sur-masquage rare
    // et bénin, préférable à laisser fuir une adresse réseau (zéro-fuite).
    type: "IP",
    re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    validate: (m) => m.split(".").every((o) => Number(o) <= 255)
  },
  {
    // Adresse MAC : 6 octets hexadécimaux séparés par ':' ou '-'.
    type: "MAC",
    re: /\b[0-9A-F]{2}(?:[:-][0-9A-F]{2}){5}\b/gi,
    validate: null
  },
  {
    // BIC/SWIFT : 4 lettres banque + pays (même liste blanche que l'IBAN —
    // sans elle, tout mot de 8 lettres MAJUSCULES matcherait, ex. PASSWORD)
    // + 2 alphanum + branche optionnelle.
    type: "BIC",
    re: /\b[A-Z]{4}(?:FR|MC|BE|CH|DE|ES|IT|PT|LU|NL|GB|IE|AT|DK|SE|NO|FI|PL|CZ|RO|GR|HR|HU|SK|SI|BG|LT|LV|EE|MT|CY|AD|SM)[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    validate: null
  },
  {
    // BIC avec contexte explicite (« BIC: », « SWIFT: ») : le libellé lève
    // l'ambiguïté, donc pas de liste blanche de pays — rattrape les BIC à
    // pays exotique ou mal recopié (cf. cartes/SIREN par contexte, zéro-fuite).
    type: "BIC",
    re: /(?:BIC|SWIFT)\s*:?\s*([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/g,
    extract: 1,
    validate: null
  },
  // Montant + devise. Deux styles de décimale : virgule FR (1 240,50) ET point
  // international (6540.00). Partie entière soit groupée par séparateurs, soit
  // suite brute de chiffres (6540). Sans le point décimal, "6540.00 EUR" laissait
  // fuir "6540." (seul "00 EUR" était masqué). Fix vs prototype : (?!\w) après €.
  { type: "MONTANT", re: /\b(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[.,]\d{1,2})?\s?(?:€|EUR|euros?|CHF)(?!\w)/gi, validate: null },
  {
    // Carte avec contexte explicite (« Visa : », « CB : ») → masquée même si Luhn
    // échoue : numéro fabriqué OU vrai numéro mal recopié restent sensibles, et
    // le libellé lève l'ambiguïté d'une longue suite de chiffres (priorité zéro-fuite).
    type: "CARTE_BANCAIRE",
    re: /(?:carte(?:\s+bancaire)?|cb|visa|mastercard)\s*(?:premier|gold|business)?\s*:?\s*(\d(?:[ -]?\d){11,18})/gi,
    extract: 1,
    validate: null
  },
  {
    // SIREN/SIRET avec contexte explicite → masqué même si Luhn échoue (idem carte).
    type: "SIRET_SIREN",
    re: /(?:siren|siret)\s*(?:n[°ºo]?)?\s*:?\s*(\d(?:[ ]?\d){8,13})/gi,
    extract: 1,
    validate: null
  },
  {
    type: "ADRESSE",
    re: /\b\d{1,4}\s?(?:bis|ter)?\s*,?\s*(?:rue|avenue|av\.|boulevard|bd\.?|impasse|all[ée]e|chemin|place|cours|quai|route|square|passage)\s+(?:de\s+la\s+|de\s+l'|du\s+|des\s+|de\s+|d'|la\s+|le\s+)?[A-Za-zÀ-ÿ0-9'-]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ'-]+){0,3}/g,
    validate: null
  },
  {
    // Contexte explicite (« né le », « date de naissance : ») → quasi zéro FP.
    // extract: seul le groupe (la date) est masqué, pas le libellé.
    type: "DATE_NAISSANCE",
    re: /(?:n[ée]e?\s+le|n[ée]e?\s*:|date\s+de\s+naissance\s*:?)\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/gi,
    extract: 1,
    validate: null
  },
  {
    // Numéros de dossier/client/etc. avec contexte. Garde anti-année.
    type: "REFERENCE",
    re: /\b(?:dossier|client|matricule|contrat|facture|commande|abonnement|adh[ée]rent|[ée]tudiant|r[ée]f[ée]rence|r[ée]f\.?)\s*(?:client|dossier)?\s*(?:n[°ºo]?\s*|num[ée]ro\s*)?:?\s*(\d{4,12})\b/gi,
    extract: 1,
    validate: (m) => !/^(19|20)\d\d$/.test(m)
  },
  {
    // Handle de profil social/pro : identifie directement une personne, et
    // contient très souvent le nom en minuscules (« linkedin.com/in/landry-kapgnep »)
    // — forme que le NER ne détecte pas. Déterministe : le domaine lève toute
    // ambiguïté, donc aucun risque de faux positif sur de la prose.
    // extract: seul le handle est masqué, le domaine reste lisible (contexte utile).
    type: "PSEUDO",
    re: /(?:linkedin\.com\/in\/|github\.com\/|gitlab\.com\/|x\.com\/|twitter\.com\/|instagram\.com\/|facebook\.com\/|tiktok\.com\/@|behance\.net\/|dribbble\.com\/|medium\.com\/@|t\.me\/)([A-Za-z0-9](?:[A-Za-z0-9._-]{1,38})?)/gi,
    extract: 1,
    validate: null
  },
  {
    // Civilité + nom : rattrape en déterministe des noms que le NER peut rater.
    type: "PER",
    re: /\b(?:Monsieur|Madame|Mademoiselle|M\.|Mme|Mlle|Dr|Me|Pr)\s+((?:[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'][A-ZÀ-Ü]?[a-zà-ÿ]+)*|[A-ZÀ-Ü]{2,})(?:\s+(?:[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'][A-ZÀ-Ü]?[a-zà-ÿ]+)*|[A-ZÀ-Ü]{2,})){0,2})/g,
    extract: 1,
    validate: (m) => !STOP_NOMS_CIVILITE.has(m.split(/\s+/)[0].toLowerCase())
  }
];
function detectRegex(text) {
  const found = [];
  for (const pattern of REGEX_PATTERNS) {
    let match;
    pattern.re.lastIndex = 0;
    while ((match = pattern.re.exec(text)) !== null) {
      const value = pattern.extract ? match[pattern.extract] : match[0];
      if (!value) continue;
      const offset = pattern.extract ? match[0].indexOf(value) : 0;
      const validated = pattern.validate ? pattern.validate(value) : null;
      if (pattern.validate && !validated && !pattern.maskIfStructureMatches) continue;
      found.push({
        type: pattern.type,
        value,
        start: match.index + offset,
        end: match.index + offset + value.length,
        source: "regex",
        validated: pattern.validate ? validated : "n/a"
      });
    }
  }
  return found;
}

// src/engine/ner.js
var NER_MODEL = "Xenova/bert-base-multilingual-cased-ner-hrl";
var CHUNK_SIZE = 1e3;
var CHUNK_OVERLAP = 120;
var STOPWORDS_FR = /* @__PURE__ */ new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "du",
  "de",
  "ce",
  "cet",
  "cette",
  "ces",
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "son",
  "sa",
  "ses",
  "notre",
  "nos",
  "votre",
  "vos",
  "leur",
  "leurs",
  "au",
  "aux",
  "l",
  "\xE0",
  "dans",
  "en",
  "sur",
  "sous",
  "avec",
  "sans",
  "pour",
  "par",
  "chez",
  "vers",
  "entre",
  "depuis",
  "pendant",
  "avant",
  "apr\xE8s",
  "malgr\xE9",
  "selon",
  "jusque",
  "jusqu",
  "contre",
  "envers",
  "via",
  "et",
  "ou",
  "mais",
  "donc",
  "or",
  "ni",
  "car",
  "que",
  "qui",
  "quoi",
  "dont",
  "o\xF9",
  "si",
  "comme",
  "quand",
  "lorsque",
  "puisque",
  "tandis",
  "je",
  "tu",
  "il",
  "elle",
  "on",
  "nous",
  "vous",
  "ils",
  "elles",
  "moi",
  "toi",
  "lui",
  "eux",
  "se",
  "me",
  "te",
  "y",
  "celui",
  "celle",
  "ceux",
  "celles",
  "est",
  "sont",
  "suis",
  "es",
  "\xE9tait",
  "\xE9taient",
  "sera",
  "seront",
  "serait",
  "soit",
  "ai",
  "as",
  "a",
  "avons",
  "avez",
  "ont",
  "avait",
  "avaient",
  "aura",
  "auront",
  "eu",
  "fait",
  "faites",
  "faisons",
  "font",
  "faisait",
  "dit",
  "dites",
  "disons",
  "disent",
  "va",
  "vais",
  "vas",
  "allons",
  "allez",
  "vont",
  "allait",
  "allaient",
  "peut",
  "peux",
  "pouvons",
  "pouvez",
  "peuvent",
  "pouvait",
  "pu",
  "doit",
  "dois",
  "devons",
  "devez",
  "doivent",
  "devait",
  "veut",
  "veux",
  "voulons",
  "voulez",
  "veulent",
  "voulait",
  "tr\xE8s",
  "bien",
  "plus",
  "moins",
  "aussi",
  "encore",
  "d\xE9j\xE0",
  "toujours",
  "jamais",
  "souvent",
  "parfois",
  "ici",
  "l\xE0",
  "ainsi",
  "alors",
  "ensuite",
  "enfin",
  "aujourd",
  "hui",
  "hier",
  "demain",
  "maintenant",
  "oui",
  "non",
  "ne",
  "pas",
  "peu",
  "trop",
  "tout",
  "tous",
  "toute",
  "toutes",
  "bonjour",
  "bonsoir",
  "merci",
  "cordialement",
  "svp"
]);
var ALLCAPS_MIN = 4;
function boostCase(text) {
  return text.split(new RegExp("(\\p{L}+)", "u")).map((tok) => {
    if (!new RegExp("^\\p{L}+$", "u").test(tok)) return tok;
    const lower = tok.toLowerCase();
    const upper = tok.toUpperCase();
    if (STOPWORDS_FR.has(lower)) return tok;
    if (tok === lower && tok.length >= 2) return tok[0].toUpperCase() + tok.slice(1);
    if (tok === upper && tok.length >= ALLCAPS_MIN) return tok[0] + tok.slice(1).toLowerCase();
    return tok;
  }).join("");
}
function chunkText(text) {
  if (text.length <= CHUNK_SIZE) return [{ offset: 0, text }];
  const chunks = [];
  let pos = 0;
  while (pos < text.length) {
    let end = Math.min(pos + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const window = text.slice(pos, end);
      const lastBreak = Math.max(
        window.lastIndexOf("\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf(" ")
      );
      if (lastBreak > CHUNK_SIZE * 0.5) end = pos + lastBreak + 1;
    }
    chunks.push({ offset: pos, text: text.slice(pos, end) });
    if (end >= text.length) break;
    pos = end - CHUNK_OVERLAP;
  }
  return chunks;
}
function groupTokens(raw) {
  const groups = [];
  let current = null;
  for (const tok of raw) {
    if (!tok.entity || tok.entity === "O") {
      current = null;
      continue;
    }
    const type = tok.entity.replace(/^[BI]-/, "");
    const isSubword = tok.word.startsWith("##");
    const piece = isSubword ? tok.word.slice(2) : tok.word;
    const isNewEntity = tok.entity.startsWith("B-") || !current;
    if (isNewEntity) {
      if (current) groups.push(current);
      current = { type, text: piece, minScore: tok.score };
    } else {
      current.text += isSubword ? piece : " " + piece;
      current.minScore = Math.min(current.minScore, tok.score);
    }
  }
  if (current) groups.push(current);
  return groups;
}
function locateGroups(text, groups) {
  let cursor = 0;
  const entities = [];
  for (const g of groups) {
    if (g.text.length < 2) continue;
    const idx = text.indexOf(g.text, cursor);
    if (idx === -1) continue;
    entities.push({
      type: g.type,
      value: g.text,
      start: idx,
      end: idx + g.text.length,
      source: "ner",
      score: g.minScore,
      validated: "n/a"
    });
    cursor = idx + g.text.length;
  }
  return entities;
}
var MIN_SCORE = 0.6;
async function detectNER(text, nerPipeline, { onProgress } = {}) {
  if (!nerPipeline) return [];
  const all = [];
  const chunks = chunkText(text);
  let done = 0;
  for (const { offset, text: chunk } of chunks) {
    const natural = locateGroups(chunk, groupTokens(await nerPipeline(chunk))).filter((e) => e.score >= MIN_SCORE);
    const boosted = boostCase(chunk);
    const boostedEntities = locateGroups(boosted, groupTokens(await nerPipeline(boosted))).map((e) => ({ ...e, value: chunk.slice(e.start, e.end) })).filter((e) => e.score >= MIN_SCORE);
    const combined = [...natural, ...boostedEntities].sort(
      (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || b.score - a.score
    );
    const kept = [];
    for (const e of combined) {
      if (kept.some((k) => e.start < k.end && e.end > k.start)) continue;
      kept.push(e);
    }
    for (const e of kept) {
      all.push({ ...e, start: e.start + offset, end: e.end + offset });
    }
    if (onProgress) await onProgress({ done: ++done, total: chunks.length });
  }
  const nameChar = /[A-Za-zÀ-ÿ'’-]/;
  for (const e of all) {
    if (e.type !== "PER" && e.type !== "ORG" && e.type !== "LOC") continue;
    let { start, end } = e;
    while (start > 0 && nameChar.test(text[start - 1])) start--;
    while (end < text.length && nameChar.test(text[end])) end++;
    while (start < end && text[start] === "-") start++;
    while (end > start && text[end - 1] === "-") end--;
    if (start !== e.start || end !== e.end) {
      e.start = start;
      e.end = end;
      e.value = text.slice(start, end);
    }
  }
  const PARTICLE = "(?:[Dd]e|[Dd]u|[Dd]es|[Ll]a|[Ll]e|[Dd]['\u2019]|[Ll]['\u2019]|von|van|[Dd]a|[Dd]i)";
  const CAPWORD = "[A-Z\xC0-\xDC][A-Za-z\xC0-\xFF'\u2019-]*";
  const ALLCAPS = "[A-Z\xC0-\xDC]{2,}(?:[-'\u2019][A-Z\xC0-\xDC]+)*";
  const fwdParticle = new RegExp(`^(?:\\s+${PARTICLE})+\\s+${CAPWORD}`);
  const fwdAllCaps = new RegExp(`^\\s+${ALLCAPS}(?![A-Za-z\xC0-\xFF])`);
  const backParticle = new RegExp(`(${CAPWORD}(?:\\s+${PARTICLE})+\\s+)$`);
  for (const e of all) {
    if (e.type === "PER") {
      let m;
      while ((m = fwdParticle.exec(text.slice(e.end))) || (m = fwdAllCaps.exec(text.slice(e.end)))) {
        e.end += m[0].length;
        e.value = text.slice(e.start, e.end);
      }
    }
    if (e.type === "LOC" || e.type === "MISC") {
      const m = backParticle.exec(text.slice(0, e.start));
      if (m) {
        e.start -= m[1].length;
        e.value = text.slice(e.start, e.end);
        e.type = "PER";
      }
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return all.filter((e) => {
    const k = `${e.start}:${e.end}:${e.type}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.start - b.start);
}

// src/engine/merge.js
var TYPE_PRIORITY = [
  "NIR",
  "IBAN",
  "SIRET_SIREN",
  "CARTE_BANCAIRE",
  "EMAIL",
  "TELEPHONE",
  "BIC",
  "IP",
  "MAC",
  "PSEUDO",
  "DATE_NAISSANCE",
  "ADRESSE",
  "CODE_POSTAL_VILLE",
  "REFERENCE",
  "MONTANT",
  "PER",
  "ORG",
  "LOC",
  "MISC"
];
var rank = (t) => {
  const i = TYPE_PRIORITY.indexOf(t);
  return i === -1 ? TYPE_PRIORITY.length : i;
};
function resolveOverlaps(entities) {
  const sorted = [...entities].sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || (a.source === "regex" ? 0 : 1) - (b.source === "regex" ? 0 : 1) || rank(a.type) - rank(b.type)
  );
  const kept = [];
  for (const e of sorted) {
    if (kept.some((k) => e.start < k.end && e.end > k.start)) continue;
    kept.push(e);
  }
  return kept.sort((a, b) => a.start - b.start);
}
function mergeEntities(regexEntities, nerEntities) {
  const nerKept = nerEntities.filter(
    (ne) => !regexEntities.some((re) => ne.start < re.end && ne.end > re.start)
  );
  return resolveOverlaps([...regexEntities, ...nerKept]);
}

// src/engine/selection.js
var entityKey = (e) => `${e.start}:${e.end}:${e.type}`;
function selectActive(autoEntities, manualEntities, removedKeys) {
  const manuals = manualEntities.filter((e) => !removedKeys.has(entityKey(e)));
  const autos = autoEntities.filter((e) => !removedKeys.has(entityKey(e)) && !manuals.some((m) => e.start < m.end && e.end > m.start));
  return resolveOverlaps([...autos, ...manuals]);
}
function forcedMasks(text, terms) {
  const out = [];
  for (const raw of terms || []) {
    const term = (raw || "").trim();
    if (!term) continue;
    let i = text.indexOf(term);
    while (i !== -1) {
      out.push({ type: "PERSONNALISE", value: term, start: i, end: i + term.length, source: "manuel" });
      i = text.indexOf(term, i + term.length);
    }
  }
  return out;
}
function filterByRules(entities, { disabledTypes = /* @__PURE__ */ new Set(), keepValues = [] } = {}) {
  const keep = new Set((keepValues || []).map((v) => (v || "").trim().toLowerCase()).filter(Boolean));
  return entities.filter(
    (e) => e.source === "manuel" || !disabledTypes.has(e.type) && !keep.has(e.value.toLowerCase())
  );
}

// src/engine/masking.js
var TYPE_LABELS = {
  PER: "PERSONNE",
  ORG: "ENTREPRISE",
  LOC: "LIEU",
  MISC: "DIVERS",
  EMAIL: "EMAIL",
  TELEPHONE: "TELEPHONE",
  IBAN: "IBAN",
  CARTE_BANCAIRE: "CARTE",
  NIR: "NIR",
  SIRET_SIREN: "SIRET",
  CODE_POSTAL_VILLE: "CODE_POSTAL",
  MONTANT: "MONTANT",
  ADRESSE: "ADRESSE",
  DATE_NAISSANCE: "DATE_NAISSANCE",
  REFERENCE: "REFERENCE",
  IP: "IP",
  MAC: "MAC",
  BIC: "BIC",
  PSEUDO: "PSEUDO"
};
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function maskText(text, entities, opts = {}) {
  const pseudonymize = opts.pseudonymize || null;
  const byValue = /* @__PURE__ */ new Map();
  const counters = /* @__PURE__ */ new Map();
  const mapping = [];
  let out = "";
  let cursor = 0;
  for (const e of entities) {
    const label = TYPE_LABELS[e.type] || e.type;
    const key = label + " " + e.value;
    let ph = byValue.get(key);
    if (!ph) {
      ph = pseudonymize ? pseudonymize(e.type, e.value) : null;
      const realistic = ph !== null && ph !== void 0;
      if (!realistic) {
        const n = (counters.get(label) || 0) + 1;
        counters.set(label, n);
        ph = "[" + label + "_" + n + "]";
      }
      byValue.set(key, ph);
      mapping.push({ placeholder: ph, value: e.value, type: e.type, realistic });
    }
    out += text.slice(cursor, e.start) + ph;
    cursor = e.end;
  }
  out += text.slice(cursor);
  const ordered = [...mapping].sort((a, b) => b.value.length - a.value.length);
  for (const { placeholder, value } of ordered) {
    const re = new RegExp(
      "(?<![\\p{L}\\p{N}_])" + escapeRe(value) + "(?![\\p{L}\\p{N}_])",
      "gu"
    );
    out = out.replace(re, placeholder);
  }
  return { masked: out, mapping };
}
function reinject(text, mapping) {
  if (!mapping.length) return text;
  const byPlaceholder = new Map(mapping.map((m) => [m.placeholder, m.value]));
  const re = new RegExp(mapping.map((m) => escapeRe(m.placeholder)).join("|"), "g");
  return text.replace(re, (ph) => byPlaceholder.get(ph) ?? ph);
}

export {
  detectRegex,
  NER_MODEL,
  detectNER,
  mergeEntities,
  entityKey,
  selectActive,
  forcedMasks,
  filterByRules,
  maskText,
  reinject
};
