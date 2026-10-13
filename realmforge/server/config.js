// Central tuning knobs. Change numbers here, not in game code.
module.exports = {
  GAME_NAME: 'Realmforge',
  PORT: process.env.PORT || 3000,
  TICK_RATE: 20,
  WORLD_SIZE: 8000,
  SEED: process.env.WORLD_SEED ? parseInt(process.env.WORLD_SEED, 10) : Math.floor(Math.random() * 90000) + 1000,
  VIEW_RADIUS: 1200,
  MAX_PLAYERS: 80,
  RESOURCE_COUNT: 1800,
  PLAYER: {
    radius: 22, speed: 230, hp: 100, hpPerLevel: 12,
    regenDelay: 5, regen: 2,
    dashSpeed: 720, dashTime: 0.18, dashCooldown: 1.6,
    invSize: 30, hotbar: 9, pickupRadius: 60,
  },
  SAFE_RADIUS: 350,        // no PvP / mob aggro around world center
  PVP: true,
  DAY_LENGTH: 480,         // seconds for a full day/night cycle
  MOBS_PER_PLAYER: 16,
  MOB_CAP: 500,
  SHINY_CHANCE: 0.01,      // rare golden mobs: more HP, triple loot
  BOSS_INTERVAL: 360,      // seconds between natural boss spawns
  RESPAWN_TIME: 3,
  CHAT_MAX: 140,
  ADMIN_KEY: process.env.ADMIN_KEY || '',
  DEV: process.env.NODE_ENV !== 'production',
};
