import { ac } from './audio.js';
import { NOTE_NAMES, NOTE_PT } from './data.js';

export const freqToMidi = (f) => 69 + 12 * Math.log2(f / 440);

export function noteInfo(freq) {
  const m = freqToMidi(freq);
  const r = Math.round(m);
  const pc = ((r % 12) + 12) % 12;
  return { midi: r, cents: Math.round((m - r) * 100), name: NOTE_NAMES[pc], pt: NOTE_PT[pc], octave: Math.floor(r / 12) - 1 };
}

// Detecção de altura por NSDF (McLeod) — robusta para violão
export function detect(buf, sr) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.006) return { freq: 0, rms, clarity: 0 };
  const minLag = Math.floor(sr / 1100);
  const maxLag = Math.min(Math.floor(sr / 70), buf.length >> 1);
  const W = buf.length - maxLag;
  const nsdf = new Float32Array(maxLag + 2);
  for (let t = minLag; t <= maxLag; t++) {
    let acc = 0, m = 0;
    for (let i = 0; i < W; i++) {
      const a = buf[i], b = buf[i + t];
      acc += a * b;
      m += a * a + b * b;
    }
    nsdf[t] = m > 0 ? (2 * acc) / m : 0;
  }
  let t = minLag;
  while (t <= maxLag && nsdf[t] > 0) t++;
  const peaks = [];
  let best = -1, bestV = 0, inPos = false;
  for (; t <= maxLag; t++) {
    if (nsdf[t] > 0) {
      inPos = true;
      if (nsdf[t] > bestV) { bestV = nsdf[t]; best = t; }
    } else if (inPos) {
      peaks.push(best);
      inPos = false; best = -1; bestV = 0;
    }
  }
  if (!peaks.length) return { freq: 0, rms, clarity: 0 };
  let gmax = 0;
  for (const p of peaks) gmax = Math.max(gmax, nsdf[p]);
  const p = peaks.find((q) => nsdf[q] >= 0.9 * gmax);
  const a = nsdf[p - 1], b = nsdf[p], c = nsdf[p + 1];
  const den = a - 2 * b + c;
  const shift = den !== 0 ? (a - c) / (2 * den) : 0;
  return { freq: sr / (p + shift), rms, clarity: b };
}

export class Mic {
  constructor() { this.on = false; }
  async start(cb) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microfone não disponível neste navegador (precisa de HTTPS).');
    const c = ac();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const src = c.createMediaStreamSource(this.stream);
    this.an = c.createAnalyser();
    this.an.fftSize = 2048;
    src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize);
    this.on = true;
    const loop = () => {
      if (!this.on) return;
      this.an.getFloatTimeDomainData(this.buf);
      cb(detect(this.buf, c.sampleRate));
    };
    this.timer = setInterval(loop, 40);
  }
  stop() {
    this.on = false;
    clearInterval(this.timer);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

// Mantém uma leitura estável (mediana das últimas leituras claras)
export class Stabilizer {
  constructor(n = 5) { this.n = n; this.vals = []; }
  push(r, minClarity = 0.85) {
    if (r.freq > 0 && r.clarity >= minClarity) {
      this.vals.push(r.freq);
      if (this.vals.length > this.n) this.vals.shift();
    } else if (r.freq === 0) {
      this.vals = [];
    }
    if (this.vals.length < 3) return 0;
    const s = [...this.vals].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  }
  reset() { this.vals = []; }
}
