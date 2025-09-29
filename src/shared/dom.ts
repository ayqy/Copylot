/**
 * DOM utilities for waiting and finding elements
 */

/**
 * Waits for an element to appear in the DOM
 * @param selector CSS selector to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @param root Root element to search within (default: document)
 * @returns Promise that resolves with the element when found
 */
export function waitForElement<T extends Element = Element>(
  selector: string,
  timeout: number = 10000,
  root: Document | Element = document
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const existingElement = root.querySelector<T>(selector);
    if (existingElement) {
      resolve(existingElement);
      return;
    }
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element '${selector}' not found within ${timeout}ms`));
    }, timeout);
    
    // Set up observer
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const element = root.querySelector<T>(selector);
          if (element) {
            observer.disconnect();
            clearTimeout(timeoutId);
            resolve(element);
            return;
          }
        }
      }
    });
    
    // Start observing
    observer.observe(root instanceof Document ? root.documentElement : root, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Waits for multiple elements to appear in the DOM
 * @param selectors Array of CSS selectors to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @param root Root element to search within (default: document)
 * @returns Promise that resolves with array of elements when all are found
 */
export function waitForElements(
  selectors: string[],
  timeout: number = 10000,
  root: Document | Element = document
): Promise<Element[]> {
  return Promise.all(
    selectors.map(selector => waitForElement(selector, timeout, root))
  );
}

/**
 * Waits for an element to become visible (not just present in DOM)
 * @param selector CSS selector to wait for
 * @param timeout Maximum time to wait in milliseconds (default: 10000)
 * @param root Root element to search within (default: document)
 * @returns Promise that resolves with the element when visible
 */
export function waitForVisibleElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  timeout: number = 10000,
  root: Document | Element = document
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Visible element '${selector}' not found within ${timeout}ms`));
    }, timeout);
    
    const checkVisibility = () => {
      const element = root.querySelector<T>(selector);
      if (element && isElementVisible(element)) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (checkVisibility()) return;
    
    // Set up observer
    const observer = new MutationObserver(() => {
      checkVisibility();
    });
    
    observer.observe(root instanceof Document ? root.documentElement : root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });
  });
}

/**
 * Checks if an element is visible (has non-zero dimensions and not hidden)
 * @param element The element to check
 * @returns True if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

/**
 * Finds the best matching element for a title input
 * Tries multiple common selectors for title fields
 * @param root Root element to search within (default: document)
 * @returns The title input element or null if not found
 */
export function findTitleInput(root: Document | Element = document): HTMLInputElement | HTMLTextAreaElement | null {
  const selectors = [
    'input[placeholder*="标题"]',
    'input[placeholder*="title"]',
    'textarea[placeholder*="标题"]',
    'textarea[placeholder*="title"]',
    'input[name*="title"]',
    'input[id*="title"]',
    'textarea[name*="title"]',
    'textarea[id*="title"]',
    '.title input',
    '.title textarea',
    '#title',
    '[data-testid*="title"]',
  ];
  
  for (const selector of selectors) {
    const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (element) {
      return element;
    }
  }
  
  return null;
}

/**
 * Finds the best matching element for a content editor
 * Tries multiple common selectors for rich text editors
 * @param root Root element to search within (default: document)
 * @returns The content editor element or null if not found
 */
export function findContentEditor(root: Document | Element = document): HTMLElement | null {
  const selectors = [
    '.ProseMirror',
    '.DraftEditor-editorContainer',
    '.DraftEditor-root',
    '[contenteditable="true"]',
    '.ql-editor',
    '.note-editable',
    '.fr-element',
    '.cke_editable',
    '.mce-content-body',
    '.editor-content',
    '.rich-editor',
    '[data-testid*="editor"]',
    '[data-testid*="content"]',
  ];
  
  for (const selector of selectors) {
    const element = root.querySelector<HTMLElement>(selector);
    if (element && isElementVisible(element)) {
      return element;
    }
  }
  
  return null;
}

/**
 * Finds the publish button
 * Tries multiple common selectors for publish buttons
 * @param root Root element to search within (default: document)
 * @returns The publish button element or null if not found
 */
export function findPublishButton(root: Document | Element = document): HTMLButtonElement | null {
  const selectors = [
    'button:contains("发布")',
    'button:contains("发表")',
    'button:contains("提交")',
    'button:contains("publish")',
    'button:contains("post")',
    'button:contains("submit")',
    '[data-testid*="publish"]',
    '[data-testid*="submit"]',
    '.publish-btn',
    '.submit-btn',
    '#publish',
    '#submit',
  ];
  
  // Custom contains selector implementation
  const buttons = root.querySelectorAll('button');
  for (const button of buttons) {
    const text = button.textContent?.trim().toLowerCase() || '';
    if (text.includes('发布') || text.includes('发表') || text.includes('提交') || 
        text.includes('publish') || text.includes('post') || text.includes('submit')) {
      return button as HTMLButtonElement;
    }
  }
  
  // Try other selectors
  for (const selector of selectors.slice(6)) {
    const element = root.querySelector<HTMLButtonElement>(selector);
    if (element) {
      return element;
    }
  }
  
  return null;
}
