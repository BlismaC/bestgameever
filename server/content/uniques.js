// Unique weapons. Two kinds:
//  HAND  - fully hand-made (own sprite in assets/items/<id>.png)
//  SPEC  - built from an archetype + tier + colour (sprite = archetype art tinted with colour), with special effects.
// fx: burn/poison {dps,dur} | slow {mult,dur} | lifesteal fraction.   proj: overrides the archetype projectile.
const G0 = null;
const HAND = {
  moo_stick: { name: 'The Moo Stick', emoji: '🏏', color: '#ffffff', rarity: 'legendary', tier: 3, desc: 'Blessed by the Cow God. It just goes MOO.',
    weapon: { dmg: 42, cooldown: 0.5, crit: 6, melee: { range: 90, arc: 120, knock: 600 }, toolTier: 3 } },
  totally_not_terra_blade: { name: 'Totally Not A Terra Blade', emoji: '🗡️', color: '#7cffb2', rarity: 'mythic', tier: 7, desc: 'Any resemblance to other swords is purely coincidental.',
    weapon: { dmg: 120, cooldown: 0.4, crit: 8, melee: { range: 95, arc: 110, knock: 200 }, projectile: { kind: 'beam', speed: 900, life: 0.8, radius: 12, count: 1, spread: 0, pierce: 3, color: '#7cffb2' }, toolTier: 7 } },
  bfg_9000ish: { name: 'BFG-9000-ish', emoji: '🔫', color: '#7dff3a', rarity: 'mythic', tier: 7, desc: 'Big. Green. Questionable name.',
    weapon: { dmg: 420, cooldown: 2.5, crit: 2, projectile: { kind: 'bfg', speed: 500, life: 2, radius: 30, count: 1, spread: 0, pierce: 0, explode: 190, color: '#7dff3a', heavy: 1 }, toolTier: 0 } },
  rubber_duck_blaster: { name: 'Rubber Duck Blaster', emoji: '🦆', color: '#ffe14a', rarity: 'epic', tier: 1, desc: 'Squeak squeak squeak squeak.',
    weapon: { dmg: 5, cooldown: 0.1, crit: 4, projectile: { kind: 'duck', speed: 700, life: 0.8, radius: 8, count: 1, spread: 0.22, pierce: 0, color: '#ffe14a' }, toolTier: 0 } },
  companion_cube_launcher: { name: 'Weighted Cube Launcher', emoji: '📦', color: '#c9cfd8', rarity: 'epic', tier: 4, desc: 'The cube will not be missed.',
    weapon: { dmg: 70, cooldown: 1.4, crit: 4, projectile: { kind: 'cube', speed: 600, life: 1.5, radius: 22, count: 1, spread: 0, pierce: 1, color: '#c9cfd8', heavy: 1 }, toolTier: 0 } },
  konami_blade: { name: 'Konami Blade', emoji: '🎮', color: '#ff4d4d', rarity: 'mythic', tier: 5, desc: '↑ ↑ ↓ ↓ ← → ← → B A',
    weapon: { dmg: 55, cooldown: 0.2, crit: 10, melee: { range: 80, arc: 130, knock: 100 }, toolTier: 5 } },
  excalibur_ish: { name: 'Excalibur-ish', emoji: '⚔️', color: '#ffe27a', rarity: 'mythic', tier: 4, desc: 'Pulled from a stone. Probably legally distinct.',
    weapon: { dmg: 95, cooldown: 0.55, crit: 6, melee: { range: 105, arc: 140, knock: 250 }, toolTier: 4 } },
  hissing_bomb: { name: 'Hissing Bomb', emoji: '🧨', color: '#44cc44', rarity: 'rare', tier: 3, desc: 'Ssssssss...',
    weapon: { dmg: 110, cooldown: 1.5, crit: 0, projectile: { kind: 'bomb', speed: 350, life: 0.9, radius: 12, count: 1, spread: 0, pierce: 0, explode: 150, color: '#44cc44' }, toolTier: 0 } },
};
const FX = {
  burn: (d) => ({ burn: { dps: d, dur: 4 } }), poison: (d) => ({ poison: { dps: d, dur: 6 } }), slow: (m = 0.5) => ({ slow: { mult: m, dur: 2.5 } }), life: (f = 0.1) => ({ lifesteal: f }),
};
// id: [name, archetype, tier, colour, dmgMul, fx, extra{proj,melee,crit,cd,desc,rarity}]
const SPEC = {
  // ---- mob rare drops
  bovine_bonker:   ['Bovine Bonker', 'hammer', 0, '#f4f4f4', 1.5, null, { melee: { range: 72, arc: 110, knock: 650 }, desc: 'Sends things flying.' }],
  egg_cannon:      ['Egg Cannon', 'staff', 0, '#fff6d6', 1.4, null, { proj: { kind: 'egg', explode: 45 }, desc: 'Scrambles enemies.' }],
  croaker:         ['Croaker', 'wand', 0, '#6aa84f', 1.5, FX.poison(3), { proj: { kind: 'poison' }, desc: 'Ribbit.' }],
  slimy_staff:     ['Slimy Staff', 'staff', 0, '#5fd35f', 1.5, FX.slow(0.55), { proj: { kind: 'gel', explode: 40 }, desc: 'Gooey and slow.' }],
  goblin_shiv:     ['Goblin Shiv', 'dagger', 1, '#6aa84f', 1.4, null, { crit: 14, desc: 'Cheap, quick and nasty.' }],
  fang_dagger:     ['Fang Dagger', 'dagger', 1, '#e8e2cf', 1.35, FX.life(0.08), { desc: 'Drinks a little life.' }],
  widow_bow:       ['Widow Bow', 'bow', 1, '#3a2a3a', 1.4, FX.poison(3), { proj: { kind: 'poison' }, desc: 'Venomous arrows.' }],
  bone_chakram:    ['Bone Chakram', 'shuriken', 1, '#ece7d6', 1.5, null, { proj: { kind: 'bone', pierce: 2, life: 0.9 }, desc: 'Pierces through foes.' }],
  rotten_maul:     ['Rotten Maul', 'hammer', 1, '#7f9f6a', 1.4, FX.poison(3), { desc: 'Smells awful.' }],
  bandit_dirk:     ['Bandit Dirk', 'dagger', 2, '#4a4a55', 1.4, null, { crit: 18, desc: 'Finds the gaps.' }],
  stinger_spear:   ['Stinger Spear', 'spear', 2, '#b0603a', 1.4, FX.poison(4), { desc: 'Tipped with scorpion venom.' }],
  wrap_whip:       ['Wrapped Whip', 'whip', 2, '#e7dcb5', 1.5, FX.slow(0.6), { desc: 'Binds and slows.' }],
  yeti_club:       ['Yeti Club', 'hammer', 3, '#eaf4fb', 1.4, FX.slow(0.5), { melee: { range: 80, arc: 120, knock: 520 }, desc: 'Brutally cold.' }],
  frostbite:       ['Frostbite', 'dagger', 3, '#a8d8f0', 1.4, FX.slow(0.45), { desc: 'Numbs the wound.' }],
  witch_brew_staff:['Witch Brew Staff', 'staff', 3, '#7bff5a', 1.4, FX.poison(5), { proj: { kind: 'poison', explode: 70 }, desc: 'Bubbling with bad ideas.' }],
  imp_wand:        ['Imp Wand', 'wand', 3, '#ff6a2a', 1.4, FX.burn(6), { proj: { kind: 'fire' }, desc: 'Sets things alight.' }],
  magma_maul:      ['Magma Maul', 'hammer', 4, '#ff5a1a', 1.35, FX.burn(9), { desc: 'Still hot from the forge.' }],
  soul_reaper:     ['Soul Reaper', 'scythe', 4, '#7a5ac0', 1.4, FX.life(0.1), { desc: 'Harvests life.' }],
  wyvern_lance:    ['Wyvern Lance', 'spear', 5, '#c44a2a', 1.4, FX.burn(10), { melee: { range: 140, arc: 36, knock: 140 }, desc: 'Long, hot and pointy.' }],
  eye_staff:       ['Eye Staff', 'staff', 1, '#e8e8f0', 1.5, FX.life(0.06), { proj: { kind: 'eye' }, desc: 'It watches.' }],
  // ---- boss drops
  royal_gel_blade: ['Royal Gel Blade', 'sword', 1, '#4fd04f', 1.6, FX.slow(0.55), { rarity: 'rare', desc: 'Slime King\'s own blade.' }],
  bouncy_gel_staff:['Bouncy Gel Staff', 'staff', 1, '#4fd04f', 1.6, FX.slow(0.6), { proj: { kind: 'gel', pierce: 1, explode: 55 }, rarity: 'rare' }],
  thorn_bow:       ['Thornwood Bow', 'bow', 2, '#2f8a38', 1.5, FX.poison(4), { proj: { kind: 'thorn', count: 2, spread: 0.18 }, rarity: 'rare', desc: 'Fires two thorns at once.' }],
  ent_club:        ['Ent Club', 'hammer', 2, '#6b4423', 1.5, null, { melee: { range: 78, arc: 130, knock: 520 }, rarity: 'rare' }],
  sun_scepter:     ['Sun Scepter', 'wand', 3, '#ffd23f', 1.6, FX.burn(8), { proj: { kind: 'fire' }, rarity: 'epic', desc: 'A fragment of the desert sun.' }],
  khopesh:         ['Pharaoh\'s Khopesh', 'sword', 3, '#e6c34a', 1.5, FX.burn(5), { crit: 10, rarity: 'epic' }],
  glacier_hammer:  ['Glacier Hammer', 'hammer', 4, '#9be7ff', 1.5, FX.slow(0.4), { rarity: 'epic', desc: 'Shatters and freezes.' }],
  blizzard_staff:  ['Blizzard Staff', 'staff', 4, '#bfe8ff', 1.5, FX.slow(0.45), { proj: { kind: 'ice', count: 3, spread: 0.35, explode: 30 }, rarity: 'epic' }],
  bog_lash:        ['Bog Lash', 'whip', 4, '#5a7a3a', 1.6, FX.poison(6), { rarity: 'epic' }],
  rotwood_bow:     ['Rotwood Bow', 'bow', 4, '#6a8a3a', 1.5, FX.poison(5), { proj: { kind: 'poison' }, rarity: 'epic' }],
  volcano:         ['Volcano', 'sword', 4, '#ff5a1a', 1.7, FX.burn(12), { proj: { kind: 'fire', speed: 560, life: 0.7, radius: 13, count: 1, spread: 0, pierce: 1, explode: 50 }, rarity: 'legendary', desc: 'Forged from hellstone. Erupts with every swing.' }],
  hellfire_bow:    ['Hellfire Bow', 'bow', 4, '#ff7a2a', 1.7, FX.burn(10), { proj: { kind: 'fire', count: 2, spread: 0.2 }, rarity: 'legendary', desc: 'Arrows ignite on release.' }],
  wyrm_lance:      ['Wyrmfire Lance', 'spear', 5, '#ff5a1a', 1.6, FX.burn(14), { melee: { range: 150, arc: 36, knock: 160 }, rarity: 'legendary' }],
  lich_scythe:     ['Lich Scythe', 'scythe', 5, '#7a2aff', 1.6, FX.life(0.12), { rarity: 'legendary' }],
  soul_tome:       ['Tome of Souls', 'tome', 5, '#b06aff', 1.6, FX.life(0.05), { proj: { kind: 'soul', count: 5, spread: 0.7 }, rarity: 'legendary' }],
  void_edge:       ['Void Edge', 'sword', 6, '#6a2aff', 1.7, FX.life(0.1), { proj: { kind: 'void', speed: 700, life: 0.8, radius: 12, count: 1, spread: 0, pierce: 2 }, rarity: 'mythic' }],
  eclipse_staff:   ['Eclipse Staff', 'staff', 6, '#9a4aff', 1.7, null, { proj: { kind: 'void', explode: 90 }, rarity: 'mythic' }],
  cog_cleaver:     ['Cog Cleaver', 'axe', 6, '#c6a050', 1.7, null, { melee: { range: 80, arc: 110, knock: 300 }, rarity: 'mythic', desc: 'Chops trees and robots alike.' }],
  cog_repeater:    ['Cog Repeater', 'crossbow', 6, '#c6a050', 1.7, null, { cd: 0.5, proj: { kind: 'bolt' }, rarity: 'mythic' }],
  star_wrath:      ['Star Wrath', 'sword', 7, '#fff3a8', 1.8, FX.burn(20), { proj: { kind: 'star', count: 3, spread: 0.3, speed: 800, life: 0.9, radius: 11, pierce: 1 }, rarity: 'mythic', desc: 'Calls the stars down.' }],
  dread_lens:      ['Lens Launcher', 'crossbow', 2, '#c0262d', 1.5, FX.life(0.05), { proj: { kind: 'eye' }, rarity: 'rare', desc: 'Fires bloodshot lenses.' }],
  eye_scythe:      ['Dread Scythe', 'scythe', 2, '#c0262d', 1.5, FX.life(0.08), { rarity: 'rare' }],
  goblin_banner_blade: ['Warlord Cleaver', 'axe', 2, '#6aa84f', 1.5, null, { crit: 12, rarity: 'rare' }],
};
module.exports = { HAND, SPEC };
