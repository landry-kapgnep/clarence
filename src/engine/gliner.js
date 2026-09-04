// Détection contextuelle par ner zero-shot (GLiNER).
//
// Différence de fond avec ner.js : le modèle BERT a 4 catégories figées
// (PER/ORG/LOC/MISC) apprises à l'entraînement. GLiNER reçoit les catégories
// cherchées au moment de l'appel, en langage courant. Conséquence directe :
// il sait qualifier une valeur isolée, sans phrase autour - une cellule de
// tableau, un nom en tête de CV - ce qu'aucune catégorie figée ni aucun motif
// à mot-clé de contexte ne peut faire (mesuré : « Kowalski » seul → 0,93 ;
// « 1988-03-14 » seul → date de naissance 0,59).
//
// Contrat de sortie identique à detectNER : tout l'aval (merge, selection,
// masking) est donc inchangé et les deux moteurs sont interchangeables.
import { chunkText, snapToWordBoundaries, bridgeNameParts } from './ner.js';
import { estVocabulaireCourant } from './vocabulaire.js';

export const GLINER_MODEL = 'onnx-community/gliner_small-v2';

// VARIANTE DE POIDS - ici et nulle part ailleurs, parce que le banc doit noter
// le modèle réellement livré. Tant que la variante vivait dans main.js, le banc
// mesurait `quantized` pendant que la popup chargeait autre chose : la porte de
// qualité notait un modèle qu'on n'expédiait pas.
//
// Mesuré sur un mémoire réel de 75 pages, en vrai Chrome, une variable à la
// fois (voir docs/verification-chrome.md §A0) :
//   quantized (int8) + wasm   → 5 min 45
//   quantized (int8) + webgpu → 5 min 36  (aucun gain : le fournisseur WebGPU
//                                          d'ORT supporte mal l'int8, la
//                                          plupart des nœuds retombent en CPU)
//   fp16 + webgpu             → 2 min 01  (×2,8 - le GPU sert enfin)
//
// Le fp16 pèse 292 Mo au lieu de 175 : le surcoût est payé UNE fois (Cache
// API), le gain à chaque document. Arbitrage tranché par la mesure.
export const VARIANTES_MODELE = {
  quantized: 'model_quantized.onnx',  // 175 Mo, int8
  fp16: 'model_fp16.onnx',            // 292 Mo - défaut
  fp32: 'model.onnx'                  // 583 Mo
};
export const GLINER_VARIANTE = 'fp16';

export const glinerModelUrl = (variante = GLINER_VARIANTE) =>
  `https://huggingface.co/${GLINER_MODEL}/resolve/main/onnx/${VARIANTES_MODELE[variante]}`;

// Seuil par défaut, calé sur les fixtures propres : au-dessus du pire faux
// positif observé et sous la plus faible vraie valeur à conserver (la cellule
// de date nue, 0,59). Chaque groupe peut le surcharger - voir GROUPES.
export const GLINER_THRESHOLD = 0.5;

// GROUPES DE LABELS DISJOINTS - le point le moins intuitif de ce module.
//
// Les labels se concurrencent à l'intérieur d'un même appel : mesuré sur nos
// fixtures, passer de 3 à 10 labels fait tomber « Semantikmatch » de 0,85 à
// 0,45 et « Rose Fontaine » de 0,61 à 0,25, tout en faisant monter le bruit
// (le garde-fou « zéro faux positif » sortait alors « point » à 0,43 et
// « roadmap technique » à 0,40). Un jeu large en une passe dégrade donc
// activement la détection - contre-intuitif, mais reproductible.
//
// D'où trois passes à groupes disjoints, qui conservent chacune leurs scores
// hauts ET laissent le garde-fou à zéro. Le surcoût est celui de l'encodage du
// texte, pas des labels : ~8 ms par passe sur une unité courte.
//
// Ne pas fusionner ces groupes « pour aller plus vite » sans re-mesurer.
export const GROUPES = [
  {
    // Le cœur : ce que le NER BERT couvrait déjà, en mieux sur les valeurs
    // isolées.
    //
    // Seuil ABAISSÉ à 0,45 une première fois (nom de CV isolé, 0,47), puis à
    // 0,38 le 05/08/2026 - trouvé sur un vrai rapport (`rapport-fr.txt`) : le
    // patronyme « ROUSSEAU » matche le motif BIC et annule « Amandine
    // ROUSSEAU » dans la fusion (voir merge.js), mais le nom lui-même ne
    // dépassait le seuil sur aucune de ses 3 occurrences (0,364 / 0,398).
    // « Nadia Belkacem » (`dossier-rh.txt`) était dans le même cas.
    //
    // Seuil choisi par balayage sur le banc complet, pas par extrapolation :
    // 0,45 → 0,40 → 0,38 → 0,36 → 0,35. 0,38 est le point pivot exact où les
    // deux noms sont trouvés sans qu'aucun faux positif n'apparaisse. En
    // dessous (0,36), « CERTIFICAT DE SCOLARITE » (titre en capitales) devient
    // un faux positif PER et le préservé de `certificat-fr.txt` chute de
    // 100 % à 67 %. Ne pas descendre sans re-vérifier CE cas précis.
    //
    // Effet mesuré : rappel contextuel 78 → 83 %, préservé inchangé (98 %),
    // structuré inchangé. Plus aucune fuite partielle sur les 7 documents.
    //
    // RECALIBRÉ à 0,46 le 06/08/2026 en passant les poids de int8 à fp16.
    // LEÇON GÉNÉRALE : **un seuil appartient à une variante de poids.** Le fp16
    // est numériquement plus précis, tous les scores remontent, et le 0,38
    // calibré sur l'int8 devenait trop bas - préservé 98 % → 93 %
    // (« SOMMAIRE » et « Docker » sur-masqués en plus). Changer de variante
    // Sans rebalayer, c'est troquer de la qualité contre de la vitesse sans
    // s'en apercevoir.
    //
    // Balayage sur le banc complet, en fp16 :
    //   0,38 → 83 % / 93 %      0,42 → 83 % / 93 %
    //   0,45 → 83 % / 96 %      0,46 → 83 % / **98 %**  ← retenu
    //   0,47 / 0,48 → identiques à 0,46 (plateau)
    //   0,50 → casse le structuré (19/20) : rédhibitoire, non négociable
    // 0,46 est le plus BAS du plateau - donc le plus détectant à qualité égale,
    // conformément à « zéro-fuite > faux positifs ».
    seuil: 0.46,
    labels: ['person', 'company', 'location'],
    types: { person: 'PER', company: 'ORG', location: 'LOC' },
    // Voir `pertinent` plus bas : un texte sans la moindre majuscule ne peut
    // produire aucun nom propre, donc aucune entité de ce groupe.
    pertinent: t => /\p{Lu}/u.test(t)
  },
  {
    // Seul : associé à d'autres labels il perd sa précision, et « address »
    // faisait monter le bruit du garde-fou à 0,47 (trop près du seuil).
    // Les adresses restent couvertes par le motif ADRESSE, déterministe.
    labels: ['date of birth'],
    types: { 'date of birth': 'DATE_NAISSANCE' },
    // Une date porte toujours au moins l'année : sans chiffre, rien à trouver.
    // 65 % des unités d'un vrai mémoire sont dans ce cas - 54 % du texte.
    pertinent: t => /\d/.test(t)
  },
  {
    // Catégories sensibles au sens RGPD (santé, origine) + contexte pro.
    // Vérifié : zéro faux positif sur les 3 fixtures ET sur une ligne de
    // stack technique (« React, Docker, Prisma… »).
    labels: ['job title', 'nationality', 'school', 'medical condition'],
    types: {
      'job title': 'POSTE',
      nationality: 'NATIONALITE',
      school: 'ETABLISSEMENT',
      'medical condition': 'SANTE'
    }
  }
];

// Types que le modèle ne détecte PAS de façon fiable - proposés dans l'UI mais
// Décochés par défaut. Mesuré, pas supposé.
//
// Le banc ne contenait longtemps aucun document portant réellement ces
// données, donc le groupe ne pouvait être jugé que sur son bruit. Un compte
// rendu RH (`dossier-rh.txt`) a levé le doute - et le verdict est sans appel :
//
//   « diabète de type 2 »   → étiqueté job title          à 0,04
//   « aide-soignante »      → étiqueté medical condition  à 0,08
//   « portugaise »          → nationalité                 à 0,02
//   « suivi psychologique » → donnée de santé             à 0,28
//   « Camille-Claudel »     → établissement               à 0,31
//
// Le modèle inverse poste et donnée de santé en français, et place les vraies
// valeurs entre 0,02 et 0,31 - très en dessous du plancher de bruit mesuré à
// 0,4-0,7 sur du texte fragmenté. Aucun seuil ne peut les séparer.
//
// Effet mesuré au banc en les désactivant : rappel contextuel inchangé (75 %,
// zéro vrai positif perdu sur 7 documents), termes préservés 93 % → 96 %.
// Autrement dit ce groupe ne rapportait que du sur-masquage.
//
// Les laisser actifs serait de la fausse confiance - précisément ce que le
// cadrage §5 interdit : l'utilisateur croirait ses données de santé protégées
// alors qu'elles ne le sont pas. Décochés, l'UI le montre, et il peut les
// activer en connaissance de cause.
export const TYPES_PEU_FIABLES = ['POSTE', 'NATIONALITE', 'ETABLISSEMENT', 'SANTE'];

// Types qu'un groupe peut produire - sert à sauter entièrement une passe dont
// l'utilisateur a désactivé tous les types (on ne paie que ce qu'on demande).
const typesDuGroupe = g => Object.values(g.types);

// PERSONNE / ENTREPRISE / LIEU sont par définition des noms propres : en
// français comme en anglais, ils portent une majuscule. Les autres types
// produits par le modèle sont des noms communs par nature (« développeur »,
// « diabète », « française ») et ne peuvent pas être filtrés ainsi.
const TYPES_NOMS_PROPRES = new Set(['PER', 'ORG', 'LOC']);

// Écarte les spans sans la moindre majuscule quand le type exige un nom propre.
//
// Pourquoi (P6). Le label zero-shot « person » désigne toute expression qui
// RÉFÈRE à une personne, pas seulement un nom : le modèle sort donc « vendor »,
// « candidate », « dossier », « adresse », « leadership », « protagoniste ».
// Il a raison linguistiquement ; c'est notre besoin qui porte sur les entités
// NOMMÉES. Le filtre traduit cette exigence de la façon la plus simple et la
// plus déterministe possible.
//
// Limite assumée, à ne pas découvrir plus tard : un nom écrit tout en
// minuscules (« jean dupont » tapé à la volée) n'est plus détecté par cette
// couche. C'est un recul sur la priorité zéro-fuite, accepté ici parce que
// (a) la couche déterministe (email, téléphone, IBAN…) n'est pas concernée,
// (b) le profil d'identité masque le nom de l'utilisateur quoi qu'il arrive,
// (c) « toujours masquer » reste disponible, et (d) le sur-masquage mesuré
// rendait les documents inexploitables, ce qui est l'autre façon de perdre
// l'utilisateur. Réévaluer si un cas réel de nom en minuscules apparaît.
// Une DATE DE NAISSANCE porte toujours au moins un chiffre - au minimum
// l'année. Sans cette garde, le modèle sortait « trimestre » à 0,74 et
// « Sept. 2024 - Aout 2025 » comme dates de naissance. Même raisonnement que
// pour les noms propres : une exigence de forme propre au type, déterministe,
// là où le score ne sépare rien.
// Une DATE DE NAISSANCE, c'est un jour situé dans une année. « Contient un
// chiffre » était beaucoup trop faible : mesuré sur tous-defauts.pdf, ça
// laissait passer « ANNEXE 2 », « 2021 » et « 12 mars ».
//
// Deux formes acceptées, et aucune liste de mois : le projet doit rester
// multilingue, or un nom de mois est propre à une langue. On se contente de la
// Structure - une date numérique, ou une année accompagnée d'un autre nombre
// (le quantième), quelle que soit la langue qui les sépare :
//   « March 14, 1988 », « 16 octobre 2004 », « 14. März 1988 » → acceptés
//   « 2021 » (année seule), « ANNEXE 2 », « 12 mars » (sans année) → refusés
const DATE_NUMERIQUE = /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/;
const ANNEE = /(?:1[89]|20)\d{2}/;

// Deux années = une plage, jamais une naissance. Mesuré sur un vrai CV :
// « Oct. 2025 - Janv. 2026 » sortait en DATE DE NAISSANCE. La règle « une année
// + un autre nombre » était satisfaite… par la seconde année, prise pour un
// quantième. Or personne ne naît sur une période, et la conséquence n'est pas
// qu'un masque de trop : le type étant faux, l'option Pseudonymes fabriquait
// une fausse date de naissance à la place d'une période d'expérience, ce qui
// altère le sens du document pour le LLM.
//
// Le test reste sans aucune liste de mois - c'est la structure qui parle, donc
// il vaut dans toutes les langues.
const ANNEES = /(?:1[89]|20)\d{2}/g;

function estUneDate(valeur) {
  const annees = String(valeur || '').match(ANNEES) || [];
  if (annees.length > 1) return false;
  if (DATE_NUMERIQUE.test(valeur)) return true;
  if (annees.length !== 1) return false;
  // Un autre nombre que l'année elle-même : le jour du mois.
  return /\d/.test(String(valeur).replace(annees[0], ''));
}

// PRONOMS - jamais un nom propre, quelle que soit la confiance du modèle.
//
// Mesuré sur un vrai mémoire : « I've » sort en PERSONNE, quatre fois. Le
// modèle voit un pronom en tête de phrase, donc en majuscule, et le prend pour
// un nom. Aucun seuil ne sépare ce cas - c'est une question de nature, pas de
// score.
//
// UNE LISTE STATIQUE EST ADMISSIBLE ICI, et seulement parce que la classe est
// Fermée : même règle que honorifics.js et que les opérateurs logiques de
// compression.js. Une langue compte une poignée de pronoms et n'en invente pas,
// contrairement aux noms, aux entreprises ou aux sigles - qu'on refuse
// catégoriquement de lister.
//
// Ne pas y glisser de noms communs (« Universities », « Contents »…) : ce sont
// des classes ouvertes, et leur place est dans un profil éditable, jamais ici.
const PRONOMS = new Set([
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'he', 'him', 'his',
  'she', 'her', 'hers', 'it', 'its', 'we', 'us', 'our', 'ours', 'they', 'them',
  'their', 'theirs', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose',
  'je', 'me', 'moi', 'tu', 'toi', 'il', 'elle', 'on', 'nous', 'vous', 'ils',
  'elles', 'lui', 'leur', 'leurs', 'celui', 'celle', 'ceux', 'celles', 'ceci',
  'cela', 'qui', 'que', 'dont',
  'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sein', 'ihre'
]);

// Les contractions anglaises (« I've », « he's », « they'll ») portent encore un
// pronom : on compare sur la partie qui précède l'apostrophe. « O'Brien » n'est
// pas concerné, « O » n'étant pas un pronom.
export function estPronom(valeur) {
  const nu = String(valeur || '').trim().toLowerCase();
  const avantApostrophe = nu.split(/['’]/)[0];
  return PRONOMS.has(nu) || (nu.includes("'") || nu.includes('’')
    ? PRONOMS.has(avantApostrophe) : false);
}

// Types soumis au filtre de vocabulaire (P14). PER en est exclu volontairement :
// beaucoup de patronymes français sont des mots courants - Blanc, Petit,
// Bernard, Roux - et « Pierre Blanc » serait jugé « vocabulaire », donc laissé
// en clair. Le filtre y produirait des fuites, pas du confort.
//
// ORG et LOC, eux, portent le gros du bruit ET la donnée la moins sensible :
// une raison sociale ou une ville ne sont pas des données personnelles au sens
// du RGPD, alors que le bruit qu'on retire rendait le document inexploitable.
const TYPES_FILTRES_PAR_VOCABULAIRE = new Set(['ORG', 'LOC']);

function estPlausiblePourLeType(type, valeur) {
  if (TYPES_NOMS_PROPRES.has(type)) {
    if (estPronom(valeur)) return false;
    if (!/\p{Lu}/u.test(valeur)) return false;
    // Un nom propre n'est pas fait de mots du dictionnaire. Voir
    // vocabulaire.js pour la mesure qui a mené ici, et pour ce qu'on y perd.
    if (TYPES_FILTRES_PAR_VOCABULAIRE.has(type) && estVocabulaireCourant(valeur)) return false;
    return true;
  }
  if (type === 'DATE_NAISSANCE') return estUneDate(valeur);
  return true;
}

// glinerPipeline : fonction injectée (text, labels) → [{ spanText, start, end,
// label, score }]. Injectée pour la même raison que dans ner.js : le moteur
// reste testable en Node avec un pipeline simulé, sans charger 183 Mo.
//
// disabledTypes : Set de types désactivés par l'utilisateur. Utilisé ICI (et
// pas seulement en aval dans filterByRules) pour éviter une inférence inutile.
// onProgress({ done, total }) : awaité, permet de rendre la main à l'UI.
// Copie désaccentuée, à longueur strictement égale.
//
// Pourquoi. Le checkpoint est un `deberta-v3-small` anglophone (choisi à la
// mesure : il bat le multilingue sur nos fixtures FR, voir Gotchas). Les
// accents lui coûtent cher - mesuré sur le même nom, en capitales :
// « ELEONORE VASSEUR » sort à 0,618, « ÉLÉONORE VASSEUR » à 0,418, pour un
// seuil à 0,46. Le nom fuyait donc en clair (P10). Ce n'est pas « les
// capitales accentuées ne marchent pas » - « MÉLANIE THÉVENOT » sort à 0,507 -
// c'est que l'accentuation retire ~0,20 et que certains cas atterrissent juste
// sous la barre.
//
// Longueur préservée, et c'est tout l'intérêt de cet axe. On ne remplace un
// caractère que si sa forme désaccentuée fait exactement la même longueur :
// les offsets rendus par le modèle sont alors valides sur les deux textes, et
// la valeur masquée se relit sur l'original sans le moindre recalage. La passe
// à casse boostée de `ner.js`, elle, n'a pas cette garantie (« ß » → « SS »).
//
// À ne pas confondre avec la minusculisation, mesurée et rejetée au spike POS
// (+7 démasquages mais 3 fuites) : un modèle « cased » se sert de la majuscule
// comme signal, la retirer brouille la frontière. Désaccentuer la préserve.
export function desaccentuer(texte) {
  let sortie = '';
  for (const ch of texte) {
    const nu = ch.normalize('NFD').replace(/\p{M}+/gu, '');
    sortie += nu.length === ch.length ? nu : ch;
  }
  return sortie;
}

// Copie à casse adoucie, À longueur strictement égale - l'autre moitié du même
// axe que `desaccentuer`, et celle qui porte le plus.
//
// Pourquoi. Mesuré sur un vrai casier judiciaire - un FORMULAIRE, dont les
// valeurs sont en capitales, classe de document absente du corpus (fait de CV
// et de mémoires), ce qui explique que le défaut ait survécu si longtemps :
//
//   « LANDRY KAPGNEP »   company 0,72   →  person   0,99
//   « FOSSES »           person  0,36   →  location 0,70
//   « NANTES »           location 0,40  →  location 0,53   (0,40 était sous le seuil)
//
// Le nom de l'utilisateur sortait donc en ENTREPRISE : il recevait un
// pseudonyme tiré du vivier des sociétés, et surtout la décomposition par
// composant (réservée aux PER) ne s'appliquait pas - le prénom isolé après
// « Prénom(s) » n'était jamais masqué. Une fuite, pas un défaut cosmétique.
//
// Ce n'est pas la minusculisation, mesurée et rejetée au spike POS
// (+7 démasquages mais 3 fuites). On garde l'initiale majuscule - le signal
// dont un modèle « cased » se sert pour délimiter un nom propre - et on
// n'enlève que l'anomalie tout-majuscule. Retirer la majuscule initiale
// brouille la frontière ; retirer les capitales de suite ne la touche pas.
//
// Longueur préservée, même exigence que ci-dessus, et elle n'est pas
// gratuite : `toLowerCase()` peut allonger (le « İ » turc donne deux points de
// code). On ne remplace donc un caractère que si sa minuscule fait exactement
// la même longueur - c'est ce que la passe `boostCase` de `ner.js` ne pouvait
// pas garantir (« ß » → « SS »).
//
// Trois lettres au moins : en dessous, ce sont des sigles (BIC, RIB, TVA) que
// le déterministe traite déjà et qu'il ne sert à rien de brouiller. La passe
// est de toute façon ADDITIVE - elle ne peut qu'ajouter des candidats, jamais
// en retirer à la passe naturelle.
//
// Correctif partiel, assumé : « SARCELLES » reste à 0,43, sous le seuil, avant
// comme après. Ne pas le lire comme un rattrapage total des capitales.
const MOT_TOUT_CAPITALES = /\p{Lu}[\p{Lu}'’-]{2,}/gu;

export function adoucirCasse(texte) {
  return String(texte || '').replace(MOT_TOUT_CAPITALES, (mot) => {
    const lettres = [...mot];
    const suite = lettres.slice(1).map(ch => {
      const bas = ch.toLowerCase();
      return bas.length === ch.length ? bas : ch;
    }).join('');
    return lettres[0] + suite;
  });
}

export async function detectGliner(text, glinerPipeline, { onProgress, disabledTypes } = {}) {
  if (!glinerPipeline) return [];
  const desactives = disabledTypes || new Set();
  const groupesActifs = GROUPES.filter(g => typesDuGroupe(g).some(t => !desactives.has(t)));
  if (!groupesActifs.length) return [];

  const chunks = chunkText(text);
  // Total exact des passes qui seront réellement exécutées : compter
  // `chunks × groupes` inclurait celles que `pertinent` va sauter, et la barre
  // de progression n'atteindrait jamais 100 %.
  let total = 0;
  for (const { text: c } of chunks) {
    for (const g of groupesActifs) if (!g.pertinent || g.pertinent(c)) total++;
  }
  const all = [];
  let done = 0;

  for (const { offset, text: chunk } of chunks) {
    const duChunk = [];
    const chunkNu = desaccentuer(chunk);
    const chunkCasse = adoucirCasse(chunk);
    // Les variantes ne sont ajoutées QUE si elles changent quelque chose : une
    // prose sans accent ni capitales ne paie aucune passe supplémentaire, et le
    // coût se concentre sur les documents qui en ont besoin (formulaires, CV).
    const variantes = [chunk];
    if (chunkNu !== chunk) variantes.push(chunkNu);
    if (chunkCasse !== chunk) variantes.push(chunkCasse);
    for (const groupe of groupesActifs) {
      // Ne pas payer une inférence dont on jettera le résultat.
      //
      // `estPlausiblePourLeType` écarte déjà, après coup, les spans sans
      // majuscule (noms propres) ou sans chiffre (date de naissance). Si le
      // texte entier n'en contient aucun, la passe ne peut rien produire qui
      // survive à ce filtre : on la saute. Zéro perte par construction - c'est
      // la même règle, appliquée avant la dépense au lieu d'après.
      //
      // Mesuré sur un mémoire de 75 pages : le groupe « date de naissance »
      // coûte autant que le groupe identité (25,0 contre 25,4 ms/unité) alors
      // qu'il n'a qu'un label - le coût suit la longueur du texte, pas le
      // nombre de labels. Or 65 % des unités n'ont aucun chiffre.
      if (groupe.pertinent && !groupe.pertinent(chunk)) continue;
      const seuil = groupe.seuil ?? GLINER_THRESHOLD;
      // Passes supplémentaires sur les copies désaccentuée (P10) et à casse
      // adoucie (P12). La longueur étant préservée dans les deux cas, toutes
      // partagent le même repère d'offsets et la valeur se relit sur
      // l'original - c'est ce qui rend l'axe utilisable.
      for (const variante of variantes) {
        const spans = await glinerPipeline(variante, groupe.labels);
        for (const s of spans || []) {
          const type = groupe.types[s.label];
          // Un label inconnu ne doit jamais devenir une entité sans type : mieux
          // vaut l'ignorer que produire un placeholder [undefined_1].
          //
          // Et un type désactivé ne doit pas non plus sortir d'ici, sous
          // peine de fuite. Ce n'est pas une optimisation, c'est une correction.
          //
          // Le saut de groupe ci-dessus n'écarte une passe que si tous ses types
          // sont désactivés. Un groupe partiellement actif produit donc encore
          // des entités de types désactivés - et celles-ci ENTRENT dans la
          // résolution des chevauchements, où « le plus long gagne ». Elles y
          // battent une détection d'un type actif portant sur le même texte…
          // avant d'être jetées tout à la fin par filterByRules. Résultat : la
          // valeur n'est plus masquée par personne.
          //
          // Mesuré sur un vrai CV. L'utilisateur avait décoché ETABLISSEMENT
          // mais laissé SANTE : le groupe tournait donc encore, sortait
          // « ETABLISSEMENT : Sorbonne Paris Nord » trois fois, ce span évinçait
          // le « LIEU : Sorbonne Paris Nord » du groupe identité, puis
          // disparaissait - et le nom de l'université partait en clair.
          if (!type || desactives.has(type) || s.score < seuil) continue;
          // La valeur se relit toujours sur le texte d'origine : c'est le texte
          // accentué qu'il faudra masquer, pas la copie de travail.
          const valeur = chunk.slice(s.start, s.end);
          if (!estPlausiblePourLeType(type, valeur)) continue;
          duChunk.push({
            type,
            value: valeur,
            start: s.start,
            end: s.end,
            source: 'ner',
            score: s.score,
            validated: 'n/a'
          });
        }
      }
      if (onProgress) await onProgress({ done: ++done, total });
    }

    // Chevauchements entre groupes (ex. « Université de Bordeaux » vu comme
    // ETABLISSEMENT et comme ORG) : même règle que partout dans ce projet -
    // le span le plus long gagne, le score ne départage qu'à égalité.
    duChunk.sort((a, b) =>
      a.start - b.start ||
      (b.end - b.start) - (a.end - a.start) ||
      b.score - a.score
    );
    const gardes = [];
    for (const e of duChunk) {
      if (gardes.some(k => e.start < k.end && e.end > k.start)) continue;
      gardes.push(e);
    }
    for (const e of gardes) all.push({ ...e, start: e.start + offset, end: e.end + offset });
  }

  // Assurance : le découpeur de mots de la lib est corrigé côté worker (voir
  // ner-worker.js), mais un span à cheval sur une frontière de mot resterait
  // une fuite partielle. Mécanisme partagé avec le moteur BERT.
  snapToWordBoundaries(text, all);

  // Recollage des noms détectés en deux morceaux. Cas réel : sur un CV,
  // « LANDRY KAPGNEP » sort en deux spans distincts (0,47 et 0,36) - sans
  // pontage, seul le prénom passerait le seuil et le patronyme fuirait en
  // clair à côté du placeholder. Mécanisme partagé avec le moteur BERT.
  bridgeNameParts(text, all);

  // Dédoublonnage des zones de recouvrement entre fenêtres.
  const vus = new Set();
  return all
    .filter(e => {
      const k = `${e.start}:${e.end}:${e.type}`;
      if (vus.has(k)) return false;
      vus.add(k);
      return true;
    })
    .sort((a, b) => a.start - b.start);
}

// --- ARBITRAGE DES FAUX POSITIFS -----------------------------------------
//
// Le problème qu'il traite. Le label « person » désigne toute expression qui
// RÉFÈRE à une personne, pas seulement un nom : le modèle sort donc
// « Analyste », « Ingénieure », « Second candidat », « Poste occupé ». Il a
// raison linguistiquement, c'est notre besoin qui porte sur les entités
// NOMMÉES. Aucun seuil ne les écarte - mesuré, ces faux positifs sortent
// Au-dessus de vraies entités (« Réunion » 0,961 contre « Villetaneuse »
// 0,699).
//
// Pourquoi une passe séparée, et pas des labels ajoutés au groupe identité :
// les labels se concurrencent dans un même appel (gotcha documenté). Mis face
// à « person », un label « job title » sort écrasé à 0,000 et ne sert à rien.
// Seul, il répond.
//
// Ce que ça coûte. Une inférence par valeur distincte, pas par occurrence, et
// sur un texte très court. Les appels partent en parallèle donc le
// regroupement en lots les rassemble (voir src/engine/batch.js).
//
// Ce que ça ne touche jamais : la couche déterministe. On n'arbitre que les
// entités venues du modèle (`source === 'ner'`) et de type nom propre. Un IBAN
// validé mathématiquement ne se discute pas.
export const LABELS_LEURRE = ['job title', 'section heading', 'common noun', 'skill or hobby'];

// Mesuré sur 21 faux positifs et 15 vraies entités du document piégé :
// 6 faux positifs écartés, aucune vraie entité perdue. Le gain est modeste
// mais il est gratuit en risque - c'est ce qui l'a fait retenir.
export async function arbitrerFauxPositifs(entities, glinerPipeline) {
  if (!glinerPipeline || !entities?.length) return entities || [];
  const labelsPII = GROUPES[0].labels;
  const tous = [...labelsPII, ...LABELS_LEURRE];

  const candidats = [...new Set(
    entities.filter(e => e.source === 'ner' && TYPES_NOMS_PROPRES.has(e.type)).map(e => e.value)
  )];
  if (!candidats.length) return entities;

  const rejete = new Set();
  await Promise.all(candidats.map(async valeur => {
    let spans;
    try {
      spans = await glinerPipeline(valeur, tous);
    } catch {
      return; // en cas d'échec on GARDE l'entité : ne jamais démasquer sur une erreur
    }
    let pii = 0, leurre = 0;
    for (const s of spans || []) {
      // Seul le span qui couvre tout le candidat compte : un fragment ne dit
      // rien de la nature de l'expression entière.
      if ((s.spanText || '').trim() !== valeur.trim()) continue;
      if (LABELS_LEURRE.includes(s.label)) leurre = Math.max(leurre, s.score);
      else pii = Math.max(pii, s.score);
    }
    if (leurre > pii) rejete.add(valeur);
  }));

  return entities.filter(e => !rejete.has(e.value));
}
