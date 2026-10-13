'use strict';
// Easter eggs & fun hooks. Add new secrets here — game.js just calls these hooks.
module.exports = {
  onJoin(game, p) {
    const n = p.name.toLowerCase();
    if (n === 'herobrine') game.sys(p, '...he was always here.');
    if (n === 'notch') p.title = '👑';
    if (n === 'gaben') game.sys(p, 'Half-Life 3 confirmed. (Not really.)');
  },
  // return true to swallow the chat message
  onChat(game, p, msg) {
    const compact = msg.toLowerCase().replace(/[\s,]+/g, '');
    if (compact === 'uuddlrlrba' || compact === 'upupdowndownleftrightleftrightba') {
      if (!p.konami) { p.konami = true; game.addItem(p, 'konami_blade', 1); game.sys(p, '🎮 +30 lives. Konami Blade unlocked.'); }
      return true;
    }
    if (msg.toLowerCase() === '/moo') {
      game.broadcast({ t: 'chat', from: p.name, m: 'MOO!' });
      p.moos = (p.moos || 0) + 1;
      if (p.moos % 3 === 0) { for (let i = 0; i < 3; i++) game.spawnMob('cow', p.x + (Math.random() - 0.5) * 200, p.y + (Math.random() - 0.5) * 200); game.sys(p, 'The cows heard you.'); }
      return true;
    }
    return false;
  },
  onKill(game, p, m) {
    if (m.type === 'cow') {
      p.cowKills = (p.cowKills || 0) + 1;
      if (p.cowKills === 100) {
        game.broadcast({ t: 'chat', sys: 1, m: `${p.name} has slain 100 cows. The cows are... displeased.` });
        game.spawnDrop('holy_milk', 1, m.x, m.y);
      }
    }
  },
};
