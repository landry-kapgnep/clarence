// Sélection finale des entités à masquer : détections automatiques + masques
// manuels + retraits utilisateur. Cette logique décide de ce qui est masqué —
// zéro tolérance, donc pure et testée (voir tests/unit/selection.test.mjs).
import { resolveOverlaps } from './merge.js';

export const entityKey = e => `${e.start}:${e.end}:${e.type}`;

// Règles :
// - un retrait (removedKeys) s'applique à n'importe quelle entité ;
// - un masque manuel a priorité absolue sur toute détection automatique
//   qui le chevauche ;
// - le résultat est sans chevauchement et trié.
export function selectActive(autoEntities, manualEntities, removedKeys) {
  const manuals = manualEntities.filter(e => !removedKeys.has(entityKey(e)));
  const autos = autoEntities.filter(e =>
    !removedKeys.has(entityKey(e)) &&
    !manuals.some(m => e.start < m.end && e.end > m.start));
  return resolveOverlaps([...autos, ...manuals]);
}

// ===== Masquage personnalisé (feature premium « choix des données à
// masquer/conserver ») — logique pure, partagée par le mode texte et le mode
// fichier. Trois leviers : forcer des termes, en épargner, désactiver des types.

// « Toujours masquer » : chaque terme devient une (des) entité(s) manuelle(s)
// générée(s) par recherche littérale — rattrape les ratés du moteur (nom rare,
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

// Filtre post-sélection : retire les entités des types désactivés et celles
// dont la valeur est dans la liste « ne jamais masquer ». Les masques MANUELS
// (y compris forcés) sont intouchables : l'utilisateur a le dernier mot.
export function filterByRules(entities, { disabledTypes = new Set(), keepValues = [] } = {}) {
  const keep = new Set((keepValues || []).map(v => (v || '').trim().toLowerCase()).filter(Boolean));
  return entities.filter(e =>
    e.source === 'manuel' ||
    (!disabledTypes.has(e.type) && !keep.has(e.value.toLowerCase()))
  );
}
