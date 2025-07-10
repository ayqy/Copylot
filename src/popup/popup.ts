import { getSettings, saveSettings } from '../shared/settings-manager';
import type { Settings } from '../shared/content-processor';

// DOM Elements
interface PopupElements {
  formatMarkdown: HTMLInputElement;
  formatPlaintext: HTMLInputElement;
  attachTitle: HTMLInputElement;
  attachURL: HTMLInputElement;
  languageSelect: HTMLSelectElement;
}

let elements: PopupElements;
let currentSettings: Settings;

/**
 * Get all required DOM elements
 */
function getElements(): PopupElements {
  return {
    formatMarkdown: document.getElementById('format-markdown') as HTMLInputElement,
    formatPlaintext: document.getElementById('format-plaintext') as HTMLInputElement,
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement,
    languageSelect: document.getElementById('language-select') as HTMLSelectElement
  };
}

/**
 * Localize the UI based on current locale
 */
function localizeUI() {
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
  // Output format
  if (settings.outputFormat === 'markdown') {
    elements.formatMarkdown.checked = true;
  } else {
    elements.formatPlaintext.checked = true;
  }
  
  // Additional info
  elements.attachTitle.checked = settings.attachTitle;
  elements.attachURL.checked = settings.attachURL;
  
  // Language
  elements.languageSelect.value = settings.language;
}

/**
 * Get settings from UI
 */
function getSettingsFromUI(): Partial<Settings> {
  return {
    outputFormat: elements.formatMarkdown.checked ? 'markdown' : 'plaintext',
    attachTitle: elements.attachTitle.checked,
    attachURL: elements.attachURL.checked,
    language: elements.languageSelect.value as 'system' | 'en' | 'zh'
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
  // Output format radio buttons
  elements.formatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.formatPlaintext.addEventListener('change', saveCurrentSettings);
  
  // Additional info checkboxes
  elements.attachTitle.addEventListener('change', saveCurrentSettings);
  elements.attachURL.addEventListener('change', saveCurrentSettings);
  
  // Language select
  elements.languageSelect.addEventListener('change', async () => {
    await saveCurrentSettings();
    
    // If language changed to system or a specific language, reload localization
    // Note: For full language switching, we'd need to reload the popup
    // For now, we just save the preference
    console.debug('Language preference updated');
  });
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
    
    if ((event.key === 'Enter' || event.key === ' ') && 
        target.classList.contains('radio-option') || target.classList.contains('checkbox-option')) {
      
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

/**
 * Initialize the popup
 */
async function initialize() {
  try {
    console.debug('Initializing popup...');
    
    // Get DOM elements
    elements = getElements();
    
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