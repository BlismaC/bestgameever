# REALMFORGE — Blueprint & Base

Multiplayer 2D survival/fantasy sandbox (Moo-Moo-io style core + Terraria/Minecraft-style depth).
Node.js + WebSocket server (authoritative, 20 ticks/s) · HTML5 Canvas client · no build step.

## Run locally
```
npm install
npm start        # http://localhost:3000
npm test         # headless simulation smoke test
```
In dev mode everyone is admin: `/find ruby`, `/give flaming_ruby_sword`, `/boss lich_king`, `/mob wyvern 3`, `/tp x y`, `/xp 500`, `/stats`.

## Deploy (GitHub -> Render)
1. Push this whole folder to a GitHub repo.
2. Render -> New -> Web Service -> pick the repo. `render.yaml` is picked up automatically
   (build: `npm install`, start: `npm start`, health check: `/health`). WebSockets work out of the box.
3. Optional env vars: `ADMIN_KEY` (enables `/admin <key>` in production), `WORLD_SEED`.
Note: Render free tier sleeps after inactivity; world state is in memory (resets on restart) until a database is added.

## Architecture
```
server/
  index.js        HTTP + WebSocket bootstrap, rate limiting, game loop
  game.js         Authoritative simulation: players, combat, mobs AI, bosses, projectiles, drops, spawner, snapshots
  world.js        Seeded world, resource nodes, spatial hash, collisions
  config.js       All tuning numbers
  easter.js       Easter-egg hooks (join / chat / kill)
  commands.js     Slash + admin commands
  content/        <<< ALL GAME DATA LIVES HERE >>>
    materials.js  24 material tiers  -> items
    archetypes.js 14 weapon types
    modifiers.js  9 prefixes (flaming, vampiric, legendary...)
        => materials x archetypes x modifiers = 3,000+ weapons, generated automatically
    uniques.js    hand-made weapons / easter-egg items
    mobs.js bosses.js nodes.js biomes.js items.js
    index.js      assembles + VALIDATES everything (typos, unobtainable materials)
shared/worldgen.js  deterministic biome map used by BOTH server and client
public/             client (canvas renderer, input, UI) — data-driven, no per-content code
```
Client gets all content from `/api/content` (gzipped, cached), so new content needs **zero client changes**.

## How to add content
- **New material** -> add a line in `materials.js` (+ a node/mob/boss that drops it). 14 new weapons appear instantly.
- **New weapon type** -> `archetypes.js`.  **New prefix** -> `modifiers.js`.
- **New mob / boss** -> `mobs.js` / `bosses.js` (boss patterns: charge, aim, burst, spiral, summon, slam) + list it in a biome.
- **New biome** -> rule in `shared/worldgen.js` + entry in `biomes.js`.
- **Easter egg** -> `easter.js` or `uniques.js`.
Run `npm test` — the validator reports broken references.

## Roadmap (suggested order)
1. **Foundation (done here):** world, biomes, gathering, crafting, melee/ranged/magic, mobs, 11 bosses, day/night, levels, PvP, chat, minimap, easter eggs.
2. **Survival depth:** armor + defense, hunger, building (walls/doors/turrets, Moo-Moo style), chests, furnaces/stations, ammo.
3. **Progression:** accounts + database (Postgres/SQLite on Render) for saved characters, skill trees, classes, quests, NPC shops.
4. **Content scale:** more biomes (ocean, jungle, caves/dungeons, sky), events (blood moon, invasions), pets, mounts, fishing, farming.
5. **Netcode/perf:** binary protocol, delta snapshots, spatial grid for mobs, multiple world shards/rooms.
6. **Polish:** sprites + sound, particles, mobile controls, settings, anti-cheat hardening.

## Art / sprites
Drop PNG (or WebP) files into `public/assets/` — see `public/assets/README.txt` for names. Sprites face RIGHT.
`mobs/<id>.png`, `nodes/<id>.png`, `weapons/<archetype>.png` (light gray, auto-tinted per material), `items/<id>.png`, `player/body.png`.
Missing art falls back to built-in drawing. Tuning: `public/js/assetcfg.js`.

## v0.3 additions
- **World:** 24000 x 24000, large biomes, resources on a jittered grid (evenly spread, never clumped), served via `/api/world`.
  Danger zones: monsters get stronger (HP/damage/XP/loot tier) the farther you get from the center; rare ores only exist far out (`minZone`).
- **Crafting stations:** Workbench -> Forge -> Arcane Altar -> Void Anvil. Recipes require a nearby station (200 units) and chain through tiers
  (previous-tier material + leather + handle + rare accents). See `weaponCost()` in `server/content/index.js` to tune difficulty.
- **Building (Moomoo-style):** walls (wood/stone/iron), spikes (3 tiers), bear traps, campfire, stations. Select the item, click to place,
  `X` picks up your own. Structures can be destroyed (axes beat wood, pickaxes beat stone/metal; bosses crush bases; mobs chew through walls).
  Data lives in `server/content/structures.js`.
- **UI:** `E` inventory, `C` crafting (stations + categories), `M` world map, biome + danger level display.
- **Sprites:** `python3 tools/make_sprites.py` regenerates all art into `public/assets/` (needs `pip install pillow`).
  Replace any PNG with your own art at any time (same filename).
