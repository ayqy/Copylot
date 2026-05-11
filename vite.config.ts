import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { transformSync, buildSync } from 'esbuild';
import glob from 'glob';
import { generateIcons } from './scripts/generate-icons';
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';

// 检查是否构建特定脚本
const scriptToBuild = process.env.SCRIPT;
// 检查是否为生产环境构建（不包含测试代码和彩蛋）
const isProductionBuild = process.env.BUILD_TARGET === 'production';
const isE2EBuild = process.env.BUILD_TARGET === 'e2e';

const extensionHtmlAssets = [
  { source: './src/popup/popup.html', fileName: 'src/popup/popup.html', label: 'popup.html' },
  { source: './src/options/options.html', fileName: 'src/options/options.html', label: 'options.html' },
  { source: './src/devtools/devtools.html', fileName: 'src/devtools/devtools.html', label: 'devtools.html' },
  { source: './src/devtools/sidebar.html', fileName: 'src/devtools/sidebar.html', label: 'sidebar.html' }
];

if (isE2EBuild) {
  extensionHtmlAssets.push({
    source: './src/e2e/driver.html',
    fileName: 'src/e2e/driver.html',
    label: 'driver.html'
  });
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: scriptToBuild ? false : true, // 只有完整构建时清空目录
    rollupOptions: scriptToBuild ? getSingleScriptConfig(scriptToBuild) : getAllScriptsConfig(),
    // Generate source maps for development
    sourcemap: process.env.NODE_ENV === 'development',
    // Minify for production
    minify: process.env.NODE_ENV === 'production',
    target: 'es2020'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  define: {
    // Define environment variables
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.BUILD_TARGET': JSON.stringify(process.env.BUILD_TARGET || 'development')
  },
  plugins: [
    // Custom plugin to handle extension-specific tasks
    {
      name: 'chrome-extension-builder',
      buildStart() {
        console.log(`🚀 Building Chrome Extension${isProductionBuild ? ' (Production)' : ''}...`);
        // 生产环境构建不需要清理测试文件
        if (!isProductionBuild) {
          // Cleanup old test artifacts in public/test to avoid stale runner.js/ts conflicts
          try {
            const testDir = resolve(__dirname, 'public', 'test');
            if (existsSync(testDir)) {
              const walk = (dir: string) => {
                const entries = readdirSync(dir);
                for (const entry of entries) {
                  const full = resolve(dir, entry);
                  const stats = statSync(full);
                  if (stats.isDirectory()) {
                    walk(full);
                  } else if (full.endsWith('.ts') || /runner\.js$/.test(full)) {
                    unlinkSync(full);
                  }
                }
              };
              walk(testDir);
              console.log('🧹 Cleaned stale .ts and runner.js from public/test');
            }
          } catch (err) {
            console.warn('Cleanup public/test failed:', (err as Error).message);
          }
        }
      },
      async buildEnd() {
        // 只有完整构建时才生成图标
        if (!scriptToBuild) {
          try {
            console.log('📦 Generating icons...');
            await generateIcons();
            console.log('✅ Icons generated successfully');
          } catch (error) {
            console.error('❌ Error generating icons:', error);
          }
        }
      },
      generateBundle() {
        // 只有完整构建时才复制资源文件
        if (!scriptToBuild) {
          // Copy manifest.json to dist
          try {
            const manifestContent = readFileSync('./manifest.json', 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'manifest.json',
              source: manifestContent
            });
          } catch (error) {
            console.warn('Warning: Could not copy manifest.json:', error.message);
          }

          // Copy locales
          const locales = ['en', 'zh'];
          locales.forEach((locale) => {
            try {
              const messagesContent = readFileSync(`./_locales/${locale}/messages.json`, 'utf-8');
              this.emitFile({
                type: 'asset',
                fileName: `_locales/${locale}/messages.json`,
                source: messagesContent
              });
            } catch (error) {
              console.warn(`Warning: Could not copy locale ${locale}:`, error.message);
            }
          });

          extensionHtmlAssets.forEach(({ source, fileName, label }) => {
            try {
              const html = readFileSync(source, 'utf-8');
              this.emitFile({
                type: 'asset',
                fileName,
                source: html
              });
            } catch (error) {
              console.warn(`Warning: Could not copy ${label}:`, (error as Error).message);
            }
          });

          // Ensure turndown scripts are copied for content script
          try {
            ['src/turndown.js', 'src/turndown-plugin-gfm.js'].forEach((p) => {
              const content = readFileSync(`./${p}`, 'utf-8');
              this.emitFile({ type: 'asset', fileName: p, source: content });
            });
          } catch (error) {
            console.warn('Warning: Could not copy turndown scripts:', (error as Error).message);
          }

          // 生产环境构建：不包含测试资源和测试运行器
          if (!isProductionBuild) {
            // Copy all test assets (html/css/js/json/md/ts) - only for development builds
            try {
              const testFiles = glob.sync('./test/**/*.{html,css,js,json,md,ts}', { nodir: true });
              testFiles.forEach((file) => {
                try {
                  // Skip .js file if corresponding .ts exists to avoid stale overrides
                  if (file.endsWith('.js')) {
                    const tsSibling = file.slice(0, -3) + '.ts';
                    if (testFiles.includes(tsSibling)) {
                      return; // ignore js sibling
                    }
                  }
                  const source = readFileSync(file, 'utf-8');
                  if (file.endsWith('.ts')) {
                    let code: string;
                    if (file.endsWith('runner.ts')) {
                      // Bundle runner.ts to include its dependencies (e.g., diff)
                      const bundle = buildSync({
                        entryPoints: [file],
                        bundle: true,
                        platform: 'browser',
                        format: 'esm',
                        target: 'es2020',
                        write: false
                      });
                      code = bundle.outputFiles[0].text;
                    } else {
                      const result = transformSync(source, {
                        loader: 'ts',
                        format: 'esm',
                        target: 'es2020',
                        sourcemap: false
                      });
                      code = result.code;
                    }
                    const jsFileName = file.replace('./', '').replace(/\.ts$/, '.js');
                    this.emitFile({ type: 'asset', fileName: jsFileName, source: code });
                  } else {
                    this.emitFile({ type: 'asset', fileName: file.replace('./', ''), source });
                  }
                } catch (error) {
                  console.warn('Warning: Could not copy/compile test asset', file, ':', (error as Error).message);
                }
              });
            } catch (error) {
              console.warn('Warning: Failed to glob test assets:', (error as Error).message);
            }
          }
        }
      }
    }
  ],
  // Optimize dependencies
  optimizeDeps: {
    include: ['turndown', 'uuid']
  },
  // Development server (not used for extension, but useful for testing components)
  server: {
    port: 3000,
    open: false
  }
});

// 单个脚本构建配置
function getSingleScriptConfig(script: string) {
  const configs: Record<
    string,
    {
      input: string;
      output: {
        format: 'iife' | 'umd';
        name: string;
        file: string;
        inlineDynamicImports: boolean;
      };
    }
  > = {
    content: {
      input: resolve(__dirname, 'src/content/content.ts'),
      output: {
        format: 'iife',
        name: 'AICopilotContent',
        file: 'dist/src/content/content.js',
        inlineDynamicImports: true
      }
    },
    popup: {
      input: resolve(__dirname, 'src/popup/popup.ts'),
      output: {
        format: 'umd',
        name: 'AICopilotPopup',
        file: 'dist/src/popup/popup.js',
        inlineDynamicImports: true
      }
    },
    background: {
      input: resolve(__dirname, 'src/background.ts'),
      output: {
        format: 'umd',
        name: 'AICopilotBackground',
        file: 'dist/src/background.js',
        inlineDynamicImports: true
      }
    }
  };

  return configs[script] || configs.content;
}

// 所有脚本构建配置（使用 ES 模块，适合现代浏览器）
function getAllScriptsConfig() {
  const input: Record<string, string> = {
    content: resolve(__dirname, 'src/content/content.ts'),
    popup: resolve(__dirname, 'src/popup/popup.ts'),
    options: resolve(__dirname, 'src/options/options.ts'),
    background: resolve(__dirname, 'src/background.ts'),
    devtools: resolve(__dirname, 'src/devtools/devtools.js'),
    sidebar: resolve(__dirname, 'src/devtools/sidebar.js')
  };

  if (isE2EBuild) {
    input['e2e-driver'] = resolve(__dirname, 'src/e2e/driver.ts');
  }

  return {
    input,
    output: {
      format: 'es',
      entryFileNames: (chunkInfo) => {
        const name = chunkInfo.name;
        if (name === 'content') return 'src/content/content.js';
        if (name === 'popup') return 'src/popup/popup.js';
        if (name === 'options') return 'src/options/options.js';
        if (name === 'background') return 'src/background.js';
        if (name === 'devtools') return 'src/devtools/devtools.js';
        if (name === 'sidebar') return 'src/devtools/sidebar.js';
        if (name === 'e2e-driver') return 'src/e2e/driver.js';
        return '[name].js';
      },
      chunkFileNames: 'chunks/[name]-[hash].js',
      assetFileNames: (assetInfo) => {
        const name = assetInfo.name || '';
        if (name.endsWith('.css')) {
          if (name.includes('popup')) return 'src/popup/popup.css';
          if (name.includes('options')) return 'src/options/options.css';
          if (name.includes('sidebar')) return 'src/devtools/sidebar.css';
          return 'src/[name].[ext]';
        }
        return 'assets/[name]-[hash].[ext]';
      }
    }
  };
}
