// UI injector functionality

export const BUTTON_SIZE = 32;
export const MAX_Z_INDEX = 2147483647;

let buttonInstance: HTMLElement | null = null;

// This function relies on chrome.i18n.getMessage.
// It's specific to the extension environment.
export function getMessage(key: string): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
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

export function getAppendModeIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `;
}

export function getErrorIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  `;
}

export function getDropdownIcon(): string {
  return `
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  `;
}

export function createPromptMenu(prompts: any[]): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'ai-copilot-prompt-menu';
  menu.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 100px;
    background: rgba(79, 70, 229, 0.8);
    border: 1px solid rgb(79, 70, 229);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: ${MAX_Z_INDEX + 1};
    display: none;
    padding: 2px 0;
    font-size: 13px;
  `;

  if (prompts && prompts.length > 0) {
    prompts.forEach((prompt) => {
      const item = document.createElement('div');
      item.className = 'ai-copilot-prompt-item';
      item.textContent = prompt.title;
      item.dataset.promptId = prompt.id;
      item.style.cssText = `
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
        color: #ffffff;
        transition: background-color 0.1s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f3f4f6';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });
      
      menu.appendChild(item);
    });
  } else {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'ai-copilot-prompt-empty';
    emptyItem.textContent = 'No prompts available';
    emptyItem.style.cssText = `
      padding: 6px 12px;
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    `;
    menu.appendChild(emptyItem);
  }

  return menu;
}

export function showPromptMenu(button: HTMLElement): void {
  const menu = button.querySelector('.ai-copilot-prompt-menu') as HTMLElement;
  if (menu) {
    menu.style.display = 'block';
  }
}

export function hidePromptMenu(button: HTMLElement): void {
  const menu = button.querySelector('.ai-copilot-prompt-menu') as HTMLElement;
  if (menu) {
    menu.style.display = 'none';
  }
}

export function updatePromptMenu(button: HTMLElement, prompts: any[]): void {
  const existingMenu = button.querySelector('.ai-copilot-prompt-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  if (prompts && prompts.length > 0) {
    const newMenu = createPromptMenu(prompts);
    button.appendChild(newMenu);
  }
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
    pointerEvents: 'auto'
  });

  button.innerHTML = getCopyIcon();
  button.title = getMessage('copy');

  button.addEventListener('mouseenter', () => {
    if (button.dataset.state !== 'copied' && button.dataset.state !== 'append-mode') {
      button.style.backgroundColor = '#3730A3';
      button.style.transform = 'scale(1.05)';
    }
  });

  button.addEventListener('mouseleave', () => {
    if (button.dataset.state !== 'copied' && button.dataset.state !== 'append-mode') {
      button.style.backgroundColor = '#4F46E5';
      button.style.transform = 'scale(1)';
    }
    // Hide prompt menu when mouse leaves
    hidePromptMenu(button);
  });

  document.body.appendChild(button);
  buttonInstance = button;
  return button;
}

export function positionButton(button: HTMLElement, x: number, y: number): void {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate initial position for center alignment
  let left = x - BUTTON_SIZE / 2;
  let top = y - BUTTON_SIZE / 2;

  // Adjust if button goes off screen
  // Check right edge
  if (left + BUTTON_SIZE > viewportWidth) {
    left = viewportWidth - BUTTON_SIZE - 8; // Place it with a small margin from the edge
  }
  // Check left edge
  if (left < 0) {
    left = 8; // Place it with a small margin from the edge
  }

  // Check bottom edge
  if (top + BUTTON_SIZE > viewportHeight) {
    top = viewportHeight - BUTTON_SIZE - 8; // Place it with a small margin from the edge
  }
  // Check top edge
  if (top < 0) {
    top = 8; // Place it with a small margin from the edge
  }

  button.style.left = `${left}px`;
  button.style.top = `${top}px`;
}

// showButton and hideButton interact with `currentTarget` from the main script's scope
// This dependency will be resolved by the inlining process.
export function showButton(
  button: HTMLElement,
  x: number,
  y: number,
  currentTargetElement: HTMLElement | null
): void {
  positionButton(button, x, y);
  button.style.display = 'flex';

  if (currentTargetElement) {
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      if (currentTargetElement) {
        // Only save original outline if it hasn't been saved yet
        if (currentTargetElement.dataset.originalOutline === undefined) {
          currentTargetElement.dataset.originalOutline = currentTargetElement.style.outline || '';
        }
        // Use outline instead of border to avoid being covered by cell borders
        currentTargetElement.style.setProperty('outline', '2px solid #4F46E5', 'important');
      }
    });
  }
}

export function hideButton(button: HTMLElement, currentTargetElement: HTMLElement | null): void {
  button.style.display = 'none';
  updateButtonState(button, 'copy'); // Reset to default state

  if (currentTargetElement) {
    // First, remove the !important outline style that was set in showButton
    currentTargetElement.style.removeProperty('outline');
    
    // Then restore the original outline if it exists
    if (currentTargetElement.dataset.originalOutline !== undefined) {
      const originalOutline = currentTargetElement.dataset.originalOutline;
      if (originalOutline && originalOutline !== 'none' && originalOutline !== '') {
        currentTargetElement.style.outline = originalOutline;
      } else {
        // If original was 'none' or empty, explicitly set to 'none'
        currentTargetElement.style.outline = 'none';
      }
      delete currentTargetElement.dataset.originalOutline;
    } else {
      // If no original outline was saved, ensure outline is cleared
      currentTargetElement.style.outline = 'none';
    }
  }
}

export function updateButtonState(button: HTMLElement, state: 'copy' | 'copied' | 'error' | 'append-mode'): void {
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
  } else if (state === 'error') {
    button.innerHTML = getErrorIcon();
    button.title = getMessage('error');
    button.style.backgroundColor = '#DC2626';
    button.style.transform = 'scale(1.1)';
    // Ensure animation restarts correctly
    button.style.animation = 'none';
    button.offsetHeight; // Trigger reflow
    button.style.animation = 'ai-copilot-error 0.8s ease-out';
  } else if (state === 'append-mode') {
    button.innerHTML = getAppendModeIcon();
    button.title = getMessage('appendMode');
    // Force orange background with higher priority
    button.style.setProperty('background-color', '#D97706', 'important');
    button.style.setProperty('transform', 'scale(1.05)', 'important');
    button.style.animation = 'none';
    // Ensure the button is visible and styled correctly
    button.style.setProperty('color', 'white', 'important');
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
    

    @keyframes ai-copilot-error {
      0% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      50% {
        box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4), 0 0 0 4px rgba(220, 38, 38, 0.2);
      }
      100% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
    
    #ai-copilot-copy-btn {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
    }
    
    .ai-copilot-prompt-menu {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .ai-copilot-prompt-item:hover {
      background-color: rgb(79, 70, 229) !important;
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
