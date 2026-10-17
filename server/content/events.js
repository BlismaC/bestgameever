// Random world events. Kill `goal` event monsters to call the boss. Checked about once a minute; deliberately rare.
// when: day | night | any    biomes: where the event can start (player biome)    spawn: weighted mobs    air: monsters fall from the sky on balloons
module.exports = {
  slime_rain:  { name: 'Slime Rain', banner: 'Slimes are raining from the sky!', when: 'day', biomes: ['plains', 'forest', 'swamp'], chance: 0.07, duration: 260, goal: 24, interval: 2.2, maxAlive: 9, air: true, spawn: { slime: 1 }, boss: 'slime_king', color: '#4f8fe0' },
  blood_moon:  { name: 'Blood Moon', banner: 'The Blood Moon is rising...', when: 'night', biomes: ['plains', 'forest', 'desert', 'snow', 'swamp'], chance: 0.06, duration: 240, goal: 22, interval: 3, maxAlive: 8, spawn: { demon_eye: 3, zombie: 2 }, boss: 'eye_of_dread', color: '#c0262d' },
  sandstorm:   { name: 'Sandstorm', banner: 'A sandstorm approaches!', when: 'day', biomes: ['desert'], chance: 0.08, duration: 240, goal: 18, interval: 3, maxAlive: 8, spawn: { scorpion: 3, mummy: 2, bandit: 1 }, boss: 'pharaoh', color: '#e6c34a' },
  blizzard:    { name: 'Blizzard', banner: 'A blizzard sweeps in!', when: 'any', biomes: ['snow'], chance: 0.08, duration: 240, goal: 16, interval: 3.2, maxAlive: 8, spawn: { frost_wolf: 3, yeti: 1 }, boss: 'frost_titan', color: '#bfe8ff' },
};
