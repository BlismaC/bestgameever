"""Tiny supersampled vector-ish drawing kit used by make_sprites.py (PIL only)."""
import math, random
from PIL import Image, ImageDraw, ImageFilter

SS = 4  # supersampling factor


def hexc(h, a=255):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mix(c, t, k):
    return tuple(int(c[i] + (t[i] - c[i]) * k) for i in range(3)) + (c[3],)


def lite(c, k=0.25): return mix(c, (255, 255, 255, 255), k)
def dark(c, k=0.3): return mix(c, (0, 0, 0, 255), k)


OUTLINE = (24, 20, 28, 255)


class Cv:
    def __init__(s, size=256):
        s.size = size
        s.im = Image.new('RGBA', (size * SS, size * SS), (0, 0, 0, 0))
        s.d = ImageDraw.Draw(s.im)
        s.rng = random.Random(7)

    def _p(s, pts): return [(x * SS, y * SS) for x, y in pts]

    def ell(s, cx, cy, rx, ry, fill, out=OUTLINE, ow=3, rot=0, n=56):
        def pts(ax, ay):
            c, sn = math.cos(rot), math.sin(rot)
            r = []
            for i in range(n):
                t = 2 * math.pi * i / n
                x, y = ax * math.cos(t), ay * math.sin(t)
                r.append((cx + x * c - y * sn, cy + x * sn + y * c))
            return r
        if out: s.d.polygon(s._p(pts(rx + ow, ry + ow)), fill=out)
        s.d.polygon(s._p(pts(rx, ry)), fill=fill)

    def circ(s, cx, cy, r, fill, out=OUTLINE, ow=3): s.ell(cx, cy, r, r, fill, out, ow)

    def blob(s, cx, cy, rx, ry, col, out=OUTLINE, ow=3, rot=0):
        """shaded ellipse: base + highlight"""
        s.ell(cx, cy, rx, ry, col, out, ow, rot)
        s.ell(cx - rx * 0.22, cy - ry * 0.28, rx * 0.55, ry * 0.45, lite(col, 0.28), None, 0, rot)
        s.ell(cx + rx * 0.2, cy + ry * 0.35, rx * 0.5, ry * 0.3, dark(col, 0.12), None, 0, rot) if False else None

    def poly(s, pts, fill, out=OUTLINE, ow=3):
        if out:
            s.d.line(s._p(pts + [pts[0]]), fill=out, width=int(ow * 2 * SS), joint='curve')
            for x, y in pts: s.d.ellipse([(x - ow) * SS, (y - ow) * SS, (x + ow) * SS, (y + ow) * SS], fill=out)
        s.d.polygon(s._p(pts), fill=fill)

    def line(s, pts, col, w=4, cap=True):
        s.d.line(s._p(pts), fill=col, width=int(w * SS), joint='curve')
        if cap:
            for x, y in (pts[0], pts[-1]):
                s.d.ellipse([(x - w / 2) * SS, (y - w / 2) * SS, (x + w / 2) * SS, (y + w / 2) * SS], fill=col)

    def outlined_line(s, pts, col, w=6, out=OUTLINE, ow=2):
        s.line(pts, out, w + ow * 2); s.line(pts, col, w)

    def glow(s, cx, cy, r, col, blur=0.55):
        r = min(r, 46 * s.size / 256)  # keep the blurred halo inside the canvas (no square clipping)
        L = Image.new('RGBA', s.im.size, (0, 0, 0, 0))
        ImageDraw.Draw(L).ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=col)
        L = L.filter(ImageFilter.GaussianBlur(r * SS * blur))
        s.im = Image.alpha_composite(s.im, L); s.d = ImageDraw.Draw(s.im)

    def soft(s, fn, blur=6):
        """draw something onto a layer, blur it, composite (wisps, fog, glow shapes)"""
        L = Image.new('RGBA', s.im.size, (0, 0, 0, 0)); fn(ImageDraw.Draw(L))
        L = L.filter(ImageFilter.GaussianBlur(blur * SS))
        s.im = Image.alpha_composite(s.im, L); s.d = ImageDraw.Draw(s.im)

    def bez(s, p0, p1, p2, n=24):
        return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]

    def star(s, cx, cy, r1, r2, n, fill, out=OUTLINE, ow=2, rot=0):
        pts = []
        for i in range(n * 2):
            r = r1 if i % 2 == 0 else r2; a = rot + math.pi * i / n
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        s.poly(pts, fill, out, ow)

    def save(s, path, out=None):
        out = out or s.size
        s.im.resize((out, out), Image.LANCZOS).save(path)
