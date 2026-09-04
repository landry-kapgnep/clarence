// Démo en ligne - le MÊME moteur que l'extension, importé depuis src/engine/.
// Aucune copie, aucune réimplémentation : si le moteur progresse, la démo aussi.
import { detectRegex } from '../../src/engine/regex-detect.js';
import { detectPhonesIntl } from '../../src/engine/phone-intl.js';
import { mergeEntities } from '../../src/engine/merge.js';
import { selectActive, filterByRules, forcedMasks } from '../../src/engine/selection.js';
import { maskText } from '../../src/engine/masking.js';
import { monterGrilleDeLettres } from './letter-grid.js';

const $ = id => document.getElementById(id);

// Libellés lisibles, alignés sur ceux de la popup.
const NOMS = {
  PER: 'nom', EMAIL: 'email', TELEPHONE: 'téléphone', IBAN: 'IBAN',
  CARTE_BANCAIRE: 'carte', NIR: 'sécu', SIRET_SIREN: 'SIRET',
  ADRESSE: 'adresse', CODE_POSTAL_VILLE: 'code postal', MONTANT: 'montant',
  DATE_NAISSANCE: 'date de naissance', REFERENCE: 'référence',
  BIC: 'BIC', IP: 'IP', MAC: 'MAC', PSEUDO: 'pseudo', ID_NATIONAL: 'identifiant'
};

const echapper = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function analyser(texte) {
  const rx = [...detectRegex(texte), ...detectPhonesIntl(texte)];
  const actives = filterByRules(
    selectActive(mergeEntities(rx, []), forcedMasks(texte, []), new Set()),
    {}
  );
  return { actives, ...maskText(texte, actives) };
}

// Surligne les entités dans la source, comme le fait la popup.
function annoter(texte, entites) {
  let html = '', curseur = 0;
  for (const e of entites) {
    html += echapper(texte.slice(curseur, e.start));
    html += `<mark data-type="${e.type}">${echapper(e.value)}</mark>`;
    curseur = e.end;
  }
  return html + echapper(texte.slice(curseur));
}

function rendre() {
  const texte = $('source').value;
  const { actives, masked } = analyser(texte);

  $('miroir').innerHTML = annoter(texte, actives);
  $('resultat').textContent = masked;

  const parType = new Map();
  for (const e of actives) parType.set(e.type, (parType.get(e.type) || 0) + 1);
  $('puces').innerHTML = [...parType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `<li><span class="pastille" data-type="${t}"></span>${NOMS[t] || t.toLowerCase()}<b>${n}</b></li>`)
    .join('');

  $('compte').textContent = actives.length;
  $('motsCompte').textContent = texte.trim().split(/\s+/).filter(Boolean).length;
}

// Le miroir de surlignage doit suivre le défilement du textarea au pixel près.
function synchroniserDefilement() {
  $('miroir').scrollTop = $('source').scrollTop;
  $('miroir').scrollLeft = $('source').scrollLeft;
}

$('source').addEventListener('input', rendre);
$('source').addEventListener('scroll', synchroniserDefilement);

$('copier').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('resultat').textContent);
  const b = $('copier');
  const avant = b.textContent;
  b.textContent = 'copié';
  setTimeout(() => { b.textContent = avant; }, 1400);
});

// Compteur de requêtes réseau : la promesse du produit, rendue vérifiable à
// l'écran. PerformanceObserver voit TOUTE requête sortante de la page, y
// compris celles qu'on n'aurait pas voulues - donc le chiffre ne peut pas
// mentir en notre faveur. Les ressources de la page elle-même (polices, css,
// js) sont comptées à part et affichées telles quelles.
const ressourcesDeLaPage = new Set();
function surveillerReseau() {
  const compteur = $('reseau');
  if (!compteur || typeof PerformanceObserver === 'undefined') return;
  for (const e of performance.getEntriesByType('resource')) ressourcesDeLaPage.add(e.name);
  const majAuChargement = ressourcesDeLaPage.size;
  compteur.textContent = '0';
  // En file:// le navigateur ne publie aucune entrée de ressource : afficher
  // « 0 fichier » serait faux. On masque le compteur secondaire plutôt que de
  // montrer un chiffre qu'on sait inexact.
  const bloc = $('reseauStatique').closest('.compteur');
  if (majAuChargement === 0) bloc.hidden = true;
  else $('reseauStatique').textContent = majAuChargement;

  new PerformanceObserver(liste => {
    let apres = 0;
    for (const e of liste.getEntries()) if (!ressourcesDeLaPage.has(e.name)) apres++;
    if (apres) compteur.textContent = String(Number(compteur.textContent) + apres);
  }).observe({ type: 'resource', buffered: false });
}

monterGrilleDeLettres($('grille'));
rendre();
surveillerReseau();
