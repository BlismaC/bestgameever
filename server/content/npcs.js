// Town NPCs standing in the safe zone. kind: shop | reforge | nurse | guide.  price = coins.
module.exports = [
  { id: 'merchant', name: 'Marlo the Merchant', kind: 'shop', ang: 0.2, look: { s: 1, h: 3, c: 4, p: 2, st: 1 }, hat: 'cap',
    text: "Fine wares, fair prices. I buy your junk too!",
    shop: [['wood', 6], ['stone', 6], ['apple', 12], ['cooked_meat', 40], ['potion_heal', 120], ['potion_regen', 160], ['potion_swift', 160], ['potion_ironskin', 160], ['potion_greater_heal', 420], ['leather', 18], ['slime_gel', 12]] },
  { id: 'smith', name: 'Brun the Reforger', kind: 'reforge', ang: 1.8, look: { s: 0, h: 1, c: 0, p: 5, st: 2 }, hat: 'bandana',
    text: "Give me a weapon and some coins and I'll hammer a new edge on it. No promises it'll be better!" },
  { id: 'nurse', name: 'Nora the Nurse', kind: 'nurse', ang: 3.3, look: { s: 2, h: 5, c: 6, p: 3, st: 0 }, hat: 'nurse',
    text: "Hold still. I'll patch you up for a few coins." },
  { id: 'guide', name: 'Gale the Guide', kind: 'guide', ang: 4.8, look: { s: 3, h: 2, c: 2, p: 1, st: 3 }, hat: null,
    text: '', tips: [
      "Chop trees with an AXE and mine rocks with a PICKAXE. A sword can't do either!",
      "Press H to teleport to your private island. Place a Workbench there to start crafting.",
      "Crafting stations only work on your island: Workbench, Forge, Alchemy Table, Arcane Altar, then the Void Anvil.",
      "Weapons roll modifiers like Keen or Godly. Visit Brun the Reforger to reroll one for coins.",
      "Healing items cause Potion Sickness. Stronger potions take longer before you can drink again.",
      "Random events can summon bosses: kill enough of the monsters and the boss will appear.",
      "When a boss stands still and arrows or rings appear, MOVE. The attack is coming!",
      "Swing your weapon at enemy projectiles to knock them out of the air.",
      "Danger rises the farther you travel from the center. Rare ores wait out there!",
      "You can invite friends to your island from the Home panel and decide who may open your chests."] },
];
