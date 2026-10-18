// Central tuning knobs. Change numbers here, not in game code.
module.exports = {
  GAME_NAME: 'Realmforge',
  PORT: process.env.PORT || 3000,
  TICK_RATE: 30,
  WORLD_SIZE: 24000,
  SEED: process.env.WORLD_SEED ? parseInt(process.env.WORLD_SEED, 10) : Math.floor(Math.random() * 90000) + 1000,
  VIEW_RADIUS: 1200,
  MAX_PLAYERS: 80,
  RESOURCE_CELL: 190,        // resources are placed on a jittered grid -> evenly spread, never stacked
  PLAYER: {
    radius: 16, speed: 230, hp: 100, hpPerLevel: 12,
    regenDelay: 5, regen: 2,
    dashSpeed: 720, dashTime: 0.18, dashCooldown: 1.6,
    invSize: 30, hotbar: 9, pickupRadius: 60,
  },
  SAFE_RADIUS: 500,        // no PvP / mob aggro around world center
  PVP: true,
  BUILD_RANGE: 260, CRAFT_RANGE: 200, MAX_STRUCTS_PER_PLAYER: 90,
  DAY_LENGTH: 480,         // seconds for a full day/night cycle
  MOBS_PER_PLAYER: 5,
  MOB_CAP: 140,
  SHINY_CHANCE: 0.01,      // rare golden mobs: more HP, triple loot
  BOSS_INTERVAL: 1500,     // seconds between (rare) natural boss rolls
  ISLAND_SIZE: 2400, ISLAND_R: 900, TP_TIME: 4,
  RESPAWN_TIME: 3,
  CHAT_MAX: 140,
  ADMIN_KEY: process.env.ADMIN_KEY || '',
  DEV: process.env.NODE_ENV !== 'production',
};
