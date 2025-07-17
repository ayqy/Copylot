// Content processor functionality (using TurndownService from global scope)
import type { Settings } from './settings-manager'; // Import type for Settings

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const TurndownService: any; // Assume TurndownService is loaded globally

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let turndownInstance: any = null;

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

    // Remove script, style, and noscript tags during conversion
    turndownInstance.remove(['script', 'style', 'noscript', '#ai-copilot-copy-btn']);
  }
  return turndownInstance;
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
          const text = (cell as HTMLElement).innerText.trim();
          // Escape quotes by doubling them
          const escapedText = text.replace(/"/g, '""');
          // Quote fields containing commas or quotes
          if (text.includes(',') || text.includes('"')) {
            return `"${escapedText}"`;
          }
          return escapedText;
        })
        .join(',');
    })
    .join('\n');
}

export function convertToMarkdown(element: Element): string {
  const turndown = getTurndownService();
  try {
    if (element instanceof HTMLTableElement) {
      // For tables, use Turndown's default table handling
      return turndown.turndown(element.outerHTML);
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
    } else {
      const text = (clonedElement as HTMLElement).innerText || '';
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

    // Handle table content separately based on tableOutputFormat setting
    if (element instanceof HTMLTableElement) {
      if (settings.tableOutputFormat === 'csv') {
        content = convertTableToCSV(element);
      } else {
        // Default to Markdown for tables if not CSV
        content = convertToMarkdown(element);
      }
    } else {
      // Handle non-table content based on the general outputFormat setting
      if (settings.outputFormat === 'markdown') {
        content = convertToMarkdown(element);
      } else {
        content = convertToPlainText(element);
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
