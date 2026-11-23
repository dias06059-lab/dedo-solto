// Cordas: índice 0 = 6ª corda (Mi grave) ... índice 5 = 1ª corda (Mi agudo)
export const STRING_MIDI = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['6ª (Mi grave)', '5ª (Lá)', '4ª (Ré)', '3ª (Sol)', '2ª (Si)', '1ª (Mi agudo)'];

// frets: -1 = não tocar, 0 = solta. fingers: 0 = nenhum, 1..4 = indicador..mínimo
export const CHORDS = {
  C:   { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  D:   { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  Dm:  { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  E:   { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  Em:  { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  G:   { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  A:   { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  Am:  { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  A7:  { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  Am7: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  B7:  { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  C7:  { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  D7:  { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  E7:  { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  G7:  { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  F_peq: { label: 'F (pequeno)', frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: { fret: 1, from: 4, to: 5 } },
  F_5:   { label: 'F (sem 6ª)', frets: [-1, 3, 3, 2, 1, 1], fingers: [0, 3, 4, 2, 1, 1], barre: { fret: 1, from: 4, to: 5 } },
  F:   { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, from: 0, to: 5 } },
  Bm:  { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 1, to: 5 } },
  Bb:  { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, from: 1, to: 5 } },
  Cm:  { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, from: 1, to: 5 } },
  Gm:  { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, from: 0, to: 5 } },
  G_pest: { label: 'G (pestana)', frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 3, from: 0, to: 5 } },
};

export const label = (k) => CHORDS[k]?.label || k;
export const OPEN_CHORDS = ['C', 'D', 'Dm', 'E', 'Em', 'G', 'A', 'Am', 'A7', 'Am7', 'B7', 'C7', 'D7', 'E7', 'G7'];
export const BARRE_CHORDS = ['F_peq', 'F_5', 'F', 'Bm', 'F#m', 'Bb', 'Cm', 'Gm', 'G_pest'];

export const PRESETS = [
  { name: 'G ↔ C', chords: ['G', 'C'] },
  { name: 'C ↔ Am', chords: ['C', 'Am'] },
  { name: 'D ↔ A', chords: ['D', 'A'] },
  { name: 'G ↔ D', chords: ['G', 'D'] },
  { name: 'Em ↔ C', chords: ['Em', 'C'] },
  { name: 'Am ↔ Dm', chords: ['Am', 'Dm'] },
  { name: 'E ↔ Am', chords: ['E', 'Am'] },
  { name: 'Am ↔ F', chords: ['Am', 'F'] },
  { name: 'C ↔ F', chords: ['C', 'F'] },
  { name: 'G C D', chords: ['G', 'C', 'D'] },
  { name: 'C G Am F', chords: ['C', 'G', 'Am', 'F'] },
  { name: 'Am F C G', chords: ['Am', 'F', 'C', 'G'] },
  { name: 'D A Bm G', chords: ['D', 'A', 'Bm', 'G'] },
  { name: 'Em C G D', chords: ['Em', 'C', 'G', 'D'] },
];

// Intervalos (semitons) com músicas de referência para lembrar o som
export const INTERVALS = [
  { st: 1, name: '2ª menor', hint: 'Tema de "Tubarão" (dois sons bem colados)' },
  { st: 2, name: '2ª maior', hint: '"Parabéns pra você" (o salto em "-béns")' },
  { st: 3, name: '3ª menor', hint: 'Início de "Greensleeves"' },
  { st: 4, name: '3ª maior', hint: 'Início de "Oh When the Saints"' },
  { st: 5, name: '4ª justa', hint: 'Início da "Marcha Nupcial"' },
  { st: 6, name: 'Trítono', hint: 'Início de "Os Simpsons" (som tenso)' },
  { st: 7, name: '5ª justa', hint: '"Brilha, brilha estrelinha" (o salto do 2º pro 3º som)' },
  { st: 8, name: '6ª menor', hint: 'Som triste e aberto, uma casa acima da 5ª justa' },
  { st: 9, name: '6ª maior', hint: 'Início do jingle "NBC" / "My Bonnie"' },
  { st: 10, name: '7ª menor', hint: 'Início do tema de "Star Trek" (série original)' },
  { st: 11, name: '7ª maior', hint: 'Quase oitava, soa "querendo subir"' },
  { st: 12, name: 'Oitava', hint: '"Somewhere Over the Rainbow" (o salto de "Some-where")' },
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_PT = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
export const midiName = (m) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
export const midiPt = (m) => NOTE_PT[((m % 12) + 12) % 12];

// Notas soando de um acorde (midi), da corda grave para a aguda
export const chordNotes = (k) =>
  CHORDS[k].frets.map((f, i) => (f >= 0 ? STRING_MIDI[i] + f : null)).filter((x) => x !== null);

// Analisa a troca entre dois acordes: dedos âncora, guia e que se movem
export function transitionTips(aKey, bKey) {
  const A = CHORDS[aKey], B = CHORDS[bKey];
  const pos = (ch, f) => {
    const out = [];
    ch.fingers.forEach((fi, s) => { if (fi === f) out.push({ s, fret: ch.frets[s] }); });
    return out;
  };
  const anchors = [], guides = [], moves = [];
  for (let f = 1; f <= 4; f++) {
    const pa = pos(A, f), pb = pos(B, f);
    if (!pa.length || !pb.length) continue;
    const same = pa.length === pb.length && pa.every((p, i) => pb[i].s === p.s && pb[i].fret === p.fret);
    if (same) { anchors.push(f); continue; }
    const shared = pa.find((p) => pb.some((q) => q.s === p.s));
    if (shared && pa.length === 1 && pb.length === 1) {
      guides.push({ f, s: shared.s, from: pa[0].fret, to: pb[0].fret });
    } else moves.push(f);
  }
  const fname = ['', 'indicador (1)', 'médio (2)', 'anelar (3)', 'mínimo (4)'];
  const tips = [];
  anchors.forEach((f) => tips.push(`⚓ O <b>${fname[f]}</b> fica no mesmo lugar: <b>não tire ele da corda</b>. Use como ponto de apoio.`));
  guides.forEach((g) => tips.push(`➡️ O <b>${fname[g.f]}</b> só desliza na corda ${6 - g.s} (casa ${g.from} → ${g.to}). Deslize <b>sem soltar</b> totalmente a corda — é o seu “dedo guia”.`));
  const nb = B.barre && !A.barre, ab = A.barre && !B.barre;
  if (nb) tips.push('🧱 Indo para a pestana: coloque <b>primeiro o indicador deitado</b> e depois os outros dedos, como um bloco.');
  if (ab) tips.push('🧱 Saindo da pestana: relaxe o polegar antes de mover; não precisa “soltar tudo” de uma vez.');
  if (!anchors.length && !guides.length) tips.push('✋ Não há dedo em comum: treine <b>levantar todos os dedos juntos</b> já no formato do próximo acorde (“troca no ar”) e pousar todos ao mesmo tempo.');
  else if (moves.length) tips.push('✋ Os outros dedos se movem juntos, como um bloco — não um de cada vez.');
  return tips;
}

export const BARRE_TIPS = [
  'O <b>polegar</b> fica atrás do braço, mais ou menos na altura do dedo médio — não por cima do braço.',
  'Gire levemente o indicador para usar a <b>lateral (lado do polegar)</b>, que é mais dura e reta do que a parte macia.',
  'Deixe o indicador <b>bem perto do traste</b> (o metal), não no meio da casa. Precisa de muito menos força.',
  'A força vem do <b>peso do braço</b> puxando para trás, não de apertar a mão como um alicate.',
  'Se só uma corda falha, mexa o indicador 1–2 mm para cima/baixo: ela pode estar caindo numa “dobra” do dedo.',
  'Comece mais pra cima no braço (casa 5–7): a corda fica mais macia. Depois desça para a casa 1.',
  'Dor no músculo do polegar é normal no começo. <b>Dor aguda ou formigamento: pare</b> e descanse.',
  'Se mesmo assim estiver muito difícil, peça para regular o violão (altura das cordas / “ação”). Violão mal regulado dificulta muito a pestana.',
];

export const CHANGE_TIPS = [
  'Antes da velocidade vem a <b>economia de movimento</b>: dedos perto das cordas, sem levantar alto.',
  'Olhe o próximo acorde <b>antes</b> de trocar e imagine o formato no ar.',
  'Na troca, a mão direita <b>não para</b>: se o acorde não ficou pronto, toque cordas soltas no tempo. Ritmo primeiro!',
  'Treine devagar e certo. Metrônomo lento e sem pausas vale mais que rápido e travando.',
  '1 minuto de trocas por dia, todo dia, funciona melhor que 1 hora no fim de semana.',
];
