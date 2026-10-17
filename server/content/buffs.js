// Buffs & debuffs shown as icons above the health bar. icon = file in public/assets/buffs/<id>.png
module.exports = {
  regeneration:  { name: 'Regeneration', good: 1, desc: 'Life regenerates faster.' },
  swiftness:     { name: 'Swiftness', good: 1, desc: '+35% movement speed.' },
  ironskin:      { name: 'Ironskin', good: 1, desc: '+8 defense.' },
  wrath:         { name: 'Wrath', good: 1, desc: '+20% damage.' },
  well_fed:      { name: 'Well Fed', good: 1, desc: 'Slow regeneration and +5% damage.' },
  campfire:      { name: 'Cozy Fire', good: 1, desc: 'Resting by a campfire: life regenerates.' },
  burning:       { name: 'On Fire!', good: 0, desc: 'Taking fire damage over time.' },
  poisoned:      { name: 'Poisoned', good: 0, desc: 'Taking poison damage over time.' },
  slowed:        { name: 'Slowed', good: 0, desc: 'Movement speed reduced.' },
  rooted:        { name: 'Trapped', good: 0, desc: "You can't move!" },
  potion_sickness: { name: 'Potion Sickness', good: 0, desc: "You can't use another healing item yet." },
};
