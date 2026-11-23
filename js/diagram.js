import { CHORDS } from './data.js';

// Desenha o diagrama do acorde (vista de frente do braço, 6ª corda à esquerda)
export function chordSVG(key, { highlight = -1 } = {}) {
  const ch = CHORDS[key];
  const played = ch.frets.filter((f) => f > 0);
  const maxF = played.length ? Math.max(...played) : 1;
  const minF = played.length ? Math.min(...played) : 1;
  const start = maxF <= 4 ? 1 : minF;
  const nF = Math.max(4, maxF - start + 1);
  const X = (s) => 22 + s * 20;
  const Y = (j) => 30 + j * 24;
  const H = Y(nF) + 10;
  let g = '';
  // trastes
  for (let j = 0; j <= nF; j++) {
    const w = j === 0 && start === 1 ? 5 : 1.4;
    g += `<line x1="${X(0)}" y1="${Y(j)}" x2="${X(5)}" y2="${Y(j)}" stroke="currentColor" stroke-width="${w}" opacity="${j === 0 && start === 1 ? 1 : 0.55}"/>`;
  }
  // cordas
  for (let s = 0; s < 6; s++) {
    const hl = s === highlight;
    g += `<line x1="${X(s)}" y1="${Y(0)}" x2="${X(s)}" y2="${Y(nF)}" stroke="${hl ? 'var(--accent)' : 'currentColor'}" stroke-width="${hl ? 3 : 1.2 + (5 - s) * 0.15}" opacity="${hl ? 1 : 0.75}"/>`;
  }
  if (start > 1) g += `<text x="4" y="${Y(0.5) + 4}" font-size="12" fill="currentColor" opacity=".8">${start}ª</text>`;
  // X / O
  ch.frets.forEach((f, s) => {
    if (f === -1) g += `<text x="${X(s)}" y="20" font-size="13" text-anchor="middle" fill="currentColor" opacity=".7">✕</text>`;
    if (f === 0) g += `<circle cx="${X(s)}" cy="15" r="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".8"/>`;
  });
  // pestana
  const b = ch.barre;
  if (b) {
    const y = Y(b.fret - start + 0.5);
    g += `<rect x="${X(b.from) - 9}" y="${y - 8}" width="${X(b.to) - X(b.from) + 18}" height="16" rx="8" fill="var(--dot)"/>`;
    g += `<text x="${(X(b.from) + X(b.to)) / 2}" y="${y + 4.5}" font-size="12" text-anchor="middle" fill="var(--dot-text)" font-weight="700">1</text>`;
  }
  // dedos
  ch.frets.forEach((f, s) => {
    if (f <= 0) return;
    if (b && ch.fingers[s] === 1 && f === b.fret && s >= b.from && s <= b.to) return;
    const y = Y(f - start + 0.5);
    g += `<circle cx="${X(s)}" cy="${y}" r="8.5" fill="var(--dot)"/>`;
    if (ch.fingers[s]) g += `<text x="${X(s)}" y="${y + 4.5}" font-size="12" text-anchor="middle" fill="var(--dot-text)" font-weight="700">${ch.fingers[s]}</text>`;
  });
  return `<svg class="chord-svg" viewBox="0 0 144 ${H}" role="img" aria-label="Diagrama do acorde">${g}</svg>`;
}
