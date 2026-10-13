'use strict';
// Headless test of the simulation (no network). Run: npm test
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
const world = g.world; ok(world.res.length > 1000, `world generated ${world.res.length} resource nodes`);
const biomes = {}; for (let i = 0; i < 400; i++) { const b = world.biomeAt(Math.random() * 8000, Math.random() * 8000); biomes[b] = (biomes[b] || 0) + 1; }
console.log('biome sample:', biomes); ok(Object.keys(biomes).length >= 4, 'multiple biomes present');
console.log('problems:', content.validate()); ok(content.validate().length === 0, 'content valid');
console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); process.exit(fail ? 1 : 0);
