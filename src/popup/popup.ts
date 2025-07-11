import './popup.css';
import { getSettings, saveSettings } from '../shared/settings-manager';
import type { Settings } from '../shared/content-processor';

// DOM Elements
interface PopupElements {
  enableMagicCopySwitch: HTMLInputElement; // Added this line
  formatMarkdown: HTMLInputElement;
  formatPlaintext: HTMLInputElement;
  attachTitle: HTMLInputElement;
  attachURL: HTMLInputElement;
}

let elements: PopupElements;
let currentSettings: Settings;

/**
 * Get all required DOM elements
 */
function getElements(): PopupElements {
  return {
    enableMagicCopySwitch: document.getElementById('enable-magic-copy-switch') as HTMLInputElement, // Added this line
    formatMarkdown: document.getElementById('format-markdown') as HTMLInputElement,
    formatPlaintext: document.getElementById('format-plaintext') as HTMLInputElement,
    attachTitle: document.getElementById('attach-title') as HTMLInputElement,
    attachURL: document.getElementById('attach-url') as HTMLInputElement
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
  // Enable/Disable Magic Copy
  elements.enableMagicCopySwitch.checked = settings.isMagicCopyEnabled; // Added this line

  // Output format
  if (settings.outputFormat === 'markdown') {
    elements.formatMarkdown.checked = true;
  } else {
    elements.formatPlaintext.checked = true;
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
    isMagicCopyEnabled: elements.enableMagicCopySwitch.checked, // Added this line
    outputFormat: elements.formatMarkdown.checked ? 'markdown' : 'plaintext',
    attachTitle: elements.attachTitle.checked,
    attachURL: elements.attachURL.checked,
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
  // Output format radio buttons
  elements.formatMarkdown.addEventListener('change', saveCurrentSettings);
  elements.formatPlaintext.addEventListener('change', saveCurrentSettings);
  
  // Additional info checkboxes
  elements.attachTitle.addEventListener('change', saveCurrentSettings);
  elements.attachURL.addEventListener('change', saveCurrentSettings);

  // Enable/Disable Magic Copy switch
  elements.enableMagicCopySwitch.addEventListener('change', saveCurrentSettings); // Added this line
  
  // Language select removed
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