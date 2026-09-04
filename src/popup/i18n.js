// Traduction de l'interface - mécanisme natif de Chrome, aucune dépendance.
//
// Pourquoi `chrome.i18n` ET PAS UNE LIBRAIRIE. Les catalogues sont empaquetés
// dans l'extension (`_locales/<langue>/messages.json`), Chrome choisit d'après
// la langue du navigateur et retombe seul sur `default_locale`. Zéro requête
// réseau, donc rien à arbitrer avec le principe du projet.
//
// Ce que ça ne traduit pas, et il faut le savoir : seulement l'interface. Le
// Moteur reste largement francophone - les regex NIR/SIRET/téléphone FR, les
// civilités, les particules, les viviers de pseudonymes (fr/en seulement) et
// le vocabulaire des profils livrés. Traduire l'UI vers une langue que le
// moteur ne couvre pas promettrait une protection qu'on n'assure pas ; d'où
// l'anglais seul pour l'instant, la seule langue où le moteur suit déjà
// (GLiNER est multilingue, `libphonenumber-js` couvre l'international, les
// pseudonymes ont leur locale `en`).

// Hors extension (tests, page d'atelier), on rend la clé : rien ne plante, et
// une clé qui s'affiche telle quelle se repère immédiatement.
// `sub` : substitutions ($1, $2…) telles que chrome.i18n les attend. Sans ce
// second argument, un message paramétré ressortait avec ses « $1 » en clair -
// ou pire, la clé brute affichée à l'écran.
export const msg = (cle, sub) =>
  (typeof chrome !== 'undefined' && chrome.i18n?.getMessage
    ? chrome.i18n.getMessage(cle, sub) : '') || cle;

// Attribut → propriété DOM. `aria` est abrégé dans le nom de l'attribut HTML
// (`data-i18n-aria`) parce que `data-i18n-aria-label` deviendrait illisible.
const ATTRIBUTS = [
  ['i18nTitle', 'title'],
  ['i18nPlaceholder', 'placeholder'],
  ['i18nAria', 'aria-label'],
  // `alt` porte le nom accessible des boutons-images (Copier, Télécharger) :
  // le mot y est cuit dans le bitmap, donc invisible autrement. Sans cette
  // ligne, ces boutons resteraient en français pour un lecteur d'écran anglais.
  ['i18nAlt', 'alt']
];

// Applique les traductions à une racine - le document au chargement, ou un
// fragment fraîchement inséré. Idempotent : on peut la rappeler sans risque.
export function appliquerTraductions(racine = document) {
  for (const el of racine.querySelectorAll('[data-i18n]')) {
    el.textContent = msg(el.dataset.i18n);
  }
  // `innerHTML` est réservé aux aides, dont le texte porte <strong> et <code>.
  // La source est un catalogue EMPAQUETÉ dans l'extension, jamais une entrée
  // utilisateur : il n'y a pas de contenu tiers à injecter ici.
  for (const el of racine.querySelectorAll('[data-i18n-html]')) {
    el.innerHTML = msg(el.dataset.i18nHtml);
  }
  for (const [prop, attr] of ATTRIBUTS) {
    for (const el of racine.querySelectorAll(`[data-${attr === 'aria-label' ? 'i18n-aria' : 'i18n-' + attr}]`)) {
      el.setAttribute(attr, msg(el.dataset[prop]));
    }
  }
  document.documentElement.lang =
    (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.().slice(0, 2)) || 'fr';
}
