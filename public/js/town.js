// WILLOW TOWN renderer: the whole town is pre-rendered once into a canvas (16 px per tile, shown at 2x) from the shared tile map + the tile atlas,
// tall things (trees, lamps, stalls, animals, Christmas trees) are drawn as sorted entities, and string lights twinkle on top.
import { S } from './state.js';
import * as A from './assets.js';
const TM = window.TownMap;
let map = null, key = null, canvas = null, tall = [], idx = null, loading = false;
const hs = (a, b, c = 0) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) & 0xffff;
const LCOL = ['#ff4a5a', '#ffd23f', '#4aaaff', '#5aff8a'], ANIMALS = new Set(['cow', 'sheep', 'pig', 'chicken']);
async function loadIdx() { if (idx || loading) return; loading = true; try { idx = (await (await fetch('assets/town/tiles.json')).json()).idx; } catch (e) { loading = false; } }
function build() {
  const atlas = A.get('town/tiles'); if (!atlas || !idx || !TM) return false;
  map = TM.create(S.season); const { W, H, tiles } = map, snow = map.extra.snow;
  canvas = document.createElement('canvas'); canvas.width = W * 16; canvas.height = H * 16; const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const cell = (n, x, y) => { const c = idx[n]; if (c) g.drawImage(atlas, c[0] * 64, c[1] * 64, 64, 64, x * 16, y * 16, 16, 16); };
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? tiles[y * W + x] : -1);
  const pl = (t) => t === map.P || t === map.DR || t === map.F || t === map.S || t === map.WL || t === map.XL, wl = (t) => t === map.WL || t === map.XL || t === -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = at(x, y);
    if (t === map.G) cell((snow ? 'snow' : 'grass') + (hs(x, y) % 3), x, y);
    else if (t === map.P) cell((snow ? 'pathsnow' : 'path') + ((pl(at(x, y - 1)) ? 1 : 0) | (pl(at(x + 1, y)) ? 2 : 0) | (pl(at(x, y + 1)) ? 4 : 0) | (pl(at(x - 1, y)) ? 8 : 0)), x, y);
    else if (t === map.F) cell('floor' + ((x + y) % 2), x, y);
    else if (t === map.S) cell('stone' + ((x + y) % 2), x, y);
    else if (t === map.WL || t === map.XL) cell((t === map.WL ? 'wallw' : 'wallx') + ((wl(at(x, y - 1)) ? 1 : 0) | (wl(at(x + 1, y)) ? 2 : 0) | (wl(at(x, y + 1)) ? 4 : 0) | (wl(at(x - 1, y)) ? 8 : 0)), x, y);
    else if (t === map.DR) cell('door', x, y);
    else if (t === map.WA) cell('water' + ((x * 3 + y) % 2), x, y);
    else if (t === map.SA) cell('sand', x, y);
    else if (t === map.SO) { cell('soil', x, y); const c = map.crops[y * W + x]; if (c) cell('crop_' + c, x, y); }
  }
  tall = [];
  for (const p of [...map.props, ...map.extra.props]) {
    if (p.flat) { const im = A.get('town/p_' + p.n); if (im) g.drawImage(im, p.x * 16, p.y * 16, p.w * 16, p.h * 16); } else tall.push({ ...p, key: (p.y + p.h) * 32 - (p.n === 'wreath' || p.n === 'cobweb' ? -999 : 4) });
  }
  key = S.season || 'none'; return true;
}
function ensure() { if (!idx) loadIdx(); if (!canvas || key !== (S.season || 'none')) build(); return !!canvas; }
export function townReady() { return ensure(); }
export function drawTownGround(ctx, x0, y0, x1, y1) {
  if (!ensure()) return; const OX = TM.OX, OY = TM.OY;
  const cx0 = Math.max(0, Math.floor((x0 - OX) / 2)), cy0 = Math.max(0, Math.floor((y0 - OY) / 2)), cx1 = Math.min(canvas.width, Math.ceil((x1 - OX) / 2)), cy1 = Math.min(canvas.height, Math.ceil((y1 - OY) / 2));
  if (cx1 <= cx0 || cy1 <= cy0) return; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, cx0, cy0, cx1 - cx0, cy1 - cy0, OX + cx0 * 2, OY + cy0 * 2, (cx1 - cx0) * 2, (cy1 - cy0) * 2);
}
function drawTall(ctx, p, t) {
  const snow = map.extra.snow, nm = snow && (p.n === 'tree' || p.n === 'pine') ? p.n + '_snow' : p.n, im = A.get('town/p_' + nm); if (!im) return;
  const x = TM.OX + p.x * 32, y = TM.OY + p.y * 32, w = p.w * 32, h = p.h * 32, an = ANIMALS.has(p.n);
  if (an || p.n === 'tree' || p.n === 'pine' || p.n === 'xtree' || p.n === 'lamp' || p.n === 'stall' || p.n === 'fountain') { ctx.fillStyle = 'rgba(0,0,0,.17)'; const sw = p.n === 'fountain' ? w * 0.9 : w * 0.6; ctx.fillRect(Math.round(x + (w - sw) / 2), Math.round(y + h - (p.n === 'tree' || p.n === 'pine' || p.n === 'xtree' ? 10 : 6)), Math.round(sw), 6); }
  const by = an ? Math.sin(t * 2.4 + p.x * 3.1) * 1.4 : 0, flip = an && hs(p.x, p.y) % 2;
  ctx.imageSmoothingEnabled = false; ctx.save(); if (flip) { ctx.translate(x + w, y + by); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); } else ctx.drawImage(im, x, y + by, w, h); ctx.restore();
}
function drawLights(ctx, t, x0, y0, x1, y1) {
  const L = map.extra.lights; if (!L.length) return; ctx.save();
  for (let i = 0; i < L.length; i++) {
    const l = L[i]; if (l.x < x0 - 40 || l.x > x1 + 40 || l.y < y0 - 40 || l.y > y1 + 40) continue;
    if (l.chainTo) {   // sagging string between two lamp posts with bulbs
      const [ex, ey] = l.chainTo; ctx.strokeStyle = 'rgba(20,20,20,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(l.x, l.y);
      for (let k = 1; k <= 12; k++) { const u = k / 12; ctx.lineTo(l.x + (ex - l.x) * u, l.y + (ey - l.y) * u + Math.sin(u * Math.PI) * 14); } ctx.stroke();
      for (let k = 1; k < 6; k++) { const u = k / 6, bx = l.x + (ex - l.x) * u, by = l.y + (ey - l.y) * u + Math.sin(u * Math.PI) * 14, a = 0.6 + 0.4 * Math.sin(t * 3 + i + k * 1.3); ctx.globalAlpha = a; ctx.fillStyle = LCOL[(k + l.c) % 4]; ctx.fillRect(Math.round(bx) - 2, Math.round(by), 4, 4); }
      ctx.globalAlpha = 1; continue;
    }
    const n = L[i + 1]; if (n && !n.chainTo && Math.abs(n.x - l.x) < 40 && Math.abs(n.y - l.y) < 14) { ctx.strokeStyle = 'rgba(20,20,20,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.quadraticCurveTo((l.x + n.x) / 2, (l.y + n.y) / 2 + 8, n.x, n.y); ctx.stroke(); }
    const a = 0.55 + 0.45 * Math.sin(t * 3.2 + i * 1.7); ctx.globalAlpha = 0.18 * a; ctx.fillStyle = LCOL[l.c]; ctx.fillRect(Math.round(l.x) - 6, Math.round(l.y) - 4, 12, 12); ctx.globalAlpha = a; ctx.fillRect(Math.round(l.x) - 2, Math.round(l.y), 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(l.x) - 1, Math.round(l.y) + 1, 1, 1);
  }
  ctx.restore();
}
export function townEnts(ents, ctx, t, x0, y0, x1, y1) {
  if (!ensure()) return;
  for (const p of tall) { const x = TM.OX + p.x * 32, y = TM.OY + p.y * 32; if (x < x0 - 200 || x > x1 + 100 || y < y0 - 200 || y > y1 + 100) continue; ents.push([TM.OY + p.key, () => drawTall(ctx, p, t)]); }
  ents.push([1e12, () => drawLights(ctx, t, x0, y0, x1, y1)]);
}
