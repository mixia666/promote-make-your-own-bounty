// post-x-promote-make-your-own-bounty-01 entry (Node 22, standard library only).
//
// The entry is the X post itself: one post of your own on X that quotes
// make.fun's make-your-own-bounty post
// (https://x.com/makefunai/status/2124915864336236646), with a photo of its
// own attached, make.fun or the @makefunai tag and your play code in its
// text. POST.json at the repository root names that post, and the house
// reads its replies, reposts and quotes from X; places go by their sum.
//
// This program is the entry's reproducible build step. It does three
// things, in order, and nothing else:
//   1. Reads POST.json from the repository root, checks it parses and
//      names a real X status URL, and copies it to /output/POST.json,
//      where the gate reads it. A placeholder or a malformed URL fails
//      loudly here instead of sending the gate to a post that is not
//      the entry.
//   2. Copies promo.png — the photo made for the post, generated in the
//      session that built this entry — to /output/promo.png, after
//      checking it is a whole PNG of the size the post was made with
//      (magic bytes, the IHDR dimensions and its CRC, and the IEND
//      trailer with its CRC), so a truncated, swapped or silently
//      corrupted file fails loudly here instead of silently shipping a
//      broken picture.
//   3. Prints the SHA-256 of the photo it shipped, so the run log proves
//      which picture the entry stands behind.
//
// It takes no input besides the two files beside it, makes no network
// call, reads no clock and no randomness, so two runs on the same
// repository write byte-identical output.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const PNG_MAGIC = 0x89504e47;
// The photo attached to the post, as generated: 2048x1152.
const PROMO_WIDTH = 2048;
const PROMO_HEIGHT = 1152;

// CRC32, zlib polynomial, table-based. A PNG stores the CRC of each
// chunk's type plus its data, so a chunk that still has the right name
// and dimensions but a corrupted payload is caught here.
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Check a chunk's stored CRC against the CRC computed over its type and
// data. The chunk starts at chunkOffset with the layout: 4-byte length,
// 4-byte type, data, 4-byte stored CRC.
function checkChunkCrc(picture: Buffer, chunkOffset: number, name: string, path: string): void {
  const length = picture.readUInt32BE(chunkOffset);
  const dataEnd = chunkOffset + 8 + length;
  const stored = picture.readUInt32BE(dataEnd);
  const computed = crc32(picture.subarray(chunkOffset + 4, dataEnd));
  if (computed !== stored) {
    throw new Error(
      `${path} has a bad ${name} chunk CRC (stored ${stored.toString(16)}, computed ${computed.toString(16)})`,
    );
  }
}

function readPostJson(path: string): Buffer {
  const raw = readFileSync(path);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new Error(`${path} is not valid JSON`);
  }
  const url = (parsed as { url?: unknown }).url;
  if (typeof url !== 'string' || !/^https:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+$/.test(url)) {
    throw new Error(`${path} does not name an X status URL: ${String(url)}`);
  }
  return raw;
}

function readWholePng(path: string): Buffer {
  const picture = readFileSync(path);
  if (picture.length < 12 || picture.readUInt32BE(0) !== PNG_MAGIC) {
    throw new Error(`${path} is not a PNG (bad magic bytes)`);
  }
  // The IHDR chunk follows the 8-byte signature: length, "IHDR", then
  // width and height as big-endian uint32. The photo must be the size
  // the post was made with; a different picture under the same name is
  // the wrong entry, however whole it is.
  if (picture.toString('latin1', 12, 16) !== 'IHDR') {
    throw new Error(`${path} has no IHDR chunk where one belongs`);
  }
  const width = picture.readUInt32BE(16);
  const height = picture.readUInt32BE(20);
  if (width !== PROMO_WIDTH || height !== PROMO_HEIGHT) {
    throw new Error(`${path} is ${width}x${height}, expected ${PROMO_WIDTH}x${PROMO_HEIGHT}`);
  }
  // The stored CRC covers the chunk type and data, so a corrupted IHDR
  // payload is caught even when the dimensions still read right.
  checkChunkCrc(picture, 8, 'IHDR', path);
  // A PNG that lost its tail in transit still starts with the right
  // magic, so check the IEND trailer too: the last 12 bytes of a whole
  // PNG are the empty IEND chunk (length 0, "IEND", and its CRC).
  const tail = picture.subarray(picture.length - 12);
  const whole =
    tail.readUInt32BE(0) === 0 && tail.toString('latin1', 4, 8) === 'IEND';
  if (!whole) {
    throw new Error(`${path} is a truncated PNG (no IEND trailer)`);
  }
  // The IEND CRC is a fixed constant, but verifying it the same way
  // keeps the check honest if the trailer bytes were ever tampered with.
  checkChunkCrc(picture, picture.length - 12, 'IEND', path);
  return picture;
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// POST.json first: without it the gate has no post to read.
const postJson = readPostJson(join(BOT_DIR, 'POST.json'));
writeFileSync(join(OUTPUT_DIR, 'POST.json'), postJson);

// Then the photo, validated before it is written out.
const promo = readWholePng(join(BOT_DIR, 'promo.png'));
writeFileSync(join(OUTPUT_DIR, 'promo.png'), promo);

const promoSha256 = createHash('sha256').update(promo).digest('hex');
console.log(
  `wrote POST.json and promo.png (${promo.length} bytes, sha256 ${promoSha256}) to ${OUTPUT_DIR}`,
);
