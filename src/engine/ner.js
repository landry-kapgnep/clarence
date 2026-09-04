// Passe 2 — NER local. Regroupement WordPiece + relocalisation portés du
// prototype validé (ce modèle ne renvoie pas d'offsets fiables).
//
// IMPORTANT — découpage en fenêtres : BERT ne traite que ~512 tokens. Sans
// découpage, tout ce qui dépasse (~1 500-2 000 caractères FR) serait ignoré
// SILENCIEUSEMENT — le pire mode de défaillance pour un anonymiseur. On
// découpe donc en fenêtres avec recouvrement, et on fusionne les résultats.

export const NER_MODEL = 'Xenova/bert-base-multilingual-cased-ner-hrl';

export const CHUNK_SIZE = 1000;   // caractères ≈ 250-400 tokens FR, marge large sous 512
export const CHUNK_OVERLAP = 120; // évite de trancher une entité à la frontière

// Mots-outils français qu'on ne capitalise jamais avant de passer le texte au
// NER. Le modèle est "cased" : un nom en minuscule (ex. "je m'appelle jean
// dupont") est hors distribution et souvent ignoré. On aide le modèle en
// capitalisant tout mot minuscule candidat à un nom propre, SAUF ces mots-outils
// — sinon toute la phrase serait capitalisée et le signal casse deviendrait
// inutile. Sur-capitaliser un mot commun (absent de cette liste) peut produire
// un faux positif, mais un faux positif se retire d'un clic ; un nom raté est
// une fuite silencieuse — la relecture humaine est la contrepartie assumée.
const STOPWORDS_FR = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'ce', 'cet', 'cette', 'ces',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'au', 'aux', 'l',
  'à', 'dans', 'en', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'chez', 'vers', 'entre',
  'depuis', 'pendant', 'avant', 'après', 'malgré', 'selon', 'jusque', 'jusqu', 'contre', 'envers', 'via',
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'dont', 'où',
  'si', 'comme', 'quand', 'lorsque', 'puisque', 'tandis',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'moi', 'toi', 'lui', 'eux', 'se', 'me', 'te', 'y',
  'celui', 'celle', 'ceux', 'celles',
  'est', 'sont', 'suis', 'es', 'était', 'étaient', 'sera', 'seront', 'serait', 'soit',
  'ai', 'as', 'a', 'avons', 'avez', 'ont', 'avait', 'avaient', 'aura', 'auront', 'eu',
  'fait', 'faites', 'faisons', 'font', 'faisait', 'dit', 'dites', 'disons', 'disent',
  'va', 'vais', 'vas', 'allons', 'allez', 'vont', 'allait', 'allaient',
  'peut', 'peux', 'pouvons', 'pouvez', 'peuvent', 'pouvait', 'pu',
  'doit', 'dois', 'devons', 'devez', 'doivent', 'devait',
  'veut', 'veux', 'voulons', 'voulez', 'veulent', 'voulait',
  'très', 'bien', 'plus', 'moins', 'aussi', 'encore', 'déjà', 'toujours', 'jamais', 'souvent', 'parfois',
  'ici', 'là', 'ainsi', 'alors', 'ensuite', 'enfin', 'aujourd', 'hui', 'hier', 'demain', 'maintenant',
  'oui', 'non', 'ne', 'pas', 'peu', 'trop', 'tout', 'tous', 'toute', 'toutes',
  'bonjour', 'bonsoir', 'merci', 'cordialement', 'svp'
]);

// Longueur minimale d'un mot TOUT EN MAJUSCULES pour être remis en Titre.
// Épargne les acronymes courts omniprésents dans un CV (SQL, API, JWT, CTF,
// IUT, BUT, NSI, PHP) tout en visant les patronymes (LANDRY, KAPGNEP).
const ALLCAPS_MIN = 4;

// Normalise la casse pour la passe "boostée" du NER. Deux cas, car le modèle
// est *cased* et ne reconnaît un nom propre qu'en Casse Titre :
//  - mot entièrement minuscule (hors mot-outil) → capitalisé ;
//  - mot entièrement MAJUSCULE d'au moins ALLCAPS_MIN lettres → mis en Titre.
//    Sans ça, un nom en titre de document (« LANDRY KAPGNEP » sur un CV) n'est
//    JAMAIS détecté : fuite constatée sur un vrai fichier.
// Préserve la longueur exacte de la chaîne (les offsets restent valides) ;
// un mot en casse mixte (déjà exploitable par le modèle) n'est jamais modifié.
export function boostCase(text) {
  return text.split(/(\p{L}+)/u).map(tok => {
    if (!/^\p{L}+$/u.test(tok)) return tok;
    const lower = tok.toLowerCase();
    const upper = tok.toUpperCase();
    if (STOPWORDS_FR.has(lower)) return tok;
    if (tok === lower && tok.length >= 2) return tok[0].toUpperCase() + tok.slice(1);
    if (tok === upper && tok.length >= ALLCAPS_MIN) return tok[0] + tok.slice(1).toLowerCase();
    return tok;
  }).join('');
}

// Découpe en fenêtres { offset, text } couvrant tout le texte, coupées de
// préférence sur un séparateur, avec recouvrement entre fenêtres.
export function chunkText(text) {
  if (text.length <= CHUNK_SIZE) return [{ offset: 0, text }];
  const chunks = [];
  let pos = 0;
  while (pos < text.length) {
    let end = Math.min(pos + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const window = text.slice(pos, end);
      const lastBreak = Math.max(
        window.lastIndexOf('\n'),
        window.lastIndexOf('. '),
        window.lastIndexOf(' ')
      );
      if (lastBreak > CHUNK_SIZE * 0.5) end = pos + lastBreak + 1;
    }
    chunks.push({ offset: pos, text: text.slice(pos, end) });
    if (end >= text.length) break;
    pos = end - CHUNK_OVERLAP;
  }
  return chunks;
}

// Regroupe les sous-tokens WordPiece en entités selon le schéma B-/I-.
export function groupTokens(raw) {
  const groups = [];
  let current = null;
  for (const tok of raw) {
    if (!tok.entity || tok.entity === 'O') { current = null; continue; }
    const type = tok.entity.replace(/^[BI]-/, '');
    const isSubword = tok.word.startsWith('##');
    const piece = isSubword ? tok.word.slice(2) : tok.word;
    const isNewEntity = tok.entity.startsWith('B-') || !current;
    if (isNewEntity) {
      if (current) groups.push(current);
      current = { type, text: piece, minScore: tok.score };
    } else {
      current.text += isSubword ? piece : ' ' + piece;
      current.minScore = Math.min(current.minScore, tok.score);
    }
  }
  if (current) groups.push(current);
  return groups;
}

// Relocalise chaque entité reconstruite dans le texte d'origine (curseur
// avançant, gère les répétitions).
export function locateGroups(text, groups) {
  let cursor = 0;
  const entities = [];
  for (const g of groups) {
    // Filtre anti-bruit : une entité d'un seul caractère est toujours un
    // fragment (ex. "R" de "Référent") ; un masque d'une lettre ne protège
    // rien — on écarte. Validé sur les fixtures.
    if (g.text.length < 2) continue;
    const idx = text.indexOf(g.text, cursor);
    if (idx === -1) continue; // reconstruction imparfaite : ignorer plutôt que mal positionner
    entities.push({
      type: g.type,
      value: g.text,
      start: idx,
      end: idx + g.text.length,
      source: 'ner',
      score: g.minScore,
      validated: 'n/a'
    });
    cursor = idx + g.text.length;
  }
  return entities;
}

// Recalage des entités sur les frontières de mot — PARTAGÉ par les deux
// moteurs contextuels (BERT ici, GLiNER dans gliner.js), jamais dupliqué.
// Corrige deux défauts qui laissent fuir une partie d'un nom :
//  - reconstruction tronquée EN PLEIN MOT ("mandine" pour "Amandine" →
//    "A[PERSONNE]") : on étend vers la gauche jusqu'au début du mot ;
//  - arrêt au 1er élément d'un composé à trait d'union ("Antoine" dans
//    "Marc-Antoine", "ROUSSEAU" sans "-LEFEBVRE") : on étend des deux côtés à
//    travers les traits d'union vers les mots adjacents.
// Déterministe et sûr : n'étend qu'une détection existante (jamais de
// franchissement d'espace), et on rogne les tirets aux extrémités.
// Vaut pour ORG/LOC autant que PER : le modèle n'étiquette parfois que le
// premier sous-mot (« Sem » de Semantikmatch, « UT » de IUT), ce qui laissait
// le reste du mot EN CLAIR à côté du placeholder ([ENTREPRISE_4]antikmatch) —
// fuite partielle constatée sur un vrai CV.
// Modifie les entités EN PLACE et les retourne.
const SNAP_TYPES = new Set(['PER', 'ORG', 'LOC']);
const NAME_CHAR = /[A-Za-zÀ-ÿ'’-]/;
export function snapToWordBoundaries(text, entities) {
  for (const e of entities) {
    if (!SNAP_TYPES.has(e.type)) continue;
    let { start, end } = e;
    while (start > 0 && NAME_CHAR.test(text[start - 1])) start--;
    while (end < text.length && NAME_CHAR.test(text[end])) end++;
    while (start < end && text[start] === '-') start++;
    while (end > start && text[end - 1] === '-') end--;
    if (start !== e.start || end !== e.end) {
      e.start = start; e.end = end; e.value = text.slice(start, end);
    }
  }
  return entities;
}

// Pontage de noms à particules / patronymes ratés — PARTAGÉ par les deux
// moteurs contextuels. Deux défauts distincts, tous deux constatés sur de
// vrais fichiers :
//  - noms nobiliaires ("Sébastien De La Villardière" : "Villardière" pris pour
//    un LIEU, le prénom + particules laissés en clair) ;
//  - patronyme en MAJUSCULES séparé du prénom en deux détections distinctes
//    ("Amandine" + "ROUSSEAU-LEFEBVRE" ; ou, avec GLiNER, "LANDRY" détecté et
//    "KAPGNEP" laissé en clair — le nom en tête d'un vrai CV).
// Recollage déterministe, TOUJOURS ancré sur une détection existante (jamais
// de nom créé de zéro). Tradeoff assumé (priorité zéro-fuite) : peut
// sur-masquer un lieu précédé d'un mot capitalisé + particule ("Voyage De La
// Rochelle").
//
// Ce tradeoff était annoncé « cas rare » — le banc a montré que c'est FAUX
// pour une forme précise : « SIGLE de Ville » est le squelette de la moitié
// des noms d'établissements français (« IUT de Villetaneuse », « CHU de
// Nantes », « ENS de Lyon »). Le pontage en faisait des PERSONNE, donc un
// placeholder [PERSONNE_n] avalait le sigle — l'information « c'est un
// institut universitaire », que le LLM doit garder, disparaissait avec la
// ville. Un prénom ne s'écrit pas en sigle : on exige donc du mot absorbé
// qu'il contienne une minuscule (« Sébastien de … » oui, « IUT de … » non).
// La ville reste masquée par ailleurs, en LIEU — ce qui est le comportement
// voulu, identique à « Sarcelles » dans le même document.
// Modifie les entités EN PLACE et les retourne.
const PARTICLE = "(?:[Dd]e|[Dd]u|[Dd]es|[Ll]a|[Ll]e|[Dd]['’]|[Ll]['’]|von|van|[Dd]a|[Dd]i)";
const CAPWORD = "[A-ZÀ-Ü][A-Za-zÀ-ÿ'’-]*";
// Comme CAPWORD, mais avec AU MOINS UNE MINUSCULE : exclut les sigles.
const CAPWORD_MIXTE = "[A-ZÀ-Ü][A-Za-zÀ-ÿ'’-]*[a-zà-ÿ][A-Za-zÀ-ÿ'’-]*";
const ALLCAPS = "[A-ZÀ-Ü]{2,}(?:[-'’][A-ZÀ-Ü]+)*";
const FWD_PARTICLE = new RegExp(`^(?:\\s+${PARTICLE})+\\s+${CAPWORD}`);
// La garde de fin refuse aussi un CHIFFRE, directement ou après un tiret :
// sans elle, « Nadia Belkacem EMP-0012 » absorbait « EMP » et produisait le
// patronyme fantôme « Belkacem EMP » (mesuré sur tous-defauts.pdf). Un sigle
// suivi d'un tiret et de chiffres est un IDENTIFIANT, jamais un nom de famille.
const FWD_ALLCAPS = new RegExp(`^\\s+${ALLCAPS}(?![A-Za-zÀ-ÿ0-9]|[-'’]?\\d)`);
const BACK_PARTICLE = new RegExp(`(${CAPWORD_MIXTE}(?:\\s+${PARTICLE})+\\s+)$`);
export function bridgeNameParts(text, entities) {
  for (const e of entities) {
    // (a) extension AVANT depuis un PER : " De La Rochefoucauld", " KAPGNEP".
    if (e.type === 'PER') {
      let m;
      while ((m = FWD_PARTICLE.exec(text.slice(e.end))) || (m = FWD_ALLCAPS.exec(text.slice(e.end)))) {
        e.end += m[0].length;
        e.value = text.slice(e.start, e.end);
      }
    }
    // (b) un LIEU/MISC précédé de "Prénom + particules" est en fait un
    // patronyme : on l'absorbe en arrière et on le re-type en PER.
    if (e.type === 'LOC' || e.type === 'MISC') {
      const m = BACK_PARTICLE.exec(text.slice(0, e.start));
      if (m) {
        e.start -= m[1].length;
        e.value = text.slice(e.start, e.end);
        e.type = 'PER';
      }
    }
  }
  return entities;
}

// Sous ce seuil, trop de bruit : la casse boostée (boostCase) fait parfois
// dériver un mot-outil vers un B-PER isolé et peu sûr (ex. "habite" → "Ha" à
// 52%), très en dessous de la confiance des vraies entités (>95% en pratique).
const MIN_SCORE = 0.6;

// Le pipeline est injecté (bundlé dans l'extension, simulé dans les tests).
//
// Double passe par fenêtre : texte naturel (comportement historique, intact)
// ET texte boosté (boostCase, pour les noms écrits sans majuscule). Aucune
// des deux passes n'est prioritaire a priori sur l'autre — on a vérifié
// empiriquement les deux sens de défaillance :
//  - booster un texte déjà bien casé peut noyer le signal et faire perdre
//    une entité que le modèle trouvait très bien tout seul (ex. "Lefèvre
//    Consulting"/"Lyon" disparus une fois tout le paragraphe capitalisé) ;
//  - à l'inverse, sur un nom à l'orthographe inhabituelle, la passe
//    naturelle peut ne capturer qu'un fragment tronqué avec une confiance
//    décente (ex. "lefev" à 92% sur "jean lefevbre") alors que la passe
//    boostée reconstruit l'entité complète à 100% ("Jean Lefevbre").
// Sur un chevauchement entre les deux passes, on garde donc le span le plus
// long (le plus complet), la confiance ne départageant qu'à égalité de
// longueur — même logique que resolveOverlaps dans merge.js pour le regex.
// onProgress({ done, total }) (optionnel) : appelé après chaque fenêtre. Le NER
// tourne sur le thread principal (pas de worker, contrainte CSP MV3) et fait
// DEUX inférences BERT par fenêtre — sur un document de quelques milliers de
// caractères ça se compte en dizaines de secondes. Sans retour chiffré,
// l'utilisateur croit à un plantage et interrompt (constaté).
export async function detectNER(text, nerPipeline, { onProgress } = {}) {
  if (!nerPipeline) return [];
  const all = [];
  const chunks = chunkText(text);
  let done = 0;
  for (const { offset, text: chunk } of chunks) {
    // Le filtre de confiance s'applique AVANT le calcul des chevauchements :
    // un fragment bruité (score très faible) ne doit pas pouvoir bloquer une
    // détection solide de l'autre passe puis disparaître lui-même au filtre
    // final — sinon la position ne récupère plus AUCUNE entité.
    const natural = locateGroups(chunk, groupTokens(await nerPipeline(chunk)))
      .filter(e => e.score >= MIN_SCORE);

    const boosted = boostCase(chunk);
    const boostedEntities = locateGroups(boosted, groupTokens(await nerPipeline(boosted)))
      .map(e => ({ ...e, value: chunk.slice(e.start, e.end) }))
      .filter(e => e.score >= MIN_SCORE);

    const combined = [...natural, ...boostedEntities].sort((a, b) =>
      a.start - b.start ||
      (b.end - b.start) - (a.end - a.start) ||
      b.score - a.score
    );
    const kept = [];
    for (const e of combined) {
      if (kept.some(k => e.start < k.end && e.end > k.start)) continue;
      kept.push(e);
    }

    for (const e of kept) {
      all.push({ ...e, start: e.start + offset, end: e.end + offset });
    }
    // await : le callback peut rendre la main au navigateur (setTimeout 0) pour
    // qu'il repeigne l'avancement — sinon le thread principal reste bloqué du
    // début à la fin et l'UI semble figée.
    if (onProgress) await onProgress({ done: ++done, total: chunks.length });
  }
  snapToWordBoundaries(text, all);

  bridgeNameParts(text, all);
  // Dédoublonnage des zones de recouvrement (mêmes bornes, même type).
  const seen = new Set();
  return all
    .filter(e => {
      const k = `${e.start}:${e.end}:${e.type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.start - b.start);
}
