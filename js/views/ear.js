import { CHORDS, OPEN_CHORDS, INTERVALS, STRING_MIDI, STRING_NAMES, label, chordNotes, midiPt, midiName } from '../data.js';
import { chordSVG } from '../diagram.js';
import { store, save, addPractice, markRoutine, earScore } from '../store.js';
import { $, $$, shuffle, pick, toast } from '../ui.js';
import { strum, pluck, tone, mtof, beep } from '../audio.js';
import { Mic, Stabilizer, freqToMidi } from '../pitch.js';

export const title = 'Treino de ouvido';
let root, game = null, t0 = 0, cleanup = null;

const GAMES = [
  { id: 'mm', icon: '😊😢', name: 'Maior ou menor?', desc: 'O primeiro passo do ouvido: acorde maior soa “alegre”, menor soa “triste”.' },
  { id: 'chord', icon: '🎸', name: 'Qual é o acorde?', desc: 'Reconheça os acordes que você já toca só de ouvir. Ajuda a tirar músicas de ouvido.' },
  { id: 'int', icon: '↗️', name: 'Intervalos', desc: 'A distância entre duas notas, com músicas conhecidas como referência.' },
  { id: 'pitch', icon: '🎚️', name: 'Mais agudo ou mais grave?', desc: 'Diferenças cada vez menores. Essencial para afinar de ouvido.' },
  { id: 'find', icon: '🎤', name: 'Ache a nota no violão', desc: 'O app toca uma nota, você procura no violão. O microfone confere.' },
];

export function mount(el, params = {}) {
  root = el;
  if (params.game) openGame(params.game); else renderMenu();
}
export function unmount() { endGame(); }

function endGame() {
  if (cleanup) cleanup();
  cleanup = null;
  if (game && t0) addPractice((Date.now() - t0) / 1000);
  game = null; t0 = 0;
}

function renderMenu() {
  endGame();
  root.innerHTML = `
  <section class="card">
    <h2>Ouvido absoluto não é necessário</h2>
    <p>Quase todo músico usa <b>ouvido relativo</b>: perceber a <i>relação</i> entre sons (subiu? desceu? alegre ou triste?). Isso se treina, poucos minutos por dia. Use fone ou um lugar silencioso.</p>
  </section>
  <div class="list">${GAMES.map((g) => {
    const s = store.ear[g.id];
    const pct = s?.total ? Math.round((s.right / s.total) * 100) + '% de acertos' : 'novo';
    return `<button class="card game" data-game="${g.id}"><span class="gi">${g.icon}</span><span><h3>${g.name}</h3><p>${g.desc}</p><small class="muted">${pct}</small></span></button>`;
  }).join('')}</div>`;
  $$('[data-game]', root).forEach((b) => b.onclick = () => openGame(b.dataset.game));
}

function shell(g, inner) {
  root.innerHTML = `
  <section class="card">
    <div class="game-head"><button class="back" id="back">‹ Voltar</button><h2>${g.name}</h2></div>
    <div class="score" id="score"></div>
    ${inner}
  </section>`;
  $('#back', root).onclick = renderMenu;
}

function openGame(id) {
  endGame();
  game = id; t0 = Date.now();
  markRoutine('ear');
  const g = GAMES.find((x) => x.id === id);
  ({ mm: gameMM, chord: gameChord, int: gameInt, pitch: gamePitch, find: gameFind })[id](g);
}

// Placar da sessão
function scorer(id) {
  let right = 0, total = 0, streak = 0;
  const draw = () => { const el = $('#score', root); if (el) el.innerHTML = `Acertos: <b>${right}/${total}</b> · sequência: <b>${streak}</b>`; };
  draw();
  return {
    hit(ok) {
      total++; if (ok) { right++; streak++; } else streak = 0;
      earScore(id, ok); draw();
      ok ? beep(1200, 0.1) : beep(250, 0.2);
      if (ok && streak > 0 && streak % 10 === 0) toast(`🔥 ${streak} acertos seguidos!`);
      return streak;
    },
  };
}

// Interface genérica de pergunta / respostas
function quiz({ options, play, check, explain, onNext, after }) {
  const area = $('#q', root);
  let answered = false;
  area.innerHTML = `
    <button class="btn big" id="play">▶ Ouvir de novo</button>
    <div class="answers">${options.map((o, i) => `<button class="ans" data-i="${i}">${o}</button>`).join('')}</div>
    <div class="feedback" id="fb"></div>
    <button class="btn ghost" id="next" hidden>Próxima ›</button>`;
  $('#play', area).onclick = play;
  $$('.ans', area).forEach((b) => b.onclick = () => {
    if (answered) return;
    answered = true;
    const i = +b.dataset.i;
    const res = check(i);
    b.classList.add(res.ok ? 'right' : 'wrong');
    if (!res.ok && res.correct != null) $$('.ans', area)[res.correct].classList.add('right');
    $('#fb', area).innerHTML = (res.ok ? '✅ Certo! ' : '❌ Não foi dessa vez. ') + (explain ? explain(res) : '');
    const n = $('#next', area);
    n.hidden = false;
    n.onclick = onNext;
    if (after) after();
  });
  setTimeout(play, 250);
}

// ---------- Maior ou menor ----------
function gameMM(g) {
  shell(g, `
    <label class="check"><input type="checkbox" id="arp"> Tocar arpejado (nota por nota) — mais fácil</label>
    <div id="q"></div>`);
  const sc = scorer('mm');
  const PAIRS = [['E', 'Em'], ['A', 'Am'], ['D', 'Dm']];
  const ask = () => {
    const [maj, min] = pick(PAIRS);
    const isMin = Math.random() < 0.5;
    const k = isMin ? min : maj;
    const play = () => strum(chordNotes(k), { arp: $('#arp', root).checked });
    quiz({
      options: ['😊 Maior', '😢 Menor'],
      play,
      check: (i) => { const ok = (i === 1) === isMin; sc.hit(ok); return { ok, correct: isMin ? 1 : 0 }; },
      explain: () => `Era <b>${label(k)}</b>. Compare: <button class="mini" id="cmpA">${label(maj)}</button> <button class="mini" id="cmpB">${label(min)}</button>`,
      onNext: ask,
      after: () => {
        $('#cmpA', root).onclick = () => strum(chordNotes(maj));
        $('#cmpB', root).onclick = () => strum(chordNotes(min));
      },
    });
  };
  ask();
}

// ---------- Qual acorde ----------
function gameChord(g) {
  const renderPool = () => {
    shell(g, `
      <p class="muted">Acordes no jogo (toque para incluir/remover). Comece com 2 ou 3 bem diferentes.</p>
      <div class="chips">${[...OPEN_CHORDS, 'F', 'Bm'].map((k) => `<button class="chip ${store.earPool.includes(k) ? 'on' : ''}" data-pool="${k}">${label(k)}</button>`).join('')}</div>
      <div id="q"></div>`);
    $$('[data-pool]', root).forEach((b) => b.onclick = () => {
      const k = b.dataset.pool, p = store.earPool;
      if (p.includes(k)) { if (p.length > 2) p.splice(p.indexOf(k), 1); } else p.push(k);
      save(); renderPool();
    });
    sc = scorer('chord');
    ask();
  };
  let sc;
  const ask = () => {
    const pool = store.earPool;
    const k = pick(pool);
    // varia a batida para não decorar só o "timbre"
    const play = () => strum(chordNotes(k), { arp: Math.random() < 0.3 });
    quiz({
      options: pool.map(label),
      play,
      check: (i) => { const ok = pool[i] === k; sc.hit(ok); return { ok, correct: pool.indexOf(k) }; },
      explain: () => `Era <b>${label(k)}</b>.<div class="diagrams sm">${chordSVG(k)}</div>`,
      onNext: ask,
    });
  };
  renderPool();
}

// ---------- Intervalos ----------
function gameInt(g) {
  const LV = { 1: [2, 7, 12], 2: [2, 3, 4, 5, 7, 12], 3: INTERVALS.map((i) => i.st) };
  let lvl = store.intLvl || 1;
  const draw = () => {
    shell(g, `
      <div class="seg">${[1, 2, 3].map((l) => `<button data-l="${l}" class="${l === lvl ? 'on' : ''}">Nível ${l}</button>`).join('')}</div>
      <label class="check"><input type="checkbox" id="desc"> Incluir intervalos descendentes</label>
      <details class="tips"><summary>Referências para memorizar</summary><ul>${INTERVALS.filter((i) => LV[lvl].includes(i.st)).map((i) => `<li><b>${i.name}</b>: ${i.hint} <button class="mini" data-demo="${i.st}">▶</button></li>`).join('')}</ul></details>
      <div id="q"></div>`);
    $$('[data-l]', root).forEach((b) => b.onclick = () => { lvl = +b.dataset.l; store.intLvl = lvl; save(); draw(); });
    $$('[data-demo]', root).forEach((b) => b.onclick = () => playInt(52, +b.dataset.demo, false));
    sc = scorer('int');
    ask();
  };
  let sc;
  const playInt = (base, st, down) => {
    const c = pluck(base, 0, 0.55);
    const t = c.src.context.currentTime + 0.7;
    pluck(down ? base - st : base + st, t, 0.55);
  };
  const ask = () => {
    const list = INTERVALS.filter((i) => LV[lvl].includes(i.st));
    const it = pick(list);
    const down = $('#desc', root)?.checked && Math.random() < 0.5;
    const base = down ? 57 + Math.floor(Math.random() * 10) : 45 + Math.floor(Math.random() * 10);
    quiz({
      options: list.map((i) => i.name),
      play: () => playInt(base, it.st, down),
      check: (i) => { const ok = list[i].st === it.st; sc.hit(ok); return { ok, correct: list.indexOf(it) }; },
      explain: () => `Era <b>${it.name}</b> ${down ? 'descendo' : 'subindo'} (${it.st} casa${it.st > 1 ? 's' : ''} no violão). Lembre: ${it.hint}`,
      onNext: ask,
    });
  };
  draw();
}

// ---------- Agudo ou grave (afinação fina) ----------
function gamePitch(g) {
  shell(g, `
    <p class="muted">Duas notas: a segunda é mais aguda ou mais grave? A diferença diminui quando você acerta.</p>
    <p class="stat">Diferença atual: <b id="cents"></b> <small class="muted">(100 cents = 1 casa do violão)</small></p>
    <div id="q"></div>`);
  const sc = scorer('pitch');
  let cents = store.pitchCents || 100;
  const ask = () => {
    $('#cents', root).textContent = `${Math.round(cents)} cents`;
    const f1 = mtof(52 + Math.floor(Math.random() * 14));
    const up = Math.random() < 0.5;
    const f2 = f1 * Math.pow(2, ((up ? 1 : -1) * cents) / 1200);
    quiz({
      options: ['⬆️ Mais aguda', '⬇️ Mais grave'],
      play: () => { tone(f1, 0, 0.7); setTimeout(() => tone(f2, 0, 0.7), 850); },
      check: (i) => {
        const ok = (i === 0) === up;
        sc.hit(ok);
        cents = ok ? Math.max(5, cents * 0.8) : Math.min(100, cents * 1.4);
        store.pitchCents = Math.round(cents); save();
        return { ok, correct: up ? 0 : 1 };
      },
      explain: () => (cents < 15 ? 'Precisão de afinador! 👏' : cents < 40 ? 'Seu ouvido já percebe menos de meia casa.' : 'Continue — o ouvido melhora rápido com esse treino.'),
      onNext: ask,
    });
  };
  ask();
}

// ---------- Ache a nota (microfone) ----------
function gameFind(g) {
  const LV = {
    1: { name: 'Cordas soltas', notes: STRING_MIDI.map((m, s) => ({ m, s, f: 0 })) },
    2: { name: 'Cordas 1–3, casas 0–3', notes: [3, 4, 5].flatMap((s) => [0, 1, 2, 3].map((f) => ({ m: STRING_MIDI[s] + f, s, f }))) },
    3: { name: 'Todas as cordas, casas 0–5', notes: [0, 1, 2, 3, 4, 5].flatMap((s) => [0, 1, 2, 3, 4, 5].map((f) => ({ m: STRING_MIDI[s] + f, s, f }))) },
  };
  let lvl = store.findLvl || 1;
  let mic = null;
  const draw = () => {
    if (mic) mic.stop();
    shell(g, `
      <div class="seg">${[1, 2, 3].map((l) => `<button data-l="${l}" class="${l === lvl ? 'on' : ''}">${LV[l].name}</button>`).join('')}</div>
      <p class="muted">Ouça a nota e procure no violão até achar. Não precisa acertar de primeira: subir e descer escutando é o treino!</p>
      <button class="btn big" id="play">▶ Ouvir nota</button>
      <div class="meter"><div class="arrow" id="arrow">🎤 toque uma nota</div></div>
      <div class="feedback" id="fb"></div>
      <div class="ctrl"><button id="reveal">👀 Mostrar resposta</button><button id="skip">⏭ Outra nota</button></div>`);
    $$('[data-l]', root).forEach((b) => b.onclick = () => { lvl = +b.dataset.l; store.findLvl = lvl; save(); draw(); });
    start();
  };
  const sc = { hit: null };
  let target, ignoreUntil = 0, stab = new Stabilizer(5), hits = 0, solved = false;
  const newNote = () => {
    target = pick(LV[lvl].notes.filter((n) => !target || n.m !== target.m));
    solved = false; hits = 0;
    $('#fb', root).innerHTML = '';
    $('#arrow', root).textContent = '🎤 procure essa nota no violão';
    playT();
  };
  const playT = () => { pluck(target.m, 0, 0.6); ignoreUntil = Date.now() + 1600; };
  const start = async () => {
    sc.hit = scorer('find').hit;
    $('#play', root).onclick = playT;
    $('#skip', root).onclick = newNote;
    $('#reveal', root).onclick = () => { $('#fb', root).innerHTML = `Era <b>${midiPt(target.m)}</b>: corda ${STRING_NAMES[target.s]}, ${target.f ? 'casa ' + target.f : 'solta'}.`; };
    mic = new Mic();
    cleanup = () => mic && mic.stop();
    try {
      await mic.start((r) => {
        if (!target || solved || Date.now() < ignoreUntil) return;
        const f = stab.push(r, 0.85);
        if (!f) return;
        const m = freqToMidi(f);
        const diff = m - target.m;
        const arrow = $('#arrow', root);
        if (!arrow) return;
        const pcMatch = Math.abs(diff - Math.round(diff / 12) * 12) < 0.5;
        if (Math.abs(diff) < 0.5 || pcMatch) {
          hits++;
          arrow.textContent = '🎯 ' + midiPt(Math.round(m));
          if (hits >= 4) {
            solved = true;
            sc.hit(true);
            $('#fb', root).innerHTML = `✅ Achou! <b>${midiPt(target.m)}</b> (${midiName(target.m)})${Math.abs(diff) >= 0.5 ? ' — em outra oitava, também vale!' : ''}`;
            setTimeout(() => { if (game === 'find') newNote(); }, 1800);
          }
        } else {
          hits = 0;
          arrow.textContent = diff < 0 ? `⬆️ suba (${midiPt(Math.round(m))} está grave)` : `⬇️ desça (${midiPt(Math.round(m))} está agudo)`;
        }
      });
      newNote();
    } catch (e) {
      $('#fb', root).innerHTML = `Não consegui acessar o microfone. ${e.message || ''}`;
    }
  };
  draw();
}
