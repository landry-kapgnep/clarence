// Grille de lettres — portage du fond animé de la popup (src/popup/main.js).
//
// Mêmes constantes, même intention : les cases forment des amas irréguliers,
// quelques cases isolées dérivent, et des teintes de la palette s'allument
// brièvement. C'est la signature visuelle de l'outil, pas un décor générique —
// elle littéralise le traitement des caractères.
//
// Peint sur UN SEUL canvas, jamais en <div> : deux cases blanches accolées en
// DOM laissent un interstice au sous-pixel dès que le facteur d'échelle de
// l'écran n'est pas entier (1,25 / 1,5). Piège déjà rencontré dans la popup.

const LETTRES = ['c', 'l', 'a', 'r', 'e', 'n'];
const CELL = 16;
const FONT_PX = 9;
const TICK_MS = 300;
const ROWS_PER_BLOB = 4.5;
const R = [2.4, 4.6];
const SEUIL = 0.34;
const JITTER = 0.22;
const TEINTES = ['--seal-lit', '--moss', '--tan', '--paper-dim'];
const TEINTE_TOUTES_MS = [1600, 4400];
const TEINTE_CASES = [1, 3];
const TEINTE_VIE_MS = [600, 1800];
const TEINTE_PART_MAX = 0.3;

const alea = (min, max) => min + Math.random() * (max - min);

// Bruit déterministe par case : le motif ne doit pas scintiller d'une frame à
// l'autre, seul le temps le fait bouger.
function hash(x, y, graine) {
  let h = (x * 374761393 + y * 668265263 + graine * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function monterGrilleDeLettres(hote) {
  if (!hote) return;
  const canvas = document.createElement('canvas');
  hote.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const graine = (Math.random() * 1e6) | 0;

  let cols = 0, rows = 0, blobs = [], teintesActives = [];
  const styles = getComputedStyle(document.documentElement);
  // Le site est plus sombre et plus large que la popup : les couleurs de
  // l'extension (--bg-raised sur --bg-page) y donnaient une trame invisible.
  // On garde la même intention, en relevant juste assez le contraste.
  const couleurCase = styles.getPropertyValue('--grille-case').trim() || '#161923';
  const couleurLettre = styles.getPropertyValue('--grille-lettre').trim() || 'rgba(237,230,211,0.30)';
  const palette = TEINTES.map(v => styles.getPropertyValue(v).trim()).filter(Boolean);

  function redimensionner() {
    const dpr = window.devicePixelRatio || 1;
    const w = hote.clientWidth, h = hote.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
    blobs = construireBlobs();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    peindre();
  }

  // Densité calculée sur l'AIRE, pas sur le nombre de lignes.
  //
  // La popup est une colonne étroite et haute : y compter une boule toutes les
  // 4,5 lignes donnait la bonne densité. Ici le bandeau est large et bas — la
  // même formule ne produisait que deux amas perdus dans 90 colonnes, ce qui se
  // lisait comme deux taches, pas comme une trame. On garde donc la densité
  // SURFACIQUE de la popup (≈ une boule pour 100 cases) quelle que soit la
  // forme du conteneur.
  function construireBlobs() {
    // Viser ~25 % de cases occupées : au-delà, les amas fusionnent en un
    // tapis uniforme et l'effet « grappes » disparaît (mesuré à 54 % de
    // couverture, le bandeau devenait illisible).
    const parCase = 1 / (ROWS_PER_BLOB * 40);
    const n = Math.max(3, Math.round(cols * rows * parCase));
    return Array.from({ length: n }, () => ({
      x: alea(0, cols), y: alea(-1, rows + 1), r: alea(R[0], R[1])
    }));
  }

  // Champ scalaire : somme des contributions des amas. Au-delà du seuil, la
  // case est peinte. Le jitter ronge le bord sans détacher de cases isolées.
  function dansUnAmas(cx, cy) {
    let champ = 0;
    for (const b of blobs) {
      const dx = cx - b.x, dy = cy - b.y;
      const d2 = dx * dx + dy * dy;
      champ += Math.exp(-d2 / (2 * b.r * b.r));
    }
    return champ + (hash(cx, cy, graine) - 0.5) * JITTER > SEUIL;
  }

  function peindre() {
    if (!cols || !rows) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_PX}px "Syne Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        if (!dansUnAmas(cx, cy)) continue;
        // Coordonnées arrondies en pixels DEVICE : deux fillRect entiers
        // adjacents se touchent toujours pile, quel que soit le zoom.
        const x = Math.round(cx * CELL * dpr) / dpr;
        const y = Math.round(cy * CELL * dpr) / dpr;
        const t = teintesActives.find(t => t.cx === cx && t.cy === cy);
        ctx.fillStyle = t ? t.couleur : couleurCase;
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = couleurLettre;
        const l = LETTRES[Math.floor(hash(cx, cy, graine + 7) * LETTRES.length)];
        ctx.fillText(l, x + CELL / 2, y + CELL / 2 + 0.5);
      }
    }
  }

  function allumerDesCases() {
    const max = Math.floor(cols * rows * TEINTE_PART_MAX);
    if (teintesActives.length < max && palette.length) {
      const combien = Math.round(alea(TEINTE_CASES[0], TEINTE_CASES[1]));
      for (let i = 0; i < combien; i++) {
        const cx = Math.floor(alea(0, cols)), cy = Math.floor(alea(0, rows));
        if (!dansUnAmas(cx, cy)) continue;
        teintesActives.push({
          cx, cy,
          couleur: palette[Math.floor(Math.random() * palette.length)],
          jusqua: performance.now() + alea(TEINTE_VIE_MS[0], TEINTE_VIE_MS[1])
        });
      }
    }
    setTimeout(allumerDesCases, alea(TEINTE_TOUTES_MS[0], TEINTE_TOUTES_MS[1]));
  }

  redimensionner();
  let t = null;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(redimensionner, 120); }).observe(hote);

  // Mouvement coupé si l'utilisateur en demande moins — le motif reste, figé.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    allumerDesCases();
    setInterval(() => {
      const now = performance.now();
      teintesActives = teintesActives.filter(t => t.jusqua > now);
      peindre();
    }, TICK_MS);
  }
}
