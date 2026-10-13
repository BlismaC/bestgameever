import { S } from './state.js';
import { send } from './net.js';

const $ = (id) => document.getElementById(id);
let pick = -1, deadTimer = 0, deadInt = null;

export function menuMsg(t) { $('menumsg').textContent = t; $('play').disabled = false; }
export function start() {
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden');
  document.title = S.gameName;
  buildMinimap();
  invChanged();
}

// ---------- items
export function icon(id, count, i, sel) {
  const it = S.content.items[id];
  const el = document.createElement('div');
  el.className = 'slot' + (it ? ' r-' + it.r : ' empty') + (sel ? ' sel' : '');
  if (it) {
    el.dataset.id = id;
    el.innerHTML = `<span>${it.e}</span>${count > 1 ? `<span class="n">${count}</span>` : ''}`;
    el.style.background = `linear-gradient(135deg,${it.c}55,#0009)`;
  }
  if (i !== undefined && i < 9) el.insertAdjacentHTML('beforeend', `<span class="k">${i + 1}</span>`);
  return el;
}
function tipHTML(id) {
  const it = S.content.items[id]; if (!it) return '';
  let h = `<b style="color:var(--rc)">${it.n}</b><div class="d">${it.r} ${it.ty}${it.t !== undefined ? ' · tier ' + it.t : ''}</div>`;
  if (it.w) h += `<div class="d">Damage ${it.w.dmg} · ${(1 / it.w.cd).toFixed(1)}/s${it.w.rng ? ' · melee ' + it.w.rng : ''}${it.w.rngd ? ' · ranged' : ''}</div>`;
  if (it.d) h += `<div class="d">${it.d}</div>`;
  if (it.u) h += `<div class="d">Use with F / right-click</div>`;
  return h;
}
function attachTip(el) {
  el.addEventListener('mouseenter', () => { const id = el.dataset.id; if (!id) return; const t = $('tip'); t.innerHTML = tipHTML(id); t.className = 'r-' + S.content.items[id].r; t.classList.remove('hidden'); });
  el.addEventListener('mousemove', (e) => { const t = $('tip'); t.style.left = Math.min(innerWidth - 250, e.clientX + 14) + 'px'; t.style.top = (e.clientY + 14) + 'px'; });
  el.addEventListener('mouseleave', () => $('tip').classList.add('hidden'));
}

export function invChanged() {
  const hb = $('hotbar'); hb.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const s = S.inv[i]; const el = icon(s ? s[0] : null, s ? s[1] : 0, i, i === S.sel);
    el.style.pointerEvents = 'auto'; attachTip(el);
    el.onclick = () => { S.sel = i; send({ t: 'sel', i }); };
    hb.appendChild(el);
  }
  if (!$('inv').classList.contains('hidden')) renderInv();
  if (!$('craft').classList.contains('hidden')) renderCraft();
}
function renderInv() {
  const g = $('invgrid'); g.innerHTML = '';
  for (let i = 0; i < S.cfg.invSize; i++) {
    const s = S.inv[i]; const el = icon(s ? s[0] : null, s ? s[1] : 0, i, false);
    if (i === pick) el.classList.add('pick');
    attachTip(el);
    el.onclick = () => { if (pick < 0) { pick = i; } else { if (pick !== i) send({ t: 'swap', a: pick, b: i }); pick = -1; } renderInv(); };
    el.oncontextmenu = (e) => { e.preventDefault(); send({ t: 'drop', i }); };
    g.appendChild(el);
  }
}
function have(id) { let n = 0; for (const s of S.inv) if (s && s[0] === id) n += s[1]; return n; }
function renderCraft() {
  const q = $('craftsearch').value.toLowerCase().trim();
  const list = $('craftlist'); list.innerHTML = '';
  const rows = [];
  for (const r of S.content.recipes) {
    const it = S.content.items[r.o]; if (!it) continue;
    if (q && !it.n.toLowerCase().includes(q)) continue;
    let can = true; for (const [k, n] of Object.entries(r.c)) if (have(k) < n) can = false;
    rows.push({ r, it, can });
  }
  rows.sort((a, b) => (b.can - a.can) || ((a.it.t || 0) - (b.it.t || 0)));
  for (const { r, it, can } of rows.slice(0, 60)) {
    const d = document.createElement('div'); d.className = 'rec';
    const cost = Object.entries(r.c).map(([k, n]) => { const ci = S.content.items[k]; const h = have(k); return `<span class="${h >= n ? 'yes' : 'no'}">${ci.e}${h}/${n}</span>`; }).join('');
    d.innerHTML = `<div class="ic">${it.e}</div><div class="nm"><b style="color:${rc(it.r)}">${it.n}${r.n > 1 ? ' x' + r.n : ''}</b><div class="cost">${cost}</div></div>`;
    const b = document.createElement('button'); b.textContent = 'Craft'; b.disabled = !can; b.onclick = () => send({ t: 'craft', id: r.id });
    d.appendChild(b); list.appendChild(d);
  }
  if (!rows.length) list.textContent = 'No recipes found.';
}
const RC = { common: '#cfd3d8', uncommon: '#5fd35f', rare: '#4a9bff', epic: '#c264ff', legendary: '#ffb02e', mythic: '#ff4d8d' };
const rc = (r) => RC[r] || '#fff';

export function toggle(which) {
  const el = $(which); const open = el.classList.contains('hidden');
  closePanels(); if (open) { el.classList.remove('hidden'); if (which === 'inv') renderInv(); else { renderCraft(); } }
}
export function closePanels() { $('inv').classList.add('hidden'); $('craft').classList.add('hidden'); $('tip').classList.add('hidden'); pick = -1; }
$('craftsearch').addEventListener('input', renderCraft);

// ---------- chat
export function chat(sysText, isSys, from, text) {
  const log = $('chatlog'); const d = document.createElement('div');
  if (isSys) { d.className = 'sys'; d.textContent = sysText; } else { const b = document.createElement('b'); b.textContent = from + ': '; d.appendChild(b); d.appendChild(document.createTextNode(text)); }
  log.appendChild(d); while (log.children.length > 40) log.removeChild(log.firstChild);
  d.dataset.t = performance.now();
}
setInterval(() => { // fade old chat lines when chat is closed
  const open = $('chatinput').classList.contains('open');
  for (const d of $('chatlog').children) d.style.display = (open || performance.now() - d.dataset.t < 12000) ? '' : 'none';
}, 500);
export function openChat() { const i = $('chatinput'); i.classList.add('open'); i.focus(); }
export function closeChat() { const i = $('chatinput'); i.classList.remove('open'); i.value = ''; i.blur(); }
$('chatinput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) send({ t: 'chat', m: v }); closeChat(); e.stopPropagation(); }
});

// ---------- hud
export function leaderboard() {
  $('lb').innerHTML = '<b>Top players</b>' + S.lb.map((r) => `<div><span>${esc(r[0])} <small>Lv${r[2]}</small></span><span>${r[1]}</span></div>`).join('');
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export function tick() {
  const me = S.me; if (!me) return;
  $('hpfill').style.width = Math.max(0, me.hp / me.mhp * 100) + '%';
  $('hptext').textContent = `${Math.ceil(me.hp)} / ${me.mhp}`;
  $('xpfill').style.width = (me.xp / me.xpn * 100) + '%';
  $('lvtext').textContent = `Level ${me.lv}`;
  $('info').textContent = `${S.ping}ms · ${S.players.size + 1} near · ${Math.round(me.x)},${Math.round(me.y)}`;
  // boss bar: nearest boss in view
  let boss = null, bd = 1e9;
  for (const m of S.mobs.values()) { const def = S.content.mobs[m.type]; if (!def || !def.b) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; boss = m; } }
  const bb = $('bossbar');
  if (boss) { bb.classList.remove('hidden'); $('bossname').textContent = S.content.mobs[boss.type].n; $('bossfill').style.width = (boss.hp / boss.mhp * 100) + '%'; } else bb.classList.add('hidden');
  drawMinimap();
}
export function dead(by, secs) {
  $('dead').classList.remove('hidden'); $('deadby').textContent = 'Slain by ' + by; deadTimer = secs;
  clearInterval(deadInt); const upd = () => { $('deadtimer').textContent = 'Respawning in ' + Math.max(0, Math.ceil(deadTimer--)) + '...'; }; upd(); deadInt = setInterval(upd, 1000);
}
export function respawn() { clearInterval(deadInt); $('dead').classList.add('hidden'); }

// ---------- minimap
let mmBase = null;
function buildMinimap() {
  const n = 160; mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = n;
  const c = mmBase.getContext('2d'); const step = S.size / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const b = S.content.biomes[S.gen.biomeAt(x * step, y * step)]; c.fillStyle = b.c; c.fillRect(x, y, 1, 1); }
}
function drawMinimap() {
  const c = $('minimap').getContext('2d'), k = 160 / S.size;
  c.drawImage(mmBase, 0, 0);
  for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d && d.b) { c.fillStyle = '#f33'; c.beginPath(); c.arc(m.x * k, m.y * k, 4, 0, 7); c.fill(); } }
  c.fillStyle = '#6cf'; for (const p of S.players.values()) c.fillRect(p.x * k - 1.5, p.y * k - 1.5, 3, 3);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(S.me.x * k, S.me.y * k, 3, 0, 7); c.fill();
}
