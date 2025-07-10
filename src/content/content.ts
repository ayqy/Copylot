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
    return !(
      hasExcludedAncestor(element) ||
      !hasMinimumTextContent(element) ||
      !hasMinimumDimensions(element) ||
      isInteractiveElement(element)
    );
  } catch (error) {
    console.error('Error in isViableBlock:', error);
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
const HOVER_DEBOUNCE_DELAY = 300;

let currentTarget: Element | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let copyButton: HTMLElement | null = null;
let isInitialized = false;
let userSettings: Settings | null = null;
let lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };

function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  return ((...args: any[]) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  }) as T;
}

function scheduleViabilityCheck(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 100 });
  } else {
    setTimeout(callback, 0);
  }
}

function handlePointerMove(event: PointerEvent): void {
  lastMousePosition = { x: event.clientX, y: event.clientY };
  const target = event.target as Element;
  if (!target || target === currentTarget) return;
  
  if (copyButton && currentTarget && target !== currentTarget) {
    // Clear border from old currentTarget if we are about to hide the button or switch targets
    if (currentTarget instanceof HTMLElement) {
      currentTarget.style.border = currentTarget.dataset.originalBorder || 'none';
      delete currentTarget.dataset.originalBorder;
    }
    hideButton(copyButton); // This will also set currentTarget to null if we hide
    // If hideButton didn't nullify currentTarget (e.g. due to some logic), ensure it's null before viability check
    if (target !== currentTarget) { // Check again as hideButton might modify currentTarget
        currentTarget = null;
    }
  }
  
  scheduleViabilityCheck(() => {
    try {
      if (isViableBlock(target)) {
        // If there was an old currentTarget (e.g. from keydown), clear its border
        if (currentTarget && currentTarget !== target && currentTarget instanceof HTMLElement) {
            currentTarget.style.border = currentTarget.dataset.originalBorder || 'none';
            delete currentTarget.dataset.originalBorder;
        }

        currentTarget = target;
        if (!copyButton) {
          copyButton = createButton();
          setupButtonClickHandler();
        }
        // Ensure button is shown with new currentTarget
        showButton(copyButton, event.clientX, event.clientY);
      } else if (copyButton && currentTarget === target) {
        // If the current target is no longer viable (e.g. due to DOM change), hide button
        hideButton(copyButton);
        currentTarget = null;
      }
    } catch (error) {
      console.error('Error in viability check:', error);
    }
  });
}

function handleKeyDown(event: KeyboardEvent): void {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isModifierPressed = (isMac && event.metaKey && !event.ctrlKey) || (!isMac && event.ctrlKey && !event.metaKey);

  if (isModifierPressed && currentTarget && copyButton) {
    event.preventDefault(); // Prevent browser shortcuts like Ctrl+S
    const parent = currentTarget.parentElement;

    if (parent && parent !== document.body && parent !== document.documentElement) {
      // Basic check: don't expand to an excluded tag if it's the direct parent
      // More sophisticated checks from isViableBlock could be added here if needed
      if (EXCLUDED_TAGS.includes(parent.tagName.toLowerCase())) {
        console.debug('Parent is an excluded tag, stopping expansion.');
        return;
      }

      // Clear border from the old currentTarget
      if (currentTarget instanceof HTMLElement) {
        currentTarget.style.border = currentTarget.dataset.originalBorder || 'none';
        delete currentTarget.dataset.originalBorder;
      }

      currentTarget = parent;

      // Reset button state to 'copy' as the target has changed
      updateButtonState(copyButton, 'copy');

      // Show button and border on the new currentTarget
      // We use lastMousePosition as keydown events don't have clientX/clientY
      showButton(copyButton, lastMousePosition.x, lastMousePosition.y);
    } else {
      console.debug('No valid parent to expand to.');
    }
  }
}

function setupButtonClickHandler(): void {
  if (!copyButton) return;
  
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
    
    const debouncedPointerMove = debounce(handlePointerMove, HOVER_DEBOUNCE_DELAY);
    document.addEventListener('pointermove', debouncedPointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: true });
    
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