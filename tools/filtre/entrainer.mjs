// FILTRE DE PRÉCISION, étape 2 — apprendre les poids.
//
//     node tools/filtre/entrainer.mjs tools/filtre/jeu.jsonl
//
// POURQUOI UNE RÉGRESSION LOGISTIQUE, et pas mieux. Le modèle tient en une
// quinzaine de nombres, s'embarque comme un littéral, n'ajoute aucune
// dépendance, aucun téléchargement, et surtout SES POIDS SE LISENT : on peut
// dire à l'utilisateur « ce terme n'a pas été masqué parce qu'il est au lexique
// et qu'il apparaît douze fois en minuscules ». Dans un produit dont la colonne
// vertébrale est l'anti-fausse-confiance (cadrage §5), une boîte noire qui
// DÉMASQUE serait un contresens.
//
// LE JEU EST DÉSÉQUILIBRÉ et l'asymétrie du risque l'est encore plus : jeter un
// faux positif fait gagner en confort, jeter une vraie entité est une FUITE.
// L'entraînement pondère donc les vraies entités plus lourd que les fausses
// (POIDS_VRAI), et le seuil final est choisi sur la contrainte « zéro perte »,
// jamais sur la précision maximale.
import { readFileSync } from 'node:fs';
import { NOMS_CARACTERISTIQUES } from '../../src/engine/caracteristiques.js';
import { estVocabulaireCourant } from '../../src/engine/vocabulaire.js';

const fichier = process.argv[2] || 'tools/filtre/jeu.jsonl';
const lignes = readFileSync(fichier, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));

// PER est EXCLU de l'entraînement comme il l'est du filtre. La raison n'a pas
// changé depuis vocabulaire.js : beaucoup de patronymes SONT des mots courants
// (Blanc, Petit, Roux), et notre propre vivier de pseudonymes en est plein. Un
// filtre qui démasque des personnes ne rend pas service, il fuit.
const TYPES_FILTRES = new Set(['ORG', 'LOC']);
const jeu = lignes.filter(l => TYPES_FILTRES.has(l.type));

console.log(`jeu : ${lignes.length} candidats, dont ${jeu.length} filtrables (ORG/LOC)`);
console.log(`      ${jeu.filter(l => l.y === 1).length} vrais · ${jeu.filter(l => l.y === 0).length} faux\n`);

// --- Séparation apprentissage / évaluation --------------------------------
//
// PAR VALEUR, et non par ligne. Si « Semantikmatch » apparaît dans les deux
// moitiés, le score d'évaluation mesure une mémorisation, pas une capacité à
// généraliser — le piège classique, et il serait invisible.
const valeurs = [...new Set(jeu.map(l => l.valeur))];
const hache = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const enTest = new Set(valeurs.filter(v => hache(v) % 5 === 0));
const app = jeu.filter(l => !enTest.has(l.valeur));
const test = jeu.filter(l => enTest.has(l.valeur));
console.log(`apprentissage ${app.length} · évaluation ${test.length} (séparées PAR VALEUR)\n`);

// --- Régression logistique par descente de gradient -----------------------
const D = NOMS_CARACTERISTIQUES.length;
const POIDS_VRAI = 4;      // une vraie entité perdue coûte 4 faux positifs gardés
const PAS = 0.5;
const EPOQUES = 4000;
const L2 = 1e-4;

const sigmoide = (z) => 1 / (1 + Math.exp(-z));

function entrainer(donnees, colonnes) {
  const w = new Array(colonnes.length).fill(0);
  let b = 0;
  for (let e = 0; e < EPOQUES; e++) {
    const gw = new Array(colonnes.length).fill(0);
    let gb = 0, poidsTotal = 0;
    for (const d of donnees) {
      const x = colonnes.map(i => d.x[i]);
      const p = sigmoide(x.reduce((s, v, i) => s + v * w[i], b));
      const poids = d.y === 1 ? POIDS_VRAI : 1;
      const err = (p - d.y) * poids;
      for (let i = 0; i < colonnes.length; i++) gw[i] += err * x[i];
      gb += err;
      poidsTotal += poids;
    }
    for (let i = 0; i < colonnes.length; i++) w[i] -= PAS * (gw[i] / poidsTotal + L2 * w[i]);
    b -= PAS * (gb / poidsTotal);
  }
  return { w, b };
}

const proba = (modele, x, colonnes) =>
  sigmoide(colonnes.reduce((s, c, i) => s + x[c] * modele.w[i], modele.b));

// --- Le seuil est choisi sur la CONTRAINTE, pas sur un optimum ------------
//
// On cherche le seuil qui retire le plus de faux positifs SANS perdre une seule
// vraie entité sur l'évaluation. C'est la traduction directe de « zéro-fuite
// d'abord, sur-masquage juste derrière ». Un seuil choisi sur la F-mesure
// échangerait des fuites contre du confort — arbitrage que ce produit ne fait
// pas.
function evaluer(modele, donnees, colonnes) {
  const scores = donnees.map(d => ({ p: proba(modele, d.x, colonnes), y: d.y }));
  let meilleur = { seuil: 0, retires: 0, perdues: 0 };
  for (let s = 0.01; s < 1; s += 0.01) {
    const perdues = scores.filter(x => x.y === 1 && x.p < s).length;
    const retires = scores.filter(x => x.y === 0 && x.p < s).length;
    if (perdues === 0 && retires > meilleur.retires) meilleur = { seuil: s, retires, perdues };
  }
  const faux = scores.filter(x => x.y === 0).length;
  const vrais = scores.filter(x => x.y === 1).length;
  return { ...meilleur, faux, vrais, scores };
}

// LA RÉFÉRENCE, sans laquelle aucun chiffre de ce script ne veut rien dire :
// ce que le filtre ACTUELLEMENT LIVRÉ (estVocabulaireCourant, une seule
// caractéristique et un seuil binaire) fait sur exactement les mêmes candidats.
// « 8 faux retirés » n'est un progrès que comparé à quelque chose.
function reference(donnees) {
  const jete = (d) => estVocabulaireCourant(d.valeur);
  return {
    retires: donnees.filter(d => d.y === 0 && jete(d)).length,
    perdues: donnees.filter(d => d.y === 1 && jete(d)).length,
    faux: donnees.filter(d => d.y === 0).length,
    vrais: donnees.filter(d => d.y === 1).length
  };
}

// LE COMPROMIS EN ENTIER, pas un point unique. Le seuil « zéro perte » est
// choisi sur un échantillon fini : un seul candidat mal placé le fait chuter.
// Afficher la courbe montre s'il est un plateau stable ou une falaise — et ce
// qu'une tolérance minime achèterait. Le produit accepte DÉJÀ des pertes sur ce
// périmètre (voir vocabulaire.js : « Orange », « Total », « Le Monde » sont des
// pertes connues et assumées), donc la question mérite d'être posée en chiffres
// plutôt que tranchée par principe.
function courbe(ev) {
  const lignes = [];
  for (const s of [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) {
    const perdues = ev.scores.filter(x => x.y === 1 && x.p < s).length;
    const retires = ev.scores.filter(x => x.y === 0 && x.p < s).length;
    lignes.push({ s, retires, perdues });
  }
  return lignes;
}

// --- Trois jeux de caractéristiques, pour répondre à UNE question ---------
//
// « Peut-on se passer des suffixes français ? » C'est la seule question qui
// engage l'avenir du produit : le lexique est déjà multilingue et suit
// gratuitement l'ajout d'une langue, les suffixes non. On compare donc, sur les
// mêmes données, ce que chacun apporte.
const idx = (nom) => NOMS_CARACTERISTIQUES.indexOf(nom);
const toutes = NOMS_CARACTERISTIQUES.map((_, i) => i);
const sansSuffixe = toutes.filter(i => i !== idx('partSuffixe'));
const sansFragmentation = toutes.filter(i => i !== idx('fragmentation'));
const sansNiL_unNiL_autre = toutes.filter(i => i !== idx('partSuffixe') && i !== idx('fragmentation'));

const variantes = {
  'toutes': toutes,
  'sans les suffixes FR': sansSuffixe,
  'sans la fragmentation': sansFragmentation,
  'sans ni l’un ni l’autre': sansNiL_unNiL_autre
};

const ref = reference(test);
console.log('RÉFÉRENCE — filtre actuel (estVocabulaireCourant) sur les mêmes candidats');
console.log(`  ${ref.retires}/${ref.faux} faux retirés · ${ref.perdues}/${ref.vrais} vraies perdues`);
console.log('');

console.log('variante                      seuil   faux retirés   vraies perdues');
console.log('─'.repeat(72));
const modeles = {};
for (const [nom, colonnes] of Object.entries(variantes)) {
  const m = entrainer(app, colonnes);
  const ev = evaluer(m, test, colonnes);
  modeles[nom] = { m, colonnes, ev };
  console.log(nom.padEnd(28)
    + ev.seuil.toFixed(2).padStart(6)
    + `${ev.retires}/${ev.faux}`.padStart(15)
    + `${ev.perdues}/${ev.vrais}`.padStart(17));
}

// --- DEUX FAMILLES DE FAUX POSITIFS, ET UNE SEULE EST DE NOTRE RESSORT ----
//
// Constaté en regardant les données plutôt qu'en supposant : les faux positifs
// du corpus se répartissent en deux familles de nature différente.
//
//   · VOCABULAIRE — « Bénévole terrain », « Stack conteneurisée »,
//     « Téléphone », « Baccalauréat Général ». C'est le défaut mesuré sur de
//     vrais documents, et c'est ce que ce filtre existe pour traiter.
//
//   · TECHNOLOGIES — « Docker », « JWT », « PostgreSQL », « JaCoCo ». Aucune
//     caractéristique de ce module ne peut les distinguer de « Twini »,
//     « UNODC » ou « Semantikmatch » : ce sont les MÊMES chaînes, courtes,
//     capitalisées, absentes de tout dictionnaire. Vouloir les faire tomber ici
//     apprendrait au filtre à jeter les vraies entités qui leur ressemblent —
//     donc à FUIR. Le produit a déjà une réponse à ce problème, et elle est
//     meilleure : le profil « Développeur / Tech » et sa liste « ne jamais
//     masquer », éditable et propriété de l'utilisateur (voir CLAUDE.md, le
//     refus explicite d'une liste de technos cachée dans le moteur).
//
// On mesure donc les deux familles SÉPARÉMENT. Les confondre donnerait un
// chiffre global médiocre qui masquerait à la fois ce que le filtre sait faire
// et ce qu'il ne peut pas faire.
const { TECHNOS, NEGATIFS_DURS } = await import('../corpus/generer.mjs');
const estTechno = (v) => TECHNOS.some(t => t.toLowerCase() === String(v).toLowerCase());

function parFamille(modele, donnees, colonnes, seuil) {
  const fam = { technos: { retires: 0, total: 0 }, reste: { retires: 0, total: 0 } };
  for (const d of donnees.filter(d => d.y === 0)) {
    const c = estTechno(d.valeur) ? fam.technos : fam.reste;
    c.total++;
    if (proba(modele, d.x, colonnes) < seuil) c.retires++;
  }
  return fam;
}

{
  const b = modeles['toutes'];
  const fam = parFamille(b.m, test, b.colonnes, b.ev.seuil);
  const pct = (o) => (o.total ? ((o.retires / o.total) * 100).toFixed(0) + ' %' : '—');
  console.log('\nfaux positifs retirés, PAR FAMILLE (au seuil zéro-perte) :');
  console.log(`  vocabulaire et intitulés   ${fam.reste.retires}/${fam.reste.total}   ${pct(fam.reste)}`
    + '   ← ce que ce filtre doit traiter');
  console.log(`  technologies               ${fam.technos.retires}/${fam.technos.total}   ${pct(fam.technos)}`
    + '   ← hors de portée, traité par les profils');
}

// --- Les poids, en clair --------------------------------------------------
console.log('\npoids appris (variante « toutes ») — signe positif = pousse à GARDER');
console.log('─'.repeat(72));
const base = modeles['toutes'];
const paires = base.colonnes.map((c, i) => [NOMS_CARACTERISTIQUES[c], base.m.w[i]]);
for (const [nom, poids] of paires.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))) {
  const barre = '█'.repeat(Math.min(30, Math.round(Math.abs(poids) * 6)));
  console.log(`  ${nom.padEnd(20)} ${poids >= 0 ? '+' : '−'}${Math.abs(poids).toFixed(3).padStart(6)}  ${barre}`);
}
console.log(`  ${'(biais)'.padEnd(20)} ${base.m.b >= 0 ? '+' : '−'}${Math.abs(base.m.b).toFixed(3).padStart(6)}`);

// --- Le compromis en entier ------------------------------------------------
console.log('');
console.log('compromis selon le seuil (variante « toutes ») :');
console.log('  seuil   faux retirés   vraies perdues');
for (const l of courbe(modeles['toutes'].ev)) {
  console.log(`  ${l.s.toFixed(2)}${String(l.retires).padStart(11)}/${modeles['toutes'].ev.faux}`
    + `${String(l.perdues).padStart(13)}/${modeles['toutes'].ev.vrais}`);
}

// --- Sortie embarquable ---------------------------------------------------
const choisi = process.env.VARIANTE || 'toutes';
const c = modeles[choisi];
console.log(`\n// à recopier dans src/engine/precision.js — variante « ${choisi} »`);
console.log(`export const POIDS = {`);
console.log(`  seuil: ${c.ev.seuil.toFixed(2)},`);
console.log(`  biais: ${c.m.b.toFixed(4)},`);
console.log(`  poids: {`);
for (let i = 0; i < c.colonnes.length; i++) {
  console.log(`    ${NOMS_CARACTERISTIQUES[c.colonnes[i]]}: ${c.m.w[i].toFixed(4)},`);
}
console.log(`  }\n};`);

// --- Ce que ça donnerait sur les valeurs réellement vues ------------------
console.log('\nexemples d’évaluation (les 12 plus bas scores) :');
const vus = new Map();
for (const d of test) {
  const p = proba(c.m, d.x, c.colonnes);
  if (!vus.has(d.valeur) || vus.get(d.valeur).p > p) vus.set(d.valeur, { p, y: d.y });
}
[...vus.entries()].sort((a, b) => a[1].p - b[1].p).slice(0, 12).forEach(([v, { p, y }]) => {
  const verdict = p < c.ev.seuil ? (y === 1 ? '⚠ VRAIE PERDUE' : '✓ faux retiré') : '  gardé';
  console.log(`  ${p.toFixed(3)}  ${verdict.padEnd(16)} ${v}`);
});
