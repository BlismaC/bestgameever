import { S } from './state.js';
import { connect, send } from './net.js';
import { input, init as initInput, aim } from './input.js';
import { render } from './render.js';
import { update as interpUpdate } from './interp.js';
import * as FX from './fx.js';
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

// Same collision rule as the server so prediction never disagrees
function collide(me) {
  const R = S.cfg.radius;
  for (const r of S.res) {
    if (!r.alive || Math.abs(r.x - me.x) > 160 || Math.abs(r.y - me.y) > 160) continue;
    const def = S.content.nodes[r.type]; if (!def || !def.solid) continue;
    const dx = me.x - r.x, dy = me.y - r.y, m2 = R + def.r * 0.8, d2 = dx * dx + dy * dy;
    if (d2 < m2 * m2 && d2 > 0.0001) { const d = Math.sqrt(d2), push = (m2 - d) / d; me.x += dx * push; me.y += dy * push; }
  }
  me.x = Math.max(30, Math.min(S.size - 30, me.x)); me.y = Math.max(30, Math.min(S.size - 30, me.y));
}

let last = performance.now(), sendAcc = 0, lastSent = '', dustAcc = 0;
function frame(nowMs) {
  const dt = Math.min(0.05, (nowMs - last) / 1000); last = nowMs;
  const t = nowMs / 1000;
  if (S.joined && S.me && S.me.init) {
    const me = S.me;
    // ---- client-side prediction of own movement
    let vx = 0, vy = 0;
    if (!S.dead) {
      if (t < me.dashUntil) { vx = me.dx * S.cfg.dashSpeed; vy = me.dy * S.cfg.dashSpeed; }
      else {
        let dx = input.keys.r - input.keys.l, dy = input.keys.d - input.keys.u; const l = Math.hypot(dx, dy); if (l) { dx /= l; dy /= l; }
        vx = dx * S.cfg.speed * me.spd; vy = dy * S.cfg.speed * me.spd;
      }
      me.x += vx * dt; me.y += vy * dt; collide(me);
      const s = S.srv; if (s) { const ex = s.x - me.x, ey = s.y - me.y, e = Math.hypot(ex, ey); if (e > 250) { me.x = s.x; me.y = s.y; } else if (e > 30) { me.x += ex * 0.08; me.y += ey * 0.08; } }
    }
    me.sp = Math.hypot(vx, vy); me.ph += me.sp * dt * 0.07; if (me.flash > 0) me.flash = Math.max(0, me.flash - dt * 4);

    // ---- instant swing feedback (server confirms; its swing event for us is ignored)
    const it = S.inv[S.sel], held = it ? it[0] : '';
    const idef = held && S.content.items[held], w = idef && idef.w;
    if (input.atk && !S.dead && t >= me.nextAtk) {
      const cd = w ? w.cd : 0.5, rng = w ? w.rng : 48, arc = w ? w.arc : 90;
      me.nextAtk = t + cd; S.swings.set(S.id, { a: aim(), r: rng, arc: rng ? arc : 0, t: 0 });
    }

    // ---- smoothing / effects
    interpUpdate(dt); FX.update(dt);
    dustAcc += dt;
    if (!S.dead && me.sp > 80 && dustAcc > 0.12) { dustAcc = 0; FX.dust(me.x, me.y + 20, t < me.dashUntil ? 1.6 : 1); }
    for (const f of S.fx) f.t += dt * (f.k === 'dmg' ? 1.1 : 1);
    S.fx = S.fx.filter((f) => (f.k === 'dmg' ? f.t < 1 : f.t < (f.d || 1) + 0.15));
    for (const s of S.swings.values()) s.t += dt;
    for (const h of S.resHit.values()) h.t += dt;

    // ---- send input (20 Hz, only when changed)
    sendAcc += dt;
    if (sendAcc >= 0.05) {
      sendAcc = 0;
      const msg = { t: 'in', k: input.keys, a: Math.round(aim() * 100) / 100, atk: input.atk && !S.dead };
      const str = JSON.stringify(msg); if (str !== lastSent) { send(msg); lastSent = str; }
    }

    const lead = { x: (input.mx - innerWidth / 2) * 0.1, y: (input.my - innerHeight / 2) * 0.1 };
    render(dt, t, me, aim(), held, lead);
    ui.tick();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
