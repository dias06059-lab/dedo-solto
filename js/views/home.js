import { store, save, streak, lastDays, today } from '../store.js';
import { EXERCISES } from './barre.js';
import { PRESETS, label } from '../data.js';
import { $, $$ } from '../ui.js';

export const title = 'Dedo Solto';
let root;

const EAR_ROTATION = ['mm', 'chord', 'int', 'pitch', 'find'];

export function mount(el) {
  root = el;
  render();
}
export function unmount() {}

function dayIndex() {
  const d = new Date();
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
}

function suggestedPair() {
  // par com menor recorde entre os que já treinou; senão segue a lista de presets
  const entries = Object.entries(store.minute).filter(([, h]) => h.length);
  if (entries.length >= 2) {
    entries.sort((a, b) => Math.max(...a[1].map((x) => x.n)) - Math.max(...b[1].map((x) => x.n)));
    return entries[0][0].split('-');
  }
  return PRESETS[dayIndex() % 9].chords;
}

function render() {
  const done = store.routine[today()] || {};
  const ex = EXERCISES[dayIndex() % EXERCISES.length];
  const pair = suggestedPair();
  const earGame = EAR_ROTATION[dayIndex() % EAR_ROTATION.length];
  const earNames = { mm: 'Maior ou menor?', chord: 'Qual é o acorde?', int: 'Intervalos', pitch: 'Agudo ou grave?', find: 'Ache a nota' };
  const items = [
    { id: 'tune', t: 'Afinar o violão', d: 'Violão desafinado atrapalha o ouvido.', min: 2, go: ['tuner'] },
    { id: 'changes', t: `Minuto de trocas: ${pair.map(label).join(' ↔ ')}`, d: 'Faça 2 ou 3 rodadas.', min: 4, go: ['changes', { chords: pair, mode: 'minute' }] },
    { id: 'barre', t: `Pestana: ${ex.name}`, d: 'Exercício do dia.', min: 5, go: ['barre', { exercise: ex.id }] },
    { id: 'ear', t: `Ouvido: ${earNames[earGame]}`, d: 'Pelo menos 10 perguntas.', min: 3, go: ['ear', { game: earGame }] },
    { id: 'song', t: 'Tocar uma música que você gosta', d: 'Use o que treinou. Marque quando terminar.', min: 5, manual: true },
  ];
  const nDone = items.filter((i) => done[i.id]).length;
  const days = lastDays(7);
  const maxS = Math.max(600, ...days.map((d) => d.secs));
  const todayMin = Math.round((store.days[today()] || 0) / 60);
  const st = streak();

  root.innerHTML = `
  <section class="card hero">
    <div><div class="big-num">${st}</div><small>dia${st === 1 ? '' : 's'} seguidos</small></div>
    <div><div class="big-num">${todayMin}</div><small>min hoje</small></div>
    <div class="week">${days.map((d) => `<div class="bar" title="${d.key}"><i style="height:${Math.max(4, (d.secs / maxS) * 100)}%" class="${d.secs ? 'on' : ''}"></i><small>${d.wd}</small></div>`).join('')}</div>
  </section>

  <section class="card">
    <h2>Treino de hoje <small class="muted">~20 min · ${nDone}/${items.length}</small></h2>
    <div class="progress"><i style="width:${(nDone / items.length) * 100}%"></i></div>
    <ul class="routine">${items.map((i) => `
      <li class="${done[i.id] ? 'done' : ''}">
        <button class="tick" data-tick="${i.id}" aria-label="marcar">${done[i.id] ? '✓' : ''}</button>
        <div class="r-txt"><b>${i.t}</b><small>${i.d} · ${i.min} min</small></div>
        ${i.manual ? '' : `<button class="btn sm" data-go="${i.id}">Ir</button>`}
      </li>`).join('')}</ul>
  </section>

  <section class="card">
    <h3>Por que os dedos “travam” na troca?</h3>
    <ul>
      <li>Cada dedo vai para o lugar <b>um de cada vez</b>. O treino é mover todos juntos, como um formato só.</li>
      <li>Os dedos <b>levantam demais</b> das cordas. Quanto mais perto, mais rápida a troca.</li>
      <li>Falta <b>repetição curta e diária</b>. Por isso o “minuto de trocas”: rápido, mensurável, e você vê o número subir.</li>
    </ul>
    <p class="muted">Dica: escolha 1 música que você quer tocar e treine justamente as trocas dela.</p>
  </section>`;

  $$('[data-go]', root).forEach((b) => b.onclick = () => {
    const it = items.find((i) => i.id === b.dataset.go);
    window.app.go(...it.go);
  });
  $$('[data-tick]', root).forEach((b) => b.onclick = () => {
    const t = today();
    store.routine[t] = store.routine[t] || {};
    store.routine[t][b.dataset.tick] = !store.routine[t][b.dataset.tick];
    if (b.dataset.tick === 'song' && store.routine[t].song) store.days[t] = (store.days[t] || 0) + 300;
    save(); render();
  });
}
