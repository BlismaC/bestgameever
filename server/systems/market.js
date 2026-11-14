'use strict';
// PLAYER MARKET + AUCTION HOUSE + MAIL (Willow Town). Everything is stored in the server store ('mk') so it survives restarts; payouts go
// to a per-player mailbox (p.mail, saved in the profile) so sellers/bidders get their items and coins even when offline.
const content = require('../content');
const FEE_MARKET = 0.05, FEE_AUCTION = 0.08, MAX_LIST = 12, MAX_AUC = 6, MAX_PRICE = 9999999, HOURS = [1, 6, 12];
const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.floor(Number(v)) || 0));

module.exports = {
  marketInit() { this.mk = { listings: [], auctions: [], next: 1 }; this.mkDirty = false; this.mkSettleT = 5; this.marketReady = this.marketLoad(); },
  async marketLoad() { try { const d = await this.store.get('mk'); if (d && Array.isArray(d.listings) && Array.isArray(d.auctions)) this.mk = { listings: d.listings, auctions: d.auctions, next: d.next || 1 }; } catch (e) { console.error('[market load]', e.message); } },
  async marketSave() { if (!this.mkDirty) return; this.mkDirty = false; try { await this.store.set('mk', this.mk); } catch (e) { console.error('[market save]', e.message); } },
  inTown(p) { return this.world.gen.dimAt(p.x, p.y) === 'town'; },
  // ---- mail
  async deliver(acc, mail) {
    const q = this.byAcc.get(acc);
    if (q) { q.mail.push(mail); this.claimMail(q, true); return; }
    try { const prof = (await this.store.get('p:' + acc)) || {}; prof.mail = Array.isArray(prof.mail) ? prof.mail : []; prof.mail.push(mail); await this.store.set('p:' + acc, prof); } catch (e) { console.error('[mail]', e.message); }
  },
  claimMail(p, quiet) {
    const keep = [];
    for (const m of p.mail) {
      if (m.coins) { const left = this.addItem(p, 'coin', m.coins); if (left > 0) { m.coins = left; keep.push(m); continue; } if (!quiet || true) this.sys(p, `📬 ${m.note || 'Mail'}: +${m.coins} coins`); }
      else if (m.item) { const left = this.addItem(p, m.item, m.count, m.mod || null); if (left > 0) { m.count = left; keep.push(m); continue; } this.sys(p, `📬 ${m.note || 'Mail'}: ${m.count}× ${content.items[m.item].name}`); }
    }
    p.mail = keep; if (keep.length) this.sys(p, `📬 ${keep.length} parcel(s) are waiting — free some inventory space and talk to Penny the Postie.`);
  },
  // ---- helpers
  takeFromSlot(p, i, count) {
    const s = p.inv[i]; if (!s || s.id === 'coin' || !content.items[s.id]) return null;
    const def = content.items[s.id]; count = def.weapon ? 1 : clampInt(count || s.count, 1, s.count);
    const item = { id: s.id, count, mod: s.mod || null }; s.count -= count; if (s.count <= 0) p.inv[i] = null; this.sendInv(p); return item;
  },
  sendMarket(p) {
    const now = Date.now(), L = this.mk.listings.slice(-250), A = this.mk.auctions.filter((a) => a.end > now - 1000).slice(-120);
    this.send(p, { t: 'market', now, me: p.own, fee: [FEE_MARKET, FEE_AUCTION], hours: HOURS, coins: this.countItem(p, 'coin'), mail: p.mail.length,
      listings: L.map((l) => [l.id, l.sellerName, l.seller === p.acc ? 1 : 0, l.item, l.count, l.mod || 0, l.price]),
      auctions: A.map((a) => [a.id, a.sellerName, a.seller === p.acc ? 1 : 0, a.item, a.count, a.mod || 0, a.min, a.buyout, a.bid, a.bidderName || '', a.bidder === p.acc ? 1 : 0, a.end]) });
  },
  marketMsg(p, m) {
    if (!this.inTown(p)) return this.sys(p, 'Visit Willow Town to use the market.');
    const mk = this.mk, acc = p.acc;
    switch (m.t) {
      case 'mk_open': break;
      case 'mk_list': {
        if (mk.listings.filter((l) => l.seller === acc).length >= MAX_LIST) return this.sys(p, `You can list at most ${MAX_LIST} items.`);
        const price = clampInt(m.price, 1, MAX_PRICE); const it = this.takeFromSlot(p, m.i | 0, m.count); if (!it) return;
        mk.listings.push({ id: mk.next++, seller: acc, sellerName: p.name, item: it.id, count: it.count, mod: it.mod, price, t: Date.now() }); this.mkDirty = true;
        this.sys(p, `Listed ${it.count}× ${content.items[it.id].name} for ${price} coins.`); break;
      }
      case 'mk_buy': {
        const i = mk.listings.findIndex((l) => l.id === (m.id | 0)); if (i < 0) return this.sys(p, 'That offer is gone.');
        const l = mk.listings[i]; if (l.seller === acc) return this.sys(p, "That's your own offer — cancel it instead.");
        if (this.countItem(p, 'coin') < l.price) return this.sys(p, 'Not enough coins.');
        this.removeItem(p, 'coin', l.price); this.sendInv(p); mk.listings.splice(i, 1); this.mkDirty = true;
        this.deliver(acc, { item: l.item, count: l.count, mod: l.mod, note: 'Your purchase' });
        this.deliver(l.seller, { coins: Math.floor(l.price * (1 - FEE_MARKET)), note: `${content.items[l.item].name} sold to ${p.name}` });
        this.sys(p, `Bought ${l.count}× ${content.items[l.item].name} for ${l.price} coins.`); break;
      }
      case 'mk_cancel': {
        const i = mk.listings.findIndex((l) => l.id === (m.id | 0) && l.seller === acc); if (i < 0) return;
        const l = mk.listings.splice(i, 1)[0]; this.mkDirty = true; this.deliver(acc, { item: l.item, count: l.count, mod: l.mod, note: 'Cancelled offer returned' }); break;
      }
      case 'au_create': {
        if (mk.auctions.filter((a) => a.seller === acc && a.end > Date.now()).length >= MAX_AUC) return this.sys(p, `You can run at most ${MAX_AUC} auctions.`);
        const min = clampInt(m.min, 1, MAX_PRICE); let buyout = clampInt(m.buyout, 0, MAX_PRICE); if (buyout && buyout <= min) buyout = min + 1;
        const hrs = HOURS.includes(m.hours | 0) ? m.hours | 0 : 1; const it = this.takeFromSlot(p, m.i | 0, m.count); if (!it) return;
        mk.auctions.push({ id: mk.next++, seller: acc, sellerName: p.name, item: it.id, count: it.count, mod: it.mod, min, buyout, bid: 0, bidder: null, bidderName: '', end: Date.now() + hrs * 3600000 }); this.mkDirty = true;
        this.sys(p, `Auction started: ${it.count}× ${content.items[it.id].name}, min bid ${min}${buyout ? `, buyout ${buyout}` : ''}, ${hrs}h.`); break;
      }
      case 'au_bid': case 'au_buy': {
        const a = mk.auctions.find((x) => x.id === (m.id | 0)); if (!a || a.end <= Date.now()) return this.sys(p, 'That auction has ended.');
        if (a.seller === acc) return this.sys(p, "You can't bid on your own auction.");
        const amount = m.t === 'au_buy' ? a.buyout : clampInt(m.amount, 1, MAX_PRICE);
        if (m.t === 'au_buy' && !a.buyout) return this.sys(p, 'No buyout price.');
        const need = a.bid ? Math.max(a.bid + Math.max(1, Math.floor(a.bid * 0.05)), amount) : Math.max(a.min, amount);
        if (m.t === 'au_bid' && amount < (a.bid ? a.bid + Math.max(1, Math.floor(a.bid * 0.05)) : a.min)) return this.sys(p, `Minimum bid is ${a.bid ? a.bid + Math.max(1, Math.floor(a.bid * 0.05)) : a.min}.`);
        const pay = m.t === 'au_buy' ? a.buyout : need;
        const mine = a.bidder === acc ? a.bid : 0;   // raising your own bid only costs the difference
        if (this.countItem(p, 'coin') < pay - mine) return this.sys(p, 'Not enough coins.');
        this.removeItem(p, 'coin', pay - mine); this.sendInv(p);
        if (a.bidder && a.bidder !== acc) this.deliver(a.bidder, { coins: a.bid, note: `Outbid on ${content.items[a.item].name} — coins returned` });
        a.bid = pay; a.bidder = acc; a.bidderName = p.name; this.mkDirty = true;
        if (m.t === 'au_buy') a.end = Date.now(); else if (a.end - Date.now() < 60000) a.end += 60000;
        this.sys(p, m.t === 'au_buy' ? 'Bought out!' : `You are the highest bidder (${pay} coins).`); break;
      }
      case 'mail_claim': this.claimMail(p); break;
    }
    this.sendMarket(p);
  },
  tickMarket(dt) {
    this.mkSettleT -= dt; if (this.mkSettleT > 0) return; this.mkSettleT = 5;
    const now = Date.now(), keep = [];
    for (const a of this.mk.auctions) {
      if (a.end > now) { keep.push(a); continue; }
      if (a.settled) { if (now - a.end < 600000) keep.push(a); continue; }   // ended auctions stay visible for 10 minutes
      a.settled = true; this.mkDirty = true;
      if (a.bidder) { this.deliver(a.bidder, { item: a.item, count: a.count, mod: a.mod, note: 'Auction won' }); this.deliver(a.seller, { coins: Math.floor(a.bid * (1 - FEE_AUCTION)), note: `${content.items[a.item].name} auctioned` }); }
      else this.deliver(a.seller, { item: a.item, count: a.count, mod: a.mod, note: 'Unsold auction returned' });
      keep.push(a);
    }
    if (keep.length !== this.mk.auctions.length) this.mkDirty = true; this.mk.auctions = keep;
    this.marketSave();
  },
};
