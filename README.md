# Clarence

Extension Chrome qui retire les données personnelles d'un texte ou fichier
avant de l'envoyer à Gemini/ChatGPT/Claude. Le traitement se fait entièrement du côté du navigateur

## Principe

Sur du texte collé dans la popup, ou sur un fichier CSV, XLSX, DOCX, PDF, JPG
ou PNG.

Deux layers de détection. Regex avec validation
mathématique : Luhn pour les cartes bancaires/SIRET, mod-97 pour les
IBAN, clé de contrôle pour les numéros de sécurité sociale. Elle est
déterministe, donc on ne la remplacera pas par un modèle. L'autre layer est un
modèle de reconnaissance d'entités qui tourne en WebAssembly dans un worker,
pour ce que le regex ne peut pas voir : noms, entreprises, lieux, postes,
établissements.

La détection « Jean Dupont » devient `[PERSONNE_1]` partout où il apparaît, ce qui permet au modèle de suivre
la même personne d'un bout à l'autre du document. La table de correspondance
reste en mémoire de la popup et sert à réinjecter les vraies valeurs dans la
réponse.

La détection n'est pas parfaite, il est donc possible d'enlever un faux positif à la main.

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

## Arborescence

| | |
|---|---|
| `src/engine/` | détection, fusion, masquage, pseudonymes. Pur et testé. |
| `src/files/` | adaptateurs CSV, XLSX, DOCX, PDF, image |
| `src/worker/` | les modèles, en WebAssembly, hors du thread principal |
| `src/popup/` | l'interface, bundlée vers `extension/` par le build |
| `extension/` | ce qu'on charge dans Chrome |
| `tests/` | unitaires, fixtures, bancs de mesure |

Les décisions d'implémentation et les pièges trouvés sont dans
[docs/notes-techniques.md](docs/notes-techniques.md). Les défauts de détection
connus dans
[docs/roadmap-detection.md](docs/roadmap-detection.md).
