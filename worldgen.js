// Shared by server AND client (UMD). Deterministic biome map from a seed.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WorldGen = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function hash(ix, iy, seed) {
    let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967295;
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  function vnoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed);
    const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, seed) {
    let v = 0, amp = 0.55, f = 1, tot = 0;
    for (let i = 0; i < 3; i++) {
      v += vnoise(x * f, y * f, seed + i * 101) * amp;
      tot += amp; amp *= 0.5; f *= 2.1;
    }
    return v / tot;
  }
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // Ordered rules: first match wins. ADD NEW BIOMES HERE (+ server/content/biomes.js).
  const RULES = [
    ['snow',     (t, m) => t < 0.24],
    ['volcanic', (t, m) => t > 0.70 && m < 0.42],
    ['desert',   (t, m) => t > 0.60 && m < 0.50],
    ['swamp',    (t, m) => m > 0.72],
    ['forest',   (t, m) => m > 0.45],
    ['plains',   () => true],
  ];

  function create(seed, size) {
    const scale = 1 / 1000, cx = size / 2, cy = size / 2, spawnR = 650;
    function climate(x, y) {
      const t = clamp01((fbm(x * scale, y * scale, seed) - 0.5) * 2.4 + 0.5);
      const m = clamp01((fbm(x * scale + 500, y * scale + 500, seed + 7) - 0.5) * 2.4 + 0.5);
      return [t, m];
    }
    function biomeAt(x, y) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy < spawnR * spawnR) return 'plains';
      const [t, m] = climate(x, y);
      for (const [id, test] of RULES) if (test(t, m)) return id;
      return 'plains';
    }
    return { biomeAt, size };
  }
  return { create };
});
