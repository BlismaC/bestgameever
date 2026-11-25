import { S } from './state.js';
import { send } from './net.js';
import * as ui from './ui.js';
import * as ui2 from './ui2.js';

export const input = { keys: { u: 0, d: 0, l: 0, r: 0 }, mx: 0, my: 0, atk: false, click: false, dash: false };
const map = { w: 'u', arrowup: 'u', s: 'd', arrowdown: 'd', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };
export const mask = () => (input.keys.u ? 1 : 0) | (input.keys.d ? 2 : 0) | (input.keys.l ? 4 : 0) | (input.keys.r ? 8 : 0);
export function aim() { const c = S.cam; return Math.atan2(input.my - innerHeight / 2 - 0, input.mx - innerWidth / 2); }
export function worldCursor() { const c = S.cam; return { x: c.x + (input.mx - innerWidth / 2) / c.scale, y: c.y + (input.my - innerHeight / 2) / c.scale }; }

function interact() {
  const me = S.me;
  let best = null, bd = 230;
  for (const n of S.npcs) { const d = Math.hypot(n.x - me.x, n.y - me.y); if (d < bd) { bd = d; best = { t: 'npc', id: n.id }; } }
  for (const st of S.structs.values()) { if (st.type !== 'chest') continue; const d = Math.hypot(st.x - me.x, st.y - me.y); if (d < Math.min(bd, 260)) { bd = d; best = { t: 'chest_open', id: st.id }; } }
  for (const po of S.gen.portals) { const d = Math.hypot(po.x - me.x, po.y - me.y); if (d < Math.min(bd, 170)) { bd = d; best = { t: 'portal' }; } }
  if (S.plea) { const d = Math.hypot(S.plea.x - me.x, S.plea.y - me.y); if (d < Math.min(bd, 230)) { bd = d; best = { t: 'plea_talk' }; } }
  if (best) send(best);
}
// right-click on a chest or town NPC (near the cursor AND near you) opens it; otherwise right-click = use item
function rightClickInteract() {
  const w = worldCursor(), me = S.me; if (!me) return false;
  for (const n of S.npcs) if (Math.hypot(n.x - w.x, n.y - w.y) < 60 && Math.hypot(n.x - me.x, n.y - me.y) < 240) { send({ t: 'npc', id: n.id }); return true; }
  if (S.plea && Math.hypot(S.plea.x - w.x, S.plea.y - w.y) < 70 && Math.hypot(S.plea.x - me.x, S.plea.y - me.y) < 260) { send({ t: 'plea_talk' }); return true; }
  for (const po of S.gen.portals) if (Math.hypot(po.x - w.x, po.y - w.y) < 90 && Math.hypot(po.x - me.x, po.y - me.y) < 180) { send({ t: 'portal' }); return true; }
  for (const st of S.structs.values()) if (st.type === 'chest' && Math.hypot(st.x - w.x, st.y - w.y) < 50 && Math.hypot(st.x - me.x, st.y - me.y) < 280) { send({ t: 'chest_open', id: st.id }); return true; }
  return false;
}
export function init() {
  const typing = () => document.activeElement && document.activeElement.tagName === 'INPUT';
  addEventListener('keydown', (e) => {
    if (!S.joined) return;
    if (typing()) { if (e.key === 'Escape') { document.activeElement.blur(); ui.closeChat(); } return; }
    const k = e.key.toLowerCase();
    if (ui2.dialogKey(e.key)) { e.preventDefault(); return; }
    if (e.key === 'F3') { S.debug = !S.debug; e.preventDefault(); return; }
    if (map[k]) { input.keys[map[k]] = 1; e.preventDefault(); return; }
    if (e.key === ' ') { input.dash = true; e.preventDefault(); }
    else if (e.key === 'Enter') { ui.openChat(); e.preventDefault(); }
    else if (k >= '1' && k <= '9') { select(+k - 1); }
    else if (k === 'f') send({ t: 'use' });
    else if (k === 'i' || k === 'e') ui.toggle('inv');
    else if (k === 'c') { ui.toggle('craft'); e.preventDefault(); }
    else if (k === 'm') ui.toggle('map');
    else if (k === 'j') ui.toggle('home');
    else if (k === 'h') send({ t: 'home' });
    else if (k === 't') interact();
    else if (k === 'p') ui.toggle('pals');
    else if (k === 'v') send({ t: 'bat' });
    else if (k === 'x') { const w = worldCursor(); send({ t: 'pickup', x: Math.round(w.x), y: Math.round(w.y) }); }
    else if (k === 'escape') ui.closePanels();
  });
  addEventListener('keyup', (e) => { const k = map[e.key.toLowerCase()]; if (k) input.keys[k] = 0; });
  addEventListener('blur', () => { input.keys = { u: 0, d: 0, l: 0, r: 0 }; input.atk = false; });
  const cv = document.getElementById('game');
  addEventListener('mousemove', (e) => { input.mx = e.clientX; input.my = e.clientY; });
  cv.addEventListener('mousedown', (e) => {
    if (e.button === 0) { input.atk = true; input.click = true; }
    else if (e.button === 2) { if (!rightClickInteract()) send({ t: 'use' }); }
  });
  addEventListener('mouseup', (e) => { if (e.button === 0) input.atk = false; });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('wheel', (e) => { if (!S.joined || typing()) return; select((S.sel + (e.deltaY > 0 ? 1 : 8)) % 9); }, { passive: true });
}
function select(i) { S.sel = i; send({ t: 'sel', i }); ui.invChanged(); }
