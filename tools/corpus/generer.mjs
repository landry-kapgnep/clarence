// Phase 2 - Générateur de documents étiquetés, pour entraîner la détection.
//
//     node tools/corpus/generer.mjs [nombre] > corpus.jsonl
//
// Pourquoi synthétique. Il n'existe pas de corpus annoté de PII en français, et
// il ne peut pas en exister d'ouvert : ce serait, par définition, des données
// personnelles. En GÉNÉRANT les documents, les étiquettes sont connues par
// construction - c'est nous qui plaçons les entités. Zéro annotation, zéro
// donnée réelle, volume illimité. C'est la méthode de LLMLingua-2, qu'on
// embarque déjà.
//
// Ce que le modèle doit apprendre, et qui n'est pas ce qu'on croit. Notre
// défaut mesuré n'est pas un manque de rappel (84 % au banc) : c'est le bruit.
// Sur un vrai CV, 20 masques dont 10 faux. Le corpus doit donc être riche en
// NÉGATIFS DIFFICILES - des groupes nominaux qui ressemblent à des entités sans
// en être - bien plus qu'en entités à trouver. Voir NEGATIFS_DURS : ce sont les
// cas réellement observés, pas des inventions.
//
// Format de sérialisation : « [section] texte ». Choisi par mesure
// (tests/bench/serialisation.mjs) : sur un vrai CV, le préfixe de section
// retire 4 bruits sans perdre une seule vraie valeur, là où des champs nommés
// (« section: X | texte: Y ») coûtaient deux vraies valeurs. À ne pas confondre
// avec le libellé de champ accolé à une cellule, qui lui dégrade la détection
// (mesure d'août : 0,74 sur le libellé contre 0,15 sur la valeur).
import { fakerFR, fakerEN, fakerDE, fakerES } from '@faker-js/faker';

// Le même découpeur que celui posé au runtime dans ner-worker.js. Les indices
// d'entités sont donnés en tokens : s'ils étaient comptés autrement qu'à
// l'exécution, chaque étiquette serait décalée et l'entraînement apprendrait
// des frontières fausses.
const DECOUPEUR = /[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu;
const decouper = (texte) => texte.match(DECOUPEUR) || [];

// ── Sources d'entités ──────────────────────────────────────────────────────
//
// Le risque principal de toute cette approche. Si les noms viennent d'un
// vivier étroit, le modèle apprend ces mots-là et non « à quoi ressemble un
// nom » : score parfait sur nos données, rien de plus en production. Nos
// propres viviers (40 prénoms, 34 patronymes) sont très en dessous du
// nécessaire. D'où quatre locales de Faker plutôt qu'une, et des raisons
// sociales composées plutôt que tirées d'une liste.
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

  // Ajoutés le 29/08/2026 après une fuite mesurée, et c'est la leçon la plus
  // chère de ce corpus. Jusqu'ici, toute valeur portant un chiffre y était un
  // piège (« Baccalauréat Général 2016 », « Mars 2026 ») et aucune n'était une
  // vraie entité. Le filtre de précision en a tiré la règle « chiffre ⇒ pas une
  // entité » - poids −4,6, la troisième plus forte - et s'est mis à retirer
  //     « 42 rue des Cordeliers »   (adresse)
  //     « 44000 Nantes »            (code postal + ville)
  //     « EMP-0012 »                (matricule, que le déterministe ne voit pas)
  // Le banc est passé non publiable. Ce n'était pas le classifieur qui avait
  // tort : c'est le corpus qui ne lui avait jamais montré qu'un identifiant, une
  // adresse ou un code postal sont des données personnelles.
  //
  // Même leçon que P12 (« le corpus était le vrai coupable ») : quand le modèle
  // apprend une règle absurde, chercher d'abord ce qu'on a oublié de lui montrer.
  ADRESSE: () => `${1 + Math.floor(Math.random() * 180)} ${tirer(['rue', 'avenue', 'boulevard', 'impasse', 'chemin'])} `
    + `${tirer(['des Cordeliers', 'Victor Hugo', 'de la Gare', 'des Lilas', 'Jean Jaurès', 'du Moulin'])}`,
  CP_VILLE: () => `${String(1 + Math.floor(Math.random() * 95)).padStart(2, '0')}`
    + `${String(Math.floor(Math.random() * 1000)).padStart(3, '0')} ${tirer(LOCALES).location.city()}`,
  REFERENCE: () => tirer([
    () => `EMP-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    () => `MAT-${2015 + Math.floor(Math.random() * 11)}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
    () => `REF/${2015 + Math.floor(Math.random() * 11)}/${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    () => `${tirer(['DOS', 'CTR', 'ID'])}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
  ])(),
};

// ── NÉGATIFS DURS ──────────────────────────────────────────────────────────
//
// Le cœur du corpus. Chacun de ces groupes a été réellement produit comme faux
// positif par le modèle actuel sur de vrais documents - ils ne sont pas
// imaginés. Ils apparaissent dans les phrases sans aucune étiquette : c'est
// ainsi que le modèle apprend à ne rien y voir.
export const NEGATIFS_DURS = [
  'Canal acoustique de données', 'Stack conteneurisée', 'Bénévole terrain',
  'Développement & Web', 'Outils & Systèmes', 'Profil R&D',
  'Pipeline d’automatisation vidéo', 'Modélisation applicative',
  'Chaîne de traitement documentaire', 'Poste de travail industrialisé',
  'Analyse statistique des écarts', 'Gestion de projet agile',
  'Contrôle continu', 'Relevé de notes', 'Suivi de cohortes',
  'Machine Learning', 'Prompting LLM', 'Tests unitaires',
  // Ajoutés le 29/08/2026. Tous relevés dans des mesures ANTÉRIEURES du projet
  // et jamais couverts par le corpus : les faux positifs du CV réel listés en
  // tête de src/engine/vocabulaire.js, et ceux qui SURVIVAIENT encore au filtre
  // de vocabulaire (docs/roadmap-detection.md, P14 « ce qui reste »). Le corpus
  // ne servait à rien tant qu'il ignorait les erreurs déjà constatées.
  'Développeur Data', 'Ingénieur Systèmes', 'Chargé de mission',
  'Spécialités', 'Compétences transverses', 'Veille technologique',
];

// LANGUES - famille de faux positifs mesurée sur un vrai CV (« Anglais »,
// « Allemand », « Anglais C1 ») et pourtant absente du corpus jusqu'ici. Une
// langue n'est pas une donnée personnelle ; le modèle la voit volontiers comme
// une nationalité ou un lieu.
const LANGUES = ['Anglais', 'Allemand', 'Espagnol', 'Italien', 'Portugais'];
const NIVEAUX = ['A2', 'B1', 'B2', 'C1', 'courant', 'notions', 'bilingue'];

// Vocabulaire technique : jamais une donnée personnelle, et pourtant la
// deuxième famille de faux positifs mesurée.
export const TECHNOS = [
  'Python', 'Docker', 'PostgreSQL', 'React', 'FastAPI', 'Kubernetes', 'Git',
  'Pandas', 'NumPy', 'JaCoCo', 'JUnit', 'Gradle', 'Linux', 'Bash', 'SQL',
  'LAMP', 'BDD', 'ETL', 'REST', 'JWT', 'MongoDB', 'Terraform', 'Ollama',
];

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ── Gabarits ───────────────────────────────────────────────────────────────
//
// Un gabarit produit une ligne et déclare ses entités. `{PER}` est remplacé et
// étiqueté ; `{NEG}`, `{TECHNO}`, `{MOIS}` sont remplacés sans étiquette - ce
// sont les pièges.
export const GABARITS = {
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
    '{ORG}, {ADRESSE}, {CP_VILLE}.',
    '{NEG} — {ORG}, {LOC}. {MOIS} {ANNEE}.',
    'Stage chez {ORG} à {LOC} : {NEG}.',
    'Encadré par {PER}, responsable technique chez {ORG}.',
  ],
  'FORMATIONS': [
    'Diplôme obtenu à {ORG}, {LOC}, en {ANNEE}.',
    'Baccalauréat Général {ANNEE}. Spécialités : {TECHNO}, mathématiques.',
  ],
  // Une langue n'est pas une donnée personnelle, et « Mars 2026 » n'en est pas
  // une non plus - deux faux positifs mesurés sur un vrai CV, restés hors du
  // corpus jusqu'au 29/08/2026. Aucun slot n'y est étiqueté.
  'LANGUES': [
    '{LANGUE} {NIVEAU} · {LANGUE} {NIVEAU}',
    'Langues {LANGUE} ({NIVEAU}), {LANGUE} ({NIVEAU})',
    '{LANGUE} lu, écrit, parlé.',
  ],
  'DISPONIBILITÉ': [
    'Disponible à partir de {MOIS_MAJ} {ANNEE}.',
    'Recherche un contrat en alternance dès {MOIS_MAJ} {ANNEE}.',
  ],
  'IDENTITÉ': [
    'Nom {PER_MAJ}',
    'Date de naissance {DATE_NAISSANCE}',
    'Lieu de naissance {LOC}',
    'Adresse électronique {EMAIL}',
    'Téléphone {TEL}',
    'Sexe Masculin',
    'Nationalité Française',
    // Ces trois-là portent des chiffres et sont de vraies données personnelles.
    // Sans elles, le corpus n'enseignait qu'une chose sur les chiffres : les
    // ignorer. Voir le commentaire de `entite.ADRESSE`.
    'Adresse {ADRESSE}, {CP_VILLE}',
    'Domicilié au {ADRESSE} à {CP_VILLE}',
    'Matricule {REFERENCE}',
  ],
  'MENTIONS': [
    'NÉANT',
    'Aucune condamnation ne figure au bulletin.',
    'Bulletin délivré le {DATE_NAISSANCE} par le greffe.',
  ],
  'COMPTE RENDU': [
    'Dossier {REFERENCE} — {PER}, {ORG}.',
    'Salarié {PER}, matricule {REFERENCE}, affecté à {CP_VILLE}.',
    'Entretien annuel de {PER}, en poste depuis {ANNEE} chez {ORG}.',
    '{PER} a piloté {NEG} avec {PER}.',
    'Objectifs de l’année : {NEG}, {NEG}.',
  ],
};

export const SECTIONS_PAR_DOC = {
  cv: ['PROFIL', 'COMPÉTENCES CLÉS', 'EXPÉRIENCES PROFESSIONNELLES', 'FORMATIONS',
       'LANGUES', 'DISPONIBILITÉ'],
  formulaire: ['IDENTITÉ', 'MENTIONS'],
  rh: ['COMPTE RENDU'],
};

// Génère une ligne : le texte final et ses entités en indices de tokens.
//
// Rend aussi `texte` et `spans` (offsets en caractères). Le format GLiNER
// compte en tokens, mais notre propre moteur, lui, rend des offsets de
// caractères : sans cette seconde vue, on ne pourrait pas confronter ce que le
// détecteur propose à ce que le générateur a réellement placé - c'est
// exactement ce dont le filtre de précision a besoin pour s'entraîner. Les deux
// vues sont produites au même endroit, donc elles ne peuvent pas diverger.
export function ligne(section, gabarit) {
  const prefixe = `[${section}] `;
  let texte = prefixe;
  const entites = [];
  const spans = [];
  // On construit le texte morceau par morceau pour connaître, à chaque
  // insertion, la position en tokens de ce qu'on vient d'écrire.
  for (const part of gabarit.split(/(\{[A-Z_]+\})/)) {
    if (!part) continue;
    const slot = part.match(/^\{([A-Z_]+)\}$/)?.[1];
    if (!slot) { texte += part; continue; }
    const avant = decouper(texte).length;
    const avantChar = texte.length;
    let valeur;
    if (slot === 'NEG') valeur = tirer(NEGATIFS_DURS);
    else if (slot === 'TECHNO') valeur = tirer(TECHNOS);
    else if (slot === 'LANGUE') valeur = tirer(LANGUES);
    else if (slot === 'NIVEAU') valeur = tirer(NIVEAUX);
    else if (slot === 'MOIS') valeur = tirer(MOIS);
    else if (slot === 'MOIS_MAJ') { const m = tirer(MOIS); valeur = m[0].toUpperCase() + m.slice(1); }
    else if (slot === 'ANNEE') valeur = String(2015 + Math.floor(Math.random() * 12));
    else valeur = entite[slot]();
    texte += valeur;
    const apres = decouper(texte).length;
    // Étiqueté seulement si c'est une vraie entité. Les négatifs, les technos,
    // les mois et les années restent NUS : c'est tout l'enjeu.
    if (entite[slot]) {
      const type = slot === 'PER_MAJ' ? 'PER' : slot === 'TEL' ? 'TELEPHONE' : slot;
      entites.push([avant, apres - 1, LABELS[type], valeur]);
      spans.push({ start: avantChar, end: texte.length, type, valeur });
    }
  }
  const tokens = decouper(texte);
  // Garde-fou non négociable. Les indices sont calculés en découpant le texte
  // Partiel à chaque insertion ; si le découpeur se comporte autrement sur le
  // texte complet - une ponctuation qui fusionne, un tiret qui colle - les
  // étiquettes glissent. Le modèle apprendrait alors de fausses frontières, et
  // Rien ne le signalerait : ni erreur, ni test, juste un corpus subtilement
  // faux. On revérifie donc chaque span contre la valeur réellement insérée.
  const nu = (s) => s.replace(/\s+/g, '');
  for (const [a, b, label, attendu] of entites) {
    const relu = tokens.slice(a, b + 1).join(' ');
    if (nu(relu) !== nu(attendu)) {
      throw new Error(`étiquette désalignée : « ${relu} » au lieu de « ${attendu} » (${label})`);
    }
  }
  // Le même garde-fou pour la vue en caractères : elle sert de vérité de
  // référence au filtre de précision, un décalage y serait tout aussi
  // silencieux et tout aussi ruineux.
  for (const s of spans) {
    if (texte.slice(s.start, s.end) !== s.valeur) {
      throw new Error(`span désaligné : « ${texte.slice(s.start, s.end)} » au lieu de « ${s.valeur} »`);
    }
  }
  // `prefixeLongueur` : de quoi retirer exactement le « [section] » de tête.
  //
  // Il est indispensable à l'entraînement de GLiNER (forme choisie par mesure,
  // voir l'en-tête), mais la production, elle, ne préfixe rien : un intitulé y
  // est une unité à part, marquée `structurel` et épargnée par la passe
  // contextuelle. Un consommateur qui veut reproduire fidèlement l'inférence
  // doit donc pouvoir s'en débarrasser - sinon il mesure des faux positifs
  // (« EXPÉRIENCES PROFESSIONNELLES » vu comme une entreprise) que l'utilisateur
  // ne rencontre jamais.
  return {
    tokenized_text: tokens, ner: entites.map(([a, b, l]) => [a, b, l]),
    texte, spans, prefixeLongueur: prefixe.length
  };
}

// Les labels du corpus doivent être ceux de l'inférence - ce sont eux que le
// modèle apprendra à reconnaître. Voir GROUPES dans src/engine/gliner.js.
const LABELS = {
  PER: 'person', ORG: 'company', LOC: 'location',
  EMAIL: 'email', TELEPHONE: 'phone number', DATE_NAISSANCE: 'date of birth',
  // Adresse et code postal + ville sont des lieux : le label existe déjà et
  // c'est le bon. Le matricule, lui, n'a pas de label dédié dans GROUPES -
  // « company » est ce que le modèle en fait spontanément (mesuré : « EMP-0012 »
  // seul sort à 0,57 en entreprise), donc c'est l'étiquette qui décrit
  // réellement son comportement plutôt qu'une catégorie qui n'existe pas.
  ADRESSE: 'location', CP_VILLE: 'location', REFERENCE: 'company',
};

// Tire une ligne au hasard, en respectant les sections propres à chaque type de
// document. Exporté : le constructeur de jeu du filtre de précision
// (tools/filtre/) doit produire exactement les mêmes documents que
// l'entraînement du modèle, jamais une variante réécrite à côté.
export function ligneAuHasard() {
  const doc = tirer(Object.keys(SECTIONS_PAR_DOC));
  const section = tirer(SECTIONS_PAR_DOC[doc]);
  const gabarit = tirer(GABARITS[section]);
  return { ...ligne(section, gabarit), section, gabarit };
}

// Le corps de script ne tourne QUE si le fichier est lancé directement : le
// module doit être importable sans écrire 2 000 lignes sur la sortie standard.
// `pathToFileURL` plutôt qu'une concaténation à la main - sur Windows, un
// chemin `C:\…` ne devient pas une URL valide par simple préfixage.
const { pathToFileURL } = await import('node:url');
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const combien = Number(process.argv[2]) || 2000;
const stats = { lignes: 0, entites: 0, negatifs: 0 };
// Variété : la seule parade au sur-apprentissage, donc COMPTÉE et affichée
// plutôt que supposée. Un corpus de 20 000 lignes tirées de 40 prénoms
// n'apprend que ces 40 prénoms.
const distincts = { person: new Set(), company: new Set(), location: new Set() };
for (let i = 0; i < combien; i++) {
  const ex = ligneAuHasard();
  stats.lignes++;
  stats.entites += ex.ner.length;
  if (ex.gabarit.includes('{NEG}')) stats.negatifs++;
  for (const [a, b, label] of ex.ner) {
    if (distincts[label]) distincts[label].add(ex.tokenized_text.slice(a, b + 1).join(' '));
  }
  // Seules les deux clés du format GLiNER sont écrites : `texte`/`spans` sont
  // une vue interne, les ajouter au jsonl d'entraînement serait du bruit.
  process.stdout.write(JSON.stringify({ tokenized_text: ex.tokenized_text, ner: ex.ner }) + '\n');
}
console.error(`${stats.lignes} lignes · ${stats.entites} entités étiquetées · `
  + `${stats.negatifs} lignes portant un négatif dur`);
console.error('valeurs DISTINCTES  '
  + Object.entries(distincts).map(([k, s]) => `${k} ${s.size}`).join(' · '));
}
