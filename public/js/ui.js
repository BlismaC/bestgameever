import { S } from './state.js';
import { send } from './net.js';
import * as A from './assets.js';

const $ = (id) => document.getElementById(id);
let pick = -1, deadTimer = 0, deadInt = null, craftFilter = 'all', craftTimer = null;

export function menuMsg(t) { $('menumsg').textContent = t; $('play').disabled = false; }
export function start() {
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden');
  document.title = S.gameName;
  buildWorldMap(); buildChips(); buildLegend();
  invChanged();
}

// ---------- items
export function icon(id, count, i, sel) {
  const it = S.content.items[id];
  const el = document.createElement('div');
  el.className = 'slot' + (it ? ' r-' + it.r : ' empty') + (sel ? ' sel' : '');
  if (it) {
    el.dataset.id = id;
    const url = A.iconURL(id);
    el.innerHTML = `${url ? `<img src="${url}" style="width:78%;height:78%;object-fit:contain;pointer-events:none">` : `<span>${it.e}</span>`}${count > 1 ? `<span class="n">${count}</span>` : ''}`;
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
  if (it.pl) h += `<div class="d">Select it and click to place · X picks up your own</div>`;
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

// ---------- crafting (stations + categories)
const CATS = [['all', 'All'], ['weapon', 'Weapons'], ['structure', 'Build'], ['consumable', 'Potions & food'], ['other', 'Other']];
function buildChips() {
  const c = $('craftchips'); c.innerHTML = '';
  for (const [id, label] of CATS) { const b = document.createElement('div'); b.className = 'chip' + (id === craftFilter ? ' on' : ''); b.textContent = label; b.onclick = () => { craftFilter = id; buildChips(); renderCraft(); }; c.appendChild(b); }
}
function have(id) { let n = 0; for (const s of S.inv) if (s && s[0] === id) n += s[1]; return n; }
function nearStations() {
  const set = new Set(), me = S.me; if (!me) return set;
  for (const st of S.structs.values()) { const d = S.content.structures[st.type]; if (d && d.p && Math.hypot(st.x - me.x, st.y - me.y) <= S.cfg.craft) set.add(d.p); }
  return set;
}
const RC = { common: '#cfd3d8', uncommon: '#5fd35f', rare: '#4a9bff', epic: '#c264ff', legendary: '#ffb02e', mythic: '#ff4d8d' };
const rc = (r) => RC[r] || '#fff';
function renderCraft() {
  const q = $('craftsearch').value.toLowerCase().trim();
  const near = nearStations();
  const names = [...near].map((p) => Object.values(S.content.structures).find((d) => d.p === p).n);
  $('craftnear').textContent = names.length ? 'Nearby stations: ' + names.join(', ') : 'No crafting station nearby — build a Workbench (30 wood + 10 stone).';
  const list = $('craftlist'); list.innerHTML = '';
  const rows = [];
  for (const r of S.content.recipes) {
    const it = S.content.items[r.o]; if (!it) continue;
    if (q && !it.n.toLowerCase().includes(q)) continue;
    const cat = it.ty === 'weapon' ? 'weapon' : it.ty === 'structure' ? 'structure' : it.ty === 'consumable' ? 'consumable' : 'other';
    if (craftFilter !== 'all' && cat !== craftFilter) continue;
    let mats = true; for (const [k, n] of Object.entries(r.c)) if (have(k) < n) mats = false;
    const stOk = !r.s || near.has(r.s);
    rows.push({ r, it, mats, stOk, can: mats && stOk });
  }
  rows.sort((a, b) => (b.can - a.can) || (b.stOk - a.stOk) || (b.mats - a.mats) || ((a.it.t || 0) - (b.it.t || 0)));
  for (const { r, it, can, stOk } of rows.slice(0, 60)) {
    const d = document.createElement('div'); d.className = 'rec';
    const cost = Object.entries(r.c).map(([k, n]) => { const ci = S.content.items[k]; const h = have(k); return `<span class="${h >= n ? 'yes' : 'no'}" title="${ci.n}">${ci.e}${h}/${n}</span>`; }).join('');
    const sname = r.s ? Object.values(S.content.structures).find((x) => x.p === r.s).n : '';
    const iu = A.iconURL(r.o);
    d.innerHTML = `<div class="ic">${iu ? `<img src="${iu}" style="width:34px;height:34px;object-fit:contain">` : it.e}</div><div class="nm"><b style="color:${rc(it.r)}">${it.n}${r.n > 1 ? ' x' + r.n : ''}</b><div class="cost">${cost}</div>${r.s ? `<div class="need ${stOk ? 'ok' : ''}">${stOk ? '✔' : '✖'} ${sname}</div>` : ''}</div>`;
    const b = document.createElement('button'); b.textContent = 'Craft'; b.disabled = !can; b.onclick = () => send({ t: 'craft', id: r.id });
    d.appendChild(b); list.appendChild(d);
  }
  if (!rows.length) list.textContent = 'No recipes found.';
}
$('craftsearch').addEventListener('input', renderCraft);

export function toggle(which) {
  const el = $(which); const open = el.classList.contains('hidden');
  closePanels();
  if (open) {
    el.classList.remove('hidden');
    if (which === 'inv') renderInv();
    else if (which === 'craft') { renderCraft(); craftTimer = setInterval(renderCraft, 700); }
    else if (which === 'map') drawWorldMap();
  }
}
export function closePanels() { for (const id of ['inv', 'craft', 'map']) $(id).classList.add('hidden'); clearInterval(craftTimer); $('tip').classList.add('hidden'); pick = -1; }

// ---------- chat
export function chat(sysText, isSys, from, text) {
  const log = $('chatlog'); const d = document.createElement('div');
  if (isSys) { d.className = 'sys'; d.textContent = sysText; } else { const b = document.createElement('b'); b.textContent = from + ': '; d.appendChild(b); d.appendChild(document.createTextNode(text)); }
  log.appendChild(d); while (log.children.length > 40) log.removeChild(log.firstChild);
  d.dataset.t = performance.now();
}
setInterval(() => {
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
let biomeAcc = 0, lastMM = 0;
export function tick() {
  const me = S.me; if (!me) return;
  $('hpfill').style.width = Math.max(0, me.hp / me.mhp * 100) + '%';
  $('hptext').textContent = `${Math.ceil(me.hp)} / ${me.mhp}`;
  $('xpfill').style.width = (me.xp / me.xpn * 100) + '%';
  $('lvtext').textContent = `Level ${me.lv}`;
  $('info').textContent = `${S.ping}ms · ${S.players.size + 1} near · ${Math.round(me.x)},${Math.round(me.y)}`;
  const now = performance.now();
  if (now - biomeAcc > 400) {
    biomeAcc = now;
    const b = S.content.biomes[S.gen.biomeAt(me.x, me.y)], z = S.gen.zoneAt(me.x, me.y), lvl = 1 + Math.floor(z * 5);
    const safe = Math.hypot(me.x - S.size / 2, me.y - S.size / 2) < S.cfg.safe;
    $('biome').innerHTML = `<span style="color:${b.c}">■</span> ${b.n}<br><small style="opacity:.75">${safe ? 'Safe zone' : 'Danger ' + lvl + ' / 6'}</small>`;
  }
  let boss = null, bd = 1e9;
  for (const m of S.mobs.values()) { const def = S.content.mobs[m.type]; if (!def || !def.b) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; boss = m; } }
  const bb = $('bossbar');
  if (boss) { bb.classList.remove('hidden'); $('bossname').textContent = S.content.mobs[boss.type].n; $('bossfill').style.width = (boss.hp / boss.mhp * 100) + '%'; } else bb.classList.add('hidden');
  if (now - lastMM > 100) { lastMM = now; drawMinimap(); }
  if (!$('map').classList.contains('hidden')) drawWorldMap();
}
export function dead(by, secs) {
  $('dead').classList.remove('hidden'); $('deadby').textContent = 'Slain by ' + by; deadTimer = secs;
  clearInterval(deadInt); const upd = () => { $('deadtimer').textContent = 'Respawning in ' + Math.max(0, Math.ceil(deadTimer--)) + '...'; }; upd(); deadInt = setInterval(upd, 1000);
}
export function respawn() { clearInterval(deadInt); $('dead').classList.add('hidden'); }

// ---------- world map + minimap (both drawn from one pre-rendered biome image of the whole world)
let worldMap = null; const WM = 384;
function buildWorldMap() {
  worldMap = document.createElement('canvas'); worldMap.width = worldMap.height = WM;
  const c = worldMap.getContext('2d'), step = S.size / WM;
  for (let y = 0; y < WM; y++) for (let x = 0; x < WM; x++) { c.fillStyle = S.content.biomes[S.gen.biomeAt((x + 0.5) * step, (y + 0.5) * step)].c; c.fillRect(x, y, 1, 1); }
}
function buildLegend() { $('maplegend').innerHTML = Object.values(S.content.biomes).map((b) => `<span><i style="background:${b.c}"></i>${b.n}</span>`).join('') + '<span>Danger rises toward the edges</span>'; }
function drawWorldMap() {
  const cv = $('worldmap'), c = cv.getContext('2d'), W = cv.width, k = W / S.size;
  c.imageSmoothingEnabled = true; c.drawImage(worldMap, 0, 0, W, W);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([6, 6]); c.lineWidth = 1.5;
  for (const z of [1 / 3, 2 / 3, 1]) { c.beginPath(); c.arc(W / 2, W / 2, z * S.size * 0.46 * k, 0, 7); c.stroke(); } c.setLineDash([]);
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(W / 2, W / 2, S.cfg.safe * k + 2, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText('SAFE', W / 2 - 12, W / 2 - 8);
  for (const st of S.structs.values()) if (st.owner === S.id) { c.fillStyle = '#ffd23f'; c.fillRect(st.x * k - 1.5, st.y * k - 1.5, 3, 3); }
  for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d && d.b) { c.fillStyle = '#f33'; c.beginPath(); c.arc(m.x * k, m.y * k, 5, 0, 7); c.fill(); } }
  c.fillStyle = '#6cf'; for (const p of S.players.values()) c.fillRect(p.x * k - 2, p.y * k - 2, 4, 4);
  const me = S.me; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.arc(me.x * k, me.y * k, 5, 0, 7); c.fill(); c.stroke();
}
function drawMinimap() {
  const cv = $('minimap'), c = cv.getContext('2d'), N = 160, R = 2600, me = S.me, k = WM / S.size;
  c.fillStyle = '#05070c'; c.fillRect(0, 0, N, N);
  c.imageSmoothingEnabled = true;
  c.drawImage(worldMap, (me.x - R) * k, (me.y - R) * k, 2 * R * k, 2 * R * k, 0, 0, N, N);
  const f = N / (2 * R), X = (x) => (x - me.x) * f + N / 2, Y = (y) => (y - me.y) * f + N / 2;
  c.fillStyle = '#ffd23f'; for (const st of S.structs.values()) if (st.owner === S.id) c.fillRect(X(st.x) - 1, Y(st.y) - 1, 2, 2);
  for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d && d.b) { c.fillStyle = '#f33'; c.beginPath(); c.arc(X(m.x), Y(m.y), 4, 0, 7); c.fill(); } }
  c.fillStyle = '#6cf'; for (const p of S.players.values()) c.fillRect(X(p.x) - 2, Y(p.y) - 2, 4, 4);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(N / 2, N / 2, 3.5, 0, 7); c.fill();
}
