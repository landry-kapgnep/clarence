// PHASE 2 — Générateur de documents étiquetés, pour entraîner la détection.
//
//     node tools/corpus/generer.mjs [nombre] > corpus.jsonl
//
// POURQUOI SYNTHÉTIQUE. Il n'existe pas de corpus annoté de PII en français, et
// il ne peut pas en exister d'ouvert : ce serait, par définition, des données
// personnelles. En GÉNÉRANT les documents, les étiquettes sont connues par
// construction — c'est nous qui plaçons les entités. Zéro annotation, zéro
// donnée réelle, volume illimité. C'est la méthode de LLMLingua-2, qu'on
// embarque déjà.
//
// CE QUE LE MODÈLE DOIT APPRENDRE, ET QUI N'EST PAS CE QU'ON CROIT. Notre
// défaut mesuré n'est pas un manque de rappel (84 % au banc) : c'est le BRUIT.
// Sur un vrai CV, 20 masques dont 10 faux. Le corpus doit donc être riche en
// NÉGATIFS DIFFICILES — des groupes nominaux qui ressemblent à des entités sans
// en être — bien plus qu'en entités à trouver. Voir NEGATIFS_DURS : ce sont les
// cas réellement observés, pas des inventions.
//
// FORMAT DE SÉRIALISATION : « [SECTION] texte ». Choisi par mesure
// (tests/bench/serialisation.mjs) : sur un vrai CV, le préfixe de section
// retire 4 bruits sans perdre une seule vraie valeur, là où des champs nommés
// (« section: X | texte: Y ») coûtaient deux vraies valeurs. À ne pas confondre
// avec le libellé de CHAMP accolé à une cellule, qui lui DÉGRADE la détection
// (mesure d'août : 0,74 sur le libellé contre 0,15 sur la valeur).
import { fakerFR, fakerEN, fakerDE, fakerES } from '@faker-js/faker';

// Le MÊME découpeur que celui posé au runtime dans ner-worker.js. Les indices
// d'entités sont donnés en TOKENS : s'ils étaient comptés autrement qu'à
// l'exécution, chaque étiquette serait décalée et l'entraînement apprendrait
// des frontières fausses.
const DECOUPEUR = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;
const decouper = (texte) => texte.match(DECOUPEUR) || [];

// ── Sources d'entités ──────────────────────────────────────────────────────
//
// ⚠️ LE RISQUE PRINCIPAL DE TOUTE CETTE APPROCHE. Si les noms viennent d'un
// vivier étroit, le modèle apprend CES MOTS-LÀ et non « à quoi ressemble un
// nom » : score parfait sur nos données, rien de plus en production. Nos
// propres viviers (40 prénoms, 34 patronymes) sont très en dessous du
// nécessaire. D'où quatre locales de Faker plutôt qu'une, et des raisons
// sociales COMPOSÉES plutôt que tirées d'une liste.
const LOCALES = [fakerFR, fakerFR, fakerFR, fakerEN, fakerDE, fakerES];
const tirer = (a) => a[Math.floor(Math.random() * a.length)];
const parfois = (p) => Math.random() < p;

const FORMES_ORG = [
  () => `${tirer(LOCALES).company.name()}`,
  () => `${tirer(LOCALES).person.lastName()} ${tirer(['Conseil', 'Consulting', 'Industries', 'Partners', 'Labs', '& Associés', 'Group'])}`,
  () => `${tirer(LOCALES).person.lastName()}${tirer(['tech', 'soft', 'sys', 'lab', 'match', 'ly', 'io'])}`,
];

const entite = {
  PER: () => { const f = tirer(LOCALES); return `${f.person.firstName()} ${f.person.lastName()}`; },
  PER_MAJ: () => { const f = tirer(LOCALES); return `${f.person.firstName()} ${f.person.lastName()}`.toUpperCase(); },
  ORG: () => tirer(FORMES_ORG)(),
  LOC: () => tirer(LOCALES).location.city(),
  EMAIL: () => tirer(LOCALES).internet.email().toLowerCase(),
  TEL: () => fakerFR.phone.number({ style: 'national' }),
  DATE_NAISSANCE: () => fakerFR.date.birthdate().toLocaleDateString('fr-FR'),
};

// ── NÉGATIFS DURS ──────────────────────────────────────────────────────────
//
// Le cœur du corpus. Chacun de ces groupes a été RÉELLEMENT produit comme faux
// positif par le modèle actuel sur de vrais documents — ils ne sont pas
// imaginés. Ils apparaissent dans les phrases SANS AUCUNE ÉTIQUETTE : c'est
// ainsi que le modèle apprend à ne rien y voir.
const NEGATIFS_DURS = [
  'Canal acoustique de données', 'Stack conteneurisée', 'Bénévole terrain',
  'Développement & Web', 'Outils & Systèmes', 'Profil R&D',
  'Pipeline d’automatisation vidéo', 'Modélisation applicative',
  'Chaîne de traitement documentaire', 'Poste de travail industrialisé',
  'Analyse statistique des écarts', 'Gestion de projet agile',
  'Contrôle continu', 'Relevé de notes', 'Suivi de cohortes',
  'Machine Learning', 'Prompting LLM', 'Tests unitaires',
];

// Vocabulaire technique : jamais une donnée personnelle, et pourtant la
// deuxième famille de faux positifs mesurée.
const TECHNOS = [
  'Python', 'Docker', 'PostgreSQL', 'React', 'FastAPI', 'Kubernetes', 'Git',
  'Pandas', 'NumPy', 'JaCoCo', 'JUnit', 'Gradle', 'Linux', 'Bash', 'SQL',
  'LAMP', 'BDD', 'ETL', 'REST', 'JWT', 'MongoDB', 'Terraform', 'Ollama',
];

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ── Gabarits ───────────────────────────────────────────────────────────────
//
// Un gabarit produit une LIGNE et déclare ses entités. `{PER}` est remplacé et
// étiqueté ; `{NEG}`, `{TECHNO}`, `{MOIS}` sont remplacés SANS étiquette — ce
// sont les pièges.
const GABARITS = {
  'PROFIL': [
    'Étudiant en informatique à {ORG}, recherche une alternance pour {MOIS} {ANNEE}.',
    '{NEG}. Forte appétence pour {NEG}.',
    '{PER_MAJ}',
    'Développeur {TECHNO} · {TECHNO} · {TECHNO}',
  ],
  'COMPÉTENCES CLÉS': [
    '{NEG} • {TECHNO} · {TECHNO} · {TECHNO}',
    '{NEG} • {TECHNO} · {TECHNO}',
    'Bases de données • {TECHNO} · {TECHNO} · {TECHNO}',
  ],
  'EXPÉRIENCES PROFESSIONNELLES': [
    '{NEG} — {ORG}, {LOC}. {MOIS} {ANNEE}.',
    'Stage chez {ORG} à {LOC} : {NEG}.',
    'Encadré par {PER}, responsable technique chez {ORG}.',
  ],
  'FORMATIONS': [
    'Diplôme obtenu à {ORG}, {LOC}, en {ANNEE}.',
    'Baccalauréat Général {ANNEE}. Spécialités : {TECHNO}, mathématiques.',
  ],
  'IDENTITÉ': [
    'Nom {PER_MAJ}',
    'Date de naissance {DATE_NAISSANCE}',
    'Lieu de naissance {LOC}',
    'Adresse électronique {EMAIL}',
    'Téléphone {TEL}',
    'Sexe Masculin',
    'Nationalité Française',
  ],
  'MENTIONS': [
    'NÉANT',
    'Aucune condamnation ne figure au bulletin.',
    'Bulletin délivré le {DATE_NAISSANCE} par le greffe.',
  ],
  'COMPTE RENDU': [
    'Entretien annuel de {PER}, en poste depuis {ANNEE} chez {ORG}.',
    '{PER} a piloté {NEG} avec {PER}.',
    'Objectifs de l’année : {NEG}, {NEG}.',
  ],
};

const SECTIONS_PAR_DOC = {
  cv: ['PROFIL', 'COMPÉTENCES CLÉS', 'EXPÉRIENCES PROFESSIONNELLES', 'FORMATIONS'],
  formulaire: ['IDENTITÉ', 'MENTIONS'],
  rh: ['COMPTE RENDU'],
};

// Génère une ligne : le texte final et ses entités en indices de TOKENS.
function ligne(section, gabarit) {
  const prefixe = `[${section}] `;
  let texte = prefixe;
  const entites = [];
  // On construit le texte morceau par morceau pour connaître, à chaque
  // insertion, la position en tokens de ce qu'on vient d'écrire.
  for (const part of gabarit.split(/(\{[A-Z_]+\})/)) {
    if (!part) continue;
    const slot = part.match(/^\{([A-Z_]+)\}$/)?.[1];
    if (!slot) { texte += part; continue; }
    const avant = decouper(texte).length;
    let valeur;
    if (slot === 'NEG') valeur = tirer(NEGATIFS_DURS);
    else if (slot === 'TECHNO') valeur = tirer(TECHNOS);
    else if (slot === 'MOIS') valeur = tirer(MOIS);
    else if (slot === 'ANNEE') valeur = String(2015 + Math.floor(Math.random() * 12));
    else valeur = entite[slot]();
    texte += valeur;
    const apres = decouper(texte).length;
    // Étiqueté SEULEMENT si c'est une vraie entité. Les négatifs, les technos,
    // les mois et les années restent NUS : c'est tout l'enjeu.
    if (entite[slot]) {
      const type = slot === 'PER_MAJ' ? 'PER' : slot === 'TEL' ? 'TELEPHONE' : slot;
      entites.push([avant, apres - 1, LABELS[type], valeur]);
    }
  }
  const tokens = decouper(texte);
  // GARDE-FOU NON NÉGOCIABLE. Les indices sont calculés en découpant le texte
  // PARTIEL à chaque insertion ; si le découpeur se comporte autrement sur le
  // texte complet — une ponctuation qui fusionne, un tiret qui colle — les
  // étiquettes glissent. Le modèle apprendrait alors de fausses frontières, et
  // RIEN ne le signalerait : ni erreur, ni test, juste un corpus subtilement
  // faux. On revérifie donc chaque span contre la valeur réellement insérée.
  const nu = (s) => s.replace(/\s+/g, '');
  for (const [a, b, label, attendu] of entites) {
    const relu = tokens.slice(a, b + 1).join(' ');
    if (nu(relu) !== nu(attendu)) {
      throw new Error(`étiquette désalignée : « ${relu} » au lieu de « ${attendu} » (${label})`);
    }
  }
  return { tokenized_text: tokens, ner: entites.map(([a, b, l]) => [a, b, l]) };
}

// Les labels du corpus doivent être CEUX de l'inférence — ce sont eux que le
// modèle apprendra à reconnaître. Voir GROUPES dans src/engine/gliner.js.
const LABELS = {
  PER: 'person', ORG: 'company', LOC: 'location',
  EMAIL: 'email', TELEPHONE: 'phone number', DATE_NAISSANCE: 'date of birth',
};

const combien = Number(process.argv[2]) || 2000;
const stats = { lignes: 0, entites: 0, negatifs: 0 };
// Variété : la seule parade au sur-apprentissage, donc COMPTÉE et affichée
// plutôt que supposée. Un corpus de 20 000 lignes tirées de 40 prénoms
// n'apprend que ces 40 prénoms.
const distincts = { person: new Set(), company: new Set(), location: new Set() };
for (let i = 0; i < combien; i++) {
  const doc = tirer(Object.keys(SECTIONS_PAR_DOC));
  const section = tirer(SECTIONS_PAR_DOC[doc]);
  const gabarit = tirer(GABARITS[section]);
  const ex = ligne(section, gabarit);
  stats.lignes++;
  stats.entites += ex.ner.length;
  if (gabarit.includes('{NEG}')) stats.negatifs++;
  for (const [a, b, label] of ex.ner) {
    if (distincts[label]) distincts[label].add(ex.tokenized_text.slice(a, b + 1).join(' '));
  }
  process.stdout.write(JSON.stringify(ex) + '\n');
}
console.error(`${stats.lignes} lignes · ${stats.entites} entités étiquetées · `
  + `${stats.negatifs} lignes portant un négatif dur`);
console.error('valeurs DISTINCTES  '
  + Object.entries(distincts).map(([k, s]) => `${k} ${s.size}`).join(' · '));
