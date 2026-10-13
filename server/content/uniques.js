// Hand-made weapons & easter eggs. Full control over every stat.
// weapon: {dmg, cooldown, melee?, projectile?, toolTier, gather, fx?}
const G0 = { tree: 0.5, rock: 0.3, ore: 0.2 };
module.exports = {
  moo_stick: { name: 'The Moo Stick', emoji: '🏏', color: '#ffffff', rarity: 'legendary', tier: 3, desc: 'Blessed by the Cow God. It just goes MOO.',
    weapon: { dmg: 42, cooldown: 0.5, melee: { range: 90, arc: 120, knock: 600 }, toolTier: 3, gather: G0 } },
  totally_not_terra_blade: { name: 'Totally Not A Terra Blade', emoji: '🗡️', color: '#7cffb2', rarity: 'mythic', tier: 7, desc: 'Any resemblance to other swords is purely coincidental.',
    weapon: { dmg: 120, cooldown: 0.4, melee: { range: 95, arc: 110, knock: 200 }, projectile: { speed: 900, life: 0.8, radius: 12, count: 1, spread: 0, pierce: 3 }, toolTier: 7, gather: G0, color: '#7cffb2' } },
  bfg_9000ish: { name: 'BFG-9000-ish', emoji: '🔫', color: '#7dff3a', rarity: 'mythic', tier: 7, desc: 'Big. Green. Questionable name.',
    weapon: { dmg: 420, cooldown: 2.5, projectile: { speed: 500, life: 2, radius: 30, count: 1, spread: 0, pierce: 0, explode: 190 }, toolTier: 0, gather: G0, color: '#7dff3a' } },
  rubber_duck_blaster: { name: 'Rubber Duck Blaster', emoji: '🦆', color: '#ffe14a', rarity: 'epic', tier: 1, desc: 'Squeak squeak squeak squeak.',
    weapon: { dmg: 5, cooldown: 0.1, projectile: { speed: 700, life: 0.8, radius: 8, count: 1, spread: 0.22, pierce: 0 }, toolTier: 0, gather: G0, color: '#ffe14a' } },
  companion_cube_launcher: { name: 'Weighted Cube Launcher', emoji: '📦', color: '#c9cfd8', rarity: 'epic', tier: 4, desc: 'The cube will not be missed.',
    weapon: { dmg: 70, cooldown: 1.4, projectile: { speed: 600, life: 1.5, radius: 22, count: 1, spread: 0, pierce: 1 }, toolTier: 0, gather: G0, color: '#c9cfd8' } },
  konami_blade: { name: 'Konami Blade', emoji: '🎮', color: '#ff4d4d', rarity: 'mythic', tier: 5, desc: '↑ ↑ ↓ ↓ ← → ← → B A',
    weapon: { dmg: 55, cooldown: 0.2, melee: { range: 80, arc: 130, knock: 100 }, toolTier: 5, gather: { tree: 2, rock: 2, ore: 2 } } },
  excalibur_ish: { name: 'Excalibur-ish', emoji: '⚔️', color: '#ffe27a', rarity: 'mythic', tier: 4, desc: 'Pulled from a stone. Probably legally distinct.',
    weapon: { dmg: 95, cooldown: 0.55, melee: { range: 105, arc: 140, knock: 250 }, toolTier: 4, gather: G0 } },
  hissing_bomb: { name: 'Hissing Bomb', emoji: '🧨', color: '#44cc44', rarity: 'rare', tier: 3, desc: 'Ssssssss...',
    weapon: { dmg: 110, cooldown: 1.5, projectile: { speed: 350, life: 0.9, radius: 12, count: 1, spread: 0, pierce: 0, explode: 150 }, toolTier: 0, gather: G0, color: '#44cc44' } },
};
