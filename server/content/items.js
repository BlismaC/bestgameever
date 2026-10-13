// Non-weapon items: foods, drops, potions. (Materials & weapons are generated in index.js)
// use: {heal:n} | {buff:{speed:mult,dur}} | {xp:n} | {summon:'bossId'}
module.exports = {
  meat:         { name: 'Raw Meat', emoji: '🥩', color: '#d9534f', type: 'consumable', use: { heal: 12 } },
  apple:        { name: 'Apple', emoji: '🍎', color: '#e03c3c', type: 'consumable', use: { heal: 10 } },
  berries:      { name: 'Berries', emoji: '🫐', color: '#5b6dd8', type: 'consumable', use: { heal: 6 } },
  cactus_flesh: { name: 'Cactus Flesh', emoji: '🌵', color: '#3f9a4a', type: 'consumable', use: { heal: 8 } },
  leather:      { name: 'Leather', emoji: '🟤', color: '#8b5a2b', type: 'material' },
  slime_gel:    { name: 'Slime Gel', emoji: '🫠', color: '#5fd35f', type: 'material' },
  potion_heal:  { name: 'Healing Potion', emoji: '🧪', color: '#ff5577', type: 'consumable', rarity: 'uncommon', use: { heal: 60 } },
  potion_speed: { name: 'Swiftness Potion', emoji: '⚡', color: '#ffe14a', type: 'consumable', rarity: 'uncommon', use: { buff: { speed: 1.45, dur: 25 } } },
  tome_of_xp:   { name: 'Tome of Knowledge', emoji: '📚', color: '#a45cff', type: 'consumable', rarity: 'rare', use: { xp: 150 } },
  holy_milk:    { name: 'Holy Milk', emoji: '🥛', color: '#ffffff', type: 'consumable', rarity: 'legendary', desc: 'Summons Moo Moo, the Cow God. Why would you.', use: { summon: 'cow_god' } },
};
