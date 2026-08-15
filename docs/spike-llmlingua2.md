# Spike LLMLingua-2 — compression de prompt par modèle (09/08/2026)

`node tests/spike-llmlingua2/run.mjs`

## Verdict : **GO CONDITIONNEL**

Le modèle tourne côté client, les placeholders survivent, le français ne souffre
pas. **Mais il inverse silencieusement le sens des phrases**, et c'est
disqualifiant en l'état. Une parade existe, mesurée, et elle coûte +13 %.

## Pourquoi ce spike

Mesure du 09/08 : il n'y a **aucun gain en tokens du côté du texte**. Conversion
Markdown −1 %, en-têtes répétés 1 %, sommaire 1 % (voir CLAUDE.md). LLMLingua-2
est le seul levier d'un ordre de grandeur supérieur qu'ait donné la recherche.

## Le modèle

`microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank`, Apache 2.0 —
**même architecture et même tâche** (classification de tokens) que notre moteur
BERT de repli : le worker existant saurait l'héberger sans réécriture.

**Extractif** : il ne peut que SUPPRIMER des mots, jamais en écrire. Aucune
hallucination possible, contrairement à un résumé par LLM. C'est ce qui le rend
compatible avec le principe du cadrage §8.

| | |
|---|---|
| Poids ONNX quantifié | **170 Mo** (676 Mo en fp32) |
| Chargement, première fois, Node | ~19 s |
| Fenêtre | 512 positions — même contrainte que le NER BERT |
| Étiquettes | pas d'`id2label` ; **LABEL_1 = garder**, identifié par sonde |

✅ **Réserve de licence — LEVÉE le 15/08/2026.** Le dépôt officiel Microsoft
n'a **pas** de poids ONNX. Le spike passait par une conversion communautaire
(`ldenoue/llmlingua-2-…`) dont la fiche **ne déclarait aucune licence** — donc
« tous droits réservés » par défaut, impossible à redistribuer. La conversion
est désormais faite maison (`tools/convertir-llmlingua2.py`) et publiée sous
**`clarenceorg/llmlingua-2-onnx`**, Apache 2.0 déclarée, `NOTICE` d'attribution
inclus. Chiffres et pièges plus bas.

## 1. Les placeholders survivent — question rédhibitoire levée

| | |
|---|---|
| Seuil naturel (0,5) | **6/8** intacts |
| Crochet ouvrant forcé | **8/8** intacts |

Le modèle juge les placeholders très informatifs : `PERSONNE` sort à **1,00**,
`_` à 0,81, le chiffre à 0,99. Seul le crochet **ouvrant** flotte autour du
seuil (0,42 à 0,80) — le forcer suffit, c'est un caractère.

⚠️ Piège de mesure rencontré : une première version annonçait **0/8**. Elle
rejoignait les mots par des espaces et cherchait `[PERSONNE_1]` dans un texte
contenant `[ PERSONNE _ 1 ]`. Le défaut était dans la mesure, pas dans le
modèle. **Une implémentation devra préserver l'espacement d'origine**, sinon
elle casse les placeholders qu'elle vient de conserver.

## 2. Le français ne souffre pas

Crainte de départ — entraîné sur MeetingBank, des transcriptions de réunions en
**anglais** — non confirmée.

| Document | Langue | Tokens | Gardés | Ratio |
|---|---|---|---|---|
| `rapport-fr.txt` | fr | 565 | 96 | **×5,89** |
| `certificat-fr.txt` | fr | 121 | 97 | ×1,25 |
| `dossier-rh.txt` | fr | 284 | 174 | ×1,63 |
| `email-pro-en.txt` | en | 198 | 130 | ×1,52 |

Le français n'est pas pénalisé face à l'anglais. **En revanche le taux varie
énormément selon le DOCUMENT** (×1,25 à ×5,89), et c'est un enseignement
opérationnel : le seuil naturel (argmax) donne un taux subi, pas choisi. Le
×5,89 ne garde que **47 mots sur 515** — beaucoup trop agressif pour un usage
réel. L'API LLMLingua-2 prend un **taux cible** ; ce doit être un réglage
utilisateur, jamais un sous-produit du seuil.

## 3. Le défaut disqualifiant : l'inversion silencieuse du sens

Sur quatre phrases pièges, **deux voient leur sens inversé** :

| Original | Compressé (seuil naturel) |
|---|---|
| « refusée, **sauf si** le dossier est complété » | « demande refusée dossier complété » |
| « **n'est pas** allergique à la pénicilline **mais** l'est aux sulfamides » | « patient allergique à pénicilline sulfamides » |

Le second est le pire cas imaginable pour cet outil : le LLM lira exactement
l'inverse, sur un document médical, **et l'utilisateur ne peut pas le voir** —
c'est la contrainte même qu'il a posée, on ne relit pas du texte compressé.
Une fuite est visible à la relecture ; ça, non.

### La parade : conservation forcée des opérateurs logiques

Admissible au sens de la règle du projet (voir `honorifics.js`) parce que la
classe est **FERMÉE** : une langue compte une poignée de négations et de
connecteurs et n'en invente pas — contrairement aux noms ou aux entreprises.

| Piège | Sans | Avec |
|---|---|---|
| « sauf si » | perdu | **restauré** |
| « n'est pas… mais » | inversé | **polarité restaurée** |
| « ne prévoit pas » | affaibli | **restauré** |
| « ne… jamais… sans » | partiel | **restauré** |
| EN « not… unless » | déjà correct | correct |
| DE « keine… aber » | perdu | **restauré** |

**Coût : +13 % de tokens.** Négligeable au regard d'un ×1,5 à ×5,9.

Imperfection restante : « n'est pas » ressort « n pas » (l'apostrophe et le
verbe sautent). La polarité est préservée, la lisibilité non.

## Le moteur, construit et mesuré (09/08/2026)

`src/engine/compression.js` — pipeline injecté, 20 tests, aucun modèle chargé.

**Décision au niveau du MOT, pas du token.** C'est ce qui règle le piège du
spike sans aucun recollage : un placeholder est UN mot, donc le garder le garde
entier. Mesuré, sur le texte masqué de la section 1 :

| | Placeholders intacts |
|---|---|
| Modèle seul | **0/8** |
| Via le moteur, taux 0,1 (le plus agressif) | **8/8** |

Les six pièges de sens sont réparés, et le taux devient **choisi** :

| Document | taux 0,5 | taux 0,3 |
|---|---|---|
| `rapport-fr.txt` | ×1,63 | ×2,56 |
| `certificat-fr.txt` | ×1,71 | ×2,97 |
| `dossier-rh.txt` | ×1,62 | ×2,60 |
| `email-pro-en.txt` | ×1,62 | ×2,76 |

### DEUX PIÈGES SILENCIEUX découverts en construisant

Ils ne viennent pas du modèle mais de son enveloppe, et tous deux produisent
**une absence de compression, sans erreur** :

1. **512 POSITIONS, pas 512 mots.** En français un mot pèse souvent 2 à 3
   sous-mots ; des lots de 300 mots dépassaient la fenêtre et le pipeline
   tronquait sans rien dire. Lots ramenés à 120.
2. **Le pipeline OMET des tokens de sa sortie.** Visible sur le champ `index`,
   qui saute (…6, 7, **9**, 10…) : tirets cadratins et quelques symboles
   disparaissent. Un alignement par curseur sur ce flux troué se désynchronise
   et ne s'en remet jamais — la moitié des mots d'un document se retrouvaient
   sans score, donc conservés par sécurité, donc aucune compression.
   **Correctif : retokeniser soi-même pour obtenir le flux complet et y
   recoller les scores par `index`.** À reproduire tel quel dans le worker.

Note : `start`/`end` sont à `null`, exactement comme sur le modèle NER — même
gotcha déjà consigné dans CLAUDE.md, donc pas d'alignement par offsets.

Le moteur remonte `motsSansScore` précisément pour que ce genre de panne ne
puisse plus être silencieuse.

## Conversion maison — faite le 15/08/2026

`python tools/convertir-llmlingua2.py` exporte les poids Apache 2.0 de Microsoft
en ONNX, les quantifie en int8 (**179 Mo**) et écrit le `NOTICE` d'attribution
qu'exige la licence. Trois choses ont été vérifiées plutôt que supposées.

**1. L'export est exact.** `tools/verifier-fidelite.py` compare chaque
conversion au vrai modèle PyTorch, la seule référence qui fasse autorité :

| conversion | écart moyen | max | décisions ≠ |
|---|---|---|---|
| notre export **fp32** | **0,00000** | 0,0000 | **0** |
| notre int8, par tenseur (1er essai) | 0,02916 | 0,2154 | 1 |
| notre int8, **par canal** (retenu) | **0,01217** | **0,1049** | **1** |
| communautaire int8 | 0,01197 | 0,1247 | 2 |

Le fp32 à 0,00000 est le résultat qui compte : **la conversion elle-même n'a
aucun défaut**. Tout l'écart restant vient de la quantification.

**2. `per_channel=True` n'est pas un détail.** La première recette dégradait
2,4× plus que la conversion communautaire. Six recettes ont été comparées
(`tools/comparer-quantifications.py`) : un facteur d'échelle **par canal de
sortie** au lieu d'un seul pour toute la matrice divise l'erreur par ~3, pour
1 Mo de plus. Notre modèle est alors à égalité de moyenne avec la version
communautaire, et **meilleur** sur le maximum (0,105 contre 0,125) et sur les
décisions retournées (1 contre 2). Contre-intuitif au passage :
`reduce_range=True`, qui sonne prudent, **dégrade** (0,042 / 5 décisions ≠).

**3. Ça tourne vraiment dans le navigateur.** La quantification par canal était
le vrai risque : ORT Web est en **1.14** (2023) et son support ne se devine pas.
Vérifié dans un navigateur réel sur ce runtime exact — modèle chargé en 878 ms,
inférence OK, et les placeholders tous au-dessus de **0,99**.

**Effet sur le texte produit** (`node tools/verifier-conversion.mjs`, qui fait
tourner le vrai moteur) : **5 sorties sur 6 rigoureusement identiques** à celles
du modèle communautaire. La seule différence apparaît au taux le plus agressif
(0,3), où « associés » cède la place à « prévisionnel » — deux noms communs
voisins au classement. Aucun placeholder, aucun opérateur logique perdu.

### Publication — faite le 15/08/2026

`clarenceorg/llmlingua-2-onnx`, sous une **organisation** HuggingFace et non un
compte personnel : cette URL est visible dans l'onglet Network, là même où le
produit invite l'utilisateur à vérifier que rien ne sort. Elle survit donc à un
transfert futur sans imposer une mise à jour d'extension.

Deux pièges, tous deux rencontrés :

- **La fiche porte la licence.** Le dépôt a d'abord été publié **sans** en-tête
  `license:` — donc réputé « tous droits réservés », exactement le défaut
  reproché à la conversion communautaire. Toute la conversion n'aurait servi à
  rien, et rien dans le code ne l'aurait signalé. La fiche est désormais un
  **artefact de build** (`tools/carte-modele.md`, recopiée par le script) et non
  un geste manuel oubliable.
- **Le fp32 (710 Mo) n'est pas publié** : l'extension ne charge que le
  quantifié. `--exclude "onnx/model.onnx"` ramène le téléversement de 890 à
  183 Mo, et il se régénère en une commande.

`node tools/verifier-publication.mjs` vérifie ce qu'aucun autre script ne peut
voir — les autres chargent les poids depuis un dossier local et valident donc le
modèle, jamais sa publication. Il part d'un cache **vide** et télécharge comme
le fera l'extension. Mesuré sur le dépôt en ligne : **179 Mo en 55 s**, licence
`apache-2.0` déclarée, **5/5 placeholders intacts au taux 0,1**, négation
conservée, zéro mot sans score.

## Ce qu'il resterait à faire avant de livrer

1. **Préserver l'espacement d'origine** à la reconstruction — sinon les
   placeholders conservés sont cassés à l'écriture.
2. **Exposer un taux cible**, pas le seuil brut.
3. Respecter les **trois contraintes produit** déjà consignées dans CLAUDE.md :
   option explicite, prose appauvrie annoncée, transformation d'**export** et
   non étape du pipeline.
4. Trancher les **+179 Mo** en plus des 183 Mo de GLiNER.

## Ce que ce spike ne dit pas

Il mesure la compression et la préservation du sens sur des phrases choisies
pour piéger. Il ne dit **rien** de la qualité des réponses d'un vrai LLM sur un
vrai document compressé — c'est la mesure suivante, et elle demande d'appeler un
LLM, donc elle ne peut pas être automatisée dans ce dépôt.
