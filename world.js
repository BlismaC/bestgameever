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
  generate() {
    const rng = mulberry32(this.seed * 7 + 1);
    const pad = 120, cx = this.size / 2, cy = this.size / 2;
    let attempts = 0;
    while (this.res.length < C.RESOURCE_COUNT && attempts++ < C.RESOURCE_COUNT * 6) {
      const x = pad + rng() * (this.size - pad * 2), y = pad + rng() * (this.size - pad * 2);
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy < 160 * 160) continue; // keep the spawn point clear
      const b = content.biomes[this.biomeAt(x, y)];
      let total = 0; for (const w of Object.values(b.resources)) total += w;
      let roll = rng() * total, type = null;
      for (const [k, w] of Object.entries(b.resources)) { roll -= w; if (roll <= 0) { type = k; break; } }
      if (!type) continue;
      const def = content.nodes[type];
      let blocked = false;
      this.near(x, y, def.radius + 80, (o) => {
        const ddx = o.x - x, ddy = o.y - y, min = o.r + def.radius + 16;
        if (ddx * ddx + ddy * ddy < min * min) blocked = true;
      });
      if (blocked) continue;
      const r = { id: this.res.length, type, x: Math.round(x), y: Math.round(y), r: def.radius, hp: def.hp, maxHp: def.hp, alive: true, respawnAt: 0, solid: def.solid !== false };
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
