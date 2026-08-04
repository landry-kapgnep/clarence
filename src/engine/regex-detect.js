// Passe 1 — détection structurée déterministe (portée du prototype validé,
// enrichie des patterns contextuels issus du pseudonymiseur Python).
import { luhnCheck, ibanCheck, nirCheck } from './validators.js';
import { HONORIFIC_ALT } from './honorifics.js';

// Séparateur entre les composants d'un nom capté par civilité : espaces
// horizontaux, ou UN SEUL retour à la ligne — jamais une ligne vide.
//
// `\s+` (l'ancien séparateur) traverse tout, y compris un saut de paragraphe :
// « Tuteur pédagogique : Madame Hélène Brassard\n\nSOMMAIRE » produisait une
// entité PER « Hélène Brassard\n\nSOMMAIRE », donc le titre de section masqué
// avec le nom. Mesuré sur le banc : c'était l'un des trois sur-masquages.
// Un titre de section ne suit jamais un nom sans ligne vide, alors qu'un nom
// coupé par un retour à la ligne simple (« Sébastien\nVaquier ») est courant
// dans un texte au fil de l'eau — d'où le newline unique toléré.
const SEP_NOM = '(?:[^\\S\\r\\n]+|[^\\S\\r\\n]*\\r?\\n[^\\S\\r\\n]*)';

// Premiers mots interdits pour un nom capté par civilité (titres, fonctions).
const STOP_NOMS_CIVILITE = new Set([
  'président', 'présidente', 'directeur', 'directrice', 'professeur',
  'docteur', 'ministre', 'maire', 'université', 'faculté'
]);

// ===== Briques réutilisables pour les motifs internationaux =================
// Approche « motif + mot-clé de contexte » : c'est la technique de référence
// (celle de Microsoft Presidio, dont le catalogue est en Python — on porte les
// motifs, pas le code). Elle règle le cas qu'aucun catalogue ne peut couvrir :
// les identifiants ARBITRAIRES propres à une organisation (CUST-849204-X), où
// seul le libellé voisin dit qu'il s'agit d'un identifiant.

const MOIS = 'January|February|March|April|May|June|July|August|September|October|November|December'
  + '|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec'
  + '|janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre';

// Formats de date acceptés : numérique (JJ/MM/AAAA et variantes), ISO
// (AAAA-MM-JJ), littéral EN/FR (« March 14, 1988 », « 14 mars 1988 ») et
// mois+année seuls (« August 2028 », typique d'une date d'expiration).
const DATE = `(?:\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4}`
  + `|\\d{4}-\\d{2}-\\d{2}`
  + `|(?:${MOIS})\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}`
  + `|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MOIS})\\s+\\d{4}`
  + `|(?:${MOIS})\\s+\\d{4}`
  // Mois/année numérique en DERNIER dans l'alternance : plus permissif, il ne
  // doit être tenté qu'à défaut d'un format complet. Sans danger car les motifs
  // qui utilisent DATE exigent tous un libellé de contexte.
  + `|\\d{1,2}[\\/.-]\\d{4})`;

// États américains : liste stable (administrative, pas technologique — elle ne
// « périme » pas comme une liste de frameworks). Sert à reconnaître un code
// postal US, qui sinon est un simple nombre de 5 chiffres indiscernable.
const ETATS_US = 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia'
  + '|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts'
  + '|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey'
  + '|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania'
  + '|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia'
  + '|Washington|West Virginia|Wisconsin|Wyoming';

export const REGEX_PATTERNS = [
  { type: 'EMAIL', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, validate: null },
  // maskIfStructureMatches : la structure IBAN (pays connu + 2 chiffres + corps
  // groupé) est si distinctive qu'on masque même si le mod-97 échoue — numéro
  // fabriqué OU vrai IBAN mal recopié restent sensibles (priorité au zéro-fuite ;
  // sans ça les détecteurs plus faibles déchiquettent le numéro et en laissent
  // fuir une partie). Liste blanche de pays (SEPA + voisins usuels) : évite
  // qu'un code alphanum quelconque commençant par 2 lettres soit pris pour un
  // IBAN. Longueur minimale garantie par {3,7} groupes de 4 (≥ 16 caractères).
  {
    type: 'IBAN',
    re: /\b(?:FR|MC|BE|CH|DE|ES|IT|PT|LU|NL|GB|IE|AT|DK|SE|NO|FI|PL|CZ|RO|GR|HR|HU|SK|SI|BG|LT|LV|EE|MT|CY|AD|SM)\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g,
    validate: m => ibanCheck(m),
    maskIfStructureMatches: true
  },
  {
    type: 'CARTE_BANCAIRE',
    // Commence et finit sur un chiffre (sinon le séparateur final est avalé
    // et le span bat un SIRET identique à la résolution de chevauchement).
    re: /\b\d(?:[ -]?\d){12,18}\b/g,
    validate: m => {
      const digits = m.replace(/[ -]/g, '');
      return digits.length >= 13 && digits.length <= 19 && luhnCheck(digits);
    }
  },
  {
    // Structure NIR distinctive (sexe/année/mois 01-12/dép + clé) → masquage sur
    // structure même si la clé de contrôle échoue (cf. IBAN : priorité zéro-fuite).
    type: 'NIR',
    re: /\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}\b/gi,
    validate: m => nirCheck(m),
    maskIfStructureMatches: true
  },
  {
    type: 'SIRET_SIREN',
    re: /\b\d{3}[\s]?\d{3}[\s]?\d{3}(?:[\s]?\d{5})?\b/g,
    validate: m => {
      const digits = m.replace(/\s/g, '');
      if (digits.length !== 9 && digits.length !== 14) return false;
      return luhnCheck(digits);
    }
  },
  // (?<!\d)…(?!\d) : ne jamais matcher un « faux téléphone » constitué d'un
  // fragment de 10 chiffres pris AU MILIEU d'un nombre plus long (ex. une carte
  // ou un IBAN sans espaces) — sinon on déchiquette le numéro et on en laisse
  // fuir une partie.
  { type: 'TELEPHONE', re: /(?<!\d)(?:(?:\+33|0033)[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}(?!\d)/g, validate: null },
  { type: 'CODE_POSTAL_VILLE', re: /\b\d{5}\b(?=\s+[A-ZÀ-Ü][a-zà-ÿ]+)/g, validate: null },
  {
    // IPv4 : structure très reconnaissable, octets bornés à 255. Peut matcher
    // un numéro de version logicielle exotique (1.2.3.4) — sur-masquage rare
    // et bénin, préférable à laisser fuir une adresse réseau (zéro-fuite).
    type: 'IP',
    re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    validate: m => m.split('.').every(o => Number(o) <= 255)
  },
  {
    // Adresse MAC : 6 octets hexadécimaux séparés par ':' ou '-'.
    type: 'MAC',
    re: /\b[0-9A-F]{2}(?:[:-][0-9A-F]{2}){5}\b/gi,
    validate: null
  },
  {
    // BIC/SWIFT : 4 lettres banque + pays (même liste blanche que l'IBAN —
    // sans elle, tout mot de 8 lettres MAJUSCULES matcherait, ex. PASSWORD)
    // + 2 alphanum + branche optionnelle.
    type: 'BIC',
    re: /\b[A-Z]{4}(?:FR|MC|BE|CH|DE|ES|IT|PT|LU|NL|GB|IE|AT|DK|SE|NO|FI|PL|CZ|RO|GR|HR|HU|SK|SI|BG|LT|LV|EE|MT|CY|AD|SM)[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    validate: null
  },
  {
    // BIC avec contexte explicite (« BIC: », « SWIFT: ») : le libellé lève
    // l'ambiguïté, donc pas de liste blanche de pays — rattrape les BIC à
    // pays exotique ou mal recopié (cf. cartes/SIREN par contexte, zéro-fuite).
    type: 'BIC',
    re: /(?:BIC|SWIFT)\s*:?\s*([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/g,
    extract: 1,
    validate: null
  },
  // Montant + devise. Deux styles de décimale : virgule FR (1 240,50) ET point
  // international (6540.00). Partie entière soit groupée par séparateurs, soit
  // suite brute de chiffres (6540). Sans le point décimal, "6540.00 EUR" laissait
  // fuir "6540." (seul "00 EUR" était masqué). Fix vs prototype : (?!\w) après €.
  { type: 'MONTANT', re: /\b(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[.,]\d{1,2})?\s?(?:€|EUR|euros?|CHF)(?!\w)/gi, validate: null },
  {
    // Carte avec contexte explicite (« Visa : », « CB : ») → masquée même si Luhn
    // échoue : numéro fabriqué OU vrai numéro mal recopié restent sensibles, et
    // le libellé lève l'ambiguïté d'une longue suite de chiffres (priorité zéro-fuite).
    type: 'CARTE_BANCAIRE',
    re: /(?:carte(?:\s+bancaire)?|cb|visa|mastercard)\s*(?:premier|gold|business)?\s*:?\s*(\d(?:[ -]?\d){11,18})/gi,
    extract: 1,
    validate: null
  },
  {
    // SIREN/SIRET avec contexte explicite → masqué même si Luhn échoue (idem carte).
    type: 'SIRET_SIREN',
    re: /(?:siren|siret)\s*(?:n[°ºo]?)?\s*:?\s*(\d(?:[ ]?\d){8,13})/gi,
    extract: 1,
    validate: null
  },
  {
    type: 'ADRESSE',
    re: /\b\d{1,4}\s?(?:bis|ter)?\s*,?\s*(?:rue|avenue|av\.|boulevard|bd\.?|impasse|all[ée]e|chemin|place|cours|quai|route|square|passage)\s+(?:de\s+la\s+|de\s+l'|du\s+|des\s+|de\s+|d'|la\s+|le\s+)?[A-Za-zÀ-ÿ0-9'-]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ'-]+){0,3}/g,
    validate: null
  },
  {
    // Date de naissance — contexte explicite FR **ET EN**, tous formats de date
    // (« born on March 14, 1988 » ne passait pas : motif FR-only + date
    // numérique seule). Contexte = quasi zéro faux positif.
    // extract: seul le groupe (la date) est masqué, pas le libellé.
    type: 'DATE_NAISSANCE',
    re: new RegExp(
      `(?:n[ée]e?\\s+le|n[ée]e?\\s*:|date\\s+de\\s+naissance\\s*:?`
      + `|born\\s+on|born|date\\s+of\\s+birth|d\\.?o\\.?b\\.?|birth\\s*date)`
      + `\\s*[:=]?\\s*(${DATE})`, 'gi'),
    extract: 1,
    validate: null
  },
  {
    // Autres dates SENSIBLES identifiées par leur libellé (expiration de carte
    // ou de titre, délivrance). Volontairement PAS « toutes les dates » : dans
    // un CV, masquer les dates d'emploi rendrait le document inutilisable.
    type: 'DATE',
    re: new RegExp(
      `(?:expir\\w*|valid\\s+(?:until|thru|through)|valable\\s+jusqu'?au?`
      + `|issued\\s+(?:on)?|d[ée]livr[ée]\\w*\\s+le|[ée]mis\\s+le)`
      + `\\s*(?:date)?\\s*(?:set\\s+for)?\\s*[:=]?\\s*(${DATE})`, 'gi'),
    extract: 1,
    validate: null
  },
  {
    // Identifiant national : SSN américain (3-2-4). Format très distinctif,
    // masqué même sans libellé (priorité zéro-fuite) ; aucun checksum n'existe.
    type: 'ID_NATIONAL',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
    validate: null
  },
  {
    // Identifiants nationaux annoncés par un libellé (formats sans tirets, ou
    // non-US). Le libellé lève l'ambiguïté d'une suite de chiffres banale.
    type: 'ID_NATIONAL',
    re: /(?:social\s+security(?:\s+number)?|ssn|national\s+insurance(?:\s+number)?|nhs\s+number|tax\s+id(?:entification)?(?:\s+number)?)\s*[:=]?\s*([A-Z]{0,2}\s?\d[\d\s-]{6,15}\d)\b/gi,
    extract: 1,
    validate: null
  },
  {
    // Identifiants ÉTUDIANTS français, constatés sur un vrai certificat de
    // scolarité. Deux formats voisins sur le même document :
    //   « Id. National : 080924167CD »  (INE : 9 chiffres + 2 lettres, ou 11
    //                                    chiffres pour l'ancien format BEA)
    //   « N° Etudiant : 12201603 »      (numéro propre à l'établissement)
    // Ces valeurs suivent un élève toute sa scolarité et servent de clé de
    // rapprochement entre fichiers : elles identifient aussi sûrement qu'un nom.
    // Le libellé est indispensable — « 12201603 » nu est une suite de chiffres
    // banale qu'on ne masquerait pas sans lui.
    type: 'ID_NATIONAL',
    re: /(?:id\.?\s*national|(?:num[ée]ro|n[°º]|no\.?)\s*(?:national\s*d?['’]?\s*)?[ée]tudiant|national\s*d['’]\s*[ée]tudiant|\bINE\b|\bBEA\b)\s*[:=]?\s*(\d{8,11}[A-Z]{0,2})\b/gi,
    extract: 1,
    validate: null
  },
  {
    // Identifiant interne ALPHANUMÉRIQUE annoncé par un libellé — le cas
    // qu'aucun catalogue de motifs ne peut deviner (« account identifier
    // CUST-849204-X » : la forme est propre à l'organisation, seul le libellé
    // voisin la qualifie). Complète la REFERENCE numérique FR ci-dessus.
    type: 'REFERENCE',
    // Un VERBE de liaison peut séparer le libellé de la valeur : « his employee
    // identifier IS EMP-4471-KD ». Sans ce petit groupe optionnel le motif
    // échouait sur une phrase rédigée tout en marchant sur un libellé collé —
    // fuite trouvée par le banc d'essai sur un email professionnel anglais.
    // Volontairement limité à un seul mot de liaison : au-delà, on relierait
    // un libellé à une valeur trop lointaine et sans rapport.
    // Libellés FRANÇAIS ajoutés après coup : le motif était intégralement
    // anglophone, donc « Réf. interne : EMP-4471-KD » fuyait alors que
    // « employee identifier is EMP-4471-KD » était bien attrapé. Pendant exact
    // du défaut i18n déjà connu, dans l'autre sens. Trouvé au premier passage
    // du document de test manuel (tests/manuel/).
    //
    // Le qualificatif optionnel (« Réf. INTERNE : ») est une liste fermée et
    // volontairement courte : élargir reviendrait à relier un libellé à une
    // valeur trop lointaine, ce que le commentaire ci-dessus proscrit déjà
    // pour les mots de liaison.
    re: /\b(?:account|customer|client|member|employee|patient|policy|subscriber|user|order|invoice|badge|case|file|r[ée]f[ée]rence|r[ée]f\.?|matricule|identifiant|dossier|adh[ée]rent)\s*(?:identifier|number|no\.?|id|#)?\s*(?:\s+(?:interne|externe|unique))?\s*(?:\s(?:is|was|est|était|sera)\b)?\s*[:=]?\s*([A-Z][A-Z0-9]*(?:[-_\/][A-Z0-9]+)+)\b/gi,
    extract: 1,
    validate: null
  },
  {
    // Code postal US : 5 chiffres (ou ZIP+4) précédés d'un état — sinon
    // indiscernable d'un nombre quelconque. « Springfield, Oregon, 97477 ».
    type: 'CODE_POSTAL_VILLE',
    re: new RegExp(`(?:${ETATS_US})\\s*,?\\s*(\\d{5}(?:-\\d{4})?)\\b`, 'g'),
    extract: 1,
    validate: null
  },
  {
    // ZIP+4 seul : format assez distinctif pour se passer de contexte.
    type: 'CODE_POSTAL_VILLE',
    re: /\b\d{5}-\d{4}\b/g,
    validate: null
  },
  {
    // Code postal annoncé (ZIP/postal code/postcode) — couvre aussi les formats
    // britannique et canadien, impossibles à deviner sans libellé.
    type: 'CODE_POSTAL_VILLE',
    re: /\b(?:zip(?:\s*code)?|postal\s+code|postcode|code\s+postal)\s*[:=]?\s*(\d{5}(?:-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/gi,
    extract: 1,
    validate: null
  },
  {
    // 4 derniers chiffres d'une carte : identifiants partiels très courants
    // (« card ending in 4242 »), invisibles pour le motif carte complet.
    type: 'CARTE_BANCAIRE',
    re: /(?:ending\s+(?:in|with)|last\s+four(?:\s+digits)?|se\s+terminant\s+par|derniers?\s+chiffres?)\s*[:=]?\s*(\d{4})\b/gi,
    extract: 1,
    validate: null
  },
  {
    // Numéros de dossier/client/etc. avec contexte. Garde anti-année.
    type: 'REFERENCE',
    re: /\b(?:dossier|client|matricule|contrat|facture|commande|abonnement|adh[ée]rent|[ée]tudiant|r[ée]f[ée]rence|r[ée]f\.?)\s*(?:client|dossier)?\s*(?:n[°ºo]?\s*|num[ée]ro\s*)?:?\s*(\d{4,12})\b/gi,
    extract: 1,
    validate: m => !/^(19|20)\d\d$/.test(m)
  },
  {
    // Handle de profil social/pro : identifie directement une personne, et
    // contient très souvent le nom en minuscules (« linkedin.com/in/landry-kapgnep »)
    // — forme que le NER ne détecte pas. Déterministe : le domaine lève toute
    // ambiguïté, donc aucun risque de faux positif sur de la prose.
    // extract: seul le handle est masqué, le domaine reste lisible (contexte utile).
    type: 'PSEUDO',
    re: /(?:linkedin\.com\/in\/|github\.com\/|gitlab\.com\/|x\.com\/|twitter\.com\/|instagram\.com\/|facebook\.com\/|tiktok\.com\/@|behance\.net\/|dribbble\.com\/|medium\.com\/@|t\.me\/)([A-Za-z0-9](?:[A-Za-z0-9._-]{1,38})?)/gi,
    extract: 1,
    validate: null
  },
  {
    // Civilité + nom : rattrape en déterministe des noms que le NER peut rater.
    // Civilités multilingues via la liste partagée (honorifics.js) : le motif
    // ne connaissait que le français, donc « Mr Smith » n'était détecté que si
    // le modèle contextuel le voyait — aucun filet déterministe en anglais.
    type: 'PER',
    re: new RegExp(
      `\\b(?:${HONORIFIC_ALT})${SEP_NOM}` +
      `((?:[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'][A-ZÀ-Ü]?[a-zà-ÿ]+)*|[A-ZÀ-Ü]{2,})` +
      `(?:${SEP_NOM}(?:[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'][A-ZÀ-Ü]?[a-zà-ÿ]+)*|[A-ZÀ-Ü]{2,})){0,2})`,
      'g'
    ),
    extract: 1,
    validate: m => !STOP_NOMS_CIVILITE.has(m.split(/\s+/)[0].toLowerCase())
  }
];

export function detectRegex(text) {
  const found = [];
  for (const pattern of REGEX_PATTERNS) {
    let match;
    pattern.re.lastIndex = 0;
    while ((match = pattern.re.exec(text)) !== null) {
      const value = pattern.extract ? match[pattern.extract] : match[0];
      if (!value) continue;
      const offset = pattern.extract ? match[0].indexOf(value) : 0;
      const validated = pattern.validate ? pattern.validate(value) : null;
      // Rejet si le checksum échoue — SAUF pour les types à structure très
      // distinctive (maskIfStructureMatches : IBAN, NIR), masqués quand même
      // (le champ `validated` reste honnête : false si le checksum a échoué).
      if (pattern.validate && !validated && !pattern.maskIfStructureMatches) continue;
      found.push({
        type: pattern.type,
        value,
        start: match.index + offset,
        end: match.index + offset + value.length,
        source: 'regex',
        validated: pattern.validate ? validated : 'n/a'
      });
    }
  }
  return found;
}
