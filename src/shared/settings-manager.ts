// For debugging: force a specific UI language, e.g., 'en', 'zh'
// Leave empty to use the browser's default language
export const FORCE_UI_LANGUAGE = '';

// Import getMessage function for i18n support
import { getMessage } from './ui-injector';

// Settings manager functionality
export interface ChatService {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  builtIn: boolean;
  description?: string;
}

export interface Prompt {
  id: string;
  title: string;
  template: string;
  category?: string;
  usageCount?: number;
  createdAt?: number;
  lastUsedAt?: number;
  targetChatId?: string;
  autoOpenChat?: boolean;
  builtIn?: boolean;
  deleted?: boolean;
  templateVersion?: number;
}

export interface Settings {
  isMagicCopyEnabled: boolean;
  isHoverMagicCopyEnabled: boolean;
  outputFormat: 'markdown' | 'plaintext';
  tableOutputFormat: 'markdown' | 'csv'; // Added for table format
  attachTitle: boolean;
  attachURL: boolean;
  language: 'system' | 'en' | 'zh';
  interactionMode: 'click' | 'dblclick';
  userPrompts: Prompt[];
  isClipboardAccumulatorEnabled: boolean;
  chatServices: ChatService[];
  defaultChatServiceId?: string;
  defaultAutoOpenChat: boolean;
  editorExclusionClassNames: string[];
  editorExclusionAttributeSelectors: string[];
}

export const SETTINGS_KEY = 'copilot_settings';

export const DEFAULT_EDITOR_EXCLUSION_CLASSES: string[] = [
  'CodeMirror',
  'cm-editor',
  'cm-content',
  'monaco-editor',
  'ace_editor',
  'ql-editor',
  'tox-edit-area',
  'ProseMirror',
  'notion-page-content'
];

export const DEFAULT_EDITOR_EXCLUSION_ATTRIBUTE_SELECTORS: string[] = [
  '[data-cangjie-content]',
  '[data-cangjie-editable]'
];

// 默认内置Prompt配置
export const DEFAULT_BUILT_IN_PROMPTS: Prompt[] = [
  {
    id: 'builtin-summary-article',
    title: getMessage('builtInSummaryTitle') || '总结文章',
    template: getMessage('builtInSummaryTemplate'),
    category: 'summary',
    usageCount: 0,
    createdAt: Date.now(),
    builtIn: true,
    deleted: false,
    templateVersion: 2
  }
];

// 默认Chat服务配置
export const DEFAULT_CHAT_SERVICES: ChatService[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    enabled: true,
    builtIn: true
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new',
    enabled: true,
    builtIn: true
  },
  {
    id: 'gemini',
    name: getMessage('serviceGeminiAIStudio'),
    url: 'https://aistudio.google.com/',
    enabled: true,
    builtIn: true,
    description: getMessage('statusCompleteFree')
  },
  {
    id: 'yiyan',
    name: getMessage('serviceYiyan'),
    url: 'https://yiyan.baidu.com',
    enabled: true,
    builtIn: true
  },
  {
    id: 'tongyi',
    name: getMessage('serviceTongyi'),
    url: 'https://chat.qwen.ai/',
    enabled: true,
    builtIn: true
  },
  {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    enabled: true,
    builtIn: true
  },
  {
    id: 'doubao',
    name: '豆包',
    url: 'https://doubao.com',
    enabled: true,
    builtIn: true
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    enabled: true,
    builtIn: true,
    description: getMessage('statusFreeAfterLogin')
  },
  {
    id: 'poe',
    name: 'Poe',
    url: 'https://poe.com/',
    enabled: true,
    builtIn: true,
    description: getMessage('statusDailyQuota')
  },
  {
    id: 'glm',
    name: 'GLM',
    url: 'https://chat.z.ai/',
    enabled: true,
    builtIn: true,
    description: getMessage('statusFreeNoLogin')
  },
  {
    id: 'openai-playground',
    name: getMessage('serviceOpenAIPlayground'),
    url: 'https://platform.openai.com/playground/prompts?models=o3',
    enabled: true,
    builtIn: true,
    description: getMessage('statusDailyQuota')
  },
  {
    id: 'perplexity',
    name: getMessage('servicePerplexityAI'),
    url: 'https://www.perplexity.ai/',
    enabled: true,
    builtIn: true
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    enabled: true,
    builtIn: true
  },
  {
    id: 'lmarena',
    name: 'LMArena',
    url: 'https://lmarena.ai/?mode=direct',
    enabled: true,
    builtIn: true,
    description: getMessage('statusCompleteFree')
  }
];

export const DEFAULT_SETTINGS: Settings = {
  isMagicCopyEnabled: true, // Added this line
  // Default hover disabled for first-time initialization per requirement
  isHoverMagicCopyEnabled: false,
  outputFormat: 'markdown',
  tableOutputFormat: 'markdown', // Default table format
  attachTitle: false,
  attachURL: false,
  language: 'system',
  interactionMode: 'click',
  userPrompts: [...DEFAULT_BUILT_IN_PROMPTS],
  isClipboardAccumulatorEnabled: false,
  chatServices: DEFAULT_CHAT_SERVICES,
  defaultChatServiceId: undefined,
  defaultAutoOpenChat: false,
  editorExclusionClassNames: [...DEFAULT_EDITOR_EXCLUSION_CLASSES],
  editorExclusionAttributeSelectors: [...DEFAULT_EDITOR_EXCLUSION_ATTRIBUTE_SELECTORS]
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

      // 清理历史遗留的 icon 字段以减少存储占用
      mergedSettings.chatServices = mergedSettings.chatServices.map((service) => {
        const normalized = { ...service } as Record<string, unknown>;
        if ('icon' in normalized) {
          delete normalized.icon;
        }
        return normalized as ChatService;
      });

      if (!mergedSettings.editorExclusionClassNames || !Array.isArray(mergedSettings.editorExclusionClassNames)) {
        mergedSettings.editorExclusionClassNames = [...DEFAULT_EDITOR_EXCLUSION_CLASSES];
      }

      if (
        !mergedSettings.editorExclusionAttributeSelectors ||
        !Array.isArray(mergedSettings.editorExclusionAttributeSelectors)
      ) {
        mergedSettings.editorExclusionAttributeSelectors = [...DEFAULT_EDITOR_EXCLUSION_ATTRIBUTE_SELECTORS];
      }

      // If language is 'system' or was not resolved properly before, resolve it now
      if (mergedSettings.language === 'system') {
        mergedSettings.language = currentLanguage;
      }

      // 迁移逻辑：为现有用户添加内置prompt（如果不存在的话）
      const existingPromptIds = new Set(mergedSettings.userPrompts.map(p => p.id));
      
      // 添加缺失的内置prompt
      DEFAULT_BUILT_IN_PROMPTS.forEach(builtInPrompt => {
        if (!existingPromptIds.has(builtInPrompt.id)) {
          mergedSettings.userPrompts.push({ ...builtInPrompt });
        }
      });

      // 更新现有内置prompt到最新版本
      DEFAULT_BUILT_IN_PROMPTS.forEach(defaultPrompt => {
        const existingPrompt = mergedSettings.userPrompts.find(p => p.id === defaultPrompt.id);
        if (existingPrompt && existingPrompt.builtIn) {
          const existingVersion = existingPrompt.templateVersion || 1; // 默认为版本1
          const defaultVersion = defaultPrompt.templateVersion || 1;
          
          // 如果默认版本更高，则更新模版但保留用户的使用统计
          if (defaultVersion > existingVersion) {
            existingPrompt.template = defaultPrompt.template;
            existingPrompt.title = defaultPrompt.title;
            existingPrompt.templateVersion = defaultPrompt.templateVersion;
            // 保留：usageCount, lastUsedAt, targetChatId, autoOpenChat 等用户相关设置
          }
        }
      });

      // 过滤掉已删除的内置prompt
      mergedSettings.userPrompts = mergedSettings.userPrompts.filter(prompt => {
        if (prompt.builtIn && prompt.deleted) {
          return false;
        }
        return true;
      });

      // 迁移逻辑：为现有用户添加新的内置聊天服务和更新现有服务
      const existingChatServiceIds = new Set(mergedSettings.chatServices.map(s => s.id));
      
      // 添加缺失的内置聊天服务
      DEFAULT_CHAT_SERVICES.forEach(defaultService => {
        if (!existingChatServiceIds.has(defaultService.id)) {
          mergedSettings.chatServices.push({ ...defaultService });
        } else {
          // 更新现有服务的URL和其他属性（如description）
          const existingService = mergedSettings.chatServices.find(s => s.id === defaultService.id);
          if (existingService && existingService.builtIn) {
            // 保留用户的enabled状态，但更新其他内置服务属性
            const userEnabled = existingService.enabled;
            Object.assign(existingService, { ...defaultService, enabled: userEnabled });
          }
        }
      });

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

      // 再次清除潜在的 icon 字段，避免写回占用空间
      mergedSettings.chatServices = mergedSettings.chatServices.map((service) => {
        const normalized = { ...service } as Record<string, unknown>;
        if ('icon' in normalized) {
          delete normalized.icon;
        }
        return normalized as ChatService;
      });

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
  const optimized = { ...settings };
  
  // Truncate very long prompt templates
  if (optimized.userPrompts) {
    optimized.userPrompts = optimized.userPrompts.map(prompt => ({
      ...prompt,
      template: prompt.template.length > 1000 ? 
        prompt.template.substring(0, 1000) + '...[truncated]' : 
        prompt.template
    }));
  }
  
  return optimized;
}

// Helper function to combine prompt template with content
export function combinePromptWithContent(promptTemplate: string, content: string): string {
  // Check if template contains {content} placeholder
  if (promptTemplate.includes('{content}')) {
    return promptTemplate.replace(/{content}/g, content);
  } else {
    // If no placeholder, wrap content in <content> tags and append
    return `${promptTemplate}\n\n<content>\n${content}\n</content>`;
  }
}
