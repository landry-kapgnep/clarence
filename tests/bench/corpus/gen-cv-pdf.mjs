// Génère tests/bench/corpus/cv-fr.pdf - le document le plus DUR du corpus.
// Même convention que tests/fixtures/gen-*-fixture.mjs : reproductible et
// committé, jamais un blob opaque.
//
// Il reproduit délibérément ce qui casse la détection sur un vrai CV, et qui
// est mesuré dans docs/roadmap-detection.md (P1/P1bis) :
//
// 1. DEUX COLONNES. C'est le point central : `groupIntoLines` regroupe par
//    coordonnée Y, donc deux textes à la même hauteur dans des colonnes
//    différentes sont recollés en une seule ligne (« COMPÉTENCES » +
//    « EXPÉRIENCES » → « COMPÉTENCESEXPÉRIENCES »). Le modèle reçoit alors du
//    charabia et l'étiquette confiamment.
// 2. NOM EN TÊTE, TOUT-MAJUSCULE, seul sur sa ligne en très grande police -
//    sort à peine au-dessus du seuil (0,47 mesuré sur un vrai CV).
// 3. TECHNOS à préserver : masquer React/Docker rend le CV inexploitable.
// 4. Titres de sections en majuscules, candidats naturels au faux positif.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

const page = doc.addPage([595, 842]);
const put = (text, x, y, size = 9, bold = false) =>
  page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });

// --- En-tête pleine largeur : le nom, en très grande police.
put('KAROLINE ANSELME', 50, 790, 21, true);
put('Développeuse Data & Backend', 50, 772, 10);
put('k.anselme@courriel.example - 06 44 55 66 77 - Nantes', 50, 757, 8);
put('linkedin.com/in/karoline-anselme', 50, 745, 8);

// --- Deux colonnes à partir d'ici. Les Y sont VOLONTAIREMENT alignés entre
// les deux colonnes : c'est ce qui provoque le recollage des lignes.
const G = 50;   // colonne gauche
const D = 320;  // colonne droite

put('COMPETENCES', G, 715, 10, true);
put('EXPERIENCES PROFESSIONNELLES', D, 715, 10, true);

put('Python - Pandas - NumPy', G, 698, 8);
put('Alternance chez Korrigane Labs', D, 698, 8);

put('React.js - FastAPI - Django', G, 686, 8);
put('Sept. 2024 - Aout 2025', D, 686, 8);

put('Docker - docker-compose', G, 674, 8);
put('Conception d une chaine applicative', D, 674, 8);

put('PostgreSQL - MariaDB - MongoDB', G, 662, 8);
put('de traitement automatisee des dossiers.', D, 662, 8);

put('Git - GitHub - GitLab', G, 650, 8);
put('Encadree par Sebastien Vaquier.', D, 650, 8);

put('Linux - Bash', G, 638, 8);
put('Stage chez Wobix Labs, developpement d’une interface inno-', D, 638, 8);
// Lignes RAPPROCHÉES (12pt d'écart, sous le seuil PARAGRAPH_GAP_RATIO*taille
// comme les autres lignes de cette colonne) : même paragraphe, mot coupé en
// fin de ligne - reproduit le mécanisme réel de P1bis (« auto- »/« matisée »
// sur un vrai CV). Sans le correctif, « vante » isolée est soumise telle
// quelle au modèle contextuel.
put('vante pour la gestion des donnees clients.', D, 626, 8);

put('FORMATION', G, 612, 10, true);
put('Juin 2023 - Aout 2023', D, 612, 8);

put('BUT Informatique', G, 595, 8);
put('Developpement d outils internes', D, 595, 8);

put('IUT de Villetaneuse', G, 583, 8);
put('pour l equipe support.', D, 583, 8);

put('2023 - 2026', G, 571, 8);

put('LANGUES', G, 545, 10, true);
put('CENTRES D INTERET', D, 545, 10, true);

put('Francais - langue maternelle', G, 528, 8);
put('Photographie argentique', D, 528, 8);

put('Anglais - C1', G, 516, 8);
put('Course a pied', D, 516, 8);

// --- Pied de page : une valeur RÉPÉTÉE, seule sur sa ligne, sans contexte.
// C'est ce qui rend le banc capable de voir la fuite P0 : « Korrigane Labs »
// est détectable plus haut (« Alternance chez Korrigane Labs ») mais pas ici,
// où seule la PROPAGATION peut la masquer. Si la propagation n'atteint pas la
// liste d'entités, le PDF reconstruit la laisse en clair - exactement le bug
// constaté sur un vrai rapport de stage. Sans cette ligne, le corpus ne
// couvre pas la classe de bug qui a motivé ce banc.
put('Korrigane Labs', G, 480, 8);
put('Reference disponible sur demande - Sebastien Vaquier', G, 468, 8);

writeFileSync(join(here, 'cv-fr.pdf'), await doc.save());
console.log('cv-fr.pdf généré.');
