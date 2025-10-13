// Block identifier functionality

// Rule 3.2: Remove semantic tag filtering, keep truly invisible tags.
// Rule 3.1 & 3.2: Interactive elements like 'a', 'button' are generally not "content blocks" for copying.
// Retain 'iframe' in excluded as its content is a separate document.
export const EXCLUDED_TAGS = [
  // Tags that are generally containers and might be too broad if not leaf nodes with direct content.
  // We will rely on content and leaf checks more.
  // 'header', 'footer', 'nav', 'aside', 'dialog', 'menu', 'form', 'fieldset', 'legend', 'details', 'summary',

  // Truly invisible or non-content elements
  'script',
  'style',
  'noscript',
  'head',
  'meta',
  'link',
  'template',
  'area',
  'map',
  // Interactive controls that are not primarily for displaying content for copying as a "block"
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'optgroup',
  'label',
  // Iframe content is isolated and should not be targeted directly as a block this way.
  'iframe'
];

export const MIN_TEXT_LENGTH = 1; // Adjusted for potentially smaller but valid content blocks
export const MIN_WIDTH = 20; // Adjusted for smaller icons or elements
export const MIN_HEIGHT = 20; // Adjusted for smaller icons or elements

export function findEditableContext(element: Element | null): HTMLElement | null {
  let current: Element | null = element;
  while (current && current instanceof HTMLElement) {
    if (current.isContentEditable) {
      return current;
    }

    if (current.hasAttribute('contenteditable')) {
      const attr = current.getAttribute('contenteditable');
      if (!attr || attr.toLowerCase() !== 'false') {
        return current;
      }
      // If explicitly false, continue searching upwards to find true ancestor.
    }

    current = current.parentElement;
  }
  return null;
}

export function isInsideContentEditable(element: Element | null): boolean {
  return findEditableContext(element) !== null;
}

export function isElementVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return true; // Non-HTMLElements like SVGElement are considered visible if attached
  }
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
}

export function getTableAncestor(element: Element): HTMLTableElement | null {
  let current = element;
  while (current && current !== document.body) {
    if (current.tagName.toLowerCase() === 'table') {
      return current as HTMLTableElement;
    }
    current = current.parentElement as Element;
  }
  return null;
}

export function hasExcludedAncestor(element: Element): boolean {
  let current = element.parentElement; // Start with the parent
  while (current && current !== document.body) {
    if (EXCLUDED_TAGS.includes(current.tagName.toLowerCase())) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

// Rule 3.1: "has content" includes text, images, video etc.
export function hasVisibleContent(element: Element): boolean {
  if (!isElementVisible(element)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  // Check for specific media/embed tags that are inherently content
  if (['img', 'video', 'canvas', 'svg', 'picture', 'embed', 'object'].includes(tagName)) {
    // For img, check if it's loaded (naturalWidth/Height > 0 for img, or videoWidth/Height for video)
    if (tagName === 'img' && (element as HTMLImageElement).naturalWidth > 0) return true;
    if (tagName === 'video' && (element as HTMLVideoElement).readyState > 0) return true; // readyState > 0 means metadata loaded
    if (['canvas', 'svg', 'picture', 'embed', 'object'].includes(tagName)) return true; // Assume these have content if present
    // Could add more specific checks for these if needed
  }

  // Check for text content, ignoring whitespace
  const text = (element as HTMLElement).innerText?.trim() || '';
  if (text.length > 0) {
    // Any text is now considered content, MIN_TEXT_LENGTH will be checked later if element is text-dominant
    return true;
  }

  // Check if it has children that are visible and are themselves content elements (e.g. a div with an img inside)
  // This makes a non-leaf container potentially "have content" due to its children.
  // The "leaf node" aspect will be implicitly handled: if a child is a better target, it will be preferred.
  for (let i = 0; i < element.children.length; i++) {
    if (hasVisibleContent(element.children[i])) {
      // Recursive call, be cautious
      return true;
    }
  }
  return false;
}

export function meetsMinimumTextRequirement(element: Element): boolean {
  // This function is now more specific for text-dominant blocks.
  // Blocks that are primarily images/videos are handled by hasVisibleContent.
  const tagName = element.tagName.toLowerCase();
  if (['img', 'video', 'canvas', 'svg', 'picture', 'embed', 'object'].includes(tagName)) {
    return true; // Media elements don't need text.
  }
  const text = (element as HTMLElement).innerText?.replace(/\s+/g, '') || '';
  return text.length >= MIN_TEXT_LENGTH;
}

export function hasMinimumDimensions(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_WIDTH && rect.height >= MIN_HEIGHT;
}

// Rule 3.1: All contentful leaf nodes should be hoverable.
// Rule 3.2: Remove semantic tag filtering, rely on visibility and content.
// Rule 3.3: Text node hovering targets the parent element (handled in handlePointerMove).
export function isViableBlock(element: Element): boolean {
  try {
    const tagName = element.tagName.toLowerCase();

    if (isInsideContentEditable(element)) {
      return false;
    }

    // Rule 3.2: Filter out inherently invisible elements first.
    if (['script', 'style', 'meta', 'head', 'link', 'template', 'noscript'].includes(tagName)) {
      return false;
    }

    // Check visibility (covers display:none, visibility:hidden, opacity:0)
    if (!isElementVisible(element)) {
      return false;
    }

    // Rule 3.2: Check if element itself is an excluded tag type (e.g. a button, input)
    if (EXCLUDED_TAGS.includes(tagName)) {
      return false;
    }

    // Rule 3.2: Check if an ancestor is an excluded type that should prevent children from being blocks.
    if (hasExcludedAncestor(element)) {
      return false;
    }

    // Rule 3.1: Must have visible content (text, image, video, etc.)
    if (!hasVisibleContent(element)) {
      return false;
    }

    // Rule 3.1 / general usability: Must meet minimum dimensions.
    if (!hasMinimumDimensions(element)) {
      return false;
    }

    // Rule 3.1: If the element is primarily text-based, it should meet text length.
    const isMedia = ['img', 'video', 'canvas', 'svg', 'picture', 'embed', 'object'].includes(
      tagName
    );
    if (!isMedia && !meetsMinimumTextRequirement(element)) {
      return false;
    }

    // Leaf node consideration (optimized):
    // This logic checks if a child element is a more specific target.
    const childElements = Array.from(element.children).filter(
      (c) => c instanceof HTMLElement && !EXCLUDED_TAGS.includes(c.tagName.toLowerCase())
    ) as HTMLElement[];

    if (!isMedia && childElements.length > 0) {
      for (const child of childElements) {
        const childTagName = child.tagName.toLowerCase();

        // If a child is a visible media element with dimensions, the parent is not viable,
        // as the media element itself is a better target.
        if (['img', 'video', 'canvas', 'svg'].includes(childTagName)) {
          if (isElementVisible(child) && hasMinimumDimensions(child)) {
            return false; // Parent is not viable if a media child is a better target
          }
          continue; // Check next child
        }

        // Previously, there was a check here for non-media children.
        // This check was removed based on user feedback to allow parent elements
        // (like a <p> containing a <strong> and other text) to be viable targets
        // even if a text-based child could also be a target.
        // The goal is to make the directly clicked or containing block selectable.
      }
    }

    return true;
  } catch (error) {
    console.error('Error in isViableBlock:', error, element);
    return false;
  }
}

export function findViableBlock(clickedElement: Element): Element | null {
  const tableAncestor = getTableAncestor(clickedElement);
  if (tableAncestor && isViableBlock(tableAncestor)) {
    return tableAncestor;
  }

  // If no table is found, or the table is not viable, return the original element if it's viable.
  if (isViableBlock(clickedElement)) {
    return clickedElement;
  }

  return null;
}
