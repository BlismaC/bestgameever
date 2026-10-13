import { S } from './state.js';
// Snapshot interpolation: other entities are rendered ~2 server ticks in the past, blended between real snapshots.
const lerpAngle = (a, b, f) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * f; };

export function pushSample(e, x, y, a) {
  e.buf.push({ t: performance.now(), x, y, a }); if (e.buf.length > 10) e.buf.shift();
}
function step(e, rt, dt) {
  const b = e.buf; if (!b.length) return;
  const last = b[b.length - 1]; let x, y, a;
  if (rt >= last.t) { x = last.x; y = last.y; a = last.a; }
  else if (rt <= b[0].t) { x = b[0].x; y = b[0].y; a = b[0].a; }
  else {
    let j = b.length - 2; while (j > 0 && b[j].t > rt) j--;
    const p = b[j], n = b[j + 1], f = (rt - p.t) / Math.max(1, n.t - p.t);
    if (Math.hypot(n.x - p.x, n.y - p.y) > 500) { x = n.x; y = n.y; } else { x = p.x + (n.x - p.x) * f; y = p.y + (n.y - p.y) * f; }
    a = lerpAngle(p.a, n.a, f);
  }
  e.sp = dt > 0 ? Math.hypot(x - e.x, y - e.y) / dt : 0; if (e.sp > 1500) e.sp = 0;
  e.ph = (e.ph || 0) + e.sp * dt * 0.07;
  e.x = x; e.y = y; e.angle = a;
  if (e.flash > 0) e.flash = Math.max(0, e.flash - dt * 5);
}
export function update(dt) {
  const rt = performance.now() - S.interpDelay;
  for (const map of [S.players, S.mobs, S.projs]) {
    for (const [id, e] of map) {
      step(e, rt, dt);
      if (e.goneAt && rt >= e.buf[e.buf.length - 1].t) map.delete(id);
    }
  }
}
