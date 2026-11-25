# Hand-pixeled monster FAMILIES (side view facing right). A table at the bottom maps every remaining monster to a family + palette.
import math
from pixel_hand import PC, H
def tri(c):
    h = c.lstrip('#'); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    f = lambda k: '#%02x%02x%02x' % (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)))
    return (H(c), H(f(1.28)), H(f(0.6)))
W_ = H('#ffffff'); EY = H('#15101a')
def mk(w, h, fn):
    def run(): pc = PC(w, h); fn(pc); return pc
    return run

def hum(skin, cloth, trim='#2a2430', head='plain', weapon=None, wings=None, cape=None, tail=None, fur=False, eye='#ffe14a', ears=False, legs='#3a2a1a', fish=False, belt=True):
    def f(pc):
        S, Cl, L, T_ = tri(skin), tri(cloth), tri(legs), tri(trim)
        if wings:
            pc.poly([(16, 19), (3, 4), (5, 18), (1, 30), (15, 30)], *tri(wings)); pc.poly([(18, 19), (10, 2), (12, 16)], *tri(wings))
        if cape: pc.poly([(14, 17), (8, 26), (5, 47), (16, 45), (19, 30)], *tri(cape))
        if tail: pc.poly([(14, 38), (6, 41), (3, 47), (6, 49), (7, 44), (13, 43)], *tri(tail)); pc.poly([(3, 46), (0, 50), (6, 50)], *tri(tail))
        if fish:
            pc.poly([(15, 32), (30, 32), (31, 40), (26, 47), (30, 51), (16, 51), (19, 47), (14, 40)], *tri(fish)); pc.poly([(26, 47), (36, 44), (36, 53), (26, 51)], *tri(fish))
        else:
            for x0 in (16, 24): pc.poly([(x0, 33), (x0 + 5, 33), (x0 + 5, 45), (x0 - 1, 45)], *L); pc.poly([(x0 - 2, 45), (x0 + 6, 45), (x0 + 6, 48), (x0 - 2, 48)], *T_)
        pc.poly([(14, 18), (18, 13), (29, 13), (32, 19), (31, 35), (14, 35)], *Cl)
        if belt: pc.rect(14, 29, 31, 30, T_[0])
        if fur:
            for k in range(6): pc.poly([(14 + k * 3, 34), (16 + k * 3, 39), (18 + k * 3, 34)], *Cl)
        pc.poly([(13, 18), (8, 24), (8, 31), (12, 28)], *S)
        pc.poly([(30, 17), (36, 18), (41, 21), (41, 25), (36, 25), (31, 23)], *S)
        if weapon == 'club': pc.poly([(37, 12), (44, 7), (45, 16), (41, 26), (38, 24)], H('#6a4220'), H('#9a6a3a'), H('#3a2210'))
        elif weapon == 'sword': pc.poly([(40, 4), (43, 4), (43, 24), (40, 24)], H('#d0d4dc'), H('#ffffff'), H('#808894')); pc.rect(37, 24, 46, 26, T_[0])
        elif weapon == 'dagger': pc.poly([(40, 18), (47, 21), (40, 24)], H('#d0d4dc'), H('#ffffff'), H('#808894'))
        elif weapon == 'staff': pc.rect(40, 2, 41, 40, H('#6a4220')); pc.disc(41, 3, 3, H('#b04aff'), H('#e0b0ff'), H('#601a98'))
        elif weapon == 'spear': pc.rect(40, 6, 41, 42, H('#8a5a30')); pc.poly([(38, 6), (41, -1), (44, 6)], H('#d0d4dc'), H('#ffffff'), H('#808894'))
        elif weapon == 'bow': pc.line(41, 6, 45, 22, H('#8a5a30')); pc.line(45, 22, 41, 38, H('#8a5a30')); pc.line(41, 6, 41, 38, H('#e8e8f0'))
        elif weapon == 'trident': pc.rect(41, 6, 42, 44, H('#bfe8ff')); [pc.rect(x, 2, x, 8, H('#bfe8ff')) for x in (38, 42, 46)]; pc.rect(38, 7, 46, 8, H('#bfe8ff'))
        pc.poly([(19, 3), (28, 2), (33, 6), (34, 14), (28, 17), (20, 16), (17, 9)], *S)
        if ears: pc.poly([(17, 9), (8, 5), (14, 13)], *S); pc.poly([(32, 7), (39, 3), (34, 12)], *S)
        if head == 'bandana': pc.poly([(18, 5), (33, 5), (33, 9), (18, 9)], H('#c0262d'), H('#ee5a68'), H('#6a1018')); pc.poly([(18, 8), (12, 12), (17, 12)], H('#c0262d'), None, None)
        elif head == 'feather': pc.rect(18, 6, 33, 8, H('#8a5a30')); pc.poly([(24, 6), (22, -2), (27, 6)], H('#d84a3a'), H('#ff8a7a'), H('#7a1a10')); pc.poly([(28, 6), (30, 0), (31, 6)], H('#ffd23f'), None, None)
        elif head == 'witch': pc.poly([(14, 8), (36, 8), (30, 6), (26, -4), (22, 6)], H('#2a1a40'), H('#4a3a70'), H('#14081e')); pc.rect(20, 4, 29, 6, H('#e8b43c'))
        elif head == 'helm': pc.poly([(18, 2), (28, 0), (34, 5), (34, 13), (20, 14)], H('#7a7e8a'), H('#b0b4c0'), H('#4a4e5a')); pc.rect(24, 8, 33, 9, EY); pc.poly([(22, 0), (26, -5), (31, 0)], H('#c0262d'), H('#ff5a68'), H('#7a1018'))
        elif head == 'horns': pc.poly([(20, 4), (16, -4), (24, 2)], H('#2a1a14'), H('#6a4a3a'), None); pc.poly([(30, 3), (34, -5), (33, 5)], H('#2a1a14'), H('#6a4a3a'), None)
        elif head == 'hood': pc.poly([(16, 4), (28, 0), (36, 8), (35, 18), (28, 18), (17, 17)], *tri(cloth)); pc.poly([(26, 8), (34, 9), (34, 16), (27, 16)], H('#15101a'), None, None)
        elif head == 'pumpkin': pc.poly([(16, 0), (30, -1), (36, 6), (35, 16), (28, 19), (18, 17), (14, 8)], H('#e8801c'), H('#ffb14a'), H('#a8500e')); pc.poly([(23, 7), (27, 7), (25, 11)], H('#ffe14a'), None, None); pc.poly([(30, 7), (34, 7), (32, 11)], H('#ffe14a'), None, None); pc.line(24, 14, 33, 14, H('#ffe14a')); pc.rect(24, -3, 26, 0, H('#2a7a2a'))
        elif head == 'straw': pc.poly([(12, 6), (38, 6), (34, 3), (28, -3), (22, 3)], H('#d8b858'), H('#f0d880'), H('#8a6a28'))
        elif head == 'elfhat': pc.poly([(16, 6), (34, 6), (30, 0), (24, -5), (18, 1)], H('#2f8a3a'), H('#5ac068'), H('#14501e')); pc.disc(24, -5, 2, W_, None, None, outline=False)
        elif head == 'bandage':
            for y in (4, 7, 10, 13): pc.line(19, y, 33, y + 1, H('#e8e0c8'))
        elif head == 'hair': pc.poly([(17, 3), (28, 1), (34, 6), (31, 7), (24, 5), (19, 9)], *tri('#3a2a1a'))
        if head not in ('hood', 'pumpkin'): pc.rect(28, 8, 30, 10, H(eye)); pc.put(30, 9, EY)
        if head == 'pumpkin': pass
        pc.line(26, 14, 31, 14, H('#3a1a1a'))
    return mk(50, 54, f)

def golem(stone, glow=None, crystals=False, moss=False, lava=False):
    def f(pc):
        S = tri(stone)
        for x0 in (14, 30): pc.poly([(x0, 40), (x0 + 11, 40), (x0 + 12, 54), (x0 - 1, 54)], *S)
        pc.poly([(11, 18), (20, 12), (38, 12), (47, 20), (46, 42), (12, 42)], *S)
        pc.poly([(8, 22), (2, 26), (0, 42), (9, 44), (12, 30)], *S); pc.poly([(46, 22), (52, 26), (54, 42), (45, 44), (42, 30)], *S)
        pc.poly([(22, 3), (32, 2), (37, 8), (36, 15), (22, 15), (19, 8)], *S)
        for pts in ([(16, 20), (22, 28), (18, 36)], [(36, 22), (40, 30), (34, 38)], [(2, 30), (6, 38)], [(30, 4), (32, 10)]): pc.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], S[2]); [pc.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], H(glow) if glow else S[2]) for i in range(len(pts) - 1)]
        if moss: [pc.disc(x, y, 3, H('#4aa83a'), H('#7ad05a'), H('#2a6a1a'), outline=False) for x, y in ((14, 16), (40, 14), (10, 40), (44, 40))]
        if crystals: [pc.poly([(x - 3, y), (x, y - 11), (x + 3, y)], H('#c8a0ff'), H('#f0e0ff'), H('#7a40c0')) for x, y in ((18, 14), (28, 11), (38, 15), (13, 24))]
        pc.rect(26, 7, 28, 9, H(glow) if glow else H('#ffd23f')); pc.rect(31, 7, 33, 9, H(glow) if glow else H('#ffd23f'))
        if lava: pc.rect(14, 44, 20, 46, H('#ff8a1a')); pc.rect(34, 40, 40, 42, H('#ff8a1a'))
    return mk(56, 56, f)

def elemental(base, core, kind='fire'):
    def f(pc):
        B = tri(base); cx, cy = 24, 26
        if kind == 'fire': pc.poly([(8, 44), (6, 28), (12, 22), (10, 8), (18, 18), (22, 2), (28, 16), (36, 6), (36, 22), (42, 30), (40, 44), (24, 48)], *B); pc.poly([(14, 42), (13, 30), (20, 24), (24, 34), (30, 22), (34, 32), (34, 42), (24, 46)], H(core), None, None, outline=False)
        elif kind == 'ice': pc.poly([(12, 46), (6, 30), (12, 18), (8, 6), (18, 14), (24, 0), (30, 14), (40, 6), (36, 20), (42, 32), (36, 46)], *B); pc.poly([(16, 42), (13, 30), (18, 20), (24, 12), (30, 20), (35, 30), (32, 42)], H(core), None, None, outline=False); [pc.put(x, y, W_) for x, y in ((14, 14), (36, 14), (10, 34), (40, 38))]
        else:
            for k, (y, w) in enumerate(((44, 17), (35, 14), (26, 11), (17, 8), (8, 5))): pc.poly([(24 - w, y), (24 - w + 2, y - 8), (24 + w - 2, y - 8), (24 + w, y)], *B)
            pc.poly([(24 - 11, 28), (24 + 11, 28), (24 + 8, 40), (24 - 8, 40)], H(core), None, None, outline=False)
        pc.rect(18, 22, 21, 26, EY); pc.rect(27, 22, 30, 26, EY); pc.put(19, 23, W_); pc.put(28, 23, W_); pc.poly([(20, 31), (28, 31), (24, 35)], EY, None, None)
    return mk(48, 50, f)

def ghost(col, glow, face='wail', extra=None):
    def f(pc):
        G = tri(col)
        pc.poly([(6, 22), (10, 10), (22, 3), (34, 8), (40, 20), (38, 36), (34, 46), (30, 40), (26, 48), (21, 40), (16, 47), (12, 38), (8, 44), (6, 34)], *G)
        pc.poly([(14, 22), (22, 12), (32, 16), (35, 28), (24, 34), (14, 32)], tri(glow)[1] if face == 'hood' else tri(col)[1], None, None, outline=False) if face != 'hood' else pc.poly([(16, 20), (26, 14), (34, 20), (34, 30), (24, 34), (16, 30)], H('#0a0610'), None, None, outline=False)
        ey = H(glow)
        if face == 'wail': pc.rect(18, 18, 20, 23, EY); pc.rect(27, 18, 29, 23, EY); pc.poly([(21, 28), (27, 28), (26, 36), (22, 36)], EY, None, None)
        elif face == 'hood': pc.rect(21, 22, 23, 24, ey); pc.rect(28, 22, 30, 24, ey)
        elif face == 'pumpkin': pc.poly([(17, 18), (22, 18), (19, 23)], EY, None, None); pc.poly([(27, 18), (32, 18), (29, 23)], EY, None, None); pc.poly([(18, 28), (22, 26), (26, 29), (30, 26), (32, 30), (24, 34)], EY, None, None)
    return mk(46, 50, f)

def serpent(col, belly, eye='#ffe14a', worm=False):
    def f(pc):
        pts = [(4 + i * 3.4, 22 + math.sin(i * 0.55) * 8) for i in range(15)]
        for i, (x, y) in enumerate(pts): r = 3 + min(i, 8) * 0.35 + (0 if not worm else 1); pc.disc(round(x), round(y), round(r), *tri(col))
        for i, (x, y) in enumerate(pts[:12]): pc.put(round(x), round(y) + 2, H(belly)); pc.put(round(x) - 1, round(y) - 2, tri(col)[1])
        x, y = pts[-1]; x, y = round(x), round(y)
        if worm: pc.disc(x + 4, y, 4, H('#2a0a14'), None, None); pc.disc(x + 4, y, 2, H('#ff7a8a'), None, None, outline=False)
        else:
            pc.poly([(x - 2, y - 4), (x + 8, y - 3), (x + 12, y), (x + 8, y + 3), (x - 2, y + 4)], *tri(col)); pc.rect(x + 3, y - 3, x + 4, y - 2, H(eye)); pc.line(x + 12, y, x + 16, y - 1, H('#e0245e')); pc.line(x + 14, y - 1, x + 17, y - 3, H('#e0245e')); pc.line(x + 14, y - 1, x + 17, y + 1, H('#e0245e')); pc.put(x + 9, y + 2, W_)
    return mk(56, 40, f)

def bird(col, belly, beak='#e8b030', bald=False, wing=None):
    def f(pc):
        Cc = tri(col); Wn = tri(wing or col)
        pc.poly([(12, 22), (2, 6), (14, 12), (22, 18)], *Wn); pc.poly([(16, 22), (12, 4), (26, 12), (26, 22)], *Wn)
        pc.poly([(8, 26), (2, 36), (10, 34), (14, 30)], *Cc)
        pc.poly([(8, 22), (14, 18), (28, 18), (34, 24), (32, 32), (22, 36), (12, 34), (7, 28)], *Cc); pc.poly([(14, 28), (28, 28), (26, 34), (16, 34)], H(belly), None, None, outline=False)
        pc.poly([(30, 16), (36, 12), (42, 16), (42, 24), (34, 26)], *(tri('#d89a8a') if bald else Cc))
        pc.poly([(40, 17), (48, 21), (41, 25)], H(beak), H('#ffd870'), H('#a8741a')); pc.rect(37, 17, 38, 18, H('#ffe14a')); pc.put(38, 18, EY)
        pc.line(18, 36, 18, 41, H('#c89a3a')); pc.line(24, 36, 24, 41, H('#c89a3a'))
    return mk(50, 44, f)

def hornet():
    def f(pc):
        for sx in (0, 1): pc.poly([(20, 14 - sx * 3), (14, 2), (26, 8), (30, 14)], H('#cfe8ff'), H('#ffffff'), H('#8ab0d0'))
        pc.poly([(4, 18), (8, 12), (18, 12), (22, 18), (18, 26), (8, 26)], H('#e8c23a'), H('#fff080'), H('#a88a18'))
        for x in (8, 12, 16): pc.rect(x, 12, x + 1, 26, H('#2a2218'))
        pc.poly([(4, 19), (-1, 19), (4, 22)], H('#2a2218'), None, None)
        pc.poly([(22, 14), (30, 14), (32, 20), (28, 26), (22, 24)], H('#caa02a'), H('#f0d060'), H('#7a5a10')); pc.poly([(32, 14), (40, 14), (42, 22), (34, 24)], H('#2a2218'), H('#5a4a30'), None)
        pc.rect(36, 16, 39, 19, H('#ff3a2a')); pc.line(38, 24, 42, 28, H('#2a2218')); pc.line(36, 24, 38, 30, H('#2a2218'))
    return mk(46, 32, f)

def dragon(body, belly, wing, flame, bone=False):
    def f(pc):
        B = tri(body); Wn = tri(wing)
        pc.poly([(22, 20), (10, 2), (26, 6), (38, 14)], *Wn); pc.poly([(10, 2), (8, 14), (22, 20)], tri(wing)[2], None, None, outline=False)
        pc.poly([(12, 28), (4, 34), (0, 44), (6, 42), (10, 38), (14, 34)], *B)
        for x0 in (14, 22, 34, 42): pc.poly([(x0, 36), (x0 + 5, 36), (x0 + 5, 46), (x0 - 1, 46)], *B); pc.poly([(x0 - 1, 46), (x0 + 6, 46), (x0 + 7, 48), (x0 - 2, 48)], H('#f0ead8'))
        pc.poly([(10, 30), (14, 22), (36, 20), (46, 26), (48, 36), (40, 40), (14, 40), (9, 36)], *B); pc.poly([(16, 34), (42, 34), (40, 39), (18, 39)], H(belly), None, None, outline=False)
        if bone: [pc.line(x, 24, x - 1, 34, tri(body)[2]) for x in (20, 25, 30, 35)]
        for k in range(5): pc.poly([(16 + k * 6, 21), (18 + k * 6, 16), (20 + k * 6, 21)], tri(flame)[0], tri(flame)[1], tri(flame)[2])
        pc.poly([(42, 22), (46, 14), (54, 12), (60, 18), (60, 24), (52, 28), (44, 28)], *B); pc.poly([(53, 20), (60, 20), (59, 25), (52, 26)], H(belly), None, None, outline=False)
        pc.poly([(48, 14), (46, 6), (52, 12)], H('#f0ead8'), H('#ffffff'), H('#b0a888')); pc.rect(52, 16, 54, 18, H('#ff3a2a') if not bone else H('#15101a')); pc.rect(56, 24, 58, 25, W_)
    return mk(64, 52, f)

def shark():
    def f(pc):
        pc.poly([(6, 22), (0, 8), (10, 18), (0, 36), (8, 26)], H('#5a7a98'), H('#8aaac8'), H('#34506a'))
        pc.poly([(8, 20), (18, 14), (40, 14), (56, 22), (58, 28), (40, 34), (16, 34), (8, 28)], H('#6a8aa8'), H('#9ac0e0'), H('#3e5a78')); pc.poly([(16, 28), (50, 28), (40, 34), (18, 34)], H('#e8f0f8'), None, None, outline=False)
        pc.poly([(26, 14), (32, 2), (38, 14)], H('#4a6a88'), H('#7a9ab8'), H('#2a4258')); pc.poly([(28, 32), (22, 42), (36, 34)], H('#4a6a88'), None, None)
        pc.rect(48, 20, 50, 22, W_); pc.put(49, 21, EY); [pc.poly([(50 + i * 2, 29), (51 + i * 2, 33), (52 + i * 2, 29)], W_, None, None, outline=False) for i in range(4)]
        for x in (36, 38, 40): pc.line(x, 20, x, 24, H('#3e5a78'))
    return mk(60, 46, f)

def jelly():
    def f(pc):
        for i in range(6): x = 12 + i * 5; pc.line(x, 24, x + (3 if i % 2 else -3), 34, H('#c8a0ff')); pc.line(x + (3 if i % 2 else -3), 34, x + (-2 if i % 2 else 2), 44, H('#e0c8ff'))
        pc.poly([(6, 24), (8, 12), (18, 4), (30, 4), (40, 12), (42, 24), (36, 26), (24, 22), (12, 26)], H('#c8a0ff'), H('#f0e0ff'), H('#8a58d0')); pc.poly([(12, 10), (22, 6), (28, 8)], H('#ffffff'), None, None, outline=False)
        pc.rect(16, 14, 18, 17, EY); pc.rect(28, 14, 30, 17, EY); pc.line(20, 20, 26, 20, EY)
    return mk(48, 48, f)

def crab():
    def f(pc):
        for sx in (0, 1):
            for i in range(3): pc.line(14 + i * 8, 24 + sx * 4, 8 + i * 9, 34, H('#a8382a'))
        pc.poly([(6, 20), (14, 12), (38, 12), (46, 20), (44, 30), (8, 30)], H('#e0584a'), H('#ff8a7a'), H('#8a2a20'))
        pc.poly([(40, 18), (52, 12), (58, 16), (52, 24), (46, 24)], H('#e0584a'), H('#ff8a7a'), H('#8a2a20')); pc.poly([(52, 12), (56, 8), (58, 14)], H('#e0584a'), None, None)
        pc.poly([(2, 18), (-2, 12), (4, 14)], H('#e0584a'), None, None)
        for x in (30, 38): pc.line(x, 12, x, 6, H('#c0483a')); pc.disc(x, 5, 2, W_, None, None, outline=False); pc.put(x + 1, 5, EY)
    return mk(60, 38, f)

def toad():
    def f(pc):
        pc.poly([(4, 24), (6, 14), (18, 8), (34, 8), (44, 14), (46, 26), (40, 32), (10, 32)], H('#5a8a3a'), H('#8ac05a'), H('#34581e'))
        for (x, y) in ((12, 16), (22, 12), (30, 18), (38, 22)): pc.disc(x, y, 2, H('#3a6a24'), None, None, outline=False)
        pc.poly([(14, 28), (36, 28), (34, 33), (16, 33)], H('#c8d890'), None, None, outline=False)
        for x in (28, 38): pc.disc(x, 9, 4, H('#e8f0a0'), None, H('#8a9a40')); pc.rect(x, 8, x + 1, 10, EY)
        pc.line(34, 22, 44, 22, H('#2a4a14')); pc.poly([(6, 30), (-1, 36), (10, 36)], H('#5a8a3a'), None, None); pc.poly([(40, 32), (48, 36), (38, 36)], H('#5a8a3a'), None, None)
    return mk(50, 40, f)

def scorpion():
    def f(pc):
        for i in range(4): pc.line(14 + i * 6, 24, 10 + i * 7, 32, H('#6a4a22')); pc.line(14 + i * 6, 22, 10 + i * 7, 14, H('#6a4a22'))
        pc.poly([(10, 24), (14, 17), (34, 17), (40, 22), (38, 28), (12, 29)], H('#b88a3a'), H('#e0b860'), H('#6a4a1a'))
        [pc.line(x, 17, x, 28, H('#6a4a1a')) for x in (18, 24, 30)]
        pc.poly([(8, 22), (2, 16), (2, 6), (8, -1), (14, 4), (10, 10), (8, 14)], H('#b88a3a'), H('#e0b860'), H('#6a4a1a')); pc.poly([(10, 4), (14, -2), (16, 4)], H('#e03a2a'), None, None)
        pc.poly([(38, 18), (46, 14), (52, 18), (48, 24), (40, 24)], H('#b88a3a'), H('#e0b860'), H('#6a4a1a')); pc.poly([(38, 26), (46, 28), (52, 24), (48, 20)], H('#b88a3a'), None, None)
        pc.rect(36, 19, 37, 20, H('#ff3a2a'))
    return mk(56, 38, f)

def eyeball(col, iris):
    def f(pc):
        pc.poly([(2, 14), (-2, 4), (6, 10)], H('#6a1a2a'), None, None); pc.poly([(2, 24), (-2, 34), (6, 28)], H('#6a1a2a'), None, None)
        pc.disc(24, 20, 17, H(col), H('#ffffff'), H('#c8b8b8'))
        for (x0, y0, x1, y1) in ((10, 12, 16, 16), (10, 28, 16, 24), (34, 8, 30, 14), (36, 32, 30, 26), (24, 4, 24, 9)): pc.line(x0, y0, x1, y1, H('#d02030'))
        pc.disc(30, 20, 7, H(iris), H('#ff9aa0'), H('#7a1018'), outline=True); pc.disc(30, 20, 3, H('#10080c'), None, None, outline=False); pc.put(28, 18, W_)
    return mk(48, 40, f)

def treant():
    def f(pc):
        T_ = tri('#6a4426'); G = tri('#3e8a2a')
        pc.poly([(10, 54), (14, 42), (22, 44), (24, 54)], *T_); pc.poly([(32, 54), (34, 44), (42, 42), (46, 54)], *T_)
        pc.poly([(12, 44), (14, 20), (22, 12), (34, 12), (42, 20), (44, 44)], *T_); pc.line(22, 22, 24, 40, T_[2]); pc.line(34, 22, 32, 40, T_[2])
        pc.poly([(12, 22), (2, 20), (-2, 32), (6, 30), (12, 32)], *T_); pc.poly([(44, 22), (54, 18), (58, 30), (50, 30), (44, 32)], *T_)
        for (x, y, r) in ((8, 14, 7), (22, 6, 9), (36, 5, 9), (48, 12, 7), (28, 12, 8), (4, 28, 5), (54, 26, 5)): pc.disc(x, y, r, *G)
        pc.rect(22, 24, 25, 27, H('#ffd23f')); pc.rect(32, 24, 35, 27, H('#ffd23f')); pc.line(26, 33, 34, 33, T_[2]); pc.put(27, 25, EY); pc.put(33, 25, EY)
    return mk(60, 58, f)

def snowman():
    def f(pc):
        pc.disc(20, 40, 12, H('#f4faff'), H('#ffffff'), H('#9ac0e0')); pc.disc(22, 24, 9, H('#f4faff'), H('#ffffff'), H('#9ac0e0')); pc.disc(24, 11, 7, H('#f4faff'), H('#ffffff'), H('#9ac0e0'))
        for y in (22, 28, 38, 44): pc.put(22, y, H('#2a2a30'))
        pc.poly([(29, 10), (40, 12), (29, 13)], H('#ff7a1a'), H('#ffb060'), H('#a8400a')); pc.put(26, 8, EY); pc.put(22, 8, EY); pc.poly([(17, 3), (31, 3), (29, -3), (19, -3)], H('#2a2a30'), H('#4a4a54'), None); pc.line(16, 3, 32, 3, H('#2a2a30'))
        pc.line(16, 17, 30, 17, H('#e0245e')); pc.line(26, 17, 24, 24, H('#e0245e'))
        pc.rect(28, 26, 44, 29, H('#2a2a30')); pc.poly([(40, 24), (48, 28), (40, 32)], H('#7a7a8a'), None, None); pc.line(12, 26, 4, 18, H('#6a4220'))
    return mk(52, 54, f)

def gingerbread():
    def f(pc):
        B = tri('#b0703a')
        for x0 in (14, 24): pc.poly([(x0, 36), (x0 + 6, 36), (x0 + 6, 48), (x0 - 1, 48)], *B)
        pc.poly([(10, 18), (14, 14), (30, 14), (34, 18), (33, 38), (11, 38)], *B)
        pc.poly([(32, 18), (42, 14), (46, 20), (40, 24), (33, 24)], *B); pc.poly([(10, 18), (2, 14), (0, 22), (8, 24)], *B)
        pc.poly([(14, 2), (30, 2), (34, 8), (32, 16), (16, 16), (12, 8)], *B)
        for y in (22, 28, 34): pc.disc(22, y, 1, H('#e0245e'), None, None, outline=False)
        pc.line(11, 18, 33, 18, W_); pc.line(11, 38, 33, 38, W_); pc.line(33, 21, 41, 21, W_); pc.line(2, 20, 8, 20, W_)
        pc.rect(20, 7, 22, 9, W_); pc.rect(27, 7, 29, 9, W_); pc.put(21, 8, EY); pc.put(28, 8, EY); pc.line(20, 12, 28, 12, W_); pc.line(19, 11, 20, 12, W_); pc.line(28, 12, 29, 11, W_)
    return mk(50, 52, f)

def imp():
    def f(pc):
        R = tri('#c8301a')
        pc.poly([(10, 36), (4, 40), (2, 48), (6, 46), (8, 42), (12, 40)], *R); pc.poly([(2, 44), (-2, 50), (6, 50)], H('#7a1010'), None, None)
        for x0 in (14, 22): pc.poly([(x0, 32), (x0 + 5, 32), (x0 + 5, 42), (x0 - 1, 42)], *R)
        pc.poly([(12, 18), (16, 13), (28, 13), (30, 19), (28, 34), (14, 34)], *R); pc.poly([(12, 18), (6, 22), (7, 29), (11, 26)], *R); pc.poly([(28, 17), (36, 18), (40, 22), (34, 24), (29, 22)], *R)
        pc.rect(37, 6, 38, 36, H('#4a3a30')); [pc.rect(x, 4, x, 9, H('#4a3a30')) for x in (34, 38, 42)]; pc.rect(34, 8, 42, 8, H('#4a3a30'))
        pc.poly([(18, 3), (27, 2), (32, 6), (32, 14), (26, 16), (18, 15), (16, 8)], *R); pc.poly([(18, 3), (14, -4), (22, 1)], H('#2a0a0a'), None, None); pc.poly([(28, 3), (31, -5), (31, 4)], H('#2a0a0a'), None, None)
        pc.rect(26, 8, 28, 10, H('#ffe14a')); pc.line(23, 13, 29, 13, H('#2a0a0a')); pc.put(24, 14, W_); pc.put(27, 14, W_)
    return mk(46, 54, f)

ID = {  # id -> builder
 'bandit': hum('#c68a60', '#4a4a5a', head='bandana', weapon='dagger', legs='#2a2430'), 'mummy': hum('#d8d0b8', '#d8d0b8', head='bandage', legs='#c8c0a8', eye='#ff4a3a'), 'yeti': hum('#e8f0f8', '#e8f0f8', head='plain', fur=True, legs='#c8d4e0', eye='#4aa8ff', belt=False),
 'tribal_hunter': hum('#c68642', '#6a4a2a', head='feather', weapon='bow', legs='#4a341a'), 'elf_archer': hum('#e8c8a0', '#2f8a3a', head='elfhat', weapon='bow', ears=True, legs='#3a2a1a'), 'scarecrow': hum('#d8b858', '#6a5a2a', head='straw', legs='#4a3a1a', eye='#ff5a3a'),
 'pumpkin_head': hum('#c8843a', '#4a2a1a', head='pumpkin', legs='#2a1a0a'), 'bog_witch': hum('#7aa85a', '#3a2a5a', head='witch', weapon='staff', legs='#2a1a40', eye='#b0ff6a'), 'death_knight': hum('#3a3a48', '#3a3a56', head='helm', weapon='sword', cape='#5a1a2a', legs='#2a2a38', eye='#ff3a3a'),
 'vampire_thrall': hum('#d8c8d0', '#4a1a2a', head='hair', cape='#5a0a1a', legs='#241020', eye='#ff3a3a'), 'merfolk': hum('#4ac0c0', '#2f8aa0', head='hair', weapon='trident', fish='#2f8aa0', eye='#ffffff'),
 'pit_demon': hum('#a01818', '#7a1010', head='horns', wings='#5a0a0a', tail='#7a1010', legs='#5a0a0a', eye='#ffe14a'), 'gargoyle': hum('#7a7f88', '#6a6f78', head='horns', wings='#5a5f68', legs='#5a5f68', eye='#ff7a3a'),
 'harpy': hum('#e8c8b8', '#9a80d0', head='hair', wings='#c8b8f0', legs='#9a80d0', eye='#8a4aff'), 'frost_giant': hum('#bfe0f0', '#9ac0e0', head='plain', fur=True, legs='#7aa0c0', eye='#4aa8ff', belt=False),
 'rock_golem': golem('#7a7f88', moss=True), 'magma_golem': golem('#5a4a48', '#ff8a1a', lava=True), 'jungle_golem': golem('#4a7a4a', '#7bff5a', moss=True), 'tomb_guardian': golem('#c9b070', '#ffd23f'), 'crystal_golem': golem('#8a70c8', '#e8d0ff', crystals=True),
 'fire_elemental': elemental('#ff6a1a', '#ffe27a', 'fire'), 'ice_elemental': elemental('#9be7ff', '#ffffff', 'ice'), 'sand_elemental': elemental('#e6c34a', '#fff0a0', 'sand'),
 'shadow_wraith': ghost('#2a2438', '#b06aff', 'hood'), 'banshee': ghost('#b8f0e0', '#7ad8c8', 'wail'), 'ghost_pumpkin': ghost('#e8841a', '#ffb02e', 'pumpkin'),
 'jungle_viper': serpent('#4aa84a', '#e8e0b0'), 'leech': serpent('#6a2a3a', '#c05a6a', worm=True), 'vulture': bird('#6a4a3a', '#d8c8b0', '#c9a03a', bald=True), 'giant_hornet': hornet(),
 'wyvern': dragon('#a83a2a', '#ffd9a0', '#7a2a1a', '#ffb02e'), 'bone_drake': dragon('#e8e2cf', '#d8d0b8', '#b8b098', '#c9b88a', bone=True), 'storm_drake': dragon('#6a7ac0', '#d0e0ff', '#3a4a90', '#ffe14a'),
 'shark': shark(), 'jellyfish': jelly(), 'sea_crab': crab(), 'toad': toad(), 'scorpion': scorpion(), 'demon_eye': eyeball('#f4f0ee', '#c0262d'), 'blood_eye': eyeball('#e8c8c8', '#8a1020'),
 'treant': treant(), 'snowman_gunner': snowman(), 'gingerbread_brute': gingerbread(), 'lava_imp': imp(),
}
