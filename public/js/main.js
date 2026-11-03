import { S } from './state.js';
import { connect, send } from './net.js';
import { input, init as initInput, aim, mask, worldCursor } from './input.js';
import { render } from './render.js';
import { update as interpUpdate } from './interp.js';
import { frameInput, flush } from './sim.js';
import { nearRes } from './world.js';
import * as FX from './fx.js';
import * as ui from './ui.js';
import * as A from './assets.js';
import { initMenu, look, stopMenu } from './menu.js';
import * as Music from './music.js';

const $ = (id) => document.getElementById(id);
const nameEl = $('name');
nameEl.value = localStorage.getItem('rf_name') || '';
A.load().then(() => initMenu());
function play() {
  Music.start();
  $('play').disabled = true; $('menumsg').textContent = 'Connecting...';
  const n = nameEl.value.trim() || 'Wanderer'; localStorage.setItem('rf_name', n);
  connect(n, { ...look }, (msg) => ui.menuMsg(msg));
}
$('play').onclick = play;
nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') play(); });
initInput();

let last = performance.now(), sendAcc = 0, dustAcc = 0, moodAcc = 0;
function pickMood() {
  if (S.room.kind === 'island') return 'island';
  const me = S.me; let boss = false; for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d && d.b && Math.hypot(m.x - me.x, m.y - me.y) < 1400) { boss = true; break; } }
  if (boss) return 'boss';
  if (S.evt) return S.evt[0] === 'Blood Moon' ? 'bloodmoon' : S.evt[0] === 'Slime Rain' ? 'slimerain' : 'event';
  if (Math.hypot(me.x - S.size / 2, me.y - S.size / 2) < S.cfg.safe + 200) return 'town';
  const night = Math.cos(2 * Math.PI * (S.dayTime - 0.25)) < -0.2, b = S.content.biomes[S.gen.biomeAt(me.x, me.y)];
  return night && (b.m === 'day' || b.m === 'forest') ? 'night' : (b.m || 'day');
}
// music controls
{ const mb = $('mutebtn'), vol = $('vol'); if (mb) { const upd = () => { mb.textContent = Music.isEnabled() ? '♪ On' : '♪ Off'; }; upd(); mb.onclick = () => { Music.setEnabled(!Music.isEnabled()); Music.start(); upd(); }; vol.value = Math.round(Music.getVolume() * 100); vol.oninput = () => Music.setVolume(vol.value / 100); } }
function frame(nowMs) {
  const dt = Math.min(0.05, Math.max(0.001, (nowMs - last) / 1000)); last = nowMs;
  const t = nowMs / 1000;
  if (S.joined && S.me && S.me.init) {
    stopMenu();
    const me = S.me, a = aim(); const atkNow = input.atk || input.click; input.click = false;
    // ---- movement: predicted with the exact server code, one input per frame, reconciled on every snapshot
    if (!S.dead) {
      frameInput(dt, mask(), input.dash, a); input.dash = false;
      me.sp = Math.hypot(me.vx || 0, me.vy || 0); me.ph += me.sp * dt * 0.055;
    } else { me.sp = 0; input.dash = false; }
    const dk = Math.exp(-dt * 13); me.off.x *= dk; me.off.y *= dk;           // blend corrections out smoothly
    const rx = me.x + me.off.x, ry = me.y + me.off.y;
    if (Math.cos(a) > 0.15) me.face = 1; else if (Math.cos(a) < -0.15) me.face = -1;
    if (me.flash > 0) me.flash = Math.max(0, me.flash - dt * 4);
    const it = S.inv[S.sel], held = it ? it[0] : '';
    const idef = held && S.content.items[held], w = idef && idef.w, sdef = held && S.content.structures[held];

    // ---- building ghost + placing
    S.ghost = null;
    if (sdef && !S.dead) {
      const cam = S.cam; let gx = cam.x + (input.mx - innerWidth / 2) / cam.scale, gy = cam.y + (input.my - innerHeight / 2) / cam.scale;
      const dx = gx - rx, dy = gy - ry, dd = Math.hypot(dx, dy), BR = S.cfg.build;
      if (dd > BR) { gx = rx + dx / dd * BR; gy = ry + dy / dd * BR; }
      const island = S.room.kind === 'island', IC = S.cfg.isl / 2;
      let ok = island ? (S.room.canBuild && Math.hypot(gx - IC, gy - IC) < S.cfg.islR - 30) : (!sdef.ho && Math.hypot(gx - S.size / 2, gy - S.size / 2) > S.cfg.safe && gx > 60 && gy > 60 && gx < S.size - 60 && gy < S.size - 60);
      if (ok && !island) nearRes(gx, gy, sdef.r + 90, (r) => { if (r.alive && S.content.nodes[r.type].solid && Math.hypot(gx - r.x, gy - r.y) < sdef.r + S.content.nodes[r.type].r * 0.8) ok = false; });
      if (ok) for (const o of S.structs.values()) { const od = S.content.structures[o.type]; if (od && Math.hypot(gx - o.x, gy - o.y) < sdef.r + od.r - 8) { ok = false; break; } }
      if (ok && sdef.solid && Math.hypot(gx - rx, gy - ry) < sdef.r + S.cfg.radius) ok = false;
      S.ghost = { type: held, x: gx, y: gy, ok, r: sdef.r };
      if (atkNow && t >= me.nextPlace) { me.nextPlace = t + 0.22; send({ t: 'place', x: Math.round(gx), y: Math.round(gy) }); }
    }
    // ---- instant swing feedback (server confirms; its own swing event for us is ignored)
    if (atkNow && !S.dead && !sdef && S.room.kind !== 'island' && t >= me.nextAtk) {
      const cd = w ? w.cd : 0.5, rng = w ? w.rng : 48, arc = w ? w.arc : 90;
      me.nextAtk = t + cd; S.swings.set(S.id, { a: a, r: rng, arc: rng ? arc : 0, t: 0 });
    }
    // ---- smoothing / effects
    interpUpdate(dt); FX.update(dt);
    dustAcc += dt; if (!S.dead && me.sp > 80 && dustAcc > 0.12) { dustAcc = 0; FX.dust(rx, ry + 24, me.dashLeft > 0 ? 1.6 : 1); }
    for (const f of S.fx) f.t += dt * (f.k === 'dmg' || f.k === 'heal' ? 1.1 : 1);
    S.fx = S.fx.filter((f) => (f.k === 'dmg' || f.k === 'heal' || f.k === 'clang' ? f.t < 1 : f.t < (f.d || 1) + 0.15));
    for (const f of S.tele) f.t += dt; S.tele = S.tele.filter((f) => f.t < f.d + 0.12);
    for (const s of S.swings.values()) s.t += dt; for (const h of S.resHit.values()) h.t += dt; for (const h of S.structHit.values()) h.t += dt;

    // ---- network: batch of inputs every ~33ms
    sendAcc += dt;
    if (sendAcc >= 0.033) { sendAcc = 0; const m = flush((input.atk || atkNow) && !S.dead); if (m) send(m); }

    const lead = { x: (input.mx - innerWidth / 2) * 0.1, y: (input.my - innerHeight / 2) * 0.1 };
    render(dt, t, { x: rx, y: ry, hp: me.hp, mhp: me.mhp, flash: me.flash, dashLeft: me.dashLeft, sp: me.sp, ph: me.ph, face: me.face }, a, held, lead);
    ui.tick();
    moodAcc += dt; if (moodAcc > 1) { moodAcc = 0; Music.setMood(pickMood()); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
