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

let currentTarget: Element | null = null;
let copyButtonElement: HTMLElement | null = null; // Holds the button instance from ui-injector
let isInitialized = false;
let userSettings: Settings | null = null; // Will be populated by getSettings()
let lastClickPosition: { x: number; y: number } | null = null;

// Handles document click to identify potential target elements and show/hide the button.
function handleDocumentClick(event: MouseEvent): void {
  let potentialTargetNode = event.target as Node;

  // If the click is on the copy button itself, do nothing.
  if (copyButtonElement && copyButtonElement.contains(potentialTargetNode)) {
    return;
  }

  // If clicking over a text node, use its parent element.
  if (potentialTargetNode.nodeType === Node.TEXT_NODE) {
    potentialTargetNode = potentialTargetNode.parentElement || potentialTargetNode;
  }

  if (!(potentialTargetNode instanceof Element)) {
    // Clicked on something that isn't an element (e.g., document background)
    // If a button is shown, hide it.
    if (copyButtonElement && currentTarget) {
      // @ts-ignore: hideButton is available from inlined ui-injector.ts
      hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
      currentTarget = null;
    }
    return;
  }

  const clickedElement = potentialTargetNode;

  // @ts-ignore: isViableBlock is available from inlined block-identifier.ts
  if (isViableBlock(clickedElement)) {
    // If there was a previous target and it's different from the new one, hide the button from it.
    if (currentTarget && currentTarget !== clickedElement && copyButtonElement) {
      // @ts-ignore: hideButton is available from inlined ui-injector.ts
      hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
    }

    currentTarget = clickedElement;

    if (!copyButtonElement) {
      // @ts-ignore: createButton is available from inlined ui-injector.ts
      copyButtonElement = createButton();
      setupButtonClickHandler(); // Set up once
    }
    // @ts-ignore: showButton is available from inlined ui-injector.ts
    showButton(copyButtonElement, event.clientX, event.clientY, currentTarget instanceof HTMLElement ? currentTarget : null);
    lastClickPosition = { x: event.clientX, y: event.clientY };
  } else {
    // Clicked element is not viable. If a button is currently shown, hide it.
    if (copyButtonElement && currentTarget) {
      // @ts-ignore: hideButton is available from inlined ui-injector.ts
      hideButton(copyButtonElement, currentTarget instanceof HTMLElement ? currentTarget : null);
      currentTarget = null;
    }
  }
}

// Handles keydown for parent element selection.
function handleKeyDown(event: KeyboardEvent): void {
  const isOnlyAltPressed = event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey;

  if (isOnlyAltPressed && currentTarget && copyButtonElement && lastClickPosition) { // Ensure lastClickPosition is available
    const oldTarget = currentTarget;
    const parent = currentTarget.parentElement;

    // @ts-ignore: EXCLUDED_TAGS is available from inlined block-identifier.ts
    if (parent && parent !== document.body && parent !== document.documentElement && !EXCLUDED_TAGS.includes(parent.tagName.toLowerCase())) {
      // 1. Clear border from the old currentTarget (child)
      if (oldTarget instanceof HTMLElement && oldTarget.dataset.originalBorder !== undefined) {
        oldTarget.style.border = oldTarget.dataset.originalBorder || 'none';
        delete oldTarget.dataset.originalBorder;
      }

      // 2. Update currentTarget to the new parent
      currentTarget = parent;

      // 3. Apply border to the new currentTarget (parent)
      if (currentTarget instanceof HTMLElement) {
        currentTarget.dataset.originalBorder = currentTarget.style.border;
        currentTarget.style.border = '1px solid #4F46E5'; // Using the same border style as in ui-injector
      }

      // 4. Reset button state (e.g., from "Copied!" back to copy icon)
      // @ts-ignore: updateButtonState is available from inlined ui-injector.ts
      updateButtonState(copyButtonElement, 'copy');

      // 5. Crucially, DO NOT reposition the button. It stays at lastClickPosition.
      // The button should already be visible. If we need to ensure it (e.g. if some other flow could hide it),
      // we might call `copyButtonElement.style.display = 'flex'`, but typically it would remain visible.
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
    
    document.addEventListener('click', handleDocumentClick, { passive: true });
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
