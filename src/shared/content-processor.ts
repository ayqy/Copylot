// Content processor functionality (using TurndownService from global scope)
import type { Settings } from './settings-manager'; // Import type for Settings
import { createVisibleClone } from './dom-preprocessor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const TurndownService: any; // Assume TurndownService is loaded globally

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let turndownInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gfmTurndownInstance: any = null;

/**
 * 用于Turndown的代码块处理函数，专门处理混合内容中的代码块
 * @param node - DOM节点
 * @returns 处理后的代码块内容（带markdown标签）
 */
function processCodeBlock(node: any): string {
  let text: string;
  
  // 对于 pre 元素，先进行预处理：去掉除 code 标签外的所有内容
  if (node.tagName.toLowerCase() === 'pre') {
    // 克隆节点以避免修改原始DOM
    const clonedNode = node.cloneNode(true);
    
    // 查找 code 子元素
    const codeElement = clonedNode.querySelector('code');
    if (codeElement) {
      // 如果有 code 元素，清空 pre 的内容，然后只保留 code 元素
      clonedNode.innerHTML = '';
      clonedNode.appendChild(codeElement);
    }
    // 如果没有 code 元素，保持原样（这种情况下预处理不会有影响）
    
    // 从预处理后的节点获取文本
    text = clonedNode.innerText || clonedNode.textContent || '';
  } else {
    // 对于非 pre 元素（如 code），直接获取文本
    text = node.innerText || node.textContent || '';
  }
  
  // 对文本进行轻量级后处理，只处理确实必要的情况
  const cleanedText = cleanCodeBlockTextConservatively(text);
  
  // 对于混合内容中的代码块，包裹相应的markdown标签
  if (node.tagName.toLowerCase() === 'pre') {
    const className = node.className || '';
    const languageMatch = className.match(/language-(\w+)/);
    const language = languageMatch ? languageMatch[1] : '';
    
    return '\n\n```' + language + '\n' + cleanedText + '\n```\n\n';
  } else {
    // 对于混合内容中的内联code元素，使用内联代码语法
    return '`' + cleanedText + '`';
  }
}

/**
 * 保守的代码块文本清理，只处理确实有问题且安全的情况
 * @param text - 原始文本
 * @returns 清理后的文本
 */
function cleanCodeBlockTextConservatively(text: string): string {
  // 只移除"复制"按钮文本，这是最安全的处理
  let result = text.replace(/(Copy|复制代码|Copy to clipboard|复制)\s*$/, '');
  
  // 只反转义明显的Markdown转义字符，且只在确实需要的情况下
  result = result
    .replace(/\\#/g, '#')       // 反转义井号
    .replace(/\\=/g, '=')       // 反转义等号
    .replace(/\\\*/g, '*')      // 反转义星号
    .replace(/\\\[/g, '[')      // 反转义左方括号
    .replace(/\\\]/g, ']')      // 反转义右方括号
    .replace(/\\\(/g, '(')      // 反转义左圆括号
    .replace(/\\\)/g, ')');     // 反转义右圆括号
      
  return result;
}



/**
 * 检测元素中的表格
 * @param element - 要检测的元素
 * @returns 表格元素数组
 */
function detectTablesInElement(element: Element): HTMLTableElement[] {
  if (element instanceof HTMLTableElement) {
    return [element];
  }
  return Array.from(element.querySelectorAll('table'));
}

/**
 * 带表格检测的元素处理函数
 * @param element - 要处理的元素
 * @param settings - 用户设置
 * @returns 处理后的内容
 */
export function processElementWithTableDetection(element: Element, settings: Settings): string {
  // 预处理可见性
  const visibleClone = createVisibleClone(element);

  const tables = detectTablesInElement(visibleClone);
  
  if (tables.length === 1 && visibleClone instanceof HTMLTableElement) {
    // 单纯的表格元素，直接处理
    return processContent(visibleClone, settings);
  } else if (tables.length > 0 && !(visibleClone instanceof HTMLTableElement)) {
    // 包含表格的复合元素，需要特殊处理
    return processElementWithMixedContent(visibleClone, tables, settings);
  } else {
    // 不包含表格，正常处理
    return processContent(visibleClone, settings);
  }
}

/**
 * 处理包含表格的混合内容
 * @param element - 包含表格的元素
 * @param tables - 表格元素数组
 * @param settings - 用户设置
 * @returns 处理后的内容
 */
function processElementWithMixedContent(element: Element, tables: HTMLTableElement[], settings: Settings): string {
  console.debug('AI Copilot: processElementWithMixedContent (text-replacement strategy) - Start', {
    elementTag: element.tagName,
    tablesCount: tables.length,
    tableOutputFormat: settings.tableOutputFormat,
    outputFormat: settings.outputFormat
  });

  // 1. 先将整个克隆元素（已确保可见性）转换为Markdown
  let fullMarkdown = convertToMarkdown(element);

  // 2. 遍历所有检测到的表格，进行文本替换
  tables.forEach((table, index) => {
    // a. 将原始表格的HTML也转换为Markdown，作为被替换的目标
    // 注意：这里的转换需要和 convertToMarkdown 中的规则一致，特别是 GFM 插件的使用
    const originalTableMarkdown = convertHtmlToMarkdown(table.outerHTML);
    
    // b. 根据设置，生成最终的表格内容（Markdown 或 CSV）
    let finalTableContent: string;
    if (settings.tableOutputFormat === 'csv') {
      finalTableContent = convertTableToCSV(table);
    } else {
      // 如果目标就是Markdown，那么 finalTableContent 和 originalTableMarkdown 应该是一样的
      // 但为了逻辑清晰，我们还是重新计算
      finalTableContent = convertHtmlToMarkdown(table.outerHTML);
    }

    console.debug(`AI Copilot: Table ${index} replacement`, {
      target: originalTableMarkdown,
      replacement: finalTableContent
    });

    // 3. 在完整的Markdown文本中执行替换
    // Turndown 可能会在表格前后添加额外的换行符，我们需要考虑到这一点
    // 通过对 target 进行 trim() 来提高匹配的稳健性
    if (originalTableMarkdown.trim()) {
      fullMarkdown = fullMarkdown.replace(originalTableMarkdown, finalTableContent);
    }
  });

  console.debug('AI Copilot: processElementWithMixedContent - End, returning:', fullMarkdown);
  return fullMarkdown;
}

function getTurndownService() {
  if (!turndownInstance) {
    if (typeof TurndownService === 'undefined') {
      console.error('TurndownService is not available. Markdown conversion will fail.');
      // Return a dummy object or throw error, depending on desired handling
      return { turndown: (html: string) => html }; // Basic fallback
    }
    turndownInstance = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });

    // Preserve line breaks (<br>)
    turndownInstance.addRule('preserveLineBreaks', {
      filter: ['br'],
      replacement: () => '\n'
    });

    // Enhanced rule for handling nested tags within table cells (like <code>, <font>, etc.)
    turndownInstance.addRule('simplifyNestedTags', {
      filter: ['font', 'span'],
      replacement: (content: string) => {
        // Just return the content without the wrapper tags
        return content;
      }
    });

    // Remove script, style, and noscript tags during conversion
    turndownInstance.remove(['script', 'style', 'noscript', '#ai-copilot-copy-btn']);

    // 使用公共的代码块处理函数
    turndownInstance.addRule('codeBlock', {
      filter: ['pre', 'code'],
      replacement: function (content: string, node: any, options: any) {
        return processCodeBlock(node);
      }
    });
  }
  return turndownInstance;
}

function getGfmTurndownService() {
  if (!gfmTurndownInstance) {
    if (typeof TurndownService === 'undefined') {
      console.error('TurndownService is not available. Markdown conversion will fail.');
      return { turndown: (html: string) => html }; // Basic fallback
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const turndownPluginGfm = (window as any).turndownPluginGfm;
    if (!turndownPluginGfm) {
      console.error('turndown-plugin-gfm is not available. Using basic turndown.');
      return getTurndownService();
    }

    gfmTurndownInstance = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined'
    });

    // 启用GitHub Flavored Markdown插件
    gfmTurndownInstance.use(turndownPluginGfm.gfm);

    // 使用公共的代码块处理函数
    gfmTurndownInstance.addRule('codeBlock', {
      filter: ['pre', 'code'],
      replacement: function (content: string, node: any, options: any) {
        return processCodeBlock(node);
      }
    });
  }
  return gfmTurndownInstance;
}

/**
 * 将HTML转换为Markdown格式
 * @param html - 要转换的HTML字符串
 * @returns 转换后的Markdown字符串
 */
function convertHtmlToMarkdown(html: string): string {
  try {
    const turndown = getGfmTurndownService();
    return turndown.turndown(html);
  } catch (error) {
    console.error('HTML转Markdown转换失败:', error);
    return html; // 转换失败时返回原HTML
  }
}

/**
 * 验证URL是否为有效的链接
 * @param url - 要验证的URL
 * @returns 是否为有效链接
 */
function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  
  // 过滤掉无效的链接协议和模式
  const invalidPatterns = [
    /^javascript:/i,
    /^#.*$/,           // 纯锚点链接
    /^#$/,             // 空锚点
    /^\s*$/,           // 空白字符串
    /^void\(0\)$/i,    // void(0)
    /^about:blank$/i   // about:blank
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(url.trim())) {
      return false;
    }
  }
  
  // 检查是否为有效的URL格式
  try {
    // 对于相对路径和绝对路径的基本检查
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    // 检查是否包含有效的协议
    if (url.includes('://')) {
      const urlObj = new URL(url);
      return ['http:', 'https:', 'ftp:', 'ftps:', 'mailto:', 'tel:'].includes(urlObj.protocol);
    }
    
    // 对于不包含协议的URL，进行基本格式检查
    return /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9](\.[a-zA-Z]{2,}|:[0-9]+)/.test(url);
  } catch {
    return false;
  }
}

/**
 * 清理Markdown文本中的无效链接
 * @param markdown - 原始markdown文本
 * @returns 清理后的markdown文本
 */
function cleanInvalidLinks(markdown: string): string {
  // 匹配markdown链接格式 [text](url)
  return markdown.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (match, text, url) => {
    // 如果URL无效，只保留文本内容
    if (!isValidUrl(url)) {
      return text.trim() || ''; // 如果文本为空，则完全移除
    }
    return match; // 保留有效链接
  });
}

// i18n message retrieval, checking for chrome API availability
function getI18nMessage(key: string, language?: string): string {
  // Use specific language bundle if provided and not 'system'
  // This is a simplified example; a real implementation might load JSON files.
  if (language && language !== 'system' && language !== 'en') {
    // Assuming 'en' is default/fallback for chrome.i18n
    const messages: Record<string, Record<string, string>> = {
      // 'en': { source: 'Source' }, // Example, assuming chrome.i18n handles English
      zh: { source: '来源' } // Example for Chinese
    };
    if (messages[language] && messages[language][key]) {
      return messages[language][key];
    }
  }

  // Fallback to chrome.i18n.getMessage if available
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
      return chrome.i18n.getMessage(key) || key;
    }
  } catch (e) {
    // Error accessing chrome.i18n, proceed to fallback
  }
  return key; // Absolute fallback
}

function cleanCodeBlock(text: string): string {
  // 使用新的清理函数
  return cleanCodeBlockTextConservatively(text);
}

function cleanText(text: string): string {
  let cleaned = text.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n'); // Normalize multiple newlines to double newlines
  cleaned = cleaned.trim(); // Trim leading/trailing whitespace
  return cleaned;
}

function convertTableToCSV(element: HTMLTableElement): string {
  const rows = Array.from(element.querySelectorAll('tr'));
  return rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells
        .map((cell) => {
          // Get text content, preserving spaces as per RFC 4180
          const text = (cell as HTMLElement).innerText;
          
          // RFC 4180 compliant field processing
          return formatCSVField(text);
        })
        .join(',');
    })
    .join('\n');
}

/**
 * Format a single CSV field according to RFC 4180 standard
 * @param text The field text content
 * @returns Properly escaped CSV field
 */
function formatCSVField(text: string): string {
  // Clean the text: replace line breaks with escaped \n
  let cleanText = text.replace(/[\r\n]+/g, '\\n').replace(/\s+/g, ' ').trim();
  
  // Check if field contains characters that require quoting:
  // - comma (,)
  // - double quote (")
  // - escaped newlines (\\n)
  const needsQuoting = cleanText.includes(',') || cleanText.includes('"') || cleanText.includes('\\n');
  
  if (needsQuoting) {
    // Escape any double quotes by doubling them
    const escapedText = cleanText.replace(/"/g, '""');
    // Wrap the field in double quotes
    return `"${escapedText}"`;
  }
  
  // Return field as-is if no special characters
  return cleanText;
}



export function convertToMarkdown(element: Element): string {
  const turndown = getTurndownService();
  try {
    if (element instanceof HTMLTableElement) {
      // Use the new HTML to Markdown converter for tables
      return convertHtmlToMarkdown(element.outerHTML);
    } else if (element instanceof HTMLImageElement) {
      const imgElement = element as HTMLImageElement;
      let sourceUrl = imgElement.dataset.src || imgElement.src;
      if (sourceUrl && !sourceUrl.startsWith('http') && !sourceUrl.startsWith('data:')) {
        sourceUrl = imgElement.src; // Fallback to resolved .src for relative data-src
      }
      const altText = imgElement.alt || '';
      if (!sourceUrl || sourceUrl === window.location.href) {
        return cleanText(imgElement.innerText || '');
      }
      return `![${altText}](${sourceUrl})`;
    } else if (element instanceof HTMLPictureElement) {
      const pictureElement = element as HTMLPictureElement;
      const img = pictureElement.querySelector('img');
      if (img) {
        return convertToMarkdown(img); // Delegate to HTMLImageElement handling
      }
      return '[Picture Element - No image found]';
    } else if (element instanceof HTMLVideoElement) {
      const videoElement = element as HTMLVideoElement;
      const posterUrl = videoElement.poster;
      const videoSrc =
        videoElement.src ||
        (videoElement.querySelector('source') ? videoElement.querySelector('source')!.src : '');
      const title = videoElement.title || videoElement.ariaLabel || '';

      if (posterUrl) {
        const altText = title || 'Video Poster';
        return `![${altText}](${posterUrl})`;
      } else if (videoSrc) {
        const linkText = title || `Video Source`;
        return `[${linkText}](${videoSrc})`;
      }
      return `[Video: ${title || 'No source or poster'}]`;
    } else if (element instanceof SVGSVGElement) {
      const svgOuterHTML = element.outerHTML;
      return `\`\`\`svg\n${svgOuterHTML}\n\`\`\``;
    } else if (element instanceof HTMLCanvasElement) {
      const canvasElement = element as HTMLCanvasElement;
      const id = canvasElement.id ? `id: '${canvasElement.id}'` : '';
      const classes = canvasElement.className ? `class: '${canvasElement.className}'` : '';
      const attributes = [id, classes].filter(Boolean).join(', ');
      return `[Canvas Element${attributes ? ` (${attributes})` : ''}]`;
    } else if (element instanceof HTMLEmbedElement) {
      const embedElement = element as HTMLEmbedElement;
      const src = embedElement.src;
      const type = embedElement.type;
      if (src) {
        return `[Embedded Content${type ? ` (type: ${type})` : ''}](${src})`;
      }
      return `[Embedded Content${type ? ` (type: ${type})` : ''}]`;
    } else if (element instanceof HTMLObjectElement) {
      const objectElement = element as HTMLObjectElement;
      const data = objectElement.data;
      const type = objectElement.type;
      if (data) {
        return `[Object Content${type ? ` (type: ${type})` : ''}](${data})`;
      }
      return `[Object Content${type ? ` (type: ${type})` : ''}]`;
    } else if (element.tagName.toLowerCase() === 'pre' || element.tagName.toLowerCase() === 'code') {
      // 当用户直接复制code或pre元素时，说明用户想要纯代码内容，不包裹任何markdown语法
      return cleanCodeBlockTextConservatively((element as HTMLElement).innerText || element.textContent || '').replace(/\n+$/, '');
    } else {
      // Default handling for other elements
      const clonedElement = element.cloneNode(true) as Element;
      clonedElement.querySelectorAll('#ai-copilot-copy-btn').forEach((btn) => btn.remove());

      // Pre-process links containing images or SVGs
      clonedElement.querySelectorAll('a').forEach((a) => {
        const img = a.querySelector('img');
        if (img) {
          const alt = img.alt.trim();
          if (alt) {
            a.replaceWith(document.createTextNode(alt));
          } else {
            a.replaceWith(document.createTextNode(a.href));
          }
          return; // Move to the next 'a' tag
        }

        const svg = a.querySelector('svg');
        if (svg) {
          const title = svg.querySelector('title');
          if (title && title.textContent) {
            a.replaceWith(document.createTextNode(title.textContent.trim()));
          } else {
            a.replaceWith(document.createTextNode(a.href));
          }
        }
      });

      let markdown = turndown.turndown(clonedElement.innerHTML);
      markdown = markdown.replace(/\[\s*\]\(#\)/g, ''); // Clean up empty links like `[ ](#)`
      markdown = cleanInvalidLinks(markdown); // 清理Markdown文本中的无效链接

      return markdown.trim();
    }
  } catch (error) {
    console.error('Error converting to Markdown:', error, element);
    // Fallback to plain text extraction if Markdown conversion fails
    return cleanText((element as HTMLElement).innerText || '');
  }
}

export function convertToPlainText(element: Element): string {
  try {
    // Clone the element to avoid modifying the original DOM
    const clonedElement = element.cloneNode(true) as Element;
    // Remove the copy button from the cloned element
    clonedElement.querySelectorAll('#ai-copilot-copy-btn').forEach((btn) => btn.remove());

    if (element instanceof HTMLImageElement) {
      const imgElement = element as HTMLImageElement;
      let sourceUrl = imgElement.dataset.src || imgElement.src;
      if (sourceUrl && !sourceUrl.startsWith('http') && !sourceUrl.startsWith('data:')) {
        sourceUrl = imgElement.src;
      }
      return sourceUrl || '';
    } else if (element instanceof HTMLPictureElement) {
      const pictureElement = element as HTMLPictureElement;
      const img = pictureElement.querySelector('img');
      if (img) {
        return convertToPlainText(img); // Delegate to HTMLImageElement handling
      }
      return '';
    } else if (element instanceof HTMLVideoElement) {
      const videoElement = element as HTMLVideoElement;
      const videoSrc =
        videoElement.src ||
        (videoElement.querySelector('source') ? videoElement.querySelector('source')!.src : '');
      if (videoSrc) {
        return videoSrc;
      }
      // Fallback to poster URL if no video source
      return videoElement.poster || '';
    } else if (element instanceof SVGSVGElement) {
      return element.outerHTML;
    } else if (element instanceof HTMLCanvasElement) {
      const canvasElement = element as HTMLCanvasElement;
      const id = canvasElement.id ? `id: '${canvasElement.id}'` : '';
      const classes = canvasElement.className ? `class: '${canvasElement.className}'` : '';
      const attributes = [id, classes].filter(Boolean).join(', ');
      return `[Canvas Element${attributes ? ` (${attributes})` : ''}]`;
    } else if (element instanceof HTMLEmbedElement) {
      return element.src || '[Embedded Content]';
    } else if (element instanceof HTMLObjectElement) {
      return element.data || '[Object Content]';
    } else if (element.tagName.toLowerCase() === 'pre' || element.tagName.toLowerCase() === 'code') {
      // 对于代码块，使用简化处理直接返回清理后的文本
      return cleanCodeBlockTextConservatively((element as HTMLElement).innerText || element.textContent || '');
    } else {
      let text = (clonedElement as HTMLElement).innerText || '';
      return cleanText(text);
    }
  } catch (error) {
    console.error('Error processing plain text:', error);
    return ''; // Return empty string on error
  }
}

export function getPageInfo(): { title: string; url: string } {
  return {
    title: document.title || '',
    url: window.location.href
  };
}

export function formatAdditionalInfo(
  settings: Settings,
  pageInfo: { title: string; url: string }
): string {
  if (!settings.attachTitle && !settings.attachURL) {
    return '';
  }

  const sourceLabel = getI18nMessage('source', settings.language);
  let additionalInfo = '\n\n---\n'; // Start with a separator

  if (settings.outputFormat === 'markdown') {
    if (settings.attachTitle && settings.attachURL) {
      additionalInfo += `${sourceLabel}: [${pageInfo.title}](${pageInfo.url})`;
    } else if (settings.attachTitle) {
      additionalInfo += `${sourceLabel}: ${pageInfo.title}`;
    } else if (settings.attachURL) {
      additionalInfo += `${sourceLabel}: <${pageInfo.url}>`; // Use < > for plain URLs in Markdown
    }
  } else {
    // Plaintext
    if (settings.attachTitle && settings.attachURL) {
      additionalInfo += `${sourceLabel}: ${pageInfo.title} (${pageInfo.url})`;
    } else if (settings.attachTitle) {
      additionalInfo += `${sourceLabel}: ${pageInfo.title}`;
    } else if (settings.attachURL) {
      additionalInfo += `${sourceLabel}: ${pageInfo.url}`;
    }
  }

  return additionalInfo;
}

export function processContent(element: Element, settings: Settings): string {
  try {
    // 统一可见性预处理
    const workingRoot = createVisibleClone(element);

    let content: string;

    // 检查是否为单纯的表格元素
    if (workingRoot instanceof HTMLTableElement) {
      if (settings.tableOutputFormat === 'csv') {
        content = convertTableToCSV(workingRoot);
      } else {
        content = convertToMarkdown(workingRoot);
      }
    } else {
      // 检查元素中是否包含表格
      const tables = detectTablesInElement(workingRoot);
      
      if (tables.length > 0) {
        // 包含表格的复合内容，使用特殊处理
        content = processElementWithMixedContent(workingRoot, tables, settings);
      } else {
        // 不包含表格，正常处理
        if (settings.outputFormat === 'markdown') {
          content = convertToMarkdown(workingRoot);
        } else {
          content = convertToPlainText(workingRoot);
        }
      }
    }

    // Apply blockquote styling for Markdown output if additional info is attached
    if (
      settings.outputFormat === 'markdown' &&
      !(element instanceof HTMLTableElement && settings.tableOutputFormat === 'csv')
    ) {
      if (settings.attachTitle || settings.attachURL) {
        if (content) {
          content = `> ${content.replace(/\n/g, '\n> ')}`;
        }
      }
    }

    const pageInfo = getPageInfo();
    const additionalInfo = formatAdditionalInfo(settings, pageInfo);

    if (content && additionalInfo) {
      return content + additionalInfo;
    } else if (content) {
      return content;
    } else if (additionalInfo.trim()) {
      return additionalInfo.trim();
    }
    return '';
  } catch (error) {
    console.error('Error in processContent:', error);
    return (element as HTMLElement).innerText || '';
  }
}
