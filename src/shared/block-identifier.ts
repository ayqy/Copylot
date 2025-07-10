// Black list of elements and their parents to exclude
const BLACKLIST_TAGS = [
  // Structural & semantic (exclude non-core content areas)
  'header', 'footer', 'nav', 'aside', 'dialog', 'menu', 'form', 'fieldset', 'legend',
  // Interactive & form (exclude functional controls)
  'a', 'button', 'input', 'textarea', 'select', 'option', 'optgroup', 'label', 'details', 'summary',
  // Media & embedded (exclude non-text content)
  'img', 'iframe', 'video', 'audio', 'canvas', 'embed', 'object', 'picture', 'map', 'area',
  // Metadata & script (exclude invisible elements)
  'script', 'style', 'noscript', 'head', 'meta', 'link', 'template'
];

// Minimum requirements
const MIN_TEXT_LENGTH = 50; // characters (excluding spaces)
const MIN_WIDTH = 200; // pixels
const MIN_HEIGHT = 40; // pixels

/**
 * Check if element or any of its parents is in the blacklist
 */
function hasBlacklistedParent(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    if (BLACKLIST_TAGS.includes(current.tagName.toLowerCase())) {
      return true;
    }
    current = current.parentElement;
  }
  
  return false;
}

/**
 * Check if element has sufficient text content
 */
function hasMinimumTextContent(element: HTMLElement): boolean {
  const text = element.innerText?.replace(/\s+/g, '') || '';
  return text.length > MIN_TEXT_LENGTH;
}

/**
 * Check if element has sufficient rendered size
 */
function hasMinimumSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > MIN_WIDTH && rect.height > MIN_HEIGHT;
}

/**
 * Check if element itself is an interactive or media element
 */
function isInteractiveOrMediaElement(element: HTMLElement): boolean {
  const interactiveTypes = [
    'a', 'button', 'img', 'input', 'video', 'audio', 'canvas', 'iframe',
    'textarea', 'select', 'option', 'embed', 'object'
  ];
  
  return interactiveTypes.includes(element.tagName.toLowerCase());
}

/**
 * Determine if a given DOM element is a "viable content block"
 * that can be copied by the extension.
 * 
 * @param element - The HTML element to check
 * @returns true if the element is viable for copying
 */
export function isViableBlock(element: HTMLElement): boolean {
  try {
    // 1. Blacklist filtering: element and parents must not be blacklisted
    if (hasBlacklistedParent(element)) {
      return false;
    }
    
    // 2. Content density filtering
    if (!hasMinimumTextContent(element)) {
      return false;
    }
    
    if (!hasMinimumSize(element)) {
      return false;
    }
    
    // 3. Element type filtering: element itself should not be interactive/media
    if (isInteractiveOrMediaElement(element)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in isViableBlock:', error);
    return false;
  }
} 