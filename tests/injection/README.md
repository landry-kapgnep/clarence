# Rappel mesuré par injection contrôlée

`npm run injection`

## La lacune que ça comble

Les trois mesures existantes laissaient un angle mort :

| Mesure | Prose | Vérité terrain |
|---|---|---|
| `npm run bench` | synthétique (je l'ai écrite) | complète |
| `npm run regression` | **réelle** | **aucune** - dit si ça bouge, pas si c'est juste |
| `npm run injection` | **réelle** | **parfaite, sur l'injecté** |

Le principe : prendre de la vraie prose (les documents de
`tests/regression/corpus/`, déjà en place et ignorés par git), y **injecter**
des PII synthétiques à des positions connues, et vérifier qu'elles ressortent
masquées. La langue est authentique - ses tournures, sa ponctuation, ses
fragments d'extraction PDF - mais on sait exactement ce qui doit disparaître.

## Ce que ça NE mesure PAS

Le **sur-masquage**. On ne connaît la vérité que sur ce qu'on a injecté ; le
reste du document garde son statut inconnu. C'est donc une mesure de **rappel**,
pas de précision. Le sur-masquage se mesure sur `tests/manuel/tous-defauts.pdf`,
dont la vérité terrain est écrite à la main dans les deux sens.

## Les valeurs injectées

Synthétiques et reconnaissables comme telles - règle du projet : jamais de
données de test qui ressemblent à du réel. Carte `4242…`, domaines en
`.example`, IBAN et NIR à structure valide mais sans titulaire.

Chaque PII est posée dans une **phrase porteuse** rédigée dans sa langue, pas
jetée nue : une valeur sans contexte ne teste pas la même chose qu'une valeur
au fil d'une phrase. C'est précisément cette différence qui a révélé le premier
défaut (voir ci-dessous).

## Ce que le premier passage a trouvé

Immédiatement, sur de la prose allemande :

```
structuré   de      FUITE     12345678901
```

`« Die Steuer-ID lautet 12345678901 »` - le motif exigeait un `:` entre le
libellé et la valeur. Ici c'est un **verbe allemand** qui les relie. Le motif
marchait donc sur une fiche et échouait sur une phrase rédigée.

Le défaut était **déjà connu et corrigé** sur le motif `REFERENCE` (« his
employee identifier **is** EMP-4471-KD ») - il n'avait simplement pas été
répliqué sur `ID_NATIONAL`. Aucun de nos documents de test ne contenait ce cas.

Le correctif en a révélé un second, antérieur : le préfixe `[A-Z]{0,2}` du
motif absorbait le mot de liaison sous le drapeau `i`, produisant la valeur
`« is 123-45-6789 »`. Comme le span le plus long gagne à la fusion, le mot
« is » aurait été masqué avec le numéro.

Après correctif : **100 % structuré, 100 % contextuel**.

## Limite connue, non corrigée

Le NI britannique `AB 123456 C` n'est pas détecté : le motif exige un chiffre
final, or la clé du NI est une **lettre**. Défaut antérieur, hors du périmètre
FR/EN/ES/DE traité par P5 - consigné plutôt qu'élargi à la volée.
