from sprite_lib import *
import math

W = 256
C = lambda h, a=255: hexc(h, a)

def eyes(c, x, spread, r=7, col=(255, 255, 255, 255), pupil=OUTLINE, y=128, dx=2):
    for sgn in (-1, 1):
        c.circ(x, y + sgn * spread, r, col, OUTLINE, 2)
        c.circ(x + dx, y + sgn * spread, r * 0.5, pupil, None, 0)

def humanoid(c, skin, cloth, head_r=34, arm_len=88, shoulder=64, arms='forward', hand=None, torso_x=108, head_x=150):
    hand = hand or skin
    for sgn in (-1, 1):  # arms behind torso
        if arms == 'forward': tip = (torso_x + arm_len, 128 + sgn * 44)
        else: tip = (torso_x + 40, 128 + sgn * (shoulder + 18))
        c.outlined_line([(torso_x, 128 + sgn * shoulder * 0.8), tip], cloth, 17)
        c.circ(tip[0], tip[1], 12, hand, OUTLINE, 2)
    c.blob(torso_x, 128, 32, shoulder + 4, cloth)
    c.blob(head_x, 128, head_r, head_r, skin)

def animal(c, body, belly=None, head=None, bx=112, by=128, brx=80, bry=48, hx=196, hr=33, snout=None, ears='round', tail='short', legs='#3a3a42', ear_c=None):
    head = head or body; ear_c = ear_c or body
    for lx in (bx - 38, bx + 36):
        for sgn in (-1, 1):
            c.ell(lx, by + sgn * (bry - 2), 17, 11, C(legs), OUTLINE, 2)
    if tail == 'short': c.ell(bx - brx + 4, by, 15, 11, body, OUTLINE, 3)
    elif tail == 'bushy': c.poly([(bx - brx + 12, by - 14), (bx - brx - 36, by - 26), (bx - brx - 52, by), (bx - brx - 36, by + 26), (bx - brx + 12, by + 14)], body)
    elif tail == 'rope':
        c.line([(bx - brx + 4, by), (bx - brx - 20, by + 14), (bx - brx - 34, by - 6)], dark(C('#8a6a50'), 0.1), 5)
        c.circ(bx - brx - 34, by - 6, 8, C('#4a3a30'), OUTLINE, 2)
    c.blob(bx, by, brx, bry, body)
    if belly: c.ell(bx + 6, by, brx * 0.55, bry * 0.55, belly, None, 0)
    if ears == 'pointy':
        for sgn in (-1, 1): c.poly([(hx - 14, by + sgn * (hr - 8)), (hx - 30, by + sgn * (hr + 26)), (hx + 4, by + sgn * (hr - 2))], ear_c)
    elif ears == 'round':
        for sgn in (-1, 1): c.ell(hx - 14, by + sgn * (hr + 2), 12, 9, ear_c, OUTLINE, 2)
    c.blob(hx, by, hr, hr - 4, head)
    if snout: c.ell(hx + hr - 6, by, 18, 14, snout, OUTLINE, 2)

# ------------------------------------------------------------------ small mobs
def cow(c):
    cc = C('#f6f3ee')
    animal(c, cc, head=cc, brx=84, bry=52, hx=200, hr=34, snout=C('#f4a6a6'), ears='round', tail='rope', legs='#5a4a40')
    rng = c.rng
    for (x, y, rx, ry, rot) in [(78, 108, 22, 14, .4), (128, 150, 24, 16, -.3), (104, 96, 14, 10, 0), (150, 112, 18, 12, .2), (70, 150, 16, 12, .5)]:
        c.ell(x, y, rx, ry, C('#2b2b30'), None, 0, rot)
    for sgn in (-1, 1): c.poly([(188, 128 + sgn * 28), (176, 128 + sgn * 46), (194, 128 + sgn * 40)], C('#e8dcc0'))
    c.ell(210, 128, 6, 4, C('#e6867c'), None, 0)
    eyes(c, 204, 17, 5)

def chicken(c):
    for sgn in (-1, 1): c.poly([(60, 128 + sgn * 6), (24, 128 + sgn * 26), (20, 128 + sgn * 6), (24, 128)], C('#e8e0d0'))
    c.blob(120, 128, 54, 42, C('#fbf8f0'))
    for sgn in (-1, 1): c.ell(112, 128 + sgn * 34, 32, 14, C('#e3dccb'), OUTLINE, 2, sgn * .3)
    c.blob(172, 128, 24, 22, C('#fbf8f0'))
    c.poly([(192, 120), (222, 128), (192, 136)], C('#f5a623'))
    for i, x in enumerate([160, 170, 180]): c.circ(x, 128, 7 - i, C('#d92b2b'), OUTLINE, 1.5)
    eyes(c, 184, 12, 4, y=128)

def toad(c):
    for sgn in (-1, 1):
        c.ell(150, 128 + sgn * 58, 24, 12, C('#4a7d3a'), OUTLINE, 3, sgn * .5)
        c.ell(70, 128 + sgn * 56, 30, 14, C('#4a7d3a'), OUTLINE, 3, -sgn * .4)
    c.blob(118, 128, 70, 58, C('#6aa84f'))
    for (x, y, r) in [(90, 100, 9), (110, 160, 8), (70, 140, 7), (130, 112, 6)]: c.circ(x, y, r, C('#4b7f3a'), None, 0)
    c.blob(178, 128, 34, 40, C('#78b85a'))
    for sgn in (-1, 1):
        c.circ(186, 128 + sgn * 26, 15, C('#f5d84a'), OUTLINE, 3); c.circ(190, 128 + sgn * 26, 7, OUTLINE, None, 0)
    c.line([(206, 120), (214, 128), (206, 136)], dark(C('#3a6a2a'), .2), 3)

def slime(c, col='#5fd35f', crown=False, size=1.0):
    r = c.size / 2
    c.ell(r, r + 8, 98 * size, 78 * size, C(col, 235), OUTLINE, 4)
    c.ell(r - 24 * size, r - 22 * size, 54 * size, 38 * size, lite(C(col, 255), .35), None, 0, -.3)
    c.ell(r + 40 * size, r + 34 * size, 46 * size, 24 * size, dark(C(col, 255), .12), None, 0, .3)
    for (dx, dy, rr) in [(-50, 26, 6), (-20, 40, 5), (-70, -6, 4)]: c.circ(r + dx * size, r + dy * size, rr * size, lite(C(col, 255), .55), None, 0)
    eyes(c, r + 42 * size, 24 * size, 12 * size, y=r - 4)
    c.line(c.bez((r + 56 * size, r + 22 * size), (r + 66 * size, r + 34 * size), (r + 56 * size, r + 44 * size)), OUTLINE, 4)

def goblin(c):
    for sgn in (-1, 1): c.poly([(150, 128 + sgn * 28), (126, 128 + sgn * 78), (160, 128 + sgn * 38)], C('#6aa84f'))
    humanoid(c, C('#79b95a'), C('#7a5230'), 32, 84)
    c.line([(196, 170), (236, 150)], C('#c9ced6'), 8); c.line([(190, 174), (200, 166)], C('#5a3b20'), 8)
    eyes(c, 172, 14, 6, col=C('#ffe14a'), dx=3)
    c.line(c.bez((176, 132), (184, 140), (176, 146)), OUTLINE, 3)

def wolf(c, fur='#8d8d96', belly='#c9c9d2', eyec=None, tail_c=None):
    f = C(fur)
    animal(c, f, belly=C(belly), brx=84, bry=40, hx=194, hr=30, snout=lite(f, .22), ears='pointy', tail='bushy', legs='#3d3d46')
    for sgn in (-1, 1): c.poly([(226, 128 + sgn * 6), (246, 128 + sgn * 2), (230, 128 + sgn * 12)], OUTLINE, None)
    c.circ(244, 128, 6, OUTLINE, None, 0)
    eyes(c, 198, 14, 5, col=C(eyec or '#ffd45a'), dx=2)

def spider(c):
    body = C('#3a2a3a')
    for i, a in enumerate([-70, -35, 10, 55]):
        for sgn in (-1, 1):
            ang = math.radians(a) * sgn if a != 10 else 0
            bx, by = 128 + 10 + (i - 1.5) * 16, 128 + sgn * 18
            mid = (bx + 20 * (1 if i > 1 else -0.2) + 20, by + sgn * 52); tip = (bx + (i - 1.5) * 26 + 14, by + sgn * 100)
            c.outlined_line([(bx, by), mid, tip], C('#5a3a5a'), 7)
    c.blob(98, 128, 54, 46, body)
    c.ell(92, 128, 22, 14, C('#a82a2a'), None, 0)
    c.blob(166, 128, 30, 28, body)
    for dy in (-10, 10): c.circ(186, 128 + dy, 6, C('#ff3a3a'), OUTLINE, 1.5)
    for dy in (-20, 20): c.circ(180, 128 + dy, 4, C('#ff3a3a'), OUTLINE, 1.5)
    for sgn in (-1, 1): c.poly([(190, 128 + sgn * 6), (214, 128 + sgn * 10), (196, 128 + sgn * 14)], C('#e8e0d0'))

def skeleton(c):
    humanoid(c, C('#ece7d6'), C('#cfc9b4'), 32, 84, hand=C('#ece7d6'))
    for i in range(4): c.line([(100, 96 + i * 22), (126, 96 + i * 22)], dark(C('#cfc9b4'), .25), 3)
    c.line([(108, 70), (108, 186)], dark(C('#cfc9b4'), .25), 3)
    for sgn in (-1, 1): c.circ(172, 128 + sgn * 13, 7.5, OUTLINE, None, 0)
    c.line([(182, 124), (182, 132)], OUTLINE, 3)
    pts = c.bez((210, 70), (244, 128), (210, 186))
    c.outlined_line(pts, C('#8a5a30'), 7); c.line([(210, 70), (210, 186)], C('#eeeeee'), 2)

def zombie(c):
    humanoid(c, C('#7f9f6a'), C('#4a5a8a'), 33, 100, arms='forward')
    for (x, y) in [(96, 84), (110, 160), (124, 118)]: c.ell(x, y, 9, 6, C('#2e3a5c'), None, 0, .5)
    for sgn in (-1, 1): c.circ(173, 128 + sgn * 14, 7, C('#e8e8c0'), OUTLINE, 2); c.circ(175, 128 + sgn * 14, 3, OUTLINE, None, 0)
    c.line(c.bez((180, 122), (186, 128), (180, 136)), C('#3a1a1a'), 4)
    c.ell(150, 112, 10, 6, C('#a04a4a'), None, 0, .6)

def bandit(c):
    humanoid(c, C('#d9b08c'), C('#3a3a46'), 33, 86, hand=C('#d9b08c'))
    c.ell(150, 128, 34, 34, C('#2b2b36'), OUTLINE, 3)
    c.poly([(128, 112), (178, 108), (178, 124), (128, 128)], C('#a82a2a'))
    c.circ(150, 128, 33, C('#2b2b36', 0), OUTLINE, 3) if False else None
    c.ell(170, 128, 22, 30, C('#e0b896'), None, 0)
    for sgn in (-1, 1): c.circ(176, 128 + sgn * 12, 5, OUTLINE, None, 0)
    c.poly([(160, 118), (182, 116), (182, 140), (160, 138)], C('#a82a2a'))
    for (y, ang) in [(76, -.3), (180, .3)]: c.line([(192, y), (232, y + ang * 60)], C('#d5dae2'), 8)

def scorpion(c):
    shell = C('#b0603a')
    for sgn in (-1, 1):
        for i in range(4): c.outlined_line([(110 + i * 16, 128 + sgn * 22), (110 + i * 16 + 12, 128 + sgn * 58)], C('#8a4a2a'), 6)
        c.outlined_line([(190, 128 + sgn * 18), (214, 128 + sgn * 54), (240, 128 + sgn * 40)], shell, 12)
        c.poly([(240, 128 + sgn * 40), (254, 128 + sgn * 26), (250, 128 + sgn * 54)], C('#d6805a'))
    pts = c.bez((70, 128), (14, 128), (42, 70)) + c.bez((42, 70), (80, 38), (150, 56))[1:]
    c.outlined_line(pts, shell, 16); c.star(150, 56, 12, 4, 3, C('#e8d44a'), OUTLINE, 2, rot=.5)
    for i in range(4): c.blob(150 - i * 18, 128, 38 - i * 5, 34 - i * 4, lite(shell, .08 * i))
    c.blob(188, 128, 26, 24, shell)
    for sgn in (-1, 1): c.circ(198, 128 + sgn * 9, 4, OUTLINE, None, 0)

def mummy(c):
    humanoid(c, C('#e7dcb5'), C('#e7dcb5'), 34, 100)
    for i in range(6): c.line([(98 + i * 8, 76), (110 + i * 8, 180)], dark(C('#e7dcb5'), .25), 2.5)
    for i in range(5): c.line([(124, 100 + i * 14), (180, 90 + i * 20)], dark(C('#e7dcb5'), .25), 2.5)
    c.line([(130, 118), (176, 108)], dark(C('#e7dcb5'), .25), 3); c.line([(130, 140), (176, 150)], dark(C('#e7dcb5'), .25), 3)
    for sgn in (-1, 1): c.circ(176, 128 + sgn * 13, 6, C('#6aefff'), OUTLINE, 1.5)

def yeti(c):
    fur = C('#e9f2f9')
    for sgn in (-1, 1):
        c.outlined_line([(100, 128 + sgn * 62), (180, 128 + sgn * 80), (214, 128 + sgn * 46)], fur, 30)
        c.circ(214, 128 + sgn * 46, 18, lite(fur, .1), OUTLINE, 3)
        for i in range(3): c.line([(216 + i * 3, 128 + sgn * (36 + i * 8)), (232 + i * 3, 128 + sgn * (32 + i * 9))], C('#9fb6c6'), 4)
    c.blob(108, 128, 52, 84, fur)
    for i in range(6): c.line([(80 + i * 4, 70 + i * 22), (96 + i * 4, 78 + i * 22)], C('#c4d6e2'), 3)
    c.blob(160, 128, 42, 40, fur)
    c.ell(172, 128, 26, 26, C('#9cc8e8'), None, 0)
    for sgn in (-1, 1):
        c.circ(180, 128 + sgn * 12, 6, OUTLINE, None, 0); c.circ(182, 126 + sgn * 12, 2, (255, 255, 255, 255), None, 0)
        c.poly([(182, 128 + sgn * 4), (176, 128 + sgn * 10), (190, 128 + sgn * 12)], C('#ffffff'), None)
    c.line([(186, 124), (186, 134)], OUTLINE, 3)

def bog_witch(c):
    for sgn in (-1, 1): c.outlined_line([(108, 128 + sgn * 50), (190, 128 + sgn * 56)], C('#5a7a4a'), 15); c.circ(190, 128 + sgn * 56, 11, C('#7ea05a'), OUTLINE, 2)
    c.blob(108, 128, 34, 70, C('#4a3a6a'))
    c.blob(150, 128, 32, 32, C('#8fae6a'))
    c.line([(214, 52), (214, 214)], C('#6a4a2a'), 7); c.circ(214, 52, 15, C('#7bff5a'), OUTLINE, 3); c.glow(214, 52, 28, (123, 255, 90, 120))
    c.circ(150, 128, 52, C('#2a1f3d'), OUTLINE, 3); c.circ(150, 128, 38, C('#3a2a52'), None, 0); c.circ(150, 128, 18, C('#241a36'), OUTLINE, 2)
    c.ell(150, 128, 52, 8, C('#d9a441'), None, 0, math.pi / 2)  # hat band
    c.poly([(184, 108), (196, 128), (184, 148), (170, 128)], C('#c58a2b')) if False else None
    c.circ(175, 128, 3, C('#7bff5a'), None, 0)

def lava_imp(c):
    for sgn in (-1, 1): c.poly([(98, 128 + sgn * 24), (50, 128 + sgn * 90), (112, 128 + sgn * 60)], C('#7a1f1f'))
    c.line(c.bez((84, 128), (40, 150), (30, 112)), C('#c43a1f'), 7); c.poly([(30, 112), (14, 100), (24, 124)], C('#e8502a'))
    humanoid(c, C('#e8502a'), C('#c43a1f'), 28, 84, arms='forward', shoulder=52)
    for sgn in (-1, 1): c.poly([(150, 128 + sgn * 20), (168, 128 + sgn * 46), (136, 128 + sgn * 30)], C('#3a1a1a'))
    eyes(c, 168, 11, 5.5, col=C('#ffe14a'), dx=2)
    c.circ(206, 94, 16, C('#ff9a1f'), OUTLINE, 3); c.glow(206, 94, 30, (255, 140, 30, 150)); c.circ(206, 94, 8, C('#ffe27a'), None, 0)

def magma_golem(c, scale=1.0):
    rock = C('#5a3a38')
    for sgn in (-1, 1):
        c.blob(150, 128 + sgn * 92, 38, 30, rock); c.blob(206, 128 + sgn * 66, 28, 24, dark(rock, .1))
    c.blob(110, 128, 72, 88, rock)
    for pts in [[(70, 70), (98, 110), (80, 140), (110, 176)], [(118, 60), (126, 100), (150, 130)], [(60, 128), (96, 124)], [(120, 190), (130, 150), (160, 140)]]:
        c.line(pts, C('#ff7a1a'), 6)
    c.glow(110, 128, 70, (255, 90, 20, 70))
    c.blob(176, 128, 40, 38, dark(rock, .1))
    for sgn in (-1, 1): c.ell(192, 128 + sgn * 14, 9, 6, C('#ffd23f'), OUTLINE, 2); c.glow(192, 128 + sgn * 14, 12, (255, 200, 40, 160))
    c.line([(196, 120), (196, 136)], C('#ff7a1a'), 4)

def shadow_wraith(c):
    def f(d):
        d.polygon([(x * SS, y * SS) for x, y in [(20, 128), (70, 70), (150, 64), (214, 100), (230, 128), (214, 156), (150, 192), (70, 186)]], fill=(60, 40, 110, 230))
        d.ellipse([60 * SS, 90 * SS, 190 * SS, 166 * SS], fill=(40, 24, 80, 255))
    c.soft(f, 7)
    def f2(d):
        for k in range(5): d.polygon([(x * SS, y * SS) for x, y in [(80 - k * 14, 128 + (k - 2) * 34), (130, 128 + (k - 2) * 18), (100 - k * 10, 128 + (k - 2) * 44)]], fill=(90, 60, 160, 150))
    c.soft(f2, 3)
    c.circ(168, 128, 36, C('#241a4a', 255), None, 0)
    for sgn in (-1, 1): c.ell(184, 128 + sgn * 14, 11, 7, C('#bffcff'), None, 0, sgn * .3); c.glow(184, 128 + sgn * 14, 14, (140, 240, 255, 180))

def wyvern(c, body='#c44a2a', wing='#8a2a1a', belly='#e8b878', scale=1.0, boss=False):
    b = C(body); w = C(wing)
    for sgn in (-1, 1):
        c.poly([(120, 128 + sgn * 24), (80, 128 + sgn * 120), (30, 128 + sgn * 100), (60, 128 + sgn * 66), (34, 128 + sgn * 52), (74, 128 + sgn * 36)], w)
        c.line([(120, 128 + sgn * 24), (80, 128 + sgn * 120)], dark(w, .3), 5); c.line([(110, 128 + sgn * 30), (34, 128 + sgn * 100)], dark(w, .3), 4)
    c.poly([(70, 114), (14, 126), (70, 142)], b)
    c.poly([(30, 124), (6, 128), (30, 132), (18, 128)], dark(b, .3))
    c.blob(120, 128, 70, 34, b)
    c.ell(130, 128, 44, 18, C(belly), None, 0)
    for i in range(5): c.poly([(70 + i * 22, 122), (78 + i * 22, 112), (86 + i * 22, 122)], dark(b, .25), None)
    c.blob(188, 128, 32, 26, b)
    c.poly([(210, 118), (246, 124), (246, 132), (210, 140)], b)
    for sgn in (-1, 1): c.poly([(182, 128 + sgn * 18), (160, 128 + sgn * 42), (192, 128 + sgn * 26)], C('#e8dcc0')); c.circ(200, 128 + sgn * 10, 5, C('#ffe14a'), OUTLINE, 1.5)
