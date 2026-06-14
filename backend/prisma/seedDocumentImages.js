import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function setPixel(pixels, width, x, y, rgb) {
  if (x < 0 || y < 0) return;
  const offset = (y * width + x) * 4;
  pixels[offset] = rgb[0];
  pixels[offset + 1] = rgb[1];
  pixels[offset + 2] = rgb[2];
  pixels[offset + 3] = 255;
}

function fillRect(pixels, width, x, y, w, h, rgb) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(pixels, width, px, py, rgb);
    }
  }
}

export function createDocumentPng({ filePath, headerColor = [30, 64, 120], accentColor = [226, 232, 240] }) {
  const width = 420;
  const height = 594;
  const pixels = Buffer.alloc(width * height * 4);

  fillRect(pixels, width, 0, 0, width, height, [255, 255, 255]);
  fillRect(pixels, width, 24, 24, width - 48, 88, headerColor);
  fillRect(pixels, width, 130, 36, width - 72, 18, accentColor);
  fillRect(pixels, width, 168, 36, width - 120, 12, [210, 218, 226]);
  fillRect(pixels, width, 198, 36, width - 96, 12, [210, 218, 226]);
  fillRect(pixels, width, 228, 36, width - 140, 12, [210, 218, 226]);
  fillRect(pixels, width, 268, 36, width - 72, 12, [210, 218, 226]);
  fillRect(pixels, width, 298, 36, width - 110, 12, [210, 218, 226]);
  fillRect(pixels, width, 328, 36, width - 130, 12, [210, 218, 226]);
  fillRect(pixels, width, 368, 36, width - 72, 140, [248, 250, 252]);
  fillRect(pixels, width, 380, 48, width - 96, 116, [219, 228, 238]);
  fillRect(pixels, width, 520, 36, 160, 36, headerColor);
  fillRect(pixels, width, 16, 16, width - 32, height - 32, [200, 206, 214]);

  for (let x = 17; x < width - 17; x++) {
    setPixel(pixels, width, x, 17, [200, 206, 214]);
    setPixel(pixels, width, x, height - 18, [200, 206, 214]);
  }
  for (let y = 17; y < height - 17; y++) {
    setPixel(pixels, width, 17, y, [200, 206, 214]);
    setPixel(pixels, width, width - 18, y, [200, 206, 214]);
  }

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, png);
  return png.length;
}
