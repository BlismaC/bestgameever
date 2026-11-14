'use strict';
// PAL TAMING: wild pals roam the world (mobs "wild_<species>", shown as "Wild X Lv N"). Throw a Pal Sphere (hold it and click) at a weakened one.
// Tamed pals live in the player's roster (p.pals). One pal follows you: it fights, mines ore, levels up and has traits.
const content = require('../content');
const rand = (a, b) => a + Math.random() * (b - a), randi = (a, b) => Math.floor(rand(a, b + 1)), dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by), rd = Math.round;
const ELEMENT_COLOR = { earth: '#b08a50', storm: '#ffe14a', nature: '#6fdc4a', water: '#4aa8e0', fire: '#ff7a1a', ice: '#bff3ff', light: '#fff3a8', dark: '#9a6aff', ghost: '#b8f0e0', dragon: '#ff5a3a', crystal: '#e0c8ff', void: '#9a4aff' };
const TRAITS = {
  hardworker: ['Hard Worker', 'Mines 30% faster'], brave: ['Brave', '+30% damage'], lucky: ['Lucky', '12% chance for double ore'], swift: ['Swift', 'Acts 15% faster'],
  tough: ['Tough', 'You take 8% less damage while it is out'], vampiric: ['Vampiric', 'Heals you for 5% of the damage it deals'], glowing: ['Glowing', 'Shines in the dark'], scholar: ['Scholar', 'Learns 50% faster'],
};
const MAX_PALS = 40, MAX_LV = 60, xpNeed = (lv) => 30 + lv * lv * 6;
const traitKeys = Object.keys(TRAITS);

module.exports = {
  palTraitsInfo() { return TRAITS; },
  palInit(p, prof) {
    p.pals = []; p.pal = null;
    if (prof && Array.isArray(prof.pals)) for (const r of prof.pals.slice(0, MAX_PALS)) if (r && content.pals[r.sp]) p.pals.push({ id: String(r.id), sp: r.sp, lv: Math.min(MAX_LV, r.lv | 0 || 1), xp: r.xp | 0, name: String(r.name || content.pals[r.sp].name).slice(0, 16), traits: (r.traits || []).filter((t) => TRAITS[t]).slice(0, 2), shiny: !!r.shiny });
    if (prof && prof.palActive && p.pals.some((r) => r.id === prof.palActive)) p.pal = { id: prof.palActive, cd: 3, atkCd: 2 };
  },
  palSave(p) { return { pals: p.pals, palActive: p.pal ? p.pal.id : null }; },
  palRec(p, id) { return p.pals.find((r) => r.id === id) || null; },
  palActiveRec(p) { return p.pal ? this.palRec(p, p.pal.id) : null; },
  palHas(p, trait) { const r = this.palActiveRec(p); return !!(r && r.traits.includes(trait)); },
  palStats(r) {
    const sp = content.pals[r.sp], lv = r.lv, has = (t) => r.traits.includes(t);
    return {
      power: 18 + sp.mine * 7 + lv * 2.4, every: Math.max(2.5, (7.5 - lv * 0.06)) * (has('hardworker') ? 0.7 : 1) * (has('swift') ? 0.85 : 1),
      atk: sp.atk * (1 + lv * 0.11) * (has('brave') ? 1.3 : 1) * (r.shiny ? 1.15 : 1), atkEvery: 2.1 * (has('swift') ? 0.85 : 1), tier: sp.mine,
    };
  },
  sendPals(p) {
    this.send(p, { t: 'pals', active: p.pal ? p.pal.id : null, list: p.pals.map((r) => ({ id: r.id, sp: r.sp, lv: r.lv, xp: r.xp, xn: xpNeed(r.lv), name: r.name, traits: r.traits, shiny: r.shiny })), traits: TRAITS });
  },
  palGiveXp(p, r, amt) {
    if (!r || r.lv >= MAX_LV) return; r.xp += Math.round(amt * (r.traits.includes('scholar') ? 1.5 : 1));
    let up = false; while (r.lv < MAX_LV && r.xp >= xpNeed(r.lv)) { r.xp -= xpNeed(r.lv); r.lv++; up = true; }
    if (up) { this.sys(p, `🐾 ${r.name} grew to level ${r.lv}!`); this.events.push({ e: 'lvl', rm: p.room.id, x: rd(p.x), y: rd(p.y - 40) }); this.sendPals(p); }
  },
  palCall(p, id) {
    const r = this.palRec(p, id); if (!r || p.room.island) { if (p.room.island) this.sys(p, 'Pals rest on the mainland.'); return; }
    p.pal = { id: r.id, cd: 3, atkCd: 2 }; this.sys(p, `${r.name} (Lv ${r.lv}) joins you!`); this.sendPals(p);
  },
  palDismiss(p) { if (p.pal) { const r = this.palActiveRec(p); p.pal = null; if (r) this.sys(p, `${r.name} rests.`); this.sendPals(p); } },
  palRename(p, id, name) { const r = this.palRec(p, id); name = String(name || '').replace(/[^\w \-\.!?]/g, '').trim().slice(0, 16); if (r && name) { r.name = name; this.sendPals(p); } },
  palRelease(p, id) { const i = p.pals.findIndex((r) => r.id === id); if (i < 0) return; if (p.pal && p.pal.id === id) p.pal = null; const [r] = p.pals.splice(i, 1); this.sys(p, `You waved goodbye to ${r.name}.`); this.sendPals(p); },

  // ---- active pal: auto-mines nearby ore/rock and fights enemies near its owner
  palTick(p, dt) {
    const pl = p.pal; if (!pl || !p.alive || p.room.island) return;
    const r = this.palActiveRec(p); if (!r) { p.pal = null; return; }
    const st = this.palStats(r), sp = content.pals[r.sp];
    pl.cd -= dt; pl.atkCd -= dt;
    if (pl.atkCd <= 0) {
      let best = null, bd = 340;
      for (const m of this.mobs.values()) { if (m.air > 0 || m.def.wildPal || m.cutUntil > this.time) continue; const d = dist(m.x, m.y, p.x, p.y); if (d < bd && (m.hasTarget || m.boss || m.def.behavior !== 'passive')) { bd = d; best = m; } }
      if (best) {
        pl.atkCd = st.atkEvery * rand(0.9, 1.15);
        const dmg = st.atk * (best.boss ? 0.6 : 1);
        this.events.push({ e: 'palatk', rm: 'main', pid: p.id, x: rd(best.x), y: rd(best.y), c: ELEMENT_COLOR[sp.element] || '#fff', el: sp.element });
        this.hurtMob(best, dmg, p, Math.atan2(best.y - p.y, best.x - p.x), 60);
        if (r.traits.includes('vampiric')) p.hp = Math.min(p.maxHp, p.hp + dmg * 0.05);
        if (sp.element === 'ice') this.applyFx(best, { slow: { mult: 0.6, dur: 1.5 } }); else if (sp.element === 'fire') this.applyFx(best, { burn: { dps: 4 + r.lv * 0.3, dur: 2 } }); else if (sp.element === 'dark' || sp.element === 'void') this.applyFx(best, { slow: { mult: 0.7, dur: 1.2 } });
        this.palGiveXp(p, r, 2);
      } else pl.atkCd = 0.4;
    }
    if (pl.cd > 0) return; pl.cd = st.every * rand(0.9, 1.15);
    let best = null, bd = 380;
    this.world.near(p.x, p.y, 400, (rs) => {
      if (!rs.alive) return; const def = content.nodes[rs.type]; if (def.kind !== 'rock' && def.kind !== 'ore') return;
      if (def.tierReq > st.tier) return;
      const d = dist(p.x, p.y, rs.x, rs.y); if (d < bd) { bd = d; best = rs; }
    });
    if (!best) return;
    const def = content.nodes[best.type]; best.hp -= st.power;
    this.events.push({ e: 'pm', rm: 'main', id: best.id, x: rd(best.x), y: rd(best.y), pid: p.id, hp: Math.max(0, Math.round(best.hp)), max: best.maxHp });
    const lucky = r.traits.includes('lucky') && Math.random() < 0.12;
    for (const dr of def.drops) { if (Math.random() > (dr.chance === undefined ? 1 : dr.chance)) continue; const n = randi(dr.min, dr.max) * (lucky ? 2 : 1); const left = this.addItem(p, dr.item, n); if (left > 0) this.spawnDrop(dr.item, left, p.x, p.y); }
    this.palGiveXp(p, r, 3 + def.tierReq);
    if (best.hp <= 0) this.breakNode(p, best, def, st.tier);
  },

  // ---- taming
  throwSphere(p, def) {
    const sl = p.inv[p.sel]; if (!sl) return; sl.count--; if (sl.count <= 0) p.inv[p.sel] = null; this.sendInv(p);
    p.nextAtk = this.time + 0.55;
    this.shoot('p', p.id, p.x + Math.cos(p.angle) * 24, p.y + Math.sin(p.angle) * 24, p.angle, { kind: 'sphere', speed: 640, life: 0.85, radius: 11, color: def.color, sphere: def.sphere }, 0, null, 'Pal Sphere');
  },
  tameAttempt(p, m, base) {
    if (!p) return;
    this.events.push({ e: 'imp', rm: 'main', x: rd(m.x), y: rd(m.y), k: 'sphere', c: '#ffffff' });
    const wp = m.def.wildPal; if (!wp) { this.sys(p, 'The sphere bounced off. Only wild Pals can be tamed!'); return; }
    if (p.pals.length >= MAX_PALS) { this.sys(p, 'Your Pal box is full. Release one first.'); return; }
    const sp = content.pals[wp], hpFrac = m.hp / m.maxHp;
    const chance = Math.max(0.04, Math.min(0.96, base * (1.18 - hpFrac * 0.95) * (1 - (sp.rarity - 1) * 0.13) * (m.shiny ? 0.75 : 1) * (1 - Math.min(0.3, (m.lv || 1) * 0.004))));
    this.events.push({ e: 'tameshake', rm: 'main', x: rd(m.x), y: rd(m.y), ok: 0 });
    if (Math.random() < chance) {
      this.mobs.delete(m.id);
      const n = Math.random() < 0.3 + sp.rarity * 0.12 ? 2 : 1, traits = []; while (traits.length < n) { const t = traitKeys[Math.floor(Math.random() * traitKeys.length)]; if (!traits.includes(t)) traits.push(t); }
      const rec = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), sp: wp, lv: m.lv || 1, xp: 0, name: sp.name, traits, shiny: !!m.shiny };
      p.pals.push(rec); if (!p.pal) p.pal = { id: rec.id, cd: 3, atkCd: 2 };
      this.events.push({ e: 'tameshake', rm: 'main', x: rd(m.x), y: rd(m.y), ok: 1 });
      this.broadcast({ t: 'chat', sys: 1, m: `🐾 ${p.name} tamed a ${m.shiny ? 'shiny ' : ''}${sp.name} (Lv ${rec.lv})!` });
      this.giveXp(p, 20 + rec.lv * 4); this.sendPals(p);
    } else {
      this.sys(p, `${sp.name} broke free! (${Math.round(chance * 100)}% chance — weaken it first)`);
      m.fleeUntil = this.time + 4; m.fleeFrom = p;
    }
  },
  // wild pals are RARE encounters: roughly one per few minutes of exploring, always spawned outside the screen, no radar
  tickWildPals(dt) {
    this.palSpawnT = (this.palSpawnT || 8) - dt; if (this.palSpawnT > 0) return; this.palSpawnT = 12;
    for (const p of this.main.players) {
      if (!p.alive || p.room.island || this.world.gen.dimAt(p.x, p.y) || this.inSafe(p.x, p.y)) continue;
      let near = 0; for (const m of this.mobs.values()) if (m.def.wildPal && dist(m.x, m.y, p.x, p.y) < 2100) near++;
      if (near >= 1 || Math.random() > 0.11) continue;
      for (let tries = 0; tries < 6; tries++) {
        const a = Math.random() * 6.28, r = rand(1050, 1500), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
        if (!this.inBounds(x, y) || this.world.gen.waterAt(x, y) || this.world.gen.dimAt(x, y) || this.inSafe(x, y)) continue;
        const type = this.palSpawn(this.world.biomeAt(x, y), this.world.zone(x, y)); if (!type) continue;
        this.spawnMob(type, x, y); break;
      }
    }
  },
  palSpawn(biomeId, zn) {
    const b = require('../content').biomes[biomeId]; if (!b || !b.pals) return null;
    const total = Object.values(b.pals).reduce((a, w) => a + w, 0); let r = Math.random() * total;
    for (const [id, w] of Object.entries(b.pals)) { r -= w; if (r <= 0) return 'wild_' + id; }
    return null;
  },
};
