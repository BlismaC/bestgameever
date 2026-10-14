"""Generates every sprite in public/assets/. Run:  python3 tools/make_sprites.py
Re-run any time; edit the sprites_*.py files to restyle things. Needs: pip install pillow"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sprite_lib import Cv
import sprites_mobs as M, sprites_bosses as B, sprites_world as Wd, sprites_items as I

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
def path(sub, name): d = os.path.join(OUT, sub); os.makedirs(d, exist_ok=True); return os.path.join(d, name + '.png')
n = 0
def make(sub, name, fn, size=256, out=None):
    global n
    c = Cv(size); fn(c); c.save(path(sub, name), out or size); n += 1

# ---- mobs (256px) and bosses (512px)
MOBS = {'cow': M.cow, 'chicken': M.chicken, 'toad': M.toad, 'slime': M.slime, 'goblin': M.goblin, 'wolf': M.wolf,
        'frost_wolf': lambda c: M.wolf(c, '#b6dcf2', '#f0fbff', '#4aa8ff'), 'spider': M.spider, 'skeleton': M.skeleton, 'zombie': M.zombie, 'bandit': M.bandit,
        'scorpion': M.scorpion, 'mummy': M.mummy, 'yeti': M.yeti, 'bog_witch': M.bog_witch, 'lava_imp': M.lava_imp, 'magma_golem': M.magma_golem,
        'shadow_wraith': M.shadow_wraith, 'wyvern': M.wyvern}
for k, f in MOBS.items(): make('mobs', k, f, 256, 256)
BOSSES = {'slime_king': B.slime_king, 'elder_ent': B.elder_ent, 'pharaoh': B.pharaoh, 'frost_titan': B.frost_titan, 'bog_horror': B.bog_horror,
          'magma_wyrm': B.magma_wyrm, 'lich_king': B.lich_king, 'void_horror': B.void_horror, 'clockwork_colossus': B.clockwork_colossus,
          'celestial_guardian': B.celestial_guardian, 'cow_god': B.cow_god}
for k, f in BOSSES.items(): make('mobs', k, f, 256, 512)

# ---- world nodes
for k, f in Wd.NODES.items(): make('nodes', k, f, 256, 256)
# ---- structures
for k, f in Wd.STRUCTS.items(): make('structures', k, f, 256, 256)
make('items', 'campfire', Wd.campfire, 256, 128)   # campfire keeps its animated in-game fire; sprite is only the inventory icon
# ---- weapons: neutral light gray, tinted per material in game
for k, f in I.WEAPONS.items(): make('weapons', k, f, 256, 256)
# ---- unique weapons (exact, never tinted)
for k, f in I.UNIQUES.items(): make('items', k, f, 256, 256)
# ---- item icons
for k, f in {**I.MATERIAL_ICONS, **I.OTHER_ICONS}.items(): make('items', k, f, 256, 128)
# structure inventory icons reuse the structure art
from PIL import Image
for k in Wd.STRUCTS:
    Image.open(path('structures', k)).resize((128, 128), Image.LANCZOS).save(path('items', k))
print('generated', n, 'sprites ->', os.path.abspath(OUT))
