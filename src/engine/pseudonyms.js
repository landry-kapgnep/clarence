// Pseudonymes réalistes (option) - port JS du PseudonymGenerator Python :
// listes curées + choix déterministe par hachage de la valeur d'origine.
// 100% local, zéro dépendance. Les types structurés critiques (IBAN, carte,
// NIR, SIRET…) ne sont JAMAIS pseudonymisés en réaliste : générer de faux
// numéros plausibles risque de collisionner avec de vrais - ils restent en
// placeholders [TYPE_N], honnêtes et sans ambiguïté.
//
// Deux locales (FR par défaut, EN) : un document rédigé en anglais recevait
// jusqu'ici des pseudonymes français (« Julien Marchand » dans un texte 100%
// anglophone), ce qui casse l'illusion de cohérence que l'option promet.
// `locale` est un paramètre du moteur, pas encore choisi automatiquement -
// il faut le brancher explicitement (voir main.js) tant qu'il n'y a pas de
// détection de langue du document.

import { estComposantNonIdentifiant } from './honorifics.js';

const LOCALES = {
  fr: {
    prenoms: [
      'Alexandre', 'Antoine', 'Baptiste', 'Clément', 'Étienne', 'Gabriel',
      'Hugo', 'Jules', 'Louis', 'Lucas', 'Maxime', 'Nathan', 'Paul', 'Raphaël',
      'Romain', 'Thomas', 'Victor', 'Julien', 'Quentin', 'Vincent',
      'Amélie', 'Camille', 'Charlotte', 'Chloé', 'Élise', 'Emma', 'Inès',
      'Juliette', 'Léa', 'Louise', 'Lucie', 'Manon', 'Mathilde', 'Noémie',
      'Pauline', 'Marion', 'Hélène', 'Nathalie', 'Aurélie', 'Émilie'
    ],
    noms: [
      'Bernard', 'Blanc', 'Bonnet', 'Chevalier', 'Deschamps', 'Dubois',
      'Dumont', 'Durand', 'Faure', 'Fournier', 'Garnier', 'Gauthier',
      'Girard', 'Lambert', 'Lefebvre', 'Legrand', 'Lemaire', 'Mercier',
      'Moreau', 'Morel', 'Petit', 'Renard', 'Richard', 'Robin', 'Rousseau',
      'Roux', 'Simon', 'Barbier', 'Boyer', 'Brun', 'Colin', 'Denis',
      'Leroy', 'Perrin'
    ],
    villes: [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes',
      'Strasbourg', 'Nice', 'Montpellier', 'Rennes', 'Reims', 'Grenoble',
      'Dijon', 'Angers', 'Tours', 'Orléans', 'Metz'
    ],
    orgs: [
      'Nordis Conseil', 'Alphatec', 'Groupe Vertière', 'Solunea', 'Castel & Fils',
      'Novaris SARL', 'Ateliers Brossard', 'Delmont Industries', 'Cabinet Ferrand',
      'Tessalis', 'Ormeau Digital', 'Clavier & Associés', 'Sequoia Services',
      'Baltane', 'Comptoir Lorrain', 'Studio Amarante'
    ],
    rues: [
      'rue des Acacias', 'avenue des Peupliers', 'boulevard Saint-Michel',
      'rue de la Fontaine', 'impasse des Lilas', 'chemin des Vignes',
      'place du Marché', 'rue des Écoles', 'avenue de la République',
      'rue du Moulin', 'allée des Charmes', 'quai des Brumes'
    ],
    emailDomains: ['exemple-mail.fr', 'courriel-temp.fr', 'boite-anonyme.fr', 'pseudo-mail.fr'],
    mois: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
           'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    phone: (h2, i) => {
      const digitsAt = (hh, n) => String(hh % 10 ** n).padStart(n, '0');
      const d = digitsAt((h2 + i * 104729) >>> 0, 8);
      const prefix = (h2 + i) % 2 === 0 ? '06' : '07';
      return `${prefix} ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
    }
  },
  en: {
    prenoms: [
      'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Daniel',
      'Matthew', 'Andrew', 'Joseph', 'Henry', 'Samuel', 'Benjamin', 'Oliver',
      'Jack', 'Thomas', 'Charles', 'George', 'Edward', 'Nathan',
      'Mary', 'Jennifer', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
      'Emma', 'Olivia', 'Emily', 'Charlotte', 'Grace', 'Hannah', 'Alice',
      'Rachel', 'Laura', 'Amy', 'Claire', 'Victoria', 'Sophie'
    ],
    noms: [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
      'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott',
      'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Roberts',
      'Turner', 'Phillips', 'Campbell', 'Parker'
    ],
    villes: [
      'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Liverpool',
      'New York', 'Boston', 'Chicago', 'Austin', 'Seattle', 'Denver',
      'Toronto', 'Vancouver', 'Dublin', 'Edinburgh', 'Cardiff', 'Glasgow'
    ],
    orgs: [
      'Northbridge Consulting', 'Alphatech Ltd', 'Vertière Group', 'Solunea Inc',
      'Castel & Co', 'Novaris Partners', 'Brossard Studios', 'Delmont Industries',
      'Ferrand Associates', 'Tessalis', 'Ormeau Digital', 'Sequoia Services',
      'Baltane Corp', 'Amarante Studio', 'Fenwick & Partners', 'Harlow Digital'
    ],
    rues: [
      'Acacia Street', 'Poplar Avenue', 'Saint Michael Boulevard',
      'Fountain Road', 'Lilac Court', 'Vineyard Lane',
      'Market Square', 'School Street', 'Republic Avenue',
      'Mill Road', 'Elm Way', 'Harbour Drive'
    ],
    emailDomains: ['example-mail.com', 'temp-inbox.com', 'anon-mailbox.com', 'pseudo-mail.com'],
    mois: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'],
    phone: (h2, i) => {
      const digitsAt = (hh, n) => String(hh % 10 ** n).padStart(n, '0');
      const area = 200 + ((h2 + i) % 700);
      const d = digitsAt((h2 + i * 104729) >>> 0, 7);
      return `(${area}) ${d.slice(0, 3)}-${d.slice(3, 7)}`;
    }
  }
};

// Types éligibles au réalisme ; tout le reste garde son placeholder [TYPE_N].
//
// LA LIGNE DE PARTAGE EST « IDENTIFIANT OU ATTRIBUT ? », pas « type connu ou
// pas ». Tous ceux d'ici sont des IDENTIFIANTS : échanger un nom contre un
// autre nom, une ville contre une autre ville, préserve le RÔLE de la valeur
// dans le texte sans toucher à ce sur quoi le LLM raisonne - une personne
// reste une personne.
//
// POSTE, NATIONALITE et SANTE sont volontairement ABSENTS, et ce n'est pas un
// oubli (question posée le 15/08 : « il manque des pseudonymes »). Ce sont des
// ATTRIBUTS : leur valeur EST le sujet du raisonnement.
//
//   « diabète de type 2 » → « asthme »            réponse médicale fausse
//   « aide-soignante de nuit » → « comptable »    contrat de travail faussé
//   « portugaise » → « italienne »                démarche administrative faussée
//
// Un placeholder annonce qu'on a retiré quelque chose ; un faux attribut
// plausible n'annonce rien et induit en erreur - exactement ce que l'UX
// anti-fausse-confiance du cadrage §5 refuse. Le silence vaut mieux que le
// vraisemblable quand l'utilisateur ne peut pas vérifier.
//
// ETABLISSEMENT a été ajouté ici le 15/08 puis RETIRÉ le 18/08 : la mesure sur
// un vrai CV a montré qu'il manquait une SECONDE condition au raisonnement
// ci-dessus.
//
// Un nom d'établissement EST un identifiant, ce qui reste vrai. Mais sa
// DÉTECTION figure dans TYPES_PEU_FIABLES (gliner.js), et c'est ça qui décide :
// sur ce CV, « LLM local » a été pris pour un établissement et remplacé par
// « École Morel ». Le lecteur croit à une école qui n'a jamais existé, et rien
// ne le lui signale - alors qu'un « [ETABLISSEMENT_1] » posé sur « LLM local »
// saute aux yeux et se retire d'un clic.
//
// D'OÙ LA RÈGLE COMPLÈTE, en DEUX conditions. Un type reçoit un pseudonyme
// réaliste s'il est un IDENTIFIANT **et** si sa détection est FIABLE :
//   - la première écarte poste, nationalité et santé (leur valeur est le sujet
//     du raisonnement) ;
//   - la seconde écarte tout type de TYPES_PEU_FIABLES, parce qu'un faux
//     plausible y devient indétectable.
//
// C'est le principe déjà consigné du projet - « un pseudonyme rend un faux
// positif invisible » - appliqué là où il avait été manqué.
const REALISTIC_TYPES = new Set([
  'PER', 'ORG', 'LOC', 'ADRESSE', 'EMAIL', 'TELEPHONE', 'DATE_NAISSANCE',
  // Handle : identifiant, détecté par regex donc de façon déterministe.
  'PSEUDO'
]);

const stripAccents = s =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// createPseudonymizer({ seed, avoid, locale }) → fn(type, value) → pseudo | null.
// - seed : stabilité au sein d'une session d'analyse ;
// - avoid(v) : refuse un pseudo présent dans le texte d'origine (collision
//   avec une vraie valeur) ;
// - locale : 'fr' (défaut) ou 'en' - locale inconnue retombe sur 'fr' ;
// - unicité garantie entre pseudos d'une même session.
export function createPseudonymizer({ seed = 'clarence', avoid = () => false, locale = 'fr' } = {}) {
  const L = LOCALES[locale] || LOCALES.fr;
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

  function unique(gen, h) {
    for (let i = 0; i < 300; i++) {
      const v = gen(h, i);
      if (v && !used.has(v) && !avoid(v)) { used.add(v); return v; }
    }
    return null; // aucune variante libre → l'appelant retombe en placeholder
  }

  // --- Cohérence AU NIVEAU DU COMPOSANT DE NOM ------------------------------
  // Le cache de maskText porte sur la valeur entière : « Priya Deva » revu à
  // l'identique redonnait bien le même pseudo, mais « Priya » seule était
  // traitée comme une personne distincte et recevait un nom sans aucun
  // rapport. Sur un document réel, la même personne se retrouvait sous trois
  // identités - ce qui détruit la cohérence que l'option promet, et rend le
  // texte incompréhensible pour le LLM à qui on le donne.
  //
  // On mémorise donc chaque COMPOSANT : « Priya » → « Chloé », « Deva » →
  // « Lemaire », une fois pour toutes. « Priya Deva », « Priya » et « Deva »
  // deviennent alors respectivement « Chloé Lemaire », « Chloé » et
  // « Lemaire ». C'est l'identifiant stable demandé.
  const tokenMap = new Map(); // composant réel (minuscule) → composant pseudo

  // Composants gardés tels quels : ils n'identifient personne, et les
  // substituer produit soit du charabia, soit - bien pire - une SECONDE
  // identité pour la même personne.
  //
  // Particules nobiliaires : « de La Villardière » doit rester lisible.
  //
  // Civilités (liste partagée, honorifics.js) : le modèle contextuel inclut
  // souvent le titre dans l'entité (« miss Deva » détecté d'un bloc). Traité
  // comme un prénom, « miss » devenait « Amélie » - si bien que
  // « Priya Deva » → « Clément Faure » et « miss Deva » → « Amélie Faure »
  // désignaient deux personnes de genres différents dans le même texte.
  //
  // Dans les DEUX cas la décision dépend de la POSITION, jamais de la seule
  // appartenance à une liste : un composant n'est une particule ou une
  // civilité que s'il précède un autre composant. Sinon « Miss » ou « Le »
  // employés comme vrais patronymes fuiraient tels quels.
  // Liste et règle de position partagées avec identity.js - voir honorifics.js.
  const estConserve = estComposantNonIdentifiant;

  // Reproduit la casse de l'original : un patronyme en TOUT-MAJUSCULE (usage
  // courant sur un CV français) reste en majuscules dans le pseudo.
  const applyCase = (pseudo, original) =>
    original === original.toUpperCase() && /\p{L}{2}/u.test(original)
      ? pseudo.toUpperCase()
      : pseudo;

  function pseudoToken(token, rang, total) {
    const isLast = rang === total - 1;
    if (estConserve(token, rang, total)) return token;
    const key = token.toLowerCase();
    if (tokenMap.has(key)) return applyCase(tokenMap.get(key), token);

    // Choix du vivier : dans un nom composé, le premier mot est un prénom et
    // le dernier un patronyme. Pour un composant VU SEUL on ne peut pas
    // savoir : le tout-majuscule signale un patronyme (convention CV FR),
    // sinon on suppose un prénom. Le choix est arbitraire mais définitif -
    // c'est la stabilité qui compte, pas la justesse du vivier.
    const estPatronyme = total > 1
      ? isLast
      : token === token.toUpperCase() && /\p{L}{2}/u.test(token);
    const pool = estPatronyme ? L.noms : L.prenoms;

    const v = unique((h2, i) => pick(pool, h2, i), fnv('PER_TOKEN:' + key));
    if (!v) return null; // vivier épuisé → l'appelant retombe en placeholder
    tokenMap.set(key, v);
    return applyCase(v, token);
  }

  // Compose un IDENTIFIANT TECHNIQUE (partie locale d'un email, handle) à
  // partir des MÊMES composants que le nom de la personne.
  //
  // LE DÉFAUT QUE ÇA CORRIGE, signalé sur un vrai CV : la personne devenait
  // « ROMAIN MOREAU » et son email « thomas.simon@… ». Deux identités pour
  // quelqu'un dont l'adresse porte justement son nom - la cohérence que
  // l'option promet s'arrêtait aux frontières du type.
  //
  // Le mécanisme est celui qui existe déjà : `pseudoToken` consulte `tokenMap`,
  // donc « kapgnep » rencontré dans « LANDRY KAPGNEP » puis dans
  // « landry.kapgnep.pro » rend deux fois le même composant. L'ordre de
  // première rencontre n'importe pas.
  //
  // TOUS les composants sont substitués, y compris ceux qui ne sont pas des
  // noms (« pro », « dev ») : les épargner supposerait une liste de mots
  // « non identifiants », classe ouverte qu'on refuse partout ailleurs - et
  // un fragment du vrai handle survivrait.
  const composeIdentifiant = (brut) => {
    const parts = String(brut).split(/([._\-]+)/);
    const mots = parts.filter((p, i) => i % 2 === 0 && p);
    if (!mots.length) return null;
    let out = '';
    let rang = 0;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) { out += parts[i]; continue; } // séparateur d'origine
      if (!parts[i]) continue;
      const p = pseudoToken(parts[i], rang, mots.length);
      if (!p) return null;
      out += stripAccents(p); // un email ou un handle ne porte pas d'accent
      rang++;
    }
    return out || null;
  };

  const generators = {
    // Composition composant par composant (voir tokenMap ci-dessus). Les
    // séparateurs d'origine (espaces, traits d'union) sont préservés pour que
    // « Marc-Antoine » reste un composé à trait d'union.
    PER: (h, original) => {
      const parts = String(original).split(/([\s\-]+)/);
      const mots = parts.filter((p, i) => i % 2 === 0 && p);
      if (!mots.length) return null;
      let out = '';
      let rang = 0;
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) { out += parts[i]; continue; } // séparateur
        if (!parts[i]) continue;
        const p = pseudoToken(parts[i], rang, mots.length);
        if (!p) return null; // jamais renvoyer le vrai composant : ce serait une fuite
        out += p;
        rang++;
      }
      // Le nom composé complet doit rester unique et absent du texte réel.
      return !avoid(out) ? out : null;
    },
    ORG: h => unique((h2, i) => pick(L.orgs, h2, i), h),
    // Un générateur ETABLISSEMENT vivait ici (15/08 → 18/08). Il conservait le
    // mot d'institution d'origine - « Lycée Camille-Claudel » → « Lycée
    // Rousseau » - pour qu'un lycée ne devienne pas une université, et
    // reprenait la position du mot sur l'original plutôt que sur la locale
    // (« Westfield College » → « Boyer College »). Retiré avec le type
    // lui-même : voir REALISTIC_TYPES. Récupérable tel quel dans l'historique
    // si la détection des établissements devient un jour fiable.
    LOC: h => unique((h2, i) => pick(L.villes, h2, i), h),
    ADRESSE: h => unique((h2, i) => `${((h2 + i * 7) % 98) + 1} ${pick(L.rues, h2 >>> 3, i)}`, h),
    // La partie locale reprend les composants du nom quand elle en porte -
    // c'est le cas courant - et l'unicité se joue alors sur le domaine.
    EMAIL: (h, original) => unique((h2, i) => {
      const local = composeIdentifiant(String(original).split('@')[0]);
      const repli = `${stripAccents(pick(L.prenoms, h2, i))}.${stripAccents(pick(L.noms, (h2 >>> 7) + i, i))}`;
      return `${local || repli}@${pick(L.emailDomains, h2 >>> 11, i)}`;
    }, h),
    // Handle (GitHub, LinkedIn…). IDENTIFIANT, et sa détection est
    // DÉTERMINISTE (regex-detect.js) : les deux conditions de REALISTIC_TYPES
    // sont remplies. Il sortait en « [PSEUDO_1] » faute d'avoir été branché.
    PSEUDO: (h, original) => unique((h2, i) => composeIdentifiant(original)
      || `${stripAccents(pick(L.prenoms, h2, i))}${stripAccents(pick(L.noms, (h2 >>> 5) + i, i))}`, h),
    TELEPHONE: h => unique((h2, i) => L.phone(h2, i), h),
    // Le FORMAT d'origine est reproduit, pas seulement la nature de la donnée :
    // « january 1 2002 » devenait « 13/10/1976 », ce qui saute aux yeux au
    // milieu d'un texte anglais et trahit le passage de l'outil.
    DATE_NAISSANCE: (h, original) => unique((h2, i) => {
      const j = ((h2 + i) % 28) + 1;
      const m = ((h2 >>> 4) + i) % 12 + 1;
      const a = 1965 + ((h2 >>> 9) + i) % 40;
      const litteral = /\p{L}{3}/u.test(original); // contient un nom de mois
      if (litteral) {
        const nom = L.mois[m - 1];
        // Casse du mois d'origine (« JANUARY », « January », « january »).
        const source = original.match(/\p{L}{3,}/u)?.[0] || '';
        const moisCase = source === source.toUpperCase() ? nom.toUpperCase()
          : source[0] === source[0].toLowerCase() ? nom.toLowerCase()
          : nom;
        // Ordre jour/mois selon la locale (EN : mois d'abord).
        return locale === 'en' ? `${moisCase} ${j} ${a}` : `${j} ${moisCase} ${a}`;
      }
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
