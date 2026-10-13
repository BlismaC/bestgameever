'use strict';
const http = require('http');
const path = require('path');
const express = require('express');
const compression = require('compression');
const { WebSocketServer } = require('ws');
const C = require('./config');
const content = require('./content');
const Game = require('./game');

const problems = content.validate();
if (problems.length) { console.warn('[content] problems:\n - ' + problems.join('\n - ')); }
console.log('[content]', content.stats());

const game = new Game();
const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use('/shared', express.static(path.join(__dirname, '../shared')));
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (q, r) => r.send('ok'));
app.get('/api/status', (q, r) => r.json({ name: C.GAME_NAME, players: game.players.size, mobs: game.mobs.size, max: C.MAX_PLAYERS }));
const contentJson = JSON.stringify(content.clientPayload());
app.get('/api/content', (q, r) => r.type('json').set('Cache-Control', 'no-cache').send(contentJson));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 2048 });

wss.on('connection', (ws) => {
  let player = null; let msgs = 0;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  const rate = setInterval(() => { msgs = 0; }, 1000);
  ws.on('message', (data) => {
    if (++msgs > 80) return; // flood protection
    let m; try { m = JSON.parse(data); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    if (!player) {
      if (m.t !== 'join') return;
      if (game.players.size >= C.MAX_PLAYERS) { ws.send(JSON.stringify({ t: 'full' })); ws.close(); return; }
      player = game.addPlayer(ws, m.name);
      return;
    }
    game.handle(player, m);
  });
  const leave = () => { clearInterval(rate); if (player) { game.removePlayer(player); player = null; } };
  ws.on('close', leave);
  ws.on('error', leave);
});

setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 30000);

let last = Date.now();
setInterval(() => {
  const now = Date.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try { game.tick(dt); } catch (e) { console.error('[tick error]', e); }
}, 1000 / C.TICK_RATE);

setInterval(() => {
  fetch(`${'https://bestgameever.onrender.com'}/health`).catch(() => {});
}, 4 * 60 * 1000);

server.listen(C.PORT, () => console.log(`${C.GAME_NAME} running on :${C.PORT} (seed ${C.SEED}, ${C.DEV ? 'dev' : 'prod'})`));
process.on('SIGTERM', () => { server.close(); process.exit(0); });
