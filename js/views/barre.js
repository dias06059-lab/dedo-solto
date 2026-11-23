import { CHORDS, BARRE_CHORDS, BARRE_TIPS, STRING_MIDI, STRING_NAMES, label, midiName, midiPt, chordNotes } from '../data.js';
import { chordSVG } from '../diagram.js';
import { store, save, addPractice, markRoutine, today } from '../store.js';
import { $, $$, openOverlay, closeOverlay, toast } from '../ui.js';
import { beep, strum, pluck } from '../audio.js';
import { Mic, Stabilizer, freqToMidi } from '../pitch.js';

export const title = 'Pestana';
let root, cleanup = null;

// Programa de exercícios — cada passo: [texto, segundos, tipo, acorde?]
export const EXERCISES = [
  {
    id: 'mini', name: 'Mini-pestana (2 cordas)', lvl: 'Fácil',
    desc: 'Deite o indicador só nas cordas 1 e 2 na <b>casa 5</b>. Toque as duas cordas: precisam soar limpas. Ensina a posição sem exigir força.',
    steps: () => rep(4, [['Segure a mini-pestana (casa 5, cordas 1–2) e toque', 20, 'hold'], ['Solte e relaxe a mão', 10, 'rest']]),
  },
  {
    id: 'squeeze', name: 'Aperta e solta', lvl: 'Fácil',
    desc: 'Pestana completa na <b>casa 5</b>. Aperte só o suficiente para as cordas soarem, depois solte <b>sem tirar o dedo</b> da corda. Treina força com relaxamento.',
    steps: () => rep(10, [['Aperte (pestana na casa 5)', 3, 'hold'], ['Solte sem tirar o dedo', 3, 'rest']]),
  },
  {
    id: 'slide', name: 'Pestana descendo o braço', lvl: 'Médio',
    desc: 'Faça a pestana na casa 7 e vá descendo uma casa por vez até a casa 1. Toque corda por corda em cada casa. Lá em cima é mais fácil; você vai se acostumando aos poucos.',
    steps: () => [7, 6, 5, 4, 3, 2, 1].flatMap((c) => [[`Pestana na casa ${c} — toque corda por corda`, 15, 'hold'], ['Relaxe e desça uma casa', 5, 'rest']]),
  },
  {
    id: 'buildF', name: 'Construindo o Fá (F)', lvl: 'Médio',
    desc: 'Monta o F em 3 etapas: pequeno (4 cordas), sem a 6ª corda, e completo. Volte uma etapa se as cordas não soarem.',
    steps: () => rep(2, [
      ['F pequeno — segure e toque', 20, 'hold', 'F_peq'], ['Relaxe', 8, 'rest'],
      ['F sem a 6ª corda — segure e toque', 20, 'hold', 'F_5'], ['Relaxe', 8, 'rest'],
      ['F completo — segure e toque', 20, 'hold', 'F'], ['Relaxe', 10, 'rest'],
    ]),
  },
  {
    id: 'shape', name: 'Montar e desmontar o formato', lvl: 'Médio',
    desc: 'Monte o F completo, toque, tire a mão do braço (uns 2 cm) e monte de novo. Treina a mão a “cair” no formato certo de uma vez.',
    steps: () => rep(8, [['Monte o F e toque', 4, 'hold', 'F'], ['Tire a mão e relaxe', 4, 'rest']]),
  },
];

const rep = (n, arr) => Array.from({ length: n }, () => arr).flat();

export function mount(el, params = {}) {
  root = el;
  render();
  if (params.exercise) {
    const ex = EXERCISES.find((e) => e.id === params.exercise);
    if (ex) runExercise(ex);
  }
}
export function unmount() { if (cleanup) cleanup(); cleanup = null; }

function render() {
  const total = (ex) => ex.steps().reduce((s, x) => s + x[1], 0);
  root.innerHTML = `
  <section class="card">
    <h2>Por que a pestana é difícil?</h2>
    <p>Não é só força: é <b>posição</b>. Com o dedo no lugar certo e o polegar bem colocado, a força necessária cai muito. Siga os exercícios em ordem — leva algumas semanas, é normal.</p>
    <details class="tips"><summary>8 dicas que fazem diferença</summary><ul>${BARRE_TIPS.map((t) => `<li>${t}</li>`).join('')}</ul></details>
  </section>

  <section class="card">
    <h2>Exercícios guiados</h2>
    <p class="muted">O app marca o tempo e avisa com um bipe quando segurar e quando relaxar.</p>
    <div class="list">${EXERCISES.map((ex) => `
      <div class="item">
        <div><h4>${ex.name} <span class="tag">${ex.lvl}</span></h4><p>${ex.desc}</p><span class="muted">≈ ${Math.round(total(ex) / 60)} min</span></div>
        <button class="btn" data-ex="${ex.id}">Iniciar</button>
      </div>`).join('')}
      <div class="item">
        <div><h4>Troca Am → F com metrônomo <span class="tag">Desafio</span></h4><p>O F é o “desenho” do Am uma corda acima (com os dedos 2, 3 e 4) + a pestana. Ótimo treino para levar o F pra música.</p></div>
        <button class="btn" data-go="changes">Abrir</button>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>🎤 Verificador de pestana</h2>
    <p>Monte o acorde e toque <b>uma corda por vez</b>. O app escuta pelo microfone e diz quais cordas estão soando certo e quais estão abafadas ou soltas.</p>
    <div class="chips">${BARRE_CHORDS.map((k) => `<button class="chip" data-check="${k}">${label(k)}${lastCheck(k)}</button>`).join('')}</div>
  </section>`;

  $$('[data-ex]', root).forEach((b) => b.onclick = () => runExercise(EXERCISES.find((e) => e.id === b.dataset.ex)));
  $$('[data-check]', root).forEach((b) => b.onclick = () => runChecker(b.dataset.check));
  $('[data-go]', root).onclick = () => window.app.go('changes', { chords: ['Am', 'F'], mode: 'metro' });
}

function lastCheck(k) {
  const h = store.barre[k];
  if (!h?.length) return '';
  const l = h[h.length - 1];
  return ` <small>${l.ok}/${l.total}</small>`;
}

// ---------- Exercício com tempo ----------
function runExercise(ex) {
  const steps = ex.steps();
  let i = -1, left = 0, paused = false, elapsed = 0;
  const ov = openOverlay(`
    <div class="runner">
      <div class="runner-top"><span>${ex.name}</span><button class="x" id="stop">✕</button></div>
      <div class="phase" id="phase"></div>
      <div class="big-count" id="count"></div>
      <div id="dia" class="dia-lg"></div>
      <div class="progress"><i id="bar"></i></div>
      <p class="muted center" id="stepn"></p>
      <div class="ctrl"><button id="pause">⏸ Pausar</button><button id="skip">⏭ Pular</button></div>
    </div>`, () => { clearInterval(timer); addPractice(elapsed); cleanup = null; });
  cleanup = () => closeOverlay();
  $('#stop', ov).onclick = () => closeOverlay();
  $('#pause', ov).onclick = (e) => { paused = !paused; e.target.textContent = paused ? '▶ Continuar' : '⏸ Pausar'; };
  $('#skip', ov).onclick = () => next();
  function next() {
    i++;
    if (i >= steps.length) {
      clearInterval(timer);
      beep(1100, 0.5);
      markRoutine('barre');
      $('.runner', ov).innerHTML = `<div class="runner-top"><span>${ex.name}</span><button class="x" id="stop">✕</button></div>
        <div class="done">✅</div><h2 class="center">Exercício concluído!</h2>
        <p class="center muted">Sacuda e relaxe a mão. Se sentiu dor aguda, descanse até amanhã.</p>
        <button class="btn big" id="ok">Fechar</button>`;
      $('#stop', ov).onclick = $('#ok', ov).onclick = () => closeOverlay();
      return;
    }
    const [txt, secs, kind, chord] = steps[i];
    left = secs;
    const ph = $('#phase', ov);
    ph.textContent = txt;
    ph.className = 'phase ' + kind;
    $('#dia', ov).innerHTML = chord ? `<h3 class="center">${label(chord)}</h3>${chordSVG(chord)}` : '';
    $('#count', ov).textContent = left;
    $('#stepn', ov).textContent = `Etapa ${i + 1} de ${steps.length}`;
    $('#bar', ov).style.width = `${(i / steps.length) * 100}%`;
    kind === 'hold' ? beep(990, 0.2) : beep(520, 0.25);
  }
  next();
  const timer = setInterval(() => {
    if (paused) return;
    elapsed++;
    left--;
    if (left <= 0) next();
    else $('#count', ov).textContent = left;
  }, 1000);
}

// ---------- Verificador corda por corda ----------
async function runChecker(k) {
  const ch = CHORDS[k];
  const strings = ch.frets.map((f, s) => ({ s, f, target: f >= 0 ? STRING_MIDI[s] + f : null })).filter((x) => x.target !== null);
  const results = {};
  let cur = 0, mic = new Mic(), stab = new Stabilizer(5), waitUntil = 0, startedAt = 0, stableCount = 0, lastMidi = null, finished = false, sawEnergy = false;

  const ov = openOverlay(`
    <div class="runner">
      <div class="runner-top"><span>Verificar ${label(k)}</span><button class="x" id="stop">✕</button></div>
      <div id="dia" class="dia-lg"></div>
      <div class="phase hold" id="ask"></div>
      <div class="heard" id="heard">—</div>
      <ul class="strings" id="list"></ul>
      <div class="ctrl"><button id="hear">🔊 Como deve soar</button><button id="skip">⏭ Pular corda</button></div>
    </div>`, () => { mic.stop(); cleanup = null; });
  cleanup = () => closeOverlay();
  $('#stop', ov).onclick = () => closeOverlay();
  $('#hear', ov).onclick = () => {
    if (finished) { strum(chordNotes(k)); return; }
    pluck(strings[cur].target, 0, 0.6);
    waitUntil = Date.now() + 1800; // não escutar o próprio som do app
  };
  $('#skip', ov).onclick = () => { if (!finished) decide('skip'); };

  function drawList() {
    $('#list', ov).innerHTML = strings.map((x, i) => {
      const r = results[x.s];
      const cls = r ? r.cls : i === cur && !finished ? 'cur' : '';
      return `<li class="${cls}"><b>${STRING_NAMES[x.s]}</b><span>${r ? r.msg : i === cur && !finished ? 'toque agora…' : 'casa ' + x.f + ' · ' + midiPt(x.target)}</span></li>`;
    }).join('');
  }
  function showCur() {
    const x = strings[cur];
    $('#dia', ov).innerHTML = chordSVG(k, { highlight: x.s });
    $('#ask', ov).innerHTML = `Toque só a corda <b>${STRING_NAMES[x.s]}</b> e deixe soar`;
    $('#heard', ov).textContent = '—';
    stab.reset(); stableCount = 0; lastMidi = null; sawEnergy = false;
    waitUntil = Date.now() + 700;
    startedAt = Date.now();
    drawList();
  }
  function decide(kind, midi) {
    const x = strings[cur];
    const msgs = {
      ok: ['ok', '✅ soando limpa'],
      open: ['bad', '⚠️ soou como corda solta — o dedo não está pressionando ela'],
      wrong: ['bad', `⚠️ ouvi ${midi ? midiPt(midi) : '?'} (esperado ${midiPt(x.target)}) — corda errada ou dedo fora do lugar`],
      mute: ['bad', '❌ abafada / sem som claro — encoste menos os outros dedos ou ajuste o indicador'],
      skip: ['skip', '— pulada'],
    };
    const [cls, msg] = msgs[kind];
    results[x.s] = { cls, msg, ok: kind === 'ok' };
    kind === 'ok' ? beep(1200, 0.12) : kind !== 'skip' && beep(300, 0.25);
    cur++;
    if (cur >= strings.length) return finish();
    setTimeout(showCur, 500);
    waitUntil = Date.now() + 1200;
  }
  function finish() {
    finished = true;
    mic.stop();
    const ok = Object.values(results).filter((r) => r.ok).length;
    const h = (store.barre[k] = store.barre[k] || []);
    h.push({ d: today(), ok, total: strings.length });
    store.barre[k] = h.slice(-30);
    save();
    addPractice((Date.now() - t0) / 1000);
    markRoutine('barre');
    $('#dia', ov).innerHTML = chordSVG(k);
    $('#ask', ov).innerHTML = ok === strings.length ? '🎉 Todas as cordas soaram! Agora toque o acorde inteiro.' : `${ok} de ${strings.length} cordas limpas. Ajuste as marcadas e tente de novo.`;
    $('#heard', ov).textContent = '';
    $('.ctrl', ov).innerHTML = `<button id="again">🔁 Repetir</button><button id="hear2">🔊 Ouvir acorde</button>`;
    $('#again', ov).onclick = () => { closeOverlay(); setTimeout(() => runChecker(k), 50); };
    $('#hear2', ov).onclick = () => strum(chordNotes(k));
    drawList();
    render();
  }

  const t0 = Date.now();
  drawList();
  try {
    await mic.start((r) => {
      if (finished || cur >= strings.length) return;
      const now = Date.now();
      if (now < waitUntil) return;
      const x = strings[cur];
      const f = stab.push(r, 0.8);
      if (r.rms > 0.02) sawEnergy = true;
      if (!f) {
        // houve som, mas sem nota definida por muito tempo => corda abafada
        if (sawEnergy && now - startedAt > 7000) decide('mute');
        else if (now - startedAt > 9000) $('#heard', ov).textContent = 'não ouvi nada… toque mais forte ou pule';
        return;
      }
      const m = freqToMidi(f);
      const rm = Math.round(m);
      // ignora a corda anterior ainda soando
      const prev = strings[cur - 1];
      if (prev && rm % 12 === prev.target % 12 && rm % 12 !== x.target % 12 && now - startedAt < 2500) return;
      $('#heard', ov).textContent = `ouvindo: ${midiPt(rm)} (${midiName(rm)})`;
      if (rm === lastMidi) stableCount++; else { stableCount = 1; lastMidi = rm; }
      if (stableCount < 4) return;
      const pcOk = (rm - x.target) % 12 === 0;
      if (pcOk) decide('ok');
      else if ((rm - STRING_MIDI[x.s]) % 12 === 0) decide('open');
      else decide('wrong', rm);
    });
    showCur();
  } catch (e) {
    $('#ask', ov).innerHTML = `Não consegui acessar o microfone. ${e.message || ''}<br>Permita o uso do microfone nas configurações do navegador.`;
  }
}
