#!/usr/bin/env node
/* eslint-disable no-control-regex */

/**
 * 检测项目中未本地化的固定文案
 * 使用 TypeScript AST 分析，准确识别需要本地化的字符串字面量
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

interface UntranslatedLiteral {
  file: string;
  line: number;
  column: number;
  text: string;
  type: 'literal' | 'fallback';
}

const CONSOLE_METHODS = ['log', 'warn', 'error', 'debug', 'info', 'trace'];

function isConsoleCall(node: ts.Node): boolean {
  let parent = node.parent;
  while (parent) {
    if (
      ts.isCallExpression(parent) &&
      ts.isPropertyAccessExpression(parent.expression) &&
      ts.isIdentifier(parent.expression.expression) &&
      parent.expression.expression.text === 'console' &&
      ts.isIdentifier(parent.expression.name) &&
      CONSOLE_METHODS.includes(parent.expression.name.text)
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function isI18nCall(node: ts.Node): boolean {
  let parent = node.parent;
  while (parent) {
    if (
      ts.isCallExpression(parent) &&
      ts.isPropertyAccessExpression(parent.expression) &&
      ts.isPropertyAccessExpression(parent.expression.expression) &&
      ts.isPropertyAccessExpression(parent.expression.expression.expression) &&
      ts.isIdentifier(parent.expression.expression.expression.expression) &&
      parent.expression.expression.expression.expression.text === 'chrome' &&
      ts.isIdentifier(parent.expression.expression.expression.name) &&
      parent.expression.expression.expression.name.text === 'i18n' &&
      ts.isIdentifier(parent.expression.expression.name) &&
      parent.expression.expression.name.text === 'getMessage'
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function isCSSLiteral(text: string): boolean {
  // CSS 属性名
  const cssProperties = [
    'display', 'position', 'top', 'left', 'right', 'bottom', 'width', 'height',
    'margin', 'padding', 'border', 'background', 'color', 'font', 'text',
    'flex', 'grid', 'transform', 'transition', 'animation', 'opacity',
    'z-index', 'overflow', 'cursor', 'outline', 'box-shadow', 'border-radius',
    'justify-content', 'align-items', 'align-content', 'flex-direction',
    'flex-wrap', 'gap', 'row-gap', 'column-gap', 'order', 'flex-grow',
    'flex-shrink', 'flex-basis', 'white-space', 'word-wrap', 'text-align',
    'vertical-align', 'line-height', 'letter-spacing', 'word-spacing',
    'text-decoration', 'text-transform', 'font-family', 'font-size',
    'font-weight', 'font-style', 'list-style', 'table-layout', 'border-collapse',
    'border-spacing', 'empty-cells', 'caption-side', 'content', 'quotes',
    'counter-reset', 'counter-increment', 'resize', 'user-select', 'pointer-events'
  ];

  // CSS 值
  const cssValues = [
    'none', 'block', 'inline', 'inline-block', 'flex', 'grid', 'table',
    'absolute', 'relative', 'fixed', 'static', 'sticky', 'hidden', 'visible',
    'auto', 'scroll', 'center', 'left', 'right', 'top', 'bottom', 'middle',
    'baseline', 'inherit', 'initial', 'unset', 'transparent', 'currentColor',
    'pointer', 'default', 'text', 'crosshair', 'move', 'help', 'wait',
    'normal', 'bold', 'italic', 'underline', 'overline', 'line-through',
    'uppercase', 'lowercase', 'capitalize', 'nowrap', 'pre', 'pre-wrap',
    'break-word', 'keep-all', 'break-all', 'ease', 'ease-in', 'ease-out',
    'ease-in-out', 'linear', 'infinite', 'alternate', 'reverse', 'forwards',
    'backwards', 'both', 'paused', 'running', 'cover', 'contain', 'repeat',
    'no-repeat', 'space', 'round', 'stretch', 'border-box', 'content-box',
    'padding-box'
  ];

  // 检查是否是 CSS 颜色值 (#hex, rgb, rgba, hsl, hsla)
  if (/^#[0-9A-Fa-f]{3,8}$/.test(text) || 
      /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/.test(text) ||
      /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(\s*,\s*[\d.]+)?\s*\)$/.test(text)) {
    return true;
  }

  // 检查是否是 CSS 单位值 (px, em, rem, %, vh, vw, etc.)
  if (/^-?\d*\.?\d+(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|deg|rad|grad|turn|s|ms|fr)$/.test(text)) {
    return true;
  }

  // 检查是否是 CSS transform 函数
  if (/^(translate|scale|rotate|skew|matrix)[XYZ]?\([^)]*\)$/.test(text)) {
    return true;
  }

  // 检查是否是具体的 CSS 属性名或值
  if (cssProperties.includes(text.toLowerCase()) || cssValues.includes(text.toLowerCase())) {
    return true;
  }

  // 检查是否是 CSS 选择器
  if (/^[.#]?[\w-]+(\s*[>+~]\s*[\w-]+)*$/.test(text) && text.length < 50) {
    return true;
  }

  // 检查是否是 box-shadow 或类似的复合值
  if (/^\d+px\s+\d+px\s+\d+px\s+(rgba?\([^)]+\)|#[0-9A-Fa-f]{3,8})/.test(text)) {
    return true;
  }

  return false;
}

function isFilePathOrUrl(text: string): boolean {
  // 文件路径
  if (/^\.{1,2}\//.test(text) || /^\//.test(text) || /\\/.test(text)) {
    return true;
  }
  
  // URL
  if (/^https?:\/\//.test(text) || /^data:/.test(text) || /^blob:/.test(text)) {
    return true;
  }
  
  // 文件扩展名
  if (/\.(js|ts|tsx|css|html|json|md|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/i.test(text)) {
    return true;
  }
  
  return false;
}

function isDOMSelector(text: string): boolean {
  // HTML 标签名
  const htmlTags = [
    'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot',
    'form', 'input', 'button', 'select', 'option', 'textarea', 'label',
    'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
    'canvas', 'svg', 'video', 'audio', 'iframe', 'script', 'style', 'link',
    'meta', 'head', 'body', 'html', 'title'
  ];
  
  if (htmlTags.includes(text.toLowerCase())) {
    return true;
  }
  
  // CSS 选择器格式
  if (/^[.#][\w-]+$/.test(text)) {
    return true;
  }
  
  // 属性选择器
  if (/^\[[\w-]+(="[^"]*")?\]$/.test(text)) {
    return true;
  }
  
  return false;
}

function isDataAttribute(text: string): boolean {
  return /^data-[\w-]+$/.test(text);
}

function isHTMLAttribute(text: string): boolean {
  const htmlAttributes = [
    'id', 'class', 'style', 'title', 'alt', 'src', 'href', 'target', 'type',
    'value', 'name', 'placeholder', 'disabled', 'readonly', 'checked', 'selected',
    'multiple', 'required', 'autofocus', 'autocomplete', 'maxlength', 'minlength',
    'max', 'min', 'step', 'pattern', 'role', 'aria-label', 'aria-hidden',
    'aria-expanded', 'aria-selected', 'aria-checked', 'tabindex', 'contenteditable',
    'draggable', 'dropzone', 'hidden', 'lang', 'dir', 'translate', 'spellcheck'
  ];
  
  return htmlAttributes.includes(text.toLowerCase());
}

function isTechnicalLiteral(text: string): boolean {
  // SVG 或 Base64 数据
  if (text.includes('<svg') || text.startsWith('data:image/') || text.includes('base64')) {
    return true;
  }
  
  // CSS 变量
  if (/^var\(--[\w-]+\)$/.test(text)) {
    return true;
  }
  
  // CSS 动画名称或关键帧
  if (/^[\w-]+-[\w-]+$/.test(text) && (text.includes('ease') || text.includes('animation') || text.includes('copilot'))) {
    return true;
  }
  
  // 复合 CSS 值 (box-shadow, border, etc.)
  if (/^\d+px\s+\d+px/.test(text) || /^rgba?\(/.test(text)) {
    return true;
  }
  
  // MIME 类型
  if (/^[\w-]+\/[\w-]+$/.test(text)) {
    return true;
  }
  
  // URL 协议
  if (/^[\w-]+:$/.test(text)) {
    return true;
  }
  
  // 浏览器扩展协议
  if (/^(chrome|moz|chrome-extension|moz-extension):/.test(text)) {
    return true;
  }
  
  // CSS 函数调用
  if (/^[\w-]+\([^)]*\)$/.test(text) && (text.includes('blur') || text.includes('translate') || text.includes('scale') || text.includes('rect'))) {
    return true;
  }
  
  // 占位符变量
  if (/^\{[\w-]+\}$/.test(text)) {
    return true;
  }
  
  // HTML 标签内容
  if (/^<[\w\s="'-]+>$/.test(text)) {
    return true;
  }
  
  // 技术性选择器 
  if (/^[\w-]+\.[\w-]+/.test(text) || /^\[[\w="-]+\]$/.test(text)) {
    return true;
  }
  
  // CSS 类名或 ID 名
  if (/^[\w-]+(--[\w-]+)*$/.test(text) && text.includes('-') && text.length < 30) {
    return true;
  }
  
  // CSS 多行样式块
  if (text.includes('\n') && (text.includes(':') && text.includes(';'))) {
    return true;
  }
  
  // CSS 复合边框样式
  if (/^\d+px\s+solid\s+#[0-9A-Fa-f]{6}$/.test(text)) {
    return true;
  }
  
  // CSS 复合过渡/动画
  if (/^[\w-]+\s+[\d.]+s\s+[\w-]+/.test(text)) {
    return true;
  }
  
  // CSS 伪类选择器
  if (/^[\w\s,.#:-]+$/.test(text) && text.includes(':') && text.length < 40) {
    return true;
  }
  
  // HTML 属性键值对
  if (/^[\w-]+="[\w-]+"$/.test(text)) {
    return true;
  }
  
  // 系统/内部错误消息（包含特定技术术语）
  if (text.includes('execCommand') || 
      text.includes('document.') ||
      text.includes('...[truncated]') ||
      text.includes('quota exceeded')) {
    return true;
  }
  
  return false;
}

function checkStringLiteral(
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
  sourceFile: ts.SourceFile,
  results: UntranslatedLiteral[]
): void {
  const text = node.text;
  
  // 过滤条件：长度 >= 4
  if (text.length < 4) {
    return;
  }

  // 检查是否包含非ASCII字符或英文单词
  // 匹配 ASCII 以外的字符，避免 ESLint no-control-regex 误报
  const hasNonAscii = /[\u0080-\uFFFF]/.test(text);
  const hasEnglishWords = /[a-zA-Z]{2,}/.test(text);
  
  if (!hasNonAscii && !hasEnglishWords) {
    return;
  }

  // 排除各种技术性字面量
  if (isCSSLiteral(text) || 
      isFilePathOrUrl(text) || 
      isDOMSelector(text) || 
      isDataAttribute(text) || 
      isHTMLAttribute(text) ||
      isTechnicalLiteral(text)) {
    return;
  }

  // 排除 console 调用
  if (isConsoleCall(node)) {
    return;
  }

  // 排除 chrome.i18n.getMessage 调用
  if (isI18nCall(node)) {
    return;
  }

  let type: 'literal' | 'fallback' = 'literal';

  // 检查是否是 fallback 文案 (|| 'fallback')
  const parent = node.parent;
  if (
    parent &&
    ts.isBinaryExpression(parent) &&
    parent.operatorToken.kind === ts.SyntaxKind.BarBarToken &&
    parent.right === node
  ) {
    // 检查左侧是否是 chrome.i18n.getMessage 调用
    if (
      ts.isCallExpression(parent.left) &&
      ts.isPropertyAccessExpression(parent.left.expression) &&
      ts.isPropertyAccessExpression(parent.left.expression.expression) &&
      ts.isPropertyAccessExpression(parent.left.expression.expression.expression) &&
      ts.isIdentifier(parent.left.expression.expression.expression.expression) &&
      parent.left.expression.expression.expression.expression.text === 'chrome' &&
      ts.isIdentifier(parent.left.expression.expression.expression.name) &&
      parent.left.expression.expression.expression.name.text === 'i18n' &&
      ts.isIdentifier(parent.left.expression.expression.name) &&
      parent.left.expression.expression.name.text === 'getMessage'
    ) {
      type = 'fallback';
    }
  }

  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;
  
  results.push({
    file: sourceFile.fileName,
    line: position.line + 1,
    column: position.character + 1,
    text: displayText,
    type,
  });
}

function visitNode(node: ts.Node, sourceFile: ts.SourceFile, results: UntranslatedLiteral[]): void {
  if (ts.isStringLiteral(node)) {
    checkStringLiteral(node, sourceFile, results);
  } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
    checkStringLiteral(node, sourceFile, results);
  }

  ts.forEachChild(node, child => visitNode(child, sourceFile, results));
}

function analyzeFile(filePath: string): UntranslatedLiteral[] {
  const results: UntranslatedLiteral[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    visitNode(sourceFile, sourceFile, results);
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }

  return results;
}

async function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const pattern = path.join(srcDir, '**/*.{ts,tsx}').replace(/\\/g, '/');
  
  try {
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(pattern, (err, matches) => {
        if (err) reject(err);
        else resolve(matches);
      });
    });
    console.log(`正在检查 ${files.length} 个文件...`);
    
    let allResults: UntranslatedLiteral[] = [];
    
    for (const file of files) {
      const results = analyzeFile(file);
      allResults = allResults.concat(results);
    }

    if (allResults.length === 0) {
      console.log('✅ 未发现未本地化的固定文案');
      process.exit(0);
    }

    console.log(`\n❌ 发现 ${allResults.length} 个未本地化的固定文案：\n`);
    
    // 按文件分组显示结果
    const resultsByFile = allResults.reduce((acc, result) => {
      const relativePath = path.relative(process.cwd(), result.file);
      if (!acc[relativePath]) {
        acc[relativePath] = [];
      }
      acc[relativePath].push(result);
      return acc;
    }, {} as Record<string, UntranslatedLiteral[]>);

    for (const [file, results] of Object.entries(resultsByFile)) {
      console.log(`📄 ${file}:`);
      for (const result of results) {
        const typeLabel = result.type === 'fallback' ? '[Fallback]' : '[Literal]';
        console.log(`  ${result.line}:${result.column} ${typeLabel} "${result.text}"`);
      }
      console.log();
    }

    process.exit(1);
  } catch (error) {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
  }
}

main();
