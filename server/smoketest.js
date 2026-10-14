'use strict';
// Headless test of the simulation (no network). Run: npm test
process.env.WORLD_SEED = process.env.WORLD_SEED || '4321';
const Game = require('./game');
const content = require('./content');
const g = new Game();
const msgs = [];
const fakeWs = { readyState: 1, bufferedAmount: 0, send: (s) => msgs.push(JSON.parse(s)) };
const p = g.addPlayer(fakeWs, 'Tester');
const q = g.addPlayer({ readyState: 1, bufferedAmount: 0, send() {} }, 'Other');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.error('FAIL:', m); } else console.log('ok  :', m); };
ok(msgs.find((m) => m.t === 'init'), 'init sent');
for (const c of ['/give totally_not_terra_blade', '/give iron_pickaxe', '/boss slime_king', '/mob wolf 5']) { g.handle(p, { t: 'chat', m: c }); g.tick(0.5); }
ok([...g.mobs.values()].some((m) => m.boss), 'boss spawned');
ok(content.items.flaming_ruby_sword && content.items.legendary_celestial_hammer, 'generated weapons exist');
for (let i = 0; i < 20 * 120; i++) {
  // wiggle, aim around and attack constantly
  if (i % 20 === 0) g.handle(p, { t: 'in', k: { u: i % 3 === 0, d: 0, l: 0, r: i % 3 !== 0 }, a: (i / 20) % 6.28, atk: true });
  if (i % 200 === 0) { g.handle(p, { t: 'sel', i: (i / 200) % 4 | 0 }); g.handle(p, { t: 'dash' }); }
  g.tick(0.05);
}
ok(g.time > 100, 'simulated 2 minutes without exceptions');
ok(msgs.filter((m) => m.t === 's').length > 100, 'snapshots streaming');
g.handle(p, { t: 'craft', id: 'wood_sword' });

// ---- building & crafting stations
const q2 = g.addPlayer({ readyState: 1, bufferedAmount: 0, send() {} }, 'Builder');
const cmd = (pl, c) => { g.time += 0.5; g.handle(pl, { t: 'chat', m: c }); };
q2.x = 12000 + 900; q2.y = 12000 + 900;  // away from safe zone
for (const r of g.world.res) if (Math.hypot(r.x - q2.x, r.y - q2.y) < 500) r.alive = false; // clear test area of trees
cmd(q2, '/give wood 200'); cmd(q2, '/give stone 100'); cmd(q2, '/give iron 50'); cmd(q2, '/give copper 50'); cmd(q2, '/give leather 20');
g.handle(q2, { t: 'craft', id: 'workbench' });
ok(g.countItem(q2, 'workbench') === 1, 'crafted workbench by hand');
const slotOf = (pl, id) => { const i = pl.inv.findIndex((x) => x && x.id === id); if (i >= 9) { g.handle(pl, { t: 'swap', a: i, b: 8 }); return 8; } return i; };
g.handle(q2, { t: 'sel', i: slotOf(q2, 'workbench') }); g.time += 1; g.handle(q2, { t: 'place', x: q2.x + 80, y: q2.y });
ok(g.structMap.size === 1, 'placed workbench');
g.handle(q2, { t: 'craft', id: 'wall_wood' }); ok(g.countItem(q2, 'wall_wood') === 1, 'crafted wall near workbench');
g.handle(q2, { t: 'craft', id: 'iron_sword' }); ok(g.countItem(q2, 'iron_sword') === 0, 'iron sword refused without forge');
g.handle(q2, { t: 'sel', i: slotOf(q2, 'wall_wood') }); g.time += 1; g.handle(q2, { t: 'place', x: q2.x - 70, y: q2.y });
ok(g.structMap.size === 2, 'placed wall');
g.handle(q2, { t: 'sel', i: slotOf(q2, 'wall_wood') }); g.time += 1; g.handle(q2, { t: 'place', x: q2.x - 70, y: q2.y });
ok(g.structMap.size === 2, 'overlapping placement rejected');
cmd(q2, '/give spikes_wood 2'); cmd(q2, '/give bear_trap 1');
g.handle(q2, { t: 'sel', i: slotOf(q2, 'spikes_wood') }); g.time += 1; g.handle(q2, { t: 'place', x: q2.x, y: q2.y + 100 });
g.handle(q2, { t: 'sel', i: slotOf(q2, 'bear_trap') }); g.time += 1; g.handle(q2, { t: 'place', x: q2.x + 150, y: q2.y + 100 });
ok(g.active.length === 2, 'spikes + trap active');
const wolf = g.spawnMob('wolf', q2.x + 150, q2.y + 100, { noShiny: true }); const hp0 = wolf.hp;
for (let i = 0; i < 40; i++) g.tick(0.05);
ok(wolf.hp < hp0 || !g.mobs.has(wolf.id), 'trap hurts mobs');
g.handle(q2, { t: 'pickup' }); ok(g.structMap.size < 4, 'pickup removes own structure');
const zFar = g.world.zone(500, 500), zMid = g.world.zone(12000, 12000);
ok(zMid === 0 && zFar > 0.9, 'zones scale with distance');
for (let i = 0; i < 20 * 60; i++) g.tick(0.05);
ok(true, 'extra minute with structures ok');

const world = g.world; ok(world.res.length > 3000, `world generated ${world.res.length} resource nodes`);
const biomes = {}; for (let i = 0; i < 400; i++) { const b = world.biomeAt(Math.random() * 8000, Math.random() * 8000); biomes[b] = (biomes[b] || 0) + 1; }
console.log('biome sample:', biomes); ok(Object.keys(biomes).length >= 4, 'multiple biomes present');
console.log('problems:', content.validate()); ok(content.validate().length === 0, 'content valid');
console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); process.exit(fail ? 1 : 0);
