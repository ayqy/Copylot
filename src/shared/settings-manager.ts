// For debugging: force a specific UI language, e.g., 'en', 'zh'
// Leave empty to use the browser's default language
export const FORCE_UI_LANGUAGE = '';

// Settings manager functionality
// Note: Removed unused ChatService and Prompt interfaces

export interface Settings {
  autoPublish: boolean;
  autoCloseOriginal: boolean;
  language: 'system' | 'en' | 'zh';
}

export const SETTINGS_KEY = 'copilot_settings';

// No longer need built-in configurations

export const DEFAULT_SETTINGS: Settings = {
  autoPublish: false,
  autoCloseOriginal: false,
  language: 'system',
};

export function getSystemLanguage(): 'system' | 'en' | 'zh' {
  try {
    // Ensure chrome and chrome.i18n are available
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
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

// Chrome sync storage limits
const SYNC_QUOTA_BYTES_PER_ITEM = 8192; // 8KB per item

export async function getSettings(): Promise<Settings> {
  try {
    // Ensure chrome and chrome.storage are available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const result = await chrome.storage.sync.get(SETTINGS_KEY);
      const storedSettings = result[SETTINGS_KEY];

      const currentLanguage = getSystemLanguage(); // Get resolved system language

      if (!storedSettings) {
        // If no settings are stored, initialize with defaults including detected system language
        const defaultWithLanguage: Settings = {
          ...DEFAULT_SETTINGS,
          language: currentLanguage // Initialize with resolved system language
        };
        await saveSettings(defaultWithLanguage);
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
    console.warn('chrome.storage.sync is not available, returning default settings.');
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

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      // Get current settings first (but avoid infinite recursion)
      let currentSettings: Settings;
      try {
        const result = await chrome.storage.sync.get(SETTINGS_KEY);
        currentSettings = result[SETTINGS_KEY] || DEFAULT_SETTINGS;
      } catch {
        currentSettings = DEFAULT_SETTINGS;
      }
      
      // Merge with new settings
      const mergedSettings = { ...currentSettings, ...settings };

      // Check storage size limits
      const dataString = JSON.stringify({ [SETTINGS_KEY]: mergedSettings });
      const dataSize = new Blob([dataString]).size;
      
      if (dataSize > SYNC_QUOTA_BYTES_PER_ITEM) {
        console.warn('Settings data too large for chrome.storage.sync, attempting to optimize...');
        // Try to optimize by removing non-essential data or compressing
        const optimizedSettings = await optimizeSettingsForSync(mergedSettings);
        await chrome.storage.sync.set({ [SETTINGS_KEY]: optimizedSettings });
        console.debug('Optimized settings saved:', optimizedSettings);
      } else {
        await chrome.storage.sync.set({ [SETTINGS_KEY]: mergedSettings });
        console.debug('Settings saved:', mergedSettings);
      }
    } else {
      console.warn('chrome.storage.sync is not available, settings not saved.');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    if (error instanceof Error && error.message?.includes('QUOTA_BYTES')) {
      console.error('Storage quota exceeded. Consider reducing the number of prompts or their size.');
      throw new Error('Storage quota exceeded. Please reduce the number or size of your prompts.');
    }
    throw error;
  }
}

// Helper function to optimize settings for sync storage
async function optimizeSettingsForSync(settings: Settings): Promise<Settings> {
  // For our simplified settings, no optimization needed
  return { ...settings };
}

// No longer need prompt combination functionality
