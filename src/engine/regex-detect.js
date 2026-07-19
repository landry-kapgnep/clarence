// Passe 1 — détection structurée déterministe (portée du prototype validé,
// enrichie des patterns contextuels issus du pseudonymiseur Python).
import { luhnCheck, ibanCheck, nirCheck } from './validators.js';

// Premiers mots interdits pour un nom capté par civilité (titres, fonctions).
const STOP_NOMS_CIVILITE = new Set([
  'président', 'présidente', 'directeur', 'directrice', 'professeur',
  'docteur', 'ministre', 'maire', 'université', 'faculté'
]);

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
    // Contexte explicite (« né le », « date de naissance : ») → quasi zéro FP.
    // extract: seul le groupe (la date) est masqué, pas le libellé.
    type: 'DATE_NAISSANCE',
    re: /(?:n[ée]e?\s+le|n[ée]e?\s*:|date\s+de\s+naissance\s*:?)\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/gi,
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
    // Civilité + nom : rattrape en déterministe des noms que le NER peut rater.
    type: 'PER',
    re: /\b(?:Monsieur|Madame|Mademoiselle|M\.|Mme|Mlle|Dr|Me|Pr)\s+((?:[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'][A-ZÀ-Ü]?[a-zà-ÿ]+)*|[A-ZÀ-Ü]{2,})(?:\s+(?:[A-ZÀ-Ü][a-zà-ÿ]+(?:[-'][A-ZÀ-Ü]?[a-zà-ÿ]+)*|[A-ZÀ-Ü]{2,})){0,2})/g,
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
