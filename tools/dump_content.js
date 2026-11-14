// Exports the data the sprite generator needs (armor palettes, item list) -> tools/data/content_dump.json
const fs = require('fs'), path = require('path');
const c = require('../server/content');
const out = {
  items: Object.values(c.items).map((i) => ({ id: i.id, type: i.type, arch: i.arch || null, color: i.color, pl: !!i.place })),
  sets: Object.fromEntries(Object.values(c.armor.sets).map((s) => [s.id, { name: s.name, color: s.color, look: s.look, pieces: s.pieces }])),
  mobs: Object.keys(c.mobs), nodes: Object.keys(c.nodes), bosses: Object.values(c.mobs).filter((m) => m.boss).map((m) => m.id),
  pals: Object.fromEntries(Object.entries(c.pals).map(([k, v]) => [k, v.color])), mounts: Object.fromEntries(Object.entries(c.mounts).map(([k, v]) => [k, v.color])),
  structures: Object.keys(c.structures),
};
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data', 'content_dump.json'), JSON.stringify(out));
console.log('dumped', out.items.length, 'items,', Object.keys(out.sets).length, 'armor sets');
