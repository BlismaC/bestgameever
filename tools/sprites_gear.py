from sprite_lib import *
from sprites_mobs import wolf
import sprites_mobs as M
import math
C = lambda h, a=255: hexc(h, a)

def _pal(L):
    pri = C(L['pri']); return pri, C(L.get('sec') or L['pri']), C(L.get('trim') or '#ffffff'), L.get('glow')

def helmet(c, L):
    pri, sec, trim, glow = _pal(L); st = L.get('helm', 'helm')
    if st == 'horns':
        for sgn in (-1, 1): c.poly([(128 + sgn * 56, 110), (128 + sgn * 100, 40), (128 + sgn * 84, 112)], C('#f0ead8'))
    if st == 'spiky':
        for i in range(7): a = math.pi * (1 + i / 6); c.poly([(128 + 66 * math.cos(a - .12), 134 + 62 * math.sin(a - .12)), (128 + 108 * math.cos(a), 134 + 106 * math.sin(a)), (128 + 66 * math.cos(a + .12), 134 + 62 * math.sin(a + .12))], lite(pri, .2))
    if st == 'hood': c.ell(128, 134, 88, 92, sec, OUTLINE, 4)
    c.ell(128, 130, 78, 74, pri, OUTLINE, 5); c.ell(104, 98, 40, 26, lite(pri, .35), None, 0, -.4)
    if st in ('helm', 'visor', 'spiky'): c.poly([(60, 150), (196, 150), (186, 196), (70, 196)], dark(pri, .15), OUTLINE, 3)
    if st in ('visor', 'spiky', 'helm'):
        c.poly([(70, 120), (186, 120), (178, 150), (78, 150)], C('#15151c'), OUTLINE, 2)
        if glow: c.glow(128, 134, 28, C(glow)[:3] + (180,)); c.line([(84, 134), (172, 134)], C(glow), 6)
    if st == 'hood': c.ell(128, 140, 46, 52, C('#15151c'), None, 0)
    if glow and st == 'hood': c.circ(112, 138, 6, C(glow), None, 0); c.circ(144, 138, 6, C(glow), None, 0)
    if st == 'cap': c.line([(56, 140), (200, 140)], dark(pri, .3), 8)
    if st == 'crown':
        c.poly([(58, 84), (58, 30), (92, 60), (128, 16), (164, 60), (198, 30), (198, 84)], C('#ffd23f'), OUTLINE, 3)
        for x, col in [(92, '#e0245e'), (128, '#2f6bff'), (164, '#1fcf7a')]: c.circ(x, 70, 7, C(col), OUTLINE, 2)
    if st == 'eye': c.ell(128, 128, 36, 30, C('#f4ece4'), OUTLINE, 3); c.circ(128, 128, 18, C('#c0262d'), None, 0); c.circ(128, 128, 8, C('#05000a'), None, 0)
    if st == 'nemes':
        for sgn in (-1, 1): c.poly([(128 + sgn * 50, 90), (128 + sgn * 100, 120), (128 + sgn * 96, 220), (128 + sgn * 54, 200)], sec)
        for y in range(100, 200, 16): c.line([(34, y), (222, y)], trim, 4)
        c.ell(128, 130, 56, 62, C('#e0b896'), OUTLINE, 3)
        for sgn in (-1, 1): c.ell(128 + sgn * 22, 124, 9, 5, C('#111'), None, 0)

def chest(c, L):
    pri, sec, trim, glow = _pal(L); st = L.get('chest', 'plate')
    if L.get('wings'):
        for sgn in (-1, 1):
            for k in range(4): c.poly([(128 + sgn * 30, 100 + k * 12), (128 + sgn * (100 + k * 18), 40 + k * 28), (128 + sgn * (90 + k * 14), 70 + k * 28)], lite(trim, .3 - k * .04))
    if L.get('cape'): c.poly([(70, 90), (186, 90), (206, 236), (50, 236)], dark(C('#7a1a2a'), .1), OUTLINE, 3)
    if st == 'robe':
        c.poly([(76, 70), (180, 70), (210, 232), (46, 232)], pri, OUTLINE, 4); c.poly([(76, 70), (128, 96), (180, 70), (168, 120), (88, 120)], sec, None); c.line([(120, 96), (120, 232)], sec, 6)
    else: c.poly([(78, 66), (178, 66), (196, 220), (60, 220)], pri, OUTLINE, 4)
    c.poly([(78, 66), (178, 66), (172, 96), (84, 96)], lite(pri, .3), None)
    for sgn in (-1, 1): c.ell(128 + sgn * 84, 82, 34, 28, sec, OUTLINE, 4); c.ell(128 + sgn * 84, 76, 20, 12, lite(sec, .3), None, 0)
    if st == 'plate':
        c.line([(128, 96), (128, 206)], dark(pri, .4), 5)
        for y in (120, 148, 176): c.line([(80, y), (176, y)], dark(pri, .35), 4)
        c.ell(128, 126, 20, 20, trim, OUTLINE, 3)
        if glow: c.glow(128, 126, 24, C(glow)[:3] + (170,)); c.circ(128, 126, 9, C(glow), None, 0)
    if st == 'leather':
        for pts in [[(88, 90), (168, 200)], [(168, 90), (88, 200)]]: c.line(pts, dark(pri, .45), 8)
        c.poly([(70, 176), (186, 176), (190, 196), (66, 196)], dark(sec, .1), OUTLINE, 2); c.ell(128, 186, 12, 10, trim, OUTLINE, 2)
    if st == 'robe' and glow: c.glow(128, 150, 26, C(glow)[:3] + (120,))

def legs(c, L):
    pri, sec, trim, glow = _pal(L)
    for sgn in (-1, 1):
        x = 128 + sgn * 38
        c.poly([(x - 36, 40), (x + 36, 40), (x + 30, 200), (x - 30, 200)], pri, OUTLINE, 4)
        c.poly([(x - 36, 40), (x + 36, 40), (x + 34, 70), (x - 34, 70)], lite(pri, .3), None)
        c.ell(x, 118, 32, 22, sec, OUTLINE, 3); c.ell(x - 6, 112, 14, 8, lite(sec, .3), None, 0)
        c.poly([(x - 34, 196), (x + 34, 196), (x + 40, 230), (x - 40, 230)], dark(sec, .2), OUTLINE, 3)
    c.poly([(60, 34), (196, 34), (200, 56), (56, 56)], sec, OUTLINE, 3); c.ell(128, 45, 14, 10, trim, OUTLINE, 2)
    if glow: c.glow(128, 118, 20, C(glow)[:3] + (110,))

def broom(c):
    c.outlined_line([(20, 150), (190, 112)], C('#8a5a30'), 12)
    for k in range(9): c.line([(176 + k * 2, 112 + (k - 4) * 7), (246, 96 + (k - 4) * 14)], C('#d8b84a') if k % 2 else C('#b8923a'), 7)
    c.outlined_line([(170, 94), (190, 130)], C('#5a3b20'), 6)
def glider(c):
    for sgn in (-1, 1):
        c.poly([(110, 128 + sgn * 10), (56, 128 + sgn * 108), (180, 128 + sgn * 70), (214, 128 + sgn * 20)], C('#f0f6ff'), OUTLINE, 3)
        for k in range(5): c.line([(110 - k * 4, 128 + sgn * (14 + k * 6)), (70 + k * 22, 128 + sgn * (96 - k * 10))], C('#b8c8e0'), 3)
    c.blob(128, 128, 46, 22, C('#c0a070'))
def carpet(c):
    c.poly([(20, 80), (236, 70), (244, 186), (14, 176)], C('#c0262d'), OUTLINE, 4); c.poly([(40, 100), (218, 94), (224, 158), (36, 152)], C('#e04a4a'), None)
    for x in (70, 128, 186): c.star(x, 126, 22, 10, 4, C('#ffd23f'), OUTLINE, 2)
    for y in range(86, 186, 16): c.line([(8, y), (20, y + 2)], C('#ffd23f'), 4); c.line([(236, y - 8), (248, y - 6)], C('#ffd23f'), 4)
def wyrm(c): M.wyvern(c, '#c44a2a', '#8a2a1a', '#ffb02e'); c.poly([(110, 96), (150, 96), (150, 160), (110, 160)], C('#6a3a1a'), OUTLINE, 3)
def dire(c): wolf(c, '#3a3a44', '#6a6a76', '#ff5a3a'); c.poly([(100, 100), (150, 100), (150, 156), (100, 156)], C('#7a4a1a'), OUTLINE, 3)
MOUNTS = {'cloud_glider': glider, 'witch_broom': broom, 'magic_carpet': carpet, 'wyrm_saddle': wyrm, 'dire_wolf': dire}

def _eyes(c, x=150, y=118, d=26, r=9):
    for sgn in (-1, 1): c.circ(x, y + sgn * d / 2, r, C('#ffffff'), OUTLINE, 2); c.circ(x + 2, y + sgn * d / 2, r * .5, C('#15151c'), None, 0)
def pal_body(c, col, kind):
    cc = C(col)
    if kind == 'rocklet': c.blob(124, 134, 72, 62, cc); c.ell(100, 112, 24, 14, lite(cc, .3), None, 0, -.4); _eyes(c, 160, 128)
    elif kind == 'cuprit':
        c.poly([(54, 150), (70, 90), (120, 64), (176, 80), (200, 130), (170, 190), (90, 196)], cc, OUTLINE, 4); c.poly([(70, 90), (120, 64), (176, 80), (130, 100)], lite(cc, .4), None); _eyes(c, 164, 130)
    elif kind == 'ferrox': c.poly([(56, 70), (200, 70), (210, 190), (46, 190)], cc, OUTLINE, 4); c.poly([(56, 70), (200, 70), (194, 92), (62, 92)], lite(cc, .4), None)
    elif kind == 'glimmer':
        c.blob(110, 140, 64, 46, cc); c.blob(170, 118, 36, 32, cc)
        for sgn in (-1, 1): c.poly([(160, 118 + sgn * 22), (150, 118 + sgn * 62), (184, 118 + sgn * 36)], lite(cc, .2))
        c.poly([(54, 140), (8, 110), (28, 150), (8, 176)], lite(cc, .3), OUTLINE, 3)
    elif kind == 'emberpup':
        c.blob(110, 140, 62, 46, cc); c.blob(168, 118, 38, 34, cc); c.glow(40, 140, 28, (255, 160, 40, 150))
        c.poly([(54, 140), (14, 100), (22, 150), (6, 176), (54, 160)], C('#ffd23f'), OUTLINE, 3)
        for sgn in (-1, 1): c.poly([(160, 118 + sgn * 24), (150, 118 + sgn * 58), (184, 118 + sgn * 34)], dark(cc, .2))
    elif kind == 'frostling':
        c.blob(124, 134, 66, 58, cc); c.star(124, 100, 22, 8, 6, C('#ffffff'), OUTLINE, 2); c.glow(124, 134, 40, (155, 231, 255, 110))
    elif kind == 'jadeling':
        c.poly([(128, 40), (196, 90), (176, 190), (128, 222), (80, 190), (60, 90)], cc, OUTLINE, 4); c.poly([(128, 40), (196, 90), (128, 104), (60, 90)], lite(cc, .5), None)
        for sgn in (-1, 1): c.ell(128 + sgn * 70, 70, 20, 12, C('#4ad04a'), OUTLINE, 2, sgn * .6)
    elif kind == 'voidmote':
        c.glow(128, 128, 46, (154, 74, 255, 160)); c.circ(128, 134, 64, C('#0a0014'), C('#9a4aff'), 5); c.ell(136, 130, 36, 28, C('#f5eaff'), OUTLINE, 3); c.circ(142, 130, 14, C('#9a2aff'), None, 0); c.circ(145, 130, 7, C('#05000a'), None, 0)
    if kind == 'ferrox': _eyes(c, 140, 128, 40, 10)
    elif kind == 'frostling': _eyes(c, 150, 138)
    elif kind in ('glimmer', 'emberpup'): _eyes(c, 176, 112, 22, 6)
    elif kind == 'jadeling': _eyes(c, 128, 120, 40, 9)
PALS = ['rocklet', 'cuprit', 'ferrox', 'glimmer', 'emberpup', 'frostling', 'jadeling', 'voidmote']
