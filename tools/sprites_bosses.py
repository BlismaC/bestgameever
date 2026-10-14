from sprite_lib import *
from sprites_mobs import *
import math

def slime_king(c):
    slime(c, '#4fd04f', size=1.0)
    pts = [(120, 40), (136, 66), (160, 38), (176, 70), (200, 44), (198, 98), (128, 100)]
    c.poly([(110, 94), (110, 56), (132, 76), (150, 44), (168, 76), (190, 56), (190, 94)], C('#ffd23f'), OUTLINE, 3)
    for x, col in [(130, '#e0245e'), (150, '#2f6bff'), (170, '#1fcf7a')]: c.circ(x, 84, 6, C(col), OUTLINE, 1.5)
    c.rng  # keep deterministic

def elder_ent(c):
    bark = C('#6b4423')
    for i in range(8):
        a = math.radians(i * 45 + 10)
        c.outlined_line([(120, 128), (120 + 96 * math.cos(a), 128 + 96 * math.sin(a)), (120 + 116 * math.cos(a + .25), 128 + 116 * math.sin(a + .25))], bark, 16)
    for (x, y, r) in [(104, 92, 56), (104, 168, 56), (60, 128, 50), (150, 128, 52)]: c.blob(x, y, r, r, C('#2f8a38'))
    for (x, y, r) in [(84, 70, 30), (130, 80, 28), (70, 150, 28), (120, 170, 28)]: c.blob(x, y, r, r, C('#3fa648'))
    c.blob(176, 128, 40, 44, bark)
    for sgn in (-1, 1): c.ell(190, 128 + sgn * 15, 9, 7, C('#ffe14a'), OUTLINE, 2); c.glow(190, 128 + sgn * 15, 12, (255, 220, 60, 120))
    c.line(c.bez((198, 118), (210, 128), (198, 140)), OUTLINE, 5)
    for sgn in (-1, 1): c.poly([(160, 128 + sgn * 38), (176, 128 + sgn * 56), (186, 128 + sgn * 40)], C('#4a2f18'))

def pharaoh(c):
    gold = C('#e6c34a'); blue = C('#2a5ab0')
    for sgn in (-1, 1): c.outlined_line([(108, 128 + sgn * 62), (186, 128 + sgn * 70), (222, 128 + sgn * 46)], gold, 22); c.circ(222, 128 + sgn * 46, 14, C('#e0b896'), OUTLINE, 2)
    c.blob(106, 128, 46, 80, gold)
    for i in range(6): c.line([(70 + i * 12, 70), (74 + i * 12, 186)], dark(gold, .25), 3)
    c.poly([(84, 62), (84, 194), (130, 160), (130, 96)], blue, None) if False else None
    c.ell(120, 128, 24, 76, blue, None, 0)
    for i in range(7): c.line([(108, 70 + i * 19), (134, 70 + i * 19)], gold, 5)
    c.blob(158, 128, 52, 50, gold)
    for i in range(5): c.line([(124, 94 + i * 15), (190, 94 + i * 15)], blue, 7)
    c.ell(176, 128, 28, 30, C('#e0b896'), OUTLINE, 3)
    for sgn in (-1, 1): c.ell(184, 128 + sgn * 12, 8, 4.5, C('#111'), None, 0); c.line([(176, 128 + sgn * 12), (200, 128 + sgn * 16)], C('#2a5ab0'), 3)
    c.poly([(196, 110), (214, 128), (196, 146)], dark(gold, .15), None) if False else None
    c.poly([(192, 120), (232, 128), (192, 136)], C('#2a5ab0'), OUTLINE, 2)  # beard
    c.circ(148, 128, 10, C('#e0245e'), OUTLINE, 2)

def frost_titan(c):
    ice = C('#bfe8ff'); deep = C('#7ab8e0')
    for sgn in (-1, 1):
        c.outlined_line([(100, 128 + sgn * 70), (180, 128 + sgn * 90), (222, 128 + sgn * 50)], ice, 36)
        c.blob(222, 128 + sgn * 50, 26, 26, C('#e6fbff'))
    for i in range(9):
        a = math.radians(i * 40); c.poly([(110 + 60 * math.cos(a - .2), 128 + 80 * math.sin(a - .2)), (110 + 112 * math.cos(a), 128 + 112 * math.sin(a)), (110 + 60 * math.cos(a + .2), 128 + 80 * math.sin(a + .2))], deep)
    c.blob(110, 128, 66, 86, ice)
    for pts in [[(70, 90), (110, 120), (90, 160)], [(130, 70), (118, 108)], [(80, 130), (120, 130)]]: c.line(pts, lite(ice, .7), 3)
    c.blob(170, 128, 44, 42, C('#e6fbff'))
    for sgn in (-1, 1): c.poly([(150, 128 + sgn * 34), (160, 128 + sgn * 66), (182, 128 + sgn * 38)], C('#cfeeff'))
    for sgn in (-1, 1): c.ell(184, 128 + sgn * 14, 10, 6, C('#2a7aff'), OUTLINE, 2); c.glow(184, 128 + sgn * 14, 16, (60, 140, 255, 200))
    c.line(c.bez((196, 142), (206, 148), (196, 156)), OUTLINE, 3) if False else None

def bog_horror(c):
    skin = C('#5a7a3a')
    for i in range(10):
        a = math.radians(i * 36 + 8); r1, r2 = 70, 118
        pts = c.bez((128 + r1 * math.cos(a), 128 + r1 * math.sin(a)), (128 + 100 * math.cos(a + .6), 128 + 100 * math.sin(a + .6)), (128 + r2 * math.cos(a + .2), 128 + r2 * math.sin(a + .2)))
        c.outlined_line(pts, C('#6a2a6a'), 14)
        c.circ(pts[-1][0], pts[-1][1], 8, C('#8a3a8a'), OUTLINE, 2)
    c.blob(128, 128, 84, 78, skin)
    for (x, y, r) in [(90, 90, 12), (86, 150, 10), (120, 70, 8), (116, 190, 9)]: c.circ(x, y, r, dark(skin, .25), None, 0)
    for (x, y, r) in [(120, 100, 12), (140, 160, 10), (100, 128, 14), (160, 100, 9)]: c.circ(x, y, r, C('#f2f2d0'), OUTLINE, 2); c.circ(x + 3, y, r * .45, C('#c0262d'), None, 0)
    c.blob(190, 128, 34, 30, skin)
    c.circ(196, 128, 18, C('#f2f2d0'), OUTLINE, 3); c.circ(200, 128, 9, C('#c0262d'), None, 0); c.circ(202, 128, 4, OUTLINE, None, 0)
    c.glow(128, 128, 90, (122, 255, 90, 40))

def magma_wyrm(c):
    wyvern(c, '#3a2a2e', '#7a1a1a', '#ff7a1a')
    for pts in [[(60, 118), (100, 124), (140, 118)], [(150, 126), (176, 132)], [(100, 134), (130, 140)]]: c.line(pts, C('#ff7a1a'), 4)
    c.glow(120, 128, 70, (255, 90, 20, 70))
    for sgn in (-1, 1): c.ell(200, 128 + sgn * 10, 6, 5, C('#ffe14a'), OUTLINE, 1.5); c.glow(200, 128 + sgn * 10, 12, (255, 200, 40, 200))
    for sgn in (-1, 1): c.poly([(176, 128 + sgn * 22), (150, 128 + sgn * 62), (194, 128 + sgn * 30)], C('#c9b88a'))

def lich_king(c):
    for sgn in (-1, 1): c.outlined_line([(106, 128 + sgn * 66), (180, 128 + sgn * 74), (220, 128 + sgn * 50)], C('#4a2a7a'), 20); c.circ(220, 128 + sgn * 50, 13, C('#ece7d6'), OUTLINE, 2)
    c.poly([(130, 128), (30, 60), (50, 128), (30, 196)], C('#3a1a5a'), OUTLINE, 3)
    c.blob(108, 128, 44, 84, C('#5a2a8a'))
    for i in range(4): c.line([(84 + i * 12, 70), (92 + i * 12, 186)], C('#8a4ac0'), 3)
    c.blob(158, 128, 38, 38, C('#ece7d6'))
    for sgn in (-1, 1): c.circ(174, 128 + sgn * 13, 8, OUTLINE, None, 0); c.circ(176, 128 + sgn * 13, 4, C('#7aefff'), None, 0); c.glow(176, 128 + sgn * 13, 12, (100, 230, 255, 200))
    c.line([(186, 124), (186, 132)], OUTLINE, 3)
    pts = [(130, 98), (136, 70), (148, 90), (158, 62), (168, 90), (180, 70), (186, 98)]
    c.poly([(132, 100), (132, 68), (146, 86), (158, 56), (170, 86), (184, 68), (184, 100)], C('#ffd23f'))
    for x, col in [(146, '#e0245e'), (158, '#2f6bff'), (170, '#7bff5a')]: c.circ(x, 92, 4.5, C(col), OUTLINE, 1.2)
    c.line([(214, 40), (214, 220)], C('#4a3a2a'), 8); c.circ(214, 40, 18, C('#7a2aff'), OUTLINE, 3); c.glow(214, 40, 34, (140, 60, 255, 180))

def void_horror(c):
    def f(d):
        for i in range(12):
            a = math.radians(i * 30); pts = [(128 + 40 * math.cos(a - .3), 128 + 40 * math.sin(a - .3)), (128 + 122 * math.cos(a), 128 + 122 * math.sin(a)), (128 + 40 * math.cos(a + .3), 128 + 40 * math.sin(a + .3))]
            d.polygon([(x * SS, y * SS) for x, y in pts], fill=(90, 30, 160, 200))
    c.soft(f, 5)
    c.glow(128, 128, 110, (120, 40, 220, 90))
    c.circ(128, 128, 78, C('#07000f'), C('#7a2aff'), 5)
    for r, col in [(66, '#2a0a55'), (52, '#3a1070')]: c.circ(128, 128, r, C(col), None, 0)
    c.ell(150, 128, 38, 34, C('#f5eaff'), C('#b06aff'), 4)
    c.circ(158, 128, 20, C('#9a2aff'), None, 0); c.circ(162, 128, 11, C('#05000a'), None, 0); c.circ(158, 120, 4, (255, 255, 255, 255), None, 0)
    for i in range(8):
        a = math.radians(i * 45 + 20); c.line([(128 + 80 * math.cos(a), 128 + 80 * math.sin(a)), (128 + 108 * math.cos(a + .2), 128 + 108 * math.sin(a + .2))], C('#b06aff'), 3)

def clockwork_colossus(c):
    steel = C('#8a96a8')
    def gear(cx, cy, r, teeth, col, rot=0):
        pts = []
        for i in range(teeth * 2):
            rr = r if i % 2 == 0 else r * 0.8; a = rot + math.pi * i / teeth
            pts += [(cx + rr * math.cos(a - .08), cy + rr * math.sin(a - .08)), (cx + rr * math.cos(a + .08), cy + rr * math.sin(a + .08))]
        c.poly(pts, col, OUTLINE, 3)
    for sgn in (-1, 1):
        c.outlined_line([(104, 128 + sgn * 72), (170, 128 + sgn * 90), (214, 128 + sgn * 56)], dark(steel, .1), 30)
        gear(104, 128 + sgn * 72, 24, 8, C('#c6a050'), sgn)
        c.blob(214, 128 + sgn * 56, 24, 22, steel)
    c.blob(110, 128, 66, 84, steel)
    gear(100, 100, 30, 10, C('#c6a050')); gear(110, 160, 26, 9, C('#b08a40'), .3); gear(74, 134, 18, 7, C('#d6b060'))
    c.circ(100, 100, 10, dark(steel, .3), OUTLINE, 2)
    c.blob(176, 128, 36, 40, steel)
    c.ell(194, 128, 12, 32, C('#222'), OUTLINE, 3)
    c.circ(198, 128, 13, C('#ff2a2a'), OUTLINE, 3); c.glow(198, 128, 26, (255, 40, 40, 200)); c.circ(199, 125, 4, C('#ffbbbb'), None, 0)
    for sgn in (-1, 1): c.line([(170, 128 + sgn * 36), (194, 128 + sgn * 34)], dark(steel, .3), 4)
    for x, y in [(60, 90), (60, 166), (130, 64), (130, 192)]: c.circ(x, y, 5, dark(steel, .35), OUTLINE, 1.5)

def celestial_guardian(c):
    gold = C('#fff3a8')
    for sgn in (-1, 1):
        for k in range(5):
            c.poly([(120, 128 + sgn * 20), (60 - k * 6, 128 + sgn * (44 + k * 26)), (96 - k * 6, 128 + sgn * (50 + k * 26)), (130, 128 + sgn * 36)], lite(C('#ffffff'), 0) if k % 2 == 0 else C('#fff6c8'))
    c.glow(128, 128, 110, (255, 240, 160, 90))
    c.blob(112, 128, 46, 62, C('#ffffff'))
    c.line([(86, 90), (140, 128)], gold, 4); c.line([(86, 166), (140, 128)], gold, 4)
    c.blob(160, 128, 34, 34, C('#ffe9c8'))
    for sgn in (-1, 1): c.circ(176, 128 + sgn * 12, 5, C('#2a7aff'), OUTLINE, 1.5); c.glow(176, 128 + sgn * 12, 10, (120, 200, 255, 200))
    c.ell(160, 128, 56, 56, C('#ffd23f', 0), C('#ffe27a'), 5) if False else None
    for r, a in [(60, 255), (66, 120)]:
        c.d.arc([(160 - r) * SS, (128 - r) * SS, (160 + r) * SS, (128 + r) * SS], 0, 360, fill=(255, 226, 122, a), width=int(7 * SS))
    for sgn in (-1, 1): c.outlined_line([(130, 128 + sgn * 46), (206, 128 + sgn * 62)], C('#ffffff'), 14); c.circ(206, 128 + sgn * 62, 10, C('#ffe9c8'), OUTLINE, 2)
    c.line([(214, 40), (214, 216)], C('#ffd23f'), 6); c.star(214, 40, 20, 8, 6, C('#fff3a8'), OUTLINE, 2)

def cow_god(c):
    cc = C('#ffffff')
    c.glow(128, 128, 112, (255, 240, 160, 110))
    animal(c, cc, belly=C('#fdf6e6'), head=cc, brx=88, bry=62, hx=198, hr=40, snout=C('#f4a6a6'), ears='round', tail='rope', legs='#d9b878')
    for (x, y, rx, ry, rot) in [(78, 104, 24, 16, .4), (126, 156, 26, 18, -.3), (104, 92, 14, 10, 0), (158, 112, 16, 12, .2)]: c.ell(x, y, rx, ry, C('#ffe27a'), None, 0, rot)
    for sgn in (-1, 1): c.poly([(186, 128 + sgn * 34), (168, 128 + sgn * 62), (198, 128 + sgn * 46)], C('#ffd23f'))
    for sgn in (-1, 1): c.circ(206, 128 + sgn * 17, 7, C('#fff'), OUTLINE, 2); c.circ(208, 128 + sgn * 17, 3.5, C('#c8a82a'), None, 0)
    c.d.arc([140 * SS, 56 * SS, 220 * SS, 96 * SS], 180, 360, fill=(255, 226, 122, 255), width=int(8 * SS)) if False else None
    for r, a in [(56, 255)]:
        c.d.arc([(196 - r) * SS, (128 - r) * SS, (196 + r) * SS, (128 + r) * SS], 0, 360, fill=(255, 226, 122, a), width=int(6 * SS))
