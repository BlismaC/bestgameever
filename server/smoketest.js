'use strict';
// Headless test of the simulation (no network). Run: npm test
process.env.WORLD_SEED = process.env.WORLD_SEED || '4321';
const fs = require('fs'), os = require('os'), path = require('path');
const { FileStore } = require('./storage');
const Game = require('./game');
const content = require('./content');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-'));
  const store = new FileStore(dir);
  const g = new Game(store);
  let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.error('FAIL:', m); } else console.log('ok  :', m); };
  const mk = () => { const msgs = []; return { msgs, ws: { readyState: 1, bufferedAmount: 0, send: (s) => msgs.push(JSON.parse(s)), close() {} } }; };
  const tick = (n, dt = 0.05) => { for (let i = 0; i < n; i++) g.tick(dt); };
  const A = mk(); const p = await g.join(A.ws, { token: 'a'.repeat(32), name: 'Tester', look: { s: 1, h: 2, c: 3, p: 1, st: 0 } });
  ok(A.msgs.find((m) => m.t === 'init'), 'join sends init');
  const say = (pl, c) => { g.time += 0.5; g.handle(pl, { t: 'chat', m: c }); };

  // ---- movement with input sequence numbers
  let seq = 1; const x0 = p.x; for (let i = 0; i < 20; i++) g.handle(p, { t: 'mv', i: [[seq++, 8, 33, 0, 0]], atk: 0 }); tick(20, 0.033);
  ok(p.x > x0 + 50 && p.seq === seq - 1, 'server applies queued movement inputs & acks seq');

  // ---- modifiers
  const mods = new Set(); for (let i = 0; i < 400; i++) { const m = content.rollModifier(1); if (m) mods.add(m); }
  ok(mods.size === 14, 'all 14 modifiers can roll');
  ok(content.modById.godly.dmg === 15 && content.modById.godly.crit === 5 && content.modById.broken.tier === -2, 'modifier table matches spec');

  // ---- tools: axe chops trees, pickaxe cannot
  const tree = g.world.res.find((r) => r.type === 'tree'); p.x = tree.x - 60; p.y = tree.y; p.angle = 0;
  p.room = g.main;
  const give = (id, n, mod) => g.addItem(p, id, n, mod === undefined ? null : mod);
  p.inv = new Array(30).fill(null); give('wood_axe', 1); give('wood_pickaxe', 1); give('wood_sword', 1);
  const wood0 = g.countItem(p, 'wood');
  p.sel = 1; g.time += 1; g.attack(p); ok(g.countItem(p, 'wood') === wood0, 'pickaxe cannot chop trees');
  p.sel = 2; g.time += 1; g.attack(p); ok(g.countItem(p, 'wood') === wood0, 'sword cannot chop trees');
  p.sel = 0; g.time += 1; g.attack(p); ok(g.countItem(p, 'wood') > wood0, 'axe chops trees');

  // ---- healing cooldown scales with potion strength
  p.hp = 10; give('apple', 1); give('potion_heal', 1); give('potion_greater_heal', 1);
  const slotOf = (id) => p.inv.findIndex((s) => s && s.id === id);
  p.sel = slotOf('apple') < 9 ? slotOf('apple') : 8; if (slotOf('apple') >= 9) g.handle(p, { t: 'swap', a: slotOf('apple'), b: 8 });
  g.handle(p, { t: 'sel', i: p.sel }); g.useItem(p); const cdApple = p.healCd - g.time;
  ok(p.hp > 10 && cdApple > 1 && cdApple < 6, `apple heals, short sickness (${cdApple.toFixed(1)}s)`);
  const hpMid = p.hp; g.useItem(p); ok(p.hp === hpMid, 'cannot heal during potion sickness');
  ok(g.healCdFor(150) > g.healCdFor(60) && g.healCdFor(60) > g.healCdFor(10), 'stronger heal = longer cooldown');

  // ---- crafting needs station near + island-only stations
  say(p, '/give wood 300'); say(p, '/give stone 100'); say(p, '/give workbench 1'); say(p, '/give chest 2'); say(p, '/give iron 20'); say(p, '/give leather 20');
  g.handle(p, { t: 'craft', id: 'wood_sword' }); const hadSword = p.inv.filter((s) => s && s.id === 'wood_sword').length;
  ok(hadSword === 1, 'workbench recipe refused without a station');
  const putSel = (id) => { let i = slotOf(id); if (i >= 9) { g.handle(p, { t: 'swap', a: i, b: 8 }); i = 8; } g.handle(p, { t: 'sel', i }); };
  p.x = g.size / 2 + 900; p.y = g.size / 2 + 900; for (const r of g.world.res) if (dist2(r, p) < 500) r.alive = false;
  function dist2(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  putSel('workbench'); g.time += 1; g.handle(p, { t: 'place', x: p.x + 80, y: p.y });
  ok(g.main.structMap.size === 0, 'workbench cannot be placed in the overworld');

  // ---- home island
  g.handle(p, { t: 'home' }); ok(!!p.tp, 'teleport home channel starts'); for (let i = 0; i < 100; i++) { g.mobs.clear(); g.tick(0.05); } await new Promise((r) => setTimeout(r, 30));
  ok(p.room.island && p.room.owner === p.acc, 'player arrived on private island');
  putSel('workbench'); g.time += 1; g.handle(p, { t: 'place', x: p.x + 80, y: p.y });
  ok(p.room.structMap.size === 1, 'workbench placed on island');
  const cx = p.x - 100; putSel('chest'); g.time += 1; g.handle(p, { t: 'place', x: cx, y: p.y });
  const chest = [...p.room.structMap.values()].find((s) => s.type === 'chest'); ok(!!chest, 'chest placed on island');
  g.handle(p, { t: 'craft', id: 'wall_wood' }); ok(g.countItem(p, 'wall_wood') === 1, 'crafted wall at island workbench');
  g.handle(p, { t: 'craft', id: 'iron_sword' }); ok(g.countItem(p, 'iron_sword') === 0, 'forge recipe still needs a forge');
  // limit: only 1 workbench
  say(p, '/give workbench 1'); putSel('workbench'); g.time += 1; g.handle(p, { t: 'place', x: p.x, y: p.y + 120 });
  ok([...p.room.structMap.values()].filter((s) => s.type === 'workbench').length === 1, 'per-item build limit enforced');
  // chest storage
  const wi = p.inv.findIndex((s) => s && s.id === 'stone'); const cnt = g.countItem(p, 'stone'); const first = p.inv[wi].count;
  g.handle(p, { t: 'chest_open', id: chest.id }); g.handle(p, { t: 'chest_put', id: chest.id, i: wi });
  ok(chest.items.some((s) => s && s.id === 'stone' && s.count === first), 'item stored in chest');
  g.handle(p, { t: 'chest_take', id: chest.id, i: chest.items.findIndex(Boolean) }); ok(g.countItem(p, 'stone') === cnt, 'item taken from chest');

  // ---- persistence of island + profile
  await g.saveAll();
  const g2 = new Game(store); const B = mk(); const p2 = await g2.join(B.ws, { token: 'a'.repeat(32), name: 'Tester' });
  ok(p2.inv.some((s) => s && s.id === 'wood'), 'profile restored from storage');
  await g2.goHome(p2); ok([...p2.room.structMap.values()].some((s) => s.type === 'workbench') && [...p2.room.structMap.values()].some((s) => s.type === 'chest'), 'island structures restored from storage');

  // ---- invites & permissions
  const Bm = mk(); const guest = await g.join(Bm.ws, { token: 'b'.repeat(32), name: 'Guest' });
  g.handle(p, { t: 'invite', name: 'Guest' }); ok(Bm.msgs.some((m) => m.t === 'invite'), 'guest receives invite');
  await g.acceptInvite(guest, p.acc); ok(guest.room === p.room, 'guest entered island after accepting');
  say(guest, '/give wall_wood 1'); putSel.call(null, 'workbench'); const gi = guest.inv.findIndex((s) => s && s.id === 'wall_wood'); g.handle(guest, { t: 'swap', a: gi, b: 8 }); g.handle(guest, { t: 'sel', i: 8 });
  g.time += 1; g.handle(guest, { t: 'place', x: guest.x + 60, y: guest.y }); const before = p.room.structMap.size;
  ok(p.room.structMap.size === before && ![...p.room.structMap.values()].some((s) => s.owner === guest.own), 'guest cannot build without permission');
  g.handle(guest, { t: 'chest_open', id: chest.id }); ok(!Bm.msgs.some((m) => m.t === 'chest'), 'guest cannot open chests without permission');
  g.handle(p, { t: 'perm', gid: guest.acc, chests: true, build: true });
  g.handle(guest, { t: 'chest_open', id: chest.id }); ok(Bm.msgs.some((m) => m.t === 'chest'), 'guest can open chests after permission');
  for (const [ox, oy] of [[0, 90], [90, 0], [-90, 0], [0, -90], [120, 120], [-120, 120]]) { g.time += 1; g.handle(guest, { t: 'place', x: guest.x + ox, y: guest.y + oy }); if ([...p.room.structMap.values()].some((s) => s.owner === guest.own)) break; }
ok([...p.room.structMap.values()].some((s) => s.owner === guest.own), 'guest can build after permission');
  g.handle(p, { t: 'kick', gid: guest.acc }); ok(guest.room === g.main, 'kicked guest returned to overworld');

  // ---- other players cannot touch structures; spikes hurt only non-owners
  g.leaveIsland(p); p.x = g.size / 2 + 1200; p.y = g.size / 2 + 1200;
  say(p, '/give spikes_wood 1'); putSel('spikes_wood'); for (const r of g.world.res) if (dist2(r, p) < 500) r.alive = false;
  g.time += 1; g.handle(p, { t: 'place', x: p.x + 90, y: p.y });
  const sp = [...g.main.structMap.values()].find((s) => s.type === 'spikes_wood'); ok(!!sp, 'spikes placed in overworld');
  g.mobs.clear(); guest.x = sp.x; guest.y = sp.y - 40; guest.hp = 100; guest.invuln = 0; tick(30); ok(guest.hp < 100, 'spikes hurt non-owners');
  g.mobs.clear(); p.x = sp.x; p.y = sp.y - 40; p.hp = 100; p.invuln = 0; const hp1 = p.hp; g.mobs.clear(); tick(30); ok(p.hp >= hp1 - 0.01, 'spikes do not hurt their owner');
  const hpS = sp.hp; g.main.players.has(guest) || g.main.players.add(guest);
  guest.angle = Math.PI / 2; guest.x = sp.x; guest.y = sp.y - 50; p.sel = 0; guest.inv = new Array(30).fill(null); g.addItem(guest, 'iron_axe', 1, null); guest.sel = 0; g.time += 2; g.attack(guest);
  ok(sp.hp === hpS, "players cannot damage other players' structures");

  // ---- mob rare drops, coins, spawn rate, events
  ok(content.mobs.cow.drops.some((d) => d.item === 'bovine_bonker'), 'mobs have rare unique drops');
  p.maxHp = p.hp = 99999; guest.maxHp = guest.hp = 99999; for (let i = 0; i < 60; i++) tick(10); const mc = g.mobs.size; ok(mc < 30, `mob count stays modest (${mc})`);
  g.ev = { id: 'slime_rain', def: content.events.slime_rain, cx: p.x, cy: p.y, until: g.time + 100, progress: 0, spawnT: 0 };
  tick(40); const rain = [...g.mobs.values()].filter((m) => m.evt); ok(rain.length > 0 && rain.some((m) => m.air > 0 || true), 'slime rain event spawns slimes');
  g.ev.progress = 24; tick(2); ok([...g.mobs.values()].some((m) => m.type === 'slime_king'), 'killing enough event mobs summons the boss');
  // boss telegraph
  const king = [...g.mobs.values()].find((m) => m.type === 'slime_king'); p.x = king.x - 300; p.y = king.y; p.hp = 9999; p.maxHp = 9999; king.pat = [0, 0]; let sawTele = false;
  const origPush = g.events.push.bind(g.events); g.events.push = (e) => { if (e.e === 'tele') sawTele = true; return origPush(e); }; tick(80); ok(sawTele, 'boss telegraphs before charging');
  // ---- projectile parry
  g.projectiles = []; p.hp = 9999; g.shoot('m', 0, p.x + 40, p.y, Math.PI, { speed: 10, life: 3, radius: 8, kind: 'bolt', color: '#f00' }, 10, null, 'x');
  say(p, '/give iron_sword 1'); const si = p.inv.findIndex((s) => s && s.id === 'iron_sword'); g.handle(p, { t: 'swap', a: si, b: 8 }); p.sel = 8; p.angle = 0; g.time += 2; g.attack(p);
  ok(g.projectiles.length === 0, 'sword swing destroys enemy projectiles');
  ok(content.validate().length === 0, 'content valid: ' + content.validate().join(';'));
  console.log(fail ? `${fail} FAILED` : 'ALL PASSED'); fs.rmSync(dir, { recursive: true, force: true }); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
