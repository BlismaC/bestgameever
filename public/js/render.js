import { S } from './state.js';
import * as A from './assets.js';
import * as FX from './fx.js';
import cfgA from './assetcfg.js';
import { nearRes } from './world.js';
import { drawHuman } from './look.js';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const TAU = Math.PI * 2;
let DPR = 1;
export function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.floor(innerWidth * DPR); cv.height = Math.floor(innerHeight * DPR);
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
}
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- colour helpers
const colCache = new Map();
function rgb(hex) {
  let c = colCache.get(hex);
  if (!c) {
    let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16); c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; colCache.set(hex, c);
  }
  return c;
}
export function shade(hex, k) { const [r, g, b] = rgb(hex), f = k >= 0 ? 255 : 0, a = Math.abs(k); return `rgb(${(r + (f - r) * a) | 0},${(g + (f - g) * a) | 0},${(b + (f - b) * a) | 0})`; }
const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
function hash2(a, b, s = 0) { let h = (a * 374761393 + b * 668265263 + s * 144269504) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

// ---------------------------------------------------------------- ground (cached chunks, soft biome edges, decorations)
const CH = 512, T = 32, N = CH / T, CPX = 640;
const chunks = new Map();
function deco(g, id, x, y, wx, wy, b) {
  const h1 = hash2(wx, wy, 11), h2 = hash2(wx, wy, 23), h3 = hash2(wx, wy, 37);
  switch (id) {
    case 'plains': case 'forest': case 'swamp':
      if (h1 < 0.4) { g.strokeStyle = shade(b.c2, -0.2); g.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const px = x + 4 + h2 * 20 + k * 3, py = y + 8 + h3 * 18; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (k - 1) * 2.2, py - 5 - k); g.stroke(); } }
      if (id === 'plains' && h2 < 0.06) { g.fillStyle = ['#fff3a8', '#ffb3d1', '#ffffff'][(h3 * 3) | 0]; g.beginPath(); g.arc(x + h3 * 28 + 2, y + h1 * 28 + 2, 2, 0, TAU); g.fill(); }
      if (id === 'swamp' && h3 < 0.08) { g.fillStyle = 'rgba(15,35,28,.35)'; g.beginPath(); g.ellipse(x + 16, y + 16, 9 + h1 * 6, 5 + h2 * 3, 0, 0, TAU); g.fill(); }
      break;
    case 'desert':
      if (h1 < 0.2) { g.strokeStyle = shade(b.c, -0.09); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 3, y + 10 + h2 * 12); g.quadraticCurveTo(x + 16, y + 4 + h2 * 12, x + 29, y + 10 + h2 * 12); g.stroke(); }
      if (h2 < 0.04) { g.fillStyle = shade(b.c, -0.2); g.beginPath(); g.arc(x + h1 * 26 + 3, y + h3 * 26 + 3, 2.2, 0, TAU); g.fill(); }
      break;
    case 'snow':
      if (h1 < 0.13) { g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(x + h2 * 28 + 2, y + h3 * 28 + 2, 1.8, 0, TAU); g.fill(); }
      if (h2 < 0.05) { g.fillStyle = 'rgba(150,200,235,.28)'; g.beginPath(); g.ellipse(x + 16, y + 16, 10, 6, h1 * 3, 0, TAU); g.fill(); }
      break;
    case 'volcanic':
      if (h1 < 0.1) { g.strokeStyle = 'rgba(255,110,40,.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 4, y + 6 + h2 * 20); g.lineTo(x + 14, y + 12 + h3 * 10); g.lineTo(x + 26, y + 6 + h2 * 20); g.stroke(); }
      if (h3 < 0.03) { g.fillStyle = 'rgba(255,170,60,.8)'; g.beginPath(); g.arc(x + h1 * 28 + 2, y + h2 * 28 + 2, 1.6, 0, TAU); g.fill(); }
      break;
  }
}
function buildChunk(cx, cy) {
  const c = document.createElement('canvas'); c.width = c.height = CPX;
  const g = c.getContext('2d'); g.scale(CPX / CH, CPX / CH);
  const B = S.content.biomes, W = N + 2, ids = [];
  for (let j = -1; j <= N; j++) for (let i = -1; i <= N; i++) ids.push(S.gen.biomeAt(cx * CH + i * T + T / 2, cy * CH + j * T + T / 2));
  const idAt = (i, j) => ids[(j + 1) * W + (i + 1)];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wx = cx * CH + i * T, wy = cy * CH + j * T; if (wx >= S.size || wy >= S.size) continue;
    const id = idAt(i, j), b = B[id], tx = (wx / T) | 0, ty = (wy / T) | 0;
    // low-frequency patches + fine grain => natural look instead of a checkerboard
    g.fillStyle = shade(b.c, (hash2(tx >> 2, ty >> 2, 3) - 0.5) * 0.06 + (hash2(tx, ty, 7) - 0.5) * 0.035);
    g.fillRect(i * T, j * T, T + 1, T + 1);
  }
  // soft edges: blend neighbour biome colour into the border
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const id = idAt(i, j); const x = i * T, y = j * T;
    for (const [dx, dy] of dirs) {
      const nid = idAt(i + dx, j + dy); if (nid === id) continue;
      const nb = B[nid]; const S2 = 11;
      const x0 = dx > 0 ? x + T : dx < 0 ? x : x, y0 = dy > 0 ? y + T : dy < 0 ? y : y;
      const gr = g.createLinearGradient(x0, y0, x0 - dx * S2, y0 - dy * S2);
      gr.addColorStop(0, rgba(nb.c, 0.7)); gr.addColorStop(1, rgba(nb.c, 0));
      g.fillStyle = gr; g.fillRect(x, y, T, T);
    }
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wx = cx * CH + i * T, wy = cy * CH + j * T; if (wx >= S.size || wy >= S.size) continue;
    const id = idAt(i, j); deco(g, id, i * T, j * T, (wx / T) | 0, (wy / T) | 0, S.content.biomes[id]);
  }
  return c;
}
function getChunk(cx, cy) {
  const k = cx * 1000 + cy; let c = chunks.get(k);
  if (!c) { c = buildChunk(cx, cy); chunks.set(k, c); if (chunks.size > 40) chunks.delete(chunks.keys().next().value); }
  else { chunks.delete(k); chunks.set(k, c); } // LRU touch
  return c;
}

// ---------------------------------------------------------------- primitives
function ball(x, y, r, col, outline) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, shade(col, 0.28)); g.addColorStop(1, shade(col, -0.22));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (outline) { ctx.lineWidth = 2.5; ctx.strokeStyle = outline; ctx.stroke(); }
}
function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.78, r * 0.95, r * 0.42, 0, 0, TAU); ctx.fill(); }
function emoji(e, x, y, size) { ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); }
function hpBar(x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y, w, 7, 3); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x - w / 2 + 1, y + 1, Math.max(0, (w - 2) * frac), 5, 2); ctx.fill();
}
const darkness = () => Math.max(0, Math.min(0.78, 0.35 - Math.cos(TAU * (S.dayTime - 0.25)) * 0.6));

// ---------------------------------------------------------------- resource nodes
function drawNode(r, def, t) {
  const hit = S.resHit.get(r.id); let sx = 0, flash = 0;
  if (hit && hit.t < 0.18) { sx = Math.sin(hit.t * 80) * 3 * (1 - hit.t / 0.18); flash = 1 - hit.t / 0.18; }
  const x = r.x + sx, y = r.y, R = def.r, sway = (def.s === 'tree' || def.s === 'bush') ? Math.sin(t * 1.6 + r.x * 0.013) * 0.035 : 0;
  shadow(x, y, R * 0.95);
  const img = A.node(r.type);
  if (img) {
    const h = R * 2 * (cfgA.nodeScale[def.s] || 2.2), w = h * img.width / img.height;
    ctx.save(); ctx.translate(x, y + R * 0.9); ctx.rotate(sway); ctx.drawImage(img, -w / 2, -h, w, h);
    if (flash) { ctx.globalAlpha = flash * 0.5; ctx.drawImage(A.silhouette(img, 'n' + r.type), -w / 2, -h, w, h); ctx.globalAlpha = 1; }
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(x, y + R * 0.6); ctx.rotate(sway); ctx.translate(0, -R * 0.6);
    switch (def.s) {
      case 'tree':
        ctx.fillStyle = def.c2; ctx.beginPath(); ctx.roundRect(-R * 0.16, 0, R * 0.32, R * 0.9, 4); ctx.fill();
        ball(-R * 0.35, -R * 0.1, R * 0.62, def.c); ball(R * 0.35, -R * 0.1, R * 0.62, def.c); ball(0, -R * 0.45, R * 0.72, def.c); break;
      case 'rock':
        ball(0, 0, R, def.c, 'rgba(0,0,0,.28)'); ball(-R * 0.3, -R * 0.3, R * 0.38, def.c2);
        if (def.c2 === '#ffe27a') { ctx.fillStyle = '#e8e8f0'; ctx.fillRect(-3, -R - 14, 6, 30); ctx.fillStyle = '#ffe27a'; ctx.fillRect(-11, -R + 4, 22, 5); } break;
      case 'ore':
        ball(0, 0, R, def.c, 'rgba(0,0,0,.28)');
        for (let i = 0; i < 5; i++) { const a = i * 1.3 + r.id, d = R * (0.3 + 0.2 * ((i * 7) % 3) / 2); ball(Math.cos(a) * d, Math.sin(a) * d, R * 0.2, def.c2); }
        break;
      case 'bush': ball(0, 0, R, def.c, 'rgba(0,0,0,.2)'); for (let i = 0; i < 6; i++) { ctx.fillStyle = def.c2; ctx.beginPath(); ctx.arc(Math.cos(i * 1.05) * R * 0.55, Math.sin(i * 1.05) * R * 0.55, 3.6, 0, TAU); ctx.fill(); } break;
      case 'cactus': ctx.fillStyle = def.c; ctx.strokeStyle = def.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-R * 0.4, -R, R * 0.8, R * 2, 9); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(R * 0.3, -R * 0.25, R * 0.55, R * 0.32, 6); ctx.fill(); ctx.stroke(); break;
      case 'crystal': {
        const gr = ctx.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, def.c2); gr.addColorStop(1, def.c);
        ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -R * 1.25); ctx.lineTo(R * 0.7, 0); ctx.lineTo(0, R * 0.85); ctx.lineTo(-R * 0.7, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -R * 1.25); ctx.lineTo(0, R * 0.85); ctx.stroke(); break;
      }
      default: ball(0, 0, R, def.c);
    }
    if (flash) { ctx.globalAlpha = flash * 0.45; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  if (hit && hit.t < 3 && hit.hp > 0) hpBar(x, y + R + 8, 46, hit.hp / hit.max, '#7ad06a');
}

// ---------------------------------------------------------------- mobs
const BLOBS = new Set(['slime', 'slime_king', 'toad', 'void_horror', 'celestial_guardian']);
function drawMob(m, t) {
  const def = S.content.mobs[m.type]; if (!def) return;
  const R = def.r, shiny = m.fl & 8, a = m.angle || 0, air = m.air || 0;
  const move = Math.min(1, m.sp / 50);
  if (Math.cos(a) > 0.2) m.face = 1; else if (Math.cos(a) < -0.2) m.face = -1;
  const lift = air * 120;
  ctx.globalAlpha = Math.max(0.35, 1 - air * 0.3); shadow(m.x, m.y, R * (1 - Math.min(0.5, air * 0.2))); ctx.globalAlpha = 1;
  if (def.b) { ctx.globalAlpha = 0.22 + 0.1 * Math.sin(t * 4); ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(m.x, m.y, R * 1.3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  const hop = BLOBS.has(m.type) ? Math.abs(Math.sin(m.ph * 0.9)) * move : 0;
  const bobY = -hop * R * 0.45 - (air ? lift : 0) + (m.type === 'demon_eye' || m.type === 'eye_of_dread' ? Math.sin(t * 3 + m.id) * 5 : 0);
  const sq = BLOBS.has(m.type) ? 1 + (hop > 0.7 ? -0.08 : 0.1 * (1 - hop)) : 1 + Math.sin(m.ph) * 0.03 * move;
  ctx.save(); ctx.translate(m.x, m.y + bobY); ctx.scale(sq, 2 - sq);
  const img = A.mob(m.type);
  if (img) {
    const mode = cfgA.overrides[m.type] || cfgA.mode, bb = A.contentBox(img, 'm' + m.type);
    const size = R * 2.3 * (cfgA.scale[m.type] || 1) / Math.max(bb.w * img.width, bb.h * img.height) * img.width;   // visible art == hitbox (+15%), whatever padding the PNG has
    const sw = size, sh = size * img.height / img.width, ox = -sw * bb.cx, oy = -sh * bb.cy;
    if (mode === 'flip') { if (m.face < 0) ctx.scale(-1, 1); } else if (mode === 'rotate') ctx.rotate(a);
    ctx.drawImage(img, ox, oy, sw, sh);
    if (m.flash > 0) { ctx.globalAlpha = m.flash * 0.75; ctx.drawImage(A.silhouette(img, 'm' + m.type), ox, oy, sw, sh); ctx.globalAlpha = 1; }
  } else {
    ball(0, 0, R, def.c, shiny ? '#ffd23f' : 'rgba(0,0,0,.4)'); emoji(def.e, 0, 1, R * 1.25);
    if (m.flash > 0) { ctx.globalAlpha = m.flash * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  }
  if (shiny) { ctx.globalAlpha = 0.55 + 0.4 * Math.sin(t * 8); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, TAU); ctx.stroke(); emoji('✨', R * 0.7, -R * 0.7, 18); ctx.globalAlpha = 1; }
  ctx.restore();
  if (air > 0) { // balloon
    const bx = m.x + Math.sin(t * 2 + m.id) * 6, by = m.y + bobY - R * 1.5 - 30, col = ['#e0245e', '#2f6bff', '#ffd23f', '#7bff5a', '#a45cff'][m.id % 5];
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by + 28); ctx.lineTo(m.x, m.y + bobY - R * 0.8); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by, 20, 25, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(bx - 7, by - 9, 5, 8, -0.4, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - 4, by + 24); ctx.lineTo(bx + 4, by + 24); ctx.lineTo(bx, by + 30); ctx.fill();
    return;
  }
  if (m.fl & 1) emoji('🔥', m.x, m.y - R - 8, 16);
  if (m.fl & 2) emoji('☠️', m.x - 12, m.y - R - 8, 14);
  if (m.fl & 4) emoji('❄️', m.x + 12, m.y - R - 8, 14);
  if (m.hp < m.mhp || def.b) hpBar(m.x, m.y + R + 10, Math.max(42, R * 1.7), m.hp / m.mhp, def.b ? '#ff4d4d' : '#e55');
}

// ---------------------------------------------------------------- players (Terraria-style) + held weapon
const SWING = 0.2;
function weaponDrawer(held) {
  const it = held && S.content.items[held]; if (!it) return null;
  if (!it.w) return it.pl ? null : (c) => { c.rotate(0.5); emoji(it.e, 4, -2, 20); };
  const ws = A.weapon(held), sz = it.w.rng ? Math.max(34, Math.min(170, (it.w.rng - 16) / 0.8)) : 48;   // sprite length = real reach: what you see is what hits
  if (ws) return (c) => { const w = sz * ws.src.width / ws.src.height; if (ws.smooth) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; } c.drawImage(ws.src, -w * 0.2, -sz / 2, w, sz); c.imageSmoothingEnabled = false; };
  return (c) => { c.rotate(Math.PI / 4); emoji(it.e, 10, -6, Math.max(28, sz * 0.62)); };
}
export function drawPlayer(p, self, t, held) {
  const a = p.angle, dir = p.face || 1, items = S.content.items;
  let local = dir > 0 ? a : Math.PI - a; local = Math.atan2(Math.sin(local), Math.cos(local));
  const it = held ? items[held] : null, sw = S.swings.get(p.id);
  let off = 0, ext = 0;
  if (sw && sw.t < SWING) {
    const k = sw.t / SWING;
    if (sw.arc) {
      const e = 1 - Math.pow(1 - k, 3), half = sw.arc * Math.PI / 360;
      off = (dir > 0 ? 1 : -1) * (-half + e * 2 * half);
      ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = (1 - k) * 0.65; ctx.strokeStyle = it ? shade(it.c, 0.45) : '#fff'; ctx.lineWidth = 14 * (1 - k) + 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, sw.r * 0.8, Math.max(a - half, a + (dir > 0 ? off : -off) - 1.7), a + (dir > 0 ? off : -off)); ctx.stroke();
      ctx.globalAlpha = (1 - k) * 0.1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, sw.r, a - half, a + half); ctx.closePath(); ctx.fill(); ctx.restore();
    } else ext = (1 - k) * -0.25;
  }
  if (p.dash) for (let k = 1; k <= 3; k++) { ctx.globalAlpha = 0.16 / k; drawHuman(ctx, { x: p.x - dir * 14 * k, y: p.y + 24, look: p.look, dir, aim: local, phase: p.ph, move: 1, u: 2.5 }); }
  ctx.globalAlpha = 1;
  drawHuman(ctx, { x: p.x, y: p.y + 24, look: p.look, dir, aim: local + off + ext, phase: p.ph, move: Math.min(1, p.sp / 120), weapon: weaponDrawer(held), flash: p.flash, hat: p.hat, u: 2.5 });
  if (p.fl & 1) emoji('🔥', p.x, p.y - 44, 16);
  if (!self) {
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
    const label = `${p.name || ''}  Lv${p.lv || 1}`; ctx.strokeText(label, p.x, p.y - 52); ctx.fillText(label, p.x, p.y - 52);
    hpBar(p.x, p.y - 48, 50, p.hp / p.mhp, '#5fd35f');
  }
}
function drawNpc(n, t) {
  const near = Math.hypot(n.x - S.me.x, n.y - S.me.y) < 220;
  drawHuman(ctx, { x: n.x, y: n.y + 24, look: n.look, dir: Math.cos(t * 0.3 + n.x) > 0 ? 1 : -1, aim: 0.5, phase: 0, move: 0, hat: n.hat, u: 2.5 });
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
  ctx.strokeText(n.n, n.x, n.y - 50); ctx.fillText(n.n, n.x, n.y - 50);
  if (near) { ctx.fillStyle = '#fff'; ctx.strokeText('[T] Talk', n.x, n.y - 66); ctx.fillText('[T] Talk', n.x, n.y - 66); }
}

// ---------------------------------------------------------------- projectiles (custom per kind)
function drawProj(e, t) {
  const r = e.r, k = e.kind || 'orb', col = e.color || '#fff', sp = (n) => Math.sin(t * n + e.id);
  const ang = e.angle || 0;
  if (['fire', 'ice', 'magic', 'void', 'soul', 'orb', 'star', 'beam', 'bfg', 'poison', 'gel'].includes(k) && Math.random() < 0.7) FX.trail(e.x, e.y, k === 'fire' ? (Math.random() < 0.5 ? '#ffd23f' : '#ff7a1a') : col, k === 'bfg' ? 6 : 3);
  ctx.save(); ctx.translate(e.x, e.y);
  const glow = (rad, c, al) => { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 1, 0, 0, rad); g.addColorStop(0, rgba(c, al)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; };
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const rot = () => ctx.rotate(ang);
  switch (k) {
    case 'arrow': case 'bolt': case 'thorn': {
      rot(); const L = k === 'bolt' ? 15 : k === 'thorn' ? 13 : 22, hs = k === 'bolt' ? 1.15 : 1;
      rect(-L, -1.3, L + 3, 2.6, k === 'thorn' ? '#2f5a1e' : k === 'bolt' ? '#5a4a3a' : '#a07a48'); rect(-L, -1.3, L + 3, 1, k === 'thorn' ? '#5a9a3a' : '#d8b880');
      ctx.fillStyle = '#1a1420'; ctx.beginPath(); ctx.moveTo(L + 1, -4.6 * hs); ctx.lineTo(L + 12 * hs, 0); ctx.lineTo(L + 1, 4.6 * hs); ctx.lineTo(L + 4, 0); ctx.fill();
      ctx.fillStyle = k === 'thorn' ? '#a8f060' : '#e6eaf2'; ctx.beginPath(); ctx.moveTo(L + 2, -3.4 * hs); ctx.lineTo(L + 10 * hs, 0); ctx.lineTo(L + 2, 3.4 * hs); ctx.lineTo(L + 4.5, 0); ctx.fill();
      const fc = e.hostile ? '#d8604a' : '#f4f4f4'; ctx.fillStyle = fc; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L - 7, sy * 4.6); ctx.lineTo(-L + 1, sy * 4.6); ctx.lineTo(-L + 5, sy * 1.2); ctx.closePath(); ctx.fill(); }
      if (k === 'bolt') glow(16, col, 0.5);
      break; }
    case 'wave': {
      rot(); const R = r * 2.4; glow(r * 4.2, col, 0.5);
      const cres = (x, sc) => { ctx.beginPath(); ctx.moveTo(x - R * 0.35, -R * 1.25 * sc); ctx.quadraticCurveTo(x + R * 1.9, 0, x - R * 0.35, R * 1.25 * sc); ctx.quadraticCurveTo(x + R * 0.55, 0, x - R * 0.35, -R * 1.25 * sc); ctx.closePath(); };
      for (let i = 3; i >= 1; i--) { ctx.globalAlpha = 0.16 * (4 - i) / 3; ctx.fillStyle = col; cres(-i * r * 1.2, 1 - i * 0.07); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.fillStyle = col; cres(0, 1); ctx.fill(); ctx.strokeStyle = shade(col, 0.7); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-R * 0.35, -R * 1.25); ctx.quadraticCurveTo(R * 1.9, 0, -R * 0.35, R * 1.25); ctx.stroke();
      ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.ellipse(R * 0.55, 0, R * 0.55, R * 0.12, 0, 0, TAU); ctx.fill();
      if (Math.random() < 0.9) FX.trail(e.x - Math.cos(ang) * R, e.y - Math.sin(ang) * R + (Math.random() - 0.5) * R * 1.6, col, 3);
      break; }
    case 'star': { ctx.rotate(t * 14 + e.id); glow(r * 2.4, col, 0.5); ctx.fillStyle = '#e8ecf4'; ctx.strokeStyle = '#1a1420'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.55 : r * 1.5, an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); break; }
    case 'page': { ctx.rotate(t * 10 + e.id); glow(r * 2.2, col, 0.45); rect(-r, -r * 1.2, r * 2, r * 2.4, '#f6f0dc'); rect(-r, -r * 1.2, r * 2, 1.5, '#a89a70'); rect(-r * 0.7, -r * 0.5, r * 1.4, 1.2, '#7a6a40'); rect(-r * 0.7, r * 0.1, r * 1.1, 1.2, '#7a6a40'); break; }
    case 'fire': { rot(); glow(r * 3.2, '#ff7a1a', 0.6); const f = 1 + sp(30) * 0.15; ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.moveTo(-r * 2.6 * f, 0); ctx.quadraticCurveTo(-r, -r * 1.2, r * 1.2, 0); ctx.quadraticCurveTo(-r, r * 1.2, -r * 2.6 * f, 0); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-r * 1.4, 0); ctx.quadraticCurveTo(-r * 0.4, -r * 0.7, r * 0.8, 0); ctx.quadraticCurveTo(-r * 0.4, r * 0.7, -r * 1.4, 0); ctx.fill(); break; }
    case 'ice': { rot(); glow(r * 2.6, '#9be7ff', 0.5); ctx.fillStyle = '#bff3ff'; ctx.strokeStyle = '#4a9bff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r * 2, 0); ctx.lineTo(0, -r * 0.9); ctx.lineTo(-r * 1.6, 0); ctx.lineTo(0, r * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); break; }
    case 'poison': case 'gel': case 'egg': { const sq = 1 + sp(12) * 0.08; ctx.scale(sq, 2 - sq); glow(r * 2.2, col, 0.35); ctx.fillStyle = k === 'egg' ? '#fff6d6' : col; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0, 0, r * (k === 'egg' ? 1 : 1.2), r * (k === 'egg' ? 1.3 : 1), 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.4, r * 0.3, 0, TAU); ctx.fill(); break; }
    case 'bone': { ctx.rotate(t * 12 + e.id); rect(-r * 1.4, -1.6, r * 2.8, 3.2, '#ece7d6'); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.fillStyle = '#ece7d6'; ctx.beginPath(); ctx.arc(sx * r * 1.4, sy * 2.2, 2.6, 0, TAU); ctx.fill(); } break; }
    case 'eye': { glow(r * 2.2, '#ff5a5a', 0.35); ctx.fillStyle = '#f4ece4'; ctx.strokeStyle = '#7a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2f6bd8'; ctx.beginPath(); ctx.arc(Math.cos(ang) * r * 0.4, Math.sin(ang) * r * 0.4, r * 0.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(Math.cos(ang) * r * 0.5, Math.sin(ang) * r * 0.5, r * 0.28, 0, TAU); ctx.fill(); break; }
    case 'soul': { rot(); glow(r * 3, col, 0.5); ctx.globalAlpha = 0.85; ctx.fillStyle = '#e8d8ff'; ctx.beginPath(); ctx.arc(r * 0.3, 0, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(-r * 2.6, 0); ctx.lineTo(0, -r * 0.9); ctx.lineTo(0, r * 0.9); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#1a0a2a'; ctx.fillRect(r * 0.3, -r * 0.4, 2, 2); ctx.fillRect(r * 0.3, r * 0.2, 2, 2); break; }
    case 'void': { glow(r * 3, '#9a4aff', 0.6); ctx.fillStyle = '#05000a'; ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b06aff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 1.4, t * 9, t * 9 + 4.2); ctx.stroke(); break; }
    case 'beam': { rot(); glow(r * 3, col, 0.5); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, r * 3, r * 0.9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, r * 2.2, r * 0.4, 0, 0, TAU); ctx.fill(); break; }
    case 'bfg': { glow(r * 3, '#7dff3a', 0.7); ctx.fillStyle = '#7dff3a'; ctx.strokeStyle = '#1a4a08'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#eaffd0'; ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.45, 0, TAU); ctx.fill(); ctx.strokeStyle = '#eaffd0'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const an = t * 6 + i * 2.1; ctx.beginPath(); ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r); ctx.lineTo(Math.cos(an + 0.3) * r * 1.7, Math.sin(an + 0.3) * r * 1.7); ctx.stroke(); } break; }
    case 'duck': { ctx.rotate(Math.sin(t * 20 + e.id) * 0.4); emoji('🦆', 0, 0, r * 2.6); break; }
    case 'cube': { ctx.rotate(t * 5 + e.id); rect(-r, -r, r * 2, r * 2, '#d8dce4'); rect(-r, -r, r * 2, 2, '#fff'); rect(-r, r - 2, r * 2, 2, '#8a92a0'); ctx.strokeStyle = '#6a727e'; ctx.lineWidth = 1.5; ctx.strokeRect(-r, -r, r * 2, r * 2); ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill(); break; }
    case 'bomb': { ctx.fillStyle = '#44cc44'; ctx.strokeStyle = '#1a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(-1 + sp(40) * 2, -r - 6, 3, 3); glow(8, '#ffd23f', 0.8); break; }
    default: { glow(r * 2.8, col, 0.65); ctx.fillStyle = shade(col, 0.5); ctx.strokeStyle = e.hostile ? 'rgba(120,0,0,.9)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * (1 + sp(14) * 0.08), 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- boss attack warnings
function drawTele(f, t) {
  const p = Math.min(1, f.t / f.d), pulse = 0.5 + 0.5 * Math.sin(f.t * 18);
  ctx.save(); ctx.translate(f.x, f.y);
  if (f.k === 'charge') {
    ctx.rotate(f.a); const len = f.len, w = f.w;
    ctx.fillStyle = `rgba(255,50,50,${0.10 + 0.14 * p})`; ctx.fillRect(0, -w / 2, len, w);
    ctx.strokeStyle = `rgba(255,90,90,${0.55 + 0.35 * pulse})`; ctx.lineWidth = 3; ctx.setLineDash([16, 10]); ctx.strokeRect(0, -w / 2, len, w); ctx.setLineDash([]);
    const n = Math.max(3, Math.floor(len / 70)); ctx.fillStyle = `rgba(255,${120 - 60 * p | 0},70,${0.55 + 0.35 * p})`;
    for (let i = 0; i < n; i++) { const x = ((i + (f.t * 2.2) % 1) / n) * len; ctx.beginPath(); ctx.moveTo(x - 18, -w * 0.28); ctx.lineTo(x + 6, 0); ctx.lineTo(x - 18, w * 0.28); ctx.lineTo(x - 8, 0); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(len + 30, 0); ctx.lineTo(len - 14, -w * 0.5); ctx.lineTo(len - 14, w * 0.5); ctx.closePath(); ctx.fillStyle = `rgba(255,70,70,${0.4 + 0.4 * pulse})`; ctx.fill();
  } else if (f.k === 'aim') {
    ctx.rotate(f.a); ctx.strokeStyle = f.small ? `rgba(255,220,160,${0.18 + 0.5 * p})` : `rgba(255,110,60,${0.45 + 0.4 * pulse})`; ctx.lineWidth = f.small ? 2 : 3; ctx.setLineDash(f.small ? [8, 8] : [14, 10]);
    for (let i = 0; i < f.n; i++) { const off = f.n > 1 ? (i / (f.n - 1) - 0.5) * f.spread : 0; ctx.save(); ctx.rotate(off); ctx.beginPath(); ctx.moveTo(f.r, 0); ctx.lineTo(f.len || 760, 0); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([]);
  } else {
    const rad = f.r + 40 + (1 - p) * 90; ctx.strokeStyle = `rgba(255,120,60,${0.35 + 0.5 * p})`; ctx.lineWidth = 4 + 6 * p; ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(255,120,60,${0.08 * p})`; ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- private island ground
const grassPat = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#6dbb4a'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 160; i++) { const x = (i * 53) % 128, y = (i * 97) % 128, h = ((i * 31) % 7); g.fillStyle = h < 2 ? '#7acb55' : h < 5 ? '#5da83e' : '#68b445'; g.fillRect(x, y, 3 + h % 3, 3); } for (let i = 0; i < 9; i++) { g.fillStyle = ['#fff3a8', '#ffb3d1', '#ffffff'][i % 3]; g.fillRect((i * 41) % 124, (i * 67) % 124, 3, 3); } return c; })();
function drawIslandGround(cam, w, h, scale, t, x0, y0, x1, y1) {
  const IC = S.cfg.isl / 2, R = S.cfg.islR;
  ctx.fillStyle = '#2f78b8'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3;
  for (let y = Math.floor(y0 / 40) * 40; y < y1; y += 40) { ctx.beginPath(); for (let x = x0 - 30; x < x1 + 30; x += 30) { const yy = y + Math.sin(x * 0.02 + t * 1.4 + y * 0.05) * 4; if (x === x0 - 30) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(IC, IC, R + 46 + Math.sin(t * 1.5) * 4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ead9a0'; ctx.beginPath(); ctx.arc(IC, IC, R + 34, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(IC, IC, R, 0, TAU); ctx.clip(); ctx.fillStyle = ctx.createPattern(grassPat, 'repeat'); ctx.fillRect(IC - R, IC - R, R * 2, R * 2); ctx.restore();
  ctx.strokeStyle = '#4a8a32'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(IC, IC, R, 0, TAU); ctx.stroke();
}


// ---------------------------------------------------------------- structures
function structBody(type, d0, x, y, t, alpha, id) {
  const R = d0.r, col = d0.c;
  ctx.globalAlpha = alpha;
  const img = A.struct(type);
  if (img) { const h = R * 2.5, w = h * img.width / img.height; ctx.drawImage(img, x - w / 2, y - h / 2 - R * 0.15, w, h); ctx.globalAlpha = 1; return; }
  switch (d0.t) {
    case 'station': ctx.fillStyle = shade(col, -0.25); ctx.beginPath(); ctx.roundRect(x - R, y - R * 0.8, R * 2, R * 1.7, 8); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - R, y - R, R * 2, R * 1.6, 8); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke(); emoji(d0.e, x, y - R * 0.2, R * 1.1); break;
    case 'wall': ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - R, y - R, R * 2, R * 2, 6); ctx.fill(); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = 2; for (const k of [-0.33, 0.33]) { ctx.beginPath(); ctx.moveTo(x - R, y + R * k); ctx.lineTo(x + R, y + R * k); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x, y - R); ctx.lineTo(x, y - R * 0.33); ctx.moveTo(x - R * 0.5, y - R * 0.33); ctx.lineTo(x - R * 0.5, y + R * 0.33); ctx.moveTo(x + R * 0.5, y - R * 0.33); ctx.lineTo(x + R * 0.5, y + R * 0.33); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.roundRect(x - R, y - R, R * 2, R * 2, 6); ctx.stroke(); break;
    case 'spike': ctx.fillStyle = shade(col, -0.3); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.fillStyle = col; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(x + Math.cos(a - 0.3) * R * 0.5, y + Math.sin(a - 0.3) * R * 0.5); ctx.lineTo(x + Math.cos(a) * R * 1.12, y + Math.sin(a) * R * 1.12); ctx.lineTo(x + Math.cos(a + 0.3) * R * 0.5, y + Math.sin(a + 0.3) * R * 0.5); ctx.fill(); } ctx.fillStyle = shade(col, 0.3); ctx.beginPath(); ctx.arc(x, y, R * 0.28, 0, TAU); ctx.fill(); break;
    case 'trap': ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, R * 0.75, 0, TAU); ctx.stroke(); ctx.fillStyle = shade(col, -0.2); for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 0.75, y + Math.sin(a) * R * 0.75); ctx.lineTo(x + Math.cos(a + 0.15) * R * 0.3, y + Math.sin(a + 0.15) * R * 0.3); ctx.lineTo(x + Math.cos(a + 0.3) * R * 0.75, y + Math.sin(a + 0.3) * R * 0.75); ctx.fill(); } break;
    case 'fire': { ctx.fillStyle = '#5a3b20'; for (const a of [0.5, 2.1, 3.7]) { ctx.save(); ctx.translate(x, y + 6); ctx.rotate(a); ctx.fillRect(-R * 0.9, -3, R * 1.8, 6); ctx.restore(); }
      const fl = 1 + Math.sin(t * 12 + (id || 0)) * 0.12; ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x - R * 0.45, y + 6); ctx.quadraticCurveTo(x - R * 0.2, y - R * 1.0 * fl, x, y - R * 1.15 * fl); ctx.quadraticCurveTo(x + R * 0.3, y - R * 0.5, x + R * 0.45, y + 6); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(x - R * 0.22, y + 6); ctx.quadraticCurveTo(x, y - R * 0.7 * fl, x + R * 0.22, y + 6); ctx.fill(); break; }
    default: ball(x, y, R, col);
  }
  ctx.globalAlpha = 1;
}
function drawStruct(st, d0, t) {
  const hit = S.structHit.get(st.id); let sx = 0;
  if (hit && hit.t < 0.15) sx = Math.sin(hit.t * 90) * 2.5 * (1 - hit.t / 0.15);
  if (d0.t !== 'trap' && d0.t !== 'fire') shadow(st.x, st.y, d0.r);
  structBody(st.type, d0, st.x + sx, st.y, t, 1, st.id);
  if (hit && hit.t < 0.1) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x, st.y, d0.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (st.hp < st.max) hpBar(st.x, st.y + d0.r + 6, Math.max(36, d0.r * 1.6), st.hp / st.max, '#e0a23a');
  if (st.owner === S.id && d0.t === 'station') { ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText(d0.n, st.x, st.y + d0.r + 20); }
}
function drawGhost(g, t, me) {
  const d0 = S.content.structures[g.type]; if (!d0) return;
  ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(me.x, me.y, S.cfg.build, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  structBody(g.type, d0, g.x, g.y, t, 0.62, 0);
  ctx.globalAlpha = 0.5; ctx.fillStyle = g.ok ? 'rgba(80,255,120,.35)' : 'rgba(255,60,60,.45)'; ctx.strokeStyle = g.ok ? '#6dff8a' : '#ff5a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
  if (d0.hr) { ctx.strokeStyle = 'rgba(255,160,60,.4)'; ctx.beginPath(); ctx.arc(g.x, g.y, d0.hr, 0, TAU); ctx.stroke(); }
}

// ---------------------------------------------------------------- hitbox overlay (F3)
function drawDebug(me, ang, held) {
  ctx.save(); ctx.lineWidth = 1.5; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  const circ = (x, y, r, c) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); };
  for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d) { circ(m.x, m.y, d.r, '#ff4d4d'); ctx.fillStyle = '#ff9a9a'; ctx.fillText(m.type, m.x, m.y - d.r - 4); } }
  for (const p of S.players.values()) circ(p.x, p.y, S.cfg.radius, '#4aa8ff');
  circ(me.x, me.y, S.cfg.radius, '#7dff7d');
  for (const e of S.projs.values()) circ(e.x, e.y, e.r, e.hostile ? '#ff8a3a' : '#ffe14a');
  for (const st of S.structs.values()) { const d = S.content.structures[st.type]; if (d) circ(st.x, st.y, d.r, '#c9a3ff'); }
  const it = held && S.content.items[held];
  if (it && it.w && it.w.rng) { const half = it.w.arc * Math.PI / 360; ctx.strokeStyle = '#7dff7d'; ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.arc(me.x, me.y, it.w.rng, ang - half, ang + half); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- main render
export function render(dt, t, me, myAngle, myHeld, lead) {
  const w = innerWidth, h = innerHeight;
  const scale = Math.max(0.5, Math.min(1.6, Math.min(w / 1300, h / 760)));
  const cam = S.cam;
  const tx = me.x + lead.x / scale, ty = me.y + lead.y / scale;
  if (!cam.init) { cam.x = tx; cam.y = ty; cam.init = true; }
  const ck = 1 - Math.exp(-dt * 11); cam.x += (tx - cam.x) * ck; cam.y += (ty - cam.y) * ck; cam.scale = scale;
  const sm = FX.shake.m, shx = (Math.random() - 0.5) * sm * 2, shy = (Math.random() - 0.5) * sm * 2;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0b0d14'; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(w / 2 + shx, h / 2 + shy); ctx.scale(scale, scale); ctx.translate(-cam.x, -cam.y);
  const vw = w / scale / 2 + 100, vh = h / scale / 2 + 100;
  const x0 = cam.x - vw, x1 = cam.x + vw, y0 = cam.y - vh, y1 = cam.y + vh;

  const island = S.room.kind === 'island';
  if (island) drawIslandGround(cam, w, h, scale, t, x0, y0, x1, y1);
  else {
    for (let cy = Math.max(0, Math.floor(y0 / CH)); cy <= Math.min(Math.floor((S.size - 1) / CH), Math.floor(y1 / CH)); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / CH)); cx <= Math.min(Math.floor((S.size - 1) / CH), Math.floor(x1 / CH)); cx++)
        ctx.drawImage(getChunk(cx, cy), cx * CH, cy * CH, CH + 0.6, CH + 0.6);
    ctx.strokeStyle = 'rgba(255,90,90,.5)'; ctx.lineWidth = 8; ctx.strokeRect(0, 0, S.size, S.size);
    const sg = ctx.createRadialGradient(S.size / 2, S.size / 2, S.cfg.safe * 0.6, S.size / 2, S.size / 2, S.cfg.safe);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,255,255,.09)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(S.size / 2, S.size / 2, S.cfg.safe, 0, TAU); ctx.fill();
    ctx.setLineDash([16, 14]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
  }
  for (const f of S.tele) drawTele(f, t);

  // drops
  for (const d of S.drops) {
    const it = S.content.items[d[1]]; if (!it) continue;
    const bob = Math.sin(t * 4 + d[0]) * 3;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(d[3], d[4] + 14, 11, 4, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(d[3], d[4] + bob, 2, d[3], d[4] + bob, 22); gg.addColorStop(0, rgba(it.c, 0.5)); gg.addColorStop(1, rgba(it.c, 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(d[3], d[4] + bob, 22, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    const ws = it.w ? A.weapon(d[1]) : A.get('items/' + d[1]);
    if (ws) { const src = it.w ? ws.src : ws, sz = 30; ctx.drawImage(src, d[3] - sz / 2, d[4] + bob - sz / 2, sz * src.width / src.height, sz); } else emoji(it.e, d[3], d[4] + bob, 22);
    if (d[2] > 1) { ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(d[2], d[3] + 13, d[4] + 15 + bob); ctx.fillText(d[2], d[3] + 13, d[4] + 15 + bob); }
  }

  // y-sorted world
  const ents = [], under = [];
  if (!island) nearRes(cam.x, cam.y, Math.hypot(vw, vh) + 60, (r) => {
    if (!r.alive || r.x < x0 - 80 || r.x > x1 + 80 || r.y < y0 - 80 || r.y > y1 + 120) return;
    const def = S.content.nodes[r.type]; if (def) ents.push([r.y, () => drawNode(r, def, t)]);
  });
  const lights = [];
  for (const st of S.structs.values()) {
    const d0 = S.content.structures[st.type]; if (!d0 || st.x < x0 - 80 || st.x > x1 + 80 || st.y < y0 - 80 || st.y > y1 + 80) continue;
    if (d0.t === 'fire') lights.push(st);
    if (d0.t === 'trap' || d0.t === 'fire') under.push(() => drawStruct(st, d0, t)); else ents.push([st.y, () => drawStruct(st, d0, t)]);
  }
  for (const f of under) f();
  for (const m of S.mobs.values()) ents.push([m.y, () => drawMob(m, t)]);
  for (const p of S.players.values()) ents.push([p.y, () => drawPlayer(p, false, t, p.held)]);
  if (!island) for (const n of S.npcs) ents.push([n.y, () => drawNpc(n, t)]);
  if (!S.dead) ents.push([me.y, () => drawPlayer({ id: S.id, x: me.x, y: me.y, angle: myAngle, face: me.face, fl: 0, dash: me.dashLeft > 0, sp: me.sp, ph: me.ph, look: S.look, flash: 0 }, true, t, myHeld)]);
  ents.sort((a, b) => a[0] - b[0]); for (const e of ents) e[1]();

  for (const e of S.projs.values()) drawProj(e, t);

  FX.draw(ctx);
  if (S.debug) drawDebug(me, myAngle, myHeld);

  // popups & telegraphs
  for (const f of S.fx) {
    if (f.k === 'dmg') {
      const a = Math.max(0, 1 - f.t), pop = 1 + 0.6 * Math.max(0, 1 - f.t * 7), size = (14 + Math.min(16, f.v / 4)) * pop * (f.crit ? 1.35 : 1);
      ctx.globalAlpha = a; ctx.font = `800 ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.fillStyle = f.me ? '#ff6a6a' : (f.crit ? '#ffb02e' : '#ffe27a');
      const px = f.x + f.rx, py = f.y - f.t * 46; ctx.strokeText(f.v, px, py); ctx.fillText(f.v, px, py); ctx.globalAlpha = 1;
    } else if (f.k === 'heal') {
      const a = Math.max(0, 1 - f.t); ctx.globalAlpha = a; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.fillStyle = '#7dff8a'; const py = f.y - 20 - f.t * 40; ctx.strokeText('+' + f.v, f.x, py); ctx.fillText('+' + f.v, f.x, py); ctx.globalAlpha = 1;
    } else if (f.k === 'clang') {
      const a = Math.max(0, 1 - f.t * 3); ctx.globalAlpha = a; ctx.font = '800 15px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff'; ctx.strokeText('BLOCKED', f.x, f.y - 14 - f.t * 20); ctx.fillText('BLOCKED', f.x, f.y - 14 - f.t * 20); ctx.globalAlpha = 1;
    } else if (f.k === 'ring') {
      const prog = Math.min(1, f.t / (f.d || 1));
      ctx.globalAlpha = 0.55; ctx.fillStyle = 'rgba(255,40,40,.16)'; ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,40,40,.3)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * prog, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // lighting / night
  const dk = island ? 0 : darkness();
  if (dk > 0.01) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 90 * scale, w / 2, h / 2, 560 * scale);
    g.addColorStop(0, `rgba(5,8,34,${dk * 0.22})`); g.addColorStop(1, `rgba(5,8,34,${dk})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  if (lights.length) {
    ctx.globalCompositeOperation = 'lighter';
    for (const st of lights) {
      const sx = (st.x - cam.x) * scale + w / 2, sy = (st.y - cam.y) * scale + h / 2, rr = (230 + Math.sin(t * 9 + st.id) * 12) * scale;
      const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, rr); g.addColorStop(0, `rgba(255,170,70,${0.12 + dk * 0.55})`); g.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // damage flash + low hp vignette
  if (me.flash > 0) { ctx.fillStyle = `rgba(255,0,0,${me.flash * 0.22})`; ctx.fillRect(0, 0, w, h); }
  if (me.hp / me.mhp < 0.3 && !S.dead) { const pulse = 0.35 + 0.15 * Math.sin(t * 5); const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85); g.addColorStop(0, 'rgba(180,0,0,0)'); g.addColorStop(1, `rgba(180,0,0,${pulse})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
}
