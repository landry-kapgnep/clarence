# Roadmap — qualité de détection & reconstruction PDF

Backlog des défauts **observés sur de vrais fichiers** (pas des idées théoriques).
Classé par priorité = gravité (fuite > sur-masquage > cosmétique).

> **Ce fichier est le tableau de bord vivant de la détection.** Le bloc ci-dessous
> se met à jour à chaque séance ; les sections P0→P8 gardent le détail et
> l'historique. Règle : on n'écrit ici que ce qui a été **mesuré**, jamais une
> impression — et on garde les pistes **rejetées** avec leur chiffre, pour ne pas
> les retenter.

## Tableau de bord — 06/08/2026

### Les trois chiffres (`npm run bench`, 7 documents, **configuration livrée**)

| Critère | Valeur | Exigence | Tendance |
|---|---|---|---|
| Rappel **structuré** | **100 %** (20/20) | 100 %, non négociable | stable |
| Rappel **contextuel** | **83 %** (30/36) | mesuré, jamais promis | 78 → **83** |
| Termes **préservés** | **98 %** (45/46) | bloque le payant | 90 → 95 → 96 → **98** |

### Où en est le temps de traitement : 5 min 45 → **1 min 02**

Mémoire réel de 75 pages, en vrai Chrome, trois correctifs cumulés (pré-filtre,
fp16+WebGPU, lots de 8). Détail des mesures dans `docs/verification-chrome.md`
§A0. Objectif fixé par l'usage : **sous 30 s**. On y est presque, et le reste
ne viendra plus de l'accélérateur — voir la limite ci-dessous.

**Limite structurelle à connaître avant de chercher plus loin** : ORT n'exécute
**qu'une inférence à la fois** (marqueur global du fournisseur WebGPU, voir
§A0ter). Le parallélisme d'appels est donc définitivement hors de portée — pool
de workers compris, d'autant qu'il n'y a de toute façon qu'un seul GPU. Le seul
levier restant est de **soumettre moins de texte** au modèle, pas de le
soumettre plus vite.

### Inférences regroupées en lots : ×2,6 de plus, à détection identique

Le coût d'une inférence est « ~37 ms fixes + k × longueur ». Sur un mémoire
découpé en ~470 unités × 2 groupes de labels, cela faisait ~940 appels, soit
**~35 s de coût fixe pur** avant le moindre calcul utile — et un GPU nourri
d'une unité de 90 caractères tourne à vide.

GLiNER.js sait nativement traiter un lot (`inference({ texts: [...] })` = UN
tenseur, UN `run()`). `src/engine/batch.js` rassemble donc les appels
concurrents ; `detectNerPerUnit` lance les unités par vagues de 24 pour qu'il y
ait matière à grouper. **`detectGliner` n'est pas touché** : seuils, filtres de
forme, recalage et pontage restent à l'identique — c'est du transport, pas de
la détection.

Mesuré sur 240 unités réalistes, deux tirages concordants :

| Taille de lot | Temps | Spans produits |
|---|---|---|
| 1 (avant) | 18,8 s | 570 |
| **8** | **7,1-7,4 s** | **570** |
| 16 | 7,5-8,2 s | 570 |
| 32 | 7,5-7,8 s | 570 |

**570 spans identiques à toutes les tailles** : le regroupement ne change pas
la détection, vérifié au span près et pas seulement en agrégat. Le banc complet
est passé au même mécanisme et rend exactement 100 % / 83 % / 98 %.

Au-delà de 8 la courbe s'aplatit puis remonte : un gros lot mélange des
longueurs éloignées, et le lot est calculé à la longueur de son PLUS LONG texte
(`inputLength = Math.max(...textLengths)`). D'où le tri par longueur et le
budget qui borne `taille × plus long`. **Ne pas monter la taille de lot « pour
aller plus vite » : c'est mesuré, et ça ne marche pas.**

Ce n'est PAS le « regroupement d'unités » déjà rejeté (concaténer les textes en
un seul, ce qui perdait les entités isolées) : chaque texte reste une entrée
distincte du lot.

### Le temps de traitement divisé par 2,8 — et ce que ça a failli coûter

Un mémoire réel de 75 pages passe de **5 min 45 à 2 min 01** en vrai Chrome,
en changeant la variante de poids (int8 → **fp16**) ET le fournisseur
d'exécution (wasm → **webgpu**). Détail des trois mesures : `docs/verification-chrome.md` §A0.

**Ce n'est pas WebGPU qui accélère, c'est le couple modèle+fournisseur.** Le
même WebGPU sur les poids int8 ne rapportait rien (5 min 36) : son fournisseur
supporte mal les opérateurs quantifiés, la plupart des nœuds retombaient sur le
CPU. Jugés séparément, ces deux réglages auraient fait abandonner la bonne piste.

**Le piège, et c'est la vraie leçon : un seuil appartient à une variante de
poids.** Livré tel quel, le fp16 faisait tomber les termes préservés de **98 %
à 93 %** (`SOMMAIRE` et `Docker` sur-masqués en plus) — le 0,38 avait été calé
sur l'int8, et le fp16, numériquement plus précis, remonte tous les scores. Un
gain de vitesse payé en qualité, invisible sans rejouer le banc.

Rebalayage complet en fp16 → seuil du groupe identité **0,38 → 0,46** :

| Seuil (fp16) | Structuré | Contextuel | Préservé |
|---|---|---|---|
| 0,38 | 100 % | 83 % | 93 % |
| 0,42 | 100 % | 83 % | 93 % |
| 0,45 | 100 % | 83 % | 96 % |
| **0,46** | **100 %** | **83 %** | **98 %** ← retenu |
| 0,47 / 0,48 | 100 % | 83 % | 98 % (plateau) |
| 0,50 | **95 %** ✗ | 83 % | 98 % |

0,46 est le plus BAS du plateau, donc le plus détectant à qualité égale
(« zéro-fuite > faux positifs »). 0,50 casse le **structuré** : rédhibitoire.

Les scores des cas-bornes ont été re-mesurés, pas extrapolés :
`Amandine ROUSSEAU` 0,398 → **0,998**, `LANDRY KAPGNEP` 0,47 + 0,36 (deux spans)
→ **0,494** (un seul span), `CERTIFICAT DE SCOLARITE` 0,36 en PER → **0,469** en
ORG **isolé** (mais préservé en contexte réel : 100 % sur son document).

**Effet de bord favorable** : `BUT Informatique`, sur-masquage listé plus bas
comme « diagnostiqué, non corrigé », disparaît à 0,46 — `cv-fr.pdf` passe de
88 % à **100 %** de termes préservés.

### Seuil du groupe identité : 0,45 → 0,38, choisi par balayage

Une fuite partielle subsistait sur `rapport-fr.txt` : « Amandine » restait en
clair. Diagnostic — contrairement à ce qui avait été conclu deux séances plus
tôt, la cause n'était **pas** la fusion (merge.js gère déjà le cas où le
patronyme « ROUSSEAU » matche le motif BIC) : le modèle ne franchissait le
seuil sur **aucune** des 3 occurrences (0,364 et 0,398 mesurés, de façon
déterministe). « Nadia Belkacem » (`dossier-rh.txt`) était dans le même cas.

Balayage sur le banc **complet**, pas par extrapolation :

| Seuil | Contextuel | Préservé | Effet |
|---|---|---|---|
| 0,45 | 78 % | 98 % | fuite « Amandine » |
| 0,40 | 81 % | 98 % | fuite « Amandine » encore |
| **0,38** | **83 %** | **98 %** | **les deux noms trouvés, aucun faux positif** |
| 0,36 | 83 % | 96 % | `CERTIFICAT DE SCOLARITE` devient un faux positif PER |
| 0,35 | 83 % | 96 % | idem |

0,38 est le **point pivot exact**. Deux tests figent les deux bornes.

### Le pré-filtre existait déjà, et il tuait le cas phare

`detectNerPerUnit` sautait toute unité sans **deux lettres consécutives** —
garde-fou de performance pour ne pas payer une inférence sur les milliers de
cellules numériques d'un CSV. Angle mort : une cellule ne contenant qu'une
**date de naissance** n'a aucune lettre, donc n'était **jamais soumise au
modèle**. C'est précisément le cas que le zero-shot est censé débloquer, et
l'exemple de référence de `CLAUDE.md` (« 1988-03-14 » seul → 0,59, au-dessus du
seuil). Le modèle savait le faire ; on ne le lui demandait pas — et le banc
comptait ça comme un raté du modèle.

Corrigé : `tableau-rh.csv` passe à **100 % de rappel contextuel et 100 % de
termes préservés**.

### Une exigence de FORME par type, là où le score ne sépare rien

Deux gardes déterministes, chacune traduisant ce que le type est par nature :

| Type | Exigence | Faux positifs éliminés |
|---|---|---|
| PER / ORG / LOC | au moins une **majuscule** (ce sont des noms propres) | `vendor`, `candidate`, `dossier`, `protagoniste`, `leadership` |
| DATE_NAISSANCE | au moins un **chiffre** | `trimestre` (0,74), `Sept. 2024 - Aout 2025` |

> **Le contextuel a BAISSÉ de 90 % à 75 % sans aucune régression** : le corpus a
> gagné `dossier-rh.txt`, seul document portant de vraies données de santé, de
> poste et d'établissement — que le moteur ne trouve pas. Le chiffre d'hier
> flattait parce que rien ne l'éprouvait. Sur les 6 documents précédents, le
> rappel reste à 90 %.

Sur un vrai mémoire de 75 pages : **21,1 %** du document masqué (39,1 % avant),
**9 min** de traitement (11 min avant), vérifié en Chrome.

### Décision tranchée le 05/08 : POSTE / SANTE / NATIONALITE / ETABLISSEMENT décochés par défaut

Question reportée deux fois faute de document pour l'éprouver. `dossier-rh.txt`
l'a tranchée : le modèle **inverse les étiquettes en français** et place les
vraies valeurs très en dessous du plancher de bruit.

| Valeur réelle | Étiquette rendue | Score |
|---|---|---|
| `diabète de type 2` | **job title** | 0,04 |
| `aide-soignante` | **medical condition** | 0,08 |
| `portugaise` | nationality | 0,02 |
| `suivi psychologique` | medical condition | 0,28 |
| `Camille-Claudel` | school | 0,31 |

Plancher de bruit mesuré sur texte fragmenté : **0,4-0,7**. Aucun seuil ne peut
les séparer. Les désactiver ne coûte **aucun vrai positif** (rappel contextuel
identique) et fait gagner 3 points d'utilisabilité. Les laisser actifs serait de
la fausse confiance sur des données de l'article 9 — l'utilisateur croirait ses
données de santé protégées alors qu'elles ne le sont pas. Ils restent proposés
dans l'UI, décochés.

### Ce qui reste ouvert, par gravité

| # | Défaut | État | Où |
|---|---|---|---|
| — | **Aucune fuite structurée ni partielle** au banc | ✅ | — |
| — | Données de l'**article 9** (santé) non détectées — décochées par défaut, dit honnêtement | limite du modèle | le plus grave restant |
| ~~P2bis~~ | ~~`BUT Informatique` sur-masqué (`cv-fr.pdf`)~~ — disparu au recalibrage fp16 (seuil 0,46) ; `cv-fr.pdf` à **100 %** de préservé | ✅ | — |
| P2bis | `Docker` sur-masqué (`rapport-interligne.pdf`) — seul sur-masquage restant au banc (préservé 98 %) | ouvert | bloque le payant |
| — | `KAROLINE ANSELME` ratée sur `certificat-fr.txt` (contextuel 67 %, pire document du banc) | ouvert | rappel |
| ~~—~~ | ~~`1988-03-14` raté en cellule nue~~ — corrigé par le pré-filtre (`meriteUnePasseContextuelle`), `tableau-rh.csv` à 100 %/100 % | ✅ | — |
| ~~—~~ | ~~`Nadia Belkacem` ratée~~ — corrigée par le seuil à 0,38 | ✅ | — |
| ~~P7~~ | ~~Placeholders tronqués~~ — c'était un DÉBORDEMENT hors page, pas une troncature ; réduit à la taille qui tient. 422 → **0** sur le mémoire | ✅ | — |
| P2ter | Adresse abrégée (« Av. ») mal typée ; produits tiers jamais détectés | ouvert | couverture |
| — | Régression assumée : `IUT` ne survit plus (fusionné avec « Informatique ») | connu | cosmétique |
| ~~P5~~ | ~~i18n de la couche structurée~~ — DNI/NIE (clé mod 23), sécu ES, Steuer-ID, téléphones nationaux ES/DE/US, codes postaux à mot intercalé, adresses ES/DE. **10 fuites sur 10 fermées** (08/08) | ✅ | — |

### Diagnostiqués le 05/08, non corrigés — l'un par choix, l'autre par mesure

**`BUT Informatique` (sur-masquage, `cv-fr.pdf`) — ✅ RÉSOLU le 06/08 sans
correctif dédié.** Le tableau de bord blâmait POSTE, ce qui était faux : avec
POSTE désactivé (config livrée), c'était le **groupe identité lui-même** qui
taguait `Informatique` en ORG à **0,47** sous les poids int8, au-dessus du seuil
0,38. `Informatique` est un nom commun de filière, capitalisé par convention
française (« BUT Informatique », le nom du diplôme), ambigu avec un nom
d'entreprise pour le modèle. Aucune exception nommée n'avait été tentée : cela
irait contre le principe du projet (pas de liste statique pour une classe
ouverte — les filières d'études en sont une, au même titre que les entreprises).

Le passage en fp16 + seuil 0,46 l'a fait disparaître. **À retenir : la bonne
réponse à un faux positif isolé n'était pas une exception, c'était une meilleure
calibration.** Avoir refusé la liste statique a évité de porter une exception
devenue inutile — et qui, elle, aurait masqué le vrai problème.

**`KAROLINE ANSELME` (raté, `certificat-fr.txt`, pire score du banc : 67 %).**
Scores mesurés dans le vrai contexte (document de 402 caractères, un seul
chunk — pas de fenêtrage en jeu) : `KAROLINE` **0,130**, `ANSELME` **0,042**.
Très en dessous du seuil, et bien plus bas que le cas déjà documenté
(« LANDRY KAPGNEP », 0,47/0,36) — même forme (nom isolé, TOUT-MAJUSCULE, sur sa
propre ligne) mais un score 3 à 10× plus faible. Pourquoi : sans indice de
taille de police (un `.txt` n'en porte pas), le modèle n'a que la ponctuation
autour (« certifie que\n\nKAROLINE ANSELME\n\n ») pour juger — visiblement
insuffisant ici.

**Piste testée et REJETÉE, mesurée sur le banc complet : seuil à 0,10.**
Nécessaire pour dépasser 0,130. Effet : contextuel 83 % → 89 % (+6 points),
préservé **98 % → 83 %** (`Docker`, `Linux`, `BUT Informatique` en faux
positifs). Mauvais échange, net. Le seuil est épuisé comme levier pour ce cas ;
toute amélioration future demanderait un signal déterministe (position en tête
de document, structure de phrase administrative), pas un réglage de score.

### Fragilité de fond à garder en tête

Les scores du modèle **dépendent de la longueur du contexte**, pas seulement du
texte. `Nadia Belkacem` sort à 0,60 sur le document entier, et passe sous le
seuil une fois le texte découpé en fenêtres de 1000 caractères. Ce n'est pas un
bug du code : c'est une instabilité du modèle, et elle explique pourquoi les
sondages sur extraits mentent (trois fois dans ce projet). **Seul le banc
complet tranche.**

### Pistes TESTÉES et REJETÉES — ne pas les refaire

| Piste | Verdict mesuré |
|---|---|
| Reformuler les labels en `person name` / `company name` | contextuel **84 → 72 %**, 8 tests cassés |
| Traitement par **lot** (`inference({texts:[…]})`) | **2,5× plus LENT** (padding) et change les résultats (0/60 identiques) |
| **Cache** par texte d'unité | 0 % de doublons sur un vrai mémoire |
| Donner le libellé de colonne comme **contexte** à une cellule | fait CHUTER la détection (0,57 → 0,32 = fuite) |
| Checkpoint **multilingue** `gliner_multi-v2.1` | 2× plus lourd, quasi rien trouvé |
| Regrouper les unités en lots de 150/300/600 caractères | le nom du CV n'est plus trouvé |

### Le modèle de coût, à ne pas se retromper dessus

`coût ≈ 37 ms fixes + k × longueur du texte`, **par groupe de labels**.
Conséquence : réduire le NOMBRE d'inférences ne rapporte presque rien (mesuré :
−60 % d'inférences → −18 % de temps). Les vrais leviers sont de réduire les
**caractères traités** (décocher un groupe ≈ ×3) ou de rendre chaque inférence
moins chère (WebGPU, modèle plus petit).

---

## ~~P0 — Fuites de noms propres~~ ✅ CORRIGÉ (21/07/2026)

- **Nom TOUT-MAJUSCULE** : `boostCase` ignorait volontairement le tout-majuscule
  (`tok !== lower → return tok`), donc « LANDRY KAPGNEP » n'était jamais soumis
  au modèle *cased* sous une forme reconnaissable. Corrigé : mot tout en
  majuscules de ≥ 4 lettres remis en Titre (seuil qui épargne les acronymes
  SQL/API/JWT/BUT/IUT). Coût nul (la passe boostée existait déjà), longueur
  préservée. Garde-fou : fixture « zéro faux positif » toujours à zéro.
- **Nom dans les URL** : nouveau type déterministe `PSEUDO` (handle après
  `linkedin.com/in/`, `github.com/`, `t.me/`…). Le domaine lève l'ambiguïté →
  aucun faux positif sur de la prose, et masque même sans détection NER.

## P0 (ancien intitulé, conservé pour l'historique)

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

## Progression mesurée — 03/08/2026 (après marquage des en-têtes)

| | Ligne de base | Après | |
|---|---|---|---|
| Rappel structuré | 100 % | **100 %** | inchangé |
| Rappel contextuel | 92 % | **92 %** | inchangé |
| Termes préservés | 77 % | **90 %** | +13 pts |

Le tableau RH passe de 20 % à **100 %** de termes préservés, sans perdre une
seule détection. Cause traitée : les libellés de colonnes étaient masqués parce
que le modèle confond « la case qui S'APPELLE Date de naissance » avec « une
case qui CONTIENT une date de naissance ». Les unités d'en-tête sont désormais
marquées `structurel` (CSV et XLSX) et épargnées par la passe contextuelle ; la
couche déterministe, elle, continue de tourner partout.

### Piste TESTÉE ET REJETÉE : donner le libellé de colonne comme contexte

Intuitivement, une cellule nue « 1988-03-14 » devrait mieux se qualifier si on
lui adjoint son libellé. **C'est faux, et mesuré :**

| Entrée soumise au modèle | Score |
|---|---|
| `EMP-0012` seul | entreprise **0,57** → masqué |
| `Matricule : EMP-0012` | entreprise **0,32** → **fuite** |
| `1988-03-14` seul | date de naissance **0,59** → masqué |
| `Date de naissance : 1988-03-14` | **0,74 sur le LIBELLÉ**, 0,15 sur la vraie date → **fuite** |

Le libellé ressemble presque mot pour mot à la catégorie cherchée : il capte
l'attention du modèle à la place de la valeur. **L'isolement d'une cellule est
donc un ATOUT du zero-shot, pas un manque à combler.** Ne pas refaire.

---

## Le banc comptait une fuite comme un succès — corrigé (04/08/2026)

Défaut de la **vérité terrain elle-même**, pas du moteur. Le banc cherchait la
valeur ENTIÈRE dans la sortie : « Amandine ROUSSEAU » était comptée masquée
alors que la sortie disait « Amandine [BIC_1] » — le prénom en clair trois
fois dans le rapport, juste à côté du placeholder qui annonce son patronyme.
Dans un rapport de stage, ça désigne la personne aussi sûrement que le nom
complet.

Le banc vérifie désormais aussi les **composants** d'un nom (`fuitePartielle`
dans `run.mjs`). Limité au type PER : c'est le seul dont chaque morceau
identifie séparément — vérifier les composants d'une adresse ferait crier au
loup sur « rue » ou « des ».

Effet immédiat : le rappel contextuel réel n'était pas 92 % mais **84 %**.
Trois fuites partielles apparaissent, dont deux qu'aucune métrique ne montrait :

| Document | En clair | Cause |
|---|---|---|
| `rapport-fr.txt` | « Amandine » | nom non détecté dans le bloc de titre (0,07) |
| `email-pro-en.txt` | « Marcus » | prénom réutilisé SEUL plus loin, non propagé |
| `certificat-fr.txt` | « KAROLINE », « ANSELME » | raté complet déjà connu |

Le cas « Marcus » est le plus instructif et n'était couvert nulle part : le nom
complet est masqué à la première occurrence, mais le prénom employé seul dix
lignes plus bas ne l'est pas — la propagation travaille sur la valeur entière.
C'est une forme d'usage très courante dans un vrai mail.

---

## Ligne de base mesurée — 03/08/2026 (`npm run bench`)

Premier chiffrage reproductible, sur 5 documents synthétiques couvrant les cas
réellement rencontrés (CV multi-colonnes en PDF reconstruit, rapport avec
sommaire, certificat administratif, tableau RH, email anglophone).

| | Résultat | Exigence |
|---|---|---|
| Rappel **structuré** | **100 %** (17/17) | 100 % — non négociable |
| Rappel **contextuel** | **92 %** (23/25) | mesuré, jamais promis |
| Termes **préservés** | **77 %** (24/31) | utilisabilité |

**Le blocage n'est pas la fuite, c'est le sur-masquage.** Les deux seuls ratés
contextuels sont un nom TOUT-MAJUSCULE isolé sur un certificat et une date en
cellule nue. En face, 7 termes qui devaient survivre ont été masqués — et le
pire cas est le tableau RH : **43 masques pour 62 mots**, avec les en-têtes de
colonnes (`Matricule`, `Service`, `Salaire`, `Date de naissance`) masqués. Un
CSV dans cet état est illisible pour un LLM : c'est « sûr » et sans valeur.

Conclusion produit : le travail restant avant une première version n'est pas
d'attraper plus, c'est **d'attraper moins mais mieux**. Priorité au
sur-masquage (P2/P2bis) devant tout le reste.

Fuite corrigée grâce à ce premier passage : `employee identifier IS EMP-4471-KD`
— le motif exigeait que la valeur suive immédiatement son libellé, un simple
verbe de liaison le mettait en échec.

---

## ~~P0bis — La propagation ne franchissait pas la frontière fichier~~ ✅ CORRIGÉ (03/08/2026)

Constaté sur un **vrai rapport de stage de 26 pages**. Le nom du tuteur était
masqué dans les paragraphes rédigés mais restait **EN CLAIR en page de garde**,
où il n'apparaît qu'après un libellé (`Tuteur entreprise : <nom>`), sans phrase
autour. Symptôme trompeur : « parfois masqué, parfois pas », pour la même
valeur dans le même document.

**Cause** : `maskText` propage bien toute valeur déjà mappée sur ses autres
occurrences — mais uniquement dans la CHAÎNE `masked`. `anonymizeUnits`
construisait la liste `entities` à partir des seules entités *détectées*. Or
les adaptateurs qui réécrivent un fichier (PDF reconstruit, DOCX) repartent de
`entities`, pas de `maskedText`. Les occurrences propagées fuyaient donc dans
le fichier produit tout en apparaissant masquées dans l'aperçu — le pire cas :
l'utilisateur a la preuve visuelle que c'est masqué.

C'était la limite « connue et assumée » documentée dans `anonymize-units.js`.
Elle ne l'est plus : sur un document réel c'est une fuite.

Corrigé : la propagation est extraite dans `propagatedSpans` (`masking.js`),
**une seule implémentation** partagée par `maskText` et `anonymizeUnits`, qui
complète désormais les entités par unité. Rendue **insensible à la casse** au
passage — dans le même rapport, `meteojob` (dans une URL) était masqué alors
que `Meteojob` en début de ligne restait en clair.

---

## P11 — Sur-masquage sur un mémoire réel : reproduit et trié (12/08/2026)

Signalé à l'usage sur un mémoire de 21 pages : « les pronoms passent pour des
personnes », et les auteurs cités en bibliographie sont masqués.

**Reproduit — et la première moitié du signalement ne tient pas.** Sur 77 valeurs
masquées, un SEUL pronom : `I've`, en PERSONNE, ×4. Le modèle voit un pronom en
tête de phrase, donc en majuscule. Ce qui ressemblait à des pronoms partout
venait du texte COMPRESSÉ, où les fragments en donnent l'illusion.

### Le vrai sur-masquage, par ordre de poids

| Valeur | × | Nature |
|---|---|---|
| `ChatGPT` | 41 | le SUJET du mémoire |
| `MT` | 25 | sigle (machine translation) |
| `Universities` | 8 | nom commun, masqué en LIEU |
| `Moorkens`, `Rivas Ginel`, `Lankford`, `Andy Way`… | ~25 | auteurs CITÉS |
| `Facebook`, `ProZ.com`, `Study.com`, `Bing` | ~15 | entités publiques |
| `LLCER`, `LEA`, `UE` | ~13 | sigles de filières |
| `Vanmassenhove et al., 2019).” (Moorkens` | 3 | span ayant avalé la ponctuation |

### ✅ Corrigé — les pronoms, classe FERMÉE

`estPronom` dans `gliner.js`, appliqué avant le filtre de majuscule. Admissible
au sens de la règle du projet (même statut que `honorifics.js` et les opérateurs
logiques) : une langue compte une poignée de pronoms et n'en invente pas. Les
contractions sont couvertes en comparant ce qui PRÉCÈDE l'apostrophe, ce qui
laisse `O'Brien` intact.

Mesuré : `I've` disparaît (77 → 76 valeurs), banc **strictement inchangé**
(100/83/98, borne basse 88 %).

### ✅ Atténué — les plateformes publiques, dans un PROFIL

`ChatGPT`, `Facebook`, `Bing`, `Google`, `Meta`… rejoignent la liste « ne jamais
masquer » du profil livré, et un second profil **« Rédaction / Recherche »**
apparaît : un document qui PARLE d'IA n'est pas forcément un document technique,
et l'utilisateur n'a pas à hériter de la liste des frameworks pour autant.

Dans un profil, jamais dans le moteur : la classe est OUVERTE (il s'en crée tous
les mois), et une liste cachée serait exactement ce que la règle interdit.

### ❌ NON corrigé, et probablement pas corrigible ici

**Les auteurs cités.** Ce sont de vraies personnes, et leur nom EST une donnée
personnelle au sens strict. Les masquer n'est pas un bug — c'est le bon
comportement pour un contrat ou un dossier RH, et le mauvais pour une revue de
littérature. Aucune règle de forme ne distingue « auteur publié » de « mon
client » : c'est du CONTEXTE, et le contexte appartient à l'utilisateur. Le
champ « ne jamais masquer » est fait pour ça, et depuis `1ebe7dc` il suffit de
taper `Moorkens` pour épargner `Dr Joss Moorkens`.

**`Universities`, `Contents`** — noms communs capitalisés. Classe ouverte, même
raisonnement.

**`MT`, `LEA`, `LLCER`** — sigles. Classe ouverte et propre à chaque domaine.

**Le span à ponctuation de citation.** Le rejeter ferait FUIR les noms qu'il
contient (`Vanmassenhove` n'apparaît nulle part ailleurs) ; le découper demande
de décider où, et le mauvais découpage fuit aussi. Laissé en l'état, à traiter
avec une mesure dédiée si le cas se répète.

---

## ~~P10 — FUITE : un nom TOUT-MAJUSCULE accentué passe sous le seuil~~ ✅ CORRIGÉ (08/08/2026)

Trouvé par le banc dès que le document piégé y a été branché — donc jamais vu
auparavant, faute d'instrument.

**`ÉLÉONORE VASSEUR`, le titre du document piégé, ressort EN CLAIR.** C'est le
cas phare de la page 1, et une fuite prime sur tout le reste du backlog.

### Ce n'est pas le découpeur, et ce n'est pas « les accents »

Scores bruts, groupe identité (`person`/`company`/`location`), seuil **0,46**,
découpeur unicode déjà corrigé :

| Texte | Score | Verdict |
|---|---|---|
| **`ÉLÉONORE VASSEUR`** | **0,418** | **rien → fuite** |
| `ELEONORE VASSEUR` (mêmes lettres, sans accents) | 0,618 | détecté |
| `Éléonore Vasseur` (mêmes accents, casse normale) | 0,477 | détecté |
| `KAROLINE ANSELME` (témoin de `cv-fr.pdf`) | 0,683 | détecté |
| `MÉLANIE THÉVENOT` (accentué, capitales) | 0,507 | détecté |
| `MARTIN DUBOIS` | 0,855 | détecté |

Deux lectures s'imposent, et la seconde est la bonne :

- **Faux** : « les capitales accentuées ne marchent pas » — `MÉLANIE THÉVENOT`
  sort à 0,507.
- **Juste** : **l'accentuation coûte ~0,20 de score** (0,618 → 0,418 sur le MÊME
  nom), et ce cas-là atterrit juste en dessous de la barre. Le seuil 0,46 est
  donc à quelques centièmes d'une fuite pour toute une famille de noms.

Le checkpoint est un `deberta-v3-small` **anglophone** (choisi à la mesure, il
bat le multilingue — voir Gotchas). Le coût des accents est cohérent avec ça.

### Pourquoi la gravité est plus haute que le chiffre

La forme touchée — **titre de CV en capitales accentuées** — est exactement
celle du marché visé (l'indépendant francophone, cadrage §9). Ce n'est pas un
cas exotique, c'est le cas modal.

### ✅ CORRIGÉ le 08/08/2026 — seconde passe sur copie désaccentuée

Idée de l'utilisateur : faire repasser le terme sous plusieurs formes plutôt que
d'espérer qu'une seule suffise. C'est le motif que `ner.js` applique déjà sur
l'axe CASSE (passe naturelle + passe boostée, fusion par span le plus long),
étendu à l'axe ACCENTS.

`desaccentuer()` produit une copie **à longueur strictement égale** (on ne
remplace un caractère que si sa forme nue fait la même longueur : `é`→`e` oui,
`ß`→`ss` non). Les deux passes partagent donc un seul repère d'offsets, et la
valeur se relit toujours sur l'original — pas de recalage, contrairement à la
passe de casse. C'est ce qui rend cet axe plus sûr que les autres.

**Mesuré dans les deux sens** (diff de mapping avant/après, document piégé) :

| | |
|---|---|
| **Fuites fermées** | `ÉLÉONORE VASSEUR` **et** `Éléonore` employée seule — la « fuite connue restante » du README |
| **Faux positifs ajoutés** | `Exécution des tâches`, `d'OCR`, `Geburtsdatum`, `Fondateur` |
| **Détections perdues** | aucune |
| **Banc, 7 documents réalistes** | **strictement inchangé** (100 / 83 / 98) |
| **Borne basse** | contextuel 91 → **95 %**, préservé **82 % inchangé** |

Deux d'entre eux (`Geburtsdatum`, `Fondateur`) n'ont AUCUN accent : désaccentuer
le chunk change le contexte d'encodage, donc les scores de TOUS ses spans, pas
seulement des mots accentués. À savoir avant d'attribuer un écart au seul mot
visé.

### Coût mesuré — bien moindre que prévu, et aucun garde n'est nécessaire

**Prédiction initialement écrite ici : « la passe double les inférences de tout
chunk accentué ». FAUX, corrigé par la mesure.** C'était un raisonnement, pas un
chiffre. Node/CPU, une passe par configuration (le ratio transfère au
navigateur, pas les valeurs absolues) :

| Document | Textes soumis | Temps | Surcoût |
|---|---|---|---|
| `piege.pdf` (6 p., FR/EN/ES/DE) | 161 → 217 | 7,9 → 11,7 s | **+48 %** |
| `cv-fr.pdf` (français) | 24 → 26 | 1,15 → 1,36 s | **+19 %** |
| `rapport-interligne.pdf` (français) | 11 → 11 | 0,71 → 0,68 s | **0 %** |
| `memoire-en.pdf` (21 p., anglais) | 238 → 257 | 27,1 → 30,3 s | **+12 %** |

Trois raisons à l'écart avec la prédiction : la seconde passe ne part que si le
chunk porte VRAIMENT un accent (`rapport-interligne.pdf` n'en a aucun, coût
nul) ; la garde `pertinent` continue de sauter des groupes entiers ; et le
regroupement en lots absorbe une partie du surcoût (les runs croissent moins
vite que les textes).

Le pire cas, +48 %, est le document **adversarial multilingue** — pas un
document réel. Sur un vrai document français : **+19 %**, soit environ
1 min 02 → 1 min 14 sur le mémoire de 75 pages, à re-vérifier en navigateur.

**Conclusion : le garde « chunks courts seulement » n'est PAS construit.** Il
aurait coûté `Éléonore`, rattrapée dans une unité longue, pour économiser un
surcoût qui n'existe pas au niveau annoncé. Mesurer avant d'optimiser a évité
une régression gratuite.

### Pistes écartées pour l'instant

- **Baisser le seuil identité.** Moins cher, plus risqué : 0,46 a été choisi
  contre un plancher de bruit mesuré. Devenu inutile ici.
- **Ne rien faire et compter sur `identity.js`** : ne couvre que l'utilisateur,
  pas les TIERS cités dans le document.

### Ce que ça dit du README du document piégé

`tests/manuel/README.md` annonçait ce nom « masqué en entier ». L'attente datait
d'une configuration antérieure (variante de poids et jeu de labels différents)
et n'avait jamais été revérifiée depuis le passage au fp16. **Une attente écrite
en prose ne se périme pas toute seule** — c'est précisément pourquoi elle est
désormais encodée dans `tests/bench/verite-terrain.mjs`.

---

## ~~P9 — Les intitulés de section~~ ✅ CAUSE 1 CORRIGÉE (08/08/2026)

**Borne basse : préservé 82 % → 88 % (42/51 → 45/51), contextuel 95 % inchangé,
structuré 100 %. Les 7 documents réalistes du banc : strictement inchangés.**

`ANNEXE`, `ANEXO 5`, `ANLAGE 6` sont épargnés sans qu'aucun nom ne fuie.

### Ce qui rend la règle sûre : positionnelle, jamais lexicale

Le correctif évident — « épargner les unités-titres » — est **inapplicable**, et
le document piégé porte son contre-exemple : `ÉLÉONORE VASSEUR`, titre de CV en
21 pt, est **formellement indiscernable** de `COMPÉTENCES` (capitales, deux
mots, ni ponctuation ni chiffre). Le garde `!titre` du relevé n'était donc PAS
un oubli : il est porteur. C'est maintenant encodé dans la vérité terrain, donc
une variante qui le franchirait le paierait immédiatement en contextuel.

`formesDeRubrique` discrimine autrement : **UN SEUL** mot en capitales,
éventuellement suivi d'un numéro de rubrique, puis un tiret, puis du contenu.

| Ligne | Relevé |
|---|---|
| `ANNEXE — DOSSIER ADMINISTRATIF` | `ANNEXE` |
| `ANEXO 5 — EXPEDIENTE EN ESPAÑOL` | `ANEXO`, `ANEXO 5` |
| `ÉLÉONORE VASSEUR` | rien (pas de tiret) |
| `ÉLÉONORE VASSEUR — DÉVELOPPEUSE DATA` | rien (**deux** mots avant le tiret) |

Aucune liste de mots de rubrique n'entre dans le moteur : la classe est ouverte
et multilingue, et la règle du projet l'interdit (voir Gotchas, `honorifics.js`).

**Les deux formes comptent.** Ne relever que le mot nu laissait `ANEXO 5` et
`ANLAGE 6` masqués : le modèle les rend d'un seul tenant, numéro compris.
Mesuré — c'est ce qui séparait 84 % de 88 %.

**Risque résiduel, assumé** : un titre du type `DUPONT — RAPPORT ANNUEL`, où le
mot unique est un patronyme, serait épargné s'il est détecté seul et en tête.
Rare, et à revoir s'il se présente.

### Deuxième divergence des deux chemins PDF (leçon P1bis, encore)

Le premier correctif n'a **rien changé au banc** : `pdf-reconstruct.js` avait sa
PROPRE boucle de relevé, copiée « à l'identique » de `pdf-adapter.js` — et les
deux ont divergé dès la première évolution de la règle. Le mode « Préserver »
continuait de masquer `ANNEXE` pendant que le mode « Alléger » l'épargnait.

Le relevé vit désormais dans **une seule fonction** (`releverIntitules`),
appelée des deux côtés. Dupliquer « parce que c'est identique » a maintenant
coûté deux fois dans ce projet.

### Ce qui reste, et pourquoi ce n'est pas la même chose

Les 6 termes encore sur-masqués sur la borne basse sont tous documentés :

| Terme | Cause |
|---|---|
| `ÉTAT CIVIL` | cause 2 — l'entité déborde (`ÉTAT CIVIL Née`), arbitrage délibéré |
| `SPRACHEN` | cause 3 — faux positif **BIC** du regex, hors de portée d'un filtre contextuel |
| `Unternehmen`, `Abteilung` | noms communs allemands (P2bis/P2ter) |
| `PostgreSQL`, `Kubernetes` | technos — comportement attendu **sans** le profil « Développeur / Tech » |

---

## P9 (diagnostic initial) — TROIS causes, pas une (mesuré 08/08/2026)

Relevé sur la sortie réelle en Chrome (`tous-defauts.pdf`, mode Préserver). Le
mécanisme d'intitulés relève bien **29 titres** avant regroupement, et pourtant
`ANNEXE`, `ANEXO 5`, `ANLAGE 6`, `ÉTAT CIVIL Née`, `SPRACHEN` ressortent masqués.
Ce ne sont pas cinq fois le même défaut.

### Cause 1 — un VRAI titre n'est jamais relevé (le plus gros)

```js
const titre = l.size >= dominantSize * HEADING_SIZE_RATIO;
if (!titre && ressembleAUnIntitule(l.text)) intitules.add(l.text.trim());
```

Le garde `!titre` **exclut du relevé les lignes qui sont typographiquement des
titres**. L'hypothèse implicite était « un vrai titre est traité ailleurs ». Il
ne l'est pas : `marquerIntitules` écarte lui aussi les unités `isHeading`
(`!u.isHeading`), et `isHeading` n'est même pas exposé en aval par
`extractTextUnits`. **Une ligne passe donc entre les trois filets précisément
parce qu'elle est un titre** — l'inverse de l'intention.

Vérifié : `ANNEXE`, `ANNEXE 2`, `ANEXO 5`, `ANLAGE 6` → tous « relevé : NON »,
tous en tête de leur unité.

⚠️ **Retirer `!titre` ne suffit PAS**, et c'est le piège. `ressembleAUnIntitule`
plafonne à 3 mots : `ANNEXE — DOSSIER ADMINISTRATIF` en compte 4 (le tiret
cadratin compte). Et même relevée, la chaîne entière ne serait pas égale à
l'entité `ANNEXE` seule, que le filtre exige **exactement**.

### Cause 2 — l'entité déborde de l'intitulé

`ÉTAT CIVIL` **est** relevé et **est** en tête de son unité. Mais le modèle rend
`ÉTAT CIVIL Née` : le filtre `intitules.has(e.value)` ne matche pas. C'est le
comportement **délibéré** du mécanisme (« on n'emporte pas les mots voisins »),
documenté dans `anonymize-units.js`. Arbitrage assumé, pas un bug.

### Cause 3 — `SPRACHEN` n'est pas contextuel

C'est un faux positif **BIC**, produit par le regex. Or le filtre d'intitulés
s'applique à `nerEntities` **avant la fusion** — les entités déterministes n'y
passent jamais. Déjà consigné et délibérément non corrigé : exiger un libellé
pour le BIC ferait fuir un BIC nu dans un bloc de coordonnées bancaires.

### Ce qu'il faut décider avant de coder

La correction de la cause 1 touche à la **priorité zéro-fuite**. Exempter une
unité-titre en bloc ferait fuir « RAPPORT DE Jean Dupont ». Relâcher le
« exactement » vers un préfixe ferait fuir « Jean Dupont — RAPPORT ». Le
mécanisme actuel est strict *parce que* le laxisme s'y paie en fuite.

**Ne pas partir sur un correctif sans avoir chiffré** ce que chaque variante
démasque ET ce qu'elle laisse fuir, sur le document piégé dont la vérité terrain
est écrite dans les deux sens. C'est exactement la méthode qui a fait rejeter la
minusculisation au spike POS (+7 démasquages, 3 fuites → rejeté).

---

## P2bis — Sur-masquage sur les pages à faible contexte (constaté, non corrigé)

Même rapport, page de sommaire :
`[PERSONNE_10] INTRODUCTION… 1) L'[SANTE_1]… 1.3 [LIEU_2] F… 3.2 La Vérité [LIEU_4]`

« Terrain » pris pour un LIEU, un titre de section pour une donnée de SANTÉ.
Ailleurs dans le même document, « la vérité terrain » en contexte rédigé est
correctement laissée intacte. Confirme P1bis en l'élargissant : le phénomène
touche TOUS les groupes de labels, et les sommaires/légendes d'annexes sont
les pires cas (fragments courts, aucune phrase).

Ne pas traiter par les seuils (cf. P1bis). La piste utile est en amont :
ne pas soumettre au modèle les unités qui n'ont pas de structure de phrase
(ligne de sommaire avec points de suite, légende numérotée), ou les traiter
avec un jeu de labels réduit.

### Mesuré précisément le 04/08/2026 — et pourquoi le correctif n'est PAS parti

Le sur-masquage `BUT Informatique` du banc est un cas de P2bis. Deux mesures
qui cadrent le chantier :

1. **Le bruit vient de la TAILLE DE L'UNITÉ, pas du jeu de labels.** Sur le
   texte du CV soumis d'un seul tenant, le 3e groupe
   (POSTE/NATIONALITE/ETABLISSEMENT/SANTE) ne sort **rien**. Soumis
   paragraphe par paragraphe — ce que fait le chemin PDF — il sort 6
   détections, **toutes fausses** : `COMPETENCES` (poste 0,51),
   `PROFESSIONNELLES` (0,68), `LANGUES` (nationalité 0,79), `Francais`
   (0,82), `Informatique` (0,85), `IUT` (0,59).
2. **Le seuil de coupure sauterait aux yeux… sur UN seul document.**
   Détections du groupe 3 par taille d'unité : 1 mot → 2, 2 mots → 1,
   7 mots → 1, 8 mots → 2, **9 mots et plus → 0**.

La tentation est de filtrer sous ~9 mots. Refusé pour l'instant, et c'est le
point à retenir : **aucun document du corpus n'éprouve ce groupe
POSITIVEMENT** (pas de dossier médical, pas de document où le poste est la
donnée sensible). Un filtre calé uniquement sur des faux positifs ne peut pas
dire ce qu'il détruit — on remplacerait un sur-masquage visible par une fuite
invisible sur les données de l'article 9 du RGPD, ce qui est le mauvais sens
de l'échange.

**Préalable au chantier** : ajouter au corpus un document où POSTE / SANTE /
ETABLISSEMENT sont de vraies valeurs à masquer. Le filtre se mesurera alors
des deux côtés.

À noter aussi, visible dans la même mesure : le bruit des unités courtes
touche AUSSI le groupe identité (`internes` en lieu à 0,94, `FORMATION` 0,50,
`Photographie argentique` en personne 0,54). Celui-là ne peut pas être filtré
par la taille — c'est justement sur les unités courtes que se trouvent le nom
en tête de CV (2 mots) et les cellules de tableau.

---

## Vérification en VRAI CHROME — 04/08/2026

Les correctifs du jour rejoués dans une extension chargée, sur le mémoire réel
et sur `tests/manuel/tous-defauts.pdf`.

**La qualité tient exactement ce que la mesure Node annonçait** : mémoire à
**21,1 %** de document masqué (Node prédisait 22,0 %), 5 204 placeholders
(5 367), 422 tronqués (428). Le correctif de calibrage est confirmé en réel.

**Mon modèle de TEMPS était faux, lui.** Prédiction : 4,4 min. Réel : **9 min**
(contre 11 avant). J'avais posé « temps ∝ nombre d'inférences » ; le vrai
modèle est `coût = surcoût_fixe + k × longueur`. Le document contient le même
nombre de caractères qu'avant : regrouper les lignes n'économise que le
surcoût fixe. Vérification par le calcul : 3 222 inférences en moins ont fait
gagner 2 minutes, soit ≈ **37 ms de coût fixe** par inférence, le reste étant
proportionnel à la longueur.

→ **Conséquence pour toute optimisation future** : réduire le NOMBRE
d'inférences ne rapportera plus grand-chose. Les leviers réels sont de réduire
les CARACTÈRES traités (décocher un groupe de labels ≈ ×3, puisque chaque
groupe relit tout le texte) ou de rendre chaque inférence moins chère (WebGPU,
modèle plus petit).

Deux autres constats du passage en Chrome :

- **Petite régression causée par le correctif de calibrage** : sur le CV piégé,
  « BUT Informatique » et « IUT de Villetaneuse » sont désormais dans le même
  paragraphe, et le modèle prend « Informatique IUT » pour une seule entité —
  `IUT` ne survit plus. Prix assumé du regroupement sur ce cas précis.
- **Écart Node/navigateur sur le comptage d'unités** : 686 en Node contre 782
  affichées en Chrome. Node n'a pas les métriques de police standard
  (avertissements `standardFontDataUrl`), ce qui décale le groupement de
  lignes. Les mesures Node sont fiables en ordre de grandeur, pas au chiffre
  près.

---

## P6 — Un document QUI PARLE de données personnelles (partiellement corrigé 04/08/2026)

### ✅ Correctif retenu : PERSONNE/ENTREPRISE/LIEU exigent une majuscule

Ces trois types sont par définition des **noms propres** ; en français comme en
anglais ils portent une majuscule. Les autres types produits par le modèle sont
des noms **communs** par nature (« développeur », « diabète », « française ») et
ne peuvent pas être filtrés ainsi. `estNomPropreplausible` (`gliner.js`) écarte
donc les spans PER/ORG/LOC sans la moindre majuscule.

Mesuré au banc — **premier correctif P6 qui passe** :

| | Avant | Après |
|---|---|---|
| Rappel structuré | 100 % | **100 %** |
| Rappel contextuel | 86 % | **86 % — inchangé** |
| Termes préservés | 90 % | **95 %** |

Aucune vraie entité perdue. Sur `rapport-interligne.pdf`, `protagoniste` et
`compagnons` sont récupérés (préservé 63 % → 88 %). Sur le document piégé,
`address` et `candidate` cessent d'être masqués dans la clause type anglaise.

**Limite assumée, écrite dans le code** : un nom tapé tout en minuscules
(« jean dupont ») n'est plus vu par cette couche. Recul sur la priorité
zéro-fuite, accepté parce que la couche déterministe n'est pas concernée, que
le profil d'identité masque le nom de l'utilisateur quoi qu'il arrive, que
« toujours masquer » reste disponible, et qu'un document illisible est l'autre
façon de perdre l'utilisateur. À réévaluer si un cas réel apparaît.

### Ce qui reste

Le bruit restant est majoritairement typé **POSTE** (`dossier`, `stratégie`,
`vendor`, `representative`) ou porte une majuscule (titres de section :
`COMPÉTENCES` → SANTE, `FORMATION` → LIEU, `LANGUES` → NATIONALITE). Le filtre
de casse ne peut rien pour eux — c'est P2bis, et la question « POSTE mérite-t-il
d'être actif par défaut ? » reste ouverte (zéro vrai positif sur tout le corpus,
mais aucun document ne l'éprouve positivement).

---

## P6 (diagnostic initial) — mesure sur le formulaire de consentement

Constaté sur un **vrai formulaire de consentement** de 18 pages (Checkr,
anglais + français), soumis en mode « Préserver ». Ce document ne contient
quasiment **aucune donnée personnelle** : c'est un formulaire vierge. Les
seuls identifiants réels y sont l'adresse publique du siège, une adresse mail
de DPO et le nom de la société prestataire.

Sortie : **797 placeholders**.

| Type | Nombre |
|---|---|
| PERSONNE | 313 |
| ENTREPRISE | 143 |
| LIEU | 141 |
| POSTE | 92 |
| SANTE | 77 |
| NATIONALITE | 16 |

Le texte produit est intégralement inexploitable :
`This [SANTE_4] form asks for [PERSONNE_2] [SANTE_4] to [ENTREPRISE_1]
collecting … certain [PERSONNE_8] about [PERSONNE_1]`.

### La cause : « person » ≠ « nom de personne »

Ce ne sont pas des scores mal réglés, c'est une **erreur de catégorie**. En
zero-shot, le label est du langage naturel : « person » désigne toute
expression qui RÉFÈRE à une personne. Le modèle a donc raison, au sens
linguistique, de sortir :

- des **pronoms** : `you`, `your`, `me`, `I`, `we`, `here` ;
- des **noms de rôle** : `vendor`, `representative`, `the candidate`, `company` ;
- des **noms communs** du champ lexical : `name`, `personal information`,
  `address`, `consent` (en SANTE), `page`, `sources`, `governmental`.

Pour une anonymisation, c'est catastrophique : masquer « you » détruit le
texte et ne protège personne. Il faut des entités **nommées**, pas des
expressions référentielles.

Et le document est le pire cas concevable : **son sujet EST la donnée
personnelle**, donc son vocabulaire ressemble mot pour mot aux catégories
cherchées. Ce n'est pas un cas tordu — politiques de confidentialité, CGU,
formulaires RGPD sont massivement collés dans des LLM.

### Correction ÉVIDENTE, TESTÉE, et REJETÉE par la mesure

Reformuler les labels en `person name` / `company name` / `city or country
name`. Sur un extrait du formulaire et une phrase témoin écrite à la main, le
résultat semblait parfait : `you` disparaissait, les 6 vrais noms du témoin
restaient avec de meilleurs scores.

**Le banc complet a démenti** : rappel contextuel **84 % → 72 %**, et 8 tests
unitaires en échec. Pertes réelles : `Nantes`, `Eleanor Vance`,
`1841 Fountain Road`. Reverté.

Leçon à ne pas re-payer : **une phrase témoin écrite à la main ne valide
rien** — elle contient exactement ce qu'on y a mis. Deux sondages ad hoc ont
menti dans cette session (un extrait de 400 caractères, puis des textes
tronqués à 950). Seul le banc complet tranche.

### Piste qui reste ouverte, sans ML

Le taux de masquage est un signal **déterministe et déjà calculé** par le banc
(« masques / mots »). Ici : ~797 masques pour ~4 500 mots. Un avertissement
au-delà d'un seuil manifestement absurde — « un mot sur six a été masqué, le
résultat est probablement inexploitable » — coûte presque rien et joue dans le
sens de l'anti-fausse-confiance (cadrage §5), qui n'est aujourd'hui formulé
que dans le sens « on a pu rater quelque chose ».

---

## ~~P7 — Placeholders TRONQUÉS dans le PDF reconstruit~~ ✅ CORRIGÉ (05/08/2026)

**Ce n'était pas une troncature, et ce n'était pas un bug distinct de « les lignes
qui dépassent » : c'est le MÊME défaut.**

Un placeholder est presque toujours plus long que la valeur qu'il remplace
(« Nantes » → « [LIEU_3] »), et la reconstruction redessine chaque fragment à
SA position d'origine. Un fragment en fin de ligne finit donc **hors page** —
visuellement il déborde, et à la relecture `pdfjs.getTextContent()` **ne
retourne pas les glyphes situés hors du cadre**. Les 422 « placeholders
tronqués » n'étaient donc pas coupés dans le fichier : ils étaient hors champ.

Isolé par reproduction minimale (pdf-lib + pdfjs seuls, sans le moteur) :
un texte de 393 pt dessiné à x=40 ressort **tronqué** sur une page de 420 pt et
**intact** sur une page de 600 pt. C'est la borne de page qui coupe, rien d'autre.

**Correctif** : `tailleQuiTient` réduit la taille du fragment pour qu'il rentre
dans la page, avec un plancher à 45 % (en dessous on préfère laisser déborder
plutôt qu'écrire en corps illisible). Le texte redevient à la fois visible ET
extractible — c'est la réversibilité qui était en jeu, l'enjeu réel pour un
document destiné à être recollé dans un LLM.

**Mesuré sur le mémoire réel de 75 pages** : fragments tronqués **422 → 0**, et
**0 placeholder introuvable sur les 332** de la table de correspondance. Trois
tests de non-régression, dont un bout en bout.

---

## P7 (diagnostic initial, conservé pour l'historique)

Sur le même document : **39 fragments sur 1042** se terminent par un
placeholder coupé — `[NATIONALIT`, `[ENTRE`, `[PERSONN`, `[PE`…

Vérifié que ce n'est **pas** l'artefact de relecture déjà connu (fragments
dessinés séparément) : recoller les fragments sans espace donne exactement les
mêmes chiffres, et aucun fragment ne commence par la suite manquante
(`PRISE_`, `SONNE_`…). Les caractères ne sont nulle part dans le fichier.

Ce n'est **pas une fuite** — la valeur d'origine a bien disparu. C'est une
perte de **réversibilité** : la désanonymisation ne peut pas retrouver
`[PERSONN`, et l'utilisateur lit un jeton corrompu.

La coupure tombe systématiquement en fin de ligne, mais la longueur des
fragments touchés varie (39 à 88 caractères) : pas de plafond fixe. Lecture du
code faite sans trouver la cause — `drawText` reçoit le texte entier,
`distributeEntitiesOverRuns` émet le placeholder d'un bloc dans le run où
l'entité commence, et `sanitizeForWinAnsi` ne raccourcit pas. **À reprendre
avec une reproduction minimale**, pas à l'œil.

Correctif à ne PAS retenir quand il sera traité : tronquer plus proprement.
Un placeholder incomplet doit soit tenir (police réduite), soit déborder —
jamais être coupé, puisque la coupure casse la réversibilité en silence.

---

## ~~P8 — La taille d'unité~~ ✅ CAUSE TROUVÉE ET CORRIGÉE (04/08/2026)

**Ce n'était pas un hyperparamètre à régler, c'était un bug de calibrage.**

`PARAGRAPH_GAP_RATIO` comparait l'écart entre deux lignes à la **taille de
police**, alors que l'interligne est une propriété de la mise en page. Sur le
mémoire : police 11, écart réel **19,0**, seuil `11 × 1.6 = 17,7` → **chaque
ligne devenait un paragraphe**. Tout document en interligne 1,5 ou double était
touché — mémoires, rapports, articles. Le corpus du banc, en interligne simple,
ne pouvait structurellement pas le voir.

Corrigé par `paragraphGapThreshold` (`pdf-adapter.js`, partagé avec
`pdf-reconstruct.js`) : le seuil se calibre sur **l'écart médian entre lignes de
la colonne courante**, avec deux gardes mesurées — `Math.max` avec l'ancien
seuil (il ne peut que croître, donc le correctif ne peut que fusionner, jamais
fragmenter davantage) et un minimum de 8 écarts (sous ce seuil la médiane tombe
sur l'écart de *paragraphe*, ce qui cassait deux tests sur `echantillon.pdf`).

### Mesuré sur le mémoire réel, avant / après

| | Avant | Après |
|---|---|---|
| Unités soumises | 1 782 | **686** |
| Taille médiane | 91 c. | **153 c.** |
| Phrases coupées en deux unités | 52 % | **17 %** |
| Inférences | 5 346 | **2 124** |
| Placeholders | 8 088 | **5 367** |
| **Document masqué** | **39,1 %** | **22,0 %** |
| Placeholders tronqués (P7) | 758 / 4081 | 428 / 4112 |

Temps estimé en navigateur : **11 min → ~4,4 min**. Le banc est inchangé sur
les documents existants (structuré 100 %, contextuel 84 %, préservé 97 %) — la
propriété « le seuil ne peut que croître » se vérifie donc dans les chiffres.

### Le corpus a gagné le document qui manquait

`tests/bench/corpus/rapport-interligne.pdf` : prose en interligne 1,5, le
réglage de tout mémoire académique. Son absence est **la** raison pour laquelle
ce bug a vécu si longtemps. Nouveaux totaux du banc, sur 6 documents :
structuré **100 %** (19/19), contextuel **86 %** (25/29), préservé **90 %**
(36/40).

La baisse du « préservé » (97 % → 90 %) **n'est pas une régression** : le
nouveau document apporte 8 termes à préserver dont 3 échouent (`leadership`,
`protagoniste`, `compagnons`). Le banc devient plus honnête sur un cas qu'il ne
couvrait pas.

### Ce qui reste, et c'est P6

Ces trois ratés sont exactement la classe P6 : des **expressions référant à une
personne**, que le label `person` capte légitimement. À 22 % de masquage, un
mémoire reste inexploitable — le correctif de calibrage était nécessaire, il
n'est pas suffisant. La suite se joue sur P6, pas sur le découpage.

---

## P8 (diagnostic initial) — la piste « taille d'unité », mesurée le 04/08/2026

Le constat le plus important de la session. Mesuré sur un **vrai mémoire de
75 pages** (175 652 caractères), traité en mode « Préserver » : **11 minutes**
et **8 088 placeholders pour 20 668 mots — 39 % du document masqué**.

La sortie est du charabia : les **articles et mots outils** sont masqués.

> `[PERSONNE_75] [POSTE_9] [PERSONNE_225] [NATIONALITE_30] [LIEU_4…`
> `[PERSONNE_97] ([DATE_NAISSANCE_25]), introduit [PERSONNE_75] concept…`

où `[PERSONNE_75]` = « le », `[PERSONNE_70]` = « son », `[PERSONNE_35]` = « où ».

### Ce n'est ni le modèle, ni le découpeur de mots

Vérifié : la même page passée **d'un seul tenant** dans Node ne sort que
2 entités. Le correctif du découpeur français n'est pas en cause non plus (le
motif d'origine de la lib donne 1 entité, le corrigé 2 — même ordre de
grandeur). Le coupable est la **taille des unités soumises** : le chemin PDF
envoie un paragraphe à la fois, **médiane 91 caractères**.

Un fragment de 91 caractères d'une prose académique n'est pas une unité
sémantique : c'est une coupe arbitraire au milieu d'une phrase. Le modèle n'a
plus de quoi décider, et il étiquette.

### La mesure, sur 2 987 caractères réels de ce mémoire

Deux vraies entités s'y trouvent (`Square Enix`, `Consalvo`).

| Taille visée | Unités | Inférences | Masques | Vraies entités |
|---|---|---|---|---|
| **90 (actuel)** | 34 | 102 | **77** | les 2 |
| 250 | 15 | 45 | 48 | les 2 |
| 500 | 7 | 21 | 21 | les 2 |
| **1 000** | 4 | **12** | **12** | **les 2** |
| 2 000 | 2 | 6 | 3 | `Consalvo` PERDUE |
| 4 000 | 1 | 3 | 0 | les 2 PERDUES |

**À 1 000 caractères : 6× moins de bruit, 8× moins d'inférences, aucune perte.**
Au-delà de 2 000, des entités réelles disparaissent — l'optimum est borné des
deux côtés, ce n'est pas « plus grand = mieux ».

Et 1 000, c'est déjà la taille de fenêtre de `chunkText` : la constante existe.

### Pourquoi ça règle AUSSI les 11 minutes

Le coût est **par inférence**, pas par caractère : 1 782 unités × 3 groupes =
**5 346 inférences**, soit 123 ms chacune en WASM navigateur (21 ms en Node
natif — l'écart WASM/natif du cadrage §8). Diviser les inférences par 8 divise
le temps d'autant. **Un seul changement pour les deux symptômes.**

### La nuance à ne PAS écraser

Le projet a mesuré l'inverse pour les **cellules** de tableau : l'isolement y
est un ATOUT (CLAUDE.md, « donner du contexte à une cellule DÉGRADE la
détection »). Il n'y a pas contradiction : une cellule CSV est une unité
sémantiquement complète, un fragment de paragraphe est une coupe arbitraire.
Le regroupement doit donc viser les chemins de **prose** (PDF, DOCX), jamais
les chemins **cellulaires** (CSV, XLSX).

### Deux pistes de performance TESTÉES ET ÉCARTÉES

- **Le traitement par lot est plus LENT**, pas plus rapide : `inference({ texts:
  [...] })` complète toutes les entrées à la longueur de la plus longue, donc
  les paragraphes courts paient pour le plus long. Mesuré : 59 ms/unité en lot
  contre 21 ms un par un (×0,4). Il **change** en plus les résultats (0/60
  identiques, scores décalés de 0,58 à 0,41) — le remplissage modifie
  l'attention. À ne pas retenter.
- **Un cache par texte d'unité ne sert à rien** : 0 % de doublons sur ce
  document (1 782 unités, 1 782 distinctes).

### Avant d'implémenter

Le regroupement demande de **remapper les offsets** vers les unités d'origine
pour la reconstruction. Et il doit passer le banc complet : deux corrections
« évidentes » sont mortes à cette étape dans la même session (labels
reformulés, P6). Ne pas livrer sur la seule foi du tableau ci-dessus, qui ne
porte que sur un extrait d'un document.

---

## P2ter — Lacunes de couverture constatées sur documents réels (non corrigé)

- **Adresse mal typée** : `99 Av. [PERSONNE_4], [CODE_POSTAL_1] Villetaneuse` —
  le nom de voie est étiqueté PERSONNE au lieu d'ADRESSE, et le numéro reste
  en clair. Le motif ADRESSE ne couvre pas la forme abrégée « Av. ».
- **Noms de produits/plateformes tiers jamais détectés** : « OSCAR CRM »,
  « Scholaro ». Ni technos génériques (qu'on garde volontairement), ni noms
  d'entreprise reconnaissables — angle mort réel du modèle.

---

## ~~P1bis — La fragmentation PDF empoisonne la détection~~ ✅ CORRIGÉ (03/08/2026)

**Testé sur le vrai fichier qui avait servi à la mesure initiale.** Diagnostic
en trois temps :

1. Extraction brute (`groupIntoLines`, sans regroupement en paragraphes) : le
   split de colonnes (`splitIntoColumns`) fonctionne correctement sur ce CV —
   aucune fusion « CLÉSEXPÉRIENCES » constatée. Une seule anomalie de colonnage
   relevée (l'intro pleine largeur isolée dans une 3e « colonne » à 2 lignes),
   cosmétique, non traitée ici.
2. Le vrai mécanisme, confirmé sur **8 occurrences réelles** dans ce document :
   un mot coupé en FIN DE LIGNE par la justification typographique d'une
   colonne étroite — `auto-` / `matisée`, `Fas-` / `tify`, `ap-` / `plicative`,
   `ba-` / `ckend`, `détermi-` / `niste`, `n-` / `grammes`, `ex-` / `posant`,
   `ali-` / `mentation`. **Ce n'est ni un problème de colonnage ni un problème
   d'écart intra-ligne (`needsSpace`, déjà corrigé en P1)** — c'est une
   troisième cause, jamais isolée jusqu'ici : la coupure survient ENTRE deux
   lignes d'un même paragraphe, jamais traitée par la jointure existante.
3. Signal fiable pour la détecter sans ambiguïté : un trait d'union COLLÉ à la
   dernière lettre d'une ligne (`isLineWrapHyphen`, `pdf-adapter.js`), la ligne
   suivante commençant par une minuscule. Un tiret de séparation réel est
   toujours entouré d'espaces en français (« Anglais - C1 ») — il ne déclenche
   jamais ce motif, donc aucune ambiguïté avec un tiret légitime.

Corrigé dans les DEUX chemins qui construisent des paragraphes à partir de
lignes (`groupIntoParagraphs` pour le Markdown, `paragraphToRuns` pour la
reconstruction PDF) — ils avaient chacun leur propre logique de jointure et
auraient pu diverger sans un point de correction partagé.

**Vérifié sur le fichier réel après correctif** : les 8 mots ressortent
recollés (« applicative », « automatisée », « Fastify », « backend »,
« déterministe », « n-grammes », « exposant », « alimentation »). Le nom du
candidat continue d'être masqué en entier (`[PERSONNE_1]`) — géré séparément
par le seuil abaissé du groupe identité (P0), sans lien avec ce correctif.
Reste du bruit résiduel sur ce document (« Sankey » en personne à 0,77,
« donateurs » à 0,78, « espace public » à 0,83) : classe de défaut différente
(mots ordinaires mal classés en contexte court), pas traitée ici.

**Étendu au banc d'essai** : `cv-fr.pdf` reproduit désormais ce mécanisme
précis (mot coupé sur deux lignes rapprochées), pour qu'une régression future
soit détectée automatiquement par `npm run bench` plutôt que redécouverte sur
un vrai fichier. A aussi révélé un angle mort du banc lui-même : sa relecture
du PDF reconstruit joignait les fragments pdfjs avec un espace systématique,
ce qui aurait signalé à tort le mot recollé comme manquant (la reconstruction
dessine chaque fragment à sa position d'origine — limite de fidélité déjà
documentée — donc un mot recollé pour la détection reste deux objets texte
séparés dans le PDF final). Comparaison du banc rendue insensible aux espaces
pour ne pas confondre un artefact de relecture avec une vraie régression.

---

## P1bis (historique) — mesure initiale, 02/08/2026

Constaté en soumettant un **vrai CV multi-colonnes** au moteur GLiNER. Le
modèle étiquette confiamment des fragments de mots **avec des scores plus
élevés que le vrai nom du candidat** :

| Fragment produit par l'extraction | Étiquette | Score |
|---|---|---|
| `plicative` (de « applicative », coupé) | entreprise | 0,70 |
| `matisée` (de « automatisée ») | donnée de santé | 0,70 |
| `CLÉSEXPÉRIENCES` (2 en-têtes de colonnes collés) | santé | 0,59 |
| `InformatiqueEn cours` | poste | 0,61 |
| `courts-métrages`, `complexes`, `INTÉRÊTS` | lieu / personne | 0,62-0,72 |
| **`LANDRY` (le vrai nom)** | **personne** | **0,47** |

Sur les fixtures PROPRES, le plancher de bruit du groupe identité est à
**0,26** ; sur ce CV il monte à **0,74**. Autrement dit : **le sur-masquage
observé n'est pas un défaut du modèle, c'est du charabia en entrée.** Aucun
réglage de seuil ne peut séparer un vrai nom à 0,47 d'un `plicative` à 0,70.

→ La vraie correction est en AMONT, dans `pdf-adapter.js` : `groupIntoLines` +
`splitIntoColumns` recollent mal les colonnes d'un CV. C'est le même sujet que
le P1 ci-dessous (fragmentation), dont on mesure ici qu'il coûte bien plus cher
qu'estimé — il ne dégrade pas seulement la lisibilité, il **rend la détection
contextuelle non fiable sur les documents les plus sensibles (les CV)**.
Prochain chantier prioritaire.

Piste complémentaire, déterministe et sans ML : sur un PDF, le **bloc de plus
grande police en tête de document** est presque toujours le nom de la personne
(`pdf-adapter.js` connaît déjà la taille de police, il s'en sert pour détecter
les titres). Masquer ce bloc par construction ne dépendrait d'aucun score.

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

## ~~P3 — Images non rendues dans la reconstruction PDF~~ ✅ CORRIGÉ (21/07/2026)

**Cause trouvée** (diagnostic sur un vrai PDF à images de l'utilisateur, confirmé
dans la source du worker pdfjs qui poste `{bitmap, data}`) : selon
l'environnement, pdfjs livre une image sous **deux formes différentes** —
en **navigateur** un `ImageBitmap` déjà décodé (propriété `bitmap`), en **Node**
des données brutes (`data` + `kind`). `extractImages` ne testait que `data` →
en Chrome **toutes** les images étaient silencieusement écartées, alors que les
tests Node passaient. Même famille de piège que le `workerSrc` (cf. gotchas).

Corrigé : les deux formes sont acceptées, `encodeImage` dessine soit
l'`ImageBitmap` (`drawImage`), soit les données brutes (`putImageData`).
Ajouté au passage : timeout de 8 s sur `objs.get` (API à callback qui pouvait
bloquer indéfiniment), **JPEG q0.82** pour les grandes images (un PNG sans perte
sur des photos ferait exploser le poids du PDF), plafond de 1600 px, encodage
**en parallèle** par page.

## P3 (ancien intitulé, conservé pour l'historique)

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

## P3bis — Performance : le NER est le coût dominant (MESURÉ)

Mesures réelles sur le PDF de l'utilisateur (1,6 Mo, 5 pages, 9 images) :
- `getOperatorList` sur tout le document : **198 ms**
- reconstruction complète **sans NER** : **377 ms**
- texte extrait : **4 735 caractères → 6 fenêtres NER → 12 inférences BERT**
  (double passe naturelle + boostée) ≈ **15-20 s**, plus le chargement du
  modèle au premier usage (**178 Mo** — `model_quantized.onnx` de
  `Xenova/bert-base-multilingual-cased-ner-hrl`, vérifié le 02/08/2026 ; le
  « ~30 Mo » écrit ici auparavant était faux).

→ Le parsing/la reconstruction ne sont PAS le problème : **c'est le NER**, sur
le thread principal (pas de worker, contrainte CSP MV3 / `numThreads=1`).

Traité :
- **loader "vaguelettes"** dans le bouton (perception) ;
- **avancement chiffré** « Détection en cours… 3/6 » (`onProgress` de
  `detectNER` → `anonymizeUnits`/`reconstructPdf` → statut), avec un yield
  entre fenêtres pour que le navigateur repeigne — l'utilisateur voit que ça
  progresse au lieu d'interrompre ;
- encodage des images en parallèle + JPEG + plafond 1600 px.

**✅ Web Worker fait (21/07/2026)** — l'affirmation « MV3 interdit les workers »
était fausse (on exécutait déjà `pdf.worker.min.mjs`). Le NER vit dans
`src/worker/ner-worker.js` ; `detectNER` prenait déjà son pipeline en paramètre,
il reçoit maintenant un proxy vers le worker : **moteur inchangé**. Effets :
thread principal libre (fin des gels et des menus au contenu coupé) et
**popup.js 1,3 Mo → 35 Ko** (Transformers.js n'est plus dans la popup).
`numThreads` = 4 si `crossOriginIsolated`, sinon 1 (repli runtime).

Reste éventuellement : réduire le travail lui-même (sauter la passe boostée sur
un texte déjà bien casé — risqué, testé et rejeté une fois ; ou un modèle plus
petit). Le temps total d'inférence est inchangé — c'est l'UI qui ne gèle plus.

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

---

## P5 — Internationalisation de la couche structurée (21/07/2026)

Constaté sur un texte anglais : le regex ne détectait **que l'email**. Le NER,
lui, marchait très bien (Eleanor Vance, TechCorp Solutions LLC, Springfield,
Oregon…) — le modèle est multilingue, **le problème n'a jamais été le modèle**,
seulement notre couche de motifs, écrite pour la France.

**Fait** : téléphones internationaux via `libphonenumber-js`
(`src/engine/phone-intl.js`). Les métadonnées par pays sont maintenues par la
bibliothèque — rien à suivre de notre côté. Choix de conception vérifiés par
test : pas de `defaultCountry` (sinon « 483 921 657 » du piège SIREN devient un
numéro FR) et mode `extended` (masque les numéros plausibles mais invalides).
Coût : ~235 Ko en chunk, chargé à l'ouverture de la popup.

**Reste à internationaliser** (par ordre de valeur) :
- **codes postaux** hors FR (le motif actuel exige 5 chiffres + ville capitalisée
  APRÈS ; « Oregon, 97477, United States » échoue) → `validator.isPostalCode(v, locale)`
  couvre ~35 pays et se branche sur l'architecture « regex trouve → validateur confirme » ;
- **dates en anglais** (« March 14, 1988 », « August 2028 ») : simple ajout de motif ;
- **identifiants nationaux non-FR** (SSN US, NHS UK, tax IDs) → `validator.isTaxID`
  et/ou portage du catalogue de recognizers de **Microsoft Presidio** (référence
  open-source du domaine, mais **Python** : on porte les motifs, pas le code) ;
- **identifiants de compte génériques** (« CUST-849204-X ») : motif contextuel,
  proche de REFERENCE déjà existant.

Note : `@faker-js/faker` (portage JS officiel, MIT, import par locale) rendrait
les pseudonymes cohérents avec la langue du document. À arbitrer contre le poids
et le déterminisme actuel de `pseudonyms.js`.


### Quatre mesures, quatre angles (08/08/2026)

| Commande | Prose | Vérité terrain | Ce que ça dit |
|---|---|---|---|
| `npm test` | — | — | les fonctions pures sont correctes |
| `npm run bench` | synthétique | complète | plancher de qualité, anti-régression |
| `npm run regression` | **réelle** | aucune | la sortie a-t-elle BOUGÉ sur de vrais documents |
| `npm run injection` | **réelle** | parfaite (sur l’injecté) | le RAPPEL sur de la vraie langue |

Les deux derniers sont nés d’un constat : **tous** les défauts réels de la
session du 07-08/08 ont été trouvés sur de vrais documents, **aucun** sur le
corpus synthétique — que j’ai écrit en connaissant le moteur.

Chacun a payé dès son premier passage. Le harnais d’injection a trouvé une
fuite du Steuer-ID allemand (`« Die Steuer-ID lautet 12345678901 »` — un verbe
de liaison au lieu d’un deux-points), et son correctif en a révélé une seconde,
antérieure : le préfixe `[A-Z]{0,2}` avalait le mot de liaison, masquant
« is » avec le numéro.

**Limite à garder en tête** : `injection` mesure le rappel, jamais le
sur-masquage — on ne connaît la vérité que sur ce qu’on a injecté. Le
sur-masquage reste mesuré sur `tests/manuel/tous-defauts.pdf`.

## Spike POS « nom propre / nom commun » — mesuré le 07/08/2026

**Question** : un étiqueteur morphosyntaxique peut-il écarter les faux positifs
que GLiNER produit sur des mots isolés (`SOMMAIRE` → entreprise 0,79,
`Analyste` → personne 0,73), là où aucun seuil ne les sépare ?

**Modèle testé** : `wietsedv/xlm-roberta-base-ft-udpos28-en` — XLM-RoBERTa
affiné sur Universal Dependencies 2.8, c'est-à-dire *exactement* ce qu'on aurait
entraîné soi-même. Le tester revenait donc à tester notre futur modèle.

### La règle doit être ASYMÉTRIQUE, sinon la mesure ment

Premier critère posé — « ≥ 90 % des noms propres doivent sortir PROPN » — était
**mal calibré**, et donnait un NO-GO trompeur. Opérationnellement, on ne
démasque que si le modèle dit **explicitement `NOUN`** ; tout autre verdict
(PROPN, ADJ, X, désaccord) garde le masque.

Sous cette règle, les deux « échecs » du spike deviennent des succès :
`Semantikmatch` → ADJ et `Petit` → ADJ **restent masqués**. Et les deux sont
linguistiquement justes — *petit* EST un adjectif français.
Score réel : **0 fuite sur 15 noms propres, 17 faux positifs sur 18 reconnus**.

### Effet réel sur le document piégé

| Variante de la règle | Démasqués | Fuites | Sur-masquage |
|---|---|---|---|
| première étiquette du texte brut | 12 | 0 | 125 → 113 |
| **+ retrait du déterminant de tête** | **14** | **0** | **125 → 111** |
| ~~+ minusculisation~~ | ~~19~~ | **3** ✗ | rejeté |
| ~~les deux~~ | ~~21~~ | **3** ✗ | rejeté |

Le déterminant de tête comptait : `L'entreprise` et `La vérité terrain`
sortaient `DET` parce que le premier token est l'article.

**Minusculiser est REJETÉ** : +7 démasquages mais 3 vraies données fuient
(`Mountain View, CA 94043-1351`, `Avenida de la Constitución 45`,
`Tejidos Alcázar S.A.`). Un modèle « cased » utilise la majuscule comme signal ;
la retirer brouille la frontière dans les deux sens.

### Pourquoi ce n'est PAS branché

Le gain (14 démasquages) coûterait **~550 Mo** — XLM-R base fait 277 M de
paramètres, presque un triplement du téléchargement (292 → 842 Mo).

Et surtout, **un tiers du gain est récupérable gratuitement** : 5 des 14
démasquages sont des intitulés de section (`ANNEXE`, `ANEXO 5`, `ANLAGE 6`,
`COORDONNÉES`) que la règle structurelle devrait déjà attraper. Elle les rate
parce que le regroupement en paragraphes les recolle au texte suivant — le même
défaut qui lui fait rater `SOMMAIRE`, `INTERLIGNE`, `CELLULES NUES`,
`ÉTAT CIVIL`, `SPRACHEN`, que le modèle ne rattrape pas non plus.

**Ordre retenu** : réparer d'abord le découpage en paragraphes (gratuit, profite
aux cinq langues, vise la famille la plus nombreuse), puis re-mesurer ce que le
modèle apporte EN PLUS. Le chiffre sera alors bien plus petit et la décision
bien plus nette.

### Si on y revient : où vivent les paramètres

Mesuré sur la config du modèle — **69 % du poids est la matrice de
vocabulaire** (250 002 tokens × 768 = 192 M sur 277 M), pour couvrir une
centaine de langues dont l'essentiel est hors Latin-1, que Clarence ne sait de
toute façon pas écrire.

Vocabulaire taillé aux scripts latins (~32 k) et 6 couches au lieu de 12 :
**67 M de paramètres, ~134 Mo en fp16** — moins de la moitié du GLiNER actuel.
Le projet serait donc une COMPRESSION vers une référence déjà mesurée, pas un
entraînement dans l'inconnu. Piste vivante, non engagée.

## P12 — Le formulaire administratif : les valeurs en CAPITALES (15/08/2026)

Signalé à l'usage sur un vrai casier judiciaire, profil d'identité **vidé
exprès** pour éprouver le modèle seul : le prénom de l'utilisateur survivait en
clair, et des valeurs recevaient `[TYPE_N]` au lieu d'un pseudonyme.

**Une seule cause pour les deux symptômes : le nom sortait en `ORG`.**

| détecté | type | conséquence |
|---|---|---|
| `LANDRY KAPGNEP` ×1 | ORG | pseudonyme tiré du vivier des sociétés |
| `KAPGNEP` ×2 | ORG | idem |
| `LANDRY` seul | *rien* | **fuite** |
| `NANTES`, `SARCELLES`, `FOSSES` | *rien* | lieux en clair |

Classé en entreprise, le nom n'hérite pas de la **décomposition par composant**
(réservée aux `PER`, voir `pseudonyms.js`) : le prénom isolé derrière son
libellé « Prénom(s) » n'était donc jamais masqué.

### Le motif : casse mixte → juste, TOUT-MAJUSCULE → faux

Dans le même document, « Sébastien PIEVE » (casse mixte) sortait correctement en
`PER`. Tout ce qui est en capitales sortait en `ORG` ou pas du tout. D'où une
**troisième variante de texte**, sur le modèle de la passe désaccentuée (P10) :

|  | texte naturel | casse adoucie |
|---|---|---|
| `LANDRY KAPGNEP` | company 0,72 | **person 0,99** |
| `FOSSES` | person 0,36 | **location 0,70** |
| `NANTES` | location 0,40 *(sous seuil)* | **location 0,53** |
| `SARCELLES` | location 0,43 | 0,43 — **non réglé** |

⚠️ **Ce n'est PAS la minusculisation**, mesurée et rejetée au spike POS
(+7 démasquages mais 3 fuites) : on garde l'initiale majuscule — le signal dont
un modèle « cased » se sert — et on n'enlève que l'anomalie tout-majuscule.
Longueur préservée, donc offsets partagés et valeur relue sur l'original.

### Le corpus était le vrai coupable

Tout le banc était fait de **CV et de mémoires**, où les noms sont en casse
mixte. Aucun **formulaire** — casier, état civil, attestation — où le libellé
est en casse normale et la **valeur en capitales**. Le défaut ne pouvait pas
être vu. `tests/bench/corpus/formulaire-fr.txt` comble ce trou (données
entièrement inventées ; le document réel n'est jamais entré dans le dépôt).

Mesure sur ce document, la seule qui montre les deux côtés :

|  | sans P12 | avec P12 |
|---|---|---|
| rappel contextuel | 29 % (2/7) | **71 % (5/7)** |
| termes préservés | 100 % | 82 % |

`THIBAULT`, `MONTLUÇON`, `BEAUVAIS` passent de fuite à masqué ; « Sexe » et
« Masculin » deviennent sur-masqués. **Trois fuites contre deux faux positifs**
— l'arbitrage du projet, appliqué tel quel.

Sur le banc complet : structuré **100 % inchangé**, contextuel **83 → 86 %**,
préservé **98 → 96 %** (le terme perdu est `SPRACHEN`, intitulé de section d'un
CV allemand). Borne basse **inchangée** (100/95/88 %).

### Ce que ça ne règle pas

- `MARCHESSEAU` — le **patronyme seul** derrière son libellé reste raté, comme
  `SARCELLES`. Le correctif est partiel, jamais total.
- L'adresse en capitales n'est pas détectée.
- Le débordement de bornes reste possible : la passe adoucie a produit
  « LANDRY Sexe Masculin » comme un seul span PER, et la fusion garde le plus
  long. C'est du sur-masquage, pas une fuite. Revu sur un vrai CV :
  « COMPÉTENCES CLÉS Data & IA » avale l'intitulé de section.

### Coût mesuré sur un CV réel (15/08, après coup)

Détection avant/après sur le même document, à code identique par ailleurs :

| | |
|---|---|
| **gain** | `IUT de la Sorbonne Paris Nord` capté en entier, contre `IUT` seul avant |
| **coût** | `BDD` et `LAMP` masqués en ENTREPRISE ; l'intitulé avalé ci-dessus |

29 → 31 valeurs masquées. Les sigles de trois lettres en capitales sont le
profil type du faux positif de cette passe : adoucis, ils ressemblent à des
noms propres. Traités là où ce projet traite les classes OUVERTES — le
profil « Développeur / Tech », éditable, jamais une liste dans le moteur.
`Ollama` y figurait déjà ; il n'était pas protégé parce que le document avait
été passé avec le profil « Rédaction / Recherche ».
- **Le garde-fou déterministe reste le profil d'identité**, vidé volontairement
  pendant ce test. Il avait un trou propre, **corrigé le 15/08** : `caseVariants`
  faisait varier la casse et jamais les **composants**, donc un nom complet
  saisi dans une seule case ne protégeait ni le prénom ni le patronyme isolés —
  précisément la forme d'un formulaire (« Nom KAPGNEP » / « Prénom(s) LANDRY »).
  Même leçon que les pseudonymes par composant du 03/08, enfin reportée.

  Périmètre volontairement étroit : **seuls `prenom` et `nom`** sont décomposés.
  Éclater une adresse masquerait « rue » et « des » dans tout le document, un
  employeur masquerait « Labs ». Particules et civilités sont écartées par la
  règle de POSITION partagée avec `pseudonyms.js` (sortie dans `honorifics.js`
  pour ne pas en tenir deux copies).

  Vérifié : profil rempli → `KAPGNEP`, `LANDRY` **et** `SARCELLES` masqués
  (ce dernier par le champ « Ville », qui existait déjà). Le seul raté restant
  du modèle est donc couvert dès que le profil est renseigné.

## P13 — Quatre types sans vivier de pseudonymes (tranché le 15/08/2026)

Signalé avec P12 : l'option Pseudonymes cochée, POSTE, NATIONALITE,
ETABLISSEMENT et SANTE recevaient quand même `[TYPE_N]`. Ils avaient été
ajoutés au moteur le 02/08 sans être ajoutés à `REALISTIC_TYPES`.

**Ce n'est pas quatre oublis, c'est un oubli et trois refus.**

La ligne de partage n'est pas « type connu ou pas », c'est **identifiant ou
attribut ?** Les sept types déjà réalistes sont tous des identifiants : nom,
société, ville, adresse, email, téléphone, date. Échanger l'un contre un autre
préserve son RÔLE dans le texte sans toucher à ce sur quoi le LLM raisonne —
une personne reste une personne.

POSTE, NATIONALITE et SANTE sont des **attributs** : leur valeur EST le sujet
du raisonnement.

| substitution | ce que ça produit |
|---|---|
| « diabète de type 2 » → « asthme » | réponse médicale confiante et fausse |
| « aide-soignante de nuit » → « comptable » | analyse de contrat faussée |
| « portugaise » → « italienne » | démarche administrative faussée |

Un placeholder annonce qu'on a retiré quelque chose ; un faux attribut
plausible n'annonce rien et induit en erreur. C'est l'UX anti-fausse-confiance
du cadrage §5 appliquée à la SORTIE, et non plus seulement à la relecture.
**Ces trois-là resteront en placeholder.**

**ETABLISSEMENT, lui, est un identifiant** au même titre qu'une entreprise, et
il est désormais pseudonymisé — avec une précaution : le MOT D'INSTITUTION
d'origine est conservé, seule la partie distinctive change.

    Lycée Camille-Claudel   →  Lycée Girard
    Université de Bordeaux  →  Université Legrand
    Westfield College       →  Boyer College
    Sciences Po             →  École Faure        (mot inconnu → défaut locale)

Sans ça, un lycée deviendrait une université : le niveau d'études n'est pas une
donnée identifiante, et le LLM le lirait comme un fait. La POSITION du mot est
reprise de l'original plutôt que déduite de la locale — aucun réglage à tenir,
et les deux ordres sortent justes. La partie distinctive vient du vivier des
patronymes, qui est exactement la façon dont ces établissements se nomment.

**Trouvé en passant** : `pseudonymFor` n'est PAS déterministe par valeur — deux
appels sur la même valeur donnent deux pseudonymes (vrai aussi pour ORG et
LOC). La stabilité vient du cache de `maskText`. Ce n'est pas un défaut, mais
un test écrit contre le générateur seul teste une garantie qui n'existe pas :
elle se vérifie à travers `maskText`.

**Reste** : l'UI dit maintenant pourquoi ces trois types gardent leur étiquette
(infobulle de l'option Pseudonymes). Sans ça, le choix se lit comme un bug —
c'est d'ailleurs comme ça qu'il a été signalé.

### P13 révisé le 18/08/2026 — la règle avait UNE condition, il en fallait DEUX

Le 15/08, ETABLISSEMENT recevait un pseudonyme réaliste au motif qu'un nom
d'établissement est un IDENTIFIANT, contrairement aux attributs poste,
nationalité et santé. Le raisonnement était juste, mais incomplet.

Mesuré sur un vrai CV, option Pseudonymes active et types peu fiables cochés :

| original | sortie |
|---|---|
| `IUT Sorbonne Paris Nord` | `École Mercier` ✔ |
| **`LLM local`** | **`École Morel`** ✘ |
| `Cambridge` (certification) | `École Robin` ✘ |

`LLM local` n'est pas un établissement. Le pseudonyme réaliste rend cette
erreur **indétectable** : le lecteur croit à une école qui n'a jamais existé.
Un `[ETABLISSEMENT_1]` posé au même endroit, lui, saute aux yeux et se retire
d'un clic.

Or ETABLISSEMENT figure dans `TYPES_PEU_FIABLES`. **La règle complète tient donc
en deux conditions** : un type reçoit un pseudonyme réaliste s'il est un
IDENTIFIANT **et** si sa détection est FIABLE. La première écarte poste,
nationalité et santé ; la seconde écarte tout `TYPES_PEU_FIABLES`. Un test relie
les deux modules, pour qu'un type qui rejoindrait la liste cesse
automatiquement d'être pseudonymisé.

C'est le principe déjà consigné du projet — *un pseudonyme rend un faux positif
invisible* — appliqué là où il avait été manqué.

### Ce que la même exécution montre par ailleurs

Types peu fiables **activés** par l'utilisateur, sur ce CV :

| original | sortie |
|---|---|
| `IA` | `[NATIONALITE_1]` |
| `NSI` | `[NATIONALITE_5]` |
| `Anglais` / `Allemand` / `Mandarin` | `[NATIONALITE_2..4]` |
| `problèmes` (« résolution de problèmes ») | `[SANTE_1]` |

Rien de nouveau — c'est exactement ce que la mesure du 05/08 avait établi, et
la raison pour laquelle ces quatre types sont **décochés par défaut**. Mais
l'UI les présente comme des cases ordinaires à côté des types fiables : rien
n'indique qu'elles produisent ce genre de sortie. À traiter.

**Constaté aussi, sur un type FIABLE** : `Mars 2026` → `Dijon`. Un mois pris
pour une ville, et le pseudonyme masque l'erreur. La règle des deux conditions
ne couvre pas ce cas — un type fiable produit quand même des fautes, plus
rarement. C'est le prix assumé de l'option Pseudonymes, et l'argument de plus
pour ne jamais la présenter comme sûre.
