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
    case 'zone': sys('Zone ' + game.world.zone(p.x, p.y).toFixed(2) + ' biome ' + game.world.biomeAt(p.x, p.y)); return true;
    case 'heal': p.hp = p.maxHp; return true;
    case 'xp': game.giveXp(p, parseInt(args[0] || '100', 10)); return true;
    case 'stats': sys(JSON.stringify(content.stats()) + ` mobs:${game.mobs.size} proj:${game.projectiles.length}`); return true;
  }
  return false;
};
