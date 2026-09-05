const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, colorHex) {
  // Parse hex color (e.g. #E1306C - Instagram pink/red)
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  // Each row has 1 filter byte (0) + size * 4 bytes (RGBA)
  const rowSize = 1 + size * 4;
  const rawData = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for rounded circle/squircle look
      const cx = size / 2;
      const cy = size / 2;
      const dist = Math.hypot(x - cx + 0.5, y - cy + 0.5);
      const radius = size * 0.44;

      // Draw a play icon inside
      // Play triangle: (0.38 to 0.68 in X, 0.3 to 0.7 in Y)
      const nx = x / size;
      const ny = y / size;
      const inTriangle = nx >= 0.38 && nx <= 0.70 && Math.abs(ny - 0.5) <= (nx - 0.38) * 0.65;

      if (inTriangle) {
        // White play symbol
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
        rawData[pixelOffset + 3] = 255;
      } else if (dist <= radius) {
        // Instagram gradient background (pink to purple)
        const factor = y / size;
        rawData[pixelOffset] = Math.round(225 * (1 - factor) + 131 * factor);     // R
        rawData[pixelOffset + 1] = Math.round(48 * (1 - factor) + 58 * factor);    // G
        rawData[pixelOffset + 2] = Math.round(108 * (1 - factor) + 180 * factor);  // B
        rawData[pixelOffset + 3] = 255; // Alpha
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Compress with deflate
  const compressed = zlib.deflateSync(rawData);

  // Helper to create chunk
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // CRC32 calculation
    let crc = 0 ^ (-1);
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ combined[i]) & 0xff];
    }
    crc = (crc ^ (-1)) >>> 0;
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = chunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = chunk('IDAT', compressed);

  // IEND chunk
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = createPNG(size, '#E1306C');
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png`);
});
