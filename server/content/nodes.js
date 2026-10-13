// Harvestable world nodes. tierReq = minimum tool tier (material tier of weapon) to get drops.
// shape: tree | rock | ore | bush | cactus | crystal   (renderer is data-driven by shape+colors)
const ore = (id, name, item, tierReq, color, extra = {}) => ({
  name, kind: 'ore', shape: 'ore', hp: 70 + tierReq * 25, radius: 32, tierReq, respawn: 90 + tierReq * 30,
  color: '#7d828c', color2: color, drops: [{ item, min: 1, max: 2 }], ...extra,
});
module.exports = {
  tree:       { name: 'Oak Tree', kind: 'tree', shape: 'tree', hp: 30, radius: 34, tierReq: 0, respawn: 60, color: '#2f8a38', color2: '#6b4423', drops: [{ item: 'wood', min: 1, max: 2 }] },
  pine:       { name: 'Pine Tree', kind: 'tree', shape: 'tree', hp: 34, radius: 34, tierReq: 0, respawn: 60, color: '#1f6b4a', color2: '#5a3b20', drops: [{ item: 'wood', min: 1, max: 2 }] },
  dead_tree:  { name: 'Dead Tree', kind: 'tree', shape: 'tree', hp: 24, radius: 30, tierReq: 0, respawn: 60, color: '#7a6a55', color2: '#4a3a2a', drops: [{ item: 'wood', min: 1, max: 1 }] },
  rock:       { name: 'Boulder', kind: 'rock', shape: 'rock', hp: 50, radius: 36, tierReq: 0, respawn: 75, color: '#8a8f98', color2: '#a8adb6', drops: [{ item: 'stone', min: 1, max: 2 }] },
  obsidian_rock: { name: 'Obsidian Spire', kind: 'rock', shape: 'crystal', hp: 140, radius: 34, tierReq: 2, respawn: 120, color: '#2b1b3d', color2: '#5a3a8a', drops: [{ item: 'obsidian', min: 1, max: 2 }] },
  ice_crystal:{ name: 'Ice Crystal', kind: 'rock', shape: 'crystal', hp: 120, radius: 30, tierReq: 2, respawn: 120, color: '#9be7ff', color2: '#e6fbff', drops: [{ item: 'ice', min: 1, max: 2 }] },
  cactus:     { name: 'Cactus', kind: 'bush', shape: 'cactus', hp: 20, radius: 24, tierReq: 0, respawn: 50, color: '#3f9a4a', color2: '#2d7a38', drops: [{ item: 'cactus_flesh', min: 1, max: 2 }] },
  berry_bush: { name: 'Berry Bush', kind: 'bush', shape: 'bush', hp: 15, radius: 24, tierReq: 0, respawn: 40, solid: false, color: '#3f8f3a', color2: '#d8344f', drops: [{ item: 'berries', min: 1, max: 3 }] },

  copper_ore:   ore('copper_ore', 'Copper Ore', 'copper', 0, '#c8743a'),
  iron_ore:     ore('iron_ore', 'Iron Ore', 'iron', 1, '#d6d9de'),
  silver_ore:   ore('silver_ore', 'Silver Ore', 'silver', 2, '#f2f6fb'),
  gold_ore:     ore('gold_ore', 'Gold Ore', 'gold', 2, '#ffd23f'),
  jade_ore:     ore('jade_ore', 'Jade Ore', 'jade', 3, '#38b36f'),
  ruby_ore:     ore('ruby_ore', 'Ruby Ore', 'ruby', 3, '#e0245e'),
  sapphire_ore: ore('sapphire_ore', 'Sapphire Ore', 'sapphire', 3, '#2f6bff'),
  emerald_ore:  ore('emerald_ore', 'Emerald Ore', 'emerald', 3, '#1fcf7a'),
  amethyst_ore: ore('amethyst_ore', 'Amethyst Ore', 'amethyst', 3, '#a45cff'),
  titanium_ore: ore('titanium_ore', 'Titanium Ore', 'titanium', 4, '#c9d4de'),
  mythril_ore:  ore('mythril_ore', 'Mythril Ore', 'mythril', 4, '#6ff0e0'),

  // Easter egg: a sword stuck in a stone. Keep hitting it...
  stone_with_sword: { name: 'Sword in the Stone', kind: 'rock', shape: 'rock', hp: 400, radius: 36, tierReq: 0, respawn: 600, color: '#9aa0ab', color2: '#ffe27a',
    drops: [{ item: 'stone', min: 1, max: 1 }, { item: 'excalibur_ish', min: 1, max: 1, chance: 0.04 }] },
};
