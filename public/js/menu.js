// Main menu: animated pixel landscape + character creator
import { SKIN, HAIR, SHIRT, PANTS, STYLES, drawHuman } from './look.js';
import * as A from './assets.js';

const OPTS = [['Skin', 's', SKIN], ['Hair', 'h', HAIR], ['Style', 'st', STYLES], ['Shirt', 'c', SHIRT], ['Pants', 'p', PANTS]];
export const look = (() => { try { const l = JSON.parse(localStorage.getItem('rf_look')); if (l && typeof l.s === 'number') return l; } catch (e) {} return { s: 0, h: 1, c: 0, p: 0, st: 0 }; })();
let running = true;

export function initMenu() {
  const box = document.getElementById('opts'); box.innerHTML = '';
  for (const [label, key, arr] of OPTS) {
    const lab = document.createElement('span'); lab.className = 'lab'; lab.textContent = label;
    const ctl = document.createElement('span'); ctl.className = 'ctl';
    const prev = document.createElement('button'); prev.textContent = '◀'; const next = document.createElement('button'); next.textContent = '▶';
    const val = document.createElement('span');
    const upd = () => { if (key === 'st') { val.className = ''; val.style.cssText = 'min-width:60px;text-align:center;font-weight:700'; val.textContent = arr[look[key] % arr.length]; } else { val.className = 'sw'; val.style.background = arr[look[key] % arr.length]; } localStorage.setItem('rf_look', JSON.stringify(look)); };
    prev.onclick = () => { look[key] = (look[key] + arr.length - 1) % arr.length; upd(); }; next.onclick = () => { look[key] = (look[key] + 1) % arr.length; upd(); };
    ctl.append(prev, val, next); box.append(lab, ctl); upd();
  }
  const bg = document.getElementById('menucv'), g = bg.getContext('2d'), pv = document.getElementById('preview'), pg = pv.getContext('2d');
  const SC = 3; const sprites = ['slime', 'cow', 'wolf', 'chicken', 'toad'];
  const crit = Array.from({ length: 7 }, (_, i) => ({ k: sprites[i % sprites.length], x: (i * 197) % 1200, sp: 14 + (i * 7) % 18, ph: i * 1.7 }));
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 230, y: 20 + (i * 37) % 70, w: 40 + (i * 29) % 40 }));
  function resize() { bg.width = Math.ceil(innerWidth / SC); bg.height = Math.ceil(innerHeight / SC); g.imageSmoothingEnabled = false; }
  addEventListener('resize', resize); resize();
  let t0 = performance.now();
  (function loop(now) {
    if (!running) return; requestAnimationFrame(loop);
    const t = (now - t0) / 1000, W = bg.width, H = bg.height, gy = Math.floor(H * 0.72);
    const sky = ['#4a90e0', '#5aa0ea', '#6ab0f0', '#7ec0f6', '#98d0fa', '#b4e0fc'], bh = gy / sky.length;
    sky.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bh, W, bh + 1); });
    g.fillStyle = '#fff6b8'; g.beginPath(); g.arc(W * 0.8, H * 0.2, 16, 0, 7); g.fill(); g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(W * 0.8, H * 0.2, 11, 0, 7); g.fill();
    g.fillStyle = '#ffffffcc'; for (const c of clouds) { const x = ((c.x + t * 6) % (W + 120)) - 60; g.fillRect(x, c.y, c.w, 8); g.fillRect(x + 8, c.y - 6, c.w - 18, 8); g.fillRect(x + 4, c.y + 6, c.w - 6, 6); }
    for (const [col, amp, off, sp] of [['#5a8ac0', 22, 0.0, 2], ['#4a9a5a', 18, 1.7, 4], ['#3a8a48', 14, 3.1, 7]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 4) g.lineTo(x, gy - 20 - amp - Math.sin((x + t * sp) * 0.025 + off) * amp * 0.7 - Math.sin((x + t * sp) * 0.07 + off) * 5 + (col === '#3a8a48' ? 14 : 0)); g.lineTo(W, gy); g.fill(); }
    g.fillStyle = '#6dbb4a'; g.fillRect(0, gy, W, H - gy); g.fillStyle = '#5da83e'; for (let x = 0; x < W; x += 12) for (let y = gy + 6; y < H; y += 14) g.fillRect(x + ((y / 14) % 2) * 6, y, 4, 2);
    g.fillStyle = '#4a8a32'; g.fillRect(0, gy, W, 2);
    for (let i = 0; i < 6; i++) { const x = ((i * 173 + 40 - t * 3) % (W + 80) + W + 80) % (W + 80) - 40, h = 36 + (i * 13) % 14; g.fillStyle = '#6b4423'; g.fillRect(x - 3, gy - h * 0.4, 6, h * 0.5); g.fillStyle = '#2f8a38'; g.fillRect(x - 15, gy - h, 30, h * 0.5); g.fillStyle = '#3fa648'; g.fillRect(x - 10, gy - h - 8, 20, 12); }
    for (const c of crit) { const img = A.mob(c.k); if (!img) continue; c.x += c.sp * 0.016; if (c.x > W + 60) c.x = -60; const sz = 26, hop = c.k === 'slime' ? Math.abs(Math.sin(t * 5 + c.ph)) * 8 : Math.abs(Math.sin(t * 8 + c.ph)) * 2; g.drawImage(img, c.x, gy + 10 + (c.ph * 7 % 26) - sz - hop, sz, sz); }
    pg.clearRect(0, 0, pv.width, pv.height); pg.imageSmoothingEnabled = false;
    drawHuman(pg, { x: 75, y: 168, look, dir: 1, aim: 0.5 + Math.sin(t * 2) * 0.1, u: 5.2, phase: t * 7, move: 0.35 });
  })(t0);
}
export function stopMenu() { running = false; }
