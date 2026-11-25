from sprite_lib import *
from sprites_mobs import humanoid, eyes, animal, wolf, slime, C as _C
import sprites_mobs as M, sprites_bosses as B, sprites_world as Wd, sprites_items as I
import math
C = lambda h, a=255: hexc(h, a)

def snake(c, col, belly='#e8e0b0'):
    pts = [(30 + i * 14, 128 + math.sin(i * 0.9) * 34) for i in range(15)]
    for i, (x, y) in enumerate(pts):
        r = 12 + i * 1.1; c.circ(x, y, r, C(col), OUTLINE, 3)
    for i, (x, y) in enumerate(pts): c.circ(x, y, 6 + i * 0.4, lite(C(col), .25), None, 0)
    x, y = pts[-1]; c.blob(x + 12, y, 24, 18, C(col))
    for sgn in (-1, 1): c.circ(x + 20, y + sgn * 9, 4.5, C('#ffe14a'), OUTLINE, 1.5); c.circ(x + 21, y + sgn * 9, 2, OUTLINE, None, 0)
    c.line([(x + 34, y), (x + 50, y - 4), (x + 56, y - 9)], C('#e0245e'), 3); c.line([(x + 50, y - 4), (x + 56, y + 2)], C('#e0245e'), 3)

def bat(c, col, wing=None, eye='#ff3a3a'):
    w = C(wing or col)
    for sgn in (-1, 1):
        pts = [(120, 128 + sgn * 14), (96, 128 + sgn * 70), (60, 128 + sgn * 112), (74, 128 + sgn * 84), (44, 128 + sgn * 90), (66, 128 + sgn * 62), (36, 128 + sgn * 56), (84, 128 + sgn * 36)]
        c.poly(pts, w); c.line([(118, 128 + sgn * 16), (62, 128 + sgn * 110)], dark(w, .35), 4)
    c.blob(124, 128, 26, 32, C(col)); c.blob(158, 128, 20, 18, C(col))
    for sgn in (-1, 1): c.poly([(152, 128 + sgn * 12), (146, 128 + sgn * 34), (162, 128 + sgn * 18)], C(col)); c.circ(168, 128 + sgn * 8, 3.5, C(eye), OUTLINE, 1)
    for sgn in (-1, 1): c.poly([(174, 128 + sgn * 3), (184, 128 + sgn * 4), (176, 128 + sgn * 9)], C('#ffffff'), None)

def insect(c, col):
    for sgn in (-1, 1): c.ell(122, 128 + sgn * 52, 46, 18, (210, 235, 255, 150), (150, 190, 220, 255), 2, sgn * 0.5)
    c.blob(80, 128, 52, 34, C(col)); 
    for x in (60, 80, 100): c.ell(x, 128, 6, 32, C('#2a2218'), None, 0)
    c.poly([(26, 128), (4, 124), (4, 132)], C('#2a2218'))
    c.blob(136, 128, 26, 24, C('#caa02a')); c.blob(170, 128, 20, 20, C(col))
    for sgn in (-1, 1): c.ell(176, 128 + sgn * 12, 8, 10, C('#2a1a1a'), OUTLINE, 2); c.line([(184, 128 + sgn * 8), (206, 128 + sgn * 20)], C('#2a2218'), 3)

def elemental(c, col, core='#ffffff', arms=True):
    c.glow(128, 128, 46, C(col)[:3] + (120,))
    def sw(d):
        for k in range(4):
            r = 90 - k * 14; d.arc([(128 - r) * SS, (128 - r) * SS, (128 + r) * SS, (128 + r) * SS], 20 + k * 70, 250 + k * 70, fill=C(col)[:3] + (210,), width=int((16 - k * 2) * SS))
    c.soft(sw, 1.2)
    c.blob(128, 128, 54, 56, C(col)); c.ell(112, 108, 26, 18, lite(C(col), .45), None, 0, -.4)
    for sgn in (-1, 1): c.ell(158, 128 + sgn * 16, 9, 7, C(core), OUTLINE, 2, sgn * .3); c.circ(161, 128 + sgn * 16, 3, OUTLINE, None, 0)
    for i in range(5): a = i * 1.25 + .3; c.ell(60 + i * 6, 128 + math.sin(a) * 50, 10, 6, lite(C(col), .3), None, 0, a)

def golem(c, rock, glow=None, crystals=False):
    r = C(rock)
    for sgn in (-1, 1): c.blob(150, 128 + sgn * 92, 38, 30, r); c.blob(206, 128 + sgn * 66, 28, 24, dark(r, .1))
    c.blob(110, 128, 72, 88, r)
    for (x, y, rx, ry) in [(80, 96, 22, 16), (130, 150, 26, 18), (96, 168, 16, 12)]: c.ell(x, y, rx, ry, lite(r, .15), None, 0, .4)
    if glow: 
        for pts in [[(70, 70), (98, 110), (80, 140), (110, 176)], [(118, 60), (126, 100), (150, 130)]]: c.line(pts, C(glow), 6)
        c.glow(110, 128, 46, C(glow)[:3] + (80,))
    if crystals:
        for (x, y, h) in [(70, 60, 40), (110, 44, 52), (150, 64, 36), (60, 170, 38), (116, 200, 44)]: c.poly([(x - 10, y + h * .5), (x, y - h * .5), (x + 10, y + h * .5)], C(glow or '#d8b8ff'))
    c.blob(176, 128, 40, 38, dark(r, .08))
    for sgn in (-1, 1): c.ell(192, 128 + sgn * 14, 9, 6, C(glow or '#ffd23f'), OUTLINE, 2)

def bird(c, col, belly='#f0e8d8', beak='#e8b030'):
    for sgn in (-1, 1):
        c.poly([(118, 128 + sgn * 18), (80, 128 + sgn * 60), (30, 128 + sgn * 104), (46, 128 + sgn * 70), (16, 128 + sgn * 76), (50, 128 + sgn * 46), (24, 128 + sgn * 38), (86, 128 + sgn * 26)], C(col))
        for k in range(4): c.line([(110 - k * 18, 128 + sgn * (22 + k * 14)), (50 - k * 8, 128 + sgn * (78 + k * 6))], dark(C(col), .3), 3)
    c.poly([(80, 118), (20, 124), (20, 132), (80, 138)], dark(C(col), .15))
    c.blob(120, 128, 44, 30, C(col)); c.ell(126, 128, 26, 16, C(belly), None, 0)
    c.blob(166, 128, 22, 20, C(col)); c.poly([(184, 120), (214, 128), (184, 136)], C(beak))
    for sgn in (-1, 1): c.circ(174, 128 + sgn * 10, 4, C('#ffe14a'), OUTLINE, 1.5); c.circ(175, 128 + sgn * 10, 2, OUTLINE, None, 0)

def ghost(c, col, eye='#2a4a5a'):
    def f(d):
        d.polygon([(x * SS, y * SS) for x, y in [(20, 128), (70, 76), (150, 66), (206, 100), (222, 128), (206, 156), (150, 190), (70, 180)]], fill=C(col)[:3] + (200,))
    c.soft(f, 5)
    c.glow(128, 128, 46, C(col)[:3] + (90,))
    c.ell(150, 128, 52, 46, C(col)[:3] + (235,), None, 0)
    for k in range(5): c.ell(60 - k * 6, 128 + (k - 2) * 26, 30, 12, C(col)[:3] + (150,), None, 0)
    for sgn in (-1, 1): c.ell(172, 128 + sgn * 15, 8, 12, C(eye), None, 0)
    c.ell(184, 128, 6, 14, C(eye), None, 0)

def knight(c, steel='#4a4a64', glow='#ff3a3a', plume='#7a1a1a'):
    s = C(steel)
    for sgn in (-1, 1): c.outlined_line([(106, 128 + sgn * 64), (176, 128 + sgn * 72), (214, 128 + sgn * 50)], dark(s, .1), 22); c.circ(214, 128 + sgn * 50, 13, lite(s, .1), OUTLINE, 2)
    c.blob(108, 128, 40, 78, s)
    for y in (96, 128, 160): c.line([(90, y), (130, y)], dark(s, .4), 3)
    c.blob(156, 128, 36, 36, lite(s, .08))
    c.poly([(128, 128), (100, 100), (92, 128), (100, 156)], C(plume))
    c.line([(176, 118), (176, 138)], dark(s, .6), 4)
    for sgn in (-1, 1): c.ell(180, 128 + sgn * 9, 7, 3.5, C(glow), None, 0); c.glow(180, 128 + sgn * 9, 14, C(glow)[:3] + (200,))
    c.line([(200, 190), (248, 100)], C('#c9ced6'), 8); c.line([(190, 196), (212, 186)], C('#5a3b20'), 8)

def hum(c, skin, cloth, head='plain', accent='#444', eye='#ffe14a', tear=False):
    humanoid(c, C(skin), C(cloth), 33, 90)
    if head == 'hood': c.ell(144, 128, 40, 40, C(cloth), OUTLINE, 3); c.ell(160, 128, 22, 22, C(skin), None, 0)
    elif head == 'horns':
        for sgn in (-1, 1): c.poly([(144, 128 + sgn * 22), (126, 128 + sgn * 62), (160, 128 + sgn * 34)], C(accent))
    elif head == 'feather':
        for sgn in (-1, 1): c.line([(140, 128 + sgn * 24), (122, 128 + sgn * 56)], C(accent), 6)
    elif head == 'helm': c.ell(150, 128, 36, 36, C('#8a909a'), OUTLINE, 3); c.line([(168, 110), (168, 146)], C('#2a2a32'), 5)
    eyes(c, 172, 14, 6, col=C(eye), dx=3)
    if tear: 
        for (x, y) in [(96, 84), (110, 160), (124, 118)]: c.ell(x, y, 9, 6, C(accent), None, 0, .5)

def demon(c, skin='#a01818', wing='#5a0a0a'):
    for sgn in (-1, 1): c.poly([(100, 128 + sgn * 24), (40, 128 + sgn * 110), (118, 128 + sgn * 70)], C(wing))
    hum(c, skin, '#7a1010', 'horns', '#2a1010', '#ffe14a')
    c.glow(150, 128, 40, (255, 120, 30, 90))

def mushroom(c):
    Wd.shadow_under(c, 128, 70)
    for (x, y, r, col) in [(86, 190, 34, '#3a6a8a'), (168, 196, 28, '#3a6a8a'), (126, 170, 44, '#4a7a9a')]:
        c.poly([(x - 8, y + 30), (x - 6, y), (x + 6, y), (x + 8, y + 30)], C('#d8d8c8'))
        c.ell(x, y - 4, r, r * .62, C(col), OUTLINE, 3); 
        for dx in (-r * .4, 0, r * .4): c.circ(x + dx, y - 6, 4, C('#7ad0ff'), None, 0)
    c.glow(128, 150, 42, (120, 200, 255, 80))

def bone_pile(c):
    Wd.shadow_under(c, 128, 60)
    for (x1, y1, x2, y2) in [(70, 200, 180, 170), (86, 170, 190, 206), (100, 150, 160, 196)]:
        c.outlined_line([(x1, y1), (x2, y2)], C('#e8e2cf'), 14)
        for (x, y) in [(x1, y1), (x2, y2)]: c.circ(x, y, 10, C('#e8e2cf'), OUTLINE, 2)
    c.ell(130, 150, 36, 32, C('#e8e2cf'), OUTLINE, 3); 
    for sgn in (-1, 1): c.ell(122 + sgn * 0 + (10 if sgn > 0 else -10), 148, 8, 10, C('#2a2218'), None, 0)
    c.poly([(126, 170), (134, 170), (132, 182), (128, 182)], C('#2a2218'))

def tombstone(c):
    Wd.shadow_under(c, 128, 60)
    c.poly([(70, Wd.BASE), (70, 100), (84, 70), (128, 54), (172, 70), (186, 100), (186, Wd.BASE)], C('#7a7f88'))
    c.poly([(70, 100), (84, 70), (128, 54), (172, 70), (186, 100), (150, 106), (106, 106)], lite(C('#7a7f88'), .28), None)
    c.line([(128, 92), (128, 160)], C('#4a4f58'), 8); c.line([(104, 118), (152, 118)], C('#4a4f58'), 8)
    for (x, y) in [(86, 200), (170, 214), (110, 226)]: c.line([(x, y), (x + 8, y - 12)], C('#3a6a3a'), 4)

def vial(c, col):
    c.glow(128, 150, 44, C(col)[:3] + (110,)); c.ell(128, 160, 52, 56, C('#bfe6ff', 120), OUTLINE, 4); c.ell(128, 172, 44, 40, C(col), None, 0)
    c.poly([(108, 110), (148, 110), (142, 70), (114, 70)], C('#bfe6ff', 140), OUTLINE, 3); c.poly([(104, 74), (152, 74), (148, 54), (108, 54)], C('#8a5a30'), OUTLINE, 3)
def core(c, col):
    c.glow(128, 128, 46, C(col)[:3] + (140,)); c.star(128, 128, 70, 38, 8, C(col), OUTLINE, 3, rot=.2); c.circ(128, 128, 30, lite(C(col), .5), OUTLINE, 3); c.circ(120, 118, 10, (255, 255, 255, 200), None, 0)
def feather(c):
    c.poly([(60, 210), (190, 50), (214, 70), (150, 170), (90, 220)], C('#e8ecf4'), OUTLINE, 4); c.line([(64, 208), (200, 60)], C('#a8b0c0'), 5)
    for k in range(6): c.line([(90 + k * 18, 180 - k * 20), (120 + k * 18, 190 - k * 20)], C('#c8d0e0'), 3)
def fang(c):
    c.poly([(100, 60), (156, 60), (144, 190), (128, 220), (112, 190)], C('#f0ead8'), OUTLINE, 4); c.line([(116, 70), (122, 190)], (255, 255, 255, 200), 4)
def mush_item(c):
    c.glow(128, 140, 40, (120, 200, 255, 100)); c.poly([(116, 120), (140, 120), (144, 200), (112, 200)], C('#e8e8d8'), OUTLINE, 3); c.ell(128, 112, 66, 46, C('#4a7a9a'), OUTLINE, 4)
    for (x, y) in [(100, 104), (130, 90), (150, 112)]: c.circ(x, y, 7, C('#9ae0ff'), None, 0)
def fruit(c):
    c.ell(128, 140, 64, 56, C('#ffb02e'), OUTLINE, 4, -.4); c.ell(108, 122, 20, 28, (255, 240, 180, 150), None, 0, -.4); c.poly([(120, 90), (150, 60), (160, 74), (136, 98)], C('#3a8a3a'), OUTLINE, 2)
def venom(c):
    c.glow(128, 140, 44, (120, 255, 90, 110)); c.ell(128, 148, 58, 44, C('#6aa83a'), OUTLINE, 4); c.ell(110, 132, 18, 12, (220, 255, 190, 190), None, 0); c.circ(150, 160, 10, C('#9aff5a'), None, 0)
def ectoplasm(c):
    c.glow(128, 128, 46, (180, 255, 230, 130))
    def f(d): d.polygon([(x * SS, y * SS) for x, y in [(70, 200), (60, 110), (100, 60), (150, 70), (190, 120), (176, 200), (128, 176)]], fill=(184, 240, 224, 230))
    c.soft(f, 3); c.ell(110, 110, 12, 18, C('#2a4a5a'), None, 0); c.ell(150, 110, 12, 18, C('#2a4a5a'), None, 0); c.ell(130, 150, 10, 14, C('#2a4a5a'), None, 0)

NEW_MOBS = {
  'blue_slime': lambda c: slime(c, '#4f8fe0'), 'purple_slime': lambda c: slime(c, '#a45cff'), 'red_slime': lambda c: slime(c, '#e0454a'),
  'lava_slime': lambda c: slime(c, '#ff7a1a'), 'ice_slime': lambda c: slime(c, '#9be7ff'), 'toxic_slime': lambda c: slime(c, '#8aea3a'),
  'dire_wolf': lambda c: wolf(c, '#3a3a44', '#6a6a76', '#ff5a3a'), 'hellhound': lambda c: wolf(c, '#7a2a1a', '#ff7a3a', '#ffd23f'),
  'treant': lambda c: B.elder_ent(c), 'giant_hornet': lambda c: insect(c, '#e8c23a'), 'jungle_viper': lambda c: snake(c, '#4aa84a'),
  'tribal_hunter': lambda c: hum(c, '#c68642', '#6a4a2a', 'feather', '#d84a3a'), 'jungle_golem': lambda c: golem(c, '#4a7a4a', '#7bff5a'),
  'sand_elemental': lambda c: elemental(c, '#e6c34a', '#ffffff'), 'vulture': lambda c: bird(c, '#6a4a3a', '#d8c8b0', '#c9a03a'),
  'tomb_guardian': lambda c: golem(c, '#c9b070', '#ffd23f'), 'fire_elemental': lambda c: elemental(c, '#ff6a1a', '#ffe27a'),
  'bone_drake': lambda c: M.wyvern(c, '#e8e2cf', '#b8b098', '#c9b88a'), 'pit_demon': lambda c: demon(c), 'leech': lambda c: snake(c, '#6a2a3a', '#c05a6a'),
  'plague_zombie': lambda c: hum(c, '#8aa84a', '#4a5a2a', 'plain', '#3a4a1a', '#e8e8a0', True), 'blight_bat': lambda c: bat(c, '#4a3a5a', '#5a4a6a'),
  'ghoul': lambda c: hum(c, '#7a8a7a', '#4a5a5a', 'plain', '#2a3a3a', '#e8ffe8', True), 'banshee': lambda c: ghost(c, '#b8f0e0'),
  'gargoyle': lambda c: demon(c, '#6a6f78', '#4a4f58'), 'vampire_bat': lambda c: bat(c, '#5a2a3a', '#7a1a2a', '#ffd23f'),
  'death_knight': lambda c: knight(c), 'ice_elemental': lambda c: elemental(c, '#9be7ff', '#ffffff'), 'frost_giant': lambda c: B.frost_titan(c),
  'harpy': lambda c: bird(c, '#d8c8f0', '#fff0f8', '#ffb02e'), 'rock_golem': lambda c: golem(c, '#7a7f88'), 'crystal_golem': lambda c: golem(c, '#9a80d0', '#e8d0ff', True),
  'storm_drake': lambda c: M.wyvern(c, '#6a7ac0', '#3a4a90', '#bfe8ff'), 'blood_zombie': lambda c: hum(c, '#b04a4a', '#5a1a1a', 'plain', '#3a0a0a', '#ffe14a', True),
  'blood_eye': lambda c: __import__('sprites_extra').demon_eye(c, False, '#8a1020'),
}
NEW_NODES = {
  'palm_tree': lambda c: Wd.tree(c, '#4aa83a', '#8a6a40'), 'jungle_tree': lambda c: Wd.tree(c, '#1f8a3a', '#5a4020'), 'blight_tree': lambda c: Wd.tree(c, '#5a4a6a', '#2a2030'),
  'mushroom_cluster': mushroom, 'bone_pile': bone_pile, 'tombstone': tombstone,
  'cobalt_ore': lambda c: Wd.ore(c, '#2a56c8'), 'crystal_cluster': lambda c: Wd.crystal(c, '#c8a0ff', '#f0e0ff'),
  'bloodstone_ore': lambda c: Wd.ore(c, '#c01030', '#5a4a52'), 'starmetal_ore': lambda c: Wd.ore(c, '#a0b8ff', '#4a5068'),
}
NEW_ITEMS = {
  'cobalt': lambda c: I.ingot(c, '#2a56c8'), 'crystal': lambda c: I.gem(c, '#c8a0ff'), 'bloodstone': lambda c: I.gem(c, '#c01030'), 'starmetal': lambda c: I.ingot(c, '#a0b8ff'),
  'mushroom': mush_item, 'jungle_fruit': fruit, 'ember_core': lambda c: core(c, '#ff7a1a'), 'ice_core': lambda c: core(c, '#9be7ff'), 'sand_core': lambda c: core(c, '#e6c34a'),
  'ectoplasm': ectoplasm, 'fang': fang, 'blood_vial': lambda c: vial(c, '#c01030'), 'feather': feather, 'venom_gland': venom,
}
