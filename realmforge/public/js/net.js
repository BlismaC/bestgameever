import { S } from './state.js';
import * as ui from './ui.js';

export function send(o) { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(o)); }

export async function connect(name, onFail) {
  try {
    const r = await fetch('/api/content');
    S.content = await r.json();
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
      S.gen = window.WorldGen.create(m.seed, m.size);
      S.rtypes = m.rt;
      S.res = m.rs.map(([ti, x, y], i) => ({ id: i, type: m.rt[ti], x, y, alive: true }));
      for (const id of m.dep) S.res[id].alive = false;
      S.me = { x: 0, y: 0, hp: 100, mhp: 100, spd: 1, dashUntil: 0, dashReady: 0, dx: 0, dy: 0, init: false };
      S.joined = true; S.dead = false;
      ui.start();
      break;
    }
    case 's': snapshot(m); break;
    case 'inv': S.inv = m.inv; S.sel = m.sel; ui.invChanged(); break;
    case 'chat': ui.chat(m.sys ? m.m : null, !!m.sys, m.from, m.m); break;
    case 'rs': { const r = S.res[m.id]; if (r) r.alive = !!m.alive; break; }
    case 'lb': S.lb = m.top; ui.leaderboard(); break;
    case 'dead': S.dead = true; ui.dead(m.by, m['in']); break;
    case 'spawn': S.dead = false; S.me.init = false; ui.respawn(); break;
    case 'pong': S.ping = Math.round(performance.now() - m.n); break;
  }
}

function snapshot(m) {
  S.dayTime = m.dt; S.srv = m.you;
  const me = S.me, y = m.you;
  if (!me.init || Math.hypot(y.x - me.x, y.y - me.y) > 250) { me.x = y.x; me.y = y.y; me.init = true; }
  me.hp = y.hp; me.mhp = y.mhp; me.spd = y.spd; me.xp = y.xp; me.xpn = y.xpn; me.lv = y.lv; me.sc = y.sc;
  if (S.dead && y.al) S.dead = false;

  const seenP = new Set();
  for (const a of m.p) {
    let e = S.players.get(a[0]); if (!e) { e = { id: a[0], x: a[1], y: a[2] }; S.players.set(a[0], e); }
    e.tx = a[1]; e.ty = a[2]; e.angle = a[3]; e.hp = a[4]; e.mhp = a[5]; e.name = a[6]; e.held = a[7]; e.lv = a[8]; e.fl = a[9]; e.dash = a[10];
    seenP.add(a[0]);
  }
  for (const id of S.players.keys()) if (!seenP.has(id)) S.players.delete(id);

  const seenM = new Set();
  for (const a of m.m) {
    let e = S.mobs.get(a[0]); if (!e) { e = { id: a[0], x: a[2], y: a[3], type: a[1] }; S.mobs.set(a[0], e); }
    e.tx = a[2]; e.ty = a[3]; e.angle = a[4]; e.hp = a[5]; e.mhp = a[6]; e.fl = a[7]; e.phase = a[8];
    seenM.add(a[0]);
  }
  for (const id of S.mobs.keys()) if (!seenM.has(id)) S.mobs.delete(id);

  S.projs = m.pr; S.drops = m.d;

  for (const e of m.ev) {
    switch (e.e) {
      case 'dmg': S.fx.push({ k: 'dmg', x: e.x, y: e.y, v: e.v, t: 0, me: e.me === S.id }); break;
      case 'swing': S.swings.set(e.id, { a: e.a, r: e.r, arc: e.arc, t: 0, x: e.x, y: e.y }); break;
      case 'hit': S.resHit.set(e.id, { t: 0, hp: e.hp, max: e.max }); break;
      case 'boom': S.fx.push({ k: 'boom', x: e.x, y: e.y, r: e.r, t: 0 }); break;
      case 'ring': S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r, d: e.d, t: 0 }); break;
      case 'pick': S.fx.push({ k: 'pick', x: e.x, y: e.y, t: 0 }); break;
    }
  }
}
