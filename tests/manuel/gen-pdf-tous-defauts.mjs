// Génère tests/manuel/tous-defauts.pdf — LE document à charger dans un Chrome
// en mode développeur pour éprouver l'extension d'un seul coup.
//
// Différence avec tests/bench/corpus/ : le banc MESURE (verdict chiffré, sans
// intervention humaine) ; ce document-ci se REGARDE. Il empile délibérément
// tous les défauts rencontrés depuis le début du projet, y compris ceux qu'on
// sait encore non corrigés — pour qu'un passage manuel les montre tous au
// même endroit au lieu de les redécouvrir un par un sur de vrais fichiers.
//
// La carte « quoi tester / quoi attendre » est dans tests/manuel/README.md.
// Aucun marqueur ([T1], [T2]…) n'est imprimé dans le PDF : il finirait dans le
// flux de texte soumis au modèle et fausserait ce qu'on veut observer.
//
// TOUTES les valeurs sont fictives et reconnaissables comme telles (carte
// 4242…, domaines .example) — règle du projet : ne jamais committer de données
// ressemblant à du réel.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

// Métadonnées porteuses de PII : ce que l'utilisateur oublie systématiquement.
doc.setTitle('CV Éléonore Vasseur - candidature alternance');
doc.setAuthor('Éléonore Vasseur');
doc.setSubject('Dossier de candidature - Korrigane Labs');
doc.setCreator('Microsoft Word - CV_VASSEUR_v3_final.docx');

// ===========================================================================
// PAGE 1 — un CV en DEUX COLONNES (le format le plus dur, et le plus sensible)
// ===========================================================================
const p1 = doc.addPage([595, 842]);
const put = (page, text, x, y, size = 8, gras = false) =>
  page.drawText(text, { x, y, size, font: gras ? bold : font, color: rgb(0, 0, 0) });

// -- En-tête pleine largeur.
// Nom TOUT-MAJUSCULE, seul sur sa ligne, en très grande police : sur un vrai
// CV ce cas ne sort qu'à 0,47 (d'où le seuil du groupe identité à 0,45) et en
// DEUX spans séparés, donc il éprouve aussi le pontage. Les accents éprouvent
// le découpeur de mots corrigé au runtime (sans le correctif, « Éléonore »
// est découpé en « ' » + « l' » + « onore » et l'entité est RATÉE).
put(p1, 'ÉLÉONORE VASSEUR', 50, 790, 21, true);
put(p1, 'Développeuse Data & Backend', 50, 772, 10);
put(p1, 'e.vasseur@courriel.example - 06 44 55 66 77 - Nantes', 50, 757, 8);
put(p1, 'linkedin.com/in/eleonore-vasseur', 50, 745, 8);

// -- Deux colonnes. Les Y sont VOLONTAIREMENT alignés : c'est ce qui provoque
// le recollage de lignes entre colonnes quand la gouttière n'est pas vue
// (« COMPÉTENCESEXPÉRIENCES » soumis tel quel au modèle).
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

// MOT COUPÉ EN FIN DE LIGNE (P1bis) : lignes rapprochées (12 pt), donc même
// paragraphe. Sans le recollage, « vante » est soumis isolée au modèle.
put(p1, 'Linux - Bash', G, 638);
put(p1, 'Stage chez Wobix Labs, développement d’une interface inno-', D, 638);
put(p1, 'vante pour la gestion des données clients.', D, 626);

put(p1, 'FORMATION', G, 612, 10, true);
put(p1, 'Juin 2023 - Août 2023', D, 612);

// « BUT Informatique » : sur-masquage CONNU et non corrigé (« Informatique »
// sort en poste à 0,85 sur une unité courte). Doit survivre le jour où P2bis
// sera traité — sert de témoin en attendant.
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

// -- Pied de page.
// « Korrigane Labs » SEULE sur sa ligne : indétectable ici faute de contexte,
// donc seule la PROPAGATION peut la masquer. C'est le test de la fuite P0 —
// elle n'apparaissait que dans le fichier réécrit, jamais dans l'aperçu.
put(p1, 'Korrigane Labs', G, 480);
// Patronyme de 8 MAJUSCULES : « ROUSSEAU » matche le motif BIC et annulait le
// nom entier, laissant « Amandine » en clair à côté du placeholder.
put(p1, 'Recommandation : Amandine ROUSSEAU', G, 468);
put(p1, 'Référence disponible sur demande - Sébastien de La Villardière', G, 456);

// ===========================================================================
// PAGE 2 — annexe administrative : le structuré, et les pièges de faible contexte
// ===========================================================================
const p2 = doc.addPage([595, 842]);
let y = 790;
const ligne = (t, size = 9, gras = false) => { put(p2, t, 50, y, size, gras); y -= 14; };
const saut = (n = 1) => { y -= 14 * n; };

ligne('ANNEXE — DOSSIER ADMINISTRATIF', 13, true);
saut();

// Civilité suivie d'une LIGNE VIDE puis d'un titre de section : le motif
// « civilité + nom » séparait ses composants par \s+, qui traverse le saut de
// paragraphe — le titre était masqué avec le nom.
ligne('Tuteur pédagogique : Madame Hélène Brassard');
saut();
ligne('SOMMAIRE', 10, true);

// Sommaire à points de suite (P2bis) : fragments sans structure de phrase,
// le pire cas connu pour le sur-masquage.
ligne('Introduction...................................................3');
ligne('1) L’entreprise................................................5');
ligne('2) La vérité terrain...........................................8');
ligne('3) Exécution des tâches.......................................11');
saut();

ligne('IDENTIFIANTS', 10, true);
// Structuré : la couche déterministe doit TOUT attraper, sans exception.
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
ligne('Téléphone US : +1 617 555 0142');
ligne('Contact : contact@korrigane-labs.example');
// Ce nombre est un PIÈGE : Luhn-invalide comme SIREN, et libphonenumber le
// prend pour un numéro français si on lui donne un pays par défaut.
ligne('Numéro de dossier interne : 483 921 657');
saut();

ligne('ÉTAT CIVIL', 10, true);
ligne('Née le 16 octobre 2004 à Sarcelles (095)');
ligne('Second candidat born on March 14, 1988 in Springfield 97477');
saut();

ligne('AUTRES CANDIDATS', 10, true);
// Deux patronymes historiquement ratés (roadmap P-noms).
ligne('Ahmed Al-Mansour — dossier complet');
ligne('Clara SCHNEIDER — en attente');
// Prénom SEUL réutilisé plus loin : la propagation travaille sur la valeur
// entière, donc « Éléonore » isolée reste en clair (fuite connue, non corrigée).
ligne('Éléonore a transmis ses relevés le 12 mars.');
saut();

// Valeurs ISOLÉES sans aucun contexte : le cas que seul le zero-shot traite.
ligne('CELLULES NUES', 10, true);
ligne('1988-03-14');
ligne('EMP-0012');
ligne('Villetaneuse');
saut();

// Caractères hors WinAnsi : ont déjà fait planter la reconstruction.
ligne('Réunion « stratégie » — cœur du sujet… voir a@b.example');
saut();

// Image embarquée : éprouve le ré-embarquement en mode « Préserver » (et sa
// disparition annoncée en mode « Alléger »). 1×1 rouge, étirée pour être vue.
const png = await doc.embedPng(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
));
p2.drawImage(png, { x: 50, y: y - 90, width: 160, height: 80 });
put(p2, 'Figure 1 — photo d’identité (contenu visuel NON anonymisé : pas d’OCR)', 50, y - 104, 7);

writeFileSync(join(here, 'tous-defauts.pdf'), await doc.save());
console.log('tests/manuel/tous-defauts.pdf généré.');
