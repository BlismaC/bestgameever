// ARMOR: 3 slots (helmet / chest / legs). Every set belongs to a CLASS and boosts what that class does:
//   melee   (Vanguard): melee damage, swing speed, knockback, thorns, defense
//   ranged  (Ranger):   bow / crossbow damage, crit, projectile speed, MULTISHOT (chance for an extra arrow)
//   magic   (Mage):     staff / wand / tome damage, cast speed, regeneration
//   summon  (Caller):   your Pal's damage, speed and mining power
// Each worn piece gives 1/3 of its set's stats, so you can mix sets; the full set gives +50% on top and its defense bonus.
const SLOTS = ['helmet', 'chest', 'legs'];
const EMOJI = { helmet: '⛑️', chest: '🛡️', legs: '👖' };
const CLASSES = {
  melee:  { title: 'Vanguard', names: { helmet: 'Helmet', chest: 'Breastplate', legs: 'Greaves' }, defMul: 1.25, helm: ['helm', 'visor'], chest: 'plate', extra: null },
  ranged: { title: 'Ranger',   names: { helmet: 'Hood', chest: 'Jerkin', legs: 'Boots' },            defMul: 0.9,  helm: ['hood', 'cap'],   chest: 'leather', extra: 'leather' },
  magic:  { title: 'Mage',     names: { helmet: 'Hat', chest: 'Robe', legs: 'Slippers' },            defMul: 0.7,  helm: ['hood', 'eye'],   chest: 'robe', extra: 'bone' },
  summon: { title: 'Caller',   names: { helmet: 'Circlet', chest: 'Mantle', legs: 'Sandals' },      defMul: 0.8,  helm: ['horns', 'crown'], chest: 'robe', extra: 'slime_gel' },
};
const sets = {}, items = {};
const dk = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = 1 - k; return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f).toString(16).padStart(2, '0')).join(''); };
const LABEL = { melee: 'melee damage', ranged: 'ranged damage', magic: 'magic damage', summon: 'Pal damage', meleeSpd: 'swing speed', rangedSpd: 'shot speed', magicSpd: 'cast speed', knock: 'knockback', multishot: 'multishot chance', projSpeed: 'projectile speed', palSpd: 'Pal speed', palMine: 'Pal mining power', crit: 'crit', regen: 'regen/s', thorns: 'thorns', lifesteal: 'lifesteal', speed: 'move speed', dmg: 'all damage', def: 'defense' };
const num = (k, v) => (k === 'lifesteal' || k === 'thorns' || k === 'speed' ? `${Math.round(v * 100)}%` : k === 'regen' ? `${v}` : k === 'crit' ? `+${v}%` : `+${v}%`);
const describe = (st) => Object.entries(st).filter(([k, v]) => v && k !== 'fireRes').map(([k, v]) => `${k === 'def' ? '+' : ''}${num(k, v)} ${LABEL[k] || k}`.replace('++', '+')).join(', ') + (st.fireRes ? ', fire immune' : '');

function add(id, name, tier, color, look, bonus, nameMap, rarity = 'common', extraDef = 0, meta = {}) {
  const pieces = {}, cl = CLASSES[meta.cls || 'melee'];
  for (const slot of SLOTS) {
    const pid = `${id}_${slot}`, base = (slot === 'chest' ? 2 + tier * 2.6 : 1 + tier * 2) * cl.defMul;
    const nm = nameMap && nameMap[slot] ? nameMap[slot] : `${name} ${cl.names[slot]}`;
    items[pid] = { id: pid, name: nm, emoji: EMOJI[slot], color, type: 'armor', slot, set: id, cls: meta.cls || 'melee', defense: Math.round(base + extraDef), stack: 1, rarity, tier, value: Math.round((12 + tier * 14) * (slot === 'chest' ? 1.5 : 1)) * (rarity === 'common' ? 1 : 3), desc: `${cl.title} armor — ${bonus.desc}` };
    pieces[slot] = pid;
  }
  sets[id] = { id, name, tier, color, pieces, bonus, look, cls: meta.cls || 'melee', mat: meta.mat || null };
}
function classStats(cls, t) {
  if (cls === 'melee') return { melee: 4 + 2 * t, meleeSpd: t >= 2 ? 2 + t : 0, knock: 8 + 3 * t, thorns: t >= 4 ? Math.round(t * 4) / 100 : 0, def: t };
  if (cls === 'ranged') return { ranged: 4 + 2 * t, crit: 2 + t, projSpeed: 6 + 2 * t, multishot: t >= 2 ? 3 + t : 0 };
  if (cls === 'magic') return { magic: 4 + 2 * t, magicSpd: 3 + t, regen: t >= 3 ? Math.round(t / 2) : 0, crit: t >= 2 ? 1 + t : 0 };
  return { summon: 6 + 3 * t, palSpd: 4 + 2 * t, palMine: 5 + 2 * t, regen: t >= 3 ? Math.round(t / 2) : 0 };
}
const NAME = { melee: 'Warcry', ranged: "Hunter's Eye", magic: 'Arcane Flow', summon: 'Bond of the Wild' };
// every material gets all four class variants (4 x 28 sets): the melee one keeps the original item ids (iron_helmet ...)
function materialSets(materials) {
  const HELM = ['cap', 'cap', 'helm', 'helm', 'helm', 'visor', 'visor', 'visor', 'spiky'];
  materials.forEach((m, i) => {
    const t = m.tier;
    for (const [cls, cl] of Object.entries(CLASSES)) {
      const st = classStats(cls, t), id = cls === 'melee' ? m.id : `${m.id}_${cls === 'ranged' ? 'rng' : cls === 'magic' ? 'mag' : 'cal'}`;
      const helm = t >= 6 ? cl.helm[1] : cl.helm[0];
      add(id, `${m.name} ${cl.title}`, t, m.color, { pri: m.color, sec: dk(m.color, 0.35), trim: cls === 'magic' ? '#c8a0ff' : cls === 'summon' ? '#7bff9a' : '#ffffff', helm: cls === 'melee' ? HELM[Math.min(HELM.length - 1, t + (i % 2))] : helm, chest: cl.chest, cape: t >= 6 && cls !== 'melee', glow: t >= 5 && cls !== 'ranged' ? m.color : null },
        { name: NAME[cls], desc: describe(st), stats: st }, null, 'common', 0, { cls, mat: m.id });
    }
  });
}
// ---- boss sets (each with its own flavour + class) ----
const BOSS = [
  ['slime_king', 'Royal Gel', 1, '#4f8fe0', { helm: 'crown', chest: 'plate', glow: '#9be7ff' }, 'summon', { summon: 12, palSpd: 8, regen: 3, speed: 0.06 }, 'Jelly Bounce'],
  ['eye_of_dread', 'Dread Eye', 2, '#c0262d', { helm: 'eye', chest: 'leather' }, 'ranged', { ranged: 10, crit: 6, lifesteal: 0.06, projSpeed: 8 }, 'Bloodlust'],
  ['elder_ent', 'Thornwood', 2, '#3a7a3a', { helm: 'horns', chest: 'plate' }, 'melee', { melee: 8, thorns: 0.25, knock: 20, def: 4 }, 'Thorns'],
  ['pharaoh', 'Pharaoh', 3, '#e6c34a', { helm: 'nemes', chest: 'plate', glow: '#ffe27a' }, 'magic', { magic: 14, crit: 6, magicSpd: 8 }, 'Sun Blessing'],
  ['frost_titan', 'Frostguard', 4, '#9be7ff', { helm: 'spiky', chest: 'plate', glow: '#9be7ff' }, 'melee', { melee: 10, meleeSpd: 8, knock: 30, def: 8 }, 'Ice Armor'],
  ['bog_horror', 'Rotwood', 4, '#6a8a3a', { helm: 'hood', chest: 'robe' }, 'summon', { summon: 18, palSpd: 12, palMine: 15, regen: 4 }, 'Marsh Regeneration'],
  ['magma_wyrm', 'Magma', 5, '#ff5a1a', { helm: 'horns', chest: 'plate', glow: '#ff7a1a' }, 'ranged', { ranged: 16, multishot: 10, projSpeed: 12, fireRes: 1 }, 'Molten Core'],
  ['lich_king', 'Lich', 5, '#7a2aff', { helm: 'hood', chest: 'robe', cape: true, glow: '#7aefff' }, 'magic', { magic: 16, crit: 8, lifesteal: 0.1, magicSpd: 10 }, 'Soul Drain'],
  ['void_horror', 'Voidwalker', 6, '#6a2aff', { helm: 'visor', chest: 'plate', cape: true, glow: '#b06aff' }, 'melee', { melee: 12, ranged: 8, speed: 0.15, meleeSpd: 8 }, 'Void Step'],
  ['clockwork_colossus', 'Clockwork', 6, '#c6a050', { helm: 'visor', chest: 'plate' }, 'ranged', { ranged: 16, crit: 10, projSpeed: 22, multishot: 12, def: 14 }, 'Overclock'],
  ['celestial_guardian', 'Celestial', 7, '#fff3a8', { helm: 'crown', chest: 'robe', wings: true, glow: '#fff3a8' }, 'magic', { dmg: 12, magic: 14, regen: 8, speed: 0.1 }, 'Radiance'],
  ['dracula', 'Vampire Lord', 7, '#7a1a2a', { helm: 'hood', chest: 'robe', cape: true, wings: true, glow: '#ff3a3a' }, 'melee', { melee: 16, meleeSpd: 12, lifesteal: 0.16, speed: 0.14 }, 'Night Lord', { helmet: "Vlad's Cowl", chest: "Dracula's Cape", legs: "Vlad's Greaves" }],
  ['neptune', 'Atlantean', 7, '#2fb0c0', { helm: 'crown', chest: 'plate', glow: '#7ae0ff' }, 'summon', { summon: 20, palSpd: 14, magic: 12, regen: 10, def: 16 }, 'Tidal Ward', { helmet: "Neptune's Crown", chest: "Tide-King's Plate", legs: 'Atlantean Greaves' }],
  ['pumpking', 'Harvest', 4, '#e07a1a', { helm: 'horns', chest: 'leather', glow: '#ffd23f' }, 'summon', { summon: 18, palSpd: 12, speed: 0.08, palMine: 10 }, 'Spooky Season'],
  ['evil_santa', 'Yuletide Terror', 5, '#c0262d', { helm: 'cap', chest: 'robe', glow: '#ffffff' }, 'ranged', { ranged: 14, multishot: 10, crit: 6, lifesteal: 0.08 }, 'Naughty List'],
  ['cow_god', 'Moo Moo', 3, '#ffffff', { helm: 'horns', chest: 'leather' }, 'summon', { summon: 20, regen: 6, palMine: 12, fireRes: 1 }, 'Holy Cow'],
];
function bossSets() {
  for (const [id, name, t, color, look, cls, stats, bname, nm] of BOSS) add(`b_${id}`, name, t, color, { pri: color, sec: dk(color, 0.4), trim: '#ffe27a', ...look }, { name: bname, desc: describe(stats), stats }, nm || null, 'epic', 2 + t, { cls });
}
module.exports = { SLOTS, sets, items, add, materialSets, bossSets, BOSS, CLASSES, classStats };
