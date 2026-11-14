// Armor: 3 slots (helmet / chest / legs). Wearing all 3 pieces of a set grants its SET BONUS.
// Material sets are generated for every material; boss sets drop from bosses; event sets drop from events.
// look = how it is drawn on your character. stats: def (extra defense) dmg (%) crit (pts) speed (%) regen (hp/s) lifesteal thorns (reflect %) fireRes
const SLOTS = ['helmet', 'chest', 'legs'];
const PIECE = { helmet: ['Helmet', '⛑️'], chest: ['Breastplate', '🛡️'], legs: ['Greaves', '👖'] };
const sets = {};      // id -> {id,name,tier,color,pieces:{slot:id},bonus,look}
const items = {};     // piece id -> item def
function add(id, name, tier, color, look, bonus, nameMap, rarity = 'common', extraDef = 0) {
  const pieces = {};
  for (const slot of SLOTS) {
    const pid = `${id}_${slot}`, base = slot === 'chest' ? 2 + tier * 2.6 : 1 + tier * 2;
    const nm = nameMap && nameMap[slot] ? nameMap[slot] : `${name} ${PIECE[slot][0]}`;
    items[pid] = { id: pid, name: nm, emoji: PIECE[slot][1], color, type: 'armor', slot, set: id, defense: Math.round(base + extraDef), stack: 1, rarity, tier, value: Math.round((12 + tier * 14) * (slot === 'chest' ? 1.5 : 1)) * (rarity === 'common' ? 1 : 3), desc: `Part of the ${name} set.` };
    pieces[slot] = pid;
  }
  sets[id] = { id, name, tier, color, pieces, bonus, look };
}
const dk = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = 1 - k; return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f).toString(16).padStart(2, '0')).join(''); };

// ---- material sets (crafted) ----
const HELM = ['cap', 'cap', 'helm', 'helm', 'helm', 'visor', 'visor', 'visor', 'spiky'];
function materialSets(materials) {
  materials.forEach((m, i) => {
    const t = m.tier, st = { def: 1 + t };
    if (t >= 2) st.crit = 2 + t; if (t >= 3) st.dmg = 2 + t; if (t >= 5) st.speed = 0.03 * t;
    add(m.id, m.name, t, m.color, { pri: m.color, sec: dk(m.color, 0.35), trim: '#ffffff', helm: HELM[Math.min(HELM.length - 1, t + (i % 2))], chest: t >= 4 ? 'plate' : 'leather', cape: t >= 6, glow: t >= 6 ? m.color : null },
      { name: `${m.name} Resolve`, desc: `+${st.def} defense${st.crit ? `, +${st.crit}% crit` : ''}${st.dmg ? `, +${st.dmg}% damage` : ''}${st.speed ? `, +${Math.round(st.speed * 100)}% speed` : ''}`, stats: st });
  });
}
// ---- boss + event sets ----
const BOSS = [
  ['slime_king', 'Royal Gel', 1, '#4f8fe0', { helm: 'crown', chest: 'plate', glow: '#9be7ff' }, { name: 'Jelly Bounce', desc: '+3 regen/s, +6% speed', stats: { regen: 3, speed: 0.06 } }],
  ['eye_of_dread', 'Dread Eye', 2, '#c0262d', { helm: 'eye', chest: 'leather' }, { name: 'Bloodlust', desc: '8% lifesteal, +6% damage', stats: { lifesteal: 0.08, dmg: 6 } }],
  ['elder_ent', 'Thornwood', 2, '#3a7a3a', { helm: 'horns', chest: 'plate' }, { name: 'Thorns', desc: 'Reflect 25% of melee damage, +4 defense', stats: { thorns: 0.25, def: 4 } }],
  ['pharaoh', 'Pharaoh', 3, '#e6c34a', { helm: 'nemes', chest: 'plate', glow: '#ffe27a' }, { name: 'Sun Blessing', desc: '+10% damage, +6% crit', stats: { dmg: 10, crit: 6 } }],
  ['frost_titan', 'Frostguard', 4, '#9be7ff', { helm: 'spiky', chest: 'plate', glow: '#9be7ff' }, { name: 'Ice Armor', desc: '+8 defense, slows nearby attackers', stats: { def: 8, thorns: 0.1 } }],
  ['bog_horror', 'Rotwood', 4, '#6a8a3a', { helm: 'hood', chest: 'robe' }, { name: 'Marsh Regeneration', desc: '+4 regen/s, +8% damage', stats: { regen: 4, dmg: 8 } }],
  ['magma_wyrm', 'Magma', 5, '#ff5a1a', { helm: 'horns', chest: 'plate', glow: '#ff7a1a' }, { name: 'Molten Core', desc: 'Immune to fire, +12% damage', stats: { fireRes: 1, dmg: 12 } }],
  ['lich_king', 'Lich', 5, '#7a2aff', { helm: 'hood', chest: 'robe', cape: true, glow: '#7aefff' }, { name: 'Soul Drain', desc: '12% lifesteal, +8% crit', stats: { lifesteal: 0.12, crit: 8 } }],
  ['void_horror', 'Voidwalker', 6, '#6a2aff', { helm: 'visor', chest: 'plate', cape: true, glow: '#b06aff' }, { name: 'Void Step', desc: '+15% speed, +14% damage', stats: { speed: 0.15, dmg: 14 } }],
  ['clockwork_colossus', 'Clockwork', 6, '#c6a050', { helm: 'visor', chest: 'plate' }, { name: 'Overclock', desc: '+14 defense, +10% crit', stats: { def: 14, crit: 10 } }],
  ['celestial_guardian', 'Celestial', 7, '#fff3a8', { helm: 'crown', chest: 'robe', wings: true, glow: '#fff3a8' }, { name: 'Radiance', desc: '+20% damage, +10 regen/s, +10% speed', stats: { dmg: 20, regen: 10, speed: 0.1 } }],
  ['dracula', 'Vampire Lord', 7, '#7a1a2a', { helm: 'hood', chest: 'robe', cape: true, wings: true, glow: '#ff3a3a' }, { name: 'Night Lord', desc: '+16% lifesteal, +14% speed, +12% damage', stats: { lifesteal: 0.16, speed: 0.14, dmg: 12 } }, { helmet: "Vlad's Cowl", chest: "Dracula's Cape", legs: "Vlad's Greaves" }],
  ['neptune', 'Atlantean', 7, '#2fb0c0', { helm: 'crown', chest: 'plate', glow: '#7ae0ff' }, { name: 'Tidal Ward', desc: '+16 defense, +10 regen/s, +14% damage', stats: { def: 16, regen: 10, dmg: 14 } }, { helmet: "Neptune's Crown", chest: "Tide-King's Plate", legs: 'Atlantean Greaves' }],
  ['pumpking', 'Harvest', 4, '#e07a1a', { helm: 'horns', chest: 'leather', glow: '#ffd23f' }, { name: 'Spooky Season', desc: '+10% damage, +8% speed', stats: { dmg: 10, speed: 0.08 } }],
  ['evil_santa', 'Yuletide Terror', 5, '#c0262d', { helm: 'cap', chest: 'robe', glow: '#ffffff' }, { name: 'Naughty List', desc: '+12% damage, 8% lifesteal, +6% crit', stats: { dmg: 12, lifesteal: 0.08, crit: 6 } }],
  ['cow_god', 'Moo Moo', 3, '#ffffff', { helm: 'horns', chest: 'leather' }, { name: 'Holy Cow', desc: '+6 regen/s, +20 defense vs. fire', stats: { regen: 6, fireRes: 1 } }],
];
function bossSets() { for (const [id, name, t, color, look, bonus, nm] of BOSS) add(`b_${id}`, name, t, color, { pri: color, sec: dk(color, 0.4), trim: '#ffe27a', ...look }, bonus, nm || null, 'epic', 2 + t); }
module.exports = { SLOTS, sets, items, add, materialSets, bossSets, BOSS };
