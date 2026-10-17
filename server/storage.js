'use strict';
// Persistence for player profiles & private islands.
//  - DATABASE_URL set  -> PostgreSQL (e.g. free Neon/Supabase/Render Postgres), table kv(key, val jsonb)
//  - otherwise         -> JSON files in ./data (works locally; on Render's free tier the disk is wiped on every restart!)
const fs = require('fs');
const path = require('path');

class FileStore {
  constructor(dir) { this.dir = dir; fs.mkdirSync(dir, { recursive: true }); this.kind = 'file'; }
  _f(key) { return path.join(this.dir, key.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.json'); }
  async get(key) { try { return JSON.parse(await fs.promises.readFile(this._f(key), 'utf8')); } catch (e) { return null; } }
  async set(key, val) { const f = this._f(key), tmp = f + '.tmp'; await fs.promises.writeFile(tmp, JSON.stringify(val)); await fs.promises.rename(tmp, f); }
}
class PgStore {
  constructor(url) {
    const { Pool } = require('pg');
    this.kind = 'postgres';
    this.pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 4 });
    this.ready = this.pool.query('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, val JSONB NOT NULL, updated TIMESTAMPTZ DEFAULT now())');
  }
  async get(key) { await this.ready; const r = await this.pool.query('SELECT val FROM kv WHERE key=$1', [key]); return r.rows[0] ? r.rows[0].val : null; }
  async set(key, val) { await this.ready; await this.pool.query('INSERT INTO kv(key,val,updated) VALUES($1,$2,now()) ON CONFLICT (key) DO UPDATE SET val=$2, updated=now()', [key, JSON.stringify(val)]); }
}
function create() {
  if (process.env.DATABASE_URL) {
    try { const s = new PgStore(process.env.DATABASE_URL); console.log('[storage] PostgreSQL'); return s; } catch (e) { console.error('[storage] pg unavailable, using files:', e.message); }
  }
  console.log('[storage] JSON files in ./data' + (process.env.NODE_ENV === 'production' ? ' (WARNING: ephemeral on Render free tier — set DATABASE_URL)' : ''));
  return new FileStore(path.join(__dirname, '..', 'data'));
}
module.exports = { create, FileStore };
