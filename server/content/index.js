'use strict';
// Content registry: assembles every item/recipe/mob/boss from the data files, validates it,
// and builds the compact payload sent to clients.
const materials = require('./materials');
const archetypes = require('./archetypes');
const modifiers = require('./modifiers');
const buffs = require('./buffs');
const baseItems = require('./items');
const { HAND: handUniques, SPEC: specUniques } = require('./uniques');
const nodes = require('./nodes');
const biomes = require('./biomes');
const mobsData = require('./mobs');
const bossesData = require('./bosses');
const structures = require('./structures');
const events = require('./events');
const npcs = require('./npcs');
const fusions = require('./fusions');
const pals = require('./pals');
const mounts = require('./mounts');
const armor = require('./armor');
armor.materialSets(materials); armor.bossSets();
// boss loot: armor pieces (35% each) + a guaranteed golden trophy for your island
for (const [bid, b] of Object.entries(bossesData)) {
  const set = armor.sets['b_' + bid]; if (set) for (const pid of Object.values(set.pieces)) b.drops.push({ item: pid, chance: 0.35 });
  structures['trophy_' + bid] = { name: `${b.name} Trophy`, emoji: '🏆', color: '#ffd23f', r: 26, hp: 300, solid: false, kind: 'metal', type: 'decor', cost: {}, station: null, noRecipe: true, desc: `A golden trophy of ${b.name}. Display it on your island.`, limitMain: 0, limitHome: 1, homeOnly: true };
  b.drops.push({ item: 'trophy_' + bid, chance: 1 });
}

const items = {};
const recipes = {};
const r1 = (n) => Math.round(n * 10) / 10;
const TIERDMG = [1, 1.5, 2.2, 3, 4.2, 5.5, 7.2, 9.5];

// ---- base items ----
for (const [id, d] of Object.entries(baseItems)) items[id] = { id, rarity: 'common', stack: 99, value: 1, ...d };

// ---- materials become items ----
for (const m of materials) items[m.id] = { id: m.id, name: m.name, emoji: m.emoji, color: m.color, type: 'material', rarity: 'common', tier: m.tier, stack: 99, value: Math.round(3 * Math.pow(m.tier + 1, 1.7)) };

// ---- armor / mounts / pals ----
for (const it of Object.values(armor.items)) items[it.id] = { ...it };
for (const [id, m] of Object.entries(mounts)) if (!m.noItem) items['mount_' + id] = { id: 'mount_' + id, name: m.name, emoji: m.flying ? '🪽' : '🐎', color: m.color, type: 'mount', rarity: 'epic', stack: 1, value: 400, desc: m.desc + (m.flying ? ' (flying)' : ''), mount: id };

// ---- crafting difficulty ----
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

// ---- weapons: material x archetype (modifiers are rolled per item instance) ----
const HAND = { id: 'hand', name: 'Fists', dmg: 4, cooldown: 0.5, crit: 2, melee: { range: 48, arc: 90, knock: 60 }, toolTier: 0, tool: null };
let weaponCount = 0;
for (const mat of materials) for (const arch of archetypes) {
  const id = `${mat.id}_${arch.id}`, dmg = r1(arch.dmg * mat.dmg);
  items[id] = {
    id, name: `${mat.name} ${arch.name}`, emoji: arch.emoji, color: mat.color, type: 'weapon', rarity: 'common', tier: mat.tier, stack: 1, arch: arch.id, mat: mat.id,
    value: Math.round(arch.dmg * mat.dmg * 2.2),
    weapon: { dmg, cooldown: Math.round(arch.cd * 100) / 100, crit: arch.crit, melee: arch.melee || null, projectile: arch.projectile ? { ...arch.projectile, color: mat.color } : null, toolTier: mat.tier, tool: arch.tool || null },
  };
  weaponCount++;
  recipes[id] = { id, out: id, count: 1, cost: weaponCost(mat, arch), station: STATION_BY_TIER[mat.tier] };
}

// ---- unique weapons ----
for (const [id, u] of Object.entries(handUniques)) {
  const w = { ...u.weapon, melee: u.weapon.melee || null, projectile: u.weapon.projectile ? { color: u.weapon.color || '#fff', ...u.weapon.projectile } : null, tool: null };
  items[id] = { id, name: u.name, emoji: u.emoji, color: u.color, type: 'weapon', rarity: u.rarity, tier: u.tier, stack: 1, desc: u.desc, weapon: w, unique: true, value: Math.round(w.dmg * 6) };
}
const archById = Object.fromEntries(archetypes.map((a) => [a.id, a]));
const BOSS_WEAPONS = new Set(['royal_gel_blade', 'bouncy_gel_staff', 'thorn_bow', 'ent_club', 'sun_scepter', 'khopesh', 'glacier_hammer', 'blizzard_staff', 'bog_lash', 'rotwood_bow', 'wyrm_lance', 'hellfire_bow', 'lich_scythe', 'soul_tome', 'void_edge', 'eclipse_staff', 'cog_cleaver', 'cog_repeater', 'star_wrath', 'dread_lens', 'eye_scythe', 'volcano']);
const RAR = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
for (const [id, [name, aId, tier, color, dmgMul, fx, extra]] of Object.entries(specUniques)) {
  const a = archById[aId], x = extra || {};
  const dmg = r1(a.dmg * TIERDMG[tier] * dmgMul * (BOSS_WEAPONS.has(id) ? 1.35 : 1));
  const proj = a.projectile || x.proj ? { ...(a.projectile || {}), ...(x.proj || {}), color } : null;
  const w = { dmg, cooldown: x.cd || a.cd, crit: x.crit !== undefined ? x.crit : a.crit, melee: x.melee || a.melee || null, projectile: x.proj && !a.projectile && !a.melee ? proj : (x.proj ? proj : (a.projectile ? proj : null)), toolTier: tier, tool: a.tool || null };
  if (fx) { w.fx = {}; for (const [k, v] of Object.entries(fx)) w.fx[k] = v; }
  const rarity = x.rarity || (id.match(/^(bovine|egg|croak|slimy|goblin_shiv|fang|widow|bone_c|rotten|bandit|sting|wrap|yeti|frost|witch|imp|magma_m|soul_r|wyvern|eye_s)/) ? 'rare' : 'epic');
  items[id] = { id, name, emoji: a.emoji, color, type: 'weapon', rarity, tier, stack: 1, desc: x.desc, weapon: w, arch: aId, unique: true, value: Math.round(dmg * 6) };
}
// ---- fusion weapons (crafted from other weapons)
for (const [id, [name, aId, tier, color, dmgMul, fx, x, cost, station]] of Object.entries(fusions)) {
  const a = archById[aId], dmg = r1(a.dmg * TIERDMG[tier] * dmgMul);
  const proj = x.proj ? { ...x.proj, color } : (a.projectile ? { ...a.projectile, color } : null);
  const w = { dmg, cooldown: x.cd || a.cd, crit: x.crit !== undefined ? x.crit : a.crit, melee: x.melee || a.melee || null, projectile: proj, toolTier: tier, tool: null };
  if (fx) w.fx = { ...fx };
  items[id] = { id, name, emoji: a.emoji, color, type: 'weapon', rarity: x.rarity || 'epic', tier, stack: 1, desc: x.desc, weapon: w, arch: aId, unique: true, fusion: true, value: Math.round(dmg * 12) };
  recipes[id] = { id, out: id, count: 1, cost, station };
}
// Forged uniques (craftable): hellstone gear
recipes.volcano = { id: 'volcano', out: 'volcano', count: 1, cost: { hellstone: 22, obsidian: 8, iron: 10, leather: 4 }, station: 'forge' };
recipes.hellfire_bow = { id: 'hellfire_bow', out: 'hellfire_bow', count: 1, cost: { hellstone: 18, obsidian: 6, wood: 12, leather: 4 }, station: 'forge' };

// ---- mobs & bosses ----
const mobs = {};
for (const [id, d] of Object.entries(mobsData)) mobs[id] = { id, boss: false, dmg: 0, ...d };
for (const [id, d] of Object.entries(bossesData)) {
  mobs[id] = { id, ...d, boss: true };
  if (d.summon) {
    const sid = `summon_${id}`;
    items[sid] = { id: sid, name: d.summon.name, emoji: d.summon.emoji, color: d.color, type: 'consumable', rarity: 'epic', stack: 9, value: 300, desc: `Summons ${d.name}.`, use: { summon: id } };
    recipes[sid] = { id: sid, out: sid, count: 1, cost: d.summon.cost, station: d.summon.station || 'arcane_altar' };
  }
}

// wild, tameable pals: they roam as "Wild <name>" mobs (see server/systems/pals.js for taming)
for (const [id, p] of Object.entries(pals)) mobs['wild_' + id] = { id: 'wild_' + id, name: p.name, emoji: '🐾', color: p.color, radius: 18 + p.rarity * 3, hp: 60 + p.rarity * 55 + p.mine * 15, speed: 85 + p.rarity * 12, dmg: 6 + Math.round(p.atk * 0.5), behavior: 'passive', xp: 0, wildPal: id, rarity: p.rarity, drops: [] };
// spawn weights: every biome in a pal's habitat can spawn it (rare pals very rarely)
for (const [id, p] of Object.entries(pals)) for (const b of p.habitat) if (biomes[b]) { biomes[b].pals = biomes[b].pals || {}; biomes[b].pals[id] = [3, 1.6, 0.8, 0.3][p.rarity - 1]; }


// ---- v0.7+: every monster family gets its OWN projectile art; some get arcing "lob" bombs that leave poison / fire / ice zones
{
  const REMAP = { giant_hornet: { thorn: 'stinger' }, treant: { thorn: 'leaf' }, jungle_golem: { thorn: 'leaf' }, sand_elemental: { magic: 'sand' }, harpy: { bolt: 'feather' }, crystal_golem: { ice: 'shard', magic: 'shard' },
    rock_golem: { bone: 'rock' }, jellyfish: { bolt: 'spark' }, scarecrow: { bone: 'crow' }, ghost_pumpkin: { fire: 'wisp' }, pumpkin_head: { thorn: 'seed' }, gingerbread_brute: { star: 'cookie' }, snowman_gunner: { ice: 'snowball' }, gargoyle: { bolt: 'rock' },
    dracula: { orb: 'bloodorb' }, evil_santa: { star: 'candy' }, neptune: { wave: 'wave' }, elf_archer: {}, vampire_bat: {} };
  const kindFix = (id, pr) => { const m = REMAP[id]; if (m && pr && m[pr.kind]) pr.kind = m[pr.kind]; };
  for (const [id, d] of Object.entries(mobs)) { if (d.ranged) kindFix(id, d.ranged.proj); for (const a of d.abilities || []) kindFix(id, a.proj); for (const p of d.patterns || []) if (REMAP[id] && REMAP[id][p.kind]) p.kind = REMAP[id][p.kind]; }
  if (mobs.scarecrow && mobs.scarecrow.ranged) Object.assign(mobs.scarecrow.ranged.proj, { beh: 'homing', turn: 1.6 });
  const Z = (kind, radius, dur, dps, fx) => ({ kind, radius, dur, dps, fx: fx || null });
  const LOB = {
    pumpkin_head:  { type: 'lob', cd: 7, range: 540, flight: 1.0, radius: 90, dmg: 30, kind: 'pumpkin', zone: Z('fire', 75, 3, 16) },
    toxic_slime:   { type: 'lob', cd: 8, range: 520, flight: 0.9, radius: 85, dmg: 22, kind: 'poison', zone: Z('poison', 80, 4, 12, { poison: { dps: 5, dur: 3 } }) },
    lava_slime:    { type: 'lob', cd: 9, range: 540, flight: 0.95, radius: 85, dmg: 30, kind: 'fire', zone: Z('fire', 80, 3.5, 18, { burn: { dps: 6, dur: 2 } }) },
    plague_zombie: { type: 'lob', cd: 10, range: 500, flight: 1.0, radius: 90, dmg: 36, kind: 'poison', zone: Z('poison', 90, 4.5, 15, { poison: { dps: 7, dur: 3 } }) },
    bog_witch:     { type: 'lob', cd: 10, range: 560, flight: 1.05, radius: 95, dmg: 24, kind: 'poison', zone: Z('poison', 95, 5, 12, { poison: { dps: 6, dur: 3 } }) },
    fire_elemental:{ type: 'lob', cd: 9, range: 600, flight: 0.9, radius: 95, dmg: 36, kind: 'fire', zone: Z('fire', 90, 4, 20, { burn: { dps: 8, dur: 2 } }) },
    pit_demon:     { type: 'lob', cd: 8, range: 620, flight: 0.95, radius: 110, dmg: 48, kind: 'fire', zone: Z('lava', 100, 5, 26, { burn: { dps: 10, dur: 2 } }) },
    snowman_gunner:{ type: 'lob', cd: 8, range: 560, flight: 0.9, radius: 90, dmg: 26, kind: 'snowball', zone: Z('ice', 85, 4, 10, { slow: { mult: 0.5, dur: 2 } }) },
  };
  for (const [id, a] of Object.entries(LOB)) if (mobs[id]) (mobs[id].abilities = mobs[id].abilities || []).push(a);
  if (mobs.evil_santa) mobs.evil_santa.patterns.push({ type: 'lob', cd: 9, n: 1, flight: 1.1, radius: 130, dmg: 56, kind: 'present', height: 200, zone: Z('fire', 90, 3, 20) }, { type: 'lob', cd: 12, flight: 1.0, radius: 120, dmg: 50, kind: 'present', height: 190, phase: 1 });
  if (mobs.pumpking) mobs.pumpking.patterns.push({ type: 'lob', cd: 8, flight: 1.1, radius: 120, dmg: 50, kind: 'pumpkin', height: 200, zone: Z('fire', 100, 4, 22) });
  if (mobs.neptune) mobs.neptune.patterns.push({ type: 'lob', cd: 10, flight: 1.0, radius: 125, dmg: 52, kind: 'water', height: 190, zone: Z('water', 105, 4, 16, { slow: { mult: 0.55, dur: 2 } }), phase: 1 });
  if (mobs.dracula) mobs.dracula.patterns.push({ type: 'lob', cd: 11, flight: 1.0, radius: 115, dmg: 52, kind: 'bloodorb', height: 190, zone: Z('blood', 100, 4, 20), phase: 1 });
}

// ---- structures: placeable items + recipes ----
for (const [id, d] of Object.entries(structures)) {
  items[id] = { id, name: d.name, emoji: d.emoji, color: d.color, type: 'structure', rarity: 'common', stack: 999, value: d.type === 'decor' ? 800 : 10, desc: d.desc + (d.homeOnly ? ' (Island only)' : ''), place: id };
  if (!d.noRecipe) recipes[id] = { id, out: id, count: 1, cost: d.cost, station: d.station };
}

// ---- armor + mount recipes ----
const STATION_T = ['workbench', 'workbench', 'forge', 'forge', 'arcane_altar', 'arcane_altar', 'void_anvil', 'void_anvil'];
for (const m of materials) for (const [slot, n] of [['helmet', 10], ['chest', 16], ['legs', 12]]) {
  const pid = `${m.id}_${slot}`, cost = { [m.id]: Math.ceil(n * (1 + m.tier * 0.2)) }; if (m.id !== 'leather') cost.leather = 2 + m.tier;
  recipes[pid] = { id: pid, out: pid, count: 1, cost, station: STATION_T[m.tier] };
}
for (const [id, m] of Object.entries(mounts)) if (m.cost && !m.noItem) recipes['mount_' + id] = { id: 'mount_' + id, out: 'mount_' + id, count: 1, cost: m.cost, station: m.station };

// ---- Pal Spheres (tools for taming) ----
recipes.pal_sphere = { id: 'pal_sphere', out: 'pal_sphere', count: 3, cost: { slime_gel: 4, iron: 2 }, station: 'workbench' };
recipes.pal_sphere_great = { id: 'pal_sphere_great', out: 'pal_sphere_great', count: 2, cost: { pal_sphere: 2, gold: 2, slime_gel: 6 }, station: 'forge' };
recipes.pal_sphere_ultra = { id: 'pal_sphere_ultra', out: 'pal_sphere_ultra', count: 1, cost: { pal_sphere_great: 1, crystal: 3, ectoplasm: 2 }, station: 'arcane_altar' };
// ---- hand-written recipes ----
const extra = {
  potion_heal:  { out: 'potion_heal', count: 2, cost: { berries: 8, slime_gel: 4 }, station: 'alchemy_table' },
  potion_greater_heal: { out: 'potion_greater_heal', count: 1, cost: { potion_heal: 3, ruby: 2, gold: 2 }, station: 'alchemy_table' },
  potion_regen: { out: 'potion_regen', count: 1, cost: { apple: 3, slime_gel: 4, berries: 6 }, station: 'alchemy_table' },
  potion_swift: { out: 'potion_swift', count: 1, cost: { apple: 4, gold: 2, slime_gel: 4 }, station: 'alchemy_table' },
  potion_ironskin: { out: 'potion_ironskin', count: 1, cost: { iron: 3, slime_gel: 4, berries: 4 }, station: 'alchemy_table' },
  potion_wrath: { out: 'potion_wrath', count: 1, cost: { lens: 2, ruby: 1, slime_gel: 4 }, station: 'alchemy_table' },
  cooked_meat:  { out: 'cooked_meat', count: 1, cost: { meat: 2 }, station: 'campfire' },
  hissing_bomb: { out: 'hissing_bomb', count: 1, cost: { stone: 14, slime_gel: 8, copper: 4 }, station: 'workbench' },
  companion_cube_launcher: { out: 'companion_cube_launcher', count: 1, cost: { titanium: 8, steel: 12, plasma: 2 }, station: 'void_anvil' },
  tome_of_xp: { out: 'tome_of_xp', count: 1, cost: { amethyst: 3, bone: 20 }, station: 'arcane_altar' },
};
for (const [id, r] of Object.entries(extra)) recipes[id] = { id, ...r };
// campfire doubles as a cooking station
structures.campfire.provides = 'campfire';

for (const it of Object.values(items)) if (!it.weapon && it.type !== 'armor' && it.type !== 'mount' && it.type !== 'pal') it.stack = it.type === 'structure' ? 999 : 9999;
// ---- helpers ----
const matsByTier = {};
for (const m of materials) (matsByTier[m.tier] = matsByTier[m.tier] || []).push(m);
function randomWeapon(tMin, tMax) {
  for (let tries = 0; tries < 6; tries++) {
    const t = tMin + Math.floor(Math.random() * (tMax - tMin + 1)), ms = matsByTier[t]; if (!ms) continue;
    const mat = ms[Math.floor(Math.random() * ms.length)], arch = archetypes[Math.floor(Math.random() * archetypes.length)];
    const id = `${mat.id}_${arch.id}`; if (items[id]) return id;
  }
  return null;
}
const modWeights = modifiers.map((m) => (m.tier < 0 ? 0.7 : 1));
function rollModifier(chance = 0.75) {
  if (Math.random() > chance) return null;
  let tot = 0; for (const w of modWeights) tot += w;
  let r = Math.random() * tot;
  for (let i = 0; i < modifiers.length; i++) { r -= modWeights[i]; if (r <= 0) return modifiers[i].id; }
  return modifiers[0].id;
}
const modById = Object.fromEntries(modifiers.map((m) => [m.id, m]));

function validate() {
  const problems = [];
  const obtainable = new Set(['coin']);
  const dropItems = (tbl) => (tbl || []).forEach((d) => { if (d.item) { obtainable.add(d.item); if (!items[d.item]) problems.push(`drop of unknown item "${d.item}"`); } });
  Object.values(nodes).forEach((n) => dropItems(n.drops));
  Object.values(mobs).forEach((m) => dropItems(m.drops));
  for (const r of Object.values(recipes)) { obtainable.add(r.out); for (const k of Object.keys(r.cost)) if (!items[k]) problems.push(`recipe ${r.id} needs unknown item "${k}"`); }
  for (const m of materials) if (!obtainable.has(m.id)) problems.push(`material "${m.id}" has no source`);
  for (const id of Object.keys(specUniques)) if (!obtainable.has(id)) problems.push(`unique "${id}" is not dropped or craftable`);
  for (const [bid, b] of Object.entries(biomes)) {
    for (const k of Object.keys(b.resources)) if (!nodes[k]) problems.push(`biome ${bid}: unknown node "${k}"`);
    for (const k of Object.keys(b.mobs)) if (!mobs[k]) problems.push(`biome ${bid}: unknown mob "${k}"`);
    for (const k of b.bosses || []) if (!mobs[k]) problems.push(`biome ${bid}: unknown boss "${k}"`);
  }
  for (const m of Object.values(mobs)) for (const p of m.patterns || []) if (p.type === 'summon' && !mobs[p.mob]) problems.push(`boss ${m.id} summons unknown "${p.mob}"`);
  for (const [id, e] of Object.entries(events)) { if (!mobs[e.boss]) problems.push(`event ${id}: unknown boss`); for (const k of Object.keys(e.spawn)) if (!mobs[k]) problems.push(`event ${id}: unknown mob ${k}`); }
  for (const r of Object.values(recipes)) if (r.station && !structures[r.station]) problems.push(`recipe ${r.id} needs unknown station "${r.station}"`);
  for (const n of npcs) for (const [it] of n.shop || []) if (!items[it]) problems.push(`npc ${n.id} sells unknown ${it}`);
  for (const [id, d] of Object.entries(structures)) for (const k of Object.keys(d.cost)) if (!items[k]) problems.push(`structure ${id} cost unknown item "${k}"`);
  return problems;
}

function sourcesMap() {
  const src = {}; const add = (id, t) => { (src[id] = src[id] || []); if (!src[id].includes(t) && src[id].length < 5) src[id].push(t); };
  for (const n of Object.values(nodes)) for (const d of n.drops) add(d.item, `Mine: ${n.name}`);
  for (const m of Object.values(mobs)) for (const d of m.drops || []) if (d.item) add(d.item, `${m.boss ? 'Boss drop' : 'Dropped by'}: ${m.name}`);
  for (const n of npcs) for (const [it] of n.shop || []) add(it, `Sold by ${n.name}`);
  for (const r of Object.values(recipes)) add(r.out, r.station ? `Craft at: ${structures[r.station].name}` : 'Craft by hand');
  return src;
}
function clientPayload() {
  const ci = {};
  for (const it of Object.values(items)) {
    const o = { n: it.name, e: it.emoji, c: it.color, r: it.rarity, ty: it.type, v: it.value || 0 };
    if (it.tier !== undefined) o.t = it.tier;
    if (it.desc) o.d = it.desc;
    if (it.type === 'armor') { const st = armor.sets[it.set]; o.ar = { slot: it.slot, def: it.defense, set: it.set, look: st.look }; }
    if (it.mount) o.mt = it.mount;
    if (it.sphere) o.sp = it.sphere;
    if (it.use) { o.u = 1; if (it.use.heal) o.hl = it.use.heal; if (it.use.buffs) o.bf = it.use.buffs; }
    if (it.place) o.pl = 1;
    if (it.weapon) {
      const w = it.weapon;
      o.w = { dmg: w.dmg, cd: w.cooldown, crit: w.crit || 0, kb: w.melee ? w.melee.knock : (w.projectile ? 80 : 0), rng: w.melee ? w.melee.range : 0, arc: w.melee ? w.melee.arc : 0, rngd: w.projectile ? 1 : 0, tool: w.tool || null, pk: w.projectile ? w.projectile.kind : null, beh: w.projectile ? w.projectile.beh || null : null, np: w.projectile ? w.projectile.count || 1 : 0, pj: w.projectile ? [w.projectile.speed, w.projectile.spread || 0, w.projectile.radius || 8, w.projectile.color || '#fff', w.projectile.life || 1] : 0 };
      if (w.fx) o.w.fx = Object.entries(w.fx).map(([k, v]) => (k === 'lifesteal' ? ['lifesteal', v] : [k, v.dps || v.mult]));
      if (it.arch) o.a = it.arch;
    }
    ci[it.id] = o;
  }
  const cm = {}; for (const m of Object.values(mobs)) cm[m.id] = { n: m.name, e: m.emoji, c: m.color, r: m.radius, b: m.boss ? 1 : 0, wp: m.wildPal || 0, rar: m.rarity || 0, sp: m.special ? 1 : 0 };
  const cn = {}; for (const [id, n] of Object.entries(nodes)) cn[id] = { n: n.name, s: n.shape, c: n.color, c2: n.color2, r: n.radius, solid: n.solid === false ? 0 : 1, k: n.kind };
  const cb = {}; for (const [id, b] of Object.entries(biomes)) cb[id] = { n: b.name, c: b.color, c2: b.color2, m: b.music };
  return {
    src: sourcesMap(), items: ci, mobs: cm, nodes: cn, biomes: cb,
    mods: Object.fromEntries(modifiers.map((m) => [m.id, { n: m.n, d: m.dmg, c: m.crit, k: m.kb, t: m.tier, v: m.value }])),
    buffs: Object.fromEntries(Object.entries(buffs).map(([id, b]) => [id, { n: b.name, g: b.good, d: b.desc }])),
    recipes: Object.values(recipes).map((r) => ({ id: r.id, o: r.out, n: r.count, c: r.cost, s: r.station || null })),
    structures: Object.fromEntries(Object.entries(structures).map(([id, d]) => [id, { n: d.name, e: d.emoji, c: d.color, r: d.r, t: d.type, solid: d.solid ? 1 : 0, p: d.provides || null, hr: d.healRange || 0, ho: d.homeOnly ? 1 : 0, lm: d.limitMain, lh: d.limitHome }])),
    sets: Object.fromEntries(Object.values(armor.sets).map((st) => [st.id, { n: st.name, c: st.color, b: st.bonus, p: st.pieces, look: st.look }])),
    mounts: Object.fromEntries(Object.entries(mounts).map(([id, m]) => [id, { n: m.name, f: m.flying, s: m.speed, c: m.color }])),
    pals: Object.fromEntries(Object.entries(pals).map(([id, p]) => [id, { n: p.name, c: p.color, a: p.accent, el: p.element, r: p.rarity, m: p.mine, atk: p.atk, d: p.desc, h: p.habitat }])),
    npcs: npcs.map((n) => ({ id: n.id, n: n.name, k: n.kind, look: n.look, hat: n.hat, nb: n.noBody ? 1 : 0 })),
    events: Object.fromEntries(Object.entries(events).map(([id, e]) => [id, { n: e.name, c: e.color }])),
  };
}
const stats = () => ({ items: Object.keys(items).length, weapons: weaponCount + Object.keys(handUniques).length + Object.keys(specUniques).length, recipes: Object.keys(recipes).length, mobs: Object.keys(mobs).length, nodes: Object.keys(nodes).length });

module.exports = { items, recipes, mobs, nodes, biomes, structures, events, npcs, buffs, modifiers, modById, pals, mounts, armor, HAND, randomWeapon, rollModifier, validate, clientPayload, stats };
