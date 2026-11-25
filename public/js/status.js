// Small pixel status icons above monsters / players (burning, poisoned, slowed) instead of emoji.
import * as A from './assets.js';
export function statusIcon(ctx, fl, x, y, S) {
  if (!fl) return;
  const list = []; if (fl & 1) list.push('burning'); if (fl & 2) list.push('poisoned'); if (fl & 4) list.push('slowed');
  ctx.imageSmoothingEnabled = false; list.forEach((id, i) => { const img = A.get('buffs/' + id); if (img) ctx.drawImage(img, x + (i - (list.length - 1) / 2) * 17 - 8, y - 8, 16, 16); });
}
