import { S } from './state.js';
// Snapshot interpolation for PLAYERS (rendered ~2 ticks in the past). Projectiles and monsters use LAG COMPENSATION instead:
// they are extrapolated forward by (time since the snapshot + our round-trip) so what you SEE is where the server will test hits
// when your next input reaches it - the same time frame as your locally predicted character. This is what makes dodging/aiming match the hitboxes.
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
  if (e.look) { if (Math.cos(a) > 0.2) e.face = 1; else if (Math.cos(a) < -0.2) e.face = -1; }
  if (e.flash > 0) e.flash = Math.max(0, e.flash - dt * 5);
}
// monsters: newest snapshot + estimated velocity * lead, smoothed so direction changes do not jitter
function stepMob(e, dt) {
  const b = e.buf; if (!b.length) return;
  const n = b[b.length - 1], p = b.length > 1 ? b[b.length - 2] : n, now = performance.now();
  const span = Math.max(16, n.t - p.t); let vx = (n.x - p.x) / span * 1000, vy = (n.y - p.y) / span * 1000;
  if (Math.hypot(n.x - p.x, n.y - p.y) > 400) { vx = vy = 0; e.x = n.x; e.y = n.y; }           // teleport/blink: snap
  const sp = Math.hypot(vx, vy); if (sp > 1100) { vx *= 1100 / sp; vy *= 1100 / sp; }
  const lead = Math.min(0.26, (now - n.t) / 1000 + (S.ping || 0) / 1000 * 0.9);
  const tx = n.x + vx * lead, ty = n.y + vy * lead, k = 1 - Math.exp(-dt * 16);
  e.sp = Math.hypot(tx - e.x, ty - e.y) / Math.max(dt, 0.001); if (e.sp > 1500) e.sp = 0;
  e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; e.ph = (e.ph || 0) + e.sp * dt * 0.07; e.angle = n.a;
  if (e.flash > 0) e.flash = Math.max(0, e.flash - dt * 5);
}
export function update(dt) {
  const rt = performance.now() - S.interpDelay, now = performance.now();
  for (const [id, e] of S.players) { step(e, rt, dt); if (e.goneAt && rt >= e.buf[e.buf.length - 1].t) S.players.delete(id); }
  for (const [id, e] of S.mobs) { stepMob(e, dt); if (e.goneAt && now - e.buf[e.buf.length - 1].t > 90) S.mobs.delete(id); }
  const lead0 = Math.min(0.35, (S.ping || 0) / 1000);
  for (const [id, e] of S.projs) {
    if (e.goneAt) { S.projs.delete(id); continue; }
    const age = (now - e.arr) / 1000 + lead0, tx = e.sx + e.vx * age, ty = e.sy + e.vy * age;
    if (!e.init) { if (!e.adopt) { e.x = tx; e.y = ty; } e.init = true; }
    else { e.x += e.vx * dt; e.y += e.vy * dt; const k = Math.min(1, dt * 9); e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; }
    if (e.vx || e.vy) e.angle = Math.atan2(e.vy, e.vx);
    if (e.cast !== undefined) e.cast -= dt;
  }
  // locally predicted shots (cosmetic, shown instantly; removed when the server's own projectile arrives)
  for (let i = S.ghosts.length - 1; i >= 0; i--) { const g = S.ghosts[i]; g.age += dt; g.x += g.vx * dt; g.y += g.vy * dt; if (g.age > Math.min(0.5, g.life)) S.ghosts.splice(i, 1); }
  for (const m of S.mobs.values()) if (m.cast > 0) m.cast = Math.max(0, m.cast - dt);
}
