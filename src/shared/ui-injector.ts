// Button states
export type ButtonState = 'copy' | 'copied';

// Offset from cursor position
const CURSOR_OFFSET_X = 8;
const CURSOR_OFFSET_Y = 8;

// Button dimensions
const BUTTON_SIZE = 32;

// Z-index to ensure button appears above other content
const BUTTON_Z_INDEX = 2147483647;

// Singleton button instance
let copyButton: HTMLElement | null = null;

/**
 * Get localized message
 */
function getMessage(key: string): string {
  return chrome.i18n.getMessage(key) || key;
}

/**
 * Create SVG icon for copy state
 */
function createCopyIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
}

/**
 * Create SVG icon for copied state
 */
function createCopiedIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;
}

/**
 * Create the copy button element
 */
export function createCopyButton(): HTMLElement {
  if (copyButton) {
    return copyButton;
  }

  const button = document.createElement('div');
  button.id = 'ai-copilot-copy-btn';
  
  // Button styles
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
    zIndex: BUTTON_Z_INDEX.toString(),
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    pointerEvents: 'auto'
  });

  // Set initial state
  button.innerHTML = createCopyIcon();
  button.title = getMessage('copy');
  
  // Hover effects
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

  // Add to document
  document.body.appendChild(button);
  copyButton = button;
  
  return button;
}

/**
 * Position button near cursor position
 */
export function moveButtonToCursor(button: HTMLElement, x: number, y: number): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculate position with offset
  let left = x + CURSOR_OFFSET_X;
  let top = y + CURSOR_OFFSET_Y;
  
  // Ensure button stays within viewport
  if (left + BUTTON_SIZE > viewportWidth) {
    left = x - BUTTON_SIZE - CURSOR_OFFSET_X;
  }
  
  if (top + BUTTON_SIZE > viewportHeight) {
    top = y - BUTTON_SIZE - CURSOR_OFFSET_Y;
  }
  
  // Ensure minimum distance from viewport edges
  left = Math.max(8, Math.min(left, viewportWidth - BUTTON_SIZE - 8));
  top = Math.max(8, Math.min(top, viewportHeight - BUTTON_SIZE - 8));
  
  button.style.left = `${left}px`;
  button.style.top = `${top}px`;
}

/**
 * Show the copy button
 */
export function showButton(button: HTMLElement, x: number, y: number): void {
  moveButtonToCursor(button, x, y);
  button.style.display = 'flex';
}

/**
 * Hide the copy button
 */
export function hideButton(button: HTMLElement): void {
  button.style.display = 'none';
  // Reset state when hiding
  setButtonState(button, 'copy');
}

/**
 * Set button state (copy or copied)
 */
export function setButtonState(button: HTMLElement, state: ButtonState): void {
  button.dataset.state = state;
  
  if (state === 'copy') {
    button.innerHTML = createCopyIcon();
    button.title = getMessage('copy');
    button.style.backgroundColor = '#4F46E5';
    button.style.transform = 'scale(1)';
  } else if (state === 'copied') {
    button.innerHTML = createCopiedIcon();
    button.title = getMessage('copied');
    button.style.backgroundColor = '#059669';
    button.style.transform = 'scale(1.1)';
    
    // Add success animation
    button.style.animation = 'none';
    // Force reflow
    button.offsetHeight;
    button.style.animation = 'ai-copilot-success 0.8s ease-out';
  }
}

/**
 * Add success animation styles to document
 */
export function injectAnimationStyles(): void {
  if (document.getElementById('ai-copilot-styles')) {
    return;
  }
  
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

/**
 * Remove button and styles from DOM
 */
export function cleanup(): void {
  if (copyButton && copyButton.parentNode) {
    copyButton.parentNode.removeChild(copyButton);
    copyButton = null;
  }
  
  const styles = document.getElementById('ai-copilot-styles');
  if (styles && styles.parentNode) {
    styles.parentNode.removeChild(styles);
  }
} 