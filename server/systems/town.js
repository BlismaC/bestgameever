'use strict';
// WILLOW TOWN residents: they walk along the town's paths (BFS on the shared tile map) between their workplace, the plaza and other spots.
const TM = require('../../shared/townmap');
const rand = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
const SPEED = 58;
module.exports = {
  townInit() { this.tm = TM.create(null); },
  nearestWalk(tx, ty, rad = 7) {
    const { W, H, walk } = this.tm; const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && walk[y * W + x];
    if (ok(tx, ty)) return [tx, ty];
    for (let r = 1; r <= rad; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(tx + dx, ty + dy)) return [tx + dx, ty + dy];
    return [tx, ty];
  },
  findPath(sx, sy, tx, ty) {
    const { W, H, walk } = this.tm; if (sx === tx && sy === ty) return [];
    const prev = new Int32Array(W * H).fill(-1), q = [sy * W + sx]; prev[sy * W + sx] = sy * W + sx; let qi = 0;
    while (qi < q.length) {
      const c = q[qi++], x = c % W, y = (c / W) | 0; if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const ni = ny * W + nx; if (prev[ni] !== -1 || !walk[ni]) continue; prev[ni] = c; q.push(ni); }
    }
    if (prev[ty * W + tx] === -1) return []; const path = []; let c = ty * W + tx; while (c !== sy * W + sx) { path.push([c % W, (c / W) | 0]); c = prev[c]; } return path.reverse();
  },
  // build the live NPC objects of the town (positions in world px)
  townNpcObjects(defs) {
    const out = [];
    for (const d of defs) {
      const b = d.bld && this.tm.buildings.find((q) => q.id === d.bld);
      let tx, ty; if (b) { tx = b.ix + d.work[0]; ty = b.iy + d.work[1]; } else { [tx, ty] = d.at; }
      [tx, ty] = this.nearestWalk(tx, ty); const [wx, wy] = TM.center(tx, ty);
      out.push({ ...d, x: wx, y: wy, tx, ty, home: [tx, ty], path: [], pi: 0, wait: rand(0, 6), face: 1, mv: 0, tdef: d });
    }
    return out;
  },
  townNpcTarget(n) {
    const r = Math.random();
    if (n.role === 'roam') { const [x, y] = pick(n.pts); return this.nearestWalk(x, y); }
    if (r < 0.64) return n.home; const pl = require('../content/townfolk');
    if (r < 0.84) { const [x, y] = pick(pl.PLAZA); return this.nearestWalk(x, y); }
    const [x, y] = pick(pl.ROAD); return this.nearestWalk(x, y);
  },
  tickTownNpcs(dt) {
    let anyone = false; for (const p of this.main.players) if (this.world.gen.dimAt(p.x, p.y) === 'town') { anyone = true; break; } if (!anyone) return;
    const T = TM.T;
    for (const n of this.npcs) {
      if (!n.town || n.static) continue;
      if (n.wait > 0) { n.wait -= dt; n.mv = 0; continue; }
      if (n.pi >= n.path.length) {
        const [gx, gy] = this.townNpcTarget(n); n.path = this.findPath(n.tx, n.ty, gx, gy); n.pi = 0;
        if (!n.path.length) { n.wait = rand(3, 9); n.mv = 0; continue; }
      }
      const [px, py] = n.path[n.pi], [cx, cy] = TM.center(px, py), dx = cx - n.x, dy = cy - n.y, d = Math.hypot(dx, dy);
      if (d < 3) { n.tx = px; n.ty = py; n.pi++; if (n.pi >= n.path.length) { n.wait = rand(5, 16); n.mv = 0; } continue; }
      n.x += dx / d * SPEED * dt; n.y += dy / d * SPEED * dt; n.mv = 1; if (Math.abs(dx) > 1) n.face = dx > 0 ? 1 : -1;
    }
    if (this.tickN % 3 === 0) for (const p of this.main.players) {
      if (this.world.gen.dimAt(p.x, p.y) !== 'town') continue; const l = [];
      this.npcs.forEach((n, i) => { if (n.town && !n.static && Math.hypot(n.x - p.x, n.y - p.y) < 1700) l.push([i, Math.round(n.x), Math.round(n.y), n.face, n.mv]); });
      if (l.length) this.send(p, { t: 'np', l });
    }
  },
};
