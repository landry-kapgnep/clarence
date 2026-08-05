// Grille de lettres — portage du fond animé de la popup (src/popup/main.js),
// étendu à la page entière.
//
// Mêmes constantes et même intention : des amas irréguliers de cases, des
// teintes de la palette qui s'allument brièvement. C'est la signature visuelle
// de l'outil — elle littéralise le traitement des caractères.
//
// Peint sur UN SEUL canvas, jamais en <div> : deux cases accolées en DOM
// laissent un interstice au sous-pixel dès que le facteur d'échelle de l'écran
// n'est pas entier (1,25 / 1,5). Piège déjà rencontré dans la popup.

const LETTRES = ['c', 'l', 'a', 'r', 'e', 'n'];
const CELL = 16;
const FONT_PX = 9;
const TICK_MS = 120;          // plus rapide que la popup : ici le motif VIT
const R = [2.6, 5.2];
const SEUIL = 0.34;
const JITTER = 0.22;
const CASES_PAR_AMAS = 180;   // densité surfacique visée (~25 % de couverture)

// Dérive des amas : c'est ELLE qui fait bouger les lettres. Sans elle le motif
// est figé et seules les teintes changent — ce qui ne se voit pas.
// Réglé À L'ŒIL, sur la page : à 0,035 case par tick (~4 px/s) la dérive
// existait mais ne se VOYAIT pas — deux rendus à 900 ms d'intervalle étaient
// identiques au pixel près. Il faut franchir une case de temps en temps pour
// que le motif se lise comme vivant.
const DERIVE = 0.10;          // cases par tick
const DERIVE_ACCEL = 0.018;
const RAYON_RESPIRE = 0.012;  // le rayon enfle et se rétracte

const TEINTES = ['--seal-lit', '--moss', '--tan', '--paper-dim'];
const TEINTE_TOUTES_MS = [280, 780];
const TEINTE_CASES = [3, 8];
const TEINTE_VIE_MS = [600, 1900];
const TEINTE_PART_MAX = 0.08;

// Quelques cases changent de lettre à chaque tick : le texte « travaille ».
const LETTRES_CHANGEES = [8, 20];
const LETTRE_VIE_MS = [500, 1600];

const alea = (min, max) => min + Math.random() * (max - min);
const cle = (cx, cy) => cx * 100000 + cy;

// Bruit déterministe par case : le bord des amas ne doit pas scintiller d'une
// frame à l'autre, seule la dérive doit le faire bouger.
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

  let cols = 0, rows = 0, blobs = [], champ = null, bloquees = null;
  let teintes = new Map();     // clé de case → { couleur, jusqua }
  let lettresAlterees = new Map(); // clé de case → { decalage, jusqua }

  const styles = getComputedStyle(document.documentElement);
  const lire = (v, defaut) => styles.getPropertyValue(v).trim() || defaut;
  const couleurCase = lire('--grille-case', '#12141c');
  const couleurLettre = lire('--grille-lettre', 'rgba(237,230,211,0.22)');
  const palette = TEINTES.map(v => lire(v, '')).filter(Boolean);

  function redimensionner() {
    const dpr = window.devicePixelRatio || 1;
    const w = hote.clientWidth, h = hote.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    champ = new Float32Array(cols * rows);
    bloquees = new Uint8Array(cols * rows);
    blobs = construireBlobs();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    calculerEvidement();
    peindre();
  }

  // ÉVIDEMENT DES ZONES DE TEXTE — repris de la popup.
  //
  // Sans lui, la trame passe derrière chaque paragraphe et le texte devient
  // pénible à lire (constaté sur le pied de page, illisible). On ne peut pas
  // s'en sortir en baissant le contraste : à ce moment-là la trame ne se voit
  // plus du tout. On la garde donc franche, et on l'écarte du texte.
  //
  // Le canvas est FIXE, donc les rectangles du DOM (coordonnées viewport) sont
  // directement utilisables — mais il faut recalculer au défilement.
  const SELECTEUR_TEXTE = 'h1, h2, p, table, dt, dd, li, .etiquette, .decompte';
  const MARGE = 6; // px de respiration autour du texte

  function calculerEvidement() {
    if (!bloquees) return;
    bloquees.fill(0);
    for (const el of document.querySelectorAll(SELECTEUR_TEXTE)) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
      const x0 = Math.max(0, Math.floor((r.left - MARGE) / CELL));
      const x1 = Math.min(cols - 1, Math.ceil((r.right + MARGE) / CELL));
      const y0 = Math.max(0, Math.floor((r.top - MARGE) / CELL));
      const y1 = Math.min(rows - 1, Math.ceil((r.bottom + MARGE) / CELL));
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) bloquees[cy * cols + cx] = 1;
      }
    }
  }

  // Densité calculée sur l'AIRE et non sur le nombre de lignes : la popup est
  // une colonne étroite et haute, la page est large. La même formule y donnait
  // deux taches perdues au lieu d'une trame.
  function construireBlobs() {
    const n = Math.max(4, Math.round((cols * rows) / CASES_PAR_AMAS));
    return Array.from({ length: n }, () => ({
      x: alea(0, cols), y: alea(0, rows),
      r: alea(R[0], R[1]),
      phase: alea(0, Math.PI * 2),
      vx: alea(-DERIVE, DERIVE), vy: alea(-DERIVE, DERIVE)
    }));
  }

  function deriver() {
    for (const b of blobs) {
      // Le bruit s'applique à la VITESSE, pas à la position : la dérive reste
      // continue au lieu de sautiller.
      b.vx = Math.max(-DERIVE, Math.min(DERIVE, b.vx + alea(-DERIVE_ACCEL, DERIVE_ACCEL)));
      b.vy = Math.max(-DERIVE, Math.min(DERIVE, b.vy + alea(-DERIVE_ACCEL, DERIVE_ACCEL)));
      b.x += b.vx;
      b.y += b.vy;
      // Enroulement : un amas qui sort d'un côté rentre de l'autre, la trame
      // n'a donc jamais de zone vide durable.
      const m = R[1] * 3;
      if (b.x < -m) b.x = cols + m; else if (b.x > cols + m) b.x = -m;
      if (b.y < -m) b.y = rows + m; else if (b.y > rows + m) b.y = -m;
      b.phase += RAYON_RESPIRE;
    }
  }

  // Le champ n'est calculé que dans la boîte englobante de chaque amas.
  // En parcourant toutes les cases pour tous les amas, une page 1440×900
  // demanderait ~140 000 exponentielles par tick — injouable à 120 ms.
  function calculerChamp() {
    champ.fill(0);
    for (const b of blobs) {
      const r = b.r * (1 + 0.18 * Math.sin(b.phase));
      const portee = Math.ceil(r * 2.6);
      const x0 = Math.max(0, Math.floor(b.x - portee));
      const x1 = Math.min(cols - 1, Math.ceil(b.x + portee));
      const y0 = Math.max(0, Math.floor(b.y - portee));
      const y1 = Math.min(rows - 1, Math.ceil(b.y + portee));
      const deux = 2 * r * r;
      for (let cy = y0; cy <= y1; cy++) {
        const dy = cy - b.y, dy2 = dy * dy;
        for (let cx = x0; cx <= x1; cx++) {
          const dx = cx - b.x;
          champ[cy * cols + cx] += Math.exp(-(dx * dx + dy2) / deux);
        }
      }
    }
  }

  function peindre() {
    if (!cols || !rows) return;
    const dpr = window.devicePixelRatio || 1;
    calculerChamp();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_PX}px "Syne Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const idx = cy * cols + cx;
        if (bloquees[idx]) continue;
        const v = champ[idx] + (hash(cx, cy, graine) - 0.5) * JITTER;
        if (v <= SEUIL) continue;
        // Coordonnées arrondies en pixels DEVICE : deux fillRect entiers
        // adjacents se touchent toujours pile, quel que soit le zoom.
        const x = Math.round(cx * CELL * dpr) / dpr;
        const y = Math.round(cy * CELL * dpr) / dpr;
        const k = cle(cx, cy);
        const t = teintes.get(k);
        ctx.fillStyle = t ? t.couleur : couleurCase;
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = couleurLettre;
        const alt = lettresAlterees.get(k);
        const base = Math.floor(hash(cx, cy, graine + 7) * LETTRES.length);
        const i = (base + (alt ? alt.decalage : 0)) % LETTRES.length;
        ctx.fillText(LETTRES[i], x + CELL / 2, y + CELL / 2 + 0.5);
      }
    }
  }

  function occupee(cx, cy) {
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return false;
    return champ[cy * cols + cx] + (hash(cx, cy, graine) - 0.5) * JITTER > SEUIL;
  }

  function allumerDesCases() {
    const max = Math.floor(cols * rows * TEINTE_PART_MAX);
    if (teintes.size < max && palette.length) {
      const combien = Math.round(alea(TEINTE_CASES[0], TEINTE_CASES[1]));
      for (let i = 0; i < combien; i++) {
        const cx = Math.floor(alea(0, cols)), cy = Math.floor(alea(0, rows));
        if (!occupee(cx, cy)) continue;
        teintes.set(cle(cx, cy), {
          couleur: palette[Math.floor(Math.random() * palette.length)],
          jusqua: performance.now() + alea(TEINTE_VIE_MS[0], TEINTE_VIE_MS[1])
        });
      }
    }
    setTimeout(allumerDesCases, alea(TEINTE_TOUTES_MS[0], TEINTE_TOUTES_MS[1]));
  }

  function changerDesLettres() {
    const combien = Math.round(alea(LETTRES_CHANGEES[0], LETTRES_CHANGEES[1]));
    for (let i = 0; i < combien; i++) {
      const cx = Math.floor(alea(0, cols)), cy = Math.floor(alea(0, rows));
      if (!occupee(cx, cy)) continue;
      lettresAlterees.set(cle(cx, cy), {
        decalage: 1 + Math.floor(Math.random() * (LETTRES.length - 1)),
        jusqua: performance.now() + alea(LETTRE_VIE_MS[0], LETTRE_VIE_MS[1])
      });
    }
  }

  redimensionner();
  let t = null;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(redimensionner, 140); });

  // Le canvas est fixe : au défilement, les zones de texte changent de place
  // sous lui. Recalcul à la frame suivante, jamais dans le gestionnaire.
  let planifie = false;
  addEventListener('scroll', () => {
    if (planifie) return;
    planifie = true;
    requestAnimationFrame(() => { planifie = false; calculerEvidement(); peindre(); });
  }, { passive: true });

  // Mouvement coupé si l'utilisateur en demande moins — la trame reste, figée.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    allumerDesCases();
    setInterval(() => {
      const now = performance.now();
      for (const [k, v] of teintes) if (v.jusqua <= now) teintes.delete(k);
      for (const [k, v] of lettresAlterees) if (v.jusqua <= now) lettresAlterees.delete(k);
      deriver();
      changerDesLettres();
      calculerEvidement();
      peindre();
    }, TICK_MS);
  }
}
