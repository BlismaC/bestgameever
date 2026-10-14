from sprite_lib import *
import math
C = lambda h, a=255: hexc(h, a)
G = lambda v: (v, v, v, 255)  # grays (weapons are tinted by material in-game: keep them LIGHT)
BLADE, METAL, WOOD, WRAP = G(236), G(214), G(196), G(160)

def grip(c, x0=22, x1=90, th=13, wrap=True):
    c.poly([(x0, 128 - th / 2), (x1, 128 - th / 2), (x1, 128 + th / 2), (x0, 128 + th / 2)], WOOD)
    if wrap:
        for x in range(x0 + 8, x1 - 4, 11): c.line([(x, 128 - th / 2), (x + 5, 128 + th / 2)], WRAP, 3)
    c.circ(x0 - 2, 128, th * .75, METAL, OUTLINE, 2.5)

def W_sword(c):
    grip(c, 24, 86)
    c.poly([(84, 92), (98, 92), (98, 164), (84, 164)], METAL)
    c.poly([(98, 116), (212, 114), (244, 128), (212, 142), (98, 140)], BLADE)
    c.line([(104, 128), (226, 128)], G(182), 3); c.line([(104, 119), (210, 117)], G(252), 2)
def W_dagger(c):
    grip(c, 26, 76, 12)
    c.poly([(72, 104), (84, 104), (84, 152), (72, 152)], METAL)
    c.poly([(84, 118), (170, 116), (206, 128), (170, 140), (84, 138)], BLADE); c.line([(90, 128), (190, 128)], G(182), 3)
def W_axe(c):
    c.poly([(26, 122), (210, 122), (210, 134), (26, 134)], WOOD)
    for x in range(40, 150, 14): c.line([(x, 122), (x + 6, 134)], WRAP, 3)
    c.circ(24, 128, 10, METAL, OUTLINE, 2.5)
    c.poly([(160, 118), (176, 70), (214, 40), (246, 52), (232, 100), (214, 128), (214, 128)], BLADE)
    c.poly([(160, 138), (176, 170), (200, 190), (214, 128)], METAL)
    c.line([(200, 62), (232, 66)], G(255), 3); c.line([(176, 100), (210, 124)], G(182), 3)
def W_pickaxe(c):
    c.poly([(26, 122), (206, 122), (206, 134), (26, 134)], WOOD)
    for x in range(40, 150, 14): c.line([(x, 122), (x + 6, 134)], WRAP, 3)
    c.circ(24, 128, 10, METAL, OUTLINE, 2.5)
    pts = c.bez((176, 30), (250, 62), (230, 128)) + c.bez((230, 128), (250, 194), (176, 226))[1:]
    c.outlined_line(pts, BLADE, 20)
    c.poly([(168, 20), (184, 36), (172, 44)], BLADE); c.poly([(168, 236), (184, 220), (172, 212)], BLADE)
    c.circ(206, 128, 14, METAL, OUTLINE, 2.5)
def W_spear(c):
    c.poly([(22, 123), (192, 123), (192, 133), (22, 133)], WOOD)
    for x in range(36, 150, 16): c.line([(x, 123), (x + 6, 133)], WRAP, 3)
    c.poly([(184, 112), (200, 112), (200, 144), (184, 144)], METAL)
    c.poly([(196, 100), (246, 128), (196, 156), (206, 128)], BLADE); c.line([(204, 128), (236, 128)], G(255), 3)
    c.poly([(170, 112), (160, 128), (170, 144)], G(180), None)
def W_hammer(c):
    c.poly([(26, 121), (186, 121), (186, 135), (26, 135)], WOOD)
    for x in range(40, 150, 14): c.line([(x, 121), (x + 6, 135)], WRAP, 3)
    c.circ(24, 128, 11, METAL, OUTLINE, 2.5)
    c.poly([(150, 70), (240, 66), (244, 190), (150, 186)], METAL)
    c.poly([(150, 70), (240, 66), (240, 82), (150, 86)], G(244), None)
    for x in (172, 218): c.poly([(x - 6, 66), (x + 6, 66), (x + 6, 190), (x - 6, 190)], G(176), None)
    c.circ(196, 128, 12, BLADE, OUTLINE, 2)
def W_scythe(c):
    c.poly([(22, 123), (180, 123), (180, 133), (22, 133)], WOOD)
    for x in range(36, 140, 16): c.line([(x, 123), (x + 6, 133)], WRAP, 3)
    outer = c.bez((168, 128), (190, 10), (250, 70)); inner = c.bez((250, 70), (206, 52), (176, 140))
    c.poly(outer + inner[1:], BLADE); c.line(c.bez((176, 124), (196, 36), (240, 68)), G(255), 3)
    c.circ(176, 128, 9, METAL, OUTLINE, 2)
def W_whip(c):
    grip(c, 24, 80, 14)
    pts = c.bez((80, 128), (120, 40), (160, 128)) + c.bez((160, 128), (200, 210), (244, 100))[1:]
    c.outlined_line(pts, WOOD, 9); c.circ(244, 100, 7, METAL, OUTLINE, 2)
def W_bow(c):
    limb = [(60 + 74 * math.sin(math.pi * u), 18 + 220 * u) for u in [i / 30 for i in range(31)]]
    c.outlined_line(limb, WOOD, 15); c.circ(60, 18, 7, METAL, OUTLINE, 2); c.circ(60, 238, 7, METAL, OUTLINE, 2)
    c.line([(60, 18), (60, 238)], G(250), 3)
    c.poly([(54, 112), (88, 112), (88, 144), (54, 144)], WRAP)
    c.line([(52, 128), (206, 128)], WOOD, 5); c.poly([(206, 118), (240, 128), (206, 138)], METAL); c.poly([(52, 128), (36, 118), (46, 128), (36, 138)], G(220))
def W_crossbow(c):
    c.poly([(22, 118), (170, 118), (190, 128), (170, 138), (22, 138)], WOOD)
    c.poly([(30, 112), (60, 112), (60, 144), (30, 144)], WRAP)
    pts = c.bez((150, 34), (214, 128), (150, 222)); c.outlined_line(pts, METAL, 15)
    c.line([(150, 34), (112, 128), (150, 222)], G(250), 3)
    c.line([(60, 128), (214, 128)], BLADE, 4); c.poly([(206, 120), (244, 128), (206, 136)], METAL)
def W_staff(c):
    c.poly([(20, 122), (196, 120), (196, 136), (20, 134)], WOOD)
    for x in range(36, 170, 20): c.line([(x, 122), (x + 4, 134)], WRAP, 3)
    for sgn in (-1, 1): c.outlined_line([(190, 128 + sgn * 6), (206, 128 + sgn * 34), (232, 128 + sgn * 22)], METAL, 8)
    c.glow(224, 128, 34, (255, 255, 255, 140)); c.circ(222, 128, 22, BLADE, OUTLINE, 3); c.circ(216, 120, 7, G(255), None, 0)
def W_wand(c):
    c.poly([(26, 122), (176, 124), (176, 134), (26, 134)], WOOD)
    c.poly([(26, 120), (60, 120), (60, 136), (26, 136)], WRAP)
    c.circ(180, 129, 9, METAL, OUTLINE, 2.5)
    c.glow(212, 128, 30, (255, 255, 255, 140)); c.star(212, 128, 26, 10, 4, BLADE, OUTLINE, 2.5, rot=.4)
def W_tome(c):
    c.poly([(52, 70), (206, 60), (214, 196), (58, 190)], WRAP)
    c.poly([(60, 78), (198, 70), (204, 186), (66, 180)], G(244), None)
    for i in range(5): c.line([(76, 96 + i * 18), (186, 90 + i * 18)], G(190), 3)
    c.poly([(48, 66), (62, 66), (68, 196), (54, 196)], METAL)
    c.star(150, 130, 26, 12, 4, BLADE, OUTLINE, 2, rot=.8)
def W_shuriken(c):
    c.star(128, 128, 104, 30, 4, BLADE, OUTLINE, 3, rot=.2)
    c.circ(128, 128, 26, G(120), OUTLINE, 3); c.circ(128, 128, 11, G(250), None, 0)
    for i in range(4):
        a = i * math.pi / 2 + .2; c.line([(128 + 36 * math.cos(a), 128 + 36 * math.sin(a)), (128 + 84 * math.cos(a), 128 + 84 * math.sin(a))], G(180), 3)

WEAPONS = {'sword': W_sword, 'dagger': W_dagger, 'axe': W_axe, 'pickaxe': W_pickaxe, 'spear': W_spear, 'hammer': W_hammer, 'scythe': W_scythe,
           'whip': W_whip, 'bow': W_bow, 'crossbow': W_crossbow, 'staff': W_staff, 'wand': W_wand, 'tome': W_tome, 'shuriken': W_shuriken}

# ---------------------------------------------------------------- unique weapons (full colour, used as-is)
def U_moo_stick(c):
    c.poly([(22, 120), (110, 118), (110, 138), (22, 136)], C('#8a5a30')); c.circ(20, 128, 11, C('#e8dcc0'), OUTLINE, 2.5)
    c.poly([(100, 100), (230, 82), (244, 128), (230, 174), (100, 156)], C('#f6f3ee'))
    for (x, y, rx, ry, r) in [(150, 110, 16, 10, .3), (196, 150, 18, 12, -.2), (214, 108, 10, 8, 0), (140, 146, 12, 9, .5)]: c.ell(x, y, rx, ry, C('#2b2b30'), None, 0, r)
    c.line([(104, 108), (226, 92)], (255, 255, 255, 255), 3)
def U_terra(c):
    c.glow(150, 128, 90, (100, 255, 170, 90)); grip(c, 24, 86); c.poly([(80, 82), (100, 82), (104, 174), (84, 174)], C('#2a8a5a'))
    c.poly([(100, 112), (200, 104), (246, 128), (200, 152), (100, 144)], C('#7cffb2')); c.poly([(100, 112), (200, 104), (246, 128), (100, 128)], C('#c9ffe0'), None)
    c.line([(108, 128), (232, 128)], C('#3ac27a'), 3); c.star(92, 128, 14, 6, 4, C('#e8fff0'), OUTLINE, 2)
def U_bfg(c):
    c.poly([(24, 106), (96, 100), (100, 168), (30, 174)], C('#4a5a48')); c.poly([(90, 98), (230, 104), (230, 152), (90, 158)], C('#6a7a68'))
    c.poly([(220, 94), (250, 100), (250, 156), (220, 162)], C('#2a3a28'))
    c.glow(166, 128, 34, (125, 255, 58, 200)); c.circ(166, 128, 22, C('#7dff3a'), OUTLINE, 3); c.circ(166, 128, 10, C('#eaffd0'), None, 0)
    for x in (110, 132, 198): c.line([(x, 106), (x, 152)], C('#2a3a28'), 4)
    c.poly([(50, 170), (74, 170), (66, 214), (44, 214)], C('#3a4a38'))
def U_duck(c):
    c.blob(110, 128, 66, 54, C('#ffe14a')); c.ell(96, 118, 36, 22, C('#ffe988'), None, 0, -.2)
    c.blob(176, 112, 34, 32, C('#ffe14a')); c.poly([(198, 106), (246, 112), (246, 126), (198, 130)], C('#ff9a1f'))
    c.circ(188, 102, 5, OUTLINE, None, 0); c.ell(92, 150, 34, 14, C('#f2c82a'), None, 0, .1)
    c.poly([(20, 124), (50, 112), (50, 148)], C('#ffe14a'))
def U_cube(c):
    c.poly([(24, 112), (140, 108), (146, 152), (30, 156)], C('#6a727e')); c.poly([(136, 96), (240, 96), (240, 160), (136, 160)], C('#8a92a0'))
    c.poly([(150, 70), (232, 70), (232, 186), (150, 186)], C('#d6dae2'), OUTLINE, 3) if False else None
    c.poly([(158, 76), (236, 76), (236, 180), (158, 180)], C('#e6e9ee')); c.line([(158, 128), (236, 128)], C('#9aa0aa'), 3); c.line([(197, 76), (197, 180)], C('#9aa0aa'), 3)
    c.circ(197, 128, 20, C('#ff7a9a'), OUTLINE, 3); c.star(197, 128, 12, 5, 5, C('#fff'), None, 0)
    c.poly([(40, 156), (70, 156), (60, 204), (34, 204)], C('#4a525e'))
def U_konami(c):
    px = 14
    def box(x, y, col): c.d.rectangle([x * SS, y * SS, (x + px) * SS, (y + px) * SS], fill=col)
    for i, x in enumerate(range(100, 244, px)):
        box(x, 128 - px // 2 - 8, C('#ff4d4d')); box(x, 128 + px // 2 - 6, C('#ffb3b3') if i % 2 else C('#c22a2a'))
    box(100 + 14 * 9, 128 - 22, C('#ff4d4d'))
    for x in range(24, 94, px): box(x, 120, C('#2a2a36'))
    c.d.rectangle([80 * SS, 90 * SS, 96 * SS, 168 * SS], fill=C('#f2c82a'))
    for (x, y) in [(86, 104), (86, 148)]: c.d.rectangle([(x - 3) * SS, (y - 3) * SS, (x + 5) * SS, (y + 5) * SS], fill=C('#2a2a36'))
def U_excalibur(c):
    c.glow(150, 128, 90, (255, 235, 150, 100)); grip(c, 24, 84); c.poly([(78, 84), (100, 80), (104, 176), (82, 172)], C('#ffd23f'))
    c.circ(90, 128, 10, C('#2f6bff'), OUTLINE, 2.5)
    c.poly([(104, 112), (210, 108), (246, 128), (210, 148), (104, 144)], C('#fff6d8')); c.poly([(104, 112), (210, 108), (246, 128), (104, 128)], C('#ffffff'), None)
    c.line([(110, 128), (230, 128)], C('#ffd88a'), 3)
def U_hiss(c):
    c.circ(122, 138, 66, C('#44cc44'), OUTLINE, 4); c.ell(100, 112, 30, 20, C('#8aea8a'), None, 0, -.5)
    c.poly([(116, 78), (132, 78), (136, 56), (112, 56)], C('#6a6f78'))
    c.line(c.bez((124, 56), (150, 30), (180, 52)), C('#c2a070'), 6); c.star(184, 50, 14, 5, 5, C('#ffe14a'), None, 0)
    c.glow(184, 50, 22, (255, 200, 60, 200))
    c.line([(100, 140), (112, 150)], OUTLINE, 5); c.line([(136, 140), (148, 150)], OUTLINE, 5); c.line(c.bez((98, 168), (122, 190), (146, 168)), OUTLINE, 6)
UNIQUES = {'moo_stick': U_moo_stick, 'totally_not_terra_blade': U_terra, 'bfg_9000ish': U_bfg, 'rubber_duck_blaster': U_duck,
           'companion_cube_launcher': U_cube, 'konami_blade': U_konami, 'excalibur_ish': U_excalibur, 'hissing_bomb': U_hiss}

# ---------------------------------------------------------------- item icons
def ingot(c, col, glint=True):
    g = C(col)
    for (x, y, s) in [(128, 150, 1.0), (96, 112, .86)]:
        w, h = 86 * s, 40 * s
        c.poly([(x - w, y + h), (x - w * .7, y - h), (x + w * .7, y - h), (x + w, y + h)], g)
        c.poly([(x - w * .7, y - h), (x + w * .7, y - h), (x + w * .58, y - h * .45), (x - w * .58, y - h * .45)], lite(g, .45), None)
        c.line([(x - w * .5, y + h * .6), (x + w * .5, y + h * .6)], dark(g, .3), 3)
def gem(c, col):
    g = C(col)
    pts = [(128, 40), (196, 84), (176, 188), (128, 222), (80, 188), (60, 84)]
    c.glow(128, 130, 90, g[:3] + (80,)); c.poly(pts, g, OUTLINE, 4)
    c.poly([(128, 40), (196, 84), (128, 96), (60, 84)], lite(g, .5), None); c.poly([(128, 96), (196, 84), (176, 188), (128, 222)], dark(g, .22), None); c.poly([(128, 96), (60, 84), (80, 188), (128, 222)], g, None)
    c.line([(88, 90), (110, 76)], (255, 255, 255, 200), 5)
def shard(c, col, hi):
    for (x, h, w) in [(90, 130, 30), (168, 112, 28), (128, 176, 42)]:
        g = C(col); c.poly([(x - w, 220), (x - w * .5, 220 - h * .8), (x, 220 - h), (x + w * .6, 220 - h * .8), (x + w, 220)], g)
        c.poly([(x, 220 - h), (x + w * .6, 220 - h * .8), (x + w, 220), (x, 220)], dark(g, .2), None); c.poly([(x - w * .5, 220 - h * .8), (x, 220 - h), (x - 2, 220)], C(hi), None)
def log(c):
    c.ell(128, 190, 90, 18, (0, 0, 0, 60), None, 0)
    c.poly([(36, 100), (200, 80), (210, 170), (46, 190)], C('#8a5a30')); c.ell(206, 126, 20, 46, C('#c58a4a'), OUTLINE, 3, .08); c.ell(206, 126, 12, 30, C('#a0703c'), None, 0, .08)
    for y in (116, 140, 164): c.line([(54, y), (190, y - 14)], dark(C('#8a5a30'), .35), 3)
def stone_icon(c):
    c.poly([(40, 190), (34, 120), (80, 70), (150, 60), (210, 100), (222, 176), (180, 210), (80, 212)], C('#8a8f98'))
    c.poly([(80, 70), (150, 60), (210, 100), (130, 120), (60, 114)], C('#b6bbc4'), None); c.line([(110, 140), (130, 190)], dark(C('#8a8f98'), .35), 3)
def bone(c):
    pts = [(70, 190), (186, 74)]
    c.outlined_line(pts, C('#ece7d6'), 28)
    for (x, y) in [(70, 190), (186, 74)]:
        for (dx, dy) in [(-16, 10), (10, -16)]: c.circ(x + dx, y + dy, 20, C('#ece7d6'), OUTLINE, 3)
    c.line([(100, 160), (156, 104)], (255, 255, 255, 200), 5)
def scale(c, col):
    g = C(col)
    c.poly([(128, 40), (200, 80), (190, 160), (128, 216), (66, 160), (56, 80)], g, OUTLINE, 4)
    for r in (70, 48, 26): c.d.arc([(128 - r) * SS, (120 - r) * SS, (128 + r) * SS, (120 + r) * SS], 200, 340, fill=lite(g, .4), width=4 * SS)
    c.poly([(128, 40), (200, 80), (128, 100), (56, 80)], lite(g, .35), None)
def orb(c, core, glowc, ring=None):
    c.glow(128, 128, 100, glowc); c.circ(128, 128, 62, C(core), OUTLINE, 4)
    c.ell(112, 108, 26, 18, (255, 255, 255, 90), None, 0, -.5)
    if ring: c.d.arc([48 * SS, 98 * SS, 208 * SS, 158 * SS], 0, 360, fill=C(ring), width=5 * SS)
def void_icon(c):
    c.glow(128, 128, 100, (130, 40, 230, 120)); c.circ(128, 128, 64, C('#8a2aff'), None, 0); c.circ(128, 128, 48, C('#05000a'), OUTLINE, 3)
    c.d.arc([48 * SS, 48 * SS, 208 * SS, 208 * SS], 20, 300, fill=C('#c8a0ff'), width=5 * SS)
def plasma(c):
    c.glow(128, 128, 100, (255, 77, 240, 130)); c.circ(128, 128, 58, C('#ff4df0'), OUTLINE, 4); c.circ(128, 128, 36, C('#ffc0fa'), None, 0)
    c.poly([(140, 60), (104, 136), (128, 136), (112, 204), (160, 112), (134, 112)], C('#ffffff'), None)
def celestial(c):
    c.glow(128, 128, 104, (255, 243, 168, 150)); c.star(128, 128, 96, 40, 8, C('#fff3a8'), OUTLINE, 3, rot=.2); c.circ(128, 128, 30, C('#ffffff'), None, 0)
def cursed(c):
    c.glow(128, 128, 100, (123, 255, 90, 120)); c.ell(128, 138, 62, 70, C('#2f6a28'), OUTLINE, 4)
    c.ell(128, 126, 50, 50, C('#7bff5a'), None, 0); c.ell(104, 116, 12, 16, C('#0a1a08'), None, 0, .2); c.ell(152, 116, 12, 16, C('#0a1a08'), None, 0, -.2); c.poly([(128, 138), (118, 158), (138, 158)], C('#0a1a08'), None)
    for x in (108, 128, 148): c.line([(x, 176), (x, 196)], C('#0a1a08'), 5)
def shadow_icon(c):
    c.soft(lambda d: d.ellipse([50 * SS, 50 * SS, 206 * SS, 206 * SS], fill=(75, 59, 120, 255)), 14); c.glow(128, 128, 80, (150, 100, 255, 100))
    for sgn in (-1, 1): c.ell(104 + (sgn + 1) * 24, 118, 14, 8, C('#bffcff'), None, 0, sgn * .3)
def mithril(c):
    ingot(c, '#6ff0e0'); c.star(190, 70, 20, 6, 4, C('#ffffff'), None, 0); c.star(70, 190, 12, 4, 4, C('#ffffff'), None, 0)
def meat(c):
    c.poly([(48, 150), (70, 90), (130, 58), (200, 78), (214, 140), (170, 196), (90, 196)], C('#d9534f'), OUTLINE, 4)
    c.poly([(70, 90), (130, 58), (200, 78), (150, 100)], lite(C('#d9534f'), .35), None)
    for pts in [[(86, 130), (160, 110)], [(96, 160), (170, 144)]]: c.line(pts, C('#f4b0a8'), 5)
    c.circ(168, 150, 20, C('#f2e2d2'), OUTLINE, 3)
def apple(c):
    c.circ(106, 140, 62, C('#e03c3c'), OUTLINE, 4); c.circ(150, 140, 62, C('#e03c3c'), OUTLINE, 4); c.circ(128, 150, 66, C('#e03c3c'), None, 0)
    c.ell(104, 116, 14, 24, (255, 255, 255, 110), None, 0, .4); c.line([(128, 92), (136, 54)], C('#6a4a2a'), 7); c.ell(158, 62, 24, 12, C('#4aa83a'), OUTLINE, 3, -.5)
def berries(c):
    for (x, y) in [(96, 150), (152, 144), (124, 106), (88, 108), (166, 100)]: c.circ(x, y, 34, C('#5b6dd8'), OUTLINE, 3); c.circ(x - 10, y - 12, 8, (255, 255, 255, 140), None, 0); c.circ(x + 6, y + 6, 6, C('#2a3498'), None, 0)
    c.ell(130, 60, 24, 11, C('#4aa83a'), OUTLINE, 3, -.3)
def cactus_flesh(c):
    c.poly([(70, 200), (60, 90), (100, 50), (160, 60), (190, 120), (180, 200)], C('#4aa856'), OUTLINE, 4)
    for x in (92, 126, 160): c.line([(x, 76), (x - 4, 196)], dark(C('#4aa856'), .25), 4)
    for (x, y) in [(100, 100), (146, 130), (112, 170)]: c.line([(x, y), (x + 8, y - 8)], C('#f5f0d0'), 3)
def leather(c):
    c.poly([(60, 70), (130, 50), (200, 74), (186, 120), (206, 170), (150, 206), (90, 196), (52, 150), (70, 110)], C('#8b5a2b'), OUTLINE, 4)
    c.poly([(60, 70), (130, 50), (200, 74), (130, 90)], lite(C('#8b5a2b'), .25), None)
    for (x, y) in [(86, 100), (86, 150), (170, 100), (170, 160)]: c.circ(x, y, 3.5, dark(C('#8b5a2b'), .45), None, 0)
def gel(c):
    c.ell(128, 150, 74, 58, C('#5fd35f', 230), OUTLINE, 4); c.ell(104, 128, 30, 18, (255, 255, 255, 120), None, 0, -.4)
    c.poly([(128, 40), (144, 90), (112, 90)], C('#5fd35f', 230), OUTLINE, 3)
def potion(c, liquid, glowc):
    c.glow(128, 150, 70, glowc); c.ell(128, 156, 66, 66, C('#bfe6ff', 130), OUTLINE, 4); c.ell(128, 168, 56, 52, C(liquid), None, 0)
    c.poly([(104, 100), (152, 100), (146, 56), (110, 56)], C('#bfe6ff', 150), OUTLINE, 3); c.poly([(100, 60), (156, 60), (152, 40), (104, 40)], C('#a0703c'), OUTLINE, 3)
    c.ell(104, 150, 10, 22, (255, 255, 255, 140), None, 0, .3)
def tome_xp(c):
    c.poly([(54, 64), (210, 56), (214, 196), (58, 200)], C('#6a3ab0'), OUTLINE, 4); c.poly([(64, 74), (200, 68), (204, 186), (68, 190)], C('#f4eefc'), None)
    c.star(134, 130, 36, 16, 4, C('#a45cff'), OUTLINE, 3, rot=.8); c.glow(134, 130, 50, (190, 120, 255, 140))
def milk(c):
    c.poly([(86, 90), (170, 90), (180, 214), (76, 214)], C('#f6f6f6', 230), OUTLINE, 4); c.poly([(80, 130), (176, 130), (180, 214), (76, 214)], C('#ffffff'), None)
    c.poly([(102, 90), (154, 90), (150, 52), (106, 52)], C('#e8e8e8', 230), OUTLINE, 3); c.ell(128, 46, 26, 11, C('#ff9a9a'), OUTLINE, 3)
    for (x, y, rx, ry) in [(112, 170, 14, 10), (148, 190, 12, 8)]: c.ell(x, y, rx, ry, C('#2b2b30'), None, 0)
    c.glow(128, 150, 90, (255, 240, 160, 90))
def amulet(c, col, symbol):
    c.line(c.bez((70, 30), (128, 100), (186, 30)), C('#8a8f98'), 7); c.glow(128, 150, 70, C(col)[:3] + (110,)); c.circ(128, 150, 54, C('#2a2a36'), OUTLINE, 4); c.circ(128, 150, 44, C(col), None, 0); symbol(c)
def sym_dot(c): c.circ(128, 150, 20, (255, 255, 255, 200), None, 0)
def sym_leaf(c): c.poly([(108, 170), (128, 120), (152, 136), (140, 170)], C('#ffffff', 220), None); c.line([(112, 168), (138, 132)], C('#2f8a38'), 3)
def sym_eye(c): c.ell(128, 150, 28, 18, C('#ffffff'), OUTLINE, 2); c.circ(128, 150, 9, C('#9a2aff'), None, 0)
def sym_gear(c): c.star(128, 150, 26, 18, 8, (255, 255, 255, 230), None, 0); c.circ(128, 150, 9, C('#444'), None, 0)
def sym_halo(c): c.d.arc([100 * SS, 122 * SS, 156 * SS, 178 * SS], 0, 360, fill=(255, 255, 255, 255), width=5 * SS)
def sym_fang(c): c.poly([(114, 120), (142, 120), (128, 184)], (255, 255, 255, 240), None)
def sym_snow(c):
    for i in range(3): a = i * math.pi / 3; c.line([(128 + 26 * math.cos(a), 150 + 26 * math.sin(a)), (128 - 26 * math.cos(a), 150 - 26 * math.sin(a))], (255, 255, 255, 240), 4)

MATERIAL_ICONS = {
    'wood': log, 'stone': stone_icon, 'bone': bone,
    'copper': lambda c: ingot(c, '#d8843a'), 'bronze': lambda c: ingot(c, '#b08d57'), 'iron': lambda c: ingot(c, '#b7bcc4'), 'steel': lambda c: ingot(c, '#8fa4b8'),
    'silver': lambda c: ingot(c, '#e4eaf2'), 'gold': lambda c: ingot(c, '#ffd23f'), 'titanium': lambda c: ingot(c, '#aab6c2'), 'mythril': mithril,
    'obsidian': lambda c: shard(c, '#2b1b3d', '#7a5ac0'), 'ice': lambda c: shard(c, '#9be7ff', '#e6fbff'),
    'jade': lambda c: gem(c, '#38b36f'), 'ruby': lambda c: gem(c, '#e0245e'), 'sapphire': lambda c: gem(c, '#2f6bff'), 'emerald': lambda c: gem(c, '#1fcf7a'), 'amethyst': lambda c: gem(c, '#a45cff'),
    'dragon': lambda c: scale(c, '#ff5a2a'), 'shadow': shadow_icon, 'cursed': cursed, 'void': void_icon, 'plasma': plasma, 'celestial': celestial,
}
OTHER_ICONS = {
    'meat': meat, 'apple': apple, 'berries': berries, 'cactus_flesh': cactus_flesh, 'leather': leather, 'slime_gel': gel,
    'potion_heal': lambda c: potion(c, '#ff4466', (255, 80, 110, 110)), 'potion_speed': lambda c: potion(c, '#ffe14a', (255, 225, 74, 120)),
    'tome_of_xp': tome_xp, 'holy_milk': milk,
    'summon_slime_king': lambda c: amulet(c, '#5fd35f', sym_dot), 'summon_elder_ent': lambda c: amulet(c, '#6b4423', sym_leaf), 'summon_pharaoh': lambda c: amulet(c, '#e6c34a', sym_dot),
    'summon_frost_titan': lambda c: amulet(c, '#4a9bff', sym_snow), 'summon_bog_horror': lambda c: amulet(c, '#6a8a3a', sym_eye), 'summon_magma_wyrm': lambda c: amulet(c, '#ff5a1a', sym_fang),
    'summon_lich_king': lambda c: amulet(c, '#7a2aff', sym_eye), 'summon_void_horror': lambda c: amulet(c, '#2a0a55', sym_eye), 'summon_clockwork_colossus': lambda c: amulet(c, '#8a96a8', sym_gear),
    'summon_celestial_guardian': lambda c: amulet(c, '#ffe27a', sym_halo),
}
