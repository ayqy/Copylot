// Settings manager functionality
export interface Settings {
  isMagicCopyEnabled: boolean; // Added this line
  outputFormat: 'markdown' | 'plaintext';
  attachTitle: boolean;
  attachURL: boolean;
  language: 'system' | 'en' | 'zh';
}

export const SETTINGS_KEY = 'copilot_settings';

export const DEFAULT_SETTINGS: Settings = {
  isMagicCopyEnabled: true, // Added this line
  outputFormat: 'markdown',
  attachTitle: false,
  attachURL: false,
  language: 'system'
};

export function getSystemLanguage(): 'system' | 'en' | 'zh' {
  try {
    // Ensure chrome and chrome.i18n are available
    if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage) {
      const uiLanguage = chrome.i18n.getUILanguage();
      if (uiLanguage.startsWith('zh')) {
        return 'zh';
      }
      return 'en';
    }
    // Fallback if chrome.i18n is not available (e.g., in a non-extension context or during tests)
    console.warn('chrome.i18n.getUILanguage is not available, defaulting to English.');
    return 'en';
  } catch (error) {
    console.error('Error detecting system language:', error);
    return 'en'; // Default to English on error
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    // Ensure chrome and chrome.storage are available
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      const storedSettings = result[SETTINGS_KEY];

      let currentLanguage = getSystemLanguage(); // Get resolved system language

      if (!storedSettings) {
        // If no settings are stored, initialize with defaults including detected system language
        const defaultWithLanguage: Settings = {
          ...DEFAULT_SETTINGS,
          language: currentLanguage // Initialize with resolved system language
        };
        await chrome.storage.local.set({ [SETTINGS_KEY]: defaultWithLanguage });
        return defaultWithLanguage;
      }

      // Merge stored settings with defaults to ensure all keys are present
      const mergedSettings: Settings = {
        ...DEFAULT_SETTINGS,
        ...storedSettings
      };
      
      // If language is 'system' or was not resolved properly before, resolve it now
      if (mergedSettings.language === 'system') {
        mergedSettings.language = currentLanguage;
      }

      return mergedSettings;
    }
    // Fallback if chrome.storage is not available
    console.warn('chrome.storage.local is not available, returning default settings.');
    return {
      ...DEFAULT_SETTINGS,
      language: getSystemLanguage() // Use resolved system language
    };

  } catch (error) {
    console.error('Error getting settings:', error);
    // Fallback to default settings with system language on error
    return {
      ...DEFAULT_SETTINGS,
      language: getSystemLanguage() // Use resolved system language
    };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      // Before saving, if the language is resolved (e.g., 'en' or 'zh'),
      // and the intention is to store 'system' preference,
      // we might want to convert it back to 'system' if it matches the current system language.
      // However, typically, the popup would send the exact value to save ('system', 'en', or 'zh').
      // For now, we'll save the settings object as is.
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
      console.debug('Settings saved:', settings);
    } else {
      console.warn('chrome.storage.local is not available, settings not saved.');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    // Optionally re-throw or handle
  }
}
