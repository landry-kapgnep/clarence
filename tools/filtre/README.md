# Filtre de précision — entraîner un classifieur à reconnaître nos faux positifs

```bash
node tools/filtre/construire-jeu.mjs 340 > tools/filtre/jeu.jsonl
node tools/filtre/entrainer.mjs tools/filtre/jeu.jsonl          # affiche seulement
VARIANTE=sans-les-deux ECRIRE=1 node tools/filtre/entrainer.mjs tools/filtre/jeu.jsonl
```

Sans `ECRIRE`, l'entraîneur ne fait qu'**afficher** : une exécution exploratoire
ne doit jamais modifier le moteur par surprise. Avec, il écrit
`src/engine/poids-precision.js` lui-même — jamais de recopie à la main, un
poids mal transcrit ne produirait aucune erreur, seulement des décisions fausses.

`tools/filtre/diagnostiquer.mjs <fichier…>` répond à « pourquoi ce candidat
a-t-il été retiré ? » sur un vrai document, en nommant la caractéristique
responsable. C'est ce qui a permis de diagnostiquer les deux fuites décrites
plus bas au lieu de les deviner.

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

Le seuil retenu est **le plus agressif dont la perte reste sous une tolérance
énoncée** (0,5 % des vraies entités par défaut, `TOLERANCE=`).

⚠️ La première version exigeait ZÉRO perte exacte. Elle ne tient pas : sur 93
candidats d'évaluation elle donnait 0,10, sur 367 elle donne **0,00**. Une
contrainte à zéro est décidée par le pire point du lot, donc plus l'échantillon
grandit, plus elle tend vers « ne rien faire ». Sa prudence est une illusion.

Ce n'est pas un renoncement à « zéro-fuite d'abord » : le produit accepte déjà
des pertes sur ce périmètre (vocabulaire.js documente « Orange », « Total »,
« Le Monde »), et le filtre ne touche ni aux personnes ni au structuré. **Mais
la tolérance ne dispense pas de REGARDER ce qu'on perd** : l'entraîneur nomme
chaque perte, parce qu'un décompte ne dit pas si c'est une erreur de frontière
ou une fuite franche. C'est cette lecture qui a fixé la limite haute — à 0,50 on
perdait « Kallabisland » et « Le roux et Fontaine », sans excuse.

Il affiche aussi la **courbe complète** du compromis, pour voir si le seuil est
un plateau stable ou une falaise.

Séparation apprentissage/évaluation **par valeur**, jamais par ligne : si
`Semantikmatch` apparaît des deux côtés, on mesure une mémorisation.

## Les garde-fous, qui sont dans le code et pas seulement ici

1. il ne peut **que retirer**, jamais ajouter ;
2. il ne touche **jamais le déterministe** (`source !== 'ner'`) ;
3. il ne touche **jamais les types autres qu'ORG/LOC** — beaucoup de patronymes
   sont des mots courants (Blanc, Petit, Roux) et notre vivier de pseudonymes en
   est plein ;
4. il ne juge **jamais un candidat d'un seul mot** — trop peu de prise, et c'est
   la forme des patronymes et des villes ;
5. il ne touche **jamais ce qui a la FORME d'un nom propre** — parce que le
   garde-fou 3 s'appuie sur l'étiquette du modèle, qu'il peut se tromper à
   donner.

Et `POIDS === null` le rend **inerte**, comportement sûr par défaut.

`tests/unit/precision.test.mjs` vérifie chacun avec un modèle synthétique qui
rejette tout — les garde-fous doivent tenir quels que soient les nombres.

## Le vocabulaire de sous-mots : mesuré, puis ÉCARTÉ

`fragmentation` mesure en combien de morceaux WordPiece un mot se casse — un
signal indépendant de la langue, qu'on espérait voir remplacer les suffixes
français. Il a besoin de `tools/llmlingua2-onnx/vocab.txt` (~1 Mo, hors dépôt).

**La mesure a dit non, et elle a changé d'avis en cours de route** — ce qui est
la raison même d'avoir mesuré :

| jeu d'évaluation | toutes | sans suffixes | sans fragmentation | sans les deux |
|---|---|---|---|---|
| corpus initial, sans garde-fous | 93/164 | 90/164 | 77/164 | 71/164 |
| **corpus corrigé + garde-fous 4-5** | 11/56 | 8/56 | **38/56** | 36/56 |

Sur le premier jeu, la fragmentation semblait valoir 16 faux positifs. Une fois
le corpus corrigé (familles à chiffres) et les garde-fous posés, elle en fait
perdre 25. Le premier chiffre était un artefact d'un corpus défaillant.

**On expédie donc `sans-les-deux`** : ni le mégaoctet de vocabulaire, ni la
liste de suffixes française. Et ce n'est pas seulement une question de coût —
`filtrerParPrecision` ne passe jamais `sousMots` en production, donc la
fragmentation y vaut 0 en toutes circonstances. Livrer des poids entraînés sur
de vraies valeurs de fragmentation aurait appliqué le modèle **hors de son
domaine**, sans erreur ni signal. `tests/unit/precision.test.mjs` interdit
désormais ce cas.

## Les deux fuites que le banc a attrapées, et ce qu'elles ont appris

Aucune n'était un défaut du classifieur.

**1. « chiffre ⇒ pas une entité » (poids −4,6).** Le corpus ne contenait AUCUNE
valeur à chiffres qui soit une vraie donnée personnelle — que des pièges
(« Baccalauréat Général 2016 », « Mars 2026 »). Le filtre retirait donc
`42 rue des Cordeliers`, `44000 Nantes` et `EMP-0012` — ce dernier étant le plus
grave, puisque le déterministe **ne le voit pas** (`detectRegex('EMP-0012')`
rend `[]`) : il n'était masqué que par la couche contextuelle. Banc : NON
PUBLIABLE. Correctif : adresses, codes postaux et matricules ajoutés comme
VRAIES entités. Le poids est passé de −4,6 à **+2,9**.

**2. Un patronyme mal étiqueté reste un patronyme.** Sur une phrase écrite
exprès — *« Rose Fontaine cultive une rose ancienne dans son jardin »* — le
modèle étiquette `Rose Fontaine` en ENTREPRISE. Le garde-fou « jamais les
personnes » raisonnait par TYPE : il ne la voyait pas. Et les deux signaux dont
ce filtre tire sa valeur se retournaient contre elle (« rose » est au
dictionnaire, et le document l'écrit en minuscules plus loin). D'où les
garde-fous 4 et 5, tous deux mesurés avant d'être posés :

| garde-fou | protège | coûte |
|---|---|---|
| **4** — au moins 2 mots | patronymes et villes isolés (`Vaquier`, `Calahorra`) | 2 valeurs, toutes deux des technos |
| **5** — pas la forme d'un nom propre | 458 vraies entités sur 706 | 7 faux positifs sur 418 |

Leçon commune, déjà écrite dans P12 : **quand le modèle apprend une règle
absurde, chercher d'abord ce qu'on a oublié de lui montrer** — et quand un
garde-fou est contourné, regarder s'il s'appuie sur une étiquette (que le modèle
peut se tromper à donner) plutôt que sur une forme (qui, elle, ne ment pas).

## Ce que ça donne, honnêtement

Sur le jeu d'évaluation (séparé par valeur) : **36/56 faux positifs retirés,
zéro vraie entité perdue**, là où le filtre actuellement livré en retire **0/56**.

Au banc : **aucune régression, et un gain modeste** — 5 masques de moins sur
2 des 9 documents, aucune métrique déplacée. C'est attendu et il faut le dire :
les sur-masquages qui restent au banc sont `PostgreSQL`, `Kubernetes`,
`SPRACHEN`, `Unternehmen`, `Abteilung` — tous d'UN SEUL MOT, donc exclus par
construction (garde-fou 4) et relevant des profils.

Le gain réel se joue sur les documents à rubriques — CV, formulaires, dossiers —
riches en groupes nominaux de plusieurs mots. C'est là qu'il faut le vérifier,
en vrai Chrome, sur de vrais fichiers.

## Limite connue, à ne pas oublier

Le filtre apprend les erreurs du détecteur **sur un corpus synthétique**. Si ce
corpus ne ressemble pas assez aux vrais documents, il apprendra des erreurs qui
n'arrivent pas. Parade : toujours évaluer aussi au banc (`npm run bench`, dont
la ligne « préservé » mesure exactement le sur-masquage) et sur de vrais
documents. Le générateur est fait pour être **enrichi à chaque nouveau cas
rencontré** — c'est là qu'il faut mettre l'effort, pas dans le réglage des
seuils.
