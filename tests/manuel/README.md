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

## Pages 4 et 5 — multilingue (ajoutées le 07/08/2026)

**Pourquoi elles existent.** Le corpus était à 6 documents sur 7 en français :
on ne mesurait donc **rien** hors du français. C'est exactement le mécanisme qui
avait laissé passer le bug d'interligne pendant des semaines — tout le corpus
était en interligne simple, donc le défaut était invisible.

La couche **contextuelle** est multilingue par nature (le modèle l'est). La
couche **déterministe** est franco-française : la plupart des fuites ci-dessous
sont donc **attendues** tant que P5 (i18n du structuré) n'est pas fait. Elles
sont là pour être comptées, pas pour être une surprise.

> **Note de relecture.** Le propriétaire du projet lit le français et l'anglais.
> La page 4 est donc étoffée, et la page 5 (ES/DE) volontairement courte et
> **intégralement traduite ci-dessous** — un jeu de test qu'on ne peut pas
> relire soi-même est une dette, pas un actif.

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

### Page 5 — espagnol et allemand, avec traduction

| Terme | Traduction | Attendu | Pourquoi |
|---|---|---|---|
| `SECCIÓN EN ESPAÑOL` | « section en espagnol » | survit | Intitulé |
| `IDIOMAS` | « langues » | survit | Intitulé (l'équivalent exact de `LANGUES`) |
| `COMPETENCIAS` | « compétences » | survit | Intitulé |
| `DNI: 12345678Z` | carte d'identité espagnole | masqué | 8 chiffres + **lettre de contrôle calculée** — exactement le type de validation mathématique que la couche déterministe sait faire (comme la clé du NIR). Candidat naturel à l'i18n |
| `+34 612 345 678` | téléphone espagnol | masqué | Format international : **déjà couvert** par libphonenumber |
| `Dirección` | « adresse » | survit | Libellé de champ |
| `Calle Mayor 12, 28013 Madrid` | « 12 rue Mayor » | masqué | `Calle` est un type de voie inconnu de notre motif ADRESSE |
| `María del Carmen Ruiz-Salinas` | prénom + particule + patronyme | masqué | La particule `del` est l'équivalent de nos `de la` (voir `PARTICLE` dans `ner.js`) |
| `DEUTSCHER ABSCHNITT` | « section allemande » | survit | Intitulé |
| `SPRACHEN` | « langues » | survit | Intitulé |
| `AUSBILDUNG` | « formation » | survit | Intitulé |
| `Die Besprechung`, `den Vertrag`, `im Unternehmen` | « la réunion », « le contrat », « l'entreprise » | **survit** | **Voir l'encadré ci-dessous** |
| `Hauptstraße 15, 10115 Berlin` | « 15 rue Principale » | masqué | Type de voie **collé** au nom ; code postal à 5 chiffres **comme en France**, donc faux positif possible sur `CODE_POSTAL_VILLE` qui suppose une ville française |
| `Jürgen von der Weiden` | prénom + particule + patronyme | masqué | `von der` = `de la` |
| `14. März 1988` | 14 mars 1988 | masqué | Date à quantième pointé ; déjà couverte par le contrôle de forme structurel (sans aucune liste de mois) |

### ⚠️ La spécificité allemande, et elle touche le moteur au cœur

**L'allemand met une majuscule à TOUS les noms communs.**

Or `estPlausiblePourLeType` (`src/engine/gliner.js`) écarte les faux positifs
PERSONNE / ENTREPRISE / LIEU en exigeant **« au moins une majuscule »** — la
garde P6, qui avait fait passer les termes préservés de 90 à 95 %.

Cette garde ne filtre donc **strictement rien en allemand** : `Besprechung`,
`Vertrag`, `Unternehmen` la passent tous les trois, alors que ce sont des noms
communs. C'est une **limite structurelle**, pas un réglage à ajuster — et elle
n'était mesurée nulle part avant cette page.

Conséquence pratique : le sur-masquage sera probablement **pire en allemand**
qu'en français. À chiffrer avant toute promesse de support multilingue.

### État mesuré au 07/08/2026, dès la première passe

**3 fuites sur 18, 6 sur-masquages sur 18.** Détail et verdict :

| Constat | Verdict |
|---|---|
| `(617) 555-0142`, `617-555-0143` en clair | **P5 confirmé et chiffré.** Format national US : ni la regex FR ni libphonenumber (sans pays par défaut) ne le voient. Connu, désormais mesuré |
| `12345678Z` (DNI) en clair | **P5 confirmé.** Aucun motif non-FR dans la couche déterministe |
| `Kubernetes`, `PostgreSQL` masqués | **Attendu, pas un défaut.** Ce diagnostic ne charge pas le profil « Développeur / Tech », qui les pré-remplit dans « ne jamais masquer » — même statut que `Docker` et `GitLab` |
| `IDIOMAS`, `COMPETENCIAS`, `SPRACHEN` masqués | **Ce n'est PAS un problème de langue.** Ces lignes sont à 14 pt d'écart en corps 9 : le regroupement les recolle en un seul paragraphe, donc la règle des intitulés ne les voit plus. Même cause que `SOMMAIRE` et `ANNEXE` en français — c'est un défaut de **découpage**, pas de multilinguisme |
| `Unternehmen` masqué, mais `Besprechung` et `Vertrag` **survivent** | **La prédiction allemande se vérifie — en plus modéré qu'annoncé.** 1 nom commun sur 3 masqué, là où la garde « au moins une majuscule » ne filtre par construction rien du tout. À re-mesurer sur un vrai document allemand avant toute promesse |

**Ce que ces pages ont réellement apporté** : elles ont transformé deux
suppositions en chiffres. La couche déterministe non-FR est bien le trou
principal (3 fuites sur 3 tentatives), et la faiblesse allemande est réelle mais
plus limitée que le raisonnement ne le laissait craindre.

**Ce qu'elles ont infirmé** : le sur-masquage des intitulés ES/DE n'a rien à
voir avec la langue. La règle est formelle, donc universelle ; c'est le
découpage en paragraphes qui la prive de sa matière. Corriger le découpage
profiterait donc aux cinq langues à la fois — mais la tentative directe a déjà
été mesurée et rejetée (voir `groupIntoParagraphs`), il faudra une autre voie.
