// Client-side prediction: runs the SAME movement code as the server on every frame, replays unacknowledged inputs on each snapshot.
import { S } from './state.js';
import { nearRes } from './world.js';
const M = window.Movement;
export const pending = [];
const outbox = [];
let seq = 0;

export function collide(st) {
  const R = S.cfg.radius;
  if (S.me && S.me.flying && S.room.kind !== 'island') { st.x = Math.max(30, Math.min(S.size - 30, st.x)); st.y = Math.max(30, Math.min(S.size - 30, st.y)); return; }
  if (S.room.kind === 'island') {
    collideStructs(st, R);
    const IC = S.cfg.isl / 2, dx = st.x - IC, dy = st.y - IC, d = Math.hypot(dx, dy), lim = S.cfg.islR - 30;
    if (d > lim) { st.x = IC + dx / d * lim; st.y = IC + dy / d * lim; }
    return;
  }
  nearRes(st.x, st.y, R + 120, (r) => {
    if (!r.alive) return;
    const def = S.content.nodes[r.type]; if (!def || !def.solid) return;
    const dx = st.x - r.x, dy = st.y - r.y, m2 = R + def.r * 0.8, d2 = dx * dx + dy * dy;
    if (d2 < m2 * m2 && d2 > 0.0001) { const d = Math.sqrt(d2), push = (m2 - d) / d; st.x += dx * push; st.y += dy * push; }
  });
  st.x = Math.max(30, Math.min(S.size - 30, st.x)); st.y = Math.max(30, Math.min(S.size - 30, st.y));
  collideStructs(st, R);
}
function collideStructs(st, R) {
  for (const s of S.structs.values()) {
    if (Math.abs(s.x - st.x) > 160 || Math.abs(s.y - st.y) > 160) continue;
    const d0 = S.content.structures[s.type]; if (!d0 || !d0.solid) continue;
    const dx = st.x - s.x, dy = st.y - s.y, m2 = R + d0.r * 0.92, d2 = dx * dx + dy * dy;
    if (d2 < m2 * m2 && d2 > 0.0001) { const d = Math.sqrt(d2), push = (m2 - d) / d; st.x += dx * push; st.y += dy * push; }
  }
}
const wm = (st) => (S.room.kind === 'island' ? 1 : M.waterMult(S.gen, st.x, st.y, S.me.flying));
const cfg = () => ({ speed: S.cfg.speed, dashSpeed: S.cfg.dashSpeed, dashTime: S.cfg.dashTime, dashCooldown: S.cfg.dashCooldown });

// one input per rendered frame
export function frameInput(dt, keys, dash, aim) {
  const me = S.me; const ms = Math.max(1, Math.min(50, Math.round(dt * 1000))), dtq = ms / 1000, a = Math.round(aim * 100) / 100;
  const inp = { s: ++seq, k: keys, d: dash ? 1 : 0, a, dt: dtq };
  M.step(me, keys, inp.d, a, dtq, cfg(), me.spd * wm(me), () => collide(me));
  pending.push(inp); outbox.push([inp.s, keys, ms, inp.d, Math.round(a * 100)]);
  if (pending.length > 120) pending.splice(0, pending.length - 120);
  if (outbox.length > 24) outbox.splice(0, outbox.length - 24);
}
export function flush(atk) { if (!outbox.length) return null; return { t: 'mv', i: outbox.splice(0, 12), atk: atk ? 1 : 0 }; }

export function reconcile(you) {
  const me = S.me;
  me.spd = you.spd; me.flying = you.fl;
  if (!me.init || you.ep !== me.ep) {
    me.ep = you.ep; me.x = you.x; me.y = you.y; me.dashLeft = you.dl; me.dashCd = you.dc; me.dashDx = you.dd ? you.dd[0] : 0; me.dashDy = you.dd ? you.dd[1] : 0;
    pending.length = 0; me.off.x = me.off.y = 0; me.init = true; S.cam.init = false; return;
  }
  const bx = me.x, by = me.y;
  const st = { x: you.x, y: you.y, dashLeft: you.dl, dashCd: you.dc, dashDx: you.dd ? you.dd[0] : me.dashDx, dashDy: you.dd ? you.dd[1] : me.dashDy };
  while (pending.length && pending[0].s <= you.seq) pending.shift();
  for (const inp of pending) M.step(st, inp.k, inp.d, inp.a, inp.dt, cfg(), me.spd * wm(st), () => collide(st));
  const ex = bx - st.x, ey = by - st.y;
  if (Math.hypot(ex, ey) > 220) { me.off.x = me.off.y = 0; } else { me.off.x += ex; me.off.y += ey; }
  me.x = st.x; me.y = st.y; me.dashLeft = st.dashLeft; me.dashCd = st.dashCd; me.dashDx = st.dashDx; me.dashDy = st.dashDy;
}
