// Sélection finale des entités à masquer : détections automatiques + masques
// manuels + retraits utilisateur. Cette logique décide de ce qui est masqué -
// zéro tolérance, donc pure et testée (voir tests/unit/selection.test.mjs).
import { resolveOverlaps } from './merge.js';
import { estPlaceholder } from './masking.js';

export const entityKey = e => `${e.start}:${e.end}:${e.type}`;

// Règles :
// - un retrait (removedKeys) s'applique à n'importe quelle entité ;
// - un masque manuel a priorité sur toute détection automatique qu'il couvre ;
// - le résultat est sans chevauchement et trié.
//
// UN MASQUE MANUEL CONTENU DANS UNE DÉTECTION NE LA DÉCOUPE PAS. L'utilisateur
// déclare son patronyme dans son profil ; le terme est cherché littéralement,
// donc il matche aussi à l'intérieur de son adresse e-mail. La règle d'origine
// jetait toute détection chevauchant un masque manuel :
//
//     sans profil : [EMAIL_1]
//     avec profil : adrien.[PERSONNALISE_1].pro@gmail.com
//
// Déclarer son identité rendait donc son e-mail moins masqué. On distingue
// maintenant les deux sens : le manuel gagne s'il couvre la détection, la
// détection gagne si elle contient le manuel. Le masquage ne peut jamais
// diminuer, le span conservé couvrant celui qu'on écarte.
const contient = (grand, petit) => grand.start <= petit.start && grand.end >= petit.end;

export function selectActive(autoEntities, manualEntities, removedKeys) {
  const manuals0 = manualEntities.filter(e => !removedKeys.has(entityKey(e)));
  const autos0 = autoEntities.filter(e => !removedKeys.has(entityKey(e)));

  const manuals = manuals0.filter(m => !autos0.some(a => contient(a, m) && !contient(m, a)));
  const autos = autos0.filter(a =>
    !manuals.some(m => a.start < m.end && a.end > m.start));
  return resolveOverlaps([...autos, ...manuals]);
}

// ===== Masquage personnalisé (feature premium « choix des données à
// masquer/conserver ») - logique pure, partagée par le mode texte et le mode
// fichier. Trois leviers : forcer des termes, en épargner, désactiver des types.

// « Toujours masquer » : chaque terme devient une (des) entité(s) manuelle(s)
// générée(s) par recherche littérale - rattrape les ratés du moteur (nom rare,
// nom de code projet…). Une entité par occurrence ; le masquage propage ensuite.
export function forcedMasks(text, terms) {
  const out = [];
  for (const raw of terms || []) {
    const term = (raw || '').trim();
    if (!term) continue;
    let i = text.indexOf(term);
    while (i !== -1) {
      out.push({ type: 'PERSONNALISE', value: term, start: i, end: i + term.length, source: 'manuel' });
      i = text.indexOf(term, i + term.length);
    }
  }
  return out;
}

// Découpe en mots pour la comparaison des règles « ne jamais masquer ».
// Comparer des sous-chaînes brutes ferait correspondre « MT » à l'intérieur de
// « Amtrak » ; comparer des suites de mots ne le peut pas. `\p{L}\p{N}` couvre
// les accents, indispensable ici (Quémerais, Vanmassenhove, Müller).
const motsDe = t => (t || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

// `aiguille` apparaît-elle comme suite de mots ENTIERS dans `botte` ?
function contientLesMots(botte, aiguille) {
  if (!aiguille.length || aiguille.length > botte.length) return false;
  for (let i = 0; i + aiguille.length <= botte.length; i++) {
    if (aiguille.every((m, j) => botte[i + j] === m)) return true;
  }
  return false;
}

// Filtre post-sélection : retire les types désactivés et les entités visées par
// « ne jamais masquer ». Les masques manuels sont intouchables.
//
// La correspondance n'est pas exacte, et c'est une correction de bug. Sur un
// mémoire, 14 termes saisis n'en ont vu que 6 appliqués : le modèle détecte
// « Joss Moorkens » entier quand l'utilisateur saisit le patronyme seul. Aucune
// égalité stricte ne matchait, et rien ne le signalait - on croyait sa consigne
// appliquée.
//
// Comparaison par SUITE DE MOTS ENTIERS, dans les deux sens : « Moorkens »
// épargne « Joss Moorkens », et l'inverse. Les frontières de mot interdisent
// les accidents : « MT » n'épargne ni « Amtrak » ni « Smith ».
//
// Risque assumé : garder « Paris » épargne aussi « Paris Dupont ». C'est la
// conséquence d'une consigne explicite, et « toujours masquer » reprend la main.
export function filterByRules(entities, { disabledTypes = new Set(), keepValues = [] } = {}) {
  const keep = (keepValues || [])
    .map(v => motsDe(v))
    .filter(m => m.length);
  return entities.filter(e => {
    // Avant tout le reste, sélections manuelles comprises : un placeholder que
    // nous avons nous-mêmes écrit n'est jamais une donnée personnelle, et le
    // remasquer détruit la réinjection (voir estPlaceholder dans masking.js).
    // Il n'existe aucun cas où le masquer rendrait service.
    if (estPlaceholder(e.value)) return false;
    if (e.source === 'manuel') return true;
    if (disabledTypes.has(e.type)) return false;
    const mots = motsDe(e.value);
    return !keep.some(k => contientLesMots(mots, k) || contientLesMots(k, mots));
  });
}
