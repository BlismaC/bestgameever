import { S } from './state.js';
import * as A from './assets.js';
import * as FX from './fx.js';
import cfgA from './assetcfg.js';
import { nearRes } from './world.js';

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
function drawMob(m, t) {
  const def = S.content.mobs[m.type]; if (!def) return;
  const R = def.r, shiny = m.fl & 8, a = m.angle || 0;
  const move = Math.min(1, m.sp / 50), wob = Math.sin(m.ph) * 0.07 * move;
  shadow(m.x, m.y, R);
  if (def.b) { ctx.globalAlpha = 0.22 + 0.1 * Math.sin(t * 4); ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(m.x, m.y, R * 1.3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(m.x, m.y + Math.abs(Math.sin(m.ph)) * -2 * move); ctx.scale(1 + wob, 1 - wob);
  const img = A.mob(m.type);
  if (img) {
    const mode = cfgA.overrides[m.type] || cfgA.mode, h = R * 2 * (cfgA.scale[m.type] || 1.15), w = h * img.width / img.height;
    if (mode === 'flip') { if (Math.cos(a) < 0) ctx.scale(-1, 1); } else if (mode !== 'fixed') ctx.rotate(a);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    if (m.flash > 0) { ctx.globalAlpha = m.flash * 0.75; ctx.drawImage(A.silhouette(img, 'm' + m.type), -w / 2, -h / 2, w, h); ctx.globalAlpha = 1; }
  } else {
    ball(0, 0, R, def.c, shiny ? '#ffd23f' : 'rgba(0,0,0,.4)');
    emoji(def.e, 0, 1, R * 1.25);
    if (m.flash > 0) { ctx.globalAlpha = m.flash * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  }
  if (shiny) { ctx.globalAlpha = 0.55 + 0.4 * Math.sin(t * 8); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, TAU); ctx.stroke(); emoji('✨', R * 0.7, -R * 0.7, 18); ctx.globalAlpha = 1; }
  ctx.restore();
  if (m.fl & 1) emoji('🔥', m.x, m.y - R - 8, 16);
  if (m.fl & 2) emoji('☠️', m.x - 12, m.y - R - 8, 14);
  if (m.fl & 4) emoji('❄️', m.x + 12, m.y - R - 8, 14);
  if (m.hp < m.mhp || def.b) hpBar(m.x, m.y + R + 10, Math.max(42, R * 1.7), m.hp / m.mhp, def.b ? '#ff4d4d' : '#e55');
}

// ---------------------------------------------------------------- players + held weapon
const SWING = 0.2;
function drawPlayer(p, self, t) {
  const R = S.cfg.radius, a = p.angle, items = S.content.items;
  const move = Math.min(1, p.sp / 120), bob = Math.sin(p.ph) * 1.8 * move;
  shadow(p.x, p.y, R);
  if (p.dash) for (let k = 1; k <= 3; k++) { ctx.globalAlpha = 0.18 / k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x - Math.cos(a) * 18 * k, p.y - Math.sin(a) * 18 * k, R, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  const it = p.held ? items[p.held] : null;
  const melee = !!(it && it.w && it.w.rng > 0);
  const sw = S.swings.get(p.id);
  let off = 0, recoil = 0, ext = 0, k = 1;
  if (sw && sw.t < SWING) {
    k = sw.t / SWING;
    if (sw.arc) { const e = 1 - Math.pow(1 - k, 3), half = sw.arc * Math.PI / 360; off = -half + e * 2 * half; ext = Math.sin(k * Math.PI) * 10;
      // slash trail
      ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = (1 - k) * 0.65; ctx.strokeStyle = it ? shade(it.c, 0.45) : '#fff'; ctx.lineWidth = 16 * (1 - k) + 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, sw.r * 0.8, Math.max(a - half, a + off - 1.7), a + off); ctx.stroke();
      ctx.globalAlpha = (1 - k) * 0.1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, sw.r, a - half, a + half); ctx.closePath(); ctx.fill(); ctx.restore();
    } else recoil = (1 - k) * 8;
  }
  const wa = a + off;
  ctx.save(); ctx.translate(p.x, p.y + bob);
  // body
  const body = A.playerBody();
  if (body) { ctx.save(); ctx.rotate(a); const s = R * 2.3; ctx.drawImage(body, -s / 2, -s / 2, s * body.width / body.height, s); ctx.restore(); }
  else {
    const col = self ? '#ffd9a0' : `hsl(${(p.id * 47) % 360},65%,72%)`;
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.4, 2, 0, 0, R); g.addColorStop(0, '#fff8'); g.addColorStop(0.15, col); g.addColorStop(1, self ? '#d9a468' : `hsl(${(p.id * 47) % 360},55%,52%)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
    ctx.fillStyle = '#222'; for (const s of [-0.42, 0.42]) { ctx.beginPath(); ctx.arc(Math.cos(a + s) * 11, Math.sin(a + s) * 11, 3.4, 0, TAU); ctx.fill(); }
  }
  // back hand
  const hand = (ang, d) => { ball(Math.cos(ang) * d, Math.sin(ang) * d, 6.5, self ? '#ffd9a0' : '#cfe0ff', 'rgba(0,0,0,.45)'); };
  hand(a - 0.9, R + 2);
  // weapon
  const dist = R + 8 + ext - recoil;
  if (it && it.w) {
    const ws = A.weapon(p.held);
    ctx.save(); ctx.translate(Math.cos(wa) * dist, Math.sin(wa) * dist); ctx.rotate(wa);
    if (ws) { const sz = cfgA.weaponSize, w = sz * ws.src.width / ws.src.height; ctx.drawImage(ws.src, -w * 0.2, -sz / 2, w, sz); }
    else { ctx.rotate(Math.PI / 4); emoji(it.e, 6, -6, 38); }
    ctx.restore();
  } else if (it) { ctx.save(); ctx.translate(Math.cos(wa) * dist, Math.sin(wa) * dist); emoji(it.e, 0, 0, 26); ctx.restore(); }
  hand(wa + 0.15, R + 4 + ext * 0.6 - recoil);
  ctx.restore();
  if (p.fl & 1) emoji('🔥', p.x, p.y - R - 12, 16);
  if (!self) {
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
    const label = `${p.name || ''}  Lv${p.lv || 1}`; ctx.strokeText(label, p.x, p.y - R - 22); ctx.fillText(label, p.x, p.y - R - 22);
    hpBar(p.x, p.y - R - 16, 50, p.hp / p.mhp, '#5fd35f');
  }
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

// ---------------------------------------------------------------- main render
export function render(dt, t, me, myAngle, myHeld, lead) {
  const w = innerWidth, h = innerHeight;
  const scale = Math.max(0.5, Math.min(1.6, Math.min(w / 1300, h / 760)));
  const cam = S.cam;
  const tx = me.x + lead.x / scale, ty = me.y + lead.y / scale;
  if (!cam.init) { cam.x = tx; cam.y = ty; cam.init = true; }
  const ck = 1 - Math.exp(-dt * 11); cam.x += (tx - cam.x) * ck; cam.y += (ty - cam.y) * ck; cam.scale = scale;
  const sm = FX.shake.m, shx = (Math.random() - 0.5) * sm * 2, shy = (Math.random() - 0.5) * sm * 2;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0b0d14'; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(w / 2 + shx, h / 2 + shy); ctx.scale(scale, scale); ctx.translate(-cam.x, -cam.y);
  const vw = w / scale / 2 + 100, vh = h / scale / 2 + 100;
  const x0 = cam.x - vw, x1 = cam.x + vw, y0 = cam.y - vh, y1 = cam.y + vh;

  for (let cy = Math.max(0, Math.floor(y0 / CH)); cy <= Math.min(Math.floor((S.size - 1) / CH), Math.floor(y1 / CH)); cy++)
    for (let cx = Math.max(0, Math.floor(x0 / CH)); cx <= Math.min(Math.floor((S.size - 1) / CH), Math.floor(x1 / CH)); cx++)
      ctx.drawImage(getChunk(cx, cy), cx * CH, cy * CH, CH + 0.6, CH + 0.6);

  ctx.strokeStyle = 'rgba(255,90,90,.5)'; ctx.lineWidth = 8; ctx.strokeRect(0, 0, S.size, S.size);
  // safe zone
  const sg = ctx.createRadialGradient(S.size / 2, S.size / 2, S.cfg.safe * 0.6, S.size / 2, S.size / 2, S.cfg.safe);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(255,255,255,.09)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(S.size / 2, S.size / 2, S.cfg.safe, 0, TAU); ctx.fill();
  ctx.setLineDash([16, 14]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);

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
  nearRes(cam.x, cam.y, Math.hypot(vw, vh) + 60, (r) => {
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
  for (const p of S.players.values()) ents.push([p.y, () => drawPlayer(p, false, t)]);
  if (!S.dead) ents.push([me.y, () => drawPlayer({ id: S.id, x: me.x, y: me.y, angle: myAngle, held: myHeld, fl: 0, dash: t < me.dashUntil, sp: me.sp, ph: me.ph }, true, t)]);
  ents.sort((a, b) => a[0] - b[0]); for (const e of ents) e[1]();

  // swing trails of other entities are drawn in drawPlayer; projectiles:
  for (const e of S.projs.values()) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle || 0);
    const len = e.r * 5;
    ctx.globalAlpha = 0.35; ctx.strokeStyle = e.color; ctx.lineWidth = e.r * 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter'; const g2 = ctx.createRadialGradient(0, 0, 1, 0, 0, e.r * 3); g2.addColorStop(0, rgba(e.color, 0.7)); g2.addColorStop(1, rgba(e.color, 0)); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, e.r * 3, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = shade(e.color, 0.55); ctx.strokeStyle = e.hostile ? 'rgba(120,0,0,.9)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, e.r * 1.3, e.r * 0.85, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  if (S.ghost) drawGhost(S.ghost, t, me);
  FX.draw(ctx);

  // popups & telegraphs
  for (const f of S.fx) {
    if (f.k === 'dmg') {
      const a = Math.max(0, 1 - f.t), pop = 1 + 0.6 * Math.max(0, 1 - f.t * 7), size = (14 + Math.min(16, f.v / 4)) * pop;
      ctx.globalAlpha = a; ctx.font = `800 ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.fillStyle = f.me ? '#ff6a6a' : '#ffe27a';
      const px = f.x + f.rx, py = f.y - f.t * 46; ctx.strokeText(f.v, px, py); ctx.fillText(f.v, px, py); ctx.globalAlpha = 1;
    } else if (f.k === 'ring') {
      const prog = Math.min(1, f.t / (f.d || 1));
      ctx.globalAlpha = 0.55; ctx.fillStyle = 'rgba(255,40,40,.16)'; ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,40,40,.3)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * prog, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // lighting / night
  const dk = darkness();
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
