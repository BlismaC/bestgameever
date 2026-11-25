# Hand-built pixel art (no anti-aliasing, fixed palettes, per-part outlines, edge shading) for the story bosses and their dialogue portraits.
from PIL import Image

def H(h): h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
OUT = H('#120810')

class PC:
    def __init__(s, w, h): s.w, s.h = w, h; s.p = [[None] * w for _ in range(h)]
    def put(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.p[y][x] = c
    def mask(s, pts):
        """scan-line polygon fill on integer pixels"""
        ys = [p[1] for p in pts]; out = set(); n = len(pts)
        for y in range(min(ys), max(ys) + 1):
            xs = []
            for i in range(n):
                (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
                if y1 == y2: continue
                if min(y1, y2) <= y + 0.5 < max(y1, y2): xs.append(x1 + (y + 0.5 - y1) * (x2 - x1) / (y2 - y1))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(xs[i] + 0.5), int(xs[i + 1] + 0.5)): out.add((x, y))
        return out
    def paint(s, m, base, light=None, dark=None, outline=True):
        for (x, y) in m:
            c = base
            if light and ((x - 1, y) not in m or (x, y - 1) not in m): c = light
            elif dark and ((x + 1, y) not in m or (x, y + 1) not in m): c = dark
            s.put(x, y, c)
        if outline:
            for (x, y) in m:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if (x + dx, y + dy) not in m and 0 <= x + dx < s.w and 0 <= y + dy < s.h and (s.p[y + dy][x + dx] is None or s.p[y + dy][x + dx] != OUT): s.put(x + dx, y + dy, OUT)
    def poly(s, pts, base, light=None, dark=None, outline=True): s.paint(s.mask(pts), base, light, dark, outline)
    def line(s, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), -abs(y1 - y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1; e = dx + dy
        while True:
            s.put(x0, y0, c)
            if x0 == x1 and y0 == y1: break
            e2 = 2 * e
            if e2 >= dy: e += dy; x0 += sx
            if e2 <= dx: e += dx; y0 += sy
    def rect(s, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.put(x, y, c)
    def disc(s, cx, cy, r, base, light=None, dark=None, outline=True):
        m = {(x, y) for y in range(cy - r, cy + r + 1) for x in range(cx - r, cx + r + 1) if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6}
        s.paint(m, base, light, dark, outline)
    def save(s, path, scale=4):
        im = Image.new('RGBA', (s.w, s.h), (0, 0, 0, 0)); px = im.load()
        for y in range(s.h):
            for x in range(s.w):
                if s.p[y][x]: px[x, y] = s.p[y][x]
        im.resize((s.w * scale, s.h * scale), Image.NEAREST).save(path)

def stretch(pc, rows):
    """repeat given pixel rows n times (taller body, same pixel style)"""
    out = PC(pc.w, pc.h + sum(rows.values())); y2 = 0
    for y in range(pc.h):
        for _ in range(1 + rows.get(y, 0)): out.p[y2] = list(pc.p[y]); y2 += 1
    return out

# ------------------------------------------------------------------------------------------ DRACULA
SK = (H('#e8dee6'), H('#fbf6fa'), H('#b9a6b9')); HAIR = (H('#1b1522'), H('#3f3350'), H('#0b070d'))
COAT = (H('#262030'), H('#463a5a'), H('#15101b')); CAPE = (H('#7a1228'), H('#b81f3a'), H('#4e0a1a')); LINING = (H('#b3182f'), H('#e63a54'), H('#7a0f20'))
SHIRT = (H('#f3eef5'), H('#ffffff'), H('#c8bdd0')); GOLD = (H('#e8b43c'), H('#ffe27a'), H('#9c6a18')); EYE = H('#ff2a3e'); BOOT = (H('#17101c'), H('#3a2d46'), H('#0b070d'))

def dracula_head(pc, S=1, ox=0, oy=0):
    P = lambda pts: [(x * S + ox, y * S + oy) for x, y in pts]
    pt = lambda x, y: (x * S + ox, y * S + oy)
    pc.poly(P([(30, 24), (35, 24), (35, 28), (30, 28)]), SK[2], None, None)
    pc.poly(P([(26, 15), (21, 10), (27, 13)]), *SK)                                           # pointed ear
    face = [(26, 12), (36, 11), (38, 14), (39, 17), (41, 18), (39, 19), (39, 21), (38, 23), (35, 25), (30, 24), (27, 20), (26, 16)]
    pc.poly(P(face), *SK)
    hair = [(24, 15), (25, 8), (31, 4), (38, 6), (40, 12), (37, 11), (33, 11), (31, 14), (29, 11), (26, 12), (26, 17)]
    pc.poly(P(hair), *HAIR)
    for (x0, y0, x1, y1) in ((27, 7, 33, 5), (28, 9, 31, 8)): pc.line(*pt(x0, y0), *pt(x1, y1), HAIR[1])   # hair shine
    # brow, eye, nose, mouth, fangs
    for dy in range(S): pc.line(*pt(33, 14), *pt(38, 12), HAIR[2]) if dy == 0 else pc.line(pt(33, 14)[0], pt(33, 14)[1] + dy, pt(38, 12)[0], pt(38, 12)[1] + dy, HAIR[2])
    pc.rect(*pt(34, 15), pt(37, 17)[0] + S - 1, pt(37, 17)[1] + S - 1, H('#2a1020'))
    pc.rect(*pt(36, 16), pt(36, 16)[0] + S - 1, pt(36, 16)[1] + S - 1, EYE); pc.put(pt(35, 16)[0], pt(35, 16)[1], H('#ff7080'))
    pc.put(*pt(36, 15), H('#ffd0d6'))
    pc.put(*pt(39, 18), SK[2]); pc.put(*pt(38, 19), SK[2])
    pc.line(*pt(35, 22), *pt(39, 22), H('#6a1022'))
    for fx in (36, 38): pc.line(*pt(fx, 22), *pt(fx, 24), H('#ffffff'))
    pc.put(*pt(31, 20), SK[2]); pc.put(*pt(32, 21), SK[2]); pc.put(*pt(30, 19), SK[2])

def dracula_sprite():
    pc = PC(64, 64)
    # cape (behind) with folds
    pc.poly([(23, 27), (18, 22), (12, 28), (7, 40), (3, 56), (4, 62), (9, 59), (13, 63), (18, 59), (23, 63), (27, 58), (27, 44), (25, 33)], *CAPE)
    for (x0, y0, x1, y1) in ((14, 32, 9, 56), (19, 34, 15, 58), (23, 42, 21, 60)): pc.line(x0, y0, x1, y1, CAPE[2])
    for (x0, y0, x1, y1) in ((13, 30, 7, 50), (18, 33, 14, 54)): pc.line(x0, y0, x1, y1, CAPE[1])
    pc.poly([(21, 30), (17, 12), (25, 20), (28, 28)], *COAT); pc.line(18, 14, 22, 25, LINING[0])                   # tall collar behind the head
    # back arm + hand
    pc.poly([(25, 29), (21, 31), (18, 44), (19, 50), (23, 50), (25, 40)], *COAT); pc.poly([(18, 50), (23, 50), (23, 55), (19, 55)], *SK)
    for cx in (19, 21, 23): pc.line(cx, 55, cx, 57, SK[0])
    # legs + boots
    pc.poly([(25, 50), (31, 50), (30, 60), (25, 60)], *COAT); pc.poly([(32, 50), (38, 50), (39, 60), (33, 60)], *COAT)
    pc.poly([(23, 60), (31, 60), (31, 63), (22, 63)], *BOOT); pc.poly([(32, 60), (40, 60), (45, 63), (31, 63)], *BOOT)
    # coat, red lining, shirt, belt
    pc.poly([(24, 27), (38, 27), (42, 32), (40, 41), (43, 54), (37, 52), (33, 57), (30, 53), (26, 56), (22, 53), (24, 42), (22, 32)], *COAT)
    pc.poly([(36, 28), (39, 28), (42, 40), (40, 43), (37, 35)], *LINING, outline=False)
    pc.poly([(29, 28), (36, 28), (33, 41)], *SHIRT)
    pc.line(25, 41, 41, 41, COAT[2]); pc.rect(32, 40, 34, 43, GOLD[0]); pc.rect(32, 40, 34, 40, GOLD[1]); pc.put(33, 42, COAT[2])
    pc.rect(32, 31, 34, 33, GOLD[0]); pc.put(33, 32, H('#ff3050')); pc.line(31, 30, 35, 30, GOLD[1])
    for y in (35, 38): pc.put(30, y, GOLD[0])
    pc.line(25, 29, 30, 29, COAT[1]); pc.line(37, 30, 41, 33, COAT[1]); pc.line(23, 45, 22, 52, COAT[1])
    # front arm raised, cuff, hand, claws
    pc.poly([(37, 28), (41, 26), (48, 22), (50, 26), (44, 31), (40, 34)], *COAT)
    pc.poly([(47, 21), (51, 23), (50, 28), (46, 26)], *SHIRT)
    pc.poly([(50, 20), (55, 19), (57, 23), (55, 27), (51, 27)], *SK)
    for (x0, y0, x1, y1) in ((56, 19, 60, 16), (57, 22, 61, 21), (56, 25, 60, 26)): pc.line(x0, y0, x1, y1, SK[1]); pc.put(x1, y1, H('#d02040'))
    # blood orb
    pc.disc(57, 9, 6, H('#a8142c'), H('#ff5a70'), H('#5a0a1a')); pc.disc(56, 8, 3, H('#ff4a62'), H('#ffe0e4'), None, outline=False); pc.put(55, 7, H('#ffffff'))
    for (x, y) in ((50, 4), (63, 6), (52, 14), (62, 14), (58, 1)): pc.put(x, y, H('#ff4a62'))
    # lapel + head last
    pc.poly([(35, 26), (41, 22), (40, 30), (36, 30)], *COAT); pc.line(36, 27, 40, 23, LINING[0])
    dracula_head(pc)
    return stretch(pc, {37: 5, 56: 4})

def dracula_portrait():
    pc = PC(64, 72)
    pc.poly([(6, 72), (10, 58), (24, 52), (44, 52), (58, 58), (62, 72)], *COAT)                      # shoulders
    pc.poly([(26, 52), (38, 52), (32, 72)], *SHIRT); pc.rect(31, 58, 33, 60, GOLD[0]); pc.put(32, 59, H('#ff3050'))
    pc.poly([(8, 60), (2, 20), (24, 44), (22, 58)], *COAT); pc.line(5, 26, 17, 54, LINING[0]); pc.line(6, 28, 18, 54, LINING[1])   # tall collar
    pc.poly([(62, 58), (50, 44), (50, 54), (58, 62)], *COAT)
    dracula_head(pc, 2, -32, -2)
    return pc

# ------------------------------------------------------------------------------------------ NEPTUNE
TEAL = (H('#2fb0c0'), H('#7ae0ff'), H('#1a6a80')); TAN = (H('#e0b48a'), H('#f6d4b0'), H('#a8785a')); WHITE = (H('#f2f6fa'), H('#ffffff'), H('#b8c8d8')); STEEL = (H('#dff6ff'), H('#ffffff'), H('#8ab8d0'))

def neptune_head(pc, S=1, ox=0, oy=0):
    P = lambda pts: [(x * S + ox, y * S + oy) for x, y in pts]; pt = lambda x, y: (x * S + ox, y * S + oy)
    pc.poly(P([(22, 22), (23, 10), (30, 6), (37, 9), (36, 14), (27, 14), (26, 22)]), *WHITE)        # hair
    pc.poly(P([(25, 14), (35, 13), (37, 17), (36, 22), (32, 25), (27, 23), (25, 19)]), *TAN)
    pc.poly(P([(26, 20), (36, 19), (38, 24), (36, 34), (31, 38), (27, 32), (25, 26)]), *WHITE)    # big beard
    for (x0, y0, x1, y1) in ((29, 26, 29, 34), (33, 25, 33, 33)): pc.line(*pt(x0, y0), *pt(x1, y1), WHITE[2])
    for dy in range(S): pc.line(pt(31, 15)[0], pt(31, 15)[1] + dy, pt(36, 14)[0], pt(36, 14)[1] + dy, WHITE[2])
    pc.rect(*pt(33, 16), pt(34, 17)[0] + S - 1, pt(34, 17)[1] + S - 1, H('#ffffff')); pc.rect(*pt(34, 16), pt(34, 16)[0] + S - 1, pt(34, 16)[1] + S - 1, H('#1a6a9a'))
    pc.line(*pt(34, 21), *pt(37, 21), H('#a8785a'))
    pc.poly(P([(24, 10), (25, 3), (28, 8), (31, 1), (34, 8), (37, 3), (37, 10)]), *GOLD)           # crown
    for (x, y, c) in ((26, 8, '#ff4a60'), (31, 6, '#4a9bff'), (36, 8, '#4aff9a')): pc.rect(*pt(x, y), pt(x, y)[0] + S - 1, pt(x, y)[1] + S - 1, H(c))

def neptune_sprite():
    pc = PC(64, 64)
    pc.poly([(22, 26), (14, 30), (8, 44), (6, 60), (14, 57), (20, 62), (26, 58), (28, 44)], *TEAL)
    for (x0, y0, x1, y1) in ((14, 32, 11, 56), (20, 34, 18, 58)): pc.line(x0, y0, x1, y1, TEAL[2])
    pc.poly([(25, 48), (31, 48), (30, 60), (25, 60)], *TAN); pc.poly([(32, 48), (38, 48), (39, 60), (33, 60)], *TAN)
    pc.poly([(23, 60), (31, 60), (31, 63), (22, 63)], *GOLD); pc.poly([(32, 60), (40, 60), (44, 63), (31, 63)], *GOLD)
    pc.poly([(24, 40), (38, 40), (40, 52), (34, 50), (31, 53), (28, 50), (22, 52)], *TEAL)
    for y in (43, 46, 49):
        for x in range(25, 38, 3): pc.put(x + (y % 2), y, TEAL[1])
    pc.poly([(24, 28), (20, 30), (17, 40), (21, 42), (25, 34)], *TAN)
    pc.poly([(24, 26), (38, 26), (40, 32), (38, 41), (25, 41), (23, 32)], *TAN)
    pc.poly([(26, 28), (36, 28), (34, 35), (28, 35)], *GOLD); pc.line(25, 40, 39, 40, GOLD[0]); pc.rect(31, 39, 33, 41, GOLD[1])
    pc.disc(24, 27, 3, *GOLD); pc.disc(38, 27, 3, *GOLD)
    pc.poly([(38, 27), (44, 25), (50, 22), (52, 26), (45, 30), (40, 33)], *TAN); pc.disc(53, 24, 3, *TAN)
    pc.rect(52, 7, 53, 62, STEEL[0]); pc.line(52, 7, 52, 62, STEEL[1]); pc.line(53, 7, 53, 62, STEEL[2])       # trident
    pc.rect(48, 8, 58, 9, STEEL[0])
    for x in (48, 52, 58): pc.rect(x, 2 if x != 52 else 0, x + 1, 9, STEEL[0]); pc.put(x, 2 if x != 52 else 0, H('#7ae0ff')); pc.put(x + 1, 2 if x != 52 else 0, H('#ffffff'))
    neptune_head(pc)
    return stretch(pc, {37: 4, 56: 3})
def neptune_portrait():
    pc = PC(64, 72)
    pc.poly([(6, 72), (10, 58), (24, 52), (44, 52), (58, 58), (62, 72)], *TEAL); pc.disc(10, 58, 6, *GOLD); pc.disc(56, 58, 6, *GOLD)
    neptune_head(pc, 2, -26, 4)
    return pc

# ------------------------------------------------------------------------------------------ PUMPKING
ORG = (H('#e8801c'), H('#ffb14a'), H('#a8500e')); VINE = (H('#3a7a2e'), H('#6ab048'), H('#235019')); GLOW = (H('#ffe14a'), H('#fff6a0'), H('#e8a010'))

def pumpking_head(pc, S=1, ox=0, oy=0):
    P = lambda pts: [(x * S + ox, y * S + oy) for x, y in pts]; pt = lambda x, y: (x * S + ox, y * S + oy)
    pc.poly(P([(30, 5), (32, 0), (37, 1), (36, 6)]), *VINE)
    pc.poly(P([(14, 18), (20, 8), (32, 5), (44, 8), (50, 18), (48, 30), (40, 36), (24, 36), (16, 30)]), *ORG)
    for (x0, y0, x1, y1) in ((24, 8, 21, 34), (32, 6, 32, 36), (40, 8, 43, 34)): pc.line(*pt(x0, y0), *pt(x1, y1), ORG[2])
    pc.poly(P([(20, 16), (28, 16), (24, 24)]), *GLOW); pc.poly(P([(36, 16), (44, 16), (40, 24)]), *GLOW)
    pc.poly(P([(20, 27), (24, 25), (28, 28), (32, 25), (36, 28), (40, 25), (44, 27), (42, 32), (38, 30), (32, 33), (26, 30), (22, 32)]), *GLOW)
    pc.line(*pt(22, 17), *pt(27, 15), ORG[2]); pc.line(*pt(41, 15), *pt(46, 17), ORG[2])

def pumpking_sprite():
    pc = PC(64, 64)
    pc.poly([(24, 34), (40, 34), (42, 48), (46, 60), (38, 62), (32, 52), (26, 62), (18, 60), (22, 48)], *VINE)
    for (x0, y0, x1, y1) in ((28, 40, 25, 58), (36, 40, 40, 58), (32, 38, 32, 50)): pc.line(x0, y0, x1, y1, VINE[2])
    pc.poly([(24, 36), (14, 40), (8, 52), (11, 54), (18, 46), (24, 44)], *VINE)
    pc.poly([(40, 36), (48, 32), (56, 26), (58, 30), (50, 38), (42, 42)], *VINE)
    for (x0, y0, x1, y1) in ((57, 26, 61, 22), (58, 28, 63, 27), (58, 30, 62, 33)): pc.line(x0, y0, x1, y1, VINE[0]); pc.put(x1, y1, VINE[1])
    pumpking_head(pc)
    return stretch(pc, {45: 3, 58: 2})
def pumpking_portrait():
    pc = PC(80, 72)
    pc.poly([(6, 72), (14, 60), (30, 54), (52, 54), (68, 60), (76, 72)], *VINE)
    pumpking_head(pc, 2, -24, -6)
    return pc

# ------------------------------------------------------------------------------------------ SINISTER CLAUS
RED = (H('#c0262d'), H('#ec5058'), H('#7a1018')); FUR = (H('#f6f2f4'), H('#ffffff'), H('#c8c0cc')); SACK = (H('#8a6a3a'), H('#b08a50'), H('#5a4020')); PEACH = (H('#e8c0a0'), H('#fadcc4'), H('#b88a70'))

def claus_head(pc, S=1, ox=0, oy=0):
    P = lambda pts: [(x * S + ox, y * S + oy) for x, y in pts]; pt = lambda x, y: (x * S + ox, y * S + oy)
    pc.poly(P([(25, 14), (35, 13), (38, 17), (37, 22), (32, 25), (27, 23), (25, 19)]), *PEACH)
    pc.poly(P([(25, 20), (37, 19), (39, 24), (36, 33), (31, 37), (27, 32), (24, 26)]), *FUR)                 # beard
    pc.poly(P([(30, 20), (38, 19), (41, 21), (37, 24), (31, 23)]), *FUR)                                       # moustache
    pc.poly(P([(24, 10), (26, 2), (36, 0), (42, 6), (40, 12), (26, 13)]), *RED)                               # hat
    pc.poly(P([(24, 10), (40, 12), (40, 15), (24, 13)]), *FUR)
    pc.disc(pt(44, 2)[0], pt(44, 2)[1], 2 * S + 1, *FUR)
    for dy in range(S): pc.line(pt(30, 16)[0], pt(30, 16)[1] + dy, pt(37, 18)[0], pt(37, 18)[1] + dy, H('#2a0a10'))   # angry brow
    pc.rect(*pt(33, 18), pt(35, 18)[0] + S - 1, pt(35, 18)[1] + S - 1, H('#ff2a2a')); pc.put(pt(33, 18)[0], pt(33, 18)[1], H('#ffd0d0'))
    pc.line(*pt(33, 26), *pt(36, 26), H('#7a1018'))

def claus_sprite():
    pc = PC(64, 64)
    pc.poly([(14, 30), (8, 42), (10, 56), (20, 60), (26, 52), (24, 36)], *SACK); pc.line(12, 34, 20, 34, SACK[2]); pc.rect(13, 31, 15, 33, GOLD[0])
    pc.poly([(25, 50), (31, 50), (30, 60), (25, 60)], *RED); pc.poly([(32, 50), (38, 50), (39, 60), (33, 60)], *RED)
    pc.poly([(23, 60), (31, 60), (31, 63), (22, 63)], *BOOT); pc.poly([(32, 60), (40, 60), (45, 63), (31, 63)], *BOOT)
    pc.poly([(23, 27), (39, 27), (42, 34), (41, 48), (43, 56), (22, 56), (22, 40), (21, 33)], *RED)
    pc.rect(30, 28, 33, 55, FUR[0]); pc.line(30, 28, 30, 55, FUR[1]); pc.rect(22, 54, 43, 57, FUR[0]); pc.line(22, 54, 43, 54, FUR[1])
    pc.rect(23, 42, 41, 44, H('#17101c')); pc.rect(30, 41, 34, 45, GOLD[0]); pc.rect(31, 42, 33, 44, H('#17101c'))
    pc.poly([(38, 28), (44, 26), (49, 24), (50, 28), (44, 32), (40, 34)], *RED); pc.poly([(47, 22), (51, 24), (50, 29), (46, 27)], *FUR); pc.disc(52, 25, 3, *BOOT)
    for y in range(6, 62, 6):                                                                                # candy cane staff
        pc.rect(52, y, 53, y + 2, H('#ec2a3e')); pc.rect(52, y + 3, 53, y + 5, H('#ffffff'))
    pc.line(51, 5, 48, 2, H('#ec2a3e')); pc.line(48, 2, 45, 4, H('#ffffff')); pc.line(45, 4, 44, 8, H('#ec2a3e'))
    claus_head(pc)
    return stretch(pc, {37: 4, 56: 3})
def claus_portrait():
    pc = PC(64, 72)
    pc.poly([(4, 72), (10, 58), (24, 52), (44, 52), (58, 58), (62, 72)], *RED); pc.rect(28, 56, 36, 72, FUR[0])
    claus_head(pc, 2, -26, 2)
    return pc

# ------------------------------------------------------------------------------------------ the trembling villager (portrait only)
def villager_portrait():
    pc = PC(64, 72); BR = (H('#6a4a2a'), H('#8a6a40'), H('#3a2814'))
    pc.poly([(6, 72), (12, 58), (24, 54), (42, 54), (56, 58), (60, 72)], H('#8a7a5a'), H('#a89878'), H('#5a4c34')); pc.line(30, 56, 32, 72, H('#5a4c34'))
    pc.poly([(16, 20), (46, 18), (50, 30), (46, 46), (36, 54), (24, 50), (16, 36)], H('#e8c0a0'), H('#fadcc4'), H('#b88a70'))
    pc.poly([(12, 28), (16, 8), (30, 2), (46, 6), (52, 22), (46, 18), (32, 14), (22, 20), (18, 34)], *BR)
    for (x, y) in ((20, 6), (36, 4), (48, 12), (14, 20)): pc.line(x, y, x + 5, y + 6, BR[1])
    for x in (26, 40): pc.disc(x, 30, 5, H('#ffffff'), None, None); pc.rect(x + 1, 30, x + 2, 32, H('#1a1218'))
    pc.line(21, 22, 30, 20, BR[2]); pc.line(38, 20, 47, 23, BR[2])
    pc.rect(31, 42, 38, 47, H('#4a1a20')); pc.rect(32, 43, 37, 44, H('#f4f0f0')); pc.put(46, 36, H('#8ad0ff')); pc.put(46, 39, H('#8ad0ff'))
    return pc

BOSS_ART = {'dracula': dracula_sprite, 'neptune': neptune_sprite, 'pumpking': pumpking_sprite, 'evil_santa': claus_sprite}
PORTRAITS = {'dracula': dracula_portrait, 'neptune': neptune_portrait, 'pumpking': pumpking_portrait, 'evil_santa': claus_portrait, 'villager': villager_portrait}

# ------------------------------------------------------------------------------------------ PALS (hand-pixeled critters, side view facing right, 44x40)
def T(base, light, dark): return (H(base), H(light), H(dark))
def pal_quad(pc, body, belly, ears='point', tail='fluffy', extra=None, accent='#ffffff', eye='#15101a', blush=None):
    B, L, D = body; BL = belly
    # tail
    if tail == 'fluffy': pc.poly([(9, 17), (3, 11), (1, 17), (4, 23), (10, 22)], *body); pc.put(2, 13, L)
    elif tail == 'flame': pc.poly([(9, 18), (4, 14), (1, 8), (6, 11), (5, 4), (10, 12), (12, 18)], T('#e8541a', '#ffb02e', '#a82a0a')[0], T('#e8541a', '#ffb02e', '#a82a0a')[1], T('#e8541a', '#ffb02e', '#a82a0a')[2]); pc.poly([(7, 15), (5, 8), (9, 13)], H('#fff0a0'), None, None, outline=False)
    elif tail == 'leaf': pc.poly([(9, 19), (4, 15), (2, 9), (8, 13)], T('#58b038', '#a0e070', '#2a6a1a')[0], T('#58b038', '#a0e070', '#2a6a1a')[1], T('#58b038', '#a0e070', '#2a6a1a')[2]); pc.poly([(9, 20), (3, 21), (1, 26), (8, 24)], T('#58b038', '#a0e070', '#2a6a1a')[0], T('#58b038', '#a0e070', '#2a6a1a')[1], T('#58b038', '#a0e070', '#2a6a1a')[2])
    elif tail == 'zig': pc.poly([(9, 17), (5, 16), (7, 12), (2, 11), (5, 6), (1, 2), (11, 11), (8, 14), (12, 18)], H('#ffe14a'), H('#fff6a0'), H('#c89a10'))
    elif tail == 'fin': pc.poly([(9, 17), (2, 9), (1, 17), (2, 25), (9, 22)], T('#2f7fc0', '#6ab8f0', '#1a5a98')[0], T('#2f7fc0', '#6ab8f0', '#1a5a98')[1], T('#2f7fc0', '#6ab8f0', '#1a5a98')[2])
    else: pc.poly([(9, 18), (3, 17), (3, 20), (9, 21)], *body)
    # legs
    for (x0, x1) in ((11, 15), (16, 20), (24, 28), (29, 33)):
        pc.poly([(x0, 24), (x1, 24), (x1, 31), (x0 - 1, 31)], *body); pc.put(x0, 31, D); pc.put(x1 - 1, 31, D)
    pc.poly([(7, 17), (11, 12), (24, 11), (30, 14), (32, 21), (27, 26), (12, 26), (7, 22)], *body)
    pc.poly([(13, 21), (27, 21), (26, 26), (14, 26)], BL, None, None, outline=False)
    pc.line(12, 14, 20, 12, L)
    if extra == 'spikes':
        for k, x in enumerate((11, 15, 19, 23)): pc.poly([(x, 12), (x + 2, 6 - (k % 2) * 2), (x + 4, 12)], T(accent, '#ffffff', '#8ab8d0')[0], T(accent, '#ffffff', '#8ab8d0')[1], T(accent, '#ffffff', '#8ab8d0')[2])
    if extra == 'fins': pc.poly([(13, 12), (17, 5), (21, 12)], T('#2f7fc0', '#6ab8f0', '#1a5a98')[0], T('#2f7fc0', '#6ab8f0', '#1a5a98')[1], T('#2f7fc0', '#6ab8f0', '#1a5a98')[2]); pc.poly([(21, 11), (24, 6), (27, 12)], T('#2f7fc0', '#6ab8f0', '#1a5a98')[0], None, T('#2f7fc0', '#6ab8f0', '#1a5a98')[2])
    if extra == 'crystals':
        for k, x in enumerate((11, 16, 21, 26)): pc.poly([(x, 12), (x + 2, 4 - (k % 2) * 2), (x + 4, 12)], T('#d8b8ff', '#ffffff', '#8a5ad0')[0], T('#d8b8ff', '#ffffff', '#8a5ad0')[1], T('#d8b8ff', '#ffffff', '#8a5ad0')[2])
    if extra == 'sparks': pc.disc(30, 21, 2, H('#ff4a4a'), None, None); pc.put(31, 11, H('#fff6a0')); pc.put(15, 9, H('#fff6a0'))
    # head
    pc.poly([(26, 9), (32, 6), (38, 9), (40, 14), (37, 20), (28, 21), (25, 15)], *body)
    pc.poly([(33, 14), (40, 14), (37, 20), (31, 20)], BL, None, None, outline=False); pc.put(39, 15, H('#2a1a1a')); pc.put(38, 15, H('#2a1a1a'))
    if ears == 'point':
        pc.poly([(27, 9), (27, 2), (32, 7)], *body); pc.poly([(33, 6), (36, 1), (37, 9)], *body); pc.put(28, 5, H('#ffb0b8')); pc.put(35, 4, H('#ffb0b8'))
    elif ears == 'round': pc.disc(29, 6, 3, *body); pc.disc(35, 5, 3, *body); pc.put(29, 6, H('#ffb0b8')); pc.put(35, 5, H('#ffb0b8'))
    elif ears == 'leaf': pc.poly([(27, 9), (25, 2), (31, 7)], T('#58b038', '#a0e070', '#2a6a1a')[0], T('#58b038', '#a0e070', '#2a6a1a')[1], T('#58b038', '#a0e070', '#2a6a1a')[2]); pc.poly([(32, 6), (36, 0), (37, 8)], T('#58b038', '#a0e070', '#2a6a1a')[0], T('#58b038', '#a0e070', '#2a6a1a')[1], T('#58b038', '#a0e070', '#2a6a1a')[2]); pc.disc(32, 4, 1, H('#ff7aa8'), None, None, outline=False)
    elif ears == 'horn': pc.poly([(27, 9), (25, 2), (30, 7)], H('#f0ead8'), H('#ffffff'), H('#b0a888')); pc.poly([(33, 6), (35, 0), (37, 8)], H('#f0ead8'), H('#ffffff'), H('#b0a888'))
    pc.rect(33, 11, 34, 12, H(eye)); pc.put(34, 11, H('#ffffff')) if False else None; pc.put(33, 11, H('#ffffff'))
    if blush: pc.put(31, 16, H(blush)); pc.put(32, 16, H(blush))

def pal_pebblin(pc):
    C = T('#8a8f98', '#b8bcc4', '#565b64')
    pc.poly([(8, 12), (14, 6), (26, 6), (33, 12), (35, 22), (30, 30), (12, 30), (7, 22)], *C)
    pc.poly([(9, 22), (3, 26), (6, 30), (12, 28)], *C); pc.poly([(33, 22), (39, 26), (36, 30), (30, 28)], *C)
    for (x, y) in ((14, 12), (22, 9), (28, 16)): pc.line(x, y, x + 3, y + 3, C[2])
    pc.disc(16, 12, 2, H('#6aa84a'), None, None, outline=False); pc.disc(26, 23, 1, H('#6aa84a'), None, None, outline=False)
    for x in (18, 27): pc.poly([(x - 2, 14), (x + 2, 14), (x + 2, 19), (x - 2, 19)], H('#ffffff'), None, None); pc.rect(x, 16, x + 1, 18, H('#15101a'))
    pc.line(20, 24, 24, 24, C[2]); pc.rect(11, 30, 17, 32, C[2]); pc.rect(25, 30, 31, 32, C[2])
def pal_mossback(pc):
    SK = T('#7a9a5a', '#a8c880', '#4a6a34'); SH = T('#5a6a4a', '#8a9a70', '#363e2a')
    for (x0, x1) in ((9, 15), (26, 32)): pc.poly([(x0, 26), (x1, 26), (x1, 33), (x0 - 1, 33)], *SK)
    pc.poly([(33, 17), (38, 14), (42, 18), (41, 24), (34, 25)], *SK); pc.rect(38, 17, 39, 18, H('#15101a')); pc.put(38, 17, H('#ffffff')); pc.line(38, 22, 41, 22, SK[2])
    pc.poly([(4, 24), (6, 12), (14, 5), (26, 5), (33, 11), (35, 24)], *SH)
    for (x, y, r) in ((13, 11, 3), (24, 9, 3), (29, 17, 2), (10, 18, 2)): pc.disc(x, y, r, H('#7ac04a'), H('#b8f080'), H('#3a8a28'), outline=False)
    for (x0, y0, x1, y1) in ((12, 22, 12, 8), (20, 22, 20, 6), (28, 22, 28, 10), (6, 17, 33, 17)): pc.line(x0, y0, x1, y1, SH[2])
    pc.poly([(16, 6), (18, 1), (22, 5)], T('#ff7aa8', '#ffb0c8', '#c0406a')[0], None, None); pc.put(19, 3, H('#ffe14a'))
def pal_sunbird(pc):
    O = T('#ffb02e', '#ffd868', '#c8701a'); R = T('#e8541a', '#ff8a3a', '#a8300a')
    pc.poly([(10, 18), (3, 10), (1, 24), (6, 22), (4, 30), (12, 24)], *R)
    pc.poly([(14, 16), (12, 6), (22, 3), (30, 8), (28, 16)], *O); pc.line(14, 14, 24, 7, H('#fff0a0')); pc.line(16, 16, 26, 10, R[2])
    pc.poly([(10, 14), (14, 12), (30, 13), (35, 18), (33, 25), (22, 29), (12, 26), (9, 20)], *O); pc.poly([(16, 21), (30, 21), (27, 27), (18, 27)], H('#fff3a8'), None, None, outline=False)
    pc.poly([(31, 14), (34, 11), (38, 14), (37, 20), (32, 21)], *O); pc.poly([(37, 15), (43, 17), (37, 19)], H('#e86a2a'), H('#ff9a4a'), H('#a8300a'))
    pc.rect(34, 15, 35, 16, H('#15101a')); pc.put(34, 15, H('#ffffff')); pc.poly([(33, 11), (34, 6), (36, 11)], R[0], R[1], R[2]); pc.poly([(30, 10), (30, 5), (32, 10)], R[0], R[1], R[2])
    pc.line(20, 29, 20, 34, R[2]); pc.line(26, 28, 26, 34, R[2]); pc.line(18, 34, 22, 34, R[2]); pc.line(24, 34, 28, 34, R[2])
    pc.disc(22, 4, 0, H('#fff3a8'), None, None, outline=False); pc.line(16, 1, 28, 1, H('#fff3a8')); pc.line(18, 0, 26, 0, H('#fff3a8'))
def pal_gloomoth(pc):
    P = T('#5a4a8a', '#8a7ac0', '#34285a'); W = T('#3a2a5a', '#6a5a9a', '#1e1236')
    pc.poly([(20, 17), (10, 5), (2, 8), (3, 18), (10, 24), (19, 22)], *W); pc.poly([(20, 18), (12, 24), (6, 32), (14, 36), (20, 28)], *W)
    pc.poly([(23, 15), (27, 5), (36, 6), (37, 16), (30, 20)], *P); pc.poly([(23, 20), (30, 22), (31, 32), (24, 34)], *P)
    pc.disc(8, 13, 3, H('#c8a0ff'), H('#f0e0ff'), H('#7a40c0')); pc.disc(8, 13, 1, H('#1a0a2e'), None, None, outline=False); pc.disc(33, 11, 2, H('#c8a0ff'), H('#f0e0ff'), H('#7a40c0'))
    pc.poly([(21, 14), (27, 12), (31, 17), (28, 26), (22, 28), (19, 21)], T('#2a2040', '#4a3a70', '#16101e')[0], T('#2a2040', '#4a3a70', '#16101e')[1], T('#2a2040', '#4a3a70', '#16101e')[2])
    pc.poly([(27, 11), (31, 9), (34, 13), (31, 17)], T('#3a2e58', '#5a4a88', '#1e1630')[0], T('#3a2e58', '#5a4a88', '#1e1630')[1], T('#3a2e58', '#5a4a88', '#1e1630')[2])
    pc.rect(31, 11, 32, 12, H('#ff6ad0')); pc.line(32, 9, 38, 3, H('#c8a0ff')); pc.line(34, 11, 41, 6, H('#c8a0ff')); pc.put(38, 3, H('#ffffff')); pc.put(41, 6, H('#ffffff'))
    pc.line(22, 26, 21, 31, H('#16101e')); pc.line(25, 27, 25, 32, H('#16101e'))
def pal_oreback(pc):
    SK = T('#a08a70', '#c8b090', '#6a5a46'); SHELL = T('#6a5a4a', '#8a7a68', '#3e3428'); G = T('#e8b43c', '#ffe27a', '#9c6a18')
    pc.poly([(9, 22), (3, 20), (1, 23), (8, 26)], *SK)
    for (x0, x1) in ((11, 16), (24, 29)): pc.poly([(x0, 27), (x1, 27), (x1, 33), (x0 - 1, 33)], *SK)
    pc.poly([(33, 17), (37, 14), (43, 20), (37, 26), (32, 25)], *SK); pc.rect(37, 17, 38, 18, H('#15101a')); pc.put(37, 17, H('#ffffff')); pc.put(42, 20, H('#2a1a1a'))
    pc.poly([(31, 14), (30, 8), (35, 12)], *SK)
    pc.poly([(5, 24), (8, 12), (16, 6), (26, 6), (33, 14), (34, 25)], *SHELL)
    for x in (11, 16, 21, 26): pc.line(x, 25, x + 1, 8, SHELL[2])
    for (x, y) in ((13, 12), (19, 16), (24, 11), (28, 19), (10, 19)): pc.rect(x, y, x + 1, y + 1, G[0]); pc.put(x, y, G[1]); pc.put(x + 1, y + 1, G[2])
def pal_wispy(pc):
    C = T('#a8f0e0', '#e8fff8', '#58b8a8')
    pc.poly([(6, 18), (12, 10), (24, 8), (32, 14), (33, 24), (28, 32), (22, 28), (17, 34), (12, 28), (6, 30)], *C)
    pc.poly([(12, 16), (22, 13), (28, 18), (26, 26), (16, 27)], T('#d0fff4', '#ffffff', '#88d8c8')[0], None, None, outline=False)
    pc.rect(20, 17, 21, 21, H('#1a3a4a')); pc.rect(27, 17, 28, 21, H('#1a3a4a')); pc.put(20, 17, H('#ffffff')); pc.put(27, 17, H('#ffffff')); pc.line(22, 25, 25, 25, H('#1a3a4a'))
    pc.line(26, 8, 26, 3, H('#8a6a30')); pc.line(26, 3, 31, 2, H('#8a6a30')); pc.poly([(29, 2), (35, 2), (34, 9), (30, 9)], H('#ffe27a'), H('#fff6c0'), H('#c8961a')); pc.put(32, 5, H('#ffffff'))
def pal_drakeling(pc):
    R = T('#c44a4a', '#ee7a7a', '#7a2020'); BL = H('#ffd9a0'); W = T('#8a2a2a', '#b84a4a', '#521414')
    pc.poly([(9, 22), (3, 22), (1, 26), (5, 27), (3, 31), (10, 27)], *R); pc.poly([(1, 25), (0, 22), (3, 24)], H('#ffe27a'), None, None, outline=False)
    pc.poly([(14, 14), (8, 3), (19, 8), (22, 14)], *W)
    for (x0, x1) in ((12, 17), (26, 31)): pc.poly([(x0, 27), (x1, 27), (x1, 34), (x0 - 1, 34)], *R); pc.line(x0, 34, x0 + 1, 35, H('#f0ead8'))
    pc.poly([(9, 21), (12, 14), (26, 13), (33, 18), (33, 27), (28, 31), (12, 31), (8, 27)], *R); pc.poly([(14, 22), (30, 22), (28, 30), (16, 30)], BL, None, None, outline=False)
    for k, x in enumerate((13, 17, 21, 25)): pc.poly([(x, 14), (x + 2, 10), (x + 4, 14)], H('#ffb02e'), H('#ffe27a'), H('#c8701a'))
    pc.poly([(29, 10), (34, 7), (41, 11), (42, 17), (36, 22), (29, 20)], *R); pc.poly([(36, 15), (43, 15), (41, 21), (35, 21)], BL, None, None, outline=False)
    pc.poly([(30, 9), (28, 2), (33, 7)], H('#f0ead8'), H('#ffffff'), H('#b0a888')); pc.poly([(35, 6), (37, 0), (39, 8)], H('#f0ead8'), H('#ffffff'), H('#b0a888'))
    pc.rect(35, 11, 36, 12, H('#ffe14a')); pc.put(36, 12, H('#15101a')); pc.put(41, 16, H('#7a2020')); pc.put(44, 17, H('#ffb02e')) if False else None
def pal_voidling(pc):
    D = T('#2a1250', '#5a2aa0', '#12082a'); A = H('#9a4aff')
    for k in range(7):
        import math as _m; a = k * 0.9
        pc.poly([(round(22 + 12 * _m.cos(a)), round(20 + 12 * _m.sin(a))), (round(22 + 20 * _m.cos(a + 0.12)), round(20 + 20 * _m.sin(a + 0.12))), (round(22 + 12 * _m.cos(a + 0.3)), round(20 + 12 * _m.sin(a + 0.3)))], A, H('#d8b0ff'), H('#5a2aa0'))
    pc.disc(22, 20, 11, *D); pc.disc(22, 20, 7, H('#3a1a6a'), None, None, outline=False)
    pc.poly([(23, 14), (32, 14), (33, 21), (27, 24), (21, 22), (20, 17)], H('#f5eaff'), H('#ffffff'), H('#b8a0d8')); pc.disc(27, 19, 2, H('#9a2aff'), None, None, outline=False); pc.put(27, 19, H('#05000a')); pc.put(26, 18, H('#ffffff'))
    pc.line(18, 27, 22, 29, H('#f5eaff')); pc.line(22, 29, 27, 27, H('#f5eaff')); pc.put(20, 28, H('#ffffff')); pc.put(24, 28, H('#ffffff'))

PAL_ART = {
  'pebblin': pal_pebblin, 'mossback': pal_mossback, 'sunbird': pal_sunbird, 'gloomoth': pal_gloomoth, 'oreback': pal_oreback, 'wispy': pal_wispy, 'drakeling': pal_drakeling, 'voidling': pal_voidling,
  'sparklit':  lambda pc: pal_quad(pc, T('#ffe14a', '#fff6a0', '#c89a10'), H('#fff6d0'), 'round', 'zig', 'sparks', blush='#ff4a4a'),
  'leafling':  lambda pc: pal_quad(pc, T('#a8825a', '#d0aa80', '#6a4a2a'), H('#ecd8b0'), 'leaf', 'leaf'),
  'aquafin':   lambda pc: pal_quad(pc, T('#4aa8e0', '#8ad0f8', '#2a6aa0'), H('#d8f4ff'), 'point', 'fin', 'fins'),
  'cinderfox': lambda pc: pal_quad(pc, T('#e86a2a', '#ff9a5a', '#a8400e'), H('#ffe0b0'), 'point', 'flame'),
  'frostpaw':  lambda pc: pal_quad(pc, T('#d8f0ff', '#ffffff', '#8ab8d8'), H('#ffffff'), 'round', 'fluffy', 'spikes', accent='#9be7ff'),
  'crystaleon': lambda pc: pal_quad(pc, T('#b898f0', '#e0d0ff', '#6a48b0'), H('#f0e0ff'), 'horn', 'fluffy', 'crystals'),
}
def pal_sprite(name):
    pc = PC(44, 40); PAL_ART[name](pc); return pc

# ------------------------------------------------------------------------------------------ COMMON MOBS (hand-pixeled, side view facing right)
W_ = H('#ffffff'); EYEC = H('#15101a')
def slime_art(c, extra=None):
    def f(pc):
        base, light, dark = (H(x) for x in c)
        pc.poly([(3, 24), (4, 16), (9, 9), (20, 5), (31, 9), (36, 16), (37, 24), (31, 27), (9, 27)], base, light, dark)
        pc.poly([(8, 22), (10, 16), (16, 12), (24, 12), (30, 16), (32, 22)], light, None, None, outline=False)
        pc.line(10, 11, 15, 8, W_); pc.put(9, 13, W_); pc.put(11, 13, W_)
        for x in (14, 25): pc.rect(x, 15, x + 2, 19, EYEC); pc.put(x, 15, W_); pc.put(x + 1, 16, W_)
        pc.line(18, 22, 22, 22, dark); pc.put(5, 28, base); pc.put(34, 28, base)
        if extra == 'lava':
            for (x0, y0, x1, y1) in ((10, 20, 14, 24), (28, 18, 31, 23), (20, 8, 22, 12)): pc.line(x0, y0, x1, y1, H('#ffd23f'))
            for (x, y) in ((8, 3), (30, 2), (20, 0)): pc.put(x, y, H('#ff8a1a')); pc.put(x + 1, y + 1, H('#ffd23f'))
        elif extra == 'ice':
            for x, h in ((10, 5), (17, 8), (24, 6), (30, 4)): pc.poly([(x, 10), (x + 2, 10 - h), (x + 4, 10)], H('#e8faff'), H('#ffffff'), H('#7ac8f0'))
        elif extra == 'toxic':
            for (x, y, r) in ((10, 20, 2), (29, 22, 2), (22, 9, 1)): pc.disc(x, y, r, H('#d0ff90'), H('#f0ffd0'), H('#6aba24'), outline=False)
            pc.put(7, 17, dark); pc.put(33, 14, dark)
        elif extra == 'red':
            pc.poly([(9, 11), (7, 5), (13, 9)], H('#7a1018'), H('#c0262d'), H('#40080c')); pc.poly([(31, 11), (33, 5), (27, 9)], H('#7a1018'), H('#c0262d'), H('#40080c'))
        elif extra == 'purple':
            pc.put(20, 7, W_); pc.put(19, 8, W_); pc.put(21, 8, W_); pc.put(20, 9, W_)
    return lambda: _mk(40, 30, f)
def _mk(w, h, f): pc = PC(w, h); f(pc); return pc

def wolf_art(fur, light, dark, belly, eye, extra=None):
    def f(pc):
        F = (H(fur), H(light), H(dark))
        if extra == 'flame':
            for k, x in enumerate((14, 20, 26, 32)): pc.poly([(x, 12), (x + 2, 3 - (k % 2) * 2), (x + 4, 12)], H('#ff8a1a'), H('#ffd23f'), H('#c8300a'))
            pc.poly([(10, 17), (3, 9), (0, 17), (2, 6), (7, 11)], H('#ff8a1a'), H('#ffd23f'), H('#c8300a'))
        else: pc.poly([(10, 17), (3, 11), (1, 19), (4, 26), (10, 23)], *F)
        for x0 in (14, 21, 35, 42): pc.poly([(x0, 25), (x0 + 4, 25), (x0 + 4, 34), (x0 - 1, 34)], *F); pc.put(x0 - 1, 34, F[2]); pc.put(x0, 34, F[2])
        pc.poly([(9, 21), (10, 16), (16, 11), (32, 10), (42, 13), (46, 20), (43, 26), (14, 27), (9, 24)], *F)
        pc.poly([(16, 22), (40, 22), (38, 26), (18, 26)], H(belly), None, None, outline=False)
        pc.poly([(39, 11), (44, 7), (47, 17), (42, 24)], H(light), None, F[2])
        if extra == 'ice':
            for k, x in enumerate((14, 20, 26, 32)): pc.poly([(x, 11), (x + 2, 4 - (k % 2) * 2), (x + 4, 11)], H('#e8faff'), H('#ffffff'), H('#7ac8f0'))
        pc.poly([(43, 12), (48, 8), (55, 12), (59, 18), (55, 22), (46, 22), (42, 18)], *F); pc.poly([(53, 15), (60, 17), (58, 21), (52, 21)], H(belly), None, None, outline=False)
        pc.put(59, 17, EYEC); pc.put(58, 17, EYEC); pc.poly([(44, 9), (45, 2), (49, 8)], *F); pc.poly([(50, 7), (53, 2), (54, 10)], *F); pc.put(45, 5, H('#ffb0b8')); pc.put(52, 5, H('#ffb0b8'))
        pc.rect(50, 12, 51, 13, H(eye)); pc.put(50, 12, W_); pc.line(53, 21, 56, 21, H('#6a1022')); pc.put(54, 22, W_); pc.put(56, 22, W_)
    return lambda: _mk(62, 38, f)

def goblin_art():
    def f(pc):
        G = (H('#6aa84f'), H('#98d078'), H('#3a6a2a')); CL = (H('#7a5a30'), H('#a8804a'), H('#4a341a'))
        for x0 in (16, 24): pc.poly([(x0, 32), (x0 + 5, 32), (x0 + 5, 42), (x0 - 1, 42)], *G); pc.poly([(x0 - 2, 42), (x0 + 6, 42), (x0 + 6, 45), (x0 - 2, 45)], H('#4a341a'), None, H('#2a1c0e'))
        pc.poly([(13, 20), (17, 14), (28, 14), (31, 21), (30, 34), (14, 34)], *G); pc.poly([(14, 28), (30, 28), (31, 36), (13, 36)], *CL)
        pc.poly([(30, 18), (36, 22), (40, 28), (37, 30), (31, 25)], *G); pc.poly([(13, 18), (9, 24), (10, 30), (14, 26)], *G)
        pc.poly([(34, 14), (41, 8), (42, 16), (39, 26), (35, 24)], H('#6a4220'), H('#9a6a3a'), H('#3a2210')); pc.put(40, 11, H('#c0c0c8')); pc.put(41, 14, H('#c0c0c8')); pc.put(40, 18, H('#c0c0c8'))   # club
        pc.poly([(18, 5), (28, 4), (33, 9), (34, 15), (28, 19), (19, 18), (16, 11)], *G); pc.poly([(17, 9), (6, 5), (12, 12), (17, 14)], *G)     # head + big ear
        pc.poly([(30, 11), (36, 13), (31, 15)], H('#8ac060'), None, G[2]); pc.rect(26, 8, 28, 10, H('#ffe14a')); pc.put(28, 9, EYEC); pc.line(24, 7, 29, 8, G[2])
        pc.line(24, 16, 30, 16, H('#3a1a1a')); pc.put(25, 15, W_); pc.put(28, 15, W_); pc.rect(15, 20, 29, 21, H('#4a341a'))
    return lambda: _mk(46, 48, f)

def skeleton_art():
    def f(pc):
        B = (H('#e8e2cf'), H('#fffaf0'), H('#a89c80'))
        for x0 in (17, 24): pc.rect(x0, 33, x0 + 2, 44, B[0]); pc.rect(x0 - 1, 44, x0 + 4, 46, B[2]); pc.line(x0, 33, x0, 44, B[1])
        pc.rect(20, 28, 22, 33, B[0]); pc.rect(15, 32, 27, 34, B[2])
        for y in (18, 21, 24): pc.poly([(15, y), (27, y), (26, y + 2), (16, y + 2)], *B)
        pc.rect(20, 14, 22, 28, B[2]); pc.line(21, 15, 21, 27, B[1])
        pc.line(26, 18, 33, 21, B[0]); pc.line(33, 21, 37, 19, B[0]); pc.poly([(36, 17), (38, 17), (38, 21), (36, 21)], *B)
        pc.line(14, 18, 10, 24, B[0]); pc.rect(9, 24, 10, 26, B[0])
        pc.poly([(35, 6), (38, 8), (41, 14), (41, 24), (38, 30), (35, 32), (37, 24), (37, 14)], H('#7a5030'), H('#a87a48'), H('#3e2810')); pc.line(36, 7, 36, 31, H('#e8e8e8'))
        pc.poly([(15, 5), (22, 3), (28, 6), (29, 12), (26, 15), (17, 15), (14, 11)], *B); pc.rect(18, 8, 20, 10, EYEC); pc.rect(24, 8, 26, 10, EYEC); pc.put(19, 9, H('#ff3030')); pc.put(25, 9, H('#ff3030'))
        pc.rect(18, 13, 26, 14, B[2]); [pc.put(x, 13, EYEC) for x in (19, 21, 23, 25)]
    return lambda: _mk(44, 50, f)

def zombie_art(skin, cloth, wound=None):
    def f(pc):
        S_ = (H(skin[0]), H(skin[1]), H(skin[2])); C_ = (H(cloth[0]), H(cloth[1]), H(cloth[2]))
        for x0 in (16, 24): pc.poly([(x0, 32), (x0 + 5, 32), (x0 + 5, 44), (x0 - 1, 44)], *C_); pc.poly([(x0 - 2, 44), (x0 + 6, 44), (x0 + 6, 47), (x0 - 2, 47)], H('#3a2a1a'), None, H('#1e140a'))
        pc.poly([(14, 18), (18, 13), (29, 13), (31, 19), (30, 34), (14, 34)], *C_); pc.line(16, 20, 22, 26, C_[2]); pc.poly([(24, 28), (28, 28), (27, 32), (23, 31)], *S_)
        pc.poly([(30, 17), (36, 17), (43, 19), (43, 23), (36, 23), (31, 22)], *S_); pc.poly([(30, 22), (35, 25), (42, 27), (42, 31), (35, 29), (30, 27)], *S_)
        pc.poly([(14, 17), (9, 22), (9, 28), (13, 25)], *S_)
        pc.poly([(18, 3), (28, 2), (33, 6), (33, 13), (28, 16), (19, 15), (16, 9)], *S_); pc.poly([(17, 3), (21, 1), (27, 2), (31, 4), (24, 5), (18, 7)], H('#2a2a1a'), H('#4a4a30'), H('#14140a'))
        pc.rect(28, 8, 30, 10, H('#fff6c0')); pc.put(30, 9, EYEC); pc.rect(22, 8, 23, 9, H('#fff6c0')); pc.line(26, 13, 31, 13, H('#4a1a1a')); pc.put(27, 12, W_); pc.put(30, 12, W_)
        if wound: pc.rect(21, 12, 23, 13, H(wound)); pc.put(32, 15, H(wound))
    return lambda: _mk(46, 50, f)

def spider_art():
    def f(pc):
        B = (H('#3a3238'), H('#6a5a66'), H('#1a1418'))
        for dy, k in ((-1, 0), (-1, 1), (-1, 2), (-1, 3), (1, 0), (1, 1), (1, 2), (1, 3)):
            if dy < 0:
                x0 = 16 + k * 4; pc.line(x0, 14, x0 - 4 + k, 5, B[0]); pc.line(x0 - 4 + k, 5, x0 - 6 + k * 2, 16 if False else 22, B[0])
            else:
                x0 = 16 + k * 4; pc.line(x0, 18, x0 - 3 + k, 27, B[0]); pc.line(x0 - 3 + k, 27, x0 - 6 + k * 2, 22, B[0])
        pc.poly([(6, 14), (10, 9), (19, 9), (23, 14), (23, 19), (17, 23), (9, 22), (5, 18)], *B); pc.poly([(10, 12), (14, 11), (18, 13)], H('#8a6a82'), None, None, outline=False); pc.poly([(9, 15), (13, 14), (13, 18)], H('#c0262d'), None, None, outline=False)
        pc.poly([(24, 11), (30, 10), (34, 14), (33, 19), (27, 21), (23, 18)], *B); pc.rect(30, 12, 31, 13, H('#ff3030')); pc.rect(31, 15, 32, 16, H('#ff3030')); pc.put(29, 12, H('#ff9090')); pc.line(31, 19, 33, 22, W_); pc.line(28, 20, 29, 23, W_)
    return lambda: _mk(40, 30, f)

def cow_art():
    def f(pc):
        for x0 in (11, 17, 33, 39): pc.poly([(x0, 26), (x0 + 4, 26), (x0 + 4, 34), (x0 - 1, 34)], H('#f4f0ea'), None, H('#c8c0b4')); pc.rect(x0 - 1, 33, x0 + 3, 35, H('#2a2428'))
        pc.poly([(7, 14), (11, 9), (42, 9), (47, 14), (47, 25), (43, 28), (10, 28), (7, 23)], H('#f6f2ec'), H('#ffffff'), H('#c8c0b4'))
        pc.poly([(12, 11), (22, 10), (24, 18), (16, 22), (11, 18)], H('#2a2428'), H('#4a4448'), H('#14101a'), outline=False); pc.poly([(32, 15), (41, 12), (45, 20), (38, 26), (31, 22)], H('#2a2428'), H('#4a4448'), H('#14101a'), outline=False)
        pc.poly([(23, 27), (31, 27), (30, 32), (24, 32)], H('#ffb0b8'), H('#ffd0d4'), H('#c8707c'))
        pc.line(8, 14, 3, 22, H('#2a2428')); pc.rect(2, 22, 4, 26, H('#2a2428'))
        pc.poly([(43, 10), (48, 6), (55, 10), (57, 17), (54, 24), (46, 24), (42, 17)], H('#f6f2ec'), H('#ffffff'), H('#c8c0b4')); pc.poly([(50, 17), (57, 18), (56, 24), (49, 24)], H('#ffb0b8'), H('#ffd0d4'), H('#c8707c')); pc.put(52, 21, EYEC); pc.put(55, 21, EYEC)
        pc.poly([(44, 8), (42, 3), (47, 6)], H('#f0ead8'), None, None); pc.poly([(50, 5), (53, 0), (54, 7)], H('#f0ead8'), None, None); pc.poly([(42, 11), (38, 12), (43, 15)], H('#2a2428'), None, None)
        pc.rect(49, 11, 50, 12, EYEC); pc.put(49, 11, W_)
    return lambda: _mk(60, 38, f)

def chicken_art():
    def f(pc):
        pc.line(12, 21, 12, 25, H('#e89a2a')); pc.line(17, 21, 17, 25, H('#e89a2a')); pc.line(10, 25, 14, 25, H('#e89a2a')); pc.line(15, 25, 19, 25, H('#e89a2a'))
        pc.poly([(3, 14), (6, 9), (9, 13), (7, 17)], H('#f0eae4'), H('#ffffff'), H('#b8b0a8'))
        pc.poly([(5, 15), (9, 9), (20, 9), (25, 14), (24, 20), (17, 23), (9, 22)], H('#f6f2ec'), H('#ffffff'), H('#c0b8ae')); pc.poly([(9, 14), (14, 13), (18, 17), (13, 20)], H('#e4dcd0'), None, None, outline=False)
        pc.poly([(21, 8), (24, 4), (28, 6), (28, 12), (24, 14)], H('#f6f2ec'), H('#ffffff'), H('#c0b8ae')); pc.poly([(22, 4), (23, 1), (25, 3), (27, 1), (27, 5)], H('#d8202e'), H('#ff5a6a'), H('#8a1018'))
        pc.poly([(28, 8), (32, 10), (28, 11)], H('#f0a02a'), H('#ffd060'), H('#b06a10')); pc.poly([(26, 12), (28, 12), (27, 15)], H('#d8202e'), None, None, outline=False); pc.put(26, 8, EYEC)
    return lambda: _mk(34, 28, f)

def bat_art(body, wing, eye, fang=True):
    def f(pc):
        Bd = (H(body[0]), H(body[1]), H(body[2])); Wg = (H(wing[0]), H(wing[1]), H(wing[2]))
        pc.poly([(22, 14), (14, 5), (8, 8), (2, 6), (5, 14), (3, 20), (9, 17), (13, 24), (19, 20)], *Wg); pc.line(21, 15, 6, 8, Wg[2]); pc.line(20, 17, 8, 19, Wg[2]); pc.line(19, 18, 13, 24, Wg[2])
        pc.poly([(25, 12), (31, 4), (38, 6), (44, 3), (41, 12), (45, 18), (38, 17), (34, 24), (28, 19)], *Wg); pc.line(27, 13, 40, 6, Wg[2]); pc.line(28, 16, 40, 17, Wg[2])
        pc.poly([(20, 12), (27, 10), (31, 14), (28, 22), (22, 23), (19, 17)], *Bd); pc.poly([(26, 9), (27, 4), (30, 8)], *Bd); pc.poly([(31, 9), (33, 4), (34, 10)], *Bd)
        pc.rect(28, 13, 29, 14, H(eye)); pc.put(31, 14, EYEC) if False else None
        if fang: pc.put(28, 18, W_); pc.put(30, 18, W_)
        pc.line(20, 22, 18, 26, Bd[2]); pc.line(24, 23, 23, 27, Bd[2])
    return lambda: _mk(48, 30, f)

SL = {'slime': ('#5cc046', '#98f070', '#2e7a24'), 'blue_slime': ('#4f8fe0', '#8ec0ff', '#2a54a0'), 'purple_slime': ('#a45cff', '#d0a0ff', '#6a2ab8'), 'red_slime': ('#e0454a', '#ff8a8a', '#8a1a22'),
      'lava_slime': ('#ff7a1a', '#ffc060', '#a8300a'), 'ice_slime': ('#9be7ff', '#e8faff', '#4aa0d0'), 'toxic_slime': ('#8aea3a', '#d0ff90', '#4a9a14')}
SLX = {'lava_slime': 'lava', 'ice_slime': 'ice', 'toxic_slime': 'toxic', 'red_slime': 'red', 'purple_slime': 'purple'}
MOB_ART = {k: slime_art(v, SLX.get(k)) for k, v in SL.items()}
MOB_ART.update({
  'wolf': wolf_art('#8a8f98', '#b8bcc4', '#565b64', '#d8dce0', '#ffd23f'), 'frost_wolf': wolf_art('#c8e8f8', '#ffffff', '#7aa8c8', '#ffffff', '#4aa8ff', 'ice'),
  'dire_wolf': wolf_art('#3a3a48', '#5a5a6e', '#1c1c26', '#6a6a7a', '#ff3a3a'), 'hellhound': wolf_art('#7a2a1a', '#b8481e', '#4a140a', '#ff8a3a', '#ffd23f', 'flame'),
  'goblin': goblin_art(), 'skeleton': skeleton_art(), 'zombie': zombie_art(('#7a9a6a', '#a0c088', '#4a6a3e'), ('#4a5a8a', '#6a7ab0', '#2a3458')),
  'blood_zombie': zombie_art(('#b04a4a', '#d88080', '#6a1e1e'), ('#5a1a1a', '#8a2a2a', '#300a0a'), '#ff4a4a'), 'plague_zombie': zombie_art(('#8aa84a', '#b8d878', '#506a24'), ('#4a5a2a', '#6a7a40', '#2a3416'), '#d0ff60'),
  'ghoul': zombie_art(('#8a9a8a', '#b0c0b0', '#505e50'), ('#3a4a4a', '#586a6a', '#202a2a'), '#e8ffe8'),
  'spider': spider_art(), 'cow': cow_art(), 'chicken': chicken_art(),
  'vampire_bat': bat_art(('#5a2a3a', '#8a4258', '#2a1018'), ('#7a1a2a', '#a82a40', '#3a0a14'), '#ffd23f'), 'blight_bat': bat_art(('#4a3a5a', '#6e5a88', '#241a30'), ('#5a4a6a', '#7e6a98', '#2a2036'), '#ff6ad0'),
})

# ------------------------------------------------------------------------------------------ BIG SCENERY: Dracula's castle + the Atlantis temple
STONE = (H('#4e4a64'), H('#706c8c'), H('#2e2a42')); STONE2 = (H('#5a566e'), H('#7c789a'), H('#36324a')); ROOF = (H('#3a2446'), H('#6a4a78'), H('#1e1228'))
def bricks(pc, x0, y0, x1, y1, dark, step=6, w=10):
    for y in range(y0 + step, y1, step):
        pc.line(x0 + 1, y, x1 - 1, y, dark)
        for k, x in enumerate(range(x0 + (w // 2 if (y // step) % 2 else 0), x1, w)): pc.line(x, y, x, min(y1 - 1, y + step - 1), dark) if x0 < x < x1 - 1 else None
def merlons(pc, x0, x1, y, col, hi, w=5, gap=4, h=5):
    x = x0
    while x + w <= x1:
        pc.rect(x, y - h, x + w - 1, y, col[0]); pc.line(x, y - h, x + w - 1, y - h, hi); pc.line(x, y - h, x, y, hi); pc.line(x + w - 1, y - h, x + w - 1, y, col[2]); x += w + gap
def arch_win(pc, cx, cy, w, h, glow=True):
    pts = [(cx - w // 2, cy + h // 2), (cx - w // 2, cy - h // 6), (cx - w // 4, cy - h // 2 + 1), (cx, cy - h // 2 - 2), (cx + w // 4, cy - h // 2 + 1), (cx + w // 2, cy - h // 6), (cx + w // 2, cy + h // 2)]
    pc.poly(pts, H('#ffd27a'), H('#fff4c0'), H('#c8841a')); pc.line(cx, cy - h // 2 + 1, cx, cy + h // 2, H('#5a3a1a')); pc.line(cx - w // 2 + 1, cy, cx + w // 2 - 1, cy, H('#5a3a1a'))
def tower(pc, x0, x1, ytop, ybase, roof_h, win_y=None, stone=STONE):
    pc.poly([(x0, ybase), (x0, ytop), (x1, ytop), (x1, ybase)], *stone); bricks(pc, x0, ytop, x1, ybase, stone[2], 6, 8)
    pc.poly([(x0 - 3, ytop + 1), (x0 + (x1 - x0) // 2, ytop - roof_h), (x1 + 3, ytop + 1)], *ROOF)
    for k in range(1, 5): pc.line(x0 + (x1 - x0) // 2, ytop - roof_h + 1, x0 - 2 + k * ((x1 - x0 + 4) // 5), ytop, ROOF[2])
    if win_y: arch_win(pc, (x0 + x1) // 2, win_y, 6, 11)
def flag(pc, x, y, c=('#b81f3a', '#ee5a74', '#6a0f22')):
    pc.line(x, y, x, y - 12, H('#2a1a14')); pc.poly([(x + 1, y - 12), (x + 11, y - 9), (x + 1, y - 6)], H(c[0]), H(c[1]), H(c[2]))

def castle_art():
    pc = PC(256, 136)
    # curtain walls
    for (a, b) in ((8, 90), (166, 248)):
        pc.poly([(a, 128), (a, 80), (b, 80), (b, 128)], *STONE); bricks(pc, a, 80, b, 128, STONE[2], 6, 10); merlons(pc, a + 2, b - 2, 80, STONE, STONE[1])
    # outer corner towers + inner towers
    tower(pc, 0, 28, 52, 128, 30, 74); tower(pc, 228, 256, 52, 128, 30, 74)
    tower(pc, 70, 96, 40, 128, 34, 62, STONE2); tower(pc, 160, 186, 40, 128, 34, 62, STONE2)
    # keep
    pc.poly([(90, 128), (90, 52), (166, 52), (166, 128)], *STONE2); bricks(pc, 90, 52, 166, 128, STONE2[2], 6, 10); merlons(pc, 92, 164, 52, STONE2, STONE2[1])
    pc.poly([(110, 52), (110, 22), (146, 22), (146, 52)], *STONE); bricks(pc, 110, 22, 146, 52, STONE[2], 6, 9)
    pc.poly([(106, 24), (128, -6 + 2), (150, 24)], *ROOF)
    for k in range(1, 7): pc.line(128, -3, 104 + k * 7, 24, ROOF[2])
    flag(pc, 128, 0); flag(pc, 13, 22, ('#7a1a8a', '#b04ac0', '#40084a')); flag(pc, 242, 22, ('#7a1a8a', '#b04ac0', '#40084a'))
    for cx, cy in ((120, 36), (136, 36)): arch_win(pc, cx, cy, 7, 12)
    for cx, cy in ((100, 72), (156, 72), (40, 100), (216, 100)): arch_win(pc, cx, cy, 8, 14)
    for cx in (118, 138): arch_win(pc, cx, 76, 7, 13)
    # rose window above the gate
    pc.disc(128, 66, 8, H('#3a2040'), H('#5a3a66'), H('#1e1028')); pc.disc(128, 66, 6, H('#a01830'), H('#e03a50'), H('#601020'), outline=False); pc.line(128, 60, 128, 72, H('#2a1020')); pc.line(122, 66, 134, 66, H('#2a1020')); pc.line(124, 62, 132, 70, H('#2a1020')); pc.line(132, 62, 124, 70, H('#2a1020'))
    # gate: stone arch, dark opening, iron bars, red glow
    pc.poly([(104, 128), (104, 98), (110, 90), (128, 84), (146, 90), (152, 98), (152, 128)], *STONE)
    pc.poly([(110, 128), (110, 100), (115, 94), (128, 90), (141, 94), (146, 100), (146, 128)], H('#14081a'), None, H('#08030c'))
    pc.poly([(116, 128), (116, 104), (128, 98), (140, 104), (140, 128)], H('#7a1428'), H('#c02a44'), None, outline=False)
    for x in range(114, 145, 5): pc.line(x, 94 if 120 <= x <= 136 else 100, x, 127, H('#2a2230'))
    for y in (106, 116): pc.line(111, y, 145, y, H('#2a2230'))
    for x0 in (100, 150): pc.poly([(x0, 128), (x0, 96), (x0 + 6, 96), (x0 + 6, 128)], *STONE2)
    pc.line(104, 96, 152, 96, STONE[1]); pc.poly([(98, 128), (98, 124), (158, 124), (158, 128)], *STONE2)
    for (x, y) in ((40, 48), (214, 40), (84, 20), (176, 28)): pc.put(x, y, H('#120810')); pc.put(x + 1, y + 1, H('#120810')); pc.put(x - 1, y + 1, H('#120810')); pc.put(x + 2, y, H('#120810'))   # tiny bats
    return pc

CORAL = (H('#ff7a8a'), H('#ffc0c8'), H('#b83a4a')); TSTONE = (H('#8ad0d8'), H('#d8f6ff'), H('#4a8a9a')); TGOLD = (H('#e8b43c'), H('#ffe27a'), H('#9c6a18'))
def temple_art():
    pc = PC(220, 112)
    # steps
    for k, (x0, x1, y) in enumerate(((8, 212, 108), (16, 204, 102), (24, 196, 96))): pc.poly([(x0, y + 6), (x0, y), (x1, y), (x1, y + 6)], *TSTONE)
    # back wall + pediment
    pc.poly([(30, 96), (30, 38), (190, 38), (190, 96)], H('#6ab0bc'), H('#9ad8e0'), H('#3a7a8a')); bricks(pc, 30, 38, 190, 96, H('#3a7a8a'), 7, 12)
    pc.poly([(18, 40), (110, 4), (202, 40)], *TSTONE); pc.poly([(34, 38), (110, 12), (186, 38)], H('#a8e0e8'), H('#e8faff'), H('#5aa0b0'), outline=False)
    pc.line(18, 40, 202, 40, TSTONE[1]); pc.rect(18, 40, 202, 44, H('#8ad0d8')); pc.line(18, 44, 202, 44, TSTONE[2])
    # emblem: trident + pearl
    pc.line(110, 18, 110, 36, TGOLD[0]); pc.line(104, 20, 104, 28, TGOLD[0]); pc.line(116, 20, 116, 28, TGOLD[0]); pc.line(104, 28, 116, 28, TGOLD[0]); pc.put(110, 17, TGOLD[1]); pc.put(104, 19, TGOLD[1]); pc.put(116, 19, TGOLD[1]); pc.disc(110, 32, 3, H('#f4f0ff'), H('#ffffff'), H('#b8b0d0'))
    # columns
    for x in (34, 62, 150, 178):
        pc.poly([(x - 8, 98), (x - 7, 46), (x + 7, 46), (x + 8, 98)], *TSTONE); pc.line(x - 3, 48, x - 3, 96, TSTONE[1]); pc.line(x + 3, 48, x + 3, 96, TSTONE[2]); pc.line(x, 50, x, 96, H('#b0dce4'))
        pc.rect(x - 10, 44, x + 10, 48, H('#b0e4ec')); pc.line(x - 10, 44, x + 10, 44, TSTONE[1]); pc.rect(x - 10, 96, x + 10, 99, H('#b0e4ec'))
    # glowing doorway
    pc.poly([(88, 98), (88, 66), (96, 56), (110, 52), (124, 56), (132, 66), (132, 98)], H('#0a3a58'), None, H('#062438'))
    pc.poly([(94, 98), (94, 68), (110, 58), (126, 68), (126, 98)], H('#2a9ac0'), H('#8ae8ff'), H('#1a6a90'), outline=False)
    pc.poly([(102, 98), (102, 74), (110, 68), (118, 74), (118, 98)], H('#7ae0ff'), H('#e8faff'), None, outline=False)
    for k in range(3): pc.line(96 + k * 12, 80 + k * 2, 100 + k * 12, 76 + k * 2, H('#e8faff'))
    # coral + shells + bubbles
    for (x, y, c) in ((6, 100, CORAL), (14, 96, CORAL), (204, 98, CORAL), (212, 100, CORAL), (50, 104, CORAL)):
        for dx, h in ((-3, 8), (0, 12), (3, 7)): pc.line(x + dx, y, x + dx, y - h, c[0]); pc.put(x + dx, y - h - 1, c[1]); pc.put(x + dx + 1, y - h - 1, c[1])
    for (x, y) in ((70, 30), (160, 26), (40, 20), (190, 18), (120, 10)): pc.disc(x, y, 1, H('#d8faff'), None, None, outline=False)
    return pc

def _shift(pc, dy):
    out = PC(pc.w, pc.h + dy)
    for y in range(pc.h): out.p[y + dy] = list(pc.p[y])
    return out
DECOR_ART = {'castle': lambda: _shift(castle_art(), 12), 'atlantis_temple': temple_art}


# ------------------------------------------------------------------------------------------ PORTALS (stone gate + swirling energy, 4 frames of 40x56)
PORTAL_COL = {'gold': ('#7a5a10', '#ffd23f', '#fff6c0'), 'blue': ('#1a4a8a', '#5aa8ff', '#d8ecff'), 'violet': ('#4a1a8a', '#b06aff', '#ecdcff'), 'red': ('#7a1020', '#ff4a60', '#ffd8dc'), 'teal': ('#0e5a6a', '#3ad8e8', '#d8fcff')}
def portal_frame(col, frame):
    import math as _m
    dark, mid, light = (H(c) for c in col); pc = PC(40, 56)
    ST = (H('#5a566e'), H('#8884a4'), H('#34304a'))
    pc.poly([(3, 56), (3, 14), (9, 8), (20, 4), (31, 8), (37, 14), (37, 56)], *ST)                        # arch
    pc.poly([(9, 56), (9, 18), (13, 13), (20, 10), (27, 13), (31, 18), (31, 56)], H('#10081c'), None, None)  # opening
    for (x, y, w_, h_) in ((3, 20, 6, 5), (3, 32, 6, 5), (3, 44, 6, 5), (31, 26, 6, 5), (31, 38, 6, 5)): pc.line(x, y, x + w_, y, ST[2])
    for y in (16, 22, 28, 34, 40, 46): pc.put(5, y, H(col[1])); pc.put(34, y + 3, H(col[1]))                   # glowing runes
    for y in range(11, 56):                                                                                   # swirling energy inside the arch
        for x in range(10, 30):
            fx, fy = (x - 20) / 10.5, (y - 34) / 24
            if fx * fx + fy * fy > 1.0 or (y < 18 and (x - 20) ** 2 / 100 + (y - 18) ** 2 / 50 > 1.2): continue
            r = _m.hypot(fx, fy * 1.25); ang = _m.atan2(fy, fx); v = (ang / (2 * _m.pi) * 3 + r * 1.6 - frame * 0.25) % 1
            pc.put(x, y, dark if v < 0.4 else mid if v < 0.78 else light)
    pc.disc(20, 34, 2, light, None, None, outline=False)
    for k in range(3): a = frame * 1.6 + k * 2.1; pc.put(round(20 + 7 * _m.cos(a)), round(34 + 11 * _m.sin(a)), H('#ffffff'))
    pc.poly([(3, 56), (3, 52), (37, 52), (37, 56)], *ST)
    return pc
def portal_strip(name):
    out = Image.new('RGBA', (160, 56), (0, 0, 0, 0))
    for f in range(4):
        pc = portal_frame(PORTAL_COL[name], f); im = Image.new('RGBA', (40, 56), (0, 0, 0, 0)); px = im.load()
        for y in range(56):
            for x in range(40):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        out.alpha_composite(im, (f * 40, 0))
    return out.resize((640, 224), Image.NEAREST)


# ------------------------------------------------------------------------------------------ HALL FURNITURE
HALL_PAL = {'gothic': dict(stone=T('#4e4a64', '#7a76a0', '#2a2640'), cloth=T('#8a1428', '#d03048', '#4a0a16'), gold=T('#e8b43c', '#ffe27a', '#9c6a18'), flame=('#ff8a1a', '#ffd23f', '#fff6c0'), carpet=('#7a1020', '#a81a30', '#4a0a14')),
            'sea': dict(stone=T('#6ab0bc', '#b8eef4', '#2e6a7c'), cloth=T('#1a7aa8', '#5ac8f0', '#0e4a6a'), gold=T('#f0d8a0', '#fff6dc', '#b09860'), flame=('#2ad0e8', '#8af0ff', '#e8ffff'), carpet=('#1a5a8a', '#2a80b8', '#0e3a5a'))}
def hall_pillar(kind):
    P_ = HALL_PAL[kind]; S_ = P_['stone']; C_ = P_['cloth']; pc = PC(28, 64)
    pc.poly([(2, 64), (2, 58), (6, 55), (22, 55), (26, 58), (26, 64)], *S_)
    pc.poly([(7, 56), (8, 14), (20, 14), (21, 56)], *S_); pc.line(11, 16, 11, 54, S_[1]); pc.line(17, 16, 17, 54, S_[2])
    for y in (24, 34, 44): pc.line(8, y, 20, y, S_[2])
    pc.poly([(3, 14), (5, 8), (23, 8), (25, 14)], *S_); pc.poly([(5, 8), (7, 2), (21, 2), (23, 8)], *S_)
    if kind == 'gothic':
        pc.poly([(9, 16), (19, 16), (19, 38), (14, 33), (9, 38)], *C_); pc.rect(13, 22, 14, 26, P_['gold'][0]); pc.put(13, 20, P_['gold'][1])
    else:
        for (x, y) in ((10, 30), (17, 40), (12, 48)): pc.disc(x, y, 2, H('#ff9aaa'), H('#ffd0d8'), H('#b84a60'), outline=False)
        pc.line(14, 16, 14, 26, H('#5ac8f0')); pc.line(10, 18, 18, 18, H('#5ac8f0'))
    return pc
def hall_torch(kind, frame):
    P_ = HALL_PAL[kind]; S_ = P_['stone']; f0, f1, f2 = (H(c) for c in P_['flame']); pc = PC(20, 40)
    pc.poly([(8, 40), (9, 24), (11, 24), (12, 40)], H('#2a2230'), H('#4a4058'), H('#14101a')); pc.poly([(3, 40), (5, 36), (15, 36), (17, 40)], *S_)
    pc.poly([(3, 20), (17, 20), (14, 26), (6, 26)], H('#3a3244'), H('#6a5e7c'), H('#1a1620'))
    j = (0, 2, -1)[frame]; h = 12 + (frame % 3) * 2
    pc.poly([(5, 20), (7, 12 + j), (10, 20 - h), (13, 12 - j), (15, 20)], f0, f1, None, outline=False); pc.poly([(8, 20), (10, 20 - h + 5), (12, 20)], f1, None, None, outline=False); pc.poly([(9, 20), (10, 20 - h // 2), (11, 20)], f2, None, None, outline=False)
    return pc
def hall_carpet(kind):
    c0, c1, c2 = (H(x) for x in HALL_PAL[kind]['carpet']); G_ = HALL_PAL[kind]['gold']; pc = PC(40, 40)
    pc.rect(0, 0, 39, 39, c0); pc.rect(0, 0, 3, 39, G_[0]); pc.rect(36, 0, 39, 39, G_[0]); pc.line(4, 0, 4, 39, G_[2]); pc.line(35, 0, 35, 39, G_[2]); pc.rect(7, 0, 8, 39, c2); pc.rect(31, 0, 32, 39, c2)
    for (x, y) in ((20, 6), (20, 26)): pc.poly([(x, y - 6), (x + 7, y), (x, y + 6), (x - 7, y)], c1, None, None, outline=False); pc.poly([(x, y - 3), (x + 3, y), (x, y + 3), (x - 3, y)], G_[0], None, None, outline=False); pc.put(x, y, G_[1])
    for y in range(0, 40, 4): pc.put(1, y, G_[1]); pc.put(38, y, G_[1])
    return pc
def hall_throne(kind):
    P_ = HALL_PAL[kind]; S_ = P_['stone']; G_ = P_['gold']; C_ = P_['cloth']; pc = PC(56, 72)
    if kind == 'gothic':
        pc.poly([(8, 72), (8, 20), (14, 10), (20, 22), (28, 2), (36, 22), (42, 10), (48, 20), (48, 72)], H('#1c1624'), H('#3c3250'), H('#0c0810'))
        pc.poly([(14, 24), (42, 24), (42, 56), (14, 56)], *C_); pc.poly([(6, 72), (6, 50), (14, 50), (14, 72)], H('#1c1624'), H('#3c3250'), H('#0c0810')); pc.poly([(42, 72), (42, 50), (50, 50), (50, 72)], H('#1c1624'), H('#3c3250'), H('#0c0810'))
        for (x, y) in ((28, 6), (14, 14), (42, 14)): pc.put(x, y, G_[1]); pc.put(x, y + 1, G_[0])
        pc.line(14, 24, 42, 24, G_[0]); pc.line(14, 56, 42, 56, G_[0]); pc.poly([(24, 36), (32, 36), (28, 46)], G_[0], G_[1], G_[2])
    else:
        pc.poly([(4, 72), (6, 40), (14, 20), (28, 6), (42, 20), (50, 40), (52, 72)], H('#f4a8b8'), H('#ffd8e0'), H('#b8607a'))
        for x in (14, 20, 28, 36, 42): pc.line(28, 66, x, 14 + abs(x - 28) // 2, H('#c8708a'))
        pc.poly([(14, 46), (42, 46), (44, 66), (12, 66)], *C_); pc.disc(28, 12, 3, H('#f4f0ff'), H('#ffffff'), H('#b8b0d0')); pc.line(12, 46, 44, 46, G_[1])
    return pc
HALL_ART = {}
for _k in ('gothic', 'sea'):
    HALL_ART['hall_pillar_' + _k] = (lambda k=_k: hall_pillar(k)); HALL_ART['hall_carpet_' + _k] = (lambda k=_k: hall_carpet(k)); HALL_ART['hall_throne_' + _k] = (lambda k=_k: hall_throne(k))
def hall_torch_strip(kind):
    out = Image.new('RGBA', (60, 40), (0, 0, 0, 0))
    for f in range(3):
        pc = hall_torch(kind, f); im = Image.new('RGBA', (20, 40), (0, 0, 0, 0)); px = im.load()
        for y in range(40):
            for x in range(20):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        out.alpha_composite(im, (f * 20, 0))
    return out.resize((240, 160), Image.NEAREST)
