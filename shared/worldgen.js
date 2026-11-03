// Shared by server AND client (UMD). The map is FIXED (same for everyone, every restart): biome sectors around the town,
// danger rises with distance from the center, lakes + waterfalls are placed deterministically.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WorldGen = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LAYOUT = 1337;
  function hash(ix, iy, seed) {
    let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967295;
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  function vnoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
    const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed), c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, seed) { let v = 0, amp = 0.55, f = 1, tot = 0; for (let i = 0; i < 3; i++) { v += vnoise(x * f, y * f, seed + i * 101) * amp; tot += amp; amp *= 0.5; f *= 2.1; } return v / tot; }
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // sector order counter-clockwise from EAST. [inner (danger 2-3), outer (danger 4-6)]
  const SECTORS = [
    ['desert', 'badlands'],      // E
    ['scorched', 'volcanic'],    // SE
    ['swamp', 'blightfen'],      // S
    ['moors', 'cursed'],         // SW   (gothic graveyards -> Dracula's land)
    ['snow', 'glacier'],         // W
    ['highlands', 'peaks'],      // NW
    ['forest', 'darkwood'],      // N
    ['jungle', 'deep_jungle'],   // NE
  ];
  const NO_LAKE = new Set(['scorched', 'volcanic']);
  const FALL_BIOMES = new Set(['highlands', 'peaks', 'forest', 'darkwood', 'jungle', 'deep_jungle']);

  function create(seed, size) {
    const cx = size / 2, cy = size / 2, RZ = size * 0.7, PLAINS = 0.19, SPLIT = 0.5;
    const zoneAt = (x, y) => Math.min(1, Math.hypot(x - cx, y - cy) / RZ);
    function biomeAt(x, y) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), z = Math.min(1, d / RZ);
      const zz = z + (fbm(x / 1800 + 9, y / 1800 + 9, LAYOUT + 5) - 0.5) * 0.09;
      if (zz < PLAINS) return 'plains';
      const warp = (fbm(x / 3200 + 3, y / 3200 + 3, LAYOUT) - 0.5) * 0.9;
      let a = Math.atan2(dy, dx) + warp + Math.PI / 8; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      return SECTORS[Math.floor(a / (Math.PI / 4)) % 8][zz < SPLIT ? 0 : 1];
    }
    // ---- lakes (fixed) -----------------------------------------------------------------------------------
    const R = rng(LAYOUT + 11), lakes = [], falls = [], CELL = 1200, grid = new Map();
    const key = (i, j) => i * 1000 + j;
    for (let n = 0, tries = 0; n < 110 && tries < 900; tries++) {
      const ang = R() * Math.PI * 2, d = (0.1 + R() * 0.86) * RZ, x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d, r = 130 + R() * 260;
      if (x < 600 || y < 600 || x > size - 600 || y > size - 600) continue;
      if (NO_LAKE.has(biomeAt(x, y))) continue;
      if (lakes.some((l) => Math.hypot(l.x - x, l.y - y) < (l.r + r) * 1.8)) continue;
      const L = { x, y, r, a1: 0.12 + R() * 0.12, a2: 0.06 + R() * 0.08, p1: R() * 6.28, p2: R() * 6.28, biome: biomeAt(x, y) };
      lakes.push(L); n++;
    }
    for (const L of lakes) {
      const m = L.r * 1.4;
      for (let i = Math.floor((L.x - m) / CELL); i <= Math.floor((L.x + m) / CELL); i++) for (let j = Math.floor((L.y - m) / CELL); j <= Math.floor((L.y + m) / CELL); j++) { const k = key(i, j); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(L); }
      if (FALL_BIOMES.has(L.biome) && R() < 0.6) falls.push({ x: L.x + 6, y: L.y - L.r * (0.88 + L.a1 * 0.2), h: 150 + R() * 100, w: 60 + R() * 30 });
    }
    // 0 = dry, 1 = shallow (wade, slower), 2 = deep (swim, you can drown)
    function waterAt(x, y) {
      const a = grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL))); if (!a) return 0;
      for (let i = 0; i < a.length; i++) {
        const L = a[i], dx = x - L.x, dy = y - L.y, d2 = dx * dx + dy * dy; if (d2 > L.r * L.r * 1.7) continue;
        const ang = Math.atan2(dy, dx), rr = L.r * (1 + L.a1 * Math.sin(3 * ang + L.p1) + L.a2 * Math.sin(5 * ang + L.p2)), d = Math.sqrt(d2);
        if (d < rr * 0.68) return 2; if (d < rr) return 1;
      }
      return 0;
    }
    return { biomeAt, zoneAt, waterAt, lakes, falls, size, sectors: SECTORS };
  }
  return { create };
});
