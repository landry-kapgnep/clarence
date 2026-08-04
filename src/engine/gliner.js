// Détection contextuelle par NER ZERO-SHOT (GLiNER).
//
// Différence de fond avec ner.js : le modèle BERT a 4 catégories FIGÉES
// (PER/ORG/LOC/MISC) apprises à l'entraînement. GLiNER reçoit les catégories
// cherchées AU MOMENT DE L'APPEL, en langage courant. Conséquence directe :
// il sait qualifier une valeur ISOLÉE, sans phrase autour — une cellule de
// tableau, un nom en tête de CV — ce qu'aucune catégorie figée ni aucun motif
// à mot-clé de contexte ne peut faire (mesuré : « Kowalski » seul → 0,93 ;
// « 1988-03-14 » seul → date de naissance 0,59).
//
// Contrat de sortie IDENTIQUE à detectNER : tout l'aval (merge, selection,
// masking) est donc inchangé et les deux moteurs sont interchangeables.
import { chunkText, snapToWordBoundaries, bridgeNameParts } from './ner.js';

export const GLINER_MODEL = 'onnx-community/gliner_small-v2';

// Seuil par défaut, calé sur les fixtures propres : au-dessus du pire faux
// positif observé et sous la plus faible vraie valeur à conserver (la cellule
// de date nue, 0,59). Chaque groupe peut le surcharger — voir GROUPES.
export const GLINER_THRESHOLD = 0.5;

// GROUPES DE LABELS DISJOINTS — le point le moins intuitif de ce module.
//
// Les labels se CONCURRENCENT à l'intérieur d'un même appel : mesuré sur nos
// fixtures, passer de 3 à 10 labels fait tomber « Semantikmatch » de 0,85 à
// 0,45 et « Rose Fontaine » de 0,61 à 0,25, tout en faisant MONTER le bruit
// (le garde-fou « zéro faux positif » sortait alors « point » à 0,43 et
// « roadmap technique » à 0,40). Un jeu large en une passe dégrade donc
// activement la détection — contre-intuitif, mais reproductible.
//
// D'où trois passes à groupes disjoints, qui conservent chacune leurs scores
// hauts ET laissent le garde-fou à zéro. Le surcoût est celui de l'encodage du
// texte, pas des labels : ~8 ms par passe sur une unité courte.
//
// Ne pas fusionner ces groupes « pour aller plus vite » sans re-mesurer.
export const GROUPES = [
  {
    // Le cœur : ce que le NER BERT couvrait déjà, en mieux sur les valeurs
    // isolées. Marge de bruit très confortable (pire faux positif 0,26).
    //
    // Seuil ABAISSÉ à 0,45, mesuré sur un vrai CV : un nom seul sur sa ligne,
    // en gros, sans rien autour (« LANDRY KAPGNEP », titre du document) ne
    // sort qu'à 0,47 — un titre de CV est trop court pour donner au modèle de
    // quoi être sûr. À 0,50 il FUYAIT. Le plancher de bruit du garde-fou étant
    // à 0,26, la marge reste large. Ne pas remonter sans re-tester ce cas.
    seuil: 0.45,
    labels: ['person', 'company', 'location'],
    types: { person: 'PER', company: 'ORG', location: 'LOC' }
  },
  {
    // Seul : associé à d'autres labels il perd sa précision, et « address »
    // faisait monter le bruit du garde-fou à 0,47 (trop près du seuil).
    // Les adresses restent couvertes par le motif ADRESSE, déterministe.
    labels: ['date of birth'],
    types: { 'date of birth': 'DATE_NAISSANCE' }
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

// Types qu'un groupe peut produire — sert à sauter entièrement une passe dont
// l'utilisateur a désactivé tous les types (on ne paie que ce qu'on demande).
const typesDuGroupe = g => Object.values(g.types);

// PERSONNE / ENTREPRISE / LIEU sont par définition des NOMS PROPRES : en
// français comme en anglais, ils portent une majuscule. Les autres types
// produits par le modèle sont des noms COMMUNS par nature (« développeur »,
// « diabète », « française ») et ne peuvent pas être filtrés ainsi.
const TYPES_NOMS_PROPRES = new Set(['PER', 'ORG', 'LOC']);

// Écarte les spans sans la moindre majuscule quand le type exige un nom propre.
//
// POURQUOI (P6). Le label zero-shot « person » désigne toute expression qui
// RÉFÈRE à une personne, pas seulement un nom : le modèle sort donc « vendor »,
// « candidate », « dossier », « adresse », « leadership », « protagoniste ».
// Il a raison linguistiquement ; c'est notre besoin qui porte sur les entités
// NOMMÉES. Le filtre traduit cette exigence de la façon la plus simple et la
// plus déterministe possible.
//
// LIMITE ASSUMÉE, à ne pas découvrir plus tard : un nom écrit tout en
// minuscules (« jean dupont » tapé à la volée) n'est plus détecté par cette
// couche. C'est un recul sur la priorité zéro-fuite, accepté ici parce que
// (a) la couche déterministe (email, téléphone, IBAN…) n'est pas concernée,
// (b) le profil d'identité masque le nom de l'utilisateur quoi qu'il arrive,
// (c) « toujours masquer » reste disponible, et (d) le sur-masquage mesuré
// rendait les documents inexploitables, ce qui est l'autre façon de perdre
// l'utilisateur. Réévaluer si un cas réel de nom en minuscules apparaît.
function estNomPropreplausible(type, valeur) {
  if (!TYPES_NOMS_PROPRES.has(type)) return true;
  return /\p{Lu}/u.test(valeur);
}

// glinerPipeline : fonction INJECTÉE (text, labels) → [{ spanText, start, end,
// label, score }]. Injectée pour la même raison que dans ner.js : le moteur
// reste testable en Node avec un pipeline simulé, sans charger 183 Mo.
//
// disabledTypes : Set de types désactivés par l'utilisateur. Utilisé ICI (et
// pas seulement en aval dans filterByRules) pour éviter une inférence inutile.
// onProgress({ done, total }) : awaité, permet de rendre la main à l'UI.
export async function detectGliner(text, glinerPipeline, { onProgress, disabledTypes } = {}) {
  if (!glinerPipeline) return [];
  const desactives = disabledTypes || new Set();
  const groupesActifs = GROUPES.filter(g => typesDuGroupe(g).some(t => !desactives.has(t)));
  if (!groupesActifs.length) return [];

  const chunks = chunkText(text);
  const total = chunks.length * groupesActifs.length;
  const all = [];
  let done = 0;

  for (const { offset, text: chunk } of chunks) {
    const duChunk = [];
    for (const groupe of groupesActifs) {
      const spans = await glinerPipeline(chunk, groupe.labels);
      const seuil = groupe.seuil ?? GLINER_THRESHOLD;
      for (const s of spans || []) {
        const type = groupe.types[s.label];
        // Un label inconnu ne doit jamais devenir une entité sans type : mieux
        // vaut l'ignorer que produire un placeholder [undefined_1].
        if (!type || s.score < seuil) continue;
        if (!estNomPropreplausible(type, chunk.slice(s.start, s.end))) continue;
        duChunk.push({
          type,
          value: chunk.slice(s.start, s.end),
          start: s.start,
          end: s.end,
          source: 'ner',
          score: s.score,
          validated: 'n/a'
        });
      }
      if (onProgress) await onProgress({ done: ++done, total });
    }

    // Chevauchements ENTRE groupes (ex. « Université de Bordeaux » vu comme
    // ETABLISSEMENT et comme ORG) : même règle que partout dans ce projet —
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

  // Recollage des noms détectés EN DEUX MORCEAUX. Cas réel : sur un CV,
  // « LANDRY KAPGNEP » sort en deux spans distincts (0,47 et 0,36) — sans
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
