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

## v0.7 — tameable Pals, dimensions, holidays, market
- **Pals are creatures now.** 14 wild species roam the biomes ("Wild Cinderfox Lv14", shiny ✦ ones too). Weaken one, then throw a **Pal Sphere** (hold it, click):
  catch chance depends on the sphere (35 / 55 / 80 %), the Pal's remaining HP, its rarity and level. Craft spheres at the Workbench (slime gel + iron) or buy them from the Merchant.
  Tamed Pals live in your roster (**P**): level up, have 1-2 traits (Brave, Hard Worker, Lucky, Vampiric, Tough...), can be renamed / released. The Pal that is out **fights next to you and auto-mines ore & rock**.
- **Willow Town** (peaceful dimension, portal in the main town): Market Board (player shop), Auctioneer (auctions with bids/buyout), Postie (mail — you are paid even when offline), every NPC again, no PvP/monsters/building.
- **Dracula's domain**: rare "desperate plea" event at night (a villager with a "!" nearby). Accept → foggy gothic land with gothic monsters → castle gate → **Vlad Dracula** (speech, 3 phases, bat swarms, blood rain, teleport-slashes, gothic piano music).
  Drops: Dracula's Cape armor set (with bat wings), 4 legendary weapons, trophy, **25 % Vampire Elixir** (lifesteal, speed, bat form on **V**, but sunlight burns — Holy Water cures).
- **Atlantis**: when you drown there is a 1-in-3 chance to be pulled into the sunken city. Walk up to the temple → **Neptune** (speech, tidal waves, whirlpool, lightning rain, sharks). Drops: Neptune's Pearl (permanent gills), trident & staves, Atlantean set, Sea Turtle mount.
- **Holidays** (real date; `/season halloween|christmas|newyear|valentine|easter|off|auto`): Pumpkin Moon + **Pumpking** (Halloween), Frost Moon + **Sinister Claus** (Christmas), seasonal town decorations & weather, daily gifts from seasonal NPCs, **trick-or-treat candy** from every town NPC at night during Halloween.
- Admin/test commands: `/dim town|castle|hall|atlantis`, `/plea`, `/pal <species> [level]`, `/vampire`, `/season ...`, `/event pumpkin_moon|frost_moon`.
- `npm test` runs the old tests plus `server/test_systems.js` (market, auction, dimensions, bosses, pals, vampire, seasons).

## v0.7.1 — netcode feel, pixel projectiles, custom attacks, hand-pixeled bosses & pals
- **Lag compensation**: projectiles and monsters are drawn *extrapolated by your round-trip* (`public/js/interp.js`), so what you see is where the server tests hits when your input arrives; your own ranged shots appear instantly (local cosmetic prediction, replaced by the real projectile); monsters show a short cast-squash + muzzle flash when they fire.
- **Projectiles/effects are pixel art** (`tools/sprites_proj.py` → `assets/proj`, `assets/fx`): 42 projectile kinds with 3 animation frames, 12 impact-burst styles, muzzle flashes, pixel trails. Many monsters have their own kind (stinger, crow, wisp, seed, cookie, snowball, feather, leaf, sand, shard, rock, spark, present, candy, bloodorb...).
- **New attack types**: `lob` (arcing bomb with a landing shadow) and lingering **ground zones** (poison / fire / ice / blood / water / lava) — `server/systems/attacks.js`, assigned to pumpkin heads, slimes, witches, demons, snowmen and several bosses.
- **Hand-pixeled art** (`tools/pixel_hand.py`: no anti-aliasing, fixed palettes, outlines, edge shading): Dracula, Neptune, Pumpking, Sinister Claus, 5 dialogue portraits, all 14 Pals. Cutscenes show a pixel portrait next to a speech bubble.
- **Wild Pals** spawn reliably (dedicated spawner, 3 per player nearby), have name tags, and a radar arrow shows Pals that are off screen.

## v0.7.2 — more hand-pixeled art
- Hand-pixeled (see `tools/pixel_hand.py`): slimes (7 colours), wolves (4), goblin, skeleton archer, zombies (4), spider, cow, chicken, bats (2), Dracula's castle and the Atlantis temple.
- Still generated by the older vector→pixel pipeline: most other monsters, items, weapons, trees/ores and the remaining decor. Replace them gradually by adding functions to `MOB_ART` / `DECOR_ART` — `tools/make_sprites.py` picks them up automatically.

## v0.7.3 — gameplay fixes
- **Pal Spheres work** (they were discarded the tick they were thrown: zero-damage projectiles were dropped). Wild pals are now rare (about one per few minutes of exploring), spawn outside your screen and there is no radar.
- **Crafting**: one click always crafts (the list is no longer rebuilt under the mouse), and a clear "Crafted X" / "Missing materials" message appears in the panel.
- **Hits**: enemy projectiles need a clear overlap (smaller hurt-box, swept test), melee contact is tighter, your projectiles no longer cancel against enemy projectiles (that made spammed shots vanish), your shots start where your character is while moving, fast shots cannot tunnel through monsters.
- **Knockback** for the player, **bosses are solid**, houses / castle / temple / pillars / thrones are solid, you respawn in the normal map.
- **Doors**: walking into Dracula's gate or Neptune's temple door plays an enter animation (walk in, shrink, fade) and teleports you; Neptune now has his own interior hall (`temple_hall`). Pixel-art portals, boss-hall furniture (pillars, torches that light the room, carpet, throne).
- Projectiles are drawn by integrating their velocity with a gentle correction toward the server (smoother), own shots hand over to the server projectile without a jump.
