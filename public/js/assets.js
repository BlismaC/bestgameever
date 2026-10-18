import { S } from './state.js';
// Loads every image listed by /api/assets. Anything missing returns null -> renderer falls back to procedural art.
const imgs = new Map();
const cache = new Map();

export async function load() {
  let list = [];
  try { list = await (await fetch('/api/assets')).json(); } catch (e) { /* no assets */ }
  await Promise.all(list.map((p) => new Promise((res) => {
    const im = new Image(); im.onload = () => { imgs.set(p.replace(/\.[a-z0-9]+$/i, ''), im); res(); }; im.onerror = res; im.src = '/assets/' + p;
  })));
  return list.length;
}
export const get = (k) => imgs.get(k) || null;
export const mob = (id) => get('mobs/' + id);
export const node = (id) => get('nodes/' + id);
export const struct = (id) => get('structures/' + id);
export const playerBody = () => get('player/body');

function tint(img, color, key) {
  const k = key + color; let c = cache.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0);
    cache.set(k, c);
  }
  return c;
}
export function silhouette(img, key) {
  const k = 'sil' + key; let c = cache.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    cache.set(k, c);
  }
  return c;
}
// Held weapon: exact item sprite (no tint) or archetype sprite tinted by material color. Returns {src, exact} or null.
export function weapon(id) {
  const it = S.content.items[id]; if (!it) return null;
  const hv = get('held/' + id); if (hv) return { src: hv, exact: true, smooth: true };
  const exact = get('items/' + id); if (exact) return { src: exact, exact: true };
  if (it.a) { const base = get('weapons/' + it.a); if (base) return { src: tint(base, it.c, 'w' + it.a), exact: false }; }
  return null;
}
const iconCache = new Map();
export function iconURL(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  let url = null;
  const it = S.content.items[id];
  const exact = get('items/' + id) || (it && it.pl ? get('structures/' + id) : null);
  if (exact) url = exact.src;
  else if (it && it.a) { const base = get('weapons/' + it.a); if (base) url = tint(base, it.c, 'w' + it.a).toDataURL(); }
  iconCache.set(id, url); return url;
}

// Visible-pixel bounding box of a sprite (normalised 0..1) so art can be fitted to its hitbox no matter how much padding it has.
const boxes = new Map();
export function contentBox(img, key) {
  let b = boxes.get(key); if (b) return b;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) { x0 = 0; y0 = 0; x1 = c.width - 1; y1 = c.height - 1; }
  b = { cx: (x0 + x1 + 1) / 2 / c.width, cy: (y0 + y1 + 1) / 2 / c.height, w: (x1 - x0 + 1) / c.width, h: (y1 - y0 + 1) / c.height }; boxes.set(key, b); return b;
}
