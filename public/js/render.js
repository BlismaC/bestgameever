import { S } from './state.js';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
export function resize() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener('resize', resize); resize();

const TILE = 80;
const tileCache = new Map();
function tileColor(tx, ty) {
  const k = tx * 4096 + ty; let c = tileCache.get(k);
  if (!c) {
    const b = S.content.biomes[S.gen.biomeAt(tx * TILE + TILE / 2, ty * TILE + TILE / 2)];
    c = ((tx + ty) & 1) ? b.c : b.c2; tileCache.set(k, c);
    if (tileCache.size > 6000) tileCache.clear();
  }
  return c;
}
function darkness() { const sun = Math.cos(2 * Math.PI * (S.dayTime - 0.25)); return Math.max(0, Math.min(0.78, 0.35 - sun * 0.6)); }
const circle = (x, y, r, fill, stroke) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); } };
function emoji(e, x, y, size) { ctx.font = `${size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); }
function hpBar(x, y, w, frac, color) { ctx.fillStyle = '#000a'; ctx.fillRect(x - w / 2, y, w, 6); ctx.fillStyle = color; ctx.fillRect(x - w / 2 + 1, y + 1, (w - 2) * Math.max(0, frac), 4); }

function drawNode(r, def, t) {
  const hit = S.resHit.get(r.id); let sx = 0;
  if (hit && hit.t < 0.15) sx = Math.sin(hit.t * 90) * 3;
  const x = r.x + sx, y = r.y, R = def.r;
  ctx.globalAlpha = 0.18; circle(x + 4, y + R * 0.7, R * 0.8, '#000'); ctx.globalAlpha = 1;
  switch (def.s) {
    case 'tree': circle(x, y + 6, R * 0.28, def.c2); circle(x, y - 6, R * 0.95, def.c); circle(x - R * 0.3, y - R * 0.35, R * 0.4, '#fff2'); break;
    case 'rock': circle(x, y, R, def.c, '#0004'); circle(x - R * 0.25, y - R * 0.25, R * 0.45, def.c2); if (def.c2 === '#ffe27a') { ctx.fillStyle = '#ffe27a'; ctx.fillRect(x - 3, y - R - 12, 6, 26); ctx.fillRect(x - 10, y - R + 4, 20, 4); } break;
    case 'ore': circle(x, y, R, def.c, '#0004'); for (let i = 0; i < 5; i++) circle(x + Math.cos(i * 1.3 + r.id) * R * 0.5, y + Math.sin(i * 1.3 + r.id) * R * 0.5, R * 0.2, def.c2); break;
    case 'bush': circle(x, y, R, def.c, '#0003'); for (let i = 0; i < 5; i++) circle(x + Math.cos(i * 1.26) * R * 0.5, y + Math.sin(i * 1.26) * R * 0.5, 4, def.c2); break;
    case 'cactus': ctx.fillStyle = def.c; ctx.beginPath(); ctx.roundRect(x - R * 0.4, y - R, R * 0.8, R * 2, 8); ctx.fill(); ctx.beginPath(); ctx.roundRect(x + R * 0.3, y - R * 0.3, R * 0.5, R * 0.3, 5); ctx.fill(); break;
    case 'crystal': ctx.fillStyle = def.c; ctx.strokeStyle = def.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - R * 1.2); ctx.lineTo(x + R * 0.7, y); ctx.lineTo(x, y + R * 0.8); ctx.lineTo(x - R * 0.7, y); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    default: circle(x, y, R, def.c);
  }
  if (hit && hit.t < 3 && hit.hp > 0) hpBar(x, y + R + 6, 44, hit.hp / hit.max, '#7ad06a');
}

function drawMob(m, t) {
  const def = S.content.mobs[m.type]; if (!def) return;
  const R = def.r, shiny = m.fl & 8;
  ctx.globalAlpha = 0.2; circle(m.x + 4, m.y + R * 0.7, R * 0.9, '#000'); ctx.globalAlpha = 1;
  if (def.b) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 4); circle(m.x, m.y, R * 1.25, null, '#f33'); ctx.globalAlpha = 1; }
  circle(m.x, m.y, R, def.c, shiny ? '#ffd23f' : '#0006');
  if (shiny) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 8); emoji('✨', m.x + R * 0.7, m.y - R * 0.7, 18); ctx.globalAlpha = 1; }
  emoji(def.e, m.x, m.y, R * 1.25);
  if (m.fl & 1) emoji('🔥', m.x, m.y - R - 6, 16);
  if (m.fl & 2) emoji('☠', m.x, m.y - R - 6, 14);
  if (m.fl & 4) emoji('❄', m.x + 10, m.y - R - 6, 14);
  if (m.hp < m.mhp || def.b) hpBar(m.x, m.y + R + 8, Math.max(40, R * 1.6), m.hp / m.mhp, def.b ? '#ff4d4d' : '#e55');
}

function heldEmoji(held) { const it = held && S.content.items[held]; return it ? it.e : '✊'; }
function drawPlayer(p, self, t) {
  const R = S.cfg.radius, a = p.angle;
  ctx.globalAlpha = 0.2; circle(p.x + 4, p.y + 16, R, '#000'); ctx.globalAlpha = 1;
  if (p.dash) { ctx.globalAlpha = 0.3; circle(p.x - Math.cos(a) * 20, p.y - Math.sin(a) * 20, R, '#fff'); ctx.globalAlpha = 1; }
  // weapon (swing animation)
  const sw = S.swings.get(p.id); let off = 0;
  if (sw && sw.t < 0.18 && sw.arc) off = (sw.t / 0.18 - 0.5) * (sw.arc * Math.PI / 180);
  const wa = a + off;
  ctx.save(); ctx.translate(p.x + Math.cos(wa) * (R + 12), p.y + Math.sin(wa) * (R + 12)); ctx.rotate(wa + Math.PI / 4); emoji(heldEmoji(p.held), 0, 0, 34); ctx.restore();
  circle(p.x, p.y, R, self ? '#ffd9a0' : '#a9c8ff', '#000a');
  circle(p.x + Math.cos(a - 0.4) * 10, p.y + Math.sin(a - 0.4) * 10, 3.5, '#222'); circle(p.x + Math.cos(a + 0.4) * 10, p.y + Math.sin(a + 0.4) * 10, 3.5, '#222');
  if (p.fl & 1) emoji('🔥', p.x, p.y - R - 8, 16);
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  const label = `${p.name || ''}${p.lv ? '  Lv' + p.lv : ''}`; ctx.strokeText(label, p.x, p.y - R - 26); ctx.fillText(label, p.x, p.y - R - 26);
  hpBar(p.x, p.y - R - 18, 48, p.hp / p.mhp, '#5fd35f');
}

export function render(dt, t, me, myAngle, myHeld) {
  const w = cv.width, h = cv.height;
  const scale = Math.max(0.5, Math.min(1.6, Math.min(w / 1300, h / 760)));
  const cam = S.cam; cam.x = me.x; cam.y = me.y; cam.scale = scale;
  ctx.fillStyle = '#0b0d14'; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(scale, scale); ctx.translate(-cam.x, -cam.y);
  const vw = w / scale / 2 + 120, vh = h / scale / 2 + 120;
  const x0 = cam.x - vw, x1 = cam.x + vw, y0 = cam.y - vh, y1 = cam.y + vh;
  // ground
  for (let ty = Math.max(0, Math.floor(y0 / TILE)); ty <= Math.min(S.size / TILE - 1, Math.floor(y1 / TILE)); ty++)
    for (let tx = Math.max(0, Math.floor(x0 / TILE)); tx <= Math.min(S.size / TILE - 1, Math.floor(x1 / TILE)); tx++) { ctx.fillStyle = tileColor(tx, ty); ctx.fillRect(tx * TILE, ty * TILE, TILE + 1, TILE + 1); }
  // safe zone ring
  ctx.strokeStyle = '#ffffff55'; ctx.setLineDash([14, 14]); ctx.lineWidth = 3; circle(S.size / 2, S.size / 2, S.cfg.safe, null, '#ffffff44'); ctx.setLineDash([]);
  // drops
  for (const d of S.drops) { const it = S.content.items[d[1]]; if (!it) continue; const bob = Math.sin(t * 4 + d[0]) * 3; circle(d[3], d[4] + bob, 15, it.c + '99', '#fff6'); emoji(it.e, d[3], d[4] + bob, 18); if (d[2] > 1) { ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(d[2], d[3] + 12, d[4] + 14 + bob); } }
  // resources (viewport cull)
  for (const r of S.res) {
    if (!r.alive || r.x < x0 - 60 || r.x > x1 + 60 || r.y < y0 - 60 || r.y > y1 + 60) continue;
    const def = S.content.nodes[r.type]; if (def) drawNode(r, def, t);
  }
  // entities sorted by y
  const ents = [];
  for (const m of S.mobs.values()) ents.push([m.y, () => drawMob(m, t)]);
  for (const p of S.players.values()) ents.push([p.y, () => drawPlayer(p, false, t)]);
  if (!S.dead) ents.push([me.y, () => drawPlayer({ id: S.id, x: me.x, y: me.y, angle: myAngle, hp: me.hp, mhp: me.mhp, name: 'You', lv: me.lv, held: myHeld, fl: 0, dash: performance.now() / 1000 < me.dashUntil }, true, t)]);
  ents.sort((a, b) => a[0] - b[0]); for (const e of ents) e[1]();
  // swing arcs
  for (const [id, s] of S.swings) {
    if (s.t > 0.2 || !s.arc) continue;
    const src = id === S.id ? me : S.players.get(id); if (!src) continue;
    ctx.globalAlpha = 0.35 * (1 - s.t / 0.2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(src.x, src.y);
    ctx.arc(src.x, src.y, s.r, s.a - s.arc * Math.PI / 360, s.a + s.arc * Math.PI / 360); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  }
  // projectiles
  for (const p of S.projs) { ctx.globalAlpha = 0.35; circle(p[1], p[2], p[3] * 1.8, p[4]); ctx.globalAlpha = 1; circle(p[1], p[2], p[3], p[4], p[5] ? '#400' : '#fff8'); }
  // effects
  for (const f of S.fx) {
    const a = 1 - f.t;
    if (f.k === 'dmg') { ctx.globalAlpha = Math.max(0, a); ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.me ? '#ff6a6a' : '#ffe27a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(f.v, f.x, f.y - f.t * 40); ctx.fillText(f.v, f.x, f.y - f.t * 40); ctx.globalAlpha = 1; }
    else if (f.k === 'boom') { ctx.globalAlpha = Math.max(0, a) * 0.6; circle(f.x, f.y, f.r * (0.4 + f.t * 0.8), '#ffb347'); ctx.globalAlpha = 1; }
    else if (f.k === 'ring') { ctx.globalAlpha = 0.5; circle(f.x, f.y, f.r, '#ff000033', '#ff4d4d'); circle(f.x, f.y, f.r * Math.min(1, f.t * 1.2 / (f.d || 1) * 1.2), '#ff000044'); ctx.globalAlpha = 1; }
    else if (f.k === 'pick') { ctx.globalAlpha = Math.max(0, a); circle(f.x, f.y - f.t * 20, 6 + f.t * 10, null, '#fff'); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  // day / night
  const dk = darkness();
  if (dk > 0.01) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 90 * scale, w / 2, h / 2, 560 * scale);
    g.addColorStop(0, `rgba(5,8,30,${dk * 0.25})`); g.addColorStop(1, `rgba(5,8,30,${dk})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  // low hp vignette
  if (me.hp / me.mhp < 0.3 && !S.dead) { const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8); g.addColorStop(0, 'rgba(180,0,0,0)'); g.addColorStop(1, 'rgba(180,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
}
