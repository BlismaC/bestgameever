// Pixel-art projectiles / bursts / muzzle flashes / ground zones (sprites from assets/proj + assets/fx). Falls back to the old vector drawing when a sprite is missing.
import * as A from './assets.js';
import * as FX from './fx.js';
const TINT = new Set(['orb', 'star', 'bolt', 'magic', 'wave', 'gel', 'beam', 'bfg', 'spark', 'shard', 'sand', 'candy', 'bloodorb', 'water', 'soul']);
const FLIP = new Set(['duck', 'bat', 'crow']), UPRIGHT = new Set(['bomb', 'pumpkin', 'cookie', 'cube', 'egg', 'snowball', 'present', 'sphere']);
const cache = new Map();
function tinted(img, kind, color) {
  const key = kind + color; let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.28; g.drawImage(img, 0, 0);
  cache.set(key, c); return c;
}
export function drawProjSprite(ctx, e, t) {
  const kind = e.kind || 'orb', base = A.get('proj/' + kind); if (!base) return false;
  const img = TINT.has(kind) ? tinted(base, kind, e.color || '#ffffff') : base, frames = 3, fw = base.width / frames, fh = base.height;
  const f = Math.floor(t * 12 + (e.id || 0)) % frames, sz = Math.max(24, Math.min(76, (e.r || 8) * 3.6)), w = sz * (fw / fh), h = sz;
  ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.imageSmoothingEnabled = false;
  if (FLIP.has(kind)) { if ((e.vx || 0) < 0) ctx.scale(-1, 1); } else if (!UPRIGHT.has(kind)) ctx.rotate(e.angle || 0); else ctx.rotate(Math.floor(t * 6 + (e.id || 0)) * 0.5);
  ctx.drawImage(img, f * fw, 0, fw, fh, -w / 2, -h / 2, w, h); ctx.restore();
  if (Math.random() < 0.5) FX.pixelTrail(e.x - Math.cos(e.angle || 0) * 6, e.y - Math.sin(e.angle || 0) * 6, kind, e.color);
  return true;
}
const STYLE = { fire: 'fire', ice: 'ice', poison: 'poison', void: 'void', bloodorb: 'blood', water: 'water', trident: 'water', thorn: 'leaf', leaf: 'leaf', magic: 'magic', orb: 'magic', soul: 'magic', wisp: 'fire', sand: 'dust', bolt: 'spark', spark: 'spark', wave: 'slash', star: 'slash', arrow: 'slash', bone: 'bone', rock: 'dust', gel: 'poison', crow: 'void', bat: 'blood', candy: 'blood' };
export function styleOf(k) { return STYLE[k] || 'spark'; }
export function drawFxSprite(ctx, f) {   // f.k = 'burst' | 'muzzle'
  const key = f.k === 'burst' ? 'fx/burst_' + f.style : 'fx/muzzle', img = A.get(key); if (!img) return;
  const frames = f.k === 'burst' ? 4 : 3, fw = img.width / frames, fi = Math.min(frames - 1, Math.floor((f.t / f.d) * frames)), sz = f.size || 72;
  ctx.save(); ctx.translate(Math.round(f.x), Math.round(f.y)); ctx.imageSmoothingEnabled = false; if (f.k === 'muzzle') ctx.rotate(f.a || 0); ctx.globalAlpha = Math.min(1, 1.3 - f.t / f.d * 0.6);
  ctx.drawImage(img, fi * fw, 0, fw, img.height, -sz / 2, -sz / 2, sz, sz); ctx.restore();
}
export function drawZone(ctx, z, t) {
  const img = A.get('fx/zone_' + z.kind); if (!img) return; const fw = img.width / 3, fi = Math.floor(t * 7 + z.id) % 3, w = z.r * 2.3, h = w * (img.height / fw);
  const fade = Math.min(1, (z.until - performance.now()) / 700, (performance.now() - z.born) / 250 + 0.2);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = Math.max(0, fade) * 0.95; ctx.drawImage(img, fi * fw, 0, fw, img.height, Math.round(z.x - w / 2), Math.round(z.y - h / 2), w, h); ctx.restore();
  if (z.kind === 'fire' && Math.random() < 0.15) FX.pixelTrail(z.x + (Math.random() - 0.5) * z.r, z.y, 'fire', '#ffb02e');
}
