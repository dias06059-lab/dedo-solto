// Gera os ícones PNG do app sem dependências: node tools/gen-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const SS = 4; // supersampling
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const p = pixel((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
        r += p[0] * p[3]; g += p[1] * p[3]; b += p[2] * p[3]; a += p[3];
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = a ? r / a : 0; raw[o + 1] = a ? g / a : 0; raw[o + 2] = a ? b / a : 0; raw[o + 3] = (a / (SS * SS)) * 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const BG = [20, 22, 27, 1], OR = [245, 165, 36, 1], DK = [26, 18, 6, 1], ST = [236, 238, 242, 1], NONE = [0, 0, 0, 0];
function icon(scale, rounded) {
  return (u, v) => {
    // fundo (cantos arredondados no ícone normal; quadrado cheio no "maskable")
    if (rounded) {
      const r = 0.22, dx = Math.max(r - u, 0, u - (1 - r)), dy = Math.max(r - v, 0, v - (1 - r));
      if (dx * dx + dy * dy > r * r) return NONE;
    }
    const x = (u - 0.5) / scale, y = (v - 0.5) / scale;
    const d = Math.hypot(x, y);
    // cordas por cima de tudo, dentro da faixa vertical
    for (let i = 0; i < 6; i++) {
      const sx = -0.15 + i * 0.06;
      if (Math.abs(x - sx) < 0.009 && Math.abs(y) < 0.42) return ST;
    }
    if (d < 0.14) return DK;      // boca do violão
    if (d < 0.36) return OR;      // tampo
    return BG;
  };
}
mkdirSync('icons', { recursive: true });
writeFileSync('icons/icon-192.png', png(192, icon(1, true)));
writeFileSync('icons/icon-512.png', png(512, icon(1, true)));
writeFileSync('icons/icon-512-maskable.png', png(512, icon(0.78, false)));
// Ícones do APK (android/)
for (const [dpi, s] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  const dir = `android/app/src/main/res/mipmap-${dpi}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/ic_launcher.png`, png(s, icon(1, true)));
}
console.log('ícones gerados');
