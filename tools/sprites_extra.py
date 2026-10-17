from sprite_lib import *
import math
C = lambda h, a=255: hexc(h, a)

def demon_eye(c, big=False, col='#b8232b'):
    # flying bloodshot eye with a veiny tail, facing right
    base = C(col)
    def tail(d):
        for i in range(7):
            y = 128 + (i - 3) * 14
            d.polygon([(x * SS, yy * SS) for x, yy in [(110, y), (30 + i * 4, y + (i - 3) * 9 + 8), (14 + i * 6, y + (i - 3) * 14), (40 + i * 3, y - 6)]], fill=(150, 20, 30, 235))
    c.soft(tail, 2)
    c.ell(126, 128, 70, 66, C('#f4ece4'), OUTLINE, 3)
    c.ell(112, 112, 38, 28, C('#ffffff'), None, 0, -0.4)
    for (x, y, x2, y2) in [(100, 86, 140, 110), (92, 140, 138, 126), (120, 170, 150, 140), (84, 118, 126, 120), (110, 84, 96, 120)]: c.line([(x, y), (x2, y2)], C('#d83a3a'), 3)
    c.ell(178, 128, 30, 36, C('#2f6bd8'), OUTLINE, 3); c.ell(186, 128, 18, 22, C('#1a8a4a'), None, 0); c.ell(192, 128, 10, 14, C('#0a0a10'), None, 0)
    c.circ(186, 116, 4, (255, 255, 255, 230), None, 0)

def coin(c):
    c.glow(128, 128, 60, (255, 210, 60, 120))
    c.circ(128, 128, 78, C('#e8a820'), OUTLINE, 5); c.circ(128, 128, 64, C('#ffd23f'), None, 0); c.circ(128, 128, 48, C('#f0b82a'), None, 0)
    c.ell(104, 104, 26, 16, C('#fff3a8'), None, 0, -0.6)
    c.poly([(116, 100), (140, 100), (140, 112), (128, 112), (128, 124), (140, 124), (140, 152), (116, 152), (116, 140), (128, 140), (128, 128), (116, 128)], C('#a8700a'), None)

def cooked(c):
    c.poly([(44, 150), (66, 88), (130, 56), (204, 80), (216, 146), (170, 200), (88, 198)], C('#a8582a'), OUTLINE, 5)
    c.poly([(66, 88), (130, 56), (204, 80), (150, 104)], C('#d98a4a'), None)
    for (a, b) in [([(86, 132), (160, 112)]), ([(96, 164), (172, 148)])]: pass
    for pts in [[(86, 132), (160, 112)], [(96, 164), (172, 148)], [(110, 90), (150, 80)]]: c.line(pts, C('#6a2f12'), 6)
    c.circ(170, 152, 22, C('#f2e2d2'), OUTLINE, 4)

def lens(c):
    c.glow(128, 128, 60, (230, 230, 255, 90)); c.circ(128, 128, 72, C('#eef0f8'), OUTLINE, 5); c.circ(128, 128, 40, C('#2f6bd8'), None, 0); c.circ(128, 128, 22, C('#0a0a10'), None, 0)
    c.circ(110, 108, 12, (255, 255, 255, 230), None, 0)
    for a in range(8): c.line([(128 + 50 * math.cos(a * .8), 128 + 50 * math.sin(a * .8)), (128 + 68 * math.cos(a * .8 + .2), 128 + 68 * math.sin(a * .8 + .2))], C('#d83a3a'), 3)

def hellstone(c):
    for (x, y, s) in [(96, 150, 44), (156, 130, 54), (140, 188, 34)]:
        c.poly([(x, y - s), (x + s * .8, y - s * .2), (x + s * .5, y + s * .8), (x - s * .6, y + s * .7), (x - s * .9, y - s * .1)], C('#3a1f1f'), OUTLINE, 4)
        c.poly([(x - s * .3, y - s * .5), (x + s * .1, y), (x - s * .1, y + s * .5)], C('#ff7a1a'), None)
        c.line([(x - s * .5, y), (x + s * .4, y + s * .3)], C('#ffd23f'), 4)
    c.glow(128, 150, 60, (255, 100, 20, 120))

def chest(c):
    c.ell(128, 214, 96, 16, (0, 0, 0, 70), None, 0)
    c.poly([(36, 100), (220, 100), (220, 204), (36, 204)], C('#8a5a30'), OUTLINE, 5)
    c.poly([(36, 100), (220, 100), (206, 56), (50, 56)], C('#a8703c'), OUTLINE, 5)
    for x in (72, 128, 184): c.line([(x, 60), (x, 200)], C('#5a3b20'), 5)
    c.poly([(30, 114), (226, 114), (226, 134), (30, 134)], C('#c9ced6'), OUTLINE, 3)
    c.poly([(112, 112), (144, 112), (144, 156), (112, 156)], C('#ffd23f'), OUTLINE, 4); c.circ(128, 130, 7, C('#5a3b20'), None, 0)

def hellstone_ore(c, ore, rock):
    rock(c, '#4a3a3a')
    for (x, y, s) in [(96, 156, 22), (150, 140, 26), (168, 196, 18), (112, 204, 16), (128, 170, 14)]:
        c.poly([(x, y - s), (x + s * .7, y - s * .1), (x + s * .4, y + s * .8), (x - s * .5, y + s * .7), (x - s * .8, y - s * .1)], C('#ff5a1a'), OUTLINE, 2)
        c.poly([(x, y - s), (x + s * .7, y - s * .1), (x, y + s * .1)], C('#ffd23f'), None)
    c.glow(128, 170, 50, (255, 90, 20, 90))

def potion_col(c, liquid, glowc, star=None):
    c.glow(128, 150, 50, glowc); c.ell(128, 156, 66, 66, C('#bfe6ff', 130), OUTLINE, 5); c.ell(128, 168, 56, 52, C(liquid), None, 0)
    c.poly([(104, 100), (152, 100), (146, 56), (110, 56)], C('#bfe6ff', 150), OUTLINE, 4); c.poly([(100, 60), (156, 60), (152, 40), (104, 40)], C('#a0703c'), OUTLINE, 4)
    c.ell(104, 150, 10, 22, (255, 255, 255, 140), None, 0, .3)
    if star: c.star(128, 168, 22, 9, 5, C(star), None, 0)

# ---- 16x16 ASCII buff icons -------------------------------------------------------------
PAL = {'.': None, 'k': '#1a1420', 'r': '#e0245e', 'R': '#ff7a9a', 'o': '#ff7a1a', 'y': '#ffd23f', 'Y': '#fff3a8', 'g': '#4ad04a', 'G': '#1f7a2a', 'b': '#2f6bd8', 'B': '#9be7ff',
       'w': '#ffffff', 's': '#9aa0aa', 'S': '#d6dae2', 'p': '#a45cff', 'P': '#6a3ab0', 'n': '#8a5a30', 'N': '#c9a070', 'e': '#6a8a3a', 'd': '#5a3b20'}
ICONS = {
 'regeneration': ["................", "...kkk....kkk...", "..krrrk..krrRk..", ".krRRrrkkrrrrrk.", ".krRrrrrrrrrrrk.", ".krrrrrrrrrrrrk.", ".krrrrrrrrrrrrk.", "..krrrrrrrrrrk..", "...krrrrrrrrk...", "....krrrrrrk....", ".....krrrrk.....", "......krrk......", ".......kk.......", "................", "................", "................"],
 'swiftness': ["................", "................", "......kkk.......", ".....kyyyk......", "....kyYyyyk.....", "...kyyyyyyk.....", "..kkkyyyyykkk...", ".kyyyyyyyyyyyk..", "..kkkkkyyykkk...", ".....kyyyyk.....", "....kyyyyk......", "...kyyyyk.......", "..kyyyk.........", "..kkkk..........", "................", "................"],
 'ironskin': ["................", "..kkkkkkkkkkkk..", ".kSSSSSSSSSSSSk.", ".kSwwSssssssssk.", ".kSwSsssssssssk.", ".kSsssssssssssk.", ".kSsssssssssssk.", ".kSsssssssssssk.", "..kSssssssssk...", "..kSssssssssk...", "...kSsssssssk...", "....kSsssssk....", ".....kSssssk....", "......kSssk.....", ".......kkk......", "................"],
 'wrath': ["................", "....k......k....", "...kok....kok...", "..kooyk..kyook..", "..kooyykkyyook..", "..kooyyyyyyook..", "...koyyyyyyok...", "....koyyyyok....", ".....kooook.....", "....kooyyook....", "...kooyyyyook...", "..kooyyoyyyook..", "..kkooooooookk..", "...kkkkkkkkk....", "................", "................"],
 'well_fed': ["................", "................", "....kkkkkkkk....", "..kknnnnnnnnkk..", ".knNNnnnnnnnnnk.", ".knNnnnnnnnnnnk.", ".knnnnnnnnnnnnk.", ".knnnnnnnnnnnnk.", "..kknnnnnnnnkk..", "....kkkkkkkk....", "...kgggkkkgggk..", "...kgGgk.kgGgk..", "....kkk...kkk...", "................", "................", "................"],
 'campfire': ["................", ".......k........", "......kok.......", ".....kooyk......", "....kooyyok.....", "...kooyYyyok....", "...kooyYYyok....", "...kooyyyyok....", "....kooyyok.....", ".....kkkkk......", "..dkkddddddkkd..", ".dddkkddddkkddd.", "..kkdddddddkk...", "................", "................", "................"],
 'burning': ["................", ".......k........", "......kok.......", ".....kooyk......", "....kooyyok.....", "...kooyYyyok....", "...kooyYYyok....", "..kooyyYYyyok...", "..kooyyyyyyok...", "..kooyyyyyyok...", "...koooyyook....", "....kooooook....", ".....kkkkkk.....", "................", "................", "................"],
 'poisoned': ["................", "....kkkkkkk.....", "...kSSSSSSSk....", "..kSSSSSSSSSk...", "..kSkkSSSkkSk...", "..kSkkSSSkkSk...", "...kSSSkSSSk....", "....kSSSSSk.....", "....kSkSkSk.....", ".....kkkkk......", "..kggk..kggk....", ".kgGgk..kgGgk...", "..kkk....kkk....", "................", "................", "................"],
 'slowed': ["................", "......kkk.......", "....kkBBBkk.....", "...kBBwBBwBk....", "..kBBBBwBBBBk...", ".kBwBBBBBBBwBk..", ".kBBBBBwBBBBBk..", ".kBBwBBBBBwBBk..", ".kBBBBBBBBBBBk..", "..kBBwBBBwBBk...", "...kBBBBBBBk....", "....kkBBBkk.....", "......kkk.......", "................", "................", "................"],
 'rooted': ["................", "................", ".k.k.k.k.k.k.k..", ".kSkSkSkSkSkSk..", ".kSkSkSkSkSkSk..", "..kSSSSSSSSSk...", "..kSsssssssSk...", "..kSkkkkkkkSk...", "..kSsssssssSk...", "..kSSSSSSSSSk...", ".kSkSkSkSkSkSk..", ".kSkSkSkSkSkSk..", ".k.k.k.k.k.k.k..", "................", "................", "................"],
 'potion_sickness': ["................", ".....kkkkk......", ".....kbbbk......", ".....kBBBk......", "......kBk.......", ".....kBBBk......", "....kBBBBBk.....", "...kBBBwBBBk....", "...kBBBBBBBk....", "...kBpBpBpBk....", "...kBBpBpBBk....", "....kBBBBBk.....", ".....kkkkk......", "................", "................", "................"],
}
