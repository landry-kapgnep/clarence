# Roadmap — qualité de détection & reconstruction PDF

Backlog des défauts **observés sur de vrais fichiers** (pas des idées théoriques).
Constaté le 21/07/2026 sur un CV réel (PDF, mode « Préserver / reconstruction »).
Classé par priorité = gravité (fuite > sur-masquage > cosmétique).

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

## P6 — Un document QUI PARLE de données personnelles est le pire cas (mesuré 04/08/2026, non corrigé)

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

## P7 — Placeholders TRONQUÉS dans le PDF reconstruit (mesuré 04/08/2026, cause non isolée)

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
