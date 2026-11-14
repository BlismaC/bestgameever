'use strict';
// Slash commands. Public: /help /players /time.  Admin (dev or ADMIN_KEY): /give /boss /mob /tp /heal /xp /find /stats
const C = require('./config');
const content = require('./content');

function isAdmin(p) { return p.admin || (C.DEV && !C.ADMIN_KEY); }

module.exports = function handle(game, p, text) {
  const [cmd, ...args] = text.slice(1).trim().split(/\s+/);
  const sys = (m) => game.sys(p, m);
  switch ((cmd || '').toLowerCase()) {
    case 'help': sys('Commands: /help /players /time /moo' + (isAdmin(p) ? ' | admin: /give id [n] [modifier] /find text /boss id /mob id [n] /tp x y /heal /xp n /stats' : '')); return true;
    case 'players': sys(`${game.players.size} online`); return true;
    case 'home': game.startTp(p); return true;
    case 'time': sys(`Time of day: ${(game.dayTime * 24).toFixed(1)}h ${game.isNight() ? '(night)' : '(day)'}`); return true;
    case 'admin':
      if (C.ADMIN_KEY && args[0] === C.ADMIN_KEY) { p.admin = true; sys('Admin enabled.'); } else sys('Nope.');
      return true;
  }
  if (!isAdmin(p)) return false;
  switch (cmd.toLowerCase()) {
    case 'give': { const id = args[0]; if (!content.items[id]) { sys('Unknown item. Try /find'); return true; } const mod = args[2] && content.modById[args[2]] ? args[2] : undefined; game.addItem(p, id, Math.max(1, parseInt(args[1] || '1', 10)), mod); sys(`Gave ${id}`); return true; }
    case 'find': { const q = (args.join(' ') || '').toLowerCase(); const r = Object.values(content.items).filter((i) => i.id.includes(q) || i.name.toLowerCase().includes(q)).slice(0, 8).map((i) => i.id); sys(r.length ? r.join(', ') : 'No matches'); return true; }
    case 'boss': case 'mob': { const id = args[0]; if (!content.mobs[id]) { sys('Unknown mob: ' + Object.keys(content.mobs).join(', ')); return true; } const n = Math.min(20, parseInt(args[1] || '1', 10)); for (let i = 0; i < n; i++) game.spawnMob(id, p.x + 300 * Math.cos(p.angle) + Math.random() * 60, p.y + 300 * Math.sin(p.angle) + Math.random() * 60); return true; }
    case 'tp': p.x = +args[0] || p.x; p.y = +args[1] || p.y; return true;
    case 'event': { const ok = game.startEvent(args[0], p.x, p.y); sys(ok ? 'Event started.' : 'Events: ' + Object.keys(content.events).join(', ')); return true; }
    case 'season': { const a = (args[0] || '').toLowerCase(); game.seasonForce = a === 'auto' || !a ? null : a; game.updateSeason(false); sys(`Season: ${game.season || 'none'} (use /season halloween|christmas|newyear|valentine|easter|off|auto)`); return true; }
    case 'dim': { const id = { town: 'town', castle: 'castle_land', hall: 'castle_hall', atlantis: 'atlantis', temple: 'temple_hall' }[(args[0] || '').toLowerCase()]; if (!id) { sys('Usage: /dim town|castle|hall|atlantis'); return true; } const D = game.world.gen.DIMS[id]; if (!game.world.gen.dimAt(p.x, p.y)) p.returnMain = { x: p.x, y: p.y }; game.teleportTo(p, D.spawn[0], D.spawn[1]); if (id === 'castle_hall') game.startFight('dracula', [p]); if (id === 'temple_hall') game.startFight('neptune', [p]); return true; }
    case 'plea': { game.pleaSpawn(p); sys(game.plea ? 'A plea has been spawned nearby.' : 'Could not place the plea here, try again.'); return true; }
    case 'pal': { const sp = args[0], r = require('./content').pals[sp]; if (!r) { sys('Pals: ' + Object.keys(require('./content').pals).join(', ')); return true; } p.pals.push({ id: Date.now().toString(36), sp, lv: Math.max(1, Math.min(60, parseInt(args[1], 10) || 1)), xp: 0, name: r.name, traits: ['brave'], shiny: false }); game.sendPals(p); sys('Added a ' + r.name + '.'); return true; }
    case 'vampire': { game.vampireStart(p); return true; }
    case 'zone': sys('Zone ' + game.world.zone(p.x, p.y).toFixed(2) + ' biome ' + game.world.biomeAt(p.x, p.y)); return true;
    case 'heal': p.hp = p.maxHp; return true;
    case 'xp': game.giveXp(p, parseInt(args[0] || '100', 10)); return true;
    case 'stats': sys(JSON.stringify(content.stats()) + ` mobs:${game.mobs.size} proj:${game.projectiles.length}`); return true;
  }
  return false;
};
