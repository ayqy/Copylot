// For debugging: force a specific UI language, e.g., 'en', 'zh'
// Leave empty to use the browser's default language
export const FORCE_UI_LANGUAGE = '';

// Settings manager functionality
export interface ChatService {
  id: string;
  name: string;
  url: string;
  icon: string;
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
}

export const SETTINGS_KEY = 'copilot_settings';

// 默认内置Prompt配置
export const DEFAULT_BUILT_IN_PROMPTS: Prompt[] = [
  {
    id: 'builtin-summary-article',
    title: '总结文章',
    template: '请总结以下文章的主要内容：\n\n<article>\n{content}\n</article>',
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
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjI4MTkgOS44MjE3NEMhLjQ5MTcgNy4zMDgxNyAyMC42OTUgNS4xMDcwNyAxNy44NTkgNC4yNDA5QzE3LjUxNDEgMS4wNTU0NCAxNC43NzM0IDAuMTI1NDU1IDEyLjAwMTcgMS4xNjM2NUM5LjIyNzM1IDAuMTI1NDU1IDYuNDg2NDEgMS4wNTU0NCA2LjE0MTE3IDQuMjQwOUMzLjMwNTU4IDUuMTA3MDcgMS41MDgyOCA3LjMwODE3IDIuNzE4MyA5LjgyMTc0QzEuNDkxNyAxMi40NDU3IDIuNzE4MyAxNS4yNTc0IDUuMzY5MzkgMTYuODc3NkM1LjM5NjE1IDE5LjkxODcgNy43NzM4NyAyMi4zNjExIDEwLjg5NDEgMjMuMDAwOEMxMy45OTk1IDIzLjM2MTEgMTcuODY1IDIyLjE3NyAxOC42NzMyIDE3Ljg2M0MyMS45MjE3IDE3LjUwNDUgMjMuMzE4NSAxNS4wMTA3IDIzLjE4NTQgMTIuNDQ1N0MyMi40NDU3IDEwLjk0MzQgMjIuNDQ1NyA5LjgyMTc0IDIyLjI4MTkgOS44MjE3NFoiIGZpbGw9IiMzMzMzMzMiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNiIgZmlsbD0iI0Q5N0Y0MiIvPgo8cGF0aCBkPSJNOCA4SDE2VjE2SDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
    enabled: true,
    builtIn: true
  },
  {
    id: 'gemini',
    name: 'Gemini AI Studio',
    url: 'https://aistudio.google.com/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true,
    description: '完全免费使用'
  },
  {
    id: 'yiyan',
    name: '文心一言',
    url: 'https://yiyan.baidu.com',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyOTVGRkYiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'tongyi',
    name: '通义千问',
    url: 'https://chat.qwen.ai/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNGRjY0MDAiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM0RjQ2RTUiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'doubao',
    name: '豆包',
    url: 'https://doubao.com',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMwMEJCNzAiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true,
    description: '登录后免费使用'
  },
  {
    id: 'poe',
    name: 'Poe',
    url: 'https://poe.com/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNFRjQ0NDQiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true,
    description: '每天有免费额度'
  },
  {
    id: 'glm',
    name: 'GLM',
    url: 'https://chat.z.ai/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMEI5ODEiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true,
    description: '（免登录）免费使用'
  },
  {
    id: 'openai-playground',
    name: 'OpenAI Playground',
    url: 'https://platform.openai.com/playground/prompts?models=o3',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM4QjVDRjYiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true,
    description: '每天有免费额度'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMwNkI2RDQiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNFQzQ4OTkiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true
  },
  {
    id: 'lmarena',
    name: 'LMArena',
    url: 'https://lmarena.ai/?mode=direct',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM4NEEzMTYiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    enabled: true,
    builtIn: true,
    description: '完全免费使用'
  }
];

export const DEFAULT_SETTINGS: Settings = {
  isMagicCopyEnabled: true, // Added this line
  isHoverMagicCopyEnabled: true,
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
const SYNC_QUOTA_BYTES = 102400; // 100KB
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
