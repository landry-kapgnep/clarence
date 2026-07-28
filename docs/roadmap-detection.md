# Roadmap — qualité de détection & reconstruction PDF

Backlog des défauts **observés sur de vrais fichiers** (pas des idées théoriques).
Constaté le 21/07/2026 sur un CV réel (PDF, mode « Préserver / reconstruction »).
Classé par priorité = gravité (fuite > sur-masquage > cosmétique).

---

## P0 — Fuites de noms propres (CRITIQUE)

Le nom du propriétaire du CV **fuit à 3 endroits** — c'est le pire cas possible.

1. **Nom en titre TOUT-MAJUSCULE** : `LANDRY KAPGNEP` (titre du CV) non masqué. Le
   modèle NER *cased* (`bert-...-cased`) déteste le tout-majuscule et rate ces
   noms isolés sans contexte de phrase.
   - Piste A : passe supplémentaire *title-case* sur les tokens tout-majuscules
     AVANT le NER (symétrique de `boostCase` qui ne gère que le minuscule).
     **Risque** : masquerait aussi les titres de section (`COMPÉTENCES`,
     `EXPÉRIENCES`) → à valider sur le vrai modèle, pas en test auto.
   - Piste B : heuristique déterministe « un bloc de 1-3 mots capitalisés isolé
     en haut du document = probablement le nom ». Ciblé, moins de faux positifs.

2. **Nom en minuscule dans les URL** : `linkedin.com/in/landry-kapgnep`,
   `github.com/landry-kapgnep` → « landry »/« kapgnep » en clair. Combine la
   faiblesse minuscule du NER ET la fragmentation P1.

---

## P1 — Fragmentation de mots (fuite PARTIELLE + lisibilité) — cause identifiée

Symptômes : `[ENTREPRISE_4]antikmatch` (Semantikmatch coupé), `[ENTREPRISE_3]ODC`
(UNODC coupé), `github.com/landry-[LIEU_2]`. Le placeholder remplace un fragment,
le reste du mot **reste en clair**.

- **Cause** : pdfjs découpe parfois un seul mot en plusieurs *items* (kerning,
  changement de fonte). `groupIntoLines` (pdf-adapter.js) joint les items d'une
  ligne avec un **espace systématique** → « Semantikmatch » devient
  « Sem antikmatch », ce qui casse le mot pour la détection ET la lisibilité.
- **Fix identifié et localisé** : n'insérer un espace QUE s'il y a un vrai écart
  horizontal entre deux items (`item[i].x + item[i].width < item[i+1].x - seuil`).
  Deux items collés = même mot → pas d'espace. Touche `groupIntoLines`
  (bénéficie au Markdown ET à la reconstruction). **Testable en Node.**
- Petit + rapide + haute valeur — meilleur candidat pour le prochain build.

---

## P2 — Sur-masquage de technos/acronymes (faux positifs, dégrade le CV)

Le NER prend des noms de technologies/outils pour des entreprises :
`Prisma → [ENTREPRISE_6]`, `Ollama → [ENTREPRISE_7]`, `MVP → [ENTREPRISE_5]`,
`BUT → [ENTREPRISE_1]`. Masquer « React »/« Prisma »/« Docker » n'a aucun
intérêt (ce ne sont pas des PII) et rend le CV inexploitable par le LLM.

- Tension : distinguer « entreprise réelle » de « techno courante » sans contexte.
- Piste : stoplist de technos/outils/acronymes courants exemptés du masquage
  quand détectés comme ORG (React, Prisma, Docker, Ollama, MVP, ETL, API, BUT…).
  Réutiliser le mécanisme `keepValues` de `selection.js` avec une liste par défaut.
- Prudence : ne jamais exempter un token qui matche aussi un vrai signal PII.

---

## P3 — Images non rendues dans la reconstruction PDF

Constaté par l'utilisateur sur un PDF à images (fichier non disponible pour
diagnostic ; le CV testé n'a AUCUNE image raster — que du texte + vectoriel,
`getOperatorList` → `{}`).

- À investiguer AVEC un vrai PDF à images raster. Hypothèses :
  - `bitmap.kind` non géré : `bitmapToPng` ne gère que RGBA (3) et RGB (2) ;
    gris 1bpp (kind 1) et JPEG décodé différemment → `null` → image sautée.
  - Résolution async du bitmap (`page.objs.get`) pas prête au moment voulu.
  - Position/taille CTM correcte mais image hors page (rare).
- Défensif par design : une image en échec n'empêche jamais la reconstruction
  du texte (sécurité préservée), mais l'utilisateur perd le contenu visuel.

---

## P4 — Divers reconstruction (cosmétique)

- Glyphes non-WinAnsi (puces/icônes du CV) remplacés par `?` par
  `sanitizeForWinAnsi`. Sans gravité mais visible. Fix propre = embarquer une
  police Unicode (fontkit) — alourdit le bundle, écarté pour l'instant.
- Fidélité de mise en page dégradée (police unique, positions par fragment) —
  limite déjà assumée et annoncée dans l'UI.

---

## Note transverse

P0 et P2 sont deux faces du même problème : le NER manque de **contexte** pour
trancher « à masquer ou pas ». C'est exactement ce que la couche LLM local
(cadrage §5/§8, roadmap Étape 5) est censée résoudre — mais c'est lourd. P1 est
indépendant (géométrie pure) et devrait être fait en premier : c'est une vraie
fuite partielle, à coût faible.
