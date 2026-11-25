'use strict';
// DIMENSIONS: Willow Town (peaceful hub), Dracula's castle land + hall, Atlantis. Position-based (far outside the normal map) and reached by portals / quests.
const content = require('../content');
const C = require('../config');
const rand = (a, b) => a + Math.random() * (b - a), dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by), rd = Math.round;
const FIGHTS = {
  dracula: { x: 16300, y: 27050, mood: 'dracula', dim: 'castle_hall' },
  neptune: { x: 26300, y: 27050, mood: 'neptune', dim: 'temple_hall' },
};

module.exports = {
  dimsInit() { this.plea = null; this.pleaTimer = 90; this.fights = {}; this.bossLineAt = new Map(); },
  isFloating(p) { const m = p.mount && content.mounts[p.mount]; return !!(p.gills || (m && m.aquatic)); },
  teleportTo(p, x, y) {
    this.events.push({ e: 'blink', rm: 'main', x: rd(p.x), y: rd(p.y), x2: rd(x), y2: rd(y), c: '#b06aff' });
    p.x = x; p.y = y; p.epoch++; p.queue.length = 0; p.dashLeft = 0; p.fx = {}; p.invuln = this.time + 2.5; p.hist && (p.hist.length = 0);
    this.cancelTp(p);
  },
  say(players, who, text, ms, color) { for (const q of players) this.send(q, { t: 'say', who, text, ms: ms || 4200, color: color || '#ffe27a' }); },
  nearbyPlayers(x, y, r) { return [...this.main.players].filter((q) => q.alive && dist(q.x, q.y, x, y) < r); },

  // ---------------------------------------------------------------- portals
  portalNear(p) { for (const po of this.world.gen.portals) if (dist(p.x, p.y, po.x, po.y) < 170) return po; return null; },
  // walking into a portal plays an "enter" animation on the client (walk into the door, shrink, fade) and the teleport happens when it ends
  usePortal(p) { if (p.room.island || !p.alive || p.entering) return; const po = this.portalNear(p); if (po) this.startEnter(p, po); },
  startEnter(p, po) {
    const D = 0.85; p.entering = { until: this.time + D, po }; p.invuln = Math.max(p.invuln || 0, this.time + D + 0.4); p.queue.length = 0;
    this.send(p, { t: 'enter', x: (po.door || [po.x, po.y])[0], y: (po.door || [po.x, po.y])[1], d: D });
  },
  finishEnter(p) {
    const po = p.entering.po; p.entering = null;
    const gen = this.world.gen, D = gen.DIMS, fightRoom = po.to === 'castle_hall' || po.to === 'temple_hall';
    const party = fightRoom ? this.nearbyPlayers(po.x, po.y, 520).filter((q) => q === p || !q.entering) : [p];
    for (const q of party) {
      if (q !== p) this.send(q, { t: 'enter', x: q.x, y: q.y, d: 0.2 });
      const dest = po.dest ? [po.dest[0] + rand(-50, 50), po.dest[1] + rand(-20, 20)] : null;
      if (po.to === 'main') { const r = q.returnMain || { x: this.size / 2 + rand(-80, 80), y: this.size / 2 + 360 }; this.teleportTo(q, r.x + rand(-40, 40), r.y + rand(-40, 40)); q.returnMain = null; if (q.mount === 'bat_form') q.mount = null; }
      else if (dest) this.teleportTo(q, dest[0], dest[1]);
      else { if (!gen.dimAt(q.x, q.y)) q.returnMain = { x: q.x, y: q.y + 60 }; const d = D[po.to]; this.teleportTo(q, d.spawn[0] + rand(-60, 60), d.spawn[1] + rand(-40, 40)); }
      q.noPortalUntil = this.time + 2.5; this.send(q, { t: 'fade_in' });
    }
    if (po.to === 'castle_hall') this.startFight('dracula', party);
    if (po.to === 'temple_hall') this.startFight('neptune', party);
    if (po.to === 'town') this.sys(p, '🏘 Welcome to Willow Town! Peaceful. Visit the Market Board, the Auctioneer, the Postie — and say hi to everyone.');
  },

  // ---------------------------------------------------------------- the plea (leads to Dracula's domain)
  pleaOn() { this.broadcast({ t: 'plea', on: this.plea ? 1 : 0, x: this.plea ? rd(this.plea.x) : 0, y: this.plea ? rd(this.plea.y) : 0 }); },
  pleaSpawn(p) {
    const a = Math.random() * 6.28, r = rand(520, 820); let x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
    if (!this.inBounds(x, y) || this.world.gen.waterAt(x, y) || this.world.gen.dimAt(x, y)) return;
    this.plea = { x, y, until: this.time + 300, who: p.id };
    this.broadcast({ t: 'banner', text: 'A desperate cry for help drifts through the night...', color: '#c8a0ff' });
    this.send(p, { t: 'chat', sys: 1, m: '🕯 Somebody is begging for help nearby. Look for the "!" — and be careful.' });
    this.pleaOn();
  },
  pleaTalk(p) {
    if (!this.plea || dist(p.x, p.y, this.plea.x, this.plea.y) > 240) return;
    this.send(p, { t: 'dialog', id: 'plea', who: 'Trembling Villager', look: { s: 0, h: 2, c: 9, p: 7, st: 2 }, text: "P-please... you must help! A monster — a lord of the night — took my village's children to his castle beyond the mist. I can open the way, but nobody who went in has ever... Will you save them? Will you face DRACULA?", choices: ['I will help.', 'Not now.'] });
  },
  dialogChoice(p, id, c) {
    if (id === 'plea' && c === 0 && this.plea && dist(p.x, p.y, this.plea.x, this.plea.y) < 320) {
      const party = this.nearbyPlayers(this.plea.x, this.plea.y, 650), D = this.world.gen.DIMS.castle_land;
      for (const q of party) { q.returnMain = { x: q.x, y: q.y }; this.teleportTo(q, D.spawn[0] + rand(-80, 80), D.spawn[1] + rand(-50, 30)); this.send(q, { t: 'cutscene', lines: [['', 'The villager whispers a rite... the world folds away.'], ['', "Cold mist swallows you. Before you, a gothic castle rises under a blood-pale moon."], ['Villager', '"Go... the gate is at the far end. May the light protect you."']], per: 3800, mood: 'castle' }); }
      this.broadcast({ t: 'chat', sys: 1, m: `🦇 ${party.map((q) => q.name).join(', ')} stepped into Dracula's domain...` });
      this.plea = null; this.pleaOn();
    }
  },

  // ---------------------------------------------------------------- boss fights with a speech
  startFight(kind, party) {
    const F = FIGHTS[kind], def = content.mobs[kind]; if (!F || !def) return null;
    for (const m of this.mobs.values()) if (m.type === kind) return m;
    if (this.fights[kind] && this.time < this.fights[kind].cool) return null;
    const m = this.spawnMob(kind, F.x, F.y, { noShiny: true }); if (!m) return null;
    const per = 4.6; m.cutUntil = this.time + def.intro.length * per + 1.5; m.special = kind;
    for (const q of this.nearbyPlayers(F.x, F.y, 1500)) this.send(q, { t: 'cutscene', lines: def.intro, per: per * 1000, mood: F.mood, boss: kind });
    this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${def.name} awakens...` });
    return m;
  },
  onSpecialBossKilled(m, killer) {
    const F = FIGHTS[m.def.id]; if (F) this.fights[m.def.id] = { cool: this.time + 45 };
    const txt = { dracula: 'Dracula crumbles to dust. The mist lifts from his domain...', neptune: 'Neptune sinks into the abyss. The sea falls quiet.', pumpking: 'The Pumpking splits apart. Candy rains down!', evil_santa: 'Sinister Claus drops his sack and flees up the chimney of the night.' }[m.def.id];
    if (txt) this.broadcast({ t: 'banner', text: txt, color: '#ffe27a' });
    if (m.def.id === 'dracula' || m.def.id === 'neptune') for (const q of this.nearbyPlayers(m.x, m.y, 1600)) this.send(q, { t: 'cutscene', lines: [[m.def.name, m.def.id === 'dracula' ? '"Sunrise... after all this time... how beautiful..."' : '"The tide... forgives... no one..."']], per: 3600, mood: 'victory' });
  },
  bossPhaseLine(m, ph) {
    const lines = m.def.phaseLines; if (!lines || !lines[ph - 1]) return;
    this.say(this.nearbyPlayers(m.x, m.y, 1500), m.def.name, lines[ph - 1], 3800, m.def.color);
  },

  // ---------------------------------------------------------------- drowning may pull you into Atlantis (1 in 3)
  drownCheck(p) {
    if (p.drownRolled) return false; p.drownRolled = true;
    if (Math.random() < 1 / 3) {
      p.returnMain = { x: p.x, y: p.y - 140 }; const D = this.world.gen.DIMS.atlantis; this.teleportTo(p, D.spawn[0] + rand(-60, 60), D.spawn[1] + rand(-30, 30)); p.breath = 10; p.hp = Math.max(p.hp, p.maxHp * 0.5);
      this.send(p, { t: 'cutscene', lines: [['', 'You sink... and sink... but a pale blue glow wraps around you.'], ['', 'ATLANTIS. A city of coral and pearl, hidden beneath the waves. You can breathe here.'], ['', 'Beyond the reef, a temple pulses with power. Something ancient waits inside...']], per: 4200, mood: 'atlantis' });
      this.broadcast({ t: 'chat', sys: 1, m: `🌊 ${p.name} was pulled beneath the waves... into Atlantis!` });
      return true;
    }
    return false;
  },

  // ---------------------------------------------------------------- vampirism
  vampireStart(p) { p.vampire = true; this.sys(p, '🧛 You feel your heart stop... and your senses sharpen. You are a VAMPIRE! (lifesteal, speed, bat form on V — sunlight burns!)'); this.events.push({ e: 'boom', rm: 'main', x: rd(p.x), y: rd(p.y), r: 80 }); this.send(p, { t: 'vamp', on: 1 }); },
  vampireCure(p) { p.vampire = false; delete p.buffs.vampirism; if (p.mount === 'bat_form') p.mount = null; this.sys(p, '💧 The curse is lifted. You are mortal again.'); this.send(p, { t: 'vamp', on: 0 }); },
  batToggle(p) {
    if (!p.vampire || !p.alive || p.room.island) return;
    if (p.mount === 'bat_form') { p.mount = null; p.batCd = this.time + 8; return; }
    if (this.time < (p.batCd || 0)) { this.sys(p, `Bat form recharging (${Math.ceil(p.batCd - this.time)}s).`); return; }
    if (p.mount) return; p.mount = 'bat_form'; p.batUntil = this.time + 25;
  },
  tickVampire(p, dt, night) {
    if (!p.vampire) return;
    p.buffs.vampirism = { until: this.time + 9999 };
    if (p.mount === 'bat_form' && this.time > p.batUntil) { p.mount = null; p.batCd = this.time + 30; this.sys(p, 'You turn back from a bat.'); }
    const outdoors = !p.room.island && !this.world.gen.dimAt(p.x, p.y);
    if (outdoors && !night && !p.equip.helmet && p.hp > 4) { p.hp = Math.max(4, p.hp - 3 * dt); p.lastHurt = this.time; p.sunTick = (p.sunTick || 0) + dt; if (p.sunTick > 4) { p.sunTick = 0; this.sys(p, '☀ The sun burns your skin! Wear a helmet, stay in the shade, or find holy water...'); } }
  },

  // ---------------------------------------------------------------- per-tick
  tickDims(dt) {
    // the plea: rare, mostly at night
    if (this.plea && this.time > this.plea.until) { this.plea = null; this.pleaOn(); }
    this.pleaTimer -= dt;
    if (!this.plea && this.pleaTimer <= 0) {
      this.pleaTimer = 60;
      const ps = [...this.main.players].filter((p) => p.alive && !this.inSafe(p.x, p.y) && !this.world.gen.dimAt(p.x, p.y));
      if (ps.length && Math.random() < (this.isNight() ? 0.07 : 0.015)) this.pleaSpawn(ps[Math.floor(Math.random() * ps.length)]);
    }
    // portals that open when you walk into the door, and the end of the enter animation
    for (const p of this.main.players) {
      if (!p.alive) { p.entering = null; continue; }
      if (p.entering) { if (this.time >= p.entering.until) this.finishEnter(p); continue; }
      if (this.time < (p.noPortalUntil || 0)) continue;
      for (const po of this.world.gen.portals) if (po.auto && dist(p.x, p.y, po.x, po.y) < 62) { this.startEnter(p, po); break; }
    }
  },
};
