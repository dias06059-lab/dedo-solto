let ctx = null;
let master = null;

export function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const out = () => (ac(), master);
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Corda dedilhada (Karplus-Strong) — buffers em cache
const cache = new Map();
function pluckBuffer(freq, dur = 3) {
  const c = ac();
  const key = freq.toFixed(2) + ':' + dur;
  if (cache.has(key)) return cache.get(key);
  const sr = c.sampleRate;
  const period = sr / freq;
  // atraso total = N + 0,5 (filtro de média) + d (passa-tudo) = período
  const N = Math.floor(period - 1);
  const d = period - 0.5 - N; // entre 0,5 e 1,5
  const len = Math.floor(sr * dur);
  const buffer = c.createBuffer(1, len, sr);
  const out = buffer.getChannelData(0);
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = Math.random() * 2 - 1;
  // suaviza a excitação (som menos metálico)
  for (let k = 0; k < 2; k++) for (let i = 1; i < N; i++) line[i] = 0.5 * (line[i] + line[i - 1]);
  const decay = freq < 150 ? 0.998 : freq < 300 ? 0.996 : 0.993;
  const C = (1 - d) / (1 + d);
  let idx = 0, apX = 0, apY = 0, prev = 0;
  for (let i = 0; i < len; i++) {
    const v = line[idx];
    out[i] = v;
    const avg = decay * 0.5 * (v + prev);
    prev = v;
    // filtro passa-tudo de 1ª ordem
    const y = C * avg + apX - C * apY;
    apX = avg; apY = y;
    line[idx] = y;
    idx = (idx + 1) % N;
  }
  // fade-out
  const f = Math.floor(sr * 0.05);
  for (let i = 0; i < f; i++) out[len - 1 - i] *= i / f;
  cache.set(key, buffer);
  return buffer;
}

export function pluck(midi, when = 0, vol = 0.5, dur = 3) {
  const c = ac();
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(mtof(midi), dur);
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(g).connect(out());
  src.start(when || c.currentTime);
  return { src, g };
}

// Toca um acorde (array de midi, grave→agudo) como batida ou arpejo
export function strum(notes, { arp = false, gap = arp ? 0.28 : 0.035, vol = 0.3, when = 0 } = {}) {
  const c = ac();
  const t0 = (when || c.currentTime) + 0.03;
  notes.forEach((m, i) => pluck(m, t0 + i * gap, vol));
  return t0 + notes.length * gap;
}

// Tom limpo (para comparar afinação fina)
export function tone(freq, when, dur = 0.8, vol = 0.25) {
  const c = ac();
  const t = when || c.currentTime + 0.02;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.setValueAtTime(vol, t + dur - 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out());
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function click(when, accent = false) {
  const c = ac();
  const o = c.createOscillator();
  o.frequency.value = accent ? 1600 : 1000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.5, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  o.connect(g).connect(out());
  o.start(when);
  o.stop(when + 0.06);
}

export function beep(freq = 880, dur = 0.15, delay = 0) {
  const c = ac();
  const t = c.currentTime + 0.01 + delay;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out());
  o.start(t);
  o.stop(t + dur + 0.02);
}

export class Metronome {
  constructor() {
    this.bpm = 60;
    this.beatsPerBar = 4;
    this.onBeat = null;
    this.running = false;
    this.timers = [];
  }
  start() {
    const c = ac();
    this.running = true;
    this.beat = 0;
    this.next = c.currentTime + 0.15;
    this.interval = setInterval(() => this._schedule(), 25);
    this._schedule();
  }
  _schedule() {
    const c = ac();
    while (this.running && this.next < c.currentTime + 0.12) {
      const b = this.beat;
      click(this.next, b % this.beatsPerBar === 0);
      const delay = Math.max(0, (this.next - c.currentTime) * 1000);
      const t = setTimeout(() => { if (this.running && this.onBeat) this.onBeat(b); }, delay);
      this.timers.push(t);
      if (this.timers.length > 50) this.timers.splice(0, 25);
      this.next += 60 / this.bpm;
      this.beat++;
    }
  }
  stop() {
    this.running = false;
    clearInterval(this.interval);
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
