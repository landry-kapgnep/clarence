---
license: apache-2.0
base_model: microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank
pipeline_tag: token-classification
library_name: transformers.js
tags:
  - onnx
  - prompt-compression
  - llmlingua
  - bert
language:
  - multilingual
---

# LLMLingua-2 (ONNX, int8)

ONNX conversion of
[`microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank`](https://huggingface.co/microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank),
for running prompt compression **in the browser** with
[Transformers.js](https://github.com/huggingface/transformers.js).

Only the **format** was changed: PyTorch → ONNX, then dynamic int8
quantization. The weights are not retrained or otherwise modified.

## Why this exists

The upstream repository ships PyTorch weights only, and browsers can only run
ONNX. Existing community conversions were unusable for redistribution because
they declared **no licence** — and with no licence, the default is "all rights
reserved". This conversion is made from the Apache 2.0 original so that the
same permissions carry over, attribution included.

## Files

| file | size |
|---|---|
| `onnx/model_quantized.onnx` | 179 MB — int8, this is what you want |

The fp32 export is not published: it is 710 MB and no runtime here needs it.
Regenerate it from the upstream weights if required.

## Fidelity

The export was verified against the original PyTorch model rather than assumed
correct. Numbers are the mean/max absolute difference in p(keep) per token, and
the number of *flipped decisions* (keep vs. drop) over a French/English probe
set:

| | mean | max | flipped |
|---|---|---|---|
| this export, **fp32** | **0.00000** | 0.0000 | **0** |
| this export, **int8 per-channel** | 0.01217 | 0.1049 | 1 |
| int8 per-tensor (not used) | 0.02916 | 0.2154 | 1 |

The fp32 figure is the one that matters: the export itself is exact, and the
remaining gap comes only from quantization.

`per_channel=True` is deliberate — per-tensor quantization degrades roughly 3×
more for 1 MB less. `reduce_range=True` was also measured and made things
clearly worse, so it is not used.

Verified to load and run under **onnxruntime-web 1.14** (the version bundled by
Transformers.js v2) in a real browser.

## Usage

```js
import { pipeline } from '@xenova/transformers';

const pipe = await pipeline(
  'token-classification',
  'clarenceorg/llmlingua-2-onnx',
  { quantized: true }
);
```

The model has no `id2label`, so labels come out as `LABEL_0` / `LABEL_1`.
**`LABEL_1` means "keep the token"**; p(keep) for `LABEL_0` is `1 - score`.

Two practical notes, both learned the hard way:

- The window is **512 positions, not 512 words** — beyond that the pipeline
  truncates silently. Batch your input.
- The pipeline **omits some tokens** from its output (its `index` field skips
  values). Aligning a cursor over that stream desynchronises it permanently.
  Re-tokenize yourself and join scores back by `index`.

## Citation

```bibtex
@inproceedings{pan2024llmlingua2,
  title     = {{LLMLingua-2}: Data Distillation for Efficient and Faithful
               Task-Agnostic Prompt Compression},
  author    = {Pan, Zhuoshi and Wu, Qianhui and Jiang, Huiqiang and Xia, Menglin
               and Luo, Xufang and Zhang, Jue and Lin, Qingwei and Rühle, Victor
               and Yang, Yuqing and Lin, Chin-Yew and Zhao, H. Vicky and Qiu, Lili
               and Zhang, Dongmei},
  booktitle = {Findings of ACL 2024},
  year      = {2024}
}
```

## Licence

Apache 2.0, inherited from the upstream model. Copyright Microsoft Corporation.
See the `NOTICE` file in this repository.

Converted for [Clarence](https://github.com/landry-kapgnep/clarence), a
client-side PII anonymizer for LLM prompts.
