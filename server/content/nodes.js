// Harvestable world nodes. tierReq = minimum tool tier (material tier of weapon) to get drops.
// shape: tree | rock | ore | bush | cactus | crystal   (renderer is data-driven by shape+colors)
const ore = (id, name, item, tierReq, color, extra = {}) => ({
  name, kind: 'ore', shape: 'ore', hp: 80 + tierReq * 70, radius: 32, tierReq, respawn: 110 + tierReq * 60,
  color: '#7d828c', color2: color, drops: [{ item, min: 1, max: 2 }], ...extra,
});
module.exports = {
  tree:       { name: 'Oak Tree', kind: 'tree', shape: 'tree', hp: 30, radius: 34, tierReq: 0, respawn: 60, color: '#2f8a38', color2: '#6b4423', drops: [{ item: 'wood', min: 1, max: 2 }] },
  pine:       { name: 'Pine Tree', kind: 'tree', shape: 'tree', hp: 34, radius: 34, tierReq: 0, respawn: 60, color: '#1f6b4a', color2: '#5a3b20', drops: [{ item: 'wood', min: 1, max: 2 }] },
  dead_tree:  { name: 'Dead Tree', kind: 'tree', shape: 'tree', hp: 24, radius: 30, tierReq: 0, respawn: 60, color: '#7a6a55', color2: '#4a3a2a', drops: [{ item: 'wood', min: 1, max: 1 }] },
  rock:       { name: 'Boulder', kind: 'rock', shape: 'rock', hp: 50, radius: 36, tierReq: 0, respawn: 75, color: '#8a8f98', color2: '#a8adb6', drops: [{ item: 'stone', min: 1, max: 2 }] },
  obsidian_rock: { name: 'Obsidian Spire', minZone: 0.1, kind: 'rock', shape: 'crystal', hp: 140, radius: 34, tierReq: 2, respawn: 120, color: '#2b1b3d', color2: '#5a3a8a', drops: [{ item: 'obsidian', min: 1, max: 2 }] },
  ice_crystal:{ name: 'Ice Crystal', minZone: 0.1, kind: 'rock', shape: 'crystal', hp: 120, radius: 30, tierReq: 2, respawn: 120, color: '#9be7ff', color2: '#e6fbff', drops: [{ item: 'ice', min: 1, max: 2 }] },
  cactus:     { name: 'Cactus', kind: 'bush', shape: 'cactus', hp: 20, radius: 24, tierReq: 0, respawn: 50, color: '#3f9a4a', color2: '#2d7a38', drops: [{ item: 'cactus_flesh', min: 1, max: 2 }] },
  berry_bush: { name: 'Berry Bush', kind: 'bush', shape: 'bush', hp: 15, radius: 24, tierReq: 0, respawn: 40, solid: false, color: '#3f8f3a', color2: '#d8344f', drops: [{ item: 'berries', min: 1, max: 3 }] },

  copper_ore:   ore('copper_ore', 'Copper Ore', 'copper', 0, '#c8743a'),
  iron_ore:     ore('iron_ore', 'Iron Ore', 'iron', 1, '#d6d9de', { minZone: 0.05 }),
  silver_ore:   ore('silver_ore', 'Silver Ore', 'silver', 2, '#f2f6fb', { minZone: 0.2 }),
  gold_ore:     ore('gold_ore', 'Gold Ore', 'gold', 2, '#ffd23f', { minZone: 0.2 }),
  hellstone_ore: ore('hellstone_ore', 'Hellstone Ore', 'hellstone', 3, '#ff5a1a', { minZone: 0.25 }),
  jade_ore:     ore('jade_ore', 'Jade Ore', 'jade', 3, '#38b36f', { minZone: 0.35 }),
  ruby_ore:     ore('ruby_ore', 'Ruby Ore', 'ruby', 3, '#e0245e', { minZone: 0.35 }),
  sapphire_ore: ore('sapphire_ore', 'Sapphire Ore', 'sapphire', 3, '#2f6bff', { minZone: 0.35 }),
  emerald_ore:  ore('emerald_ore', 'Emerald Ore', 'emerald', 3, '#1fcf7a', { minZone: 0.3 }),
  amethyst_ore: ore('amethyst_ore', 'Amethyst Ore', 'amethyst', 3, '#a45cff', { minZone: 0.3 }),
  titanium_ore: ore('titanium_ore', 'Titanium Ore', 'titanium', 4, '#c9d4de', { minZone: 0.62 }),
  mythril_ore:  ore('mythril_ore', 'Mythril Ore', 'mythril', 5, '#6ff0e0', { minZone: 0.78 }),

  palm_tree:   { name: 'Palm Tree', kind: 'tree', shape: 'tree', hp: 30, radius: 30, tierReq: 0, respawn: 60, color: '#4aa83a', color2: '#8a6a40', drops: [{ item: 'wood', min: 1, max: 2 }] },
  jungle_tree: { name: 'Jungle Tree', kind: 'tree', shape: 'tree', hp: 36, radius: 36, tierReq: 0, respawn: 60, color: '#1f8a3a', color2: '#5a4020', drops: [{ item: 'wood', min: 1, max: 3 }, { item: 'jungle_fruit', min: 1, max: 1, chance: 0.12 }] },
  blight_tree: { name: 'Blighted Tree', kind: 'tree', shape: 'tree', hp: 36, radius: 34, tierReq: 0, respawn: 70, color: '#5a4a6a', color2: '#2a2030', drops: [{ item: 'wood', min: 1, max: 2 }] },
  mushroom_cluster: { name: 'Glowcap Cluster', kind: 'bush', shape: 'bush', hp: 18, radius: 22, tierReq: 0, respawn: 50, solid: false, color: '#3a6a8a', color2: '#7ad0ff', drops: [{ item: 'mushroom', min: 1, max: 3 }] },
  bone_pile:   { name: 'Bone Pile', kind: 'rock', shape: 'rock', hp: 40, radius: 30, tierReq: 0, respawn: 90, color: '#d8d2bc', color2: '#f0ead8', drops: [{ item: 'bone', min: 2, max: 4 }, { item: 'coin', min: 2, max: 9, chance: 0.4 }] },
  tombstone:   { name: 'Tombstone', kind: 'rock', shape: 'rock', hp: 70, radius: 32, tierReq: 0, respawn: 120, color: '#6a6f78', color2: '#8a8f98', drops: [{ item: 'stone', min: 1, max: 2 }, { item: 'bone', min: 0, max: 2, chance: 0.5 }, { item: 'ectoplasm', min: 1, max: 1, chance: 0.08 }] },
  coral_rock:  { name: 'Coral Reef', kind: 'rock', shape: 'rock', hp: 90, radius: 34, tierReq: 1, respawn: 120, color: '#ff7a8a', color2: '#ffc0c8', drops: [{ item: 'coral_shard', min: 1, max: 2 }] },
  kelp:        { name: 'Kelp Forest', kind: 'bush', shape: 'bush', hp: 16, radius: 22, tierReq: 0, respawn: 40, solid: false, color: '#2f8a5a', color2: '#7ad0a0', drops: [{ item: 'kelp', min: 1, max: 3 }] },
  pearl_clam:  { name: 'Giant Clam', kind: 'ore', shape: 'rock', hp: 240, radius: 30, tierReq: 2, respawn: 240, color: '#cfc0d8', color2: '#f4f0ff', drops: [{ item: 'pearl', min: 1, max: 1 }, { item: 'coin', min: 10, max: 40 }] },
  cobalt_ore:  ore('cobalt_ore', 'Cobalt Ore', 'cobalt', 2, '#2a56c8', { minZone: 0.3 }),
  crystal_cluster: { name: 'Crystal Cluster', kind: 'ore', shape: 'crystal', hp: 260, radius: 34, tierReq: 3, respawn: 220, minZone: 0.5, color: '#c8a0ff', color2: '#f0e0ff', drops: [{ item: 'crystal', min: 1, max: 2 }] },
  bloodstone_ore: ore('bloodstone_ore', 'Bloodstone Ore', 'bloodstone', 4, '#c01030', { minZone: 0.6 }),
  starmetal_ore:  ore('starmetal_ore', 'Starmetal Ore', 'starmetal', 5, '#a0b8ff', { minZone: 0.72 }),
};
