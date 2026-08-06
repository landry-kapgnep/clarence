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
