#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

type CopyFrame = {
  id: string;
  title: string;
  subtitle: string;
  proof_hook: string;
  visual_angle: string;
};

type CopyDeck = {
  name: string;
  frames: CopyFrame[];
  small_promo: {
    title: string;
    subtitle: string;
    proof_hook: string;
  };
};

const ROOT = process.cwd();
const VERSION = '1.2.3';
const RELEASE_ROOT = path.resolve(ROOT, `release/cws/${VERSION}`);
const RAW_ROOT = path.join(RELEASE_ROOT, 'assets/composed/v1-indigo-technical-clarity');
const BACKGROUND = path.join(
  RELEASE_ROOT,
  'assets/imagegen/raw/v1-indigo-technical-clarity.png'
);
const ICON = path.resolve(ROOT, 'public/icons/icon-128.png');
const COPY_DECK = path.join(RELEASE_ROOT, 'copy-deck.json');
const RUNTIME_ROOT = path.join(RELEASE_ROOT, 'assets/runtime-v2');

const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapWords(value: string, maxCharacters: number): string[] {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxCharacters) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function multilineText(
  lines: string[],
  options: { x: number; y: number; lineHeight: number; size: number; weight?: number; fill: string; family?: string }
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${options.x}" y="${options.y + index * options.lineHeight}" ` +
        `font-family="${options.family ?? 'Arial, Helvetica, sans-serif'}" ` +
        `font-size="${options.size}" font-weight="${options.weight ?? 400}" ` +
        `fill="${options.fill}">${escapeXml(line)}</text>`
    )
    .join('');
}

function headerSvg(frame: CopyFrame): Buffer {
  const titleLines = wrapWords(frame.title, 27).slice(0, 2);
  const subtitleLines = wrapWords(frame.subtitle, 58).slice(0, 2);
  const titleStartY = 108;
  const subtitleStartY = titleStartY + titleLines.length * 61 + 18;
  return Buffer.from(`
    <svg width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <text x="68" y="58" font-family="Arial, Helvetica, sans-serif" font-size="17"
        font-weight="700" letter-spacing="2.4" fill="#B9B4FF">COPYLOT · CHROME EXTENSION</text>
      ${multilineText(titleLines, { x: 68, y: titleStartY, lineHeight: 61, size: 52, weight: 700, fill: '#FFFFFF' })}
      ${multilineText(subtitleLines, { x: 68, y: subtitleStartY, lineHeight: 32, size: 24, weight: 400, fill: '#DAD8FF' })}
    </svg>
  `);
}

async function baseCanvas(width: number, height: number): Promise<Buffer> {
  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#090826" fill-opacity="0.22"/>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#shade)"/>
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#080724" stop-opacity="0.18"/>
          <stop offset="0.62" stop-color="#221A69" stop-opacity="0.04"/>
          <stop offset="1" stop-color="#5D43FF" stop-opacity="0.10"/>
        </linearGradient>
      </defs>
    </svg>
  `);
  return sharp(BACKGROUND)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay }])
    .png()
    .toBuffer();
}

async function roundedImage(
  source: string,
  width: number,
  height: number,
  options?: {
    fit?: keyof sharp.FitEnum;
    background?: string;
    radius?: number;
    extract?: { left: number; top: number; width: number; height: number };
  }
): Promise<Buffer> {
  const radius = options?.radius ?? 24;
  let pipeline = sharp(source);
  if (options?.extract) pipeline = pipeline.extract(options.extract);
  const image = await pipeline
    .resize(width, height, {
      fit: options?.fit ?? 'contain',
      background: options?.background ?? '#F8FAFF'
    })
    .png()
    .toBuffer();
  const mask = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/>
    </svg>
  `);
  return sharp(image).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

function panelSvg(x: number, y: number, width: number, height: number): Buffer {
  return Buffer.from(`
    <svg width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x + 8}" y="${y + 14}" width="${width}" height="${height}" rx="26"
        fill="#050417" fill-opacity="0.34"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="26"
        fill="#FFFFFF" fill-opacity="0.97" stroke="#B8B2FF" stroke-opacity="0.55" stroke-width="2"/>
    </svg>
  `);
}

function outputPanelSvg(options: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  lines: string[];
  code?: boolean;
}): Buffer {
  const family = options.code ? 'Menlo, Monaco, monospace' : 'Arial, Helvetica, sans-serif';
  const fontSize = options.code ? 18 : 21;
  const lineHeight = options.code ? 27 : 31;
  const body = options.lines.slice(0, options.code ? 8 : 7);
  return Buffer.from(`
    <svg width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${options.x + 8}" y="${options.y + 14}" width="${options.width}" height="${options.height}" rx="26"
        fill="#050417" fill-opacity="0.34"/>
      <rect x="${options.x}" y="${options.y}" width="${options.width}" height="${options.height}" rx="26"
        fill="#FCFCFF" stroke="#B8B2FF" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="${options.x}" y="${options.y}" width="${options.width}" height="54" rx="26" fill="#EEEAFE"/>
      <rect x="${options.x}" y="${options.y + 29}" width="${options.width}" height="25" fill="#EEEAFE"/>
      <text x="${options.x + 24}" y="${options.y + 35}" font-family="Arial, Helvetica, sans-serif"
        font-size="16" font-weight="700" letter-spacing="1.4" fill="#4F46D8">${escapeXml(options.label)}</text>
      ${multilineText(body, {
        x: options.x + 26,
        y: options.y + 91,
        lineHeight,
        size: fontSize,
        weight: options.code ? 500 : 400,
        fill: '#141329',
        family
      })}
    </svg>
  `);
}

function arrowSvg(): Buffer {
  return Buffer.from(`
    <svg width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="640" cy="508" r="28" fill="#6457F5" stroke="#C7C2FF" stroke-width="2"/>
      <path d="M629 508h20m-7-8 8 8-8 8" stroke="#fff" stroke-width="3.2" stroke-linecap="round"
        stroke-linejoin="round" fill="none"/>
    </svg>
  `);
}

async function writeScreenshot01(frame: CopyFrame): Promise<string> {
  const output = path.join(RAW_ROOT, '01-clean-copy-starts-here.png');
  const popup = await roundedImage(path.join(RUNTIME_ROOT, '01-popup.png'), 350, 500, {
    fit: 'contain',
    background: '#F4F5FB',
    radius: 26,
    extract: { left: 0, top: 0, width: 360, height: 515 }
  });
  const base = await baseCanvas(SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);
  await sharp(base)
    .composite([
      { input: headerSvg(frame) },
      { input: panelSvg(820, 155, 350, 500) },
      { input: popup, left: 820, top: 155 },
      {
        input: Buffer.from(`
          <svg width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
            <rect x="68" y="515" width="615" height="118" rx="24" fill="#0B092D" fill-opacity="0.70"
              stroke="#8D83FF" stroke-opacity="0.65"/>
            <text x="98" y="558" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700"
              fill="#B9B4FF">SELECTION FIRST</text>
            <text x="98" y="597" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600"
              fill="#FFFFFF">Copy the content you need—without cleanup after.</text>
          </svg>
        `)
      }
    ])
    .png()
    .toFile(output);
  return output;
}

function readResultLines(value: string, maxLength = 78): string[] {
  const normalized = value.replace(/\t/g, '  ').split(/\r?\n/);
  const lines: string[] = [];
  for (const raw of normalized) {
    const trimmed = raw.trimEnd();
    if (!trimmed) {
      if (lines.at(-1) !== '') lines.push('');
      continue;
    }
    if (trimmed.length <= maxLength) {
      lines.push(trimmed);
      continue;
    }
    let rest = trimmed;
    while (rest.length > maxLength) {
      let split = rest.lastIndexOf(' ', maxLength);
      if (split < Math.floor(maxLength * 0.55)) split = maxLength;
      lines.push(rest.slice(0, split));
      rest = rest.slice(split).trimStart();
    }
    if (rest) lines.push(rest);
  }
  return lines;
}

async function writeProofFrame(options: {
  frame: CopyFrame;
  outputName: string;
  sourceImage: string;
  resultFile: string;
  sourceLabel: string;
  resultLabel: string;
  code?: boolean;
  sourceExtract?: { left: number; top: number; width: number; height: number };
}): Promise<string> {
  const output = path.join(RAW_ROOT, options.outputName);
  const source = await roundedImage(options.sourceImage, 520, 325, {
    fit: 'cover',
    background: '#FFFFFF',
    radius: 22,
    extract: options.sourceExtract
  });
  const result = await readFile(options.resultFile, 'utf8');
  const base = await baseCanvas(SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);
  await sharp(base)
    .composite([
      { input: headerSvg(options.frame) },
      { input: panelSvg(70, 340, 520, 325) },
      { input: source, left: 70, top: 340 },
      {
        input: outputPanelSvg({
          x: 690,
          y: 340,
          width: 520,
          height: 325,
          label: options.resultLabel,
          lines: readResultLines(result, options.code ? 42 : 40),
          code: options.code
        })
      },
      { input: arrowSvg() },
      {
        input: Buffer.from(`
          <svg width="${SCREENSHOT_WIDTH}" height="${SCREENSHOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
            <rect x="70" y="286" width="${Math.max(154, options.sourceLabel.length * 9 + 32)}" height="36" rx="18"
              fill="#131137" fill-opacity="0.88"/>
            <text x="88" y="310" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700"
              letter-spacing="1.1" fill="#FFFFFF">${escapeXml(options.sourceLabel)}</text>
          </svg>
        `)
      }
    ])
    .png()
    .toFile(output);
  return output;
}

async function writeScreenshot05(frame: CopyFrame): Promise<string> {
  const output = path.join(RAW_ROOT, '05-prompt-shortcuts.png');
  const options = await roundedImage(path.join(RUNTIME_ROOT, '05-prompts.png'), 1000, 625, {
    fit: 'contain',
    background: '#FFFFFF',
    radius: 24
  });
  const base = await baseCanvas(SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);
  await sharp(base)
    .composite([
      { input: headerSvg(frame) },
      { input: panelSvg(210, 245, 1000, 625) },
      { input: options, left: 210, top: 245 }
    ])
    .extract({ left: 0, top: 0, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT })
    .png()
    .toFile(output);
  return output;
}

async function writeSmallPromo(deck: CopyDeck): Promise<string> {
  const output = path.join(RAW_ROOT, 'small-promo-440x280.png');
  const base = await baseCanvas(440, 280);
  const icon = await roundedImage(ICON, 72, 72, { fit: 'contain', background: '#00000000', radius: 18 });
  const titleLines = ['Clean copy.', 'Ready to paste.'];
  await sharp(base)
    .composite([
      { input: icon, left: 28, top: 28 },
      {
        input: Buffer.from(`
          <svg width="440" height="280" xmlns="http://www.w3.org/2000/svg">
            <text x="116" y="52" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700"
              letter-spacing="1.8" fill="#B9B4FF">${escapeXml(deck.name.toUpperCase())}</text>
            ${multilineText(titleLines, { x: 116, y: 86, lineHeight: 32, size: 28, weight: 700, fill: '#FFFFFF' })}
            <rect x="28" y="174" width="384" height="72" rx="20" fill="#0D0B35" fill-opacity="0.72"
              stroke="#8D83FF" stroke-opacity="0.75"/>
            <text x="220" y="205" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700"
              fill="#FFFFFF">Markdown · CSV · plain text</text>
            <text x="220" y="231" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#DAD8FF">Ready for AI &amp; docs</text>
          </svg>
        `)
      }
    ])
    .png()
    .toFile(output);
  return output;
}

async function sha256(filePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function describe(filePath: string, role: string, copyId: string): Promise<Record<string, unknown>> {
  const metadata = await sharp(filePath).metadata();
  return {
    role,
    copy_id: copyId,
    path: path.relative(ROOT, filePath),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    sha256: await sha256(filePath)
  };
}

async function main(): Promise<void> {
  await mkdir(RAW_ROOT, { recursive: true });
  const deck = JSON.parse(await readFile(COPY_DECK, 'utf8')) as CopyDeck;
  if (deck.frames.length !== 5) throw new Error('copy deck must define exactly five screenshot frames');

  const outputs = [
    await writeScreenshot01(deck.frames[0]),
    await writeProofFrame({
      frame: deck.frames[1],
      outputName: '02-markdown-without-the-mess.png',
      sourceImage: path.join(RUNTIME_ROOT, '02-article-source.png'),
      resultFile: path.join(RUNTIME_ROOT, '02-markdown-result.md'),
      sourceLabel: 'REAL WEB ARTICLE',
      resultLabel: 'ACTUAL MARKDOWN OUTPUT'
    }),
    await writeProofFrame({
      frame: deck.frames[2],
      outputName: '03-tables-stay-structured.png',
      sourceImage: path.join(RUNTIME_ROOT, '03-table-source.png'),
      resultFile: path.join(RUNTIME_ROOT, '03-csv-result.csv'),
      sourceLabel: 'REAL WEB TABLE',
      resultLabel: 'ACTUAL CSV OUTPUT',
      code: true,
      sourceExtract: { left: 0, top: 0, width: 680, height: 425 }
    }),
    await writeProofFrame({
      frame: deck.frames[3],
      outputName: '04-code-keeps-its-shape.png',
      sourceImage: path.join(RUNTIME_ROOT, '04-code-source.png'),
      resultFile: path.join(RUNTIME_ROOT, '04-code-result.txt'),
      sourceLabel: 'REAL CODE BLOCK',
      resultLabel: 'ACTUAL CLEANED OUTPUT',
      code: true,
      sourceExtract: { left: 0, top: 0, width: 820, height: 512 }
    }),
    await writeScreenshot05(deck.frames[4])
  ];
  const smallPromo = await writeSmallPromo(deck);

  const manifest = {
    schema_version: 1,
    product: deck.name,
    version: VERSION,
    mode: 'imagegen-background-plus-real-runtime-proof',
    adopted_variant: 'v1-indigo-technical-clarity',
    imagegen_source: path.relative(ROOT, BACKGROUND),
    icon_reused: path.relative(ROOT, ICON),
    screenshots: await Promise.all(
      outputs.map((filePath, index) => describe(filePath, 'screenshot', deck.frames[index].id))
    ),
    small_promo: await describe(smallPromo, 'small_promo', 'small_promo'),
    product_ui_policy: 'Only runtime captures from the unpacked 1.2.3 build are used as product UI.',
    generated_at: new Date().toISOString()
  };
  await writeFile(path.join(RAW_ROOT, 'composed-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const promoManifest = {
    app_name: deck.name,
    mode: 'direct-imagegen-with-runtime-proof',
    assets: [
      ...outputs.map((filePath) => ({
        source: filePath,
        output_name: path.basename(filePath),
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT
      })),
      {
        source: smallPromo,
        output_name: path.basename(smallPromo),
        width: 440,
        height: 280
      }
    ]
  };
  await writeFile(
    path.join(RELEASE_ROOT, 'promo-source-manifest.json'),
    `${JSON.stringify(promoManifest, null, 2)}\n`,
    'utf8'
  );
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
