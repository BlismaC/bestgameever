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

## v0.4 — what changed
**Persistence (islands + characters).** Players are identified by a random token stored in their browser (`localStorage`), no login needed.
Profiles (inventory, level, xp) and private islands (buildings, chests, guest list) are saved by `server/storage.js`:
- `DATABASE_URL` set (any free Postgres: Neon, Supabase, Render Postgres) -> saved in PostgreSQL. **Do this on Render** — its free disk is wiped on every restart.
- not set -> JSON files in `./data` (fine for local play).

**Gameplay**
- Terraria-style modifiers (Keen, Superior, Godly, Broken ...) roll on crafted/dropped weapons; reroll them at Brun the Reforger. Table: `server/content/modifiers.js`.
- Axes chop trees, pickaxes mine rock/ore; nothing else can. Other players' builds can't be damaged; per-item build limits (`structures.js`).
- Crafting stations + chests can only be placed on your private island (`H`). The craft list only shows what you can afford.
- Healing items cause Potion Sickness scaled to their strength; buffs/debuffs show as icons above your health.
- Random world events (Slime Rain, Blood Moon, Sandstorm, Blizzard) -> kill enough monsters -> boss. Bosses warn before big attacks (lanes, rings).
- Projectiles have kinds and can be knocked out of the air by melee swings or shot down by magic/arrows.
- Town NPCs (merchant, reforger, nurse, guide) in the safe zone; coins drop from monsters.

**Art:** `python3 tools/make_sprites.py` regenerates all pixel-art sprites. Replace any PNG in `public/assets/` with your own.

## v0.5 — combat feel
- **Hit accuracy:** lag compensation for melee (the server checks where the mob *appeared* on your screen), sprites are auto-fitted to their hitboxes,
  weapon sprites are drawn exactly as long as their real reach. **F3** shows all hitboxes and the swing wedge.
- **Reach:** dagger 50 · axe 65 · sword 70 · hammer 75 · scythe 90 · spear 115 · whip 135 · fusion swords 105-125 (see `content/archetypes.js`, `content/fusions.js`).
- **Fusion weapons** (`server/content/fusions.js`): combine other weapons + boss drops at a high-tier station.
  Verdant Edge = Emerald Sword + Jade Sword + Pharaoh's Khopesh (+8 Emerald) -> fires a piercing green sword wave.
  Glacial Reaver / Infernal Edge are the ice and fire versions; Prismatic Edge combines all three (3 waves per swing); Tempest Staff fires homing bolts.
  Art: `tools/src/verdant_edge.png` is the source sprite; `python3 tools/make_sprites.py` builds hue variants + the held (rotated) versions.
- **Projectile behaviours:** `beh: 'homing' | 'boomerang' | 'wave'` in any projectile definition. Kinds are drawn individually (arrow, wave, fire, ice, poison, soul, void ...) with their own impact effects.
- **Ranged mobs** draw their bow first (warning line), then fire real arrows / poison / fire. Swords cut enemy projectiles out of the air; arrows and magic shoot them down.

## v0.6 — bigger, harder, fixed world
- **Fixed map** (same for everyone, every restart): town meadow in the centre, 8 biome sectors around it, each with an inner (danger 2-3) and an outer (danger 4-6) biome:
  E desert → badlands · SE ashen foothills → volcano · S swamp → blightfen · SW haunted moors → cursed lands · W frostlands → glacier · NW highlands → crystal peaks · N elderwood → darkwood · NE jungle → deep jungle.
  Layout lives in `shared/worldgen.js`; resources/mobs per biome in `server/content/biomes.js`. 110 lakes (shallow = wade, deep = swim + drown) and waterfalls.
- **Monsters**: 35 new mobs; normal mobs use ability kits instead of telegraphs (`abilities` in `mobs.js`: shoot / burst / summon / blink / dash / leap). Outer zones scale hard.
- **Ores**: cobalt, crystal, bloodstone, starmetal, hellstone; high tiers are rare, far out and take many hits.
- **Bosses**: +35% HP, only heavy attacks are telegraphed, phase 2/3 enrage with extra attack patterns; boss weapons +35% damage; every boss drops a **golden trophy** (place it on your island) and armor pieces.
- **Armor**: 41 sets (every material + every boss), 3 slots, set bonuses, drawn on your character. Equip: double-click / right-click an armor item in the inventory.
- **Mounts** (flying ones ignore trees & water) and **Pals** (auto-mine ore into your inventory; found while mining ore or as very rare drops).
- **Music**: procedural, 17 moods (`public/js/music.js`). Volume / mute under the minimap.
- **Guide NPC**: pick any item you carry → where to get it, what you can craft with it and where. Town NPCs also live on your island.
- Hidden Excalibur: 0.01% of boulders contain one (`EXCALIBUR_CHANCE` in `config.js`), drops once, never respawns.
- Item stacks go up to 9999 · right-click opens chests / NPCs · the craft list shows everything you can afford (no more cap).

### Hosting tips
- Render free tier has a very weak CPU: set env `TICK_RATE=20` if big fights lag. Set `DATABASE_URL` so islands/characters survive restarts.
- Coming next (not in this version): Dracula's castle dimension, Atlantis, holiday events (pumpkin moon, evil Santa), the shared town with player markets/auctions.
