// Popup Clarence — source bundlée par build.mjs. Transformers.js n'est PLUS
// importé ici : il vit dans le worker NER (src/worker/ner-worker.js), ce qui
// libère le thread principal ET allège fortement ce bundle.
import { detectRegex } from '../engine/regex-detect.js';
import { detectPhonesIntl } from '../engine/phone-intl.js';
import { detectNER, NER_MODEL } from '../engine/ner.js';
import { detectGliner, GLINER_MODEL, TYPES_PEU_FIABLES } from '../engine/gliner.js';
import { mergeEntities } from '../engine/merge.js';
import { selectActive, entityKey, forcedMasks, filterByRules } from '../engine/selection.js';
import { createPseudonymizer } from '../engine/pseudonyms.js';
import { maskText, reinject } from '../engine/masking.js';
import { loadProfiles, upsertProfile, deleteProfile } from './profiles.js';
import {
  loadIdentity, saveIdentity, clearIdentity, identitySearchTerms, IDENTITY_FIELDS
} from './identity.js';

// --- État (mémoire du popup uniquement ; tout disparaît à la fermeture)
let currentText = '';
let autoEntities = [];    // sortie moteur (regex + NER fusionnés)
let manualEntities = [];  // ajouts manuels de l'utilisateur
let removedKeys = new Set(); // faux positifs retirés d'un clic
// Démarre avec les types PEU FIABLES décochés (voir TYPES_PEU_FIABLES) : le
// modèle ne les détecte pas, les laisser cochés serait de la fausse confiance.
let disabledTypes = new Set(TYPES_PEU_FIABLES);

// Libellés lisibles des types pour les puces de personnalisation.
const TYPE_DISPLAY = {
  PER: 'Noms', ORG: 'Entreprises', LOC: 'Lieux', EMAIL: 'Emails',
  TELEPHONE: 'Téléphones', IBAN: 'IBAN', CARTE_BANCAIRE: 'Cartes',
  NIR: 'NIR', SIRET_SIREN: 'SIRET/SIREN', CODE_POSTAL_VILLE: 'Code postal',
  MONTANT: 'Montants', ADRESSE: 'Adresses', DATE_NAISSANCE: 'Dates naiss.',
  REFERENCE: 'Références', IP: 'IP', MAC: 'MAC', BIC: 'BIC', PSEUDO: 'Pseudos/handles', DATE: 'Dates sensibles', ID_NATIONAL: 'ID nationaux',
  // Apportés par la détection zero-shot. Décocher un de ces types SAUTE
  // l'inférence correspondante (voir GROUPES dans engine/gliner.js) : on ne
  // paie que ce qu'on demande.
  POSTE: 'Postes', NATIONALITE: 'Nationalités',
  ETABLISSEMENT: 'Établissements', SANTE: 'Santé',
  MISC: 'Divers', PERSONNALISE: 'Perso'
};
const parseLines = v => (v || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
let nerPipe = null;
let nerLoading = false;
// Graine de session pour les pseudonymes réalistes : stable tant que la popup
// vit, jamais persistée.
const pseudoSeed = Math.random().toString(36).slice(2);

function maskOptions() {
  if (!$('realisticToggle')?.checked) return {};
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      // anti-collision : jamais un pseudo déjà présent dans le texte réel
      avoid: v => currentText.includes(v),
      locale: $('pseudoLocale')?.value || 'fr'
    })
  };
}
let lastMapping = [];      // table placeholder ↔ valeur du dernier masquage
let lastReinjected = '';   // texte désanonymisé complet (la preview peut être tronquée)
let overlayKind = null;    // 'annotated' | 'masked' | 'reinjected' | null — fenêtre flottante ouverte

// La table survit à la fermeture du popup via chrome.storage.session :
// en mémoire du navigateur uniquement, jamais sur disque ni synchronisée,
// effacée à la fermeture du navigateur. Nécessaire pour ré-injecter après
// être allé chercher la réponse du LLM.
chrome.storage?.session?.get('clarenceMapping').then(r => {
  if (Array.isArray(r?.clarenceMapping) && r.clarenceMapping.length && !lastMapping.length) {
    lastMapping = r.clarenceMapping;
  }
}).catch(() => {});

const $ = id => document.getElementById(id);

// Mode panneau : la popup tourne dans l'iframe injectée par le content script.
if (new URLSearchParams(location.search).has('panel')) {
  document.body.classList.add('panel-mode');
  document.documentElement.classList.add('panel-mode');
  document.documentElement.style.background = '#FFFAF2';
  // Annonce la hauteur réelle du bloc visuel pour que le panneau s'allonge
  // sans scroll (le content script plafonne à la hauteur de l'écran).
  const shell = document.querySelector('.popup-shell');
  const announce = () => window.parent.postMessage(
    { clarencePanelHeight: shell.offsetHeight }, '*');
  new ResizeObserver(announce).observe(shell);
  window.addEventListener('load', announce);
  // Assurance en plus du ResizeObserver : déplier un <details> change la
  // hauteur d'un coup. Le contenu se retrouvait coupé quand l'annonce partait
  // trop tard (thread principal occupé) ; on annonce explicitement au toggle,
  // et au tick suivant pour laisser le re-layout se terminer.
  document.addEventListener('toggle', () => {
    announce();
    setTimeout(announce, 0);
  }, true);
}
const keyOf = entityKey;
const esc = s => s.replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Les masques manuels ont priorité absolue ; les retraits s'appliquent aux
// détections automatiques uniquement (un ajout manuel se retire aussi d'un clic).
// Règles perso : « toujours masquer » (termes forcés), « ne jamais masquer »
// (valeurs épargnées) et types désactivés.
function activeEntities() {
  // Règles saisies + identité déclarée : l'identité s'AJOUTE, toujours.
  const forced = forcedMasks(currentText,
    [...parseLines($('alwaysMask')?.value), ...identityForceTerms()]);
  const sel = selectActive(autoEntities, [...manualEntities, ...forced], removedKeys);
  return filterByRules(sel, { disabledTypes, keepValues: parseLines($('alwaysKeep')?.value) });
}

// Puces de types : décocher un type le laisse visible (non masqué). Rendues de
// façon identique dans les deux modes — TOUS les types connus, tout de suite,
// sans attendre une analyse (décocher un type absent du texte est sans effet).
// `disabledSet` : le Set propre au mode (disabledTypes / fileDisabledTypes).
function renderTypeChips(boxId, disabledSet) {
  const box = $(boxId);
  if (!box) return;
  box.innerHTML = Object.entries(TYPE_DISPLAY)
    .filter(([t]) => t !== 'PERSONNALISE') // les masques manuels/forcés sont intouchables
    .map(([t, label]) => {
      const off = disabledSet.has(t);
      return `<label class="type-chip ${off ? 'off' : ''}"><input type="checkbox" data-type="${t}" ${off ? '' : 'checked'}><span class="square-checkbox" aria-hidden="true"></span><span class="checkbox-label-text">${esc(label)}</span></label>`;
    }).join('');
}
renderTypeChips('typeToggles', disabledTypes); // visibles dès l'ouverture, avant toute analyse

function annotateHTML(text, entities) {
  let html = '';
  let cursor = 0;
  for (const e of entities) {
    html += esc(text.slice(cursor, e.start));
    html += `<mark class="src-${e.source}" data-key="${keyOf(e)}" title="${e.type} — clic pour retirer">${esc(e.value)}</mark>`;
    cursor = e.end;
  }
  html += esc(text.slice(cursor));
  return html;
}

// Un panneau de sortie ne doit jamais scroller ni gonfler la fenêtre : au-delà
// de PREVIEW_LIMIT caractères on coupe avec « … » et un bouton « Voir tout »
// ouvre la version complète dans la fenêtre flottante (cf. overlay* ci-dessous).
const PREVIEW_LIMIT = 500;

function clipToLimit(text, entities, limit) {
  if (text.length <= limit) return { text, entities, truncated: false };
  const clipped = text.slice(0, limit);
  const kept = [];
  for (const e of entities) {
    if (e.start >= limit) break; // entities triées par start
    kept.push(e.end <= limit ? e : { ...e, end: limit, value: text.slice(e.start, limit) });
  }
  return { text: clipped, entities: kept, truncated: true };
}

function overlayContentFor(kind) {
  if (kind === 'annotated') {
    return { title: 'Détections complètes', html: annotateHTML(currentText, activeEntities()) };
  }
  if (kind === 'masked') {
    const { masked } = maskText(currentText, activeEntities(), maskOptions());
    return { title: 'Texte propre complet', text: masked, copy: () => navigator.clipboard.writeText(masked) };
  }
  if (kind === 'reinjected') {
    return { title: 'Réponse désanonymisée complète', text: lastReinjected, copy: () => navigator.clipboard.writeText(lastReinjected) };
  }
  return null;
}

function openOverlay(kind) {
  const data = overlayContentFor(kind);
  if (!data) return;
  overlayKind = kind;
  $('overlayTitle').textContent = data.title;
  if (data.html != null) $('overlayBody').innerHTML = data.html;
  else $('overlayBody').textContent = data.text;
  $('overlayCopyBtn').hidden = !data.copy;
  $('overlayCopyBtn').onclick = data.copy || null;
  $('overlay').hidden = false;
}

function closeOverlay() {
  overlayKind = null;
  $('overlay').hidden = true;
}

function refreshOverlayIfOpen() {
  if (overlayKind) openOverlay(overlayKind);
}

function render() {
  const entities = activeEntities();
  $('results').hidden = false;
  // Options avancées + désanonymisation : révélées seulement après une analyse
  // (UI initiale épurée). render() n'est appelé que post-analyse en mode texte.
  $('textOptions').hidden = false;
  $('reinjectSection').hidden = false;
  renderTypeChips('typeToggles', disabledTypes);

  const annPreview = clipToLimit(currentText, entities, PREVIEW_LIMIT);
  $('annotated').innerHTML = annotateHTML(annPreview.text, annPreview.entities) + (annPreview.truncated ? '…' : '');
  $('annotatedMoreBtn').hidden = !annPreview.truncated;

  const { masked, mapping } = maskText(currentText, entities, maskOptions());
  const maskedTruncated = masked.length > PREVIEW_LIMIT;
  $('masked').textContent = maskedTruncated ? masked.slice(0, PREVIEW_LIMIT) + '…' : masked;
  $('maskedMoreBtn').hidden = !maskedTruncated;
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {});

  $('mappingWrap').innerHTML = mapping.length
    ? `<table>${mapping.map(m =>
        `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td></tr>`
      ).join('')}</table>`
    : '<p>Aucun masque actif.</p>';

  $('status').textContent = entities.length
    ? `${entities.length} élément(s) masqué(s).`
    : 'Rien détecté — ajoute un masque manuel si besoin.';
  $('status').className = 'status';

  refreshOverlayIfOpen();
}

// Plafond MVP (cadrage §9 : « plafond raisonnable par prompt ») : garde le
// NER fiable et l'interface fluide.
const MAX_INPUT = 8000;

// Poids du modèle GLiNER (ONNX quantifié). Téléchargé une fois puis conservé
// dans la Cache API par le worker — ORT n'utilise pas le cache de
// Transformers.js, il fallait donc le gérer nous-mêmes.
const GLINER_MODEL_URL =
  `https://huggingface.co/${GLINER_MODEL}/resolve/main/onnx/model_quantized.onnx`;

// --- Worker de détection contextuelle : le modèle tourne hors du thread
// principal, sinon l'UI gèle pendant toute la détection (menus au contenu
// coupé, impression de plantage).
//
// DEUX moteurs derrière le même proxy. GLiNER (zero-shot) par défaut : il sait
// qualifier une valeur isolée sans phrase autour — cellule de tableau, nom en
// tête de CV — ce dont le NER BERT est incapable par construction. S'il ne
// démarre pas, on replie SILENCIEUSEMENT sur BERT : l'utilisateur garde une
// détection des noms, ce qui vaut mieux qu'un message d'erreur et rien.
// `detectNER`/`detectGliner` prennent leur pipeline en paramètre : le moteur
// pur reste inchangé, seul le proxy diffère.
let nerWorker = null;
let nerReqId = 0;
let nerEngine = null; // 'gliner' | 'bert' — moteur réellement actif
const nerPending = new Map();

function createNerWorker() {
  const worker = new Worker(chrome.runtime.getURL('popup/ner-worker.js'), { type: 'module' });
  worker.addEventListener('message', ev => {
    const msg = ev.data || {};
    if (msg.type === 'progress' && msg.total) {
      const pct = Math.round((msg.loaded / msg.total) * 100);
      setStatus(`Téléchargement du modèle… ${pct} % (une seule fois)`);
      // Le premier vrai temps d'attente, c'est ce téléchargement (~180 Mo) :
      // la barre du mode actif le montre aussi.
      const ratio = msg.loaded / msg.total;
      if (!$('fileMode')?.hidden) setFileProgress(ratio); else setTextProgress(ratio);
      return;
    }
    if (msg.type === 'result' || (msg.type === 'error' && msg.id != null)) {
      const p = nerPending.get(msg.id);
      if (!p) return;
      nerPending.delete(msg.id);
      // GLiNER renvoie des spans décodés, BERT des tokens bruts.
      msg.type === 'result' ? p.resolve(msg.spans ?? msg.tokens) : p.reject(new Error(msg.message));
    }
  });
  return worker;
}

// Démarre un worker sur un moteur donné. Rejette si l'init échoue.
function startEngine(engine) {
  const worker = createNerWorker();
  return new Promise((resolve, reject) => {
    const onInit = ev => {
      const msg = ev.data || {};
      if (msg.type === 'ready') {
        worker.removeEventListener('message', onInit);
        resolve(worker);
      } else if (msg.type === 'error' && msg.id == null) {
        worker.removeEventListener('message', onInit);
        worker.terminate(); // ne pas laisser un worker mort en mémoire
        reject(new Error(msg.message));
      }
    };
    worker.addEventListener('message', onInit);
    worker.addEventListener('error', e => {
      worker.terminate();
      reject(new Error(e.message || 'worker de détection indisponible'));
    });
    worker.postMessage({
      type: 'init',
      engine,
      wasmPath: chrome.runtime.getURL('vendor/'),
      model: engine === 'gliner' ? GLINER_MODEL : NER_MODEL,
      modelUrl: engine === 'gliner' ? GLINER_MODEL_URL : null
    });
  });
}

async function ensureNER() {
  if (nerPipe || nerLoading) return;
  nerLoading = true;
  setStatus('Chargement du modèle… (~180 Mo au premier usage)');
  try {
    let worker = null;
    try {
      worker = await startEngine('gliner');
      nerEngine = 'gliner';
    } catch (err) {
      // Repli silencieux : l'utilisateur n'a pas à connaître nos moteurs, il a
      // juste besoin que la détection des noms marche.
      console.warn('GLiNER indisponible, repli sur le NER BERT :', err);
      worker = await startEngine('bert');
      nerEngine = 'bert';
    }
    nerWorker = worker;
    // Proxy commun. GLiNER reçoit en plus les labels du groupe à chercher ;
    // BERT les ignore.
    nerPipe = (text, labels) => new Promise((resolve, reject) => {
      const id = ++nerReqId;
      nerPending.set(id, { resolve, reject });
      nerWorker.postMessage({ type: 'run', id, text, labels });
    });
  } catch (err) {
    console.error(err);
    // Le regex tourne quand même : mieux vaut un résultat partiel signalé
    // clairement qu'un blocage total sur une simple erreur réseau.
  } finally {
    nerLoading = false;
  }
}

// Fonction de détection du moteur ACTIF, avec la signature commune
// (text, pipeline, opts) attendue par anonymizeUnits/reconstructPdf.
// `disabledTypes` y sert à SAUTER des passes GLiNER entières (une passe = une
// inférence), pas seulement à filtrer après coup.
function contextualDetector() {
  return nerEngine === 'gliner' ? detectGliner : detectNER;
}

// Même chose pour le mode texte, où le pipeline est déjà connu.
function detectContextual(text, opts = {}) {
  if (!nerPipe) return [];
  return contextualDetector()(text, nerPipe, opts);
}

async function analyze() {
  const text = $('input').value;
  if (!text.trim()) return;
  if (text.length > MAX_INPUT) {
    setStatus(`Texte trop long (${text.length.toLocaleString('fr-FR')} caractères, max ${MAX_INPUT.toLocaleString('fr-FR')}). Découpe-le.`, 'error');
    return;
  }
  if (text !== currentText) { manualEntities = []; removedKeys = new Set(); }
  currentText = text;
  const btn = $('analyzeBtn');
  btn.disabled = true;
  setProcessing(true);
  try {
    await ensureNER();
    // Structuré = regex FR + téléphones internationaux (libphonenumber).
    const rx = [...detectRegex(text), ...detectPhonesIntl(text)];
    const ner = await detectContextual(text, {
      disabledTypes,
      onProgress: ({ done, total }) => {
        setTextProgress(total ? done / total : null);
        return new Promise(r => setTimeout(r, 0));
      }
    });
    autoEntities = mergeEntities(rx, ner);
    render();
    // Ne JAMAIS laisser croire que les noms/lieux ont été vérifiés alors que
    // seul le structuré (regex) a tourné, NI que le moteur complet a tourné
    // alors qu'on est retombé sur le moteur de secours.
    renderEngineBadge('engineBadge');
  } catch (err) {
    // Ne JAMAIS échouer en silence : l'utilisateur pourrait coller un texte
    // qu'il croit analysé.
    console.error(err);
    $('results').hidden = true;
    setStatus('Analyse échouée — rien n’a été masqué, ne colle pas ce texte. Détail dans la console.', 'error');
  } finally {
    setProcessing(false);
    setTextProgress(null);
    btn.disabled = false;
  }
}

function maskSelection() {
  const ta = $('input');
  const s = ta.selectionStart, e = ta.selectionEnd;
  if (ta.value !== currentText) {
    setStatus('Lance Analyser d’abord, puis sélectionne le passage.', 'error');
    return;
  }
  if (s === e) {
    setStatus('Sélectionne d’abord un passage dans la zone de texte.', 'error');
    return;
  }
  if (manualEntities.some(m => m.start === s && m.end === e)) {
    setStatus('Ce passage est déjà masqué.', 'error');
    return;
  }
  manualEntities.push({
    type: 'PERSONNALISE', value: currentText.slice(s, e),
    start: s, end: e, source: 'manuel'
  });
  render();
}

async function copyClean() {
  const { masked } = maskText(currentText, activeEntities(), maskOptions());
  await navigator.clipboard.writeText(masked);
  $('copyStatus').textContent = 'Copié — relis avant de coller.';
  $('copyStatus').className = 'status active';
  setTimeout(() => { $('copyStatus').textContent = ''; }, 4000);
}

function setStatus(msg, cls = '') {
  $('status').textContent = msg;
  $('status').className = 'status ' + cls;
}

// Quel moteur a RÉELLEMENT tourné. Affiché seulement quand ce n'est pas le
// moteur nominal : en fonctionnement normal un badge permanent deviendrait du
// bruit qu'on cesse de lire, alors que c'est précisément le repli qui doit
// alerter — il change ce que l'outil sait détecter (les valeurs isolées sans
// contexte, cellules de tableau et titres de CV, ne le sont plus).
const ENGINE_MESSAGES = {
  bert: {
    cls: 'fallback',
    texte: 'Détection de secours active — le moteur principal n\'a pas pu démarrer. '
         + 'Les noms isolés sans phrase autour (titre de CV, cellule de tableau) risquent d\'être manqués. Relis attentivement.'
  },
  none: {
    cls: 'none',
    texte: 'Détection des noms INDISPONIBLE — seules les données structurées '
         + '(emails, IBAN, téléphones…) ont été repérées. Relis attentivement avant de coller.'
  }
};

function renderEngineBadge(id) {
  const el = $(id);
  if (!el) return;
  const etat = !nerPipe ? 'none' : (nerEngine === 'bert' ? 'bert' : null);
  if (!etat) { el.hidden = true; el.textContent = ''; return; }
  el.hidden = false;
  el.className = 'engine-badge ' + ENGINE_MESSAGES[etat].cls;
  el.textContent = ENGINE_MESSAGES[etat].texte;
}

$('analyzeBtn').addEventListener('click', analyze);
$('realisticToggle').addEventListener('change', () => { if (currentText) render(); });

// Règles de masquage personnalisé : ré-appliquées à chaque changement.
// null-safe (?.) : ces éléments font partie du menu « Personnaliser » ; s'ils
// manquent (édition partielle du HTML), on ne doit PAS casser tout le reste
// de la popup (bascule de mode, mode Fichier…) sur une exception.
$('alwaysMask')?.addEventListener('input', () => { if (currentText) render(); });
$('alwaysKeep')?.addEventListener('input', () => { if (currentText) render(); });
$('typeToggles')?.addEventListener('change', ev => {
  const cb = ev.target.closest('input[data-type]');
  if (!cb) return;
  if (cb.checked) disabledTypes.delete(cb.dataset.type);
  else disabledTypes.add(cb.dataset.type);
  // Les puces sont visibles avant toute analyse : ne re-masquer que si un
  // texte a déjà été analysé, sinon juste refléter l'état coché/décoché.
  if (currentText) render();
  else renderTypeChips('typeToggles', disabledTypes);
});
$('maskSelBtn').addEventListener('click', maskSelection);
$('copyBtn').addEventListener('click', copyClean);
$('toggleReinjectBtn').addEventListener('click', () => {
  const zone = $('reinjectZone');
  zone.hidden = !zone.hidden;
  $('toggleReinjectBtn').textContent = zone.hidden
    ? 'Désanonymiser une réponse…'
    : 'Masquer la désanonymisation';
});

$('reinjectBtn').addEventListener('click', () => {
  const txt = $('reinjectInput').value;
  if (!txt.trim()) return;
  const st = $('reinjectStatus');
  if (!lastMapping.length) {
    st.textContent = 'Aucune correspondance en mémoire — analyse un texte d’abord.';
    st.className = 'status error';
    return;
  }
  const found = lastMapping.filter(m => txt.includes(m.placeholder)).length;
  lastReinjected = reinject(txt, lastMapping);
  const truncated = lastReinjected.length > PREVIEW_LIMIT;
  $('reinjected').hidden = false;
  $('reinjected').textContent = truncated ? lastReinjected.slice(0, PREVIEW_LIMIT) + '…' : lastReinjected;
  $('reinjectedMoreBtn').hidden = !truncated;
  $('copyReinjectBtn').hidden = false;
  st.textContent = found
    ? `${found} placeholder(s) restitué(s).`
    : 'Aucun placeholder connu dans ce texte (la table correspond à la dernière anonymisation).';
  st.className = 'status ' + (found ? 'active' : 'error');
  refreshOverlayIfOpen();
});

$('copyReinjectBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(lastReinjected);
  const st = $('reinjectStatus');
  st.textContent = 'Copié.';
  st.className = 'status active';
});

// Délégation sur document : les surlignages existent à la fois dans les
// panneaux (aperçus tronqués) et dans la fenêtre flottante (version complète).
document.addEventListener('click', ev => {
  const mark = ev.target.closest('mark');
  if (!mark) return;
  removedKeys.add(mark.dataset.key);
  render();
});

for (const [btnId, kind] of [
  ['annotatedMoreBtn', 'annotated'],
  ['maskedMoreBtn', 'masked'],
  ['reinjectedMoreBtn', 'reinjected']
]) {
  $(btnId).addEventListener('click', () => openOverlay(kind));
}
$('overlayCloseBtn').addEventListener('click', closeOverlay);
$('overlay').addEventListener('click', ev => { if (ev.target === $('overlay')) closeOverlay(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && overlayKind) closeOverlay(); });

// ===== Mode Fichier (CSV / XLSX / DOCX) ====================================
// Les adaptateurs (+ xlsx ~980 Ko) sont chargés en dynamique : le mode texte
// gratuit reste léger, ce poids n'arrive qu'ici. Tout reste 100% local.
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo : garde le NER et l'UI fluides (pas de worker en MV3)
const FILE_TYPES = {
  csv:  { mime: 'text/csv;charset=utf-8', text: true, load: () => import('../files/csv-adapter.js') },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', text: false, load: () => import('../files/xlsx-adapter.js') },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', text: false, load: () => import('../files/docx-adapter.js') },
  // PDF : seul format dont la sortie n'est pas une réécriture du fichier
  // d'origine mais un nouveau document (.md) — outExt gère ce cas particulier
  // dans processFile() (nom de fichier ET extension de sortie changent).
  pdf:  { mime: 'text/markdown;charset=utf-8', text: false, load: () => import('../files/pdf-adapter.js'), outExt: '.md' },
  // Images : metadataOnly → processFile() court-circuite le pipeline de
  // détection/masquage (une image n'a pas d'unités PII textuelles) et appelle
  // uniquement stripMetadata (re-encodage canvas, retire EXIF/GPS/chunks).
  jpg:  { mime: 'image/jpeg', text: false, metadataOnly: true, load: () => import('../files/image-adapter.js') },
  jpeg: { mime: 'image/jpeg', text: false, metadataOnly: true, load: () => import('../files/image-adapter.js') },
  png:  { mime: 'image/png',  text: false, metadataOnly: true, load: () => import('../files/image-adapter.js') }
};

let chosenFile = null;
let fileOutBlob = null;
let fileOutName = '';
let fileDisabledTypes = new Set(TYPES_PEU_FIABLES); // idem, mode Fichier

// Puces du mode Fichier : mêmes puces statiques (fonction partagée), cochées
// par défaut, réglables AVANT de traiter (le flux fichier est en un clic).
renderTypeChips('fileTypeToggles', fileDisabledTypes);

$('fileTypeToggles')?.addEventListener('change', ev => {
  const cb = ev.target.closest('input[data-type]');
  if (!cb) return;
  if (cb.checked) fileDisabledTypes.delete(cb.dataset.type);
  else fileDisabledTypes.add(cb.dataset.type);
  renderTypeChips('fileTypeToggles', fileDisabledTypes);
  invalidateFileResult();
});

// Un résultat de fichier ne vaut QUE pour les options avec lesquelles il a été
// produit. Sans cette invalidation, changer « Alléger » ↔ « Préserver » après
// coup puis retélécharger redonnait silencieusement l'ANCIEN fichier : on
// croit tenir un Markdown sans images et on tient un PDF qui les contient
// toutes. C'est une fuite, pas une gêne — d'où l'effacement du résultat plutôt
// qu'un simple avertissement.
function invalidateFileResult() {
  if (!fileOutBlob) return;
  fileOutBlob = null;
  fileOutName = '';
  $('fileResults').hidden = true;
  $('dragCard').hidden = true;
  fileSetStatus('Options modifiées — relance l’anonymisation.');
}

// Toutes les options qui changent la SORTIE invalident le résultat.
for (const id of ['pdfModeLight', 'pdfModePreserve', 'fileRealisticToggle', 'filePseudoLocale']) {
  $(id)?.addEventListener('change', invalidateFileResult);
}
for (const id of ['fileAlwaysMask', 'fileAlwaysKeep']) {
  $(id)?.addEventListener('input', invalidateFileResult);
}

function fileSetStatus(msg, cls = '') {
  $('fileStatus').textContent = msg;
  $('fileStatus').className = 'status ' + cls;
}

function extOf(name) {
  const m = /\.([^.]+)$/.exec(name);
  return m ? m[1].toLowerCase() : '';
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function setChosenFile(file) {
  if (!file) return;
  const ext = extOf(file.name);
  if (!FILE_TYPES[ext]) {
    fileSetStatus('Format non pris en charge. Accepté : CSV, XLSX, DOCX, PDF, JPG/PNG.', 'error');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    fileSetStatus(`Fichier trop lourd (${humanSize(file.size)}, max ${humanSize(MAX_FILE_BYTES)}).`, 'error');
    return;
  }
  chosenFile = file;
  fileOutBlob = null;
  const fileNameEl = $('fileName');
  const fileMainEl = fileNameEl?.querySelector('.file-name-main');
  const fileExtEl = fileNameEl?.querySelector('.file-name-ext');
  const lastDot = file.name.lastIndexOf('.');
  if (fileMainEl && fileExtEl) {
    if (lastDot > 0 && lastDot < file.name.length - 1) {
      const ext = file.name.slice(lastDot + 1).toLowerCase();
      fileMainEl.textContent = file.name.slice(0, lastDot);
      fileExtEl.textContent = `.${ext}`;
      fileExtEl.hidden = false;
      fileExtEl.className = `file-name-ext file-name-ext--${ext}`;
    } else {
      fileMainEl.textContent = file.name;
      fileExtEl.textContent = '';
      fileExtEl.hidden = true;
      fileExtEl.className = 'file-name-ext';
    }
  } else {
    fileNameEl.textContent = file.name;
  }
  $('fileSize').textContent = humanSize(file.size);
  $('fileChosen').hidden = false;
  // Options (pseudonymes/personnaliser) : révélées dès qu'un fichier est
  // choisi — elles doivent être réglées AVANT le traitement (flux en un clic),
  // contrairement au mode texte où elles se règlent après l'analyse. Sans objet
  // pour une image (metadataOnly : pas de détection de texte) → masquées.
  $('fileOptions').hidden = !!FILE_TYPES[ext].metadataOnly;
  $('pdfModeChoice').hidden = ext !== 'pdf'; // choix Alléger/Préserver : PDF seul
  $('fileAnalyzeBtn').textContent = FILE_TYPES[ext].metadataOnly
    ? 'Nettoyer les métadonnées' : 'Anonymiser le fichier';
  $('fileResults').hidden = true;
  fileSetStatus('');
}

// units optionnel : le chemin PDF « Préserver » (reconstructPdf) extrait ses
// propres unités en interne, on ne les a pas encore ici — la vérification
// anti-collision porte alors sur une chaîne vide (dégradé, pas cassé).
function fileMaskOptions(units = []) {
  if (!$('fileRealisticToggle')?.checked) return {};
  const joined = units.map(u => u.text).join('\n');
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      avoid: v => joined.includes(v),
      locale: $('filePseudoLocale')?.value || 'fr'
    })
  };
}

// Affichage partagé du résultat fichier (chemin standard ET reconstruction PDF).
// copyable : la sortie est-elle du texte copiable (md/csv) vs binaire (pdf/xlsx/docx).
function showFileResults(mapping, copyable) {
  lastMapping = mapping;
  chrome.storage?.session?.set({ clarenceMapping: mapping }).catch(() => {});
  $('fileMappingWrap').innerHTML = mapping.length
    ? `<table>${mapping.map(m =>
        `<tr><td class="mono">${esc(m.placeholder)}</td><td class="mono">${esc(m.value)}</td></tr>`
      ).join('')}</table>`
    : '<p>Aucun masque actif.</p>';
  $('fileSummary').textContent = mapping.length
    ? `${mapping.length} valeur(s) distincte(s) masquée(s), métadonnées nettoyées.`
    : 'Aucune donnée sensible détectée — métadonnées nettoyées.';
  $('fileSummary').className = 'status active';
  $('fileResults').hidden = false;
  $('fileCopyBtn').hidden = !copyable;
  $('reinjectSection').hidden = false;
  $('dragCard').hidden = !document.body.classList.contains('panel-mode');
}

// Loader "vaguelettes" dans le bouton pendant le traitement : le NER + la
// reconstruction PDF tournent sur le thread principal (pas de worker, contrainte
// CSP MV3) et peuvent prendre plusieurs secondes sur un gros fichier — sans
// signal visible, l'utilisateur croit que c'est planté et abandonne.
// Avancement chiffré du NER : sans lui, l'utilisateur ne sait pas si ça
// progresse ou si c'est figé (il interrompait le traitement — constaté).
// Un await yield laisse le navigateur repeindre entre deux fenêtres, sinon le
// thread principal reste bloqué et le statut ne s'affiche jamais.
// Barre de progression : trackId selon le mode actif. ratio ∈ [0,1] ou null
// pour masquer. Le texte chiffré reste (accessibilité + précision), la barre
// porte la sensation d'avancement.
function setProgress(trackId, fillId, ratio) {
  const track = $(trackId);
  const fill = $(fillId);
  if (!track || !fill) return;
  if (ratio == null) { track.hidden = true; fill.style.transform = 'scaleX(0)'; return; }
  track.hidden = false;
  fill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}
const setFileProgress = r => setProgress('fileProgress', 'fileProgressFill', r);
const setTextProgress = r => setProgress('textProgress', 'textProgressFill', r);

const nerProgress = ({ done, total }) => {
  fileSetStatus(`Détection en cours… ${done}/${total}`);
  setFileProgress(total ? done / total : null);
  return new Promise(r => setTimeout(r, 0));
};

// ===== Grille de lettres (fond de toute la popup) =====
// Des blobs de lampe à lave (champ de métaballs) remplissent la popup ; ils
// dérivent, fusionnent et se séparent. Deux garde-fous rendent le fond
// compatible avec une UI dense, parce qu'un motif à fort contraste placé
// derrière du texte le rend illisible :
//   1. AUCUNE case n'est peinte derrière un élément d'interface. Les boîtes
//      des éléments porteurs de contenu sont relevées et converties en une
//      grille d'occupation ; le blob coule autour, comme si l'UI était
//      découpée dedans. C'est ce qui règle « les carrés recouvrent des
//      éléments » — les masquer par transparence seule ne suffisait pas.
//   2. La couche entière est atténuée en CSS (--letter-bg-opacity) : même
//      dans les vides, le motif doit rester une texture, pas un sujet.
// Le pattern est tiré UNE fois, pour une hauteur virtuelle large : la popup
// grandit (résultats qui s'affichent) sans jamais rejouer le tirage, elle
// révèle simplement une portion déjà décidée du motif.
const LETTER_GRID_LETTERS = ['c', 'l', 'a', 'r', 'e', 'n'];
const LETTER_GRID_CELL = 16;
const LETTER_GRID_FONT_PX = 9;
const LETTER_GRID_TICK_MS = 300;
const LETTER_GRID_VIRTUAL_PX = 1800;    // hauteur de motif générée d'avance, en px
const LETTER_GRID_ROWS_PER_BLOB = 4.5;  // densité : une boule toutes les N lignes de cases
const LETTER_GRID_R = [2.4, 4.6];       // rayon d'une boule, en cases
const LETTER_GRID_THRESHOLD = 0.34;     // seuil du champ : au-delà, la case est dans un blob
const LETTER_GRID_JITTER = 0.22;        // irrégularité du bord — assez pour être rongé, pas pour détacher des cases
const LETTER_GRID_STRAY_COUNT = [4, 7];
const LETTER_GRID_DRIFT_MAX = 0.10;     // cases / tick, vitesse plafond pendant le traitement
const LETTER_GRID_DRIFT_ACCEL = 0.03;   // cases / tick², bruit appliqué à la vitesse (pas à la position)
const LETTER_GRID_DRIFT_RANGE = 1.40;   // cases, écart max à la maison
const LETTER_GRID_EASE = 0.22;          // fraction de l'écart comblée par tick, au repos
// Marge d'évidement autour du texte, en px. À 0 le motif vient au contact :
// toute valeur > 0 dessine un liseré vide régulier autour de chaque ligne, qui
// se lit comme une bordure soulignant l'UI — exactement ce qu'on ne veut pas.
const LETTER_GRID_CLEAR_PAD = 0;

const LETTER_GRID_OPAQUE_A = 0.85;      // alpha à partir duquel un fond masque déjà le motif

// Coloration passagère : toutes les ~3 s (intervalle irrégulier), quelques
// cases prennent une couleur d'accent du thème puis reviennent. Les teintes
// sont lues dans le CSS, pas codées en dur : le fond suit la palette si elle
// change.
const LETTER_GRID_TINT_VARS = ['--seal-lit', '--moss', '--tan', '--paper-dim'];
const LETTER_GRID_TINT_TARGET = 'cell'; // 'cell' = le fond de la case, 'letter' = la lettre
const LETTER_GRID_TINT_EVERY_MS = [1600, 4400];
const LETTER_GRID_TINT_CELLS = [1, 3];
const LETTER_GRID_TINT_LIFE_MS = [600, 1800];
// Pendant le traitement la coloration s'emballe : plus fréquente, plus de
// cases, qui tiennent plus longtemps — donc elles se chevauchent au lieu de
// se succéder. Le plafond MAX_SHARE garde malgré tout le noir majoritaire :
// sans lui les teintes finissent par se cumuler jusqu'à recouvrir le motif,
// et l'effet « lettres qui s'allument » devient un aplat de couleur.
const LETTER_GRID_TINT_BUSY_EVERY_MS = [280, 900];
const LETTER_GRID_TINT_BUSY_CELLS = [3, 7];
const LETTER_GRID_TINT_BUSY_LIFE_MS = [900, 2400];
const LETTER_GRID_TINT_MAX_SHARE = 0.3;  // part maximale de cases colorées

let letterGridCanvas = null;
let letterGridCtx = null;
let letterGridTimer = null;
let letterGridCols = 0;
let letterGridRows = 0;        // lignes actuellement visibles
let letterGridSeed = 0;
let letterGridBalls = null;    // [{ x0, y0, x, y, vx, vy, r }] — (x0,y0) = position maison
let letterGridStrays = null;   // [{ col, row, letter }], positions fixes pour la session
let letterGridBlocked = null;  // Set de "col,row" occupés par l'UI
let letterGridCellFill = '#000105';
let letterGridLetterFill = '#FFFFFF';
let letterGridPalette = [];    // teintes d'accent relues dans le CSS
let letterGridTints = new Map(); // "col,row" -> { color, until }
let letterGridPainted = [];    // cases peintes au dernier rendu, pour y tirer les teintes
let letterGridNextTint = 0;

function letterGridRandLetter(exclude) {
  let l;
  do { l = LETTER_GRID_LETTERS[(Math.random() * LETTER_GRID_LETTERS.length) | 0]; }
  while (l === exclude);
  return l;
}

function letterGridHash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) / 4294967295) * 2 - 1; // [-1, 1]
}

// Vrai si la case est dans la matière à l'instant courant. Noyau à support
// compact (k²) plutôt que le 1/d² habituel des métaballs : la traîne infinie
// du 1/d² fait que des boules qui se recouvrent saturent toute la surface —
// on obtenait un pavé plein quel que soit le seuil. Ici l'influence d'une
// boule s'arrête net à son rayon, donc la silhouette est pilotable.
function letterGridMask(cx, cy) {
  let field = 0;
  for (const b of letterGridBalls) {
    const dx = (cx - b.x) / b.r, dy = (cy - b.y) / b.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1) { const k = 1 - d2; field += k * k; }
  }
  return field + letterGridHash(cx, cy, letterGridSeed) * LETTER_GRID_JITTER > LETTER_GRID_THRESHOLD;
}

function letterGridBuildBalls(cols, rowsVirtual) {
  const n = Math.max(3, Math.round(rowsVirtual / LETTER_GRID_ROWS_PER_BLOB));
  const [rmin, rmax] = LETTER_GRID_R;
  const balls = [];
  for (let i = 0; i < n; i++) {
    const x0 = Math.random() * cols;
    const y0 = Math.random() * rowsVirtual;
    balls.push({ x0, y0, x: x0, y: y0, vx: 0, vy: 0, r: rmin + Math.random() * (rmax - rmin) });
  }
  return balls;
}

// Un point dissident occupe une case hors matière ET à l'écart de celle-ci :
// une case simplement accolée au bord se lirait comme une aspérité du contour,
// pas comme un point détaché.
function letterGridStrayIsFree(col, row, strays) {
  if (letterGridMask(col, row)) return false;
  if (strays.some(s => s.col === col && s.row === row)) return false;
  for (let dc = -2; dc <= 2; dc++) {
    for (let dr = -2; dr <= 2; dr++) {
      if (letterGridMask(col + dc, row + dr)) return false;
    }
  }
  return true;
}

function letterGridBuildStrays(cols, rowsVirtual) {
  const [min, max] = LETTER_GRID_STRAY_COUNT;
  const target = min + ((Math.random() * (max - min + 1)) | 0);
  const strays = [];
  let attempts = 0;
  while (strays.length < target && attempts < target * 120) {
    attempts++;
    const col = (Math.random() * cols) | 0;
    const row = (Math.random() * rowsVirtual) | 0;
    if (!letterGridStrayIsFree(col, row, strays)) continue;
    strays.push({ col, row, letter: letterGridRandLetter() });
  }
  return strays;
}

function letterGridIsOpaque(el) {
  const m = /^rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
  if (!m) return false;
  const parts = m[1].split(',').map(parseFloat);
  return (parts.length > 3 ? parts[3] : 1) >= LETTER_GRID_OPAQUE_A;
}

// Marque les cases où le motif nuirait à la lecture. On ne protège QUE l'encre
// posée sur fond transparent : un élément au fond opaque (textarea, panneau,
// bouton plein) est au-dessus du canvas et masque déjà le motif — le bloquer
// en plus ne gagnerait rien et coûterait de la surface.
//
// Et on relève les rectangles du TEXTE, pas les boîtes des éléments. La popup
// est une pile de blocs pleine largeur : bloquer les boîtes revenait à évincer
// le motif de 99 % de la surface (mesuré), alors qu'une ligne de texte courte
// n'occupe qu'une fraction de sa boîte. C'est ce qui laisse au blob de quoi
// exister entre et autour des lignes.
//
// Recalculé au changement de gabarit seulement (cf. ResizeObserver) : c'est
// une lecture de layout, hors de question de la refaire à chaque tick.
function letterGridComputeBlocked(host, cellCss) {
  const blocked = new Set();
  const wrap = document.querySelector('.wrap');
  if (!wrap) return blocked;
  const base = host.getBoundingClientRect();
  const pad = LETTER_GRID_CLEAR_PAD;

  const add = r => {
    if (r.width <= 0 || r.height <= 0) return;
    const c0 = Math.floor((r.left - base.left - pad) / cellCss);
    const c1 = Math.ceil((r.right - base.left + pad) / cellCss);
    const r0 = Math.floor((r.top - base.top - pad) / cellCss);
    const r1 = Math.ceil((r.bottom - base.top + pad) / cellCss);
    for (let col = c0; col < c1; col++) {
      for (let row = r0; row < r1; row++) blocked.add(col + ',' + row);
    }
  };

  // On s'arrête AVANT .wrap : son fond à elle est peint sous le canvas, il ne
  // masque donc rien, contrairement à celui d'un élément de contenu.
  const opaque = new Map();
  const hidden = node => {
    for (let el = node.parentElement; el && el !== wrap; el = el.parentElement) {
      if (el.id === 'letterBg') return true;
      let v = opaque.get(el);
      if (v === undefined) { v = letterGridIsOpaque(el); opaque.set(el, v); }
      if (v) return true;
    }
    return false;
  };

  const walker = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim() || hidden(n)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) add(r);
  }
  // Le logo et les pictos : graphiques à fond transparent, donc à protéger
  // comme du texte.
  for (const img of wrap.querySelectorAll('img')) {
    if (!hidden(img)) add(img.getBoundingClientRect());
  }
  return blocked;
}

function letterGridPaintCell(col, row, letter, cellPx, tint) {
  const ctx = letterGridCtx;
  const x = col * cellPx, y = row * cellPx;
  ctx.fillStyle = tint && LETTER_GRID_TINT_TARGET === 'cell' ? tint : letterGridCellFill;
  ctx.fillRect(x, y, cellPx, cellPx);
  ctx.fillStyle = tint && LETTER_GRID_TINT_TARGET === 'letter' ? tint : letterGridLetterFill;
  ctx.fillText(letter, x + cellPx / 2, y + cellPx / 2 + 1);
}

function letterGridTintOf(key, now) {
  const t = letterGridTints.get(key);
  return t && t.until > now ? t.color : null;
}

// Tire les prochaines cases colorées quand l'échéance est atteinte, puis fixe
// l'échéance suivante. L'intervalle est retiré à chaque fois : un setInterval
// donnerait une pulsation régulière, or c'est justement l'irrégularité qui
// fait que l'œil ne l'anticipe pas. On pioche dans les cases réellement
// peintes au rendu précédent — colorer une case vide ne se verrait pas.
function letterGridScheduleTints(now, processing) {
  if (now < letterGridNextTint) return;
  const [every0, every1] = processing ? LETTER_GRID_TINT_BUSY_EVERY_MS : LETTER_GRID_TINT_EVERY_MS;
  letterGridNextTint = now + every0 + Math.random() * (every1 - every0);

  for (const [key, t] of letterGridTints) {
    if (t.until <= now) letterGridTints.delete(key);
  }
  if (!letterGridPainted.length || !letterGridPalette.length) return;

  const [cmin, cmax] = processing ? LETTER_GRID_TINT_BUSY_CELLS : LETTER_GRID_TINT_CELLS;
  const [life0, life1] = processing ? LETTER_GRID_TINT_BUSY_LIFE_MS : LETTER_GRID_TINT_LIFE_MS;
  const room = Math.floor(letterGridPainted.length * LETTER_GRID_TINT_MAX_SHARE) - letterGridTints.size;
  const n = Math.min(cmin + ((Math.random() * (cmax - cmin + 1)) | 0), room);
  for (let i = 0; i < n; i++) {
    letterGridTints.set(letterGridPainted[(Math.random() * letterGridPainted.length) | 0], {
      color: letterGridPalette[(Math.random() * letterGridPalette.length) | 0],
      until: now + life0 + Math.random() * (life1 - life0),
    });
  }
}

function letterGridRedraw() {
  const cellPx = letterGridCanvas.width / letterGridCols;
  const now = performance.now();
  letterGridCtx.clearRect(0, 0, letterGridCanvas.width, letterGridCanvas.height);
  letterGridPainted.length = 0;
  for (let col = 0; col < letterGridCols; col++) {
    for (let row = 0; row < letterGridRows; row++) {
      const key = col + ',' + row;
      if (letterGridBlocked.has(key)) continue;
      if (!letterGridMask(col, row)) continue;
      letterGridPainted.push(key);
      letterGridPaintCell(col, row, letterGridRandLetter(), cellPx, letterGridTintOf(key, now));
    }
  }
  for (const s of letterGridStrays) {
    if (s.row >= letterGridRows) continue;
    const key = s.col + ',' + s.row;
    if (letterGridBlocked.has(key)) continue;
    letterGridPainted.push(key);
    s.letter = letterGridRandLetter(s.letter);
    letterGridPaintCell(s.col, s.row, s.letter, cellPx, letterGridTintOf(key, now));
  }
}

// Déplace une boule d'un tick. Pendant le traitement : la vitesse dérive par
// petits pas (accélération aléatoire bornée), jamais la position directement
// — c'est ce qui donne un mouvement continu plutôt que des sauts. Chaque boule
// reste tenue en laisse autour de sa maison (DRIFT_RANGE, avec rebond sur la
// limite), sinon elles finiraient toutes par se rassembler ou sortir du cadre.
// Au repos : retour exponentiel vers la maison, jusqu'à s'y superposer pile.
function letterGridStepBall(b, processing) {
  if (processing) {
    b.vx += (Math.random() * 2 - 1) * LETTER_GRID_DRIFT_ACCEL;
    b.vy += (Math.random() * 2 - 1) * LETTER_GRID_DRIFT_ACCEL;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > LETTER_GRID_DRIFT_MAX) {
      b.vx = (b.vx / speed) * LETTER_GRID_DRIFT_MAX;
      b.vy = (b.vy / speed) * LETTER_GRID_DRIFT_MAX;
    }
    b.x += b.vx;
    b.y += b.vy;
    const R = LETTER_GRID_DRIFT_RANGE;
    if (b.x < b.x0 - R) { b.x = b.x0 - R; b.vx = Math.abs(b.vx); }
    if (b.x > b.x0 + R) { b.x = b.x0 + R; b.vx = -Math.abs(b.vx); }
    if (b.y < b.y0 - R) { b.y = b.y0 - R; b.vy = Math.abs(b.vy); }
    if (b.y > b.y0 + R) { b.y = b.y0 + R; b.vy = -Math.abs(b.vy); }
  } else {
    b.vx = 0; b.vy = 0;
    b.x += (b.x0 - b.x) * LETTER_GRID_EASE;
    b.y += (b.y0 - b.y) * LETTER_GRID_EASE;
    if (Math.abs(b.x0 - b.x) < 0.02 && Math.abs(b.y0 - b.y) < 0.02) { b.x = b.x0; b.y = b.y0; }
  }
}

function letterGridTick() {
  const processing = document.body.classList.contains('processing');
  for (const b of letterGridBalls) letterGridStepBall(b, processing);
  letterGridScheduleTints(performance.now(), processing);
  letterGridRedraw();
}

// Redimensionne le canvas sur la boîte courante de .wrap et relit l'occupation
// de l'UI. Le motif lui-même n'est PAS rejoué : les boules gardent leur
// position maison, on découvre seulement plus (ou moins) de lignes.
function letterGridResize() {
  const host = $('letterBg');
  if (!host || !letterGridCanvas) return;
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;

  // Tout se calcule en pixels device : dpr fractionnaire (1.25, 1.5…) sinon
  // les cases retombent sur des pixels device fractionnaires malgré des
  // coordonnées CSS entières, ce qui laisse un interstice d'un sous-pixel
  // entre cases adjacentes (constaté à l'écran).
  const dpr = window.devicePixelRatio || 1;
  const cellPx = Math.round(LETTER_GRID_CELL * dpr);
  letterGridCols = Math.ceil((w * dpr) / cellPx);
  letterGridRows = Math.ceil((h * dpr) / cellPx);
  letterGridCanvas.width = letterGridCols * cellPx;
  letterGridCanvas.height = letterGridRows * cellPx;
  letterGridCanvas.style.width = letterGridCanvas.width / dpr + 'px';
  letterGridCanvas.style.height = letterGridCanvas.height / dpr + 'px';

  // Redimensionner un canvas réinitialise son contexte : police et alignement
  // sont à reposer, sinon le texte repart en 10px sans-serif calé en haut à
  // gauche.
  const css = getComputedStyle(document.body);
  letterGridCtx.textAlign = 'center';
  letterGridCtx.textBaseline = 'middle';
  letterGridCtx.font = `${Math.round(LETTER_GRID_FONT_PX * dpr)}px ${css.fontFamily}`;
  letterGridCellFill = css.getPropertyValue('--seal').trim() || '#000105';
  letterGridLetterFill = css.getPropertyValue('--paper').trim() || '#FFFFFF';
  letterGridPalette = LETTER_GRID_TINT_VARS
    .map(v => css.getPropertyValue(v).trim())
    .filter(Boolean);

  letterGridBlocked = letterGridComputeBlocked(host, cellPx / dpr);
  letterGridRedraw();
}

function letterGridMount() {
  const host = $('letterBg');
  if (!host || !host.clientWidth) return;

  letterGridCanvas = document.createElement('canvas');
  host.appendChild(letterGridCanvas);
  letterGridCtx = letterGridCanvas.getContext('2d');
  // Deux couches distinctes AU-DESSUS du canvas, dans cet ordre : les halos
  // colorés (visibles partout), puis le flou (masqué autour du curseur).
  // Elles étaient confondues en un seul élément, ce qui rendait impossible de
  // masquer l'un sans faire disparaître l'autre.
  for (const id of ['letterBgGlow', 'letterBgBlur']) {
    if (!host.querySelector('#' + id)) {
      const couche = document.createElement('div');
      couche.id = id;
      host.appendChild(couche);
    }
  }

  const dpr = window.devicePixelRatio || 1;
  const cellPx = Math.round(LETTER_GRID_CELL * dpr);
  const cols = Math.ceil((host.clientWidth * dpr) / cellPx);
  const rowsVirtual = Math.ceil(LETTER_GRID_VIRTUAL_PX / LETTER_GRID_CELL);

  letterGridSeed = (Math.random() * 1e6) | 0;
  letterGridBalls = letterGridBuildBalls(cols, rowsVirtual);
  letterGridStrays = letterGridBuildStrays(cols, rowsVirtual);
  letterGridResize();

  // La popup change de gabarit sans arrêt (résultats, <details>, bascule de
  // mode) : sans ça le canvas garderait la taille d'ouverture et l'évidement
  // pointerait sur des éléments qui ont bougé.
  let resizeT = null;
  new ResizeObserver(() => {
    clearTimeout(resizeT);
    resizeT = setTimeout(letterGridResize, 120);
  }).observe(document.querySelector('.wrap'));

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    letterGridTimer = setInterval(letterGridTick, LETTER_GRID_TICK_MS);
  }
}
// Rayon du disque net-vers-flou sous le curseur. Assez large pour couvrir un
// bloc de texte qu'on est en train de lire, assez petit pour qu'on voie que
// l'effet suit la souris.
const LETTER_BG_BLUR_RADIUS = 110;

// Le pointeur émet bien plus d'événements que l'écran n'affiche d'images, et
// chaque mise à jour recompose un backdrop-filter masqué (coûteux). On ne
// touche donc au style qu'une fois par frame.
let letterBgBlurPos = null;
let letterBgBlurRaf = 0;

function applyLetterBgBlur() {
  letterBgBlurRaf = 0;
  const blur = document.querySelector('#letterBgBlur');
  if (!blur || !letterBgBlurPos) return;
  blur.style.setProperty('--letterBgBlur-x', `${letterBgBlurPos.x}px`);
  blur.style.setProperty('--letterBgBlur-y', `${letterBgBlurPos.y}px`);
  blur.style.setProperty('--letterBgBlur-radius', `${LETTER_BG_BLUR_RADIUS}px`);
}

function updateLetterBgBlur(evt) {
  const host = document.querySelector('#letterBg');
  if (!host) return;
  const rect = host.getBoundingClientRect();
  letterBgBlurPos = {
    x: Math.max(0, Math.min(rect.width, evt.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, evt.clientY - rect.top))
  };
  if (!letterBgBlurRaf) letterBgBlurRaf = requestAnimationFrame(applyLetterBgBlur);
}

// Au repos le rayon retombe à 0 : le masque se réduit à son plancher d'alpha,
// donc un voile uniforme — pas une disparition brutale du flou.
function resetLetterBgBlur() {
  const blur = document.querySelector('#letterBgBlur');
  if (!blur) return;
  if (letterBgBlurRaf) { cancelAnimationFrame(letterBgBlurRaf); letterBgBlurRaf = 0; }
  letterBgBlurPos = null;
  blur.style.setProperty('--letterBgBlur-radius', '0px');
}

function initLetterBgBlur() {
  const wrap = document.querySelector('.wrap');
  if (!wrap) return;
  wrap.addEventListener('pointermove', updateLetterBgBlur, { passive: true });
  wrap.addEventListener('pointerleave', resetLetterBgBlur);
  wrap.addEventListener('pointerenter', updateLetterBgBlur, { passive: true });
}
letterGridMount();
initLetterBgBlur();

// Ne fait plus que marquer l'état pour letterGridTick ci-dessus — le bandeau
// tourne en continu, indépendamment du traitement.
function setProcessing(on) {
  document.body.classList.toggle('processing', !!on);
}

function setAnalyzeBtnLoading(loading) {
  const btn = $('fileAnalyzeBtn');
  if (loading) {
    if (!btn.classList.contains('loading')) btn.dataset.label = btn.textContent;
    btn.classList.add('loading');
    btn.innerHTML = '<span class="dots"><i></i><i></i><i></i><i></i><i></i></span>';
  } else {
    btn.classList.remove('loading');
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}

async function processFile() {
  if (!chosenFile) return;
  const ext = extOf(chosenFile.name);
  const kind = FILE_TYPES[ext];
  const btn = $('fileAnalyzeBtn');
  btn.disabled = true;
  setProcessing(true);
  setAnalyzeBtnLoading(true);
  fileSetStatus('Lecture du fichier…');
  try {
    const adapter = await kind.load();

    // Images : pas de PII textuelle, juste des métadonnées à retirer.
    // Court-circuit total du pipeline détection/masquage/NER.
    if (kind.metadataOnly) {
      fileSetStatus('Nettoyage des métadonnées…');
      const cleaned = await adapter.stripMetadata(await chosenFile.arrayBuffer(), { mime: kind.mime });
      fileOutBlob = new Blob([cleaned], { type: kind.mime });
      fileOutName = chosenFile.name.replace(/(\.[^.]+)$/, '-nettoye$1');
      $('fileMappingWrap').innerHTML = '<p>Image : métadonnées (EXIF/GPS/appareil) retirées. Le contenu visuel n\'est pas modifié.</p>';
      $('fileSummary').textContent = 'Métadonnées retirées (EXIF, GPS, appareil).';
      $('fileSummary').className = 'status active';
      $('fileResults').hidden = false;
      $('fileCopyBtn').hidden = true; // une image n'a pas de texte à copier
      $('dragCard').hidden = !document.body.classList.contains('panel-mode');
      fileSetStatus('');
      return;
    }

    // PDF + choix « Préserver » : reconstruction d'un PDF (images gardées),
    // chemin indépendant de l'extraction Markdown. Une seule passe de détection
    // à l'intérieur de reconstructPdf. Sortie binaire .pdf (pas copiable texte).
    if (ext === 'pdf' && $('pdfModePreserve')?.checked) {
      fileSetStatus('Reconstruction du PDF…');
      await ensureNER();
      const { reconstructPdf } = await import('../files/pdf-reconstruct.js');
      const pdflib = await import('pdf-lib');
      const { buffer: outBuf, mapping } = await reconstructPdf(await chosenFile.arrayBuffer(), {
        nerPipeline: nerPipe,
        nerDetect: contextualDetector(),
        onProgress: nerProgress,
        // Manquait entièrement : le PDF reconstruit ignorait la case
        // Pseudonymes, contrairement aux autres formats. Toujours [TYPE_N].
        // SANS argument : `units` n'existe pas encore sur ce chemin (il est
        // déclaré plus bas, pour l'autre branche) — le lui passer plantait en
        // « Cannot access 'units' before initialization ». reconstructPdf
        // extrait ses propres unités en interne.
        maskOpts: fileMaskOptions(),
        forceTerms: [...parseLines($('fileAlwaysMask')?.value), ...identityForceTerms()],
        disabledTypes: fileDisabledTypes,
        keepValues: parseLines($('fileAlwaysKeep')?.value),
        deps: { PDFDocument: pdflib.PDFDocument, StandardFonts: pdflib.StandardFonts }
      });
      fileOutBlob = new Blob([outBuf], { type: 'application/pdf' });
      fileOutName = chosenFile.name.replace(/(\.[^.]+)$/, '-anonymise$1');
      showFileResults(mapping, false);
      renderEngineBadge('fileEngineBadge');
      fileSetStatus('');
      return;
    }

    const { anonymizeUnits } = await import('../files/anonymize-units.js');
    const input = kind.text
      // ignoreBOM: garde le ﻿ initial dans la chaîne pour que l'adaptateur
      // CSV le détecte et le préserve en sortie (sinon TextDecoder l'avale).
      ? new TextDecoder('utf-8', { ignoreBOM: true }).decode(await chosenFile.arrayBuffer())
      : await chosenFile.arrayBuffer();

    // await : sans effet sur les 3 adaptateurs synchrones (CSV/XLSX/DOCX),
    // indispensable pour PDF (pdfjs-dist est intrinsèquement asynchrone).
    const { units } = await adapter.extractTextUnits(input);
    if (!units.length) {
      fileSetStatus('Aucun texte à analyser dans ce fichier.', 'error');
      return;
    }

    fileSetStatus('Détection en cours…');
    await ensureNER();
    const { results, mapping } = await anonymizeUnits(units, {
      nerPipeline: nerPipe,
      nerDetect: contextualDetector(),
      onProgress: nerProgress,
      maskOpts: fileMaskOptions(units),
      // Règles personnalisées : mêmes primitives que le mode texte
      // (selection.js), appliquées au document combiné entier.
      forceTerms: [...parseLines($('fileAlwaysMask')?.value), ...identityForceTerms()],
      disabledTypes: fileDisabledTypes,
      keepValues: parseLines($('fileAlwaysKeep')?.value)
    });

    // resultsById porte les DEUX formes : maskedText (CSV/XLSX) et entities (DOCX).
    const byId = new Map(results.map(r => [r.id, { maskedText: r.maskedText, entities: r.entities }]));
    const masked = await adapter.applyMask(input, byId);
    const cleaned = await adapter.stripMetadata(masked);
    fileOutBlob = new Blob([cleaned], { type: kind.mime });
    // outExt (PDF uniquement) : la sortie est un nouveau document (.md), pas
    // une réécriture — remplace l'extension entière, pas juste le nom.
    fileOutName = kind.outExt
      ? chosenFile.name.replace(/\.[^.]+$/, '-anonymise' + kind.outExt)
      : chosenFile.name.replace(/(\.[^.]+)$/, '-anonymise$1');

    // Copier n'a de sens que pour une sortie TEXTE (md/csv), pas binaire.
    showFileResults(mapping, kind.mime.startsWith('text/'));

    renderEngineBadge('fileEngineBadge');
    fileSetStatus('');
  } catch (err) {
    console.error(err);
    fileOutBlob = null;
    $('fileResults').hidden = true;
    $('dragCard').hidden = true;
    fileSetStatus('Traitement échoué — le fichier n’a pas été anonymisé. Détail dans la console.', 'error');
  } finally {
    setProcessing(false);
    setFileProgress(null);
    setAnalyzeBtnLoading(false);
    btn.disabled = false;
  }
}

function downloadFile() {
  if (!fileOutBlob) return;
  const url = URL.createObjectURL(fileOutBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileOutName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Bascule de mode
for (const btn of document.querySelectorAll('.mode-btn')) {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    for (const b of document.querySelectorAll('.mode-btn')) b.classList.toggle('active', b === btn);
    $('textMode').hidden = mode !== 'text';
    $('fileMode').hidden = mode !== 'file';
    // Replie la zone de désanonymisation en changeant de mode : un résultat
    // affiché dans un mode ne doit pas persister visuellement dans l'autre
    // (la table de correspondance reste partagée, c'est juste l'affichage).
    $('reinjectZone').hidden = true;
    $('toggleReinjectBtn').textContent = 'Désanonymiser une réponse…';
  });
}

// --- Sélection de fichier (bouton + glisser-déposer)
$('filePickBtn').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', ev => setChosenFile(ev.target.files[0]));
$('fileResetBtn').addEventListener('click', () => {
  chosenFile = null;
  fileOutBlob = null;
  $('fileInput').value = '';
  $('fileChosen').hidden = true;
  $('fileOptions').hidden = true;
  $('fileResults').hidden = true;
  $('fileCopyBtn').hidden = true;
  $('dragCard').hidden = true;
  fileSetStatus('');
});
$('fileAnalyzeBtn').addEventListener('click', processFile);
$('fileDownloadBtn').addEventListener('click', downloadFile);

// Copier le texte de sortie (sorties texte uniquement — bouton caché sinon).
// Voie fiable pour amener le contenu dans le LLM : coller, sans fichier.
$('fileCopyBtn').addEventListener('click', async () => {
  if (!fileOutBlob) return;
  await navigator.clipboard.writeText(await fileOutBlob.text());
  $('fileCopyStatus').textContent = 'Copié — colle dans le chat.';
  $('fileCopyStatus').className = 'status active';
  setTimeout(() => { $('fileCopyStatus').textContent = ''; }, 4000);
});

// Livraison directe du fichier anonymisé dans la page hôte. Le glisser-déposer
// natif cross-frame (iframe extension → JS propriétaire du site) s'est avéré
// peu fiable après deux tentatives (items.add seul, puis +DownloadURL) —
// abandon de cette voie. À la place : le CONTENT SCRIPT (qui tourne dans le
// contexte réel de la page, contrairement à cette iframe) assigne directement
// le fichier à un <input type="file"> trouvé sur la page — ne dépend d'aucun
// geste de glisser. Déclenché par clic, pas par glisser (plus fiable, plus
// visible). Limite assumée : si le site ne rend son input qu'après ouverture
// de son propre menu "joindre un fichier", la livraison échoue — communiqué
// honnêtement, pas caché.
$('dragCard').addEventListener('click', () => {
  if (!fileOutBlob) return;
  window.parent.postMessage({ clarenceDeliverFile: { blob: fileOutBlob, name: fileOutName } }, '*');
  fileSetStatus('Envoi dans la page…');
});

window.addEventListener('message', ev => {
  const result = ev.data && ev.data.clarenceDeliverResult;
  if (!result) return;
  fileSetStatus(
    result.delivered
      ? 'Fichier transmis à la page — vérifie qu\'il apparaît bien avant d\'envoyer.'
      : 'Aucun champ de fichier détecté sur la page. Ouvre d\'abord le menu « joindre » du site, ou utilise le téléchargement.',
    result.delivered ? 'active' : 'error'
  );
});

const dropzone = $('dropzone');
for (const evName of ['dragenter', 'dragover']) {
  dropzone.addEventListener(evName, ev => { ev.preventDefault(); dropzone.classList.add('dragover'); });
}
for (const evName of ['dragleave', 'drop']) {
  dropzone.addEventListener(evName, ev => { ev.preventDefault(); dropzone.classList.remove('dragover'); });
}
dropzone.addEventListener('drop', ev => {
  const file = ev.dataTransfer?.files?.[0];
  if (file) setChosenFile(file);
});

// ===== Profils d'anonymisation ============================================
// Préréglages nommés persistants (chrome.storage.local) des options de
// personnalisation. Le profil « Développeur / Tech » livré par défaut règle le
// sur-masquage des technos (React/Prisma/Docker) via sa liste « ne jamais
// masquer » — éditable, propriété de l'utilisateur, jamais une règle cachée du
// moteur. bindProfileBar est monté 2× (texte + fichier) pour ne rien dupliquer.
//
// cfg : { selectId, saveId, newId, deleteId, read(), apply(profile) }
async function bindProfileBar(cfg) {
  const sel = $(cfg.selectId);
  if (!sel) return;
  let profiles = await loadProfiles();

  const refill = selected => {
    sel.innerHTML = '<option value="">(personnalisé)</option>' +
      profiles.map(p => `<option${p.name === selected ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
  };
  refill();

  sel.addEventListener('change', () => {
    const p = profiles.find(x => x.name === sel.value);
    if (p) cfg.apply(p);
  });

  $(cfg.saveId)?.addEventListener('click', async () => {
    // Enregistre l'état courant dans le profil sélectionné, ou demande un nom.
    let name = sel.value;
    if (!name) { name = (window.prompt('Nom du profil ?') || '').trim(); if (!name) return; }
    profiles = await upsertProfile({ name, ...cfg.read() });
    refill(name);
  });

  $(cfg.newId)?.addEventListener('click', async () => {
    const name = (window.prompt('Nom du nouveau profil ?') || '').trim();
    if (!name) return;
    profiles = await upsertProfile({ name, ...cfg.read() });
    refill(name);
  });

  $(cfg.deleteId)?.addEventListener('click', async () => {
    if (!sel.value) return;
    if (!window.confirm(`Supprimer le profil « ${sel.value} » ?`)) return;
    profiles = await deleteProfile(sel.value);
    refill();
  });
}

bindProfileBar({
  selectId: 'profileSelect', saveId: 'profileSaveBtn', newId: 'profileNewBtn', deleteId: 'profileDeleteBtn',
  read: () => ({
    alwaysKeep: parseLines($('alwaysKeep')?.value),
    alwaysMask: parseLines($('alwaysMask')?.value),
    disabledTypes: [...disabledTypes],
    realistic: !!$('realisticToggle')?.checked
  }),
  apply: p => {
    if ($('alwaysKeep')) $('alwaysKeep').value = p.alwaysKeep.join('\n');
    if ($('alwaysMask')) $('alwaysMask').value = p.alwaysMask.join('\n');
    disabledTypes = new Set(p.disabledTypes);
    if ($('realisticToggle')) $('realisticToggle').checked = p.realistic;
    renderTypeChips('typeToggles', disabledTypes);
    if (currentText) render();
  }
});

bindProfileBar({
  selectId: 'fileProfileSelect', saveId: 'fileProfileSaveBtn', newId: 'fileProfileNewBtn', deleteId: 'fileProfileDeleteBtn',
  read: () => ({
    alwaysKeep: parseLines($('fileAlwaysKeep')?.value),
    alwaysMask: parseLines($('fileAlwaysMask')?.value),
    disabledTypes: [...fileDisabledTypes],
    realistic: !!$('fileRealisticToggle')?.checked
  }),
  apply: p => {
    if ($('fileAlwaysKeep')) $('fileAlwaysKeep').value = p.alwaysKeep.join('\n');
    if ($('fileAlwaysMask')) $('fileAlwaysMask').value = p.alwaysMask.join('\n');
    fileDisabledTypes = new Set(p.disabledTypes);
    if ($('fileRealisticToggle')) $('fileRealisticToggle').checked = p.realistic;
    renderTypeChips('fileTypeToggles', fileDisabledTypes);
  }
});

// ===== Profil d'identité ====================================================
// Les termes déclarés ici sont TOUJOURS masqués (recherche littérale +
// variantes de casse), indépendamment de tout modèle : la propre identité de
// l'utilisateur ne doit jamais dépendre d'un score de confiance. Stockage
// chrome.storage.local UNIQUEMENT — voir identity.js pour le pourquoi.
let identityCache = { status: 'neuf', champs: {} };

// Termes injectés dans forceTerms aux trois points d'entrée (texte, fichier,
// reconstruction PDF). Toujours AJOUTÉS aux règles saisies, jamais substitués.
function identityForceTerms() {
  return identitySearchTerms(identityCache);
}

function buildIdentityForm() {
  const wrap = $('identityFields');
  if (!wrap) return;
  wrap.innerHTML = IDENTITY_FIELDS.map(([key, label]) => `
    <div class="identity-field-${key}">
      <label class="field-label" for="identity_${key}">${esc(label)}</label>
      <textarea class="mini" id="identity_${key}" placeholder="Un terme par ligne"></textarea>
    </div>`).join('');
}

function fillIdentityForm() {
  for (const [key] of IDENTITY_FIELDS) {
    const el = $(`identity_${key}`);
    if (el) el.value = (identityCache.champs[key] || []).join('\n');
  }
}

function readIdentityForm() {
  const champs = {};
  for (const [key] of IDENTITY_FIELDS) champs[key] = $(`identity_${key}`)?.value ?? '';
  return champs;
}

function openIdentityModal() {
  buildIdentityForm();
  fillIdentityForm();
  $('identityOverlay').hidden = false;
}

async function initIdentity() {
  identityCache = await loadIdentity();
  // Proposé UNE fois, au premier lancement : ensuite l'utilisateur a répondu
  // (configuré ou « Plus tard ») et on ne le harcèle plus — le lien
  // « Mon identité » du pied de page reste le chemin de retour.
  if (identityCache.status === 'neuf') openIdentityModal();
}

$('identityOpenBtn')?.addEventListener('click', openIdentityModal);

$('identitySaveBtn')?.addEventListener('click', async () => {
  identityCache = { status: 'configuré', champs: readIdentityForm() };
  await saveIdentity(identityCache);
  identityCache = await loadIdentity(); // relit la forme normalisée
  $('identityOverlay').hidden = true;
});

$('identityLaterBtn')?.addEventListener('click', async () => {
  // Mémorise le refus SANS toucher aux champs éventuels déjà stockés.
  identityCache = { ...identityCache, status: 'refusé' };
  await saveIdentity(identityCache);
  $('identityOverlay').hidden = true;
});

$('identityClearBtn')?.addEventListener('click', async () => {
  if (!window.confirm('Effacer toutes les informations d\'identité stockées ?')) return;
  await clearIdentity();
  // status 'refusé' : tout est effacé ET on ne re-propose pas la modale au
  // prochain lancement (l'utilisateur vient de dire non explicitement).
  identityCache = { status: 'refusé', champs: {} };
  await saveIdentity(identityCache);
  fillIdentityForm();
});

initIdentity();
