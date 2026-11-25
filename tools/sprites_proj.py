# Pixel-art projectile sprites (3 animation frames each, facing right), impact bursts, muzzle flashes and ground zones.
# Built with the hand-pixel engine (no anti-aliasing). "tint" kinds are drawn in neutral tones and colorized at runtime.
import math
from pixel_hand import PC, H, OUT
from PIL import Image
W = 20
def R(x, y, a): c, s = math.cos(a), math.sin(a); return (x * c - y * s, x * s + y * c)
def rot(pts, a, cx=10, cy=10): return [(round(cx + R(x - cx, y - cy, a)[0]), round(cy + R(x - cx, y - cy, a)[1])) for x, y in pts]
def pal(base, light, dark, core='#ffffff'): return (H(base), H(light), H(dark), H(core))

def k_arrow(pc, i):
    pc.line(2, 10, 14, 10, H('#a8723a')); pc.line(2, 11, 14, 11, H('#6a4420'))
    pc.poly([(13, 7), (19, 10), (13, 13)], H('#dfe6ee'), H('#ffffff'), H('#8a96a8'))
    pc.poly([(1, 7), (5, 10), (1, 13)], H('#e8e8f0'), None, H('#9a9ab0')); pc.put(1, 10, H('#e0245e')); pc.put(2 + i % 2, 9, H('#ffffff'))
def k_bolt(pc, i):
    j = [(0, 0), (1, -1), (-1, 1)][i]
    pts = [(1, 12), (6 + j[0], 6 + j[1]), (9, 11), (14 + j[1], 5 + j[0]), (19, 9)]
    for a, b in zip(pts, pts[1:]): pc.line(a[0], a[1], b[0], b[1], H('#9a9a9a')); pc.line(a[0], a[1] + 1, b[0], b[1] + 1, H('#cfcfcf'))
    for a in pts[1:4]: pc.put(a[0], a[1], H('#ffffff'))
def k_star(pc, i):
    a = i * 0.45; pts = []
    for k in range(8): r = 9 if k % 2 == 0 else 3; ang = a + k * math.pi / 4; pts.append((round(10 + r * math.cos(ang)), round(10 + r * math.sin(ang))))
    pc.poly(pts, H('#d8d8e0'), H('#ffffff'), H('#8a8a9a')); pc.put(10, 10, H('#333344'))
def k_poison(pc, i):
    pc.poly([(1, 10), (6, 7), (6, 13)], H('#4aa83a'), None, H('#2a7a1a')); pc.disc(11, 10, 5, H('#78d848'), H('#c8ff98'), H('#3a8a28'))
    for (x, y) in ((9 + i % 2, 8), (13, 11 + (i + 1) % 2)): pc.put(x, y, H('#e8ffc8'))
    pc.put(4, 5 + i, H('#78d848')); pc.put(3, 14 - i, H('#78d848'))
def k_soul(pc, i):
    pc.poly([(1, 10 + (i % 2)), (7, 7), (7, 14)], H('#9ad8d0', ), None, None, outline=False); pc.poly([(4, 11 - i % 2), (8, 8), (8, 13)], H('#c8f4ee'), None, None, outline=False)
    pc.disc(12, 10, 5, H('#d8fff8'), H('#ffffff'), H('#8ad0c8')); pc.put(11, 9, H('#1a3a4a')); pc.put(14, 9, H('#1a3a4a')); pc.put(12 + i % 2, 12, H('#1a3a4a'))
def k_ice(pc, i):
    pc.poly([(2, 10), (9, 6), (19, 10), (9, 14)], H('#8ad8ff'), H('#e8faff'), H('#3a8ac8')); pc.line(4, 10, 16, 10, H('#ffffff'))
    pc.put(15 + i % 2, 7, H('#ffffff')); pc.put(7, 5 + (i + 1) % 2, H('#ffffff')); pc.put(5, 15 - i % 2, H('#cfeeff'))
def k_void(pc, i):
    pc.disc(10, 10, 6, H('#2a1050'), H('#8a4aff'), H('#14082a'))
    for k in range(3): a = i * 0.9 + k * 2.1; pc.put(round(10 + 7 * math.cos(a)), round(10 + 7 * math.sin(a)), H('#d8b0ff'))
    pc.disc(10, 10, 2, H('#05000a'), None, None, outline=False); pc.put(9, 9, H('#c8a0ff'))
def k_fire(pc, i):
    t = [(0, 0), (1, -1), (-1, 1)][i]
    pc.poly([(1, 10 + t[0]), (8, 5), (10, 3 + t[1]), (11, 8), (18, 10), (11, 13), (10, 17 + t[0]), (8, 15)], H('#e8541a'), H('#ffb02e'), H('#a82a0a'))
    pc.disc(12, 10, 4, H('#ffb02e'), H('#fff0a0'), H('#e8701a'), outline=False); pc.put(12, 10, H('#ffffff')); pc.put(13, 9, H('#ffffff'))
def k_thorn(pc, i):
    pc.poly([(1, 9), (13, 8), (19, 10), (13, 12), (1, 11)], H('#4a8a2e'), H('#8ad04a'), H('#2a5a1a'))
    pc.poly([(5, 6), (7, 9), (9, 9)], H('#6ab048'), None, None); pc.poly([(5, 14), (7, 11), (9, 11)], H('#6ab048'), None, None); pc.put(16, 10, H('#e8f8c0')); pc.put(2, 10, H('#6a4420'))
def k_magic(pc, i):
    pc.disc(10, 10, 4, H('#b0b0b0'), H('#ffffff'), H('#707080'))
    a = i * 0.8
    for k in range(4): ang = a + k * math.pi / 2; pc.put(round(10 + 7 * math.cos(ang)), round(10 + 7 * math.sin(ang)), H('#ffffff')); pc.put(round(10 + 5.5 * math.cos(ang + .4)), round(10 + 5.5 * math.sin(ang + .4)), H('#c8c8d8'))
    pc.put(10, 10, H('#ffffff'))
def k_bone(pc, i):
    a = i * 0.7; e = lambda dx, dy: (round(10 + dx * math.cos(a) - dy * math.sin(a)), round(10 + dx * math.sin(a) + dy * math.cos(a)))
    p0, p1 = e(-6, 0), e(6, 0); pc.line(p0[0], p0[1], p1[0], p1[1], H('#e8e2cf'))
    for (x, y) in (p0, p1):
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)): pc.put(x + dx, y + dy, H('#f6f2e4'))
    for s in (-1, 1):
        q = e(s * 6, -2); q2 = e(s * 6, 2); pc.put(q[0], q[1], H('#e8e2cf')); pc.put(q2[0], q2[1], H('#e8e2cf'))
def k_eye(pc, i):
    pc.disc(10, 10, 6, H('#f4f0ee'), H('#ffffff'), H('#c8b8b8'))
    for (x0, y0, x1, y1) in ((5, 8, 7, 9), (5, 12, 7, 11), (14, 7, 13, 9)): pc.line(x0, y0, x1, y1, H('#d02030'))
    pc.disc(12 + (i % 2), 10, 2, H('#c0262d'), None, None, outline=False); pc.put(12 + i % 2, 10, H('#10080c')); pc.put(11, 9, H('#ffffff'))
def k_trident(pc, i):
    pc.line(2, 10, 15, 10, H('#bfe8ff')); pc.line(2, 11, 15, 11, H('#5a9ac0'))
    for dy in (-3, 0, 3): pc.line(15, 10 + dy, 19, 10 + dy, H('#e8faff'))
    pc.line(14, 6, 14, 14, H('#e8faff')); pc.put(19, 7, H('#7ae0ff')); pc.put(19, 13, H('#7ae0ff')); pc.put(19 - i % 2, 10, H('#ffffff'))
def k_egg(pc, i):
    pc.poly([(5, 10), (9, 5), (15, 6), (17, 10), (15, 14), (9, 15)], H('#f4eedc'), H('#ffffff'), H('#c8bca0'))
    for (x, y) in ((9, 8), (12, 12), (14, 8)): pc.put(x, y, H('#a89870'))
def k_orb(pc, i):
    r = 5 + (i == 1)
    pc.disc(10, 10, r, H('#9a9a9a'), H('#e0e0e0'), H('#5a5a6a')); pc.disc(10, 10, 3, H('#d8d8d8'), H('#ffffff'), None, outline=False); pc.put(9, 9, H('#ffffff')); pc.put(10, 9, H('#ffffff'))
def k_wave(pc, i):
    w = [0, 1, 2][i]
    pc.poly([(4, 2), (11 + w, 5), (17, 10), (11 + w, 15), (4, 18), (9, 10)], H('#c8c8d0'), H('#ffffff'), H('#7a7a8a'))
    pc.line(8, 4, 15, 9, H('#ffffff')); pc.put(17, 10, H('#ffffff'))
def k_page(pc, i):
    sk = [0, 1, -1][i]
    pc.poly([(4, 4 + sk), (16, 6), (16, 15), (4, 14 - sk)], H('#f4ecd0'), H('#ffffff'), H('#b8a878'))
    for y in (7, 9, 11): pc.line(6, y + sk // 2, 14, y + 1, H('#8a7a58'))
def k_beam(pc, i):
    pc.line(0, 10, 19, 10, H('#b0b0b0')); pc.line(0, 9, 19, 9, H('#e0e0e0')); pc.line(0, 11, 19, 11, H('#808090')); pc.line(2, 10, 17, 10, H('#ffffff'))
    pc.put(10 + i * 3, 8, H('#ffffff')); pc.put(7 + i * 3, 12, H('#ffffff'))
def k_bfg(pc, i):
    pc.disc(10, 10, 8, H('#9a9a9a'), H('#e8e8e8'), H('#4a4a5a')); pc.disc(10, 10, 5, H('#d0d0d0'), H('#ffffff'), None, outline=False); pc.disc(10, 10, 2, H('#ffffff'), None, None, outline=False)
    for k in range(4): a = i * 0.6 + k * math.pi / 2; pc.line(10, 10, round(10 + 9 * math.cos(a)), round(10 + 9 * math.sin(a)), H('#ffffff')) if i == 1 else pc.put(round(10 + 9 * math.cos(a)), round(10 + 9 * math.sin(a)), H('#ffffff'))
def k_duck(pc, i):
    pc.poly([(3, 9), (14, 9), (15, 14), (6, 15), (3, 13)], H('#ffd23f'), H('#fff0a0'), H('#c8961a')); pc.disc(14, 7, 3, H('#ffd23f'), H('#fff0a0'), H('#c8961a'))
    pc.poly([(17, 7), (19, 8), (17, 9)], H('#ff8a1a'), None, None); pc.put(14, 6, H('#10080c')); pc.line(4, 11, 7, 11 + i % 2, H('#e8a81a'))
def k_cube(pc, i):
    pc.poly([(4, 4), (16, 4), (16, 16), (4, 16)], H('#aab0b8'), H('#e0e4e8'), H('#6a7078')); pc.line(4, 10, 16, 10, H('#7a8088')); pc.line(10, 4, 10, 16, H('#7a8088'))
    pc.put(7, 7, H('#ff7aa8')); pc.put(8, 7, H('#ff7aa8')); pc.put(6, 8, H('#ff7aa8')); pc.put(9, 8, H('#ff7aa8')); pc.put(7, 9, H('#ff7aa8')); pc.put(8, 9, H('#ff7aa8'))
def k_bomb(pc, i):
    pc.disc(10, 11, 6, H('#2a2a34'), H('#5a5a6a'), H('#12121a')); pc.line(12, 5, 14, 3, H('#8a6a30'))
    c = [H('#ffb02e'), H('#ff5a1a'), H('#ffe27a')][i]; pc.put(14, 2, c); pc.put(15, 3, c); pc.put(13, 2, c)
def k_bat(pc, i):
    w = [-3, 0, 3][i]
    pc.poly([(9, 10), (3, 5 + w), (6, 9), (4, 10), (6, 11), (3, 15 - w), (9, 11)], H('#3a1a2a'), H('#6a2a44'), H('#1a0a12'))
    pc.disc(12, 10, 3, H('#4a2234'), H('#7a3a54'), None); pc.put(14, 9, H('#ff3a3a')); pc.put(13, 8, H('#4a2234')); pc.put(15, 8, H('#4a2234')); pc.put(14, 11, H('#ffffff'))
def k_pumpkin(pc, i):
    pc.disc(10, 11, 6, H('#e8801c'), H('#ffb14a'), H('#a8500e')); pc.line(10, 5, 11, 3, H('#2a7a2a')); pc.put(8, 10, H('#ffe14a')); pc.put(12, 10, H('#ffe14a')); pc.line(8, 13, 12, 13, H('#ffe14a'))
def k_gel(pc, i):
    b = [0, 1, 0][i]
    pc.poly([(4, 12), (5, 8 - b), (10, 5), (15, 8), (16, 13), (10, 15)], H('#9a9a9a'), H('#e0e0e0'), H('#5a5a6a')); pc.put(8, 8, H('#ffffff')); pc.put(9, 8, H('#ffffff')); pc.put(12, 11, H('#c8c8c8'))
def k_sphere(pc, i):
    a = i * 0.5; pc.disc(10, 10, 6, H('#e8ecf4'), H('#ffffff'), H('#9aa0b0'))
    pc.poly([(4, 10), (6, 14), (10, 16), (14, 14), (16, 10)], H('#e0454a'), H('#ff8a8a'), H('#8a1a20'), outline=False); pc.line(4, 10, 16, 10, H('#14101a')); pc.disc(10, 10, 2, H('#ffffff'), None, None); pc.put(10 + i % 2, 10, H('#9aa0b0'))
# ---- custom per-monster kinds
def k_seed(pc, i):
    pc.poly([(3, 9), (11, 6), (17, 10), (11, 14), (3, 11)], H('#d8c8a0'), H('#fff0c8'), H('#8a7a50')); pc.line(6, 10, 13, 10, H('#8a7a50')); pc.put(15, 10, H('#fff0c8'))
def k_crow(pc, i):
    w = [-3, 0, 3][i]
    pc.poly([(8, 10), (3, 5 + w), (8, 8), (10, 10), (8, 12), (3, 15 - w)], H('#22222c'), H('#4a4a5c'), H('#0e0e14')); pc.disc(12, 10, 3, H('#2a2a34'), H('#4a4a5c'), None); pc.poly([(15, 9), (19, 10), (15, 11)], H('#e8a830'), None, None); pc.put(13, 9, H('#ff4a4a'))
def k_wisp(pc, i):
    t = [0, 1, -1][i]
    pc.poly([(2, 10 + t), (8, 6), (10, 3), (12, 7), (17, 10), (12, 13), (10, 16), (8, 14)], H('#e8841a'), H('#ffd060'), H('#a8480a')); pc.disc(12, 10, 3, H('#ffe27a'), H('#ffffff'), None, outline=False); pc.put(11, 9, H('#2a1008')); pc.put(14, 9, H('#2a1008'))
def k_snowball(pc, i):
    pc.disc(10, 10, 5, H('#e8f4ff'), H('#ffffff'), H('#9ac0e0')); pc.put(8, 9, H('#c8e0f4')); pc.put(12, 12, H('#c8e0f4')); pc.put(3 + i, 6, H('#ffffff')); pc.put(2, 13 - i, H('#ffffff'))
def k_cookie(pc, i):
    pc.disc(10, 10, 6, H('#b8783a'), H('#d8985a'), H('#7a4a1a')); pc.put(8, 8, H('#ffffff')); pc.put(12, 8, H('#ffffff')); pc.line(8, 12, 12, 12, H('#ffffff')); pc.put(10, 10, H('#e0245e'))
def k_present(pc, i):
    pc.poly([(4, 6), (16, 6), (16, 16), (4, 16)], H('#d8203a'), H('#ff6a7a'), H('#8a1020')); pc.line(10, 6, 10, 16, H('#ffd23f')); pc.line(4, 11, 16, 11, H('#ffd23f')); pc.poly([(6, 3), (10, 6), (14, 3), (10, 5)], H('#ffd23f'), None, None)
def k_candy(pc, i):
    a = i * 0.5; pts = []
    for k in range(10): r = 8 if k % 2 == 0 else 4; ang = a + k * math.pi / 5; pts.append((round(10 + r * math.cos(ang)), round(10 + r * math.sin(ang))))
    pc.poly(pts, H('#e0245e'), H('#ff8a9a'), H('#8a1030')); pc.put(10, 10, H('#ffffff'))
def k_bloodorb(pc, i):
    pc.disc(10, 10, 5 + (i == 1), H('#b0142c'), H('#ff5a70'), H('#5a0a1a')); pc.disc(9, 9, 2, H('#ff8a9a'), None, None, outline=False); pc.put(8, 8, H('#ffffff')); pc.put(15, 12 + i % 2, H('#b0142c')); pc.put(4, 6 + i, H('#b0142c'))
def k_water(pc, i):
    pc.disc(10, 10, 6, H('#3a9ad8'), H('#a0e0ff'), H('#1a5a98'), ); pc.put(8, 8, H('#ffffff')); pc.put(9, 7, H('#ffffff')); pc.put(13, 12, H('#7ac8f4')); pc.put(4 + i, 5, H('#a0e0ff')); pc.put(3, 14 - i, H('#a0e0ff'))
def k_stinger(pc, i):
    pc.poly([(2, 9), (14, 9), (19, 10), (14, 11), (2, 11)], H('#2a2218'), H('#5a4a30'), H('#120e08')); pc.line(4, 10, 12, 10, H('#e8c23a')); pc.put(7, 10, H('#2a2218')); pc.put(10, 10, H('#2a2218')); pc.put(18, 10, H('#e8ffc0'))
def k_leaf(pc, i):
    a = i * 0.35
    pc.poly(rot([(3, 10), (8, 6), (16, 8), (18, 10), (16, 12), (8, 14)], a), H('#58b038'), H('#a0e070'), H('#2a6a1a')); pc.line(*rot([(4, 10)], a)[0], *rot([(16, 10)], a)[0], H('#2a6a1a'))
def k_sand(pc, i):
    pc.disc(10, 10, 4, H('#c8a838'), H('#f4dc78'), H('#8a6a18'))
    for k in range(5): a = i * 1.1 + k * 1.26; pc.put(round(10 + 7 * math.cos(a)), round(10 + 6 * math.sin(a)), H('#f4dc78'))
def k_feather(pc, i):
    pc.poly([(2, 12), (6, 7), (15, 7), (19, 9), (15, 12), (6, 13)], H('#e8e0f8'), H('#ffffff'), H('#a8a0c8')); pc.line(3, 12, 17, 9, H('#a8a0c8'))
    for x in (7, 10, 13): pc.put(x, 8 + (x % 2), H('#c8c0e0'))
def k_spark(pc, i):
    pts = [(2, 10), (7, 6 + i), (10, 12), (14, 6), (18, 10)]
    for a, b in zip(pts, pts[1:]): pc.line(a[0], a[1], b[0], b[1], H('#a0a0a0'))
    pc.disc(10, 10, 2, H('#e8e8e8'), H('#ffffff'), None, outline=False); pc.put(5 + i * 2, 12, H('#ffffff')); pc.put(15, 5 + i, H('#ffffff'))
def k_shard(pc, i):
    pc.poly([(2, 10), (7, 5), (17, 10), (7, 15)], H('#a8a8b8'), H('#f0f0ff'), H('#68687a')); pc.line(4, 10, 14, 10, H('#ffffff')); pc.put(15, 8 + i % 2, H('#ffffff'))
def k_rock(pc, i):
    a = i * 0.6
    pc.poly(rot([(4, 8), (8, 4), (14, 5), (17, 10), (14, 15), (7, 16), (3, 12)], a), H('#7a7f88'), H('#a8acb4'), H('#4a4f58')); pc.put(9, 9, H('#4a4f58')); pc.put(12, 12, H('#9a9ea8'))

TINT = {'orb', 'star', 'bolt', 'magic', 'wave', 'gel', 'beam', 'bfg', 'spark', 'shard', 'sand', 'candy', 'bloodorb', 'water', 'soul'}
KINDS = {k[2:]: v for k, v in dict(globals()).items() if k.startswith('k_')}

def strip(fn, frames=3):
    out = Image.new('RGBA', (W * frames, W), (0, 0, 0, 0))
    for i in range(frames):
        pc = PC(W, W); fn(pc, i); im = Image.new('RGBA', (W, W), (0, 0, 0, 0)); px = im.load()
        for y in range(W):
            for x in range(W):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        out.alpha_composite(im, (i * W, 0))
    return out.resize((W * frames * 4, W * 4), Image.NEAREST)

# ---------------------------------------------------------------- impact bursts (4 frames, 32x32) + muzzle flash (3 frames, 24x24)
STYLES = {'spark': ('#fff2a0', '#ffc83a', '#c8741a'), 'fire': ('#fff0a0', '#ff8a1a', '#b02a0a'), 'ice': ('#ffffff', '#9be7ff', '#3a8ac8'), 'poison': ('#e8ffc8', '#78d848', '#2a7a1a'),
          'void': ('#e8d0ff', '#9a4aff', '#3a1a7a'), 'blood': ('#ffb0b8', '#d01a38', '#6a0a1a'), 'water': ('#e8faff', '#5ab8f0', '#1a5a98'), 'leaf': ('#e8ffc0', '#78c048', '#2a6a1a'),
          'magic': ('#ffffff', '#d8a0ff', '#7a3ac8'), 'slash': ('#ffffff', '#c8c8d8', '#6a6a7a'), 'dust': ('#f0e6d0', '#c8b898', '#7a6a4a'), 'bone': ('#ffffff', '#e8e2cf', '#a89870')}
def burst_strip(style):
    core, mid, dark = (H(c) for c in STYLES[style]); S = 32; out = Image.new('RGBA', (S * 4, S), (0, 0, 0, 0))
    for k in range(4):
        pc = PC(S, S); r = max(1, 8 - int(k * 2.2)); n = 8 if style != 'slash' else 4
        for q in range(n):
            a = q * 2 * math.pi / n + (0.4 if k % 2 else 0); r0 = 3 + k * 2.2; r1 = 6 + k * 3.6
            x0, y0, x1, y1 = (round(16 + r0 * math.cos(a)), round(16 + r0 * math.sin(a)), round(16 + r1 * math.cos(a)), round(16 + r1 * math.sin(a)))
            pc.line(x0, y0, x1, y1, mid if k < 3 else dark); pc.line(x0 + 1, y0, x1 + 1, y1, mid if k < 3 else dark) if k < 3 else None; pc.line(x0, y0 + 1, x1, y1 + 1, dark) if k < 2 else None
            if k < 3: pc.put(x1, y1, core)
            if q % 2 == 0 and k > 0: pc.put(round(16 + (r1 + 3) * math.cos(a + 0.2)), round(16 + (r1 + 3) * math.sin(a + 0.2)), dark)
        if k < 3: pc.disc(16, 16, r, mid, core, dark, outline=False); pc.disc(16, 16, max(1, r - 3), core, None, None, outline=False)
        im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); px = im.load()
        for y in range(S):
            for x in range(S):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        out.alpha_composite(im, (k * S, 0))
    return out.resize((S * 4 * 4, S * 4), Image.NEAREST)
def muzzle_strip():
    S = 24; out = Image.new('RGBA', (S * 3, S), (0, 0, 0, 0))
    for k in range(3):
        pc = PC(S, S); L = 10 - k * 3
        pc.poly([(6, 12), (6 + L, 8), (10 + L, 12), (6 + L, 16)], H('#cfcfcf'), H('#ffffff'), None, outline=False); pc.poly([(6, 12), (4 + L, 10), (6 + L, 12), (4 + L, 14)], H('#ffffff'), None, None, outline=False)
        for (x, y) in ((8 + L, 5 + k), (8 + L, 19 - k), (3, 12)): pc.put(x, y, H('#ffffff'))
        im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); px = im.load()
        for y in range(S):
            for x in range(S):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        out.alpha_composite(im, (k * S, 0))
    return out.resize((S * 3 * 4, S * 4), Image.NEAREST)
# ---------------------------------------------------------------- lingering ground zones (3 frames, 40x28)
ZONES = {'poison': ('#4aa83a', '#78d848', '#2a6a1a', 'bubble'), 'fire': ('#d8481a', '#ffb02e', '#8a1a0a', 'flame'), 'ice': ('#7ac8f0', '#e8faff', '#3a82b8', 'spike'), 'blood': ('#a8142c', '#e0324a', '#5a0a1a', 'ripple'), 'water': ('#3a9ad8', '#a0e0ff', '#1a5a98', 'ripple'), 'lava': ('#e8541a', '#ffd23f', '#8a2a0a', 'bubble')}
def zone_strip(name):
    base, light, dark = (H(c) for c in ZONES[name][:3]); anim = ZONES[name][3]; Wd, Hh = 40, 28; out = Image.new('RGBA', (Wd * 3, Hh), (0, 0, 0, 0))
    for k in range(3):
        pc = PC(Wd, Hh)
        pc.poly([(3, 14), (7, 7), (16, 4), (26, 4), (35, 8), (38, 15), (33, 22), (22, 25), (11, 24), (5, 20)], base, light, dark)
        pc.poly([(9, 14), (13, 9), (23, 8), (31, 11), (31, 17), (23, 20), (13, 19)], dark, None, None, outline=False)
        if anim == 'bubble':
            for q, (x, y) in enumerate(((12, 14), (20, 11), (27, 16), (17, 18))): rr = (k + q) % 3; pc.disc(x, y - rr, 1 + (rr > 0), light, None, None, outline=False)
        elif anim == 'flame':
            for q, x in enumerate((10, 16, 22, 28)): h = 5 + ((k + q) % 3) * 3; pc.poly([(x - 2, 17), (x, 17 - h), (x + 2, 17)], light, None, None, outline=False); pc.poly([(x - 1, 17), (x, 17 - h + 2), (x + 1, 17)], H('#ffffff'), None, None, outline=False)
        elif anim == 'spike':
            for q, x in enumerate((9, 15, 22, 29)): h = 4 + ((k + q) % 2) * 3; pc.poly([(x - 2, 18), (x, 18 - h), (x + 2, 18)], light, None, None, outline=False)
        else:
            for q in range(2): rr = 4 + ((k + q * 2) % 4) * 3; pc.line(20 - rr, 14, 20 + rr, 14, light) if False else pc.put(20 + rr, 14, light) or pc.put(20 - rr, 14, light)
        im = Image.new('RGBA', (Wd, Hh), (0, 0, 0, 0)); px = im.load()
        for y in range(Hh):
            for x in range(Wd):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        out.alpha_composite(im, (k * Wd, 0))
    return out.resize((Wd * 3 * 4, Hh * 4), Image.NEAREST)
