// WILLOW TOWN: a hand-planned 100x100 tile map (32 world px per tile) used by the SERVER (walls, solid furniture, NPC path finding)
// and the CLIENT (pre-rendered ground + props). Same data on both sides, deterministic.
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.TownMap = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  const W = 100, H = 100, T = 32, OX = 4000, OY = 26000;
  const G = 0, P = 1, F = 2, WL = 3, S = 4, XL = 5, WA = 6, SA = 7, SO = 8, DR = 9;   // grass, path, wood floor, wood wall, stone floor, stone wall, water, sand, soil, door
  // prop catalog: [w, h, flat(drawn into the ground), solid]
  const CAT = {
    bed: [1, 2, 1, 1], bed2: [2, 2, 1, 1], table: [2, 1, 1, 1], table_round: [2, 2, 1, 1], chair: [1, 1, 1, 0], stool: [1, 1, 1, 0], bookshelf: [2, 1, 1, 1], stove: [2, 1, 1, 1], counter: [3, 1, 1, 1],
    potion_shelf: [2, 1, 1, 1], crate: [1, 1, 1, 1], barrel: [1, 1, 1, 1], chest: [1, 1, 1, 1], rug_red: [3, 2, 1, 0], rug_blue: [3, 2, 1, 0], plant: [1, 1, 1, 0], anvil: [1, 1, 1, 1], forge: [2, 2, 1, 1],
    cauldron: [1, 1, 1, 1], workbench: [2, 1, 1, 1], wardrobe: [1, 1, 1, 1], medcab: [1, 1, 1, 1], lectern: [1, 1, 1, 1], hay: [1, 1, 1, 0], trough: [2, 1, 1, 1], bench: [2, 1, 1, 0], stage: [5, 2, 1, 1],
    sack: [1, 1, 1, 0], lantern: [1, 1, 1, 0], clock: [1, 1, 1, 1], fence_h: [1, 1, 1, 1], fence_v: [1, 1, 1, 1], gate_h: [1, 1, 1, 0], bush: [1, 1, 1, 0], fl_y: [1, 1, 1, 0], fl_r: [1, 1, 1, 0], fl_b: [1, 1, 1, 0], mailbox: [1, 1, 0, 1], sign: [1, 1, 0, 0],
    lamp: [1, 2, 0, 0], tree: [2, 3, 0, 0], pine: [2, 3, 0, 0], sunflower: [1, 2, 0, 0], cow: [2, 1, 0, 0], sheep: [1, 1, 0, 0], pig: [1, 1, 0, 0], chicken: [1, 1, 0, 0], fountain: [4, 4, 0, 1], well: [2, 2, 0, 1],
    stall: [2, 3, 0, 1], market_board: [2, 2, 0, 1], xtree: [2, 3, 0, 0], present: [1, 1, 1, 0], wreath: [1, 1, 0, 0], pumpkin: [1, 1, 1, 0], cobweb: [1, 1, 0, 0], scarecrow: [1, 2, 0, 0], haycart: [2, 2, 0, 1],
  };
  // buildings: x,y,w,h in tiles (outer wall ring included), door = [side, position along that side, width], props are relative to the INTERIOR top-left
  const B = [
    { id: 'hall', name: 'Town Hall', x: 36, y: 16, w: 28, h: 13, floor: F, wall: WL, door: ['S', 13, 2], props: [['rug_red', 10, 4], ['table', 3, 1], ['bookshelf', 1, 0], ['bookshelf', 4, 0], ['lectern', 12, 0], ['clock', 24, 0], ['plant', 24, 8], ['plant', 1, 8], ['chest', 22, 0], ['bench', 4, 8], ['bench', 18, 8], ['table', 20, 4], ['chair', 19, 4], ['chair', 22, 4], ['lantern', 8, 0]] },
    { id: 'store', name: 'General Store', x: 22, y: 34, w: 16, h: 12, floor: F, wall: WL, door: ['E', 5, 2], props: [['counter', 9, 3], ['crate', 1, 0], ['crate', 2, 0], ['barrel', 3, 0], ['sack', 1, 1], ['bookshelf', 6, 0], ['bookshelf', 9, 0], ['barrel', 12, 0], ['crate', 12, 7], ['sack', 1, 8], ['plant', 12, 8], ['rug_blue', 5, 6], ['lantern', 4, 0], ['chest', 1, 7]] },
    { id: 'alchemist', name: 'Alchemist', x: 22, y: 48, w: 14, h: 11, floor: S, wall: XL, door: ['E', 4, 2], props: [['potion_shelf', 1, 0], ['potion_shelf', 4, 0], ['potion_shelf', 7, 0], ['cauldron', 10, 1], ['cauldron', 10, 6], ['table', 5, 4], ['rug_blue', 2, 6], ['plant', 1, 7], ['barrel', 10, 3], ['lantern', 10, 0], ['stool', 7, 4]] },
    { id: 'smith', name: 'Blacksmith', x: 22, y: 61, w: 14, h: 11, floor: S, wall: XL, door: ['E', 4, 2], props: [['forge', 1, 0], ['anvil', 4, 2], ['anvil', 6, 5], ['workbench', 8, 0], ['barrel', 10, 0], ['crate', 10, 2], ['crate', 1, 7], ['barrel', 2, 7], ['trough', 9, 6], ['lantern', 5, 0], ['sack', 10, 7]] },
    { id: 'carpenter', name: 'Carpenter', x: 22, y: 74, w: 14, h: 10, floor: F, wall: WL, door: ['E', 4, 2], props: [['workbench', 1, 0], ['workbench', 4, 0], ['crate', 7, 0], ['crate', 8, 0], ['barrel', 10, 0], ['hay', 1, 5], ['hay', 2, 5], ['table', 5, 4], ['chair', 4, 4], ['sack', 10, 6], ['lantern', 7, 6], ['plant', 10, 6]] },
    { id: 'clinic', name: 'Clinic', x: 62, y: 34, w: 16, h: 12, floor: S, wall: XL, door: ['W', 5, 2], props: [['bed', 2, 1], ['bed', 5, 1], ['bed', 8, 1], ['medcab', 11, 0], ['medcab', 12, 0], ['table', 10, 4], ['chair', 9, 4], ['rug_blue', 3, 6], ['plant', 13, 8], ['plant', 1, 8], ['lantern', 12, 6], ['chest', 13, 3]] },
    { id: 'inn', name: 'The Willow Inn', x: 64, y: 48, w: 18, h: 14, floor: F, wall: WL, door: ['W', 6, 2], props: [['stove', 1, 0], ['counter', 5, 1], ['barrel', 9, 0], ['barrel', 10, 0], ['table_round', 5, 5], ['table_round', 9, 5], ['table_round', 12, 5], ['chair', 4, 5], ['chair', 7, 6], ['chair', 11, 6], ['bed', 14, 0], ['bed', 14, 3], ['chest', 12, 0], ['plant', 14, 9], ['rug_red', 2, 8], ['lantern', 7, 0], ['bench', 1, 10]] },
    { id: 'auction', name: 'Auction House', x: 62, y: 64, w: 16, h: 12, floor: F, wall: WL, door: ['W', 5, 2], props: [['stage', 7, 1], ['rug_red', 8, 4], ['bench', 2, 3], ['bench', 2, 6], ['bench', 5, 8], ['bench', 8, 8], ['bookshelf', 1, 0], ['chest', 12, 1], ['plant', 12, 8], ['lantern', 5, 0], ['lectern', 12, 4]] },
    { id: 'post', name: 'Post Office', x: 62, y: 78, w: 14, h: 9, floor: F, wall: WL, door: ['W', 4, 2], props: [['counter', 4, 1], ['mailbox', 1, 0], ['mailbox', 2, 0], ['crate', 9, 0], ['crate', 10, 0], ['sack', 10, 1], ['bookshelf', 6, 0], ['plant', 10, 5], ['table', 3, 5], ['chair', 2, 5], ['lantern', 8, 5]] },
    { id: 'pals', name: "Finn's Pal Lodge", x: 6, y: 40, w: 13, h: 10, floor: F, wall: WL, door: ['E', 4, 2], props: [['bed', 1, 0], ['table', 4, 0], ['chair', 4, 1], ['hay', 8, 0], ['hay', 9, 0], ['crate', 10, 0], ['chest', 1, 5], ['rug_red', 4, 4], ['plant', 9, 6], ['lantern', 7, 6], ['sack', 10, 3]] },
    { id: 'houseA', name: 'Cottage', x: 6, y: 22, w: 11, h: 9, floor: F, wall: WL, door: ['S', 4, 2], props: [['bed2', 1, 0], ['table', 5, 0], ['chair', 5, 1], ['stove', 6, 4], ['rug_blue', 2, 3], ['plant', 8, 0], ['wardrobe', 1, 5], ['lantern', 4, 0]] },
    { id: 'houseB', name: 'Cottage', x: 88, y: 36, w: 10, h: 9, floor: F, wall: WL, door: ['W', 3, 2], props: [['bed', 1, 0], ['bookshelf', 4, 0], ['table', 4, 4], ['chair', 3, 4], ['stove', 6, 0], ['rug_red', 1, 3], ['plant', 7, 5], ['lantern', 3, 0]] },
    { id: 'houseC', name: 'Cottage', x: 88, y: 50, w: 10, h: 9, floor: F, wall: WL, door: ['W', 3, 2], props: [['bed2', 1, 0], ['table', 5, 3], ['chair', 4, 3], ['chest', 7, 0], ['rug_blue', 2, 4], ['plant', 7, 5], ['wardrobe', 6, 0], ['lantern', 3, 0]] },
    { id: 'houseD', name: 'Cottage', x: 6, y: 66, w: 11, h: 9, floor: F, wall: WL, door: ['E', 4, 2], props: [['bed', 1, 0], ['bed', 3, 0], ['table', 5, 4], ['chair', 4, 4], ['stove', 6, 0], ['rug_red', 1, 4], ['plant', 8, 5], ['lantern', 3, 5]] },
  ];
  const ROADS = [[48, 18, 4, 76], [19, 32, 66, 2], [19, 32, 2, 56], [84, 32, 2, 56], [38, 46, 24, 20], [38, 39, 10, 2], [52, 39, 10, 2], [36, 52, 12, 2], [52, 54, 12, 2], [36, 66, 12, 2], [52, 69, 10, 2], [36, 78, 12, 2], [52, 82, 10, 2], [19, 44, 0, 0], [86, 40, 2, 2], [86, 54, 2, 2], [17, 70, 2, 2], [11, 31, 2, 2], [18, 44, 2, 2], [42, 76, 16, 14]];

  function create(season) {
    const tiles = new Uint8Array(W * H), at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? tiles[y * W + x] : -1), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = v; };
    const props = [], rects = [], buildings = [], occupied = new Uint8Array(W * H);
    const prop = (n, x, y, extra) => { const c = CAT[n]; props.push({ n, x, y, w: c[0], h: c[1], flat: !!c[2], solid: !!c[3], ...extra }); if (c[3]) rects.push({ x0: OX + x * T + 2, y0: OY + y * T + 2, x1: OX + (x + c[0]) * T - 2, y1: OY + (y + c[1]) * T - 2 }); for (let j = 0; j < c[1]; j++) for (let i = 0; i < c[0]; i++) if (x + i < W && y + j < H) occupied[(y + j) * W + x + i] = 1; };
    // pond (east): sand ring + water
    const inPond = (x, y, r) => { const dx = (x - 93) / (r + 5.5), dy = (y - 70) / (r + 9.5); return dx * dx + dy * dy < 1; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (inPond(x, y, 1.8)) set(x, y, SA); if (inPond(x, y, -0.4)) set(x, y, WA); }
    // roads / plaza / spawn square
    for (const [x, y, w, h] of ROADS) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (at(x + i, y + j) === G) set(x + i, y + j, P);
    // farms (south) with crop rows; the soil tiles carry the crop type in props
    const farm = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, SO); };
    farm(8, 90, 20, 97); farm(24, 92, 36, 97); farm(56, 90, 68, 97); farm(72, 92, 84, 97);
    // buildings
    for (const b of B) {
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { const edge = x === b.x || y === b.y || x === b.x + b.w - 1 || y === b.y + b.h - 1; set(x, y, edge ? b.wall : b.floor); occupied[y * W + x] = 1; }
      const [side, pos, dw] = b.door; let dx = 0, dy = 0, ex = 0, ey = 0;
      for (let k = 0; k < dw; k++) {
        if (side === 'S') { dx = b.x + pos + k; dy = b.y + b.h - 1; ex = dx; ey = dy + 1; } else if (side === 'N') { dx = b.x + pos + k; dy = b.y; ex = dx; ey = dy - 1; }
        else if (side === 'E') { dx = b.x + b.w - 1; dy = b.y + pos + k; ex = dx + 1; ey = dy; } else { dx = b.x; dy = b.y + pos + k; ex = dx - 1; ey = dy; }
        set(dx, dy, DR); if (at(ex, ey) === G) set(ex, ey, P);
      }
      const door = side === 'S' ? { x: b.x + pos, y: b.y + b.h } : side === 'E' ? { x: b.x + b.w, y: b.y + pos } : side === 'W' ? { x: b.x - 1, y: b.y + pos } : { x: b.x + pos, y: b.y - 1 };
      buildings.push({ id: b.id, name: b.name, x: b.x, y: b.y, w: b.w, h: b.h, door, doorSide: side, doorW: dw, ix: b.x + 1, iy: b.y + 1, iw: b.w - 2, ih: b.h - 2 });
    }
    // walls -> merged collision rectangles
    for (let y = 0; y < H; y++) { let x = 0; while (x < W) { const t = at(x, y); if (t === WL || t === XL) { let x2 = x; while (at(x2 + 1, y) === WL || at(x2 + 1, y) === XL) x2++; rects.push({ x0: OX + x * T, y0: OY + y * T, x1: OX + (x2 + 1) * T, y1: OY + (y + 1) * T }); x = x2 + 1; } else x++; } }
    // interior furniture
    for (const b of B) for (const [n, rx, ry] of b.props) prop(n, b.x + 1 + rx, b.y + 1 + ry);
    // path from every door out to the road network is already carved; edge details
    // fences: pens + farm borders
    const fenceRect = (x0, y0, x1, y1, gapX, gapW) => { for (let x = x0; x <= x1; x++) { if (!(gapX !== undefined && x >= gapX && x < gapX + gapW)) prop('fence_h', x, y0); prop('fence_h', x, y1); } for (let y = y0 + 1; y < y1; y++) { prop('fence_v', x0, y); prop('fence_v', x1, y); } };
    fenceRect(6, 52, 18, 62, 11, 2);               // pal lodge yard
    fenceRect(26, 86, 44, 98, 34, 2);              // west animal pen
    fenceRect(56, 86, 76, 89, undefined, 0);       // east farm top rail
    fenceRect(8, 87, 22, 98, undefined, 0);
    for (const [n, x, y] of [['cow', 28, 90], ['cow', 33, 93], ['cow', 38, 90], ['sheep', 30, 95], ['sheep', 36, 96], ['pig', 41, 92], ['chicken', 27, 96], ['chicken', 40, 95], ['cow', 8, 55], ['sheep', 12, 58], ['pig', 15, 54], ['sheep', 9, 60], ['chicken', 15, 59], ['hay', 17, 53], ['trough', 13, 53], ['trough', 28, 88], ['hay', 43, 88]]) prop(n, x, y);
    // plaza: fountain, stalls, market board, benches, lamps, flowers
    prop('fountain', 48, 54); prop('market_board', 41, 50); prop('stall', 40, 58); prop('stall', 58, 50); prop('stall', 58, 59);
    for (const [x, y] of [[44, 48], [44, 64], [55, 48], [55, 64], [47, 47], [52, 47], [47, 65], [52, 65]]) prop('bench', x, y);
    for (let y = 22; y <= 92; y += 7) { prop('lamp', 47, y); prop('lamp', 52, y); }
    for (const [x, y] of [[37, 47], [62, 47], [37, 65], [62, 65], [20, 36], [20, 70], [84, 36], [84, 70], [18, 34], [86, 34]]) prop('lamp', x, y);
    prop('well', 44, 80); prop('well', 54, 22);
    prop('sign', 49, 74); prop('sign', 50, 88);
    // trees / bushes / flowers on free grass, deterministic (forest border + sprinkles)
    let seed = 90210; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const free = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (at(x + i, y + j) !== G || occupied[(y + j) * W + x + i]) return false; return true; };
    for (let n = 0; n < 900; n++) {
      const x = Math.floor(rnd() * (W - 2)), y = Math.floor(rnd() * (H - 3)); const border = x < 5 || x > 93 || y < 13 || y > 96, r = rnd();
      if (border && r < 0.8) { if (free(x, y, 2, 3)) prop(rnd() < 0.55 ? 'tree' : 'pine', x, y); }
      else if (r < 0.05) { if (free(x, y, 2, 3)) prop(rnd() < 0.6 ? 'tree' : 'pine', x, y); }
      else if (r < 0.22) { if (free(x, y, 1, 1)) prop(['bush', 'fl_y', 'fl_r', 'fl_b'][Math.floor(rnd() * 4)], x, y); }
    }
    for (let n = 0; n < 8; n++) { const x = 52 + n * 3; if (free(x, 21, 1, 2)) prop('sunflower', x, 21); }
    // crops are drawn from soil tiles: choose the crop per farm row
    const crops = {}; for (let y = 90; y <= 97; y++) for (let x = 8; x <= 84; x++) if (at(x, y) === SO) crops[y * W + x] = ['carrot', 'corn', 'cabbage', 'wheat'][(Math.floor(x / 4) + (y >> 1)) % 4];
    // walkability for NPC path finding (water, walls and solid props block)
    const walk = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) walk[i] = tiles[i] === WL || tiles[i] === XL || tiles[i] === WA ? 0 : 1;
    for (const p of props) if (p.solid || p.n === 'tree' || p.n === 'pine') for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) { if (p.n === 'tree' || p.n === 'pine') { if (j < 2) continue; } walk[(p.y + j) * W + p.x + i] = 0; }
    for (const p of props) if (p.n === 'tree' || p.n === 'pine') rects.push({ x0: OX + (p.x + 0.5) * T, y0: OY + (p.y + 2) * T, x1: OX + (p.x + 1.5) * T, y1: OY + (p.y + 3) * T });   // trunk
    // season dressing (visual only, no collision change)
    const extra = { props: [], lights: [], snow: false };
    if (season === 'christmas') {
      extra.snow = true;
      for (const b of buildings) { const bb = B.find((q) => q.id === b.id); const tx = Math.max(b.ix + 1, Math.min(b.ix + b.iw - 3, b.ix + b.iw - 3)), ty = b.iy;
        extra.props.push({ n: 'xtree', x: tx, y: b.iy, w: 2, h: 3 }); extra.props.push({ n: 'present', x: tx - 1, y: b.iy + 2, w: 1, h: 1, flat: true }, { n: 'present', x: tx + 2, y: b.iy + 2, w: 1, h: 1, flat: true });
        const dr = b.door; extra.props.push({ n: 'wreath', x: b.doorSide === 'E' ? b.x + b.w - 1 : b.doorSide === 'W' ? b.x : b.x + (b.doorSide === 'S' ? 0 : 0) + (b.door.x - b.x), y: b.doorSide === 'S' ? b.y + b.h - 2 : b.y + (b.doorSide === 'N' ? 0 : 0) + (b.door.y - b.y), w: 1, h: 1 });
        for (let x = b.x; x < b.x + b.w; x++) extra.lights.push({ x: x * T + 16 + OX, y: b.y * T + 10 + OY + (x % 2) * 5, c: x % 4 });          // light chain along the top wall (outside)
        for (let x = b.ix; x < b.ix + b.iw; x++) extra.lights.push({ x: x * T + 16 + OX, y: (b.iy) * T + 6 + OY + (x % 2) * 6, c: (x + 1) % 4 });       // and inside
      }
      for (let y = 22; y <= 92; y += 7) { extra.lights.push({ x: OX + 47 * T + 16, y: OY + y * T, c: y % 4, chainTo: [OX + 52 * T + 16, OY + y * T] }); }
      extra.props.push({ n: 'xtree', x: 46, y: 50, w: 2, h: 3 }, { n: 'xtree', x: 52, y: 50, w: 2, h: 3 }, { n: 'xtree', x: 49, y: 44, w: 2, h: 3 });
    } else if (season === 'halloween') {
      for (const b of buildings) { extra.props.push({ n: 'pumpkin', x: b.door.x, y: b.door.y, w: 1, h: 1, flat: true }, { n: 'cobweb', x: b.ix, y: b.iy, w: 1, h: 1 }); }
      for (let n = 0; n < 14; n++) { const x = 38 + ((n * 7) % 24), y = 46 + ((n * 5) % 20); if (!occupied[y * W + x]) extra.props.push({ n: 'pumpkin', x, y, w: 1, h: 1, flat: true }); }
    }
    return { W, H, T, OX, OY, tiles, props, rects, buildings, crops, walk, extra, G, P, F, WL, S, XL, WA, SA, SO, DR, CAT, B };
  }
  // helpers shared by server + client
  const tileAt = (m, wx, wy) => { const x = Math.floor((wx - OX) / T), y = Math.floor((wy - OY) / T); return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null; };
  const center = (tx, ty) => [OX + tx * T + T / 2, OY + ty * T + T / 2];
  return { create, tileAt, center, W, H, T, OX, OY, CAT };
});
