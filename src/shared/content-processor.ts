// Content processor functionality (using TurndownService from global scope)
import type { Settings } from './settings-manager'; // Import type for Settings

declare const TurndownService: any; // Assume TurndownService is loaded globally

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
  if (language && language !== 'system' && language !== 'en') { // Assuming 'en' is default/fallback for chrome.i18n
    const messages: Record<string, Record<string, string>> = {
      // 'en': { source: 'Source' }, // Example, assuming chrome.i18n handles English
      'zh': { source: '来源' } // Example for Chinese
    };
    if (messages[language] && messages[language][key]) {
      return messages[language][key];
    }
  }
  
  // Fallback to chrome.i18n.getMessage if available
  try {
    if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
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

export function convertToMarkdown(element: Element): string {
  const turndown = getTurndownService();
  try {
    // Clone the element to avoid modifying the original DOM
    const clonedElement = element.cloneNode(true) as Element;
    // Remove the copy button from the cloned element before conversion
    clonedElement.querySelectorAll('#ai-copilot-copy-btn').forEach(btn => btn.remove());
    
    // Convert the innerHTML of the cloned element to Markdown
    let markdown = turndown.turndown(clonedElement.innerHTML);
    return markdown.trim(); // Trim final output
  } catch (error) {
    console.error('Error converting to Markdown:', error);
    // Fallback to plain text extraction if Markdown conversion fails
    return cleanText((element as HTMLElement).innerText || '');
  }
}

export function convertToPlainText(element: Element): string {
  try {
    // Clone the element to avoid modifying the original DOM (though less critical for innerText)
    const clonedElement = element.cloneNode(true) as Element;
    // Remove the copy button from the cloned element
    clonedElement.querySelectorAll('#ai-copilot-copy-btn').forEach(btn => btn.remove());

    const text = (clonedElement as HTMLElement).innerText || '';
    return cleanText(text);
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

export function formatAdditionalInfo(settings: Settings, pageInfo: { title: string; url: string }): string {
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
  } else { // Plaintext
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
    
    if (settings.outputFormat === 'markdown') {
      content = convertToMarkdown(element);
      // Apply blockquote styling if additional info is to be attached,
      // or if markdown content itself should be blockquoted by default.
      // Current behavior: blockquote only if title/URL is attached.
      if (settings.attachTitle || settings.attachURL) {
         // Ensure content is not empty before adding blockquote
        if (content) {
            content = `> ${content.replace(/\n/g, '\n> ')}`;
        }
      }
    } else {
      content = convertToPlainText(element);
    }
    
    const pageInfo = getPageInfo();
    const additionalInfo = formatAdditionalInfo(settings, pageInfo);
    
    // Ensure there's a space between content and additional info if both exist
    if (content && additionalInfo) {
        return content + additionalInfo; // additionalInfo already starts with newlines
    } else if (content) {
        return content;
    } else { // Only additionalInfo (e.g. copying an empty block but attaching source)
        // We might want to reconsider if copying an "empty" block should still yield source info.
        // For now, let's assume if content is empty, the result is empty unless explicitly changed.
        // To include source even for empty content, return additionalInfo.trim() here.
        // Based on current logic, if content is empty, this returns empty.
        // Let's adjust to return additionalInfo if content is empty but attachURL/Title is true.
        if (additionalInfo.trim()) return additionalInfo.trim();
        return '';
    }

  } catch (error) {
    console.error('Error in processContent:', error);
    // Fallback to basic innerText on critical error
    return (element as HTMLElement).innerText || '';
  }
}
