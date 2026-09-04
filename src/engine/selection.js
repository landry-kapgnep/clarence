// Sélection finale des entités à masquer : détections automatiques + masques
// manuels + retraits utilisateur. Cette logique décide de ce qui est masqué -
// zéro tolérance, donc pure et testée (voir tests/unit/selection.test.mjs).
import { resolveOverlaps } from './merge.js';
import { estPlaceholder } from './masking.js';

export const entityKey = e => `${e.start}:${e.end}:${e.type}`;

// Règles :
// - un retrait (removedKeys) s'applique à n'importe quelle entité ;
// - un masque manuel a priorité absolue sur toute détection automatique
//   qui le chevauche ;
// - le résultat est sans chevauchement et trié.
// Un masque manuel contenu dans une détection ne doit pas la découper.
//
// La fuite que ça ferme, mesurée le 04/09/2026 sur un vrai CV. L'utilisateur
// déclare son nom de famille dans son profil d'identité ; ce terme est cherché
// littéralement, donc il matche aussi à l'intérieur de son adresse e-mail. La
// règle d'origine jetait toute détection chevauchant un masque manuel, si bien
// que l'entité EMAIL disparaissait et que le résultat livré était :
//
//     sans profil : [EMAIL_1]
//     avec profil : landry.[PERSONNALISE_1].pro@gmail.com
//
// Déclarer son identité rendait donc son e-mail moins masqué - la
// fonctionnalité censée mieux protéger protégeait moins, et précisément pour
// l'utilisateur le plus prudent.
//
// La règle corrigée distingue les deux sens du chevauchement :
//   · le manuel couvre la détection  → le manuel gagne, il masque un surensemble ;
//   · la détection contient le manuel → la détection gagne, le manuel est
//     redondant (tout ce qu'il masquerait est déjà masqué) et le garder ne
//     ferait que fragmenter.
//
// Cette correction ne peut jamais réduire le masquage : dans le cas qu'elle
// change, le span conservé couvre entièrement celui qu'on écarte.
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

// Filtre post-sélection : retire les entités des types désactivés et celles
// visées par « ne jamais masquer ». Les masques manuels (y compris forcés)
// sont intouchables : l'utilisateur a le dernier mot.
//
// La correspondance n'est plus exacte, et c'est une correction de bug mesurée.
// Sur un vrai mémoire, 14 termes saisis en « ne jamais masquer » n'en ont vu
// que 6 appliqués. Cause : le modèle détecte « Joss Moorkens », « Rivas
// Ginel », « Google Translate » comme entités entières, tandis que
// l'utilisateur saisit le patronyme ou la marque seuls. Aucune égalité stricte
// ne pouvait donc matcher, et la règle restait sans effet - sans que rien ne
// le signale, ce qui est le pire cas : on croit sa consigne appliquée.
//
// La comparaison se fait donc par SUITE DE MOTS ENTIERS, dans les deux sens :
//  - « Moorkens » épargne l'entité « Joss Moorkens » (le terme est dedans) ;
//  - « Joss Moorkens » épargne l'entité « Moorkens » (l'entité est dedans).
// Les frontières de mot interdisent les correspondances par accident :
// « MT » n'épargne ni « Amtrak » ni « Smith ».
//
// Risque assumé : garder « Paris » épargnerait aussi une personne nommée
// « Paris Dupont ». C'est une conséquence directe d'une consigne explicite de
// l'utilisateur, et « toujours masquer » reprend la main dessus (les masques
// manuels passent avant, première condition du filtre).
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
