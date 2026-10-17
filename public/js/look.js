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
  // back arm
  ctx.save(); ctx.translate(-0.5 * u, -14 * u); ctx.rotate(-swing * 0.7 + 0.08); part(-1, 0, 2.5, 7, sh(skin, -0.12)); R(-1, 0, 2.5, 3, sh(shirt, -0.25)); ctx.restore();
  // legs
  part(-3.5 + swing * 1.8, -7 - Math.max(0, -swing) * 0.7, 3, 7, sh(pants, -0.1)); part(0.5 - swing * 1.8, -7 - Math.max(0, swing) * 0.7, 3, 7, pants);
  R(-3.5 + swing * 1.8, -1.5, 3.4, 1.5, '#2a2018'); R(0.5 - swing * 1.8, -1.5, 3.4, 1.5, '#2a2018');
  // torso
  part(-4, -15, 8, 8.2, shirt); R(-4, -9.2, 8, 1.2, sh(shirt, -0.4)); R(-1, -15, 2, 1, sh(shirt, -0.15));
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
