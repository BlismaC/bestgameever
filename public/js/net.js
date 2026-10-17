import { S } from './state.js';
import * as ui from './ui.js';
import * as FX from './fx.js';
import * as A from './assets.js';
import { pushSample } from './interp.js';
import { buildGrid } from './world.js';
import { reconcile } from './sim.js';

export function send(o) { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(o)); }
export function token() { let t = localStorage.getItem('rf_token'); if (!t || t.length < 16) { const a = new Uint8Array(16); crypto.getRandomValues(a); t = [...a].map((b) => b.toString(16).padStart(2, '0')).join(''); localStorage.setItem('rf_token', t); } return t; }

export async function connect(name, look, onFail) {
  try {
    S.content = await (await fetch('/api/content')).json();
    S.world = await (await fetch('/api/world')).json();
    await A.load();
  } catch (e) { onFail('Could not load game data.'); return; }
  S.look = look;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  S.ws = ws;
  ws.onopen = () => send({ t: 'join', name, look, token: token() });
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  ws.onclose = () => { if (S.joined) { ui.chat('Disconnected from server. Reload the page.', true); } else onFail('Connection failed.'); S.joined = false; };
  setInterval(() => send({ t: 'ping', n: performance.now() }), 2000);
}

function handle(m) {
  switch (m.t) {
    case 'full': ui.menuMsg('Server is full, try again soon.'); break;
    case 'init': {
      S.id = m.id; S.acc = m.acc; S.cfg = m.cfg; S.size = m.size; S.gameName = m.name; S.persistent = m.persistent;
      S.interpDelay = (1000 / m.cfg.tick) * 2.3;
      S.gen = window.WorldGen.create(S.world.seed, m.size);
      S.rtypes = S.world.rt;
      S.res = S.world.rs.map(([ti, x, y], i) => ({ id: i, type: S.world.rt[ti], x, y, alive: true }));
      for (const id of m.dep) S.res[id].alive = false;
      buildGrid();
      S.structs = new Map(); S.npcs = m.npcs.map(([id, x, y]) => ({ ...S.content.npcs.find((n) => n.id === id), x, y }));
      S.me = { x: 0, y: 0, hp: 100, mhp: 100, spd: 1, dashLeft: 0, dashCd: 0, dashDx: 0, dashDy: 0, off: { x: 0, y: 0 }, init: false, ep: 0, nextAtk: 0, nextPlace: 0, sp: 0, ph: 0, flash: 0, face: 1, vx: 0, vy: 0 };
      S.joined = true; S.dead = false;
      ui.start();
      break;
    }
    case 's': snapshot(m); break;
    case 'inv': S.inv = m.inv; S.sel = m.sel; S.coins = m.inv.reduce((a, s) => a + (s && s[0] === 'coin' ? s[1] : 0), 0); ui.invChanged(); break;
    case 'coins': S.coins = m.c; ui.coinsChanged(); break;
    case 'chat': ui.chat(m.sys ? m.m : null, !!m.sys, m.from, m.m); break;
    case 'rs': { const r = S.res[m.id]; if (r) { r.alive = !!m.alive; if (!m.alive) { const d = S.content.nodes[r.type]; FX.chips(r.x, r.y, d.c2 || d.c, 12); } } break; }
    case 'lb': S.lb = m.top; ui.leaderboard(); break;
    case 'dead': S.dead = true; FX.shake.m = 16; ui.dead(m.by, m['in']); break;
    case 'spawn': S.dead = false; S.me.init = false; S.cam.init = false; ui.respawn(); break;
    case 'pong': S.ping = Math.round(performance.now() - m.n); break;
    case 'room': S.room = m; S.structs = new Map(); S.drops = []; S.mobs.clear(); S.projs.clear(); S.players.clear(); ui.roomChanged(); break;
    case 'tp': S.tp = m.d ? performance.now() + m.d * 1000 : 0; S.tpTotal = m.d; break;
    case 'invite': ui.inviteToast(m); break;
    case 'banner': ui.banner(m.text, m.color); break;
    case 'chest': ui.chestOpen(m); break;
    case 'chest_close': ui.chestClose(); break;
    case 'npc': ui.npcOpen(m); break;
    case 'reforged': ui.reforged(m.i); break;
  }
}

function sync(map, seen, id, make) {
  let e = map.get(id); if (!e) { e = make(); e.buf = []; e.ph = 0; e.sp = 0; e.flash = 0; map.set(id, e); }
  e.goneAt = 0; seen.add(id); return e;
}
function markGone(map, seen) { for (const [id, e] of map) if (!seen.has(id) && !e.goneAt) e.goneAt = performance.now(); }
const setStruct = (a) => { S.structs.set(a[0], { id: a[0], type: a[1], x: a[2], y: a[3], hp: a[4], max: a[5], owner: a[6] }); };

function snapshot(m) {
  S.dayTime = m.dt; S.srv = m.you;
  const me = S.me, y = m.you;
  if (y.hp < me.hp - 0.5) me.flash = 1;
  me.hp = y.hp; me.mhp = y.mhp; me.xp = y.xp; me.xpn = y.xpn; me.lv = y.lv; me.sc = y.sc;
  reconcile(y);
  S.buffs = y.b; S.healCd = y.hc; if (y.hc > S.healCdMax) S.healCdMax = y.hc; if (!y.hc) S.healCdMax = 1;
  S.evt = m.evt || null;
  if (S.dead && y.al) S.dead = false;

  const sp = new Set();
  for (const a of m.p) {
    const e = sync(S.players, sp, a[0], () => ({ id: a[0], x: a[1], y: a[2], angle: a[3], face: 1 }));
    if (a[4] < e.hp - 0.5) e.flash = 1;
    e.hp = a[4]; e.mhp = a[5]; e.name = a[6]; e.held = a[7]; e.lv = a[8]; e.fl = a[9]; e.dash = a[10]; e.look = { s: a[11][0], h: a[11][1], c: a[11][2], p: a[11][3], st: a[11][4] };
    pushSample(e, a[1], a[2], a[3]);
  }
  markGone(S.players, sp);
  const sm = new Set();
  for (const a of m.m) {
    const e = sync(S.mobs, sm, a[0], () => ({ id: a[0], type: a[1], x: a[2], y: a[3], angle: a[4], hp: a[5], face: 1 }));
    if (a[5] < e.hp - 0.5) e.flash = 1;
    e.hp = a[5]; e.mhp = a[6]; e.fl = a[7]; e.phase = a[8]; e.air = a[9] / 10;
    pushSample(e, a[2], a[3], a[4]);
  }
  markGone(S.mobs, sm);
  const spr = new Set();
  for (const a of m.pr) {
    const e = sync(S.projs, spr, a[0], () => ({ id: a[0], x: a[1], y: a[2], angle: 0 }));
    e.r = a[3]; e.color = a[4]; e.hostile = a[5]; e.kind = a[6];
    const last = e.buf[e.buf.length - 1], moved = last && (a[1] !== last.x || a[2] !== last.y);
    pushSample(e, a[1], a[2], moved ? Math.atan2(a[2] - last.y, a[1] - last.x) : (last ? last.a : 0));
  }
  markGone(S.projs, spr);
  S.drops = m.d;
  if (m.st) { const seen = new Set(); for (const a of m.st) { setStruct(a); seen.add(a[0]); } for (const id of S.structs.keys()) if (!seen.has(id)) S.structs.delete(id); }

  for (const e of m.ev) {
    switch (e.e) {
      case 'dmg':
        S.fx.push({ k: 'dmg', x: e.x, y: e.y, v: e.v, t: 0, me: e.me === S.id, crit: e.c, rx: (Math.random() - 0.5) * 24 });
        FX.sparks(e.x, e.y + 20, e.me === S.id ? '#ff5a5a' : (e.c ? '#ffb02e' : '#ffe27a'), e.c ? 10 : 6);
        if (e.me === S.id) FX.shake.m = Math.max(FX.shake.m, Math.min(14, 4 + e.v * 0.15));
        break;
      case 'swing': if (e.id !== S.id) S.swings.set(e.id, { a: e.a, r: e.r, arc: e.arc, t: 0 }); break;
      case 'hit': { S.resHit.set(e.id, { t: 0, hp: e.hp, max: e.max }); const r = S.res[e.id]; if (r) { const d = S.content.nodes[r.type]; FX.chips(e.x, e.y, d.c2 || d.c, 4); if (d.s === 'tree') FX.leaves(e.x, e.y - 30, d.c); } break; }
      case 'boom': { FX.boom(e.x, e.y, e.r); const d = Math.hypot(e.x - S.me.x, e.y - S.me.y); if (d < 700) FX.shake.m = Math.max(FX.shake.m, Math.min(16, e.r / 10) * (1 - d / 700)); break; }
      case 'ring': S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r, d: e.d, t: 0 }); break;
      case 'pick': FX.sparkle(e.x, e.y); break;
      case 'heal': FX.pluses(e.x, e.y); S.fx.push({ k: 'heal', x: e.x, y: e.y, v: e.v, t: 0 }); break;
      case 'parry': FX.sparks(e.x, e.y, e.c || '#fff', 9); S.fx.push({ k: 'clang', x: e.x, y: e.y, t: 0 }); break;
      case 'land': FX.dust(e.x, e.y + 10, 2.4); FX.dust(e.x + 10, e.y + 6, 2); FX.shake.m = Math.max(FX.shake.m, 2); break;
      case 'tele': S.tele.push({ ...e, t: 0 }); break;
      case 'sadd': setStruct(e.s); FX.dust(e.x, e.y, 2); FX.dust(e.x + 8, e.y + 4, 2); break;
      case 'sdel': { const s = S.structs.get(e.id); S.structs.delete(e.id); const d = s && S.content.structures[s.type]; FX.chips(e.x, e.y, d ? d.c : '#aaa', 12); FX.dust(e.x, e.y, 2); break; }
      case 'shit': { const s = S.structs.get(e.id); if (s) { s.hp = e.hp; s.max = e.max; } S.structHit.set(e.id, { t: 0 }); const d = s && S.content.structures[s.type]; FX.chips(e.x, e.y, d ? d.c : '#aaa', 3); break; }
      case 'trap': FX.sparks(e.x, e.y, '#ffffff', 14); FX.shake.m = Math.max(FX.shake.m, 3); break;
    }
  }
}
