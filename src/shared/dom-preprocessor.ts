/**
 * Utility to clone a DOM subtree while stripping out nodes that are not visible to the user.
 * This is used by Magic Copy before any text/markdown conversion so that hidden or decorative
 * nodes (e.g. aria-hidden, sr-only) do not appear in the copied result.
 */

/**
 * 检查元素是否在代码块上下文中
 */
function isInCodeBlock(element: Element): boolean {
  let current: Element | null = element;
  while (current) {
    const tagName = current.tagName.toLowerCase();
    if (tagName === 'pre' || tagName === 'code') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

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
      const text = child.textContent ?? "";
      // 在代码块中保留所有空白，包括纯空白行
      if (isInCodeBlock(original as Element) || text.trim() !== "") {
        cloneParent.appendChild(child.cloneNode());
      }
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
  const logHidden = (reason: string) => {
    // 保留参数，便于需要时打开调试日志
    // console.log(`[Debug DOM Preprocessor] Hiding ${el.tagName}#${el.id}.${el.className} due to: ${reason}`, el);
    // 标记为已使用以通过 ESLint（不改变运行逻辑）
    void reason;
    return true;
  };

  // 使用元素所属文档的视图来匹配 iframe/嵌入场景，避免跨文档几何计算失真
  const ownerDoc = el.ownerDocument || document;
  const view = ownerDoc.defaultView || window;

  // R2: aria-hidden="true"
  if (el.getAttribute("aria-hidden") === "true") return logHidden('aria-hidden=true');
  // NOTE: We intentionally ignore ARIA role attributes for visibility pruning.
  // Presentational roles (e.g., role="presentation"/"none") do not imply visual hiding.
  // Many real-world pages misuse role on content containers (including tables),
  // so role MUST NOT be used to decide visibility here.

  // R4: common utility classes that visually hide content
  const cls = el.className;
  if (cls && typeof cls === 'string' && /(sr-only|visually-hidden|screen-reader-only)/i.test(cls)) return logHidden('screen reader class');

  const style = window.getComputedStyle(el);

  // R1: display/visibility/opacity
  if (style.display === "none" || style.visibility === "hidden") return logHidden(`display: ${style.display} or visibility: ${style.visibility}`);
  const opacity = parseFloat(style.opacity || "1");
  if (!isNaN(opacity) && opacity <= 0.05) return logHidden(`opacity: ${opacity}`);

  // R5: transform scale(0) or filter opacity(0)
  if (/scale\(0/.test(style.transform) || /scaleX\(0/.test(style.transform) || /scaleY\(0/.test(style.transform)) {
    return logHidden(`transform: ${style.transform}`);
  }
  if (/opacity\(0/.test(style.filter)) return logHidden(`filter: ${style.filter}`);

  // clip / clip-path hiding
  if (style.clip === "rect(0px, 0px, 0px, 0px)" || /inset\(100%/.test(style.clipPath)) {
    return logHidden(`clip/clip-path: ${style.clip || style.clipPath}`);
  }

  // text-indent far offscreen
  const textIndent = parseFloat(style.textIndent || "0");
  if (!isNaN(textIndent) && textIndent <= -9999) return logHidden(`text-indent: ${textIndent}`);

  // R6: zero dimensions - IMPROVED VERSION
  const isZeroSize = el.offsetWidth + el.offsetHeight + el.clientWidth + el.clientHeight === 0;

  if (isZeroSize) {
    // Special handling for void elements that are semantically meaningful
    // Void elements like <br>, <hr>, <img> etc. naturally have zero size but should not be hidden
    const voidElements = ['BR', 'HR', 'IMG', 'INPUT', 'META', 'LINK', 'AREA', 'BASE', 'COL', 'EMBED', 'SOURCE', 'TRACK', 'WBR'];
    if (voidElements.includes(el.tagName)) {
      return false;
    }

    // Additional check: if element has content but no dimensions, it might be due to CSS loading issues
    const hasTextContent = el.textContent && el.textContent.trim().length > 0;
    const hasChildElements = el.children.length > 0;

    // For elements with actual content, don't treat them as hidden even if dimensions are zero
    // This addresses the issue where CSS loading affects dimension calculations
    if (hasTextContent || hasChildElements) {
      // console.log(`[Debug DOM Preprocessor] Element has content but zero dimensions, treating as visible: ${el.tagName}#${el.id}.${el.className}`);
      return false;
    }

    // If the element has zero size, check if any of its children are visible.
    // If any child is visible, then the parent should be considered visible.
    if (el.children.length > 0) {
      for (let i = 0; i < el.children.length; i++) {
        if (!isNodeHidden(el.children[i] as HTMLElement)) {
          return false; // The parent is not hidden if at least one child is visible
        }
      }
    }
    // If all children are hidden or there are no children, and the element itself is zero-size, then it's hidden.
    return logHidden('Zero size with no visible children');
  }


  // R7: out of viewport (only if element has dimensions)
  try {
    const disableOffscreenPruning = Boolean(
      (view as typeof globalThis & { __COPYLOT_TEST_DISABLE_OFFSCREEN?: boolean }).__COPYLOT_TEST_DISABLE_OFFSCREEN ??
      (globalThis as { __COPYLOT_TEST_DISABLE_OFFSCREEN?: boolean }).__COPYLOT_TEST_DISABLE_OFFSCREEN
    );
    if (disableOffscreenPruning) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const docElement = ownerDoc.documentElement;
      const body = ownerDoc.body;
      const scrollY = view.scrollY || view.pageYOffset || 0;
      const scrollX = view.scrollX || view.pageXOffset || 0;

      const docTop = rect.top + scrollY;
      const docBottom = rect.bottom + scrollY;
      const docLeft = rect.left + scrollX;
      const docRight = rect.right + scrollX;

      const docHeight = Math.max(
        view.innerHeight,
        docElement?.scrollHeight ?? 0,
        body?.scrollHeight ?? 0,
        docElement?.offsetHeight ?? 0,
        body?.offsetHeight ?? 0
      );
      const docWidth = Math.max(
        view.innerWidth,
        docElement?.scrollWidth ?? 0,
        body?.scrollWidth ?? 0,
        docElement?.offsetWidth ?? 0,
        body?.offsetWidth ?? 0
      );

      if (docBottom < 0) return logHidden('Element above document bounds');
      if (docTop > docHeight) return logHidden('Element below document bounds');
      if (docRight < 0) return logHidden('Element left of document bounds');
      if (docLeft > docWidth) return logHidden('Element right of document bounds');
    }
  } catch {
    // getBoundingClientRect may fail on detached nodes; ignore.
  }

  // R8 handled by zero dimension rule above for media elements of size 0;

  return false;
}
