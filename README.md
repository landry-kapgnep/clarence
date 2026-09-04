# Clarence

Extension Chrome qui retire les données personnelles d'un texte ou d'un fichier
avant qu'on le colle dans ChatGPT, Claude ou Gemini. Tout le traitement se fait
dans le navigateur : il n'y a pas de serveur, et aucun contenu ne part sur le
réseau. C'est vérifiable en une minute, voir plus bas.

## Ce qu'elle fait

Sur du texte collé dans la popup, ou sur un fichier CSV, XLSX, DOCX, PDF, JPG
ou PNG.

Deux couches de détection. La première est du regex avec validation
mathématique : Luhn pour les cartes bancaires et les SIRET, mod-97 pour les
IBAN, clé de contrôle pour les numéros de sécurité sociale. Elle est
déterministe, donc on ne la remplace jamais par un modèle. La seconde est un
modèle de reconnaissance d'entités qui tourne en WebAssembly dans un worker,
pour ce que le regex ne peut pas voir : noms, entreprises, lieux, postes,
établissements.

Ce qui est trouvé devient un placeholder numéroté et stable. « Jean Dupont »
donne `[PERSONNE_1]` partout où il apparaît, ce qui permet au modèle de suivre
la même personne d'un bout à l'autre du document. La table de correspondance
reste en mémoire de la popup et sert à réinjecter les vraies valeurs dans la
réponse.

La détection n'est pas parfaite et l'interface ne prétend pas le contraire :
tout ce qui a été repéré est surligné pour relecture, un faux positif se retire
d'un clic, et on peut masquer une sélection à la main.

## Vérifier qu'il n'y a pas de fuite

À refaire avant chaque release. Clic droit sur la popup, Inspecter, onglet
Network.

Au premier lancement, le modèle se télécharge depuis `huggingface.co` et ses
miroirs de fichiers : `cdn-lfs.huggingface.co`, `cdn-lfs-us-1.hf.co`,
`us.aws.cdn.hf.co`, `cas-bridge.xethub.hf.co`. Ce sont des demandes de fichier,
elles ne contiennent rien de l'utilisateur.

Ensuite, plus rien. Aucune requête, quel que soit le texte analysé, quelle que
soit sa taille. C'est la seule chose qu'il faut vraiment vérifier.

## Charger dans Chrome

```bash
npm install
npm run build
```

Puis dans `chrome://extensions`, activer le mode développeur, choisir
« Charger l'extension non empaquetée » et sélectionner le dossier `extension/`.
Les textes de `tests/fixtures/` servent de banc d'essai : ils contiennent des
noms difficiles et des pièges volontaires.

## Développement

```bash
npm test           # 518 tests
npm run build      # bundle src/ vers extension/, copie les runtimes WASM
```

Les validateurs, la fusion des chevauchements, la sélection et le masquage sont
en tolérance zéro : un bug là-dedans ne plante pas, il laisse fuir une donnée
sans rien dire. Le reste peut avoir une couverture plus légère.

Un test qui passe ne suffit pas. `src/popup/main.js` dépend des API Chrome et
n'est donc pas testé ; c'est précisément là qu'un plantage a cassé tout un mode
d'export avec 230 tests au vert. La checklist de
[docs/verification-chrome.md](docs/verification-chrome.md) existe pour ça.

## Arborescence

| | |
|---|---|
| `src/engine/` | détection, fusion, masquage, pseudonymes. Pur et testé. |
| `src/files/` | adaptateurs CSV, XLSX, DOCX, PDF, image |
| `src/worker/` | les modèles, en WebAssembly, hors du thread principal |
| `src/popup/` | l'interface, bundlée vers `extension/` par le build |
| `extension/` | ce qu'on charge dans Chrome |
| `tests/` | unitaires, fixtures, bancs de mesure |

Les décisions d'implémentation et les pièges rencontrés sont dans
[docs/notes-techniques.md](docs/notes-techniques.md). Les défauts de détection
connus, mesurés, avec ce qui est corrigé et ce qui ne l'est pas, dans
[docs/roadmap-detection.md](docs/roadmap-detection.md).
