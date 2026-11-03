// Procedural "Terraria-style" music: plucked-guitar arpeggios, pads, bass, bells, piano and drums, generated live with WebAudio.
// Every mood = scale + chord progression + instruments. Melodies are generated from seeded random phrases (they repeat, so they feel like themes).
const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SC = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], phryg: [0, 1, 4, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10] };
export const MOODS = {
  day:       { root: 60, scale: 'major',  bpm: 98,  prog: [0, 4, 5, 3], arp: 'pluck', pad: 'pad',   bass: 'pluck', mel: 'pluck',  drums: 0, dens: 0.55, melDens: 0.5, vol: 1 },
  night:     { root: 57, scale: 'minor',  bpm: 70,  prog: [0, 5, 2, 6], arp: 'piano', pad: 'pad',   bass: 'sine',  mel: 'bell',   drums: 0, dens: 0.3,  melDens: 0.28, vol: 0.9 },
  forest:    { root: 62, scale: 'mixo',   bpm: 92,  prog: [0, 6, 3, 4], arp: 'pluck', pad: 'pad',   bass: 'pluck', mel: 'flute',  drums: 0, dens: 0.5,  melDens: 0.5, vol: 1 },
  darkforest:{ root: 55, scale: 'dorian', bpm: 76,  prog: [0, 3, 6, 4], arp: 'pluck', pad: 'pad',   bass: 'sine',  mel: 'flute',  drums: 0, dens: 0.38, melDens: 0.35, vol: 0.95 },
  jungle:    { root: 62, scale: 'mixo',   bpm: 112, prog: [0, 3, 0, 4], arp: 'pluck', pad: 'pad',   bass: 'pluck', mel: 'flute',  drums: 1, dens: 0.65, melDens: 0.5, vol: 1 },
  desert:    { root: 57, scale: 'phryg',  bpm: 104, prog: [0, 1, 0, 6], arp: 'pluck', pad: 'drone', bass: 'sine',  mel: 'pluck',  drums: 1, dens: 0.55, melDens: 0.55, vol: 1 },
  volcano:   { root: 50, scale: 'harm',   bpm: 126, prog: [0, 5, 3, 4], arp: 'saw',   pad: 'pad',   bass: 'saw',   mel: 'saw',    drums: 2, dens: 0.7,  melDens: 0.5, vol: 0.9 },
  swamp:     { root: 52, scale: 'minor',  bpm: 66,  prog: [0, 0, 5, 6], arp: 'pluck', pad: 'drone', bass: 'sine',  mel: 'bell',   drums: 0, dens: 0.3,  melDens: 0.3, vol: 0.95 },
  haunted:   { root: 53, scale: 'harm',   bpm: 58,  prog: [0, 5, 3, 4], arp: 'piano', pad: 'organ', bass: 'sine',  mel: 'piano',  drums: 0, dens: 0.4,  melDens: 0.4, vol: 1 },
  snow:      { root: 65, scale: 'lydian', bpm: 78,  prog: [0, 4, 1, 5], arp: 'bell',  pad: 'pad',   bass: 'sine',  mel: 'bell',   drums: 0, dens: 0.45, melDens: 0.45, vol: 0.95 },
  mountain:  { root: 59, scale: 'dorian', bpm: 88,  prog: [0, 6, 4, 5], arp: 'pluck', pad: 'pad',   bass: 'pluck', mel: 'flute',  drums: 0, dens: 0.5,  melDens: 0.5, vol: 1 },
  town:      { root: 60, scale: 'major',  bpm: 112, prog: [0, 3, 4, 0], arp: 'pluck', pad: 'pad',   bass: 'pluck', mel: 'bell',   drums: 0, dens: 0.6,  melDens: 0.6, vol: 1 },
  island:    { root: 64, scale: 'lydian', bpm: 72,  prog: [0, 1, 4, 0], arp: 'bell',  pad: 'pad',   bass: 'sine',  mel: 'flute',  drums: 0, dens: 0.4,  melDens: 0.4, vol: 0.9 },
  boss:      { root: 45, scale: 'harm',   bpm: 148, prog: [0, 5, 6, 4], arp: 'saw',   pad: 'organ', bass: 'saw',   mel: 'saw',    drums: 3, dens: 0.8,  melDens: 0.65, vol: 0.9 },
  bloodmoon: { root: 48, scale: 'phryg',  bpm: 100, prog: [0, 1, 0, 5], arp: 'piano', pad: 'organ', bass: 'saw',   mel: 'bell',   drums: 2, dens: 0.55, melDens: 0.4, vol: 0.95 },
  slimerain: { root: 64, scale: 'major',  bpm: 124, prog: [0, 5, 3, 4], arp: 'bell',  pad: 'pad',   bass: 'pluck', mel: 'pluck',  drums: 1, dens: 0.7,  melDens: 0.65, vol: 0.95 },
  event:     { root: 52, scale: 'minor',  bpm: 120, prog: [0, 6, 5, 4], arp: 'pluck', pad: 'pad',   bass: 'saw',   mel: 'flute',  drums: 2, dens: 0.6,  melDens: 0.5, vol: 0.9 },
};

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };

// ------------------------------------------------------------------ voice factory (works on a live OR offline context)
function voices(ctx, out, verb) {
  const noiseBuf = (() => { const b = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const env = (g, t, a, peak, dur, rel = 0.05) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.4), t + a + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel); };
  const route = (n, wet = 0.2) => { n.connect(out); if (verb) { const s = ctx.createGain(); s.gain.value = wet; n.connect(s); s.connect(verb); } };
  const osc = (type, f, t, dur) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.2); return o; };
  const V = {
    pluck(f, t, dur, v = 0.2) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(8000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.35); env(g, t, 0.004, v, Math.min(dur, 1.4)); const a = osc('sawtooth', f, t, 1.6), b = osc('triangle', f * 2, t, 1.6); const gb = ctx.createGain(); gb.gain.value = 0.35; a.connect(lp); b.connect(gb); gb.connect(lp); lp.connect(g); route(g, 0.22); },
    piano(f, t, dur, v = 0.22) { const g = ctx.createGain(); env(g, t, 0.003, v, Math.min(dur + 0.6, 2.4), 0.2); [[1, 1], [2, 0.5], [3, 0.28], [4, 0.14]].forEach(([m, a]) => { const o = osc('sine', f * m * (m > 1 ? 1.0007 : 1), t, 3), x = ctx.createGain(); x.gain.value = a; o.connect(x); x.connect(g); }); const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 3; const ng = ctx.createGain(); ng.gain.setValueAtTime(v * 0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t); n.stop(t + 0.06); route(g, 0.35); },
    bell(f, t, dur, v = 0.14) { const g = ctx.createGain(); env(g, t, 0.003, v, 1.8, 0.4); [[1, 1], [2.76, 0.35], [5.4, 0.15]].forEach(([m, a]) => { const o = osc('sine', f * m, t, 2.6), x = ctx.createGain(); x.gain.value = a; o.connect(x); x.connect(g); }); route(g, 0.45); },
    flute(f, t, dur, v = 0.13) { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.08); g.gain.setValueAtTime(v, t + Math.max(0.1, dur * 0.8)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15); const o = osc('sine', f, t, dur + 0.3), lfo = osc('sine', 5.2, t, dur + 0.3), lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); const o2 = osc('triangle', f * 2, t, dur + 0.3), g2 = ctx.createGain(); g2.gain.value = 0.18; o.connect(g); o2.connect(g2); g2.connect(g); route(g, 0.4); },
    saw(f, t, dur, v = 0.12) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(5000, f * 5), t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + Math.min(dur, 0.4)); env(g, t, 0.01, v, dur, 0.06); const a = osc('sawtooth', f, t, dur + 0.2), b = osc('square', f * 1.004, t, dur + 0.2); const gb = ctx.createGain(); gb.gain.value = 0.4; a.connect(lp); b.connect(gb); gb.connect(lp); lp.connect(g); route(g, 0.15); },
    sine(f, t, dur, v = 0.26) { const g = ctx.createGain(); env(g, t, 0.01, v, Math.min(dur, 1.3), 0.15); const o = osc('sine', f, t, 2); o.connect(g); route(g, 0.08); },
    pad(freqs, t, dur, v = 0.07) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(1.6, dur * 0.4)); g.gain.setValueAtTime(v, t + dur - 1.0); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.8); freqs.forEach((f) => { [['triangle', 0.997], ['sine', 1.003]].forEach(([ty, d]) => { const o = osc(ty, f * d, t, dur + 1); o.connect(lp); }); }); lp.connect(g); route(g, 0.5); },
    organ(freqs, t, dur, v = 0.06) { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.5); g.gain.setValueAtTime(v, t + dur - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6); freqs.forEach((f) => [1, 2, 3, 4].forEach((m, i) => { const o = osc('sine', f * m, t, dur + 1), x = ctx.createGain(); x.gain.value = [1, 0.5, 0.3, 0.18][i]; o.connect(x); x.connect(g); })); route(g, 0.55); },
    drone(freqs, t, dur, v = 0.07) { V.pad(freqs.slice(0, 2).map((f) => f / 2), t, dur, v); },
    kick(t, v = 0.5) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3); },
    snare(t, v = 0.25) { const n = ctx.createBufferSource(); n.buffer = noiseBuf; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); n.connect(hp); hp.connect(g); route(g, 0.2); n.start(t); n.stop(t + 0.2); },
    hat(t, v = 0.07) { const n = ctx.createBufferSource(); n.buffer = noiseBuf; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); n.connect(hp); hp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.07); },
    tom(t, v = 0.3, f = 90) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); route(g, 0.2); o.start(t); o.stop(t + 0.35); },
  };
  return V;
}

// ------------------------------------------------------------------ one mood's composer: schedule(step, time) plays 1/16th note "step"
function composer(mood, name, V) {
  const M = MOODS[mood], sc = SC[M.scale], stepDur = 60 / M.bpm / 4, seed0 = hashStr(name || mood);
  const degMidi = (d, oct = 0) => { const n = sc.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return M.root + sc[i] + 12 * (o + oct); };
  const chord = (deg, oct = 0) => [degMidi(deg, oct), degMidi(deg + 2, oct), degMidi(deg + 4, oct)];
  const ARP = [[0, 1, 2, 1, 0, 1, 2, 1], [0, 2, 1, 2, 0, 2, 1, 2], [0, 1, 2, 3, 2, 1, 2, 1]];
  const RH = [[0, 4, 8, 12], [0, 3, 6, 10, 12], [0, 2, 4, 8, 10, 12], [0, 6, 8, 14], [0, 4, 6, 8, 12, 14]];
  const melCache = new Map();
  function phrase(idx) {
    if (melCache.has(idx)) return melCache.get(idx);
    const r = rng(seed0 + (idx % 4) * 977), ev = [], rh = RH[Math.floor(r() * RH.length)]; let deg = 7 + Math.floor(r() * 3);
    for (const bar of [0, 1]) rh.forEach((st, k) => { if (r() > M.melDens + (k === 0 ? 0.5 : 0)) return; const step = bar * 16 + st; deg += Math.floor(r() * 5) - 2; deg = Math.max(4, Math.min(12, deg)); const next = rh[k + 1] !== undefined ? rh[k + 1] : 16; ev.push({ step, deg, dur: Math.max(1, (next - st) * (r() < 0.3 ? 1.5 : 0.9)) }); });
    melCache.set(idx, ev); return ev;
  }
  return {
    stepDur, bars: M.prog.length,
    schedule(i, t) {
      const bar = Math.floor(i / 16), s = i % 16, deg = M.prog[bar % M.prog.length], vol = M.vol, barDur = stepDur * 16;
      const ch = chord(deg), r = rng(seed0 + i * 13);
      if (s === 0) { const pf = ch.map((m) => NOTE(m - 12)); (M.pad === 'organ' ? V.organ : M.pad === 'drone' ? V.drone : V.pad)(pf, t, barDur * 0.98, 0.07 * vol); }
      const bf = NOTE(degMidi(deg, -2));
      if (M.drums >= 2 ? s % 4 === 0 : (s === 0 || s === 8 || (s === 14 && r() < 0.3))) V[M.bass === 'saw' ? 'saw' : M.bass](bf, t, stepDur * (M.drums >= 2 ? 3 : 7), M.bass === 'saw' ? 0.1 * vol : 0.24 * vol);
      if (s % 2 === 0 && r() < M.dens + 0.2) { const pat = ARP[(bar + (seed0 & 3)) % ARP.length], idx = pat[(s / 2) % pat.length], notes = chord(deg, 0).concat([degMidi(deg + 7, 0)]); V[M.arp](NOTE(notes[idx % notes.length] + (M.arp === 'saw' ? -12 : 0)), t, stepDur * 3, (M.arp === 'saw' ? 0.07 : 0.17) * vol); }
      const pb = Math.floor(bar / 2), inPhrase = (bar % 2) * 16 + s;
      if (pb % 2 === 0 || M.melDens > 0.55) for (const ev of phrase(Math.floor(pb / (M.melDens > 0.55 ? 1 : 2)))) if (ev.step === inPhrase) V[M.mel](NOTE(degMidi(ev.deg, 0)), t, ev.dur * stepDur, (M.mel === 'saw' ? 0.09 : M.mel === 'flute' ? 0.13 : 0.15) * vol);
      if (M.drums) {
        const d = M.drums;
        if (s === 0 || s === 8 || (d >= 2 && (s === 6 || s === 14)) || (d === 3 && s % 4 === 0)) V.kick(t, 0.45);
        if (s === 4 || s === 12) V.snare(t, d >= 2 ? 0.28 : 0.16);
        if (s % 2 === 0 && d >= 1) V.hat(t, d === 1 ? 0.04 : 0.07);
        if (d === 1 && (s === 3 || s === 11)) V.tom(t, 0.18, 110 + (s === 3 ? 30 : 0));
        if (d === 3 && (s === 14 || s === 15)) V.tom(t, 0.3, 80);
      }
    },
  };
}
const mkReverb = (ctx) => { const len = ctx.sampleRate * 2.4, b = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); } const cv = ctx.createConvolver(); cv.buffer = b; return cv; };

// ------------------------------------------------------------------ live player
let ctx = null, master = null, verb = null, current = null, timer = null, enabled = true, volume = parseFloat(localStorage.getItem('rf_vol') || '0.5');
const state = { name: null, comp: null, V: null, gain: null, vb: null, step: 0, next: 0 };
export function start() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const comp = ctx.createDynamicsCompressor(); master = ctx.createGain(); master.gain.value = enabled ? volume * 0.5 : 0; master.connect(comp); comp.connect(ctx.destination);
  verb = mkReverb(ctx); const vg = ctx.createGain(); vg.gain.value = 0.5; verb.connect(vg); vg.connect(master);
  timer = setInterval(tick, 40); if (current) setMood(current);
}
function tick() {
  if (!ctx || !state.comp) return;
  while (state.next < ctx.currentTime + 0.3) { state.comp.schedule(state.step, state.next); state.next += state.comp.stepDur; state.step++; }
}
export function setMood(name) {
  current = name; if (!ctx || state.name === name || !MOODS[name]) return;
  const now = ctx.currentTime;
  for (const old of [state.gain, state.vb]) if (old) { old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0.0001, now + 1.6); }
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(1, now + 2.2); g.connect(master);
  const vb = ctx.createGain(); vb.gain.setValueAtTime(0.0001, now); vb.gain.linearRampToValueAtTime(1, now + 2.2); vb.connect(verb);
  const V = voices(ctx, g, vb);
  state.name = name; state.comp = composer(name, name, V); state.V = V; state.gain = g; state.vb = vb; state.step = 0; state.next = now + 0.15;
}
export function setEnabled(on) { enabled = on; if (master) master.gain.setTargetAtTime(on ? volume * 0.5 : 0, ctx.currentTime, 0.2); localStorage.setItem('rf_music', on ? '1' : '0'); }
export function setVolume(v) { volume = v; localStorage.setItem('rf_vol', String(v)); if (master && enabled) master.gain.setTargetAtTime(volume * 0.5, ctx.currentTime, 0.1); }
export const isEnabled = () => enabled; export const getVolume = () => volume;
enabled = localStorage.getItem('rf_music') !== '0';

// ------------------------------------------------------------------ offline render (used by automated tests, also handy to export a track)
export async function renderOffline(mood, seconds = 20, sampleRate = 22050) {
  const oc = new OfflineAudioContext(2, sampleRate * seconds, sampleRate), master2 = oc.createGain(); master2.gain.value = 0.5; master2.connect(oc.destination);
  const v2 = mkReverb(oc), vg = oc.createGain(); vg.gain.value = 0.5; v2.connect(vg); vg.connect(master2);
  const V = voices(oc, master2, v2), comp = composer(mood, mood, V); for (let i = 0, t = 0.05; t < seconds - 0.5; i++, t += comp.stepDur) comp.schedule(i, t);
  const buf = await oc.startRendering(), d = buf.getChannelData(0); let peak = 0, sum = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; }
  return { peak, rms: Math.sqrt(sum / d.length), seconds };
}
