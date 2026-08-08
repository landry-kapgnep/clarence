# `tous-defauts.pdf` — le document piégé

Un seul fichier à charger dans un Chrome en mode développeur pour éprouver
l'extension d'un coup. Il empile **tous les défauts rencontrés depuis le début
du projet**, y compris ceux qu'on sait encore non corrigés.

```bash
node tests/manuel/gen-pdf-tous-defauts.mjs
```

Le PDF est committé (données entièrement fictives), le script aussi : comme
`tests/fixtures/gen-*.mjs`, jamais un binaire opaque qu'on ne sait plus
reproduire.

**Ce n'est pas le banc d'essai.** `npm run bench` mesure et rend un verdict
chiffré sans intervention humaine ; ce document-ci se **regarde**, dans la
vraie extension, là où aucun test Node ne va — `src/popup/main.js` n'a aucune
couverture (il dépend de `chrome.*`) et c'est là qu'un crash a rendu le mode
PDF « Préserver » inutilisable avec 230 tests au vert.

À utiliser avec la checklist : `docs/verification-chrome.md`.

## Il a payé dès le premier passage

Une **fuite structurée** que ni les 246 tests ni le banc ne voyaient :
`Réf. interne : EMP-4471-KD` restait en clair. Le motif d'identifiant interne
était intégralement anglophone (`employee identifier is…` marchait), et
n'admettait aucun qualificatif entre le libellé et la valeur. C'est le pendant
exact du défaut d'internationalisation déjà connu, dans l'autre sens.

## Carte du document

### Page 1 — CV deux colonnes

| Où | Ce que ça éprouve | Attendu |
|---|---|---|
| `ÉLÉONORE VASSEUR` (titre, 21 pt) | nom TOUT-MAJUSCULE isolé (0,47 sur un vrai CV) + **accents** — sans le correctif du découpeur de mots, « Éléonore » est coupé en trois et l'entité est RATÉE | masqué en entier, en un seul placeholder |
| Colonnes alignées en Y | recollage de lignes entre colonnes (« COMPÉTENCESEXPÉRIENCES ») | les deux colonnes restent distinctes |
| `inno-` / `vante` | mot coupé en fin de ligne (P1bis) | ressort **recollé** en « innovante » |
| `Sébastien de La Villardière` | nom à particules — « Villardière » sort en LIEU, seul le pontage récupère le prénom | nom complet masqué |
| `IUT de Villetaneuse` | « SIGLE de Ville », squelette de la moitié des noms d'établissements FR | la ville masquée, le **sigle survit** |
| `BUT Informatique` | sur-masquage **connu, non corrigé** (P2bis) | ⚠️ « Informatique » masqué en poste — témoin en attendant le correctif |
| Python, Docker, PostgreSQL… | technos à préserver | intactes (profil « Développeur / Tech ») |
| `Korrigane Labs` seule au pied de page | **fuite P0** : indétectable sans contexte, seule la propagation la masque | masquée **dans le fichier téléchargé**, pas seulement dans l'aperçu |
| `Amandine ROUSSEAU` | patronyme de 8 majuscules → matche le motif BIC et annulait le nom entier | nom complet masqué, pas `Amandine [BIC_1]` |
| `linkedin.com/in/eleonore-vasseur` | handle d'URL de profil | masqué |

### Page 2 — annexe administrative

| Où | Ce que ça éprouve | Attendu |
|---|---|---|
| `Madame Hélène Brassard` + ligne vide + `SOMMAIRE` | le motif civilité traversait la ligne vide et avalait le titre | seul le nom est masqué |
| Sommaire à points de suite | P2bis : fragments sans structure de phrase, pire cas connu | ⚠️ encore sur-masqué |
| Bloc `IDENTIFIANTS` | couche déterministe : **exigence 100 %**, un raté est un bug | IBAN, BIC, carte, NIR, SIRET, INE, n° étudiant, réf. interne, IP, MAC, montants : tous masqués |
| `483 921 657` | piège : Luhn-invalide en SIREN, et pris pour un numéro FR par libphonenumber si on lui donne un pays par défaut | **pas** masqué en téléphone |
| `March 14, 1988` / `Springfield 97477` | internationalisation (date littérale EN, ZIP US) | masqués |
| `Ahmed Al-Mansour`, `Clara SCHNEIDER` | patronymes historiquement ratés | masqués |
| `Éléonore a transmis…` | prénom SEUL réutilisé plus loin — la propagation travaille sur la valeur entière | ⚠️ **fuite connue, non corrigée** |
| `1988-03-14`, `EMP-0012`, `Villetaneuse` | valeurs isolées sans contexte (ce que seul le zero-shot traite) | masquées |
| `Réunion « stratégie » — cœur…` | caractères hors WinAnsi | ne fait pas planter la reconstruction |
| `CLAUSE TYPE` (prose sur les données personnelles) | **P6** : un texte dont le SUJET est la donnée personnelle est le pire cas — son vocabulaire ressemble aux catégories cherchées | ⚠️ **cassé** : pronoms (`you`, `I`, `me`, `we`), rôles (`vendor`, `representative`, `candidate`) et noms communs (`name`, `address`, `consent`) masqués. Rien ici ne devrait l'être |
| **Interligne 1,5** (page 3) | **P8** : le plus gros défaut de mise en page rencontré — seuil de paragraphe calibré sur la police et non sur l'interligne, donc un paragraphe par ligne | les 6 lignes forment UNE unité |
| **Article 9** (page 3) | santé, poste, nationalité, établissement — le plus grave restant | ⚠️ non détectés, types **décochés par défaut** : c'est dit, pas caché |
| **Tableau** (page 3) | en-têtes à préserver, cellules à masquer ; rendu à améliorer | ⚠️ `Ville` masqué : pas de marquage `structurel` côté PDF |
| `OSCAR CRM`, `Scholaro` (page 3) | **P2ter** : produits tiers, ni technos ni entreprises reconnaissables | angle mort connu |
| `99 Av. Jean Jaurès` (page 2) | **P2ter** : le motif ADRESSE ne couvrait pas la forme abrégée | masqué |
| `Rose Fontaine` / « une rose ancienne » | propagation par composant **sensible à la casse** | le nom masqué, le nom commun préservé |
| `jean dupont` (minuscules) | **limite assumée** du filtre de casse (PER/ORG/LIEU exigent une majuscule) | ⚠️ non détecté — témoin de la limite, pas un objectif |
| Ligne longue → placeholder (page 1) | **P7** : le fragment sortait hors page, invisible ET perdu à la relecture | reste dans la page, entièrement extractible |
| Image (figure 1) | **fond TRANSPARENT sur 200×200** : déclenche le chemin JPEG de `encodeImage` (bascule au-delà de 128×128), or le JPEG n'a pas d'alpha | ⚠️ le fond doit rester transparent, pas devenir noir |
| Métadonnées du PDF | titre/auteur/sujet portent le nom de la candidate | sortie « Préserver » = pages **neuves**, rien n'est recopié |

## Critère de clôture de la détection (posé le 05/08/2026)

**Le dossier détection ne se ferme que lorsque ce fichier ressort correctement
anonymisé.** C'est la vérité terrain INVERSÉE : chaque bloc est un piège connu,
et le document n'a aucune vocation à être réaliste.

Deux listes font foi (vérifiées par `tests/bench/.modeles/` pendant les
séances, à industrialiser) :

**DOIT DISPARAÎTRE (32)** — noms, emails, téléphones, handle, entreprises,
patronymes difficiles, IBAN, BIC, carte, NIR, SIRET, INE, n° étudiant, réf.
interne, IP, MAC, adresses (dont la forme abrégée « Av. »), dates FR et EN,
cellules nues, `Rose Fontaine`.

**DOIT SURVIVRE (18)** — technos, `BUT`, `IUT`, `innovante` (mot recollé),
« une rose ancienne » (nom commun, casse), en-têtes de tableau, titres de
section, `483 921 657` (le piège SIREN/téléphone).

### État mesuré au 05/08/2026 : 1 fuite, 3 sur-masquages sur 50 pièges

| Cas | Nature | Cause mesurée |
|---|---|---|
| `EMP-0012` | **fuite** | Référence interne **sans libellé** : le motif REFERENCE exige « Réf. »/« Matricule » adjacent, et la couche contextuelle ne la voit pas. Dans le tableau elle est même avalée par un span `PER "Rousseau EMP"` à 0,81 |
| `Ville` | sur-masquage | **En-tête de tableau PDF** — CSV/XLSX marquent les leurs `structurel`, le chemin PDF n'a aucun équivalent |
| `SOMMAIRE` | sur-masquage | P2bis : titre en capitales sur unité courte, sorti `PER 0,57` |
| `GitLab` | sur-masquage | `ORG 0,47`. **Comportement attendu** sans le profil « Développeur / Tech », qui existe exactement pour ça — à ne pas corriger dans le moteur |

Traitement : **1,3 s** pour 3 pages en Node (sans le navigateur).

## Ce que le document montrait au 04/08/2026 (historique)

Consigné pour qu'une régression saute aux yeux — ce n'est pas un idéal, c'est
l'état réel :

- **Structuré** : tout masqué, y compris `EMP-4471-KD` depuis le correctif.
- **Identité** : nom, emails, téléphones, handle, entreprises, patronymes
  difficiles — tous masqués, propagation comprise.
- **Sur-masquage encore présent**, tous de la classe P2bis (unités courtes
  sans contexte) : `IUT`, `SOMMAIRE`, `ANNEXE`, `DOSSIER`, `ADMINISTRATIF`,
  `COORDONNÉES`, `Montant`, `Réunion`, `stratégie`, `Figure 1`, `OCR`,
  `Course`, `pied`, `argentique`, `Second candidat`.
- **Fuite connue restante** : `Éléonore` employée seule.

Le sur-masquage de la page 2 est spectaculaire **et c'est voulu** : cette page
est délibérément faite de lignes courtes sans phrases, le pire cas pour le
modèle. Un vrai document en prose se comporte bien mieux (le banc mesure 97 %
de termes préservés). Ne pas lire cette page comme représentative — la lire
comme la borne basse.

## Limite

Un document piégé protège contre la **répétition** de bugs connus. Il ne dit
rien du fichier d'un inconnu — même angle mort que le banc. Le seul vrai
signal de « prêt », ce sont des fichiers réels de gens qui ne sont pas nous.

---

## Pages 4 à 6 — multilingue (07/08/2026)

**Pourquoi elles existent.** Le corpus était à 6 documents sur 7 en français :
on ne mesurait donc **rien** hors du français. C'est exactement le mécanisme qui
avait laissé passer le bug d'interligne pendant des semaines — tout le corpus
était en interligne simple, donc le défaut était structurellement invisible.

- **Page 4** — anglais (identifiants US, noms difficiles, mots ambigus)
- **Page 5** — espagnol, aussi fournie que les pages françaises
- **Page 6** — allemand, aussi fournie que les pages françaises

> **Note de relecture.** Le propriétaire du projet lit le français et l'anglais.
> Les pages 5 et 6 sont donc **intégralement glosées** dans les tableaux
> ci-dessous — un jeu de test qu'on ne peut pas relire soi-même est une dette,
> pas un actif.

### Pourquoi PAS le mandarin, le hindi ou l'arabe, pourtant plus parlés

Question posée le 07/08 et tranchée par la mesure, pas par principe. **Le mode
PDF « Préserver » ne sait physiquement pas écrire hors Latin-1** :
`sanitizeForWinAnsi` (`pdf-reconstruct.js`) remplace tout au-delà de U+00FF.

```
mandarin  « 张伟在北京工作 »      ->  « ??????? »
hindi     « राहुल शर्मा दिल्ली में »  ->  « ????? ????? ?????? ??? »
arabe     « محمد علي في القاهرة » ->  « ???? ??? ?? ??????? »
russe     « Иван Петров в Москве » -> « ???? ?????? ? ?????? »
```

Trois verrous, pas un : la police Helvetica standard est limitée à Latin-1,
`sanitizeForWinAnsi` écrase le reste, et le modèle est bâti sur un socle
anglophone (le checkpoint multilingue avait été mesuré **moins bon** que le
nôtre en français). Tester une langue que le moteur ne peut pas restituer ne
mesurerait rien.

S'y ajoute le cadrage, qui vise le **marché francophone** : un indépendant
français reçoit de l'anglais, de l'espagnol, de l'allemand, de l'italien, du
portugais — tous en Latin-1. La limite non-latine est consignée comme défaut
produit à part entière dans `docs/roadmap-detection.md`.

### État mesuré au 07/08/2026 — pages 5 et 6

**9 fuites sur 30, 3 sur-masquages sur 21.**

| Fuite | Pourquoi |
|---|---|
| `12345678Z` (DNI), `X1234567L` (NIE) | **P5.** Identifiants espagnols, aucun motif non-FR. Le DNI a pourtant une clé calculable (n mod 23) — candidat naturel à l'i18n |
| `28 1234567840` (sécurité sociale ES) | **P5** |
| `12345678901` (Steuer-ID DE) | **P5**, 11 chiffres avec clé |
| `91 234 56 78`, `030 1234567` | **P5.** Formats **nationaux** ES et DE. Les formats internationaux (`+34…`, `+49…`) passent, eux — c'est bien la graphie qui bloque, pas le pays |
| `08001`, `20095` (codes postaux) | **Découverte.** `CODE_POSTAL_VILLE` exige la ville **collée** au code. « 08001 para Barcelona » et « 20095 für Hamburg » intercalent une préposition → non reconnu. Les adresses où la ville suit directement (`28013 Madrid`) sont bien masquées |
| `Bahnhofstr. 7a` | Type de voie allemand **abrégé et soudé**. `Hauptstraße 15`, lui, est masqué |

| Sur-masquage | Verdict |
|---|---|
| `SPRACHEN` | Même cause qu'en français : lignes serrées recollées en un paragraphe, la règle des intitulés ne les voit plus. `AUSBILDUNG` et `BERUFSERFAHRUNG` survivent |
| `Unternehmen`, `Abteilung` | **La faiblesse allemande, enfin chiffrée : 2 noms communs masqués sur 9 testés.** L'allemand capitalise tous ses noms communs, donc la garde « au moins une majuscule » (P6) ne filtre par construction **rien** dans cette langue — et pourtant le modèle n'en étiquette que 2. Bien moins grave que le raisonnement ne le laissait craindre |

**Ce que ces pages ont apporté** : toutes les fuites sont dans la couche
**déterministe**, aucune dans la contextuelle. Le modèle se débrouille bien en
espagnol et en allemand ; c'est notre regex franco-française qui est le trou.
Cela réoriente P5 d'un « nice to have » vers le principal chantier de couverture.


### P5 traité le 08/08/2026 — 10 fuites sur 10 fermées

Les 9 fuites relevées le 07/08 (plus l’adresse allemande abrégée) sont toutes
closes, mesurées avec le pipeline complet sur ce document :

| Fuite | Traitement |
|---|---|
| DNI `12345678Z`, NIE `X1234567L` | Validateur `dniCheck` (n mod 23). Validation **stricte**, pas de masquage sur structure : « 8 chiffres + lettre » est une forme faible qu’un code produit peut prendre — même arbitrage que la carte bancaire (Luhn strict) |
| Sécurité sociale ES, Steuer-ID DE | **Libellé obligatoire** : aucune clé vérifiable à peu de frais, et « 11 chiffres » nu est trop banal |
| Codes postaux `08001 para Barcelona`, `20095 für Hamburg` | Un mot de liaison (≤ 5 lettres) peut désormais s’intercaler. **Le défaut valait aussi en français** (« 75001 dans Paris ») — la page multilingue a révélé un bug franco-français |
| Téléphones nationaux ES/DE | **Libellé obligatoire** (`fijo`, `Festnetz`, `Teléfono`…). Pas de motif nu par pays : libphonenumber tourne sans pays par défaut précisément pour que « 483 921 657 » (piège SIREN) ne passe pas pour un numéro |
| Téléphone US `(617) 555-0142`, `617-555-0143` | Sans libellé : ces deux graphies sont assez distinctives, comme le SSN (3-2-4) |
| `Bahnhofstr. 7a`, `Calle Mayor 12` | Motif ADRESSE ES/DE. L’espagnol met le type de voie **avant** et le numéro **après** (l’inverse du français) ; l’allemand **soude** le type au nom, il faut le chercher comme suffixe |

Le numéro reste exigé dans les adresses : c’est lui qui distingue une adresse
d’une simple mention de rue, et il borne le sur-masquage.

**Non corrigé, mesuré, assumé** : `SPRACHEN` est masqué en `BIC`. La forme BIC
(4 lettres + code pays + 2 alphanum) attrape ce mot allemand car `CH` figure
au milieu. Sur 18 mots courants testés, c’est le **seul** faux positif. Un
correctif supposerait d’exiger un libellé pour les BIC, ce qui ferait fuir un
BIC nu dans un bloc de coordonnées bancaires — on préfère un faux positif
isolé à une fuite (règle du projet). Antérieur à P5, vérifié par `git stash`.

### Page 4 — anglais

| Élément | Attendu | Pourquoi c'est un piège |
|---|---|---|
| `SUMMARY`, `CONTACT DETAILS`, `PEOPLE`, `AMBIGUOUS WORDS`, `OTHER SECTIONS` | **survit** | Vérifie que la règle des intitulés est indépendante de la langue (elle est formelle, pas lexicale) |
| `(617) 555-0142`, `617-555-0143` | masqué | Format **national** US. La regex FR ne le voit pas, et libphonenumber tourne sans pays par défaut — avec `FR` il prendrait le piège SIREN `483 921 657` pour un numéro français |
| `123-45-6789` | masqué | SSN, structure 3-2-4 : aucun équivalent dans nos motifs |
| `94043-1351` | masqué | ZIP+4 ; notre `CODE_POSTAL_VILLE` attend 5 chiffres à la française |
| `1600 Amphitheatre Pkwy` | masqué | Type de voie US abrégé, absent de notre liste (`rue`, `avenue`, `av.`…) |
| `03/14/1988` | masqué | Date **mois-en-premier**. Se lit 14 mars aux États-Unis, et serait invalide en France (mois 14) — ambiguïté réelle, pas théorique |
| `Kwame Nkrumah-Boateng` | masqué | Patronyme composé hors répertoire occidental courant |
| `Siobhán Ó Braonáin` | masqué | Particule irlandaise `Ó` + accents. **Les accents sont testés à dessein** : c'en est un qui avait cassé le découpeur de mots de GLiNER.js |
| `Ravenscroft & Bell LLP` | masqué | Esperluette et suffixe juridique dans un nom d'entreprise |
| `Mr. Baker` / `Ms. Rose` | masqué | Civilité + nom (voir `honorifics.js`) |
| **`the baker`, `a rose grower`** | **survit** | **Le piège le plus fin du document** : le MÊME mot, une fois nom propre, une fois nom commun. Aucun lexique ne peut trancher — seule la position le peut |
| `Kubernetes`, `PostgreSQL` | survit | Technos (couvertes par le profil « Développeur / Tech ») |
| `Contents`, `Overview`, `Conclusion` | survit | Noms communs que le modèle étiquette volontiers entreprise ou lieu quand ils sont isolés |

### Page 5 — espagnol, avec traduction

| Terme | Traduction | Attendu | Pourquoi c'est un piège |
|---|---|---|---|
| `DATOS PERSONALES`, `DIRECCIÓN Y FECHAS`, `OBSERVACIONES`, `IDIOMAS`, `COMPETENCIAS`, `EXPERIENCIA LABORAL` | « données personnelles », « adresse et dates », « observations », « langues », « compétences », « expérience professionnelle » | survit | Intitulés |
| **`Ruiz Salinas`** | deux patronymes | masqué | **Spécificité n°1 : l'espagnol porte DEUX noms de famille — celui du père puis celui de la mère — SANS trait d'union.** Ce ne sont pas deux personnes. Le pontage doit relier les deux, sinon la moitié du nom fuit à côté du placeholder |
| **`María del Carmen`** | prénom composé | masqué | **Spécificité n°2 : c'est UN prénom, pas « María » + particule.** La structure est [María del Carmen] [Ruiz] [Salinas]. Nos pseudonymes mémorisant par composant, « Carmen » risque de recevoir un pseudo de famille |
| `Carmen Ruiz` | forme courte de la même personne | masqué | Vérifie la cohérence : même personne, deux graphies dans un même document |
| `12345678Z` | carte d'identité | masqué | 8 chiffres + **lettre de contrôle calculée** (n mod 23 dans `TRWAGMYFPDXBNJZSQVHLCKE`). Celle-ci est **valide** — vraie épreuve de checksum |
| `X1234567L` | titre de séjour étranger | masqué | Même clé, préfixe X/Y/Z |
| `28 1234567840` | n° de sécurité sociale | masqué | Équivalent du NIR |
| `ES91 2100 …` | IBAN espagnol | masqué | 24 caractères contre 27 en France, **même mod-97** : notre validateur devrait l'accepter sans rien changer |
| `+34 612 345 678` / `91 234 56 78` | tél. international / national | masqué | Même isolement de variable qu'en anglais : seule la graphie change |
| `Calle`, `Avenida`, `Plaza`, `C/` | « rue », « avenue », « place », abrév. de Calle | masqué | Types de voie absents de notre motif ADRESSE |
| `08001`, `41001` | codes postaux | masqué | **5 chiffres, exactement comme la France** — notre motif les prend pour des codes français. Bon résultat, mauvaise raison |
| `14 de marzo de 1988` | 14 mars 1988 | masqué | Date en toutes lettres ; le contrôle de forme est structurel (quantième + année, sans liste de mois) donc doit marcher sans ajout |
| `¿` `¡` | ponctuation ouvrante inversée | — | **Spécificité n°3** : colle au premier mot et peut casser une frontière de mot |
| `S.L.`, `S.A.` | équivalents de SARL et SA | masqué | Suffixes juridiques dans un nom d'entreprise |
| `Contenido`, `Resumen`, `Conclusión` | « contenu », « résumé », « conclusion » | survit | Noms communs volontiers étiquetés entreprise ou lieu |

### Page 6 — allemand, avec traduction

| Terme | Traduction | Attendu | Pourquoi c'est un piège |
|---|---|---|---|
| `PERSÖNLICHE DATEN`, `ANSCHRIFT UND KENNZAHLEN`, `SPRACHEN`, `AUSBILDUNG`, `BERUFSERFAHRUNG` | « données personnelles », « adresse et identifiants », « langues », « formation », « expérience » | survit | Intitulés |
| `Besprechung`, `Vertrag`, `Unternehmen`, `Antrag`, `Bescheinigung`, `Rechnung`, `Ergebnis`, `Prüfung`, `Abteilung` | « réunion », « contrat », « entreprise », « demande », « attestation », « facture », « résultat », « contrôle », « service » | **survit** | **Spécificité n°1 : l'allemand met une majuscule à TOUS les noms communs** — voir l'encadré plus bas |
| `Krankenversicherungsnummer`, `Aufenthaltsgenehmigung` | « n° d'assurance maladie », « titre de séjour » | survit | **Spécificité n°2 : mots composés SOUDÉS**, sans espace ni trait d'union. Aucune segmentation par espace ne retrouvera les composants, et leur longueur peut les faire prendre pour des identifiants |
| **`Jürgen Müller` / `Juergen Mueller`** | même personne, deux graphies | masqué | **Spécificité n°3 : le tréma a une transcription officielle** (ü=ue, ö=oe, ä=ae, ß=ss). La même personne s'écrit de deux façons dans un même dossier. Nos placeholders étant cohérents **par valeur**, elle recevra **deux identités différentes**. Piège réel, sans correctif prévu |
| `von der Weiden`, `zu Guttenberg`, `von Stein` | particules nobiliaires | masqué | Équivalents de nos « de la » / « de » (voir `PARTICLE` dans `ner.js`) |
| `Hauptstraße 15` | « 15 rue Principale » | masqué | **Type de voie soudé au nom** (Haupt + straße). Le `ß` est un caractère à part entière, pas deux `s` |
| `Bahnhofstr. 7a` | « 7a rue de la Gare » | masqué | Même chose, en **abrégé** |
| `20095`, `50667` | codes postaux | masqué | 5 chiffres, comme la France et l'Espagne |
| `12345678901` | Steuer-ID (n° fiscal) | masqué | 11 chiffres avec clé de contrôle |
| `DE89 3704 …` | IBAN allemand | masqué | 22 caractères, même mod-97 |
| `+49 30 123456` / `030 1234567` | tél. international / national | masqué | Même isolement de variable |
| `14. März 1988` / `14.03.1988` | 14 mars 1988 | masqué | **Spécificité n°4 : point après le quantième**, et points comme séparateurs numériques |
| `GmbH`, `AG` | équivalents de SARL et SA | masqué | Suffixes juridiques |

#### ⚠️ La spécificité allemande, et elle touche le moteur au cœur

**L'allemand met une majuscule à TOUS les noms communs.**

Or `estPlausiblePourLeType` (`src/engine/gliner.js`) écarte les faux positifs
PERSONNE / ENTREPRISE / LIEU en exigeant **« au moins une majuscule »** — la
garde P6, qui avait fait passer les termes préservés de 90 à 95 %.

Cette garde ne filtre donc **strictement rien en allemand** : les neuf noms
communs testés ci-dessus la passent tous. C'est une **limite structurelle**,
pas un réglage à ajuster.

**Mais la mesure nuance fortement le raisonnement** : sur ces neuf, le modèle
n'en étiquette que **deux** (`Unternehmen`, `Abteilung`). La garde est inopérante,
et pourtant le sur-masquage allemand reste comparable au français. À re-mesurer
sur un vrai document avant toute promesse de support.
