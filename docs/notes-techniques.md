# Notes techniques - Clarence

Décisions d'implémentation, pièges rencontrés et règles de test. Tout ce qui
est écrit ici a été **mesuré**, pas supposé : plusieurs sections corrigent
explicitement une affirmation antérieure qui s'est révélée fausse.

## Principe non négociable

**Aucune donnée utilisateur ne quitte le navigateur** - sous aucun prétexte, y
compris « juste un log de debug » ou « juste une analytics ». C'est
l'architecture autant que l'argument. Toute fonctionnalité qui enverrait des
données utilisateur vers un serveur est exclue ; l'alternative est locale, ou
il n'y a pas de fonctionnalité.

## Stack

- Manifest V3, JavaScript sans framework, bundling esbuild
- Détection structurée : regex + validation mathématique (Luhn pour
  cartes/SIRET, mod-97 pour IBAN, clé de contrôle pour le NIR)
- Téléphones internationaux : `libphonenumber-js` (`src/engine/phone-intl.js`),
  format `+XX` tous pays, en COMPLÉMENT de la regex FR (numéros nationaux).
  Sans pays par défaut volontairement : avec `defaultCountry: 'FR'` la lib
  prend « 483 921 657 » (le piège SIREN de la fixture 2) pour un numéro
  français. Mode `extended` pour masquer aussi les numéros plausibles mais
  invalides (zéro-fuite, comme `maskIfStructureMatches`).
- Détection contextuelle - **DEUX moteurs, GLiNER par défaut, BERT en repli
  automatique et silencieux** :
  - **GLiNER (NER zero-shot)** : `onnx-community/gliner_small-v2` via le
    runtime `gliner` (`Ingvarstep/GLiNER.js`, MIT, épinglé `0.0.19`). Les
    catégories cherchées sont fournies **à l'appel**, pas figées à
    l'entraînement → sait qualifier une valeur **isolée sans contexte**
    (cellule de tableau, nom en tête de CV), impossible autrement. 183 Mo
    quantifié.
  - **BERT** : `Xenova/bert-base-multilingual-cased-ner-hrl` (178 Mo),
    conservé intact comme filet si GLiNER ne démarre pas.
  - Les deux tournent 100 % local (WASM) dans `src/worker/ner-worker.js`,
    derrière le **même protocole**. `detectNER`/`detectGliner` reçoivent leur
    pipeline en paramètre : les moteurs sont interchangeables sans toucher à
    l'aval.
- Aucun backend

## Arborescence

- `src/engine/` - moteur pur et testé (source de vérité) : validators,
  regex-detect, **caracteristiques + precision (filtre appris, 5 garde-fous)**,
  ner (chunking + double passe naturelle/boostée pour les noms sans majuscule ;
  expose aussi `chunkText` et `snapToWordBoundaries`, partagés), **gliner (NER
  zero-shot : groupes de labels disjoints, seuil, mapping label→type)**, merge
  (chevauchements), selection (retraits/manuels), masking (placeholders +
  option pseudonymes), pseudonyms
- `src/files/` - anonymisation de fichiers entiers : anonymize-units
  (orchestrateur partagé, place TOUT le fichier dans une seule passe de
  masquage pour des placeholders cohérents), text-units (redistribution des
  entités sur des runs), ooxml-metadata (nettoyage docProps + commentaires,
  partagé XLSX/DOCX), csv-adapter, xlsx-adapter, docx-adapter, pdf-adapter
  (→ Markdown), pdf-reconstruct (→ PDF reconstruit gardant les images),
  image-adapter (nettoyage EXIF par ré-encodage canvas)
- `src/popup/main.js` - source de la popup, bundlée vers
  `extension/popup/popup.js` par `npm run build`
- `extension/` - chargeable telle quelle dans Chrome (mode développeur)
- `tools/filtre/` - construction du jeu, entraînement et diagnostic du filtre
  de précision (voir son README)
- `tests/unit/` - tests node:test ; `tests/fixtures/` - 3 textes de référence +
  echantillon.csv/.xlsx/.docx (générées par des scripts committés
  `gen-*-fixture.mjs`, reproductibles)
- `npm test` / `npm run build` (esbuild + copie des .wasm vers
  extension/vendor/)

## Documents voisins

- `docs/verification-chrome.md` - **checklist de vérification manuelle en vrai
  Chrome**, construite sur les bugs réellement rencontrés. À rejouer avant
  toute release : `src/popup/main.js` n'a aucun test (dépend de `chrome.*`) et
  c'est là qu'un crash a cassé tout le mode PDF « Préserver » avec 230 tests au
  vert.
- `docs/roadmap-detection.md` - défauts de détection mesurés (P0→P5), avec ce
  qui est corrigé, ce qui ne l'est pas, et pourquoi.
- `tests/atelier-fixtures.html` - harnais navigateur autonome, avec verdict
  automatique sur les 3 fixtures. La source de vérité du moteur est
  `src/engine/`.

## Filtre de précision appris

`src/engine/precision.js` + `caracteristiques.js`, poids générés dans
`poids-precision.js` : un classifieur - régression logistique, une douzaine de
nombres lisibles, aucune dépendance - remplace la règle binaire de P14 pour
décider si un candidat ORG/LOC mérite d'être masqué. Entraîné sur les
**candidats que notre propre détecteur produit** (arbitre compris), étiquetés
contre le corpus synthétique. Résultat : **36/56 faux positifs retirés, zéro
vraie entité perdue** à l'évaluation, contre 0/56 pour le filtre précédent ; au
banc, aucune régression et 5 masques de moins. Détails, mesures et impasses :
`docs/roadmap-detection.md` P15 et `tools/filtre/README.md`.

**CINQ garde-fous, dont deux nés de fuites mesurées** : ne peut que retirer ·
jamais le déterministe · jamais les types hors ORG/LOC · **jamais un candidat
d'un seul mot** · **jamais ce qui a la FORME d'un nom propre**. Les deux
derniers viennent d'une fuite réelle : le modèle étiquette « Rose Fontaine » en
ENTREPRISE, donc un garde-fou raisonnant par TYPE ne la voit pas. **Quand un
garde-fou est contourné, regarder s'il s'appuie sur une étiquette - que le
modèle peut se tromper à donner - plutôt que sur une forme, qui ne ment pas.**

**⚠️ « Le lexique est déjà multilingue » est FAUX.** `lexique.js` ne retient que
les entrées **entièrement minuscules** du vocabulaire mBERT, sur la règle « un
nom propre n'y figure qu'avec sa capitale ». Cette règle est elle-même
dépendante de la langue : en allemand tout nom commun porte une capitale, donc
`Unternehmen`, `Abteilung`, `Sprachen` sont **absents** du lexique alors qu'ils
sont dans le vocabulaire source. Déjà visible au banc (3 des 5 sur-masquages du
document piégé). Ajouter une langue n'est donc PAS gratuit.

## Pseudonymes

**Cohérents PAR COMPOSANT de nom.** Le cache de `maskText` porte sur la valeur
entière, donc « Priya Deva » revu à l'identique redonnait le même pseudo - mais
« Priya » seule recevait un nom **sans aucun rapport** (la même personne
portait trois identités dans un même document, ce qui détruit la cohérence que
l'option promet et rend le texte inexploitable par le LLM). `pseudonyms.js`
mémorise désormais chaque composant (« Priya »→« Noémie », « Deva »→
« Rousseau ») : le nom complet est **composé** à partir d'eux, dans les deux
sens et quel que soit l'ordre de première rencontre.

Particules (`de`, `van`, `bin`…) **et civilités** (`miss`, `M.`, `Mme`, `Dr`…)
conservées telles quelles : non identifiantes, et surtout le modèle contextuel
inclut souvent le titre dans l'entité (« miss Deva » d'un bloc) - traité comme
un prénom, il produisait « Clément Faure » et « Amélie Faure » pour la MÊME
personne, avec changement de genre. Casse TOUT-MAJUSCULE reproduite (convention
CV FR), traits d'union préservés. **Format de date reproduit** aussi
(« january 1 2002 » → « july 3 1988 », plus « 13/10/1976 » au milieu d'un texte
anglais). Si un vivier est épuisé, on retombe sur `[PERSONNE_N]` - **jamais**
sur le composant réel.

Locale `fr` (défaut) ou `en`, sélecteur dans l'UI (`pseudoLocale` /
`filePseudoLocale`). Un document anglophone recevait jusqu'ici des pseudonymes
français, ce qui cassait l'illusion de cohérence que l'option promet. Pas de
détection automatique de la langue du document - c'est un réglage explicite,
pas une inférence.

## Profil d'identité

`src/popup/identity.js` : l'utilisateur déclare UNE FOIS ce qui l'identifie
(nom, emails, employeurs, écoles, pseudos…). Ces termes alimentent
`forcedMasks` avec leurs **variantes de casse** générées (un CV titre
« ADRIEN MESNARD » quand on déclare « Adrien Mesnard » - sans variantes, le nom
fuyait). Le masquage de sa propre identité devient ainsi **déterministe**,
jamais suspendu à un score de modèle. `chrome.storage.local` exclusivement,
jamais `sync` (voir le commentaire en tête du module). Le moteur n'est pas
touché.

## Gotchas déjà découverts (ne pas re-perdre de temps dessus)

- **Un banc qui se fabrique son propre pipeline ne mesure pas ce qu'on livre.**
  Le filtre de précision a d'abord semblé n'avoir AUCUN effet : le banc,
  l'injection et la régression construisaient chacun leur arbitre, sans lui.
  Même famille que « le banc mesurait `quantized` pendant que la popup
  chargeait autre chose ». La composition des passes post-détection vit
  désormais dans **`composerArbitre` (src/engine/precision.js)**, utilisée par
  les quatre appelants - ne pas la réécrire à côté.
- **Une caractéristique que la production ne calcule pas ne doit pas peser dans
  un modèle.** `fragmentation` a besoin d'un vocabulaire de sous-mots que le
  banc d'entraînement charge et que la production, elle, ne passe jamais : la
  valeur y est 0 en toutes circonstances. Des poids entraînés sur de vraies
  valeurs s'appliquaient donc hors de leur domaine - sans erreur, sans signal.
  Un test l'interdit désormais ; s'il casse, c'est qu'on a câblé le vocabulaire
  et il faut le mettre à jour EN MÊME TEMPS.
- **Un vocabulaire WordPiece est CASED : ne pas minusculiser avant de
  segmenter.** `morceaux()` le faisait et rendait 2 morceaux pour
  « Unternehmen », présent en une seule pièce - il mesurait la casse au lieu de
  la rareté, et se trompait pile sur les noms communs allemands. On essaie
  surface, minuscule ET capitale initiale, minimum des trois (« SPRACHEN » ne
  retrouve que « Sprachen »).
- **GLiNER.js est cassé sur le français, et c'est SILENCIEUX.** Son découpeur
  de mots utilise `/\w+(?:[-_]\w+)*|\S/g` ; en JavaScript `\w` ne couvre PAS
  les accents, donc « réunion » est découpé en `r` + `é` + `union` et
  « Associés » en `Associ` + `é` + `s`. Conséquences mesurées : faux positif
  `union` sur le garde-fou, noms tronqués (`Fontaine & Associ`), et surtout
  **des entités purement et simplement RATÉES** (`Lefèvre Consulting`
  invisible avant correction, 0,90 après ; un faux positif `candidat` qui
  disparaît aussi). Corrigé au runtime dans `ner-worker.js` en remplaçant le
  motif par `/[\p{L}\p{N}_]+(?:[-_][\p{L}\p{N}_]+)*|\S/gu`. **La version de la
  lib est épinglée** et l'init **échoue fort** si la structure interne change
  (`model.processor.wordsSplitter`) - tourner avec le découpeur cassé serait
  une dégradation invisible, donc une fuite.
- **Donner du CONTEXTE à une cellule DÉGRADE la détection - contre-intuitif,
  mesuré.** Adjoindre le libellé de colonne à une cellule (« Date de
  naissance : 1988-03-14 ») semble évident ; en réalité le libellé ressemble
  presque mot pour mot à la catégorie cherchée et capte l'attention à la place
  de la valeur : 0,74 sur le libellé contre 0,15 sur la vraie date, et
  « Matricule : EMP-0012 » tombe de 0,57 à 0,32 (donc sous le seuil → fuite).
  **L'isolement d'une cellule est un ATOUT du zero-shot, pas un manque.** Ce
  qui marche, à l'inverse : marquer les unités d'en-tête `structurel` pour les
  épargner (voir `anonymize-units.js`) - le sur-masquage du tableau RH est
  passé de 43 masques/62 mots à zéro faux positif.
- **Le seuil GLiNER se règle PAR GROUPE, et un titre de CV sort très bas.** Un
  nom seul sur sa ligne, en gros, sans rien autour (titre d'un vrai CV) ne sort
  qu'à **0,47** - trop court pour que le modèle soit sûr. À 0,50 il FUYAIT. Le
  groupe identité est donc à **0,45** (plancher de bruit du garde-fou : 0,26,
  marge large). En prime, un tel nom sort en **deux spans séparés** (0,47 +
  0,36) : sans le pontage `bridgeNameParts` (partagé avec le moteur BERT), seul
  le prénom serait masqué et le patronyme resterait en clair à côté du
  placeholder.
- **Sur un PDF fragmenté, le bruit dépasse le signal - et ce n'est PAS la faute
  du modèle.** Mesuré sur un vrai CV multi-colonnes : `plicative` (fragment
  d'« applicative ») sort à 0,70 comme entreprise, `matisée` à 0,70 comme
  donnée de santé, quand le vrai nom est à 0,47. Le plancher de bruit passe de
  0,26 (fixtures propres) à 0,74. Aucun réglage de seuil ne rattrape ça : c'est
  l'extraction PDF qui livre du charabia. Voir `docs/roadmap-detection.md`
  P1bis - **ne pas essayer de compenser par les seuils.**
- **Les labels GLiNER se CONCURRENCENT : un jeu large en une passe DÉGRADE la
  détection.** Contre-intuitif et pourtant reproductible : passer de 3 à 10
  labels fait tomber « Semantikmatch » de 0,85 à 0,45 et « Rose Fontaine » de
  0,61 à 0,25, tout en faisant MONTER le bruit (le garde-fou sortait `point` à
  0,43, `roadmap technique` à 0,40). Le coût des labels est en QUALITÉ, pas en
  latence (12 labels = +7 % de temps seulement - mesure exacte mais trompeuse
  si on s'arrête là). D'où les **groupes disjoints** de `src/engine/gliner.js` :
  ne pas les fusionner « pour aller plus vite » sans re-mesurer.
- **ONNX Runtime en deux versions simultanées, et c'est normal** : 1.14
  (embarqué par Transformers.js, moteur BERT) et 1.19 (embarqué par `gliner`).
  Leurs binaires WASM portent des noms différents
  (`ort-wasm.wasm`/`ort-wasm-simd.wasm` contre `ort-wasm-simd-threaded.wasm`)
  donc cohabitent sans collision dans `vendor/`. `build.mjs` **échoue
  bruyamment** si l'un manque : la CSP MV3 interdit d'aller le chercher sur un
  CDN, un binaire absent casserait l'extension au runtime.
- **ORT 1.19 exige un bundle `format: 'esm'`.** En `iife` il échoue avec
  `Failed to construct 'URL': Invalid URL` - il localise son worker via
  `import.meta.url`, indisponible en IIFE. `build.mjs` est déjà en `esm` et le
  worker créé en `{ type: 'module' }` : compatible, mais ne pas « simplifier »
  ça.
- **ORT n'utilise PAS le cache de Transformers.js.** `gliner` passe `modelPath`
  directement à ORT : sans action, les 183 Mo seraient re-téléchargés à CHAQUE
  ouverture de la popup. Le worker gère donc lui-même la **Cache API**
  (`caches.open('clarence-models')`) et passe le modèle en `Uint8Array` - forme
  explicitement acceptée par `modelPath`. Vérifié en navigateur : 651 ms au
  premier chargement, 94 ms ensuite.
- **Le bundle du worker contient des `eval(` et `new Function(`, et c'est
  gardé.** L'affirmation inverse ne vaut que pour `popup.js`. Le bundle worker
  en avait DÉJÀ (1 `eval`, 2 `new Function`) avant GLiNER, et l'extension
  fonctionne : ce sont l'astuce `inquire()` de protobufjs et le polyfill
  `globalThis` de webpack, **tous dans un `try/catch` avec repli**. Sous CSP
  MV3 ils lèvent, sont rattrapés, et le code continue. Ne pas s'en alarmer,
  mais vérifier que tout nouveau cas est bien gardé.
- Le checkpoint **multilingue `gliner_multi-v2.1` est MOINS bon que `small-v2`
  sur nos fixtures FR**, alors qu'il est deux fois plus lourd (349 Mo contre
  183) - il ne trouve quasi rien (mêmes scores effondrés que le checkpoint PII
  écarté). Contre-intuitif : `small-v2` est basé sur un `deberta-v3-small`
  anglophone et se débrouille très bien en français. Ne pas « passer au
  multilingue » sans re-mesurer.
- Le modèle NER ne renvoie **pas** d'offsets fiables (`start`/`end` à `null`).
  Reconstruction WordPiece (préfixe `##`) + relocalisation par curseur avançant
  - implémentée dans `src/engine/ner.js`.
- `aggregation_strategy` n'a aucun effet sur cette version de la lib -
  regroupement B-/I- fait à la main.
- MV3 : pas de CDN (Transformers.js bundlé), CSP `wasm-unsafe-eval`, wasmPaths
  → `chrome.runtime.getURL('vendor/')`.
- **MV3 n'interdit PAS les Web Workers** (affirmation fausse tenue longtemps
  dans ce projet). La CSP `script-src 'self'` autorise un worker packagé dans
  l'extension - c'est déjà le cas de `pdf.worker.min.mjs`. Le NER vit désormais
  dans `src/worker/ner-worker.js` (entry esbuild séparé) : thread principal
  libre (fin des gels d'UI et des menus au contenu coupé), et **popup.js passe
  de 1,3 Mo à ~35 Ko** puisque Transformers.js n'est plus importé par la popup.
  Le multi-thread WASM, lui, exige `SharedArrayBuffer`/`crossOriginIsolated` :
  testé au runtime dans le worker avec repli à `numThreads=1`.
- Le pattern MONTANT ne matchait jamais « € » (`\b` après un non-mot) →
  `(?!\w)`.
- Le pattern carte doit commencer ET finir sur un chiffre, sinon le séparateur
  avalé fausse « le plus long gagne » face au SIRET.
- Un 14 chiffres Luhn-valide matche SIRET ET carte (même checksum) → priorité
  SIRET_SIREN sur span identique.
- Popup : la classe CSS `.panel` (composant) ≠ `body.panel-mode` (mode iframe)
  - collision vécue (le body héritait de `white-space: pre-wrap` → gaps
  fantômes).
- **Une liste statique n'est acceptable que pour une classe FERMÉE, et jamais
  sans règle de position.** Les civilités (`src/engine/honorifics.js`, partagé
  par `regex-detect.js` et `pseudonyms.js`) en sont le seul cas du projet : une
  langue en compte une poignée et n'en invente pas - contrairement aux noms,
  entreprises ou technos, classes ouvertes qu'on refuse de lister dans le
  moteur. Deux pièges vécus : (1) `fr` ajouté pour l'allemand faisait passer le
  « .fr » de `monentreprise.fr` pour une civilité, et « Mon IBAN » juste après
  devenait un PER sur la fixture 1 - d'où l'écart de `fr`/`hr`/`ing`/`rev` et
  le **point obligatoire** sur les abréviations ambiguës (`Pr.`, `Sr.`, `M.` -
  sinon « PR Manager », « Sr Developer », « 50 mm Hg » deviennent des noms) ;
  (2) `Miss`, `Frau`, `Don` sont aussi de VRAIS patronymes, donc l'appartenance
  à la liste ne suffit pas : `isHonorificAt` exige que le composant **précède**
  un autre composant. « miss Deva » → civilité, « John Miss » et « Miss » seul
  → patronyme masqué. En cas de doute, on masque.
- **`white-space: pre-wrap` frappe DEUX fois dans ce projet.** Après `.panel`,
  c'est `.overlay-body` qui l'a mordu : le formulaire d'identité s'affichait
  avec des colonnes trouées et un texte indenté, parce que chaque saut de ligne
  du HTML devenait un blanc réel. Réflexe à avoir avant de mettre un formulaire
  dans un conteneur prévu pour du texte brut : `white-space: normal`.
- **Une couche décorative en fond doit vivre DANS `.wrap`, pas derrière.**
  `.wrap` a un fond opaque (`--bg-shell`) : un `#letterBg` en `position: fixed`
  derrière la coquille est parfaitement invisible dans la popup (constaté à
  l'écran, alors que le CSS était « juste »). Il est donc absolu dans `.wrap`
  (déjà `position: relative`), avec
  `.wrap > *:not(#letterBg) { position: relative; z-index: 1 }` pour repasser
  le contenu au-dessus.
- **Des cases jointives peintes en `<div>` laissent une couture au
  sous-pixel.** Le fond animé pendant le traitement (`#letterBg`) est une
  grille de cases blanches accolées ; en DOM, deux `<div>` blanches côte à côte
  laissent un interstice d'un sous-pixel dès que le facteur d'échelle de
  l'écran n'est pas entier (1.25, 1.5…) - on devinait une grille en dessous.
  Corrigé en peignant tout sur un seul `<canvas>`, coordonnées arrondies en
  pixels *device* (pas CSS) avant de dessiner : deux `fillRect` entiers
  adjacents se touchent toujours pile.
- Iframe d'extension dans une page sombre : Chrome peint un canvas blanc opaque
  derrière → aucun fond ne doit rester transparent en mode panneau.
- La popup de barre d'outils est plafonnée à 600 px par Chrome et sa fenêtre
  native ne peut pas être arrondie ni transparente.
- **« Faker n'est pas intégrable car Python » est FAUX.** `@faker-js/faker` est
  le portage JS officiel (MIT), avec import par locale (`fakerEN`, `fakerFR`)
  donc bundlable sans tout embarquer. On garde `src/engine/pseudonyms.js`
  (listes FR + FNV déterministe) parce qu'il est léger et **déterministe**
  (indispensable à la réversibilité), mais Faker reste une option crédible pour
  des pseudonymes multilingues - pas un obstacle technique.
- **La couche regex était 100 % franco-française** (constaté sur un texte
  anglais : seul l'email était détecté ; téléphone US, SSN, ZIP, « March 14,
  1988 » passaient tous). Le NER, lui, est multilingue et fonctionne très bien
  en anglais (mBERT, 104 langues) - le problème n'était jamais le modèle.
  Corrigé pour les téléphones via `libphonenumber-js` ; restent à
  internationaliser : codes postaux, dates en anglais, identifiants nationaux
  non-FR (pistes : `validator` pour `isPostalCode`/`isTaxID` multi-pays,
  catalogue de motifs de Microsoft Presidio - Python, donc à porter, pas à
  importer).
- **SheetJS (`xlsx`) : ne jamais installer depuis le registre npm.** La
  dernière version publiée là (0.18.5) a une vuln high (prototype pollution +
  ReDoS) sans correctif npm - SheetJS ne publie ses correctifs que sur son
  propre CDN. Installer via
  `npm install --save https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`
  (voir package.json).
- Le NER cased a du mal avec les noms en minuscule. Fix : double passe (texte
  naturel + texte avec casse « boostée » sur les mots hors mots-outils), fusion
  par span le plus long en cas de chevauchement - jamais « la naturelle gagne
  toujours » (ça perd des entités bien trouvées sur du texte déjà propre) ni un
  simple filtre de score après coup (un fragment bruité peut bloquer une bonne
  détection du boost puis disparaître lui-même au filtre, laissant un trou).
  Voir `src/engine/ner.js`.
- `@xmldom/xmldom`'s `XMLSerializer` réémet le prologue `<?xml ...?>` s'il était
  présent à l'analyse ; le `XMLSerializer` natif d'un navigateur ne le fait
  JAMAIS. Toujours vérifier avant de le préfixer soi-même, sinon duplication
  selon l'environnement (voir `withXmlProlog` dans `docx-adapter.js`).
- Un commentaire XLSX (SheetJS) génère aussi un
  `xl/drawings/vmlDrawingN.vml` (rendu legacy de la bulle, sans PII dedans)
  référencé dans le même `.rels` que la relation « comments » - à supprimer
  avec le commentaire, sinon fichier orphelin/repair prompt possible.
- `pdfjs-dist` **détache** l'`ArrayBuffer` passé à `getDocument({ data })` après
  usage. Comme `pdf-adapter.js` suit la convention stateless commune
  (extractTextUnits ET applyMask ré-analysent le même buffer d'entrée), sans
  copie (`buffer.slice(0)`) le 2e appel plante avec « Cannot perform Construct
  on a detached ArrayBuffer ». Toujours cloner avant de passer à pdfjs.
- Livraison directe du fichier dans la page (content script →
  `input[type=file]`) : marche sur ChatGPT et Claude, **pas sur Gemini** (son
  uploader n'expose pas d'`input` trouvable par `querySelector` - shadow DOM
  fermé ou input créé à la volée). Limite site-spécifique, non contournable
  simplement ; le bouton « Copier le texte » (sorties texte) et le
  téléchargement restent les voies universelles. NB : le content script ne se
  met à jour qu'au **rechargement de la page** (F5), pas au rechargement de
  l'extension - un clic « sans effet » vient presque toujours d'un onglet avec
  l'ancien content script.
- **`pdfjs` va chercher CINQ ressources par URL, pas une** - quatre étaient
  absentes depuis toujours. `workerSrc` est la seule qui plante bruyamment ;
  les autres **dégradent en silence**, ce qui explique qu'elles soient passées
  inaperçues : `standard_fonts/` (métriques des 14 polices standard), `cmaps/`
  (encodages CID, PDF asiatiques), `iccs/` (profils colorimétriques), `wasm/`
  (décodeurs JBIG2/JPEG2000 - sans eux une image de PDF scanné ne se décode pas
  et la reconstruction la perd). Copiées dans `extension/vendor/` par
  `build.mjs`, qui **échoue fort** si l'une manque ; `quickjs-eval.*` est
  volontairement écarté (exécution du JS embarqué dans un PDF, jamais
  utilisée). **Les polices ne sont pas cosmétiques** : privé des métriques,
  pdfjs mesure mal la largeur des glyphes - exactement ce dont dépendent
  `tailleQuiTient` et `calculerBornes`, donc on réglerait la mise en page sur
  des chiffres faux.
  **⚠️ Ces quatre-là ne vont PAS sur `GlobalWorkerOptions`**, qui n'accepte que
  `workerSrc` et `workerPort` - ce sont des paramètres de `getDocument()`.
  Erreur commise puis mesurée : le réglage semblait posé, la console continuait
  d'avertir, et rien ne signalait que la valeur partait à la poubelle. Tout vit
  dans **`ressourcesPdfjs()`** (`pdf-adapter.js`), étalée dans les DEUX appels à
  `getDocument` : les deux chemins PDF dupliquaient déjà cette config chacun de
  leur côté, le motif même qui a divergé (P1bis). Barre oblique finale
  obligatoire (pdfjs concatène le nom de fichier derrière), et **en Node il
  faut un chemin de FICHIER, pas une URL `file://`** (« Unable to load font
  data at: file:///… ») - le banc doit mesurer les mêmes largeurs que le
  navigateur.
- `pdfjs-dist` v6 : le repli « fake worker » sans `workerSrc` ne marche QU'EN
  NODE. En navigateur, `getDocument` refuse de démarrer
  (`No "GlobalWorkerOptions.workerSrc" specified`) - découvert en vrai Chrome
  après des tests Node tous verts (d'où la règle de vérif manuelle). Fix :
  `pdf.worker.min.mjs` copié dans `extension/vendor/` par build.mjs et déclaré
  via `chrome.runtime.getURL`, uniquement quand l'API d'extension existe (les
  tests Node continuent sans). Validé : le bundle esbuild ne contient ni
  `eval(` ni `new Function(`.

## Tests - priorité stricte

- **Zéro tolérance** sur les validateurs (Luhn, IBAN, NIR), la logique de
  masquage/mapping cohérent, la sélection (`selection.js`) et la fusion : un
  bug ici = fuite de donnée silencieuse. Tests unitaires obligatoires, avec au
  moins un cas valide et un cas invalide par validateur.
- Le reste (UI popup, détection de site actif) peut avoir une couverture plus
  légère.
- Les 3 textes de `tests/fixtures/` sont les fixtures de référence (cas
  complet, noms difficiles + pièges, zéro faux positif).
- Une fonctionnalité n'est « terminée » que si les tests passent **et** si on
  l'a vue fonctionner dans un vrai Chrome chargé en mode développeur - jamais
  juste « ça a l'air bon ».
- Ne jamais committer de données de test qui ressemblent à de vraies données
  sensibles réelles, même fictives - utiliser des placeholders reconnaissables
  comme fictifs (ex. carte 4242…).
- Après toute modification de `src/popup/` ou `src/engine/` : `npm run build`
  pour régénérer le bundle de l'extension.

## Réduction de tokens - mesurée, et le bilan est sévère

**Le gain n'existe pas côté texte.** Mesure sur de vrais documents, sortie
comparée à ce que l'utilisateur collerait sans l'outil (copier-coller du PDF) :

| Levier | tous-defauts (6 p.) | memoire-en (21 p., 13 592 tokens) |
|---|---|---|
| Conversion Markdown (mise en forme) | −1 % | −1 % |
| En-têtes/pieds répétés ≥3 pages | 0 % | 1 % |
| Lignes de sommaire (points de suite) | 4 % | 1 % |
| Numéros de page isolés | 0 % | 0 % |

Tout est dans le bruit. **Ne pas construire de nettoyage de mise en forme en
espérant un gain en tokens : il est mesuré, il n'y en a pas.** La conversion
Markdown garde sa valeur (lisibilité pour le LLM, suppression du PII), mais
elle ne doit pas être présentée comme un allègement.

**Le seul levier réel est l'IMAGE** : ~800 à 1500 tokens chacune sur un modèle
multimodal, soit à elle seule l'équivalent de 7 % du mémoire de 21 pages
entier. Le mode « Alléger » les supprime déjà. ⚠️ Ordre de grandeur, pas
garantie : le coût réel d'une image dépend du modèle, de la résolution et du
fait que le PDF soit traité en multimodal ou en extraction texte.

## Compression de prompt (LLMLingua-2) - contraintes posées avant tout code

Seul levier connu d'un ordre de grandeur supérieur : **2× à 5×** de réduction.
`microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank`, Apache 2.0,
~178 Mo - la même architecture que le moteur BERT de repli, et la même tâche
(classification de tokens), donc le worker existant sait déjà l'héberger.
**Extractif** : il ne peut que SUPPRIMER des mots, jamais en écrire - donc
aucune hallucination possible, contrairement à un résumé par LLM.

**⚠️ TROIS CONTRAINTES PRODUIT, non négociables :**

1. **OPTION EXPLICITE, jamais un défaut.** La ligne de partage : *le LLM
   travaille-t-il **sur** le texte, ou répond-il **à partir** du texte ?*
   « Corrige mon mémoire », « reformule », « traduis », « ce contrat est-il
   bien rédigé ? » → la prose EST l'objet, la compresser détruit la tâche.
   « Résume », « quelles dates ? », « y a-t-il une clause de non-concurrence ? »
   → la prose n'est qu'un véhicule. La littérature mesure le même axe : robuste
   en résumé, s'effondre en raisonnement.
2. **DIRE que la prose est appauvrie et qu'on ne peut plus relire.** Pas une
   mention en petit : c'est la contrepartie principale.
3. **TRANSFORMATION D'EXPORT, pas étape du pipeline.** On relit le texte
   MASQUÉ (lisible), et la compression ne s'applique qu'au moment de copier ou
   télécharger. Sinon on casse l'UX anti-fausse-confiance, qui est la colonne
   vertébrale du produit - relire du télégraphique ne permet plus de repérer un
   nom oublié.

Ce qu'un spike doit trancher, dans cet ordre : **les placeholders
survivent-ils ?** (si le compresseur juge `[PERSONNE_1]` peu informatif et le
supprime, la réinjection est morte - rédhibitoire, à forcer et à vérifier,
jamais à espérer) · **le français tient-il ?** (le socle BERT est multilingue
mais l'entraînement à la compression se fait sur MeetingBank, des
transcriptions de réunions en anglais) · **+178 Mo sont-ils acceptables** en
plus des 183 Mo de GLiNER ?

## Chantiers explorés, non construits

### Images et vidéo

Aucun format image n'est géré côté contenu. Deux problèmes distincts, à ne pas
confondre :

1. **Contenu visuel sensible** (visages, plaques d'immatriculation, texte
   lisible à l'écran type capture d'un document) - nécessite de l'OCR + de la
   vision, donc un modèle ML supplémentaire côté client, avec les mêmes
   arbitrages poids/perf que le NER actuel mais probablement plus lourd. Hors
   de portée immédiate, à traiter comme un chantier à part entière, pas une
   extension mineure des adaptateurs fichiers existants.
2. **Réduction de tokens pure** (indépendante du PII) : les API multimodales
   facturent les tokens image selon la résolution - redimensionner/compresser
   une image avant collage réduit le coût sans toucher au contenu. Petite
   feature accessible, sans ML (`<canvas>` : redimensionnement + recompression
   qualité). À ne pas présenter comme de l'anonymisation.

Vidéo : hors de portée, quasi recherche (détection visage/plaque en mouvement +
transcription audio pour le PII parlé). La piste la plus réaliste serait
d'extraire uniquement une transcription audio (Whisper local, lourd) plutôt que
de traiter les pixels.

### PDF contenant des images : contenu perdu à la conversion texte

La sortie PDF→`.md` est purement textuelle, donc les images embarquées d'un PDF
(graphiques, schémas, photos, signatures) sont **silencieusement perdues** -
problème réel pour un LLM multimodal qui aurait pu les exploiter. Tension à ne
pas ignorer : ces images sont à la fois de l'information ET un risque (PII
visuelle, métadonnées, poids en tokens). Options, du moins au plus lourd :

1. **Marqueur de substitution** (premier pas recommandé, aligné sur
   l'anti-fausse-confiance) : détecter la présence d'images par page (pdfjs
   `page.getOperatorList()` → ops `paintImageXObject`/`paintJpegXObject`) et
   insérer une note dans le `.md`. L'utilisateur SAIT qu'il a perdu quelque
   chose au lieu de le découvrir trop tard. Testable en Node (pdf-lib peut
   embarquer une image de test).
2. Extraire les images en fichiers séparés (mais recrée le problème
   « re-chercher un fichier »).
3. Embarquer en base64 dans le Markdown - **rejeté** : explose les tokens et
   réintroduit le risque PII/EXIF sans nettoyage.

### Fidélité de mise en page

1. ~~**Lignes qui dépassent** la largeur de page~~ ✅ corrigé - `tailleQuiTient`
   réduit le fragment jusqu'à ce qu'il rentre. Le **chevauchement entre
   fragments voisins** est corrigé par `calculerBornes` : la borne n'est plus
   le bord de page mais le début du prochain fragment dessiné à la même
   hauteur.
   **Deux principes à conserver.** (a) *On RÉTRÉCIT, on ne DÉPLACE jamais.*
   Repousser un fragment est un problème global - on résout un chevauchement en
   en créant un autre plus loin, avec un résultat possiblement pire. Rétrécir
   reste dans la place déjà occupée et ne peut, par construction, rien casser
   ailleurs. (b) *La portée est la PAGE, pas le paragraphe, et le critère est
   GÉOMÉTRIQUE.* Une première version ne comparait qu'à l'intérieur d'une
   unité : un placeholder de la colonne gauche mordait donc sur la colonne
   droite. On ne peut pas savoir, dans un PDF, si deux morceaux forment « une
   même ligne » - **on n'en a pas besoin** : pour un chevauchement, seule
   compte la superposition des plages à une même hauteur. Ne pas réintroduire
   de raisonnement par « bloc logique » ici.
2. **Tableaux mal rendus** (DOCX/PDF) - à investiguer : largeurs de colonnes,
   fusion de cellules, ou repositionnement des runs dans un tableau. **Seul
   défaut de mise en page encore ouvert.**
3. ~~**Fond des PNG rendu noir**~~ ✅ corrigé. La cause était que `encodeImage`
   décidait sur les **dimensions** (`w * h > 128 * 128`) alors que ce qui
   compte est la présence d'un canal **alpha** : le JPEG n'en a pas et compose
   sur du noir. On mesure désormais la transparence (`aDeLaTransparence`,
   fonction pure et testée) au lieu de la déduire de la taille. **Leçon :
   `encodeImage` dépend d'`OffscreenCanvas`, donc du navigateur, et n'était
   couvert par aucun test - c'est ce trou qui a laissé le bug vivre. Sortir la
   DÉCISION en fonction pure est ce qui l'a rendu testable.**

### Métadonnées : bilan et angle mort

Déjà fait : XLSX/DOCX via `ooxml-metadata.js` (auteur, société, révision,
commentaires). PDF : non-sujet dans l'implémentation actuelle - la sortie est
un `.md` neuf, aucune métadonnée du PDF d'origine n'y transite. Angle mort
réel : **les images (EXIF)** - coordonnées GPS, modèle d'appareil, date de
prise de vue, parfois une miniature intégrée avec un cadrage différent de
l'image affichée (peut révéler du contenu recadré/masqué). Fuite de PII
sérieuse et largement sous-estimée. Techniquement simple (parsing/suppression
EXIF, pas de ML) - à isoler explicitement du chantier « contenu visuel », qui
lui est lourd.
