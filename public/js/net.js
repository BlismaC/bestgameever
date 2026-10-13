import { S } from './state.js';
import * as ui from './ui.js';
import * as FX from './fx.js';
import * as A from './assets.js';
import { pushSample } from './interp.js';

export function send(o) { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(o)); }

export async function connect(name, onFail) {
  try {
    const r = await fetch('/api/content');
    S.content = await r.json();
    await A.load();
  } catch (e) { onFail('Could not load game content.'); return; }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  S.ws = ws;
  ws.onopen = () => send({ t: 'join', name });
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  ws.onclose = () => { if (S.joined) { ui.chat('Disconnected from server. Reload the page.', true); } else onFail('Connection failed.'); S.joined = false; };
  setInterval(() => send({ t: 'ping', n: performance.now() }), 2000);
}

function handle(m) {
  switch (m.t) {
    case 'full': ui.menuMsg('Server is full, try again soon.'); break;
    case 'init': {
      S.id = m.id; S.cfg = m.cfg; S.size = m.size; S.gameName = m.name;
      S.interpDelay = (1000 / m.cfg.tick) * 2.3;
      S.gen = window.WorldGen.create(m.seed, m.size);
      S.rtypes = m.rt;
      S.res = m.rs.map(([ti, x, y], i) => ({ id: i, type: m.rt[ti], x, y, alive: true }));
      for (const id of m.dep) S.res[id].alive = false;
      S.me = { x: 0, y: 0, hp: 100, mhp: 100, spd: 1, dashUntil: 0, dashReady: 0, dx: 0, dy: 0, init: false, nextAtk: 0, sp: 0, ph: 0, flash: 0 };
      S.joined = true; S.dead = false;
      ui.start();
      break;
    }
    case 's': snapshot(m); break;
    case 'inv': S.inv = m.inv; S.sel = m.sel; ui.invChanged(); break;
    case 'chat': ui.chat(m.sys ? m.m : null, !!m.sys, m.from, m.m); break;
    case 'rs': { const r = S.res[m.id]; if (r) { r.alive = !!m.alive; if (!m.alive) { const d = S.content.nodes[r.type]; FX.chips(r.x, r.y, d.c2 || d.c, 12); } } break; }
    case 'lb': S.lb = m.top; ui.leaderboard(); break;
    case 'dead': S.dead = true; FX.shake.m = 16; ui.dead(m.by, m['in']); break;
    case 'spawn': S.dead = false; S.me.init = false; S.cam.init = false; ui.respawn(); break;
    case 'pong': S.ping = Math.round(performance.now() - m.n); break;
  }
}

function sync(map, seen, id, make) {
  let e = map.get(id); if (!e) { e = make(); e.buf = []; e.ph = 0; e.sp = 0; e.flash = 0; map.set(id, e); }
  e.goneAt = 0; seen.add(id); return e;
}
function markGone(map, seen) { for (const [id, e] of map) if (!seen.has(id) && !e.goneAt) e.goneAt = performance.now(); }

function snapshot(m) {
  S.dayTime = m.dt; S.srv = m.you;
  const me = S.me, y = m.you;
  if (!me.init || Math.hypot(y.x - me.x, y.y - me.y) > 250) { me.x = y.x; me.y = y.y; me.init = true; }
  if (y.hp < me.hp - 0.5) me.flash = 1;
  me.hp = y.hp; me.mhp = y.mhp; me.spd = y.spd; me.xp = y.xp; me.xpn = y.xpn; me.lv = y.lv; me.sc = y.sc;
  if (S.dead && y.al) S.dead = false;

  const sp = new Set();
  for (const a of m.p) {
    const e = sync(S.players, sp, a[0], () => ({ id: a[0], x: a[1], y: a[2], angle: a[3] }));
    if (a[4] < e.hp - 0.5) e.flash = 1;
    e.hp = a[4]; e.mhp = a[5]; e.name = a[6]; e.held = a[7]; e.lv = a[8]; e.fl = a[9]; e.dash = a[10];
    pushSample(e, a[1], a[2], a[3]);
  }
  markGone(S.players, sp);

  const sm = new Set();
  for (const a of m.m) {
    const e = sync(S.mobs, sm, a[0], () => ({ id: a[0], type: a[1], x: a[2], y: a[3], angle: a[4], hp: a[5] }));
    if (a[5] < e.hp - 0.5) e.flash = 1;
    e.hp = a[5]; e.mhp = a[6]; e.fl = a[7]; e.phase = a[8];
    pushSample(e, a[2], a[3], a[4]);
  }
  markGone(S.mobs, sm);

  const spr = new Set();
  for (const a of m.pr) {
    const e = sync(S.projs, spr, a[0], () => ({ id: a[0], x: a[1], y: a[2], angle: 0 }));
    e.r = a[3]; e.color = a[4]; e.hostile = a[5];
    const last = e.buf[e.buf.length - 1];
    const ang = last ? Math.atan2(a[2] - last.y, a[1] - last.x) : (e.angle || 0);
    pushSample(e, a[1], a[2], (last && (a[1] !== last.x || a[2] !== last.y)) ? ang : (last ? last.a : 0));
  }
  markGone(S.projs, spr);

  S.drops = m.d;

  for (const e of m.ev) {
    switch (e.e) {
      case 'dmg':
        S.fx.push({ k: 'dmg', x: e.x, y: e.y, v: e.v, t: 0, me: e.me === S.id, rx: (Math.random() - 0.5) * 24 });
        FX.sparks(e.x, e.y + 20, e.me === S.id ? '#ff5a5a' : '#ffe27a', 6);
        if (e.me === S.id) FX.shake.m = Math.max(FX.shake.m, Math.min(14, 4 + e.v * 0.15));
        break;
      case 'swing': if (e.id !== S.id) S.swings.set(e.id, { a: e.a, r: e.r, arc: e.arc, t: 0 }); break;
      case 'hit': { S.resHit.set(e.id, { t: 0, hp: e.hp, max: e.max }); const r = S.res[e.id]; if (r) { const d = S.content.nodes[r.type]; FX.chips(e.x, e.y, d.c2 || d.c, 4); } break; }
      case 'boom': {
        FX.boom(e.x, e.y, e.r);
        const d = Math.hypot(e.x - S.me.x, e.y - S.me.y);
        if (d < 700) FX.shake.m = Math.max(FX.shake.m, Math.min(16, e.r / 10) * (1 - d / 700));
        break;
      }
      case 'ring': S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r, d: e.d, t: 0 }); break;
      case 'pick': FX.sparkle(e.x, e.y); break;
    }
  }
}
