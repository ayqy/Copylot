/**
 * Utility to clone a DOM subtree while stripping out nodes that are not visible to the user.
 * This is used by Magic Copy before any text/markdown conversion so that hidden or decorative
 * nodes (e.g. aria-hidden, sr-only) do not appear in the copied result.
 */

export function createVisibleClone(root: Element): Element {
  // Create a shallow clone of the root (without children for now)
  const cloneRoot = root.cloneNode(false) as Element;
  // Recursively copy only visible children
  recursiveCopy(root, cloneRoot);
  return cloneRoot;
}

/**
 * Recursively copies child nodes from original to cloneParent, skipping nodes that are hidden
 * according to `isNodeHidden` and empty text nodes.
 */
function recursiveCopy(original: Node, cloneParent: Node): void {
  const childNodes = Array.from(original.childNodes);
  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      // Skip pure-whitespace text nodes
      const text = child.textContent ?? "";
      if (text.trim() === "") continue;
      cloneParent.appendChild(child.cloneNode());
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      if (isNodeHidden(el)) {
        continue; // skip entire subtree
      }
      const cloneEl = el.cloneNode(false) as HTMLElement;
      cloneParent.appendChild(cloneEl);
      // recurse
      recursiveCopy(el, cloneEl);
    }
  }
}

/**
 * Determines whether the given element should be considered hidden for user-visible purposes.
 * Implements rules R1–R9 from the design spec.
 */
function isNodeHidden(el: HTMLElement): boolean {
  // R2: aria-hidden="true"
  if (el.getAttribute("aria-hidden") === "true") return true;

  // R3: role="presentation" or role="none"
  const role = el.getAttribute("role");
  if (role === "presentation" || role === "none") return true;

  // R4: common utility classes that visually hide content
  const cls = el.className;
  if (cls && /(sr-only|visually-hidden|screen-reader-only)/i.test(cls)) return true;

  const style = window.getComputedStyle(el);

  // R1: display/visibility/opacity
  if (style.display === "none" || style.visibility === "hidden") return true;
  const opacity = parseFloat(style.opacity || "1");
  if (!isNaN(opacity) && opacity <= 0.05) return true;

  // R5: transform scale(0) or filter opacity(0)
  if (/scale\(0/.test(style.transform) || /scaleX\(0/.test(style.transform) || /scaleY\(0/.test(style.transform)) {
    return true;
  }
  if (/opacity\(0/.test(style.filter)) return true;

  // clip / clip-path hiding
  if (style.clip === "rect(0px, 0px, 0px, 0px)" || /inset\(100%/.test(style.clipPath)) {
    return true;
  }

  // text-indent far offscreen
  const textIndent = parseFloat(style.textIndent || "0");
  if (!isNaN(textIndent) && textIndent <= -9999) return true;

  // R6: zero dimensions
  if (
    el.offsetWidth + el.offsetHeight + el.clientWidth + el.clientHeight === 0 &&
    // allow inline SVG etc. ; treat as hidden if also no border box
    !(el instanceof HTMLImageElement || el instanceof HTMLVideoElement)
  ) {
    return true;
  }

  // R7: out of viewport (only if element has dimensions)
  try {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (rect.bottom < 0 || rect.right < 0) return true;
    }
  } catch {
    // getBoundingClientRect may fail on detached nodes; ignore.
  }

  // R8 handled by zero dimension rule above for media elements of size 0;

  return false;
} 