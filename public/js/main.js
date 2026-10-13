import { S } from './state.js';
import { connect, send } from './net.js';
import { input, init as initInput, aim } from './input.js';
import { render } from './render.js';
import * as ui from './ui.js';

const $ = (id) => document.getElementById(id);
const nameEl = $('name');
nameEl.value = localStorage.getItem('rf_name') || '';
function play() {
  $('play').disabled = true; $('menumsg').textContent = 'Connecting...';
  const n = nameEl.value.trim() || 'Wanderer'; localStorage.setItem('rf_name', n);
  connect(n, (msg) => ui.menuMsg(msg));
}
$('play').onclick = play;
nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') play(); });
initInput();

function collide(me) {
  const R = S.cfg.radius;
  for (const r of S.res) {
    if (!r.alive || Math.abs(r.x - me.x) > 160 || Math.abs(r.y - me.y) > 160) continue;
    const def = S.content.nodes[r.type]; if (!def || !def.solid) continue;
    const dx = me.x - r.x, dy = me.y - r.y, min = R + r.r * 0.8 * 1, d2 = dx * dx + dy * dy;
    // server uses def radius * 0.8; r.r is not sent, so use def.r
    const m2 = R + def.r * 0.8;
    if (d2 < m2 * m2 && d2 > 0.0001) { const d = Math.sqrt(d2), push = (m2 - d) / d; me.x += dx * push; me.y += dy * push; }
  }
  me.x = Math.max(30, Math.min(S.size - 30, me.x)); me.y = Math.max(30, Math.min(S.size - 30, me.y));
}

let last = performance.now(), sendAcc = 0, lastSent = '';
function frame(nowMs) {
  const dt = Math.min(0.05, (nowMs - last) / 1000); last = nowMs;
  const t = nowMs / 1000;
  if (S.joined && S.me && S.me.init) {
    const me = S.me;
    // --- client prediction
    if (!S.dead) {
      let vx, vy;
      if (t < me.dashUntil) { vx = me.dx * S.cfg.dashSpeed; vy = me.dy * S.cfg.dashSpeed; }
      else {
        let dx = input.keys.r - input.keys.l, dy = input.keys.d - input.keys.u; const l = Math.hypot(dx, dy); if (l) { dx /= l; dy /= l; }
        vx = dx * S.cfg.speed * me.spd; vy = dy * S.cfg.speed * me.spd;
      }
      me.x += vx * dt; me.y += vy * dt; collide(me);
      // --- reconcile with server (only correct large errors)
      const s = S.srv; if (s) { const ex = s.x - me.x, ey = s.y - me.y, e = Math.hypot(ex, ey); if (e > 250) { me.x = s.x; me.y = s.y; } else if (e > 30) { me.x += ex * 0.08; me.y += ey * 0.08; } }
    }
    // --- smooth others
    const k = 1 - Math.exp(-dt * 18);
    for (const e of S.players.values()) { e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; }
    for (const e of S.mobs.values()) { e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; }
    // --- age effects
    for (const f of S.fx) f.t += dt * (f.k === 'dmg' ? 1.2 : f.k === 'ring' ? 1 : 2.2);
    S.fx = S.fx.filter((f) => f.t < 1 || (f.k === 'ring' && f.t < (f.d || 1) + 0.2));
    for (const s of S.swings.values()) s.t += dt;
    for (const h of S.resHit.values()) h.t += dt;
    // --- send input at 20Hz
    sendAcc += dt;
    if (sendAcc >= 0.05) {
      sendAcc = 0;
      const a = Math.round(aim() * 100) / 100;
      const msg = { t: 'in', k: input.keys, a, atk: input.atk && !S.dead };
      const str = JSON.stringify(msg);
      if (str !== lastSent) { send(msg); lastSent = str; }
    }
    const it = S.inv[S.sel]; const held = it ? it[0] : '';
    render(dt, t, me, aim(), held);
    ui.tick();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
