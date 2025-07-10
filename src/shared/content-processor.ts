// Settings interface
export interface Settings {
  outputFormat: 'markdown' | 'plaintext';
  attachTitle: boolean;
  attachURL: boolean;
  language: 'system' | 'en' | 'zh';
}

// Use TurndownService from global scope
declare const TurndownService: any;

// Initialize Turndown service for HTML to Markdown conversion
let turndownService: any = null;

function getTurndownService(): any {
  if (!turndownService) {
    turndownService = new TurndownService({
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
    
    // Configure rules to preserve semantic meaning
    turndownService.addRule('preserveLineBreaks', {
      filter: ['br'],
      replacement: () => '\n'
    });
    
    // Remove script and style content
    turndownService.remove(['script', 'style', 'noscript']);
  }
  
  return turndownService;
}

/**
 * Get localized message
 */
function getMessage(key: string, language?: string): string {
  if (language && language !== 'system') {
    // For non-system languages, we'd need to implement custom translation
    // For now, return English or Chinese based on language setting
    const messages: Record<string, Record<string, string>> = {
      en: {
        source: 'Source'
      },
      zh: {
        source: '来源'
      }
    };
    
    return messages[language]?.[key] || chrome.i18n.getMessage(key) || key;
  }
  
  return chrome.i18n.getMessage(key) || key;
}

/**
 * Clean plain text content
 */
function cleanPlainText(text: string): string {
  // Merge consecutive whitespace into single space
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Preserve paragraph breaks (double newlines)
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  
  // Remove leading and trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Process HTML content to Markdown
 */
function processToMarkdown(element: HTMLElement): string {
  const turndown = getTurndownService();
  
  try {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove any existing copy buttons from our extension
    const existingButtons = clone.querySelectorAll('#ai-copilot-copy-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Convert to markdown
    const markdown = turndown.turndown(clone.innerHTML);
    
    // Clean up extra whitespace
    return markdown.trim();
  } catch (error) {
    console.error('Error converting to Markdown:', error);
    // Fallback to plain text
    return cleanPlainText(element.innerText || '');
  }
}

/**
 * Process content to plain text
 */
function processToPlainText(element: HTMLElement): string {
  try {
    const text = element.innerText || '';
    return cleanPlainText(text);
  } catch (error) {
    console.error('Error processing plain text:', error);
    return '';
  }
}

/**
 * Get page title and URL for additional info
 */
function getPageInfo(): { title: string; url: string } {
  return {
    title: document.title || '',
    url: window.location.href
  };
}

/**
 * Format additional information
 */
function formatAdditionalInfo(
  settings: Settings,
  pageInfo: { title: string; url: string }
): string {
  if (!settings.attachTitle && !settings.attachURL) {
    return '';
  }
  
  const sourceLabel = getMessage('source', settings.language);
  let additionalInfo = '\n\n---\n';
  
  if (settings.outputFormat === 'markdown') {
    // Markdown format
    if (settings.attachTitle && settings.attachURL) {
      additionalInfo += `${sourceLabel}: [${pageInfo.title}](${pageInfo.url})`;
    } else if (settings.attachTitle) {
      additionalInfo += `${sourceLabel}: ${pageInfo.title}`;
    } else if (settings.attachURL) {
      additionalInfo += `${sourceLabel}: ${pageInfo.url}`;
    }
  } else {
    // Plain text format
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

/**
 * Process content from DOM element according to user settings
 * 
 * @param element - The HTML element to process
 * @param settings - User settings for output format and additional info
 * @returns Formatted string ready for clipboard
 */
export function processContent(element: HTMLElement, settings: Settings): string {
  try {
    let content: string;
    
    // Process content based on output format
    if (settings.outputFormat === 'markdown') {
      content = processToMarkdown(element);
      
      // For markdown, wrap in blockquote if additional info is requested
      if (settings.attachTitle || settings.attachURL) {
        content = `> ${content.replace(/\n/g, '\n> ')}`;
      }
    } else {
      content = processToPlainText(element);
    }
    
    // Add additional information if requested
    const pageInfo = getPageInfo();
    const additionalInfo = formatAdditionalInfo(settings, pageInfo);
    
    return content + additionalInfo;
  } catch (error) {
    console.error('Error in processContent:', error);
    // Fallback to basic text extraction
    return element.innerText || '';
  }
} 