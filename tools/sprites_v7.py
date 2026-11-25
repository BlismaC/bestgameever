# v0.7 art: tameable pals (critters), dimension mobs, special bosses, holiday items, decor, mounts, buff icons.
from sprite_lib import *
from sprites_mobs import humanoid, eyes, slime, wolf
import sprites_mobs as M, sprites_bosses as B, sprites_world as Wd, sprites_items as I, sprites_new as N
import math
C = lambda h, a=255: hexc(h, a)

# ---------------------------------------------------------------- PAL CRITTERS (facing right, cute big eyes)
def _eye(c, x, y, r=9, col='#15151c'):
    c.circ(x, y, r, C('#ffffff'), OUTLINE, 2); c.circ(x + 2, y + 1, r * .55, C(col), None, 0); c.circ(x + 4, y - 2, r * .2, C('#ffffff'), None, 0)

def quad(c, body, belly, accent, ears='pointy', tail='fluffy', extra=None, glow=None):
    b, bl, ac = C(body), C(belly), C(accent)
    if glow: c.glow(128, 130, 60, C(glow)[:3] + (110,))
    # tail
    if tail == 'fluffy': c.blob(52, 120, 40, 22, b, rot=-.5); c.blob(34, 104, 20, 16, bl, rot=-.5)
    elif tail == 'flame': c.blob(50, 122, 36, 16, b, rot=-.4); c.poly([(30, 126), (4, 84), (34, 104), (30, 64), (62, 112), (66, 130)], C('#ffb02e')); c.poly([(40, 124), (22, 96), (44, 108), (42, 86), (58, 116)], C('#fff3a8'), None)
    elif tail == 'leaf': c.blob(54, 124, 32, 14, b, rot=-.3); c.ell(30, 104, 26, 12, C('#7bd04a'), OUTLINE, 3, -.8); c.ell(24, 128, 24, 11, C('#4aa83a'), OUTLINE, 3, -.2)
    elif tail == 'zig': c.poly([(60, 124), (30, 120), (46, 104), (14, 96), (36, 78), (8, 60), (62, 96), (46, 112), (70, 128)], C('#ffe14a'))
    elif tail == 'fin': c.poly([(62, 128), (24, 98), (14, 128), (24, 160), (62, 136)], ac)
    else: c.line([(60, 128), (30, 118)], b, 10)
    # legs
    for x in (84, 150): c.ell(x, 176, 14, 18, dark(b, .15), OUTLINE, 3); c.ell(x + 22, 178, 14, 17, b, OUTLINE, 3)
    c.blob(112, 140, 62, 44, b); c.ell(120, 156, 40, 24, bl, None, 0); c.ell(92, 120, 34, 16, lite(b, .25), None, 0, -.2)
    if extra == 'spikes':
        for i in range(5): x = 70 + i * 22; c.poly([(x - 9, 104), (x, 70 - (i % 2) * 14), (x + 9, 104)], ac)
    if extra == 'fins': c.poly([(80, 106), (110, 64), (130, 104)], ac); c.poly([(120, 100), (146, 70), (160, 104)], dark(ac, .15))
    # head
    c.blob(176, 112, 38, 34, b); c.ell(196, 126, 24, 16, bl, None, 0); c.circ(212, 120, 5, C('#2a1a1a'), None, 0)
    if ears == 'pointy':
        for sgn in (-1, 1): c.poly([(166, 96 + sgn * 20 - 10), (160, 64 + (0 if sgn < 0 else 80)), (190, 90 + sgn * 18)], b)
    elif ears == 'round':
        for sgn in (-1, 1): c.circ(170, 112 + sgn * 34, 14, b); c.circ(170, 112 + sgn * 34, 8, bl, None, 0)
    elif ears == 'leaf':
        for sgn in (-1, 1): c.ell(168, 112 + sgn * 38, 26, 12, C('#7bd04a'), OUTLINE, 3, sgn * .7)
        c.circ(176, 82, 9, C('#ff7aa8')); c.circ(176, 82, 4, C('#ffe14a'), None, 0)
    elif ears == 'horns':
        for sgn in (-1, 1): c.poly([(172, 100 + (sgn < 0) * -4 + (sgn > 0) * 30), (150, 80 + (sgn > 0) * 66), (186, 96 + (sgn > 0) * 32)], ac)
    _eye(c, 190, 104, 8); _eye(c, 190, 128, 8)

def turtle(c, shell, moss, skin):
    for x, y in ((74, 90), (74, 170), (150, 90), (150, 170)): c.ell(x, y, 18, 14, C(skin), OUTLINE, 3)
    c.blob(180, 128, 30, 26, C(skin)); _eye(c, 192, 118, 7); _eye(c, 192, 140, 7)
    c.blob(108, 128, 74, 68, C(shell)); c.ell(100, 112, 46, 30, lite(C(shell), .15), None, 0)
    for (x, y, r) in ((84, 98, 16), (120, 150, 18), (70, 142, 12), (128, 106, 12)): c.circ(x, y, r, C(moss), None, 0)
    for pts in ([(60, 128), (150, 128)], [(108, 70), (108, 186)], [(70, 86), (146, 170)]): c.line(pts, dark(C(shell), .3), 3)
    c.ell(72, 82, 7, 14, C('#ff7aa8'), OUTLINE, 2); c.circ(72, 70, 5, C('#ffe14a'), None, 0)

def armadillo(c, shell, gold, skin):
    c.line([(48, 134), (18, 124)], C(skin), 10)
    for x in (80, 138): c.ell(x, 176, 14, 18, dark(C(skin), .1), OUTLINE, 3); c.ell(x + 18, 178, 14, 17, C(skin), OUTLINE, 3)
    c.blob(104, 130, 72, 52, C(shell))
    for i in range(6): x = 52 + i * 18; c.line([(x, 90), (x + 4, 170)], dark(C(shell), .35), 4); c.circ(x + 8, 104 + (i % 2) * 36, 6, C(gold), None, 0)
    c.blob(178, 124, 30, 24, C(skin)); c.poly([(198, 118), (232, 126), (198, 138)], lite(C(skin), .15)); c.circ(230, 126, 5, C('#1a1218'), None, 0)
    for sgn in (-1, 1): c.poly([(170, 112 + sgn * 6 - 20), (162, 84 + (sgn > 0) * 88), (184, 108 + (sgn > 0) * 18)], C(shell))
    _eye(c, 188, 114, 7); _eye(c, 188, 134, 7)
    c.glow(110, 130, 36, C(gold)[:3] + (60,))

def moth(c, body, wing, mark):
    for sgn in (-1, 1):
        c.poly([(118, 128 + sgn * 10), (70, 128 + sgn * 78), (40, 128 + sgn * 120), (92, 128 + sgn * 112), (130, 128 + sgn * 46)], C(wing))
        c.poly([(130, 128 + sgn * 14), (124, 128 + sgn * 60), (168, 128 + sgn * 84), (176, 128 + sgn * 36)], lite(C(wing), .15))
        c.circ(88, 128 + sgn * 78, 12, C(mark), OUTLINE, 2); c.circ(88, 128 + sgn * 78, 5, C('#15151c'), None, 0); c.circ(150, 128 + sgn * 56, 8, C(mark), OUTLINE, 2)
    c.blob(120, 128, 44, 26, C(body)); c.blob(168, 128, 24, 22, lite(C(body), .1))
    for sgn in (-1, 1): c.line([(176, 128 + sgn * 10), (214, 128 + sgn * 34), (226, 128 + sgn * 26)], C(mark), 4); _eye(c, 178, 128 + sgn * 11, 7, '#2a1a4a')
    c.glow(120, 128, 40, C(mark)[:3] + (90,))

def baby_dragon(c, body, belly, flame):
    c.poly([(60, 140), (14, 130), (30, 154), (8, 170), (64, 156)], C(body)); c.poly([(10, 132), (-2, 118), (22, 128)], C('#ffe27a'), None)
    for sgn in (-1, 1): c.poly([(108, 128 + sgn * 14), (66, 128 + sgn * 74), (100, 128 + sgn * 70), (126, 128 + sgn * 36)], dark(C(body), .25))
    for x in (84, 146): c.ell(x, 176, 14, 18, dark(C(body), .15), OUTLINE, 3); c.ell(x + 20, 178, 14, 17, C(body), OUTLINE, 3)
    c.blob(110, 138, 60, 42, C(body)); c.ell(120, 154, 38, 22, C(belly), None, 0)
    for i in range(4): c.poly([(70 + i * 18 - 7, 100), (70 + i * 18, 80), (70 + i * 18 + 7, 100)], C(flame))
    c.blob(176, 112, 36, 30, C(body)); c.blob(204, 124, 22, 14, lite(C(body), .15))
    for sgn in (-1, 1): c.poly([(168, 96 + (sgn > 0) * 36), (150, 66 + (sgn > 0) * 86), (182, 92 + (sgn > 0) * 30)], C('#f0ead8'))
    c.glow(232, 124, 14, C(flame)[:3] + (180,)); _eye(c, 190, 104, 7, '#7a1a1a'); _eye(c, 190, 126, 7, '#7a1a1a')

def lantern_ghost(c, col):
    N.ghost(c, col, '#2a4a5a'); c.line([(150, 66), (150, 40), (170, 28)], C('#8a6a30'), 5)
    c.poly([(158, 28), (190, 28), (186, 64), (162, 64)], C('#ffe27a'), OUTLINE, 3); c.glow(174, 46, 26, (255, 226, 122, 150))

def round_critter(c, body, accent, kind='rock'):
    b, ac = C(body), C(accent)
    for x in (82, 146): c.ell(x, 186, 20, 14, dark(b, .2), OUTLINE, 3)
    c.blob(120, 134, 70, 62, b); c.ell(100, 106, 40, 24, lite(b, .22), None, 0, -.4)
    if kind == 'rock':
        for pts in ([(70, 90), (96, 120), (86, 150)], [(150, 84), (140, 114)]): c.line(pts, dark(b, .35), 4)
        for (x, y) in ((86, 96), (150, 160)): c.circ(x, y, 8, C('#6aa84a'), None, 0)
        c.circ(176, 168, 12, lite(b, .1)); c.circ(60, 150, 10, lite(b, .1))
    _eye(c, 158, 120, 10); _eye(c, 158, 148, 10); c.line([(176, 140), (184, 146), (196, 142)], dark(b, .5), 3)

def void_critter(c, base, accent):
    c.glow(128, 128, 56, C(accent)[:3] + (150,))
    for i in range(6): a = i * 1.05; c.poly([(128 + math.cos(a) * 50, 132 + math.sin(a) * 50), (128 + math.cos(a + .14) * 96, 132 + math.sin(a + .14) * 96), (128 + math.cos(a + .28) * 50, 132 + math.sin(a + .28) * 50)], C(accent))
    c.circ(128, 132, 58, C(base), C(accent), 4); c.ell(140, 128, 40, 32, C('#f5eaff'), OUTLINE, 3); c.circ(148, 128, 17, C(accent), None, 0); c.circ(152, 128, 8, C('#05000a'), None, 0)
    c.line([(112, 160), (130, 168), (150, 162)], C('#f5eaff'), 4)

PAL_ART = {
  'pebblin':   lambda c: round_critter(c, '#8a8f98', '#b8bcc4', 'rock'),
  'mossback':  lambda c: turtle(c, '#5a6a4a', '#7ac04a', '#7a9a5a'),
  'sparklit':  lambda c: (quad(c, '#ffe14a', '#fff6c0', '#fff6a0', 'round', 'zig', None, '#ffe14a'), [c.circ(204, 148, 7, C('#ff4a4a'), OUTLINE, 2)]),
  'leafling':  lambda c: quad(c, '#a8825a', '#ecd8b0', '#4aa84a', 'leaf', 'leaf'),
  'aquafin':   lambda c: quad(c, '#4aa8e0', '#d8f4ff', '#2f7fc0', 'pointy', 'fin', 'fins'),
  'cinderfox': lambda c: quad(c, '#e86a2a', '#ffd9a0', '#ffd23f', 'pointy', 'flame', None, '#ff7a1a'),
  'frostpaw':  lambda c: quad(c, '#d8f0ff', '#ffffff', '#8ad0ff', 'round', 'fluffy', 'spikes', '#9be7ff'),
  'sunbird':   lambda c: (c.glow(128, 128, 70, (255, 226, 122, 130)), N.bird(c, '#ffb02e', '#fff3a8', '#e86a2a'), c.circ(168, 82, 18, (255, 243, 168, 0), C('#fff3a8'), 4)),
  'gloomoth':  lambda c: moth(c, '#3a2a5a', '#5a4a8a', '#c8a0ff'),
  'oreback':   lambda c: armadillo(c, '#6a5a4a', '#ffd23f', '#a08a70'),
  'wispy':     lambda c: lantern_ghost(c, '#a8f0e0'),
  'drakeling': lambda c: baby_dragon(c, '#c44a4a', '#ffd9a0', '#ffb02e'),
  'crystaleon':lambda c: quad(c, '#c8a0ff', '#f0e0ff', '#e8d8ff', 'horns', 'fluffy', 'spikes', '#c8a0ff'),
  'voidling':  lambda c: void_critter(c, '#150a30', '#9a4aff'),
}

# ---------------------------------------------------------------- MOBS of the new dimensions / holidays
def shark(c):
    c.poly([(40, 128), (6, 90), (14, 128), (6, 166)], C('#5a7a98'))
    c.blob(120, 128, 92, 38, C('#6a8aa8')); c.ell(130, 146, 64, 20, C('#e8f0f8'), None, 0)
    c.poly([(104, 92), (126, 40), (150, 92)], C('#4a6a88'))
    for sgn in (-1, 1): c.poly([(124, 128 + sgn * 24), (96, 128 + sgn * 70), (146, 128 + sgn * 30)], C('#4a6a88'))
    c.blob(206, 128, 40, 28, C('#6a8aa8'), rot=0); c.circ(214, 112, 6, C('#ffffff'), OUTLINE, 2); c.circ(215, 112, 3, OUTLINE, None, 0)
    for i in range(6): c.poly([(206 + i * 6, 134), (210 + i * 6, 146), (214 + i * 6, 134)], C('#ffffff'), None)
def jellyfish(c):
    c.glow(128, 110, 70, (200, 160, 255, 120))
    for i in range(7): x = 70 + i * 20; c.line([(x, 130), (x + (-8 if i % 2 else 8), 170), (x + (10 if i % 2 else -10), 214)], C('#c8a0ff', 200), 6)
    c.ell(128, 106, 84, 62, C('#c8a0ff', 230), OUTLINE, 4); c.ell(110, 86, 42, 22, (255, 255, 255, 130), None, 0, -.3)
    c.circ(106, 112, 8, C('#2a1a4a'), None, 0); c.circ(150, 112, 8, C('#2a1a4a'), None, 0); c.line([(116, 134), (128, 142), (140, 134)], C('#2a1a4a'), 3)
def merfolk(c):
    for sgn in (-1, 1): c.outlined_line([(108, 128 + sgn * 36), (150, 128 + sgn * 50), (190, 128 + sgn * 46)], C('#3ac0c0'), 14)
    c.poly([(66, 128), (20, 92), (30, 128), (20, 164)], C('#2f8aa0'))
    c.blob(106, 128, 46, 38, C('#2f8aa0')); c.blob(150, 128, 32, 30, C('#4ac0c0'))
    for sgn in (-1, 1): c.poly([(150, 128 + sgn * 24), (130, 128 + sgn * 62), (164, 128 + sgn * 34)], C('#2f8aa0'))
    c.circ(172, 120, 6, C('#fff'), OUTLINE, 2); c.circ(172, 138, 6, C('#fff'), OUTLINE, 2); c.circ(174, 120, 3, OUTLINE, None, 0); c.circ(174, 138, 3, OUTLINE, None, 0)
    c.line([(150, 188), (250, 60)], C('#dff6ff'), 6); c.poly([(236, 58), (254, 40), (258, 64)], C('#7ae0ff'))
def crab(c):
    for sgn in (-1, 1):
        for i in range(3): c.line([(100 + i * 22, 128 + sgn * 36), (84 + i * 26, 128 + sgn * 74)], C('#c0483a'), 8)
        c.outlined_line([(150, 128 + sgn * 34), (196, 128 + sgn * 66)], C('#e0584a'), 14); c.blob(214, 128 + sgn * 70, 26, 22, C('#e0584a')); c.poly([(222, 128 + sgn * 56), (250, 128 + sgn * 70), (226, 128 + sgn * 80)], C('#2a1410'), None)
    c.blob(120, 128, 66, 50, C('#e0584a')); c.ell(110, 108, 40, 20, lite(C('#e0584a'), .25), None, 0, -.2)
    for sgn in (-1, 1): c.line([(172, 128 + sgn * 18), (186, 128 + sgn * 36)], C('#c0483a'), 5); c.circ(190, 128 + sgn * 38, 8, C('#fff'), OUTLINE, 2); c.circ(192, 128 + sgn * 38, 4, OUTLINE, None, 0)
def pumpkin_head(c):
    N.hum(c, '#c8843a', '#4a2a1a', 'plain', '#3a2010', '#ffe14a')
    c.ell(150, 128, 44, 40, C('#e07a1a'), OUTLINE, 4); c.ell(142, 116, 22, 16, lite(C('#e07a1a'), .25), None, 0)
    c.poly([(176, 108), (186, 120), (168, 120)], C('#ffe14a'), None); c.poly([(176, 138), (186, 150), (168, 150)], C('#ffe14a'), None); c.poly([(166, 128), (186, 126), (184, 130), (180, 136), (172, 134), (166, 136)], C('#ffe14a'), None)
    c.poly([(146, 86), (152, 70), (158, 88)], C('#2a7a2a'))
def scarecrow(c):
    N.hum(c, '#c9a050', '#6a5a2a', 'plain', '#8a6a30', '#ff5a3a')
    c.ell(150, 128, 42, 12, C('#4a3a20'), OUTLINE, 3, 0); c.ell(152, 128, 24, 28, C('#4a3a20'), OUTLINE, 3)
    for k in range(5): c.line([(180 + k * 3, 108 + k * 10), (204, 100 + k * 12)], C('#e8d080'), 3)
def ghost_pumpkin(c):
    N.ghost(c, '#ffb02e', '#3a1a08'); c.glow(150, 128, 40, (255, 150, 30, 120))
    c.poly([(176, 108), (188, 124), (168, 124)], C('#3a1a08'), None); c.poly([(176, 142), (188, 154), (168, 154)], C('#3a1a08'), None)
def elf_archer(c):
    N.hum(c, '#e8c8a0', '#2f8a3a', 'plain', '#d8404a', '#5aff9a')
    c.poly([(116, 100), (128, 40), (170, 98)], C('#d8404a')); c.circ(128, 40, 8, C('#fff'))
    for sgn in (-1, 1): c.poly([(150, 128 + sgn * 36), (136, 128 + sgn * 62), (160, 128 + sgn * 42)], C('#e8c8a0'))
    c.line([(176, 82), (210, 128), (176, 174)], C('#a07a48'), 5); c.line([(176, 82), (176, 174)], C('#f4f4f4'), 2)
def gingerbread(c):
    for sgn in (-1, 1): c.outlined_line([(100, 128 + sgn * 56), (150, 128 + sgn * 80)], C('#b0703a'), 26); c.circ(158, 128 + sgn * 84, 18, C('#b0703a'))
    for sgn in (-1, 1): c.outlined_line([(80, 128 + sgn * 22), (40, 128 + sgn * 34)], C('#b0703a'), 26)
    c.blob(112, 128, 52, 56, C('#b0703a')); c.blob(168, 128, 38, 36, C('#c0803a'))
    for (x, y) in ((100, 112), (100, 144), (120, 128)): c.circ(x, y, 7, C('#e0245e'), None, 0)
    c.line([(80, 96), (150, 96)], C('#ffffff'), 5); c.line([(80, 160), (150, 160)], C('#ffffff'), 5)
    for sgn in (-1, 1): c.circ(176, 128 + sgn * 11, 5, C('#ffffff'), OUTLINE, 2); c.circ(177, 128 + sgn * 11, 2, OUTLINE, None, 0)
    c.line([(186, 118), (194, 126), (186, 138)], C('#ffffff'), 3)
def snowman(c):
    c.circ(80, 128, 52, C('#f4faff'), OUTLINE, 4); c.circ(140, 128, 38, C('#f4faff'), OUTLINE, 4); c.circ(186, 128, 28, C('#f4faff'), OUTLINE, 4)
    for (x, y) in ((70, 108), (70, 128), (70, 148)): c.circ(x, y, 5, C('#2a2a30'), None, 0)
    c.poly([(204, 122), (236, 128), (204, 134)], C('#ff7a1a')); c.circ(196, 118, 4, C('#2a2a30'), None, 0); c.circ(196, 138, 4, C('#2a2a30'), None, 0)
    c.ell(184, 128, 6, 34, C('#2a2a30'), OUTLINE, 3); c.line([(150, 178), (240, 190)], C('#2a2a30'), 10); c.poly([(222, 184), (252, 188), (224, 200)], C('#7a7a8a'))
    c.line([(120, 104), (150, 104)], C('#e0245e'), 8)

# ---------------------------------------------------------------- BOSSES (94px)
def dracula(c):
    c.glow(120, 128, 100, (200, 20, 50, 110))
    c.poly([(104, 128), (20, 20), (4, 128), (20, 236)], C('#5a0a1a'), OUTLINE, 4); c.poly([(104, 128), (50, 56), (42, 128), (50, 200)], C('#8a1a2a'), None)
    for sgn in (-1, 1): c.poly([(90, 128 + sgn * 18), (36, 128 + sgn * 100), (60, 128 + sgn * 60), (26, 128 + sgn * 66), (70, 128 + sgn * 36)], C('#2a0a14'))
    for sgn in (-1, 1): c.outlined_line([(110, 128 + sgn * 54), (170, 128 + sgn * 78), (206, 128 + sgn * 60)], C('#1a1218'), 24); c.circ(210, 128 + sgn * 60, 13, C('#e8dce0'), OUTLINE, 2); [c.poly([(214 + k * 8, 128 + sgn * (52 + k * 6)), (250, 128 + sgn * (62 + k * 8)), (218 + k * 8, 128 + sgn * (62 + k * 5))], C('#e8dce0'), None) for k in range(2)]
    c.blob(112, 128, 50, 72, C('#1a1218')); c.poly([(120, 90), (170, 112), (170, 144), (120, 166)], C('#8a1a2a'), None)
    c.poly([(150, 92), (196, 70), (182, 118)], C('#1a1218')); c.poly([(150, 164), (196, 186), (182, 138)], C('#1a1218'))
    c.blob(178, 128, 36, 34, C('#e8dce0')); c.poly([(150, 112), (186, 96), (206, 112), (204, 98), (166, 92)], C('#1a1218'))
    for sgn in (-1, 1): c.ell(192, 128 + sgn * 12, 8, 5, C('#ff2a3a'), OUTLINE, 2); c.glow(192, 128 + sgn * 12, 12, (255, 40, 60, 220))
    c.poly([(204, 134), (208, 150), (212, 134)], C('#ffffff'), None); c.poly([(204, 122), (208, 106), (212, 122)], C('#ffffff'), None)
    c.line([(208, 128), (214, 128)], C('#8a1a2a'), 3)
def neptune(c):
    c.glow(128, 128, 100, (60, 200, 230, 110))
    c.line([(60, 236), (240, 20)], C('#dff6ff'), 10); [c.poly([(226 + k * 14 - 6, 22 + k * 22), (252, 6 + k * 10), (230 + k * 14, 36 + k * 22)], C('#7ae0ff'), None) for k in range(3)]
    c.poly([(80, 128), (30, 80), (14, 128), (30, 176), (84, 140)], C('#2f8aa0'))
    for sgn in (-1, 1): c.outlined_line([(100, 128 + sgn * 52), (160, 128 + sgn * 74), (194, 128 + sgn * 54)], C('#4ac0c0'), 24); c.circ(198, 128 + sgn * 54, 13, C('#e0b896'), OUTLINE, 2)
    c.blob(112, 128, 50, 68, C('#2fb0c0')); c.poly([(110, 90), (170, 110), (170, 146), (110, 166)], C('#7ae0ff'), None)
    c.blob(176, 128, 38, 36, C('#e0b896'))
    c.poly([(176, 150), (228, 128), (176, 106)], C('#f4f4f4')) ; c.poly([(190, 120), (216, 128), (190, 136)], C('#dfe6ee'), None)
    c.poly([(150, 98), (156, 66), (168, 90), (176, 60), (186, 90), (198, 66), (200, 98)], C('#ffd23f'), OUTLINE, 3)
    for sgn in (-1, 1): c.ell(192, 128 + sgn * 11, 7, 5, C('#ffffff'), OUTLINE, 2); c.circ(194, 128 + sgn * 11, 3, C('#1a5a8a'), None, 0)
def pumpking(c):
    c.glow(128, 128, 110, (255, 150, 30, 100))
    for sgn in (-1, 1): c.outlined_line([(100, 128 + sgn * 80), (170, 128 + sgn * 110), (214, 128 + sgn * 90)], C('#2a7a2a'), 18); c.circ(220, 128 + sgn * 92, 14, C('#4aa83a'), OUTLINE, 3)
    c.blob(126, 128, 98, 90, C('#e07a1a'), ow=5); c.ell(96, 94, 56, 36, lite(C('#e07a1a'), .2), None, 0, -.4)
    for k in (-2, -1, 0, 1, 2): c.line([(126 + k * 4, 44 + abs(k) * 6), (126 + k * 34, 128), (126 + k * 4, 212 - abs(k) * 6)], dark(C('#e07a1a'), .25), 4)
    c.poly([(130, 36), (136, 6), (164, 20), (150, 42)], C('#2a7a2a'), OUTLINE, 3)
    c.poly([(190, 90), (216, 112), (180, 112)], C('#ffe14a')); c.poly([(190, 166), (216, 144), (180, 144)], C('#ffe14a'))
    c.poly([(170, 120), (222, 118), (214, 140), (200, 132), (186, 142), (172, 134)], C('#ffe14a')); c.glow(196, 128, 40, (255, 226, 80, 140))
def evil_santa(c):
    c.glow(120, 128, 100, (220, 30, 50, 100))
    c.poly([(90, 90), (14, 60), (6, 128), (14, 196), (90, 166)], C('#8a1a1a'), OUTLINE, 4); c.ell(40, 128, 22, 40, C('#c8a050'), OUTLINE, 3)
    for sgn in (-1, 1): c.outlined_line([(106, 128 + sgn * 58), (160, 128 + sgn * 82), (198, 128 + sgn * 62)], C('#c0262d'), 26); c.circ(204, 128 + sgn * 62, 13, C('#1a1218'), OUTLINE, 2)
    c.blob(112, 128, 54, 74, C('#c0262d')); c.line([(108, 70), (108, 186)], C('#ffffff'), 14); c.line([(70, 128), (150, 128)], C('#1a1218'), 12); c.rect if False else None
    c.blob(176, 128, 38, 34, C('#e8c8a0')); c.poly([(168, 150), (216, 128), (168, 106)], C('#f4f4f4')); c.poly([(142, 100), (176, 56), (210, 98)], C('#c0262d'), OUTLINE, 3); c.circ(176, 52, 12, C('#ffffff')); c.line([(140, 102), (212, 100)], C('#ffffff'), 14)
    for sgn in (-1, 1): c.ell(190, 128 + sgn * 11, 7, 5, C('#ffffff'), OUTLINE, 2); c.circ(192, 128 + sgn * 11, 3, C('#ff2a2a'), None, 0); c.glow(192, 128 + sgn * 11, 10, (255, 40, 40, 220))
    c.line([(186, 102), (200, 108)], C('#1a1218'), 4); c.line([(186, 154), (200, 148)], C('#1a1218'), 4)

NEW_MOBS = {'vampire_thrall': lambda c: N.hum(c, '#d8c8d0', '#4a1a2a', 'plain', '#3a0a1a', '#ff3a3a'), 'shark': shark, 'jellyfish': jellyfish, 'merfolk': merfolk, 'sea_crab': crab,
            'pumpkin_head': pumpkin_head, 'scarecrow': scarecrow, 'ghost_pumpkin': ghost_pumpkin, 'elf_archer': elf_archer, 'gingerbread_brute': gingerbread, 'snowman_gunner': snowman}
BOSSES = {'dracula': dracula, 'neptune': neptune, 'pumpking': pumpking, 'evil_santa': evil_santa}

# ---------------------------------------------------------------- ITEMS
def sphere(c, col):
    c.glow(128, 128, 60, C(col)[:3] + (80,)); c.circ(128, 128, 70, C('#e8ecf4'), OUTLINE, 5); 
    def f(d): d.pieslice([58 * SS, 58 * SS, 198 * SS, 198 * SS], 0, 180, fill=C(col))
    c.soft(f, 0.01) if False else None
    c.ell(128, 156, 66, 40, C(col), None, 0); c.line([(60, 128), (196, 128)], OUTLINE, 10); c.circ(128, 128, 22, C('#ffffff'), OUTLINE, 5); c.circ(128, 128, 9, lite(C(col), .4), None, 0)
    c.circ(128, 128, 70, (0, 0, 0, 0), OUTLINE, 5)
def candy(c, a, b):
    c.glow(128, 128, 56, C(a)[:3] + (80,)); c.poly([(60, 190), (128, 50), (196, 190)], C(a), OUTLINE, 4); c.poly([(96, 126), (160, 126), (176, 156), (80, 156)], C(b), None); c.poly([(110, 90), (146, 90), (160, 126), (96, 126)], C('#ffffff'), None)
def candy_cane(c):
    for i in range(7): t = i / 6; c.line([(100 + 6 * i, 220 - i * 22), (108 + 6 * i, 200 - i * 22)], C('#ffffff') if i % 2 else C('#e0245e'), 24)
    c.line([(140, 70), (170, 54), (196, 70), (196, 96)], C('#e0245e'), 22); c.line([(160, 58), (182, 58)], C('#ffffff'), 8)
def choc(c, col): c.poly([(70, 70), (186, 70), (186, 190), (70, 190)], C(col), OUTLINE, 5); [c.line([(70 + k * 29, 70), (70 + k * 29, 190)], dark(C(col), .4), 4) for k in range(1, 4)]; [c.line([(70, 70 + k * 40), (186, 70 + k * 40)], dark(C(col), .4), 4) for k in range(1, 3)]; c.poly([(70, 70), (186, 70), (178, 90), (78, 90)], lite(C(col), .2), None)
def heart(c):
    c.glow(128, 128, 56, (255, 60, 130, 90)); c.circ(98, 104, 40, C('#e0245e'), OUTLINE, 5); c.circ(158, 104, 40, C('#e0245e'), OUTLINE, 5); c.poly([(64, 124), (128, 204), (192, 124)], C('#e0245e'), OUTLINE, 5); c.circ(98, 104, 36, C('#e0245e'), None, 0); c.circ(158, 104, 36, C('#e0245e'), None, 0); c.ell(92, 92, 16, 10, (255, 255, 255, 160), None, 0, -.5)
def gift(c):
    c.poly([(56, 100), (200, 100), (200, 210), (56, 210)], C('#e0245e'), OUTLINE, 5); c.poly([(48, 76), (208, 76), (208, 108), (48, 108)], C('#ff5a7a'), OUTLINE, 5); c.line([(128, 76), (128, 210)], C('#ffd23f'), 22)
    c.ell(104, 60, 30, 18, C('#ffd23f'), OUTLINE, 4, -.4); c.ell(152, 60, 30, 18, C('#ffd23f'), OUTLINE, 4, .4); c.circ(128, 70, 12, C('#ffe27a'), OUTLINE, 3)
def egg(c):
    c.ell(128, 136, 62, 82, C('#8ad0ff'), OUTLINE, 5); c.line([(70, 112), (100, 134), (128, 108), (156, 134), (186, 112)], C('#ffe14a'), 8); c.line([(66, 156), (96, 176), (128, 150), (160, 176), (190, 156)], C('#ff7aa8'), 8); c.ell(104, 92, 16, 28, (255, 255, 255, 140), None, 0, -.4)
def elixir(c, col, label):
    c.glow(128, 150, 54, C(col)[:3] + (120,)); c.ell(128, 160, 56, 62, C('#bfe6ff', 130), OUTLINE, 5); c.ell(128, 176, 46, 44, C(col), None, 0); c.ell(106, 142, 14, 10, (255, 255, 255, 150), None, 0)
    c.poly([(106, 106), (150, 106), (144, 68), (112, 68)], C('#bfe6ff', 140), OUTLINE, 4); c.poly([(100, 72), (156, 72), (150, 48), (106, 48)], C('#8a5a30'), OUTLINE, 4)
    if label == 'fang': c.poly([(112, 150), (126, 150), (119, 176)], C('#ffffff'), None); c.poly([(130, 150), (144, 150), (137, 176)], C('#ffffff'), None)
def pearl(c, col='#f4f0ff'): c.glow(128, 128, 56, (200, 220, 255, 110)); c.circ(128, 134, 60, C(col), OUTLINE, 5); c.ell(106, 112, 20, 14, (255, 255, 255, 220), None, 0, -.5); c.ell(150, 160, 30, 16, (170, 200, 255, 90), None, 0, -.3)
def coral(c): [c.line([(128, 220), (128 + dx, 150), (128 + dx * 1.6, 70)], C('#ff7a8a'), 16) for dx in (-40, 0, 40)]; [c.circ(128 + dx * 1.6, 70, 12, C('#ffc0c8'), OUTLINE, 3) for dx in (-40, 0, 40)]
def kelp(c): [c.line([(100 + k * 30, 220), (84 + k * 30 + math.sin(k) * 20, 150), (110 + k * 30, 90), (96 + k * 30, 40)], C('#3a9a6a'), 14) for k in range(3)]

NEW_ITEMS = {
  'pal_sphere': lambda c: sphere(c, '#e0454a'), 'pal_sphere_great': lambda c: sphere(c, '#4a9bff'), 'pal_sphere_ultra': lambda c: sphere(c, '#ffd23f'),
  'candy_corn': lambda c: candy(c, '#ffb02e', '#ff7a1a'), 'chocolate_bar': lambda c: choc(c, '#6a3a1a'), 'caramel_apple': lambda c: (I.apple(c) if hasattr(I, 'apple') else c.circ(128, 140, 64, C('#c8843a'), OUTLINE, 5), c.line([(128, 76), (128, 30)], C('#8a5a30'), 8)),
  'candy_cane': candy_cane, 'gingerbread': lambda c: (c.circ(128, 64, 30, C('#b0703a')), c.blob(128, 130, 54, 44, C('#b0703a')), [c.outlined_line([(80, 120), (40, 110 + s * 36)], C('#b0703a'), 22) for s in (0, 1)], [c.outlined_line([(176, 120), (216, 110 + s * 36)], C('#b0703a'), 22) for s in (0, 1)], [c.circ(128, 110 + k * 22, 6, C('#e0245e'), None, 0) for k in range(3)]),
  'chocolate_heart': heart, 'gift_box': gift, 'easter_egg': egg,
  'vampire_elixir': lambda c: elixir(c, '#c01030', 'fang'), 'holy_water': lambda c: elixir(c, '#bfe8ff', ''), 'neptune_pearl': lambda c: pearl(c, '#7ae0ff'),
  'pearl': pearl, 'coral_shard': coral, 'kelp': kelp,
}
NEW_NODES = {
  'coral_rock': lambda c: (Wd.shadow_under(c, 128, 70), [c.line([(128 + dx, 210), (128 + dx * 1.3, 140), (128 + dx * 1.9, 70)], C('#ff7a8a'), 22) for dx in (-46, 0, 46)], [c.circ(128 + dx * 1.9, 70, 16, C('#ffc0c8'), OUTLINE, 3) for dx in (-46, 0, 46)]),
  'kelp': lambda c: (Wd.shadow_under(c, 128, 50), [c.line([(86 + k * 28, 216), (70 + k * 28 + math.sin(k * 2) * 24, 150), (100 + k * 28, 90), (84 + k * 28, 40)], C('#2f8a5a'), 18) for k in range(4)]),
  'pearl_clam': lambda c: (Wd.shadow_under(c, 128, 70), c.ell(128, 160, 82, 50, C('#cfc0d8'), OUTLINE, 5), c.ell(128, 130, 82, 44, C('#e8dcf0'), OUTLINE, 5), [c.line([(128, 112), (128 + dx, 160)], C('#a898b8'), 4) for dx in (-50, -25, 0, 25, 50)], c.circ(128, 138, 22, C('#f4f0ff'), OUTLINE, 3), c.ell(120, 130, 7, 5, (255, 255, 255, 220), None, 0)),
}

# ---------------------------------------------------------------- MOUNTS
def sleigh(c):
    c.poly([(30, 140), (220, 140), (236, 100), (212, 90), (200, 124), (50, 124)], C('#c0262d'), OUTLINE, 4); c.line([(20, 176), (150, 176), (236, 150)], C('#c8a050'), 10); c.line([(60, 140), (56, 176)], C('#c8a050'), 6); c.line([(180, 140), (184, 170)], C('#c8a050'), 6)
    c.ell(120, 118, 70, 26, C('#8a1a1a'), OUTLINE, 4); c.ell(60, 112, 26, 18, C('#e8c8a0'), OUTLINE, 3); [c.circ(60 + k * 40, 96, 6, C('#ffd23f'), OUTLINE, 2) for k in range(1, 4)]; c.glow(120, 128, 70, (255, 230, 120, 70))
def sea_turtle(c): turtle(c, '#2f8a6a', '#7ad0a0', '#4aa88a'); [c.circ(60 + k * 40, 100, 6, C('#ffe27a'), None, 0) for k in range(2)]
def bat_form(c): N.bat(c, '#3a1a2a', '#5a2a3a', '#ff3a3a'); c.glow(128, 128, 60, (255, 40, 60, 60))
MOUNTS = {'sleigh': sleigh, 'sea_turtle': sea_turtle, 'bat_form': bat_form}

# ---------------------------------------------------------------- DECOR (world scenery, drawn at world size)
def castle(c):
    c.poly([(8, 230), (8, 130), (248, 130), (248, 230)], C('#3a3648'), OUTLINE, 4); c.poly([(8, 130), (248, 130), (248, 150), (8, 150)], C('#4a4660'), None)
    for x, h in ((24, 130), (116, 160), (208, 130)):
        c.poly([(x - 20, 130), (x - 20, 130 - h * 0.6), (x + 20, 130 - h * 0.6), (x + 20, 130)], C('#4a465e'), OUTLINE, 4)
        c.poly([(x - 26, 130 - h * 0.6), (x, 130 - h), (x + 26, 130 - h * 0.6)], C('#2a2038'), OUTLINE, 4)
        c.ell(x, 130 - h * 0.35, 6, 10, C('#ffe27a'), OUTLINE, 2); c.glow(x, 130 - h * 0.35, 14, (255, 220, 120, 140))
    for x in range(20, 240, 24): c.poly([(x, 130), (x, 118), (x + 12, 118), (x + 12, 130)], C('#3a3648'), None)
    c.poly([(96, 230), (96, 170), (128, 150), (160, 170), (160, 230)], C('#0a0610'), OUTLINE, 4); c.glow(128, 196, 36, (160, 40, 80, 130))
    for x in (46, 82, 174, 210): c.ell(x, 176, 7, 14, C('#ffe27a'), OUTLINE, 2); c.glow(x, 176, 14, (255, 220, 120, 120))
def temple(c):
    c.glow(128, 150, 120, (80, 220, 255, 90)); c.poly([(10, 230), (10, 120), (128, 40), (246, 120), (246, 230)], C('#8ad0d8'), OUTLINE, 4); c.poly([(10, 120), (128, 40), (246, 120), (230, 124), (128, 56), (26, 124)], C('#d8f6ff'), None)
    for x in (34, 78, 178, 222): c.poly([(x - 10, 230), (x - 8, 130), (x + 8, 130), (x + 10, 230)], C('#e8f8ff'), OUTLINE, 3)
    c.poly([(98, 230), (98, 164), (128, 142), (158, 164), (158, 230)], C('#0a3050'), OUTLINE, 4); c.glow(128, 190, 40, (120, 240, 255, 150))
    c.circ(128, 92, 16, C('#ffd23f'), OUTLINE, 3); c.circ(128, 92, 7, C('#f4f0ff'), None, 0)
def fountain(c):
    c.ell(128, 190, 98, 44, C('#8a8f98'), OUTLINE, 5); c.ell(128, 184, 80, 32, C('#4aa8e0'), OUTLINE, 3); c.poly([(112, 188), (116, 100), (140, 100), (144, 188)], C('#a8acb4'), OUTLINE, 4); c.ell(128, 98, 36, 14, C('#a8acb4'), OUTLINE, 4); c.ell(128, 94, 28, 9, C('#7ad0f4'), None, 0); [c.line([(128, 90), (128 + dx, 66 - abs(dx) // 3), (128 + dx * 1.7, 106)], (190, 240, 255, 200), 5) for dx in (-26, 0, 26)]
def house(c):
    c.poly([(30, 230), (30, 120), (226, 120), (226, 230)], C('#c8a070'), OUTLINE, 5); c.poly([(10, 130), (128, 30), (246, 130)], C('#8a3a2a'), OUTLINE, 5)
    for k in range(5): c.line([(40 + k * 44, 118), (128 + (k - 2) * 20, 52)], dark(C('#8a3a2a'), .3), 3)
    c.poly([(104, 230), (104, 166), (152, 166), (152, 230)], C('#5a3a20'), OUTLINE, 4); c.circ(142, 200, 4, C('#ffd23f'), None, 0)
    for x in (54, 178): c.poly([(x, 150), (x, 192), (x + 30, 192), (x + 30, 150)], C('#ffe9a8'), OUTLINE, 4); c.glow(x + 15, 171, 22, (255, 220, 120, 130))
def board(c):
    c.poly([(40, 230), (40, 60), (216, 60), (216, 230)], C('#8a5a30'), OUTLINE, 5); c.poly([(56, 76), (200, 76), (200, 190), (56, 190)], C('#d8b878'), OUTLINE, 3)
    for (x, y, w, h) in ((66, 86, 50, 40), (130, 90, 56, 36), (70, 136, 60, 40), (140, 138, 46, 42)): c.poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], C('#f4ecd0'), OUTLINE, 2); c.circ(x + w // 2, y + 5, 4, C('#e0245e'), None, 0)
    c.ell(128, 214, 10, 12, C('#ffd23f'), OUTLINE, 3)
def stage(c):
    c.poly([(10, 230), (10, 150), (246, 150), (246, 230)], C('#8a5a30'), OUTLINE, 5); c.poly([(10, 150), (30, 120), (226, 120), (246, 150)], C('#a8723a'), OUTLINE, 4)
    c.poly([(40, 120), (40, 40), (216, 40), (216, 120)], C('#c0262d'), OUTLINE, 4); [c.poly([(40 + k * 44, 40), (62 + k * 44, 40), (51 + k * 44, 120)], C('#e04a4a'), None) for k in range(4)]
    c.line([(60, 150), (196, 150)], C('#ffd23f'), 8); c.circ(128, 80, 18, C('#ffd23f'), OUTLINE, 3); c.line([(128, 98), (128, 116)], C('#8a5a30'), 6)
def mailbox(c):
    c.line([(128, 230), (128, 130)], C('#6a4a2a'), 14); c.poly([(60, 130), (60, 80), (196, 80), (196, 130)], C('#2f6bff'), OUTLINE, 5); c.poly([(60, 80), (128, 44), (196, 80)], C('#4a8bff'), OUTLINE, 5); c.line([(96, 104), (160, 104)], C('#ffffff'), 8); c.poly([(190, 90), (224, 70), (224, 100)], C('#e0245e'))
def coral_d(c, v):
    cols = [('#ff7a8a', '#ffc0c8'), ('#a45cff', '#d8b8ff'), ('#ff9a2e', '#ffd08a')][v % 3]
    for dx in (-30, 0, 30): c.line([(128 + dx, 220), (128 + dx * 1.2, 150), (128 + dx * 1.8, 80 + abs(dx))], C(cols[0]), 18); c.circ(128 + dx * 1.8, 80 + abs(dx), 14, C(cols[1]), OUTLINE, 3)
def pumpkin_d(c): c.ell(128, 160, 80, 62, C('#e07a1a'), OUTLINE, 5); [c.line([(128 + k * 6, 100), (128 + k * 30, 160), (128 + k * 6, 220)], dark(C('#e07a1a'), .25), 4) for k in (-2, -1, 0, 1, 2)]; c.poly([(124, 96), (130, 66), (150, 80), (138, 100)], C('#2a7a2a'), OUTLINE, 3); c.poly([(90, 140), (110, 120), (110, 150)], C('#ffe14a'), None); c.poly([(166, 140), (146, 120), (146, 150)], C('#ffe14a'), None); c.poly([(100, 176), (156, 176), (146, 196), (128, 186), (110, 196)], C('#ffe14a'), None); c.glow(128, 160, 70, (255, 190, 60, 90))
def bat_banner(c): c.line([(30, 40), (226, 40)], C('#3a2a1a'), 10); c.poly([(50, 40), (206, 40), (206, 150), (128, 200), (50, 150)], C('#4a1a6a'), OUTLINE, 5); N.bat(c, '#e07a1a', '#e07a1a', '#ffffff') if False else None; c.poly([(90, 100), (110, 76), (128, 96), (146, 76), (166, 100), (146, 118), (128, 110), (110, 118)], C('#ffb02e'), None)
def xmas_tree(c):
    for k, (w, y) in enumerate(((100, 90), (86, 140), (110, 190))): c.poly([(128 - w, y + 40), (128, y - 50), (128 + w, y + 40)], C('#2a7a3a'), OUTLINE, 4)
    c.poly([(116, 230), (116, 196), (140, 196), (140, 230)], C('#6a4a2a'), OUTLINE, 3); c.star(128, 36, 20, 9, 5, C('#ffd23f'), OUTLINE, 3)
    for (x, y, col) in ((100, 100, '#e0245e'), (150, 130, '#4a9bff'), (86, 160, '#ffd23f'), (164, 180, '#e0245e'), (120, 210, '#4a9bff'), (126, 150, '#ffd23f')): c.circ(x, y, 7, C(col), OUTLINE, 2); c.glow(x, y, 14, C(col)[:3] + (110,))
def present_d(c): gift(c)
def heart_balloon(c): c.line([(128, 150), (122, 230)], C('#dcdcdc'), 3); c.circ(106, 70, 42, C('#e0245e'), OUTLINE, 5); c.circ(150, 70, 42, C('#e0245e'), OUTLINE, 5); c.poly([(70, 90), (128, 170), (186, 90)], C('#e0245e'), OUTLINE, 5); c.circ(106, 70, 38, C('#e0245e'), None, 0); c.circ(150, 70, 38, C('#e0245e'), None, 0); c.ell(96, 60, 14, 9, (255, 255, 255, 170), None, 0, -.5)
def egg_basket(c): c.ell(128, 190, 86, 36, C('#a8723a'), OUTLINE, 5); c.poly([(46, 190), (60, 130), (196, 130), (210, 190)], C('#c8923a'), OUTLINE, 4); [c.ell(80 + k * 32, 126, 18, 24, C(col), OUTLINE, 3) for k, col in enumerate(('#8ad0ff', '#ff7aa8', '#ffe14a', '#7bff9a'))]; c.line([(60, 130), (128, 50), (196, 130)], C('#8a5a20'), 8)
def party_lantern(c): c.line([(128, 20), (128, 70)], C('#dcdcdc'), 4); c.ell(128, 130, 54, 64, C('#e0245e'), OUTLINE, 5); c.line([(128, 70), (128, 194)], C('#ffd23f'), 5); c.line([(94, 80), (94, 182)], C('#ffd23f'), 4); c.line([(162, 80), (162, 182)], C('#ffd23f'), 4); c.glow(128, 130, 60, (255, 120, 80, 100)); c.poly([(116, 194), (140, 194), (134, 226), (122, 226)], C('#ffd23f'), None)
DECOR = {'castle': (castle, 120, 5), 'atlantis_temple': (temple, 112, 5), 'fountain': (fountain, 64, 5), 'town_house': (house, 72, 5), 'market_board': (board, 56, 5), 'auction_stage': (stage, 64, 5), 'mailbox': (mailbox, 40, 5),
         'coral0': (lambda c: coral_d(c, 0), 48, 5), 'coral1': (lambda c: coral_d(c, 1), 48, 5), 'coral2': (lambda c: coral_d(c, 2), 48, 5),
         'pumpkin': (pumpkin_d, 40, 5), 'bat_banner': (bat_banner, 40, 5), 'xmas_tree': (xmas_tree, 56, 5), 'present': (present_d, 36, 5), 'heart_balloon': (heart_balloon, 44, 5), 'egg': (egg, 36, 5), 'egg_basket': (egg_basket, 44, 5), 'party_lantern': (party_lantern, 44, 5)}

# ---------------------------------------------------------------- BUFF ICONS (16x16)
PAL = {'.': None, 'o': '#2a1a2a', 'r': '#e0245e', 'R': '#8a1a2a', 'w': '#ffffff', 'y': '#ffd23f', 'p': '#ff7aa8', 'b': '#4a9bff', 'c': '#7ae0ff', 'g': '#7bff9a', 'k': '#3a3a4a'}
BUFF_ICONS = {
 'sugar_rush': ['................', '....oooooooo....', '...oyyyrryyyo...', '..opwwyyrryyyo..', '.oprrwyyyyrrro..', '.orrrwwyyyrrro..', '..orrrwyyyrro...', '...oooyyyooo....', '......oyyo......', '.....oyyyyo.....', '.....oyrryo.....', '......oyyo......', '.....ooyyoo.....', '....ooyyyyoo....', '....oooooooo....', '................'],
 'vampirism': ['................', '...oooooooooo...', '..oRRRRRRRRRRo..', '..oRrrrrrrrrRo..', '..oRrwwrrwwrRo..', '..oRrwwrrwwrRo..', '..oRrrwrrwrrRo..', '..oRRrwrrwrRRo..', '...oRRrrrrRRo...', '....oRRrrRRo....', '.....oRRRRo.....', '......oRRo......', '.......oo.......', '................', '................', '................'],
 'gills': ['................', '..ooooooooooo...', '.occccccccccco..', '.ocbbbbbbbbbco..', '.ocbooboobobcco.', '.ocbooboobobcco.', '.ocbooboobobcco.', '.ocbbbbbbbbbco..', '..occcccccccco..', '...ooooooooooo..', '......oo.oo.....', '.....ocooco.....', '....occ..occ....', '...occ....occ...', '................', '................'],
}
