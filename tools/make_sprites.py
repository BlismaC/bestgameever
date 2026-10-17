"""Generates every sprite in public/assets/ as PIXEL ART. Run:  python3 tools/make_sprites.py
Vector drawing (sprites_*.py) -> downsample -> palette-reduce -> auto outline -> nearest-neighbour upscale.
Needs: pip install pillow.  Replace any PNG with your own art at any time."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sprite_lib import Cv, hexc
from PIL import Image
import sprites_mobs as M, sprites_bosses as B, sprites_world as Wd, sprites_items as I, sprites_extra as X

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
def path(sub, name): d = os.path.join(OUT, sub); os.makedirs(d, exist_ok=True); return os.path.join(d, name + '.png')
n = 0
def px(sub, name, fn, res, k, colors=22, size=256, thr=100):
    global n
    c = Cv(size); fn(c); c.save_px(path(sub, name), res, k, colors, thr); n += 1

# ---- mobs (res 44 -> x5) and bosses (res 94 -> x5)
MOBS = {'cow': M.cow, 'chicken': M.chicken, 'toad': M.toad, 'slime': M.slime, 'goblin': M.goblin, 'wolf': M.wolf,
        'frost_wolf': lambda c: M.wolf(c, '#b6dcf2', '#f0fbff', '#4aa8ff'), 'spider': M.spider, 'skeleton': M.skeleton, 'zombie': M.zombie, 'bandit': M.bandit,
        'scorpion': M.scorpion, 'mummy': M.mummy, 'yeti': M.yeti, 'bog_witch': M.bog_witch, 'lava_imp': M.lava_imp, 'magma_golem': M.magma_golem,
        'shadow_wraith': M.shadow_wraith, 'wyvern': M.wyvern, 'demon_eye': X.demon_eye}
for k, f in MOBS.items(): px('mobs', k, f, 46, 5, 20)
BOSSES = {'slime_king': B.slime_king, 'elder_ent': B.elder_ent, 'pharaoh': B.pharaoh, 'frost_titan': B.frost_titan, 'bog_horror': B.bog_horror,
          'magma_wyrm': B.magma_wyrm, 'lich_king': B.lich_king, 'void_horror': B.void_horror, 'clockwork_colossus': B.clockwork_colossus,
          'celestial_guardian': B.celestial_guardian, 'cow_god': B.cow_god, 'eye_of_dread': lambda c: X.demon_eye(c, True)}
for k, f in BOSSES.items(): px('mobs', k, f, 94, 5, 28)

# ---- world nodes (res 62 -> x4), structures (res 56 -> x5)
NODES = dict(Wd.NODES)
NODES['hellstone_ore'] = lambda c: X.hellstone_ore(c, '#ff5a1a', Wd.rock)
for k, f in NODES.items(): px('nodes', k, f, 62, 4, 24)
STR = dict(Wd.STRUCTS); STR['chest'] = X.chest
for k, f in STR.items(): px('structures', k, f, 56, 5, 24)
px('items', 'campfire', Wd.campfire, 40, 3, 20)
# ---- weapons: neutral light gray, tinted per material in game (res 44 -> x6 keeps long weapons readable)
for k, f in I.WEAPONS.items(): px('weapons', k, f, 44, 5, 12)
for k, f in I.UNIQUES.items(): px('items', k, f, 44, 5, 18)
# ---- item icons
ICONS = {**I.MATERIAL_ICONS, **I.OTHER_ICONS}
ICONS.update({'coin': X.coin, 'cooked_meat': X.cooked, 'lens': X.lens, 'hellstone': X.hellstone,
  'potion_greater_heal': lambda c: X.potion_col(c, '#ff2d55', (255, 45, 85, 130), '#ffe0e8'), 'potion_regen': lambda c: X.potion_col(c, '#ff7aa8', (255, 120, 170, 120), '#ffffff'),
  'potion_ironskin': lambda c: X.potion_col(c, '#aab4c0', (200, 210, 225, 110), '#ffffff'), 'potion_wrath': lambda c: X.potion_col(c, '#ff6a3a', (255, 110, 60, 130), '#ffe27a'),
  'summon_eye_of_dread': lambda c: I.amulet(c, '#c0262d', I.sym_eye)})
for k, f in ICONS.items(): px('items', k, f, 30, 4, 18)
for k in STR: Image.open(path('structures', k)).resize((120, 120), Image.NEAREST).save(path('items', k))
# ---- buff icons (hand-made 16x16 ASCII pixel art, x4)
for k, rows in X.ICONS.items():
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); pxs = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            col = X.PAL.get(ch)
            if col: pxs[x, y] = hexc(col)
    d = os.path.join(OUT, 'buffs'); os.makedirs(d, exist_ok=True); im.resize((64, 64), Image.NEAREST).save(os.path.join(d, k + '.png')); n += 1
print('generated', n, 'pixel sprites ->', os.path.abspath(OUT))
