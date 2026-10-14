import { S } from './state.js';
// Client-side spatial hash for resource nodes (the world now has thousands)
const CELL = 300;
let cells = new Map();
const k = (cx, cy) => cx * 100003 + cy;
export function buildGrid() {
  cells = new Map();
  for (const r of S.res) { const key = k(Math.floor(r.x / CELL), Math.floor(r.y / CELL)); let a = cells.get(key); if (!a) { a = []; cells.set(key, a); } a.push(r); }
}
export function nearRes(x, y, rad, fn) {
  const x0 = Math.floor((x - rad) / CELL), x1 = Math.floor((x + rad) / CELL), y0 = Math.floor((y - rad) / CELL), y1 = Math.floor((y + rad) / CELL);
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) { const a = cells.get(k(cx, cy)); if (a) for (let i = 0; i < a.length; i++) fn(a[i]); }
}
