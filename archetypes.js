// Weapon archetypes. Every material x archetype x modifier becomes a weapon automatically.
// melee: {range, arc(deg), knock}   projectile: {speed, life, radius, count, spread(rad), pierce, explode}
// gather: damage multiplier vs resource nodes by kind (tree / rock / ore).
// cost = material units to craft the plain version.
module.exports = [
  { id: 'sword',    name: 'Sword',     emoji: '🗡️', dmg: 10, cd: 0.45, cost: 8,  melee: { range: 70, arc: 100, knock: 120 }, gather: { tree: 0.5, rock: 0.3, ore: 0.3 } },
  { id: 'dagger',   name: 'Dagger',    emoji: '🔪', dmg: 6,  cd: 0.22, cost: 5,  melee: { range: 50, arc: 70,  knock: 40 },  gather: { tree: 0.4, rock: 0.2, ore: 0.2 } },
  { id: 'axe',      name: 'Axe',       emoji: '🪓', dmg: 12, cd: 0.6,  cost: 9,  melee: { range: 65, arc: 90,  knock: 150 }, gather: { tree: 3, rock: 0.5, ore: 0.3 } },
  { id: 'pickaxe',  name: 'Pickaxe',   emoji: '⛏️', dmg: 8,  cd: 0.55, cost: 9,  melee: { range: 60, arc: 80,  knock: 80 },  gather: { tree: 0.5, rock: 3, ore: 3 } },
  { id: 'spear',    name: 'Spear',     emoji: '🔱', dmg: 11, cd: 0.55, cost: 7,  melee: { range: 115, arc: 40, knock: 100 }, gather: { tree: 0.4, rock: 0.3, ore: 0.3 } },
  { id: 'hammer',   name: 'Warhammer', emoji: '🔨', dmg: 24, cd: 1.1,  cost: 14, melee: { range: 75, arc: 120, knock: 420 }, gather: { tree: 0.6, rock: 1.5, ore: 1 } },
  { id: 'scythe',   name: 'Scythe',    emoji: '🌾', dmg: 14, cd: 0.7,  cost: 10, melee: { range: 90, arc: 160, knock: 140 }, gather: { tree: 0.6, rock: 0.3, ore: 0.2 } },
  { id: 'whip',     name: 'Whip',      emoji: '🪢', dmg: 9,  cd: 0.5,  cost: 6,  melee: { range: 135, arc: 30, knock: 30 },  gather: { tree: 0.3, rock: 0.2, ore: 0.2 } },
  { id: 'bow',      name: 'Bow',       emoji: '🏹', dmg: 9,  cd: 0.6,  cost: 8,  projectile: { speed: 720, life: 1.0, radius: 8, count: 1, spread: 0.04, pierce: 0 } },
  { id: 'crossbow', name: 'Crossbow',  emoji: '🎯', dmg: 20, cd: 1.2,  cost: 12, projectile: { speed: 1100, life: 0.9, radius: 9, count: 1, spread: 0.02, pierce: 1 } },
  { id: 'staff',    name: 'Staff',     emoji: '🔮', dmg: 14, cd: 0.8,  cost: 8,  projectile: { speed: 450, life: 1.2, radius: 14, count: 1, spread: 0, pierce: 0, explode: 55 } },
  { id: 'wand',     name: 'Wand',      emoji: '🪄', dmg: 7,  cd: 0.3,  cost: 5,  projectile: { speed: 650, life: 0.9, radius: 7, count: 1, spread: 0.06, pierce: 0 } },
  { id: 'tome',     name: 'Tome',      emoji: '📖', dmg: 6,  cd: 1.0,  cost: 10, projectile: { speed: 520, life: 0.9, radius: 8, count: 3, spread: 0.5, pierce: 0 } },
  { id: 'shuriken', name: 'Shuriken',  emoji: '⭐', dmg: 5,  cd: 0.25, cost: 6,  projectile: { speed: 800, life: 0.7, radius: 7, count: 1, spread: 0.1, pierce: 0 } },
];
