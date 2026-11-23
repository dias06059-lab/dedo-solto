import * as home from './views/home.js';
import * as changes from './views/changes.js';
import * as barre from './views/barre.js';
import * as ear from './views/ear.js';
import * as tuner from './views/tuner.js';
import { $, $$ } from './ui.js';

const VIEWS = { home, changes, barre, ear, tuner };
let current = null;

function go(name, params = {}) {
  if (!VIEWS[name]) name = 'home';
  if (current?.unmount) current.unmount();
  current = VIEWS[name];
  const view = $('#view');
  view.innerHTML = '';
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  $('#title').textContent = current.title;
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  current.mount(view, params);
  try { sessionStorage.setItem('tab', name); } catch { /* ok */ }
}

window.app = { go };

$$('.tabs button').forEach((b) => b.onclick = () => go(b.dataset.tab));

let start = 'home';
try { start = sessionStorage.getItem('tab') || 'home'; } catch { /* ok */ }
go(start);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
