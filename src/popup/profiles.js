// Profils d'anonymisation persistants. Un profil = un préréglage nommé des
// options de personnalisation DÉJÀ gérées par le moteur (selection.js) : il ne
// fait que pré-remplir les champs existants, le moteur ne sait rien des profils.
//
// Stockage : chrome.storage.local (persiste entre sessions, 100% local, jamais
// transmis — c'est de la config utilisateur, pas de la donnée document).
//
// Le profil « Développeur / Tech » livré par défaut résout le sur-masquage des
// technos (React/Prisma/Docker étiquetés ENTREPRISE par le NER) SANS liste
// cachée dans le moteur : c'est un défaut ÉDITABLE, propriété de l'utilisateur.
// Zéro risque de fuite (conservation explicite, jamais un retrait de détection).

import { motsDeForme } from '../engine/vocabulaire-formats.js';

export const PROFILES_KEY = 'clarenceProfiles';

// Noms de profils LIVRÉS que l'utilisateur a supprimés.
//
// LE DÉFAUT QUE ÇA CORRIGE : seedDefaults recrée tout profil livré dont le nom
// manque. Supprimer « Développeur / Tech » ne servait donc à rien — il
// revenait au rechargement suivant, indéfiniment. Anecdotique avec trois
// profils, pénible avec cinq.
//
// Clé SÉPARÉE plutôt qu'un champ dans la liste : un profil supprimé n'a plus
// d'entrée où poser un drapeau.
export const PROFILES_ECARTES_KEY = 'clarenceProfilsEcartes';

// Forme d'un profil : { name, alwaysKeep:[], alwaysMask:[], disabledTypes:[], realistic:bool }

// Technos/outils stables (les noms de langages/frameworks/BDD ne « périment »
// pas). Curé une fois ; l'utilisateur peut éditer/supprimer ensuite.
const TECH_KEEP = [
  'React', 'Angular', 'Vue', 'Svelte', 'Node', 'Node.js', 'Deno', 'Next.js',
  'Python', 'Java', 'Kotlin', 'Go', 'Rust', 'PHP', 'Ruby', 'Scala', 'C++', 'C#',
  'FastAPI', 'Django', 'Flask', 'Fastify', 'Express', 'Spring', 'Laravel', 'Symfony',
  'Prisma', 'Sequelize', 'Hibernate', 'TypeORM',
  'MongoDB', 'PostgreSQL', 'MySQL', 'MariaDB', 'Redis', 'SQLite', 'Elasticsearch', 'Cassandra',
  'Docker', 'Kubernetes', 'Podman', 'Terraform', 'Ansible',
  'Ollama', 'PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'NumPy', 'Pandas', 'Hugging Face',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jenkins', 'CircleCI',
  'Linux', 'Ubuntu', 'Debian', 'Bash', 'Nginx', 'Apache',
  'AWS', 'Azure', 'GCP', 'Vercel', 'Netlify', 'Heroku', 'Cloudflare',
  'Kafka', 'Spark', 'Airflow', 'Hadoop', 'Hive', 'Sqoop', 'RabbitMQ', 'GraphQL',
  'Power BI', 'Tableau', 'Excel', 'n8n', 'Zapier', 'Figma',
  'GPT-4o', 'Llama', 'Mistral', 'Claude', 'Gemini', 'Transformers.js', 'WebAssembly',
  // Tests, qualité, build — absents du premier jet, et masqués sur un vrai CV.
  'JUnit', 'JaCoCo', 'Pytest', 'Jest', 'Vitest', 'Selenium', 'Cypress',
  'Maven', 'Gradle', 'SonarQube', 'Postman', 'Swagger',
  // SIGLES DE MÉTIER. Trois lettres en capitales, donc happés en priorité
  // par la passe à casse adoucie (P12) : « LAMP » et « BDD » sortaient en
  // ENTREPRISE sur un CV réel. Jamais des données personnelles.
  'SQL', 'BDD', 'ETL', 'API', 'REST', 'SOAP', 'gRPC', 'JWT', 'CRUD', 'ORM',
  'HTML', 'CSS', 'SCSS', 'JSON', 'XML', 'CSV', 'LAMP', 'MERN', 'CI/CD',
  'Sankey', 'BeautifulSoup', 'Requests', 'Matplotlib', 'Seaborn',
  // Relevés sur un vrai CV le 01/09/2026 : masqués tous les deux, et absents
  // de cette liste alors que tout le reste de la même rubrique y était.
  // « IA » sortait en LIEU trois fois, « NSI » en PERSONNE — deux types que le
  // filtre de précision ne touche jamais (garde-fous 3 et 4), donc la liste
  // éditable est bien le seul mécanisme qui les traite.
  //
  // Un terme de deux lettres est sans danger ici : la correspondance est
  // MOT À MOT (voir filterByRules). Vérifié — « IA » démasque « IA » et
  // « Data & IA », mais laisse « Julia Roberts » et « Sofia » masqués.
  'IA', 'NSI'
];

// PLATEFORMES ET PRODUITS PUBLICS. Même statut que les technos : jamais une
// donnée personnelle, et pourtant massivement masqués — mesuré sur un mémoire
// réel, « ChatGPT » ressortait 41 fois et « Facebook » 6 fois, dans un document
// QUI PORTE SUR eux.
//
// Ils vont dans un profil ÉDITABLE, pas dans le moteur : la classe est ouverte
// (il s'en crée tous les mois), et une liste cachée dans le moteur serait
// exactement ce que la règle du projet interdit.
const PUBLIC_KEEP = [
  'ChatGPT', 'OpenAI', 'GPT-4', 'GPT-4o', 'Claude', 'Anthropic', 'Gemini',
  'Copilot', 'Mistral', 'LLaMA', 'DeepSeek', 'DeepL', 'Google Translate',
  'Google', 'Microsoft', 'Meta', 'Facebook', 'Instagram', 'LinkedIn', 'Bing',
  'YouTube', 'Reddit', 'Wikipedia', 'Twitter', 'Slack', 'Zoom', 'Teams'
];

// MOTS D'ARCHITECTURE DE DOCUMENT — dans TOUS les profils, jamais dans un seul.
//
// POURQUOI PARTOUT. Un intitulé de section n'appartient pas à un type de
// document : « COMPÉTENCES » vaut pour un CV, « SOMMAIRE » pour un mémoire,
// « MENTIONS » pour un formulaire. En faire un profil « CV » obligerait à
// choisir entre lui et son profil de métier, alors qu'on veut les deux — les
// profils sont exclusifs.
//
// CE QUE ÇA CORRIGE, mesuré : la passe à casse adoucie (P12) fait ressembler un
// intitulé en capitales à un nom propre. « COMPÉTENCES CLÉS », « Outils »,
// « Systèmes », « Spécialités » et « SPRACHEN » sont sortis masqués sur de
// vrais documents.
//
// ===================== RÈGLE D'ADMISSION, LA PLUS IMPORTANTE ================
// Elle vaut pour les trois listes ci-dessous. Ce qu'on écrit dans un « ne
// jamais masquer » ne sera JAMAIS masqué, pour personne : une liste blanche
// est un vecteur de fuite, pas une simple commodité.
//
// Donc du vocabulaire GÉNÉRIQUE uniquement. Jamais un nom d'école, d'employeur
// ou de ville : ce sont des quasi-identifiants, et les blanchir rouvrirait
// exactement le trou qu'on ferme ailleurs. Un nom propre n'est admis que s'il
// ne peut désigner personne (voir PUBLIC_KEEP : ChatGPT, Google).
// ===========================================================================
const STRUCTURE_KEEP = [
  'SOMMAIRE', 'INTRODUCTION', 'CONCLUSION', 'REMERCIEMENTS', 'ANNEXE', 'ANNEXES',
  'BIBLIOGRAPHIE', 'RÉFÉRENCES', 'GLOSSAIRE', 'RÉSUMÉ', 'ABSTRACT', 'PRÉAMBULE',
  'PROFIL', 'COMPÉTENCES', 'EXPÉRIENCES', 'EXPÉRIENCE', 'FORMATION', 'FORMATIONS',
  'PROJETS', 'LANGUES', 'INTÉRÊTS', 'DISTINCTIONS', 'CERTIFICATIONS',
  'OUTILS', 'SYSTÈMES', 'SPÉCIALITÉS', 'OBJECTIF', 'MENTIONS',
  'IDENTITÉ', 'COORDONNÉES',
  'SUMMARY', 'CONTENTS', 'APPENDIX', 'REFERENCES', 'SKILLS', 'EXPERIENCE',
  'EDUCATION', 'PROJECTS', 'LANGUAGES', 'INTERESTS', 'TOOLS', 'AWARDS',
  'INHALT', 'ZUSAMMENFASSUNG', 'SPRACHEN', 'KENNTNISSE', 'BERUFSERFAHRUNG'
];

// ADMINISTRATIF — vocabulaire des démarches. Justifié par un vrai casier
// judiciaire, où « RÉPUBLIQUE FRANÇAISE », « MINISTÈRE DE LA JUSTICE »,
// « IDENTITÉ » et « NÉANT » sortaient masqués en ENTREPRISE.
//
// AUCUN nom d'administration précise n'y figure, volontairement : « CAF »,
// « URSSAF » ou une préfecture nommée renseignent sur la situation de la
// personne. Seuls les mots de la démarche elle-même sont ici.
const ADMIN_KEEP = [
  'RÉPUBLIQUE FRANÇAISE', 'MINISTÈRE', 'PRÉFECTURE', 'SOUS-PRÉFECTURE', 'MAIRIE',
  'ADMINISTRATION', 'SERVICE PUBLIC', 'GREFFE', 'TRIBUNAL', 'COUR',
  'ATTESTATION', 'CERTIFICAT', 'RÉCÉPISSÉ', 'FORMULAIRE', 'BULLETIN', 'EXTRAIT',
  'DÉCLARATION', 'JUSTIFICATIF', 'CONVOCATION', 'NOTIFICATION', 'AVIS',
  'NÉANT', 'SANS OBJET', 'PIÈCE JOINTE', 'ARTICLE', 'ALINÉA',
  'DÉCRET', 'ARRÊTÉ', 'CODE', 'LOI', 'SIGNATURE', 'CACHET',
  'Nom', 'Prénom', 'Sexe', 'Masculin', 'Féminin',
  'Date de naissance', 'Lieu de naissance', 'Nationalité', 'Adresse',
  'Délivré le'
];

// ÉCOLE / ÉTUDES — vocabulaire académique générique. Justifié par un vrai CV,
// où « Baccalauréat », « Spécialités », « Cohortes » et « Général » sortaient
// masqués.
//
// Aucun nom d'établissement : « Sorbonne » ou « IUT » identifient un parcours,
// donc restent masquables.
// PARCOURS — universel, donc partagé comme STRUCTURE_KEEP.
//
// POURQUOI PAS DANS LE PROFIL ÉCOLE. Mesuré, et c'est ce qui a tranché : sur un
// vrai CV de développeur, « Développeur / Tech » ne récupérait que 4 des 25
// termes sur-masqués, « École / Études » 7 — mais aucun les deux, alors que le
// document a besoin des technos ET des diplômes. Les profils étant exclusifs,
// il fallait choisir, et choisir était perdant dans les deux sens.
//
// La ligne de partage retenue : ce qui apparaît dans un document QUEL QUE SOIT
// le domaine va dans les listes partagées ; ce qui n'apparaît que dans un
// document du domaine reste dans son profil. Un diplôme figure sur le CV d'un
// développeur comme d'un juriste ; un « contrôle continu » ne se lit que sur
// un document scolaire.
const PARCOURS_KEEP = [
  'Baccalauréat', 'Licence', 'Master', 'Doctorat', 'BUT', 'BTS', 'DUT', 'CAP',
  'Diplôme', 'Mention', 'Promotion', 'Cohorte', 'Cohortes',
  'Spécialité', 'Spécialités', 'Option', 'Général', 'Technologique',
  'Professionnel', 'Alternance', 'Apprentissage', 'Stage', 'Bachelor'
];

// ÉCOLE / ÉTUDES — ce qui ne se lit QUE sur un document scolaire, au-delà du
// vocabulaire de parcours ci-dessus.
//
// Aucun nom d'établissement : « Sorbonne » ou « IUT » identifient un parcours,
// donc restent masquables.
const ECOLE_KEEP = [
  'Prépa', 'Classe préparatoire', 'Semestre', 'Trimestre',
  'Mémoire', 'Thèse', 'Soutenance', 'Rapport de stage', 'Tuteur',
  'ECTS', 'Crédits', 'Module', 'Matière',
  'Travaux dirigés', 'Travaux pratiques', 'Cours magistral', 'Contrôle continu',
  'Moyenne', 'Coefficient', 'Relevé de notes',
  'Coursework', 'Dissertation', 'Semester', 'Transcript'
];

// Profils livrés. seedDefaults les ajoute SEULEMENT s'ils n'existent pas déjà
// (jamais d'écrasement d'une version éditée par l'utilisateur).
export function defaultProfiles() {
  return [
    // « Vierge » reste VIDE, et doit le rester : c'est le profil qui ne
    // présuppose rien, donc le témoin quand on soupçonne qu'une liste blanche
    // cache un défaut de détection.
    { name: 'Vierge', alwaysKeep: [], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: 'Développeur / Tech', alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...TECH_KEEP, ...PUBLIC_KEEP, ...motsDeForme('cv')], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: 'Administratif', alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...ADMIN_KEEP, ...motsDeForme('administratif')], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: 'École / Études', alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...ECOLE_KEEP, ...motsDeForme('scolaire')], alwaysMask: [], disabledTypes: [], realistic: false },
    // ── PROFILS PAR FORMAT ──
    //
    // Les précédents décrivent un MÉTIER (« je suis développeur »), ceux-ci un
    // TYPE DE DOCUMENT (« ceci est un CV »). Les deux axes sont utiles et ne se
    // remplacent pas : un développeur qui envoie un relevé bancaire n'a pas
    // besoin de sa liste de frameworks, il a besoin des mots d'un relevé.
    //
    // Leur vocabulaire vient de `vocabulaire-formats.js`, la même source que la
    // reconnaissance de type — c'est ce qui permet de les PROPOSER
    // automatiquement (voir PROFIL_POUR_TYPE), et ce qui garantit qu'ajouter
    // une langue serve les deux d'un coup.
    { name: 'CV / Résumé', alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...PUBLIC_KEEP, ...motsDeForme('cv')], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: 'Relevé bancaire', alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...motsDeForme('bancaire')], alwaysMask: [], disabledTypes: [], realistic: false },
    // Un document qui PARLE d'IA ou de plateformes n'est pas forcément un
    // document technique : ce profil sert le rédacteur, l'étudiant, le
    // chercheur — sans leur imposer la liste des frameworks.
    { name: 'Rédaction / Recherche', alwaysKeep: [...STRUCTURE_KEEP, ...PARCOURS_KEEP, ...PUBLIC_KEEP, ...motsDeForme('scolaire')], alwaysMask: [], disabledTypes: [], realistic: false }
  ];
}

// Normalise un profil arbitraire (défensif : storage édité à la main, versions).
// `empreinte` est reportée telle quelle : c'est elle qui dira plus tard si
// l'utilisateur a touché à un profil livré (voir seedDefaults).
export function normalizeProfile(p) {
  const arr = v => Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
  const out = {
    name: typeof p?.name === 'string' && p.name.trim() ? p.name.trim() : 'Sans nom',
    alwaysKeep: arr(p?.alwaysKeep),
    alwaysMask: arr(p?.alwaysMask),
    disabledTypes: arr(p?.disabledTypes),
    realistic: !!p?.realistic
  };
  if (typeof p?.empreinte === 'string') out.empreinte = p.empreinte;
  return out;
}

// Empreinte du CONTENU d'un profil — le nom en est exclu, puisqu'il sert de
// clé. FNV-1a : déterministe, sans dépendance, suffisant ici (on compare une
// valeur à elle-même, il n'y a rien à attaquer).
export function empreinteDe(profil) {
  const p = normalizeProfile(profil);
  const s = JSON.stringify([p.alwaysKeep, p.alwaysMask, p.disabledTypes, p.realistic]);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// Empreintes des versions DÉJÀ EXPÉDIÉES d'un profil livré.
//
// POURQUOI CETTE LISTE. Les profils installés avant l'introduction du champ
// `empreinte` n'en portent pas : impossible de dire, pour eux, s'ils ont été
// édités ou non. Sans repère, on ne pourrait que les laisser tels quels — et
// un utilisateur garderait à vie la liste du jour de sa première installation.
// C'est exactement ce qui s'est produit : « BDD », « LAMP » et « JaCoCo »
// ajoutés aux technos n'atteignaient personne d'installé.
//
// Une empreinte connue vaut donc preuve de non-édition. AJOUTER UNE LIGNE ICI
// à chaque fois qu'on modifie un profil livré, avec l'empreinte de la version
// remplacée — sinon la mise à jour cessera d'atteindre les installations
// existantes, en silence.
const EMPREINTES_HISTORIQUES = {
  // 2cb8ce1c : jusqu'au 15/08/2026, avant les sigles de métier et l'outillage
  //            de test (commit 115b097).
  // 5a83db13 : jusqu'au 18/08/2026, avant l'ajout de STRUCTURE_KEEP.
  // 519521a4 : jusqu'au 02/09/2026, avant les mots de forme multilingues.
  'Développeur / Tech': ['2cb8ce1c', '5a83db13', '519521a4'],
  // Relevées AVANT modification, pour que la mise à jour atteigne aussi les
  // copies stockées à une époque où le champ `empreinte` n'existait pas encore.
  // Sans ça, elles seraient prises pour des versions éditées par l'utilisateur
  // et ne recevraient jamais l'espagnol ni le portugais.
  'Administratif': ['5ec436cb'],
  'École / Études': ['4a086a21'],
  'Rédaction / Recherche': ['a8805ca9', 'f37a741c'],
  'Vierge': ['1727123c']
};

// Complète une liste existante avec les profils par défaut manquants, ET met à
// jour ceux que l'utilisateur n'a JAMAIS touchés.
//
// LE DÉFAUT QUE ÇA CORRIGE. L'ancienne version n'ajoutait un profil que si son
// nom était absent. Conséquence : enrichir une liste livrée n'atteignait
// personne d'installé, et c'était SILENCIEUX — on voit un profil au bon nom,
// rien ne dit qu'il date de la première installation. Mesuré sur un vrai CV :
// « BDD », « LAMP » et « JaCoCo » restaient masqués malgré leur ajout.
//
// LA RÈGLE : on ne remplace un profil livré que si son contenu correspond
// encore EXACTEMENT à une version qu'on a expédiée. Une seule différence, et
// on n'y touche plus — l'édition de l'utilisateur prime toujours.
//
// CE QU'ON NE FAIT SURTOUT PAS : fusionner les listes. Ce serait plus simple,
// mais ça ressusciterait les termes que l'utilisateur a volontairement RETIRÉS
// d'un « ne jamais masquer » — donc ça conserverait en clair ce qu'il voulait
// masquer. Mauvais sens, au regard de « zéro-fuite d'abord ».
export function seedDefaults(existing, ecartes = []) {
  const list = (Array.isArray(existing) ? existing : []).map(normalizeProfile);
  const parNom = new Map(list.map(p => [p.name, p]));
  const ecarte = new Set(Array.isArray(ecartes) ? ecartes : []);

  for (const d of defaultProfiles()) {
    // Supprimé par l'utilisateur : on ne le ressuscite pas. Il redeviendra
    // disponible s'il recrée un profil de ce nom (voir upsertProfile).
    if (ecarte.has(d.name) && !parNom.has(d.name)) continue;
    const courant = { ...d, empreinte: empreinteDe(d) };
    const stocke = parNom.get(d.name);
    if (!stocke) { list.push(courant); continue; }

    // Intact ? Soit il porte son empreinte et elle correspond toujours, soit
    // son contenu est celui d'une version expédiée avant l'existence du champ.
    const actuelle = empreinteDe(stocke);
    const intact = stocke.empreinte
      ? stocke.empreinte === actuelle
      : (EMPREINTES_HISTORIQUES[d.name] || []).includes(actuelle);
    if (intact) list[list.indexOf(stocke)] = courant;
  }
  return list;
}

// --- Accès chrome.storage.local (absent en Node → fonctions no-op sûres) -----
function hasStore() {
  return typeof chrome !== 'undefined' && chrome.storage?.local;
}

export async function loadProfiles() {
  if (!hasStore()) return seedDefaults([]);
  const r = await chrome.storage.local.get([PROFILES_KEY, PROFILES_ECARTES_KEY]).catch(() => ({}));
  const seeded = seedDefaults(r?.[PROFILES_KEY], r?.[PROFILES_ECARTES_KEY]);
  // Persiste les défauts semés au 1er lancement, pour qu'ils soient éditables.
  if (!r?.[PROFILES_KEY]) await chrome.storage.local.set({ [PROFILES_KEY]: seeded }).catch(() => {});
  return seeded;
}

async function lireEcartes() {
  if (!hasStore()) return [];
  const r = await chrome.storage.local.get(PROFILES_ECARTES_KEY).catch(() => ({}));
  const v = r?.[PROFILES_ECARTES_KEY];
  return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
}

async function ecrireEcartes(noms) {
  if (!hasStore()) return;
  await chrome.storage.local.set({ [PROFILES_ECARTES_KEY]: [...new Set(noms)] }).catch(() => {});
}

// Un profil livré est-il concerné par la mémoire des suppressions ? Les
// profils personnels n'en ont pas besoin : rien ne les recrée.
export function estProfilLivre(name) {
  return defaultProfiles().some(d => d.name === name);
}

export async function saveAllProfiles(list) {
  if (!hasStore()) return;
  await chrome.storage.local.set({ [PROFILES_KEY]: list.map(normalizeProfile) }).catch(() => {});
}

// Insère ou remplace un profil par son nom, puis persiste. Retourne la liste.
export async function upsertProfile(profile) {
  const list = await loadProfiles();
  const p = normalizeProfile(profile);
  const idx = list.findIndex(x => x.name === p.name);
  if (idx >= 0) list[idx] = p; else list.push(p);
  await saveAllProfiles(list);
  // Recréer un profil du nom d'un livré annule son retrait : sinon il
  // disparaîtrait de nouveau au rechargement, sans explication.
  if (estProfilLivre(p.name)) {
    const restants = (await lireEcartes()).filter(n => n !== p.name);
    await ecrireEcartes(restants);
  }
  return list;
}

export async function deleteProfile(name) {
  const list = (await loadProfiles()).filter(p => p.name !== name);
  await saveAllProfiles(list);
  // Mémoriser le retrait UNIQUEMENT pour un profil livré : sans ça,
  // seedDefaults le recréerait au prochain chargement.
  if (estProfilLivre(name)) await ecrireEcartes([...(await lireEcartes()), name]);
  return list;
}


// Quel profil proposer pour un type de document reconnu.
//
// `null` là où aucun profil ne s'impose : un e-mail n'a pas de vocabulaire de
// forme propre au-delà de ses en-têtes, et proposer au hasard serait pire que
// se taire (voir type-document.js, même principe).
export const PROFIL_POUR_TYPE = {
  cv: 'CV / Résumé',
  administratif: 'Administratif',
  scolaire: 'École / Études',
  bancaire: 'Relevé bancaire',
  email: null
};
