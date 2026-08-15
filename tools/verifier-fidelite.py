"""Quelle conversion est fidèle au vrai modèle ? — la référence est PyTorch.

    python tools/verifier-fidelite.py

POURQUOI. `verifier-conversion.mjs` a montré que notre conversion et la
conversion communautaire ne donnent pas les mêmes scores (écart moyen 0,036,
maximum 0,21, une décision retournée). Constater l'écart ne dit pas QUI a
raison : les deux sont des dérivés quantifiés, et la quantification int8 est une
approximation qui introduit une erreur réelle.

La seule référence qui tranche est le modèle PyTorch d'origine — celui que
Microsoft publie, avant toute conversion. On mesure donc la distance de CHAQUE
conversion à cette référence, sur les mêmes entrées et la même tokenisation.

Ce qui est comparé, c'est p(garder) = softmax(logits)[1] par token.
"""
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from huggingface_hub import hf_hub_download
from transformers import AutoModelForTokenClassification, AutoTokenizer

SOURCE = "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank"
COMMUNAUTAIRE = "ldenoue/llmlingua-2-bert-base-multilingual-cased-meetingbank"
NOTRE = Path(__file__).parent / "llmlingua2-onnx" / "onnx"

TEXTES = [
    "Le rapport de [PERSONNE_1] indique que la réunion du 14 mars s'est tenue à "
    "[VILLE_2] en présence des associés de [ENTREPRISE_3], qui ont validé le budget.",
    "Le patient n'est pas allergique à la pénicilline mais l'est aux sulfamides.",
    "The committee reviewed the quarterly report and unanimously approved the "
    "proposed amendment to the housing ordinance.",
]

tok = AutoTokenizer.from_pretrained(SOURCE)
entrees = [tok(t, return_tensors="np") for t in TEXTES]


def p_garder_torch():
    modele = AutoModelForTokenClassification.from_pretrained(SOURCE).eval()
    sorties = []
    for e in entrees:
        with torch.no_grad():
            logits = modele(**{k: torch.tensor(v) for k, v in e.items()}).logits
        sorties.append(torch.softmax(logits, -1)[0, :, 1].numpy())
    return sorties


def p_garder_onnx(chemin):
    sess = ort.InferenceSession(str(chemin), providers=["CPUExecutionProvider"])
    attendus = {i.name for i in sess.get_inputs()}
    sorties = []
    for e in entrees:
        feed = {k: v.astype(np.int64) for k, v in e.items() if k in attendus}
        logits = sess.run(None, feed)[0]
        exp = np.exp(logits - logits.max(-1, keepdims=True))
        sorties.append((exp / exp.sum(-1, keepdims=True))[0, :, 1])
    return sorties


def ecart(a, b):
    d = np.concatenate([np.abs(x - y) for x, y in zip(a, b)])
    # Une décision retournée = les deux modèles ne sont pas d'accord pour
    # garder ou couper. C'est le seul écart qui change vraiment la sortie.
    flips = sum(int(((x >= 0.5) != (y >= 0.5)).sum()) for x, y in zip(a, b))
    return d.mean(), d.max(), flips


print("[référence] modèle PyTorch de Microsoft…")
ref = p_garder_torch()

print("[1] notre export fp32…")
notre_fp32 = p_garder_onnx(NOTRE / "model.onnx")

print("[2] notre quantification int8…")
notre_int8 = p_garder_onnx(NOTRE / "model_quantized.onnx")

print("[3] conversion communautaire (téléchargement)…")
chemin_com = hf_hub_download(COMMUNAUTAIRE, "onnx/model_quantized.onnx")
com_int8 = p_garder_onnx(chemin_com)

print(f"\n{'conversion':<34}{'écart moy.':>11}{'max':>9}{'décisions ≠':>13}")
print("─" * 67)
for nom, s in [("notre export fp32", notre_fp32),
               ("notre quantification int8", notre_int8),
               ("communautaire int8", com_int8)]:
    m, x, f = ecart(ref, s)
    print(f"{nom:<34}{m:>11.5f}{x:>9.4f}{f:>13}")

print("\nLecture : l'écart le plus FAIBLE est la conversion la plus fidèle.")
print("Le fp32 doit être quasi nul (~1e-6) — sinon l'export lui-même est fautif.")
