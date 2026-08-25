# Corpus synthétique étiqueté — phases 1 et 2

Objectif : disposer d'un corpus annoté de PII qu'aucune source ouverte ne peut
fournir, puisque ce serait par définition des données personnelles. En
**générant** les documents, les étiquettes sont connues par construction.

```bash
node tools/corpus/generer.mjs 20000 > corpus.jsonl
```

Sortie au format d'entraînement de GLiNER, une ligne par exemple :

```json
{"tokenized_text": ["[","IDENTITÉ","]","Nom","MARTIN","DUBOIS"], "ner": [[4,5,"person"]]}
```

## Phase 1 — La sérialisation, tranchée par la mesure

`tests/bench/serialisation.mjs` compare trois façons d'écrire une unité, sur un
vrai CV :

| forme | détections | dont vraies | bruit |
|---|---|---|---|
| brut | 27 | 7 | 20 |
| **`[SECTION] texte`** | 23 | **7** | **16** |
| `section: … \| texte: …` | 19 | 5 | 14 |

Le préfixe de section retire quatre bruits **sans perdre une seule vraie
valeur** ; les champs nommés en coûtent deux. Le générateur produit donc la
forme `[SECTION] texte`.

⚠️ **À ne pas confondre** avec le libellé de CHAMP accolé à une cellule, qui lui
DÉGRADE la détection (mesure d'août : 0,74 sur le libellé contre 0,15 sur la
valeur). Un préfixe de *section* aide, un libellé de *champ* nuit.

## Phase 2 — Ce que le corpus doit contenir

**Les négatifs comptent plus que les positifs.** Le défaut mesuré n'est pas un
manque de rappel — 84 % au banc — c'est le bruit : sur un vrai CV, 20 masques
dont 10 faux. Le corpus est donc chargé de **négatifs durs**, tous relevés sur
de vrais documents, jamais inventés : `Canal acoustique de données`,
`Stack conteneurisée`, `Bénévole terrain`, `Profil R&D`, `Développement & Web`.
Ils apparaissent **sans aucune étiquette** — c'est ainsi qu'on apprend à ne rien
y voir.

**Deux garde-fous dans le générateur :**

- *Alignement des étiquettes.* Les indices sont calculés en découpant le texte
  partiel à chaque insertion ; si le découpeur se comporte autrement sur le
  texte complet, les étiquettes glissent et le modèle apprend de fausses
  frontières **sans que rien ne le signale**. Chaque span est donc revérifié
  contre la valeur réellement insérée, et le générateur échoue fort sinon.
- *Variété, comptée et affichée.* C'est la seule parade au sur-apprentissage :
  un corpus de 20 000 lignes tiré de 40 prénoms n'apprend que ces 40 prénoms.
  Nos viviers internes en comptent 74 au total ; quatre locales de Faker
  donnent, sur 5 000 lignes, **2 077 personnes, 1 244 entreprises et 360 lieux
  distincts**.

## Phases suivantes, non engagées

**3 — Entraînement.** `pip install gliner` (0.2.28, la bibliothèque officielle).
Pas sur cette machine : `torch` y est en version CPU, sans CUDA. Colab, Kaggle
(30 h de GPU par semaine, gratuit) ou une location à ~0,50 €/h. Sur un T4,
affiner un modèle de cette taille sur ~20 000 exemples se compte en heures.

**4 — Export.** Le modèle affiné doit ressortir en ONNX **dans le format exact
qu'attend GLiNER.js** (`span-level`, marqueurs `markerV0`), puis être quantifié
— la recette est déjà mesurée : int8 **par canal** (voir
`tools/comparer-quantifications.py`). C'est là que se situe le vrai risque
technique : notre outillage est éprouvé sur BERT, pas sur la tête de span de
GLiNER.

**5 — Mesure.** Banc avant/après, plus de vrais documents. Rien ne garantit
qu'un premier entraînement batte la base : c'est de la R&D.

## L'alternative moins chère, à considérer d'abord

Le corpus ci-dessus sert aussi — et surtout — à entraîner un simple **filtre de
précision** : un classifieur qui prend un candidat et des caractéristiques déjà
disponibles (présence au lexique, section, casse, score, occurrences) et répond
garder/jeter. Quelques jours au lieu de deux semaines, aucun export ONNX à
risque, aucun modèle supplémentaire à télécharger. `src/engine/vocabulaire.js`
en est déjà la version manuelle, à une seule caractéristique.
