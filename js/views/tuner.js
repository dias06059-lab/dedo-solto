import { STRING_MIDI, STRING_NAMES, midiPt, midiName } from '../data.js';
import { Mic, Stabilizer, noteInfo, freqToMidi } from '../pitch.js';
import { pluck } from '../audio.js';
import { markRoutine, addPractice } from '../store.js';
import { $, $$ } from '../ui.js';

export const title = 'Afinador';
let root, mic = null, t0 = 0;

export function mount(el) {
  root = el;
  root.innerHTML = `
  <section class="card tuner">
    <div class="t-note" id="note">—</div>
    <div class="t-sub" id="sub">Toque uma corda solta</div>
    <div class="gauge"><div class="ticks"></div><div class="needle" id="needle"></div><div class="zone"></div></div>
    <div class="t-cents"><span>♭ grave</span><b id="cents"></b><span>agudo ♯</span></div>
    <button class="btn big" id="mic">🎤 Ligar afinador</button>
  </section>
  <section class="card">
    <h3>Cordas (afinação padrão)</h3>
    <p class="muted">Toque em uma corda para <b>ouvir</b> o som de referência e afinar de ouvido — ótimo treino!</p>
    <div class="strings-grid">${STRING_MIDI.map((m, s) => `<button class="sbtn" data-s="${s}"><b>${midiName(m).replace(/\d/, '')}</b><small>${STRING_NAMES[s]}</small></button>`).join('')}</div>
    <details class="tips"><summary>Como afinar</summary><ul>
      <li>Se o ponteiro está à <b>esquerda</b> (grave), aperte a tarraxa (a nota sobe). À <b>direita</b>, afrouxe.</li>
      <li>Sempre afine <b>subindo</b> até a nota: se passou, afrouxe um pouco abaixo e suba de novo. A corda segura melhor a afinação.</li>
      <li>Afine em silêncio e toque a corda com força média, deixando soar.</li>
    </ul></details>
  </section>`;
  $('#mic', root).onclick = toggle;
  $$('[data-s]', root).forEach((b) => b.onclick = () => pluck(STRING_MIDI[+b.dataset.s], 0, 0.6, 4));
}

export function unmount() { stop(); }

function stop() {
  if (mic) { mic.stop(); mic = null; addPractice((Date.now() - t0) / 1000); }
  const b = $('#mic', root);
  if (b) b.textContent = '🎤 Ligar afinador';
}

async function toggle() {
  if (mic) return stop();
  mic = new Mic();
  t0 = Date.now();
  const stab = new Stabilizer(7);
  let inTuneSince = 0;
  $('#mic', root).textContent = '⏹ Desligar';
  try {
    await mic.start((r) => {
      const f = stab.push(r, 0.88);
      if (!f) return;
      const n = noteInfo(f);
      // corda mais próxima
      const m = freqToMidi(f);
      let best = 0;
      STRING_MIDI.forEach((sm, i) => { if (Math.abs(sm - m) < Math.abs(STRING_MIDI[best] - m)) best = i; });
      $('#note', root).textContent = n.name;
      $('#sub', root).textContent = `${n.pt}${n.octave} · ${f.toFixed(1)} Hz`;
      $('#cents', root).textContent = (n.cents > 0 ? '+' : '') + n.cents;
      const c = Math.max(-50, Math.min(50, n.cents));
      $('#needle', root).style.left = `${50 + c}%`;
      const ok = Math.abs(n.cents) <= 5;
      root.querySelector('.tuner').classList.toggle('ok', ok);
      $$('[data-s]', root).forEach((b, i) => b.classList.toggle('on', i === best && Math.abs(STRING_MIDI[best] - m) < 1.5));
      if (ok) { if (!inTuneSince) inTuneSince = Date.now(); else if (Date.now() - inTuneSince > 1500) markRoutine('tune'); }
      else inTuneSince = 0;
    });
  } catch (e) {
    mic = null;
    $('#sub', root).textContent = 'Sem acesso ao microfone. ' + (e.message || '');
    $('#mic', root).textContent = '🎤 Tentar de novo';
  }
}
