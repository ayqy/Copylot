import type { Settings } from './content-processor';

// Storage key for extension settings
const SETTINGS_KEY = 'copilot_settings';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  outputFormat: 'markdown',
  attachTitle: false,
  attachURL: false,
  language: 'system'
};

/**
 * Detect system language and return appropriate default
 */
function getSystemLanguage(): 'system' | 'en' | 'zh' {
  try {
    const uiLanguage = chrome.i18n.getUILanguage();
    
    // Check if language starts with 'zh' (Chinese variants)
    if (uiLanguage.startsWith('zh')) {
      return 'zh';
    }
    
    // Default to English for other languages
    return 'en';
  } catch (error) {
    console.error('Error detecting system language:', error);
    return 'en';
  }
}

/**
 * Get current settings from Chrome storage
 * 
 * @returns Promise that resolves to current settings
 */
export async function getSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const storedSettings = result[SETTINGS_KEY];
    
    if (!storedSettings) {
      // No settings found, return defaults with system language detection
      const defaultWithLanguage = {
        ...DEFAULT_SETTINGS,
        language: getSystemLanguage()
      };
      
      // Save the detected defaults
      await saveSettings(defaultWithLanguage);
      return defaultWithLanguage;
    }
    
    // Merge stored settings with defaults to handle new settings added in updates
    const mergedSettings: Settings = {
      ...DEFAULT_SETTINGS,
      ...storedSettings
    };
    
    // Handle language setting migration
    if (mergedSettings.language === 'system') {
      mergedSettings.language = getSystemLanguage();
    }
    
    return mergedSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      ...DEFAULT_SETTINGS,
      language: getSystemLanguage()
    };
  }
}

/**
 * Save settings to Chrome storage
 * 
 * @param newSettings - Settings object or partial settings to save
 * @returns Promise that resolves when settings are saved
 */
export async function saveSettings(newSettings: Partial<Settings>): Promise<void> {
  try {
    // Get current settings first
    const currentSettings = await getSettings();
    
    // Merge with new settings
    const updatedSettings: Settings = {
      ...currentSettings,
      ...newSettings
    };
    
    // Validate settings
    if (!['markdown', 'plaintext'].includes(updatedSettings.outputFormat)) {
      updatedSettings.outputFormat = 'markdown';
    }
    
    if (!['system', 'en', 'zh'].includes(updatedSettings.language)) {
      updatedSettings.language = 'system';
    }
    
    // Save to storage
    await chrome.storage.local.set({
      [SETTINGS_KEY]: updatedSettings
    });
    
    console.debug('Settings saved:', updatedSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 * 
 * @returns Promise that resolves when settings are reset
 */
export async function resetSettings(): Promise<Settings> {
  try {
    const defaultWithLanguage = {
      ...DEFAULT_SETTINGS,
      language: getSystemLanguage()
    };
    
    await chrome.storage.local.set({
      [SETTINGS_KEY]: defaultWithLanguage
    });
    
    console.debug('Settings reset to defaults');
    return defaultWithLanguage;
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

/**
 * Listen for settings changes
 * 
 * @param callback - Function to call when settings change
 * @returns Function to remove the listener
 */
export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[SETTINGS_KEY]) {
      const newSettings = changes[SETTINGS_KEY].newValue as Settings;
      if (newSettings) {
        callback(newSettings);
      }
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  
  // Return cleanup function
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Get default settings (for reference)
 */
export function getDefaultSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    language: getSystemLanguage()
  };
} 