// v0.7 UI: Pal roster, Market / Auction / Mail, dialogs, cutscenes. (state comes from net.js messages)
import { S } from './state.js';
import { send } from './net.js';
import * as A from './assets.js';
import { drawHuman } from './look.js';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EL = { earth: '#b08a50', storm: '#ffe14a', nature: '#6fdc4a', water: '#4aa8e0', fire: '#ff7a1a', ice: '#bff3ff', light: '#fff3a8', dark: '#9a6aff', ghost: '#b8f0e0', dragon: '#ff5a3a', crystal: '#e0c8ff', void: '#9a4aff' };
const img = (id, cls) => { const u = A.iconURL(id); return u ? `<img ${cls ? `class="${cls}" ` : ''}src="${u}">` : `<span style="font-size:26px">${esc((S.content.items[id] || {}).e || '?')}</span>`; };
const itemName = (id) => (S.content.items[id] ? S.content.items[id].n : id);
let selPal = null;

// ---------------------------------------------------------------- PALS
export function palsChanged() { if (!$('pals').classList.contains('hidden')) renderPals(); }
export function renderPals() {
  const box = $('pals'), P = S.pals || { list: [], active: null, traits: {} }, defs = S.content.pals;
  if (!selPal || !P.list.some((r) => r.id === selPal)) selPal = P.active || (P.list[0] && P.list[0].id) || null;
  let h = `<h3>Pals <small>(P) — ${P.list.length}/40 tamed</small></h3><div class="note">Weaken a wild Pal, then throw a <b>Pal Sphere</b> (hold it and click). Your companion fights, mines ore and levels up.</div>`;
  if (!P.list.length) h += '<p>You have no Pals yet. Wild Pals roam every biome — look for creatures with a level above their head. Craft Pal Spheres at a Workbench (slime gel + iron) or buy them from the Merchant.</p>';
  h += '<div class="palgrid">' + P.list.map((r) => { const d = defs[r.sp]; return `<div class="palcard ${r.id === selPal ? 'sel' : ''} ${r.id === P.active ? 'act' : ''}" data-id="${r.id}">${img('pal_' + r.sp)}<b>${esc(r.name)}${r.shiny ? ' ✦' : ''}</b><small>Lv ${r.lv} · <span style="color:${EL[d.el]}">${d.el}</span></small></div>`; }).join('') + '</div>';
  const r = P.list.find((x) => x.id === selPal);
  if (r) {
    const d = defs[r.sp], atk = Math.round(d.atk * (1 + r.lv * 0.11) * (r.traits.includes('brave') ? 1.3 : 1) * (r.shiny ? 1.15 : 1));
    h += `<div class="paldetail">${img('pal_' + r.sp, 'big')}<div class="palbars"><h3 style="margin:0">${esc(r.name)}${r.shiny ? ' ✦ shiny' : ''}</h3><div><span class="el" style="background:${EL[d.el]}">${d.el}</span> ${esc(d.n)} · ${'★'.repeat(d.r)}${'☆'.repeat(4 - d.r)}</div>
      <div style="margin-top:6px">Level <b>${r.lv}</b> <small>(${r.xp}/${r.xn} xp)</small></div><div class="xpbar"><div style="width:${Math.min(100, (r.xp / r.xn) * 100)}%"></div></div>
      <div>Attack <b>${atk}</b> · Mines ore up to tier <b>${d.m}</b></div><div style="margin:6px 0">${r.traits.map((t) => `<span class="trait" title="${esc(P.traits[t] ? P.traits[t][1] : '')}">${esc(P.traits[t] ? P.traits[t][0] : t)}</span>`).join('') || '<small>no traits</small>'}</div>
      <div class="note">${esc(d.d)}<br>Lives in: ${d.h.join(', ')}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px"><button class="btn" id="pl-call">${r.id === P.active ? 'Send to rest' : 'Bring along'}</button><button class="btn" id="pl-ren">Rename</button><button class="btn" id="pl-rel" style="background:#6a2030">Release</button></div></div>`;
  }
  box.innerHTML = h;
  box.querySelectorAll('.palcard').forEach((c) => { c.onclick = () => { selPal = c.dataset.id; renderPals(); }; c.ondblclick = () => send({ t: 'pal_call', id: c.dataset.id }); });
  if (r) {
    $('pl-call').onclick = () => (r.id === P.active ? send({ t: 'pal_dismiss' }) : send({ t: 'pal_call', id: r.id }));
    $('pl-ren').onclick = () => { const n = prompt('New name for ' + r.name + ':', r.name); if (n) send({ t: 'pal_rename', id: r.id, name: n }); };
    $('pl-rel').onclick = () => { if (confirm(`Really release ${r.name}? This cannot be undone.`)) send({ t: 'pal_release', id: r.id }); };
  }
}

// ---------------------------------------------------------------- MARKET / AUCTION / MAIL
let mTab = 'market', sellSlot = -1, clockOff = 0;
export function openMarket(tab) { mTab = tab || 'market'; for (const id of ['inv', 'craft', 'map', 'home', 'chest', 'npc', 'pals']) $(id).classList.add('hidden'); $('market').classList.remove('hidden'); renderMarket(); }
export function marketChanged() { if (S.market) clockOff = S.market.now - Date.now(); if (!$('market').classList.contains('hidden')) renderMarket(); }
const fmtT = (ms) => { if (ms <= 0) return 'ended'; const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`; };
export function renderMarket() {
  const M = S.market, box = $('market'); if (!M) { box.innerHTML = '<h3>Market</h3><p>Loading…</p>'; return; }
  const now = Date.now() + clockOff, coin = A.iconURL('coin');
  let h = `<h3>Willow Town Market <small>— <img src="${coin}" style="width:16px;vertical-align:-3px"> <b>${M.coins}</b> coins · <button class="btn small" id="mk-x">Close ✕</button></small></h3>
    <div class="tabs">${[['market', 'Market'], ['auction', 'Auction House'], ['sell', 'Sell'], ['mail', `Mail${M.mail ? ' (' + M.mail + ')' : ''}`]].map(([k, n]) => `<button class="btn small ${mTab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
  if (mTab === 'market') {
    h += `<div class="note">Players sell items for coins. ${Math.round(M.fee[0] * 100)}% fee is taken from the seller. Sellers get paid by mail even when offline.</div>`;
    h += M.listings.length ? M.listings.slice().reverse().map(([id, sn, mine, item, cnt, mod, price]) => `<div class="mrow">${img(item)}<div class="g"><b>${esc(itemName(item))}</b> ×${cnt}${mod ? ' <small>(reforged)</small>' : ''}<br><small>by ${esc(sn)}</small></div><span class="price">${price}</span>${mine ? `<button class="btn small" data-cancel="${id}">Cancel</button>` : `<button class="btn small" data-buy="${id}" ${M.coins < price ? 'disabled' : ''}>Buy</button>`}</div>`).join('') : '<p>No offers yet. Be the first — open the Sell tab!</p>';
  } else if (mTab === 'auction') {
    h += `<div class="note">Highest bid wins when the timer ends. ${Math.round(M.fee[1] * 100)}% fee for sellers. Outbid coins are returned by mail.</div>`;
    const list = M.auctions.slice().sort((a, b) => a[11] - b[11]);
    h += list.length ? list.map(([id, sn, mine, item, cnt, mod, min, buyout, bid, bn, meBid, end]) => { const left = end - now, over = left <= 0; return `<div class="mrow">${img(item)}<div class="g"><b>${esc(itemName(item))}</b> ×${cnt}<br><small>by ${esc(sn)} · ${fmtT(left)}</small></div><div style="min-width:120px">${bid ? `Bid <span class="price">${bid}</span><br><small>${meBid ? 'YOU lead!' : esc(bn)}</small>` : `Min <span class="price">${min}</span>`}</div>${over || mine ? (over ? '<small>ended</small>' : '<small>yours</small>') : `<input type="number" min="1" id="bid-${id}" placeholder="${bid ? Math.ceil(bid * 1.05) : min}"><button class="btn small" data-bid="${id}">Bid</button>${buyout ? `<button class="btn small" data-bo="${id}">Buy ${buyout}</button>` : ''}`}</div>`; }).join('') : '<p>No auctions running.</p>';
  } else if (mTab === 'sell') {
    h += '<div class="note">Pick an item from your inventory, then list it.</div><div class="palgrid" id="sellgrid"></div><div id="sellform"></div>';
  } else {
    h += M.mail ? `<p>You have <b>${M.mail}</b> parcel(s) waiting (coins and items from sales, wins and returns).</p><button class="btn" id="mail-go">Collect everything</button>` : '<p>No mail. Sales and auction wins arrive here automatically.</p>';
  }
  box.innerHTML = h;
  $('mk-x').onclick = () => box.classList.add('hidden');
  box.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { mTab = b.dataset.tab; renderMarket(); }; });
  box.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => send({ t: 'mk_buy', id: +b.dataset.buy }); });
  box.querySelectorAll('[data-cancel]').forEach((b) => { b.onclick = () => send({ t: 'mk_cancel', id: +b.dataset.cancel }); });
  box.querySelectorAll('[data-bid]').forEach((b) => { b.onclick = () => { const v = +($('bid-' + b.dataset.bid).value || $('bid-' + b.dataset.bid).placeholder); send({ t: 'au_bid', id: +b.dataset.bid, amount: v }); }; });
  box.querySelectorAll('[data-bo]').forEach((b) => { b.onclick = () => send({ t: 'au_buy', id: +b.dataset.bo }); });
  if (mTab === 'mail' && $('mail-go')) $('mail-go').onclick = () => send({ t: 'mail_claim' });
  if (mTab === 'sell') {
    const g = $('sellgrid'); S.inv.forEach((s, i) => { if (!s || s[0] === 'coin') return; const d = document.createElement('div'); d.className = 'palcard' + (i === sellSlot ? ' sel' : ''); d.innerHTML = `${img(s[0])}<b>${esc(itemName(s[0]))}</b><small>×${s[1]}</small>`; d.onclick = () => { sellSlot = i; renderMarket(); }; g.appendChild(d); });
    const s = S.inv[sellSlot]; if (s && s[0] !== 'coin') {
      const stack = !S.content.items[s[0]].w;
      $('sellform').innerHTML = `<div class="mrow">${img(s[0])}<div class="g"><b>${esc(itemName(s[0]))}</b></div>${stack ? `Amount <input type="number" id="sl-n" min="1" max="${s[1]}" value="${s[1]}">` : ''}</div>
        <div class="mrow"><div class="g"><b>Sell for a fixed price</b></div>Price <input type="number" id="sl-p" min="1" value="100"><button class="btn small" id="sl-list">List on Market</button></div>
        <div class="mrow"><div class="g"><b>Auction</b></div>Min bid <input type="number" id="sl-m" min="1" value="50">Buyout <input type="number" id="sl-b" min="0" value="0" title="0 = none"><select id="sl-h">${M.hours.map((x) => `<option value="${x}">${x}h</option>`).join('')}</select><button class="btn small" id="sl-auc">Start Auction</button></div>`;
      const cnt = () => (stack ? Math.max(1, Math.min(s[1], +$('sl-n').value || 1)) : 1);
      $('sl-list').onclick = () => send({ t: 'mk_list', i: sellSlot, count: cnt(), price: +$('sl-p').value }); 
      $('sl-auc').onclick = () => send({ t: 'au_create', i: sellSlot, count: cnt(), min: +$('sl-m').value, buyout: +$('sl-b').value, hours: +$('sl-h').value });
    }
  }
}

// ---------------------------------------------------------------- DIALOG (NPC speaks, you choose)
let typer = null;
export function openDialog(m) {
  const d = $('dialog'); d.classList.remove('hidden'); d.innerHTML = '<canvas width="84" height="100"></canvas><div class="tx"><div class="who"></div><div class="body"></div><div class="ch"></div></div>';
  const cv = d.querySelector('canvas'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#16224a'; g.fillRect(0, 0, 84, 100);
  const pk = portraitKey(m.who), pim = pk && A.get('portraits/' + pk);
  if (pim) { const r = Math.min(84 / pim.width, 100 / pim.height); g.drawImage(pim, (84 - pim.width * r) / 2, 100 - pim.height * r, pim.width * r, pim.height * r); } else try { drawHuman(g, { x: 42, y: 92, look: m.look, dir: 1, aim: 0.3, u: 3.4, phase: 0, move: 0 }); } catch (e) { /* ignore */ }
  d.querySelector('.who').textContent = m.who; const body = d.querySelector('.body'); let i = 0; clearInterval(typer);
  typer = setInterval(() => { i += 2; body.textContent = m.text.slice(0, i); if (i >= m.text.length) { clearInterval(typer); const ch = d.querySelector('.ch'); m.choices.forEach((c, k) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = `${k + 1}. ${c}`; b.onclick = () => choose(m.id, k); ch.appendChild(b); }); S.dialogOpen = { id: m.id, n: m.choices.length }; } }, 22);
  S.dialogOpen = null;
}
export function choose(id, c) { send({ t: 'dialog_choice', id, c }); closeDialog(); }
export function closeDialog() { clearInterval(typer); $('dialog').classList.add('hidden'); S.dialogOpen = null; }
export function dialogKey(k) { if (S.dialogOpen && k >= '1' && k <= String(S.dialogOpen.n)) { choose(S.dialogOpen.id, +k - 1); return true; } return false; }

// ---------------------------------------------------------------- CUTSCENE (letterbox + subtitles) and SAY (boss shouts)
let csTimers = [];
const PORTRAIT = [['dracula', 'dracula'], ['neptune', 'neptune'], ['pumpking', 'pumpking'], ['claus', 'evil_santa'], ['villager', 'villager']];
const SPEAKER_COL = { dracula: '#b01030', neptune: '#1a6a9a', pumpking: '#b0500e', evil_santa: '#a01820', villager: '#6a4a2a' };
export function portraitKey(who) { const w = String(who || '').toLowerCase(); for (const [k, v] of PORTRAIT) if (w.includes(k)) return v; return null; }
function portraitSrc(key) { const im = key && A.get('portraits/' + key); return im ? im.src : null; }
export function endCutscene() {
  csTimers.forEach((t) => { clearTimeout(t); clearInterval(t); }); csTimers = []; const el = $('cutscene'); if (el) { el.classList.remove('on'); el.classList.add('hidden'); } document.body.classList.remove('cs'); S.cutscene = null;
  const w = $('cs-who'), x = $('cs-text'); if (w) w.textContent = ''; if (x) x.textContent = '';
}
export function startCutscene(m) {
  const el = $('cutscene'); csTimers.forEach(clearTimeout); csTimers = []; el.classList.remove('hidden'); document.body.classList.add('cs'); setTimeout(() => el.classList.add('on'), 30);
  const per = m.per || 4200; S.cutscene = { mood: m.mood, boss: m.boss || null, until: performance.now() + m.lines.length * per + 900 };
  const who = $('cs-who'), tx = $('cs-text'), face = $('cs-face'), im = $('cs-img');
  m.lines.forEach(([w, text], i) => {
    csTimers.push(setTimeout(() => {
      const key = portraitKey(w), src = portraitSrc(key);
      if (src) { im.src = src; face.classList.remove('none'); } else face.classList.add('none');
      who.textContent = w || ''; who.style.color = SPEAKER_COL[key] || '#b01030'; who.style.display = w ? 'block' : 'none'; tx.textContent = '';
      let k = 0; face.classList.add('talk'); const t = setInterval(() => { k += 2; tx.textContent = text.slice(0, k); if (k >= text.length) { clearInterval(t); face.classList.remove('talk'); } }, 28); csTimers.push(t);
    }, i * per));
  });
  csTimers.push(setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.classList.add('hidden'), 700); document.body.classList.remove('cs'); who.textContent = ''; tx.textContent = ''; face.classList.remove('talk'); }, m.lines.length * per + 300));
}
let sayT = null;
export function say(m) { const e = $('say'), src = portraitSrc(portraitKey(m.who)); e.innerHTML = `${src ? `<img src="${src}">` : ''}<div><b>${esc(m.who)}:</b> ${esc(m.text)}</div>`; e.style.borderColor = m.color || '#ffd23f'; e.classList.remove('hidden'); clearTimeout(sayT); sayT = setTimeout(() => e.classList.add('hidden'), m.ms || 4000); }
