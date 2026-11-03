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
// ---- merge the new roster; harden the old late-game mobs; give everybody an ability kit (no telegraphs for normal mobs)
const { M: NEW, P } = require('./mobs_new');
Object.assign(mobs, NEW);
const kit = (id, extra) => Object.assign(mobs[id], extra);
kit('lava_imp', { hp: 170, dmg: 20, abilities: [{ type: 'blink', cd: 6, dist: 300, range: 280 }, { type: 'burst', cd: 8, count: 10, range: 300, proj: P('fire', 320, 18, '#ff7a1a', { life: 1.1 }) }] });
kit('magma_golem', { hp: 760, dmg: 46, xp: 150, abilities: [{ type: 'burst', cd: 6, count: 12, range: 340, proj: P('fire', 330, 24, '#ff7a1a', { life: 1.2 }) }, { type: 'dash', cd: 8, speed: 2.8, dur: 0.5, range: 360 }] });
kit('wyvern', { hp: 950, dmg: 52, abilities: [{ type: 'dash', cd: 5, speed: 3.4, dur: 0.5, range: 520 }, { type: 'burst', cd: 8, count: 12, range: 420, proj: P('fire', 360, 24, '#ff5a1a') }] });
kit('shadow_wraith', { hp: 260, dmg: 30, abilities: [{ type: 'blink', cd: 5, dist: 280, range: 260 }, { type: 'shoot', cd: 4, count: 2, spread: 0.3, range: 520, proj: P('soul', 420, 20, '#9a6aff', { beh: 'homing', turn: 2.4, life: 1.6 }) }] });
kit('bog_witch', { hp: 210, behavior: 'ranged', ranged: { keep: 380, range: 640, cd: 2.2, proj: P('poison', 360, 14, '#7bff5a', { beh: 'wave', amp: 26, freq: 7, life: 1.8, fx: { poison: { dps: 5, dur: 4 } } }) },
  abilities: [
    { type: 'shoot', cd: 4.5, count: 3, spread: 0.45, range: 620, proj: P('poison', 340, 14, '#7bff5a', { beh: 'wave', amp: 22, freq: 6, fx: { poison: { dps: 5, dur: 4 } } }) },
    { type: 'shoot', cd: 6, count: 1, range: 560, proj: P('void', 520, 16, '#b06aff', { radius: 10, fx: { slow: { mult: 0.45, dur: 2.5 } } }) },
    { type: 'summon', cd: 13, mob: 'toad', n: 2, range: 560 },
    { type: 'burst', cd: 9, count: 12, range: 240, proj: P('poison', 300, 12, '#7bff5a', { life: 1.1, fx: { poison: { dps: 4, dur: 3 } } }) },
    { type: 'blink', cd: 7, dist: 330, range: 220 }] });
kit('skeleton', { hp: 90, ranged: { keep: 360, range: 660, cd: 1.9, windup: 0, proj: P('arrow', 560, 11, '#d8c8a0', { life: 1.3, radius: 6 }) }, abilities: [{ type: 'shoot', cd: 6, count: 3, spread: 0.45, range: 600, proj: P('arrow', 580, 9, '#d8c8a0', { radius: 6 }) }] });
for (const id of ['wolf', 'frost_wolf']) kit(id, { abilities: [{ type: 'dash', cd: 4.5, speed: 3.4, dur: 0.4, range: 360 }] });
kit('goblin', { abilities: [{ type: 'dash', cd: 5, speed: 3, dur: 0.35, range: 300 }] });
kit('spider', { abilities: [{ type: 'shoot', cd: 6, count: 1, range: 440, proj: P('gel', 420, 8, '#e8e8f0', { fx: { slow: { mult: 0.4, dur: 2.5 } } }) }, { type: 'leap', cd: 4, speed: 3.4, dur: 0.35, range: 300 }] });
kit('bandit', { abilities: [{ type: 'shoot', cd: 5, count: 3, spread: 0.35, range: 460, proj: P('star', 620, 12, '#d6dae2', { life: 0.9 }) }, { type: 'dash', cd: 6, speed: 3.2, dur: 0.4, range: 340 }] });
kit('scorpion', { abilities: [{ type: 'shoot', cd: 5, count: 1, range: 440, proj: P('poison', 480, 14, '#b0a03a', { fx: { poison: { dps: 5, dur: 4 } } }) }, { type: 'dash', cd: 5, speed: 3.2, dur: 0.35, range: 320 }] });
kit('mummy', { abilities: [{ type: 'shoot', cd: 6, count: 1, range: 480, proj: P('soul', 420, 16, '#e7dcb5', { fx: { slow: { mult: 0.55, dur: 2 } } }) }] });
kit('yeti', { abilities: [{ type: 'burst', cd: 6, count: 7, range: 300, proj: P('ice', 340, 18, '#bff3ff', { life: 1 }) }, { type: 'dash', cd: 7, speed: 3, dur: 0.45, range: 340 }] });
kit('demon_eye', { abilities: [{ type: 'dash', cd: 2.8, speed: 4, dur: 0.35, range: 420 }] });
kit('zombie', { abilities: [{ type: 'dash', cd: 7, speed: 2.8, dur: 0.4, range: 280 }] });
const RARE2 = {
  giant_hornet: ['hornet_stinger'], jungle_viper: ['viper_fang'], tribal_hunter: ['hunter_spear'], jungle_golem: ['jungle_maul', 'pal_jadeling'], treant: ['heartwood_bow'], dire_wolf: ['mount_dire_wolf'],
  sand_elemental: ['dune_scepter'], tomb_guardian: ['guardian_axe', 'mount_magic_carpet'], vulture: [], hellhound: ['hellhound_fang'], fire_elemental: ['cinder_staff', 'pal_emberpup'], bone_drake: ['drake_tooth'], pit_demon: ['demon_cleaver'],
  leech: ['leech_whip'], plague_zombie: ['plague_hammer'], banshee: ['banshee_tome'], gargoyle: ['gargoyle_axe', 'pal_voidmote'], vampire_bat: ['bat_wing_scythe'], death_knight: ['requiem_blade'],
  ice_elemental: ['icicle_staff', 'pal_frostling'], frost_giant: ['giants_club'], harpy: ['harpy_bow'], rock_golem: ['boulder_fist', 'pal_rocklet'], crystal_golem: ['prism_staff'], storm_drake: ['stormcaller_bow'],
  blood_zombie: ['blood_butcherer'], blood_eye: ['eye_launcher'],
};
for (const [id, list] of Object.entries(RARE2)) for (const it of list) mobs[id].drops.push({ item: it, chance: it.startsWith('pal_') || it.startsWith('mount_') ? 0.004 : 0.012 });
for (const id of Object.keys(NEW)) if (!mobs[id].drops.some((d) => d.item === 'coin')) mobs[id].drops.push({ item: 'coin', min: 2 + Math.floor(mobs[id].xp * 0.25), max: 4 + Math.floor(mobs[id].xp * 0.6) });
mobs.bog_witch.drops.push({ item: 'mount_witch_broom', chance: 0.005 });
mobs.cow.drops.push({ item: 'pal_rocklet', chance: 0.001 });
module.exports = mobs;
