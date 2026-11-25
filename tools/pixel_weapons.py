# Hand-pixeled weapon bases (neutral tones, tinted by material colour in the game: multiply) and armor icons (class-specific shapes).
from pixel_hand import PC, H, OUT
def C(*a): return tuple(H(x) for x in a)
BLADE = C('#e4e4ee', '#ffffff', '#9c9cb0'); GRIP = C('#a8a8b8', '#d0d0dc', '#6a6a7c'); GUARD = C('#c8c8d6', '#f0f0fa', '#8484966'.replace('6','')) if False else C('#c8c8d6', '#f0f0fa', '#848496')
def W(): return PC(32, 32)
def grip(pc, x0=2, x1=9, y=15, th=3): pc.poly([(x0, y), (x1, y), (x1, y + th), (x0, y + th)], *GRIP); pc.disc(x0 - 1 if x0 > 2 else x0 + 1, y + 1, 2, *GUARD)
def sword():
    pc = W(); pc.poly([(11, 13), (28, 13), (31, 16), (28, 19), (11, 19)], *BLADE); pc.line(12, 16, 29, 16, H('#b4b4c8')); pc.line(12, 14, 27, 14, H('#ffffff'))
    pc.poly([(8, 9), (11, 9), (11, 23), (8, 23)], *GUARD); grip(pc, 2, 8, 14, 4); return pc
def dagger():
    pc = W(); pc.poly([(12, 14), (23, 14), (27, 16), (23, 18), (12, 18)], *BLADE); pc.line(13, 16, 25, 16, H('#b4b4c8')); pc.poly([(10, 11), (12, 11), (12, 21), (10, 21)], *GUARD); grip(pc, 4, 10, 14, 4); return pc
def axe():
    pc = W(); pc.poly([(3, 15), (25, 15), (25, 18), (3, 18)], *GRIP); pc.poly([(18, 5), (25, 4), (30, 8), (31, 15), (28, 18), (23, 18), (19, 14)], *BLADE); pc.line(21, 6, 29, 11, H('#ffffff')); pc.line(22, 8, 22, 15, H('#b4b4c8')); pc.disc(2, 16, 2, *GUARD); return pc
def pickaxe():
    pc = W(); pc.poly([(3, 15), (27, 15), (27, 18), (3, 18)], *GRIP); pc.poly([(8, 11), (17, 6), (26, 7), (31, 14), (27, 12), (18, 10), (12, 14)], *BLADE); pc.poly([(8, 20), (17, 25), (26, 24), (31, 17), (27, 19), (18, 21), (12, 17)], *BLADE); pc.disc(2, 16, 2, *GUARD); return pc
def spear():
    pc = W(); pc.poly([(2, 15), (22, 15), (22, 17), (2, 17)], *GRIP); pc.poly([(21, 12), (28, 11), (31, 16), (28, 21), (21, 20), (24, 16)], *BLADE); pc.line(23, 16, 29, 16, H('#ffffff')); pc.rect(19, 13, 20, 19, *GUARD[:1]); return pc
def hammer():
    pc = W(); pc.poly([(3, 15), (22, 15), (22, 18), (3, 18)], *GRIP); pc.poly([(19, 7), (30, 7), (30, 26), (19, 26)], *BLADE); pc.line(20, 9, 28, 9, H('#ffffff')); pc.rect(19, 15, 30, 17, GUARD[0]); pc.rect(19, 11, 30, 11, GUARD[2]); pc.rect(19, 22, 30, 22, GUARD[2]); pc.disc(2, 16, 2, *GUARD); return pc
def scythe():
    pc = W(); pc.poly([(3, 15), (24, 15), (24, 18), (3, 18)], *GRIP); pc.poly([(20, 14), (21, 8), (26, 4), (31, 6), (29, 9), (25, 10), (23, 14)], *BLADE); pc.line(22, 9, 28, 6, H('#ffffff')); pc.disc(2, 16, 2, *GUARD); return pc
def whip():
    pc = W(); pc.poly([(2, 14), (9, 14), (9, 18), (2, 18)], *GRIP)
    pts = [(10, 16), (13, 13), (17, 12), (21, 14), (24, 18), (27, 20), (30, 17)]
    for a, b in zip(pts, pts[1:]): pc.line(a[0], a[1], b[0], b[1], BLADE[0]); pc.line(a[0], a[1] + 1, b[0], b[1] + 1, BLADE[2])
    pc.put(30, 16, H('#ffffff')); return pc
def bow():
    pc = W(); arc = [(14, 2), (19, 5), (23, 10), (25, 16), (23, 22), (19, 27), (14, 30)]
    for a, b in zip(arc, arc[1:]): pc.line(a[0], a[1], b[0], b[1], GRIP[0]); pc.line(a[0] - 1, a[1], b[0] - 1, b[1], GRIP[2]); pc.line(a[0] + 1, a[1], b[0] + 1, b[1], GRIP[1])
    pc.line(14, 2, 14, 30, H('#f0f0f8')); pc.rect(22, 14, 25, 18, GUARD[0]); return pc
def crossbow():
    pc = W(); pc.poly([(3, 14), (24, 14), (24, 18), (3, 18)], *GRIP); pc.poly([(21, 3), (26, 3), (26, 29), (21, 29)], *GRIP)
    pc.line(23, 3, 14, 15, H('#f0f0f8')); pc.line(23, 29, 14, 17, H('#f0f0f8')); pc.poly([(8, 15), (29, 15), (31, 16), (29, 17), (8, 17)], *BLADE); pc.rect(10, 18, 12, 21, GRIP[2]); return pc
def staff():
    pc = W(); pc.poly([(2, 15), (25, 15), (25, 18), (2, 18)], *GRIP); pc.line(2, 15, 25, 15, GRIP[1])
    for dy in (-5, 0, 5): pass
    pc.poly([(23, 12), (26, 9), (29, 13), (26, 14)], *GUARD); pc.poly([(23, 20), (26, 23), (29, 19), (26, 18)], *GUARD); pc.disc(27, 16, 3, *BLADE); pc.put(26, 15, H('#ffffff')); return pc
def wand():
    pc = W(); pc.poly([(5, 15), (23, 15), (23, 17), (5, 17)], *GRIP); pc.poly([(24, 16), (26, 11), (28, 16), (31, 17), (28, 18), (26, 23), (24, 18), (21, 17)], *BLADE); pc.put(26, 16, H('#ffffff')); return pc
def tome():
    pc = W(); pc.poly([(7, 5), (25, 5), (26, 27), (7, 27)], *GRIP); pc.poly([(9, 7), (24, 7), (24, 25), (9, 25)], *BLADE); pc.rect(7, 5, 9, 27, GUARD[2]); pc.poly([(13, 12), (20, 12), (22, 16), (20, 20), (13, 20), (11, 16)], *GUARD); pc.disc(16, 16, 2, *BLADE); pc.rect(23, 14, 26, 18, GUARD[0]); return pc
def shuriken():
    pc = W(); import math
    pts = []
    for k in range(8): r = 14 if k % 2 == 0 else 4; a = k * math.pi / 4; pts.append((round(16 + r * math.cos(a)), round(16 + r * math.sin(a))))
    pc.poly(pts, *BLADE); pc.disc(16, 16, 2, H('#40404c'), None, None); return pc
def boomerang():
    pc = W(); pc.poly([(5, 8), (12, 8), (28, 18), (26, 24), (18, 22), (5, 14)], *BLADE); pc.line(7, 10, 25, 20, H('#ffffff')); return pc
def gun():
    pc = W(); pc.poly([(3, 12), (24, 12), (28, 14), (28, 18), (24, 18), (3, 18)], *GRIP); pc.poly([(6, 18), (12, 18), (10, 27), (5, 27)], *GRIP); pc.rect(24, 13, 30, 16, BLADE[0]); pc.line(4, 13, 23, 13, GRIP[1]); return pc
WEAPONS = {k: v for k, v in globals().items() if k in ('sword', 'dagger', 'axe', 'pickaxe', 'spear', 'hammer', 'scythe', 'whip', 'bow', 'crossbow', 'staff', 'wand', 'tome', 'shuriken', 'boomerang', 'gun')}

# ---------------------------------------------------------------- ARMOR ICONS (24x24): shapes depend on the CLASS, colours on the set look
def pal(look):
    pri = H(look['pri']); sec = H(look.get('sec') or look['pri']); trim = H(look.get('trim') or '#ffffff'); glow = H(look['glow']) if look.get('glow') else None
    def sh(c, k): return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)
    return (pri, sh(pri, 1.3), sh(pri, 0.62)), (sec, sh(sec, 1.3), sh(sec, 0.6)), trim, glow
def helmet_icon(cls, look):
    P_, S_, trim, glow = pal(look); pc = PC(24, 24); st = look.get('helm', 'helm')
    if st == 'horns':
        pc.poly([(4, 12), (2, 3), (8, 9)], H('#f0ead8'), H('#ffffff'), H('#b0a888')); pc.poly([(20, 12), (22, 3), (16, 9)], H('#f0ead8'), H('#ffffff'), H('#b0a888'))
    if cls == 'melee':
        pc.poly([(4, 21), (4, 11), (7, 5), (12, 3), (17, 5), (20, 11), (20, 21), (16, 21), (16, 16), (8, 16), (8, 21)], *P_); pc.rect(7, 11, 16, 13, H('#15101c')); pc.line(12, 3, 12, 10, S_[0])
        if glow: pc.line(8, 12, 15, 12, glow)
        pc.line(6, 6, 10, 4, P_[1]); pc.rect(11, 1, 12, 4, S_[0])
    elif cls == 'ranged':
        pc.poly([(3, 21), (3, 12), (7, 5), (12, 1), (17, 5), (21, 12), (21, 21), (16, 21), (16, 15), (8, 15), (8, 21)], *S_); pc.poly([(8, 8), (16, 8), (17, 15), (7, 15)], H('#1a1420'), None, None, outline=False); pc.poly([(5, 12), (7, 6), (12, 3)], P_[1], None, None, outline=False)
        pc.rect(10, 11, 11, 12, H('#ffe27a')) if not glow else pc.rect(10, 11, 11, 12, glow); pc.rect(13, 11, 14, 12, H('#ffe27a') if not glow else glow)
    elif cls == 'magic':
        pc.poly([(2, 20), (7, 17), (8, 9), (12, 1), (16, 9), (17, 17), (22, 20), (12, 22)], *S_); pc.poly([(7, 17), (17, 17), (16, 13), (8, 13)], trim, None, None, outline=False); pc.star(12, 8, 2, 1, 4, glow or H('#ffe27a'), None, 0, 0) if False else (pc.put(12, 7, glow or H('#ffe27a')), pc.put(11, 8, glow or H('#ffe27a')), pc.put(13, 8, glow or H('#ffe27a')), pc.put(12, 9, glow or H('#ffe27a')))
    else:
        pc.poly([(4, 18), (4, 12), (7, 10), (17, 10), (20, 12), (20, 18), (16, 18), (16, 14), (8, 14), (8, 18)], *P_); pc.poly([(6, 10), (7, 3), (10, 8)], *S_); pc.poly([(18, 10), (17, 3), (14, 8)], *S_); pc.poly([(10, 10), (12, 5), (14, 10)], trim, None, None, outline=False); pc.disc(12, 8, 1, glow or H('#7bff9a'), None, None, outline=False)
    if st == 'crown': pc.poly([(5, 6), (5, 1), (8, 4), (12, 0), (16, 4), (19, 1), (19, 6)], H('#e8b43c'), H('#ffe27a'), H('#9c6a18'))
    if st == 'spiky':
        for x in (6, 10, 14, 18): pc.poly([(x - 1, 5), (x, 0), (x + 1, 5)], *P_)
    if st == 'eye': pc.disc(12, 6, 2, H('#f4ece4'), None, None, outline=False); pc.put(12, 6, H('#c0262d'))
    return pc
def chest_icon(cls, look):
    P_, S_, trim, glow = pal(look); pc = PC(24, 24)
    if look.get('wings'):
        for sx in (-1, 1): pc.poly([(12 + sx * 4, 6), (12 + sx * 11, 0), (12 + sx * 11, 8), (12 + sx * 5, 12)], H('#ffffff'), H('#fff8d8'), H('#c8c0a0'))
    if look.get('cape'): pc.poly([(5, 6), (19, 6), (22, 23), (2, 23)], H('#8a1a2a'), H('#c03a4c'), H('#4a0a14'))
    if cls == 'melee':
        pc.poly([(4, 22), (5, 9), (8, 5), (16, 5), (19, 9), (20, 22)], *P_); pc.disc(4, 8, 3, *S_); pc.disc(20, 8, 3, *S_); pc.line(12, 7, 12, 21, S_[2]); pc.line(5, 14, 19, 14, S_[2]); pc.line(5, 18, 19, 18, S_[2])
        pc.rect(10, 11, 13, 12, trim)
        if glow: pc.disc(12, 10, 1, glow, None, None, outline=False)
    elif cls == 'ranged':
        pc.poly([(5, 22), (5, 8), (9, 4), (15, 4), (19, 8), (19, 22)], *P_); pc.poly([(3, 6), (6, 5), (6, 12), (3, 12)], *S_); pc.poly([(21, 6), (18, 5), (18, 12), (21, 12)], *S_)
        pc.line(8, 6, 17, 20, S_[2]); pc.line(16, 6, 7, 20, S_[2]); pc.rect(5, 17, 18, 18, S_[0]); pc.rect(11, 16, 13, 19, trim)
    elif cls == 'magic':
        pc.poly([(7, 22), (6, 8), (9, 4), (15, 4), (18, 8), (17, 22)], *P_); pc.poly([(1, 20), (3, 8), (7, 8), (6, 14)], *S_); pc.poly([(23, 20), (21, 8), (17, 8), (18, 14)], *S_); pc.rect(7, 12, 16, 14, trim); pc.poly([(9, 4), (12, 9), (15, 4)], *S_)
        pc.put(12, 17, glow or H('#c8a0ff')); pc.put(11, 18, glow or H('#c8a0ff')); pc.put(13, 18, glow or H('#c8a0ff')); pc.put(12, 19, glow or H('#c8a0ff'))
    else:
        pc.poly([(5, 22), (5, 9), (8, 3), (16, 3), (19, 9), (19, 22)], *P_); pc.poly([(7, 3), (9, 0), (12, 5), (15, 0), (17, 3)], *S_); pc.line(12, 5, 12, 21, S_[2]); pc.disc(12, 12, 3, glow or H('#7bff9a'), trim, None); pc.rect(5, 18, 18, 19, S_[0])
    return pc
def legs_icon(cls, look):
    P_, S_, trim, glow = pal(look); pc = PC(24, 24)
    if cls == 'melee':
        pc.poly([(4, 3), (20, 3), (19, 10), (21, 22), (13, 22), (12, 12), (11, 12), (11, 22), (3, 22), (5, 10)], *P_); pc.disc(7, 11, 2, *S_); pc.disc(17, 11, 2, *S_); pc.rect(4, 3, 19, 5, S_[0]); pc.rect(11, 3, 12, 5, trim); pc.rect(3, 19, 10, 22, S_[2]); pc.rect(14, 19, 21, 22, S_[2])
    elif cls == 'ranged':
        pc.poly([(5, 3), (19, 3), (18, 12), (20, 22), (13, 22), (12, 13), (11, 13), (11, 22), (4, 22), (6, 12)], *P_); pc.rect(5, 3, 18, 5, S_[0]); pc.rect(5, 12, 10, 13, S_[2]); pc.rect(14, 12, 19, 13, S_[2]); pc.rect(4, 17, 10, 22, S_[0]); pc.rect(14, 17, 20, 22, S_[0]); pc.line(4, 17, 10, 17, trim); pc.line(14, 17, 20, 17, trim)
    elif cls == 'magic':
        pc.poly([(6, 3), (18, 3), (21, 18), (14, 20), (12, 12), (10, 20), (3, 18)], *P_); pc.rect(6, 3, 17, 5, trim); pc.poly([(3, 18), (10, 20), (9, 23), (2, 22)], *S_); pc.poly([(21, 18), (14, 20), (15, 23), (22, 22)], *S_)
    else:
        pc.poly([(5, 3), (19, 3), (18, 14), (19, 22), (13, 22), (12, 15), (11, 15), (11, 22), (5, 22), (6, 14)], *P_); pc.rect(5, 3, 18, 5, S_[0]); pc.disc(12, 4, 1, glow or H('#7bff9a'), None, None, outline=False)
        for y in (17, 19): pc.line(5, y, 10, y, S_[2]); pc.line(14, y, 19, y, S_[2])
    return pc
ARMOR = {'helmet': helmet_icon, 'chest': chest_icon, 'legs': legs_icon}
