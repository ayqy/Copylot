// Content processor functionality (using TurndownService from global scope)
import type { Settings } from './settings-manager'; // Import type for Settings

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
  const tables = detectTablesInElement(element);
  
  if (tables.length === 1 && element instanceof HTMLTableElement) {
    // 单纯的表格元素，直接处理
    return processContent(element, settings);
  } else if (tables.length > 0 && !(element instanceof HTMLTableElement)) {
    // 包含表格的复合元素，需要特殊处理
    return processElementWithMixedContent(element, tables, settings);
  } else {
    // 不包含表格，正常处理
    return processContent(element, settings);
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
  console.debug('AI Copilot: processElementWithMixedContent - Start', {
    elementTag: element.tagName,
    tablesCount: tables.length,
    tableOutputFormat: settings.tableOutputFormat,
    outputFormat: settings.outputFormat
  });
  
  // 克隆元素以避免修改原DOM
  const clonedElement = element.cloneNode(true) as Element;
  
  // 存储表格内容和对应的placeholder信息
  const tableReplacements: { 
    originalPlaceholder: string; 
    processedPlaceholder: string; 
    content: string 
  }[] = [];
  
  // 处理每个表格，生成对应的内容和placeholder
  tables.forEach((originalTable, index) => {
    let tableContent: string;
    
    if (settings.tableOutputFormat === 'csv') {
      tableContent = convertTableToCSV(originalTable);
      console.debug(`AI Copilot: Table ${index} CSV content:`, tableContent);
    } else {
      tableContent = convertHtmlToMarkdown(originalTable.outerHTML);
      console.debug(`AI Copilot: Table ${index} Markdown content:`, tableContent);
    }
    
    // 创建唯一的placeholder
    const originalPlaceholder = `__MAGIC_COPY_TABLE_${index}__`;
    
    // 用turndown处理placeholder，看看它会变成什么样
    let processedPlaceholder: string;
    if (settings.outputFormat === 'markdown') {
      const tempDiv = document.createElement('div');
      tempDiv.textContent = originalPlaceholder;
      processedPlaceholder = convertToMarkdown(tempDiv);
    } else {
      const tempDiv = document.createElement('div');
      tempDiv.textContent = originalPlaceholder;
      processedPlaceholder = convertToPlainText(tempDiv);
    }
    
    tableReplacements.push({ 
      originalPlaceholder, 
      processedPlaceholder, 
      content: tableContent 
    });
    
    console.debug(`AI Copilot: Table ${index} placeholders:`, {
      original: originalPlaceholder,
      processed: processedPlaceholder
    });
  });
  
  console.debug('AI Copilot: Table replacements:', tableReplacements);
  
  // 在克隆元素中用placeholder替换表格
  const clonedTables = Array.from(clonedElement.querySelectorAll('table'));
  clonedTables.forEach((table, index) => {
    if (index < tableReplacements.length) {
      // 创建文本节点替换表格
      const textNode = document.createTextNode(tableReplacements[index].originalPlaceholder);
      table.parentNode?.replaceChild(textNode, table);
      console.debug(`AI Copilot: Replaced table ${index} with placeholder:`, tableReplacements[index].originalPlaceholder);
    }
  });
  
  // 处理剩余内容（现在包含placeholder）
  let content: string;
  if (settings.outputFormat === 'markdown') {
    content = convertToMarkdown(clonedElement);
  } else {
    content = convertToPlainText(clonedElement);
  }
  
  console.debug('AI Copilot: Content with placeholders:', content);
  
  // 将处理后的placeholder替换为实际的表格内容
  tableReplacements.forEach((replacement, index) => {
    const beforeReplacement = content;
    // 使用处理后的placeholder进行替换
    content = content.replace(replacement.processedPlaceholder, replacement.content);
    console.debug(`AI Copilot: Replaced processed placeholder ${index}:`, {
      originalPlaceholder: replacement.originalPlaceholder,
      processedPlaceholder: replacement.processedPlaceholder,
      content: replacement.content,
      beforeReplacement: beforeReplacement,
      afterReplacement: content,
      found: beforeReplacement !== content
    });
  });
  
  console.debug('AI Copilot: processElementWithMixedContent - End, returning:', content);
  return content;
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
      return cleanCodeBlockTextConservatively((element as HTMLElement).innerText || element.textContent || '');
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
    let content: string;

    // 检查是否为单纯的表格元素
    if (element instanceof HTMLTableElement) {
      if (settings.tableOutputFormat === 'csv') {
        content = convertTableToCSV(element);
      } else {
        content = convertToMarkdown(element);
      }
    } else {
      // 检查元素中是否包含表格
      const tables = detectTablesInElement(element);
      
      if (tables.length > 0) {
        // 包含表格的复合内容，使用特殊处理
        content = processElementWithMixedContent(element, tables, settings);
      } else {
        // 不包含表格，正常处理
        if (settings.outputFormat === 'markdown') {
          content = convertToMarkdown(element);
        } else {
          content = convertToPlainText(element);
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
