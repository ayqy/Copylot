#!/usr/bin/env node
/*
  inline-build.ts
  ---------------
  在临时目录 .tmp_build 内完成源码内联，然后调用 Vite 进行正式构建。
  构建完成后把 .tmp_build/dist 移动到项目根目录的 dist/。
*/

import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function log(message: string) {
  console.log(`[inline-build] ${message}`);
}

const ROOT_DIR = process.cwd();
const TMP_DIR = join(ROOT_DIR, '.tmp_build');
const DIST_DIR = join(ROOT_DIR, 'dist');

// ---------------------------------------------------------------------------
// Step 1: Prepare temporary directory
// ---------------------------------------------------------------------------
if (existsSync(TMP_DIR)) {
  rmSync(TMP_DIR, { recursive: true, force: true });
}
mkdirSync(TMP_DIR);
log('Created temporary directory .tmp_build');

// ---------------------------------------------------------------------------
// Step 2: Copy required project files into .tmp_build
// ---------------------------------------------------------------------------
const COPY_PATHS = [
  'src',
  'public',
  '_locales',
  'manifest.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'package.json',
  'scripts'
];

for (const p of COPY_PATHS) {
  const absSrc = join(ROOT_DIR, p);
  if (existsSync(absSrc)) {
    cpSync(absSrc, join(TMP_DIR, p), { recursive: true });
  }
}
log('Copied project files to .tmp_build');

// ---------------------------------------------------------------------------
// Step 2.1: Copy test directory into .tmp_build/test for inclusion in dist
// ---------------------------------------------------------------------------
const testDirSrc = join(ROOT_DIR, 'test');
const testDirDest = join(TMP_DIR, 'test');
if (existsSync(testDirSrc)) {
  cpSync(testDirSrc, testDirDest, { recursive: true });
  log('Copied test directory to .tmp_build/test');
}
log('Copied and organized test files into .tmp_build/test');

// ---------------------------------------------------------------------------
// Step 3: Inline modules into content script inside .tmp_build
// ---------------------------------------------------------------------------
const INLINE_REGEX = /\/\*\s*INLINE:([a-zA-Z0-9_-]+)\s*\*\//g;
const contentPath = join(TMP_DIR, 'src/content/content.ts');
let contentSrc = readFileSync(contentPath, 'utf8');
let match: RegExpExecArray | null;

const stripModuleSyntax = (code: string) =>
  code
    // remove import lines
    .replace(/^\s*import[^;]*;?\s*$/gm, '')
    // remove export keywords (default or named)
    .replace(/^\s*export\s+(default\s+)?/gm, '');

while ((match = INLINE_REGEX.exec(contentSrc)) !== null) {
  const moduleName = match[1];
  const moduleFile = join(TMP_DIR, 'src/shared', `${moduleName}.ts`);
  if (!existsSync(moduleFile)) {
    log(`⚠️  Module not found for inline: ${moduleName}`);
    continue;
  }
  let moduleCode = readFileSync(moduleFile, 'utf8');
  moduleCode = stripModuleSyntax(moduleCode).trim();
  contentSrc = contentSrc.replace(match[0], moduleCode);
  log(`Inlined module: ${moduleName}`);
}
writeFileSync(contentPath, contentSrc, 'utf8');
log('Finished inlining modules into content script');

// ---------------------------------------------------------------------------
// Step 4: Copy turndown.js and turndown-plugin-gfm into temporary root so they end up in dist
// ---------------------------------------------------------------------------
const TURNDOWN_SRC = join(ROOT_DIR, 'node_modules/turndown/dist/turndown.js');
const TURNDOWN_PLUGIN_SRC = join(ROOT_DIR, 'node_modules/turndown-plugin-gfm/dist/turndown-plugin-gfm.js');
const turndownTmpDest = join(TMP_DIR, 'src/turndown.js');
const turndownPluginTmpDest = join(TMP_DIR, 'src/turndown-plugin-gfm.js');

if (existsSync(TURNDOWN_SRC)) {
  // Copy to temp build dir for Vite
  cpSync(TURNDOWN_SRC, turndownTmpDest);
  log('Copied turndown.js to temporary build directory');
} else {
  log('⚠️  turndown.js not found; make sure turndown is installed');
}

if (existsSync(TURNDOWN_PLUGIN_SRC)) {
  // Copy to temp build dir for Vite
  cpSync(TURNDOWN_PLUGIN_SRC, turndownPluginTmpDest);
  log('Copied turndown-plugin-gfm.js to temporary build directory');
} else {
  log('⚠️  turndown-plugin-gfm.js not found; make sure turndown-plugin-gfm is installed');
}

// ---------------------------------------------------------------------------
// Step 5: Run Vite build inside .tmp_build (no sourcemap)
// ---------------------------------------------------------------------------
log('Running Vite build (production, no sourcemap)...');
execSync('npx vite build --no-sourcemap', {
  cwd: TMP_DIR,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

// ---------------------------------------------------------------------------
// Step 6: Move dist back to project root
// ---------------------------------------------------------------------------
if (existsSync(DIST_DIR)) {
  rmSync(DIST_DIR, { recursive: true, force: true });
}
cpSync(join(TMP_DIR, 'dist'), DIST_DIR, { recursive: true });

// Ensure turndown.js is in the final dist directory
const turndownDist = join(DIST_DIR, 'src/turndown.js');
const turndownPluginDist = join(DIST_DIR, 'src/turndown-plugin-gfm.js');
const distSrcDir = join(DIST_DIR, 'src');

if (!existsSync(distSrcDir)) {
  mkdirSync(distSrcDir, { recursive: true });
}

if (existsSync(TURNDOWN_SRC)) {
  cpSync(TURNDOWN_SRC, turndownDist);
  log('Copied turndown.js to final dist directory');
} else {
  log('⚠️  turndown.js not found in final copy step');
}

if (existsSync(TURNDOWN_PLUGIN_SRC)) {
  cpSync(TURNDOWN_PLUGIN_SRC, turndownPluginDist);
  log('Copied turndown-plugin-gfm.js to final dist directory');
} else {
  log('⚠️  turndown-plugin-gfm.js not found in final copy step');
}

log('Moved build output to ./dist');

log('✅ Build finished successfully');
