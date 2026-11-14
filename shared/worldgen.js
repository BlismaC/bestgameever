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

  // ---- dimensions: fenced-off areas far outside the normal map (reached by portals only) ----
  const DIMS = {
    town:        { x0: 4000,  y0: 26000, x1: 7200,  y1: 29200, spawn: [5600, 28300],  biome: 'town',        zone: 0 },
    castle_land: { x0: 8000,  y0: 26000, x1: 14000, y1: 32000, spawn: [11000, 31300], biome: 'castle_land', zone: 0.66 },
    castle_hall: { x0: 15000, y0: 26000, x1: 17600, y1: 28600, spawn: [16300, 28000], biome: 'castle_hall', zone: 0.8 },
    atlantis:    { x0: 18000, y0: 26000, x1: 24000, y1: 32000, spawn: [21000, 31300], biome: 'atlantis',    zone: 0.7 },
    temple_hall: { x0: 25000, y0: 26000, x1: 27600, y1: 28600, spawn: [26300, 28000], biome: 'temple_hall', zone: 0.8 },
  };
  function create(seed, size) {
    const cx = size / 2, cy = size / 2, RZ = size * 0.7, PLAINS = 0.19, SPLIT = 0.5;
    function dimAt(x, y) { for (const id in DIMS) { const d = DIMS[id]; if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return id; } return null; }
    const MAIN = { x0: 0, y0: 0, x1: size, y1: size };
    const rectAt = (x, y) => { const d = dimAt(x, y); return d ? DIMS[d] : MAIN; };
    const zoneAt = (x, y) => { const d = dimAt(x, y); return d ? DIMS[d].zone : Math.min(1, Math.hypot(x - cx, y - cy) / RZ); };
    function biomeAt(x, y) {
      const dm = dimAt(x, y); if (dm) return DIMS[dm].biome;
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
    // ---- portals, solid scenery (castle walls) and decoration of the dimensions ----
    const portals = [
      { id: 'town_gate',  x: cx, y: cy - 330, to: 'town', label: 'Town Portal' },
      { id: 'town_back',  x: 5600, y: 26450, to: 'main', label: 'Back to the Realm' },
      { id: 'castle_gate', x: 11000, y: 27455, to: 'castle_hall', label: "Dracula's Gate", auto: 1, door: [11000, 27330] },
      { id: 'castle_back', x: 11000, y: 31700, to: 'main', label: 'Escape the Mist' },
      { id: 'hall_back',  x: 16300, y: 26350, to: 'castle_land', label: 'Leave the Hall', dest: [11000, 27560], auto: 1, door: [16300, 26280] },
      { id: 'temple_door', x: 21000, y: 27640, to: 'temple_hall', label: "Neptune's Temple", auto: 1, door: [21000, 27520] },
      { id: 'temple_back', x: 26300, y: 26350, to: 'atlantis', label: 'Leave the Sanctum', dest: [21000, 27760], auto: 1, door: [26300, 26280] },
      { id: 'sea_back',   x: 21000, y: 31700, to: 'main', label: 'Surface' },
    ];
    const solids = [];   // (kept for compatibility) circles
    // solid scenery as rectangles: the castle, the temple and the houses of Willow Town cannot be walked through
    const rects = [
      { x0: 10050, y0: 26330, x1: 11950, y1: 27395 },                       // Dracula's castle (the door is the portal in front of it)
      { x0: 20450, y0: 27020, x1: 21550, y1: 27575 },                       // Neptune's temple
      ...[[4600, 27000], [6600, 27000], [4500, 28300], [6700, 28300]].map(([x, y]) => ({ x0: x - 165, y0: y - 30, x1: x + 165, y1: y + 140 })),   // houses
      { x0: 5490, y0: 27640, x1: 5710, y1: 27770 },                           // fountain
      { x0: 4945, y0: 27655, x1: 5055, y1: 27720 }, { x0: 6110, y0: 27660, x1: 6290, y1: 27730 }, { x0: 5575, y0: 28765, x1: 5625, y1: 28810 },   // board, stage, mailbox
    ];
    const decor = [
      { t: 'castle', x: 11000, y: 26855, w: 1900, h: 1100 },
      { t: 'atlantis_temple', x: 21000, y: 27300, w: 1100, h: 560 },
      { t: 'fountain', x: 5600, y: 27700, w: 220, h: 220 },
      { t: 'town_house', x: 4600, y: 27000, w: 360, h: 300 }, { t: 'town_house', x: 6600, y: 27000, w: 360, h: 300 }, { t: 'town_house', x: 4500, y: 28300, w: 360, h: 300 }, { t: 'town_house', x: 6700, y: 28300, w: 360, h: 300 },
      { t: 'market_board', x: 5000, y: 27650, w: 130, h: 130 }, { t: 'auction_stage', x: 6200, y: 27650, w: 180, h: 140 }, { t: 'mailbox', x: 5600, y: 28800, w: 80, h: 100 },
    ];
    // boss halls: red/blue carpet, pillars, torches and a throne behind the boss (Dracula's hall x=16300, Neptune's sanctum x=26300)
    for (const [cx0, v] of [[16300, 'gothic'], [26300, 'sea']]) {
      decor.push({ t: 'hall_carpet', v, x: cx0, y: 27500, w: 180, h: 1700, tile: [26700, 28300] });
      decor.push({ t: 'hall_throne', v, x: cx0, y: 26650, w: 230, h: 296 });
      rects.push({ x0: cx0 - 90, y0: 26700, x1: cx0 + 90, y1: 26790 });
      for (const py of [26850, 27450, 28050]) for (const sx of [-520, 520]) {
        decor.push({ t: 'hall_pillar', v, x: cx0 + sx, y: py, w: 92, h: 210 }); rects.push({ x0: cx0 + sx - 36, y0: py + 40, x1: cx0 + sx + 36, y1: py + 100 });
        decor.push({ t: "hall_torch", v, x: cx0 + sx + (sx < 0 ? 95 : -95), y: py + 40, w: 64, h: 128, anim: 3 });
      }
    }
    for (let i = 0; i < 40; i++) { const r2 = rng(LAYOUT + 99 + i); decor.push({ t: 'coral', x: 18400 + r2() * 5200, y: 26500 + r2() * 5000, w: 120, h: 120, v: Math.floor(r2() * 3) }); }
    return { biomeAt, zoneAt, waterAt, dimAt, rectAt, DIMS, portals, solids, rects, decor, lakes, falls, size, sectors: SECTORS };
  }
  return { create };
});
