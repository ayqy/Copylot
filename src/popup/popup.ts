// @ts-ignore: CSS import for build process
import './popup.css';
import {
  getSettings,
  saveSettings,
  type Settings,
  type Prompt,
  FORCE_UI_LANGUAGE
} from '../shared/settings-manager';
// Simple UUID generator for Chrome extension
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// DOM Elements
interface PopupElements {
  versionDisplay: HTMLElement;
  enableMagicCopySwitch: HTMLInputElement;
  enableHoverMagicCopySwitch: HTMLInputElement;
  enableClipboardAccumulatorSwitch: HTMLInputElement;
  interactionClick: HTMLInputElement;
  interactionDblClick: HTMLInputElement;
  formatMarkdown: HTMLInputElement;
  formatPlaintext: HTMLInputElement;
  tableFormatMarkdown: HTMLInputElement; // Added for table format
  tableFormatCsv: HTMLInputElement; // Added for table format
  attachTitle: HTMLInputElement;
  attachURL: HTMLInputElement;
  convertButton: HTMLButtonElement;
  addPromptButton: HTMLButtonElement;
  promptModal: HTMLElement;
  promptForm: HTMLFormElement;
  modalTitle: HTMLElement;
  promptId: HTMLInputElement;
  promptTitle: HTMLInputElement;
  promptTemplate: HTMLTextAreaElement;
  savePromptButton: HTMLButtonElement;
  cancelPromptButton: HTMLButtonElement;
  closeModalButton: HTMLElement;
  popupContent: HTMLElement;
}

let elements: PopupElements;
let currentSettings: Settings;

/**
 * Get all required DOM elements
 */
function getElements(): PopupElements {
  return {
    versionDisplay: document.getElementById('version-display') as HTMLElement,
    enableMagicCopySwitch: document.getElementById('enable-magic-copy-switch') as HTMLInputElement,
    enableHoverMagicCopySwitch: document.getElementById(
      'enable-hover-magic-copy-switch'
    ) as HTMLInputElement,
    enableClipboardAccumulatorSwitch: document.getElementById(
      'enable-clipboard-accumulator-switch'
    ) as HTMLInputElement,
    interactionClick: document.getElementById('interaction-click') as HTMLInputElement,
    interactionDblClick: document.getElementById('interaction-dblclick') as HTMLInputElement,
    formatMarkdown: document.getElementById('format-markdown') as HTMLInputElement,
    formatPlaintext: document.getElementById('format-plaintext') as HTMLInputElement,
    tableFormatMarkdown: document.getElementById('table-format-markdown') as HTMLInputElement, // Added
    tableFormatCsv: document.getElementById('table-format-csv') as HTMLInputElement, // Added
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement,
    convertButton: document.getElementById('convert-button') as HTMLButtonElement,
    addPromptButton: document.getElementById('add-prompt-button') as HTMLButtonElement,
    promptModal: document.getElementById('prompt-modal') as HTMLElement,
    promptForm: document.getElementById('prompt-form') as HTMLFormElement,
    modalTitle: document.getElementById('modal-title') as HTMLElement,
    promptId: document.getElementById('prompt-id') as HTMLInputElement,
    promptTitle: document.getElementById('prompt-title') as HTMLInputElement,
    promptTemplate: document.getElementById('prompt-template') as HTMLTextAreaElement,
    savePromptButton: document.getElementById('save-prompt-button') as HTMLButtonElement,
    cancelPromptButton: document.getElementById('cancel-prompt-button') as HTMLButtonElement,
    closeModalButton: document.querySelector('.close-button') as HTMLElement,
    popupContent: document.getElementById('popup-content') as HTMLElement
  };
}

/**
 * Localize the UI based on current locale
 */
function localizeUI() {
  if (FORCE_UI_LANGUAGE) {
    document.documentElement.lang = FORCE_UI_LANGUAGE;
  }

  // Find all elements with data-i18n attribute
  const i18nElements = document.querySelectorAll('[data-i18n]');

  i18nElements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        if (element.tagName === 'INPUT' && element.getAttribute('type') === 'button') {
          (element as HTMLInputElement).value = message;
        } else {
          element.textContent = message;
        }
      }
    }
  });

  // Set page title
  document.title = chrome.i18n.getMessage('appName') || 'AI Copilot Settings';
}

/**
 * Load current settings and update UI
 */
async function loadSettings() {
  try {
    currentSettings = await getSettings();
    updateUIFromSettings(currentSettings);
    console.debug('Settings loaded:', currentSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Update UI elements based on settings
 */
function updateUIFromSettings(settings: Settings) {
  // Enable/Disable Magic Copy
  elements.enableMagicCopySwitch.checked = settings.isMagicCopyEnabled;
  elements.enableHoverMagicCopySwitch.checked = settings.isHoverMagicCopyEnabled;
  elements.enableClipboardAccumulatorSwitch.checked = settings.isClipboardAccumulatorEnabled;

  // Interaction mode
  if (settings.interactionMode === 'click') {
    elements.interactionClick.checked = true;
  } else {
    elements.interactionDblClick.checked = true;
  }

  // Output format
  if (settings.outputFormat === 'markdown') {
    elements.formatMarkdown.checked = true;
  } else {
    elements.formatPlaintext.checked = true;
  }

  // Table output format
  if (settings.tableOutputFormat === 'markdown') {
    elements.tableFormatMarkdown.checked = true;
  } else {
    elements.tableFormatCsv.checked = true;
  }

  // Additional info
  elements.attachTitle.checked = settings.attachTitle;
  elements.attachURL.checked = settings.attachURL;

  // language field removed from UI; keep default stored value
}



/**
 * Get settings from UI
 */
function getSettingsFromUI(): Partial<Settings> {
  return {
    isMagicCopyEnabled: elements.enableMagicCopySwitch.checked,
    isHoverMagicCopyEnabled: elements.enableHoverMagicCopySwitch.checked,
    isClipboardAccumulatorEnabled: elements.enableClipboardAccumulatorSwitch.checked,
    interactionMode: elements.interactionClick.checked ? 'click' : 'dblclick',
    outputFormat: elements.formatMarkdown.checked ? 'markdown' : 'plaintext',
    tableOutputFormat: elements.tableFormatMarkdown.checked ? 'markdown' : 'csv', // Added
    attachTitle: elements.attachTitle.checked,
    attachURL: elements.attachURL.checked
    // language field removed from UI; keep default stored value
  };
}

/**
 * Save settings from UI
 */
async function saveCurrentSettings() {
  try {
    const newSettings = getSettingsFromUI();
    await saveSettings(newSettings);

    // Update current settings
    currentSettings = { ...currentSettings, ...newSettings };

    console.debug('Settings saved:', newSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Setup event listeners for form elements
 */
function setupEventListeners() {
  // Interaction mode radio buttons
  elements.interactionClick.addEventListener('change', saveCurrentSettings);
  elements.interactionDblClick.addEventListener('change', saveCurrentSettings);

  // Output format radio buttons
  elements.formatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.formatPlaintext.addEventListener('change', saveCurrentSettings);

  // Table output format radio buttons
  elements.tableFormatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.tableFormatCsv.addEventListener('change', saveCurrentSettings);

  // Additional info checkboxes
  elements.attachTitle.addEventListener('change', saveCurrentSettings);
  elements.attachURL.addEventListener('change', saveCurrentSettings);

  // Enable/Disable Magic Copy switch
  elements.enableMagicCopySwitch.addEventListener('change', saveCurrentSettings);
  elements.enableHoverMagicCopySwitch.addEventListener('change', saveCurrentSettings);
  elements.enableClipboardAccumulatorSwitch.addEventListener('change', saveCurrentSettings);

  // Conversion button
  elements.convertButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CONVERT_PAGE_WITH_SELECTION'  // 使用新的消息类型
        });
        window.close(); // Close popup after clicking
      }
    });
  });

  // Prompt manager event listeners - now opens options page
  elements.addPromptButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
  // Remove old modal handlers as we're redirecting to options page
  // elements.promptForm.addEventListener('submit', handleSavePrompt);
  // elements.cancelPromptButton.addEventListener('click', closeModal);
  // elements.closeModalButton.addEventListener('click', closeModal);
  // window.addEventListener('click', (event) => {
  //   if (event.target == elements.promptModal) {
  //     closeModal();
  //   }
  // });
}

/**
 * Handle form submission (prevent default)
 */
function setupFormHandler() {
  const form = document.getElementById('settings-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation() {
  // Allow Enter/Space to toggle radio and checkbox options
  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;

    if (
      ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('radio-option')) ||
      target.classList.contains('checkbox-option')
    ) {
      const input = target.querySelector('input') as HTMLInputElement;
      if (input) {
        input.click();
        event.preventDefault();
      }
    }
  });
}

/**
 * Add accessibility attributes
 */
function setupAccessibility() {
  // Add ARIA labels and roles where needed
  const radioOptions = document.querySelectorAll('.radio-option');
  radioOptions.forEach((option, index) => {
    option.setAttribute('role', 'radio');
    option.setAttribute('tabindex', index === 0 ? '0' : '-1');
  });

  const checkboxOptions = document.querySelectorAll('.checkbox-option');
  checkboxOptions.forEach((option) => {
    option.setAttribute('role', 'checkbox');
    option.setAttribute('tabindex', '0');
  });
}



async function handleSavePrompt(event: Event) {
  event.preventDefault();
  const id = elements.promptId.value;
  const title = elements.promptTitle.value;
  const template = elements.promptTemplate.value;

  if (id) {
    // Editing existing prompt
    const prompt = currentSettings.userPrompts.find((p) => p.id === id);
    if (prompt) {
      prompt.title = title;
      prompt.template = template;
    }
  } else {
    // Adding new prompt
    currentSettings.userPrompts.push({ id: generateUUID(), title, template });
  }

  await saveSettings({ userPrompts: currentSettings.userPrompts });
  notifyBackgroundScript();
  closeModal();
}

function openModal(prompt: Prompt | null = null) {
  elements.popupContent.style.filter = 'blur(5px)';
  if (prompt) {
    elements.modalTitle.textContent = 'Edit Prompt';
    elements.promptId.value = prompt.id;
    elements.promptTitle.value = prompt.title;
    elements.promptTemplate.value = prompt.template;
  } else {
    elements.modalTitle.textContent = 'Add New Prompt';
    elements.promptForm.reset();
    elements.promptId.value = '';
  }
  elements.promptModal.style.display = 'block';
}

function closeModal() {
  elements.promptModal.style.display = 'none';
  elements.popupContent.style.filter = 'none';
}

function notifyBackgroundScript() {
  chrome.runtime.sendMessage({ type: 'update-context-menu' });
}

/**
 * Initialize the popup
 */
async function initialize() {
  try {
    console.debug('Initializing popup...');

    // Get DOM elements
    elements = getElements();

    // Set version number
    const manifest = chrome.runtime.getManifest();
    if (manifest.version) {
      elements.versionDisplay.textContent = `V${manifest.version}`;
    }

    // Localize UI
    localizeUI();

    // Load and display current settings
    await loadSettings();

    // Setup event handlers
    setupEventListeners();
    setupFormHandler();
    setupKeyboardNavigation();
    setupAccessibility();

    console.debug('Popup initialized successfully');
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
