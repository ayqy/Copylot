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

// 检查是否为生产环境构建
const isProductionBuild = process.env.BUILD_TARGET === 'production';

function log(message: string) {
  if (message.includes('⚠️')) {
    console.log(`[inline-build${isProductionBuild ? '-prod' : ''}] ${message}`);
  }
}

const ROOT_DIR = process.cwd();
const TMP_DIR = join(ROOT_DIR, isProductionBuild ? '.tmp_build_prod' : '.tmp_build');
const DIST_DIR = join(ROOT_DIR, 'dist');

// ---------------------------------------------------------------------------
// Step 1: Prepare temporary directory
// ---------------------------------------------------------------------------
if (existsSync(TMP_DIR)) {
  rmSync(TMP_DIR, { recursive: true, force: true });
}
mkdirSync(TMP_DIR);
log(`Created temporary directory ${isProductionBuild ? '.tmp_build_prod' : '.tmp_build'}`);

// ---------------------------------------------------------------------------
// Step 2: Copy required project files into temporary directory
// ---------------------------------------------------------------------------
const COPY_PATHS = [
  'src',
  '_locales',
  'manifest.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'package.json',
  'scripts'
];

// 生产环境构建时排除public目录中的测试文件
if (isProductionBuild) {
  // Copy public directory but exclude test files
  const publicSrc = join(ROOT_DIR, 'public');
  const publicDest = join(TMP_DIR, 'public');
  if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDest, { 
      recursive: true,
      filter: (src) => {
        // Exclude any path containing 'test' or test-manifest.json
        const basename = src.split('/').pop() || src.split('\\').pop() || '';
        return !src.includes('/test/') && 
               !src.includes('\\test\\') && 
               !src.endsWith('/test') && 
               !src.endsWith('\\test') &&
               basename !== 'test-manifest.json';
      }
    });
    log('Copied public directory (excluding test files and test-manifest.json)');
  }
} else {
  COPY_PATHS.push('public');
}

for (const p of COPY_PATHS) {
  const absSrc = join(ROOT_DIR, p);
  if (existsSync(absSrc)) {
    cpSync(absSrc, join(TMP_DIR, p), { recursive: true });
  }
}
log(`Copied project files to ${isProductionBuild ? '.tmp_build_prod' : '.tmp_build'}${isProductionBuild ? ' (excluding test directory)' : ''}`);

// ---------------------------------------------------------------------------
// Step 2.1: Copy test directory (only for development builds)
// ---------------------------------------------------------------------------
if (!isProductionBuild) {
  const testDirSrc = join(ROOT_DIR, 'test');
  const testDirDest = join(TMP_DIR, 'test');
  if (existsSync(testDirSrc)) {
    cpSync(testDirSrc, testDirDest, { recursive: true });
    log('Copied test directory to temporary build directory');
  }
}

// ---------------------------------------------------------------------------
// Step 3: Inline modules into content scripts inside .tmp_build
// ---------------------------------------------------------------------------
const INLINE_REGEX = /\/\*\s*INLINE:([a-zA-Z0-9_-]+)\s*\*\//g;

// Process wechat-content.ts
const wechatContentPath = join(TMP_DIR, 'src/content/wechat-content.ts');
if (existsSync(wechatContentPath)) {
  let contentSrc = readFileSync(wechatContentPath, 'utf8');
  let match: RegExpExecArray | null;

  const stripModuleSyntax = (code: string) =>
    code
      // remove import lines
      .replace(/^\s*import[^;]*;?\s*$/gm, '')
      // remove export keywords (default or named)
      .replace(/^\s*export\s+(default\s+)?/gm, '');

  INLINE_REGEX.lastIndex = 0; // Reset regex state
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
    log(`Inlined module: ${moduleName} into wechat-content.ts`);
  }
  writeFileSync(wechatContentPath, contentSrc);
}

// Process zhihu-publisher.ts
const zhihuPublisherPath = join(TMP_DIR, 'src/content/zhihu-publisher.ts');
if (existsSync(zhihuPublisherPath)) {
  let contentSrc = readFileSync(zhihuPublisherPath, 'utf8');
  let match: RegExpExecArray | null;

  const stripModuleSyntax = (code: string) =>
    code
      // remove import lines
      .replace(/^\s*import[^;]*;?\s*$/gm, '')
      // remove export keywords (default or named)
      .replace(/^\s*export\s+(default\s+)?/gm, '');

  INLINE_REGEX.lastIndex = 0; // Reset regex state
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
    log(`Inlined module: ${moduleName} into zhihu-publisher.ts`);
  }
  writeFileSync(zhihuPublisherPath, contentSrc);
}

// ---------------------------------------------------------------------------
// Step 4: No Turndown dependencies needed for new architecture
// ---------------------------------------------------------------------------
log('Skipping Turndown dependencies - not needed for WeChat to Zhihu publisher');

// ---------------------------------------------------------------------------
// Step 5: Run Vite build in temporary directory
// ---------------------------------------------------------------------------
log(`Running Vite build (${isProductionBuild ? 'production, no sourcemap, no tests' : 'production, no sourcemap'})...`);
execSync('npx vite build --no-sourcemap --logLevel error', {
  cwd: TMP_DIR,
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    BUILD_TARGET: isProductionBuild ? 'production' : 'development'
  }
});

// ---------------------------------------------------------------------------
// Step 6: Move dist back to project root
// ---------------------------------------------------------------------------
if (existsSync(DIST_DIR)) {
  rmSync(DIST_DIR, { recursive: true, force: true });
}
cpSync(join(TMP_DIR, 'dist'), DIST_DIR, { recursive: true });

// No additional files needed for final dist directory

log('Moved build output to ./dist');

// ---------------------------------------------------------------------------
// Step 8: Clean up temporary directory (production builds only)
// ---------------------------------------------------------------------------
if (isProductionBuild) {
  rmSync(TMP_DIR, { recursive: true, force: true });
  log('Cleaned up temporary directory');
}

log(`✅ ${isProductionBuild ? 'Production build finished successfully - ready for Chrome Web Store!' : 'Build finished successfully'}`);
