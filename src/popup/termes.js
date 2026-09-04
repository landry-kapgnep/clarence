// Découpage des listes de termes saisies à la main.
//
// Quatre séparateurs acceptés : virgule, point-virgule, tabulation, saut de
// ligne. La tabulation reste utile pour un collage depuis un tableur, le saut
// de ligne est le format dans lequel les profils sont déjà enregistrés.
//
// La tabulation seule avait été essayée : elle marche, mais elle est invisible,
// et il fallait lancer le traitement pour savoir si la saisie était correcte.
// Or se relire est tout l'objet de ce champ.
//
// Contrepartie : un terme ne peut plus contenir de virgule. « Société
// Générale, Paris » en « ne jamais masquer » laisserait « Paris » visible. Rare,
// et visible à la relecture, donc rattrapable.
const SEPARATEURS = /[,;\t\r\n]+/;

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
// retiré atterrit dans le champ visible plutôt que dans un état caché. Trois
// bénéfices : l'utilisateur voit ce qu'il a retiré, il peut le corriger à la
// main, et s'il veut le rendre permanent il lui suffit d'enregistrer le profil
// - l'éphémère devient durable par un geste explicite, jamais par surprise.
export function ajouterTerme(valeur, terme) {
  const t = (terme || '').trim();
  if (!t) return valeur || '';
  const existants = parseTermes(valeur);
  if (existants.includes(t)) return valeur || '';
  // Recomposé avec le séparateur que l'utilisateur voit, pour que ce qu'il
  // relit corresponde à ce qui sera appliqué.
  return [...existants, t].join(', ');
}
