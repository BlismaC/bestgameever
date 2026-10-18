// FUSION weapons: crafted by combining other weapons (and boss drops) at a high-tier station.
// Ingredients that are weapons are consumed. Each fires a special projectile (waves, homing bolts ...).
// [name, archetype, tier, colour, dmgMul, fx, {melee,proj,crit,rarity,desc}, recipe{item:count}, station]
module.exports = {
  verdant_edge: ['Verdant Edge', 'sword', 5, '#4aff9a', 1.9, { poison: { dps: 6, dur: 4 } },
    { melee: { range: 105, arc: 125, knock: 220 }, crit: 9, rarity: 'legendary', desc: 'Each swing sends a green sword wave that pierces through enemies.',
      proj: { kind: 'wave', speed: 560, life: 0.6, radius: 22, count: 1, spread: 0, pierce: 4 } },
    { emerald_sword: 1, jade_sword: 1, khopesh: 1, emerald: 8, leather: 4 }, 'arcane_altar'],
  glacial_reaver: ['Glacial Reaver', 'sword', 5, '#6ac8ff', 1.9, { slow: { mult: 0.45, dur: 2.5 } },
    { melee: { range: 105, arc: 125, knock: 220 }, crit: 9, rarity: 'legendary', desc: 'A freezing wave that slows everything it cuts.',
      proj: { kind: 'wave', speed: 540, life: 0.6, radius: 22, count: 1, spread: 0, pierce: 4 } },
    { ice_sword: 1, sapphire_sword: 1, frostbite: 1, ice: 10, sapphire: 4 }, 'arcane_altar'],
  infernal_edge: ['Infernal Edge', 'sword', 5, '#ff7a2a', 1.95, { burn: { dps: 12, dur: 4 } },
    { melee: { range: 105, arc: 125, knock: 220 }, crit: 9, rarity: 'legendary', desc: 'A blazing wave that sets enemies alight.',
      proj: { kind: 'wave', speed: 580, life: 0.6, radius: 22, count: 1, spread: 0, pierce: 4 } },
    { ruby_sword: 1, volcano: 1, hellstone: 12, obsidian: 6 }, 'arcane_altar'],
  prismatic_edge: ['Prismatic Edge', 'sword', 7, '#ffffff', 1.9, { burn: { dps: 16, dur: 4 }, slow: { mult: 0.5, dur: 2 }, lifesteal: 0.06 },
    { melee: { range: 125, arc: 140, knock: 260 }, cd: 0.42, crit: 12, rarity: 'mythic', desc: 'Three elemental waves fan out with every swing.',
      proj: { kind: 'wave', speed: 620, life: 0.7, radius: 24, count: 3, spread: 0.55, pierce: 5, colors: ['#4aff9a', '#6ac8ff', '#ff7a2a'] } },
    { verdant_edge: 1, glacial_reaver: 1, infernal_edge: 1, celestial: 8, void: 4 }, 'void_anvil'],
  tempest_staff: ['Tempest Staff', 'staff', 5, '#9a8aff', 1.7, null,
    { rarity: 'epic', cd: 0.55, desc: 'Launches homing storm bolts that hunt down enemies.',
      proj: { kind: 'bolt', speed: 460, life: 1.6, radius: 10, count: 2, spread: 0.5, pierce: 0, beh: 'homing', turn: 3.6, explode: 40, colors: ['#bfe8ff', '#ffd23f'] } },
    { blizzard_staff: 1, sun_scepter: 1, amethyst: 6 }, 'arcane_altar'],
};
