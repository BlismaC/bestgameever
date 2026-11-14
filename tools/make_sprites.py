"""Generates every sprite in public/assets/ as PIXEL ART. Run:  python3 tools/make_sprites.py
Vector drawing (sprites_*.py) -> downsample -> palette-reduce -> auto outline -> nearest-neighbour upscale.
Needs: pip install pillow.  Replace any PNG with your own art at any time."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sprite_lib import Cv, hexc
from PIL import Image, ImageDraw
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
# ============================ v0.6: new mobs / nodes / items / armor / mounts / pals / trophies ============================
import json, subprocess, sprites_new as N, sprites_gear as G
subprocess.run(['node', os.path.join(os.path.dirname(__file__), 'dump_content.js')], check=True)
D = json.load(open(os.path.join(os.path.dirname(__file__), 'data', 'content_dump.json')))
for k, f in N.NEW_MOBS.items(): px('mobs', k, f, 46, 5, 20)
for k, f in N.NEW_NODES.items(): px('nodes', k, f, 62, 4, 24)
for k, f in N.NEW_ITEMS.items(): px('items', k, f, 30, 4, 18)
px('items', 'potion_swift', lambda c: X.potion_col(c, '#ffe14a', (255, 225, 74, 120), '#ffffff'), 30, 4, 18)
# ---- v0.7: tameable pals (replace the old craftable ones), dimension/holiday mobs, special bosses, items, decor, mounts, buff icons
import shutil, glob, sprites_v7 as V
shutil.rmtree(os.path.join(OUT, 'pals'), ignore_errors=True)
for f in glob.glob(os.path.join(OUT, 'items', 'pal_*.png')): os.remove(f)
import pixel_hand as PH0
os.makedirs(os.path.join(OUT, 'pals'), exist_ok=True)
for k in PH0.PAL_ART:                       # hand-pixeled pals: same art for the wild creature, the party portrait and the inventory icon
    spr = PH0.pal_sprite(k); spr.save(path('pals', k), 4); spr.save(path('mobs', 'wild_' + k), 4); spr.save(path('items', 'pal_' + k), 4); n += 3
for k, f in V.NEW_MOBS.items(): px('mobs', k, f, 46, 5, 20)
for k, f in V.BOSSES.items(): px('mobs', k, f, 94, 5, 28)
import pixel_hand as PH
for k, f in PH.BOSS_ART.items(): f().save(path('mobs', k), 4)          # hand-pixeled story bosses (override the generated ones)
os.makedirs(os.path.join(OUT, 'portraits'), exist_ok=True)
for k, f in PH.PORTRAITS.items(): f().save(os.path.join(OUT, 'portraits', k + '.png'), 4)
for k, f in V.NEW_ITEMS.items(): px('items', k, f, 30, 4, 18)
for k, f in V.NEW_NODES.items(): px('nodes', k, f, 62, 4, 24)
for k, f in V.MOUNTS.items():
    px('mounts', k, f, 56, 4, 20); Image.open(path('mounts', k)).resize((120, 120), Image.NEAREST).save(path('items', 'mount_' + k))
for k, (f, res, kk) in V.DECOR.items(): px('decor', k, f, res, kk, 24)
import pixel_hand as PH2
for k, f in PH2.DECOR_ART.items(): f().save(path('decor', k), 4)           # hand-pixeled castle + temple
for k, f in PH2.MOB_ART.items(): f().save(path('mobs', k), 4)             # hand-pixeled common mobs
for k, f in PH2.HALL_ART.items(): f().save(path('decor', k), 4); n += 1
for kd in ('gothic', 'sea'): PH2.hall_torch_strip(kd).save(path('decor', 'hall_torch_' + kd)); n += 1
for nm in PH2.PORTAL_COL: PH2.portal_strip(nm).save(path('decor', 'portal_' + nm)); n += 1
import sprites_proj as SP
for k, fn in SP.KINDS.items(): os.makedirs(os.path.join(OUT, 'proj'), exist_ok=True); SP.strip(fn).save(os.path.join(OUT, 'proj', k + '.png')); n += 1
os.makedirs(os.path.join(OUT, 'fx'), exist_ok=True)
for st in SP.STYLES: SP.burst_strip(st).save(os.path.join(OUT, 'fx', 'burst_' + st + '.png')); n += 1
SP.muzzle_strip().save(os.path.join(OUT, 'fx', 'muzzle.png'))
for zn in SP.ZONES: SP.zone_strip(zn).save(os.path.join(OUT, 'fx', 'zone_' + zn + '.png')); n += 1
for k, rows in V.BUFF_ICONS.items():
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); pxs = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            col = V.PAL.get(ch)
            if col: pxs[x, y] = hexc(col)
    d = os.path.join(OUT, 'buffs'); os.makedirs(d, exist_ok=True); im.resize((64, 64), Image.NEAREST).save(os.path.join(d, k + '.png')); n += 1
for sid, st in D['sets'].items():
    for slot, fn in (('helmet', G.helmet), ('chest', G.chest), ('legs', G.legs)): px('items', st['pieces'][slot], (lambda c, fn=fn, L=st['look']: fn(c, L)), 30, 4, 18)
for k, f in G.MOUNTS.items():
    px('mounts', k, f, 56, 4, 20); Image.open(path('mounts', k)).resize((120, 120), Image.NEAREST).save(path('items', 'mount_' + k))
# golden trophies: boss sprite -> gold silhouette on a plaque
def gold(img):
    g = img.convert('LA'); out = Image.new('RGBA', img.size)
    po, pg = out.load(), g.load()
    for y in range(img.height):
        for x in range(img.width):
            l, a = pg[x, y]
            if a > 60: t = l / 255; po[x, y] = (int(150 + 105 * t), int(100 + 110 * t), int(10 + 60 * t), 255)
    return out
for b in D['bosses']:
    sp = Image.open(path('mobs', b)).convert('RGBA'); sp = sp.crop(sp.getbbox()); sp.thumbnail((190, 190), Image.NEAREST); sp = gold(sp)
    pl = Image.new('RGBA', (240, 270), (0, 0, 0, 0)); d = ImageDraw.Draw(pl)
    d.rounded_rectangle([10, 10, 230, 250], 22, fill=(58, 36, 18, 255), outline=(255, 210, 63, 255), width=10); d.rounded_rectangle([26, 26, 214, 234], 14, fill=(34, 20, 10, 255), outline=(190, 140, 30, 255), width=4)
    pl.alpha_composite(sp, ((240 - sp.width) // 2, (270 - sp.height) // 2 - 4)); pl = pl.resize((60, 68), Image.NEAREST).resize((240, 272), Image.NEAREST)
    pl.save(path('structures', 'trophy_' + b)); pl.resize((120, 136), Image.NEAREST).save(path('items', 'trophy_' + b)); n += 1
have = lambda i: os.path.exists(path('items', i['id'])) or (i['arch'] and os.path.exists(path('weapons', i['arch']))) or os.path.exists(path('structures', i['id']))
missing = [i['id'] for i in D['items'] if not have(i)]
print('items without sprites:', len(missing), missing[:40])
import runpy; runpy.run_path(os.path.join(os.path.dirname(__file__), 'make_fusions.py'))
print('generated', n, 'pixel sprites ->', os.path.abspath(OUT))
