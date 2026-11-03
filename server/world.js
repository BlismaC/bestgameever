'use strict';
// World: seeded biome map + static resource nodes (trees, ore...) in a spatial hash.
const C = require('./config');
const content = require('./content');
const { create } = require('../shared/worldgen');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const CELL = 300;

class World {
  constructor(seed) {
    this.seed = seed;
    this.size = C.WORLD_SIZE;
    this.gen = create(seed, this.size);
    this.res = [];
    this.cells = new Map();
    this.nodeTypes = Object.keys(content.nodes);
    this.generate();
  }
  biomeAt(x, y) { return this.gen.biomeAt(x, y); }
  key(cx, cy) { return cx * 100003 + cy; }
  addToCells(r) {
    const k = this.key(Math.floor(r.x / CELL), Math.floor(r.y / CELL));
    let a = this.cells.get(k); if (!a) { a = []; this.cells.set(k, a); }
    a.push(r);
  }
  zone(x, y) { return this.gen.zoneAt(x, y); }
  // Jittered grid: one candidate per cell, filled by biome density -> evenly spread, no clumps, deterministic per seed.
  generate() {
    const rng = mulberry32(this.seed * 7 + 1);
    const CELLG = C.RESOURCE_CELL, n = Math.floor(this.size / CELLG), cx = this.size / 2, cy = this.size / 2;
    for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) {
      const bx = (gx + 0.5) * CELLG, by = (gy + 0.5) * CELLG;
      const dx = bx - cx, dy = by - cy;
      if (dx * dx + dy * dy < 320 * 320) continue; // clear spawn
      const b = content.biomes[this.biomeAt(bx, by)];
      if (rng() > b.density) continue;
      const zone = this.zone(bx, by);
      let total = 0; const opts = [];
      for (const [k, w] of Object.entries(b.resources)) { if ((content.nodes[k].minZone || 0) > zone) continue; opts.push([k, w]); total += w; }
      if (!total) continue;
      let roll = rng() * total, type = opts[0][0];
      for (const [k, w] of opts) { roll -= w; if (roll <= 0) { type = k; break; } }
      const def = content.nodes[type], m = def.radius + 10;
      const x = gx * CELLG + m + rng() * (CELLG - 2 * m), y = gy * CELLG + m + rng() * (CELLG - 2 * m);
      if (this.gen.waterAt(x, y) || this.gen.waterAt(x + m, y) || this.gen.waterAt(x - m, y) || this.gen.waterAt(x, y + m) || this.gen.waterAt(x, y - m)) continue;   // nothing grows in lakes
      const hidden = type === 'rock' && rng() < C.EXCALIBUR_CHANCE ? 'excalibur_ish' : null;   // 0.01%: a boulder with a sword inside
      const r = { id: this.res.length, type, x: Math.round(x), y: Math.round(y), r: def.radius, hp: def.hp, maxHp: def.hp, alive: true, respawnAt: 0, solid: def.solid !== false, hidden };
      this.res.push(r); this.addToCells(r);
    }
  }
  near(x, y, rad, fn) {
    const x0 = Math.floor((x - rad) / CELL), x1 = Math.floor((x + rad) / CELL);
    const y0 = Math.floor((y - rad) / CELL), y1 = Math.floor((y + rad) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const a = this.cells.get(this.key(cx, cy)); if (!a) continue;
      for (let i = 0; i < a.length; i++) fn(a[i]);
    }
  }
  // push a circle out of solid, living nodes
  collide(e, radius) {
    this.near(e.x, e.y, radius + 60, (o) => {
      if (!o.alive || !o.solid) return;
      const dx = e.x - o.x, dy = e.y - o.y, min = radius + o.r * 0.8;
      const d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > 0.0001) { const d = Math.sqrt(d2), push = (min - d) / d; e.x += dx * push; e.y += dy * push; }
    });
    const m = 30;
    e.x = Math.max(m, Math.min(this.size - m, e.x));
    e.y = Math.max(m, Math.min(this.size - m, e.y));
  }
}
module.exports = World;
