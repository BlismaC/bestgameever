from sprite_lib import *
import math
C = lambda h, a=255: hexc(h, a)
BASE = 236  # ground line for node sprites

def shadow_under(c, cx, w):
    c.soft(lambda d: d.ellipse([(cx - w) * SS, (BASE - 8) * SS, (cx + w) * SS, (BASE + 10) * SS], fill=(0, 0, 0, 90)), 4)

def tree(c, leaf='#2f8a38', trunk='#6b4423'):
    shadow_under(c, 128, 60)
    c.poly([(116, 150), (112, BASE), (144, BASE), (140, 150)], C(trunk))
    c.line([(122, 160), (122, 230)], dark(C(trunk), .3), 3)
    for (x, y, r) in [(84, 132, 44), (172, 132, 44), (128, 96, 56), (100, 80, 38), (156, 78, 38), (128, 142, 46)]:
        c.blob(x, y, r, r * .94, C(leaf))
    for (x, y, r) in [(104, 78, 18), (150, 108, 14), (82, 122, 12), (168, 130, 10)]: c.circ(x, y, r, lite(C(leaf), .3), None, 0)

def pine(c):
    shadow_under(c, 128, 50)
    c.poly([(118, 170), (116, BASE), (140, BASE), (138, 170)], C('#5a3b20'))
    for i, (y, w) in enumerate([(182, 78), (146, 66), (110, 54), (76, 42), (46, 30)]):
        c.poly([(128 - w, y), (128, y - 52), (128 + w, y)], lite(C('#1f6b4a'), .08 * i))
    for (x, y) in [(110, 160), (150, 130), (120, 100), (140, 70)]: c.line([(x, y), (x + 10, y + 6)], lite(C('#1f6b4a'), .35), 3)

def dead_tree(c):
    shadow_under(c, 128, 40)
    br = C('#6a5a48')
    c.poly([(116, 110), (110, BASE), (146, BASE), (140, 110)], br)
    for pts in [[(124, 120), (84, 80), (60, 40)], [(134, 110), (176, 70), (196, 36)], [(120, 150), (76, 140), (50, 150)], [(138, 140), (184, 130), (206, 112)], [(84, 80), (96, 52)], [(176, 70), (160, 44)]]:
        c.outlined_line(pts, br, 9)
    c.line([(122, 130), (122, 220)], dark(br, .35), 3)

def rock(c, base='#8a8f98', hi='#b6bbc4'):
    shadow_under(c, 128, 74)
    c.poly([(54, BASE - 4), (50, 170), (82, 110), (140, 90), (190, 120), (206, 178), (200, BASE - 4)], C(base))
    c.poly([(82, 110), (140, 90), (190, 120), (150, 130), (110, 138)], lite(C(base), .32), None)
    c.poly([(150, 130), (190, 120), (206, 178), (200, BASE - 4), (160, BASE - 4)], dark(C(base), .22), None)
    for pts in [[(100, 150), (120, 190)], [(150, 160), (140, 200)]]: c.line(pts, dark(C(base), .4), 3)

def ore(c, gem, base='#7d828c'):
    rock(c, base)
    for (x, y, s) in [(96, 156, 22), (150, 140, 26), (168, 196, 18), (112, 204, 16), (128, 170, 14)]:
        g = C(gem)
        c.poly([(x, y - s), (x + s * .7, y - s * .1), (x + s * .4, y + s * .8), (x - s * .5, y + s * .7), (x - s * .8, y - s * .1)], g, OUTLINE, 2)
        c.poly([(x, y - s), (x + s * .7, y - s * .1), (x, y + s * .1)], lite(g, .45), None)
        c.line([(x - s * .5, y - s * .1), (x - s * .1, y + s * .5)], (255, 255, 255, 140), 2)

def crystal(c, col, hi):
    shadow_under(c, 128, 60)
    for (x, y, h, w, k) in [(86, BASE, 120, 28, 0), (170, BASE, 100, 26, 1), (128, BASE, 168, 40, 2), (150, BASE, 70, 20, 3)]:
        g = C(col); lg = C(hi)
        c.poly([(x - w, y), (x - w * .6, y - h * .8), (x, y - h), (x + w * .6, y - h * .8), (x + w, y)], g)
        c.poly([(x, y - h), (x + w * .6, y - h * .8), (x + w, y), (x, y)], dark(g, .18), None)
        c.poly([(x - w * .6, y - h * .8), (x, y - h), (x - 2, y)], lg, None)

def cactus(c):
    shadow_under(c, 128, 44)
    g = C('#3f9a4a')
    c.outlined_line([(128, BASE), (128, 70)], g, 40)
    c.outlined_line([(128, 160), (80, 160), (80, 110)], g, 24); c.outlined_line([(128, 130), (176, 130), (176, 90)], g, 24)
    for x in (116, 128, 140): c.line([(x, 80), (x, BASE - 10)], dark(g, .22), 3)
    for (x, y) in [(110, 100), (146, 120), (112, 180), (146, 190), (80, 130), (176, 110)]: c.line([(x, y), (x + 5, y - 5)], C('#f5f0d0'), 3)
    c.circ(128, 62, 8, C('#ff6a9a'), OUTLINE, 2)

def bush(c):
    shadow_under(c, 128, 70)
    for (x, y, r) in [(84, 180, 48), (172, 180, 48), (128, 150, 60), (128, 200, 48)]: c.blob(x, y, r, r * .85, C('#3f8f3a'))
    for (x, y) in [(96, 160), (150, 140), (128, 188), (176, 176), (80, 196), (112, 130)]: c.circ(x, y, 9, C('#d8344f'), OUTLINE, 2); c.circ(x - 2, y - 2, 3, (255, 255, 255, 200), None, 0)

def sword_stone(c):
    rock(c, '#9aa0ab')
    c.poly([(122, 30), (134, 30), (136, 150), (120, 150)], C('#e8e8f0'))
    c.line([(128, 34), (128, 140)], (255, 255, 255, 220), 2)
    c.poly([(92, 150), (164, 150), (160, 160), (96, 160)], C('#ffe27a'))
    c.line([(128, 160), (128, 184)], C('#8a5a30'), 10); c.circ(128, 188, 8, C('#ffe27a'), OUTLINE, 2)
    c.glow(128, 90, 60, (255, 240, 160, 70))

NODES = {
    'tree': lambda c: tree(c), 'pine': pine, 'dead_tree': dead_tree, 'rock': rock,
    'obsidian_rock': lambda c: crystal(c, '#3a2a5a', '#7a5ac0'), 'ice_crystal': lambda c: crystal(c, '#9be7ff', '#e6fbff'),
    'cactus': cactus, 'berry_bush': bush, 'stone_with_sword': sword_stone,
    'copper_ore': lambda c: ore(c, '#d8843a'), 'iron_ore': lambda c: ore(c, '#c79a7c'), 'silver_ore': lambda c: ore(c, '#eef3fa'),
    'gold_ore': lambda c: ore(c, '#ffd23f'), 'jade_ore': lambda c: ore(c, '#38b36f'), 'ruby_ore': lambda c: ore(c, '#e0245e'),
    'sapphire_ore': lambda c: ore(c, '#2f6bff'), 'emerald_ore': lambda c: ore(c, '#1fcf7a'), 'amethyst_ore': lambda c: ore(c, '#a45cff'),
    'titanium_ore': lambda c: ore(c, '#a8b8c8', '#5a6068'), 'mythril_ore': lambda c: ore(c, '#6ff0e0', '#4a5a66'),
}

# ------------------------------------------------------------------ structures (centered, ~80% of canvas)
def S_workbench(c):
    c.ell(128, 214, 90, 16, (0, 0, 0, 70), None, 0)
    c.poly([(40, 196), (50, 120), (206, 120), (216, 196)], C('#7a5230'))
    c.poly([(36, 112), (220, 112), (212, 150), (44, 150)], C('#c58a4a'))
    for x in range(60, 210, 38): c.line([(x, 114), (x - 4, 148)], dark(C('#c58a4a'), .3), 3)
    c.line([(128, 150), (128, 196)], C('#5a3b20'), 6)
    c.poly([(70, 90), (96, 84), (100, 100), (74, 106)], C('#cfd3d8')); c.line([(76, 100), (110, 128)], C('#6a4a2a'), 8)
    c.ell(168, 100, 22, 12, C('#b08a5a'), OUTLINE, 2, .1); c.line([(150, 100), (190, 100)], dark(C('#b08a5a'), .3), 2)
def S_forge(c):
    c.ell(128, 220, 92, 14, (0, 0, 0, 70), None, 0)
    c.poly([(36, 214), (44, 90), (212, 90), (220, 214)], C('#8a8f98'))
    for y in range(110, 214, 26):
        c.line([(40, y), (216, y)], dark(C('#8a8f98'), .3), 3)
        for x in range(60 + (y // 26 % 2) * 20, 216, 40): c.line([(x, y), (x, y + 26)], dark(C('#8a8f98'), .3), 3)
    c.poly([(36, 80), (128, 28), (220, 80), (212, 96), (44, 96)], C('#6a6f78'))
    c.poly([(104, 30), (152, 30), (150, 4), (106, 4)], C('#5a5f68'))
    c.ell(128, 170, 54, 42, C('#1a0a05'), OUTLINE, 4); c.glow(128, 170, 56, (255, 130, 30, 210)); c.ell(128, 176, 38, 26, C('#ff8a2a'), None, 0); c.ell(128, 182, 22, 14, C('#ffe27a'), None, 0)
def S_alchemy(c):
    c.ell(128, 214, 90, 14, (0, 0, 0, 70), None, 0)
    c.poly([(44, 200), (52, 130), (204, 130), (212, 200)], C('#5a3b6a')); c.poly([(36, 124), (220, 124), (214, 150), (42, 150)], C('#8a5ab0'))
    c.ell(80, 100, 24, 28, C('#7bd0ff', 200), OUTLINE, 3); c.ell(80, 108, 20, 16, C('#4a9bff'), None, 0); c.poly([(72, 76), (88, 76), (86, 60), (74, 60)], C('#cfd3d8'))
    c.ell(136, 96, 20, 26, C('#ff7a9a', 200), OUTLINE, 3); c.ell(136, 106, 16, 14, C('#e0245e'), None, 0)
    c.ell(184, 104, 18, 22, C('#9bff7a', 200), OUTLINE, 3); c.ell(184, 112, 14, 11, C('#4ad04a'), None, 0)
    for (x, y, r) in [(76, 56, 5), (86, 44, 4), (140, 56, 5), (186, 62, 4)]: c.circ(x, y, r, (255, 255, 255, 170), None, 0)
def S_altar(c):
    c.ell(128, 160, 96, 78, C('#585c68'), OUTLINE, 4); c.ell(128, 160, 80, 62, C('#6a6f7e'), None, 0)
    c.glow(128, 160, 90, (150, 90, 255, 120))
    c.d.ellipse([(128 - 62) * SS, (160 - 48) * SS, (128 + 62) * SS, (160 + 48) * SS], outline=(190, 140, 255, 255), width=4 * SS)
    for i in range(6):
        a = i * math.pi / 3; x, y = 128 + 54 * math.cos(a), 160 + 42 * math.sin(a)
        c.circ(x, y, 7, C('#8a5aff'), OUTLINE, 2)
    c.poly([(128, 90), (146, 130), (128, 176), (110, 130)], C('#b890ff')); c.poly([(128, 90), (146, 130), (128, 130)], lite(C('#b890ff'), .5), None)
    c.glow(128, 128, 30, (200, 160, 255, 220))
def S_void_anvil(c):
    c.glow(128, 150, 100, (130, 50, 230, 100))
    c.ell(128, 214, 80, 14, (0, 0, 0, 90), None, 0)
    c.poly([(70, 200), (186, 200), (170, 160), (86, 160)], C('#1c1428'))
    c.poly([(80, 164), (176, 164), (176, 130), (80, 130)], C('#2a1f3d')); c.poly([(30, 130), (226, 130), (200, 96), (60, 96)], C('#38284e'))
    c.poly([(226, 130), (250, 120), (226, 106)], C('#38284e'))
    c.poly([(60, 96), (200, 96), (190, 104), (70, 104)], C('#7a4ac0'), None)
    c.circ(128, 76, 18, C('#9a3aff'), OUTLINE, 3); c.glow(128, 76, 32, (170, 90, 255, 220)); c.circ(128, 76, 7, C('#ffffff'), None, 0)
def wall_sprite(c, base, line, plates=False):
    c.poly([(36, 66), (220, 66), (220, 200), (36, 200)], C(base), OUTLINE, 4)
    c.poly([(36, 66), (220, 66), (212, 82), (44, 82)], lite(C(base), .3), None)
    if plates:
        for x in (36, 128): c.poly([(x + 6, 84), (x + 86, 84), (x + 86, 192), (x + 6, 192)], lite(C(base), .1), None)
        for (x, y) in [(52, 98), (112, 98), (144, 98), (204, 98), (52, 176), (112, 176), (144, 176), (204, 176)]: c.circ(x, y, 5, dark(C(base), .35), OUTLINE, 1.5)
    else:
        for y in range(92, 200, 36): c.line([(36, y), (220, y)], C(line), 4)
        for i, y in enumerate(range(66, 200, 36)):
            for x in range(60 + (i % 2) * 36, 220, 72): c.line([(x, y), (x, y + 36)], C(line), 4)
def S_wall_wood(c):
    c.poly([(40, 60), (216, 60), (216, 204), (40, 204)], C('#a0703c'), OUTLINE, 4)
    for x in range(40, 216, 44): c.line([(x, 60), (x, 204)], dark(C('#a0703c'), .4), 5); c.line([(x + 20, 70), (x + 20, 196)], lite(C('#a0703c'), .15), 2)
    c.poly([(40, 60), (216, 60), (208, 76), (48, 76)], lite(C('#a0703c'), .3), None)
    for (x, y) in [(60, 72), (196, 72), (60, 192), (196, 192)]: c.circ(x, y, 4, C('#3a2a1a'), None, 0)
def spikes(c, col, base):
    c.circ(128, 134, 94, C(base), OUTLINE, 4)
    for i in range(12):
        a = math.radians(i * 30 + 8)
        c.poly([(128 + 52 * math.cos(a - .26), 134 + 52 * math.sin(a - .26)), (128 + 112 * math.cos(a), 134 + 112 * math.sin(a)), (128 + 52 * math.cos(a + .26), 134 + 52 * math.sin(a + .26))], C(col))
    for i in range(6):
        a = math.radians(i * 60 + 30); c.poly([(128 + 20 * math.cos(a - .5), 134 + 20 * math.sin(a - .5)), (128 + 64 * math.cos(a), 134 + 64 * math.sin(a)), (128 + 20 * math.cos(a + .5), 134 + 20 * math.sin(a + .5))], lite(C(col), .25))
    c.circ(128, 134, 14, lite(C(base), .2), OUTLINE, 3)
def bear_trap(c):
    c.circ(128, 134, 96, (0, 0, 0, 0), None, 0)
    c.ell(128, 134, 94, 84, C('#6a6f78'), OUTLINE, 4); c.ell(128, 134, 76, 66, C('#3a3d44'), None, 0)
    for side in (-1, 1):
        for i in range(8):
            x = 54 + i * 21.5; y0 = 134 + side * 56 if True else 0
            c.poly([(x - 9, 134 + side * 58), (x, 134 + side * 18), (x + 9, 134 + side * 58)], C('#c9d0d8'))
    c.line([(128, 134), (128, 134)], OUTLINE, 2); c.circ(128, 134, 12, C('#9aa0a8'), OUTLINE, 3); c.line([(34, 134), (222, 134)], C('#4a4d54'), 6)
def campfire(c):
    c.glow(128, 140, 90, (255, 150, 40, 90))
    for a in (.5, 2.1, 3.7, 5.2):
        x, y = 128 + 56 * math.cos(a), 168 + 20 * math.sin(a)
        c.outlined_line([(128, 168), (x, y)], C('#6a4423'), 16)
    for i in range(8):
        a = i * math.pi / 4; c.circ(128 + 84 * math.cos(a), 176 + 40 * math.sin(a), 11, C('#8a8f98'), OUTLINE, 2)
    c.poly([(94, 168), (104, 100), (124, 128), (130, 64), (150, 118), (164, 96), (166, 168)], C('#ff7a1a'))
    c.poly([(110, 168), (122, 124), (132, 96), (146, 130), (150, 168)], C('#ffd23f'))
    c.poly([(122, 168), (130, 134), (140, 168)], C('#fff3b0'))

STRUCTS = {'workbench': S_workbench, 'forge': S_forge, 'alchemy_table': S_alchemy, 'arcane_altar': S_altar, 'void_anvil': S_void_anvil,
           'wall_wood': S_wall_wood, 'wall_stone': lambda c: wall_sprite(c, '#8a8f98', '#5a5f68'), 'wall_iron': lambda c: wall_sprite(c, '#b0b6be', '#6a707a', True),
           'spikes_wood': lambda c: spikes(c, '#c58a4a', '#7a5230'), 'spikes_stone': lambda c: spikes(c, '#b6bbc4', '#6a6f78'), 'spikes_iron': lambda c: spikes(c, '#e6ecf4', '#4a4f58'),
           'bear_trap': bear_trap}
