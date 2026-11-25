// The residents of Willow Town: they WALK around (see server/systems/town.js), and each shopkeeper sells something different.
const L = (s, h, c, p, st) => ({ s, h, c, p, st });
// bld = building id on the town map, work = tile offset inside that building (interior origin), role: 'shop' (mostly at the counter) or 'roam' (wanders between points)
const PLAZA = [[44, 50], [44, 60], [56, 52], [56, 62], [50, 49], [50, 66], [47, 52], [52, 52], [46, 57], [54, 57]];
const ROAD = [[49, 24], [49, 36], [49, 70], [50, 84], [30, 32], [75, 32], [20, 45], [20, 70], [85, 45], [85, 70], [49, 40], [49, 78]];
const FARM = [[30, 91], [60, 93], [14, 94], [78, 94], [40, 87], [34, 99]];
const SPEC = [
  { id: 't_guide', name: 'Gale the Guide', kind: 'guide', copy: 'guide', bld: 'hall', work: [5, 6], role: 'shop', look: L(0, 2, 2, 2, 1), hat: 'cap' },
  { id: 't_mayor', name: 'Mayor Tilda', kind: 'talk', bld: 'hall', work: [12, 3], role: 'shop', look: L(2, 6, 7, 4, 2), hat: null, text: "Welcome to Willow Town! Everyone here is a friend: trade at the Market Board, bid at the Auction House, post a letter, or just enjoy the fountain. No monsters allowed — I made a rule." },
  { id: 't_merchant', name: 'Marlo the Merchant', kind: 'shop', copy: 'merchant', bld: 'store', work: [10, 2], role: 'shop', look: L(1, 3, 4, 2, 1), hat: 'cap' },
  { id: 't_alchemist', name: 'Lyra the Alchemist', kind: 'shop', bld: 'alchemist', work: [6, 3], role: 'shop', look: L(2, 5, 5, 6, 3), hat: 'witch', text: 'Brews for every occasion! Mind the green one, it bites.', shopFn: 'potions' },
  { id: 't_smith', name: 'Brun the Reforger', kind: 'reforge', copy: 'reforge', bld: 'smith', work: [6, 3], role: 'shop', look: L(0, 8, 8, 3, 2), hat: null },
  { id: 't_armorer', name: 'Hilda the Armorer', kind: 'shop', bld: 'smith', work: [8, 4], role: 'shop', look: L(2, 1, 6, 5, 1), hat: null, text: 'Vanguard plate, Ranger leathers, Mage robes, Caller mantles — each piece gives a third of the set bonus, so mix and match!', shopFn: 'armor' },
  { id: 't_carpenter', name: 'Tobias the Carpenter', kind: 'shop', bld: 'carpenter', work: [3, 2], role: 'shop', look: L(1, 4, 3, 3, 2), hat: 'cap', text: 'Wood, stone and everything to build your island home.', shopFn: 'builder' },
  { id: 't_nurse', name: 'Nora the Nurse', kind: 'nurse', copy: 'nurse', bld: 'clinic', work: [7, 3], role: 'shop', look: L(2, 7, 0, 1, 3), hat: 'nurse' },
  { id: 't_innkeeper', name: 'Rosa the Innkeeper', kind: 'shop', bld: 'inn', work: [6, 2], role: 'shop', look: L(2, 3, 9, 2, 1), hat: null, text: 'Hot meals, warm beds, and cold ale (the ale is a lie).', shopFn: 'food' },
  { id: 't_auctioneer', name: 'Aldo the Auctioneer', kind: 'auction', bld: 'auction', work: [9, 3], role: 'shop', look: L(1, 6, 5, 4, 1), hat: 'cap', text: 'Going once, going twice... Sell your treasures to the highest bidder!' },
  { id: 't_postie', name: 'Penny the Postie', kind: 'mail', bld: 'post', work: [5, 2], role: 'roam', pts: [...ROAD, ...PLAZA], look: L(2, 4, 3, 3, 0), hat: 'bandana', text: 'Letters, parcels, winnings. Anything waiting for you comes through me!' },
  { id: 't_finn', name: 'Finn the Pal Trainer', kind: 'shop', bld: 'pals', work: [5, 3], role: 'shop', look: L(1, 5, 8, 5, 1), hat: 'cap', text: 'Wild Pals need a gentle hand and a sturdy sphere. Weaken them first!', shopFn: 'spheres' },
  { id: 't_willa', name: 'Willa the Farmer', kind: 'shop', at: [30, 90], role: 'roam', pts: FARM, look: L(2, 6, 4, 1, 2), hat: 'cap', text: 'Fresh from the field!', shopFn: 'farm' },
  { id: 't_pip', name: 'Pip', kind: 'talk', at: [47, 57], role: 'roam', pts: [...PLAZA, ...FARM.slice(0, 2)], look: L(1, 0, 6, 1, 3), hat: 'cap', text: "Wanna see something cool? I found a Pal once! It was this big. ...Okay it was smaller." },
  { id: 't_guard', name: 'Captain Hale', kind: 'talk', at: [49, 60], role: 'roam', pts: [...ROAD, [49, 52]], look: L(0, 9, 1, 0, 2), hat: 'helm', text: 'Peaceful as always. If anything happens, I ... was probably on break.' },
  { id: 'market_board', name: 'Market Board', kind: 'market', noBody: true, at: [42, 52], role: 'static', static: true, look: L(0, 0, 0, 0, 0), text: 'Player market.' },
];
// build the sold-item lists from the live content
function make({ npcs, items, structures, armor }) {
  const price = (id, mul, min) => Math.max(min || 4, Math.round((items[id].value || 10) * mul));
  const lists = {
    potions: () => Object.keys(items).filter((k) => k.startsWith('potion_')).map((k) => [k, price(k, 2.4, 30)]),
    food: () => Object.values(items).filter((i) => i.use && i.use.heal && i.type === 'consumable' && !i.id.startsWith('potion_') && !/candy|chocolate|gift|egg|gingerbread|caramel|elixir|holy/.test(i.id) && (i.value || 0) <= 40).slice(0, 10).map((i) => [i.id, price(i.id, 2.2, 8)]),
    farm: () => ['apple', 'jungle_fruit', 'mushroom', 'kelp'].filter((k) => items[k]).map((k) => [k, price(k, 1.6, 6)]),
    spheres: () => [['pal_sphere', 120], ['pal_sphere_great', 360], ['pal_sphere_ultra', 1100]].filter(([k]) => items[k]),
    builder: () => ['wood', 'stone', 'workbench', 'chest', 'campfire', 'forge', 'wall_wood', 'wall_stone', 'torch'].filter((k) => items[k]).map((k) => [k, price(k, 2.2, 4)]),
    armor: () => { const out = []; for (const set of Object.values(armor.sets)) if (set.mat && ['copper', 'iron', 'silver', 'gold'].includes(set.mat)) for (const pid of Object.values(set.pieces)) out.push([pid, price(pid, 3.2, 20)]); return out; },
  };
  return SPEC.map((s) => {
    const d = { ...s }, base = s.copy && npcs.find((n) => n.id === s.copy);
    if (base) { for (const k of ['tips', 'text', 'shop', 'tipsHeader']) if (base[k] !== undefined && d[k] === undefined) d[k] = base[k]; }
    if (s.shopFn) d.shop = lists[s.shopFn]();
    if (d.kind === 'shop' && !d.shop) d.shop = [];
    d.town = true; d.dimOnly = true; delete d.copy; delete d.shopFn;
    return d;
  });
}
module.exports = { make, SPEC, PLAZA, ROAD, FARM };
