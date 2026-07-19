// Pseudonymes réalistes (option) — port JS du PseudonymGenerator Python :
// listes FR curées + choix déterministe par hachage de la valeur d'origine.
// 100% local, zéro dépendance. Les types structurés critiques (IBAN, carte,
// NIR, SIRET…) ne sont JAMAIS pseudonymisés en réaliste : générer de faux
// numéros plausibles risque de collisionner avec de vrais — ils restent en
// placeholders [TYPE_N], honnêtes et sans ambiguïté.

const PRENOMS = [
  'Alexandre', 'Antoine', 'Baptiste', 'Clément', 'Étienne', 'Gabriel',
  'Hugo', 'Jules', 'Louis', 'Lucas', 'Maxime', 'Nathan', 'Paul', 'Raphaël',
  'Romain', 'Thomas', 'Victor', 'Julien', 'Quentin', 'Vincent',
  'Amélie', 'Camille', 'Charlotte', 'Chloé', 'Élise', 'Emma', 'Inès',
  'Juliette', 'Léa', 'Louise', 'Lucie', 'Manon', 'Mathilde', 'Noémie',
  'Pauline', 'Marion', 'Hélène', 'Nathalie', 'Aurélie', 'Émilie'
];

const NOMS = [
  'Bernard', 'Blanc', 'Bonnet', 'Chevalier', 'Deschamps', 'Dubois',
  'Dumont', 'Durand', 'Faure', 'Fournier', 'Garnier', 'Gauthier',
  'Girard', 'Lambert', 'Lefebvre', 'Legrand', 'Lemaire', 'Mercier',
  'Moreau', 'Morel', 'Petit', 'Renard', 'Richard', 'Robin', 'Rousseau',
  'Roux', 'Simon', 'Barbier', 'Boyer', 'Brun', 'Colin', 'Denis',
  'Leroy', 'Perrin'
];

const VILLES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes',
  'Strasbourg', 'Nice', 'Montpellier', 'Rennes', 'Reims', 'Grenoble',
  'Dijon', 'Angers', 'Tours', 'Orléans', 'Metz'
];

const ORGS = [
  'Nordis Conseil', 'Alphatec', 'Groupe Vertière', 'Solunea', 'Castel & Fils',
  'Novaris SARL', 'Ateliers Brossard', 'Delmont Industries', 'Cabinet Ferrand',
  'Tessalis', 'Ormeau Digital', 'Clavier & Associés', 'Sequoia Services',
  'Baltane', 'Comptoir Lorrain', 'Studio Amarante'
];

const RUES = [
  'rue des Acacias', 'avenue des Peupliers', 'boulevard Saint-Michel',
  'rue de la Fontaine', 'impasse des Lilas', 'chemin des Vignes',
  'place du Marché', 'rue des Écoles', 'avenue de la République',
  'rue du Moulin', 'allée des Charmes', 'quai des Brumes'
];

const EMAIL_DOMAINS = [
  'exemple-mail.fr', 'courriel-temp.fr', 'boite-anonyme.fr', 'pseudo-mail.fr'
];

// Types éligibles au réalisme ; tout le reste garde son placeholder [TYPE_N].
const REALISTIC_TYPES = new Set([
  'PER', 'ORG', 'LOC', 'ADRESSE', 'EMAIL', 'TELEPHONE', 'DATE_NAISSANCE'
]);

const stripAccents = s =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// createPseudonymizer({ seed, avoid }) → fn(type, value) → pseudo | null.
// - seed : stabilité au sein d'une session d'analyse ;
// - avoid(v) : refuse un pseudo présent dans le texte d'origine (collision
//   avec une vraie valeur) ;
// - unicité garantie entre pseudos d'une même session.
export function createPseudonymizer({ seed = 'clarence', avoid = () => false } = {}) {
  const used = new Set();

  const fnv = str => {
    let h = 0x811c9dc5;
    for (const c of seed + ' ' + str) {
      h ^= c.codePointAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h;
  };
  const pick = (arr, h, i = 0) => arr[(h + i * 13) % arr.length];
  const digits = (h, n) => String(h % 10 ** n).padStart(n, '0');

  function unique(gen, h) {
    for (let i = 0; i < 300; i++) {
      const v = gen(h, i);
      if (v && !used.has(v) && !avoid(v)) { used.add(v); return v; }
    }
    return null; // aucune variante libre → l'appelant retombe en placeholder
  }

  const generators = {
    PER: h => unique((h2, i) => `${pick(PRENOMS, h2, i)} ${pick(NOMS, (h2 >>> 5) + i, i)}`, h),
    ORG: h => unique((h2, i) => pick(ORGS, h2, i), h),
    LOC: h => unique((h2, i) => pick(VILLES, h2, i), h),
    ADRESSE: h => unique((h2, i) => `${((h2 + i * 7) % 98) + 1} ${pick(RUES, h2 >>> 3, i)}`, h),
    EMAIL: h => unique((h2, i) => {
      const prenom = stripAccents(pick(PRENOMS, h2, i));
      const nom = stripAccents(pick(NOMS, (h2 >>> 7) + i, i));
      return `${prenom}.${nom}@${pick(EMAIL_DOMAINS, h2 >>> 11, i)}`;
    }, h),
    TELEPHONE: h => unique((h2, i) => {
      const d = digits((h2 + i * 104729) >>> 0, 8);
      const prefix = (h2 + i) % 2 === 0 ? '06' : '07';
      return `${prefix} ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
    }, h),
    DATE_NAISSANCE: (h, original) => unique((h2, i) => {
      const j = ((h2 + i) % 28) + 1;
      const m = ((h2 >>> 4) + i) % 12 + 1;
      const a = 1965 + ((h2 >>> 9) + i) % 40;
      const sep = original.includes('-') ? '-' : '/';
      return `${String(j).padStart(2, '0')}${sep}${String(m).padStart(2, '0')}${sep}${a}`;
    }, h)
  };

  return function pseudonymFor(type, value) {
    if (!REALISTIC_TYPES.has(type)) return null;
    const gen = generators[type];
    if (!gen) return null;
    return gen(fnv(type + ':' + value), value);
  };
}
