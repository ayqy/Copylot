// @ts-ignore: CSS import for build process
import './options.css';
import {
  getSettings,
  saveSettings,
  type Settings,
  type Prompt,
  type ChatService,
  FORCE_UI_LANGUAGE
} from '../shared/settings-manager';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to get localized messages
function getMessage(key: string, substitutions?: any): string {
  return chrome.i18n.getMessage(key, substitutions);
}

// DOM元素接口
interface OptionsElements {
  searchInput: HTMLInputElement;
  categoryFilter: HTMLSelectElement;
  addPromptBtn: HTMLButtonElement;
  batchActionBtn: HTMLButtonElement;
  promptsGrid: HTMLElement;
  emptyState: HTMLElement;
  createFirstPromptBtn: HTMLButtonElement;
  mobileAddBtn: HTMLButtonElement;
  
  // Modal elements
  promptEditorModal: HTMLElement;
  modalTitle: HTMLElement;
  closeModalBtn: HTMLButtonElement;
  promptForm: HTMLFormElement;
  promptId: HTMLInputElement;
  promptTitle: HTMLInputElement;
  promptCategory: HTMLSelectElement;
  promptTemplate: HTMLTextAreaElement;
  promptTargetChat: HTMLSelectElement;
  promptAutoOpenChat: HTMLInputElement;
  insertContentPlaceholder: HTMLButtonElement;
  previewPrompt: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
  saveBtn: HTMLButtonElement;
  
  // Import/Export elements
  importExportBtn: HTMLButtonElement;
  importExportModal: HTMLElement;
  
  // Preview elements
  previewModal: HTMLElement;
  previewSample: HTMLTextAreaElement;
  previewResult: HTMLElement;
  
  // Usage instructions
  usageInstructions: HTMLElement;
  hideInstructionsBtn: HTMLButtonElement;
  
  // Sync status
  syncStatusBtn: HTMLButtonElement;
  syncStatusText: HTMLElement;

  // Chat Services elements
  defaultChatService: HTMLSelectElement;
  defaultAutoOpenChat: HTMLInputElement;
  addCustomChatBtn: HTMLButtonElement;
  chatServicesGrid: HTMLElement;
  chatServiceEditorModal: HTMLElement;
  chatServiceModalTitle: HTMLElement;
  closeChatServiceModalBtn: HTMLButtonElement;
  chatServiceForm: HTMLFormElement;
  chatServiceId: HTMLInputElement;
  chatServiceName: HTMLInputElement;
  chatServiceUrl: HTMLInputElement;
  chatServiceIcon: HTMLInputElement;
  cancelChatServiceBtn: HTMLButtonElement;
  saveChatServiceBtn: HTMLButtonElement;
}

let elements: OptionsElements;
let currentSettings: Settings;
let allPrompts: Prompt[] = [];
let filteredPrompts: Prompt[] = [];
let selectedPrompts: Set<string> = new Set();
let editingPromptId: string | null = null;
let editingChatServiceId: string | null = null;

/**
 * 获取所有DOM元素
 */
function getElements(): OptionsElements {
  return {
    searchInput: document.getElementById('search-input') as HTMLInputElement,
    categoryFilter: document.getElementById('category-filter') as HTMLSelectElement,
    addPromptBtn: document.getElementById('add-prompt-btn') as HTMLButtonElement,
    batchActionBtn: document.getElementById('batch-action-btn') as HTMLButtonElement,
    promptsGrid: document.getElementById('prompts-grid') as HTMLElement,
    emptyState: document.getElementById('empty-state') as HTMLElement,
    createFirstPromptBtn: document.getElementById('create-first-prompt-btn') as HTMLButtonElement,
    mobileAddBtn: document.getElementById('mobile-add-btn') as HTMLButtonElement,
    
    promptEditorModal: document.getElementById('prompt-editor-modal') as HTMLElement,
    modalTitle: document.getElementById('modal-title') as HTMLElement,
    closeModalBtn: document.getElementById('close-modal-btn') as HTMLButtonElement,
    promptForm: document.getElementById('prompt-form') as HTMLFormElement,
    promptId: document.getElementById('prompt-id') as HTMLInputElement,
    promptTitle: document.getElementById('prompt-title') as HTMLInputElement,
    promptCategory: document.getElementById('prompt-category') as HTMLSelectElement,
    promptTemplate: document.getElementById('prompt-template') as HTMLTextAreaElement,
    promptTargetChat: document.getElementById('prompt-target-chat') as HTMLSelectElement,
    promptAutoOpenChat: document.getElementById('prompt-auto-open-chat') as HTMLInputElement,
    insertContentPlaceholder: document.getElementById('insert-content-placeholder') as HTMLButtonElement,
    previewPrompt: document.getElementById('preview-prompt') as HTMLButtonElement,
    cancelBtn: document.getElementById('cancel-btn') as HTMLButtonElement,
    saveBtn: document.getElementById('save-btn') as HTMLButtonElement,
    
    importExportBtn: document.getElementById('import-export-btn') as HTMLButtonElement,
    importExportModal: document.getElementById('import-export-modal') as HTMLElement,
    
    previewModal: document.getElementById('preview-modal') as HTMLElement,
    previewSample: document.getElementById('preview-sample') as HTMLTextAreaElement,
    previewResult: document.getElementById('preview-result') as HTMLElement,
    
    usageInstructions: document.getElementById('usage-instructions') as HTMLElement,
    hideInstructionsBtn: document.getElementById('hide-instructions-btn') as HTMLButtonElement,
    
    syncStatusBtn: document.getElementById('sync-status-btn') as HTMLButtonElement,
    syncStatusText: document.getElementById('sync-status-text') as HTMLElement,

    // Chat Services elements
    defaultChatService: document.getElementById('default-chat-service') as HTMLSelectElement,
    defaultAutoOpenChat: document.getElementById('default-auto-open-chat') as HTMLInputElement,
    addCustomChatBtn: document.getElementById('add-custom-chat-btn') as HTMLButtonElement,
    chatServicesGrid: document.getElementById('chat-services-grid') as HTMLElement,
    chatServiceEditorModal: document.getElementById('chat-service-editor-modal') as HTMLElement,
    chatServiceModalTitle: document.getElementById('chat-service-modal-title') as HTMLElement,
    closeChatServiceModalBtn: document.getElementById('close-chat-service-modal-btn') as HTMLButtonElement,
    chatServiceForm: document.getElementById('chat-service-form') as HTMLFormElement,
    chatServiceId: document.getElementById('chat-service-id') as HTMLInputElement,
    chatServiceName: document.getElementById('chat-service-name') as HTMLInputElement,
    chatServiceUrl: document.getElementById('chat-service-url') as HTMLInputElement,
    chatServiceIcon: document.getElementById('chat-service-icon') as HTMLInputElement,
    cancelChatServiceBtn: document.getElementById('cancel-chat-service-btn') as HTMLButtonElement,
    saveChatServiceBtn: document.getElementById('save-chat-service-btn') as HTMLButtonElement
  };
}

/**
 * 本地化UI
 */
function localizeUI() {
  if (FORCE_UI_LANGUAGE) {
    document.documentElement.lang = FORCE_UI_LANGUAGE;
  }

  const i18nElements = document.querySelectorAll('[data-i18n]');
  i18nElements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const message = getMessage(key);
      if (message) {
        element.textContent = message;
      }
    }
  });

  const i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
  i18nPlaceholders.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key) {
      const message = getMessage(key);
      if (message) {
        (element as HTMLInputElement).placeholder = message;
      }
    }
  });

  document.title = getMessage('optionsTitle') || 'Prompt Manager - Copylot';
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    currentSettings = await getSettings();
    allPrompts = [...currentSettings.userPrompts];
    filterAndRenderPrompts();
    updateSyncStatus();
    console.debug('Settings loaded:', currentSettings);
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification(getMessage('loadingSettingsFailed'), 'error');
  }
}

/**
 * 更新同步状态
 */
function updateSyncStatus() {
  // 检查Chrome storage API状态
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
    elements.syncStatusText.textContent = getMessage('syncStatusUnavailable');
    elements.syncStatusBtn.style.color = 'var(--error-color)';
    return;
  }
  
  elements.syncStatusText.textContent = getMessage('syncStatusConnected');
  elements.syncStatusBtn.style.color = 'var(--success-color)';
}

/**
 * 手动触发同步
 */
async function manualSync() {
  try {
    elements.syncStatusText.textContent = getMessage('syncStatusSyncing');
    elements.syncStatusBtn.style.color = 'var(--warning-color)';
    
    // 重新保存设置以触发同步
    await saveSettings({ userPrompts: allPrompts });
    
    elements.syncStatusText.textContent = getMessage('syncStatusConnected');
    elements.syncStatusBtn.style.color = 'var(--success-color)';
    showNotification(getMessage('syncSuccess'), 'success');
  } catch (error) {
    console.error('Manual sync failed:', error);
    elements.syncStatusText.textContent = getMessage('syncStatusFailed');
    elements.syncStatusBtn.style.color = 'var(--error-color)';
    const errorMessage = (error as Error).message;
    showNotification(getMessage('syncFailure', { error: errorMessage }), 'error');
  }
}

/**
 * 过滤和渲染prompts
 */
function filterAndRenderPrompts() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const categoryFilter = elements.categoryFilter.value;

  filteredPrompts = allPrompts.filter(prompt => {
    // 过滤掉已删除的内置prompt
    if (prompt.builtIn && prompt.deleted) {
      return false;
    }
    
    const matchesSearch = !searchTerm || 
      prompt.title.toLowerCase().includes(searchTerm) ||
      prompt.template.toLowerCase().includes(searchTerm);
    
    const matchesCategory = categoryFilter === 'all' || 
      getCategoryFromPrompt(prompt) === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  renderPrompts();
  updateUI();
}

/**
 * 从prompt获取分类
 */
function getCategoryFromPrompt(prompt: Prompt): string {
  // 优先使用保存的category字段
  if (prompt.category) {
    return prompt.category;
  }
  
  // 回退到基于preset ID或内容推断分类（用于旧数据兼容性）
  if (prompt.id.includes('summary')) return 'summary';
  if (prompt.id.includes('translate')) return 'translate';
  if (prompt.id.includes('code')) return 'coding';
  if (prompt.id.includes('polish') || prompt.id.includes('expand')) return 'writing';
  return 'custom';
}

/**
 * 渲染prompts网格
 */
function renderPrompts() {
  elements.promptsGrid.innerHTML = '';
  
  if (filteredPrompts.length === 0) {
    elements.emptyState.style.display = 'block';
    return;
  }

  elements.emptyState.style.display = 'none';

  filteredPrompts.forEach(prompt => {
    const card = createPromptCard(prompt);
    elements.promptsGrid.appendChild(card);
  });
}

/**
 * 创建prompt卡片
 */
function createPromptCard(prompt: Prompt): HTMLElement {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  card.setAttribute('data-id', prompt.id);
  
  const category = getCategoryFromPrompt(prompt);
  const categoryText = getCategoryDisplayName(category);
  
  // 为内置prompt添加特殊样式类
  if (prompt.builtIn) {
    card.classList.add('builtin-prompt');
  }
  
  card.innerHTML = `
    <input type="checkbox" class="prompt-card-checkbox" data-id="${prompt.id}">
    <div class="prompt-card-header">
      <h3 class="prompt-card-title">${escapeHtml(prompt.title)}${prompt.builtIn ? ' <span class="builtin-badge">内置</span>' : ''}</h3>
      <div class="prompt-card-actions">
        <button class="action-btn edit-btn" title="${getMessage('editPrompt')}" data-id="${prompt.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="action-btn duplicate-btn" title="${getMessage('copy')}" data-id="${prompt.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" title="${getMessage('deleteSelected')}" data-id="${prompt.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="prompt-card-category">${categoryText}</div>
    
    <div class="prompt-card-content">
      ${escapeHtml(prompt.template)}
    </div>
    
    <div class="prompt-card-footer">
      <span class="usage-count">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        ${formatUsageCount(prompt.usageCount)}
      </span>
      <span class="last-used">${formatTimeAgo(prompt.createdAt)}</span>
    </div>
  `;

  return card;
}

/**
 * 获取分类显示名称
 */
function getCategoryDisplayName(category: string): string {
  const key = `category${category.charAt(0).toUpperCase() + category.slice(1)}`;
  return getMessage(key) || getMessage('categoryCustom');
}

/**
 * 预定义的图标背景色数组，用于区分不同的服务
 */
const ICON_COLORS = [
  '#4F46E5', // 靛紫色 - ChatGPT
  '#D97F42', // 橙棕色 - Claude  
  '#4285F4', // 蓝色 - Gemini
  '#295FFF', // 深蓝色 - 文心一言
  '#FF6400', // 橙色 - 通义千问
  '#7C3AED', // 紫色 - Kimi
  '#00BB70', // 绿色 - 豆包
  '#EF4444', // 红色
  '#10B981', // 翠绿色
  '#F59E0B', // 黄色
  '#8B5CF6', // 薰衣草紫
  '#06B6D4', // 青色
  '#EC4899', // 粉色
  '#84CC16', // 柠檬绿
  '#F97316', // 橙红色
  '#6366F1'  // 蓝紫色
];

/**
 * 根据服务ID获取对应的背景色
 */
function getServiceIconColor(serviceId: string): string {
  // 对于内置服务，使用预定义的颜色映射
  const builtInColors: Record<string, string> = {
    'chatgpt': ICON_COLORS[0],
    'claude': ICON_COLORS[1], 
    'gemini': ICON_COLORS[2],
    'yiyan': ICON_COLORS[3],
    'tongyi': ICON_COLORS[4],
    'kimi': ICON_COLORS[5],
    'doubao': ICON_COLORS[6],
    'deepseek': ICON_COLORS[7],
    'poe': ICON_COLORS[8],
    'glm': ICON_COLORS[9],
    'openai-playground': ICON_COLORS[10],
    'perplexity': ICON_COLORS[11],
    'grok': ICON_COLORS[12],
    'lmarena': ICON_COLORS[13]
  };
  
  if (builtInColors[serviceId]) {
    return builtInColors[serviceId];
  }
  
  // 对于自定义服务，使用简单的哈希算法分配颜色
  let hash = 0;
  for (let i = 0; i < serviceId.length; i++) {
    const char = serviceId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  const colorIndex = Math.abs(hash) % ICON_COLORS.length;
  return ICON_COLORS[colorIndex];
}

/**
 * 获取chat服务的文字图标信息
 */
function getServiceIconInfo(service: ChatService): { text: string; color: string } {
  const serviceName = service.name;
  
  if (!serviceName) {
    return { text: '?', color: ICON_COLORS[0] };
  }
  
  // 获取第一个字符并转换为大写
  const firstChar = serviceName.charAt(0).toUpperCase();
  
  let iconText: string;
  // 如果是中文字符，直接返回
  if (/[\u4e00-\u9fff]/.test(firstChar)) {
    iconText = firstChar;
  }
  // 如果是英文字符，返回大写字母
  else if (/[A-Za-z]/.test(firstChar)) {
    iconText = firstChar;
  }
  // 其他情况返回问号
  else {
    iconText = '?';
  }
  
  return {
    text: iconText,
    color: getServiceIconColor(service.id)
  };
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 格式化时间为友好显示
 */
function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return getMessage('justCreated');
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return getMessage('justNow');
  if (diffMin < 60) return getMessage('minutesAgo', [diffMin.toString()]);
  if (diffHour < 24) return getMessage('hoursAgo', [diffHour.toString()]);
  if (diffDay < 7) return getMessage('daysAgo', [diffDay.toString()]);
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 格式化使用次数
 */
function formatUsageCount(count?: number): string {
  return getMessage('usageCount', [(count || 0).toString()]);
}

/**
 * 更新UI状态
 */
function updateUI() {
  // 批量操作按钮总是可用，但文本会根据选择状态变化
  elements.batchActionBtn.disabled = false;
  
  // 更新复选框状态
  document.querySelectorAll('.prompt-card-checkbox').forEach(checkbox => {
    const promptId = (checkbox as HTMLInputElement).getAttribute('data-id');
    if (promptId) {
      (checkbox as HTMLInputElement).checked = selectedPrompts.has(promptId);
    }
  });
}

/**
 * 切换prompt选择状态
 */
function togglePromptSelection(promptId: string) {
  if (selectedPrompts.has(promptId)) {
    selectedPrompts.delete(promptId);
  } else {
    selectedPrompts.add(promptId);
  }
  updateUI();
}

/**
 * 全选prompts
 */
function selectAllPrompts() {
  filteredPrompts.forEach(prompt => {
    selectedPrompts.add(prompt.id);
  });
  updateUI();
}

/**
 * 取消全选prompts
 */
function deselectAllPrompts() {
  selectedPrompts.clear();
  updateUI();
}

/**
 * 批量删除选中的prompts
 */
async function deleteSelectedPrompts() {
  if (selectedPrompts.size === 0) {
    showNotification(getMessage('errorNoPromptsSelected'), 'error');
    return;
  }
  
  const count = selectedPrompts.size;
      if (confirm(getMessage('confirmDeleteSelectedMessage', [count.toString()]))) {
    // 处理批量删除，对内置prompt标记删除，对用户prompt直接删除
    allPrompts.forEach(prompt => {
      if (selectedPrompts.has(prompt.id)) {
        if (prompt.builtIn) {
          prompt.deleted = true;
        }
      }
    });
    // 删除非内置的用户prompt
    allPrompts = allPrompts.filter(p => !(selectedPrompts.has(p.id) && !p.builtIn));
    selectedPrompts.clear();
    await savePrompts();
          showNotification(getMessage('deleteSuccessMessage', [count.toString()]), 'success');
  }
}

/**
 * 打开prompt编辑器
 */
function openPromptEditor(prompt?: Prompt) {
  editingPromptId = prompt?.id || null;
  
  // 更新chat服务选择框
  updateChatServiceOptions();
  
  if (prompt) {
    elements.modalTitle.textContent = getMessage('editPrompt');
    elements.promptId.value = prompt.id;
    elements.promptTitle.value = prompt.title;
    elements.promptCategory.value = prompt.category || getCategoryFromPrompt(prompt);
    elements.promptTemplate.value = prompt.template;
    elements.promptTargetChat.value = prompt.targetChatId || '';
    elements.promptAutoOpenChat.checked = prompt.autoOpenChat !== undefined ? prompt.autoOpenChat : currentSettings.defaultAutoOpenChat;
  } else {
    elements.modalTitle.textContent = getMessage('newPromptTitle');
    elements.promptForm.reset();
    elements.promptId.value = '';
    elements.promptTargetChat.value = '';
    elements.promptAutoOpenChat.checked = currentSettings.defaultAutoOpenChat;
  }
  
  elements.promptEditorModal.style.display = 'flex';
  elements.promptTitle.focus();
}

/**
 * 关闭prompt编辑器
 */
function closePromptEditor() {
  elements.promptEditorModal.style.display = 'none';
  editingPromptId = null;
}

/**
 * 打开预览模态框
 */
function openPreviewModal(template: string) {
  elements.previewModal.style.display = 'flex';
  
  // 设置示例内容
  const sampleText = elements.previewSample.value || getMessage('previewSampleText');
  elements.previewSample.value = sampleText;
  
  // 生成预览结果
  updatePreviewResult(template, sampleText);
  
  // 监听示例内容变化
  elements.previewSample.oninput = () => {
    updatePreviewResult(template, elements.previewSample.value);
  };
}

/**
 * 关闭预览模态框
 */
function closePreviewModal() {
  elements.previewModal.style.display = 'none';
  elements.previewSample.oninput = null;
}

/**
 * 更新预览结果
 */
function updatePreviewResult(template: string, sampleContent: string) {
  const result = template.replace(/\{content\}/g, sampleContent);
  elements.previewResult.textContent = result;
}

/**
 * 显示使用说明
 */
function showUsageInstructions() {
  elements.usageInstructions.style.display = 'block';
}

/**
 * 隐藏使用说明
 */
function hideUsageInstructions() {
  elements.usageInstructions.style.display = 'none';
}

/**
 * 编辑prompt
 */
function editPrompt(promptId: string) {
  const prompt = allPrompts.find(p => p.id === promptId);
  if (prompt) {
    openPromptEditor(prompt);
  }
}

/**
 * 复制prompt
 */
async function duplicatePrompt(promptId: string) {
  const prompt = allPrompts.find(p => p.id === promptId);
  if (prompt) {
    const newPrompt: Prompt = {
      id: generateUUID(),
      title: `${prompt.title}${getMessage('duplicateSuffix')}`,
      template: prompt.template,
      category: prompt.category,
      usageCount: 0,
      createdAt: Date.now()
    };
    
    allPrompts.push(newPrompt);
    await savePrompts();
    showNotification(getMessage('duplicateSuccessMessage'), 'success');
  }
}

/**
 * 删除prompt
 */
async function deletePrompt(promptId: string) {
  if (confirm(getMessage('confirmDeleteSingleMessage'))) {
    const prompt = allPrompts.find(p => p.id === promptId);
    if (prompt && prompt.builtIn) {
      // 对于内置prompt，标记为已删除而不是真正删除
      prompt.deleted = true;
    } else {
      // 对于用户创建的prompt，直接删除
      allPrompts = allPrompts.filter(p => p.id !== promptId);
    }
    await savePrompts();
    showNotification(getMessage('deleteSingleSuccessMessage'), 'success');
  }
}

/**
 * 保存prompts到设置
 */
async function savePrompts() {
  try {
    const wasEmpty = allPrompts.length === 0;
    
    // 显示同步中状态
    elements.syncStatusText.textContent = getMessage('syncStatusSyncing');
    elements.syncStatusBtn.style.color = 'var(--warning-color)';
    
    await saveSettings({ userPrompts: allPrompts });
    currentSettings.userPrompts = [...allPrompts];
    filterAndRenderPrompts();
    
    // 同步成功
    elements.syncStatusText.textContent = getMessage('syncStatusConnected');
    elements.syncStatusBtn.style.color = 'var(--success-color)';
    
    // 如果是第一次创建prompt，显示使用说明
    if (wasEmpty && allPrompts.length === 1) {
      showUsageInstructions();
    }
    
    // 通知background script更新菜单
    chrome.runtime.sendMessage({ type: 'update-context-menu' });
  } catch (error) {
    console.error('Error saving prompts:', error);

    // 同步失败
    elements.syncStatusText.textContent = getMessage('syncStatusFailed');
    elements.syncStatusBtn.style.color = 'var(--error-color)';
    const errorMessage = (error as Error).message;
    showNotification(getMessage('savingFailed', [errorMessage]), 'error');
  }
}

/**
 * 保存prompt表单
 */
async function savePromptForm(event: Event) {
  event.preventDefault();
  
  const title = elements.promptTitle.value.trim();
  const template = elements.promptTemplate.value.trim();
  
  if (!title || !template) {
    showNotification(getMessage('errorFillInTitleAndTemplate'), 'error');
    return;
  }
  
  const category = elements.promptCategory.value;
  
  const targetChatId = elements.promptTargetChat.value || undefined;
  const autoOpenChat = elements.promptAutoOpenChat.checked;
  
  if (editingPromptId) {
    // 编辑现有prompt
    const prompt = allPrompts.find(p => p.id === editingPromptId);
    if (prompt) {
      prompt.title = title;
      prompt.template = template;
      prompt.category = category;
      prompt.targetChatId = targetChatId;
      prompt.autoOpenChat = autoOpenChat;
    }
  } else {
    // 新建prompt
    const newPrompt: Prompt = {
      id: generateUUID(),
      title,
      template,
      category,
      targetChatId,
      autoOpenChat,
      usageCount: 0,
      createdAt: Date.now()
    };
    allPrompts.push(newPrompt);
  }
  
  const isNewPrompt = !editingPromptId;
  
  await savePrompts();
  closePromptEditor();
  
  if (isNewPrompt) {
    showNotification(getMessage('saveSuccessNewPromptMessage'), 'success');
  } else {
    showNotification(getMessage('saveSuccessMessage'), 'success');
  }
}

/**
 * 插入内容占位符
 */
function insertContentPlaceholder() {
  const textarea = elements.promptTemplate;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  
  textarea.value = text.substring(0, start) + '{content}' + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + '{content}'.length;
  textarea.focus();
}

/**
 * 预览prompt
 */
function previewPrompt() {
  const template = elements.promptTemplate.value;
  if (!template) {
    showNotification(getMessage('errorTemplateNeeded'), 'error');
    return;
  }
  
  // 打开预览模态框
  openPreviewModal(template);
}

/**
 * 导出数据格式定义
 */
interface ExportData {
  version: string;
  exportDate: string;
  prompts: Prompt[];
}

/**
 * 导出所有prompts
 */
function handleExportPrompts() {
  try {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      prompts: allPrompts
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `magic-copy-prompts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(getMessage('exportSuccessMessage'), 'success');
    closeImportExportModal();
  } catch (error) {
    console.error('Export failed:', error);
    const errorMessage = (error as Error).message;
          showNotification(getMessage('exportFailedMessage', [errorMessage]), 'error');
  }
}

/**
 * 处理文件导入
 */
function handleImportPrompts() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!validateImportData(data)) {
        showNotification(getMessage('errorInvalidImportFile'), 'error');
        return;
      }
      
      const importedPrompts = data.prompts || [];
      const duplicateCount = importedPrompts.filter((imported: Prompt) => 
        allPrompts.some(existing => existing.id === imported.id)
      ).length;
      
      if (duplicateCount > 0) {
        if (!confirm(getMessage('confirmImportWithDuplicates', [duplicateCount.toString()]))) {
          return;
        }
      }
      
      // 过滤重复的prompts
      const newPrompts = importedPrompts.filter((imported: Prompt) => 
        !allPrompts.some(existing => existing.id === imported.id)
      );
      
      // 为导入的prompts设置默认值
      newPrompts.forEach((prompt: Prompt) => {
        if (!prompt.usageCount) prompt.usageCount = 0;
        if (!prompt.createdAt) prompt.createdAt = Date.now();
      });
      
      allPrompts.push(...newPrompts);
      await savePrompts();
      
      showNotification(getMessage('importSuccessMessage', [newPrompts.length.toString()]), 'success');
      closeImportExportModal();
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = (error as Error).message;
      showNotification(getMessage('importFailedMessage', [errorMessage]), 'error');
    }
  };
  
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

/**
 * 验证导入数据格式
 */
function validateImportData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.prompts)) return false;
  
  return data.prompts.every((prompt: any) => 
    prompt && 
    typeof prompt.id === 'string' && 
    typeof prompt.title === 'string' && 
    typeof prompt.template === 'string'
  );
}

/**
 * 显示导入导出模态框
 */
function showImportExportModal() {
  elements.importExportModal.style.display = 'flex';
}

/**
 * 关闭导入导出模态框
 */
function closeImportExportModal() {
  elements.importExportModal.style.display = 'none';
}

/**
 * 显示通知
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // 创建简单的通知
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 3000;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    transform: translateX(100%);
  `;
  
  document.body.appendChild(notification);
  
  // 动画显示
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // 自动移除
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 监听 storage 变化以实时更新使用次数
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.copilot_settings && namespace === 'sync') {
      console.debug('Settings changed, reloading data...');
      loadSettings();
    }
  });
  // 搜索和过滤
  elements.searchInput.addEventListener('input', filterAndRenderPrompts);
  elements.categoryFilter.addEventListener('change', filterAndRenderPrompts);
  
  // 添加prompt按钮
  elements.addPromptBtn.addEventListener('click', () => openPromptEditor());
  elements.createFirstPromptBtn.addEventListener('click', () => openPromptEditor());
  elements.mobileAddBtn.addEventListener('click', () => openPromptEditor());
  
  // 模态框控制
  elements.closeModalBtn.addEventListener('click', closePromptEditor);
  elements.cancelBtn.addEventListener('click', closePromptEditor);
  elements.promptForm.addEventListener('submit', savePromptForm);
  
  // 编辑器工具
  elements.insertContentPlaceholder.addEventListener('click', insertContentPlaceholder);
  elements.previewPrompt.addEventListener('click', previewPrompt);
  
  // 模态框背景点击关闭
  elements.promptEditorModal.addEventListener('click', (e) => {
    if (e.target === elements.promptEditorModal) {
      closePromptEditor();
    }
  });
  
  // 预览模态框事件
  elements.previewModal.addEventListener('click', (e) => {
    if (e.target === elements.previewModal) {
      closePreviewModal();
    }
  });
  
  // 预览模态框关闭按钮（从HTML中查找）
  const previewCloseBtn = elements.previewModal.querySelector('.close-btn');
  if (previewCloseBtn) {
    previewCloseBtn.addEventListener('click', closePreviewModal);
  }
  
  // 隐藏使用说明按钮
  elements.hideInstructionsBtn.addEventListener('click', hideUsageInstructions);

  // 同步状态按钮
  elements.syncStatusBtn.addEventListener('click', manualSync);

  // 导入导出按钮
  elements.importExportBtn.addEventListener('click', showImportExportModal);
  
  // 导入导出模态框事件
  elements.importExportModal.addEventListener('click', (e) => {
    if (e.target === elements.importExportModal) {
      closeImportExportModal();
    }
  });
  
  // 导入导出模态框关闭按钮
  const closeImportExportBtn = document.getElementById('close-import-export-btn');
  if (closeImportExportBtn) {
    closeImportExportBtn.addEventListener('click', closeImportExportModal);
  }
  
  // 预览模态框关闭按钮
  const closePreviewBtn = document.getElementById('close-preview-btn');
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', closePreviewModal);
  }
  
  // 导入导出模态框内的按钮事件
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportPrompts);
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', handleImportPrompts);
  }
  
  // 标签切换
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const tabName = target.getAttribute('data-tab');
      
      // 更新活动标签
      tabBtns.forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      
      // 显示对应内容
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      const tabContent = document.getElementById(`${tabName}-tab`);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });

  // Chat服务相关事件监听器
  elements.addCustomChatBtn.addEventListener('click', () => openChatServiceEditor());
  elements.chatServiceForm.addEventListener('submit', saveChatService);
  elements.cancelChatServiceBtn.addEventListener('click', closeChatServiceEditor);
  elements.closeChatServiceModalBtn.addEventListener('click', closeChatServiceEditor);

  // 默认设置事件监听器
  elements.defaultChatService.addEventListener('change', async () => {
    currentSettings.defaultChatServiceId = elements.defaultChatService.value || undefined;
    await saveChatSettings();
  });

  elements.defaultAutoOpenChat.addEventListener('change', async () => {
    currentSettings.defaultAutoOpenChat = elements.defaultAutoOpenChat.checked;
    await saveChatSettings();
  });

  // Chat服务卡片事件委托
  elements.chatServicesGrid.addEventListener('click', (e) => {
    const target = e.target as Element;
    
    const openBtn = target.closest('.open-service-btn') as HTMLButtonElement;
    if (openBtn) {
      const url = openBtn.getAttribute('data-url');
      if (url) {
        chrome.tabs.create({ url: url });
      }
      return;
    }
    
    const editBtn = target.closest('.edit-service-btn') as HTMLButtonElement;
    if (editBtn) {
      const serviceId = editBtn.getAttribute('data-id');
      if (serviceId) {
        const service = currentSettings.chatServices.find(s => s.id === serviceId);
        if (service) {
          openChatServiceEditor(service);
        }
      }
      return;
    }

    const deleteBtn = target.closest('.delete-service-btn') as HTMLButtonElement;
    if (deleteBtn) {
      const serviceId = deleteBtn.getAttribute('data-id');
      if (serviceId) {
        deleteChatService(serviceId);
      }
      return;
    }
  });

  // Chat服务启用状态切换
  elements.chatServicesGrid.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains('service-enabled-toggle')) {
      const serviceId = target.getAttribute('data-id');
      if (serviceId) {
        toggleChatServiceEnabled(serviceId, target.checked);
      }
    }
  });

  // Chat服务模态框背景点击关闭
  elements.chatServiceEditorModal.addEventListener('click', (e) => {
    if (e.target === elements.chatServiceEditorModal) {
      closeChatServiceEditor();
    }
  });
  
  // 批量操作菜单项事件
  const batchMenuItems = document.querySelectorAll('.batch-menu-item');
  batchMenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = (e.target as HTMLElement).closest('.batch-menu-item')?.getAttribute('data-action');
      
      switch (action) {
        case 'select-all':
          selectAllPrompts();
          break;
        case 'deselect-all':
          deselectAllPrompts();
          break;
        case 'delete-selected':
          deleteSelectedPrompts();
          break;
      }
    });
  });
  
  // 动态绑定prompt卡片事件
  elements.promptsGrid.addEventListener('click', (e) => {
    const target = e.target as Element;
    
    // 处理复选框点击
    if (target.classList.contains('prompt-card-checkbox')) {
      const checkbox = target as HTMLInputElement;
      const promptId = checkbox.getAttribute('data-id');
      if (promptId) {
        e.stopPropagation();
        togglePromptSelection(promptId);
      }
      return;
    }
    
    // 处理操作按钮点击
    const btn = target.closest('.action-btn') as HTMLButtonElement;
    if (btn) {
      const promptId = btn.getAttribute('data-id');
      if (!promptId) return;
      
      e.stopPropagation();
      
      if (btn.classList.contains('edit-btn')) {
        editPrompt(promptId);
      } else if (btn.classList.contains('duplicate-btn')) {
        duplicatePrompt(promptId);
      } else if (btn.classList.contains('delete-btn')) {
        deletePrompt(promptId);
      }
      return;
    }
    
    // 处理卡片点击（编辑）
    const card = target.closest('.prompt-card') as HTMLElement;
    if (card) {
      const promptId = card.getAttribute('data-id');
      if (promptId) {
        editPrompt(promptId);
      }
    }
  });
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n') {
        e.preventDefault();
        openPromptEditor();
      } else if (e.key === 'f') {
        e.preventDefault();
        elements.searchInput.focus();
      }
    }
    
    if (e.key === 'Escape') {
      if (elements.promptEditorModal.style.display === 'flex') {
        closePromptEditor();
      } else if (elements.previewModal.style.display === 'flex') {
        closePreviewModal();
      }
    }
  });
}

/**
 * 初始化应用
 */
async function initialize() {
  try {
    console.debug('Initializing options page...');
    
    elements = getElements();
    localizeUI();
    await loadSettings();
    renderChatServices();
    updateChatServiceOptions();
    setupEventListeners();
    
    console.debug('Options page initialized successfully');
  } catch (error) {
    console.error('Error initializing options page:', error);
    showNotification(getMessage('initializationFailed'), 'error');
  }
}

// 全局函数已移除，现在使用事件监听器代替内联事件处理器

/**
 * 更新chat服务选择框选项
 */
function updateChatServiceOptions() {
  const chatServices = currentSettings.chatServices.filter(service => service.enabled);
  
  // 更新prompt编辑器中的选择框
  elements.promptTargetChat.innerHTML = `<option value="" data-i18n="useDefault">${getMessage('useDefault')}</option>`;
  chatServices.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    elements.promptTargetChat.appendChild(option);
  });
  
  // 更新默认chat服务选择框
  elements.defaultChatService.innerHTML = `<option value="" data-i18n="noDefault">${getMessage('noDefault')}</option>`;
  chatServices.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    elements.defaultChatService.appendChild(option);
  });
  
  // 设置当前值
  elements.defaultChatService.value = currentSettings.defaultChatServiceId || '';
  elements.defaultAutoOpenChat.checked = currentSettings.defaultAutoOpenChat;
}

/**
 * 渲染chat服务卡片
 */
function renderChatServices() {
  elements.chatServicesGrid.innerHTML = '';
  
  currentSettings.chatServices.forEach(service => {
    const card = createChatServiceCard(service);
    elements.chatServicesGrid.appendChild(card);
  });
}

/**
 * 创建chat服务卡片
 */
function createChatServiceCard(service: ChatService): HTMLElement {
  const card = document.createElement('div');
  card.className = 'chat-service-card';
  card.setAttribute('data-id', service.id);
  
  // 获取服务图标信息（文字和颜色）
  const iconInfo = getServiceIconInfo(service);
  
  card.innerHTML = `
    <div class="chat-service-header">
      <div class="chat-service-info">
        <div class="chat-service-icon-text" style="background-color: ${iconInfo.color}">${iconInfo.text}</div>
        <div class="chat-service-details">
          <h4 class="chat-service-name">${escapeHtml(service.name)}</h4>
          <p class="chat-service-url">${escapeHtml(service.url)}</p>
        </div>
      </div>
      <div class="chat-service-actions">
        <button class="action-btn open-service-btn" title="${getMessage('openService')}" data-id="${service.id}" data-url="${service.url}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
        ${!service.builtIn ? `
          <button class="action-btn edit-service-btn" title="${getMessage('editService')}" data-id="${service.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete-service-btn" title="${getMessage('deleteService')}" data-id="${service.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
    <div class="chat-service-toggle">
      <label class="switch-label">
        <span>${service.description || ''}</span>
        <label class="switch">
          <input type="checkbox" class="service-enabled-toggle" data-id="${service.id}" ${service.enabled ? 'checked' : ''} />
          <span class="slider round"></span>
        </label>
      </label>
    </div>
  `;

  return card;
}

/**
 * 打开chat服务编辑器
 */
function openChatServiceEditor(service?: ChatService) {
  editingChatServiceId = service?.id || null;
  
  if (service) {
    elements.chatServiceModalTitle.textContent = getMessage('editChatService');
    elements.chatServiceId.value = service.id;
    elements.chatServiceName.value = service.name;
    elements.chatServiceUrl.value = service.url;
    elements.chatServiceIcon.value = service.icon;
  } else {
    elements.chatServiceModalTitle.textContent = getMessage('addChatService');
    elements.chatServiceForm.reset();
    elements.chatServiceId.value = '';
  }
  
  elements.chatServiceEditorModal.style.display = 'flex';
  elements.chatServiceName.focus();
}

/**
 * 关闭chat服务编辑器
 */
function closeChatServiceEditor() {
  elements.chatServiceEditorModal.style.display = 'none';
  editingChatServiceId = null;
}

/**
 * 保存chat服务
 */
async function saveChatService(event: Event) {
  event.preventDefault();
  
  const name = elements.chatServiceName.value.trim();
  const url = elements.chatServiceUrl.value.trim();
  const icon = elements.chatServiceIcon.value.trim();
  
  if (!name || !url) {
    showNotification(getMessage('errorFillInTitleAndTemplate'), 'error');
    return;
  }
  
  if (editingChatServiceId) {
    // 编辑现有服务
    const service = currentSettings.chatServices.find(s => s.id === editingChatServiceId);
    if (service) {
      service.name = name;
      service.url = url;
      service.icon = icon || service.icon;
    }
  } else {
    // 新建服务
    const newService: ChatService = {
      id: generateUUID(),
      name,
      url,
      icon: icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTggOEgxNlYxNkg4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
      enabled: true,
      builtIn: false
    };
    currentSettings.chatServices.push(newService);
  }
  
  await saveChatSettings();
  closeChatServiceEditor();
  showNotification(getMessage('saveSuccessMessage'), 'success');
}

/**
 * 删除chat服务
 */
async function deleteChatService(serviceId: string) {
  if (confirm(getMessage('confirmDeleteService'))) {
    currentSettings.chatServices = currentSettings.chatServices.filter(s => s.id !== serviceId);
    
    // 如果删除的是默认服务，清除默认设置
    if (currentSettings.defaultChatServiceId === serviceId) {
      currentSettings.defaultChatServiceId = undefined;
    }
    
    // 清理使用此服务的prompts
    allPrompts.forEach(prompt => {
      if (prompt.targetChatId === serviceId) {
        prompt.targetChatId = undefined;
      }
    });
    
    await saveChatSettings();
    showNotification(getMessage('deleteSingleSuccessMessage'), 'success');
  }
}

/**
 * 切换chat服务启用状态
 */
async function toggleChatServiceEnabled(serviceId: string, enabled: boolean) {
  const service = currentSettings.chatServices.find(s => s.id === serviceId);
  if (service) {
    service.enabled = enabled;
    
    // 如果禁用的是默认服务，清除默认设置
    if (!enabled && currentSettings.defaultChatServiceId === serviceId) {
      currentSettings.defaultChatServiceId = undefined;
    }
    
    await saveChatSettings();
  }
}

/**
 * 保存chat服务设置
 */
async function saveChatSettings() {
  try {
    await saveSettings({
      chatServices: currentSettings.chatServices,
      defaultChatServiceId: currentSettings.defaultChatServiceId,
      defaultAutoOpenChat: currentSettings.defaultAutoOpenChat,
      userPrompts: allPrompts
    });
    
    renderChatServices();
    updateChatServiceOptions();
  } catch (error) {
    console.error('Error saving chat settings:', error);
    showNotification(getMessage('savingFailed'), 'error');
  }
}

// 当DOM加载完成时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}