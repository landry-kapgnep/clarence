# Filtre de précision — entraîner un classifieur à reconnaître nos faux positifs

```bash
node tools/filtre/construire-jeu.mjs 300 > tools/filtre/jeu.jsonl
node tools/filtre/entrainer.mjs tools/filtre/jeu.jsonl
```

Le second affiche un bloc `export const POIDS = {…}` à recopier dans
`src/engine/poids-precision.js`. Rien n'est automatique : les poids passent par
une relecture humaine, comme n'importe quel code qui décide de **démasquer**.

## L'idée, en une phrase

`vocabulaire.js` répond « ce candidat est-il fait de mots du dictionnaire ? »
avec **une** caractéristique et un seuil binaire. Il a fallu lui retirer cinq
suffixes parce qu'ils mordaient sur des noms de lieux — le signe qu'une règle
écrite à la main avait atteint sa limite. Ici, une douzaine de signaux
**faibles** sont pesés ensemble.

## Ce qu'on entraîne, et sur quoi — la subtilité qui décide de tout

On n'entraîne **pas** sur les entités de référence du corpus : ça apprendrait à
reconnaître une entité, ce que le modèle sait déjà faire. On entraîne sur **les
candidats que notre détecteur produit réellement**, chacun étiqueté vrai/faux
par comparaison aux spans connus par construction. L'objectif est de reconnaître
**les erreurs de notre propre détecteur**.

D'où trois exigences de fidélité dans `construire-jeu.mjs` :

1. le vrai modèle, la vraie variante de poids, le vrai découpeur corrigé ;
2. la détection **unité par unité**, comme `anonymizeUnits` en production ;
3. l'**arbitre passe avant nous**, comme en production — sinon le filtre
   apprendrait à écarter ce que l'arbitre a déjà retiré, et surestimerait son
   apport.

Et des **documents**, pas des lignes : deux des caractéristiques les plus utiles
(occurrences, « le mot apparaît-il ailleurs en minuscules ? ») n'existent qu'à
l'échelle du document.

## Deux familles de faux positifs, et une seule est de notre ressort

Constaté en regardant les données, pas supposé :

| famille | exemples | qui s'en charge |
|---|---|---|
| **vocabulaire, intitulés** | `Bénévole terrain`, `Stack conteneurisée`, `Téléphone`, `Baccalauréat Général` | **ce filtre** |
| **technologies** | `Docker`, `JWT`, `PostgreSQL`, `JaCoCo` | les **profils** (« ne jamais masquer ») |

Aucune caractéristique de `caracteristiques.js` ne peut distinguer `Docker` de
`Twini`, `UNODC` ou `Semantikmatch` : ce sont les mêmes chaînes — courtes,
capitalisées, absentes de tout dictionnaire. Vouloir les faire tomber ici
apprendrait au filtre à jeter les vraies entités qui leur ressemblent, donc à
**fuir**. Le produit a déjà une meilleure réponse : une liste éditable,
propriété de l'utilisateur, et le refus explicite d'une liste de technos cachée
dans le moteur.

C'est pourquoi l'entraîneur ventile les deux familles. Les confondre donne un
chiffre global médiocre qui masque à la fois ce que le filtre sait faire et ce
qu'il ne peut pas faire.

## Le seuil est choisi sur une contrainte, pas sur un optimum

Le seuil retenu est **le plus agressif qui ne perd aucune vraie entité** sur les
données d'évaluation — traduction directe de « zéro-fuite d'abord, sur-masquage
juste derrière ». Un seuil choisi sur la F-mesure échangerait des fuites contre
du confort.

L'entraîneur affiche aussi la **courbe complète** du compromis : le seuil zéro-
perte est choisi sur un échantillon fini, et il faut voir s'il est un plateau
stable ou une falaise.

Séparation apprentissage/évaluation **par valeur**, jamais par ligne : si
`Semantikmatch` apparaît des deux côtés, on mesure une mémorisation.

## Les garde-fous, qui sont dans le code et pas seulement ici

- le filtre ne peut **que retirer** ;
- il ne touche **jamais le déterministe** (`source !== 'ner'`) ;
- il ne touche **jamais les personnes** — beaucoup de patronymes sont des mots
  courants (Blanc, Petit, Roux) et notre vivier de pseudonymes en est plein ;
- `POIDS === null` le rend **inerte**, comportement sûr par défaut.

`tests/unit/precision.test.mjs` vérifie chacun avec un modèle synthétique qui
rejette tout — les garde-fous doivent tenir quels que soient les nombres.

## Ce que le vocabulaire de sous-mots vient faire là

`fragmentation` mesure en combien de morceaux WordPiece un mot se casse : un
signal **indépendant de la langue**, candidat au remplacement des suffixes
français. Il a besoin de `tools/llmlingua2-onnx/vocab.txt` (~1 Mo, hors dépôt).
S'il manque, la caractéristique vaut 0 et l'entraînement le dit.

On ne l'embarquera que si la mesure prouve qu'il gagne sa place — d'où les
quatre variantes comparées par l'entraîneur (avec/sans suffixes,
avec/sans fragmentation).

## Limite connue, à ne pas oublier

Le filtre apprend les erreurs du détecteur **sur un corpus synthétique**. Si ce
corpus ne ressemble pas assez aux vrais documents, il apprendra des erreurs qui
n'arrivent pas. Parade : toujours évaluer aussi au banc (`npm run bench`, dont
la ligne « préservé » mesure exactement le sur-masquage) et sur de vrais
documents. Le générateur est fait pour être **enrichi à chaque nouveau cas
rencontré** — c'est là qu'il faut mettre l'effort, pas dans le réglage des
seuils.
