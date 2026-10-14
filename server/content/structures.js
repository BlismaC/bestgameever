// Placeable structures (items with the same id are auto-created). kind = which tool type damages it fastest.
// type: station | wall | spike | trap | fire.   cost/station = crafting recipe (station null = by hand).
module.exports = {
  workbench:     { name: 'Workbench', emoji: '🛠️', color: '#a0703c', r: 34, hp: 300, solid: true, kind: 'wood', type: 'station', provides: 'workbench', cost: { wood: 30, stone: 10 }, station: null, desc: 'Craft tools, basic weapons, walls and traps.' },
  forge:         { name: 'Forge', emoji: '🔥', color: '#8a8f98', r: 38, hp: 500, solid: true, kind: 'stone', type: 'station', provides: 'forge', cost: { stone: 50, copper: 12, wood: 10 }, station: 'workbench', desc: 'Smith iron-age gear (tier 2-3 weapons, iron walls).' },
  alchemy_table: { name: 'Alchemy Table', emoji: '⚗️', color: '#7a4fb0', r: 32, hp: 250, solid: true, kind: 'wood', type: 'station', provides: 'alchemy_table', cost: { wood: 20, slime_gel: 12, copper: 6 }, station: 'workbench', desc: 'Brew potions.' },
  arcane_altar:  { name: 'Arcane Altar', emoji: '🔮', color: '#6a5acd', r: 38, hp: 600, solid: true, kind: 'stone', type: 'station', provides: 'arcane_altar', cost: { stone: 60, gold: 10, amethyst: 5, ice: 5 }, station: 'forge', desc: 'Enchant gem-age gear (tier 4-5) and summon bosses.' },
  void_anvil:    { name: 'Void Anvil', emoji: '🕳️', color: '#2a0a55', r: 42, hp: 900, solid: true, kind: 'metal', type: 'station', provides: 'void_anvil', cost: { titanium: 12, obsidian: 20, shadow: 8 }, station: 'arcane_altar', desc: 'Forge endgame gear (tier 6-7) and call the great bosses.' },

  wall_wood:     { name: 'Wooden Wall', emoji: '🪵', color: '#a0703c', r: 30, hp: 350, solid: true, kind: 'wood', type: 'wall', cost: { wood: 10 }, station: 'workbench', desc: 'Cheap barrier.' },
  wall_stone:    { name: 'Stone Wall', emoji: '🧱', color: '#8a8f98', r: 30, hp: 900, solid: true, kind: 'stone', type: 'wall', cost: { stone: 14, wood: 2 }, station: 'workbench', desc: 'Sturdy barrier.' },
  wall_iron:     { name: 'Iron Wall', emoji: '⬜', color: '#b7bcc4', r: 30, hp: 2200, solid: true, kind: 'metal', type: 'wall', cost: { iron: 10, stone: 6 }, station: 'forge', desc: 'Hard to break.' },
  spikes_wood:   { name: 'Wooden Spikes', emoji: '🌵', color: '#a0703c', r: 28, hp: 250, solid: true, kind: 'wood', type: 'spike', dmg: 12, cost: { wood: 12 }, station: 'workbench', desc: 'Hurts whoever touches them (not you).' },
  spikes_stone:  { name: 'Stone Spikes', emoji: '🔺', color: '#8a8f98', r: 28, hp: 600, solid: true, kind: 'stone', type: 'spike', dmg: 22, cost: { stone: 16, wood: 4 }, station: 'workbench', desc: 'Hurts more.' },
  spikes_iron:   { name: 'Iron Spikes', emoji: '⚔️', color: '#c9d0d8', r: 28, hp: 1200, solid: true, kind: 'metal', type: 'spike', dmg: 38, cost: { iron: 14, wood: 4 }, station: 'forge', desc: 'Brutal.' },
  bear_trap:     { name: 'Bear Trap', emoji: '🪤', color: '#9aa0a8', r: 24, hp: 60, solid: false, kind: 'metal', type: 'trap', dmg: 28, root: 2.5, rearm: 10, cost: { copper: 8, wood: 6 }, station: 'workbench', desc: 'Roots and wounds anything that steps on it.' },
  campfire:      { name: 'Campfire', emoji: '🏕️', color: '#ff9a3a', r: 26, hp: 80, solid: false, kind: 'wood', type: 'fire', heal: 4, healRange: 170, cost: { wood: 8, stone: 4 }, station: null, desc: 'Heals nearby players and lights the night.' },
};
