// Generates temporary placeholder PWA icons (solid background + circle mark)
// as raw PNGs, with no image-library dependency. Replace with real artwork
// before the 10/31 MVP gate if time allows (PRD 12절 "아이콘" 요구사항).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');

const BG = [15, 23, 42]; // slate-900, matches theme_color
const MARK = [56, 189, 248]; // sky-400 accent

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** Draws a solid background with a centered circle "mark". Keeps the mark
 * within an 80% safe zone so it also works as a maskable icon. */
function drawIcon(size, { markRadiusRatio = 0.3 } = {}) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * markRadiusRatio;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inMark = dx * dx + dy * dy <= r * r;
      const [cr, cg, cb] = inMark ? MARK : BG;
      const off = rowStart + 1 + x * 4;
      raw[off] = cr;
      raw[off + 1] = cg;
      raw[off + 2] = cb;
      raw[off + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });

const icons = [
  { file: 'icon-192.png', size: 192, markRadiusRatio: 0.3 },
  { file: 'icon-512.png', size: 512, markRadiusRatio: 0.3 },
  { file: 'icon-512-maskable.png', size: 512, markRadiusRatio: 0.32 },
  { file: 'icon-48.png', size: 48, markRadiusRatio: 0.3 },
];

for (const { file, size, markRadiusRatio } of icons) {
  writeFileSync(path.join(outDir, file), drawIcon(size, { markRadiusRatio }));
  console.log(`generated ${file} (${size}x${size})`);
}
