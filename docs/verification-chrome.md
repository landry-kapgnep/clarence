# Vérification en vrai Chrome — la liste des bugs déjà vécus

> **À quoi sert ce document.** `npm test` (362 tests) et `npm run bench` ne
> voient qu'une partie du produit. `src/popup/main.js` n'est couvert par
> **aucun** test — il dépend de `chrome.*` — et c'est justement là qu'un crash
> a rendu le mode PDF « Préserver » totalement inutilisable *pendant que 230
> tests étaient au vert*. Cette liste recense les bugs qu'on a réellement
> rencontrés, pour les rejouer à la main au lieu de les redécouvrir.
>
> Règle du projet : **une fonctionnalité n'est terminée que si on l'a vue
> fonctionner dans un Chrome chargé en mode développeur.** Ce document est
> l'outil de cette règle.

## ⚠️ Passe due — neuf commits jamais vus tourner (08/08/2026)

La dernière vérification date du **04/08**. Depuis, **neuf commits ont touché
l'UI** sans qu'aucun ne soit passé en Chrome. Cinq fonctions neuves sont
entrées dans `src/popup/main.js`, le fichier qui n'a aucune couverture et qui a
déjà cassé tout le mode PDF avec 230 tests au vert.

Feuille de route ci-dessous : **un seul chargement de `tous-defauts.pdf`**
couvre l'essentiel. Le détail du *pourquoi* de chaque point est dans la section
citée en regard ; ici on ne garde que le geste et le verdict.

### Avant de commencer

```bash
npm run build
```

Puis `chrome://extensions` → recharger l'extension → **F5 sur l'onglet de test**
(le content script ne suit pas le rechargement de l'extension).

### 1. Ce qui saute aux yeux en premier — la police (`7ad4787`)

`--font-body: 'Syne Mono'` était référencée sans **aucune** règle `@font-face` :
la police n'était jamais servie. Elle ne « marchait » que sur une machine où
elle est installée localement — la tienne. Tout autre utilisateur voyait une
police de repli depuis le début.

- [ ] Ouvrir la popup : le texte doit être en **Syne Mono** (chasse fixe, allure
      technique). Si tu ne vois aucune différence, c'est *attendu* — tu l'as en
      local. Vérifier alors dans la console : `document.fonts.check('12px "Syne Mono"')`
      doit rendre `true` **et** l'onglet Réseau doit montrer le `.ttf` chargé
      depuis l'extension.
- [ ] Aucune requête de police vers un domaine externe (`fonts.gstatic.com`…) —
      ce serait une violation MV3 et une fuite d'IP. → cf. **A3**

### 2. Le fichier piégé, d'une traite

Charger `tests/manuel/tous-defauts.pdf` en mode Fichier, option **Alléger**.

- [ ] **Badge de poids** à côté du nom : s'affiche, puis **se corrige** après le
      comptage des pages. Survol → une phrase explique le classement. → **A0quater**
- [ ] **P5 — la couche structurée hors du français** (`55753f3`). **Jamais vu en
      Chrome**, seulement en Node. Chercher ces valeurs dans le fichier de
      SORTIE : aucune ne doit y figurer en clair.

      | Valeur attendue masquée | Page | Ce qui la couvre |
      |---|---|---|
      | `123-45-6789` | 4 (EN) | SSN, motif labellisé |
      | `(617) 555-0142` et `617-555-0143` | 4 (EN) | format national US, **sans libellé** |
      | `Mountain View, CA 94043-1351` | 4 (EN) | code postal + ville |
      | `12345678Z` | 5 (ES) | DNI, clé mod-23 |
      | `28 1234567840` | 5 (ES) | Seguridad Social, motif labellisé |
      | `Calle Mayor 12` … `28013 Madrid` | 5 (ES) | adresse ES + code postal |
      | `12345678901` | 6 (DE) | Steuer-ID |
      | `Hauptstraße 15` … `10115 Berlin` | 6 (DE) | voie soudée + code postal |
      | `030 1234567` | 6 (DE) | national DE, avec libellé `Festnetz` |

      ⚠️ Contrôle inverse, même importance : **`483 921 657` (le SIREN, page 2)
      ne doit PAS être masqué comme téléphone.** C'est le piège pour lequel
      libphonenumber tourne sans pays par défaut ; les motifs nationaux ajoutés
      par P5 pouvaient le réintroduire.
- [ ] **Table de correspondance** : triée par occurrences **décroissantes**,
      chaque ligne porte son compte et un bouton. → **A0quinquies**
- [ ] Cliquer « ne plus masquer » sur la ligne du haut → régénération en
      **moins d'une seconde**. Si ça reprend 45 s, le cache d'entités n'est pas
      réutilisé et tout le mécanisme est manqué.
- [ ] Retélécharger → le terme est en clair **partout**, pas seulement à sa
      première occurrence.
- [ ] Le terme retiré est apparu dans **« Termes de ce document »**, et
      **l'aperçu sous le champ s'est mis à jour** (écriture programmatique : le
      rafraîchissement est explicite, c'est exactement ce qui peut manquer). → **A0septies**

### 3. Les deux vocabulaires ne doivent pas se marcher dessus

- [ ] Taper `A, B, C` dans « Termes de ce document » → l'aperçu dit
      **« 3 termes : A · B · C »**. Retirer une virgule → le compte **baisse** et
      le terme soudé s'affiche tel quel. → **A0septies**
- [ ] **Changer de profil** → les termes du document **survivent** ; les champs
      du panneau, eux, changent. C'est le bug qui a motivé la séparation. → **A0sexies**
- [ ] « Enregistrer » un profil → les termes du document **ne s'y retrouvent pas**.
- [ ] Tab dans un champ → **navigue** vers le suivant (plus capturé).

### 4. « Ne jamais masquer » à la séquence de mots (`1ebe7dc`)

Le champ n'épargnait qu'à l'**égalité stricte** : taper `Moorkens` ne faisait
rien parce que le modèle détecte `Joss Moorkens`. Mesuré : **6 termes sur 14**
fonctionnaient.

- [ ] Repérer dans la table un nom **complet** détecté (prénom + patronyme).
      Saisir **le patronyme seul** dans « ne jamais masquer » → l'entité
      entière doit être épargnée.
- [ ] Contrôle inverse — le mot doit rester **entier** : un terme court ne doit
      pas épargner un mot qui le contient.

### 5. Changement de fichier — la remise à zéro

- [ ] Choisir un autre fichier → termes du document **effacés**, aperçus
      **vidés**, retraits précédents **oubliés**, règles de profil **intactes**.
      → **A0quinquies §6**, **A0sexies §3**

### 6. Le contrôle qui ne se négocie pas

- [ ] Onglet **Réseau** ouvert pendant tout ce qui précède : **aucune** requête
      sortante contenant du texte utilisateur. Seul huggingface.co, une fois,
      pour le modèle. → **A3**

### Après la passe

Consigner ce qui a été vu — y compris « rien à signaler ». Une passe non
consignée sera refaite ou, pire, supposée faite.

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

| Modèle | Accélérateur | Lots | Temps | Verdict |
|---|---|---|---|---|
| `model_quantized` (int8, 175 Mo) | `wasm` | 1 | 5 min 45 | ligne de base |
| `model_quantized` (int8, 175 Mo) | `webgpu` | 1 | 5 min 36 | aucun gain |
| `model_fp16` (292 Mo) | `webgpu` | 1 | 2 min 01 | ×2,8 |
| `model_fp16` (292 Mo) | `webgpu` | **8** | **1 min 02** | **×5,6 — livré** |

Contrôle de la sortie sur ce dernier passage (75 pages) : **2030 placeholders**
(335 distincts), **0 tronqué** (le correctif P7 tient à l'échelle), et **zéro
fuite** sur les motifs déterministes — email, IBAN, téléphone, NIR.

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

### A0bis. Annulation et runs concurrents (06/08/2026)

Trois symptômes vécus à l'usage, **une seule cause** : `processFile()` n'avait
aucune identité de run, donc deux exécutions pouvaient se chevaucher en
écrivant dans le même état global.

| Symptôme vécu | Cause réelle |
|---|---|
| « l'anonymisation n'est pas allée au bout » après avoir changé de fichier | le `finally` du run abandonné réinitialisait l'UI pendant que l'autre tournait |
| « ça boucle sur Reconstruction du PDF » | le worker traite ses messages un par un : le nouveau run attendait derrière des centaines d'inférences mortes |
| « Traitement échoué » à la relance | état global écrasé par le run périmé |

Le plus grave n'était visible nulle part : le **nom de sortie était lu à la
fin** alors que le contenu avait été lu au début. Changer de fichier en cours de
route produisait **le contenu de A sous le nom de B** — on croit tenir B
anonymisé. Même gravité qu'une fuite, corrigé par capture du fichier au départ.

À vérifier en Chrome :
1. Lancer un gros PDF, cliquer **Annuler** → arrêt en quelques secondes, statut
   « Traitement annulé », **aucun fichier** proposé au téléchargement.
2. Relancer juste après → doit repartir à vitesse normale. Si c'est lent, la
   purge du worker n'a pas eu lieu (c'est tout l'objet du correctif).
3. Changer de fichier / cocher une autre option **pendant** un traitement →
   annulation automatique, pas de résultat fantôme qui apparaît plus tard.
4. Vérifier qu'un vrai échec affiche toujours « Traitement échoué » : une
   annulation ne doit pas emprunter ce message, et réciproquement.

**Limite assumée, à ne pas redécouvrir** : si la popup est fermée ou rechargée,
le Worker meurt avec elle — le traitement ne « continue » pas, il disparaît.
Le faire survivre supposerait de déplacer tout le pipeline dans le service
worker MV3 (tué à l'inactivité, sans DOM alors que `pdf-reconstruct.js` utilise
`canvas`/`ImageBitmap`, et un troisième contexte où charger 292 Mo). Chantier
réel, non engagé : à ~1 minute et avec une annulation qui marche, le besoin
devient marginal.

### A0ter. ORT n'exécute QU'UNE inférence à la fois (06/08/2026)

Trouvé en vrai Chrome, deux secondes après le lancement :
`Error: Session already started`, et le traitement échoue.

La source est dans le binaire JSEP lui-même :

```js
if (u.Eb) throw Error("Session already started");   // wrapper _OrtRun
```

Le fournisseur **WebGPU** pose un marqueur global et refuse un second `run`
tant que le premier n'a pas rendu la main. Tant que la détection était
séquentielle, le cas était inatteignable ; **le regroupement en lots l'a rendu
atteignable** — le vidage des lots libérait son verrou dès son entrée, donc les
appels nés pendant ses attentes programmaient un second vidage concurrent.

Corrigé à DEUX endroits, volontairement :
1. **Dans le worker** (`serialiser`, `src/engine/batch.js`) — c'est lui qui fait
   autorité : la contrainte appartient au moteur d'exécution, pas à l'appelant.
   Tout futur appelant est couvert sans avoir à connaître la règle.
2. **Dans le batcher** — un seul vidage à la fois, pour ne pas empiler des lots
   qui seraient de toute façon mis en file derrière.

Le test de non-régression a été **vérifié rouge avant / vert après** contre une
réplique de l'ancienne logique : 2 inférences simultanées avant, 1 après. Un
test de concurrence qu'on n'a pas vu échouer ne prouve rien.

⚠️ Ne pas « paralléliser les inférences pour aller plus vite » : c'est
impossible avec ce fournisseur. Le levier de vitesse est le LOT (un seul `run`
pour N textes), pas la concurrence.


### A0quater. Badge de poids du fichier (07/08/2026)

Affiché à la sélection du fichier, à côté de son nom : **Léger / Moyen /
Lourd / Très lourd**. Ce n'est délibérément PAS une estimation de temps — un
temps annoncé est une promesse qu'on ne peut pas tenir (machine, WebGPU, cache
du modèle), et l'utilisateur en voudrait à l'application. Un poids décrit le
fichier : il est vérifiable et ne peut pas être démenti.

À vérifier en Chrome (`src/popup/main.js` n’a aucune couverture automatique) :

1. Choisir une **image lourde** (plusieurs Mo) → doit afficher **Léger**.
   Aucune inférence n'est faite dessus, seules les métadonnées sont retirées.
2. Choisir le **mémoire de 75 pages** → doit afficher **Très lourd**. Le badge
   part d'abord d'une estimation à la taille, puis **se corrige** une fois les
   pages comptées : la correction en place est le comportement attendu.
3. Choisir un **PDF de quelques pages mais lourd en images** → doit finir en
   **Léger** ou **Moyen**. C'est le cas qui prouve que le badge ne se fie pas
   aux octets.
4. Survoler le badge → une phrase dit sur quoi le classement repose.
5. Changer de fichier en cours de comptage → le badge ne doit **jamais**
   afficher le résultat du fichier précédent (même règle que les runs).

Contraste mesuré des quatre teintes sur le fond sombre : **7,25 à 8,50** —
au-dessus du seuil AAA (7:1). Le mot est toujours présent à côté de la couleur,
jamais la couleur seule.


### A0quinquies. Table de correspondance actionnable (07/08/2026)

La détection ne sera jamais parfaite, et une part du sur-masquage dépend du
DOCUMENT : « ChatGPT » doit survivre dans un mémoire sur ChatGPT — aucun
réglage enregistré à l'avance ne peut le prévoir, et un profil créé pour un
seul document reviendrait à anonymiser à la main. Le levier n'est donc pas de
mieux deviner, mais de rendre la correction immédiate.

Mesuré sur un vrai mémoire anglais de 21 pages : `ChatGPT` masqué **41 fois**,
`MT` **25 fois**, quand la vraie donnée personnelle (le nom de l’autrice)
n'apparaissait qu'**une** fois. Le sur-masquage se concentre donc en tête de la
distribution — d’où le tri par fréquence, qui met les corrections les plus
rentables en premier.

À vérifier en Chrome :

1. Traiter un fichier → la table est triée par **occurrences décroissantes**,
   chaque ligne portant son compte et un bouton « ne plus masquer ».
2. Cliquer sur le bouton de la ligne la plus fréquente → le fichier est
   **régénéré en moins d’une seconde**. Si ça prend 45 s, le cache d’entités
   n’a pas été réutilisé et tout le mécanisme est manqué.
3. Retélécharger → le terme doit être en clair **partout**, pas seulement à sa
   première occurrence.
4. Retirer un deuxième terme → les deux restent retirés (les retraits
   s’accumulent).
5. Sur un PDF « Préserver », vérifier que les **images sont toujours là** après
   régénération.
6. Changer de fichier, puis relancer une détection → les retraits précédents
   sont **oubliés** (nouveau mapping, anciennes cibles caduques).


### A0sexies. Deux vocabulaires, deux endroits (07/08/2026)

**Termes de ce document** (`#docKeep` / `#docMask`) — bloc visible, hors du
panneau « Personnaliser le masquage ».

La séparation est FONCTIONNELLE, pas esthétique. Les champs du panneau sont
**écrasés au chargement d’un profil** (`fileAlwaysKeep.value = p.alwaysKeep…`)
et « Enregistrer » y pousserait des termes qui ne valent que pour un fichier.
Y ranger le vocabulaire d'un document, c'était le perdre au premier changement
de profil et polluer le profil au premier enregistrement.

À vérifier en Chrome :

1. Saisir des termes dans « Termes de ce document », **changer de profil** →
   ils doivent **survivre** ; les champs du panneau, eux, changent.
2. Cliquer « Enregistrer » sur un profil → les termes du document **ne doivent
   pas** s’y retrouver.
3. Choisir un **autre fichier** → les termes du document sont **effacés** ; les
   règles de profil sont **intactes**.
4. **La virgule sépare les termes.** Tab n’est PAS capturé : il navigue
   normalement entre les champs. La tabulation reste acceptée à l’analyse
   (collage depuis un tableur), mais on n’en fabrique plus.
5. Le bouton « ne plus masquer » de la table écrit dans **« Termes de ce
   document »** — le terme est visible, modifiable à la main, et disparaîtra
   avec le fichier.

⚠️ CONTREPARTIE : un terme ne peut plus contenir de virgule. « Dupont, Marie »
sera lu comme deux termes. Côté « toujours masquer » c’est sans danger (on
masque davantage) ; côté « ne jamais masquer » ça peut laisser en clair un
fragment non voulu. Rare, et **visible** à la relecture — c’est exactement ce
que la tabulation ne permettait pas.


### A0septies. Aperçu des termes réellement lus (08/08/2026)

Sous chaque champ de « Termes de ce document », une ligne affiche **les termes
tels que le moteur les lira**, comptés et séparés visuellement.

Deux incidents vécus le même soir, tous deux **silencieux** :

1. Une virgule oubliée a soudé `UE` et `Ginel` en un terme fantôme `UEGinel` —
   ni l’un ni l’autre n’a été épargné.
2. Un rechargement de l’extension a vidé le champ ; la liste a été retapée
   partiellement, **7 termes sur 15 perdus**, découverts seulement en comparant
   deux sorties.

Une consigne qu’on croit appliquée alors qu’elle ne l’est pas est le pire cas
pour cet outil — même famille de défaut que le sur-masquage silencieux.

L’aperçu utilise `parseTermes`, **la même fonction que le moteur** : il ne peut
donc pas mentir. S’il affiche 8 termes, le moteur en applique 8.

À vérifier en Chrome :

1. Taper `A, B, C` → « 3 termes : A · B · C ». Retirer une virgule → le compte
   **baisse** et le terme soudé apparaît tel quel.
2. Cliquer « ne plus masquer » dans la table → le terme s’ajoute ET **l’aperçu
   se met à jour** (écriture programmatique : elle ne déclenche pas `input`,
   le rafraîchissement est explicite).
3. Changer de fichier → champs vidés **et** aperçus vidés.
4. Un échec de régénération restaure la valeur précédente → l’aperçu revient
   à l’état d’avant.

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
