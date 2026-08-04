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
| Image (figure 1) | ré-embarquement en mode « Préserver » (`ImageBitmap`, navigateur seulement) | image présente en « Préserver », absente en « Alléger » |
| Métadonnées du PDF | titre/auteur/sujet portent le nom de la candidate | sortie « Préserver » = pages **neuves**, rien n'est recopié |

## Ce que le document montre aujourd'hui (04/08/2026)

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
