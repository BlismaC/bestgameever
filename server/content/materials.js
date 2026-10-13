// Material tiers. Each material automatically becomes an item AND multiplies into every weapon archetype.
// tier = progression level (also the "tool tier" for mining). dmg = damage multiplier.
// ADD A MATERIAL = every archetype gets a new weapon automatically.
module.exports = [
  { id: 'wood',      name: 'Wood',      tier: 0, dmg: 1.0, color: '#a0703c', emoji: '🪵' },
  { id: 'stone',     name: 'Stone',     tier: 0, dmg: 1.25, color: '#8a8f98', emoji: '🪨' },
  { id: 'bone',      name: 'Bone',      tier: 0, dmg: 1.35, color: '#e8e2cf', emoji: '🦴' },
  { id: 'copper',    name: 'Copper',    tier: 1, dmg: 1.6, color: '#c8743a', emoji: '🟠' },
  { id: 'bronze',    name: 'Bronze',    tier: 1, dmg: 1.8, color: '#b08d57', emoji: '🥉' },
  { id: 'iron',      name: 'Iron',      tier: 2, dmg: 2.2, color: '#b7bcc4', emoji: '⛓️' },
  { id: 'steel',     name: 'Steel',     tier: 2, dmg: 2.6, color: '#9fb2c4', emoji: '🔩' },
  { id: 'silver',    name: 'Silver',    tier: 3, dmg: 3.0, color: '#dfe6ee', emoji: '🥈' },
  { id: 'gold',      name: 'Gold',      tier: 3, dmg: 2.8, color: '#ffd23f', emoji: '🥇' },
  { id: 'obsidian',  name: 'Obsidian',  tier: 3, dmg: 3.5, color: '#2b1b3d', emoji: '⬛' },
  { id: 'ice',       name: 'Ice',       tier: 3, dmg: 3.1, color: '#9be7ff', emoji: '🧊' },
  { id: 'jade',      name: 'Jade',      tier: 4, dmg: 3.8, color: '#38b36f', emoji: '🟩' },
  { id: 'ruby',      name: 'Ruby',      tier: 4, dmg: 4.2, color: '#e0245e', emoji: '🔴' },
  { id: 'sapphire',  name: 'Sapphire',  tier: 4, dmg: 4.2, color: '#2f6bff', emoji: '🔷' },
  { id: 'emerald',   name: 'Emerald',   tier: 4, dmg: 4.2, color: '#1fcf7a', emoji: '💚' },
  { id: 'amethyst',  name: 'Amethyst',  tier: 4, dmg: 4.3, color: '#a45cff', emoji: '🟣' },
  { id: 'titanium',  name: 'Titanium',  tier: 5, dmg: 5.0, color: '#c9d4de', emoji: '⚙️' },
  { id: 'mythril',   name: 'Mythril',   tier: 5, dmg: 5.8, color: '#6ff0e0', emoji: '✨' },
  { id: 'dragon',    name: 'Dragonscale', tier: 6, dmg: 7.2, color: '#ff5a2a', emoji: '🐲' },
  { id: 'shadow',    name: 'Shadow',    tier: 6, dmg: 7.5, color: '#4b3b78', emoji: '🌑' },
  { id: 'cursed',    name: 'Cursed',    tier: 6, dmg: 7.0, color: '#7bff5a', emoji: '💀' },
  { id: 'void',      name: 'Void',      tier: 7, dmg: 9.5, color: '#1a0033', emoji: '🕳️' },
  { id: 'plasma',    name: 'Plasma',    tier: 7, dmg: 9.8, color: '#ff4df0', emoji: '⚡' },
  { id: 'celestial', name: 'Celestial', tier: 7, dmg: 10.5, color: '#fff3a8', emoji: '🌟' },
];
