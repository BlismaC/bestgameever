'use strict';
// SEASONS / HOLIDAYS (real calendar, /season <id|off|auto> to force). Changes: event pool, town decoration, daily gifts, trick-or-treat candy.
const content = require('../content');
const rd = Math.round, dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const SEASONS = [
  { id: 'halloween', name: 'Halloween', from: [10, 15], to: [11, 2] },
  { id: 'christmas', name: 'Christmas', from: [12, 8], to: [12, 27] },
  { id: 'newyear', name: 'New Year', from: [12, 28], to: [1, 3] },
  { id: 'valentine', name: "Valentine's Day", from: [2, 8], to: [2, 15] },
  { id: 'easter', name: 'Easter', from: [4, 1], to: [4, 15] },
];
const inRange = (d, a, b) => { const v = (d.getMonth() + 1) * 100 + d.getDate(), s = a[0] * 100 + a[1], e = b[0] * 100 + b[1]; return s <= e ? v >= s && v <= e : v >= s || v <= e; };
const dayKey = () => Math.floor(Date.now() / 86400000);

module.exports = {
  seasonsInit() { this.seasonForce = null; this.season = null; this.seasonCheck = 0; this.updateSeason(true); },
  seasonFromDate() { const d = new Date(); for (const s of SEASONS) if (inRange(d, s.from, s.to)) return s.id; return null; },
  updateSeason(first) {
    const ns = this.seasonForce === 'off' ? null : this.seasonForce || this.seasonFromDate();
    if (!first && ns === this.season) return;
    this.season = ns; this.refreshNpcs();
    if (!first) { this.broadcast({ t: 'season', id: this.season }); const s = SEASONS.find((x) => x.id === ns); this.broadcast({ t: 'chat', sys: 1, m: s ? `🎉 It's ${s.name} season! Visit Willow Town (portal in the main town) for gifts, decorations and special events.` : 'The festive season has ended.' }); for (const p of this.main.players) this.sendRoom(p); }
  },
  refreshNpcs() {
    const D = this.world.gen.DIMS.town, cx = 5600, cy = 27700;
    const base = content.npcs.filter((n) => !n.dimOnly).map((n) => ({ ...n, x: Math.round(this.size / 2 + Math.cos(n.ang) * 190), y: Math.round(this.size / 2 + Math.sin(n.ang) * 190), tip: 0 }));
    const town = content.npcs.filter((n) => !n.dimOnly).map((n) => ({ ...n, id: n.id + '_t', baseId: n.id, x: Math.round(cx + Math.cos(n.ang) * 330), y: Math.round(cy + Math.sin(n.ang) * 330), tip: 0 }));
    const extra = content.npcs.filter((n) => n.dimOnly && (!n.season || n.season === this.season)).map((n) => ({ ...n, x: n.tpos[0], y: n.tpos[1], tip: 0 }));
    this.npcs = [...base, ...town, ...extra];
  },
  tickSeasons(dt) { this.seasonCheck -= dt; if (this.seasonCheck <= 0) { this.seasonCheck = 600; this.updateSeason(false); } },
  // trick-or-treat: every town NPC hands out candy once per real day, at night, during Halloween
  trickOrTreat(p, n) {
    if (this.season !== 'halloween' || !this.isNight() || n.kind === 'gift' || n.kind === 'market') return;
    p.gifted = p.gifted || {}; const k = 'tot_' + (n.baseId || n.id), day = dayKey(); if (p.gifted[k] === day) return; p.gifted[k] = day;
    const pick = Math.random(); const item = pick < 0.6 ? 'candy_corn' : pick < 0.9 ? 'chocolate_bar' : 'caramel_apple', cnt = item === 'candy_corn' ? 2 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 2);
    const left = this.addItem(p, item, cnt); if (left > 0) this.spawnDrop(item, left, p.x, p.y);
    this.sys(p, `🎃 Trick or treat! ${n.name} gives you ${cnt}× ${content.items[item].name}.`); this.sendInv(p);
  },
  giftNpc(p, n) {
    p.gifted = p.gifted || {}; const day = dayKey();
    if (n.night && !this.isNight()) return this.sys(p, `${n.name}: "Come back after dark!"`);
    if (p.gifted[n.id] === day) return this.sys(p, `${n.name}: "You already got today's gift. Come back tomorrow!"`);
    p.gifted[n.id] = day; const got = [];
    for (const [id, a, b] of n.gifts) { const c = a + Math.floor(Math.random() * (b - a + 1)); if (c <= 0) continue; const left = this.addItem(p, id, c); if (left > 0) this.spawnDrop(id, left, p.x, p.y); got.push(`${c}× ${content.items[id].name}`); }
    this.sys(p, `🎁 ${n.name} gives you ${got.join(', ')}!`); this.sendInv(p);
  },
  openGift(p, slot) {   // Gift Box / Painted Egg
    const pool = [['coin', 40, 160, 0.34], ['potion_heal', 1, 3, 0.2], ['cooked_meat', 2, 5, 0.15], ['gold', 1, 3, 0.1], ['pal_sphere', 1, 3, 0.1], ['pal_sphere_great', 1, 1, 0.05], ['caramel_apple', 1, 3, 0.04], ['pal_sphere_ultra', 1, 1, 0.02]];
    let r = Math.random(), pick = pool[0]; for (const e of pool) { r -= e[3]; if (r <= 0) { pick = e; break; } }
    const c = pick[1] + Math.floor(Math.random() * (pick[2] - pick[1] + 1)); const left = this.addItem(p, pick[0], c); if (left > 0) this.spawnDrop(pick[0], left, p.x, p.y);
    this.sys(p, `🎁 Inside: ${c}× ${content.items[pick[0]].name}!`);
  },
};
