'use strict';
// Tiny spatial hash for circles/points with .x .y (used for structures and per-tick mob lookups)
class Grid {
  constructor(cell) { this.cell = cell; this.m = new Map(); }
  _k(cx, cy) { return cx * 100003 + cy; }
  add(o) { const k = this._k(Math.floor(o.x / this.cell), Math.floor(o.y / this.cell)); o._gk = k; let a = this.m.get(k); if (!a) { a = []; this.m.set(k, a); } a.push(o); }
  remove(o) { const a = this.m.get(o._gk); if (!a) return; const i = a.indexOf(o); if (i >= 0) { a[i] = a[a.length - 1]; a.pop(); } if (!a.length) this.m.delete(o._gk); }
  clear() { this.m.clear(); }
  near(x, y, r, fn) {
    const c = this.cell, x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) { const a = this.m.get(this._k(cx, cy)); if (!a) continue; for (let i = 0; i < a.length; i++) fn(a[i]); }
  }
}
module.exports = Grid;
