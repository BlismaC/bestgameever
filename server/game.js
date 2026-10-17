'use strict';
// The authoritative game simulation. One instance = one server.
const crypto = require('crypto');
const C = require('./config');
const content = require('./content');
const World = require('./world');
const easter = require('./easter');
const runCommand = require('./commands');
const Grid = require('./grid');
const Movement = require('../shared/movement');

let NID = 1;
const nid = () => NID++;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rd = (n) => Math.round(n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const xpNeeded = (l) => Math.floor(40 * Math.pow(l, 1.6));
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); }
function pickWeighted(obj, filter) {
  let total = 0; const e = [];
  for (const [k, w] of Object.entries(obj)) { if (filter && !filter(k)) continue; e.push([k, w]); total += w; }
  if (!total) return null;
  let r = Math.random() * total;
  for (const [k, w] of e) { r -= w; if (r <= 0) return k; }
  return e[e.length - 1][0];
}
const IC = C.ISLAND_SIZE / 2;

class Room {
  constructor(id, owner) {
    this.id = id; this.owner = owner; this.island = id !== 'main'; this.ownerName = '';
    this.structs = new Grid(220); this.structMap = new Map(); this.active = [];
    this.players = new Set(); this.guests = new Map(); this.dirty = false; this.emptySince = 0;
  }
}

class Game {
  constructor(store) {
    this.store = store;
    this.world = new World(C.SEED);
    this.size = C.WORLD_SIZE;
    this.time = 0; this.dayTime = 0.25; this.tickN = 0;
    this.players = new Map(); this.byAcc = new Map();
    this.mobs = new Map(); this.projectiles = []; this.drops = new Map(); this.events = [];
    this.main = new Room('main', null); this.rooms = new Map([['main', this.main]]); this.loading = new Map();
    this.mobGrid = new Grid(240);
    this.nextBossAt = C.BOSS_INTERVAL; this.spawnTimer = 0; this.despawnTimer = 0; this.lbTimer = 0; this.resTimer = 0; this.saveTimer = 20; this.evTimer = 90;
    this.resPendingEvents = []; this.ev = null;
    this.npcs = content.npcs.map((n) => ({ ...n, x: Math.round(this.size / 2 + Math.cos(n.ang) * 190), y: Math.round(this.size / 2 + Math.sin(n.ang) * 190), tip: 0 }));
  }

  isNight() { return Math.cos(2 * Math.PI * (this.dayTime - 0.25)) < -0.2; }
  inSafe(x, y) { return dist(x, y, this.size / 2, this.size / 2) < C.SAFE_RADIUS; }
  mvCfg() { const P = C.PLAYER; return { speed: P.speed, dashSpeed: P.dashSpeed, dashTime: P.dashTime, dashCooldown: P.dashCooldown }; }

  // ------------------------------------------------------------ accounts, profiles, joining
  accId(token) { return crypto.createHash('sha256').update('rf1:' + String(token)).digest('hex').slice(0, 24); }
  newInv() { const inv = new Array(C.PLAYER.invSize).fill(null); inv[0] = { id: 'wood_sword', count: 1, mod: null }; inv[1] = { id: 'wood_pickaxe', count: 1, mod: null }; inv[2] = { id: 'wood_axe', count: 1, mod: null }; inv[3] = { id: 'apple', count: 3 }; return inv; }
  sanitizeLook(l) {
    l = l || {}; const n = (v, m) => (Number.isInteger(v) && v >= 0 && v < m ? v : 0);
    return { s: n(l.s, 6), h: n(l.h, 8), c: n(l.c, 8), p: n(l.p, 6), st: n(l.st, 5) };
  }
  async join(ws, m) {
    const token = String(m.token || '');
    if (token.length < 16 || token.length > 80) return null;
    const acc = this.accId(token);
    const old = this.byAcc.get(acc);
    if (old) { try { old.ws.close(); } catch (e) {} await this.leave(old); }
    const name = String(m.name || '').replace(/[^\w \-\.!?]/g, '').trim().slice(0, 16) || 'Wanderer';
    let prof = null; try { prof = await this.store.get('p:' + acc); } catch (e) { console.error('[profile load]', e.message); }
    const P = C.PLAYER;
    const p = {
      id: nid(), acc, own: acc.slice(0, 8), ws, name, title: '', look: this.sanitizeLook(m.look), room: this.main, x: 0, y: 0, angle: 0, atk: false,
      hp: P.hp, maxHp: P.hp, level: 1, xp: 0, score: 0, kills: 0, inv: this.newInv(), sel: 0, nextAtk: 0,
      dashLeft: 0, dashCd: 0, dashDx: 0, dashDy: 0, seq: 0, epoch: 1, queue: [], budget: 0.15,
      fx: {}, buffs: {}, healCd: 0, alive: true, respawnAt: 0, lastHurt: 0, invuln: 0, joined: true, lastChat: -10, visits: [], invites: new Map(), tp: null, returnPos: null, spd: 1,
    };
    if (prof) {
      p.level = prof.level || 1; p.xp = prof.xp || 0; p.score = prof.score || 0; p.kills = prof.kills || 0; p.maxHp = prof.maxHp || P.hp; p.hp = p.maxHp; p.visits = prof.visits || [];
      if (Array.isArray(prof.inv)) { p.inv = new Array(P.invSize).fill(null); prof.inv.slice(0, P.invSize).forEach((s, i) => { if (s && content.items[s[0]]) p.inv[i] = { id: s[0], count: Math.max(1, s[1] | 0), mod: s[2] && content.modById[s[2]] ? s[2] : null }; }); }
    }
    this.players.set(p.id, p); this.byAcc.set(acc, p); this.main.players.add(p);
    this.spawnPlayer(p);
    this.send(p, {
      t: 'init', id: p.id, acc: p.own, seed: C.SEED, size: this.size, name: C.GAME_NAME, persistent: this.store.kind,
      cfg: { build: C.BUILD_RANGE, craft: C.CRAFT_RANGE, tick: C.TICK_RATE, speed: P.speed, dashSpeed: P.dashSpeed, dashTime: P.dashTime, dashCooldown: P.dashCooldown, radius: P.radius, hotbar: P.hotbar, invSize: P.invSize, safe: C.SAFE_RADIUS, view: C.VIEW_RADIUS, isl: C.ISLAND_SIZE, islR: C.ISLAND_R, tp: C.TP_TIME },
      dep: this.world.res.filter((r) => !r.alive).map((r) => r.id), npcs: this.npcs.map((n) => [n.id, n.x, n.y]), look: p.look,
    });
    this.sendInv(p); this.sendRoom(p);
    this.broadcast({ t: 'chat', sys: 1, m: `${p.name} joined the realm.` });
    easter.onJoin(this, p);
    if (!prof) this.sys(p, 'Welcome! Talk to Gale the Guide (T) in town. Press H to visit your private island.');
    return p;
  }
  async leave(p) {
    if (!this.players.has(p.id)) return;
    this.cancelTp(p);
    await this.saveProfile(p);
    p.room.players.delete(p); this.players.delete(p.id); if (this.byAcc.get(p.acc) === p) this.byAcc.delete(p.acc);
    this.broadcast({ t: 'chat', sys: 1, m: `${p.name} left.` });
  }
  async saveProfile(p) {
    try {
      await this.store.set('p:' + p.acc, { name: p.name, level: p.level, xp: p.xp, score: p.score, kills: p.kills, maxHp: p.maxHp, visits: p.visits, inv: p.inv.map((s) => (s ? [s.id, s.count, s.mod || 0] : null)) });
    } catch (e) { console.error('[profile save]', e.message); }
  }
  async saveAll() {
    const jobs = [];
    for (const p of this.players.values()) jobs.push(this.saveProfile(p));
    for (const r of this.rooms.values()) if (r.island && r.dirty) jobs.push(this.saveRoom(r));
    await Promise.all(jobs);
  }
  spawnPlayer(p) {
    if (p.room.island) { p.x = IC + rand(-60, 60); p.y = IC + rand(-60, 60); }
    else { const a = Math.random() * Math.PI * 2, r = rand(0, 200); p.x = this.size / 2 + Math.cos(a) * r; p.y = this.size / 2 + Math.sin(a) * r; }
    p.hp = p.maxHp; p.alive = true; p.fx = {}; p.invuln = this.time + 2; p.epoch++; p.queue.length = 0; p.dashLeft = 0;
  }
  send(p, obj) {
    const ws = p.ws; if (!ws || ws.readyState !== 1 || ws.bufferedAmount > 1e6) return;
    try { ws.send(JSON.stringify(obj)); } catch (e) { /* closed */ }
  }
  broadcast(obj) { const s = JSON.stringify(obj); for (const p of this.players.values()) if (p.ws && p.ws.readyState === 1) { try { p.ws.send(s); } catch (e) {} } }
  sys(p, m) { this.send(p, { t: 'chat', sys: 1, m }); }
  sendInv(p) { this.send(p, { t: 'inv', inv: p.inv.map((s) => (s ? [s.id, s.count, s.mod || 0] : 0)), sel: p.sel }); }

  handle(p, m) {
    switch (m.t) {
      case 'mv': this.onMove(p, m); break;
      case 'sel': { const i = m.i | 0; if (i >= 0 && i < C.PLAYER.hotbar) { p.sel = i; this.sendInv(p); } break; }
      case 'use': this.useItem(p); break;
      case 'craft': this.craft(p, String(m.id)); break;
      case 'swap': { const a = m.a | 0, b = m.b | 0, n = p.inv.length; if (a >= 0 && b >= 0 && a < n && b < n) { const t = p.inv[a]; p.inv[a] = p.inv[b]; p.inv[b] = t; this.sendInv(p); } break; }
      case 'drop': { const i = m.i | 0; const s = p.inv[i]; if (s && !p.room.island) { this.spawnDrop(s.id, s.count, p.x + Math.cos(p.angle) * 50, p.y + Math.sin(p.angle) * 50, 1.5, s.mod); p.inv[i] = null; this.sendInv(p); } break; }
      case 'trash': { const i = m.i | 0; if (p.inv[i]) { p.inv[i] = null; this.sendInv(p); } break; }
      case 'chat': this.chat(p, String(m.m || '')); break;
      case 'ping': this.send(p, { t: 'pong', n: m.n }); break;
      case 'place': this.place(p, +m.x, +m.y); break;
      case 'pickup': this.pickupStruct(p, +m.x, +m.y); break;
      case 'home': this.startTp(p); break;
      case 'invite': this.invite(p, String(m.name || '')); break;
      case 'accept': this.acceptInvite(p, String(m.owner || '')); break;
      case 'visit': this.visit(p, String(m.owner || '')); break;
      case 'perm': this.setPerm(p, String(m.gid || ''), !!m.chests, !!m.build); break;
      case 'kick': this.kick(p, String(m.gid || '')); break;
      case 'npc': this.openNpc(p, String(m.id || '')); break;
      case 'buy': this.buy(p, String(m.npc || ''), String(m.item || ''), m.n | 0); break;
      case 'sell': this.sell(p, m.i | 0); break;
      case 'reforge': this.reforge(p, m.i | 0); break;
      case 'nurse': this.nurse(p); break;
      case 'chest_open': this.chestOpen(p, m.id | 0); break;
      case 'chest_put': this.chestPut(p, m.id | 0, m.i | 0); break;
      case 'chest_take': this.chestTake(p, m.id | 0, m.i | 0); break;
    }
  }
  onMove(p, m) {
    if (!Array.isArray(m.i)) return;
    for (const a of m.i.slice(0, 12)) {
      if (!Array.isArray(a)) continue;
      const s = a[0] | 0, k = a[1] & 15, dt = clamp((+a[2] || 0) / 1000, 0, 0.05), d = a[3] ? 1 : 0, ang = (+a[4] || 0) / 100;
      if (s <= p.seq && p.queue.length === 0) continue;
      if (p.queue.length < 60) p.queue.push({ s, k, dt, d, a: isFinite(ang) ? ang : 0 });
    }
    p.atk = !!m.atk; if (m.atk) p.atkLatch = true;
  }
  chat(p, msg) {
    msg = msg.replace(/[\u0000-\u001f]/g, '').trim().slice(0, C.CHAT_MAX);
    if (!msg || this.time - p.lastChat < 0.4) return;
    p.lastChat = this.time;
    if (easter.onChat(this, p, msg)) return;
    if (msg[0] === '/') { if (!runCommand(this, p, msg)) this.sys(p, 'Unknown command. /help'); return; }
    this.broadcast({ t: 'chat', from: (p.title ? p.title + ' ' : '') + p.name, m: msg });
  }

  // ------------------------------------------------------------ inventory & items
  addItem(p, id, count, mod) {
    const def = content.items[id]; if (!def) return count;
    if (def.type === 'weapon' && mod === undefined) mod = content.rollModifier(0.7);
    const max = def.stack || 99; let left = count;
    for (const s of p.inv) { if (left <= 0) break; if (s && s.id === id && s.count < max && !def.weapon) { const n = Math.min(max - s.count, left); s.count += n; left -= n; } }
    for (let i = 0; i < p.inv.length && left > 0; i++) { if (!p.inv[i]) { const n = Math.min(max, left); p.inv[i] = { id, count: n, mod: def.weapon ? (mod || null) : undefined }; left -= n; } }
    if (left !== count) this.sendInv(p);
    return left;
  }
  countItem(p, id) { let n = 0; for (const s of p.inv) if (s && s.id === id) n += s.count; return n; }
  removeItem(p, id, count) {
    for (let i = 0; i < p.inv.length && count > 0; i++) {
      const s = p.inv[i]; if (!s || s.id !== id) continue;
      const n = Math.min(s.count, count); s.count -= n; count -= n; if (s.count <= 0) p.inv[i] = null;
    }
  }
  nearStation(p, type) {
    if (type === 'campfire') { let ok = false; for (const r of [p.room]) r.structs.near(p.x, p.y, C.CRAFT_RANGE, (s) => { if (s.def.provides === 'campfire' && dist(p.x, p.y, s.x, s.y) <= C.CRAFT_RANGE) ok = true; }); return ok; }
    let ok = false;
    p.room.structs.near(p.x, p.y, C.CRAFT_RANGE, (s) => { if (!ok && s.def.provides === type && dist(p.x, p.y, s.x, s.y) <= C.CRAFT_RANGE) ok = true; });
    return ok;
  }
  craft(p, id) {
    const r = content.recipes[id]; if (!r || !p.alive) return;
    if (r.station && !this.nearStation(p, r.station)) { this.sys(p, `Requires a ${content.structures[r.station].name} nearby.`); return; }
    for (const [k, n] of Object.entries(r.cost)) if (this.countItem(p, k) < n) { this.sys(p, 'Missing materials.'); return; }
    for (const [k, n] of Object.entries(r.cost)) this.removeItem(p, k, n);
    const left = this.addItem(p, r.out, r.count);
    if (left > 0) this.spawnDrop(r.out, left, p.x, p.y);
    this.sendInv(p);
  }
  healCdFor(heal) { return clamp(heal * 0.32, 2, 40); }
  useItem(p) {
    const s = p.inv[p.sel]; if (!s || !p.alive) return;
    const def = content.items[s.id]; if (!def || !def.use) return;
    const u = def.use;
    if (u.heal && this.time < p.healCd) { this.sys(p, `Potion Sickness! Wait ${Math.ceil(p.healCd - this.time)}s before healing again.`); return; }
    if (u.summon) {
      if (p.room.island) { this.sys(p, 'Not on your island.'); return; }
      const a = p.angle;
      if (!this.spawnMob(u.summon, p.x + Math.cos(a) * 500, p.y + Math.sin(a) * 500)) return;
      this.broadcast({ t: 'chat', sys: 1, m: `${p.name} summoned ${content.mobs[u.summon].name}!` });
    }
    if (u.heal) { p.hp = Math.min(p.maxHp, p.hp + u.heal); p.healCd = this.time + this.healCdFor(u.heal); this.events.push({ e: 'heal', rm: p.room.id, x: rd(p.x), y: rd(p.y - 30), v: u.heal }); }
    if (u.buffs) for (const b of u.buffs) p.buffs[b.id] = { until: this.time + b.dur };
    if (u.xp) this.giveXp(p, u.xp);
    s.count--; if (s.count <= 0) p.inv[p.sel] = null;
    this.sendInv(p);
  }
  giveXp(p, n) {
    p.xp += n; p.score += n;
    while (p.level < 100 && p.xp >= xpNeeded(p.level)) {
      p.xp -= xpNeeded(p.level); p.level++; p.maxHp += C.PLAYER.hpPerLevel; p.hp = p.maxHp;
      this.sys(p, `⬆ Level ${p.level}!`);
    }
  }
  slotValue(s) { const d = content.items[s.id]; const m = s.mod ? content.modById[s.mod] : null; return Math.max(1, Math.round((d.value || 1) * (1 + (m ? m.value / 100 : 0)))); }

  // ------------------------------------------------------------ drops
  spawnDrop(item, count, x, y, delay = 0.4, mod) {
    const def = content.items[item]; if (!def || count <= 0) return;
    if (def.type === 'weapon' && mod === undefined) mod = content.rollModifier(0.6);
    const d = { id: nid(), item, count, mod: mod || null, x: x + rand(-18, 18), y: y + rand(-18, 18), at: this.time + delay, expires: this.time + 150 };
    this.drops.set(d.id, d);
  }
  rollDrops(table, x, y, mul = 1, zone = 0) {
    const bump = Math.floor(zone * 2);
    for (const e of table || []) {
      if (Math.random() > (e.chance === undefined ? 1 : e.chance)) continue;
      if (e.roll === 'weapon') { const w = content.randomWeapon(Math.min(7, e.tier[0] + bump), Math.min(7, e.tier[1] + bump)); if (w) this.spawnDrop(w, 1, x, y); }
      else { const n = randi(e.min === undefined ? 1 : e.min, e.max === undefined ? 1 : e.max) * (e.item === 'coin' ? 1 + zone : mul); if (n > 0) this.spawnDrop(e.item, Math.round(n), x, y); }
    }
  }

  // ------------------------------------------------------------ rooms: overworld + private islands
  canBuild(p, room) { return !room.island || room.owner === p.acc || !!(room.guests.get(p.acc) && room.guests.get(p.acc).build); }
  canChest(p, room) { return !room.island || room.owner === p.acc || !!(room.guests.get(p.acc) && room.guests.get(p.acc).chests); }
  sendRoom(p) {
    const r = p.room, isOwner = r.island && r.owner === p.acc;
    this.send(p, {
      t: 'room', kind: r.island ? 'island' : 'main', own: r.owner ? r.owner.slice(0, 8) : null, ownerName: r.ownerName, you: isOwner ? 'owner' : (r.island ? 'guest' : null),
      canBuild: this.canBuild(p, r), canChest: this.canChest(p, r),
      guests: isOwner ? [...r.guests].map(([id, g]) => ({ id, name: g.name, chests: !!g.chests, build: !!g.build })) : [],
      visits: p.visits, tp: p.tp ? p.tp.at - this.time : 0,
    });
  }
  addStruct(room, type, x, y, o = {}) {
    const sd = content.structures[type]; if (!sd) return null;
    const st = { id: nid(), type, def: sd, x: Math.round(x), y: Math.round(y), r: sd.r, hp: o.hp || sd.hp, maxHp: sd.hp, owner: o.owner || '', next: 0, armedAt: 0, room };
    if (sd.type === 'chest') st.items = Array.isArray(o.items) ? o.items.map((s) => (s && content.items[s[0]] ? { id: s[0], count: s[1], mod: s[2] || null } : null)) : new Array(20).fill(null);
    while (st.items && st.items.length < 20) st.items.push(null);
    room.structs.add(st); room.structMap.set(st.id, st);
    if (sd.type === 'spike' || sd.type === 'trap' || sd.type === 'fire') room.active.push(st);
    return st;
  }
  removeStruct(st) {
    const room = st.room; room.structs.remove(st); room.structMap.delete(st.id);
    const i = room.active.indexOf(st); if (i >= 0) { room.active[i] = room.active[room.active.length - 1]; room.active.pop(); }
    if (room.island) room.dirty = true;
    this.events.push({ e: 'sdel', rm: room.id, x: st.x, y: st.y, id: st.id });
  }
  async loadIsland(owner) {
    const rid = 'isl:' + owner;
    if (this.rooms.has(rid)) return this.rooms.get(rid);
    if (this.loading.has(rid)) return this.loading.get(rid);
    const pr = (async () => {
      let data = null; try { data = await this.store.get('i:' + owner); } catch (e) { console.error('[island load]', e.message); }
      const room = new Room(rid, owner); room.ownerName = (data && data.ownerName) || '';
      if (data) { for (const g of data.guests || []) room.guests.set(g.id, { name: g.name, chests: !!g.chests, build: !!g.build }); for (const s of data.structs || []) this.addStruct(room, s.type, s.x, s.y, s); }
      this.rooms.set(rid, room); this.loading.delete(rid); return room;
    })();
    this.loading.set(rid, pr); return pr;
  }
  async saveRoom(room) {
    if (!room.island) return; room.dirty = false;
    const data = {
      ownerName: room.ownerName, guests: [...room.guests].map(([id, g]) => ({ id, name: g.name, chests: !!g.chests, build: !!g.build })),
      structs: [...room.structMap.values()].map((s) => ({ type: s.type, x: s.x, y: s.y, hp: s.hp, owner: s.owner, items: s.items ? s.items.map((x) => (x ? [x.id, x.count, x.mod || 0] : null)) : undefined })),
    };
    try { await this.store.set('i:' + room.owner, data); } catch (e) { console.error('[island save]', e.message); room.dirty = true; }
  }
  moveToRoom(p, room, pos) {
    p.room.players.delete(p); p.room = room; room.players.add(p); room.emptySince = 0;
    if (pos) { p.x = pos.x; p.y = pos.y; p.epoch++; p.queue.length = 0; p.dashLeft = 0; p.fx = {}; } else this.spawnPlayer(p);
    p.invuln = this.time + 1.5; this.closeChestFor(p); this.sendRoom(p);
  }
  closeChestFor(p) { this.send(p, { t: 'chest_close' }); }
  startTp(p) {
    if (!p.alive) return;
    if (p.tp) { this.cancelTp(p, 'Teleport cancelled.'); return; }
    if (p.room.island) { this.leaveIsland(p); return; }
    p.tp = { at: this.time + C.TP_TIME, hurt: p.lastHurt };
    this.send(p, { t: 'tp', d: C.TP_TIME }); this.sys(p, 'Teleporting home... stay safe!');
  }
  cancelTp(p, msg) { if (!p.tp) return; p.tp = null; this.send(p, { t: 'tp', d: 0 }); if (msg) this.sys(p, msg); }
  async goHome(p) {
    p.tp = null; this.send(p, { t: 'tp', d: 0 });
    const room = await this.loadIsland(p.acc); room.ownerName = p.name; room.dirty = true;
    if (!this.players.has(p.id)) return;
    p.returnPos = { x: p.x, y: p.y }; this.moveToRoom(p, room);
    this.sys(p, 'Welcome home! Build anything. Nothing here can hurt you.');
  }
  leaveIsland(p) {
    if (!p.room.island) return;
    const pos = p.returnPos || { x: this.size / 2, y: this.size / 2 + 120 };
    this.moveToRoom(p, this.main, pos);
  }
  async enterIsland(p, owner) {
    const room = await this.loadIsland(owner);
    if (!this.players.has(p.id)) return;
    if (owner !== p.acc && !room.guests.has(p.acc)) { this.sys(p, "You aren't invited to that island."); return; }
    if (!p.room.island) p.returnPos = { x: p.x, y: p.y };
    this.moveToRoom(p, room);
  }
  invite(p, name) {
    const t = [...this.players.values()].find((o) => o !== p && o.name.toLowerCase() === name.toLowerCase());
    if (!t) { this.sys(p, `No player named "${name}" is online.`); return; }
    t.invites.set(p.acc, { until: this.time + 90, from: p.name });
    this.send(t, { t: 'invite', from: p.name, owner: p.acc });
    this.sys(p, `Invited ${t.name} to your island.`);
  }
  async acceptInvite(p, owner) {
    const inv = p.invites.get(owner); if (!inv || this.time > inv.until) { this.sys(p, 'That invitation expired.'); return; }
    p.invites.delete(owner);
    const room = await this.loadIsland(owner);
    if (!room.guests.has(p.acc)) { room.guests.set(p.acc, { name: p.name, chests: false, build: false }); room.dirty = true; }
    if (!p.visits.find((v) => v.owner === owner)) p.visits.push({ owner, name: inv.from });
    for (const o of room.players) if (o.acc === owner) this.sendRoom(o);
    await this.enterIsland(p, owner);
  }
  async visit(p, owner) { if (!p.visits.find((v) => v.owner === owner)) return; await this.enterIsland(p, owner); }
  setPerm(p, gid, chests, build) {
    const room = this.rooms.get('isl:' + p.acc); if (!room) return; const g = room.guests.get(gid); if (!g) return;
    g.chests = chests; g.build = build; room.dirty = true;
    for (const o of room.players) if (o.acc === gid || o === p) this.sendRoom(o);
  }
  kick(p, gid) {
    const room = this.rooms.get('isl:' + p.acc); if (!room || !room.guests.delete(gid)) return; room.dirty = true;
    for (const o of [...room.players]) if (o.acc === gid) { this.leaveIsland(o); this.sys(o, 'You were removed from that island.'); }
    const g = this.byAcc.get(gid); if (g) g.visits = g.visits.filter((v) => v.owner !== p.acc);
    this.sendRoom(p);
  }

  // ------------------------------------------------------------ chests
  chestFor(p, id) {
    const st = p.room.structMap.get(id);
    if (!st || st.type !== 'chest' || dist(p.x, p.y, st.x, st.y) > 260 || !this.canChest(p, p.room)) return null;
    return st;
  }
  sendChest(p, st) { this.send(p, { t: 'chest', id: st.id, slots: st.items.map((s) => (s ? [s.id, s.count, s.mod || 0] : 0)) }); }
  chestOpen(p, id) { const st = this.chestFor(p, id); if (!st) { this.sys(p, "You can't open that chest."); return; } this.sendChest(p, st); }
  chestPut(p, id, i) {
    const st = this.chestFor(p, id), s = p.inv[i]; if (!st || !s) return;
    const def = content.items[s.id]; let moved = false;
    if (!def.weapon) for (const c of st.items) if (c && c.id === s.id && c.count < (def.stack || 99)) { const n = Math.min((def.stack || 99) - c.count, s.count); c.count += n; s.count -= n; moved = true; if (s.count <= 0) break; }
    if (s.count > 0) { const j = st.items.findIndex((x) => !x); if (j >= 0) { st.items[j] = { id: s.id, count: s.count, mod: s.mod || null }; s.count = 0; moved = true; } }
    if (s.count <= 0) p.inv[i] = null;
    if (moved) { p.room.dirty = true; this.sendInv(p); this.sendChest(p, st); }
  }
  chestTake(p, id, i) {
    const st = this.chestFor(p, id), s = st && st.items[i]; if (!st || !s) return;
    const left = this.addItem(p, s.id, s.count, s.mod || null);
    if (left <= 0) st.items[i] = null; else s.count = left;
    p.room.dirty = true; this.sendChest(p, st);
  }

  // ------------------------------------------------------------ town NPCs
  npcNear(p, kind) { return this.npcs.find((n) => (!kind || n.kind === kind) && dist(p.x, p.y, n.x, n.y) < 220); }
  openNpc(p, id) {
    const n = this.npcs.find((x) => x.id === id); if (!n || p.room.island || dist(p.x, p.y, n.x, n.y) > 220) return;
    let text = n.text; if (n.kind === 'guide') { text = n.tips[n.tip++ % n.tips.length]; }
    this.send(p, { t: 'npc', id: n.id, kind: n.kind, name: n.name, text, shop: n.shop || null, coins: this.countItem(p, 'coin'), cost: n.kind === 'nurse' ? 15 + p.level * 2 : 0 });
  }
  buy(p, npcId, item, n) {
    const npc = this.npcs.find((x) => x.id === npcId); if (!npc || !npc.shop || dist(p.x, p.y, npc.x, npc.y) > 220) return;
    const row = npc.shop.find((r) => r[0] === item); if (!row) return; n = clamp(n, 1, 99);
    const price = row[1] * n; if (this.countItem(p, 'coin') < price) { this.sys(p, 'Not enough coins.'); return; }
    const left = this.addItem(p, item, n); if (left >= n) { this.sys(p, 'Inventory full.'); return; }
    this.removeItem(p, 'coin', price - 0); if (left > 0) { this.addItem(p, 'coin', left * row[1]); }
    this.sendInv(p); this.send(p, { t: 'coins', c: this.countItem(p, 'coin') });
  }
  sell(p, i) {
    const s = p.inv[i]; if (!s || s.id === 'coin' || !this.npcNear(p, 'shop')) return;
    const price = Math.max(1, Math.round(this.slotValue(s) * 0.35)) * s.count;
    p.inv[i] = null; this.addItem(p, 'coin', price); this.sendInv(p); this.send(p, { t: 'coins', c: this.countItem(p, 'coin') });
    this.sys(p, `Sold for ${price} coins.`);
  }
  reforgeCost(s) { return Math.max(25, Math.round(this.slotValue(s) * 0.5)); }
  reforge(p, i) {
    const s = p.inv[i]; if (!s || !content.items[s.id].weapon || !this.npcNear(p, 'reforge')) return;
    const cost = this.reforgeCost(s); if (this.countItem(p, 'coin') < cost) { this.sys(p, `Reforging costs ${cost} coins.`); return; }
    this.removeItem(p, 'coin', cost);
    let nm = s.mod; for (let t = 0; t < 8 && nm === s.mod; t++) nm = content.rollModifier(0.92);
    p.inv[i] = { ...s, mod: nm || null }; this.sendInv(p); this.send(p, { t: 'coins', c: this.countItem(p, 'coin') });
    const md = nm ? content.modById[nm].n + ' ' : ''; this.sys(p, `Reforged: ${md}${content.items[s.id].name}`);
    this.send(p, { t: 'reforged', i });
  }
  nurse(p) {
    if (!this.npcNear(p, 'nurse')) return; const cost = 15 + p.level * 2;
    if (this.countItem(p, 'coin') < cost) { this.sys(p, `Healing costs ${cost} coins.`); return; }
    this.removeItem(p, 'coin', cost); p.hp = p.maxHp; p.fx = {}; this.sendInv(p); this.send(p, { t: 'coins', c: this.countItem(p, 'coin') });
    this.events.push({ e: 'heal', rm: 'main', x: rd(p.x), y: rd(p.y - 30), v: p.maxHp });
  }

  // ------------------------------------------------------------ structures (placing, damage, effects)
  place(p, x, y) {
    if (!p.alive || !isFinite(x) || !isFinite(y)) return;
    const slot = p.inv[p.sel]; const sd = slot && content.structures[slot.id]; if (!sd) return;
    if (this.time < (p.nextPlace || 0)) return; p.nextPlace = this.time + 0.2;
    const room = p.room;
    if (dist(p.x, p.y, x, y) > C.BUILD_RANGE + 20) return;
    if (room.island) {
      if (!this.canBuild(p, room)) { this.sys(p, "You don't have permission to build here."); return; }
      if (dist(x, y, IC, IC) > C.ISLAND_R - 30) return;
    } else {
      if (sd.homeOnly) { this.sys(p, `${sd.name} can only be placed on your private island (press H).`); return; }
      if (x < 60 || y < 60 || x > this.size - 60 || y > this.size - 60) return;
      if (this.inSafe(x, y)) { this.sys(p, "You can't build in the safe zone."); return; }
    }
    const lim = room.island ? sd.limitHome : sd.limitMain;
    let count = 0; for (const s of room.structMap.values()) if (s.owner === p.own && s.type === slot.id) count++;
    if (count >= lim) { this.sys(p, `Build limit reached for ${sd.name} (${count}/${lim}).`); return; }
    let bad = false;
    if (!room.island) this.world.near(x, y, sd.r + 90, (n) => { if (n.alive && n.solid && dist(x, y, n.x, n.y) < sd.r + n.r * 0.8) bad = true; });
    room.structs.near(x, y, sd.r + 90, (o) => { if (dist(x, y, o.x, o.y) < sd.r + o.r - 8) bad = true; });
    if (sd.solid) for (const o of room.players) if (o.alive && dist(x, y, o.x, o.y) < sd.r + C.PLAYER.radius) bad = true;
    if (bad) return;
    const st = this.addStruct(room, slot.id, x, y, { owner: p.own });
    if (room.island) room.dirty = true;
    slot.count--; if (slot.count <= 0) p.inv[p.sel] = null; this.sendInv(p);
    this.events.push({ e: 'sadd', rm: room.id, x: st.x, y: st.y, s: [st.id, st.type, st.x, st.y, st.hp, st.maxHp, st.owner] });
  }
  hurtStruct(st, amount) {
    if (st.room.island) return;
    st.hp -= amount;
    this.events.push({ e: 'shit', rm: 'main', x: st.x, y: st.y, id: st.id, hp: Math.max(0, Math.round(st.hp)), max: st.maxHp });
    if (st.hp <= 0) this.removeStruct(st);
  }
  pickupStruct(p, x, y) {
    if (!p.alive) return;
    if (!isFinite(x) || !isFinite(y)) { x = p.x; y = p.y; }
    const room = p.room, isOwner = room.island && room.owner === p.acc;
    let best = null, bd = 90;
    room.structs.near(x, y, 90, (s) => { const d = dist(x, y, s.x, s.y); if (d < bd && dist(p.x, p.y, s.x, s.y) < C.BUILD_RANGE + 40 && (s.owner === p.own || isOwner)) { bd = d; best = s; } });
    if (!best) return;
    if (best.items && best.items.some(Boolean)) { this.sys(p, 'Empty the chest first.'); return; }
    if (this.addItem(p, best.type, 1) > 0) return;
    this.removeStruct(best);
  }
  collideStructs(e, radius, room) {
    let hit = null;
    room.structs.near(e.x, e.y, radius + 70, (s) => {
      if (!s.def.solid) return;
      const dx = e.x - s.x, dy = e.y - s.y, min = radius + s.r * 0.92, d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > 0.0001) { const d = Math.sqrt(d2), push = (min - d) / d; e.x += dx * push; e.y += dy * push; hit = s; }
    });
    return hit;
  }
  collidePlayer(p) {
    const R = C.PLAYER.radius;
    if (p.room.island) {
      this.collideStructs(p, R, p.room);
      const dx = p.x - IC, dy = p.y - IC, d = Math.hypot(dx, dy), lim = C.ISLAND_R - 30; if (d > lim) { p.x = IC + dx / d * lim; p.y = IC + dy / d * lim; }
    } else { this.world.collide(p, R); this.collideStructs(p, R, this.main); }
  }
  crushStructs(m) {
    if (this.time < (m.nextCrush || 0)) return; m.nextCrush = this.time + 0.5;
    this.main.structs.near(m.x, m.y, m.r + 60, (s) => { if (dist(m.x, m.y, s.x, s.y) < m.r + s.r) this.hurtStruct(s, 140); });
  }
  runStructures(dt) {
    for (const room of this.rooms.values()) {
      if (!room.players.size && room.island) continue;
      for (const s of room.active) {
        const d = s.def;
        if (d.type === 'fire') {
          for (const p of room.players) if (p.alive && dist(p.x, p.y, s.x, s.y) < d.healRange) { p.hp = Math.min(p.maxHp, p.hp + d.heal * dt); p.buffs.campfire = { until: this.time + 1.5 }; }
        } else if (room.island) continue;
        else if (d.type === 'spike') {
          if (this.time < s.next) continue;
          let hit = false;
          for (const p of room.players) if (p.alive && p.own !== s.owner && dist(p.x, p.y, s.x, s.y) < s.r + C.PLAYER.radius + 6) { this.hurtPlayer(p, d.dmg, d.name); hit = true; }
          const owner = this.byOwn(s.owner);
          this.mobGrid.near(s.x, s.y, s.r + 80, (m) => { if (m.hp > 0 && m.air <= 0 && dist(m.x, m.y, s.x, s.y) < s.r + m.r + 4) { this.hurtMob(m, d.dmg * (m.boss ? 0.5 : 1), owner); hit = true; } });
          if (hit) s.next = this.time + 0.7;
        } else if (d.type === 'trap') {
          if (this.time < s.armedAt) continue;
          let tripped = false;
          for (const p of room.players) if (p.alive && p.own !== s.owner && dist(p.x, p.y, s.x, s.y) < s.r + 12) { p.fx.slow = { until: this.time + d.root, mult: 0.03 }; this.hurtPlayer(p, d.dmg, d.name); tripped = true; }
          const owner = this.byOwn(s.owner);
          this.mobGrid.near(s.x, s.y, s.r + 40, (m) => { if (!m.boss && m.hp > 0 && m.air <= 0 && dist(m.x, m.y, s.x, s.y) < s.r + 8) { m.fx.slow = { until: this.time + d.root, mult: 0.03 }; this.hurtMob(m, d.dmg, owner); tripped = true; } });
          if (tripped) { s.armedAt = this.time + d.rearm; this.events.push({ e: 'trap', rm: 'main', x: s.x, y: s.y }); }
        }
      }
    }
  }
  byOwn(own) { for (const p of this.players.values()) if (p.own === own) return p; return null; }

  // ------------------------------------------------------------ mobs
  spawnMob(type, x, y, opts = {}) {
    const def = content.mobs[type]; if (!def) return null;
    x = clamp(x, 60, this.size - 60); y = clamp(y, 60, this.size - 60);
    const m = {
      id: nid(), type, def, x, y, angle: Math.random() * 6.28, hp: def.hp, maxHp: def.hp, r: def.radius, fx: {},
      nextAtk: 0, wanderUntil: 0, wa: 0, kvx: 0, kvy: 0, fleeUntil: 0, fleeFrom: null, lastHit: 0, boss: !!def.boss, pat: (def.patterns || []).map(() => this.time + rand(3, 5)),
      phase: 0, shiny: false, dmgMul: 1, dropMul: 1, idle: 0, air: opts.air || 0, evt: !!opts.evt, pend: null, hasTarget: false,
    };
    const z = this.world.zone(x, y); m.zone = z; m.xpMul = 1 + z * 1.5;
    if (def.boss) { m.maxHp = m.hp = Math.round(def.hp * (1 + z * 0.5)); m.dmgMul = 1 + z * 0.3; }
    else { m.maxHp = m.hp = Math.round(def.hp * (1 + z * 2.0)); m.dmgMul = 1 + z * 1.0; }
    if (!def.boss && !opts.noShiny && !opts.evt && Math.random() < C.SHINY_CHANCE) { m.shiny = true; m.maxHp = m.hp = m.hp * 2; m.dmgMul *= 1.5; m.dropMul = 3; }
    this.mobs.set(m.id, m);
    return m;
  }
  nearestPlayer(x, y, range, ignoreSafe = true) {
    let best = null, bd = range;
    for (const p of this.main.players) {
      if (!p.alive) continue;
      if (ignoreSafe && this.inSafe(p.x, p.y)) continue;
      const d = dist(x, y, p.x, p.y); if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  killMob(m) {
    this.mobs.delete(m.id);
    this.rollDrops(m.def.drops, m.x, m.y, m.dropMul, m.zone || 0);
    const killer = this.players.get(m.lastHit);
    if (killer) {
      this.giveXp(killer, Math.round((m.def.xp || 5) * (m.xpMul || 1) * (m.shiny ? 3 : 1))); killer.kills++;
      easter.onKill(this, killer, m);
      if (m.shiny) this.sys(killer, '✨ You slew a shiny ' + m.def.name + '!');
    }
    if (m.evt && this.ev && !m.boss) this.ev.progress++;
    if (m.boss) this.broadcast({ t: 'chat', sys: 1, m: `☠ ${m.def.name} was defeated${killer ? ' by ' + killer.name : ''}!` });
    this.events.push({ e: 'boom', rm: 'main', x: rd(m.x), y: rd(m.y), r: m.r });
  }
  hurtMob(m, amount, p, knockAng, knock, crit) {
    if (m.hp <= 0 || m.air > 0) return;
    m.hp -= amount; if (p) m.lastHit = p.id;
    this.events.push({ e: 'dmg', rm: 'main', x: rd(m.x), y: rd(m.y - m.r), v: Math.round(amount), c: crit ? 1 : 0 });
    if (knock) { const k = m.boss ? knock * 0.08 : knock; m.kvx += Math.cos(knockAng) * k; m.kvy += Math.sin(knockAng) * k; }
    if (m.def.behavior === 'passive' && p) { m.fleeUntil = this.time + 3; m.fleeFrom = p; }
    if (m.hp <= 0) this.killMob(m);
  }
  defense(p) { return p.buffs.ironskin ? 8 : 0; }
  hurtPlayer(p, amount, srcName, fx) {
    if (!p.alive || this.time < p.invuln || p.room.island || this.inSafe(p.x, p.y)) return;
    amount = Math.max(1, amount - this.defense(p) * 0.5);
    p.hp -= amount; p.lastHurt = this.time;
    this.events.push({ e: 'dmg', rm: 'main', x: rd(p.x), y: rd(p.y - 30), v: Math.round(amount), me: p.id });
    if (fx) this.applyFx(p, fx);
    if (p.hp <= 0) this.killPlayer(p, srcName);
  }
  killPlayer(p, by) {
    p.alive = false; p.hp = 0; p.respawnAt = this.time + C.RESPAWN_TIME; p.atk = false; this.cancelTp(p);
    this.send(p, { t: 'dead', by: by || 'the world', in: C.RESPAWN_TIME });
    this.broadcast({ t: 'chat', sys: 1, m: `${p.name} was slain by ${by || 'the world'}.` });
    this.events.push({ e: 'boom', rm: 'main', x: rd(p.x), y: rd(p.y), r: 30 });
  }
  applyFx(e, fx) {
    for (const [k, v] of Object.entries(fx)) {
      if (k === 'lifesteal') continue;
      const mult = e.boss ? 0.5 : 1;
      if (k === 'burn' || k === 'poison') e.fx[k] = { until: this.time + v.dur, dps: v.dps || 0 };
      else if (k === 'slow') e.fx.slow = { until: this.time + v.dur * mult, mult: v.mult };
    }
  }
  tickFx(e, dt, isPlayer, srcPlayerId) {
    for (const k of Object.keys(e.fx)) {
      const f = e.fx[k];
      if (this.time > f.until) { delete e.fx[k]; continue; }
      if ((k === 'burn' || k === 'poison') && f.dps) {
        const amt = f.dps * dt;
        if (isPlayer) { if (!this.inSafe(e.x, e.y) && !e.room.island) { e.hp -= amt; if (e.hp <= 0 && e.alive) this.killPlayer(e, k === 'burn' ? 'burning' : 'poison'); } }
        else { e.hp -= amt; if (srcPlayerId) e.lastHit = srcPlayerId; if (e.hp <= 0) this.killMob(e); }
      }
    }
  }
  slowMult(e) { return e.fx.slow ? e.fx.slow.mult : 1; }
  fxFlags(e) { return (e.fx.burn ? 1 : 0) | (e.fx.poison ? 2 : 0) | (e.fx.slow ? 4 : 0); }

  // ------------------------------------------------------------ combat
  weaponStats(p) {
    const s = p.inv[p.sel], def = s && content.items[s.id], w = def && def.weapon ? def.weapon : content.HAND;
    const m = s && s.mod ? content.modById[s.mod] : null;
    let mul = 1 + (p.level - 1) * 0.04; if (p.buffs.wrath) mul *= 1.2; if (p.buffs.well_fed) mul *= 1.05;
    return { w, dmg: w.dmg * (1 + (m ? m.dmg / 100 : 0)) * mul, crit: (w.crit || 0) + (m ? m.crit : 0), kb: 1 + (m ? m.kb / 100 : 0) };
  }
  attack(p) {
    if (!p.alive || p.room.island) return;
    const st = this.weaponStats(p), w = st.w;
    p.nextAtk = this.time + w.cooldown;
    const a = p.angle;
    this.events.push({ e: 'swing', rm: 'main', id: p.id, a: Math.round(a * 100) / 100, r: w.melee ? w.melee.range : 0, arc: w.melee ? w.melee.arc : 0, x: rd(p.x), y: rd(p.y) });
    if (w.melee) this.meleeHit(p, w, st, a);
    if (w.projectile) {
      const pr = w.projectile, n = pr.count || 1;
      for (let i = 0; i < n; i++) {
        const off = n > 1 ? (i / (n - 1) - 0.5) * pr.spread : (Math.random() - 0.5) * pr.spread, crit = Math.random() * 100 < st.crit;
        this.shoot('p', p.id, p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30, a + off, pr, st.dmg * (crit ? 2 : 1), w.fx, p.name, crit);
      }
    }
  }
  meleeHit(p, w, st, a) {
    const m = w.melee, half = (m.arc * Math.PI / 180) / 2, knock = m.knock * st.kb;
    const inArc = (tx, ty, tr) => {
      const d = dist(p.x, p.y, tx, ty); if (d - tr > m.range) return false;
      if (d < tr + 10) return true;
      return angDiff(Math.atan2(ty - p.y, tx - p.x), a) <= half + Math.atan2(tr, d);
    };
    // swords & co. knock hostile projectiles out of the air
    const kept = [];
    for (const pj of this.projectiles) {
      if (pj.owner === 'm' && !pj.heavy && inArc(pj.x, pj.y, pj.r)) { this.events.push({ e: 'parry', rm: 'main', x: rd(pj.x), y: rd(pj.y), c: pj.color }); continue; }
      kept.push(pj);
    }
    this.projectiles = kept;
    const roll = () => { const c = Math.random() * 100 < st.crit; return [st.dmg * (c ? 2 : 1), c]; };
    for (const mob of this.mobs.values()) {
      if (mob.air > 0 || !inArc(mob.x, mob.y, mob.r)) continue;
      const [dd, c] = roll(); this.hurtMob(mob, dd, p, a, knock, c);
      if (w.fx) { this.applyFx(mob, w.fx); mob.lastHit = p.id; if (w.fx.lifesteal) p.hp = Math.min(p.maxHp, p.hp + dd * w.fx.lifesteal); }
    }
    if (C.PVP) for (const o of this.main.players) {
      if (o === p || !o.alive || this.inSafe(o.x, o.y) || this.inSafe(p.x, p.y)) continue;
      if (inArc(o.x, o.y, C.PLAYER.radius)) {
        const [dd] = roll(); this.hurtPlayer(o, dd, p.name, w.fx);
        if (!o.alive) { p.kills++; this.giveXp(p, 20 + o.level * 10); }
        if (w.fx && w.fx.lifesteal) p.hp = Math.min(p.maxHp, p.hp + dd * w.fx.lifesteal);
      }
    }
    this.world.near(p.x, p.y, m.range + 60, (r) => { if (r.alive && inArc(r.x, r.y, r.r)) this.gather(p, w, st, r); });
  }
  gather(p, w, st, r) {
    const def = content.nodes[r.type];
    const need = def.kind === 'tree' ? 'axe' : (def.kind === 'rock' || def.kind === 'ore') ? 'pickaxe' : null;
    if (need && w.tool !== need) {
      if (this.time - (p.toolMsg || 0) > 2.5) { p.toolMsg = this.time; this.sys(p, need === 'axe' ? 'You need an AXE to chop trees.' : 'You need a PICKAXE to mine that.'); }
      return;
    }
    const power = need ? Math.max(1, st.dmg * 1.6) : 8;
    r.hp -= power;
    this.events.push({ e: 'hit', rm: 'main', id: r.id, hp: Math.max(0, Math.round(r.hp)), max: r.maxHp, x: rd(r.x), y: rd(r.y) });
    if (w.toolTier >= def.tierReq) {
      for (const d of def.drops) {
        if (Math.random() > (d.chance === undefined ? 1 : d.chance)) continue;
        const left = this.addItem(p, d.item, randi(d.min, d.max)); if (left > 0) this.spawnDrop(d.item, left, p.x, p.y);
      }
    } else if (Math.random() < 0.15) this.sys(p, `Your tool is too weak for ${def.name} (needs tier ${def.tierReq}).`);
    if (r.hp <= 0) {
      r.alive = false; r.respawnAt = this.time + def.respawn;
      this.resPendingEvents.push({ t: 'rs', id: r.id, alive: 0 });
      if (w.toolTier >= def.tierReq) for (const d of def.drops) this.spawnDrop(d.item, randi(d.min, d.max) * 2, r.x, r.y, 0.2);
      this.giveXp(p, 2 + def.tierReq * 3);
    }
  }
  shoot(owner, ownerId, x, y, ang, pr, dmg, fx, srcName, crit) {
    this.projectiles.push({
      id: nid(), owner, ownerId, x, y, vx: Math.cos(ang) * pr.speed, vy: Math.sin(ang) * pr.speed, r: pr.radius, kind: pr.kind || 'orb',
      dmg, hp: dmg, life: pr.life, color: pr.color || '#fff', pierce: pr.pierce || 0, explode: pr.explode || 0, heavy: !!pr.heavy, fx: fx || pr.fx || null, hit: new Set(), src: srcName || '', crit: !!crit,
    });
  }
  explode(pj, x, y) {
    const R = pj.explode; this.events.push({ e: 'boom', rm: 'main', x: rd(x), y: rd(y), r: R });
    const owner = pj.owner === 'p' ? this.players.get(pj.ownerId) : null;
    if (pj.owner === 'p') {
      for (const m of this.mobs.values()) if (m.air <= 0 && dist(m.x, m.y, x, y) < R + m.r) this.hurtMob(m, pj.dmg * 0.8, owner, Math.atan2(m.y - y, m.x - x), 200);
      if (C.PVP) for (const o of this.main.players) if (o.id !== pj.ownerId && o.alive && dist(o.x, o.y, x, y) < R + 20) this.hurtPlayer(o, pj.dmg * 0.6, pj.src);
    } else for (const o of this.main.players) if (o.alive && dist(o.x, o.y, x, y) < R + 20) this.hurtPlayer(o, pj.dmg * 0.8, pj.src, pj.fx);
  }
  updateProjectiles(dt) {
    // projectile vs projectile: magic / arrows can shoot down enemy projectiles
    const hostile = [], friendly = [];
    for (const pj of this.projectiles) (pj.owner === 'm' ? hostile : friendly).push(pj);
    if (hostile.length && friendly.length) for (const f of friendly) for (const h of hostile) {
      if (f.hp <= 0 || h.hp <= 0) continue;
      if (dist(f.x, f.y, h.x, h.y) < f.r + h.r) {
        const fd = f.hp, hd = h.hp; f.hp -= hd; h.hp -= fd;
        if (f.heavy) f.hp = Math.max(f.hp, 1);
        if (h.heavy) h.hp = Math.max(h.hp, 1);
        this.events.push({ e: 'parry', rm: 'main', x: rd((f.x + h.x) / 2), y: rd((f.y + h.y) / 2), c: h.hp <= 0 ? h.color : f.color });
      }
    }
    const out = [];
    for (const pj of this.projectiles) {
      if (pj.hp <= 0) continue;
      pj.x += pj.vx * dt; pj.y += pj.vy * dt; pj.life -= dt;
      let dead = pj.life <= 0 || pj.x < 0 || pj.y < 0 || pj.x > this.size || pj.y > this.size;
      if (!dead) {
        if (pj.owner === 'p') {
          const owner = this.players.get(pj.ownerId);
          for (const m of this.mobs.values()) {
            if (m.air > 0 || pj.hit.has(m.id) || dist(pj.x, pj.y, m.x, m.y) > m.r + pj.r) continue;
            pj.hit.add(m.id);
            if (!pj.explode) {
              this.hurtMob(m, pj.dmg, owner, Math.atan2(pj.vy, pj.vx), 80, pj.crit);
              if (pj.fx) { this.applyFx(m, pj.fx); if (owner && pj.fx.lifesteal) owner.hp = Math.min(owner.maxHp, owner.hp + pj.dmg * pj.fx.lifesteal); }
            }
            if (pj.pierce-- <= 0) { dead = true; break; }
          }
          if (!dead && C.PVP) for (const o of this.main.players) {
            if (o.id === pj.ownerId || !o.alive || pj.hit.has(o.id) || this.inSafe(o.x, o.y) || dist(pj.x, pj.y, o.x, o.y) > C.PLAYER.radius + pj.r) continue;
            pj.hit.add(o.id);
            if (!pj.explode) { this.hurtPlayer(o, pj.dmg, pj.src, pj.fx); if (!o.alive && owner) { owner.kills++; this.giveXp(owner, 20 + o.level * 10); } }
            if (pj.pierce-- <= 0) { dead = true; break; }
          }
        } else {
          for (const o of this.main.players) {
            if (!o.alive || dist(pj.x, pj.y, o.x, o.y) > C.PLAYER.radius + pj.r) continue;
            if (!pj.explode) this.hurtPlayer(o, pj.dmg, pj.src, pj.fx);
            dead = true; break;
          }
        }
      }
      if (dead) { if (pj.explode) this.explode(pj, pj.x, pj.y); } else out.push(pj);
    }
    this.projectiles = out;
  }

  // ------------------------------------------------------------ mob AI
  updateMob(m, dt) {
    const d = m.def, t = this.time;
    if (m.air > 0) { m.air -= dt; if (m.air <= 0) this.events.push({ e: 'land', rm: 'main', x: rd(m.x), y: rd(m.y), r: m.r }); return; }
    this.tickFx(m, dt, false, m.lastHit); if (!this.mobs.has(m.id)) return;
    const slow = this.slowMult(m);
    if (m.kvx || m.kvy) { m.x += m.kvx * dt; m.y += m.kvy * dt; const k = Math.max(0, 1 - dt * 7); m.kvx *= k; m.kvy *= k; if (Math.abs(m.kvx) + Math.abs(m.kvy) < 5) m.kvx = m.kvy = 0; }
    if (m.boss) this.updateBoss(m, dt, slow);
    else {
      let target = null;
      if (d.behavior !== 'passive') target = this.nearestPlayer(m.x, m.y, d.aggro || 400);
      m.hasTarget = !!target;
      if (target) {
        const ang = Math.atan2(target.y - m.y, target.x - m.x), dd = dist(m.x, m.y, target.x, target.y);
        m.angle = ang;
        if (d.behavior === 'ranged') {
          const R = d.ranged, spd = d.speed * slow;
          if (dd < R.keep - 60) { m.x -= Math.cos(ang) * spd * dt; m.y -= Math.sin(ang) * spd * dt; }
          else if (dd > R.keep + 40) { m.x += Math.cos(ang) * spd * dt; m.y += Math.sin(ang) * spd * dt; }
          if (dd < R.range && t >= m.nextAtk) {
            m.nextAtk = t + R.cd; const n = R.count || 1;
            for (let i = 0; i < n; i++) { const off = n > 1 ? (i / (n - 1) - 0.5) * (R.spread || 0.3) : 0; this.shoot('m', m.id, m.x, m.y, ang + off, R.proj, R.proj.dmg * m.dmgMul, R.proj.fx, d.name); }
          }
        } else {
          const spd = d.speed * slow;
          if (dd > m.r + C.PLAYER.radius) { m.x += Math.cos(ang) * spd * dt; m.y += Math.sin(ang) * spd * dt; }
          if (dd < m.r + C.PLAYER.radius + 12 && t >= m.nextAtk) { m.nextAtk = t + 0.9; this.hurtPlayer(target, d.dmg * m.dmgMul, d.name, d.fx); }
        }
      } else if (m.fleeUntil > t && m.fleeFrom) {
        const ang = Math.atan2(m.y - m.fleeFrom.y, m.x - m.fleeFrom.x); m.angle = ang;
        m.x += Math.cos(ang) * d.speed * 1.6 * dt; m.y += Math.sin(ang) * d.speed * 1.6 * dt;
      } else {
        if (t > m.wanderUntil) { m.wanderUntil = t + rand(1.5, 4); m.wa = Math.random() < 0.35 ? -1 : Math.random() * 6.28; }
        if (m.wa >= 0) { m.angle = m.wa; m.x += Math.cos(m.wa) * d.speed * 0.35 * dt; m.y += Math.sin(m.wa) * d.speed * 0.35 * dt; }
      }
    }
    this.world.collide(m, m.r * 0.6);
    if (m.boss) this.crushStructs(m);
    else { const hs = this.collideStructs(m, m.r * 0.6, this.main); if (hs && m.hasTarget && t >= (m.nextStruct || 0)) { m.nextStruct = t + 1; this.hurtStruct(hs, (d.dmg || 8) * m.dmgMul * 1.2); } }
  }
  updateBoss(m, dt, slow) {
    const d = m.def, t = this.time;
    const target = this.nearestPlayer(m.x, m.y, 1800);
    const frac = m.hp / m.maxHp; let ph = 0; for (const th of d.phases || []) if (frac <= th) ph++;
    if (ph > m.phase) { m.phase = ph; this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${d.name} enters phase ${ph + 1}!` }); }
    if (!target) { m.idle += dt; m.pend = null; if (m.idle > 90) this.mobs.delete(m.id); m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.02 * dt); return; }
    m.idle = 0;
    const ang = Math.atan2(target.y - m.y, target.x - m.x), dd = dist(m.x, m.y, target.x, target.y);
    if (!m.pend) m.angle = ang;
    // telegraphed attack: boss stands still, the warning plays, then it strikes in the LOCKED direction
    if (m.pend && t >= m.pend.at) { const pd = m.pend; m.pend = null; this.runPattern(m, pd.pat, target, pd.ang, true); }
    const spdMul = (1 + 0.12 * m.phase) * slow;
    if (!m.pend) {
      if (m.chargeUntil > t) { m.x += Math.cos(m.chargeAng) * d.speed * m.chargeMul * dt; m.y += Math.sin(m.chargeAng) * d.speed * m.chargeMul * dt; }
      else if (dd > m.r + 40) { m.x += Math.cos(ang) * d.speed * spdMul * dt; m.y += Math.sin(ang) * d.speed * spdMul * dt; }
    }
    for (const p of this.main.players) if (p.alive && dist(m.x, m.y, p.x, p.y) < m.r + C.PLAYER.radius + 8 && t >= m.nextAtk) { m.nextAtk = t + 0.9; this.hurtPlayer(p, d.dmg * m.dmgMul, d.name); }
    if (!m.pend && !(m.chargeUntil > t)) (d.patterns || []).forEach((pat, i) => {
      if (m.pend || t < m.pat[i]) return;
      m.pat[i] = t + pat.cd * (1 - 0.12 * m.phase) * rand(0.95, 1.15);
      if (pat.tele) { m.pend = { at: t + pat.tele, pat, ang }; this.telegraph(m, pat, ang, target); }
      else this.runPattern(m, pat, target, ang, false);
    });
    if (m.spiral && t < m.spiral.until && t >= m.spiral.next) {
      const sp = m.spiral.pat; m.spiral.next = t + 0.1; m.spiral.a += 0.45;
      for (let i = 0; i < (sp.count || 2); i++) this.shoot('m', m.id, m.x, m.y, m.spiral.a + (i * Math.PI * 2) / (sp.count || 2), sp, sp.dmg * m.dmgMul, sp.fx, d.name);
    }
    if (m.slam && t >= m.slam.at) {
      const s = m.slam; m.slam = null;
      this.events.push({ e: 'boom', rm: 'main', x: rd(s.x), y: rd(s.y), r: s.r });
      for (const p of this.main.players) if (p.alive && dist(p.x, p.y, s.x, s.y) < s.r) this.hurtPlayer(p, s.dmg * m.dmgMul, d.name);
    }
  }
  telegraph(m, pat, ang, target) {
    const ev = { e: 'tele', rm: 'main', x: rd(m.x), y: rd(m.y), d: pat.tele, id: m.id, r: m.r };
    if (pat.type === 'charge') this.events.push({ ...ev, k: 'charge', a: Math.round(ang * 100) / 100, len: rd(m.def.speed * pat.speed * pat.dur + m.r), w: rd(m.r * 1.5) });
    else if (pat.type === 'aim') this.events.push({ ...ev, k: 'aim', a: Math.round(ang * 100) / 100, spread: pat.spread || 0, n: pat.count || 1 });
    else this.events.push({ ...ev, k: 'pulse', col: pat.color || '#ff6a3a' });
  }
  runPattern(m, pat, target, ang, wasTele) {
    const d = m.def;
    switch (pat.type) {
      case 'charge': m.chargeUntil = this.time + pat.dur; m.chargeAng = ang; m.chargeMul = pat.speed; break;
      case 'aim': { const n = pat.count || 1; for (let i = 0; i < n; i++) { const off = n > 1 ? (i / (n - 1) - 0.5) * pat.spread : 0; this.shoot('m', m.id, m.x, m.y, ang + off, pat, pat.dmg * m.dmgMul, pat.fx, d.name); } break; }
      case 'burst': { const n = pat.count || 12, base = Math.random() * 6.28; for (let i = 0; i < n; i++) this.shoot('m', m.id, m.x, m.y, base + (i / n) * Math.PI * 2, pat, pat.dmg * m.dmgMul, pat.fx, d.name); break; }
      case 'spiral': m.spiral = { until: this.time + pat.dur, next: this.time, a: Math.random() * 6.28, pat }; break;
      case 'summon': {
        let minions = 0; for (const o of this.mobs.values()) if (!o.boss && o.minionOf === m.id) minions++;
        if (minions > 8) break;
        for (let i = 0; i < pat.n; i++) { const s = this.spawnMob(pat.mob, m.x + rand(-160, 160), m.y + rand(-160, 160), { noShiny: true }); if (s) s.minionOf = m.id; }
        break;
      }
      case 'slam': m.slam = { at: this.time + (pat.delay || 1), x: target.x, y: target.y, r: pat.radius, dmg: pat.dmg }; this.events.push({ e: 'ring', rm: 'main', x: rd(target.x), y: rd(target.y), r: pat.radius, d: pat.delay || 1 }); break;
    }
  }

  // ------------------------------------------------------------ spawning & world events
  runSpawner(dt) {
    this.spawnTimer -= dt; this.despawnTimer -= dt;
    const night = this.isNight();
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 2.5;
      let total = 0; for (const m of this.mobs.values()) if (!m.boss && !m.evt) total++;
      if (total < C.MOB_CAP) for (const p of this.main.players) {
        if (!p.alive || Math.random() > 0.55) continue;
        let near = 0; for (const m of this.mobs.values()) if (!m.boss && !m.evt && dist(m.x, m.y, p.x, p.y) < 1400) near++;
        if (near >= C.MOBS_PER_PLAYER + (night ? 2 : 0)) continue;
        const a = Math.random() * 6.28, r = rand(750, 1150), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
        if (x < 60 || y < 60 || x > this.size - 60 || y > this.size - 60) continue;
        const biome = content.biomes[this.world.biomeAt(x, y)], zn = this.world.zone(x, y);
        const type = pickWeighted(biome.mobs, (k) => { const dm = content.mobs[k]; if ((dm.minZone || 0) > zn) return false; const w = dm.when || 'any'; if (w === 'night' && !night) return false; if (w === 'day' && night) return false; return true; });
        if (!type) continue;
        if (content.mobs[type].behavior !== 'passive' && this.inSafe(x, y)) continue;
        this.spawnMob(type, x, y);
      }
    }
    if (this.despawnTimer <= 0) {
      this.despawnTimer = 2;
      for (const m of this.mobs.values()) {
        if (m.boss) continue;
        let close = false; for (const p of this.main.players) if (dist(m.x, m.y, p.x, p.y) < 2200) { close = true; break; }
        if (!close) this.mobs.delete(m.id);
      }
    }
    // very rare natural bosses
    if (this.time >= this.nextBossAt) {
      this.nextBossAt = this.time + C.BOSS_INTERVAL;
      const alive = [...this.main.players].filter((p) => p.alive && !this.inSafe(p.x, p.y));
      let bossCount = 0; for (const m of this.mobs.values()) if (m.boss) bossCount++;
      if (alive.length && bossCount < 1 && Math.random() < 0.5) {
        const p = alive[Math.floor(Math.random() * alive.length)], biome = content.biomes[this.world.biomeAt(p.x, p.y)];
        const pool = [...(biome.bosses || [])]; if (night && Math.random() < 0.5) pool.push('lich_king');
        if (pool.length) {
          const id = pool[Math.floor(Math.random() * pool.length)], a = Math.random() * 6.28;
          if (this.spawnMob(id, p.x + Math.cos(a) * 850, p.y + Math.sin(a) * 850)) this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${content.mobs[id].name} has awakened near ${p.name}!` });
        }
      }
    }
  }
  runEvents(dt) {
    const night = this.isNight();
    if (!this.ev) {
      this.evTimer -= dt; if (this.evTimer > 0) return; this.evTimer = 60;
      const ps = [...this.main.players].filter((p) => p.alive && !this.inSafe(p.x, p.y)); if (!ps.length) return;
      const p = ps[Math.floor(Math.random() * ps.length)], biome = this.world.biomeAt(p.x, p.y);
      for (const [id, e] of Object.entries(content.events)) {
        if (e.when === 'night' && !night) continue; if (e.when === 'day' && night) continue; if (!e.biomes.includes(biome)) continue;
        if (Math.random() < e.chance) {
          this.ev = { id, def: e, cx: p.x, cy: p.y, until: this.time + e.duration, progress: 0, spawnT: 3 };
          this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${e.banner}` });
          this.broadcast({ t: 'banner', text: e.banner, color: e.color });
          return;
        }
      }
      return;
    }
    const ev = this.ev, e = ev.def;
    if (this.time > ev.until) { this.broadcast({ t: 'chat', sys: 1, m: `${e.name} has ended.` }); for (const m of this.mobs.values()) if (m.evt) m.evt = false; this.ev = null; return; }
    if (ev.progress >= ev.goal || ev.progress >= e.goal) {
      const near = this.nearestPlayer(ev.cx, ev.cy, 2600, false) || [...this.main.players][0];
      if (near) { const a = Math.random() * 6.28, b = this.spawnMob(e.boss, near.x + Math.cos(a) * 700, near.y + Math.sin(a) * 700); if (b) { this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${content.mobs[e.boss].name} has been summoned!` }); this.broadcast({ t: 'banner', text: `${content.mobs[e.boss].name} approaches!`, color: e.color }); } }
      for (const m of this.mobs.values()) if (m.evt) m.evt = false;
      this.ev = null; return;
    }
    ev.spawnT -= dt;
    if (ev.spawnT <= 0) {
      ev.spawnT = e.interval;
      let alive = 0; for (const m of this.mobs.values()) if (m.evt) alive++;
      const ps = [...this.main.players].filter((p) => p.alive && dist(p.x, p.y, ev.cx, ev.cy) < 2200 && !this.inSafe(p.x, p.y));
      if (alive < e.maxAlive && ps.length) {
        const p = ps[Math.floor(Math.random() * ps.length)], a = Math.random() * 6.28, r = rand(450, 850);
        const type = pickWeighted(e.spawn); this.spawnMob(type, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, { evt: true, noShiny: true, air: e.air ? rand(1.6, 3.2) : 0 });
      }
    }
  }

  // ------------------------------------------------------------ main tick
  tick(dt) {
    this.time += dt; this.tickN++;
    this.dayTime = (this.dayTime + dt / C.DAY_LENGTH) % 1;
    const P = C.PLAYER, cfg = this.mvCfg();
    for (const p of this.players.values()) {
      if (!p.alive) { if (this.time >= p.respawnAt) { this.spawnPlayer(p); this.send(p, { t: 'spawn' }); } continue; }
      this.tickFx(p, dt, true); if (!p.alive) continue;
      for (const id of Object.keys(p.buffs)) if (this.time > p.buffs[id].until) delete p.buffs[id];
      let mult = this.slowMult(p); if (p.buffs.swiftness) mult *= 1.35; p.spd = mult;
      p.budget = Math.min(0.3, p.budget + dt);
      while (p.queue.length) {
        const inp = p.queue[0], idt = Math.min(inp.dt, 0.05);
        if (p.budget < idt - 1e-6) break;
        p.queue.shift(); p.budget -= idt;
        Movement.step(p, inp.k, inp.d, inp.a, idt, cfg, mult, () => this.collidePlayer(p));
        p.seq = inp.s; p.angle = inp.a;
      }
      if (p.queue.length > 40) p.queue.splice(0, p.queue.length - 10);
      if ((p.atk || p.atkLatch) && this.time >= p.nextAtk) { const sl = p.inv[p.sel]; if (!(sl && content.structures[sl.id])) this.attack(p); }
      p.atkLatch = false;
      let regen = 0;
      if (this.time - p.lastHurt > P.regenDelay) regen += P.regen;
      if (p.buffs.regeneration) regen += 2.4; if (p.buffs.well_fed) regen += 0.8; if (p.buffs.campfire) regen += 1.2;
      if (regen && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + regen * dt);
      if (p.tp) { if (p.lastHurt > p.tp.hurt) this.cancelTp(p, 'Teleport interrupted!'); else if (this.time >= p.tp.at) this.goHome(p); }
    }
    for (const m of [...this.mobs.values()]) this.updateMob(m, dt);
    this.mobGrid.clear(); for (const m of this.mobs.values()) this.mobGrid.add(m);
    this.runStructures(dt);
    this.updateProjectiles(dt);
    for (const dr of this.drops.values()) {
      if (this.time > dr.expires) { this.drops.delete(dr.id); continue; }
      if (this.time < dr.at) continue;
      for (const p of this.main.players) {
        if (!p.alive || dist(p.x, p.y, dr.x, dr.y) > P.pickupRadius) continue;
        const left = this.addItem(p, dr.item, dr.count, dr.mod || null);
        if (left < dr.count) { if (left <= 0) this.drops.delete(dr.id); else dr.count = left; this.events.push({ e: 'pick', rm: 'main', x: rd(dr.x), y: rd(dr.y), item: dr.item }); break; }
      }
    }
    this.resTimer -= dt;
    if (this.resTimer <= 0) { this.resTimer = 1; for (const r of this.world.res) if (!r.alive && this.time >= r.respawnAt) { r.alive = true; r.hp = r.maxHp; this.resPendingEvents.push({ t: 'rs', id: r.id, alive: 1 }); } }
    if (this.resPendingEvents.length) { for (const e of this.resPendingEvents) this.broadcast(e); this.resPendingEvents.length = 0; }
    this.runSpawner(dt); this.runEvents(dt);
    this.lbTimer -= dt;
    if (this.lbTimer <= 0) { this.lbTimer = 2; this.broadcast({ t: 'lb', top: [...this.players.values()].sort((a, b) => b.score - a.score).slice(0, 8).map((p) => [p.name, p.score, p.level]) }); }
    this.saveTimer -= dt;
    if (this.saveTimer <= 0) {
      this.saveTimer = 30; this.saveAll();
      for (const [id, r] of this.rooms) if (r.island && !r.players.size) { if (!r.emptySince) r.emptySince = this.time; else if (this.time - r.emptySince > 90) { this.saveRoom(r).then(() => { if (!r.players.size) this.rooms.delete(id); }); } }
    }
    this.sendSnapshots();
  }

  sendSnapshots() {
    const R = C.VIEW_RADIUS, R2 = R * R;
    const inR = (x, y, px, py) => { const dx = x - px, dy = y - py; return dx * dx + dy * dy < R2; };
    const evCenter = this.ev ? this.ev : null;
    for (const p of this.players.values()) {
      const room = p.room, isl = room.island;
      const pl = [], ml = [], pr = [], dr = [], ev = [];
      for (const o of room.players) {
        if (o === p || !o.alive || (!isl && !inR(o.x, o.y, p.x, p.y))) continue;
        const s = o.inv[o.sel], lk = o.look;
        pl.push([o.id, rd(o.x), rd(o.y), Math.round(o.angle * 100) / 100, Math.ceil(o.hp), o.maxHp, (o.title ? o.title + ' ' : '') + o.name, s ? s.id : '', o.level, this.fxFlags(o), o.dashLeft > 0 ? 1 : 0, [lk.s, lk.h, lk.c, lk.p, lk.st]]);
      }
      if (!isl) {
        for (const m of this.mobs.values()) if (inR(m.x, m.y, p.x, p.y)) ml.push([m.id, m.type, rd(m.x), rd(m.y), Math.round(m.angle * 100) / 100, Math.ceil(m.hp), m.maxHp, this.fxFlags(m) | (m.shiny ? 8 : 0), m.phase, m.air > 0 ? Math.round(m.air * 10) : 0]);
        for (const j of this.projectiles) if (inR(j.x, j.y, p.x, p.y)) pr.push([j.id, rd(j.x), rd(j.y), j.r, j.color, j.owner === 'm' ? 1 : 0, j.kind]);
        for (const d of this.drops.values()) if (inR(d.x, d.y, p.x, p.y)) dr.push([d.id, d.item, d.count, rd(d.x), rd(d.y), d.mod || 0]);
      }
      let st = null;
      if (this.tickN % 6 === 0) { st = []; room.structs.near(p.x, p.y, R, (s2) => { if (isl || inR(s2.x, s2.y, p.x, p.y)) st.push([s2.id, s2.type, rd(s2.x), rd(s2.y), Math.ceil(s2.hp), s2.maxHp, s2.owner]); }); }
      for (const e of this.events) { if (e.rm !== room.id) continue; if (!isl && e.x !== undefined && !inR(e.x, e.y, p.x, p.y)) continue; ev.push(e); }
      const bl = [];
      for (const id of Object.keys(p.buffs)) { const left = p.buffs[id].until - this.time; if (left > 0) bl.push([id, Math.ceil(left)]); }
      if (p.fx.burn) bl.push(['burning', Math.ceil(p.fx.burn.until - this.time)]); if (p.fx.poison) bl.push(['poisoned', Math.ceil(p.fx.poison.until - this.time)]);
      if (p.fx.slow) bl.push([p.fx.slow.mult < 0.1 ? 'rooted' : 'slowed', Math.ceil(p.fx.slow.until - this.time)]);
      if (p.healCd > this.time) bl.push(['potion_sickness', Math.ceil(p.healCd - this.time)]);
      const out = {
        t: 's', dt: Math.round(this.dayTime * 1000) / 1000,
        you: { x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, hp: Math.ceil(p.hp), mhp: p.maxHp, xp: p.xp, xpn: xpNeeded(p.level), lv: p.level, spd: p.spd || 1, al: p.alive ? 1 : 0, sc: p.score, seq: p.seq, dl: Math.round(p.dashLeft * 1000) / 1000, dc: Math.round(p.dashCd * 1000) / 1000, ep: p.epoch, hc: p.healCd > this.time ? Math.round((p.healCd - this.time) * 10) / 10 : 0, dd: p.dashLeft > 0 ? [Math.round(p.dashDx * 1000) / 1000, Math.round(p.dashDy * 1000) / 1000] : 0, b: bl },
        p: pl, m: ml, pr, d: dr, ev, ...(st ? { st } : {}),
      };
      if (evCenter && !isl && dist(p.x, p.y, evCenter.cx, evCenter.cy) < 3000) out.evt = [evCenter.def.name, evCenter.progress, evCenter.def.goal, Math.max(0, Math.round(evCenter.until - this.time)), evCenter.def.color];
      this.send(p, out);
    }
    this.events.length = 0;
  }
}
module.exports = Game;
