# Vérification en vrai Chrome — la liste des bugs déjà vécus

> **À quoi sert ce document.** `npm test` (246 tests) et `npm run bench` ne
> voient qu'une partie du produit. `src/popup/main.js` n'est couvert par
> **aucun** test — il dépend de `chrome.*` — et c'est justement là qu'un crash
> a rendu le mode PDF « Préserver » totalement inutilisable *pendant que 230
> tests étaient au vert*. Cette liste recense les bugs qu'on a réellement
> rencontrés, pour les rejouer à la main au lieu de les redécouvrir.
>
> Règle du projet : **une fonctionnalité n'est terminée que si on l'a vue
> fonctionner dans un Chrome chargé en mode développeur.** Ce document est
> l'outil de cette règle.

## Le document piégé

`tests/manuel/tous-defauts.pdf` empile **tous** les défauts listés ici dans un
seul fichier : charge-le en mode Fichier et la plupart des lignes ci-dessous se
vérifient d'un coup. Sa carte de lecture (quoi regarder, quoi attendre, ce qui
est encore cassé) est dans `tests/manuel/README.md`.

Il a trouvé une fuite structurée dès son premier passage — `Réf. interne :
EMP-4471-KD` restait en clair, le motif d'identifiant interne étant
intégralement anglophone.

## Comment s'installer

1. `npm run build`
2. `chrome://extensions` → mode développeur → « Charger l'extension non
   empaquetée » → dossier `extension/`
3. Ouvrir la console de la popup (clic droit sur la popup → Inspecter) **et**
   celle de la page pour les tests de livraison.

⚠️ **Le content script ne se met à jour qu'au rechargement de la PAGE (F5)**,
pas au rechargement de l'extension. Un clic « sans effet » vient presque
toujours d'un onglet resté sur l'ancien content script. À refaire avant de
déclarer un bug de livraison.

---

## A0. Performance — mesures réelles et protocole (06/08/2026)

**Mesuré en vrai Chrome, sur le MÊME mémoire de 75 pages à chaque fois :**

| Modèle | Accélérateur | Temps | Verdict |
|---|---|---|---|
| `model_quantized` (int8, 175 Mo) | `wasm` | 5 min 45 | ligne de base |
| `model_quantized` (int8, 175 Mo) | `webgpu` | 5 min 36 | aucun gain |
| `model_fp16` (292 Mo) | `webgpu` | **2 min 01** | **×2,8 — livré** |

**La leçon, et elle est contre-intuitive : ce n'est pas WebGPU qui accélère,
c'est le COUPLE modèle+fournisseur.** Le fournisseur WebGPU d'ORT supporte mal
les opérateurs **quantifiés** : avec l'int8, la majorité des nœuds retombe sur
le CPU, on paie le transfert vers le GPU sans profiter du GPU. Le même
fournisseur avec des poids fp16 divise le temps par 2,8. Conclusion à retenir :
**ces deux réglages ne se jugent jamais séparément.** Une mesure « WebGPU ne
sert à rien » prise sur l'int8 aurait fait abandonner la bonne piste.

Le fp16 pèse 292 Mo au lieu de 175. Surcoût payé **une fois** (Cache API), gain
à **chaque** document : arbitrage tranché par la mesure.

⚠️ **Deux avertissements de console sont NORMAUX en fp16**, ne pas les
diagnostiquer à nouveau :
- `Could not find a CPU kernel and hence can't constant fold ReduceMean` — ORT
  ne sait pas pré-calculer un nœud fp16 côté CPU. Sans effet sur le résultat.
- `Some nodes were not assigned to the preferred execution providers` — présent
  aussi en fp16 (les opérations de forme vont toujours au CPU, par conception).
  **Sa présence ne signifie donc pas que WebGPU est inutile** : c'est le
  chronomètre qui tranche, pas cette ligne.

**Erreur de méthode à ne pas refaire** : le pré-filtre (−39 % d'inférences,
−21 % en Node) et WebGPU ont d'abord été activés dans la MÊME mesure. Résultat
inattribuable. **Une variable à la fois** — c'est en respectant cette règle
ensuite que le gain fp16 est apparu proprement.

### Protocole d'A/B

La variante vit dans `src/engine/gliner.js` (`GLINER_VARIANTE`) et **pas** dans
la popup : le banc `npm run bench` la lit au même endroit, donc il note toujours
le modèle réellement livré. Tant qu'elle vivait dans `main.js`, le banc mesurait
`quantized` pendant que la popup chargeait autre chose.

Le fournisseur, lui, est propre à la popup (`ACCELERATEUR` dans `main.js`) —
le banc tourne en Node sur `onnxruntime-node`, sans WebGPU. Puis `npm run build`.

1. Chronométrer le même document à chaque fois, extension rechargée.
2. Vérifier l'accélérateur RÉELLEMENT retenu : le message `ready` du worker
   porte `accelerateur: 'webgpu' | 'wasm'`. Un repli silencieux fausserait tout.
3. Vérifier que le **nombre de placeholders reste comparable** entre deux
   configurations, et rejouer `npm run bench` : changer la précision des poids
   change la numérique du modèle, donc potentiellement les scores. Un gain de
   vitesse payé en qualité n'est pas un gain.

### À chronométrer maintenant : le regroupement en lots

Les inférences partent désormais par lots de 8 (`src/engine/batch.js`). Mesuré
en Node : **×2,6** sur 240 unités, à détection strictement identique (570 spans
dans tous les cas). Le gain attendu en Chrome est au moins aussi bon, le GPU
étant encore plus pénalisé par les petits appels que le CPU.

À vérifier sur le mémoire de 75 pages, avec le même protocole qu'au-dessus :
1. Temps total (référence à battre : **2 min 01**).
2. **Nombre de placeholders identique** à la mesure précédente — c'est le
   contrôle qui compte : si le regroupement redistribuait un résultat de
   travers, les entités d'une unité atterriraient sur une autre.
3. La barre de progression avance toujours jusqu'à 100 % (elle progresse
   maintenant par vagues de 24 unités, plus une par une).

### Mesures encore à faire

- **Pré-filtre seul** (`quantized` + `wasm`, pré-filtre désactivé) : son gain
  réel en Chrome n'a jamais été isolé — seulement mesuré en Node.
- **`fp32` + `webgpu`** : plus rapide encore que le fp16 ? 583 Mo, sans doute
  hors budget de premier chargement, mais la mesure situerait le plafond.

⚠️ `vendor/ort-wasm-simd-threaded.jsep.wasm` (20 Mo) porte l'accélération
WebGPU. S'il manque, l'init échoue et on retombe en WASM silencieusement —
donc lent sans que rien ne l'indique. `build.mjs` échoue bruyamment sinon.

## A. Ce que Node ne peut structurellement PAS attraper

La catégorie la plus importante : chacun de ces bugs a été trouvé en vrai
Chrome **après** une suite de tests Node entièrement verte.

| # | Test | Attendu | Ce que ça donnait quand c'était cassé |
|---|---|---|---|
| A1 | Mode Fichier → charger un PDF quelconque | Le traitement démarre | `No "GlobalWorkerOptions.workerSrc" specified` — pdfjs v6 ne replie sur un « fake worker » **qu'en Node**. Tous les tests Node passaient (`01eb4c5`) |
| A2 | PDF « Préserver » contenant une image | Le PDF sort avec l'image repositionnée | Plantage : le décodage bitmap n'existe qu'en navigateur (`ImageBitmap`, `ed42ab5`). En Node l'image est ignorée sans casser — donc invisible aux tests |
| A3 | Ouvrir la popup, onglet **Réseau** des DevTools, traiter un texte puis un fichier | **Aucune** requête sortante contenant du texte utilisateur. Seul le téléchargement du modèle (huggingface.co) est admis, une fois | C'est l'argument de vente ET la preuve que l'utilisateur peut refaire lui-même. À vérifier à chaque release |
| A4 | Console de la popup au chargement | Pas d'erreur CSP bloquante | Le bundle worker contient `eval(`/`new Function(` (protobufjs, polyfill webpack) — ils **lèvent et sont rattrapés**. Normal. Vérifier qu'aucun nouveau cas non gardé n'apparaît |
| A5 | Premier lancement, puis fermer/rouvrir la popup | 2ᵉ ouverture quasi instantanée | ORT n'utilise **pas** le cache de Transformers.js : sans la Cache API maison, 183 Mo re-téléchargés à CHAQUE ouverture. Mesuré : 651 ms puis 94 ms |
| A6 | Traiter un texte long | L'UI reste réactive, la barre de progression avance | Le NER tournait sur le thread principal : gels d'UI, menus au contenu coupé |

---

## B. Fuites — la classe critique

Un raté ici n'est pas une limite du produit, c'est ce que le produit promet
d'empêcher. **Toujours relire le fichier de SORTIE, jamais l'aperçu seul** :
la fuite P0 a survécu des semaines parce qu'elle n'apparaissait que dans le
fichier réécrit.

| # | Test | Attendu | Historique |
|---|---|---|---|
| B1 | Un document où une même entreprise apparaît en contexte ET seule sur une ligne | Les **deux** occurrences masquées **dans le fichier téléchargé** | Fuite P0 : la propagation n'atteignait pas les fichiers réécrits — masqué dans l'aperçu, en clair dans le livrable (`9a23a06`) |
| B2 | Un CV avec nom TOUT-MAJUSCULE en titre | Nom masqué **en entier**, pas seulement le prénom | Sortait en deux spans (0,47 + 0,36) ; sans pontage le patronyme restait en clair à côté du placeholder |
| B3 | Un texte avec « Amandine ROUSSEAU » (patronyme de 8 majuscules) | Le nom **complet** masqué, pas `Amandine [BIC_1]` | Le patronyme matchait le motif BIC et annulait le nom entier (`39f9344`) |
| B4 | Un mail où un prénom seul est réutilisé plus loin (« Marcus previously worked… ») | Le prénom isolé masqué aussi | **Non corrigé** — connu, mesuré par le banc. Vérifier que ça n'a pas empiré |
| B5 | DOCX avec notes de bas de page contenant des PII | Notes anonymisées aussi | Footnotes/endnotes étaient ignorées = fuite silencieuse |
| B6 | DOCX avec suivi des modifications | Le suivi est retiré | Une PII « supprimée » reste dans le XML de révision |
| B7 | XLSX/DOCX → propriétés du fichier (auteur, société) | Nettoyées | `ooxml-metadata.js` |
| B8 | PDF « Préserver » → sélectionner le texte sous un placeholder dans un lecteur | Rien d'extractible dessous | Les pages sont **neuves**, jamais caviardées. Un caviardage laisserait le texte lisible en dessous |
| B9 | Image (JPEG d'un téléphone) → vérifier l'EXIF de la sortie | GPS/appareil/date supprimés | Ré-encodage canvas |

---

## C. Sur-masquage — ce qui empêche de faire payer

Un document sûr et illisible ne se vend pas. Le banc mesure ça
(« Termes PRÉSERVÉS », 97 %), mais seulement sur 5 documents synthétiques.

| # | Test | Attendu | Historique |
|---|---|---|---|
| C1 | Un CSV/XLSX avec en-têtes de colonnes | En-têtes **intacts** | 43 masques pour 62 mots, `Matricule`/`Service`/`Salaire` masqués (`61abbdd`) |
| C2 | Un texte listant des technos (React, Docker, Prisma…) | Non masquées avec le profil « Développeur / Tech » | Étiquetées ENTREPRISE par le modèle. Réglé par un profil éditable, **pas** par une liste cachée dans le moteur |
| C3 | Un rapport avec un sommaire (« Introduction……3 ») | Les titres de section survivent | **Partiellement corrigé.** `SOMMAIRE` avalé par le nom au-dessus : réglé (`39f9344`). Mais P2bis reste ouvert : sur un PDF, `FORMATION`, `LANGUES`, `COMPETENCES` sont encore masqués |
| C4 | Un certificat mentionnant « IUT de Villetaneuse » | Le sigle survit, la ville est masquée | Tout était masqué en `[PERSONNE_1]` — le pontage prenait le sigle pour un prénom (`39f9344`) |
| C5 | Un CV → vérifier le champ de formation | **Connu cassé** : « Informatique » masqué en POSTE (0,85) | P2bis, non corrigé délibérément (voir roadmap) |

---

## D. UI et CSS — bugs réellement vécus

| # | Test | Attendu | Historique |
|---|---|---|---|
| D1 | Ouvrir le panneau injecté sur une page **sombre** (Claude en thème noir) | Aucun fond transparent | Chrome peint un canvas blanc opaque derrière l'iframe |
| D2 | Panneau injecté avec un contenu très long | Scrollbar de repli, pas de débordement | Plafond de hauteur + auto-dimensionnement |
| D3 | Ouvrir le formulaire de profil d'identité | Champs alignés, pas de trous | `.overlay-body` héritait de `white-space: pre-wrap` : colonnes trouées, texte indenté. Même piège que `.panel` avant lui — **deux fois** dans ce projet |
| D4 | Lancer un traitement, regarder le fond animé | Grille de cases sans couture visible | Deux `<div>` blanches accolées laissent un interstice au sous-pixel dès que l'échelle de l'écran n'est pas entière (1,25 / 1,5). Peint sur un seul `<canvas>` en pixels *device* |
| D5 | Même test avec « réduire les animations » activé dans l'OS | Fond figé | `prefers-reduced-motion` |
| D6 | Popup de barre d'outils | Contenu tient sous 600 px | Plafond imposé par Chrome, fenêtre native ni arrondie ni transparente |
| D7 | Vérifier que le fond animé est visible dans la popup | Visible | `#letterBg` en `position: fixed` derrière `.wrap` est **invisible** (`.wrap` a un fond opaque) alors que le CSS a l'air juste |

---

## E. Parcours complets, format par format

### Texte (offre gratuite)
- [ ] Coller un texte FR mêlé (email, IBAN, NIR, carte, SIREN, montant, noms)
- [ ] Chaque détection est surlignée et relisible
- [ ] Retirer un faux positif d'un clic
- [ ] Ajouter manuellement une sélection à masquer
- [ ] « Copier le texte propre » → coller dans ChatGPT
- [ ] Récupérer la réponse → **désanonymiser** → vraies valeurs restaurées
- [ ] Placeholders **cohérents** : la même personne garde le même numéro partout
- [ ] Option Pseudonymes : cocher → noms réalistes, cohérents par composant
  (« Priya Deva » et « Priya » seule doivent donner le même prénom)
- [ ] Sélecteur de locale `fr`/`en` : un document anglais reçoit des noms anglais

### Fichier (premium)
- [ ] CSV, XLSX, DOCX, PDF, image : chacun est accepté
- [ ] **Changer une option après analyse invalide le résultat** — sinon on
      retéléchargeait silencieusement l'ancien fichier (fuite : on croit tenir
      un Markdown sans images)
- [ ] PDF → « Alléger » : `.md` produit, moins de tokens, images perdues
- [ ] PDF → « Préserver » : PDF reconstruit, images présentes
- [ ] **Le mot coupé en fin de ligne est recollé** (« inno- » / « vante » →
      « innovante ») — correctif P1bis, testé sur un vrai CV
- [ ] Sorties texte (`.md`, `.csv`) : bouton « Copier »
- [ ] Livraison in-page : ChatGPT ✅, Claude ✅, **Gemini ✗** (limite connue)
- [ ] Téléchargement : marche partout

### Personnalisation
- [ ] Créer / enregistrer / supprimer un profil d'anonymisation
- [ ] Décocher un type → l'inférence correspondante est **sautée** (plus rapide)
- [ ] Profil d'identité : déclarer son nom → masqué de façon **déterministe**,
      y compris en TOUT-MAJUSCULE (`LANDRY KAPGNEP` quand on a saisi
      `Landry Kapgnep`) — sans les variantes de casse, le nom fuyait
- [ ] Les données de profil vivent en `chrome.storage.local`, **jamais** `sync`

### Moteurs contextuels
- [ ] GLiNER démarre par défaut
- [ ] Si GLiNER échoue → BERT prend le relais **et un badge le signale**
- [ ] Vérifier dans la console que le découpeur de mots est bien corrigé :
      l'init doit **échouer fort** si la structure interne de la lib a changé
      (tourner avec le découpeur cassé = dégradation invisible sur le français,
      donc une fuite)

---

## F. Ce qui ressemble à un bug mais n'en est pas

À lire avant de rouvrir un ticket — chacun a déjà coûté du temps.

- **Deux versions d'ONNX Runtime** (1.14 et 1.19) cohabitent dans `vendor/`.
  Normal : noms de binaires WASM différents, pas de collision.
- **`eval(` / `new Function(` dans le bundle worker.** Présents avant GLiNER,
  gardés par `try/catch`, l'extension marche.
- **Livraison impossible sur Gemini.** Son uploader n'expose pas d'`input`
  atteignable (shadow DOM fermé). Limite site-spécifique.
- **Fidélité visuelle dégradée du PDF « Préserver ».** Police Helvetica unique,
  positions approximatives : assumé.
- **Le contenu VISUEL des images n'est pas anonymisé** (pas d'OCR). Seul l'EXIF
  est nettoyé.
- **Un mot recollé reste deux objets texte dans le PDF final.** La
  reconstruction dessine chaque fragment à sa position d'origine — artefact de
  relecture, pas une régression.
- **Le multi-thread WASM n'apporte rien** (923 ms contre 927). Une popup MV3
  n'est de toute façon jamais `crossOriginIsolated`.

---

## G. Bloquants connus avant publication

- [ ] **Le manifeste n'a aucune icône** — bloque la soumission au Chrome Web Store
- [ ] Zip CWS, fiche produit, politique de confidentialité : pas commencés
- [ ] Page vitrine statique : pas commencée
- [ ] Vulnérabilités npm restantes (`protobufjs`/`onnx-proto`/`onnxruntime-web`,
      transitives via `@xenova/transformers`) — évaluées faibles ici (ne parsent
      que le modèle ONNX, jamais de donnée utilisateur). Vraie voie : migration
      `@huggingface/transformers` v3, chantier séparé

---

## H. Le trou que ce document ne bouche pas

Cette liste protège contre la **répétition** des bugs connus. Elle ne dit rien
du fichier d'un inconnu — même limite que le banc d'essai. Le seul vrai signal
de « prêt », c'est **des fichiers réels de gens qui ne sont pas nous**.
