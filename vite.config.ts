import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { generateIcons } from './scripts/generate-icons';

// 检查是否构建特定脚本
const scriptToBuild = process.env.SCRIPT;

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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  plugins: [
    // Custom plugin to handle extension-specific tasks
    {
      name: 'chrome-extension-builder',
      buildStart() {
        console.log('🚀 Building Chrome Extension...');
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
      generateBundle(options, bundle) {
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

          // Copy popup HTML
          try {
            const popupHtml = readFileSync('./src/popup/popup.html', 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'src/popup/popup.html',
              source: popupHtml
            });
          } catch (error) {
            console.warn('Warning: Could not copy popup.html:', error.message);
          }

          // Copy devtools HTML
          try {
            const devtoolsHtml = readFileSync('./src/devtools/devtools.html', 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'src/devtools/devtools.html',
              source: devtoolsHtml
            });
          } catch (error) {
            console.warn('Warning: Could not copy devtools.html:', error.message);
          }

          // Copy sidebar HTML
          try {
            const sidebarHtml = readFileSync('./src/devtools/sidebar.html', 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'src/devtools/sidebar.html',
              source: sidebarHtml
            });
          } catch (error) {
            console.warn('Warning: Could not copy sidebar.html:', error.message);
          }
        }
      }
    }
  ],
  // Optimize dependencies
  optimizeDeps: {
    include: ['turndown']
  },
  // Development server (not used for extension, but useful for testing components)
  server: {
    port: 3000,
    open: false
  }
});

// 单个脚本构建配置
function getSingleScriptConfig(script: string) {
  const configs: Record<string, any> = {
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
  return {
    input: {
      content: resolve(__dirname, 'src/content/content.ts'),
      popup: resolve(__dirname, 'src/popup/popup.ts'),
      background: resolve(__dirname, 'src/background.ts'),
      devtools: resolve(__dirname, 'src/devtools/devtools.js'),
      sidebar: resolve(__dirname, 'src/devtools/sidebar.js')
    },
    output: {
      format: 'es',
      entryFileNames: (chunkInfo) => {
        const name = chunkInfo.name;
        if (name === 'content') return 'src/content/content.js';
        if (name === 'popup') return 'src/popup/popup.js';
        if (name === 'background') return 'src/background.js';
        if (name === 'devtools') return 'src/devtools/devtools.js';
        if (name === 'sidebar') return 'src/devtools/sidebar.js';
        return '[name].js';
      },
      chunkFileNames: 'chunks/[name]-[hash].js',
      assetFileNames: (assetInfo) => {
        const name = assetInfo.name || '';
        if (name.endsWith('.css')) {
          if (name.includes('popup')) return 'src/popup/popup.css';
          if (name.includes('sidebar')) return 'src/devtools/sidebar.css';
          return 'src/[name].[ext]';
        }
        return 'assets/[name]-[hash].[ext]';
      }
    }
  };
}
