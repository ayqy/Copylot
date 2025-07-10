// UI injector functionality

export const BUTTON_OFFSET_X = 8;
export const BUTTON_OFFSET_Y = 8;
export const BUTTON_SIZE = 32;
export const MAX_Z_INDEX = 2147483647;

let buttonInstance: HTMLElement | null = null;

// This function relies on chrome.i18n.getMessage.
// It's specific to the extension environment.
export function getMessage(key: string): string {
  try {
    if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
      return chrome.i18n.getMessage(key) || key;
    }
    return key; // Fallback if API not available
  } catch (e) {
    return key; // Fallback on error
  }
}

export function getCopyIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
}

export function getCopiedIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>
  `;
}

export function createButton(): HTMLElement {
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
    pointerEvents: 'auto' // Important for the button to be clickable
  });
  
  button.innerHTML = getCopyIcon();
  button.title = getMessage('copy'); // Use getMessage for title

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

export function positionButton(button: HTMLElement, x: number, y: number): void {
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

// showButton and hideButton interact with `currentTarget` from the main script's scope
// This dependency will be resolved by the inlining process.
export function showButton(button: HTMLElement, x: number, y: number, currentTargetElement: HTMLElement | null): void {
  positionButton(button, x, y);
  button.style.display = 'flex';

  if (currentTargetElement) {
    currentTargetElement.dataset.originalBorder = currentTargetElement.style.border;
    currentTargetElement.style.border = '1px solid #4F46E5';
  }
}

export function hideButton(button: HTMLElement, currentTargetElement: HTMLElement | null): void {
  button.style.display = 'none';
  updateButtonState(button, 'copy'); // Reset to default state

  if (currentTargetElement) {
    currentTargetElement.style.border = currentTargetElement.dataset.originalBorder || 'none'; // Use 'none' as a fallback
    delete currentTargetElement.dataset.originalBorder;
  }
}

export function updateButtonState(button: HTMLElement, state: 'copy' | 'copied'): void {
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
    // Ensure animation restarts correctly
    button.style.animation = 'none';
    button.offsetHeight; // Trigger reflow
    button.style.animation = 'ai-copilot-success 0.8s ease-out';
  }
}

export function injectStyles(): void {
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

export function cleanup(): void {
  if (buttonInstance && buttonInstance.parentNode) {
    buttonInstance.parentNode.removeChild(buttonInstance);
    buttonInstance = null;
  }
  
  const styles = document.getElementById('ai-copilot-styles');
  if (styles && styles.parentNode) {
    styles.parentNode.removeChild(styles);
  }
}
