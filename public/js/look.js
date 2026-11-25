// Terraria-style player: palettes + a layered pixel-rect character renderer (used in game, menu preview and for NPCs).
export const SKIN = ['#f2c7a0', '#e0a878', '#c68642', '#8d5524', '#ffdbc4', '#a8d8a0'];
export const HAIR = ['#2a1a10', '#5a3a1a', '#c9a03a', '#d8d8d8', '#c0392b', '#2f6bd8', '#a45cff', '#1a1a24'];
export const SHIRT = ['#3a6ad8', '#d8433a', '#3aa84a', '#e8c23a', '#8a4ac0', '#2a2a36', '#f0f0f0', '#d87a2a'];
export const PANTS = ['#3a3a56', '#5a3b20', '#2a2a2a', '#2f6a4a', '#6a2a2a', '#8a8a9a'];
export const STYLES = ['Short', 'Long', 'Spiky', 'Mohawk', 'Bald'];
const sh = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = k >= 0 ? 255 : 0, a = Math.abs(k); r = (r + (f - r) * a) | 0; g = (g + (f - g) * a) | 0; b = (b + (f - b) * a) | 0; return `rgb(${r},${g},${b})`; };

// o: {x,y(feet), look{s,h,c,p,st}, dir(1|-1), aim(local radians, 0 = forward), phase, move(0..1), swing(rad offset), weapon(draw fn(ctx,len) or null), u, flash, hat, bob}
export function drawHuman(ctx, o) {
  const u = o.u || 2.5, L = o.look || { s: 0, h: 0, c: 0, p: 0, st: 0 }, skin = SKIN[L.s % SKIN.length], hair = HAIR[L.h % HAIR.length], shirt = SHIRT[L.c % SHIRT.length], pants = PANTS[L.p % PANTS.length];
  const mv = o.move || 0, ph = o.phase || 0, bob = Math.abs(Math.sin(ph * 1)) * mv * 0.8;
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x * u), Math.round(y * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u))); };
  const part = (x, y, w, h, col) => { R(x, y, w, h, col); R(x, y + h - 1, w, 1, sh(col, -0.28)); R(x + w - 1, y, 1, h, sh(col, -0.18)); R(x, y, w, 0.9, sh(col, 0.2)); };
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.dir || 1, 1);
  const flash = o.flash || 0;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 1, 7 * u, 2.2 * u, 0, 0, 6.3); ctx.fill();
  ctx.translate(0, -bob * u);
  const swing = Math.sin(ph) * mv;
  const A = o.armor || {}, ah = A.h, ac = A.c, al = A.l;
  const shirtC = ac ? ac.pri : shirt, pantsC = al ? al.pri : pants;
  // wings / cape sit behind the body
  if (ac && ac.wings) { ctx.save(); ctx.globalAlpha = 0.95; for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#fff6c8' : '#ffffff'; ctx.beginPath(); ctx.moveTo(-1 * u, -13 * u); ctx.lineTo(-13 * u - k * 2 * u, (-24 + k * 4 - Math.sin(ph * 0.5) * 1.5) * u); ctx.lineTo(-9 * u - k * 2 * u, (-16 + k * 3) * u); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  if (ac && ac.cape) { const w = Math.sin(ph) * mv * 1.4; R(-7.5 - w, -15, 4, 13 + w * 0.5, sh('#8a1a2a', -0.1)); R(-7.5 - w, -3, 4, 1, sh('#8a1a2a', -0.4)); }
  // back arm
  ctx.save(); ctx.translate(-0.5 * u, -14 * u); ctx.rotate(-swing * 0.7 + 0.08); part(-1, 0, 2.5, 7, sh(skin, -0.12)); R(-1, 0, 2.5, 3, sh(shirt, -0.25)); ctx.restore();
  // legs
  part(-3.5 + swing * 1.8, -7 - Math.max(0, -swing) * 0.7, 3, 7, sh(pantsC, -0.1)); part(0.5 - swing * 1.8, -7 - Math.max(0, swing) * 0.7, 3, 7, pantsC);
  const bootC = al ? al.sec : '#2a2018'; R(-3.5 + swing * 1.8, -1.8, 3.4, 1.8, bootC); R(0.5 - swing * 1.8, -1.8, 3.4, 1.8, bootC);
  if (al) { R(-3 + swing * 1.8, -4.5, 2.4, 1.4, al.trim); R(1 - swing * 1.8, -4.5, 2.4, 1.4, al.trim); }
  // torso
  part(-4, -15, 8, 8.2, shirtC); R(-4, -9.2, 8, 1.2, sh(shirtC, -0.4)); R(-1, -15, 2, 1, sh(shirtC, -0.15));
  if (ac) {
    R(-5, -15.6, 3, 3, ac.sec); R(2, -15.6, 3, 3, ac.sec); R(-5, -15.6, 3, 0.8, sh(ac.sec, 0.3));
    if (ac.chest === 'plate') { R(-4, -10.4, 8, 1, ac.trim); R(-1, -14.5, 2, 5, sh(ac.pri, -0.25)); if (ac.glow) R(-0.8, -13.2, 1.6, 1.6, ac.glow); }
    else if (ac.chest === 'robe') { part(-4.4, -8, 8.8, 6.5, ac.pri); R(-0.5, -15, 1, 13, ac.sec); }
    else { R(-4, -14, 1.4, 6, sh(ac.pri, -0.4)); R(2.6, -14, 1.4, 6, sh(ac.pri, -0.4)); R(-4, -9.6, 8, 1.1, ac.sec); }
  }
  // head
  part(-4, -23, 8, 8, skin);
  R(1.5, -20, 1.2, 1.6, '#ffffff'); R(2.1, -19.7, 0.9, 1.2, '#1a1420'); R(1, -17.2, 2.2, 0.6, sh(skin, -0.35));
  const st = L.st % STYLES.length;
  if (st === 0) { part(-4.4, -24, 8.8, 3, hair); R(-4.4, -21, 2, 3, hair); }
  else if (st === 1) { part(-4.4, -24, 8.8, 3, hair); R(-5, -21, 3, 9, hair); R(-4.4, -21, 2, 3, hair); }
  else if (st === 2) { part(-4.4, -23.5, 8.8, 2.4, hair); for (let i = 0; i < 4; i++) R(-4 + i * 2.3, -27 + (i % 2), 1.6, 3.5, hair); }
  else if (st === 3) { part(-0.8, -26, 2.2, 5, hair); R(-4.4, -23, 8.8, 1.2, sh(hair, -0.2)); }
  if (o.hat === 'cap') { part(-4.6, -25, 9.2, 3, '#c0392b'); R(1, -23, 5, 1.2, '#c0392b'); }
  else if (o.hat === 'bandana') { part(-4.4, -23.6, 8.8, 2.2, '#c0262d'); R(-6, -22, 2, 1.2, '#c0262d'); }
  else if (o.hat === 'nurse') { part(-4.2, -26, 8.4, 3.4, '#ffffff'); R(-0.6, -25.4, 1.2, 2.2, '#e0245e'); R(-1.5, -24.8, 3, 0.9, '#e0245e'); }
  if (o.vamp) { R(-4, -23.6, 8, 8, 'rgba(255,255,255,.32)'); R(1.6, -20, 1.2, 1.5, '#ff2a3a'); R(3.4, -20, 1, 1.5, '#ff2a3a'); R(2.2, -17.3, 0.7, 1.3, '#fff'); R(3.6, -17.3, 0.7, 1.3, '#fff'); }
  if (ah) {
    const hs = ah.helm;
    if (hs === 'cap') { part(-4.6, -24.6, 9.2, 3.4, ah.pri); R(1, -21.4, 5, 1.1, sh(ah.pri, -0.3)); }
    else if (hs === 'helm') { part(-4.6, -24.6, 9.2, 4.2, ah.pri); R(-4.6, -20.5, 2.3, 5, ah.pri); R(2.3, -20.5, 2.3, 5, ah.pri); R(-0.5, -20.5, 1, 3.2, sh(ah.pri, -0.2)); }
    else if (hs === 'visor') { part(-4.6, -24.6, 9.2, 9.6, ah.pri); R(-0.5, -20.4, 4.6, 1.6, '#15151c'); if (ah.glow) R(1.2, -20.2, 2.6, 1.2, ah.glow); }
    else if (hs === 'crown') { part(-4.4, -24, 8.8, 2.4, '#ffd23f'); for (let i = 0; i < 4; i++) R(-4.2 + i * 2.5, -26.4, 1.6, 2.6, '#ffd23f'); R(-0.5, -25.6, 1.2, 1.2, '#e0245e'); }
    else if (hs === 'horns') { part(-4.6, -24.4, 9.2, 3.2, ah.pri); R(-6.4, -27, 1.7, 5, '#f0ead8'); R(4.7, -27, 1.7, 5, '#f0ead8'); R(-7.4, -28.4, 1.5, 2.2, '#f0ead8'); R(5.9, -28.4, 1.5, 2.2, '#f0ead8'); }
    else if (hs === 'hood') { part(-5.2, -25.4, 10.4, 10.6, ah.pri); R(-0.5, -21.6, 4.6, 5.4, sh(skin, -0.1)); R(1.6, -20, 1.2, 1.5, '#fff'); R(2.2, -19.7, 0.9, 1.2, '#1a1420'); }
    else if (hs === 'spiky') { part(-4.6, -24.4, 9.2, 3.2, ah.pri); for (let i = 0; i < 4; i++) R(-4.4 + i * 2.6, -27.6 + (i % 2), 1.7, 3.6, sh(ah.pri, 0.25)); }
    else if (hs === 'eye') { part(-4.6, -24.4, 9.2, 3.4, ah.pri); R(-1, -23.6, 3, 2.6, '#f4ece4'); R(0, -23, 1.4, 1.5, '#c0262d'); }
    else if (hs === 'nemes') { part(-4.8, -24.6, 9.6, 3.4, ah.pri); R(-6, -22, 2, 8, ah.pri); R(4, -22, 2, 8, ah.pri); R(-6, -20, 2, 0.9, ah.trim); R(4, -20, 2, 0.9, ah.trim); R(-6, -17.4, 2, 0.9, ah.trim); R(4, -17.4, 2, 0.9, ah.trim); }
    if (ah.glow && (hs === 'crown' || hs === 'spiky' || hs === 'horns')) { ctx.globalAlpha = 0.25; ctx.fillStyle = ah.glow; ctx.fillRect(Math.round(-5 * u), Math.round(-26 * u), Math.round(10 * u), Math.round(5 * u)); ctx.globalAlpha = 1; }
  }
  // front arm + weapon
  ctx.save(); ctx.translate(1 * u, -13.5 * u);
  const ang = (o.aim === undefined ? 0.4 + swing * 0.3 : o.aim) + (o.swing || 0);
  ctx.rotate(ang);
  part(0, -1.1, 6.5, 2.4, skin); R(0, -1.1, 3.2, 2.4, sh(shirt, 0.0));
  if (o.weapon) { ctx.save(); ctx.translate(6.2 * u, 0); o.weapon(ctx, u); ctx.restore(); }
  R(5.4, -1.4, 2, 2.8, skin);
  ctx.restore();
  if (flash > 0) { ctx.globalAlpha = Math.min(0.55, flash * 0.55); ctx.fillStyle = '#fff'; ctx.fillRect(-5 * u, -24 * u, 10 * u, 24 * u); ctx.globalAlpha = 1; }
  ctx.restore();
}
