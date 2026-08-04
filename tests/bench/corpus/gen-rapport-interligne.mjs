// Génère tests/bench/corpus/rapport-interligne.pdf — le document qui MANQUAIT
// au corpus, et dont l'absence a laissé vivre un bug pendant des mois.
//
// Tout le reste du corpus est en interligne SIMPLE. Or le seuil de paragraphe
// comparait l'écart entre lignes à la taille de POLICE : sur un document en
// interligne 1,5 (police 11, écart 19 contre un seuil à 17,7), chaque ligne
// devenait un paragraphe. Mesuré sur un vrai mémoire de 75 pages : 1 782
// unités de 91 caractères médians dont 52 % coupaient une phrase, 39 % du
// document masqué, 11 minutes de traitement.
//
// Ce document reproduit exactement ce réglage typographique — c'est celui de
// la quasi-totalité des mémoires, rapports et articles académiques.
//
// Valeurs TOUTES fictives (.example) — règle du projet.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const page = doc.addPage([595, 842]);

const TAILLE = 11;
const INTERLIGNE = 19;      // 1,5 — au-dessus de TAILLE × 1.6 = 17,6
const SAUT_PARAGRAPHE = 38; // un vrai saut, le double

let y = 780;
const ligne = (t, gras = false) => {
  page.drawText(t, { x: 60, y, size: TAILLE, font: gras ? bold : font, color: rgb(0, 0, 0) });
  y -= INTERLIGNE;
};
const saut = () => { y -= SAUT_PARAGRAPHE - INTERLIGNE; };

ligne('MEMOIRE DE RECHERCHE', true);
saut();

// Paragraphe long en prose continue : c'est LUI qui doit ressortir en une
// seule unité. Les entités y sont noyées dans du texte ordinaire, comme dans
// un vrai document — contrairement aux fixtures où elles sont isolées.
ligne('Ce travail porte sur la localisation des jeux video et sur les');
ligne('echanges entre studios. Il analyse le role des editeurs dans la');
ligne('diffusion des oeuvres, en prenant pour exemple la societe');
ligne('Korrigane Labs, dont le siege se trouve a Nantes. La recherche');
ligne('a ete encadree par Sebastien Vaquier, professeur des universites,');
ligne('et suivie par Amandine Rousseau au titre du laboratoire.');
saut();

ligne('L industrie du jeu video se caracterise par un echange');
ligne('transnational ou le leadership se deplace au fil des annees. Le');
ligne('protagoniste d une oeuvre et ses compagnons portent une culture');
ligne('qui se transforme a chaque adaptation. Cette dynamique explique');
ligne('pourquoi les entreprises transnationales investissent autant dans');
ligne('la traduction et dans l adaptation des contenus.');
saut();

ligne('Contact du laboratoire : recherche@korrigane-labs.example ou par');
ligne('telephone au 02 40 11 22 33 pour toute demande de consultation');
ligne('des travaux anterieurs deposes aupres du service documentaire.');
saut();

ligne('La methode retenue combine Python et PostgreSQL pour le');
ligne('traitement des corpus, avec Docker pour la reproductibilite des');
ligne('experiences menees tout au long de cette etude comparative.');

writeFileSync(join(here, 'rapport-interligne.pdf'), await doc.save());
console.log('rapport-interligne.pdf généré.');
