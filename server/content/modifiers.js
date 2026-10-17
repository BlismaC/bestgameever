// Item modifiers (Terraria-style). Each crafted/dropped weapon rolls one (or none).
// dmg/kb are % changes, crit is +percentage points, tier shifts rarity/colour, value is the % price change.
module.exports = [
  { id: 'keen',       n: 'Keen',       dmg: 0,   crit: 3, kb: 0,   tier: 1,  value: 12.36 },
  { id: 'superior',   n: 'Superior',   dmg: 10,  crit: 3, kb: 10,  tier: 2,  value: 64.51 },
  { id: 'forceful',   n: 'Forceful',   dmg: 0,   crit: 0, kb: 15,  tier: 1,  value: 37.59 },
  { id: 'broken',     n: 'Broken',     dmg: -30, crit: 0, kb: -20, tier: -2, value: -67.37 },
  { id: 'damaged',    n: 'Damaged',    dmg: -15, crit: 0, kb: 0,   tier: -1, value: -24.83 },
  { id: 'shoddy',     n: 'Shoddy',     dmg: -10, crit: 0, kb: -15, tier: -2, value: -39.11 },
  { id: 'hurtful',    n: 'Hurtful',    dmg: 10,  crit: 0, kb: 0,   tier: 1,  value: 25.89 },
  { id: 'strong',     n: 'Strong',     dmg: 0,   crit: 0, kb: 15,  tier: 1,  value: 37.59 },
  { id: 'unpleasant', n: 'Unpleasant', dmg: 5,   crit: 0, kb: 15,  tier: 2,  value: 51.7 },
  { id: 'weak',       n: 'Weak',       dmg: 0,   crit: 0, kb: -20, tier: -1, value: -33.41 },
  { id: 'ruthless',   n: 'Ruthless',   dmg: 18,  crit: 0, kb: -10, tier: 1,  value: 17.34 },
  { id: 'godly',      n: 'Godly',      dmg: 15,  crit: 5, kb: 15,  tier: 2,  value: 111.63 },
  { id: 'demonic',    n: 'Demonic',    dmg: 15,  crit: 5, kb: 0,   tier: 2,  value: 60.02 },
  { id: 'zealous',    n: 'Zealous',    dmg: 0,   crit: 5, kb: 0,   tier: 1,  value: 21 },
];
