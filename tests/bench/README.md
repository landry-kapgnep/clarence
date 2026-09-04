# Banc d'essai - à quelle distance sommes-nous d'une version publiable ?

```bash
npm run bench            # moteur complet (GLiNER réellement chargé)
npm run bench -- --regex # couche déterministe seule, rapide
```

Le modèle (~183 Mo) est téléchargé une fois dans `tests/bench/.modeles/`,
ignoré par git.

## Pourquoi ce banc existe

Les tests unitaires couvrent des fonctions pures. Ils étaient **tous au vert**
pendant que :

- le mode PDF « Garder la mise en page » plantait à l'ouverture ;
- la propagation ne franchissait pas la frontière du fichier réécrit, laissant
  un nom en clair dans le PDF livré alors qu'il apparaissait masqué à l'écran.

On mesurait ce qui est facile à mesurer, pas ce qui compte : **est-ce qu'un
fichier ressort propre ET encore exploitable**.

## Trois critères, pas une note

Une note unique n'a aucun sens pour un anonymiseur.

| Critère | Exigence | Pourquoi |
|---|---|---|
| **Rappel structuré** | **100 %** | Couche déterministe, validée mathématiquement (Luhn, mod-97, clé NIR). Un raté est un **bug**, pas une limite. C'est le seul chiffre sur lequel le produit peut promettre quelque chose. |
| **Rappel contextuel** | mesuré | Dépend d'un modèle statistique : 100 % est hors d'atteinte. On l'affiche honnêtement, l'UX anti-fausse-confiance fait le reste. |
| **Termes préservés** | élevé | Un document dont tout est masqué est « sûr » et **inutile**. Personne ne paie pour ça. |

Un échec sur le structuré **interdit de publier**. Un échec sur l'utilisabilité
**interdit de faire payer**.

## Ce que le banc mesure vraiment

Le PDF passe par la **reconstruction** (« Garder la mise en page »), pas par
l'extraction Markdown, et le fichier produit est **relu** pour vérification.
C'est délibéré : ce chemin réécrit le document depuis la liste d'entités, pas
depuis `maskedText`. Un banc qui lirait `maskedText` ne verrait jamais la
classe de bug qui l'a motivé.

## Ce que le banc NE dit PAS

Cinq documents synthétiques **ne prédisent pas** le comportement sur le fichier
d'un inconnu. Le banc sert à :

1. empêcher les régressions,
2. donner un plancher mesuré,
3. rendre les arbitrages discutables sur des chiffres.

Le seul vrai signal de « prêt », c'est **des fichiers réels de gens qui ne sont
pas nous**. Ce banc prépare cette étape, il ne la remplace pas.

## Vérifier le banc lui-même

Un banc qui ne voit pas les régressions ne sert à rien. Contrôle effectué :
neutraliser le motif email dans `src/engine/regex-detect.js` fait tomber le
rappel structuré de 100 % à 76 %, en nommant les trois emails fuités.

À noter : neutraliser `propagatedSpans` dans `anonymize-units.js` ne change
**rien** au résultat. Ce n'est pas une faiblesse du banc mais un constat
intéressant - GLiNER détecte si bien les valeurs isolées que la propagation
n'est plus le filet de sécurité qu'elle était avec le NER BERT.

## Ajouter un document

1. déposer le document dans `corpus/` (ou un script `gen-*.mjs` s'il est
   binaire - reproductible et committé, jamais un blob opaque) ;
2. l'annoter dans `verite-terrain.mjs` : `aMasquer` (par valeur, pas par
   position) et `aGarder` ;
3. **valeurs fictives obligatoires** et reconnaissables comme telles (carte
   `4242…`, domaines `.example`) - règle du projet.
