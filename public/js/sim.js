// Client-side prediction: runs the SAME movement code as the server on every frame, replays unacknowledged inputs on each snapshot.
import { S } from './state.js';
import { nearRes } from './world.js';
const M = window.Movement;
export const pending = [];
const outbox = [];
let seq = 0;

export function collide(st) {
  const R = S.cfg.radius;
  if (S.me && S.me.flying && S.room.kind !== 'island') { const rc = S.gen.rectAt(st.x, st.y); st.x = Math.max(rc.x0 + 30, Math.min(rc.x1 - 30, st.x)); st.y = Math.max(rc.y0 + 30, Math.min(rc.y1 - 30, st.y)); return; }
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
  if (S.gen.dimAt(st.x, st.y)) for (const rc2 of S.gen.rects) {
    if (st.x < rc2.x0 - R || st.x > rc2.x1 + R || st.y < rc2.y0 - R || st.y > rc2.y1 + R) continue;
    const nx = Math.max(rc2.x0, Math.min(st.x, rc2.x1)), ny = Math.max(rc2.y0, Math.min(st.y, rc2.y1)); const dx = st.x - nx, dy = st.y - ny, d2 = dx * dx + dy * dy; if (d2 >= R * R) continue;
    if (d2 > 1e-4) { const d = Math.sqrt(d2), k = (R - d) / d; st.x += dx * k; st.y += dy * k; }
    else { const l = st.x - rc2.x0, r2 = rc2.x1 - st.x, t2 = st.y - rc2.y0, b2 = rc2.y1 - st.y, m2 = Math.min(l, r2, t2, b2); if (m2 === l) st.x = rc2.x0 - R; else if (m2 === r2) st.x = rc2.x1 + R; else if (m2 === t2) st.y = rc2.y0 - R; else st.y = rc2.y1 + R; }
  }
  for (const mm of S.mobs.values()) { const dd = S.content.mobs[mm.type]; if (!dd || !dd.b) continue; const dx = st.x - mm.x, dy = st.y - mm.y, min = dd.r * 0.78 + R, d2 = dx * dx + dy * dy; if (d2 < min * min && d2 > 1e-4) { const d = Math.sqrt(d2), k = (min - d) / d; st.x += dx * k; st.y += dy * k; } }   // bosses are solid
  const rc = S.gen.rectAt(st.x, st.y); st.x = Math.max(rc.x0 + 30, Math.min(rc.x1 - 30, st.x)); st.y = Math.max(rc.y0 + 30, Math.min(rc.y1 - 30, st.y));
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
const wm = (st) => (S.room.kind === 'island' ? 1 : M.waterMult(S.gen, st.x, st.y, S.me.flying || S.me.float));
const cfg = () => ({ speed: S.cfg.speed, dashSpeed: S.cfg.dashSpeed, dashTime: S.cfg.dashTime, dashCooldown: S.cfg.dashCooldown });

// one input per rendered frame
export function frameInput(dt, keys, dash, aim) {
  const me = S.me; const ms = Math.max(1, Math.min(50, Math.round(dt * 1000))), dtq = ms / 1000, a = Math.round(aim * 100) / 100;
  if (S.enter && !S.enter.fadeIn) { keys = 0; dash = false; }   // locked while walking through a door
  const inp = { s: ++seq, k: keys, d: dash ? 1 : 0, a, dt: dtq };
  M.step(me, keys, inp.d, a, dtq, cfg(), me.spd * wm(me), () => collide(me));
  if (S.kb && performance.now() < S.kb.until) { me.x += S.kb.vx * dtq; me.y += S.kb.vy * dtq; collide(me); }   // knockback
  pending.push(inp); outbox.push([inp.s, keys, ms, inp.d, Math.round(a * 100)]);
  if (pending.length > 120) pending.splice(0, pending.length - 120);
  if (outbox.length > 24) outbox.splice(0, outbox.length - 24);
}
export function flush(atk) { if (!outbox.length) return null; return { t: 'mv', i: outbox.splice(0, 12), atk: atk ? 1 : 0 }; }

export function reconcile(you) {
  const me = S.me;
  me.spd = you.spd; me.flying = you.fl === 1; me.float = you.fl > 0;
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
