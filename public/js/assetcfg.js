// Sprite tuning. Edit freely — no other code changes needed.
export default {
  // 'rotate' = top-down art facing RIGHT, rotated toward where the mob looks
  // 'flip'   = side-view art facing RIGHT, mirrored when the mob looks left (no rotation)
  // 'fixed'  = never rotated (blobs, crowned bosses)
  mode: 'rotate',
  overrides: { slime: 'fixed', slime_king: 'fixed', void_horror: 'fixed' /* cow: 'flip' */ },
  // size multiplier relative to the mob's hitbox diameter (default 1.15)
  scale: { /* slime_king: 1.3 */ },
  // node sprite size relative to hitbox diameter, by shape (default 2.2)
  nodeScale: { tree: 2.8, rock: 2.3, ore: 2.3, bush: 2.3, cactus: 2.6, crystal: 2.5 },
  weaponSize: 54,        // px (world units) for held weapon sprites
};
