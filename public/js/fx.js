// Particles + screen shake
const TAU = Math.PI * 2;
export const shake = { m: 0 };
const P = [];
const add = (p) => { if (P.length < 800) P.push(p); };
const r = Math.random;

export function sparks(x, y, color, n = 7) {
  for (let i = 0; i < n; i++) { const a = r() * TAU, s = 90 + r() * 200; add({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + r() * 0.25, max: 0.55, size: 2 + r() * 2.5, color, drag: 5 }); }
}
export function chips(x, y, color, n = 7) {
  for (let i = 0; i < n; i++) { const a = r() * TAU, s = 60 + r() * 150; add({ k: 'chip', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: r() * TAU, vr: (r() - 0.5) * 14, life: 0.5 + r() * 0.3, max: 0.8, size: 4 + r() * 4, color, drag: 3.5 }); }
}
export function dust(x, y, big = 1) {
  add({ k: 'puff', x: x + (r() - 0.5) * 8, y, vx: (r() - 0.5) * 30, vy: (r() - 0.5) * 30, life: 0.45, max: 0.45, size: (5 + r() * 4) * big, color: '#ffffff', drag: 3 });
}
export function sparkle(x, y) {
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; add({ k: 'dot', x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 20, life: 0.4, max: 0.4, size: 2.5, color: '#fff7b0', drag: 4 }); }
}
export function boom(x, y, rad) {
  add({ k: 'ring', x, y, life: 0.4, max: 0.4, size: rad, color: '#ffb347' });
  const n = Math.min(26, 8 + rad / 8);
  for (let i = 0; i < n; i++) { const a = r() * TAU, s = 80 + r() * rad * 2.2; add({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + r() * 0.4, max: 0.8, size: 3 + r() * 4, color: r() < 0.5 ? '#ff9a3a' : '#ffe27a', drag: 4 }); }
  for (let i = 0; i < 5; i++) add({ k: 'puff', x: x + (r() - 0.5) * rad * 0.6, y: y + (r() - 0.5) * rad * 0.6, vx: (r() - 0.5) * 50, vy: (r() - 0.5) * 50, life: 0.7, max: 0.7, size: rad * 0.35, color: '#555', drag: 2 });
}
export function trail(x, y, color, size = 3) { add({ k: 'dot', x: x + (r() - 0.5) * 6, y: y + (r() - 0.5) * 6, vx: (r() - 0.5) * 20, vy: (r() - 0.5) * 20, life: 0.28, max: 0.28, size, color, drag: 3 }); }
export function pluses(x, y, color = '#7dff8a') { for (let i = 0; i < 7; i++) add({ k: 'plus', x: x + (r() - 0.5) * 34, y: y + (r() - 0.5) * 20, vx: (r() - 0.5) * 20, vy: -30 - r() * 50, life: 0.9, max: 0.9, size: 5 + r() * 3, color, drag: 1 }); }
export function leaves(x, y, color) { for (let i = 0; i < 5; i++) add({ k: 'chip', x, y, vx: (r() - 0.5) * 120, vy: (r() - 0.5) * 120, rot: r() * 6, vr: (r() - 0.5) * 8, life: 0.7, max: 0.7, size: 5, color, drag: 3 }); }
export function impact(kind, x, y, color) {
  const col = color || '#fff';
  switch (kind) {
    case 'arrow': case 'bolt': case 'thorn': for (let i = 0; i < 5; i++) { const a = r() * TAU, s = 60 + r() * 120; add({ k: 'chip', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: r() * 6, vr: (r() - 0.5) * 12, life: 0.45, max: 0.45, size: 3 + r() * 3, color: kind === 'thorn' ? '#6fbf3a' : '#c9a070', drag: 4 }); } dust(x, y, 0.6); break;
    case 'fire': for (let i = 0; i < 9; i++) { const a = r() * TAU, s = 50 + r() * 140; add({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.5 + r() * 0.3, max: 0.8, size: 2.5 + r() * 3, color: r() < 0.5 ? '#ffd23f' : '#ff6a1a', drag: 3 }); } add({ k: 'puff', x, y, vx: 0, vy: -20, life: 0.6, max: 0.6, size: 9, color: '#443', drag: 2 }); break;
    case 'ice': for (let i = 0; i < 8; i++) { const a = r() * TAU, s = 70 + r() * 130; add({ k: 'chip', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: r() * 6, vr: (r() - 0.5) * 14, life: 0.55, max: 0.55, size: 4 + r() * 4, color: r() < 0.5 ? '#e6fbff' : '#7ac8ff', drag: 3.5 }); } break;
    case 'poison': case 'gel': case 'egg': for (let i = 0; i < 8; i++) { const a = r() * TAU, s = 40 + r() * 110; add({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.55, max: 0.55, size: 3 + r() * 3, color: col, drag: 3.5 }); } add({ k: 'puff', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 8, color: col, drag: 2 }); break;
    case 'wave': add({ k: 'ring', x, y, life: 0.28, max: 0.28, size: 34, color: col }); sparks(x, y, col, 8); sparks(x, y, '#ffffff', 4); break;
    case 'bone': for (let i = 0; i < 5; i++) { const a = r() * TAU, s = 60 + r() * 100; add({ k: 'chip', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: r() * 6, vr: 10, life: 0.5, max: 0.5, size: 4, color: '#ece7d6', drag: 4 }); } break;
    default: add({ k: 'ring', x, y, life: 0.25, max: 0.25, size: 26, color: col }); sparks(x, y, col, 7);
  }
}
export function update(dt) {
  shake.m *= Math.exp(-dt * 9); if (shake.m < 0.2) shake.m = 0;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.life -= dt; if (p.life <= 0) { P[i] = P[P.length - 1]; P.pop(); continue; }
    if (p.drag) { const d = Math.exp(-dt * p.drag); p.vx *= d; p.vy *= d; }
    if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; }
    if (p.vr) p.rot += p.vr * dt;
  }
}
export function draw(ctx) {
  for (const p of P) {
    const a = Math.max(0, p.life / p.max);
    if (p.k === 'dot') {
      ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, TAU); ctx.fill();
    } else if (p.k === 'chip') {
      ctx.globalAlpha = Math.min(1, a * 1.5); ctx.fillStyle = p.color; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore();
    } else if (p.k === 'puff') {
      ctx.globalAlpha = a * 0.35; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.8), 0, TAU); ctx.fill();
    } else if (p.k === 'plus') {
      ctx.globalAlpha = Math.min(1, a * 1.4); ctx.fillStyle = p.color; const z = p.size; ctx.fillRect(p.x - z / 2, p.y - z / 6, z, z / 3); ctx.fillRect(p.x - z / 6, p.y - z / 2, z / 3, z);
    } else if (p.k === 'ring') {
      const k = 1 - a; ctx.globalAlpha = a * 0.8; ctx.strokeStyle = p.color; ctx.lineWidth = 6 * a + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.3 + k * 0.8), 0, TAU); ctx.stroke();
      ctx.globalAlpha = a * 0.25; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.3 + k * 0.8), 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
