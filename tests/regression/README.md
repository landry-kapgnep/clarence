# Non-régression sur de vrais documents

`npm run regression`

## Pourquoi, alors qu'il y a déjà `npm run bench`

Le banc tourne sur **7 documents synthétiques**, que j'ai écrits en connaissant
le moteur. C'est un biais structurel, et le banc l'admet lui-même en pied de
page : « 7 documents synthétiques ne prédisent PAS le fichier d'un inconnu ».

Le fait est vérifiable sur la session du 07-08/08/2026 : **tous** les défauts
réels ont été trouvés sur de VRAIS documents - un mémoire français de 75 pages,
un mémoire anglais de 21 pages - et **aucun** sur le corpus synthétique. Parmi
eux : le sur-masquage massif de `ChatGPT` (41 occurrences), la règle
« ne jamais masquer » qui ne fonctionnait qu'à l'égalité stricte, et les
9 fuites de la couche déterministe hors du français.

## Ce que ce harnais mesure - et ce qu'il ne mesure pas

Il ne mesure **pas la justesse**. Sur un document quelconque, personne ne
connaît la vérité terrain : impossible de dire si un masque est mérité.

Il mesure la **stabilité** : la sortie a-t-elle changé depuis la dernière fois ?
Beaucoup moins ambitieux, et beaucoup plus utile qu'il n'y paraît - c'est ce qui
attrape la régression silencieuse, celle qui passe les 360 tests unitaires **et**
le banc sans laisser de trace.

L'écart est qualifié par son **sens**, jamais mis dans le même sac :

```
NE MASQUE PLUS 10 valeur(s) — risque de fuite
masque 1 valeur(s) EN PLUS
```

## Ce qui est committé, et ce qui ne l'est jamais

| | Committé ? |
|---|---|
| `corpus/` - les documents | **Non.** Ignoré par git : ce sont de vrais fichiers, parfois personnels |
| `instantanes/*.json` | Oui - mais **uniquement des empreintes** des valeurs masquées |

Les instantanés ne contiennent jamais les valeurs en clair. Sinon ils
deviendraient exactement ce que la règle du projet interdit : une liste de noms,
d'adresses et d'identifiants réels dans le dépôt.

L'empreinte du document source est enregistrée : si le fichier change, l'écart
n'est pas une régression du moteur, et le harnais le dit explicitement plutôt
que de laisser accuser le code.

## Utilisation

```bash
npm run regression              # compare, sort en erreur si ça bouge
npm run regression -- --maj     # réécrit les instantanés (changement VOULU)
npm run regression -- --detail  # affiche les valeurs en clair (local seulement)
```

Déposer les documents dans `corpus/`. Formats : PDF, CSV, XLSX, DOCX.

## Vérifié rouge avant vert

Un filet qu'on n'a jamais vu se déclencher ne prouve rien. Le harnais a été
éprouvé en montant délibérément le seuil du groupe identité de 0,46 à 0,60 :

```
ÉCART  piege.pdf
       valeurs masquées : 133 -> 122
       NE MASQUE PLUS 13 valeur(s) — risque de fuite
```

Seuil restauré, retour au vert, code de sortie 0. À refaire si le harnais est
modifié en profondeur.

## Limite connue

Un écart n'est **pas** forcément un bug - un correctif volontaire en produit un
aussi. Le harnais ne tranche pas, il **oblige à expliquer**. C'est son rôle.
