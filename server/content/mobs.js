// Regular mobs. behavior: passive | hostile | ranged. when: day | night | any (spawn time).
// drops: {item,min,max,chance} or {roll:'weapon', tier:[min,max], mods:[..], chance}
const mobs = {
  cow:     { name: 'Cow', emoji: '🐄', color: '#f4f4f4', radius: 26, hp: 40, speed: 60, behavior: 'passive', when: 'day', xp: 5,
             drops: [{ item: 'meat', min: 1, max: 3 }, { item: 'leather', min: 0, max: 2 }] },
  chicken: { name: 'Chicken', emoji: '🐔', color: '#fff6d6', radius: 14, hp: 10, speed: 80, behavior: 'passive', when: 'day', xp: 2,
             drops: [{ item: 'meat', min: 1, max: 1 }] },
  toad:    { name: 'Bog Toad', emoji: '🐸', color: '#5d9a4a', radius: 16, hp: 18, speed: 70, behavior: 'passive', xp: 3,
             drops: [{ item: 'berries', min: 0, max: 1 }] },
  slime:   { name: 'Slime', emoji: '🟢', color: '#5fd35f', radius: 22, hp: 30, speed: 70, dmg: 6, behavior: 'hostile', aggro: 350, xp: 8,
             drops: [{ item: 'slime_gel', min: 1, max: 2 }, { item: 'rubber_duck_blaster', chance: 0.002 }] },
  goblin:  { name: 'Goblin', emoji: '👺', color: '#6aa84f', radius: 22, hp: 45, speed: 110, dmg: 9, behavior: 'hostile', aggro: 450, xp: 14,
             drops: [{ item: 'bronze', min: 1, max: 2, chance: 0.5 }, { item: 'copper', min: 0, max: 2, chance: 0.5 }, { roll: 'weapon', tier: [0, 1], mods: ['sharp', 'swift'], chance: 0.03 }] },
  wolf:    { name: 'Wolf', emoji: '🐺', color: '#8a8a92', radius: 24, hp: 55, speed: 150, dmg: 11, behavior: 'hostile', aggro: 500, xp: 16,
             drops: [{ item: 'meat', min: 1, max: 2 }, { item: 'leather', min: 1, max: 2 }] },
  spider:  { name: 'Giant Spider', emoji: '🕷️', color: '#3a2a3a', radius: 22, hp: 35, speed: 130, dmg: 7, behavior: 'hostile', aggro: 400, xp: 12,
             fx: { slow: { mult: 0.6, dur: 1.5 } }, drops: [{ item: 'leather', min: 0, max: 1 }] },
  skeleton:{ name: 'Skeleton Archer', emoji: '💀', color: '#e8e2cf', radius: 22, hp: 50, speed: 90, behavior: 'ranged', when: 'night', aggro: 650, xp: 20,
             ranged: { keep: 350, range: 640, cd: 2.1, windup: 0.5, proj: { kind: 'arrow', speed: 560, life: 1.3, radius: 6, dmg: 9, color: '#d8c8a0' } },
             drops: [{ item: 'bone', min: 1, max: 3 }, { roll: 'weapon', tier: [0, 2], mods: ['sharp', 'swift', 'heavy'], chance: 0.04 }] },
  zombie:  { name: 'Zombie', emoji: '🧟', color: '#6f8f5a', radius: 24, hp: 80, speed: 70, dmg: 12, behavior: 'hostile', when: 'night', aggro: 550, xp: 18,
             drops: [{ item: 'leather', min: 0, max: 2 }, { item: 'apple', min: 0, max: 1 }] },
  bandit:  { name: 'Bandit', minZone: 0.08, emoji: '🥷', color: '#4a4a55', radius: 23, hp: 90, speed: 125, dmg: 14, behavior: 'hostile', aggro: 500, xp: 28,
             drops: [{ item: 'steel', min: 1, max: 2, chance: 0.5 }, { roll: 'weapon', tier: [1, 3], mods: ['sharp', 'swift', 'heavy'], chance: 0.06 }] },
  scorpion:{ name: 'Scorpion', emoji: '🦂', color: '#b0603a', radius: 22, hp: 60, speed: 110, dmg: 10, behavior: 'hostile', aggro: 400, xp: 18,
             fx: { poison: { dps: 4, dur: 4 } }, drops: [{ item: 'cactus_flesh', min: 0, max: 1 }] },
  mummy:   { name: 'Mummy', minZone: 0.1, emoji: '🏺', color: '#d9cba0', radius: 26, hp: 120, speed: 70, dmg: 15, behavior: 'hostile', aggro: 450, xp: 30,
             drops: [{ item: 'gold', min: 0, max: 1, chance: 0.4 }, { item: 'bone', min: 1, max: 2 }] },
  yeti:    { name: 'Yeti', minZone: 0.15, emoji: '🦍', color: '#eaf4fb', radius: 32, hp: 160, speed: 100, dmg: 18, behavior: 'hostile', aggro: 450, xp: 40,
             drops: [{ item: 'ice', min: 1, max: 2 }, { item: 'leather', min: 1, max: 3 }] },
  frost_wolf:{ name: 'Frost Wolf', minZone: 0.05, emoji: '🐺', color: '#a8d8f0', radius: 24, hp: 80, speed: 170, dmg: 13, behavior: 'hostile', aggro: 550, xp: 24,
             fx: { slow: { mult: 0.7, dur: 1.5 } }, drops: [{ item: 'ice', min: 0, max: 1, chance: 0.4 }, { item: 'meat', min: 1, max: 2 }] },
  bog_witch:{ name: 'Bog Witch', minZone: 0.15, emoji: '🧙‍♀️', color: '#5a7a4a', radius: 22, hp: 90, speed: 95, behavior: 'ranged', aggro: 650, xp: 45,
             ranged: { keep: 380, range: 620, cd: 2.0, windup: 0.55, proj: { kind: 'poison', speed: 360, life: 1.8, radius: 10, dmg: 12, color: '#7bff5a', beh: 'wave', amp: 26, freq: 7, fx: { poison: { dps: 5, dur: 4 } } } },
             drops: [{ item: 'cursed', min: 0, max: 1, chance: 0.3 }, { item: 'potion_heal', chance: 0.15 }] },
  lava_imp:{ name: 'Lava Imp', minZone: 0.05, emoji: '😈', color: '#ff6a2a', radius: 20, hp: 70, speed: 120, behavior: 'ranged', aggro: 650, xp: 40,
             ranged: { keep: 320, range: 600, cd: 1.6, windup: 0.4, proj: { kind: 'fire', speed: 430, life: 1.4, radius: 9, dmg: 14, color: '#ff7a1a', fx: { burn: { dps: 5, dur: 3 } } } },
             drops: [{ item: 'ruby', min: 0, max: 1, chance: 0.12 }, { item: 'obsidian', min: 0, max: 1, chance: 0.3 }] },
  magma_golem:{ name: 'Magma Golem', minZone: 0.3, emoji: '🗿', color: '#7a3a2a', radius: 38, hp: 320, speed: 60, dmg: 26, behavior: 'hostile', aggro: 450, xp: 90,
             fx: { burn: { dps: 6, dur: 3 } }, drops: [{ item: 'obsidian', min: 1, max: 3 }, { item: 'titanium', min: 0, max: 1, chance: 0.08 }, { roll: 'weapon', tier: [3, 5], mods: ['heavy', 'flaming'], chance: 0.08 }] },
  shadow_wraith:{ name: 'Shadow Wraith', minZone: 0.12, emoji: '👻', color: '#3b2f66', radius: 24, hp: 130, speed: 145, dmg: 17, behavior: 'hostile', when: 'night', aggro: 650, xp: 55,
             drops: [{ item: 'shadow', min: 0, max: 1, chance: 0.3 }, { roll: 'weapon', tier: [2, 5], mods: ['frozen', 'venomous', 'vampiric'], chance: 0.05 }] },
  wyvern:  { name: 'Wyvern', minZone: 0.55, emoji: '🐉', color: '#c44a2a', radius: 44, hp: 450, speed: 150, behavior: 'ranged', aggro: 800, xp: 150,
             ranged: { keep: 400, range: 750, cd: 1.5, windup: 0.5, count: 3, spread: 0.4, proj: { kind: 'fire', speed: 500, life: 1.5, radius: 11, dmg: 18, color: '#ff5a1a', fx: { burn: { dps: 6, dur: 3 } } } },
             drops: [{ item: 'dragon', min: 1, max: 2, chance: 0.6 }, { roll: 'weapon', tier: [4, 6], mods: ['flaming', 'legendary', 'heavy'], chance: 0.12 }] },
};
mobs.demon_eye = { name: 'Demon Eye', emoji: '👁️', color: '#e8e8f0', radius: 20, hp: 60, speed: 170, dmg: 12, behavior: 'hostile', when: 'night', aggro: 700, xp: 22, minZone: 0.02,
  drops: [{ item: 'lens', min: 0, max: 1, chance: 0.5 }] };
mobs.slime.minZone = 0;
// Rare unique drops (item ids from uniques.js). chance is per kill.
const RARE = {
  cow: ['bovine_bonker'], chicken: ['egg_cannon'], toad: ['croaker'], slime: ['slimy_staff'], goblin: ['goblin_shiv', 'goblin_banner_blade'], wolf: ['fang_dagger'], spider: ['widow_bow'],
  skeleton: ['bone_chakram'], zombie: ['rotten_maul'], bandit: ['bandit_dirk'], scorpion: ['stinger_spear'], mummy: ['wrap_whip'], yeti: ['yeti_club'],
  frost_wolf: ['frostbite'], bog_witch: ['witch_brew_staff'], lava_imp: ['imp_wand'], magma_golem: ['magma_maul'], shadow_wraith: ['soul_reaper'], wyvern: ['wyvern_lance'], demon_eye: ['eye_staff'],
};
for (const [id, list] of Object.entries(RARE)) {
  const m = mobs[id];
  m.drops = (m.drops || []).filter((d) => d.item !== 'rubber_duck_blaster');
  for (const it of list) m.drops.push({ item: it, chance: id === 'chicken' || id === 'toad' ? 0.02 : 0.012 });
  m.drops.push({ item: 'coin', min: 1 + Math.floor((m.xp || 5) * 0.3), max: 2 + Math.floor((m.xp || 5) * 0.7) });
}
mobs.slime.drops.push({ item: 'rubber_duck_blaster', chance: 0.002 });
module.exports = mobs;
