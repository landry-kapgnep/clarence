// Profil d'identité : les données personnelles de l'utilisateur, déclarées UNE
// FOIS, pour que le masquage de sa propre identité soit DÉTERMINISTE - jamais
// suspendu au score de confiance d'un modèle (un nom en titre de CV sort à
// 0,47 : aucun seuil ne rend ça fiable ; une recherche littérale, si).
//
// Les termes alimentent forcedMasks (src/engine/selection.js), le mécanisme
// « toujours masquer » existant et testé en zéro tolérance. Le moteur de
// détection ne sait rien de ce module.
//
// ============================ CONFIDENTIALITÉ =============================
// chrome.storage.LOCAL exclusivement. JAMAIS chrome.storage.sync : sync
// téléverse vers les serveurs Google - pour le fichier le plus sensible de
// toute l'extension (l'identité complète de l'utilisateur), ce serait une
// violation frontale du principe « aucune donnée ne quitte le navigateur ».
// Si un jour quelqu'un veut « synchroniser les réglages entre machines »,
// ce module est EXCLU d'office de cette synchronisation.
// ==========================================================================

import { estComposantNonIdentifiant } from '../engine/honorifics.js';

export const IDENTITY_KEY = 'clarenceIdentity';

// status : 'neuf' (jamais proposé) | 'configuré' | 'refusé' (« Plus tard » -
// on ne redemande pas, la modale reste accessible par le lien).
// Champs multi-valeurs : un terme par ligne, comme les zones « Toujours
// masquer » - même convention, même parsing.
// LES DEUX CHAMPS QUI PORTENT LE RISQUE, et qui suffisent à l'accueil.
//
// Onze champs demandés avant d'avoir rien obtenu, c'est un mur : la recherche
// sur l'inscription progressive dit de n'en demander qu'un ou deux, et de
// récolter le reste plus tard, au fil de l'usage.
//
// Ce sont ceux-là parce qu'ils sont les seuls que RIEN d'autre ne couvre.
// Emails, téléphones, IBAN et NIR sont déjà repérés par la couche déterministe
// - regex validées mathématiquement - sans que l'utilisateur déclare quoi que
// ce soit. Un nom, lui, dépend entièrement d'un modèle statistique, et le
// modèle rate (fuite mesurée sur un CV titré « LANDRY KAPGNEP »).
export const IDENTITY_ESSENTIELS = new Set(['prenom', 'nom']);

export const IDENTITY_FIELDS = [
  ['prenom', 'Prénom(s)'],
  ['nom', 'Nom(s) de famille'],
  ['emails', 'Emails'],
  ['telephones', 'Téléphones'],
  ['adresse', 'Adresse postale'],
  ['ville', 'Ville'],
  ['dateNaissance', 'Date de naissance'],
  ['employeurs', 'Employeur(s), entreprise(s)'],
  ['ecoles', 'École(s), université(s)'],
  ['pseudos', 'Pseudos, handles (GitHub, LinkedIn…)'],
  ['autres', 'Autres termes à toujours masquer']
];

const splitLines = v => String(v ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

// Normalisation défensive (storage édité à la main, versions futures).
export function normalizeIdentity(raw) {
  const champs = {};
  for (const [key] of IDENTITY_FIELDS) {
    champs[key] = splitLines(Array.isArray(raw?.champs?.[key])
      ? raw.champs[key].join('\n')
      : raw?.champs?.[key]);
  }
  const status = ['configuré', 'refusé'].includes(raw?.status) ? raw.status : 'neuf';
  return { status, champs };
}

// Termes de masquage issus de l'identité : liste plate, dédoublonnée
// (insensible à la casse), SANS les termes de moins de 2 caractères.
// Garde-fou indispensable : forcedMasks fait une recherche LITTÉRALE de
// chaque occurrence - une initiale isolée (« L ») masquerait une lettre sur
// deux du document. Deux caractères, c'est le minimum d'un vrai terme.
export const MIN_TERM_LENGTH = 2;
export function identityTerms(identity) {
  const { champs } = normalizeIdentity(identity);
  const vus = new Set();
  const out = [];
  for (const [key] of IDENTITY_FIELDS) {
    for (const terme of champs[key]) {
      if (terme.length < MIN_TERM_LENGTH) continue;
      const k = terme.toLowerCase();
      if (vus.has(k)) continue;
      vus.add(k);
      out.push(terme);
    }
  }
  return out;
}

// COMPOSANTS D'UN NOM MULTI-MOTS - le nom protège chacune de ses parties.
//
// LE DÉFAUT QUE ÇA CORRIGE (P12, trouvé sur un vrai casier judiciaire). Un
// formulaire officiel éclate le nom sur deux lignes : « Nom KAPGNEP » puis
// « Prénom(s) LANDRY ». Qui a saisi son nom complet dans une seule case ne
// voyait donc masquer NI l'un NI l'autre, puisque `forcedMasks` cherche la
// chaîne LITTÉRALE « Landry Kapgnep », qui n'apparaît nulle part sous cette
// forme. Le garde-fou déterministe - celui qui ne dépend d'aucun score - ne
// jouait pas dans le cas précis où il aurait été le plus utile.
//
// C'est la MÊME leçon que les pseudonymes par composant (03/08) : un nom
// existe entier ET en morceaux. Elle avait été appliquée à `pseudonyms.js`,
// jamais reportée ici.
//
// SEULEMENT LES CHAMPS DE NOMS, et c'est le point délicat. Décomposer une
// adresse (« 18 rue des Glycines ») masquerait « rue » et « des » dans tout le
// document ; décomposer un employeur (« Korrigane Labs ») masquerait « Labs ».
// Ces champs restent donc cherchés en entier. Un prénom ou un patronyme, lui,
// est un terme légitime à masquer seul, quel que soit son voisinage.
const CHAMPS_DECOMPOSABLES = ['prenom', 'nom'];

// Particules et civilités : liste et RÈGLE DE POSITION partagées avec
// pseudonyms.js (voir honorifics.js). « de » devant un nom ne désigne
// personne ; « Le » employé comme patronyme, si - d'où la position.
function composantsDeNom(identity) {
  const { champs } = normalizeIdentity(identity);
  const out = [];
  for (const cle of CHAMPS_DECOMPOSABLES) {
    for (const terme of champs[cle]) {
      const parts = terme.split(/\s+/).filter(Boolean);
      if (parts.length < 2) continue;      // déjà un composant unique
      parts.forEach((p, i) => {
        if (p.length < MIN_TERM_LENGTH) return;
        if (estComposantNonIdentifiant(p, i, parts.length)) return;
        out.push(p);
      });
    }
  }
  return out;
}

// Variantes de casse d'un terme : forcedMasks est LITTÉRAL, or l'utilisateur
// déclare « Landry Kapgnep » quand son CV affiche « LANDRY KAPGNEP » - le cas
// exact qui a motivé ce module. On génère donc, pour chaque terme déclaré :
// tel quel, MAJUSCULES, minuscules, et Casse Titre par mot. Déterministe,
// zéro coût moteur (quelques recherches littérales de plus).
function caseVariants(terme) {
  const title = terme.replace(/\p{L}[\p{L}'’-]*/gu,
    w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  return [terme, terme.toUpperCase(), terme.toLowerCase(), title];
}

// Termes de RECHERCHE réellement passés à forcedMasks : chaque terme déclaré
// développé en ses variantes de casse, dédoublonné (sensible à la casse ici,
// puisque la recherche l'est).
export function identitySearchTerms(identity) {
  const vus = new Set();
  const out = [];
  for (const terme of [...identityTerms(identity), ...composantsDeNom(identity)]) {
    for (const v of caseVariants(terme)) {
      if (vus.has(v)) continue;
      vus.add(v);
      out.push(v);
    }
  }
  return out;
}

// --- Accès chrome.storage.local (absent en Node → no-op sûr) ---------------
function hasStore() {
  return typeof chrome !== 'undefined' && chrome.storage?.local;
}

export async function loadIdentity() {
  if (!hasStore()) return normalizeIdentity(null);
  const r = await chrome.storage.local.get(IDENTITY_KEY).catch(() => ({}));
  return normalizeIdentity(r?.[IDENTITY_KEY]);
}

export async function saveIdentity(identity) {
  if (!hasStore()) return;
  await chrome.storage.local.set({ [IDENTITY_KEY]: normalizeIdentity(identity) }).catch(() => {});
}

// Effacement complet - l'utilisateur doit pouvoir tout retirer d'un geste.
export async function clearIdentity() {
  if (!hasStore()) return;
  await chrome.storage.local.remove(IDENTITY_KEY).catch(() => {});
}
