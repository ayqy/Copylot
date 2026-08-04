#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ASSET_ROOT = path.resolve(ROOT, 'release/cws/1.2.3/assets/final');
const ASSETS = [
  ['01-clean-copy-starts-here.png', 1280, 800],
  ['02-markdown-without-the-mess.png', 1280, 800],
  ['03-tables-stay-structured.png', 1280, 800],
  ['04-code-keeps-its-shape.png', 1280, 800],
  ['05-prompt-shortcuts.png', 1280, 800],
  ['small-promo-440x280.png', 440, 280],
];

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
  throw new Error('usage: finalize-cws-store-assets.mjs [--check|--write]');
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function inspect(filePath, expectedWidth, expectedHeight) {
  const image = sharp(filePath);
  const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(
      `${path.basename(filePath)} is ${metadata.width}x${metadata.height}; ` +
      `expected ${expectedWidth}x${expectedHeight}`
    );
  }
  return { metadata, stats };
}

async function removeOpaqueAlpha(filePath, expectedWidth, expectedHeight) {
  const before = await inspect(filePath, expectedWidth, expectedHeight);
  if (!before.metadata.hasAlpha) return;
  const alpha = before.stats.channels[3];
  if (!alpha || alpha.min !== 255 || alpha.max !== 255) {
    throw new Error(`${path.basename(filePath)} has non-opaque alpha; refusing lossy flattening`);
  }

  const temporary = `${filePath}.opaque-${process.pid}.tmp.png`;
  try {
    await sharp(filePath).removeAlpha().png({ compressionLevel: 9 }).toFile(temporary);
    await rename(temporary, filePath);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

async function main() {
  const results = [];
  for (const [name, width, height] of ASSETS) {
    const filePath = path.join(ASSET_ROOT, name);
    if (mode === '--write') await removeOpaqueAlpha(filePath, width, height);
    const { metadata, stats } = await inspect(filePath, width, height);
    if (metadata.hasAlpha || stats.channels.length !== 3) {
      throw new Error(`${name} must be an opaque 24-bit RGB PNG without alpha`);
    }
    results.push({
      path: path.relative(ROOT, filePath),
      width: metadata.width,
      height: metadata.height,
      channels: stats.channels.length,
      has_alpha: Boolean(metadata.hasAlpha),
      sha256: await sha256(filePath),
    });
  }
  process.stdout.write(`${JSON.stringify({ status: 'passed', mode, assets: results }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
