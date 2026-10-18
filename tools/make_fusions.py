"""Builds the fusion-sword sprites from YOUR art (tools/src/verdant_edge.png, diagonal, hilt bottom-left).
 - items/<id>.png : inventory icon (original orientation, hue variants)
 - held/<id>.png  : the same sword rotated to point right, used when held in hand
Hue variants: glacial_reaver (blue), infernal_edge (fire), prismatic_edge (rainbow)."""
import os, colorsys
from PIL import Image
HERE = os.path.dirname(__file__); OUT = os.path.join(HERE, '..', 'public', 'assets')
src = Image.open(os.path.join(HERE, 'src', 'verdant_edge.png')).convert('RGBA')

def hue_shift(im, deg=0, rainbow=False, sat=1.0, val=1.0):
    out = im.copy(); px = out.load(); W, H = im.size
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if rainbow: h = (h * 0.15 + (x / W * 0.9 + (H - y) / H * 0.6)) % 1.0; s = max(s, 0.55)
            else: h = (h + deg / 360) % 1.0
            r, g, b = colorsys.hsv_to_rgb(h, min(1, s * sat), min(1, v * val)); px[x, y] = (int(r * 255), int(g * 255), int(b * 255), a)
    return out

def held(im):
    big = im.resize((im.width * 6, im.height * 6), Image.NEAREST)           # enlarge FIRST so the 45-degree turn has no holes
    r = big.rotate(-45, resample=Image.NEAREST, expand=True); r = r.crop(r.getbbox())
    side = max(r.size); canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0)); canvas.paste(r, (0, (side - r.height) // 2))
    return canvas.resize((256, 256), Image.LANCZOS)                          # smooth-downscale: crisp, no moire when drawn small

VARIANTS = {'verdant_edge': src, 'glacial_reaver': hue_shift(src, 105), 'infernal_edge': hue_shift(src, -88, sat=1.15, val=1.1), 'prismatic_edge': hue_shift(src, rainbow=True, val=1.15)}
for sub in ('items', 'held'): os.makedirs(os.path.join(OUT, sub), exist_ok=True)
for id_, im in VARIANTS.items():
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(os.path.join(OUT, 'items', id_ + '.png'))
    held(im).save(os.path.join(OUT, 'held', id_ + '.png'))
print('fusion sprites:', ', '.join(VARIANTS))
