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

export const PROFILES_KEY = 'clarenceProfiles';

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
  'Sankey', 'BeautifulSoup', 'Requests', 'Matplotlib', 'Seaborn'
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

// Profils livrés. seedDefaults les ajoute SEULEMENT s'ils n'existent pas déjà
// (jamais d'écrasement d'une version éditée par l'utilisateur).
export function defaultProfiles() {
  return [
    { name: 'Vierge', alwaysKeep: [], alwaysMask: [], disabledTypes: [], realistic: false },
    { name: 'Développeur / Tech', alwaysKeep: [...TECH_KEEP, ...PUBLIC_KEEP], alwaysMask: [], disabledTypes: [], realistic: false },
    // Un document qui PARLE d'IA ou de plateformes n'est pas forcément un
    // document technique : ce profil sert le rédacteur, l'étudiant, le
    // chercheur — sans leur imposer la liste des frameworks.
    { name: 'Rédaction / Recherche', alwaysKeep: [...PUBLIC_KEEP], alwaysMask: [], disabledTypes: [], realistic: false }
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
  // Version expédiée jusqu'au 15/08/2026, avant l'ajout des sigles de métier
  // et de l'outillage de test (commit 115b097).
  'Développeur / Tech': ['2cb8ce1c'],
  'Rédaction / Recherche': ['a8805ca9'],
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
export function seedDefaults(existing) {
  const list = (Array.isArray(existing) ? existing : []).map(normalizeProfile);
  const parNom = new Map(list.map(p => [p.name, p]));

  for (const d of defaultProfiles()) {
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
  const r = await chrome.storage.local.get(PROFILES_KEY).catch(() => ({}));
  const seeded = seedDefaults(r?.[PROFILES_KEY]);
  // Persiste les défauts semés au 1er lancement, pour qu'ils soient éditables.
  if (!r?.[PROFILES_KEY]) await chrome.storage.local.set({ [PROFILES_KEY]: seeded }).catch(() => {});
  return seeded;
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
  return list;
}

export async function deleteProfile(name) {
  const list = (await loadProfiles()).filter(p => p.name !== name);
  await saveAllProfiles(list);
  return list;
}
