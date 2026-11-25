# WILLOW TOWN art: tile atlas (16px tiles, x4) + furniture / decor props. Hand-built with the pixel engine (flat colours, outlines, no anti-aliasing).
import json, os
from PIL import Image
from pixel_hand import PC, H, OUT, T as _T
def T3(b, l, d): return (H(b), H(l), H(d))
def hs(a, b, c=0): return ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) & 0xffff
WD = T3('#8a5a30', '#b8844a', '#4e3018'); IRON = T3('#5a5a6a', '#8a8a9c', '#2e2e3a'); GOLD = T3('#e8b43c', '#ffe27a', '#9c6a18'); CLOTH_R = T3('#b02a3a', '#e05a6a', '#6a1420'); CLOTH_B = T3('#2a5ab0', '#5a8ae0', '#142a6a')
WHITE = T3('#f0eee8', '#ffffff', '#b8b4aa'); GREENL = T3('#3e8a2a', '#6ac048', '#245a18'); TRUNK = T3('#6a4426', '#8a5c34', '#3e2814')

# ------------------------------------------------------------------------------------------ tiles
def fillrect(pc, c): pc.rect(0, 0, pc.w - 1, pc.h - 1, c)
def t_grass(v, snow=False):
    pc = PC(16, 16); base, lo, hi = ('#e6eef6', '#c4d4e4', '#ffffff') if snow else ('#5ba83d', '#3f8a2c', '#7cc85a'); fillrect(pc, H(base))
    for k in range(10):
        h = hs(v, k, 7); x, y = h % 15, (h >> 4) % 15; pc.put(x, y, H(lo)); pc.put(x, y - 1 if y else y, H(lo)) if k % 2 else None
    for k in range(5): h = hs(v, k, 11); pc.put(h % 16, (h >> 5) % 16, H(hi))
    if snow:
        for k in range(3): h = hs(v, k, 13); pc.put(h % 15, (h >> 4) % 15, H('#b8c8dc'))
    elif v == 2:
        pc.put(4, 5, H('#fff6c0')); pc.put(11, 11, H('#ffd0e0'))
    return pc
def t_path(mask, snow=False):
    pc = PC(16, 16); base, line, edge = ('#cdd6e2', '#a8b4c6', '#8a98b0') if snow else ('#9a98a4', '#6e6c7c', '#4a4858'); fillrect(pc, H(base))
    for (x0, y0, x1, y1) in ((0, 0, 7, 4), (8, 0, 15, 4), (0, 5, 4, 10), (5, 5, 11, 10), (12, 5, 15, 10), (0, 11, 7, 15), (8, 11, 15, 15)): pc.line(x0, y1 if y1 < 15 else y0, x1, y1 if y1 < 15 else y0, H(line)); pc.line(x1, y0, x1, y1, H(line))
    for k in range(6): h = hs(mask, k, 3); pc.put(h % 15 + 0, (h >> 4) % 15, H('#b0aeba' if not snow else '#e8f0fa'))
    g = H('#3a7a2a' if not snow else '#cfdbe8')
    if not mask & 1: pc.rect(0, 0, 15, 1, g); pc.line(0, 2, 15, 2, H(edge))
    if not mask & 4: pc.rect(0, 14, 15, 15, g); pc.line(0, 13, 15, 13, H(edge))
    if not mask & 8: pc.rect(0, 0, 1, 15, g); pc.line(2, 0, 2, 15, H(edge))
    if not mask & 2: pc.rect(14, 0, 15, 15, g); pc.line(13, 0, 13, 15, H(edge))
    return pc
def t_wall(mask, kind):
    pc = PC(16, 16)
    if kind == 'w': base, hi, lo, ed = '#6e4626', '#966236', '#4a2e16', '#2a190c'
    else: base, hi, lo, ed = '#6c6c7c', '#9696aa', '#4a4a5a', '#26262e'
    fillrect(pc, H(base))
    if kind == 'w':
        for y in (0, 5, 10): pc.line(0, y, 15, y, H(hi)); pc.line(0, y + 3, 15, y + 3, H(lo))
        for x in (3, 9, 14): pc.put(x, 1, H(lo)); pc.put(x - 2, 6, H(lo)); pc.put(x, 11, H(lo))
    else:
        for y in (0, 5, 10): pc.line(0, y, 15, y, H(lo)); [pc.line(x, y, x, y + 4, H(lo)) for x in ((3, 11) if (y // 5) % 2 else (7,))]
        for k in range(8): h = hs(mask, k, 5); pc.put(h % 15, (h >> 4) % 15, H(hi))
    if not mask & 1: pc.line(0, 0, 15, 0, H(ed)); pc.line(0, 1, 15, 1, H(hi))
    if not mask & 4: pc.line(0, 15, 15, 15, H(ed)); pc.line(0, 14, 15, 14, H(lo))
    if not mask & 8: pc.line(0, 0, 0, 15, H(ed))
    if not mask & 2: pc.line(15, 0, 15, 15, H(ed))
    return pc
def t_floor(v):
    pc = PC(16, 16); fillrect(pc, H('#a06a38'))
    for k, y in enumerate((0, 4, 8, 12)):
        c = ('#a46e3a', '#9a6434', '#aa7440', '#96602e')[(k + v) % 4]; pc.rect(0, y, 15, y + 2, H(c)); pc.line(0, y + 3, 15, y + 3, H('#6e4424'))
        pc.line(((k * 5 + v * 7) % 12) + 2, y, ((k * 5 + v * 7) % 12) + 2, y + 2, H('#7a4c28')); pc.put(1, y + 1, H('#4a2e16')); pc.put(14, y + 1, H('#4a2e16'))
    return pc
def t_stone(v):
    pc = PC(16, 16); fillrect(pc, H('#8a8a98'))
    for (x0, y0) in ((0, 0), (8, 8)): pc.rect(x0, y0, x0 + 7, y0 + 7, H('#7e7e8c'))
    pc.line(0, 7, 15, 7, H('#5e5e6c')); pc.line(7, 0, 7, 15, H('#5e5e6c')); pc.line(0, 15, 15, 15, H('#5e5e6c')); pc.line(15, 0, 15, 15, H('#5e5e6c'))
    for k in range(5): h = hs(v, k, 9); pc.put(h % 15, (h >> 4) % 15, H('#a4a4b2'))
    return pc
def t_door():
    pc = t_floor(1); pc.rect(0, 5, 15, 10, H('#6e4424')); pc.rect(0, 6, 15, 9, H('#8a5a30')); pc.line(0, 5, 15, 5, H('#c8a050')); pc.line(0, 10, 15, 10, H('#c8a050')); pc.rect(7, 7, 8, 8, H('#ffe27a')); return pc
def t_water(f):
    pc = PC(16, 16); fillrect(pc, H('#3a7ad8'))
    for k in range(4): h = hs(f, k, 5); x, y = h % 13, (h >> 4) % 15; pc.line(x, y, x + 3, y, H('#7ab4f4')); pc.put(x + 1, y + 1, H('#2a5ab0'))
    if f: pc.put(4, 4, H('#ffffff')); pc.put(11, 9, H('#ffffff'))
    return pc
def t_sand():
    pc = PC(16, 16); fillrect(pc, H('#e4d29a'))
    for k in range(8): h = hs(3, k, 4); pc.put(h % 16, (h >> 4) % 16, H('#c8b478' if k % 2 else '#f4e6b4'))
    return pc
def t_soil():
    pc = PC(16, 16); fillrect(pc, H('#5e3c24'))
    for y in (2, 7, 12): pc.line(0, y, 15, y, H('#3e2616')); pc.line(0, y + 1, 15, y + 1, H('#7a5232'))
    for k in range(5): h = hs(5, k, 6); pc.put(h % 16, (h >> 4) % 16, H('#4a2e1a'))
    return pc
def crop(kind):
    pc = PC(16, 16)
    for x in (3, 8, 13):
        if kind == 'carrot': pc.poly([(x - 2, 8), (x, 2), (x + 2, 8)], H('#4aa83a'), H('#7cd05a'), None, outline=False); pc.rect(x - 1, 8, x, 10, H('#f08a20'))
        elif kind == 'corn': pc.rect(x - 1, 1, x, 12, H('#8ac04a')); pc.rect(x, 5, x + 1, 8, H('#ffd23f')); pc.line(x - 3, 4, x - 1, 7, H('#6aa83a')); pc.line(x + 2, 6, x + 4, 3, H('#6aa83a'))
        elif kind == 'cabbage': pc.disc(x, 8, 3, H('#9ad87a'), H('#c8f0a8'), H('#5aa046'), outline=False); pc.put(x, 8, H('#e8ffd0'))
        else: pc.line(x, 3, x, 13, H('#d8b84a')); pc.line(x - 1, 3, x - 1, 8, H('#f0d060')); pc.line(x + 1, 4, x + 1, 9, H('#c8a63a')); pc.put(x, 2, H('#ffe27a'))
    return pc

# ------------------------------------------------------------------------------------------ props
def P(w, h): return PC(w * 16, h * 16)
def plank_box(pc, x0, y0, x1, y1, pal=WD): pc.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], *pal)
def p_bed(two=False):
    pc = P(2 if two else 1, 2); w = pc.w
    plank_box(pc, 0, 0, w - 1, 31); pc.rect(1, 1, w - 2, 30, H('#6e4424')); pc.rect(1, 1, w - 2, 30, H('#d8d0c0')) if False else None
    pc.poly([(2, 2), (w - 3, 2), (w - 3, 29), (2, 29)], H('#e8e4dc'), H('#ffffff'), H('#b8b4aa'))
    pc.poly([(2, 12), (w - 3, 12), (w - 3, 29), (2, 29)], H('#b02a3a'), H('#e05a6a'), H('#6a1420')); pc.line(3, 16, w - 4, 16, H('#e05a6a'))
    for x in ((3, 19) if two else (3,)): pc.poly([(x, 3), (x + 9, 3), (x + 9, 9), (x, 9)], H('#fffaf0'), H('#ffffff'), H('#c8c4b8'))
    return pc
def p_table(w=2):
    pc = P(w, 1); plank_box(pc, 0, 2, w * 16 - 1, 13); pc.line(1, 4, w * 16 - 2, 4, WD[1]); pc.rect(w * 8 - 3, 5, w * 8 + 2, 11, H('#b02a3a')); pc.put(w * 8, 7, H('#ffe27a')); pc.rect(3, 14, 4, 15, WD[2]); pc.rect(w * 16 - 5, 14, w * 16 - 4, 15, WD[2]); return pc
def p_table_round():
    pc = P(2, 2); pc.disc(16, 16, 12, WD[0], WD[1], WD[2]); pc.disc(16, 16, 8, H('#e8e0d0'), None, None, outline=False); pc.disc(16, 16, 3, H('#ffe27a'), H('#ffffff'), H('#c8841a'), outline=False)
    for (x, y) in ((8, 9), (24, 9), (9, 23), (23, 23)): pc.disc(x, y, 2, H('#ffffff'), None, H('#b8b4aa'), outline=False)
    return pc
def p_chair(): pc = P(1, 1); plank_box(pc, 3, 3, 12, 11); pc.poly([(3, 11), (12, 11), (12, 14), (3, 14)], WD[2], WD[0], None); return pc
def p_stool(): pc = P(1, 1); pc.disc(8, 8, 5, WD[0], WD[1], WD[2]); return pc
def p_bookshelf():
    pc = P(2, 1); plank_box(pc, 0, 0, 31, 15, T3('#6e4424', '#8a5a30', '#3a2210'))
    cols = ['#b02a3a', '#2a5ab0', '#3e8a2a', '#e8b43c', '#7a3aa8', '#d8d0c0']
    for r, y in enumerate((2, 9)):
        x = 2
        for k in range(9): w_ = 2 + (k % 2); pc.rect(x, y, x + w_ - 1, y + 4, H(cols[(k + r * 2) % 6])); pc.line(x, y, x + w_ - 1, y, H('#ffffff')) if k % 3 == 0 else None; x += w_ + 1
        pc.line(1, y + 5, 30, y + 5, H('#3a2210'))
    return pc
def p_stove():
    pc = P(2, 1); plank_box(pc, 0, 1, 31, 15, IRON); pc.rect(4, 6, 12, 12, H('#1a1218')); pc.rect(5, 8, 11, 12, H('#ff8a1a')); pc.rect(7, 9, 9, 12, H('#ffe27a')); pc.rect(18, 3, 28, 6, IRON[2]); pc.disc(23, 4, 1, H('#ff8a1a'), None, None, outline=False); pc.rect(24, 9, 28, 12, IRON[1]); return pc
def p_counter():
    pc = P(3, 1); plank_box(pc, 0, 2, 47, 15); pc.rect(1, 3, 46, 6, H('#c8b898')); pc.line(1, 3, 46, 3, H('#f0e6cc')); pc.line(1, 7, 46, 7, WD[2])
    for x in (6, 22, 36): pc.disc(x, 5, 1, H('#ffe27a'), None, None, outline=False)
    pc.poly([(30, 1), (40, 1), (40, 3), (30, 3)], H('#b02a3a'), None, None, outline=False); return pc
def p_potion_shelf():
    pc = P(2, 1); plank_box(pc, 0, 1, 31, 15, T3('#5a3a60', '#7a5a84', '#32203a'))
    cols = ['#e03a4a', '#3ac060', '#4a8aff', '#ffd23f', '#b04aff', '#ff8a2a']
    for r, y in enumerate((2, 9)):
        for k in range(6): x = 3 + k * 5; c = H(cols[(k + r * 2) % 6]); pc.rect(x, y + 1, x + 2, y + 4, c); pc.put(x + 1, y, H('#c8c0b0')); pc.put(x, y + 1, H('#ffffff'))
    return pc
def p_crate(): pc = P(1, 1); plank_box(pc, 1, 1, 14, 14); pc.line(1, 1, 14, 14, WD[2]); pc.line(14, 1, 1, 14, WD[2]); return pc
def p_barrel(): pc = P(1, 1); pc.disc(8, 8, 6, WD[0], WD[1], WD[2]); pc.disc(8, 8, 4, H('#6a4426'), None, None, outline=False); pc.line(2, 8, 14, 8, IRON[1]); pc.line(8, 2, 8, 14, IRON[1]); return pc
def p_chest(): pc = P(1, 1); plank_box(pc, 1, 3, 14, 13); pc.rect(1, 7, 14, 8, GOLD[0]); pc.rect(7, 6, 8, 10, GOLD[1]); pc.line(1, 3, 14, 3, WD[1]); return pc
def p_rug(c):
    pc = P(3, 2); a, b = (('#8a1428', '#c02a44'), ('#1a4a8a', '#2a6ac0'))[c]; pc.rect(1, 1, 46, 30, H(a)); pc.rect(3, 3, 44, 28, H(b)); pc.rect(6, 6, 41, 25, H(a))
    for x in range(1, 47, 3): pc.put(x, 0, H('#ffe27a')); pc.put(x, 31, H('#ffe27a'))
    pc.poly([(24, 8), (33, 16), (24, 24), (15, 16)], H('#ffe27a'), H('#fff6c0'), H('#c8841a')); pc.poly([(24, 12), (28, 16), (24, 20), (20, 16)], H(b), None, None, outline=False); return pc
def p_plant(): pc = P(1, 1); pc.poly([(4, 10), (12, 10), (11, 15), (5, 15)], H('#b0583a'), H('#d8785a'), H('#6a3020')); [pc.poly([(8, 10), (8 + dx, 2 + dy), (8 + dx // 2, 10)], *GREENL, outline=False) for dx, dy in ((-5, 2), (5, 1), (0, -1))]; return pc
def p_anvil(): pc = P(1, 1); pc.poly([(2, 5), (14, 5), (12, 8), (10, 9), (11, 13), (5, 13), (6, 9), (4, 8)], *IRON); pc.line(2, 5, 14, 5, IRON[1]); return pc
def p_forge():
    pc = P(2, 2); plank_box(pc, 1, 1, 30, 30, T3('#6a6a7a', '#9a9aac', '#3a3a48')); pc.rect(5, 5, 26, 20, H('#1a1218')); pc.poly([(7, 18), (10, 10), (13, 16), (16, 8), (19, 16), (22, 11), (24, 18)], H('#ff6a1a'), H('#ffd23f'), None, outline=False); pc.rect(10, 15, 21, 18, H('#fff0a0')); pc.rect(8, 22, 23, 28, IRON[0]); pc.line(8, 22, 23, 22, IRON[1]); return pc
def p_cauldron(): pc = P(1, 1); pc.disc(8, 8, 6, IRON[0], IRON[1], IRON[2]); pc.disc(8, 8, 4, H('#5adc4a'), H('#a8ff90'), H('#2a8a2a'), outline=False); pc.put(6, 6, H('#e8ffd0')); pc.put(10, 9, H('#e8ffd0')); return pc
def p_workbench(): pc = P(2, 1); plank_box(pc, 0, 2, 31, 14); pc.line(1, 4, 30, 4, WD[1]); pc.rect(4, 5, 12, 6, IRON[1]); pc.poly([(18, 5), (27, 5), (27, 11), (18, 11)], H('#c8a870'), None, WD[2]); pc.line(20, 7, 25, 7, WD[2]); return pc
def p_wardrobe(): pc = P(1, 1); plank_box(pc, 1, 1, 14, 14, T3('#7a5a3a', '#a07a54', '#463018')); pc.line(8, 2, 8, 13, WD[2]); pc.put(6, 8, H('#ffe27a')); pc.put(10, 8, H('#ffe27a')); return pc
def p_medcab(): pc = P(1, 1); plank_box(pc, 1, 1, 14, 14, WHITE); pc.rect(7, 4, 8, 11, H('#d02a3a')); pc.rect(4, 7, 11, 8, H('#d02a3a')); return pc
def p_lectern(): pc = P(1, 1); plank_box(pc, 2, 4, 13, 14); pc.poly([(3, 3), (12, 3), (13, 8), (2, 8)], H('#f0e6cc'), H('#ffffff'), H('#b8a888')); pc.line(4, 5, 11, 5, H('#8a7a58')); return pc
def p_hay(): pc = P(1, 1); pc.poly([(1, 3), (14, 3), (14, 13), (1, 13)], H('#e0c050'), H('#f8e070'), H('#a88a28')); [pc.line(2, y, 13, y, H('#b8982e')) for y in (6, 9)]; return pc
def p_trough(): pc = P(2, 1); plank_box(pc, 0, 3, 31, 13); pc.rect(2, 5, 29, 10, H('#3a7ad8')); pc.line(3, 6, 8, 6, H('#9ad0ff')); return pc
def p_bench(): pc = P(2, 1); plank_box(pc, 1, 4, 30, 11); pc.line(2, 5, 29, 5, WD[1]); pc.rect(3, 12, 4, 14, WD[2]); pc.rect(27, 12, 28, 14, WD[2]); return pc
def p_stage():
    pc = P(5, 2); plank_box(pc, 0, 6, 79, 31, T3('#9a6a3a', '#c8904e', '#5a3a1c')); pc.poly([(2, 0), (77, 0), (77, 8), (2, 8)], *CLOTH_R); [pc.line(x, 0, x, 8, H('#6a1420')) for x in range(6, 76, 8)]
    for x in range(6, 76, 10): pc.line(x, 9, x, 30, H('#7a4e28'))
    pc.rect(34, 12, 45, 24, H('#d8c8a0')); pc.rect(37, 14, 42, 22, H('#ffe27a')); return pc
def p_sack(): pc = P(1, 1); pc.poly([(3, 6), (12, 6), (13, 14), (2, 14)], H('#c8a870'), H('#e8c890'), H('#8a6a3a')); pc.poly([(5, 3), (10, 3), (11, 6), (4, 6)], H('#c8a870'), None, H('#8a6a3a')); return pc
def p_lantern(): pc = P(1, 1); pc.rect(6, 4, 9, 12, IRON[0]); pc.rect(7, 6, 8, 10, H('#ffe27a')); pc.rect(5, 3, 10, 4, IRON[1]); return pc
def p_clock(): pc = P(1, 1); plank_box(pc, 3, 1, 12, 15, T3('#6a4426', '#8a5c34', '#3a2210')); pc.disc(8, 6, 3, H('#f0e6cc'), None, None, outline=False); pc.line(8, 6, 8, 4, H('#2a1a0e')); pc.line(8, 6, 10, 6, H('#2a1a0e')); pc.rect(7, 10, 8, 13, GOLD[0]); return pc
def p_fence(h):
    pc = P(1, 1)
    if h: pc.rect(0, 6, 15, 8, WD[0]); pc.line(0, 6, 15, 6, WD[1]); pc.line(0, 8, 15, 8, WD[2]); pc.rect(0, 3, 1, 12, WD[0]); pc.rect(14, 3, 15, 12, WD[0]); pc.line(0, 3, 15 if False else 1, 3, WD[1])
    else: pc.rect(6, 0, 8, 15, WD[0]); pc.line(6, 0, 6, 15, WD[1]); pc.line(8, 0, 8, 15, WD[2]); pc.rect(4, 0, 10, 1, WD[0]); pc.rect(4, 14, 10, 15, WD[0])
    return pc
def p_gate(): pc = P(1, 1); pc.rect(0, 5, 15, 7, WD[1]); pc.rect(0, 10, 15, 12, WD[1]); pc.line(2, 5, 13, 12, WD[2]); return pc
def p_bush(): pc = P(1, 1); [pc.disc(x, y, r, *GREENL, outline=False) for x, y, r in ((5, 9, 4), (10, 9, 4), (8, 6, 4))]; pc.put(6, 6, H('#9aff7a')); return pc
def p_flower(c):
    pc = P(1, 1); col, mid = {'y': ('#ffd23f', '#fff6a0'), 'r': ('#e0455a', '#ff9aaa'), 'b': ('#4a8aff', '#a0c8ff')}[c]
    for (x, y) in ((4, 5), (10, 4), (7, 10), (12, 11), (3, 12)): pc.line(x, y + 1, x, y + 4, H('#3e8a2a')); pc.rect(x - 1, y - 1, x + 1, y + 1, H(col)); pc.put(x, y, H(mid))
    return pc
def p_mailbox(): pc = P(1, 1); pc.rect(7, 9, 8, 15, WD[2]); pc.poly([(3, 3), (13, 3), (13, 10), (3, 10)], H('#2a5ab0'), H('#5a8ae0'), H('#142a6a')); pc.rect(5, 5, 11, 6, H('#0a1a50')); pc.rect(12, 1, 13, 4, H('#d02a3a')); return pc
def p_sign(): pc = P(1, 1); pc.rect(7, 6, 8, 15, WD[2]); plank_box(pc, 2, 1, 13, 8); pc.line(4, 3, 11, 3, WD[2]); pc.line(4, 5, 9, 5, WD[2]); return pc
def p_lamp():
    pc = P(1, 2); pc.rect(7, 12, 8, 30, IRON[0]); pc.rect(5, 28, 10, 30, IRON[1]); pc.rect(5, 3, 10, 11, IRON[2]); pc.rect(6, 4, 9, 10, H('#ffe27a')); pc.rect(7, 5, 8, 8, H('#ffffff')); pc.poly([(4, 3), (11, 3), (8, 0)], *IRON); pc.rect(5, 11, 10, 12, IRON[1]); return pc
def p_tree(snow=False):
    pc = P(2, 3); pc.rect(13, 30, 18, 47, TRUNK[0]); pc.line(13, 30, 13, 47, TRUNK[1]); pc.line(18, 30, 18, 47, TRUNK[2]); pc.rect(10, 44, 21, 47, TRUNK[2])
    for (x, y, r) in ((9, 22, 9), (23, 22, 9), (16, 14, 11), (11, 15, 8), (21, 15, 8), (16, 24, 8)): pc.disc(x, y, r, *GREENL)
    for (x, y) in ((10, 10), (18, 8), (22, 16), (8, 20), (15, 22)): pc.put(x, y, H('#9aff7a')); pc.put(x + 1, y, H('#6ac048'))
    if snow:
        for (x, y, r) in ((12, 7, 4), (20, 8, 4), (16, 5, 4), (8, 14, 3), (24, 14, 3)): pc.disc(x, y, r, H('#f4f8ff'), H('#ffffff'), H('#b8c8dc'), outline=False)
    return pc
def p_pine(snow=False):
    pc = P(2, 3); pc.rect(14, 38, 17, 47, TRUNK[0]); pc.line(14, 38, 14, 47, TRUNK[1])
    for k, (y0, w) in enumerate(((36, 13), (26, 11), (16, 9), (6, 6))): pc.poly([(16 - w, y0), (16, y0 - 12), (16 + w, y0)], H('#2a6a3a'), H('#4a9a58'), H('#16401e'))
    if snow:
        for (y0, w) in ((36, 13), (26, 11), (16, 9), (6, 6)): pc.poly([(16 - w + 3, y0 - 2), (16, y0 - 12), (16 + w - 3, y0 - 2), (16, y0 - 5)], H('#f4f8ff'), None, None, outline=False)
    return pc
def p_sunflower(): pc = P(1, 2); pc.rect(7, 12, 8, 31, H('#3e8a2a')); pc.poly([(8, 20), (13, 17), (9, 24)], *GREENL, outline=False); pc.disc(8, 8, 6, H('#ffd23f'), H('#fff0a0'), H('#c8961a')); pc.disc(8, 8, 3, H('#6a4426'), None, None, outline=False); return pc
def p_cow():
    pc = P(2, 1); pc.poly([(3, 4), (23, 4), (24, 12), (4, 12)], H('#f6f2ec'), H('#ffffff'), H('#c0b8ae')); pc.poly([(6, 5), (12, 5), (13, 10), (6, 10)], H('#2a2428'), None, None, outline=False); pc.poly([(16, 6), (22, 6), (22, 11), (15, 11)], H('#2a2428'), None, None, outline=False)
    pc.poly([(23, 3), (30, 4), (30, 10), (23, 11)], H('#f6f2ec'), H('#ffffff'), H('#c0b8ae')); pc.rect(28, 7, 30, 10, H('#ffb0b8')); pc.put(26, 5, H('#15101a')); pc.rect(24, 2, 25, 3, H('#e8e0c8'))
    for x in (6, 10, 18, 21): pc.rect(x, 12, x + 1, 14, H('#e8e2da')); pc.put(x, 14, H('#2a2428')); pc.put(x + 1, 14, H('#2a2428'))
    pc.line(3, 5, 1, 9, H('#2a2428')); return pc
def p_sheep(): pc = P(1, 1); [pc.disc(x, y, 3, H('#f4f4f4'), H('#ffffff'), H('#c8c8c8'), outline=False) for x, y in ((5, 8), (8, 6), (11, 8), (8, 10))]; pc.poly([(11, 6), (15, 7), (14, 11), (11, 10)], H('#4a4048'), None, None); pc.put(13, 8, H('#ffffff')); pc.rect(5, 12, 5, 14, H('#4a4048')); pc.rect(10, 12, 10, 14, H('#4a4048')); return pc
def p_pig(): pc = P(1, 1); pc.poly([(2, 5), (12, 5), (13, 11), (3, 11)], H('#f8a8b0'), H('#ffd0d4'), H('#c8707c')); pc.poly([(11, 4), (15, 5), (15, 10), (11, 10)], H('#f8a8b0'), None, H('#c8707c')); pc.rect(14, 7, 15, 9, H('#e08088')); pc.put(12, 5, H('#15101a')); pc.rect(4, 11, 4, 13, H('#e08088')); pc.rect(10, 11, 10, 13, H('#e08088')); pc.put(2, 6, H('#e08088')); return pc
def p_chicken(): pc = P(1, 1); pc.poly([(3, 6), (11, 6), (12, 12), (4, 12)], H('#f6f2ec'), H('#ffffff'), H('#c0b8ae')); pc.disc(11, 5, 2, H('#f6f2ec'), None, H('#c0b8ae'), outline=False); pc.rect(11, 2, 12, 3, H('#d8202e')); pc.rect(13, 5, 14, 5, H('#f0a02a')); pc.put(11, 5, H('#15101a')); pc.rect(6, 12, 6, 14, H('#e89a2a')); pc.rect(9, 12, 9, 14, H('#e89a2a')); return pc
def p_fountain():
    pc = P(4, 4); pc.disc(32, 32, 28, H('#8a8a98'), H('#b8b8c8'), H('#4a4a58')); pc.disc(32, 32, 23, H('#4a8ae0'), H('#8ac8ff'), H('#2a5ab0'), outline=False); pc.disc(32, 32, 7, H('#9a9aa8'), H('#c8c8d8'), H('#5a5a68'))
    pc.rect(30, 14, 33, 30, H('#b8d8ff')); pc.disc(32, 13, 3, H('#e8f4ff'), None, None, outline=False)
    for (x, y) in ((24, 20), (40, 22), (20, 36), (44, 38), (30, 46)): pc.line(x, y, x + 3, y, H('#9ad0ff'))
    for a in range(0, 360, 45):
        import math as _m; pc.put(round(32 + 26 * _m.cos(_m.radians(a))), round(32 + 26 * _m.sin(_m.radians(a))), H('#d8d8e8'))
    return pc
def p_well(): pc = P(2, 2); pc.disc(16, 18, 12, H('#8a8a98'), H('#b8b8c8'), H('#4a4a58')); pc.disc(16, 18, 8, H('#1a2a4a'), None, None, outline=False); pc.rect(4, 4, 6, 20, WD[0]); pc.rect(25, 4, 27, 20, WD[0]); pc.poly([(2, 4), (16, -2), (30, 4), (30, 7), (2, 7)], *CLOTH_R); pc.line(16, 6, 16, 14, H('#c8a870')); pc.rect(14, 14, 18, 17, WD[0]); return pc
def p_stall(c=0):
    pc = P(2, 3); col = (CLOTH_R, CLOTH_B)[c % 2]
    pc.rect(3, 18, 28, 46, WD[2]); pc.poly([(2, 30), (29, 30), (29, 40), (2, 40)], *WD); pc.poly([(1, 36), (30, 36), (30, 46), (1, 46)], H('#c8b898'), H('#f0e6cc'), H('#8a7a58'))
    for x in range(1, 30, 6): pc.poly([(x, 4), (x + 6, 4), (x + 6, 20), (x, 20)], *col) if (x // 6) % 2 == 0 else pc.poly([(x, 4), (x + 6, 4), (x + 6, 20), (x, 20)], *WHITE)
    for x in range(2, 30, 4): pc.poly([(x, 20), (x + 4, 20), (x + 2, 24)], *col)
    for (x, y, cc) in ((6, 38, '#e0455a'), (11, 39, '#ffd23f'), (16, 38, '#5adc4a'), (21, 39, '#ff8a2a'), (25, 38, '#4a8aff')): pc.disc(x, y, 2, H(cc), H('#ffffff'), None, outline=False)
    return pc
def p_market_board():
    pc = P(2, 2); pc.rect(3, 12, 5, 30, WD[2]); pc.rect(26, 12, 28, 30, WD[2]); plank_box(pc, 2, 2, 29, 20, T3('#c8a870', '#e8c890', '#7a5a30'))
    for (x, y, w_, h_, c) in ((5, 4, 8, 6, '#f4ecd0'), (15, 5, 9, 7, '#f4ecd0'), (6, 12, 7, 6, '#ffe9a8'), (16, 13, 9, 5, '#f4ecd0')): pc.rect(x, y, x + w_, y + h_, H(c)); pc.put(x + w_ // 2, y, H('#d02a3a'))
    pc.rect(12, 22, 19, 29, GOLD[0]); pc.line(12, 22, 19, 22, GOLD[1]); return pc
def p_xtree():
    pc = P(2, 3); pc.rect(13, 40, 18, 47, TRUNK[0]); pc.rect(11, 44, 20, 47, H('#b02a3a')); pc.rect(11, 44, 20, 44, H('#e05a6a'))
    for (y0, w) in ((42, 14), (32, 12), (22, 10), (12, 8)): pc.poly([(16 - w, y0), (16, y0 - 14), (16 + w, y0)], H('#1f6a34'), H('#3a9a52'), H('#103e1e'))
    pc.line(6, 38, 26, 34, H('#ffd23f')); pc.line(8, 28, 24, 24, H('#ffd23f')); pc.line(10, 18, 22, 15, H('#ffd23f'))                       # tinsel garlands
    import math as _m; pc.poly([(16, 0), (18, 4), (22, 4), (19, 7), (20, 11), (16, 8), (12, 11), (13, 7), (10, 4), (14, 4)], H('#ffd23f'), H('#fff6a0'), H('#c8841a'))   # star
    for k, (x, y, cc) in enumerate(((10, 38, '#e0245e'), (20, 40, '#4a8aff'), (15, 33, '#ffd23f'), (23, 33, '#e0245e'), (9, 30, '#4a8aff'), (17, 26, '#e0245e'), (12, 22, '#ffd23f'), (21, 21, '#4aff9a'), (16, 16, '#e0245e'), (13, 28, '#ffffff'), (19, 36, '#ff8a2a'))):
        pc.disc(x, y, 2, H(cc), H('#ffffff'), H('#40101a'), outline=False); pc.put(x, y - 1, H('#ffffff'))
    return pc
def p_present(): pc = P(1, 1); c = ((('#d8203a', '#ff6a7a', '#8a1020')), ('#2a7ad8', '#6aaaff', '#144a8a'))[0]; pc.poly([(3, 6), (12, 6), (12, 14), (3, 14)], H(c[0]), H(c[1]), H(c[2])); pc.line(7, 6, 7, 14, H('#ffd23f')); pc.line(3, 10, 12, 10, H('#ffd23f')); pc.poly([(4, 3), (7, 6), (10, 3), (7, 5)], H('#ffd23f'), None, None); return pc
def p_present2(): pc = P(1, 1); pc.poly([(2, 7), (13, 7), (13, 14), (2, 14)], H('#2a9a5a'), H('#5adc8a'), H('#145a30')); pc.line(8, 7, 8, 14, H('#ffffff')); pc.line(2, 11, 13, 11, H('#ffffff')); pc.disc(8, 5, 2, H('#ffffff'), None, None, outline=False); return pc
def p_wreath(): pc = P(1, 1); pc.disc(8, 8, 6, *GREENL); pc.disc(8, 8, 3, H('#00000000') if False else H('#8a5a30'), None, None, outline=False); [pc.put(x, y, H('#e0245e')) for x, y in ((4, 6), (11, 5), (6, 12), (12, 11))]; pc.poly([(6, 12), (10, 12), (11, 15), (5, 15)], H('#d8203a'), None, None, outline=False); return pc
def p_pumpkin(): pc = P(1, 1); pc.disc(8, 9, 5, H('#e8801c'), H('#ffb14a'), H('#a8500e')); pc.rect(7, 3, 8, 5, H('#2a7a2a')); pc.put(6, 8, H('#ffe14a')); pc.put(10, 8, H('#ffe14a')); pc.line(6, 11, 10, 11, H('#ffe14a')); return pc
def p_cobweb(): pc = P(1, 1); [pc.line(0, 0, x, y, H('#e8e8f0')) for x, y in ((15, 0), (12, 8), (8, 12), (0, 15))]; pc.line(5, 0, 0, 5, H('#e8e8f0')); pc.line(10, 0, 0, 10, H('#e8e8f0')); return pc
def p_scarecrow(): pc = P(1, 2); pc.rect(7, 6, 8, 30, WD[0]); pc.rect(1, 12, 14, 13, WD[0]); pc.poly([(4, 13), (11, 13), (12, 24), (3, 24)], H('#8a6a3a'), None, H('#5a4020')); pc.disc(8, 6, 4, H('#e8d088'), None, H('#a88a40')); pc.poly([(3, 4), (13, 4), (11, 0), (5, 0)], H('#4a3a20'), None, None); pc.put(6, 6, H('#15101a')); pc.put(10, 6, H('#15101a')); return pc
def p_haycart(): pc = P(2, 2); plank_box(pc, 2, 8, 29, 26); pc.poly([(3, 4), (28, 4), (26, 14), (5, 14)], H('#e0c050'), H('#f8e070'), H('#a88a28')); pc.disc(6, 27, 4, WD[0], WD[1], WD[2]); pc.disc(25, 27, 4, WD[0], WD[1], WD[2]); return pc

PROPS = {
 'bed': p_bed, 'bed2': lambda: p_bed(True), 'table': p_table, 'table_round': p_table_round, 'chair': p_chair, 'stool': p_stool, 'bookshelf': p_bookshelf, 'stove': p_stove, 'counter': p_counter, 'potion_shelf': p_potion_shelf,
 'crate': p_crate, 'barrel': p_barrel, 'chest': p_chest, 'rug_red': lambda: p_rug(0), 'rug_blue': lambda: p_rug(1), 'plant': p_plant, 'anvil': p_anvil, 'forge': p_forge, 'cauldron': p_cauldron, 'workbench': p_workbench,
 'wardrobe': p_wardrobe, 'medcab': p_medcab, 'lectern': p_lectern, 'hay': p_hay, 'trough': p_trough, 'bench': p_bench, 'stage': p_stage, 'sack': p_sack, 'lantern': p_lantern, 'clock': p_clock, 'fence_h': lambda: p_fence(True), 'fence_v': lambda: p_fence(False),
 'gate_h': p_gate, 'bush': p_bush, 'fl_y': lambda: p_flower('y'), 'fl_r': lambda: p_flower('r'), 'fl_b': lambda: p_flower('b'), 'mailbox': p_mailbox, 'sign': p_sign, 'lamp': p_lamp, 'tree': p_tree, 'tree_snow': lambda: p_tree(True), 'pine': p_pine, 'pine_snow': lambda: p_pine(True),
 'sunflower': p_sunflower, 'cow': p_cow, 'sheep': p_sheep, 'pig': p_pig, 'chicken': p_chicken, 'fountain': p_fountain, 'well': p_well, 'stall': p_stall, 'market_board': p_market_board, 'xtree': p_xtree, 'present': p_present, 'present2': p_present2,
 'wreath': p_wreath, 'pumpkin': p_pumpkin, 'cobweb': p_cobweb, 'scarecrow': p_scarecrow, 'haycart': p_haycart,
}
def build_all(out_dir):
    os.makedirs(os.path.join(out_dir, 'town'), exist_ok=True); cells = []
    for v in range(3): cells.append((f'grass{v}', t_grass(v))); cells.append((f'snow{v}', t_grass(v, True)))
    for m in range(16): cells.append((f'path{m}', t_path(m))); cells.append((f'pathsnow{m}', t_path(m, True)))
    for m in range(16): cells.append((f'wallw{m}', t_wall(m, 'w'))); cells.append((f'wallx{m}', t_wall(m, 'x')))
    for v in range(2): cells.append((f'floor{v}', t_floor(v)))
    cells += [('stone0', t_stone(0)), ('stone1', t_stone(1)), ('door', t_door()), ('water0', t_water(0)), ('water1', t_water(1)), ('sand', t_sand()), ('soil', t_soil())]
    for k in ('carrot', 'corn', 'cabbage', 'wheat'): cells.append(('crop_' + k, crop(k)))
    cols = 16; rows = (len(cells) + cols - 1) // cols; atlas = Image.new('RGBA', (cols * 16, rows * 16), (0, 0, 0, 0)); idx = {}
    for i, (nm, pc) in enumerate(cells):
        im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); px = im.load()
        for y in range(16):
            for x in range(16):
                if pc.p[y][x]: px[x, y] = pc.p[y][x]
        atlas.alpha_composite(im, ((i % cols) * 16, (i // cols) * 16)); idx[nm] = [i % cols, i // cols]
    atlas.resize((atlas.width * 4, atlas.height * 4), Image.NEAREST).save(os.path.join(out_dir, 'town', 'tiles.png'))
    json.dump({'cell': 64, 'idx': idx}, open(os.path.join(out_dir, 'town', 'tiles.json'), 'w'))
    for nm, fn in PROPS.items(): fn().save(os.path.join(out_dir, 'town', 'p_' + nm + '.png'), 4)
    return len(cells) + len(PROPS)
