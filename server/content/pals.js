// PALS: wild creatures you TAME. They roam the world as "Wild <name>" (shown with a level). Weaken one, throw a Pal Sphere, and if it holds
// you own a living companion: it fights next to you, auto-mines ore, gains levels, has traits and can be renamed or released.
// element colours the attack effect. mine = highest ore tier it can dig. atk = base damage per hit. rarity 1 (common) .. 4 (legendary).
module.exports = {
  pebblin:   { name: 'Pebblin',   element: 'earth',   rarity: 1, color: '#8a8f98', accent: '#b8bcc4', mine: 0, atk: 9,  habitat: ['plains', 'highlands', 'forest'],        desc: 'A shy pebble critter that loves to chew boulders.' },
  mossback:  { name: 'Mossback',  element: 'earth',   rarity: 1, color: '#5a8a4a', accent: '#8ac060', mine: 1, atk: 11, habitat: ['plains', 'forest', 'swamp', 'jungle'],   desc: 'A mossy tortoise. Slow, sturdy and surprisingly good at mining.' },
  sparklit:  { name: 'Sparklit',  element: 'storm',   rarity: 1, color: '#ffe14a', accent: '#fff6a0', mine: 1, atk: 13, habitat: ['plains', 'highlands', 'desert'],         desc: 'A crackling little rodent. Zaps anything that bothers it.' },
  leafling:  { name: 'Leafling',  element: 'nature',  rarity: 1, color: '#4aa84a', accent: '#a0e070', mine: 1, atk: 12, habitat: ['forest', 'jungle', 'deep_jungle', 'darkwood'], desc: 'A leafy fawn that mends the forest floor.' },
  aquafin:   { name: 'Aquafin',   element: 'water',   rarity: 2, color: '#4aa8e0', accent: '#a0e0ff', mine: 2, atk: 14, habitat: ['swamp', 'jungle', 'forest', 'plains'],   desc: 'A playful water-cat. Never far from a lake.' },
  cinderfox: { name: 'Cinderfox', element: 'fire',    rarity: 2, color: '#e86a2a', accent: '#ffd23f', mine: 3, atk: 18, habitat: ['scorched', 'volcanic', 'desert', 'badlands'], desc: 'A fox with a burning tail. Melts ore like butter.' },
  frostpaw:  { name: 'Frostpaw',  element: 'ice',     rarity: 2, color: '#bfe8ff', accent: '#ffffff', mine: 3, atk: 16, habitat: ['snow', 'glacier'],                       desc: 'A fluffy ice cub whose footprints freeze.' },
  sunbird:   { name: 'Sunbird',   element: 'light',   rarity: 2, color: '#ffb02e', accent: '#fff3a8', mine: 2, atk: 17, habitat: ['desert', 'jungle', 'badlands'],          desc: 'A radiant bird that lights up the dark.' },
  gloomoth:  { name: 'Gloomoth',  element: 'dark',    rarity: 3, color: '#5a4a8a', accent: '#c8a0ff', mine: 4, atk: 22, habitat: ['moors', 'cursed', 'darkwood', 'blightfen'], desc: 'A moth drawn to gravelight. Its dust makes foes drowsy.' },
  oreback:   { name: 'Oreback',   element: 'earth',   rarity: 3, color: '#7a6a5a', accent: '#ffd23f', mine: 4, atk: 20, habitat: ['highlands', 'peaks', 'badlands'],        desc: 'An armadillo with gold-veined plates. A born miner.' },
  wispy:     { name: 'Wispy',     element: 'ghost',   rarity: 3, color: '#a8f0e0', accent: '#ffffff', mine: 3, atk: 19, habitat: ['moors', 'swamp', 'cursed'],              desc: 'A lantern spirit. Phases through rock to find ore.' },
  drakeling: { name: 'Drakeling', element: 'dragon',  rarity: 3, color: '#c44a4a', accent: '#ffb02e', mine: 5, atk: 26, habitat: ['volcanic', 'peaks', 'deep_jungle'],      desc: 'A baby dragon. Still learns to breathe fire.' },
  crystaleon:{ name: 'Crystaleon',element: 'crystal', rarity: 4, color: '#c8a0ff', accent: '#f0e0ff', mine: 5, atk: 28, habitat: ['peaks', 'glacier'],                      desc: 'A prismatic beast. Sings ore out of the ground.' },
  voidling:  { name: 'Voidling',  element: 'void',    rarity: 4, color: '#3a1a6a', accent: '#9a4aff', mine: 6, atk: 32, habitat: ['cursed', 'peaks', 'blightfen'],          desc: 'A shard of nothing wearing a smile.' },
};
