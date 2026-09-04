# tools/ - conversion des poids LLMLingua-2

Outils **hors runtime** : rien ici n'est embarqué dans l'extension. Ils servent
à produire, une fois, les poids que l'extension téléchargera ensuite.

## Pourquoi cette conversion existe

Le navigateur ne sait exécuter que de l'**ONNX**. Or Microsoft ne publie
LLMLingua-2 qu'en `.safetensors` (le format PyTorch). Le développement s'est
donc appuyé sur une conversion communautaire trouvée sur HuggingFace -
pratique, mais dont la fiche **ne déclare aucune licence**.

En droit d'auteur, l'absence de licence n'est pas une permission : par défaut,
un travail publié est « tous droits réservés ». Le redistribuer aux
utilisateurs via le Chrome Web Store reviendrait à diffuser un artefact dont on
ne peut pas justifier les droits. S'y ajoute un risque concret : le dépôt
appartient à un particulier et peut disparaître, emportant la fonction avec lui.

En convertissant nous-mêmes depuis l'original **Apache 2.0**, on hérite des
mêmes droits - cette licence autorise explicitement les travaux dérivés et leur
redistribution, moyennant attribution (le fichier `NOTICE` produit par le
script).

## Les trois scripts

| | |
|---|---|
| `convertir-llmlingua2.py` | produit les poids ONNX fp32 + int8 et le `NOTICE` |
| `verifier-fidelite.py` | mesure chaque conversion contre le **vrai PyTorch** |
| `verifier-conversion.mjs` | compare le **texte compressé** produit par les deux modèles |

La sortie va dans `tools/llmlingua2-onnx/`, **ignoré par git** : 890 Mo
d'artefacts de build n'ont pas leur place dans un dépôt.

### Prérequis (une fois)

```bash
python -m pip install optimum optimum-onnx onnx onnxruntime torch transformers
```

### Produire les poids

```bash
python tools/convertir-llmlingua2.py
```

### Vérifier (à ne pas sauter si on reconvertit)

```bash
python tools/verifier-fidelite.py
```

Résultats consignés dans `docs/spike-llmlingua2.md`. Le chiffre à surveiller est
l'écart du **fp32** : il doit être quasi nul. S'il ne l'est pas, l'export est
fautif et la quantification n'y changera rien.

```bash
node tools/verifier-conversion.mjs
```

Fait tourner le **vrai moteur** (`src/engine/compression.js`) avec chaque modèle
et compare les textes produits. Une différence sur un nom commun au taux
agressif est bénigne ; **un placeholder ou un opérateur logique perdu ne l'est
pas** - ce serait une erreur silencieuse et irrattrapable, puisqu'on ne relit
jamais un texte compressé.

## L'étape qui reste, et qui demande ton compte

L'extension charge le modèle **par son identifiant HuggingFace**. Tant que le
dossier converti n'est pas publié, `COMPRESSION_MODEL` pointe encore sur la
conversion communautaire - **c'est le bloquant de publication**.

Il faut donc un dépôt sur **ton** compte HuggingFace. Ce choix t'appartient
(sous quel compte, sous quel nom), et la publication n'a rien d'automatique.

```bash
python -m pip install huggingface_hub
hf auth login
hf upload <ton-compte>/llmlingua-2-onnx "<racine-du-dépôt>/tools/llmlingua2-onnx" . --repo-type model --exclude "onnx/model.onnx"
```

Deux pièges, tous deux rencontrés :

- **`huggingface-cli` est déprécié** au profit de `hf` (`hf auth login`,
  `hf upload`). L'ancienne forme marche encore, avec un avertissement.
- **Le chemin est relatif au répertoire courant**, pas à la racine du dépôt.
  Depuis `C:\Users\Adrien`, `tools/llmlingua2-onnx` n'existe pas et la commande
  échoue sur un `FileNotFoundError` peu parlant. D'où le chemin absolu ci-dessus.

`--exclude "onnx/model.onnx"` écarte le **fp32 de 710 Mo**, dont l'extension ne
se sert jamais : elle ne charge que `model_quantized.onnx`. Sans ça on
téléverse 890 Mo au lieu de 183, pour aucun bénéfice au runtime - et le fp32 se
régénère en une commande. Le garder en ligne pour la traçabilité reste un choix
défendable ; il suffit de retirer l'option.

Puis, dans `src/engine/compression.js` :

```js
export const COMPRESSION_MODEL = '<ton-compte>/llmlingua-2-onnx';
```

…et `npm run build`.

Pense à mettre **`license: apache-2.0`** dans la fiche du dépôt HuggingFace :
c'est ce qui rend explicite le droit qu'on vient justement de sécuriser, et son
absence est précisément le problème qu'on corrige.

### Note de confidentialité

Publier ces poids ne touche en rien au principe du projet : ce sont les poids
d'un modèle public, aucune donnée utilisateur n'y figure. Le téléchargement du
modèle est une requête **entrante** ; rien du texte de l'utilisateur ne sort
jamais du navigateur.
