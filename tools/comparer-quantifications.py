"""Quelle recette de quantification int8 dégrade le moins ? — mesure.

    python tools/comparer-quantifications.py

POURQUOI. `verifier-fidelite.py` a établi que notre export fp32 est EXACT
(écart 0,00000 contre PyTorch) : la conversion n'a aucun défaut. Tout l'écart
observé vient de l'étape suivante, la quantification int8 — une approximation
qui remplace chaque poids par un entier sur 8 bits.

La première recette essayée (QInt8, par tenseur) dégradait 2,4× plus que la
conversion communautaire. Ce n'est pas une fatalité : la quantification a des
réglages, et leur effet se mesure. On balaie les recettes plausibles et on
garde la plus fidèle — sans deviner.

`per_channel` est le réglage le plus prometteur : au lieu d'un facteur d'échelle
unique pour toute une matrice, il en calcule un PAR canal de sortie, donc une
valeur aberrante dans un canal ne ruine plus la précision de tous les autres.
"""
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from onnxruntime.quantization import quantize_dynamic, QuantType
from transformers import AutoModelForTokenClassification, AutoTokenizer

SOURCE = "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank"
DOSSIER = Path(__file__).parent / "llmlingua2-onnx" / "onnx"
FP32 = DOSSIER / "model.onnx"
TEMP = Path(__file__).parent / ".quant-essais"
TEMP.mkdir(exist_ok=True)

TEXTES = [
    "Le rapport de [PERSONNE_1] indique que la réunion du 14 mars s'est tenue à "
    "[VILLE_2] en présence des associés de [ENTREPRISE_3], qui ont validé le budget.",
    "Le patient n'est pas allergique à la pénicilline mais l'est aux sulfamides.",
    "The committee reviewed the quarterly report and unanimously approved the "
    "proposed amendment to the housing ordinance.",
    "La convention collective prévoit une clause de non-concurrence de vingt-quatre "
    "mois, applicable sur l'ensemble du territoire national, assortie d'une contrepartie.",
]

tok = AutoTokenizer.from_pretrained(SOURCE)
entrees = [tok(t, return_tensors="np") for t in TEXTES]


def p_garder_onnx(chemin):
    sess = ort.InferenceSession(str(chemin), providers=["CPUExecutionProvider"])
    attendus = {i.name for i in sess.get_inputs()}
    out = []
    for e in entrees:
        feed = {k: v.astype(np.int64) for k, v in e.items() if k in attendus}
        logits = sess.run(None, feed)[0]
        exp = np.exp(logits - logits.max(-1, keepdims=True))
        out.append((exp / exp.sum(-1, keepdims=True))[0, :, 1])
    return out


print("[référence] PyTorch…")
modele = AutoModelForTokenClassification.from_pretrained(SOURCE).eval()
ref = []
for e in entrees:
    with torch.no_grad():
        logits = modele(**{k: torch.tensor(v) for k, v in e.items()}).logits
    ref.append(torch.softmax(logits, -1)[0, :, 1].numpy())

RECETTES = [
    ("QInt8  par tenseur", dict(weight_type=QuantType.QInt8, per_channel=False, reduce_range=False)),
    ("QUInt8 par tenseur", dict(weight_type=QuantType.QUInt8, per_channel=False, reduce_range=False)),
    ("QInt8  par canal", dict(weight_type=QuantType.QInt8, per_channel=True, reduce_range=False)),
    ("QUInt8 par canal", dict(weight_type=QuantType.QUInt8, per_channel=True, reduce_range=False)),
    ("QUInt8 par tenseur, plage réduite", dict(weight_type=QuantType.QUInt8, per_channel=False, reduce_range=True)),
    ("QInt8  par canal, plage réduite", dict(weight_type=QuantType.QInt8, per_channel=True, reduce_range=True)),
]

print(f"\n{'recette':<36}{'poids':>9}{'moy.':>9}{'max':>8}{'déc. ≠':>8}")
print("─" * 70)
resultats = []
for nom, opts in RECETTES:
    sortie = TEMP / (nom.replace(" ", "_").replace(",", "") + ".onnx")
    quantize_dynamic(model_input=str(FP32), model_output=str(sortie),
                     extra_options=dict(EnableSubgraph=True), **opts)
    s = p_garder_onnx(sortie)
    d = np.concatenate([np.abs(x - y) for x, y in zip(ref, s)])
    flips = sum(int(((x >= 0.5) != (y >= 0.5)).sum()) for x, y in zip(ref, s))
    mo = sortie.stat().st_size / 1e6
    resultats.append((d.mean(), nom, opts, mo, d.max(), flips))
    print(f"{nom:<36}{mo:>7.0f}Mo{d.mean():>9.5f}{d.max():>8.4f}{flips:>8}")

resultats.sort()
_, nom, opts, *_ = resultats[0]
print(f"\nLa plus fidèle : {nom}")
print("Rappel : la conversion communautaire est à 0,01197 / 0,1247 / 2 décisions.")
print("\n⚠ Vérifier que la recette retenue s'exécute bien dans ORT Web (navigateur)")
print("  avant de la retenir : la fidélité ne sert à rien si le modèle ne charge pas.")
