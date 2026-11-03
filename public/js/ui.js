import { S } from './state.js';
import { send } from './net.js';
import * as A from './assets.js';
import { drawHuman } from './look.js';

const $ = (id) => document.getElementById(id);
let pick = -1, deadTimer = 0, deadInt = null, craftFilter = 'all', craftTimer = null, npcTab = 'buy', chestData = null, npcData = null;

export function menuMsg(t) { $('menumsg').textContent = t; $('play').disabled = false; }
export function start() {
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden');
  document.title = S.gameName;
  buildWorldMap(); buildChips(); buildLegend(); roomChanged(); invChanged();
  const ci = A.iconURL('coin'); if (ci) { $('coinimg').src = ci; $('coinimg2').src = ci; }
  $('homebtn').onclick = () => send({ t: 'home' }); $('islandbtn').onclick = () => toggle('home');
  $('trash').onclick = () => { if (pick >= 0) { send({ t: 'trash', i: pick }); pick = -1; renderInv(); } };
}

// ------------------------------------------------------------------ item presentation
const RC = ['#ffffff', '#7bdc6b', '#6ab0ff', '#c264ff', '#ffb02e', '#ff4d8d'];       // rarity colours by index
const RIDX = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
const TIERCOL = { '-2': '#ff6b6b', '-1': '#aaaaaa', 0: '#ffffff', 1: '#7ab8ff', 2: '#7bdc6b', 3: '#ffd23f', 4: '#ff9a3a', 5: '#c264ff', 6: '#ff6aa8', 7: '#ff3a5a' };
export function nameColor(it, mod) {
  const m = mod && S.content.mods[mod];
  if (!it.w && !m) return RC[RIDX[it.r] || 0];
  const idx = Math.max(-2, Math.min(7, (RIDX[it.r] || 0) + (m ? m.t : 0)));
  return TIERCOL[idx] || '#fff';
}
const itemName = (it, mod) => { const m = mod && S.content.mods[mod]; return (m ? m.n + ' ' : '') + it.n; };
const sgn = (v) => (v > 0 ? '+' : '') + v;
function kbLabel(v) { return v <= 0 ? 'No knockback' : v < 60 ? 'Weak knockback' : v < 110 ? 'Average knockback' : v < 170 ? 'Strong knockback' : v < 320 ? 'Very strong knockback' : 'Insane knockback'; }
function coinText(v) { return `${v} coin${v === 1 ? '' : 's'}`; }
export function slotValue(id, mod) { const it = S.content.items[id], m = mod && S.content.mods[mod]; return Math.max(1, Math.round((it.v || 1) * (1 + (m ? m.v / 100 : 0)))); }
export function tipHTML(id, mod, extra) {
  const it = S.content.items[id]; if (!it) return '';
  const m = mod && S.content.mods[mod], col = nameColor(it, mod), L = [];
  L.push(`<div class="t" style="color:${col}">${itemName(it, mod)}</div>`);
  L.push(`<div class="d">${it.r !== 'common' ? it.r + ' ' : ''}${it.ty}${it.t !== undefined && it.ty !== 'weapon' ? ' · tier ' + it.t : ''}</div>`);
  if (it.w) {
    const w = it.w, dmg = Math.round(w.dmg * (1 + (m ? m.d : 0) / 100) * 10) / 10, crit = Math.round((w.crit + (m ? m.c : 0)) * 10) / 10, kb = w.kb * (1 + (m ? m.k : 0) / 100);
    L.push(`<div class="st"><b>${dmg}</b> ${w.rngd ? 'ranged' : 'melee'} damage ${m && m.d ? `<span class="${m.d > 0 ? 'up' : 'dn'}">(${sgn(m.d)}%)</span>` : ''}</div>`);
    L.push(`<div class="st">${crit}% critical strike chance ${m && m.c ? `<span class="up">(+${m.c}%)</span>` : ''}</div>`);
    L.push(`<div class="st">${(1 / w.cd).toFixed(1)} uses per second</div>`);
    if (w.rng) L.push(`<div class="st">Reach: ${w.rng} · ${w.arc >= 140 ? 'very wide' : w.arc >= 100 ? 'wide' : w.arc >= 70 ? 'normal' : 'narrow'} swing</div>`);
    if (w.pk) { const nm = { wave: 'a piercing sword wave', arrow: 'arrows', bolt: 'bolts', orb: 'an exploding orb', magic: 'magic bolts', page: 'magic pages', star: 'throwing stars', fire: 'fireballs', ice: 'ice shards', poison: 'poison globs', bone: 'bones', soul: 'souls', void: 'void bolts', eye: 'eyeballs', gel: 'gel', thorn: 'thorns' }[w.pk] || 'projectiles'; L.push(`<div class="up">Fires ${w.np > 1 ? w.np + ' ' : ''}${nm}${w.beh === 'homing' ? ' that home in on enemies' : w.beh === 'boomerang' ? ' that return to you' : w.beh === 'wave' ? ' in a weaving path' : ''}</div>`); }
    L.push(`<div class="st">${kbLabel(kb)} ${m && m.k ? `<span class="${m.k > 0 ? 'up' : 'dn'}">(${sgn(m.k)}%)</span>` : ''}</div>`);
    if (w.tool) L.push(`<div class="up">${w.tool === 'axe' ? 'Chops trees' : 'Mines rock and ore'} (tier ${it.t})</div>`);
    for (const [k, v] of w.fx || []) L.push(`<div class="up">${k === 'burn' ? `Sets enemies on fire (${v}/s)` : k === 'poison' ? `Poisons enemies (${v}/s)` : k === 'slow' ? 'Slows enemies' : `Steals ${Math.round(v * 100)}% of damage as life`}</div>`);
    if (m) L.push(`<div class="d">Modifier: ${m.n} (${sgn(m.d || 0)}% dmg, ${sgn(m.c || 0)}% crit, ${sgn(m.k || 0)}% knockback)</div>`);
  }
  if (it.ar) {
    const set = S.content.sets[it.ar.set], have = [S.equip[0], S.equip[1], S.equip[2]].filter((id) => id && S.content.items[id] && S.content.items[id].ar && S.content.items[id].ar.set === it.ar.set).length;
    L.push(`<div class="st"><b>${it.ar.def}</b> defense · ${it.ar.slot}</div><div class="gold">Set: ${set.n} (${have}/3 worn)</div><div class="${have === 3 ? 'up' : 'd'}">Set bonus — ${set.b.name}: ${set.b.desc}</div><div class="d">Double-click or right-click to wear.</div>`);
  }
  if (it.mt) { const m = S.content.mounts[it.mt]; L.push(`<div class="up">${m.f ? 'Flying mount: soars over trees, rocks and lakes (no drowning)' : 'Ground mount'} · ×${m.s} speed</div><div class="d">Use: F or right-click to mount / dismount.</div>`); }
  if (it.pa) L.push(`<div class="up">Pal: follows you and auto-mines ore &amp; rock</div><div class="d">Use to call / dismiss. Tier ${S.content.pals[it.pa].t} ore.</div>`);
  if (it.hl) L.push(`<div class="up">Restores ${it.hl} life</div><div class="d">Potion sickness: ${Math.round(Math.max(2, Math.min(40, it.hl * 0.32)))}s before the next healing item</div>`);
  if (it.bf) for (const b of it.bf) L.push(`<div class="up">Grants ${S.content.buffs[b.id].n} (${b.dur}s)</div><div class="d">${S.content.buffs[b.id].d}</div>`);
  if (it.d) L.push(`<div class="d">${it.d}</div>`);
  if (it.u) L.push(`<div class="d">Use: F or right-click</div>`);
  if (it.pl) L.push(`<div class="d">Select it and left-click to place · X picks up</div>`);
  if (it.ty !== 'currency') L.push(`<div class="gold">Value: ${coinText(slotValue(id, mod))}</div>`);
  if (extra) L.push(extra);
  return L.join('');
}
function attachTip(el, extraFn) {
  el.addEventListener('mouseenter', () => { const id = el.dataset.id; if (!id) return; const t = $('tip'); t.innerHTML = tipHTML(id, el.dataset.mod || null, extraFn ? extraFn() : ''); t.classList.remove('hidden'); });
  el.addEventListener('mousemove', (e) => { const t = $('tip'); t.style.left = Math.min(innerWidth - 290, e.clientX + 14) + 'px'; t.style.top = Math.min(innerHeight - t.offsetHeight - 6, e.clientY + 14) + 'px'; });
  el.addEventListener('mouseleave', () => $('tip').classList.add('hidden'));
}
export function icon(id, count, i, sel, mod) {
  const it = S.content.items[id], el = document.createElement('div');
  el.className = 'slot' + (sel ? ' sel' : '');
  if (it) {
    el.dataset.id = id; if (mod) el.dataset.mod = mod;
    const url = A.iconURL(id);
    el.innerHTML = `${url ? `<img src="${url}">` : `<span>${it.e}</span>`}${count > 1 ? `<span class="n">${count}</span>` : ''}`;
    const col = nameColor(it, mod); el.style.background = `linear-gradient(135deg,${it.c}44,#0a103099)`;
    if (mod || (it.r && it.r !== 'common')) { el.style.borderColor = col; el.style.boxShadow = `inset 0 0 8px ${col}77`; }
  }
  if (i !== undefined && i < 9) el.insertAdjacentHTML('beforeend', `<span class="k">${i + 1}</span>`);
  return el;
}

// ------------------------------------------------------------------ hotbar + inventory
let hbEls = [];
export function invChanged() {
  const hb = $('hotbar'); hb.innerHTML = ''; hbEls = [];
  for (let i = 0; i < 9; i++) {
    const s = S.inv[i]; const el = icon(s ? s[0] : null, s ? s[1] : 0, i, i === S.sel, s ? s[2] : null);
    attachTip(el); el.onclick = () => { S.sel = i; send({ t: 'sel', i }); }; hb.appendChild(el); hbEls.push(el);
  }
  coinsChanged();
  if (!$('inv').classList.contains('hidden')) renderInv();
  if (!$('craft').classList.contains('hidden')) renderCraft();
  if (chestData) renderChest(); if (npcData) renderNpc();
}
export function coinsChanged() { $('coinn').textContent = S.coins; $('invcoins').textContent = S.coins; if (npcData) renderNpc(); }
function renderInv() {
  const g = $('invgrid'); g.innerHTML = '';
  for (let i = 0; i < S.cfg.invSize; i++) {
    const s = S.inv[i]; const el = icon(s ? s[0] : null, s ? s[1] : 0, i, false, s ? s[2] : null);
    if (i === pick) el.classList.add('pick'); attachTip(el);
    el.onclick = () => { if (pick < 0) { if (s) pick = i; } else { if (pick !== i) send({ t: 'swap', a: pick, b: i }); pick = -1; } renderInv(); };
    const isArmor = s && S.content.items[s[0]].ar;
    el.ondblclick = () => { if (isArmor) send({ t: 'equip', i }); };
    el.oncontextmenu = (e) => { e.preventDefault(); if (isArmor && !e.shiftKey) send({ t: 'equip', i }); else send({ t: 'drop', i }); };
    g.appendChild(el);
  }
  renderArmor();
  const c = $('invprev'), g2 = c.getContext('2d'); g2.clearRect(0, 0, c.width, c.height); g2.imageSmoothingEnabled = false;
  drawHuman(g2, { x: 60, y: 136, look: S.look, dir: 1, aim: 0.5, u: 4.2, phase: 0, move: 0, armor: armorLooks(S.equip) });
}
function armorLooks(eq) {
  const it = (id) => (id ? S.content.items[id] : null), L = (x) => (x && x.ar ? x.ar.look : null), h = L(it(eq[0])), c = L(it(eq[1])), l = L(it(eq[2]));
  return { h: h ? { pri: h.pri, sec: h.sec, trim: h.trim, helm: h.helm, glow: h.glow } : null, c: c ? { pri: c.pri, sec: c.sec, trim: c.trim, chest: c.chest, cape: c.cape, wings: c.wings, glow: c.glow } : null, l: l ? { pri: l.pri, sec: l.sec, trim: l.trim } : null };
}
function renderArmor() {
  const box = $('armor'); if (!box) return; box.innerHTML = '';
  ['helmet', 'chest', 'legs'].forEach((slot, i) => { const id = S.equip[i]; let el; if (id) { el = icon(id, 1, undefined, false, null); attachTip(el); el.onclick = () => send({ t: 'unequip', slot }); } else { el = document.createElement('div'); el.className = 'aslot'; el.textContent = slot === 'helmet' ? 'Helmet' : slot === 'chest' ? 'Chest' : 'Legs'; } box.appendChild(el); });
  const ar = S.ar; $('armorinfo').innerHTML = ar ? `<b>Defense ${ar.def}</b>${ar.set ? `<br>Set: ${ar.set} ✔` : ''}${ar.dmg ? `<br>+${ar.dmg}% damage` : ''}${ar.crit ? ` · +${ar.crit}% crit` : ''}${ar.speed ? `<br>+${Math.round(ar.speed * 100)}% speed` : ''}${ar.regen ? ` · +${ar.regen} regen` : ''}${ar.lifesteal ? `<br>${Math.round(ar.lifesteal * 100)}% lifesteal` : ''}${ar.fireRes ? '<br>Fire immune' : ''}` : '';
}

// ------------------------------------------------------------------ crafting: only what you can make right now
const CATS = [['all', 'All'], ['weapon', 'Weapons'], ['structure', 'Build'], ['consumable', 'Potions & food'], ['other', 'Other']];
function buildChips() { const c = $('craftchips'); c.innerHTML = ''; for (const [id, label] of CATS) { const b = document.createElement('div'); b.className = 'chip' + (id === craftFilter ? ' on' : ''); b.textContent = label; b.onclick = () => { craftFilter = id; buildChips(); renderCraft(); }; c.appendChild(b); } }
const have = (id) => { let n = 0; for (const s of S.inv) if (s && s[0] === id) n += s[1]; return n; };
function nearStations() {
  const set = new Set(), me = S.me; if (!me) return set;
  for (const st of S.structs.values()) { const d = S.content.structures[st.type]; if (d && d.p && Math.hypot(st.x - me.x, st.y - me.y) <= S.cfg.craft) set.add(d.p); }
  return set;
}
const stationName = (p) => Object.values(S.content.structures).find((d) => d.p === p).n;
function renderCraft() {
  const q = $('craftsearch').value.toLowerCase().trim(), near = nearStations();
  $('craftnear').innerHTML = S.room.kind === 'island' ? (near.size ? 'Nearby stations: ' + [...near].map(stationName).join(', ') : 'No station nearby. Craft a Workbench by hand, then place it here.') : '<span class="warn">Crafting stations only work on your private island — press H to go home.</span>';
  const list = $('craftlist'); list.innerHTML = '';
  const rows = [];
  for (const r of S.content.recipes) {
    const it = S.content.items[r.o]; if (!it) continue;
    let mats = true; for (const [k, n] of Object.entries(r.c)) if (have(k) < n) mats = false;
    if (!mats) continue;                                       // <- only items you can currently afford
    if (q && !it.n.toLowerCase().includes(q)) continue;
    const cat = it.ty === 'weapon' ? 'weapon' : it.ty === 'structure' ? 'structure' : it.ty === 'consumable' ? 'consumable' : 'other';
    if (craftFilter !== 'all' && cat !== craftFilter) continue;
    rows.push({ r, it, stOk: !r.s || near.has(r.s) });
  }
  rows.sort((a, b) => (b.stOk - a.stOk) || ((b.it.t || 0) - (a.it.t || 0)) || a.it.n.localeCompare(b.it.n));
  for (const { r, it, stOk } of rows.slice(0, 400)) {
    const d = document.createElement('div'); d.className = 'rec';
    const cost = Object.entries(r.c).map(([k, n]) => { const ci = S.content.items[k], u = A.iconURL(k); return `<span title="${ci.n}">${u ? `<img src="${u}">` : ci.e}${n}</span>`; }).join('');
    const iu = A.iconURL(r.o);
    d.innerHTML = `<div class="ic" data-id="${r.o}">${iu ? `<img src="${iu}">` : it.e}</div><div class="nm"><b style="color:${nameColor(it)}">${it.n}${r.n > 1 ? ' x' + r.n : ''}</b><div class="cost">${cost}</div>${r.s ? `<div class="need ${stOk ? 'ok' : ''}">${stOk ? '✔' : '✖'} ${stationName(r.s)}</div>` : ''}</div>`;
    attachTip(d.querySelector('.ic'), () => `<div class="d">Crafted items roll a random modifier.</div>`);
    const b = document.createElement('button'); b.className = 'btn small good'; b.textContent = 'Craft'; b.disabled = !stOk; b.onclick = () => send({ t: 'craft', id: r.id });
    d.appendChild(b); list.appendChild(d);
  }
  if (!rows.length) list.innerHTML = '<div class="note">Nothing craftable with what you carry. Gather more materials!</div>';
}
$('craftsearch').addEventListener('input', renderCraft);

// ------------------------------------------------------------------ panels
export function toggle(which) {
  const el = $(which); const open = el.classList.contains('hidden');
  closePanels();
  if (open) {
    el.classList.remove('hidden');
    if (which === 'inv') renderInv(); else if (which === 'craft') { renderCraft(); craftTimer = setInterval(renderCraft, 800); } else if (which === 'map') drawWorldMap(); else if (which === 'home') renderHome();
  }
}
export function closePanels() { for (const id of ['inv', 'craft', 'map', 'home', 'chest', 'npc']) $(id).classList.add('hidden'); clearInterval(craftTimer); $('tip').classList.add('hidden'); pick = -1; chestData = null; npcData = null; }

// ------------------------------------------------------------------ island / home
export function roomChanged() {
  const on = S.room.kind === 'island';
  $('homebtn').innerHTML = on ? '↩ Return <kbd>H</kbd>' : '🏠 Home <kbd>H</kbd>';
  closeSpecial(); if (!$('home').classList.contains('hidden')) renderHome();
}
function closeSpecial() { for (const id of ['chest', 'npc']) $(id).classList.add('hidden'); chestData = null; npcData = null; }
function renderHome() {
  const R = S.room, el = $('home'); let h = '';
  if (R.kind === 'island') {
    h += `<h3>${R.you === 'owner' ? 'Your Island' : `${esc(R.ownerName || 'Someone')}'s Island`} <small>peaceful · nothing can hurt you here</small></h3>`;
    h += `<button class="btn" id="hm-ret">↩ Return to the world</button>`;
    if (R.you === 'owner') {
      h += `<div class="sec"><b>Invite a friend</b><div class="grow"><input type="text" id="hm-name" placeholder="Exact player name (must be online)" style="flex:1"><button class="btn small" id="hm-inv">Invite</button></div>`;
      h += `<div class="note">Guests can walk around. You decide whether they may open your chests or build.</div></div>`;
      h += `<div class="sec"><b>Guests</b>`;
      if (!R.guests.length) h += `<div class="note">Nobody has joined yet.</div>`;
      for (const g of R.guests) h += `<div class="grow"><span class="nm">${esc(g.name)}</span><label><input type="checkbox" data-g="${g.id}" data-p="chests" ${g.chests ? 'checked' : ''}>Chests</label><label><input type="checkbox" data-g="${g.id}" data-p="build" ${g.build ? 'checked' : ''}>Build</label><button class="btn small bad" data-kick="${g.id}">Remove</button></div>`;
      h += `</div>`;
    }
  } else {
    h += `<h3>Island <small>your private home</small></h3><button class="btn good" id="hm-go">🏠 Teleport home (${S.cfg.tp}s)</button><div class="note">Stations (Workbench, Forge...) and chests can only be placed on your island, so crafting happens at home.</div>`;
  }
  h += `<div class="sec"><b>Islands you can visit</b>`;
  if (!R.visits.length) h += `<div class="note">Accept an invitation from a friend and their island appears here.</div>`;
  for (const v of R.visits) h += `<div class="grow"><span class="nm">${esc(v.name)}'s island</span><button class="btn small" data-visit="${v.owner}">Visit</button></div>`;
  h += `</div>`;
  if (S.persistent === 'file') h += `<div class="note warn">⚠ This server stores data in temporary files. Set DATABASE_URL (free Postgres) so islands survive restarts.</div>`;
  el.innerHTML = h;
  const q = (s) => el.querySelector(s);
  if (q('#hm-ret')) q('#hm-ret').onclick = () => send({ t: 'home' });
  if (q('#hm-go')) q('#hm-go').onclick = () => { send({ t: 'home' }); closePanels(); };
  if (q('#hm-inv')) q('#hm-inv').onclick = () => { const v = q('#hm-name').value.trim(); if (v) send({ t: 'invite', name: v }); };
  el.querySelectorAll('[data-p]').forEach((c) => { c.onchange = () => { const g = R.guests.find((x) => x.id === c.dataset.g); g[c.dataset.p] = c.checked; send({ t: 'perm', gid: g.id, chests: g.chests, build: g.build }); }; });
  el.querySelectorAll('[data-kick]').forEach((b) => { b.onclick = () => send({ t: 'kick', gid: b.dataset.kick }); });
  el.querySelectorAll('[data-visit]').forEach((b) => { b.onclick = () => { send({ t: 'visit', owner: b.dataset.visit }); closePanels(); }; });
}
export function inviteToast(m) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>🏝 <b>${esc(m.from)}</b> invited you to their island</span>`;
  const a = document.createElement('button'); a.className = 'btn small good'; a.textContent = 'Accept'; a.onclick = () => { send({ t: 'accept', owner: m.owner }); t.remove(); };
  const d = document.createElement('button'); d.className = 'btn small bad'; d.textContent = 'Decline'; d.onclick = () => t.remove();
  t.append(a, d); $('toasts').appendChild(t); setTimeout(() => t.remove(), 60000);
}
export function banner(text, color) { const b = $('banner'); b.textContent = text; b.style.color = color || '#fff'; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; setTimeout(() => b.classList.add('hidden'), 4600); }

// ------------------------------------------------------------------ chests
export function chestOpen(m) { chestData = m; closeOthers('chest'); $('chest').classList.remove('hidden'); renderChest(); }
export function chestClose() { chestData = null; $('chest').classList.add('hidden'); }
function closeOthers(keep) { for (const id of ['inv', 'craft', 'map', 'home', 'chest', 'npc']) if (id !== keep) $(id).classList.add('hidden'); clearInterval(craftTimer); if (keep !== 'npc') npcData = null; if (keep !== 'chest') chestData = null; }
function renderChest() {
  if (!chestData) return; const el = $('chest'); el.innerHTML = `<h3>Chest <small>click an item to move it</small></h3><div class="cgrid" id="cg"></div><h3 style="margin-top:6px">Inventory</h3><div class="cgrid inv" id="ci"></div>`;
  chestData.slots.forEach((s, i) => { const e = icon(s ? s[0] : null, s ? s[1] : 0, undefined, false, s ? s[2] : null); attachTip(e); e.onclick = () => s && send({ t: 'chest_take', id: chestData.id, i }); el.querySelector('#cg').appendChild(e); });
  for (let i = 0; i < S.cfg.invSize; i++) { const s = S.inv[i]; const e = icon(s ? s[0] : null, s ? s[1] : 0, i, false, s ? s[2] : null); attachTip(e); e.onclick = () => s && send({ t: 'chest_put', id: chestData.id, i }); el.querySelector('#ci').appendChild(e); }
}

// ------------------------------------------------------------------ NPCs: shop / reforger / nurse / guide
export function npcOpen(m) { npcData = m; closeOthers('npc'); $('npc').classList.remove('hidden'); S.coins = m.coins; renderNpc(); }
export function reforged() { renderNpc(); }
function renderNpc() {
  if (!npcData) return; const m = npcData, el = $('npc'); let h = `<h3>${esc(m.name)} <small>🪙 ${S.coins}</small></h3><div class="npctext">“${esc(m.text)}”</div>`;
  if (m.kind === 'shop') {
    h += `<div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn small ${npcTab === 'buy' ? 'good' : ''}" data-tab="buy">Buy</button><button class="btn small ${npcTab === 'sell' ? 'good' : ''}" data-tab="sell">Sell</button></div><div id="npclist"></div>`;
  } else if (m.kind === 'reforge') h += `<div class="note">Pick a weapon. Reforging rerolls its modifier (cost depends on its value).</div><div id="npclist"></div>`;
  else if (m.kind === 'nurse') h += `<button class="btn good" id="nurse">Heal me — ${m.cost} coins</button>`;
  else if (m.kind === 'guide') h += `<button class="btn" id="tip2">Another tip</button><div class="sec" id="gh"></div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { npcTab = b.dataset.tab; renderNpc(); }; });
  const list = el.querySelector('#npclist');
  if (m.kind === 'shop' && npcTab === 'buy') for (const [id, price] of m.shop) {
    const it = S.content.items[id], row = document.createElement('div'); row.className = 'shoprow';
    const ic = icon(id, 1); ic.style.width = ic.style.height = '40px'; attachTip(ic); row.appendChild(ic);
    row.insertAdjacentHTML('beforeend', `<span class="nm" style="color:${nameColor(it)}">${it.n}</span><span class="price">${price} 🪙</span>`);
    const b = document.createElement('button'); b.className = 'btn small good'; b.textContent = 'Buy'; b.disabled = S.coins < price; b.onclick = () => send({ t: 'buy', npc: m.id, item: id, n: 1 }); row.appendChild(b); list.appendChild(row);
  }
  if ((m.kind === 'shop' && npcTab === 'sell') || m.kind === 'reforge') S.inv.forEach((s, i) => {
    if (!s || s[0] === 'coin') return; const it = S.content.items[s[0]]; if (m.kind === 'reforge' && !it.w) return;
    const row = document.createElement('div'); row.className = 'shoprow'; const ic = icon(s[0], s[1], undefined, false, s[2]); ic.style.width = ic.style.height = '40px'; attachTip(ic); row.appendChild(ic);
    const v = slotValue(s[0], s[2]); const price = m.kind === 'reforge' ? Math.max(25, Math.round(v * 0.5)) : Math.max(1, Math.round(v * 0.35)) * s[1];
    row.insertAdjacentHTML('beforeend', `<span class="nm" style="color:${nameColor(it, s[2])}">${itemName(it, s[2])}</span><span class="price">${price} 🪙</span>`);
    const b = document.createElement('button'); b.className = 'btn small ' + (m.kind === 'reforge' ? '' : 'good'); b.textContent = m.kind === 'reforge' ? 'Reforge' : 'Sell'; b.disabled = m.kind === 'reforge' && S.coins < price;
    b.onclick = () => send({ t: m.kind === 'reforge' ? 'reforge' : 'sell', i }); row.appendChild(b); list.appendChild(row);
  });
  if (list && !list.children.length) list.innerHTML = '<div class="note">Nothing here.</div>';
  if (m.kind === 'guide') renderGuideHelper(el.querySelector('#gh'));
  if (el.querySelector('#nurse')) el.querySelector('#nurse').onclick = () => send({ t: 'nurse' });
  if (el.querySelector('#tip2')) el.querySelector('#tip2').onclick = () => send({ t: 'npc', id: m.id });
}

// ---- the Guide: pick an item you carry -> where it comes from, what you can craft with it, and WHERE to craft it
let guideItem = null;
function renderGuideHelper(box) {
  if (!box) return;
  box.innerHTML = '<b>What is this item for?</b><div class="note">Pick something from your inventory and I will tell you how to get more of it and what you can make.</div><div class="gsel" id="gsel"></div><div class="gout" id="gout"></div>';
  const ids = [...new Set(S.inv.filter((x) => x && x[0] !== 'coin').map((x) => x[0]))];
  for (const id of ids) { const e = icon(id, 0); e.style.width = e.style.height = '42px'; attachTip(e); if (id === guideItem) e.classList.add('sel'); e.onclick = () => { guideItem = id; renderGuideHelper(box); }; box.querySelector('#gsel').appendChild(e); }
  if (!guideItem) return;
  const it = S.content.items[guideItem], out = box.querySelector('#gout');
  let h = `<h3 style="margin-top:6px;color:${nameColor(it)}">${it.n}</h3>`;
  const src = S.content.src[guideItem] || []; h += `<div class="gsrc"><b>How to get it</b>${src.length ? src.map((x) => `<div>${esc(x)}</div>`).join('') : '<div>Rare find — look around!</div>'}</div>`;
  out.innerHTML = h;
  const uses = S.content.recipes.filter((r) => r.c[guideItem]);
  if (!uses.length) { out.insertAdjacentHTML('beforeend', '<div class="note">Nothing can be crafted with it directly.</div>'); return; }
  out.insertAdjacentHTML('beforeend', `<b>You can craft with it (${uses.length})</b>`);
  for (const r of uses.slice(0, 14)) {
    const o = S.content.items[r.o], can = Object.entries(r.c).every(([k, n]) => have(k) >= n), row = document.createElement('div'); row.className = 'rec';
    const cost = Object.entries(r.c).map(([k, n]) => { const ci = S.content.items[k], u = A.iconURL(k); return `<span title="${ci.n}">${u ? `<img src="${u}">` : ci.e}${have(k)}/${n}</span>`; }).join('');
    const where = r.s ? `Craft at the <b>${stationName(r.s)}</b> — stations are built on your island (press H)` : 'Craft by hand — open the crafting menu (C)';
    const iu = A.iconURL(r.o);
    row.innerHTML = `<div class="ic">${iu ? `<img src="${iu}">` : o.e}</div><div class="nm"><b style="color:${nameColor(o)}">${o.n}</b><div class="cost">${cost}</div><div class="need ${can ? 'ok' : ''}">${can ? '✔ you have everything' : '✖ missing materials'} · ${where}</div></div>`;
    out.appendChild(row);
  }
}

// ------------------------------------------------------------------ chat
export function chat(sysText, isSys, from, text) {
  const log = $('chatlog'); const d = document.createElement('div');
  if (isSys) { d.className = 'sys'; d.textContent = sysText; } else { const b = document.createElement('b'); b.textContent = from + ': '; d.appendChild(b); d.appendChild(document.createTextNode(text)); }
  log.appendChild(d); while (log.children.length > 40) log.removeChild(log.firstChild); d.dataset.t = performance.now();
}
setInterval(() => { const open = $('chatinput').classList.contains('open'); for (const d of $('chatlog').children) d.style.display = (open || performance.now() - d.dataset.t < 12000) ? '' : 'none'; }, 500);
export function openChat() { const i = $('chatinput'); i.classList.add('open'); i.focus(); }
export function closeChat() { const i = $('chatinput'); i.classList.remove('open'); i.value = ''; i.blur(); }
$('chatinput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) send({ t: 'chat', m: v }); closeChat(); e.stopPropagation(); } });

// ------------------------------------------------------------------ HUD
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function leaderboard() { $('lb').innerHTML = '<b>Top players</b>' + S.lb.map((r) => `<div><span>${esc(r[0])} <small>Lv${r[2]}</small></span><span>${r[1]}</span></div>`).join(''); }
let biomeAcc = 0, lastMM = 0, lastBuffKey = '', buffEls = new Map();
export function tick() {
  const me = S.me; if (!me) return;
  $('hpfill').style.width = Math.max(0, me.hp / me.mhp * 100) + '%'; $('hptext').textContent = `${Math.ceil(me.hp)} / ${me.mhp}`;
  $('xpfill').style.width = (me.xp / me.xpn * 100) + '%'; $('lvtext').textContent = `Level ${me.lv}`;
  $('info').textContent = `${S.ping}ms · ${S.players.size + 1} near`;
  const now = performance.now();
  // buffs
  const bb2 = $('breathbar'); if (S.breath < 9.8) { bb2.classList.remove('hidden'); $('breathfill').style.width = (S.breath / 10 * 100) + '%'; } else bb2.classList.add('hidden');
  const key = S.buffs.map((b) => b[0]).join(',') + '|' + S.mount + '|' + S.pal;
  if (key !== lastBuffKey) {
    lastBuffKey = key; const c = $('buffs'); c.innerHTML = ''; buffEls = new Map();
    for (const [id] of S.buffs) {
      const def = S.content.buffs[id], img = A.get('buffs/' + id), el = document.createElement('div'); el.className = 'buff' + (def && !def.g ? ' bad' : '');
      el.innerHTML = `${img ? `<img src="${img.src}">` : '✨'}<span></span>`;
      el.addEventListener('mouseenter', () => { const t = $('tip'); t.innerHTML = `<div class="t" style="color:${def.g ? '#7dff8a' : '#ff8a8a'}">${def.n}</div><div class="d">${def.d}</div>`; t.classList.remove('hidden'); });
      el.addEventListener('mousemove', (e) => { const t = $('tip'); t.style.left = e.clientX + 12 + 'px'; t.style.top = e.clientY - 70 + 'px'; });
      el.addEventListener('mouseleave', () => $('tip').classList.add('hidden')); c.appendChild(el); buffEls.set(id, el);
    }
    for (const [kind, id] of [['mount', S.mount], ['pal', S.pal]]) if (id) { const el = document.createElement('div'); el.className = 'buff'; const iu = A.iconURL((kind === 'mount' ? 'mount_' : 'pal_') + id), nm = (kind === 'mount' ? S.content.mounts : S.content.pals)[id].n; el.innerHTML = `<img src="${iu}"><span></span>`; el.addEventListener('mouseenter', () => { const t = $('tip'); t.innerHTML = `<div class="t" style="color:#7dff8a">${nm}</div><div class="d">${kind === 'mount' ? 'Mounted — use the item again to dismount' : 'Your Pal is auto-mining nearby ore'}</div>`; t.classList.remove('hidden'); }); el.addEventListener('mousemove', (e) => { const t = $('tip'); t.style.left = e.clientX + 12 + 'px'; t.style.top = e.clientY - 70 + 'px'; }); el.addEventListener('mouseleave', () => $('tip').classList.add('hidden')); c.appendChild(el); }
  }
  for (const [id, left] of S.buffs) { const el = buffEls.get(id); if (el) el.lastChild.textContent = left >= 60 ? Math.ceil(left / 60) + 'm' : left + 's'; }
  // potion sickness overlay on healing items
  hbEls.forEach((el, i) => { const s = S.inv[i], it = s && S.content.items[s[0]]; let cd = el.querySelector('.cd'); if (it && it.hl && S.healCd > 0) { if (!cd) { cd = document.createElement('div'); cd.className = 'cd'; el.appendChild(cd); } cd.textContent = Math.ceil(S.healCd); } else if (cd) cd.remove(); });
  if (now - biomeAcc > 400) {
    biomeAcc = now;
    if (S.room.kind === 'island') $('biome').innerHTML = `<span style="color:#7bdc6b">■</span> Private Island<br><small style="opacity:.75">Peaceful</small>`;
    else { const b = S.content.biomes[S.gen.biomeAt(me.x, me.y)], z = S.gen.zoneAt(me.x, me.y), lvl = 1 + Math.floor(z * 5), safe = Math.hypot(me.x - S.size / 2, me.y - S.size / 2) < S.cfg.safe; $('biome').innerHTML = `<span style="color:${b.c}">■</span> ${b.n}<br><small style="opacity:.75">${safe ? 'Safe zone' : 'Danger ' + lvl + ' / 6'}</small><br><small style="opacity:.6">${Math.round(me.x)}, ${Math.round(me.y)}</small>`; }
    const hr = (S.dayTime * 24 + 6) % 24, night = Math.cos(2 * Math.PI * (S.dayTime - 0.25)) < -0.2;
    $('clocktext').textContent = `${String(Math.floor(hr)).padStart(2, '0')}:${String(Math.floor((hr % 1) * 60)).padStart(2, '0')}`; $('clockicon').textContent = night ? '🌙' : '☀';
  }
  // event / boss bars
  const eb = $('evtbar'); if (S.evt) { eb.classList.remove('hidden'); $('evtname').textContent = `${S.evt[0]} — ${S.evt[1]} / ${S.evt[2]}  (${S.evt[3]}s)`; $('evtname').style.color = S.evt[4]; $('evtfill').style.width = Math.min(100, S.evt[1] / S.evt[2] * 100) + '%'; } else eb.classList.add('hidden');
  let boss = null, bd = 1e9;
  for (const m of S.mobs.values()) { const def = S.content.mobs[m.type]; if (!def || !def.b) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; boss = m; } }
  const bb = $('bossbar'); if (boss) { bb.classList.remove('hidden'); $('bossname').textContent = S.content.mobs[boss.type].n; $('bossfill').style.width = (boss.hp / boss.mhp * 100) + '%'; } else bb.classList.add('hidden');
  // teleport channel
  const tb = $('tpbar'); if (S.tp > now) { tb.classList.remove('hidden'); $('tpfill').style.width = (100 - (S.tp - now) / (S.tpTotal * 1000) * 100) + '%'; } else tb.classList.add('hidden');
  // auto-close chest / npc when walking away
  if (chestData) { const st = S.structs.get(chestData.id); if (!st || Math.hypot(st.x - me.x, st.y - me.y) > 320) chestClose(); }
  if (npcData) { const n = S.npcs.find((x) => x.id === npcData.id); if (!n || Math.hypot(n.x - me.x, n.y - me.y) > 300) { npcData = null; $('npc').classList.add('hidden'); } }
  if (now - lastMM > 100) { lastMM = now; drawMinimap(); }
  if (!$('map').classList.contains('hidden')) drawWorldMap();
}
export function dead(by, secs) { $('dead').classList.remove('hidden'); $('deadby').textContent = 'Slain by ' + by; deadTimer = secs; clearInterval(deadInt); const upd = () => { $('deadtimer').textContent = 'Respawning in ' + Math.max(0, Math.ceil(deadTimer--)) + '...'; }; upd(); deadInt = setInterval(upd, 1000); }
export function respawn() { clearInterval(deadInt); $('dead').classList.add('hidden'); }

// ------------------------------------------------------------------ world map + minimap
let worldMap = null; const WM = 384;
function buildWorldMap() {
  worldMap = document.createElement('canvas'); worldMap.width = worldMap.height = WM;
  const c = worldMap.getContext('2d'), step = S.size / WM;
  for (let y = 0; y < WM; y++) for (let x = 0; x < WM; x++) { c.fillStyle = S.content.biomes[S.gen.biomeAt((x + 0.5) * step, (y + 0.5) * step)].c; c.fillRect(x, y, 1, 1); }
}
function buildLegend() { $('maplegend').innerHTML = Object.values(S.content.biomes).map((b) => `<span><i style="background:${b.c}"></i>${b.n}</span>`).join('') + '<span>Danger rises toward the edges</span>'; }
function drawWorldMap() {
  const cv = $('worldmap'), c = cv.getContext('2d'), W = cv.width, k = W / S.size;
  c.imageSmoothingEnabled = false; c.drawImage(worldMap, 0, 0, W, W);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([6, 6]); c.lineWidth = 1.5;
  for (const z of [1 / 3, 2 / 3, 1]) { c.beginPath(); c.arc(W / 2, W / 2, z * S.size * 0.46 * k, 0, 7); c.stroke(); } c.setLineDash([]);
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(W / 2, W / 2, S.cfg.safe * k + 2, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText('TOWN', W / 2 - 14, W / 2 - 8);
  const pos = S.room.kind === 'island' ? (S.returnPos || { x: S.size / 2, y: S.size / 2 }) : S.me;
  if (S.room.kind !== 'island') { for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d && d.b) { c.fillStyle = '#f33'; c.beginPath(); c.arc(m.x * k, m.y * k, 5, 0, 7); c.fill(); } } c.fillStyle = '#6cf'; for (const p of S.players.values()) c.fillRect(p.x * k - 2, p.y * k - 2, 4, 4); }
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.arc(pos.x * k, pos.y * k, 5, 0, 7); c.fill(); c.stroke();
}
function drawMinimap() {
  const cv = $('minimap'), c = cv.getContext('2d'), N = 160, R = 2600, me = S.me, k = WM / S.size;
  c.imageSmoothingEnabled = false; c.fillStyle = '#05070c'; c.fillRect(0, 0, N, N);
  if (S.room.kind === 'island') { c.fillStyle = '#2f78b8'; c.fillRect(0, 0, N, N); const f = N / (S.cfg.isl * 1.05), IC = S.cfg.isl / 2; c.fillStyle = '#ead9a0'; c.beginPath(); c.arc(N / 2, N / 2, (S.cfg.islR + 34) * f, 0, 7); c.fill(); c.fillStyle = '#6dbb4a'; c.beginPath(); c.arc(N / 2, N / 2, S.cfg.islR * f, 0, 7); c.fill(); c.fillStyle = '#ffd23f'; for (const st of S.structs.values()) c.fillRect((st.x - IC) * f + N / 2 - 1, (st.y - IC) * f + N / 2 - 1, 3, 3); c.fillStyle = '#fff'; c.beginPath(); c.arc((me.x - IC) * f + N / 2, (me.y - IC) * f + N / 2, 3.5, 0, 7); c.fill(); return; }
  c.drawImage(worldMap, (me.x - R) * k, (me.y - R) * k, 2 * R * k, 2 * R * k, 0, 0, N, N);
  const f = N / (2 * R), X = (x) => (x - me.x) * f + N / 2, Y = (y) => (y - me.y) * f + N / 2;
  c.fillStyle = '#ffd23f'; for (const st of S.structs.values()) if (st.owner === S.acc) c.fillRect(X(st.x) - 1, Y(st.y) - 1, 2, 2);
  c.fillStyle = '#ffe9a8'; for (const n of S.npcs) c.fillRect(X(n.x) - 1.5, Y(n.y) - 1.5, 3, 3);
  for (const m of S.mobs.values()) { const d = S.content.mobs[m.type]; if (d && d.b) { c.fillStyle = '#f33'; c.beginPath(); c.arc(X(m.x), Y(m.y), 4, 0, 7); c.fill(); } }
  c.fillStyle = '#6cf'; for (const p of S.players.values()) c.fillRect(X(p.x) - 2, Y(p.y) - 2, 4, 4);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(N / 2, N / 2, 3.5, 0, 7); c.fill();
}
