"""Fabrique les icônes de l'extension à partir du logo source.

    python tools/icones.py

POURQUOI UN SCRIPT ET PAS UN EXPORT À LA MAIN. Le manifeste déclarait le MÊME
fichier de 1119 × 1328 pour les tailles 16, 48 et 128 — non carré, donc déformé
par Chrome, et illisible à 16 px. Un script rend l'opération reproductible et
documente le seul choix qui compte : où couper.

LE PIÈGE DU LOGO SOURCE. `ClarenceLogoRedSquareWAlt.png` fait 2000 × 2000, mais
la marque n'occupe qu'environ un dixième de la toile, décentrée, le reste étant
transparent. Un simple redimensionnement donnerait deux pixels utiles à 16 px.
On recadre donc sur la marque elle-même — repérée par sa COULEUR (le carré
rouge) et non par la boîte opaque, qui inclut un résidu grisâtre en bas à
gauche du fichier d'origine.

Le carré rouge à lettre blanche est par ailleurs la bonne forme pour une icône
de barre d'outils : aplat saturé, glyphe à fort contraste, lisible sur un thème
clair comme sombre — ce qu'un logo détouré sur fond transparent ne garantit pas.
"""
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "extension/popup/img/ClarenceLogoRedSquareWAlt.png"
SORTIE = RACINE / "extension/icons"

# Chrome affiche 16 px dans la barre d'outils, 32 px sur les écrans à densité
# double, 48 px dans la page des extensions, 128 px à l'installation et sur la
# fiche du magasin. Les quatre sont demandées explicitement pour qu'aucune ne
# soit rééchantillonnée depuis une autre.
TAILLES = [16, 32, 48, 128]

# Part de la marque ajoutée en aplat sur chaque bord. 8 % suffit à décoller le
# glyphe du cadre sans le rétrécir au point de brouiller le 16 px.
MARGE = 0.08


def boite_de_la_marque(im):
    """Boîte englobante des pixels ROUGES SATURÉS.

    `Image.getbbox()` ne convient pas : il rend la boîte de tout ce qui n'est
    pas transparent, résidus compris. On cherche la marque, pas l'encre.
    """
    px = im.convert("RGBA").load()
    l, h = im.size
    xs, ys = [], []
    for y in range(0, h, 2):          # un pixel sur deux : 4× plus rapide, et
        for x in range(0, l, 2):      # la marque fait des centaines de pixels
            r, v, b, a = px[x, y]
            if a > 128 and r > 180 and v < 120 and b < 120:
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("aucun pixel rouge trouvé — le logo source a-t-il changé ?")
    return min(xs), min(ys), max(xs) + 2, max(ys) + 2


def carrer(boite):
    """Étend la boîte au carré, autour de son centre.

    Une icône déformée est le défaut qu'on corrige ; on ne va pas le
    réintroduire en recadrant sur un rectangle.
    """
    x0, y0, x1, y1 = boite
    cote = max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    return (cx - cote // 2, cy - cote // 2, cx - cote // 2 + cote, cy - cote // 2 + cote)


def main():
    im = Image.open(SOURCE).convert("RGBA")
    boite = carrer(boite_de_la_marque(im))
    marque = im.crop(boite)
    print(f"source  {SOURCE.name}  {im.size[0]}×{im.size[1]}")
    print(f"marque  recadrée à {boite}  →  {marque.size[0]}×{marque.size[1]}")

    # AIR AUTOUR DU GLYPHE. Recadrée au plus juste, la lettre touche les quatre
    # bords : lisible, mais à l'étroit — et la fiche du magasin affiche l'icône
    # en grand, où ça se voit. On étend l'APLAT ROUGE plutôt que la toile, pour
    # garder la marque à fond perdu ; ajouter du transparent donnerait un carré
    # rouge flottant dans du vide.
    rouge = marque.getpixel((1, 1))
    marge = round(marque.size[0] * MARGE)
    cote = marque.size[0] + 2 * marge
    fond = Image.new("RGBA", (cote, cote), rouge)
    fond.paste(marque, (marge, marge), marque)
    marque = fond
    print(f"        + {marge} px d'aplat sur chaque bord  →  {cote}×{cote}")

    SORTIE.mkdir(parents=True, exist_ok=True)
    for t in TAILLES:
        # LANCZOS plutôt que le défaut : à 16 px, la différence entre un glyphe
        # net et une bouillie grise se joue sur le filtre de rééchantillonnage.
        petite = marque.resize((t, t), Image.LANCZOS)
        chemin = SORTIE / f"icon-{t}.png"
        petite.save(chemin, "PNG", optimize=True)
        print(f"  {chemin.relative_to(RACINE)}  {chemin.stat().st_size} o")


if __name__ == "__main__":
    main()
