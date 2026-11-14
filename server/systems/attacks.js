'use strict';
// Extra monster attack types: LOB (arcing bomb that lands on you) and lingering ground ZONES (poison, fire, ice, blood...).
const content = require('../content');
const rand = (a, b) => a + Math.random() * (b - a), dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by), rd = Math.round;
let zid = 1;
module.exports = {
  attacksInit() { this.lobs = []; this.zones = []; },
  // a = ability / boss pattern: {flight, radius, dmg|proj.dmg, kind, zone:{kind,radius,dur,dps,fx}, height, fx}
  mobLob(m, a, target) {
    const flight = a.flight || 0.95, dmg = (a.dmg || (a.proj && a.proj.dmg) || 28) * (m.dmgMul || 1) * (1 + 0.15 * (m.phase || 0));
    const lead = 0.35, tx = target.x + (target.vx || 0) * lead + rand(-30, 30), ty = target.y + (target.vy || 0) * lead + rand(-30, 30);
    this.lobs.push({ at: this.time + flight, x: tx, y: ty, r: a.radius || 90, dmg, zone: a.zone || null, src: m.def.name, fx: a.fx || null, kind: a.kind || 'bomb' });
    this.events.push({ e: 'lob', rm: 'main', x0: rd(m.x), y0: rd(m.y), x1: rd(tx), y1: rd(ty), dur: flight, kind: a.kind || 'bomb', h: a.height || 150 });
  },
  tickAttacks(dt) {
    const t = this.time;
    for (let i = this.lobs.length - 1; i >= 0; i--) {
      const l = this.lobs[i]; if (t < l.at) continue; this.lobs.splice(i, 1);
      this.events.push({ e: 'boom', rm: 'main', x: rd(l.x), y: rd(l.y), r: l.r });
      for (const p of this.main.players) if (p.alive && dist(p.x, p.y, l.x, l.y) < l.r + 12) this.hurtPlayer(p, l.dmg, l.src, l.fx);
      if (l.zone) { const z = { id: zid++, x: l.x, y: l.y, r: l.zone.radius, until: t + l.zone.dur, dps: l.zone.dps, fx: l.zone.fx || null, kind: l.zone.kind, src: l.src, next: t + 0.3 }; this.zones.push(z); this.events.push({ e: 'zone', rm: 'main', id: z.id, x: rd(z.x), y: rd(z.y), r: z.r, kind: z.kind, dur: l.zone.dur }); }
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]; if (t >= z.until) { this.zones.splice(i, 1); continue; }
      if (t < z.next) continue; z.next = t + 0.4;
      for (const p of this.main.players) if (p.alive && dist(p.x, p.y, z.x, z.y) < z.r) this.hurtPlayer(p, z.dps * 0.4, z.src, z.fx);
    }
  },
};
