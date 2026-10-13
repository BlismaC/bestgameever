'use strict';
// The authoritative game simulation. One instance = one world.
const C = require('./config');
const content = require('./content');
const World = require('./world');
const easter = require('./easter');
const runCommand = require('./commands');

let NID = 1;
const nid = () => NID++;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rd = (n) => Math.round(n);
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

class Game {
  constructor() {
    this.world = new World(C.SEED);
    this.size = C.WORLD_SIZE;
    this.time = 0;
    this.dayTime = 0.25; // 0.25 = noon
    this.players = new Map();
    this.mobs = new Map();
    this.projectiles = [];
    this.drops = new Map();
    this.events = [];
    this.nextBossAt = C.BOSS_INTERVAL;
    this.spawnTimer = 0; this.despawnTimer = 0; this.lbTimer = 0; this.resTimer = 0;
    this.resPendingEvents = [];
  }

  isNight() { return Math.cos(2 * Math.PI * (this.dayTime - 0.25)) < -0.2; }
  inSafe(x, y) { return dist(x, y, this.size / 2, this.size / 2) < C.SAFE_RADIUS; }

  // ------------------------------------------------------------ players
  addPlayer(ws, rawName) {
    const name = String(rawName || '').replace(/[^\w \-\.!?]/g, '').trim().slice(0, 16) || 'Wanderer';
    const P = C.PLAYER;
    const p = {
      id: nid(), ws, name, title: '', x: 0, y: 0, angle: 0, in: { u: 0, d: 0, l: 0, r: 0 }, atk: false,
      hp: P.hp, maxHp: P.hp, level: 1, xp: 0, score: 0, kills: 0,
      inv: new Array(P.invSize).fill(null), sel: 0, nextAtk: 0, dashUntil: 0, dashReady: 0, dashDx: 0, dashDy: 0,
      fx: {}, buffs: {}, alive: true, respawnAt: 0, lastHurt: 0, invuln: 0, joined: true, msgCount: 0, lastChat: -10,
    };
    this.players.set(p.id, p);
    this.addItem(p, 'wood_sword', 1); this.addItem(p, 'wood_pickaxe', 1); this.addItem(p, 'wood_axe', 1); this.addItem(p, 'apple', 3);
    this.spawnPlayer(p);
    this.send(p, {
      t: 'init', id: p.id, seed: C.SEED, size: this.size, name: C.GAME_NAME,
      cfg: { speed: P.speed, dashSpeed: P.dashSpeed, dashTime: P.dashTime, dashCooldown: P.dashCooldown, radius: P.radius, hotbar: P.hotbar, invSize: P.invSize, safe: C.SAFE_RADIUS, view: C.VIEW_RADIUS },
      rt: this.world.nodeTypes, rs: this.world.res.map((r) => [this.world.nodeTypes.indexOf(r.type), r.x, r.y]),
      dep: this.world.res.filter((r) => !r.alive).map((r) => r.id),
    });
    this.sendInv(p);
    this.broadcast({ t: 'chat', sys: 1, m: `${p.name} joined the realm.` });
    easter.onJoin(this, p);
    return p;
  }
  removePlayer(p) {
    this.players.delete(p.id);
    this.broadcast({ t: 'chat', sys: 1, m: `${p.name} left.` });
  }
  spawnPlayer(p) {
    const a = Math.random() * Math.PI * 2, r = rand(0, 200);
    p.x = this.size / 2 + Math.cos(a) * r; p.y = this.size / 2 + Math.sin(a) * r;
    p.hp = p.maxHp; p.alive = true; p.fx = {}; p.invuln = this.time + 2;
  }
  send(p, obj) {
    const ws = p.ws;
    if (!ws || ws.readyState !== 1 || ws.bufferedAmount > 1e6) return;
    try { ws.send(JSON.stringify(obj)); } catch (e) { /* closed */ }
  }
  broadcast(obj) { const s = JSON.stringify(obj); for (const p of this.players.values()) if (p.ws && p.ws.readyState === 1) { try { p.ws.send(s); } catch (e) {} } }
  sys(p, m) { this.send(p, { t: 'chat', sys: 1, m }); }
  sendInv(p) { this.send(p, { t: 'inv', inv: p.inv.map((s) => (s ? [s.id, s.count] : 0)), sel: p.sel }); }

  handle(p, m) {
    switch (m.t) {
      case 'in':
        if (m.k) { p.in.u = m.k.u ? 1 : 0; p.in.d = m.k.d ? 1 : 0; p.in.l = m.k.l ? 1 : 0; p.in.r = m.k.r ? 1 : 0; }
        if (typeof m.a === 'number' && isFinite(m.a)) p.angle = m.a;
        p.atk = !!m.atk; break;
      case 'sel': { const i = m.i | 0; if (i >= 0 && i < C.PLAYER.hotbar) { p.sel = i; this.sendInv(p); } break; }
      case 'use': this.useItem(p); break;
      case 'craft': this.craft(p, String(m.id)); break;
      case 'swap': { const a = m.a | 0, b = m.b | 0, n = p.inv.length; if (a >= 0 && b >= 0 && a < n && b < n) { const t = p.inv[a]; p.inv[a] = p.inv[b]; p.inv[b] = t; this.sendInv(p); } break; }
      case 'drop': { const i = m.i | 0; const s = p.inv[i]; if (s) { this.spawnDrop(s.id, s.count, p.x + Math.cos(p.angle) * 50, p.y + Math.sin(p.angle) * 50, 1.5); p.inv[i] = null; this.sendInv(p); } break; }
      case 'dash': this.dash(p); break;
      case 'chat': this.chat(p, String(m.m || '')); break;
      case 'ping': this.send(p, { t: 'pong', n: m.n }); break;
    }
  }
  chat(p, msg) {
    msg = msg.replace(/[\u0000-\u001f]/g, '').trim().slice(0, C.CHAT_MAX);
    if (!msg || this.time - p.lastChat < 0.4) return;
    p.lastChat = this.time;
    if (easter.onChat(this, p, msg)) return;
    if (msg[0] === '/') { if (!runCommand(this, p, msg)) this.sys(p, 'Unknown command. /help'); return; }
    this.broadcast({ t: 'chat', from: (p.title ? p.title + ' ' : '') + p.name, m: msg });
  }
  dash(p) {
    if (!p.alive || this.time < p.dashReady) return;
    let dx = p.in.r - p.in.l, dy = p.in.d - p.in.u;
    const l = Math.hypot(dx, dy);
    if (l) { dx /= l; dy /= l; } else { dx = Math.cos(p.angle); dy = Math.sin(p.angle); }
    p.dashDx = dx; p.dashDy = dy; p.dashUntil = this.time + C.PLAYER.dashTime; p.dashReady = this.time + C.PLAYER.dashCooldown;
  }

  // ------------------------------------------------------------ inventory
  addItem(p, id, count) {
    const def = content.items[id]; if (!def) return count;
    const max = def.stack || 99; let left = count;
    for (const s of p.inv) { if (left <= 0) break; if (s && s.id === id && s.count < max) { const n = Math.min(max - s.count, left); s.count += n; left -= n; } }
    for (let i = 0; i < p.inv.length && left > 0; i++) { if (!p.inv[i]) { const n = Math.min(max, left); p.inv[i] = { id, count: n }; left -= n; } }
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
  craft(p, id) {
    const r = content.recipes[id]; if (!r || !p.alive) return;
    for (const [k, n] of Object.entries(r.cost)) if (this.countItem(p, k) < n) { this.sys(p, 'Missing materials.'); return; }
    for (const [k, n] of Object.entries(r.cost)) this.removeItem(p, k, n);
    const left = this.addItem(p, r.out, r.count);
    if (left > 0) this.spawnDrop(r.out, left, p.x, p.y);
    this.sendInv(p);
  }
  useItem(p) {
    const s = p.inv[p.sel]; if (!s || !p.alive) return;
    const def = content.items[s.id]; if (!def || !def.use) return;
    const u = def.use;
    if (u.summon) {
      const a = p.angle;
      if (!this.spawnMob(u.summon, p.x + Math.cos(a) * 500, p.y + Math.sin(a) * 500)) return;
      this.broadcast({ t: 'chat', sys: 1, m: `${p.name} summoned ${content.mobs[u.summon].name}!` });
    }
    if (u.heal) p.hp = Math.min(p.maxHp, p.hp + u.heal);
    if (u.buff) p.buffs.speed = { until: this.time + u.buff.dur, mult: u.buff.speed };
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

  // ------------------------------------------------------------ drops
  spawnDrop(item, count, x, y, delay = 0.4) {
    if (!content.items[item] || count <= 0) return;
    const d = { id: nid(), item, count, x: x + rand(-18, 18), y: y + rand(-18, 18), at: this.time + delay, expires: this.time + 120 };
    this.drops.set(d.id, d);
  }
  rollDrops(table, x, y, mul = 1) {
    for (const e of table || []) {
      if (Math.random() > (e.chance === undefined ? 1 : e.chance)) continue;
      if (e.roll === 'weapon') { const w = content.randomWeapon(e.tier[0], e.tier[1], e.mods); if (w) this.spawnDrop(w, 1, x, y); }
      else { const n = randi(e.min === undefined ? 1 : e.min, e.max === undefined ? 1 : e.max) * mul; if (n > 0) this.spawnDrop(e.item, n, x, y); }
    }
  }

  // ------------------------------------------------------------ mobs
  spawnMob(type, x, y, opts = {}) {
    const def = content.mobs[type]; if (!def) return null;
    x = Math.max(60, Math.min(this.size - 60, x)); y = Math.max(60, Math.min(this.size - 60, y));
    const m = {
      id: nid(), type, def, x, y, angle: Math.random() * 6.28, hp: def.hp, maxHp: def.hp, r: def.radius, fx: {},
      nextAtk: 0, wanderUntil: 0, wa: 0, kvx: 0, kvy: 0, fleeUntil: 0, fleeFrom: null, lastHit: 0,
      boss: !!def.boss, pat: (def.patterns || []).map(() => this.time + rand(2, 4)), phase: 0, shiny: false, dmgMul: 1, dropMul: 1, idle: 0,
    };
    if (!def.boss && !opts.noShiny && Math.random() < C.SHINY_CHANCE) { m.shiny = true; m.maxHp = m.hp = def.hp * 2; m.dmgMul = 1.5; m.dropMul = 3; }
    this.mobs.set(m.id, m);
    return m;
  }
  nearestPlayer(x, y, range, ignoreSafe = true) {
    let best = null, bd = range;
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      if (ignoreSafe && this.inSafe(p.x, p.y)) continue;
      const d = dist(x, y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  killMob(m) {
    this.mobs.delete(m.id);
    this.rollDrops(m.def.drops, m.x, m.y, m.dropMul);
    const killer = this.players.get(m.lastHit);
    if (killer) {
      this.giveXp(killer, Math.round((m.def.xp || 5) * (m.shiny ? 3 : 1))); killer.kills++;
      easter.onKill(this, killer, m);
      if (m.shiny) this.sys(killer, '✨ You slew a shiny ' + m.def.name + '!');
    }
    if (m.boss) this.broadcast({ t: 'chat', sys: 1, m: `☠ ${m.def.name} was defeated${killer ? ' by ' + killer.name : ''}!` });
    this.events.push({ e: 'boom', x: rd(m.x), y: rd(m.y), r: m.r });
  }
  hurtMob(m, amount, p, knockAng, knock) {
    if (m.hp <= 0) return;
    m.hp -= amount; if (p) m.lastHit = p.id;
    this.events.push({ e: 'dmg', x: rd(m.x), y: rd(m.y - m.r), v: Math.round(amount) });
    if (knock) { const k = m.boss ? knock * 0.08 : knock; m.kvx += Math.cos(knockAng) * k; m.kvy += Math.sin(knockAng) * k; }
    if (m.def.behavior === 'passive' && p) { m.fleeUntil = this.time + 3; m.fleeFrom = p; }
    if (m.hp <= 0) this.killMob(m);
  }
  hurtPlayer(p, amount, srcName, fx) {
    if (!p.alive || this.time < p.invuln || this.inSafe(p.x, p.y)) return;
    p.hp -= amount; p.lastHurt = this.time;
    this.events.push({ e: 'dmg', x: rd(p.x), y: rd(p.y - 30), v: Math.round(amount), me: p.id });
    if (fx) this.applyFx(p, fx);
    if (p.hp <= 0) this.killPlayer(p, srcName);
  }
  killPlayer(p, by) {
    p.alive = false; p.hp = 0; p.respawnAt = this.time + C.RESPAWN_TIME; p.atk = false;
    this.send(p, { t: 'dead', by: by || 'the world', in: C.RESPAWN_TIME });
    this.broadcast({ t: 'chat', sys: 1, m: `${p.name} was slain by ${by || 'the world'}.` });
    this.events.push({ e: 'boom', x: rd(p.x), y: rd(p.y), r: 30 });
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
        if (isPlayer) { if (!this.inSafe(e.x, e.y)) { e.hp -= amt; if (e.hp <= 0 && e.alive) this.killPlayer(e, k === 'burn' ? 'burning' : 'poison'); } }
        else { e.hp -= amt; if (srcPlayerId) e.lastHit = srcPlayerId; if (e.hp <= 0) this.killMob(e); }
      }
    }
  }
  slowMult(e) { return e.fx.slow ? e.fx.slow.mult : 1; }

  // ------------------------------------------------------------ combat
  weaponOf(p) {
    const s = p.inv[p.sel]; const def = s && content.items[s.id];
    return def && def.weapon ? def.weapon : content.HAND;
  }
  attack(p) {
    const w = this.weaponOf(p);
    p.nextAtk = this.time + w.cooldown;
    const lvMul = 1 + (p.level - 1) * 0.04;
    const dmg = w.dmg * lvMul;
    const a = p.angle;
    this.events.push({ e: 'swing', id: p.id, a: Math.round(a * 100) / 100, r: w.melee ? w.melee.range : 0, arc: w.melee ? w.melee.arc : 0, x: rd(p.x), y: rd(p.y) });
    if (w.melee) this.meleeHit(p, w, dmg, a);
    if (w.projectile) {
      const pr = w.projectile, n = pr.count || 1;
      for (let i = 0; i < n; i++) {
        const off = n > 1 ? (i / (n - 1) - 0.5) * pr.spread : (Math.random() - 0.5) * pr.spread;
        this.shoot('p', p.id, p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30, a + off, pr, dmg, w.fx, p.name);
      }
    }
  }
  meleeHit(p, w, dmg, a) {
    const m = w.melee, half = (m.arc * Math.PI / 180) / 2;
    const inArc = (tx, ty, tr) => {
      const d = dist(p.x, p.y, tx, ty); if (d - tr > m.range) return false;
      if (d < tr + 10) return true;
      return angDiff(Math.atan2(ty - p.y, tx - p.x), a) <= half + Math.atan2(tr, d);
    };
    const crit = () => (Math.random() < 0.1 ? 1.5 : 1);
    for (const mob of this.mobs.values()) {
      if (inArc(mob.x, mob.y, mob.r)) {
        const dd = dmg * crit(); this.hurtMob(mob, dd, p, a, m.knock);
        if (w.fx) { this.applyFx(mob, w.fx); mob.lastHit = p.id; if (w.fx.lifesteal) p.hp = Math.min(p.maxHp, p.hp + dd * w.fx.lifesteal); }
      }
    }
    if (C.PVP) for (const o of this.players.values()) {
      if (o === p || !o.alive || this.inSafe(o.x, o.y) || this.inSafe(p.x, p.y)) continue;
      if (inArc(o.x, o.y, C.PLAYER.radius)) {
        const dd = dmg * crit(); this.hurtPlayer(o, dd, p.name, w.fx);
        if (!o.alive) { p.kills++; this.giveXp(p, 20 + o.level * 10); }
        if (w.fx && w.fx.lifesteal) p.hp = Math.min(p.maxHp, p.hp + dd * w.fx.lifesteal);
      }
    }
    // resource nodes
    this.world.near(p.x, p.y, m.range + 60, (r) => {
      if (!r.alive || !inArc(r.x, r.y, r.r)) return;
      this.gather(p, w, r);
    });
  }
  gather(p, w, r) {
    const def = content.nodes[r.type];
    const mult = w.gather[def.kind] !== undefined ? w.gather[def.kind] : 0.3;
    const power = Math.max(1, w.dmg * mult);
    r.hp -= power;
    this.events.push({ e: 'hit', id: r.id, hp: Math.max(0, Math.round(r.hp)), max: r.maxHp, x: rd(r.x), y: rd(r.y) });
    if (w.toolTier >= def.tierReq) {
      const bonus = mult >= 2 ? 2 : 1;
      for (const d of def.drops) {
        if (Math.random() > (d.chance === undefined ? 1 : d.chance)) continue;
        const left = this.addItem(p, d.item, randi(d.min, d.max) * bonus);
        if (left > 0) this.spawnDrop(d.item, left, p.x, p.y);
      }
    } else if (Math.random() < 0.15) this.sys(p, `Your tool is too weak for ${def.name} (needs tier ${def.tierReq}).`);
    if (r.hp <= 0) {
      r.alive = false; r.respawnAt = this.time + def.respawn;
      this.resPendingEvents.push({ t: 'rs', id: r.id, alive: 0 });
      if (w.toolTier >= def.tierReq) for (const d of def.drops) this.spawnDrop(d.item, randi(d.min, d.max) * 2, r.x, r.y, 0.2);
      this.giveXp(p, 2 + def.tierReq * 3);
    }
  }
  shoot(owner, ownerId, x, y, ang, pr, dmg, fx, srcName) {
    this.projectiles.push({
      id: nid(), owner, ownerId, x, y, vx: Math.cos(ang) * pr.speed, vy: Math.sin(ang) * pr.speed, r: pr.radius,
      dmg, life: pr.life, color: pr.color || '#fff', pierce: pr.pierce || 0, explode: pr.explode || 0, fx: fx || null, hit: new Set(), src: srcName || '',
    });
  }
  explode(pj, x, y) {
    const R = pj.explode; this.events.push({ e: 'boom', x: rd(x), y: rd(y), r: R });
    const owner = pj.owner === 'p' ? this.players.get(pj.ownerId) : null;
    if (pj.owner === 'p') {
      for (const m of this.mobs.values()) if (dist(m.x, m.y, x, y) < R + m.r) this.hurtMob(m, pj.dmg * 0.8, owner, Math.atan2(m.y - y, m.x - x), 200);
      if (C.PVP) for (const o of this.players.values()) if (o.id !== pj.ownerId && o.alive && dist(o.x, o.y, x, y) < R + 20) this.hurtPlayer(o, pj.dmg * 0.6, pj.src);
    } else for (const o of this.players.values()) if (o.alive && dist(o.x, o.y, x, y) < R + 20) this.hurtPlayer(o, pj.dmg * 0.8, pj.src, pj.fx);
  }
  updateProjectiles(dt) {
    const out = [];
    for (const pj of this.projectiles) {
      pj.x += pj.vx * dt; pj.y += pj.vy * dt; pj.life -= dt;
      let dead = pj.life <= 0 || pj.x < 0 || pj.y < 0 || pj.x > this.size || pj.y > this.size;
      if (!dead) {
        if (pj.owner === 'p') {
          const owner = this.players.get(pj.ownerId);
          for (const m of this.mobs.values()) {
            if (pj.hit.has(m.id) || dist(pj.x, pj.y, m.x, m.y) > m.r + pj.r) continue;
            pj.hit.add(m.id);
            if (!pj.explode) {
              this.hurtMob(m, pj.dmg, owner, Math.atan2(pj.vy, pj.vx), 80);
              if (pj.fx) { this.applyFx(m, pj.fx); if (owner && pj.fx.lifesteal) owner.hp = Math.min(owner.maxHp, owner.hp + pj.dmg * pj.fx.lifesteal); }
            }
            if (pj.pierce-- <= 0) { dead = true; break; }
          }
          if (!dead && C.PVP) for (const o of this.players.values()) {
            if (o.id === pj.ownerId || !o.alive || pj.hit.has(o.id) || this.inSafe(o.x, o.y) || dist(pj.x, pj.y, o.x, o.y) > C.PLAYER.radius + pj.r) continue;
            pj.hit.add(o.id);
            if (!pj.explode) { this.hurtPlayer(o, pj.dmg, pj.src, pj.fx); if (!o.alive && owner) { owner.kills++; this.giveXp(owner, 20 + o.level * 10); } }
            if (pj.pierce-- <= 0) { dead = true; break; }
          }
        } else {
          for (const o of this.players.values()) {
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
    this.tickFx(m, dt, false, m.lastHit); if (!this.mobs.has(m.id)) return;
    const slow = this.slowMult(m);
    // knockback decay
    if (m.kvx || m.kvy) { m.x += m.kvx * dt; m.y += m.kvy * dt; const k = Math.max(0, 1 - dt * 7); m.kvx *= k; m.kvy *= k; if (Math.abs(m.kvx) + Math.abs(m.kvy) < 5) m.kvx = m.kvy = 0; }
    if (m.boss) this.updateBoss(m, dt, slow);
    else {
      let target = null;
      if (d.behavior !== 'passive') target = this.nearestPlayer(m.x, m.y, d.aggro || 400);
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
  }
  updateBoss(m, dt, slow) {
    const d = m.def, t = this.time;
    const target = this.nearestPlayer(m.x, m.y, 1800);
    // phase
    const frac = m.hp / m.maxHp; let ph = 0; for (const th of d.phases || []) if (frac <= th) ph++;
    if (ph > m.phase) { m.phase = ph; this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${d.name} enters phase ${ph + 1}!` }); }
    if (!target) { m.idle += dt; if (m.idle > 90) this.mobs.delete(m.id); m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.02 * dt); return; }
    m.idle = 0;
    const ang = Math.atan2(target.y - m.y, target.x - m.x), dd = dist(m.x, m.y, target.x, target.y);
    m.angle = ang;
    const spdMul = (1 + 0.15 * m.phase) * slow;
    if (m.chargeUntil > t) { m.x += Math.cos(m.chargeAng) * d.speed * m.chargeMul * dt; m.y += Math.sin(m.chargeAng) * d.speed * m.chargeMul * dt; }
    else if (dd > m.r + 40) { m.x += Math.cos(ang) * d.speed * spdMul * dt; m.y += Math.sin(ang) * d.speed * spdMul * dt; }
    for (const p of this.players.values()) if (p.alive && dist(m.x, m.y, p.x, p.y) < m.r + C.PLAYER.radius + 8 && t >= m.nextAtk) { m.nextAtk = t + 0.8; this.hurtPlayer(p, d.dmg, d.name); }
    (d.patterns || []).forEach((pat, i) => {
      if (t < m.pat[i]) return;
      m.pat[i] = t + pat.cd * (1 - 0.15 * m.phase) * rand(0.9, 1.1);
      this.runPattern(m, pat, target, ang);
    });
    if (m.spiral && t < m.spiral.until && t >= m.spiral.next) {
      const sp = m.spiral.pat; m.spiral.next = t + 0.09; m.spiral.a += 0.45;
      for (let i = 0; i < (sp.count || 2); i++) this.shoot('m', m.id, m.x, m.y, m.spiral.a + (i * Math.PI * 2) / (sp.count || 2), sp, sp.dmg, sp.fx, d.name);
    }
    if (m.slam && t >= m.slam.at) {
      const s = m.slam; m.slam = null;
      this.events.push({ e: 'boom', x: rd(s.x), y: rd(s.y), r: s.r });
      for (const p of this.players.values()) if (p.alive && dist(p.x, p.y, s.x, s.y) < s.r) this.hurtPlayer(p, s.dmg, d.name);
    }
  }
  runPattern(m, pat, target, ang) {
    const d = m.def;
    switch (pat.type) {
      case 'charge': m.chargeUntil = this.time + pat.dur; m.chargeAng = ang; m.chargeMul = pat.speed; break;
      case 'aim': { const n = pat.count || 1; for (let i = 0; i < n; i++) { const off = n > 1 ? (i / (n - 1) - 0.5) * pat.spread : 0; this.shoot('m', m.id, m.x, m.y, ang + off, pat, pat.dmg, pat.fx, d.name); } break; }
      case 'burst': { const n = pat.count || 12, base = Math.random() * 6.28; for (let i = 0; i < n; i++) this.shoot('m', m.id, m.x, m.y, base + (i / n) * Math.PI * 2, pat, pat.dmg, pat.fx, d.name); break; }
      case 'spiral': m.spiral = { until: this.time + pat.dur, next: this.time, a: Math.random() * 6.28, pat }; break;
      case 'summon': {
        let minions = 0; for (const o of this.mobs.values()) if (!o.boss && o.minionOf === m.id) minions++;
        if (minions > 10) break;
        for (let i = 0; i < pat.n; i++) { const s = this.spawnMob(pat.mob, m.x + rand(-160, 160), m.y + rand(-160, 160), { noShiny: true }); if (s) s.minionOf = m.id; }
        break;
      }
      case 'slam': m.slam = { at: this.time + (pat.delay || 1), x: target.x, y: target.y, r: pat.radius, dmg: pat.dmg }; this.events.push({ e: 'ring', x: rd(target.x), y: rd(target.y), r: pat.radius, d: pat.delay || 1 }); break;
    }
  }

  // ------------------------------------------------------------ spawning
  runSpawner(dt) {
    this.spawnTimer -= dt; this.despawnTimer -= dt;
    const night = this.isNight();
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1;
      if (this.mobs.size < C.MOB_CAP) for (const p of this.players.values()) {
        if (!p.alive) continue;
        let near = 0; for (const m of this.mobs.values()) if (!m.boss && dist(m.x, m.y, p.x, p.y) < 1500) near++;
        if (near >= C.MOBS_PER_PLAYER + (night ? 6 : 0)) continue;
        const a = Math.random() * 6.28, r = rand(700, 1100);
        const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
        if (x < 60 || y < 60 || x > this.size - 60 || y > this.size - 60) continue;
        const biome = content.biomes[this.world.biomeAt(x, y)];
        const type = pickWeighted(biome.mobs, (k) => { const w = content.mobs[k].when || 'any'; if (w === 'night' && !night) return false; if (w === 'day' && night) return false; return true; });
        if (!type) continue;
        if (content.mobs[type].behavior !== 'passive' && this.inSafe(x, y)) continue;
        this.spawnMob(type, x, y);
      }
    }
    if (this.despawnTimer <= 0) {
      this.despawnTimer = 2;
      for (const m of this.mobs.values()) {
        if (m.boss) continue;
        let close = false; for (const p of this.players.values()) if (dist(m.x, m.y, p.x, p.y) < 2200) { close = true; break; }
        if (!close) this.mobs.delete(m.id);
      }
    }
    // natural boss director
    if (this.time >= this.nextBossAt) {
      this.nextBossAt = this.time + C.BOSS_INTERVAL;
      const alive = [...this.players.values()].filter((p) => p.alive && !this.inSafe(p.x, p.y));
      let bossCount = 0; for (const m of this.mobs.values()) if (m.boss) bossCount++;
      if (alive.length && bossCount < 2) {
        const p = alive[Math.floor(Math.random() * alive.length)];
        const biome = content.biomes[this.world.biomeAt(p.x, p.y)];
        const pool = (biome.bosses || []).filter((id) => content.mobs[id].natural !== false && (content.mobs[id].when !== 'night' || night));
        if (night && Math.random() < 0.4) pool.push('lich_king');
        if (pool.length) {
          const id = pool[Math.floor(Math.random() * pool.length)], a = Math.random() * 6.28;
          if (this.spawnMob(id, p.x + Math.cos(a) * 800, p.y + Math.sin(a) * 800)) this.broadcast({ t: 'chat', sys: 1, m: `⚠ ${content.mobs[id].name} has awakened near ${p.name}!` });
        }
      }
    }
  }

  // ------------------------------------------------------------ main tick
  tick(dt) {
    this.time += dt;
    this.dayTime = (this.dayTime + dt / C.DAY_LENGTH) % 1;
    const P = C.PLAYER;
    for (const p of this.players.values()) {
      if (!p.alive) { if (this.time >= p.respawnAt) { this.spawnPlayer(p); this.send(p, { t: 'spawn' }); } continue; }
      this.tickFx(p, dt, true);
      if (!p.alive) continue;
      let mult = this.slowMult(p);
      if (p.buffs.speed) { if (this.time > p.buffs.speed.until) delete p.buffs.speed; else mult *= p.buffs.speed.mult; }
      p.spd = mult;
      let vx, vy;
      if (this.time < p.dashUntil) { vx = p.dashDx * P.dashSpeed; vy = p.dashDy * P.dashSpeed; }
      else {
        let dx = p.in.r - p.in.l, dy = p.in.d - p.in.u; const l = Math.hypot(dx, dy);
        if (l) { dx /= l; dy /= l; }
        vx = dx * P.speed * mult; vy = dy * P.speed * mult;
      }
      p.x += vx * dt; p.y += vy * dt;
      this.world.collide(p, P.radius);
      if (p.atk && this.time >= p.nextAtk) this.attack(p);
      if (this.time - p.lastHurt > P.regenDelay && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + P.regen * dt);
    }
    for (const m of [...this.mobs.values()]) this.updateMob(m, dt);
    this.updateProjectiles(dt);
    // drops
    for (const dr of this.drops.values()) {
      if (this.time > dr.expires) { this.drops.delete(dr.id); continue; }
      if (this.time < dr.at) continue;
      for (const p of this.players.values()) {
        if (!p.alive || dist(p.x, p.y, dr.x, dr.y) > P.pickupRadius) continue;
        const left = this.addItem(p, dr.item, dr.count);
        if (left < dr.count) { if (left <= 0) this.drops.delete(dr.id); else dr.count = left; this.events.push({ e: 'pick', x: rd(dr.x), y: rd(dr.y), item: dr.item }); break; }
      }
    }
    // resource respawn
    this.resTimer -= dt;
    if (this.resTimer <= 0) {
      this.resTimer = 1;
      for (const r of this.world.res) if (!r.alive && this.time >= r.respawnAt) { r.alive = true; r.hp = r.maxHp; this.resPendingEvents.push({ t: 'rs', id: r.id, alive: 1 }); }
    }
    if (this.resPendingEvents.length) { for (const e of this.resPendingEvents) this.broadcast(e); this.resPendingEvents.length = 0; }
    this.runSpawner(dt);
    this.lbTimer -= dt;
    if (this.lbTimer <= 0) {
      this.lbTimer = 2;
      const top = [...this.players.values()].sort((a, b) => b.score - a.score).slice(0, 8).map((p) => [p.name, p.score, p.level]);
      this.broadcast({ t: 'lb', top });
    }
    this.sendSnapshots();
  }

  fxFlags(e) { return (e.fx.burn ? 1 : 0) | (e.fx.poison ? 2 : 0) | (e.fx.slow ? 4 : 0); }
  sendSnapshots() {
    const R = C.VIEW_RADIUS, R2 = R * R;
    const inR = (x, y, px, py) => { const dx = x - px, dy = y - py; return dx * dx + dy * dy < R2; };
    for (const p of this.players.values()) {
      const pl = [], ml = [], pr = [], dr = [], ev = [];
      for (const o of this.players.values()) {
        if (o === p || !o.alive || !inR(o.x, o.y, p.x, p.y)) continue;
        const s = o.inv[o.sel];
        pl.push([o.id, rd(o.x), rd(o.y), Math.round(o.angle * 100) / 100, Math.ceil(o.hp), o.maxHp, (o.title ? o.title + ' ' : '') + o.name, s ? s.id : '', o.level, this.fxFlags(o), this.time < o.dashUntil ? 1 : 0]);
      }
      for (const m of this.mobs.values()) if (inR(m.x, m.y, p.x, p.y)) ml.push([m.id, m.type, rd(m.x), rd(m.y), Math.round(m.angle * 100) / 100, Math.ceil(m.hp), m.maxHp, this.fxFlags(m) | (m.shiny ? 8 : 0), m.phase]);
      for (const j of this.projectiles) if (inR(j.x, j.y, p.x, p.y)) pr.push([j.id, rd(j.x), rd(j.y), j.r, j.color, j.owner === 'm' ? 1 : 0]);
      for (const d of this.drops.values()) if (inR(d.x, d.y, p.x, p.y)) dr.push([d.id, d.item, d.count, rd(d.x), rd(d.y)]);
      for (const e of this.events) {
        if (e.x !== undefined && !inR(e.x, e.y, p.x, p.y)) continue;
        ev.push(e);
      }
      this.send(p, {
        t: 's', dt: Math.round(this.dayTime * 1000) / 1000,
        you: { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, hp: Math.ceil(p.hp), mhp: p.maxHp, xp: p.xp, xpn: xpNeeded(p.level), lv: p.level, spd: p.spd || 1, al: p.alive ? 1 : 0, sc: p.score },
        p: pl, m: ml, pr, d: dr, ev,
      });
    }
    this.events.length = 0;
  }
}
module.exports = Game;
