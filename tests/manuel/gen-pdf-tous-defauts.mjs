// Génère tests/manuel/tous-defauts.pdf — LA VÉRITÉ TERRAIN INVERSÉE.
//
// Ce document empile DÉLIBÉRÉMENT tous les défauts rencontrés depuis le début
// du projet : c'est le pire cas d'usage imaginable, pas un document réaliste.
// Règle de clôture posée le 05/08/2026 : **le dossier détection ne se ferme
// que lorsque ce fichier ressort correctement anonymisé.**
//
// Chaque bloc porte en commentaire le défaut qu'il éprouve et sa référence
// dans docs/roadmap-detection.md. Ne RIEN retirer d'ici sans avoir vérifié que
// le défaut correspondant est corrigé ET couvert ailleurs : ce fichier est la
// mémoire vivante des régressions possibles.
//
// La carte « quoi regarder / quoi attendre » est dans tests/manuel/README.md.
// Aucun marqueur ([T1], [T2]…) n'est imprimé : il finirait dans le flux soumis
// au modèle et fausserait ce qu'on observe.
//
// TOUTES les valeurs sont fictives et reconnaissables comme telles (carte
// 4242…, domaines .example) — règle du projet.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));

// ── Écriture d'un PNG RGBA à la main ────────────────────────────────────────
// Nécessaire pour éprouver le bug du FOND NOIR : `encodeImage`
// (pdf-reconstruct.js) bascule en JPEG dès que l'image dépasse 128×128 px, et
// le JPEG n'a pas de canal alpha — le transparent devient (0,0,0), donc noir.
// Une image 1×1 opaque (l'ancienne version de ce fichier) ne déclenchait pas
// ce chemin : il FAUT une image transparente et assez grande.
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

// Disque coloré opaque sur fond TRANSPARENT.
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
// PAGE 1 — CV DEUX COLONNES (le format le plus dur, et le plus sensible)
// ═══════════════════════════════════════════════════════════════════════════
const p1 = doc.addPage([595, 842]);

// Nom TOUT-MAJUSCULE, seul sur sa ligne, en très grande police. Sur un vrai CV
// ce cas ne sort qu'à 0,47 (d'où le seuil du groupe identité à 0,38) et en DEUX
// spans séparés, donc il éprouve aussi le pontage. Les accents éprouvent le
// découpeur de mots corrigé au runtime : sans le correctif, « Éléonore » est
// découpé en trois et l'entité est RATÉE.
put(p1, 'ÉLÉONORE VASSEUR', 50, 790, 21, true);
put(p1, 'Développeuse Data & Backend', 50, 772, 10);
put(p1, 'e.vasseur@courriel.example - 06 44 55 66 77 - Nantes', 50, 757, 8);
put(p1, 'linkedin.com/in/eleonore-vasseur', 50, 745, 8);

// Deux colonnes, Y VOLONTAIREMENT alignés : c'est ce qui provoque le recollage
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

// P1bis — MOT COUPÉ EN FIN DE LIGNE. Lignes rapprochées (12 pt) donc même
// paragraphe. Sans le recollage, « vante » est soumis isolée au modèle.
put(p1, 'Linux - Bash', G, 638);
put(p1, 'Stage chez Wobix Labs, développement d’une interface inno-', D, 638);
put(p1, 'vante pour la gestion des données clients.', D, 626);

put(p1, 'FORMATION', G, 612, 10, true);
put(p1, 'Juin 2023 - Août 2023', D, 612);

// Sur-masquage CONNU et non corrigé : « Informatique » sort en ENTREPRISE à
// 0,47 sur une unité courte. Témoin — doit survivre le jour où ce sera traité.
put(p1, 'BUT Informatique', G, 595);
put(p1, 'Développement d’outils internes', D, 595);

// « SIGLE de Ville » : le pontage en faisait un [PERSONNE_1] avalant le sigle.
put(p1, 'IUT de Villetaneuse', G, 583);
put(p1, 'pour l’équipe support.', D, 583);

put(p1, '2023 - 2026', G, 571);

put(p1, 'LANGUES', G, 545, 10, true);
put(p1, 'CENTRES D’INTÉRÊT', D, 545, 10, true);

put(p1, 'Français - langue maternelle', G, 528);
put(p1, 'Photographie argentique', D, 528);

put(p1, 'Anglais - C1', G, 516);
put(p1, 'Course à pied', D, 516);

// P0 — « Korrigane Labs » SEULE sur sa ligne : indétectable ici faute de
// contexte, donc seule la PROPAGATION peut la masquer. La fuite n'apparaissait
// que dans le fichier réécrit, jamais dans l'aperçu.
put(p1, 'Korrigane Labs', G, 480);
// Patronyme de 8 MAJUSCULES : « ROUSSEAU » matche le motif BIC et annulait le
// nom entier, laissant « Amandine » en clair à côté du placeholder.
put(p1, 'Recommandation : Amandine ROUSSEAU', G, 468);
put(p1, 'Référence disponible sur demande - Sébastien de La Villardière', G, 456);

// P7 — LIGNE QUI DÉBORDE. Ligne longue dont la valeur finale devient un
// placeholder PLUS LONG : le fragment sortait alors hors page, invisible à
// l'écran ET perdu à la relecture (pdfjs ne rend pas les glyphes hors cadre).
put(p1, 'Merci d’adresser toute correspondance relative à ce dossier à l’adresse suivante : e.vasseur@courriel.example', 50, 430, 9);

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 2 — annexe administrative : le structuré, et les pièges de faible contexte
// ═══════════════════════════════════════════════════════════════════════════
const p2 = doc.addPage([595, 842]);
let y = 790;
const ligne = (t, size = 9, gras = false) => { put(p2, t, 50, y, size, gras); y -= 14; };
const saut = (n = 1) => { y -= 14 * n; };

ligne('ANNEXE — DOSSIER ADMINISTRATIF', 13, true);
saut();

// Le motif « civilité + nom » séparait ses composants par \s+, qui traverse le
// saut de paragraphe : le titre de section était masqué AVEC le nom.
ligne('Tuteur pédagogique : Madame Hélène Brassard');
saut();
ligne('SOMMAIRE', 10, true);

// P2bis — sommaire à points de suite : fragments sans structure de phrase,
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
// P2ter — adresse ABRÉGÉE : le motif ADRESSE ne couvre pas « Av. », le nom de
// voie sortait en PERSONNE et le numéro restait en clair.
ligne('Second site : 99 Av. Jean Jaurès, 93430 Villetaneuse');
ligne('Téléphone US : +1 617 555 0142');
ligne('Contact : contact@korrigane-labs.example');
// PIÈGE : Luhn-invalide comme SIREN, et libphonenumber le prend pour un numéro
// français si on lui donne un pays par défaut.
ligne('Numéro de dossier interne : 483 921 657');
saut();

ligne('ÉTAT CIVIL', 10, true);
ligne('Née le 16 octobre 2004 à Sarcelles (095)');
ligne('Second candidat born on March 14, 1988 in Springfield 97477');
// Piège MESURÉ : accoler le libellé à la valeur fait CHUTER la détection —
// 0,74 sur le libellé, 0,15 sur la vraie date. L'isolement est un atout.
ligne('Date de naissance : 1991-07-23');
saut();

ligne('AUTRES CANDIDATS', 10, true);
// Deux patronymes historiquement ratés.
ligne('Ahmed Al-Mansour — dossier complet');
ligne('Clara SCHNEIDER — en attente');
// Prénom SEUL réutilisé plus loin : la propagation ne travaillait que sur la
// valeur entière, « Éléonore » restait donc en clair.
ligne('Éléonore a transmis ses relevés le 12 mars.');
// Propagation par composant SENSIBLE À LA CASSE : sans ça, « Rose Fontaine »
// ferait disparaître toutes les « rose » communes du document.
ligne('Rose Fontaine cultive une rose ancienne dans son jardin.');
// LIMITE ASSUMÉE du filtre de casse : un nom tapé tout en minuscules n'est
// plus vu par la couche contextuelle. Témoin de cette limite, pas un objectif.
ligne('Noté à la volée : jean dupont doit rappeler lundi.');
saut();

// Valeurs ISOLÉES sans aucun contexte : le cas que seul le zero-shot traite.
ligne('CELLULES NUES', 10, true);
ligne('1988-03-14');
ligne('EMP-0012');
ligne('Villetaneuse');
saut();

// Caractères hors WinAnsi : ont déjà fait planter la reconstruction.
ligne('Réunion « stratégie » — cœur du sujet… voir a@b.example');

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3 — les cas ajoutés le 05/08 : interligne, article 9, tableau, image
// ═══════════════════════════════════════════════════════════════════════════
const p3 = doc.addPage([595, 842]);
let y3 = 790;
const l3 = (t, size = 9, gras = false, pas = 14) => { put(p3, t, 50, y3, size, gras); y3 -= pas; };

l3('ANNEXE 2 — CAS DIFFICILES', 13, true);
y3 -= 10;

// P8 — INTERLIGNE 1,5, le plus gros défaut de mise en page rencontré.
// Police 11, écart 19 pt : au-dessus de l'ancien seuil `taille × 1.6 = 17,6`,
// donc CHAQUE LIGNE devenait un paragraphe. Mesuré sur un vrai mémoire de
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

// Article 9 du RGPD — le plus grave restant. Le modèle INVERSE les étiquettes
// en français (« diabète de type 2 » → job title 0,04 ; « aide-soignante » →
// medical condition 0,08) et place les vraies valeurs sous le plancher de
// bruit. Ces types sont DÉCOCHÉS par défaut ; ce bloc est le témoin.
l3('SITUATION MÉDICALE ET PROFESSIONNELLE (article 9)', 10, true);
l3('Poste occupé : aide-soignante de nuit, service de gériatrie.');
l3('Suivie pour un diabète de type 2 depuis 2021.');
l3('Bénéficie également d’un suivi psychologique.');
l3('Nationalité : portugaise. Formation au lycée Camille-Claudel.');
y3 -= 8;

// P2ter — noms de produits/plateformes tiers : ni technos génériques (qu'on
// garde volontairement), ni entreprises reconnaissables. Angle mort réel.
l3('OUTILS UTILISÉS', 10, true);
l3('Dossiers suivis dans OSCAR CRM, diplômes vérifiés via Scholaro.');
y3 -= 8;

// TABLEAU — rendu à améliorer (chantier mise en page). Colonnes alignées, une
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

// FOND NOIR DES PNG — `encodeImage` bascule en JPEG au-dessus de 128×128 px, et
// le JPEG n'a pas d'alpha : le transparent devient (0,0,0). Cette image fait
// 200×200 avec un disque opaque sur fond TRANSPARENT — elle déclenche donc le
// chemin JPEG, contrairement au 1×1 opaque de la version précédente.
const png = await doc.embedPng(pngTransparent(200));
p3.drawImage(png, { x: 50, y: y3 - 120, width: 120, height: 120 });
put(p3, 'Figure 1 — le fond de ce disque est TRANSPARENT (doit le rester,', 190, y3 - 60, 8);
put(p3, 'pas devenir noir). Contenu visuel non anonymisé : pas d’OCR.', 190, y3 - 74, 8);


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4 — ANGLOPHONE. Le corpus était à 6 documents sur 7 en français : on ne
// mesurait donc RIEN hors du français, exactement le mécanisme qui avait laissé
// passer le bug d'interligne (tout le corpus était en interligne simple).
//
// La couche contextuelle est multilingue par nature — le modèle l'est. La
// couche DÉTERMINISTE, elle, est franco-française : c'est ce que cette page
// éprouve en premier, et chaque identifiant US ci-dessous est une fuite
// ATTENDUE tant que P5 (i18n du structuré) n'est pas fait.
// ═══════════════════════════════════════════════════════════════════════════
const p4 = doc.addPage([595, 842]);
let y4 = 790;
const l4 = (t, size = 9, gras = false, pas = 14) => { put(p4, t, 50, y4, size, gras); y4 -= pas; };

l4('APPENDIX 3 — ENGLISH RECORD', 13, true);
y4 -= 10;

// Intitulés anglais : mêmes propriétés formelles qu'en français (capitales,
// court, sans ponctuation, plusieurs dans le document). La règle structurelle
// est indépendante de la langue — cette page le vérifie. Doivent SURVIVRE.
l4('SUMMARY', 10, true);
l4('Contract analyst, five years in localisation. Works with Kubernetes');
l4('and PostgreSQL on a daily basis.');
y4 -= 8;

l4('CONTACT DETAILS', 10, true);
// Téléphone au format NATIONAL américain. La regex FR ne le voit pas, et
// libphonenumber tourne volontairement SANS pays par défaut : avec `FR` il
// prend le piège SIREN « 483 921 657 » pour un numéro français.
l4('Phone: (617) 555-0142 — mobile: 617-555-0143');
// SSN : structure 3-2-4, aucun équivalent dans nos motifs.
l4('SSN: 123-45-6789');
// ZIP+4 : notre CODE_POSTAL_VILLE attend 5 chiffres à la française.
l4('Address: 1600 Amphitheatre Pkwy, Mountain View, CA 94043-1351');
// Date américaine mois-en-premier : « 03/14/1988 » se lit 14 mars aux
// États-Unis et serait INVALIDE en français (mois 14). Ambiguïté réelle.
l4('Date of birth: 03/14/1988 (born on March 14, 1988)');
y4 -= 8;

l4('PEOPLE', 10, true);
// Patronyme composé, hors répertoire occidental courant.
l4('Reviewed by Kwame Nkrumah-Boateng, head of the audit team.');
// Particule irlandaise « Ó » et accents : équivalent de nos « de La ». Les
// accents hors français sont testés ici À DESSEIN — c'est un accent qui avait
// cassé le découpeur de mots de GLiNER.js.
l4('Countersigned by Siobhán Ó Braonáin on the same day.');
l4('Filed by Mary-Jane Watson at the front desk.');
// Entreprise avec esperluette et suffixe juridique.
l4('Counsel: Ravenscroft & Bell LLP, registered in Delaware.');
y4 -= 8;

// LE PIÈGE LE PLUS FIN DE LA PAGE : le MÊME mot, une fois nom propre, une fois
// nom commun. « Mr. Baker » est une personne, « the baker » est un métier ;
// « Ms. Rose » est une personne, « a rose grower » ne l'est pas. Aucun lexique
// ne peut trancher — seule la position le peut. Témoin de la passe d'arbitrage
// et de la civilité (honorifics.js).
l4('AMBIGUOUS WORDS', 10, true);
l4('Mr. Baker signed the form; the baker on Oak Street did not.');
l4('Ms. Rose met a rose grower near Green Park last spring.');
y4 -= 8;

// Noms COMMUNS que le modèle étiquette volontiers entreprise ou lieu lorsqu'ils
// sont isolés. Doivent SURVIVRE.
l4('OTHER SECTIONS', 10, true);
l4('Contents, Overview and Conclusion are listed in the front matter.');

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 5 — ESPAGNOL ET ALLEMAND, volontairement COURTS et intégralement glosés
// dans tests/manuel/README.md. Raison assumée : le propriétaire du projet lit
// le français et l'anglais ; un jeu de test qu'on ne peut pas relire soi-même
// est une dette, pas un actif. Chaque terme y est traduit.
// ═══════════════════════════════════════════════════════════════════════════
const p5 = doc.addPage([595, 842]);
let y5 = 790;
const l5 = (t, size = 9, gras = false, pas = 14) => { put(p5, t, 50, y5, size, gras); y5 -= pas; };

l5('APPENDIX 4 — ES / DE', 13, true);
y5 -= 10;

l5('SECCIÓN EN ESPAÑOL', 10, true);
// Intitulés espagnols — doivent SURVIVRE.
l5('IDIOMAS');
l5('COMPETENCIAS');
// DNI : 8 chiffres + une lettre de contrôle CALCULÉE, exactement le genre de
// validation mathématique que la couche déterministe sait faire (comme la clé
// du NIR). Candidat naturel à l'i18n du structuré.
l5('DNI: 12345678Z — teléfono: +34 612 345 678');
// Type de voie espagnol, inconnu de notre motif ADRESSE.
l5('Dirección: Calle Mayor 12, 28013 Madrid');
// Particule « del », équivalent de nos « de la » (voir PARTICLE dans ner.js).
l5('Firmado por María del Carmen Ruiz-Salinas.');
y5 -= 10;

l5('DEUTSCHER ABSCHNITT', 10, true);
// ┌───────────────────────────────────────────────────────────────────────────┐
// │ LA SPÉCIFICITÉ ALLEMANDE, et elle touche le moteur au cœur :              │
// │ l'allemand met une MAJUSCULE À TOUS LES NOMS COMMUNS.                     │
// │                                                                           │
// │ Or `estPlausiblePourLeType` (gliner.js) écarte les faux positifs          │
// │ PER/ORG/LIEU en exigeant « au moins une majuscule » — la garde P6, qui a  │
// │ fait passer les termes préservés de 90 à 95 %. Cette garde ne filtre      │
// │ STRICTEMENT RIEN en allemand : Besprechung, Vertrag, Unternehmen la       │
// │ passent tous les trois.                                                   │
// │                                                                           │
// │ C'est une limite STRUCTURELLE du moteur, pas un réglage à ajuster — et    │
// │ elle n'était mesurée nulle part avant cette page.                         │
// └───────────────────────────────────────────────────────────────────────────┘
l5('SPRACHEN');
l5('AUSBILDUNG');
// Trois noms COMMUNS, tous capitalisés par la grammaire. Doivent SURVIVRE.
l5('Die Besprechung über den Vertrag fand im Unternehmen statt.');
// Type de voie allemand COLLÉ au nom (Hauptstraße = « rue principale »), et
// code postal à 5 chiffres comme en France — donc faux positif possible sur
// CODE_POSTAL_VILLE, qui suppose une ville française derrière.
l5('Anschrift: Hauptstraße 15, 10115 Berlin');
// Particule « von der », équivalent de « de la ».
l5('Unterzeichnet von Jürgen von der Weiden am 14. März 1988.');

writeFileSync(join(here, 'tous-defauts.pdf'), await doc.save());
console.log('tests/manuel/tous-defauts.pdf généré (5 pages).');
