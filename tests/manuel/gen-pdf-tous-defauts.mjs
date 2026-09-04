// Génère tests/manuel/tous-defauts.pdf - LA VÉRITÉ TERRAIN INVERSÉE.
//
// Ce document empile délibérément tous les défauts rencontrés depuis le début
// du projet : c'est le pire cas d'usage imaginable, pas un document réaliste.
// Règle de clôture posée le 05/08/2026 : **le dossier détection ne se ferme
// que lorsque ce fichier ressort correctement anonymisé.**
//
// Chaque bloc porte en commentaire le défaut qu'il éprouve et sa référence
// dans docs/roadmap-detection.md. Ne rien retirer d'ici sans avoir vérifié que
// le défaut correspondant est corrigé ET couvert ailleurs : ce fichier est la
// mémoire vivante des régressions possibles.
//
// La carte « quoi regarder / quoi attendre » est dans tests/manuel/README.md.
// Aucun marqueur ([T1], [T2]…) n'est imprimé : il finirait dans le flux soumis
// au modèle et fausserait ce qu'on observe.
//
// Toutes les valeurs sont fictives et reconnaissables comme telles (carte
// 4242…, domaines .example) - règle du projet.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));

// ── Écriture d'un PNG RGBA à la main ────────────────────────────────────────
// Nécessaire pour éprouver le bug du fond noir : `encodeImage`
// (pdf-reconstruct.js) bascule en jpeg dès que l'image dépasse 128×128 px, et
// le jpeg n'a pas de canal alpha - le transparent devient (0,0,0), donc noir.
// Une image 1×1 opaque (l'ancienne version de ce fichier) ne déclenchait pas
// ce chemin : il faut une image transparente et assez grande.
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return buf => {
    let c = -1;
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const corps = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(corps));
  return Buffer.concat([len, corps, crc]);
}

// Disque coloré opaque sur fond transparent.
function pngTransparent(taille) {
  const lignes = [];
  const r = taille / 2 - 2;
  for (let y = 0; y < taille; y++) {
    const row = Buffer.alloc(1 + taille * 4); // octet de filtre + RGBA
    for (let x = 0; x < taille; x++) {
      const dx = x - taille / 2, dy = y - taille / 2;
      const dedans = dx * dx + dy * dy <= r * r;
      const o = 1 + x * 4;
      row[o] = dedans ? 0xC2 : 0;
      row[o + 1] = dedans ? 0xA0 : 0;
      row[o + 2] = dedans ? 0x6A : 0;
      row[o + 3] = dedans ? 255 : 0;   // alpha 0 hors du disque
    }
    lignes.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(taille, 0);
  ihdr.writeUInt32BE(taille, 4);
  ihdr[8] = 8;   // 8 bits par canal
  ihdr[9] = 6;   // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(lignes))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

// Métadonnées porteuses de PII : ce que l'utilisateur oublie systématiquement.
doc.setTitle('CV Éléonore Vasseur - candidature alternance');
doc.setAuthor('Éléonore Vasseur');
doc.setSubject('Dossier de candidature - Korrigane Labs');
doc.setCreator('Microsoft Word - CV_VASSEUR_v3_final.docx');

const put = (page, text, x, y, size = 8, gras = false) =>
  page.drawText(text, { x, y, size, font: gras ? bold : font, color: rgb(0, 0, 0) });

// ═══════════════════════════════════════════════════════════════════════════
// Page 1 - cv deux colonnes (le format le plus dur, et le plus sensible)
// ═══════════════════════════════════════════════════════════════════════════
const p1 = doc.addPage([595, 842]);

// Nom tout-majuscule, seul sur sa ligne, en très grande police. Sur un vrai CV
// ce cas ne sort qu'à 0,47 (d'où le seuil du groupe identité à 0,38) et en deux
// spans séparés, donc il éprouve aussi le pontage. Les accents éprouvent le
// découpeur de mots corrigé au runtime : sans le correctif, « Éléonore » est
// découpé en trois et l'entité est ratée.
put(p1, 'ÉLÉONORE VASSEUR', 50, 790, 21, true);
put(p1, 'Développeuse Data & Backend', 50, 772, 10);
put(p1, 'e.vasseur@courriel.example - 06 44 55 66 77 - Nantes', 50, 757, 8);
put(p1, 'linkedin.com/in/eleonore-vasseur', 50, 745, 8);

// Deux colonnes, Y volontairement alignés : c'est ce qui provoque le recollage
// de lignes entre colonnes quand la gouttière n'est pas vue.
const G = 50, D = 320;

put(p1, 'COMPÉTENCES', G, 715, 10, true);
put(p1, 'EXPÉRIENCES PROFESSIONNELLES', D, 715, 10, true);

put(p1, 'Python - Pandas - NumPy', G, 698);
put(p1, 'Alternance chez Korrigane Labs', D, 698);

put(p1, 'React.js - FastAPI - Django', G, 686);
put(p1, 'Sept. 2024 - Août 2025', D, 686);

put(p1, 'Docker - docker-compose', G, 674);
put(p1, 'Conception d’une chaîne applicative', D, 674);

put(p1, 'PostgreSQL - MariaDB - MongoDB', G, 662);
put(p1, 'de traitement automatisée des dossiers.', D, 662);

// Nom à particules : « Villardière » sort en LIEU, seul le pontage arrière
// récupère le prénom et les particules restés en clair.
put(p1, 'Git - GitHub - GitLab', G, 650);
put(p1, 'Encadrée par Sébastien de La Villardière.', D, 650);

// P1bis - mot coupé en fin de ligne. Lignes rapprochées (12 pt) donc même
// paragraphe. Sans le recollage, « vante » est soumis isolée au modèle.
put(p1, 'Linux - Bash', G, 638);
put(p1, 'Stage chez Wobix Labs, développement d’une interface inno-', D, 638);
put(p1, 'vante pour la gestion des données clients.', D, 626);

put(p1, 'FORMATION', G, 612, 10, true);
put(p1, 'Juin 2023 - Août 2023', D, 612);

// Sur-masquage connu et non corrigé : « Informatique » sort en ENTREPRISE à
// 0,47 sur une unité courte. Témoin - doit survivre le jour où ce sera traité.
put(p1, 'BUT Informatique', G, 595);
put(p1, 'Développement d’outils internes', D, 595);

// « sigle de Ville » : le pontage en faisait un [PERSONNE_1] avalant le sigle.
put(p1, 'IUT de Villetaneuse', G, 583);
put(p1, 'pour l’équipe support.', D, 583);

put(p1, '2023 - 2026', G, 571);

put(p1, 'LANGUES', G, 545, 10, true);
put(p1, 'CENTRES D’INTÉRÊT', D, 545, 10, true);

put(p1, 'Français - langue maternelle', G, 528);
put(p1, 'Photographie argentique', D, 528);

put(p1, 'Anglais - C1', G, 516);
put(p1, 'Course à pied', D, 516);

// P0 - « Korrigane Labs » seule sur sa ligne : indétectable ici faute de
// contexte, donc seule la propagation peut la masquer. La fuite n'apparaissait
// que dans le fichier réécrit, jamais dans l'aperçu.
put(p1, 'Korrigane Labs', G, 480);
// Patronyme de 8 majuscules : « ROUSSEAU » matche le motif BIC et annulait le
// nom entier, laissant « Amandine » en clair à côté du placeholder.
put(p1, 'Recommandation : Amandine ROUSSEAU', G, 468);
put(p1, 'Référence disponible sur demande - Sébastien de La Villardière', G, 456);

// P7 - ligne qui déborde. Ligne longue dont la valeur finale devient un
// placeholder plus long : le fragment sortait alors hors page, invisible à
// l'écran ET perdu à la relecture (pdfjs ne rend pas les glyphes hors cadre).
put(p1, 'Merci d’adresser toute correspondance relative à ce dossier à l’adresse suivante : e.vasseur@courriel.example', 50, 430, 9);

// ═══════════════════════════════════════════════════════════════════════════
// Page 2 - annexe administrative : le structuré, et les pièges de faible contexte
// ═══════════════════════════════════════════════════════════════════════════
const p2 = doc.addPage([595, 842]);
let y = 790;
const ligne = (t, size = 9, gras = false) => { put(p2, t, 50, y, size, gras); y -= 14; };
const saut = (n = 1) => { y -= 14 * n; };

ligne('ANNEXE — DOSSIER ADMINISTRATIF', 13, true);
saut();

// Le motif « civilité + nom » séparait ses composants par \s+, qui traverse le
// saut de paragraphe : le titre de section était masqué avec le nom.
ligne('Tuteur pédagogique : Madame Hélène Brassard');
saut();
ligne('SOMMAIRE', 10, true);

// P2bis - sommaire à points de suite : fragments sans structure de phrase,
// le pire cas connu pour le sur-masquage.
ligne('Introduction...................................................3');
ligne('1) L’entreprise................................................5');
ligne('2) La vérité terrain...........................................8');
ligne('3) Exécution des tâches.......................................11');
saut();

ligne('IDENTIFIANTS', 10, true);
// Couche déterministe : exigence 100 %, un raté ici est un bug, pas une limite.
ligne('IBAN : FR76 3000 6000 0112 3456 7890 189');
ligne('BIC : AGRIFRPP882');
ligne('Carte de test : 4242 4242 4242 4242');
ligne('NIR : 1 88 03 44 109 019 91');
ligne('SIRET : 732 829 320 00074');
ligne('Id. National : 080924167CD');
ligne('N° Étudiant : 12201603');
ligne('Réf. interne : EMP-4471-KD');
ligne('IP du poste : 192.168.1.254');
ligne('MAC : 3C:5A:B4:0F:11:22');
ligne('Montant : 15 000 € — soit 6540.00 EUR de reste à charge');
saut();

ligne('COORDONNÉES', 10, true);
ligne('Adresse : 42 rue des Cordeliers, 44000 Nantes');
// P2ter - adresse ABRÉGÉE : le motif ADRESSE ne couvre pas « Av. », le nom de
// voie sortait en PERSONNE et le numéro restait en clair.
ligne('Second site : 99 Av. Jean Jaurès, 93430 Villetaneuse');
ligne('Téléphone US : +1 617 555 0142');
ligne('Contact : contact@korrigane-labs.example');
// Piège : Luhn-invalide comme SIREN, et libphonenumber le prend pour un numéro
// français si on lui donne un pays par défaut.
ligne('Numéro de dossier interne : 483 921 657');
saut();

ligne('ÉTAT CIVIL', 10, true);
ligne('Née le 16 octobre 2004 à Sarcelles (095)');
ligne('Second candidat born on March 14, 1988 in Springfield 97477');
// Piège mesuré : accoler le libellé à la valeur fait chuter la détection -
// 0,74 sur le libellé, 0,15 sur la vraie date. L'isolement est un atout.
ligne('Date de naissance : 1991-07-23');
saut();

ligne('AUTRES CANDIDATS', 10, true);
// Deux patronymes historiquement ratés.
ligne('Ahmed Al-Mansour — dossier complet');
ligne('Clara SCHNEIDER — en attente');
// Prénom seul réutilisé plus loin : la propagation ne travaillait que sur la
// valeur entière, « Éléonore » restait donc en clair.
ligne('Éléonore a transmis ses relevés le 12 mars.');
// Propagation par composant sensible à la casse : sans ça, « Rose Fontaine »
// ferait disparaître toutes les « rose » communes du document.
ligne('Rose Fontaine cultive une rose ancienne dans son jardin.');
// Limite assumée du filtre de casse : un nom tapé tout en minuscules n'est
// plus vu par la couche contextuelle. Témoin de cette limite, pas un objectif.
ligne('Noté à la volée : jean dupont doit rappeler lundi.');
saut();

// Valeurs isolées sans aucun contexte : le cas que seul le zero-shot traite.
ligne('CELLULES NUES', 10, true);
ligne('1988-03-14');
ligne('EMP-0012');
ligne('Villetaneuse');
saut();

// Caractères hors WinAnsi : ont déjà fait planter la reconstruction.
ligne('Réunion « stratégie » — cœur du sujet… voir a@b.example');

// ═══════════════════════════════════════════════════════════════════════════
// Page 3 - les cas ajoutés le 05/08 : interligne, article 9, tableau, image
// ═══════════════════════════════════════════════════════════════════════════
const p3 = doc.addPage([595, 842]);
let y3 = 790;
const l3 = (t, size = 9, gras = false, pas = 14) => { put(p3, t, 50, y3, size, gras); y3 -= pas; };

l3('ANNEXE 2 — CAS DIFFICILES', 13, true);
y3 -= 10;

// P8 - interligne 1,5, le plus gros défaut de mise en page rencontré.
// Police 11, écart 19 pt : au-dessus de l'ancien seuil `taille × 1.6 = 17,6`,
// donc chaque ligne devenait un paragraphe. Mesuré sur un vrai mémoire de
// 75 pages : 1 782 unités de 91 caractères, 39 % du document masqué, 11 min.
l3('PROSE EN INTERLIGNE 1,5', 10, true);
y3 -= 5;
for (const t of [
  'Ce travail porte sur la localisation des jeux vidéo et sur les',
  'échanges entre studios. Il analyse le rôle des éditeurs dans la',
  'diffusion des œuvres, en prenant pour exemple la société',
  'Korrigane Labs, dont le siège se trouve à Nantes. La recherche',
  'a été encadrée par Sébastien Vaquier, professeur des universités,',
  'et suivie par Amandine Rousseau au titre du laboratoire.'
]) l3(t, 11, false, 19);
y3 -= 12;

// Article 9 du RGPD - le plus grave restant. Le modèle inverse les étiquettes
// en français (« diabète de type 2 » → job title 0,04 ; « aide-soignante » →
// medical condition 0,08) et place les vraies valeurs sous le plancher de
// bruit. Ces types sont décochés par défaut ; ce bloc est le témoin.
l3('SITUATION MÉDICALE ET PROFESSIONNELLE (article 9)', 10, true);
l3('Poste occupé : aide-soignante de nuit, service de gériatrie.');
l3('Suivie pour un diabète de type 2 depuis 2021.');
l3('Bénéficie également d’un suivi psychologique.');
l3('Nationalité : portugaise. Formation au lycée Camille-Claudel.');
y3 -= 8;

// P2ter - noms de produits/plateformes tiers : ni technos génériques (qu'on
// garde volontairement), ni entreprises reconnaissables. Angle mort réel.
l3('OUTILS UTILISÉS', 10, true);
l3('Dossiers suivis dans OSCAR CRM, diplômes vérifiés via Scholaro.');
y3 -= 8;

// Tableau - rendu à améliorer (chantier mise en page). Colonnes alignées, une
// ligne d'en-tête qui ne doit PAS être masquée, des cellules qui doivent l'être.
l3('TABLEAU DE SUIVI', 10, true);
const cols = [50, 150, 250, 400];
const tabLigne = (cells, gras = false) => {
  cells.forEach((c, i) => put(p3, c, cols[i], y3, 9, gras));
  y3 -= 14;
};
tabLigne(['Matricule', 'Nom', 'Ville', 'Poste'], true);
tabLigne(['EMP-0012', 'Rousseau', 'Nantes', 'Analyste']);
tabLigne(['EMP-0013', 'Belkacem', 'Rennes', 'Ingénieure']);
tabLigne(['EMP-0014', 'Vaquier', 'Bordeaux', 'Fondateur']);
y3 -= 12;

// Fond noir des png - `encodeImage` bascule en jpeg au-dessus de 128×128 px, et
// le jpeg n'a pas d'alpha : le transparent devient (0,0,0). Cette image fait
// 200×200 avec un disque opaque sur fond transparent - elle déclenche donc le
// chemin jpeg, contrairement au 1×1 opaque de la version précédente.
const png = await doc.embedPng(pngTransparent(200));
p3.drawImage(png, { x: 50, y: y3 - 120, width: 120, height: 120 });
put(p3, 'Figure 1 — le fond de ce disque est TRANSPARENT (doit le rester,', 190, y3 - 60, 8);
put(p3, 'pas devenir noir). Contenu visuel non anonymisé : pas d’OCR.', 190, y3 - 74, 8);


// ═══════════════════════════════════════════════════════════════════════════
// Page 4 - anglophone. Le corpus était à 6 documents sur 7 en français : on ne
// mesurait donc rien hors du français, exactement le mécanisme qui avait laissé
// passer le bug d'interligne (tout le corpus était en interligne simple).
//
// La couche contextuelle est multilingue par nature - le modèle l'est. La
// couche déterministe, elle, est franco-française : c'est ce que cette page
// éprouve en premier, et chaque identifiant US ci-dessous est une fuite
// Attendue tant que P5 (i18n du structuré) n'est pas fait.
// ═══════════════════════════════════════════════════════════════════════════
const p4 = doc.addPage([595, 842]);
let y4 = 790;
const l4 = (t, size = 9, gras = false, pas = 14) => { put(p4, t, 50, y4, size, gras); y4 -= pas; };

l4('APPENDIX 3 — ENGLISH RECORD', 13, true);
y4 -= 10;

// Intitulés anglais : mêmes propriétés formelles qu'en français (capitales,
// court, sans ponctuation, plusieurs dans le document). La règle structurelle
// est indépendante de la langue - cette page le vérifie. Doivent survivre.
l4('SUMMARY', 10, true);
l4('Contract analyst, five years in localisation. Works with Kubernetes');
l4('and PostgreSQL on a daily basis.');
y4 -= 8;

l4('CONTACT DETAILS', 10, true);
// Téléphone au format national américain. La regex FR ne le voit pas, et
// libphonenumber tourne volontairement sans pays par défaut : avec `FR` il
// prend le piège SIREN « 483 921 657 » pour un numéro français.
l4('Phone: (617) 555-0142 — mobile: 617-555-0143');
// SSN : structure 3-2-4, aucun équivalent dans nos motifs.
l4('SSN: 123-45-6789');
// ZIP+4 : notre CODE_postal_ville attend 5 chiffres à la française.
l4('Address: 1600 Amphitheatre Pkwy, Mountain View, CA 94043-1351');
// Date américaine mois-en-premier : « 03/14/1988 » se lit 14 mars aux
// États-Unis et serait invalide en français (mois 14). Ambiguïté réelle.
l4('Date of birth: 03/14/1988 (born on March 14, 1988)');
y4 -= 8;

l4('PEOPLE', 10, true);
// Patronyme composé, hors répertoire occidental courant.
l4('Reviewed by Kwame Nkrumah-Boateng, head of the audit team.');
// Particule irlandaise « Ó » et accents : équivalent de nos « de La ». Les
// accents hors français sont testés ici À dessein - c'est un accent qui avait
// cassé le découpeur de mots de GLiNER.js.
l4('Countersigned by Siobhán Ó Braonáin on the same day.');
l4('Filed by Mary-Jane Watson at the front desk.');
// Entreprise avec esperluette et suffixe juridique.
l4('Counsel: Ravenscroft & Bell LLP, registered in Delaware.');
y4 -= 8;

// Le piège le plus fin de la page : le même mot, une fois nom propre, une fois
// nom commun. « Mr. Baker » est une personne, « the baker » est un métier ;
// « Ms. Rose » est une personne, « a rose grower » ne l'est pas. Aucun lexique
// ne peut trancher - seule la position le peut. Témoin de la passe d'arbitrage
// et de la civilité (honorifics.js).
l4('AMBIGUOUS WORDS', 10, true);
l4('Mr. Baker signed the form; the baker on Oak Street did not.');
l4('Ms. Rose met a rose grower near Green Park last spring.');
y4 -= 8;

// Noms communs que le modèle étiquette volontiers entreprise ou lieu lorsqu'ils
// sont isolés. Doivent survivre.
l4('OTHER SECTIONS', 10, true);
l4('Contents, Overview and Conclusion are listed in the front matter.');

// ═══════════════════════════════════════════════════════════════════════════
// Page 5 - espagnol, aussi fourni que les pages françaises.
//
// POURQUOI L'ESPAGNOL ET PAS LE MANDARIN OU LE HINDI, alors qu'ils sont plus
// parlés : le mode PDF « Préserver » ne sait PAS écrire hors Latin-1.
// `sanitizeForWinAnsi` (pdf-reconstruct.js) remplace tout au-delà de U+00FF
// par « ? » - mesuré : « 张伟在北京工作 » ressort « ??????? ». Tester une langue
// que le moteur ne peut pas restituer ne mesurerait rien. S'y ajoutent la
// police Helvetica standard (Latin-1) et un modèle bâti sur un socle
// anglophone. Voir docs/roadmap-detection.md (limite non-latine).
//
// Le cadrage vise par ailleurs le marché francophone : un indépendant français
// reçoit de l'anglais, de l'espagnol, de l'allemand, de l'italien - Latin-1.
// ═══════════════════════════════════════════════════════════════════════════
const p5 = doc.addPage([595, 842]);
let y5 = 790;
const l5 = (t, size = 9, gras = false, pas = 14) => { put(p5, t, 50, y5, size, gras); y5 -= pas; };

l5('ANEXO 5 — EXPEDIENTE EN ESPAÑOL', 13, true);
y5 -= 10;

// Intitulés espagnols. Doivent survivre (règle formelle, donc universelle).
l5('DATOS PERSONALES', 10, true);

// ── LA SPÉCIFICITÉ ESPAGNOLE N°1 : DEUX PATRONYMES, SANS TRAIT D'UNION.
// « Ruiz Salinas » = nom du père + nom de la mère. Ce ne sont PAS deux
// personnes, et ce n'est pas un patronyme composé à la française (qui, lui,
// porte un trait d'union). Notre pontage (bridgeNameParts) doit relier les
// Deux, sinon la moitié du nom fuit à côté du placeholder.
l5('Nombre: María del Carmen Ruiz Salinas');
// ── SPÉCIFICITÉ N°2 : « María del Carmen » est un PRÉNOM COMPOSÉ unique, très
// courant. La structure réelle est [María del Carmen] [Ruiz] [Salinas] et non
// [María] [del] [Carmen…]. Nos pseudonymes mémorisent par composant : le
// risque est que « Carmen » soit pris pour un patronyme et reçoive un pseudo
// de famille. Piège volontaire, issue non connue d'avance.
l5('Conocida también como Carmen Ruiz en el expediente.');
// DNI : 8 chiffres + lettre de contrôle calculée (n mod 23 dans la table
// TRWAGMYFPDXBNJZSQVHLCKE). Celle-ci est valide - vérifié : 12345678 mod 23
// = 14, quinzième lettre = Z. C'est donc un vrai test de checksum.
l5('DNI: 12345678Z');
// NIE : équivalent du DNI pour les étrangers, préfixé X, Y ou Z. Même clé.
l5('NIE del cónyuge: X1234567L');
// Numéro de sécurité sociale espagnol : 12 chiffres, province + séquence.
l5('Seguridad Social: 28 1234567840');
// IBAN espagnol : 24 caractères contre 27 en France. Le mod-97 est le même -
// notre validateur devrait donc l'accepter sans modification.
l5('IBAN: ES91 2100 0418 4502 0005 1332');
// Téléphones : international (couvert par libphonenumber) puis national (non
// couvert, comme le format US de la page 4). Même variable isolée.
l5('Teléfono: +34 612 345 678 — fijo: 91 234 56 78');
y5 -= 8;

l5('DIRECCIÓN Y FECHAS', 10, true);
// Types de voie espagnols, tous absents de notre motif ADRESSE : Calle,
// Avenida, Plaza, et l'abréviation « C/ » collée au nom.
l5('Calle Mayor 12, 3º B, 28013 Madrid');
l5('Antes en Avenida de la Constitución 45, Sevilla');
l5('Oficina en C/ Gran Vía 28, Plaza de España');
// Code postal espagnol : 5 chiffres, exactement comme la France. Notre motif
// CODE_postal_ville le prendra donc pour un code français - bon résultat,
// mauvaise raison, et ça masquerait tout aussi bien un nombre quelconque.
l5('Código postal 08001 para Barcelona, 41001 para Sevilla.');
// Date en toutes lettres espagnole : « el 14 de marzo de 1988 ». Le contrôle
// de forme est structurel (quantième + année, sans liste de mois) : il doit
// donc marcher ici sans qu'on ait rien ajouté.
l5('Fecha de nacimiento: 14 de marzo de 1988');
// Format numérique espagnol : jour/mois/année, comme en France.
l5('Alta el 03/09/2021, baja el 30/06/2024.');
y5 -= 8;

// ── SPÉCIFICITÉ N°3 : la ponctuation INVERSÉE ¿ ¡ ouvre les phrases. Elle
// colle au premier mot et peut casser une frontière de mot.
l5('OBSERVACIONES', 10, true);
l5('¿Quién firmó el contrato? ¡Fue Carmen Ruiz, no otra persona!');
y5 -= 8;

// Noms communs espagnols que le modèle étiquette volontiers entreprise ou
// lieu quand ils sont isolés. Doivent survivre.
l5('IDIOMAS');
l5('COMPETENCIAS');
l5('EXPERIENCIA LABORAL');
l5('Contenido, Resumen y Conclusión figuran en el índice.');
y5 -= 8;

// Entreprises espagnoles : suffixes juridiques S.L. et S.A., équivalents de
// SARL et SA. Doivent être masqués.
l5('Empleada en Astillero Bermeo S.L., antes en Tejidos Alcázar S.A.');

// ═══════════════════════════════════════════════════════════════════════════
// Page 6 - allemand, aussi fourni que les pages françaises.
// ═══════════════════════════════════════════════════════════════════════════
const p6 = doc.addPage([595, 842]);
let y6 = 790;
const l6 = (t, size = 9, gras = false, pas = 14) => { put(p6, t, 50, y6, size, gras); y6 -= pas; };

l6('ANLAGE 6 — DEUTSCHE AKTE', 13, true);
y6 -= 10;

l6('PERSÖNLICHE DATEN', 10, true);

// ┌───────────────────────────────────────────────────────────────────────────┐
// │ SPÉCIFICITÉ ALLEMANDE N°1, et elle touche le moteur au cœur :             │
// │ l'allemand met une majuscule à tous les noms communs.                     │
// │                                                                           │
// │ `estPlausiblePourLeType` (gliner.js) écarte les faux positifs             │
// │ PER/ORG/LIEU en exigeant « au moins une majuscule » - la garde P6, qui a  │
// │ fait passer les termes préservés de 90 à 95 %. Cette garde ne filtre      │
// │ strictement rien en allemand.                                             │
// │ Première mesure (07/08) : 1 nom commun masqué sur 3. À re-mesurer ici     │
// │ sur un échantillon plus large.                                            │
// └───────────────────────────────────────────────────────────────────────────┘
// Douze noms communs capitalisés, tous à faire survivre.
l6('Die Besprechung über den Vertrag fand im Unternehmen statt.');
l6('Der Antrag, die Bescheinigung und die Rechnung fehlen noch.');
l6('Das Ergebnis der Prüfung liegt der Abteilung vor.');
y6 -= 8;

// ── SPÉCIFICITÉ N°2 : les MOTS COMPOSÉS soudés. L'allemand agglutine sans
// espace ni trait d'union. Aucune segmentation par espace ne retrouvera les
// composants - et ces mots dépassent souvent 20 caractères, ce qui peut les
// faire prendre pour des identifiants.
l6('Krankenversicherungsnummer und Aufenthaltsgenehmigung liegen bei.');
y6 -= 8;

// ── SPÉCIFICITÉ N°3 : le tréma a une TRANSCRIPTION alternative officielle
// (ü = ue, ö = oe, ä = ae, ß = ss). La même personne s'écrit donc de deux
// façons dans un même dossier. Nos placeholders sont cohérents par valeur :
// « Müller » et « Mueller » recevront donc deux identités différentes, alors
// que c'est la même personne. Piège réel, sans correctif prévu à ce jour.
l6('Unterzeichnet von Jürgen Müller, auch geschrieben Juergen Mueller.');
// Particule allemande en deux mots, équivalent de « de la ».
l6('Beglaubigt durch Katharina von der Weiden.');
// Particule simple, très fréquente dans les patronymes.
l6('Vertreten durch Heinrich zu Guttenberg und Anna von Stein.');
y6 -= 8;

l6('ANSCHRIFT UND KENNZAHLEN', 10, true);
// Type de voie soudé au nom (Haupt + straße). Le ß est un caractère à part
// entière, pas deux « s ».
l6('Anschrift: Hauptstraße 15, 10115 Berlin');
// Abréviation soudée « str. », très courante.
l6('Zweigstelle: Bahnhofstr. 7a, 80331 München');
// Code postal allemand : 5 chiffres, comme la France et l'Espagne.
l6('Postleitzahl 20095 für Hamburg, 50667 für Köln.');
// Steuer-ID : 11 chiffres, avec une clé de contrôle.
l6('Steuer-ID: 12345678901');
// IBAN allemand : 22 caractères. Même mod-97 que la France.
l6('IBAN: DE89 3704 0044 0532 0130 00');
// Téléphone : international puis national, même isolement de variable qu'en
// anglais et en espagnol.
l6('Telefon: +49 30 123456 — Festnetz: 030 1234567');
y6 -= 8;

// ── SPÉCIFICITÉ N°4 : la date allemande porte un POINT après le quantième
// (14. März), et le format numérique utilise des points comme séparateurs.
l6('Geburtsdatum: 14. März 1988 — im System: 14.03.1988');
y6 -= 8;

// Intitulés allemands. Doivent survivre.
l6('SPRACHEN');
l6('AUSBILDUNG');
l6('BERUFSERFAHRUNG');
y6 -= 8;

// Entreprises allemandes : GmbH et AG, équivalents de SARL et SA.
l6('Tätig bei Nordwind Logistik GmbH, zuvor bei Kranzler AG.');

writeFileSync(join(here, 'tous-defauts.pdf'), await doc.save());
console.log('tests/manuel/tous-defauts.pdf généré (6 pages).');
