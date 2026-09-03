// « À quoi ressemble ce document ? » — pour PROPOSER le bon profil.
//
// D'OÙ ÇA VIENT. L'idée d'origine était d'entraîner un modèle PAR FORMAT (un
// pour les CV, un pour l'administratif, un pour le scolaire), parce qu'un même
// mot doit être masqué ici et ignoré là. L'intuition est juste ; le modèle
// n'est pas la bonne pièce pour la porter. Mesuré sur un vrai CV : les faux
// positifs qui restent sont `IA`, `Ollama`, `BDD`, `NSI` — des acronymes d'un
// seul mot qu'AUCUN signal contextuel ne distingue de `UNODC` ou `Twini`, qui
// sont de vraies entités. Un modèle entraîné là-dessus apprendrait à jeter les
// vraies, donc à fuir.
//
// Ce qui les traite déjà, et bien, c'est la liste éditable d'un PROFIL —
// c'est-à-dire exactement « masqué dans un CV, ignoré dans un dossier admin ».
// La pièce qui manquait n'était donc pas un modèle : c'était de savoir QUEL
// profil proposer. Ce module répond à ça, sans ML, en quelques signaux.
//
// ⚠️ RÈGLE NON NÉGOCIABLE : CE MODULE NE DÉCIDE JAMAIS D'UN MASQUAGE. Il
// propose un profil, que l'utilisateur accepte ou non. Une suggestion fausse
// coûte un clic ; un masquage changé en silence casserait l'UX de relecture qui
// est la colonne vertébrale du produit (cadrage §5). Il rend `null` — « je ne
// sais pas » — plutôt que de deviner : une mauvaise suggestion est pire que pas
// de suggestion du tout.
//
// STRUCTURE D'ABORD, MOTS ENSUITE. Les signaux structurels (points de suite
// d'un sommaire, paires libellé/valeur, densité de puces, plages de dates,
// en-têtes d'e-mail) ne dépendent d'aucune langue et portent l'essentiel du
// verdict. Les mots-clés complètent, et ils sont regroupés PAR LANGUE, déclarés
// comme tels — ajouter une langue est alors un geste explicite et localisé, pas
// une réécriture.

// --- Signaux STRUCTURELS, indépendants de la langue -----------------------

// Points de suite d'un sommaire : « Introduction......3 ». Marqueur très sûr
// d'un rapport ou d'un mémoire ; aucun CV n'en porte.
const POINTS_DE_SUITE = /\.{4,}\s*\d+\s*$/;

// En-têtes d'e-mail. La forme est normalisée (RFC 5322), donc les noms de
// champs valent dans toutes les langues même quand le corps ne le fait pas.
const ENTETE_EMAIL = /^(?:From|To|Cc|Subject|Sent|De|À|Objet|Envoyé)\s*:/i;

// Paire libellé/valeur : « Nom          MARCHESSEAU », « Poste occupé : … ».
// C'est la forme des formulaires et des dossiers, pas de la prose.
const PAIRE_LIBELLE = /^\s*[^\s:][^:\n]{1,28}(?::\s+|\s{2,})\S/;

// Puces : la signature typographique d'un CV et de ses rubriques.
const PUCE = /^\s*[•·▪◦‣*·]|(?:\s[•·▪◦‣]\s)/;

// Plage de dates « Janv. 2025 - Mars 2026 » : un CV en est fait, un formulaire
// n'en a pas. Sans nom de mois — c'est la STRUCTURE année-tiret-année qui parle.
const PLAGE_DE_DATES = /(?:1[89]|20)\d{2}\s*[-–—à]\s*(?:(?:1[89]|20)\d{2}|en cours|présent|aujourd)/i;

// --- Marqueurs LEXICAUX, déclarés PAR LANGUE ------------------------------
//
// Volontairement courts. Ils ne servent qu'à départager ce que la structure
// laisse ambigu, et chaque entrée est un mot de MISE EN FORME du document
// (intitulé de rubrique, formule consacrée), jamais un mot de contenu — c'est
// ce qui les rend stables et peu nombreux.
const MARQUEURS = {
  fr: {
    cv: ['expériences professionnelles', 'compétences', 'formations', 'parcours',
         'curriculum vitae', 'alternance', 'stage', 'diplôme', 'langues'],
    administratif: ['république française', 'ministère', 'certificat', 'attestation',
                    'je soussigné', 'soussignée', 'fait à', 'bulletin numéro',
                    'casier judiciaire', 'certifie que', 'état civil',
                    // Formes RH : un compte rendu d'entretien est un acte
                    // administratif, et ces trois-là sont des mots de FORME du
                    // document, pas de son contenu.
                    'compte rendu', 'entretien professionnel', 'ressources humaines'],
    scolaire: ['sommaire', 'introduction', 'conclusion', 'bibliographie',
               'remerciements', 'rapport de stage', 'mémoire', 'annexes',
               'problématique', 'tuteur'],
    bancaire: ['relevé de compte', 'solde', 'virement', 'prélèvement', 'débit',
               'crédit', 'rib', 'titulaire du compte']
  },
  en: {
    cv: ['work experience', 'professional experience', 'skills', 'education',
         'résumé', 'resume', 'internship', 'languages'],
    administratif: ['certificate', 'hereby certify', 'affidavit', 'official record',
                    'issued at', 'registration number'],
    scolaire: ['table of contents', 'introduction', 'conclusion', 'bibliography',
               'acknowledgements', 'appendix', 'abstract', 'dissertation'],
    bancaire: ['account statement', 'balance', 'transfer', 'debit', 'credit',
               'account holder']
  }
};

export const TYPES = ['cv', 'administratif', 'scolaire', 'bancaire', 'email'];

// Écart minimal entre le premier et le second type pour oser proposer.
//
// POURQUOI UN ÉCART ET PAS UN SEUIL ABSOLU. Un document peut cocher beaucoup de
// cases sans être caractéristique — un rapport de stage porte des mots de CV
// (« stage », « tuteur ») ET des mots de rapport. Ce qui autorise à proposer,
// ce n'est pas « j'ai beaucoup de points » mais « un type se détache ». Sous
// cet écart, on rend `null`, et l'utilisateur choisit lui-même.
export const ECART_MINIMAL = 1.5;

const compterLignes = (lignes, motif) => lignes.filter(l => motif.test(l)).length;

// `entites` (optionnel) : la liste déjà détectée. Sert UNIQUEMENT au type
// bancaire, où la densité d'IBAN et de montants est le signal décisif — et il
// est déterministe, validé mod-97, donc bien plus sûr que n'importe quel mot.
export function analyserTypeDocument(texte, { entites = [] } = {}) {
  const brut = String(texte || '');
  const lignes = brut.split(/\r?\n/).filter(l => l.trim());
  if (lignes.length < 3) return { type: null, score: 0, indices: [] };

  const bas = brut.toLowerCase();
  const n = lignes.length;
  const points = { cv: 0, administratif: 0, scolaire: 0, bancaire: 0, email: 0 };
  const indices = [];
  const noter = (type, valeur, raison) => {
    if (valeur <= 0) return;
    points[type] += valeur;
    indices.push({ type, raison, valeur: Number(valeur.toFixed(2)) });
  };

  // ── Structure ──
  const sommaire = compterLignes(lignes, POINTS_DE_SUITE);
  noter('scolaire', Math.min(sommaire, 8) * 0.6, `${sommaire} ligne(s) de sommaire`);

  // Les en-têtes d'e-mail ne comptent qu'en TÊTE du document : « Objet : » au
  // milieu d'un rapport est une phrase, pas un en-tête.
  const enTete = compterLignes(lignes.slice(0, 8), ENTETE_EMAIL);
  noter('email', enTete >= 2 ? 3 + enTete : 0, `${enTete} en-tête(s) d'e-mail`);

  const paires = compterLignes(lignes, PAIRE_LIBELLE) / n;
  noter('administratif', paires > 0.3 ? paires * 4 : 0, `${(paires * 100).toFixed(0)} % de paires libellé/valeur`);

  const puces = compterLignes(lignes, PUCE) / n;
  noter('cv', puces > 0.1 ? puces * 6 : 0, `${(puces * 100).toFixed(0)} % de lignes à puces`);

  const plages = compterLignes(lignes, PLAGE_DE_DATES);
  noter('cv', Math.min(plages, 5) * 0.5, `${plages} plage(s) de dates`);

  // Prose longue : un mémoire écrit des paragraphes, un CV des fragments.
  const longueurMoyenne = brut.length / n;
  noter('scolaire', longueurMoyenne > 120 ? 1.5 : 0, `lignes longues (${longueurMoyenne.toFixed(0)} c.)`);
  noter('cv', longueurMoyenne < 70 ? 1 : 0, `lignes courtes (${longueurMoyenne.toFixed(0)} c.)`);

  // ── Déterministe : la densité d'IBAN et de montants ──
  const bancaires = entites.filter(e => e.type === 'IBAN' || e.type === 'BIC').length;
  const montants = entites.filter(e => e.type === 'MONTANT').length;
  noter('bancaire', bancaires * 2 + (montants > 5 ? 2 : 0),
    `${bancaires} IBAN/BIC, ${montants} montant(s)`);

  // ── Mots-clés, toutes langues déclarées ──
  //
  // ⚠️ DÉDOUBLONNÉS ENTRE LANGUES. « conclusion » et « introduction » s'écrivent
  // pareil en français et en anglais : sans ce Set, ils comptaient DEUX fois et
  // gonflaient artificiellement le type « scolaire » sur tout document qui les
  // contient. Le défaut se voyait sur dossier-rh.txt, un compte rendu RH que
  // deux occurrences du mot « conclusion » suffisaient à tirer vers le rapport.
  for (const type of TYPES) {
    const trouves = new Set();
    for (const parType of Object.values(MARQUEURS)) {
      for (const m of parType[type] || []) if (bas.includes(m)) trouves.add(m);
    }
    noter(type, trouves.size * 0.8, `mots : ${[...trouves].join(', ')}`);
  }

  const classement = Object.entries(points).sort((a, b) => b[1] - a[1]);
  const [premier, valeurPremier] = classement[0];
  const ecart = valeurPremier - classement[1][1];
  const sur = indices.filter(i => i.type === premier);

  return {
    type: ecart >= ECART_MINIMAL && valeurPremier > 0 ? premier : null,
    score: Number(valeurPremier.toFixed(2)),
    ecart: Number(ecart.toFixed(2)),
    indices: sur,
    classement: classement.map(([t, v]) => [t, Number(v.toFixed(2))])
  };
}
