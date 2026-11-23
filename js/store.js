const KEY = 'dedosolto-v1';
const defaults = () => ({
  days: {},        // 'AAAA-MM-DD' -> segundos praticados
  minute: {},      // 'G-C' -> [{d, n}] histórico do minuto de trocas
  bpm: {},         // 'G-C' -> BPM inicial salvo
  bpmBest: {},     // 'G-C' -> maior BPM alcançado
  barre: {},       // 'F' -> [{d, ok, total}]
  ear: {},         // jogo -> {right, total, best}
  routine: {},     // dia -> {tune:true, ...}
  sel: ['G', 'C'],
  earPool: ['C', 'G', 'D', 'Am', 'Em'],
});

let data;
try {
  data = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch {
  data = defaults();
}
export const store = data;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sem armazenamento */ }
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => dayKey();

export function addPractice(secs) {
  if (!secs || secs < 3) return;
  const t = today();
  data.days[t] = (data.days[t] || 0) + Math.round(secs);
  save();
}

export function markRoutine(item) {
  const t = today();
  data.routine[t] = data.routine[t] || {};
  data.routine[t][item] = true;
  save();
}

export function streak() {
  let n = 0;
  const d = new Date();
  if (!data.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (data.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function lastDays(n = 7) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    out.push({ key: dayKey(d), wd: 'DSTQQSS'[d.getDay()], secs: data.days[dayKey(d)] || 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function earScore(game, right) {
  const e = (data.ear[game] = data.ear[game] || { right: 0, total: 0 });
  e.total++;
  if (right) e.right++;
  save();
}
