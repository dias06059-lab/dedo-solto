import { CHORDS, OPEN_CHORDS, BARRE_CHORDS, PRESETS, label, transitionTips, CHANGE_TIPS, chordNotes } from '../data.js';
import { chordSVG } from '../diagram.js';
import { store, save, addPractice, markRoutine, today } from '../store.js';
import { $, $$, openOverlay, closeOverlay, toast, fmtTime } from '../ui.js';
import { beep, Metronome, strum } from '../audio.js';

let root, mode = 'minute', running = null;

export const title = 'Trocas de acordes';

export function mount(el, params = {}) {
  root = el;
  if (params.chords) { store.sel = params.chords; save(); }
  if (params.mode) mode = params.mode;
  render();
}
export function unmount() { stopAll(); }

const key = () => store.sel.join('-');

function render() {
  const sel = store.sel;
  const pool = [...OPEN_CHORDS, ...BARRE_CHORDS.filter((k) => !k.includes('_'))];
  const hist = store.minute[key()] || [];
  const best = hist.length ? Math.max(...hist.map((h) => h.n)) : null;
  root.innerHTML = `
  <section class="card">
    <h2>1. Escolha os acordes</h2>
    <p class="muted">Toque nos acordes na ordem em que quer trocar, ou use uma sequência pronta.</p>
    <div class="row-scroll">${PRESETS.map((p, i) => `<button class="chip ghost" data-preset="${i}">${p.name}</button>`).join('')}</div>
    <div class="chips">${pool.map((k) => {
      const i = sel.indexOf(k);
      return `<button class="chip ${i >= 0 ? 'on' : ''}" data-chord="${k}">${label(k)}${i >= 0 ? `<sup>${i + 1}</sup>` : ''}</button>`;
    }).join('')}</div>
  </section>

  <section class="card">
    <div class="diagrams">${sel.map((k) => `<figure><figcaption>${label(k)}</figcaption>${chordSVG(k)}<button class="mini" data-hear="${k}">🔊 ouvir</button></figure>`).join('')}</div>
    ${sel.length < 2 ? '<p class="warn">Escolha pelo menos 2 acordes.</p>' : `
    <details class="tips" open><summary>Como trocar mais rápido</summary>
      ${pairs(sel).map(([a, b]) => `<h4>${label(a)} → ${label(b)}</h4><ul>${transitionTips(a, b).map((t) => `<li>${t}</li>`).join('')}</ul>`).join('')}
    </details>`}
  </section>

  <section class="card">
    <h2>2. Escolha o treino</h2>
    <div class="seg">
      <button data-mode="minute" class="${mode === 'minute' ? 'on' : ''}">⏱️ Minuto de trocas</button>
      <button data-mode="metro" class="${mode === 'metro' ? 'on' : ''}">🥁 Com metrônomo</button>
    </div>
    ${mode === 'minute' ? `
      <p>Durante <b>1 minuto</b>, troque entre os acordes o mais rápido que conseguir, tocando uma batida em cada um. No fim, informe quantas trocas fez. Faça todo dia e veja o número subir.</p>
      <p class="stat">Seu recorde: <b>${best ?? '—'}</b> ${hist.length ? `· último: ${hist[hist.length - 1].n}` : ''}</p>
      ${hist.length > 1 ? sparkline(hist.slice(-14).map((h) => h.n)) : ''}
      <button class="btn big" id="go" ${sel.length < 2 ? 'disabled' : ''}>Começar 1 minuto</button>
    ` : `
      <p>O metrônomo marca o tempo e a tela mostra o próximo acorde. Troque <b>no tempo</b>, sem parar a batida. Comece lento!</p>
      <label class="field">Velocidade: <b id="bpmv">${store.bpm[key()] || 60}</b> BPM
        <input type="range" id="bpm" min="30" max="180" step="2" value="${store.bpm[key()] || 60}"></label>
      <label class="field">Trocar a cada
        <select id="bpc"><option value="8">2 compassos (8 tempos)</option><option value="4" selected>1 compasso (4 tempos)</option><option value="2">2 tempos</option><option value="1">1 tempo</option></select></label>
      <label class="check"><input type="checkbox" id="accel" checked> Acelerar +4 BPM a cada 4 trocas</label>
      <p class="stat">Maior velocidade já alcançada: <b>${store.bpmBest[key()] || '—'}</b> BPM</p>
      <button class="btn big" id="go" ${sel.length < 2 ? 'disabled' : ''}>Começar com metrônomo</button>
    `}
  </section>

  <section class="card">
    <h3>Dicas gerais</h3>
    <ul>${CHANGE_TIPS.map((t) => `<li>${t}</li>`).join('')}</ul>
  </section>`;

  $$('[data-chord]', root).forEach((b) => b.onclick = () => {
    const k = b.dataset.chord;
    const i = store.sel.indexOf(k);
    if (i >= 0) store.sel.splice(i, 1);
    else if (store.sel.length < 6) store.sel.push(k);
    save(); render();
  });
  $$('[data-preset]', root).forEach((b) => b.onclick = () => { store.sel = [...PRESETS[b.dataset.preset].chords]; save(); render(); });
  $$('[data-mode]', root).forEach((b) => b.onclick = () => { mode = b.dataset.mode; render(); });
  $$('[data-hear]', root).forEach((b) => b.onclick = () => strum(chordNotes(b.dataset.hear)));
  const bpm = $('#bpm', root);
  if (bpm) bpm.oninput = () => { $('#bpmv', root).textContent = bpm.value; store.bpm[key()] = +bpm.value; save(); };
  const go = $('#go', root);
  if (go) go.onclick = () => (mode === 'minute' ? runMinute() : runMetro());
}

const pairs = (sel) => sel.map((a, i) => [a, sel[(i + 1) % sel.length]]).slice(0, sel.length === 2 ? 1 : sel.length);

function sparkline(vals) {
  const w = 260, h = 50, max = Math.max(...vals, 10), min = 0;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 6) - 3}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

function stopAll() {
  if (running) { running(); running = null; }
}

// ---------- Minuto de trocas ----------
function runMinute() {
  const sel = [...store.sel];
  const ov = openOverlay(`
    <div class="runner">
      <div class="runner-top"><span>Minuto de trocas</span><button class="x" id="stop">✕</button></div>
      <div class="big-count" id="count">3</div>
      <div class="diagrams lg">${sel.map((k) => `<figure><figcaption>${label(k)}</figcaption>${chordSVG(k)}</figure>`).join('')}</div>
      <p class="muted center" id="msg">Prepare a mão no primeiro acorde…</p>
    </div>`, () => stopAll());
  $('#stop', ov).onclick = () => closeOverlay();
  let t = 3, phase = 'ready', started = 0;
  beep(660);
  const timer = setInterval(() => {
    if (phase === 'ready') {
      t--;
      if (t > 0) { $('#count', ov).textContent = t; beep(660); }
      else {
        phase = 'go'; t = 60; started = Date.now();
        beep(1100, 0.35);
        $('#msg', ov).textContent = 'Troque! Uma batida em cada acorde. Conte as trocas.';
        $('#count', ov).textContent = fmtTime(t);
      }
    } else {
      t = 60 - Math.floor((Date.now() - started) / 1000);
      $('#count', ov).textContent = fmtTime(Math.max(0, t));
      if (t <= 3 && t > 0) beep(880, 0.08);
      if (t <= 0) { clearInterval(timer); running = null; beep(1100, 0.6); finish(); }
    }
  }, 1000);
  running = () => clearInterval(timer);

  function finish() {
    addPractice(60);
    markRoutine('changes');
    const hist = store.minute[key()] || [];
    const last = hist.length ? hist[hist.length - 1].n : 20;
    $('.runner', ov).innerHTML = `
      <div class="runner-top"><span>Tempo!</span><button class="x" id="stop">✕</button></div>
      <h2 class="center">Quantas trocas você fez?</h2>
      <div class="stepper"><button id="m5">−5</button><button id="m1">−1</button><input id="n" type="number" inputmode="numeric" value="${last}"><button id="p1">+1</button><button id="p5">+5</button></div>
      <button class="btn big" id="saveN">Salvar</button>`;
    $('#stop', ov).onclick = () => closeOverlay();
    const n = $('#n', ov);
    [['m5', -5], ['m1', -1], ['p1', 1], ['p5', 5]].forEach(([id, d]) => $('#' + id, ov).onclick = () => { n.value = Math.max(0, (+n.value || 0) + d); });
    $('#saveN', ov).onclick = () => {
      const v = Math.max(0, Math.round(+n.value || 0));
      const prevBest = hist.length ? Math.max(...hist.map((h) => h.n)) : 0;
      hist.push({ d: today(), n: v });
      store.minute[key()] = hist.slice(-60);
      save();
      closeOverlay();
      const lvl = v < 15 ? 'Normal no começo! Foque em mover os dedos <b>juntos</b>.' : v < 30 ? 'Bom! Os dedos estão aprendendo o caminho.' : v < 45 ? 'Ótimo — já está ficando fluido!' : 'Excelente! Tente com metrônomo ou outro par.';
      toast((v > prevBest && hist.length > 1 ? '🏆 Novo recorde! ' : '') + lvl);
      render();
    };
  }
}

// ---------- Trocas com metrônomo ----------
function runMetro() {
  const sel = [...store.sel];
  const bpc = +$('#bpc', root).value;
  const accel = $('#accel', root).checked;
  const met = new Metronome();
  met.bpm = store.bpm[key()] || 60;
  const startBpm = met.bpm;
  let maxBpm = met.bpm;
  const t0 = Date.now();
  const ov = openOverlay(`
    <div class="runner">
      <div class="runner-top"><span id="bpmShow">${met.bpm} BPM</span><button class="x" id="stop">✕</button></div>
      <div class="beats">${[0, 1, 2, 3].map((i) => `<i data-b="${i}"></i>`).join('')}</div>
      <div class="now-chord" id="now">Prepare-se</div>
      <div id="nowDia" class="dia-lg"></div>
      <div class="next" id="next">primeiro: <b>${label(sel[0])}</b></div>
      <div class="ctrl"><button id="slower">− lento</button><button id="faster">+ rápido</button></div>
    </div>`, () => stopAll());
  $('#stop', ov).onclick = () => closeOverlay();
  $('#slower', ov).onclick = () => { met.bpm = Math.max(30, met.bpm - 4); $('#bpmShow', ov).textContent = met.bpm + ' BPM'; };
  $('#faster', ov).onclick = () => { met.bpm = Math.min(220, met.bpm + 4); maxBpm = Math.max(maxBpm, met.bpm); $('#bpmShow', ov).textContent = met.bpm + ' BPM'; };
  const COUNT_IN = 4;
  let lastIdx = -1;
  met.onBeat = (b) => {
    $$('.beats i', ov).forEach((d, i) => d.classList.toggle('on', i === b % 4));
    if (b < COUNT_IN) { $('#now', ov).textContent = String(COUNT_IN - b); return; }
    const k = b - COUNT_IN;
    const idx = Math.floor(k / bpc);
    if (idx !== lastIdx) {
      lastIdx = idx;
      const cur = sel[idx % sel.length], nxt = sel[(idx + 1) % sel.length];
      $('#now', ov).textContent = label(cur);
      $('#nowDia', ov).innerHTML = chordSVG(cur);
      $('#next', ov).innerHTML = `próximo: <b>${label(nxt)}</b>`;
      if (accel && idx > 0 && idx % 4 === 0) {
        met.bpm = Math.min(220, met.bpm + 4);
        maxBpm = Math.max(maxBpm, met.bpm);
        $('#bpmShow', ov).textContent = met.bpm + ' BPM';
      }
    }
    // pisca o "próximo" no último tempo antes da troca
    $('#next', ov).classList.toggle('flash', (k % bpc) === bpc - 1);
  };
  met.start();
  running = () => {
    met.stop();
    const secs = (Date.now() - t0) / 1000;
    addPractice(secs);
    if (secs > 45) markRoutine('changes');
    if (maxBpm > (store.bpmBest[key()] || 0) && secs > 20) {
      store.bpmBest[key()] = maxBpm;
      toast(`🏆 Nova velocidade máxima: ${maxBpm} BPM`);
    }
    store.bpm[key()] = startBpm;
    save();
    setTimeout(render, 50);
  };
}
