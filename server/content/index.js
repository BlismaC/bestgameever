'use strict';
// Content registry: assembles every item/recipe/mob/boss from the data files, validates it,
// and builds the compact payload sent to clients.
const materials = require('./materials');
const archetypes = require('./archetypes');
const modifiers = require('./modifiers');
const baseItems = require('./items');
const uniques = require('./uniques');
const nodes = require('./nodes');
const biomes = require('./biomes');
const mobsData = require('./mobs');
const bossesData = require('./bosses');
const structures = require('./structures');

const items = {};
const recipes = {};

const r1 = (n) => Math.round(n * 10) / 10;

// ---- base items ----
for (const [id, d] of Object.entries(baseItems)) items[id] = { id, rarity: 'common', stack: 99, ...d };

// ---- materials become items ----
for (const m of materials) {
  items[m.id] = { id: m.id, name: m.name, emoji: m.emoji, color: m.color, type: 'material', rarity: 'common', tier: m.tier, stack: 99 };
}


// ---- crafting difficulty ----
// Weapons need: lots of the main material, a wooden handle, leather grip, a chunk of the PREVIOUS tier's material,
// rare accents at high tiers, and a crafting station that matches the tier.
const STATION_BY_TIER = ['workbench', 'workbench', 'forge', 'forge', 'arcane_altar', 'arcane_altar', 'void_anvil', 'void_anvil'];
function weaponCost(mat, arch) {
  const t = mat.tier, cost = {};
  cost[mat.id] = Math.ceil(arch.cost * (1 + t * 0.22));
  if (mat.id !== 'wood') cost.wood = (cost.wood || 0) + 3;
  if (t >= 1) cost.leather = 2 + Math.floor(t / 2);
  if (t >= 1) { const prev = materials.find((m) => m.tier === t - 1 && m.id !== mat.id); if (prev) cost[prev.id] = (cost[prev.id] || 0) + Math.ceil(arch.cost / 2) + t; }
  if (t >= 4) cost.gold = (cost.gold || 0) + 3;
  if (t >= 6) cost.obsidian = (cost.obsidian || 0) + 5;
  if (t >= 7) cost.shadow = (cost.shadow || 0) + 3;
  return cost;
}

// ---- weapons: material x archetype x modifier ----
const HAND = { id: 'hand', name: 'Fists', dmg: 4, cooldown: 0.5, melee: { range: 48, arc: 90, knock: 60 }, toolTier: 0, gather: { tree: 0.6, rock: 0.3, ore: 0.2 } };
let weaponCount = 0;
for (const mat of materials) {
  for (const arch of archetypes) {
    for (const mod of modifiers) {
      const id = mod.id === 'normal' ? `${mat.id}_${arch.id}` : `${mod.id}_${mat.id}_${arch.id}`;
      const dmg = r1(arch.dmg * mat.dmg * mod.dmg);
      const w = {
        dmg, cooldown: r1(arch.cd * mod.cd * 100) / 100,
        melee: arch.melee || null,
        projectile: arch.projectile ? { ...arch.projectile, color: mat.color } : null,
        toolTier: mat.tier, gather: arch.gather || { tree: 0.3, rock: 0.2, ore: 0.2 },
      };
      if (mod.fx) {
        w.fx = {};
        for (const [k, v] of Object.entries(mod.fx)) {
          w.fx[k] = (k === 'burn' || k === 'poison') ? { dps: r1(dmg * v.dpsMul), dur: v.dur } : v;
        }
      }
      items[id] = {
        id, name: `${mod.name ? mod.name + ' ' : ''}${mat.name} ${arch.name}`, emoji: arch.emoji, color: mat.color,
        type: 'weapon', rarity: mod.rarity, tier: mat.tier, stack: 1, weapon: w,
        arch: arch.id, mat: mat.id, mod: mod.id,
      };
      weaponCount++;
      if (mod.id === 'normal') recipes[id] = { id, out: id, count: 1, cost: weaponCost(mat, arch), station: STATION_BY_TIER[mat.tier] };
    }
  }
}

// ---- unique weapons ----
for (const [id, u] of Object.entries(uniques)) {
  const w = { ...u.weapon, melee: u.weapon.melee || null, projectile: u.weapon.projectile ? { color: u.weapon.color || '#fff', ...u.weapon.projectile } : null };
  items[id] = { id, name: u.name, emoji: u.emoji, color: u.color, type: 'weapon', rarity: u.rarity, tier: u.tier, stack: 1, desc: u.desc, weapon: w, unique: true };
}

// ---- mobs & bosses ----
const mobs = {};
for (const [id, d] of Object.entries(mobsData)) mobs[id] = { id, boss: false, dmg: 0, ...d };
for (const [id, d] of Object.entries(bossesData)) {
  mobs[id] = { id, ...d, boss: true };
  if (d.summon) {
    const sid = `summon_${id}`;
    items[sid] = { id: sid, name: d.summon.name, emoji: d.summon.emoji, color: d.color, type: 'consumable', rarity: 'epic', stack: 9,
      desc: `Summons ${d.name}.`, use: { summon: id } };
    recipes[sid] = { id: sid, out: sid, count: 1, cost: d.summon.cost, station: d.summon.station || 'arcane_altar' };
  }
}


// ---- structures: placeable items + recipes ----
for (const [id, d] of Object.entries(structures)) {
  items[id] = { id, name: d.name, emoji: d.emoji, color: d.color, type: 'structure', rarity: 'common', stack: 50, desc: d.desc, place: id };
  recipes[id] = { id, out: id, count: 1, cost: d.cost, station: d.station };
}

// ---- extra hand-written recipes ----
const extra = {
  potion_heal:  { out: 'potion_heal', count: 2, cost: { berries: 8, slime_gel: 4 }, station: 'alchemy_table' },
  potion_speed: { out: 'potion_speed', count: 1, cost: { apple: 4, gold: 2, slime_gel: 4 }, station: 'alchemy_table' },
  hissing_bomb: { out: 'hissing_bomb', count: 1, cost: { stone: 14, slime_gel: 8, copper: 4 }, station: 'workbench' },
  companion_cube_launcher: { out: 'companion_cube_launcher', count: 1, cost: { titanium: 8, steel: 12, plasma: 2 }, station: 'void_anvil' },
  tome_of_xp: { out: 'tome_of_xp', count: 1, cost: { amethyst: 3, bone: 20 }, station: 'arcane_altar' },
};
for (const [id, r] of Object.entries(extra)) recipes[id] = { id, ...r };

// ---- helpers ----
const matsByTier = {};
for (const m of materials) (matsByTier[m.tier] = matsByTier[m.tier] || []).push(m);
const modIds = modifiers.map((m) => m.id);

function randomWeapon(tMin, tMax, mods) {
  const pool = (mods && mods.length ? mods : modIds.filter((m) => m !== 'normal'));
  for (let tries = 0; tries < 6; tries++) {
    const t = tMin + Math.floor(Math.random() * (tMax - tMin + 1));
    const ms = matsByTier[t];
    if (!ms) continue;
    const mat = ms[Math.floor(Math.random() * ms.length)];
    const arch = archetypes[Math.floor(Math.random() * archetypes.length)];
    const mod = pool[Math.floor(Math.random() * pool.length)];
    const id = mod === 'normal' ? `${mat.id}_${arch.id}` : `${mod}_${mat.id}_${arch.id}`;
    if (items[id]) return id;
  }
  return null;
}

// ---- validation: catches typos & unobtainable stuff as the content grows ----
function validate() {
  const problems = [];
  const obtainable = new Set();
  const dropItems = (tbl) => (tbl || []).forEach((d) => { if (d.item) { obtainable.add(d.item); if (!items[d.item]) problems.push(`drop of unknown item "${d.item}"`); } });
  Object.values(nodes).forEach((n) => dropItems(n.drops));
  Object.values(mobs).forEach((m) => dropItems(m.drops));
  for (const r of Object.values(recipes)) {
    obtainable.add(r.out);
    for (const k of Object.keys(r.cost)) if (!items[k]) problems.push(`recipe ${r.id} needs unknown item "${k}"`);
  }
  for (const m of materials) if (!obtainable.has(m.id)) problems.push(`material "${m.id}" has no source (node/mob/boss drop)`);
  for (const [bid, b] of Object.entries(biomes)) {
    for (const k of Object.keys(b.resources)) if (!nodes[k]) problems.push(`biome ${bid}: unknown node "${k}"`);
    for (const k of Object.keys(b.mobs)) if (!mobs[k]) problems.push(`biome ${bid}: unknown mob "${k}"`);
    for (const k of b.bosses || []) if (!mobs[k]) problems.push(`biome ${bid}: unknown boss "${k}"`);
  }
  for (const m of Object.values(mobs)) {
    for (const p of m.patterns || []) if (p.type === 'summon' && !mobs[p.mob]) problems.push(`boss ${m.id} summons unknown "${p.mob}"`);
  }
  for (const r of Object.values(recipes)) if (r.station && !structures[r.station]) problems.push(`recipe ${r.id} needs unknown station "${r.station}"`);
  for (const [id, d] of Object.entries(structures)) for (const k of Object.keys(d.cost)) if (!items[k]) problems.push(`structure ${id} cost unknown item "${k}"`);
  return problems;
}

function clientPayload() {
  const ci = {};
  for (const it of Object.values(items)) {
    const o = { n: it.name, e: it.emoji, c: it.color, r: it.rarity, ty: it.type };
    if (it.tier !== undefined) o.t = it.tier;
    if (it.desc) o.d = it.desc;
    if (it.use) o.u = 1;
    if (it.place) o.pl = 1;
    if (it.weapon) { o.w = { dmg: it.weapon.dmg, cd: it.weapon.cooldown, rng: it.weapon.melee ? it.weapon.melee.range : 0, arc: it.weapon.melee ? it.weapon.melee.arc : 0, rngd: it.weapon.projectile ? 1 : 0 }; if (it.arch) o.a = it.arch; }
    ci[it.id] = o;
  }
  const cm = {}; for (const m of Object.values(mobs)) cm[m.id] = { n: m.name, e: m.emoji, c: m.color, r: m.radius, b: m.boss ? 1 : 0 };
  const cn = {}; for (const [id, n] of Object.entries(nodes)) cn[id] = { n: n.name, s: n.shape, c: n.color, c2: n.color2, r: n.radius, solid: n.solid === false ? 0 : 1 };
  const cb = {}; for (const [id, b] of Object.entries(biomes)) cb[id] = { n: b.name, c: b.color, c2: b.color2 };
  return {
    items: ci, mobs: cm, nodes: cn, biomes: cb,
    recipes: Object.values(recipes).map((r) => ({ id: r.id, o: r.out, n: r.count, c: r.cost, s: r.station || null })),
    structures: Object.fromEntries(Object.entries(structures).map(([id, d]) => [id, { n: d.name, e: d.emoji, c: d.color, r: d.r, t: d.type, solid: d.solid ? 1 : 0, p: d.provides || null, hr: d.healRange || 0 }])),
  };
}

const stats = () => ({ items: Object.keys(items).length, weapons: weaponCount + Object.keys(uniques).length, recipes: Object.keys(recipes).length, mobs: Object.keys(mobs).length, nodes: Object.keys(nodes).length });

module.exports = { items, recipes, mobs, nodes, biomes, structures, HAND, randomWeapon, validate, clientPayload, stats };
