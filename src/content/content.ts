// Block identifier functionality
const EXCLUDED_TAGS = [
  'header', 'footer', 'nav', 'aside', 'dialog', 'menu', 'form', 'fieldset', 'legend',
  'a', 'button', 'input', 'textarea', 'select', 'option', 'optgroup', 'label',
  'details', 'summary', 'img', 'iframe', 'video', 'audio', 'canvas', 'embed', 'object',
  'picture', 'map', 'area', 'script', 'style', 'noscript', 'head', 'meta', 'link', 'template'
];

const MIN_TEXT_LENGTH = 50;
const MIN_WIDTH = 200;
const MIN_HEIGHT = 40;

function hasExcludedAncestor(element: Element): boolean {
  let current = element;
  while (current && current !== document.body) {
    if (EXCLUDED_TAGS.includes(current.tagName.toLowerCase())) {
      return true;
    }
    current = current.parentElement!;
  }
  return false;
}

function hasMinimumTextContent(element: Element): boolean {
  const text = (element as HTMLElement).innerText?.replace(/\s+/g, '') || '';
  return text.length > MIN_TEXT_LENGTH;
}

function hasMinimumDimensions(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > MIN_WIDTH && rect.height > MIN_HEIGHT;
}

function isInteractiveElement(element: Element): boolean {
  const interactiveTags = [
    'a', 'button', 'img', 'input', 'video', 'audio', 'canvas', 'iframe',
    'textarea', 'select', 'option', 'embed', 'object'
  ];
  return interactiveTags.includes(element.tagName.toLowerCase());
}

function isViableBlock(element: Element): boolean {
  try {
    // Reordered checks: from potentially cheaper to more expensive.
    // 1. Check if it's an interactive element (usually quick tag check).
    if (isInteractiveElement(element)) {
      return false;
    }
    // 2. Check for excluded ancestors.
    if (hasExcludedAncestor(element)) {
      return false;
    }
    // 3. Check dimensions (can cause layout calculations).
    if (!hasMinimumDimensions(element)) {
      return false;
    }
    // 4. Check text content (can be expensive due to innerText).
    if (!hasMinimumTextContent(element)) {
      return false;
    }
    // If all checks pass, it's a viable block.
    return true;
  } catch (error) {
    // console.error('Error in isViableBlock:', error); // Optionally log, but can be noisy
    return false;
  }
}

// Settings manager functionality
interface Settings {
  outputFormat: 'markdown' | 'plaintext';
  attachTitle: boolean;
  attachURL: boolean;
  language: 'system' | 'en' | 'zh';
}

const SETTINGS_KEY = 'copilot_settings';

const DEFAULT_SETTINGS: Settings = {
  outputFormat: 'markdown',
  attachTitle: false,
  attachURL: false,
  language: 'system'
};

function getSystemLanguage(): 'system' | 'en' | 'zh' {
  try {
    const uiLanguage = chrome.i18n.getUILanguage();
    if (uiLanguage.startsWith('zh')) {
      return 'zh';
    }
    return 'en';
  } catch (error) {
    console.error('Error detecting system language:', error);
    return 'en';
  }
}

async function getSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const storedSettings = result[SETTINGS_KEY];
    
    if (!storedSettings) {
      const defaultWithLanguage = {
        ...DEFAULT_SETTINGS,
        language: getSystemLanguage()
      };
      await chrome.storage.local.set({ [SETTINGS_KEY]: defaultWithLanguage });
      return defaultWithLanguage;
    }
    
    const mergedSettings: Settings = {
      ...DEFAULT_SETTINGS,
      ...storedSettings
    };
    
    if (mergedSettings.language === 'system') {
      mergedSettings.language = getSystemLanguage();
    }
    
    return mergedSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      ...DEFAULT_SETTINGS,
      language: getSystemLanguage()
    };
  }
}

// UI injector functionality
const BUTTON_OFFSET_X = 8;
const BUTTON_OFFSET_Y = 8;
const BUTTON_SIZE = 32;
const MAX_Z_INDEX = 2147483647;

let buttonInstance: HTMLElement | null = null;

function getMessage(key: string): string {
  return chrome.i18n.getMessage(key) || key;
}

function getCopyIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
}

function getCopiedIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;
}

function createButton(): HTMLElement {
  if (buttonInstance) return buttonInstance;
  
  const button = document.createElement('div');
  button.id = 'ai-copilot-copy-btn';
  
  Object.assign(button.style, {
    position: 'fixed',
    width: `${BUTTON_SIZE}px`,
    height: `${BUTTON_SIZE}px`,
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: MAX_Z_INDEX.toString(),
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    pointerEvents: 'auto'
  });
  
  button.innerHTML = getCopyIcon();
  button.title = getMessage('copy');
  
  button.addEventListener('mouseenter', () => {
    if (button.dataset.state !== 'copied') {
      button.style.backgroundColor = '#3730A3';
      button.style.transform = 'scale(1.05)';
    }
  });
  
  button.addEventListener('mouseleave', () => {
    if (button.dataset.state !== 'copied') {
      button.style.backgroundColor = '#4F46E5';
      button.style.transform = 'scale(1)';
    }
  });
  
  document.body.appendChild(button);
  buttonInstance = button;
  return button;
}

function positionButton(button: HTMLElement, x: number, y: number): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = x + BUTTON_OFFSET_X;
  let top = y + BUTTON_OFFSET_Y;
  
  if (left + BUTTON_SIZE > viewportWidth) {
    left = x - BUTTON_SIZE - BUTTON_OFFSET_X;
  }
  
  if (top + BUTTON_SIZE > viewportHeight) {
    top = y - BUTTON_SIZE - BUTTON_OFFSET_Y;
  }
  
  left = Math.max(8, Math.min(left, viewportWidth - BUTTON_SIZE - 8));
  top = Math.max(8, Math.min(top, viewportHeight - BUTTON_SIZE - 8));
  
  button.style.left = `${left}px`;
  button.style.top = `${top}px`;
}

function showButton(button: HTMLElement, x: number, y: number): void {
  positionButton(button, x, y);
  button.style.display = 'flex';
  
  // Add border to current target element
  if (currentTarget && currentTarget instanceof HTMLElement) {
    // Store original border if exists
    currentTarget.dataset.originalBorder = currentTarget.style.border;
    currentTarget.style.border = '1px solid #4F46E5';
  }
}

function hideButton(button: HTMLElement): void {
  button.style.display = 'none';
  updateButtonState(button, 'copy');
  
  // Restore original border of current target element
  if (currentTarget && currentTarget instanceof HTMLElement) {
    currentTarget.style.border = currentTarget.dataset.originalBorder || 'none';
    delete currentTarget.dataset.originalBorder;
  }
}

function updateButtonState(button: HTMLElement, state: 'copy' | 'copied'): void {
  button.dataset.state = state;
  
  if (state === 'copy') {
    button.innerHTML = getCopyIcon();
    button.title = getMessage('copy');
    button.style.backgroundColor = '#4F46E5';
    button.style.transform = 'scale(1)';
  } else if (state === 'copied') {
    button.innerHTML = getCopiedIcon();
    button.title = getMessage('copied');
    button.style.backgroundColor = '#059669';
    button.style.transform = 'scale(1.1)';
    button.style.animation = 'none';
    button.offsetHeight; // Force reflow
    button.style.animation = 'ai-copilot-success 0.8s ease-out';
  }
}

function injectStyles(): void {
  if (document.getElementById('ai-copilot-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ai-copilot-styles';
  style.textContent = `
    @keyframes ai-copilot-success {
      0% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      50% {
        box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4), 0 0 0 4px rgba(5, 150, 105, 0.2);
      }
      100% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
    
    #ai-copilot-copy-btn {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `;
  
  document.head.appendChild(style);
}

function cleanup(): void {
  if (buttonInstance && buttonInstance.parentNode) {
    buttonInstance.parentNode.removeChild(buttonInstance);
    buttonInstance = null;
  }
  
  const styles = document.getElementById('ai-copilot-styles');
  if (styles && styles.parentNode) {
    styles.parentNode.removeChild(styles);
  }
}

// Content processor functionality (using TurndownService from global scope)
declare const TurndownService: any;

let turndownInstance: any = null;

function getTurndownService() {
  if (!turndownInstance) {
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
    
    turndownInstance.addRule('preserveLineBreaks', {
      filter: ['br'],
      replacement: () => '\n'
    });
    
    turndownInstance.remove(['script', 'style', 'noscript']);
  }
  
  return turndownInstance;
}

function getI18nMessage(key: string, language?: string): string {
  if (language && language !== 'system') {
    const messages: Record<string, Record<string, string>> = {
      en: { source: 'Source' },
      zh: { source: '来源' }
    };
    return messages[language]?.[key] || chrome.i18n.getMessage(key) || key;
  }
  return chrome.i18n.getMessage(key) || key;
}

function cleanText(text: string): string {
  let cleaned = text.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  cleaned = cleaned.trim();
  return cleaned;
}

function convertToMarkdown(element: Element): string {
  const turndown = getTurndownService();
  
  try {
    const clonedElement = element.cloneNode(true) as Element;
    clonedElement.querySelectorAll('#ai-copilot-copy-btn').forEach(btn => btn.remove());
    return turndown.turndown(clonedElement.innerHTML).trim();
  } catch (error) {
    console.error('Error converting to Markdown:', error);
    return cleanText((element as HTMLElement).innerText || '');
  }
}

function convertToPlainText(element: Element): string {
  try {
    const text = (element as HTMLElement).innerText || '';
    return cleanText(text);
  } catch (error) {
    console.error('Error processing plain text:', error);
    return '';
  }
}

function getPageInfo() {
  return {
    title: document.title || '',
    url: window.location.href
  };
}

function formatAdditionalInfo(settings: Settings, pageInfo: { title: string; url: string }): string {
  if (!settings.attachTitle && !settings.attachURL) {
    return '';
  }
  
  const sourceLabel = getI18nMessage('source', settings.language);
  let additionalInfo = '\n\n---\n';
  
  if (settings.outputFormat === 'markdown') {
    if (settings.attachTitle && settings.attachURL) {
      additionalInfo += `${sourceLabel}: [${pageInfo.title}](${pageInfo.url})`;
    } else if (settings.attachTitle) {
      additionalInfo += `${sourceLabel}: ${pageInfo.title}`;
    } else if (settings.attachURL) {
      additionalInfo += `${sourceLabel}: ${pageInfo.url}`;
    }
  } else {
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

function processContent(element: Element, settings: Settings): string {
  try {
    let content: string;
    
    if (settings.outputFormat === 'markdown') {
      content = convertToMarkdown(element);
      if (settings.attachTitle || settings.attachURL) {
        content = `> ${content.replace(/\n/g, '\n> ')}`;
      }
    } else {
      content = convertToPlainText(element);
    }
    
    const pageInfo = getPageInfo();
    const additionalInfo = formatAdditionalInfo(settings, pageInfo);
    
    return content + additionalInfo;
  } catch (error) {
    console.error('Error in processContent:', error);
    return (element as HTMLElement).innerText || '';
  }
}

// Main content script logic
const HOVER_DEBOUNCE_DELAY = 100; // milliseconds

let currentTarget: Element | null = null;
let hoverTimeoutId: ReturnType<typeof setTimeout> | null = null;
let copyButton: HTMLElement | null = null;
let isInitialized = false;
let userSettings: Settings | null = null;
let lastPointerEvent: PointerEvent | null = null;

// No longer using the generic debounce function from before,
// as the logic is now more integrated into handlePointerMove.

function performViabilityCheck() {
  if (!lastPointerEvent) return;

  const target = lastPointerEvent.target as Element;
  if (!target) return;

  // If the button is visible and the target hasn't changed, do nothing.
  // This can happen if performViabilityCheck is called multiple times for the same target.
  if (copyButton && copyButton.style.display === 'flex' && target === currentTarget) {
    return;
  }

  // If the mouse has moved to a different element while waiting for the timeout,
  // or if the current target is no longer viable, hide the button.
  if (copyButton && currentTarget && target !== currentTarget) {
    hideButton(copyButton);
    // currentTarget will be updated below if the new target is viable
  }

  if (isViableBlock(target)) {
    currentTarget = target;
    if (!copyButton) {
      copyButton = createButton();
      setupButtonClickHandler(); // Ensure handler is set up only once or can be called multiple times safely
    }
    showButton(copyButton, lastPointerEvent.clientX, lastPointerEvent.clientY);
  } else {
    // If the target is not viable and the button is visible (perhaps for a previous element), hide it.
    if (copyButton && copyButton.style.display === 'flex') {
      hideButton(copyButton);
    }
    currentTarget = null;
  }
}

function scheduleViabilityCheck() {
  // Schedules the actual check using requestIdleCallback or setTimeout
  const callback = () => {
    try {
      performViabilityCheck();
    } catch (error) {
      console.error('Error in scheduled viability check:', error);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 100 });
  } else {
    setTimeout(callback, 0);
  }
}

function handlePointerMove(event: PointerEvent): void {
  // Store the latest pointer event
  lastPointerEvent = event;
  const target = event.target as Element;

  if (!target) return;

  // If the target is the button itself or its descendant, do nothing.
  if (copyButton && copyButton.contains(target)) {
    return;
  }
  
  // Clear any existing timeout to debounce
  if (hoverTimeoutId) {
    clearTimeout(hoverTimeoutId);
  }

  // Set a new timeout
  hoverTimeoutId = setTimeout(() => {
    // Only schedule the viability check if the mouse is still over the same target (or a child of it)
    // This check helps if the mouse briefly moves out and back in quickly.
    // For simplicity, we'll use the lastPointerEvent's target directly,
    // as the more complex check for "still over" might be overkill if scheduleViabilityCheck is efficient.
    if (lastPointerEvent && (lastPointerEvent.target as Element) === target) {
      scheduleViabilityCheck();
    } else if (copyButton && copyButton.style.display === 'flex' && currentTarget !== target) {
      // If the mouse has moved to a clearly different target before debounce triggers,
      // and the button is visible for a previous element, hide it.
      // This handles cases where the mouse moves away from a viable block before the debounce delay for that block finishes.
      hideButton(copyButton);
      currentTarget = null;
    }
  }, HOVER_DEBOUNCE_DELAY);
}


function setupButtonClickHandler(): void {
  if (!copyButton) return;
  // To prevent multiple listeners, check if one already exists or remove it first.
  // A simple way is to replace the button or use a flag.
  // For now, assuming createButton() returns the same instance or this is handled.
  // If createButton always makes a new one, this needs adjustment.
  // Given `buttonInstance` in createButton, it should be fine.
  
  copyButton.addEventListener('click', async (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentTarget || !userSettings) {
      console.error('No target element or settings available');
      return;
    }
    
    try {
      const content = processContent(currentTarget, userSettings);
      if (!content.trim()) {
        console.warn('No content to copy');
        return;
      }
      
      await navigator.clipboard.writeText(content);
      updateButtonState(copyButton!, 'copied');
      
      setTimeout(() => {
        if (copyButton) {
          updateButtonState(copyButton, 'copy');
        }
      }, 1500);
      
      console.debug('Content copied successfully:', content.substring(0, 100) + '...');
    } catch (error) {
      console.error('Error copying content:', error);
      
      try {
        const textarea = document.createElement('textarea');
        const content = processContent(currentTarget, userSettings!);
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        updateButtonState(copyButton!, 'copied');
        setTimeout(() => {
          if (copyButton) {
            updateButtonState(copyButton, 'copy');
          }
        }, 1500);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  });
}

function handleMouseLeave(): void {
  if (copyButton && currentTarget) {
    hideButton(copyButton);
    currentTarget = null;
  }
}

async function loadSettings(): Promise<void> {
  try {
    userSettings = await getSettings();
    console.debug('Settings loaded:', userSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    userSettings = {
      outputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en'
    };
  }
}

async function initializeContentScript(): Promise<void> {
  if (isInitialized) return;
  
  try {
    console.debug('AI Copilot: Initializing content script');
    
    await loadSettings();
    injectStyles();
    
    // Directly use handlePointerMove, as it now incorporates its own debouncing logic.
    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.copilot_settings) {
        userSettings = changes.copilot_settings.newValue;
        console.debug('Settings updated:', userSettings);
      }
    });
    
    window.addEventListener('beforeunload', cleanup);
    
    isInitialized = true;
    console.debug('AI Copilot: Content script initialized successfully');
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
}

function shouldInitialize(): boolean {
  return !(
    window.location.protocol === 'chrome:' ||
    window.location.protocol === 'chrome-extension:' ||
    window.location.protocol === 'moz-extension:' ||
    window.location.href.includes('ai-copilot')
  );
}

// Initialize when page is ready
if (shouldInitialize()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
  } else {
    initializeContentScript();
  }
} 