# Clarence — anonymiseur PII client-side pour LLM

Extension Chrome (Manifest V3) qui anonymise le texte sensible avant collage
dans ChatGPT / Claude / Gemini. **Aucune donnée utilisateur ne quitte le
navigateur** (voir CLAUDE.md, principe non négociable).

## Arborescence

- `src/engine/` — moteur de détection/masquage (source de vérité, testé)
- `src/popup/main.js` — source de la popup (bundlée par le build)
- `extension/` — l'extension chargeable dans Chrome (générée + fichiers statiques)
- `tests/unit/` — tests zéro-tolérance (validators, merge, masking) + fixtures
- `tests/atelier-fixtures.html` — harnais navigateur autonome (Étape 0)

## Développement

```bash
npm install        # esbuild + @xenova/transformers (dev uniquement)
npm test           # 31 tests
npm run build      # bundle src/popup → extension/popup/popup.js + vendor/*.wasm
```

## Charger dans Chrome (mode développeur)

1. `npm install && npm run build`
2. `chrome://extensions` → activer « Mode développeur »
3. « Charger l'extension non empaquetée » → sélectionner le dossier `extension/`
4. Épingler Clarence, ouvrir la popup, coller un texte de `tests/fixtures/`

## Vérification « aucune fuite » (à refaire avant chaque release)

DevTools sur la popup (clic droit → Inspecter) → onglet Network :
- au 1er clic sur « Activer la détection des noms » : uniquement des requêtes
  `huggingface.co` / `cdn-lfs.huggingface.co` (poids du modèle, mis en cache)
- ensuite : **zéro requête**, quel que soit le texte analysé

## Notes techniques

- MV3 interdit le code distant → Transformers.js est bundlé, les runtimes WASM
  sont dans `extension/vendor/`, `wasmPaths` pointe dessus.
- CSP : `wasm-unsafe-eval` requis pour ONNX Runtime Web.
- `numThreads = 1` : évite les workers (contraintes CSP MV3).
- Le modèle NER (~30 Mo) est téléchargé au 1er usage puis mis en cache
  (Cache API). Hors ligne ensuite.
- La table de correspondance placeholder ↔ valeur vit en mémoire de la popup,
  jamais persistée.
