// Popup Clarence — source bundlée par build.mjs (Transformers.js inclus en
// local : MV3 interdit tout code distant).
import { pipeline, env } from '@xenova/transformers';
import { detectRegex } from '../engine/regex-detect.js';
import { detectNER, NER_MODEL } from '../engine/ner.js';
import { mergeEntities } from '../engine/merge.js';
import { selectActive, entityKey, forcedMasks, filterByRules } from '../engine/selection.js';
import { createPseudonymizer } from '../engine/pseudonyms.js';
import { maskText, reinject } from '../engine/masking.js';

// --- Config Transformers.js : tout en local sauf le téléchargement du modèle
// (fichiers de poids depuis Hugging Face au 1er usage, mis en cache ensuite —
// ce sont des poids statiques, jamais du code ni des données utilisateur).
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('vendor/');
env.backends.onnx.wasm.numThreads = 1; // pas de worker → pas de souci CSP MV3

// --- État (mémoire du popup uniquement ; tout disparaît à la fermeture)
let currentText = '';
let autoEntities = [];    // sortie moteur (regex + NER fusionnés)
let manualEntities = [];  // ajouts manuels de l'utilisateur
let removedKeys = new Set(); // faux positifs retirés d'un clic
let disabledTypes = new Set(); // types que l'utilisateur choisit de NE PAS masquer

// Libellés lisibles des types pour les puces de personnalisation.
const TYPE_DISPLAY = {
  PER: 'Noms', ORG: 'Entreprises', LOC: 'Lieux', EMAIL: 'Emails',
  TELEPHONE: 'Téléphones', IBAN: 'IBAN', CARTE_BANCAIRE: 'Cartes',
  NIR: 'NIR', SIRET_SIREN: 'SIRET/SIREN', CODE_POSTAL_VILLE: 'Code postal',
  MONTANT: 'Montants', ADRESSE: 'Adresses', DATE_NAISSANCE: 'Dates naiss.',
  REFERENCE: 'Références', MISC: 'Divers', PERSONNALISE: 'Perso'
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
      avoid: v => currentText.includes(v)
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
}
const keyOf = entityKey;
const esc = s => s.replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Les masques manuels ont priorité absolue ; les retraits s'appliquent aux
// détections automatiques uniquement (un ajout manuel se retire aussi d'un clic).
// Règles perso : « toujours masquer » (termes forcés), « ne jamais masquer »
// (valeurs épargnées) et types désactivés.
function activeEntities() {
  const forced = forcedMasks(currentText, parseLines($('alwaysMask')?.value));
  const sel = selectActive(autoEntities, [...manualEntities, ...forced], removedKeys);
  return filterByRules(sel, { disabledTypes, keepValues: parseLines($('alwaysKeep')?.value) });
}

// Puces de types détectés : décocher un type le laisse visible (non masqué).
function renderTypeToggles() {
  const box = $('typeToggles');
  if (!box) return;
  const types = [...new Set(autoEntities.map(e => e.type))];
  if (!types.length) {
    box.innerHTML = '<span class="hint">Lance une analyse pour voir les types détectés.</span>';
    return;
  }
  box.innerHTML = types.map(t => {
    const off = disabledTypes.has(t);
    return `<label class="type-chip ${off ? 'off' : ''}"><input type="checkbox" data-type="${t}" ${off ? '' : 'checked'}>${esc(TYPE_DISPLAY[t] || t)}</label>`;
  }).join('');
}

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
  renderTypeToggles();

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

async function ensureNER() {
  if (nerPipe || nerLoading) return;
  nerLoading = true;
  setStatus('Chargement du modèle de détection des noms (~30 Mo au premier usage, mis en cache ensuite)…');
  try {
    nerPipe = await pipeline('token-classification', NER_MODEL);
  } catch (err) {
    console.error(err);
    // Le regex tourne quand même : mieux vaut un résultat partiel signalé
    // clairement qu'un blocage total sur une simple erreur réseau.
  } finally {
    nerLoading = false;
  }
}

async function analyze() {
  const text = $('input').value;
  if (!text.trim()) return;
  if (text.length > MAX_INPUT) {
    setStatus(`Texte trop long (${text.length.toLocaleString('fr-FR')} caractères, plafond ${MAX_INPUT.toLocaleString('fr-FR')}). Découpe-le en plusieurs passages.`, 'error');
    return;
  }
  if (text !== currentText) { manualEntities = []; removedKeys = new Set(); }
  currentText = text;
  const btn = $('analyzeBtn');
  btn.disabled = true;
  try {
    await ensureNER();
    const rx = detectRegex(text);
    const ner = nerPipe ? await detectNER(text, nerPipe) : [];
    autoEntities = mergeEntities(rx, ner);
    render();
    if (!nerPipe) {
      // Ne JAMAIS laisser croire que les noms/lieux ont été vérifiés alors
      // que seul le structuré (regex) a tourné.
      const count = activeEntities().length;
      setStatus(`${count} élément(s) masqué(s) — détection des noms indisponible (connexion requise au premier usage), seules les données structurées ont été repérées. Relis attentivement.`, 'error');
    }
  } catch (err) {
    // Ne JAMAIS échouer en silence : l'utilisateur pourrait coller un texte
    // qu'il croit analysé.
    console.error(err);
    $('results').hidden = true;
    setStatus('L’analyse a échoué — rien n’a été masqué, ne colle pas ce texte tel quel. Détail dans la console.', 'error');
  } finally {
    btn.disabled = false;
  }
}

function maskSelection() {
  const ta = $('input');
  const s = ta.selectionStart, e = ta.selectionEnd;
  if (ta.value !== currentText) {
    setStatus('Lance d’abord Analyser, puis sélectionne le passage à masquer.', 'error');
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
  $('copyStatus').textContent = 'Copié — vérifie une dernière fois avant de coller.';
  $('copyStatus').className = 'status active';
  setTimeout(() => { $('copyStatus').textContent = ''; }, 4000);
}

function setStatus(msg, cls = '') {
  $('status').textContent = msg;
  $('status').className = 'status ' + cls;
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
  render();
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
    st.textContent = 'Aucune table de correspondance en mémoire — analyse un texte d’abord.';
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
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', text: false, load: () => import('../files/docx-adapter.js') }
};

let chosenFile = null;
let fileOutBlob = null;
let fileOutName = '';

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
    fileSetStatus('Format non pris en charge. Formats acceptés : CSV, Excel (.xlsx), Word (.docx).', 'error');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    fileSetStatus(`Fichier trop volumineux (${humanSize(file.size)}, plafond ${humanSize(MAX_FILE_BYTES)}).`, 'error');
    return;
  }
  chosenFile = file;
  fileOutBlob = null;
  $('fileName').textContent = file.name;
  $('fileSize').textContent = humanSize(file.size);
  $('fileChosen').hidden = false;
  $('fileResults').hidden = true;
  fileSetStatus('');
}

function fileMaskOptions(units) {
  if (!$('fileRealisticToggle')?.checked) return {};
  const joined = units.map(u => u.text).join('\n');
  return {
    pseudonymize: createPseudonymizer({
      seed: pseudoSeed,
      avoid: v => joined.includes(v)
    })
  };
}

async function processFile() {
  if (!chosenFile) return;
  const ext = extOf(chosenFile.name);
  const kind = FILE_TYPES[ext];
  const btn = $('fileAnalyzeBtn');
  btn.disabled = true;
  fileSetStatus('Lecture du fichier…');
  try {
    const adapter = await kind.load();
    const { anonymizeUnits } = await import('../files/anonymize-units.js');
    const input = kind.text
      // ignoreBOM: garde le ﻿ initial dans la chaîne pour que l'adaptateur
      // CSV le détecte et le préserve en sortie (sinon TextDecoder l'avale).
      ? new TextDecoder('utf-8', { ignoreBOM: true }).decode(await chosenFile.arrayBuffer())
      : await chosenFile.arrayBuffer();

    const { units } = adapter.extractTextUnits(input);
    if (!units.length) {
      fileSetStatus('Aucun texte à analyser dans ce fichier.', 'error');
      return;
    }

    fileSetStatus('Chargement du modèle et détection en cours…');
    await ensureNER();
    const { results, mapping } = await anonymizeUnits(units, {
      nerPipeline: nerPipe,
      maskOpts: fileMaskOptions(units)
    });

    // resultsById porte les DEUX formes : maskedText (CSV/XLSX) et entities (DOCX).
    const byId = new Map(results.map(r => [r.id, { maskedText: r.maskedText, entities: r.entities }]));
    const masked = adapter.applyMask(input, byId);
    const cleaned = adapter.stripMetadata(masked);
    fileOutBlob = new Blob([cleaned], { type: kind.mime });
    fileOutName = chosenFile.name.replace(/(\.[^.]+)$/, '-anonymise$1');

    // Table de correspondance partagée avec la désanonymisation (mode texte).
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

    if (!nerPipe) {
      fileSetStatus('Détection des noms indisponible (connexion requise au premier usage) — seules les données structurées ont été repérées. Relis attentivement le fichier.', 'error');
    } else {
      fileSetStatus('');
    }
  } catch (err) {
    console.error(err);
    fileOutBlob = null;
    $('fileResults').hidden = true;
    fileSetStatus('Le traitement a échoué — le fichier n’a pas été anonymisé. Détail dans la console.', 'error');
  } finally {
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
  $('fileResults').hidden = true;
  fileSetStatus('');
});
$('fileAnalyzeBtn').addEventListener('click', processFile);
$('fileDownloadBtn').addEventListener('click', downloadFile);

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
