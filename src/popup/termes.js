// Découpage des listes de termes saisies à la main (« toujours masquer » /
// « ne jamais masquer »).
//
// POURQUOI LA TABULATION. Le champ n'acceptait qu'un terme par LIGNE. Or son
// usage réel est la saisie en vrac : on vient de lire son document, on a cinq
// ou six termes en tête, on veut les jeter d'un trait sans quitter le clavier
// pour Entrée à chaque fois. La tabulation est le séparateur naturel de ce
// geste — et elle ne peut pas apparaître à l'intérieur d'un terme.
//
// Le saut de ligne reste accepté : les profils déjà enregistrés stockent leurs
// termes ainsi, et les casser silencieusement viderait les règles de
// quelqu'un sans qu'il s'en aperçoive.
//
// Le point-virgule et la virgule sont VOLONTAIREMENT exclus : « Dupont, Marie »
// ou « Legrand & Fils, S.A. » sont des termes plausibles, et les découper
// produirait des fragments qui masqueraient n'importe quoi.
const SEPARATEURS = /[\t\r\n]+/;

export function parseTermes(valeur) {
  return (valeur || '')
    .split(SEPARATEURS)
    // Espaces de tête et de queue retirés : une saisie rapide en laisse
    // toujours, et « ChatGPT » avec une espace finale ne correspondrait à rien.
    .map(s => s.trim())
    .filter(Boolean);
}

// Ajoute un terme à une liste saisie, sans doublon, en gardant le texte
// existant intact. Rend la nouvelle valeur du champ.
//
// Sert au bouton « ne plus masquer » de la table de correspondance : le terme
// retiré atterrit dans le champ VISIBLE plutôt que dans un état caché. Trois
// bénéfices : l'utilisateur voit ce qu'il a retiré, il peut le corriger à la
// main, et s'il veut le rendre permanent il lui suffit d'enregistrer le profil
// — l'éphémère devient durable par un geste explicite, jamais par surprise.
export function ajouterTerme(valeur, terme) {
  const t = (terme || '').trim();
  if (!t) return valeur || '';
  const existants = parseTermes(valeur);
  if (existants.includes(t)) return valeur || '';
  return [...existants, t].join('\n');
}
