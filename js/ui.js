export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let overlay = null;
let onCloseCb = null;

export function openOverlay(html, onClose) {
  closeOverlay();
  overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="overlay-inner">${html}</div>`;
  document.body.appendChild(overlay);
  onCloseCb = onClose;
  keepAwake(true);
  history.pushState({ overlay: true }, '');
  return overlay;
}

export function closeOverlay(fromPop = false) {
  if (!overlay) return;
  const cb = onCloseCb;
  overlay.remove();
  overlay = null;
  onCloseCb = null;
  keepAwake(false);
  if (cb) cb();
  if (!fromPop && history.state?.overlay) { ignorePops++; history.back(); }
}

// Botão "voltar" do Android fecha o exercício em vez de sair do app
let ignorePops = 0;
window.addEventListener('popstate', () => {
  if (ignorePops > 0) { ignorePops--; return; }
  if (overlay) closeOverlay(true);
});

// Mantém a tela ligada durante exercícios
let lock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
    else if (!on && lock) { await lock.release(); lock = null; }
  } catch { /* opcional */ }
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
