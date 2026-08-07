// Découpage des listes de termes saisies à la main (« toujours masquer » /
// « ne jamais masquer »).
//
// LA VIRGULE EST LE SÉPARATEUR PRINCIPAL, et ce choix corrige le précédent.
//
// La tabulation avait d'abord été retenue parce qu'elle ne peut pas apparaître
// dans un terme. Elle marchait — mesuré sur un vrai document, six termes saisis
// ainsi ont bien été appliqués — mais elle est INVISIBLE : sa largeur varie
// selon la position, on ne distingue pas une tabulation de deux, et il fallait
// lancer le traitement pour savoir si la saisie était correcte. Un séparateur
// qu'on ne voit pas ne permet pas de se relire, et se relire est tout l'objet
// de ce champ.
//
// Les quatre formes sont acceptées (virgule, point-virgule, tabulation, saut de
// ligne) : la tabulation reste utile pour un collage depuis un tableur, et le
// saut de ligne est le format dans lequel les profils sont déjà enregistrés —
// le casser viderait silencieusement les règles de quelqu'un.
//
// CONTREPARTIE ASSUMÉE : un terme ne peut plus contenir de virgule.
// « Dupont, Marie » sera lu comme deux termes. Côté « toujours masquer » c'est
// sans danger (on masque davantage) ; côté « ne jamais masquer » ça peut
// laisser en clair un fragment qu'on n'avait pas l'intention d'épargner —
// « Société Générale, Paris » garderait « Paris » visible. Le cas est rare, et
// la virgule reste visible à la relecture, ce qui le rend rattrapable. C'est
// l'inverse du défaut de la tabulation, qui était invisible.
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
// retiré atterrit dans le champ VISIBLE plutôt que dans un état caché. Trois
// bénéfices : l'utilisateur voit ce qu'il a retiré, il peut le corriger à la
// main, et s'il veut le rendre permanent il lui suffit d'enregistrer le profil
// — l'éphémère devient durable par un geste explicite, jamais par surprise.
export function ajouterTerme(valeur, terme) {
  const t = (terme || '').trim();
  if (!t) return valeur || '';
  const existants = parseTermes(valeur);
  if (existants.includes(t)) return valeur || '';
  // Recomposé avec le séparateur que l'utilisateur VOIT, pour que ce qu'il
  // relit corresponde à ce qui sera appliqué.
  return [...existants, t].join(', ');
}
