// post-x-promote-make-your-own-bounty-01 entry (Node 22, standard library only).
//
// The entry is the X post itself: one post of your own on X that quotes
// make.fun's make-your-own-bounty post
// (https://x.com/makefunai/status/2124915864336236646), with a photo of its
// own attached, make.fun or the @makefunai tag and your play code in its
// text. POST.json at the repository root names that post, and the house
// reads its replies, reposts and quotes from X; places go by their sum.
//
// This program is the entry's reproducible build step. It does two things,
// in order, and nothing else:
//   1. Copies POST.json from the repository root to /output/POST.json,
//      where the gate reads it.
//   2. Copies promo.png — the photo made for the post, generated in the
//      session that built this entry — to /output/promo.png, after
//      checking it is a whole PNG (magic bytes plus the IEND trailer),
//      so a truncated file fails loudly here instead of silently
//      shipping a broken picture.
//
// It takes no input besides the two files beside it, makes no network
// call, reads no clock and no randomness, so two runs on the same
// repository write byte-identical output.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const PNG_MAGIC = 0x89504e47;

function readWholePng(path: string): Buffer {
  const picture = readFileSync(path);
  if (picture.length < 12 || picture.readUInt32BE(0) !== PNG_MAGIC) {
    throw new Error(`${path} is not a PNG (bad magic bytes)`);
  }
  // A PNG that lost its tail in transit still starts with the right
  // magic, so check the IEND trailer too: the last 12 bytes of a whole
  // PNG are the empty IEND chunk (length 0, "IEND", and its CRC).
  const tail = picture.subarray(picture.length - 12);
  const whole =
    tail.readUInt32BE(0) === 0 && tail.toString('latin1', 4, 8) === 'IEND';
  if (!whole) {
    throw new Error(`${path} is a truncated PNG (no IEND trailer)`);
  }
  return picture;
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// POST.json first: without it the gate has no post to read.
copyFileSync(join(BOT_DIR, 'POST.json'), join(OUTPUT_DIR, 'POST.json'));

// Then the photo, validated before it is written out.
const promo = readWholePng(join(BOT_DIR, 'promo.png'));
writeFileSync(join(OUTPUT_DIR, 'promo.png'), promo);

console.log(`wrote POST.json and promo.png (${promo.length} bytes) to ${OUTPUT_DIR}`);
