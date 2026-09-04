# Site vitrine - PROTOTYPE

```bash
npm run site      # → site/dist/, ouvrir index.html
```

**Rien n'est publié, et rien ne doit l'être avant l'extension.** Un site qui
convertit vers un magasin vide ne convertit personne : il manque encore la fiche
Chrome Web Store, la politique de confidentialité et le zip (voir
`docs/verification-chrome.md` §G).

## Le rôle exact de cette page

Un **tunnel**, pas un produit concurrent. Elle enlève la friction d'installation
pour un premier essai ; qui veut s'en servir sérieusement installe l'extension,
puisque c'est elle qui apparaît dans ChatGPT et Claude.

## Ce qu'elle fait tourner, et ce qu'elle ne fait pas

Le site importe **le moteur de `src/engine/`**, sans copie ni réécriture : le
mode texte n'utilise aucune API `chrome.*`, il fonctionne donc tel quel dans une
page ordinaire. Si le moteur progresse, la démo progresse.

Seule la **couche déterministe** tourne ici - regex + validateurs (Luhn, mod-97,
clé NIR). Instantanée, aucun téléchargement. La couche contextuelle (noms,
entreprises, lieux) demande 183 Mo de modèle : c'est ce que l'extension apporte,
et la page le dit au lieu de le masquer - le bloc « Nantes est encore en clair »
est délibéré, pas un oubli.

## Décisions de design, et pourquoi

La page devait ressembler à un **instrument**, pas à une page d'atterrissage
SaaS. Concrètement, ce qui a été écarté :

- pas de dégradé violet, pas de verre dépoli, pas d'icônes emoji ;
- pas de rangée de trois cartes identiques, pas de faux témoignages, pas de
  bandeau « ils nous font confiance » ;
- pas de chiffre inventé : ceux du § 03 sortent de `npm run bench` et sont
  affichés avec leur limite (le contextuel est mesuré, jamais promis) ;
- pas de tout-centré : grille éditoriale asymétrique, rail de numéros de
  section en monospace, à la manière d'une documentation technique.

Ce qui est **repris de l'extension**, pour que les deux se lisent comme un seul
objet : les jetons de couleur exacts de `popup.css`, les angles droits et
l'absence de bordures, les polices du dépôt (Syne Mono, Stack Sans), la fée en
veilleuse, et le bandeau de lettres - porté depuis `src/popup/main.js`.

Deux couleurs portent du **sens**, pas de la décoration : violet pour ce qui
identifie une personne, vert-mousse pour le financier et l'administratif.

## Le § 02 est un argument, pas une illustration

Le compteur de requêtes lit `PerformanceObserver` - la même source que l'onglet
Réseau du navigateur. Il verrait une requête qu'on n'aurait pas voulue. C'est ce
qui distingue une promesse d'une preuve.

En `file://` le navigateur ne publie aucune entrée de ressource : le compteur
secondaire se masque alors, plutôt que d'afficher un « 0 » faux. Servir la page
en HTTP pour le voir.

## Notes

- Aucune ressource tierce : polices copiées depuis le dépôt, pas de CDN. La page
  tient sa promesse dans sa propre construction.
- `site/dist/` est ignoré par git - c'est une sortie de build.
- Trouvé en construisant ce site : `Syne Mono` est déclarée dans `--font-body`
  de `popup.css` mais **aucune règle `@font-face` ne la charge**. L'extension
  retombe sur `system-ui`. Le fichier existe pourtant dans
  `extension/popup/fonts/Syne_Mono/`. À corriger côté extension.
