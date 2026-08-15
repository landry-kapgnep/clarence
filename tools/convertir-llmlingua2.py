"""Convertit LLMLingua-2 en ONNX depuis la source Apache 2.0.

    python tools/convertir-llmlingua2.py

POURQUOI CE SCRIPT EXISTE. Le navigateur ne sait exécuter que de l'ONNX ; or
Microsoft ne publie ses poids qu'en `.safetensors` (le format PyTorch). Le
développement s'est appuyé sur une conversion communautaire trouvée sur
HuggingFace — pratique, mais dont la fiche NE DÉCLARE AUCUNE LICENCE.

En droit d'auteur, l'absence de licence n'est pas une permission : par défaut
un travail publié est « tous droits réservés ». Redistribuer ce fichier à des
utilisateurs via le Chrome Web Store reviendrait donc à diffuser un artefact
dont on ne peut pas justifier les droits. S'y ajoute un risque concret : le
dépôt appartient à un particulier et peut disparaître du jour au lendemain,
emportant la fonction avec lui.

En convertissant NOUS-MÊMES depuis l'original Apache 2.0, on hérite des mêmes
droits — cette licence autorise explicitement les travaux dérivés et leur
redistribution, moyennant attribution (voir le NOTICE écrit à la fin).

Ce que le script produit, dans tools/llmlingua2-onnx/ :
    onnx/model.onnx            poids fp32
    onnx/model_quantized.onnx  poids int8 — c'est celui que l'extension charge
    tokenizer.json, config.json, ...  (indispensables : Transformers.js les lit)
    NOTICE                     attribution exigée par Apache 2.0

Reste ensuite à publier ce dossier sur un compte HuggingFace et à pointer
COMPRESSION_MODEL (src/engine/compression.js) dessus.
"""
import json
import shutil
from pathlib import Path

from optimum.exporters.onnx import main_export
from onnxruntime.quantization import quantize_dynamic, QuantType

SOURCE = "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank"
SORTIE = Path(__file__).parent / "llmlingua2-onnx"
ONNX = SORTIE / "onnx"

print(f"[1/4] Export ONNX depuis {SOURCE}…")
# `task` explicite : sans lui l'outil devine, et un mauvais choix produirait un
# graphe aux mauvaises sorties. Ce modèle est un classifieur de TOKENS.
main_export(
    model_name_or_path=SOURCE,
    output=ONNX,
    task="token-classification",
    opset=14,
)

# Transformers.js attend le modèle dans un sous-dossier `onnx/` et les fichiers
# de tokenisation à la RACINE du dépôt. L'export met tout au même endroit.
print("[2/4] Réorganisation à la disposition attendue par Transformers.js…")
for nom in ["config.json", "tokenizer.json", "tokenizer_config.json",
            "special_tokens_map.json", "vocab.txt"]:
    src = ONNX / nom
    if src.exists():
        shutil.copy(src, SORTIE / nom)

print("[3/4] Quantification int8…")
# int8 : ~4× plus léger que le fp32 (179 Mo au lieu de 710), pour une tâche de
# classification binaire où l'approximation reste sans effet visible.
#
# ⚠️ `per_channel=True` N'EST PAS UN DÉTAIL — il a été choisi par la mesure,
# pas par principe (tools/comparer-quantifications.py, six recettes comparées
# au vrai modèle PyTorch) :
#
#     par tenseur (le défaut)  écart moyen 0,033   max 0,221   2 décisions ≠
#     PAR CANAL                écart moyen 0,012   max 0,105   1 décision  ≠
#
# Soit près de 3× moins de dégradation, pour 1 Mo de plus. Un facteur d'échelle
# unique pour toute une matrice laisse une valeur aberrante ruiner la précision
# de tous les autres canaux ; un facteur par canal de sortie l'isole.
#
# `reduce_range=True` a été mesuré AUSSI, et il DÉGRADE ici (0,042, 5 décisions
# retournées) — ne pas le rajouter « par prudence ».
quantize_dynamic(
    model_input=str(ONNX / "model.onnx"),
    model_output=str(ONNX / "model_quantized.onnx"),
    weight_type=QuantType.QInt8,
    per_channel=True,
    extra_options=dict(EnableSubgraph=True),
)

print("[4/4] Fiche du modèle et NOTICE d'attribution…")
# LA FICHE PORTE LA LICENCE, et c'est tout l'objet de cette conversion : un
# dépôt HuggingFace SANS `license:` dans son en-tête est réputé « tous droits
# réservés » — exactement le défaut qu'on reproche à la conversion
# communautaire. Publier sans elle reviendrait à refaire le problème qu'on
# corrige. La source est committée (tools/carte-modele.md) pour que toute
# reconversion la réémette, au lieu de dépendre d'un geste manuel.
shutil.copy(Path(__file__).parent / "carte-modele.md", SORTIE / "README.md")
# Apache 2.0 §4 : toute redistribution doit conserver l'attribution. Ce fichier
# n'est pas une formalité — c'est la condition qui rend la redistribution licite.
(SORTIE / "NOTICE").write_text(
    "Ce dossier contient une conversion au format ONNX de :\n\n"
    f"  {SOURCE}\n"
    "  Copyright Microsoft Corporation\n"
    "  Distribué sous licence Apache 2.0\n"
    "  https://www.apache.org/licenses/LICENSE-2.0\n\n"
    "Modèle introduit par : Pan et al., « LLMLingua-2: Data Distillation for\n"
    "Efficient and Faithful Task-Agnostic Prompt Compression » (2024).\n\n"
    "Seul le FORMAT a été modifié (PyTorch -> ONNX, puis quantification int8).\n"
    "Les poids ne sont ni ré-entraînés ni modifiés autrement.\n\n"
    "Conversion réalisée pour le projet Clarence, afin de disposer de poids\n"
    "exécutables en navigateur dont la licence soit explicite.\n",
    encoding="utf-8",
)

for f in sorted(SORTIE.rglob("*")):
    if f.is_file():
        print(f"  {f.relative_to(SORTIE)}  {f.stat().st_size / 1e6:.1f} Mo")
print(f"\nTerminé → {SORTIE}")
print("Publier ce dossier sur HuggingFace, puis pointer COMPRESSION_MODEL dessus.")
