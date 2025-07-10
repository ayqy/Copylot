// Import types and specific functions/constants that might be needed by the outer shell
// before inlining. This helps with TypeScript checking for the main script file.
// The actual functions/constants from these modules will be globally available after inlining.
import type { Settings } from '../shared/settings-manager';
// No need to import specific functions like isViableBlock, createButton etc. here,
// as they will be part of the global scope after the inline build step.
// The /* INLINE:... */ comments will bring their definitions directly into this file.

/* INLINE:block-identifier */
/* INLINE:settings-manager */
/* INLINE:ui-injector */
/* INLINE:content-processor */

// Main content script logic
const HOVER_DEBOUNCE_DELAY = 30;

let currentTarget: Element | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let copyButtonElement: HTMLElement | null = null; // Holds the button instance from ui-injector
let isInitialized = false;
let userSettings: Settings | null = null; // Will be populated by getSettings()
let lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };

// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  return ((...args: any[]) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  }) as T;
}

// Schedules a callback using requestAnimationFrame for smoother UI updates.
function scheduleViabilityCheck(callback: () => void): void {
  requestAnimationFrame(callback);
}

// Handles pointer movement to identify potential target elements.
function handlePointerMove(event: PointerEvent): void {
  lastMousePosition = { x: event.clientX, y: event.clientY };
  let potentialTargetElement = event.target as Node;

  // If hovering over a text node, use its parent element.
  if (potentialTargetElement.nodeType === Node.TEXT_NODE) {
    potentialTargetElement = potentialTargetElement.parentElement || potentialTargetElement;
  }

  if (!(potentialTargetElement instanceof Element) || potentialTargetElement === copyButtonElement) {
    // If target is not an element or is the button itself, do nothing.
    // (The button check prevents the button from becoming a target for itself)
    return;
  }

  const target = potentialTargetElement;

  if (target === currentTarget) return; // No change in target

  // If a button exists and we are definitely changing targets, hide it from the old target.
  if (copyButtonElement && currentTarget && target !== currentTarget) {
    // @ts-ignore: hideButton is available from inlined ui-injector.ts
    hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
    // currentTarget will be updated or nulled out below.
  }
  
  scheduleViabilityCheck(() => {
    try {
      // @ts-ignore: isViableBlock is available from inlined block-identifier.ts
      if (isViableBlock(target)) {
        // Clear border from previous target if it was different
        if (currentTarget && currentTarget !== target && currentTarget instanceof HTMLElement) {
          if (currentTarget.dataset.originalBorder !== undefined) {
            currentTarget.style.border = currentTarget.dataset.originalBorder || 'none';
            delete currentTarget.dataset.originalBorder;
          }
        }

        currentTarget = target;
        if (!copyButtonElement) {
          // @ts-ignore: createButton is available from inlined ui-injector.ts
          copyButtonElement = createButton();
          setupButtonClickHandler(); // Set up once
        }
        // @ts-ignore: showButton is available from inlined ui-injector.ts
        showButton(copyButtonElement, lastMousePosition.x, lastMousePosition.y, currentTarget instanceof HTMLElement ? currentTarget : null);
      } else {
        // Target is not viable. If a button is shown for this (now non-viable) target, or any previous target, hide it.
        if (copyButtonElement && (currentTarget === target || currentTarget !== null)) {
            // @ts-ignore: hideButton is available from inlined ui-injector.ts
            hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
        }
        if (currentTarget === target) { // Only nullify if the non-viable target was the current one
            currentTarget = null;
        }
      }
    } catch (error) {
      console.error('Error in viability check or button display:', error);
      if (copyButtonElement) {
        // @ts-ignore: hideButton is available from inlined ui-injector.ts
        hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
      }
      currentTarget = null;
    }
  });
}

// Handles keydown for parent element selection.
function handleKeyDown(event: KeyboardEvent): void {
  // const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0; // No longer needed for Alt/Option
  // const isModifierPressed = (isMac && event.metaKey && !event.ctrlKey) || (!isMac && event.ctrlKey && !event.metaKey);

  // Use event.altKey for Option (OSX) / Alt (Windows)
  if (event.altKey && currentTarget && copyButtonElement) {
    event.preventDefault(); // Prevent browser default actions
    const parent = currentTarget.parentElement;

    // @ts-ignore: EXCLUDED_TAGS is available from inlined block-identifier.ts
    if (parent && parent !== document.body && parent !== document.documentElement && !EXCLUDED_TAGS.includes(parent.tagName.toLowerCase())) {
      if (currentTarget instanceof HTMLElement) { // Clear border from the old currentTarget
        currentTarget.style.border = currentTarget.dataset.originalBorder || 'none';
        delete currentTarget.dataset.originalBorder;
      }
      currentTarget = parent; // Update currentTarget to the parent
      // @ts-ignore: updateButtonState is available from inlined ui-injector.ts
      updateButtonState(copyButtonElement, 'copy'); // Reset button state
      // @ts-ignore: showButton is available from inlined ui-injector.ts
      showButton(copyButtonElement, lastMousePosition.x, lastMousePosition.y, currentTarget instanceof HTMLElement ? currentTarget : null);
    }
  }
}

// Sets up the click handler for the copy button.
function setupButtonClickHandler(): void {
  if (!copyButtonElement) return;
  
  copyButtonElement.addEventListener('click', async (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!currentTarget || !userSettings) return;
    
    try {
      // @ts-ignore: processContent is available from inlined content-processor.ts
      const content = processContent(currentTarget, userSettings);
      if (!content.trim()) return;
      
      await navigator.clipboard.writeText(content);
      // @ts-ignore: updateButtonState is available from inlined ui-injector.ts
      updateButtonState(copyButtonElement!, 'copied');
      
      setTimeout(() => {
        if (copyButtonElement) {
          // @ts-ignore: updateButtonState is available from inlined ui-injector.ts
          updateButtonState(copyButtonElement, 'copy');
        }
      }, 1500);
    } catch (error) {
      console.error('Error copying content:', error);
      // Fallback copy mechanism
      try {
        const textarea = document.createElement('textarea');
        // @ts-ignore: processContent is available from inlined content-processor.ts
        textarea.value = processContent(currentTarget, userSettings!);
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        // @ts-ignore: updateButtonState is available from inlined ui-injector.ts
        updateButtonState(copyButtonElement!, 'copied');
        setTimeout(() => {
          if (copyButtonElement) {
            // @ts-ignore: updateButtonState is available from inlined ui-injector.ts
            updateButtonState(copyButtonElement, 'copy');
          }
        }, 1500);
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError);
      }
    }
  });
}

// Handles mouse leaving the document viewport.
function handleMouseLeaveDocument(): void {
  if (copyButtonElement && currentTarget) {
    // @ts-ignore: hideButton is available from inlined ui-injector.ts
    hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
    currentTarget = null;
  }
}

// Loads settings and stores them in userSettings.
async function loadSettingsAndApply(): Promise<void> {
  try {
    // @ts-ignore: getSettings, DEFAULT_SETTINGS, getSystemLanguage are from inlined settings-manager.ts
    userSettings = await getSettings();
  } catch (error) {
    console.error('Error loading settings, using defaults:', error);
    // @ts-ignore
    userSettings = { ...DEFAULT_SETTINGS, language: getSystemLanguage() };
  }
}

// Initializes the content script.
async function initializeContentScript(): Promise<void> {
  if (isInitialized) return;
  
  try {
    console.debug('AI Copilot: Initializing content script...');
    await loadSettingsAndApply();
    // @ts-ignore: injectStyles is available from inlined ui-injector.ts
    injectStyles();
    
    const debouncedPointerMove = debounce(handlePointerMove, HOVER_DEBOUNCE_DELAY);
    document.addEventListener('pointermove', debouncedPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeaveDocument, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: false }); // passive: false to allow preventDefault
    
    // Listen for settings changes from the popup/options page.
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        // @ts-ignore: SETTINGS_KEY, getSystemLanguage are from inlined settings-manager.ts
        if (areaName === 'local' && changes[SETTINGS_KEY]) {
          const newSettings = changes[SETTINGS_KEY].newValue as Settings;
          if (newSettings.language === 'system') {
            // @ts-ignore
            newSettings.language = getSystemLanguage();
          }
          userSettings = newSettings;
          console.debug('AI Copilot: Settings updated through storage listener.', userSettings);
        }
      });
    }
    
    // @ts-ignore: cleanup is available from inlined ui-injector.ts
    window.addEventListener('beforeunload', cleanup);
    isInitialized = true;
    console.debug('AI Copilot: Content script initialized successfully.');
  } catch (error) {
    console.error('AI Copilot: Error initializing content script:', error);
  }
}

// Determines if the content script should run on the current page.
function shouldInitialize(): boolean {
  // Avoid running on chrome://, chrome-extension://, moz-extension:// pages
  const restrictedProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:'];
  if (restrictedProtocols.includes(window.location.protocol)) {
    return false;
  }
  // Add any other specific conditions if needed, e.g., avoiding specific hostnames
  // if (window.frameElement && window.frameElement.tagName === "IFRAME") {
  //   console.debug("AI Copilot: Content script not initializing in an iframe.");
  //   return false; // Example: disable in iframes, though current code allows it.
  // }
  return true;
}

// Entry point for the content script.
if (shouldInitialize()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
  } else {
    initializeContentScript();
  }
}
