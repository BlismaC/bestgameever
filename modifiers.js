// Weapon modifiers (prefixes). 'normal' is the craftable base. Others drop from mobs/bosses.
// fx: on-hit effects. burn/poison {dpsMul of weapon dmg, dur}, slow {mult, dur}, lifesteal fraction.
module.exports = [
  { id: 'normal',    name: '',          rarity: 'common',    dmg: 1.0,  cd: 1.0 },
  { id: 'sharp',     name: 'Sharp',     rarity: 'uncommon',  dmg: 1.2,  cd: 1.0 },
  { id: 'swift',     name: 'Swift',     rarity: 'uncommon',  dmg: 1.0,  cd: 0.78 },
  { id: 'heavy',     name: 'Heavy',     rarity: 'rare',      dmg: 1.4,  cd: 1.2 },
  { id: 'flaming',   name: 'Flaming',   rarity: 'epic',      dmg: 1.1,  cd: 1.0, fx: { burn: { dpsMul: 0.35, dur: 3 } } },
  { id: 'frozen',    name: 'Frozen',    rarity: 'epic',      dmg: 1.1,  cd: 1.0, fx: { slow: { mult: 0.45, dur: 2.5 } } },
  { id: 'venomous',  name: 'Venomous',  rarity: 'epic',      dmg: 1.1,  cd: 1.0, fx: { poison: { dpsMul: 0.25, dur: 6 } } },
  { id: 'vampiric',  name: 'Vampiric',  rarity: 'epic',      dmg: 1.1,  cd: 1.0, fx: { lifesteal: 0.12 } },
  { id: 'legendary', name: 'Legendary', rarity: 'legendary', dmg: 1.9,  cd: 0.85, fx: { burn: { dpsMul: 0.2, dur: 2 }, lifesteal: 0.06 } },
];
