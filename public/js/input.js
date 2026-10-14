import { S } from './state.js';
import { send } from './net.js';
import * as ui from './ui.js';

export const input = { keys: { u: 0, d: 0, l: 0, r: 0 }, mx: 0, my: 0, atk: false };
const map = { w: 'u', arrowup: 'u', s: 'd', arrowdown: 'd', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };

export function dash() {
  const me = S.me, now = performance.now() / 1000;
  if (!me || S.dead || now < me.dashReady) return;
  let dx = input.keys.r - input.keys.l, dy = input.keys.d - input.keys.u; const l = Math.hypot(dx, dy);
  if (l) { dx /= l; dy /= l; } else { const a = aim(); dx = Math.cos(a); dy = Math.sin(a); }
  me.dx = dx; me.dy = dy; me.dashUntil = now + S.cfg.dashTime; me.dashReady = now + S.cfg.dashCooldown;
  send({ t: 'dash' });
}
export function aim() { return Math.atan2(input.my - innerHeight / 2, input.mx - innerWidth / 2); }

export function init() {
  const typing = () => document.activeElement && document.activeElement.tagName === 'INPUT';
  addEventListener('keydown', (e) => {
    if (!S.joined) return;
    if (typing()) { if (e.key === 'Escape') { document.activeElement.blur(); ui.closeChat(); } return; }
    const k = e.key.toLowerCase();
    if (map[k]) { input.keys[map[k]] = 1; e.preventDefault(); return; }
    if (e.key === ' ') { dash(); e.preventDefault(); }
    else if (e.key === 'Enter') { ui.openChat(); e.preventDefault(); }
    else if (k >= '1' && k <= '9') { select(+k - 1); }
    else if (k === 'f') send({ t: 'use' });
    else if (k === 'i' || k === 'e') ui.toggle('inv');
    else if (k === 'm') ui.toggle('map');
    else if (k === 'x') send({ t: 'pickup' });
    else if (k === 'c') { ui.toggle('craft'); e.preventDefault(); }
    else if (k === 'escape') ui.closePanels();
  });
  addEventListener('keyup', (e) => { const k = map[e.key.toLowerCase()]; if (k) input.keys[k] = 0; });
  addEventListener('blur', () => { input.keys = { u: 0, d: 0, l: 0, r: 0 }; input.atk = false; });
  const cv = document.getElementById('game');
  addEventListener('mousemove', (e) => { input.mx = e.clientX; input.my = e.clientY; });
  cv.addEventListener('mousedown', (e) => { if (e.button === 0) input.atk = true; else if (e.button === 2) send({ t: 'use' }); });
  addEventListener('mouseup', (e) => { if (e.button === 0) input.atk = false; });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('wheel', (e) => { if (!S.joined || typing()) return; select((S.sel + (e.deltaY > 0 ? 1 : 8)) % 9); }, { passive: true });
  // touch: basic support (left half move by drag direction, right half aim+attack)
}
function select(i) { S.sel = i; send({ t: 'sel', i }); ui.invChanged(); }
