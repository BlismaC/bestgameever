DROP YOUR ART HERE  (PNG with transparent background; WebP also works)
Everything must FACE RIGHT (east). Missing files simply fall back to the built-in drawing.

mobs/<mobId>.png        e.g. mobs/cow.png, mobs/slime_king.png      (mob ids: server/content/mobs.js + bosses.js)
                        mobs ~256x256, bosses ~512x512. Fill the canvas; it is scaled to the mob's radius.
nodes/<nodeId>.png      e.g. nodes/tree.png, nodes/iron_ore.png      (ids: server/content/nodes.js)
                        Draw the object centered. Trees may be tall; transparent padding is fine.
weapons/<archetype>.png e.g. weapons/sword.png, weapons/bow.png      (14 archetypes: sword dagger axe pickaxe spear
                        hammer scythe whip bow crossbow staff wand tome shuriken)
                        Draw LIGHT GRAY / WHITE, pointing RIGHT with the handle on the left.
                        The game tints it per material (iron, ruby, void...) -> 14 files cover 3000+ weapons!
items/<itemId>.png      Exact override for any single item (never tinted), e.g. items/moo_stick.png,
                        items/apple.png, items/iron.png, items/bfg_9000ish.png
player/body.png         Optional player body (top-down, facing right, ~128x128)

Tuning (size multipliers, rotate vs flip) lives in public/js/assetcfg.js

buffs/<buffId>.png      16x16 pixel icons shown above the health bar (regeneration, swiftness, burning, potion_sickness ...)
structures/<id>.png     placeable objects (workbench, forge, chest, wall_*, spikes_*, bear_trap)
held/<itemId>.png        Optional: sprite used while HELD in the hand (points RIGHT, hilt left). items/<id>.png stays the inventory icon (any angle).
