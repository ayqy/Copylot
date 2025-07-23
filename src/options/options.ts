// @ts-ignore: CSS import for build process
import './options.css';
import {
  getSettings,
  saveSettings,
  type Settings,
  type Prompt,
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
}

let elements: OptionsElements;
let currentSettings: Settings;
let allPrompts: Prompt[] = [];
let filteredPrompts: Prompt[] = [];
let selectedPrompts: Set<string> = new Set();
let editingPromptId: string | null = null;

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
    syncStatusText: document.getElementById('sync-status-text') as HTMLElement
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

  document.title = getMessage('optionsTitle') || 'Prompt Manager - AI Copilot';
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
  
  card.innerHTML = `
    <input type="checkbox" class="prompt-card-checkbox" data-id="${prompt.id}">
    <div class="prompt-card-header">
      <h3 class="prompt-card-title">${escapeHtml(prompt.title)}</h3>
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
  if (diffMin < 60) return getMessage('minutesAgo', { minutes: diffMin });
  if (diffHour < 24) return getMessage('hoursAgo', { hours: diffHour });
  if (diffDay < 7) return getMessage('daysAgo', { days: diffDay });
  
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
  return getMessage('usageCount', { count: count || 0 });
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
  if (confirm(getMessage('confirmDeleteSelectedMessage', { count }))) {
    allPrompts = allPrompts.filter(p => !selectedPrompts.has(p.id));
    selectedPrompts.clear();
    await savePrompts();
    showNotification(getMessage('deleteSuccessMessage', { count }), 'success');
  }
}

/**
 * 打开prompt编辑器
 */
function openPromptEditor(prompt?: Prompt) {
  editingPromptId = prompt?.id || null;
  
  if (prompt) {
    elements.modalTitle.textContent = getMessage('editPrompt');
    elements.promptId.value = prompt.id;
    elements.promptTitle.value = prompt.title;
    elements.promptCategory.value = prompt.category || getCategoryFromPrompt(prompt);
    elements.promptTemplate.value = prompt.template;
  } else {
    elements.modalTitle.textContent = getMessage('newPromptTitle');
    elements.promptForm.reset();
    elements.promptId.value = '';
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
    allPrompts = allPrompts.filter(p => p.id !== promptId);
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
    showNotification(getMessage('savingFailed', { error: errorMessage }), 'error');
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
  
  if (editingPromptId) {
    // 编辑现有prompt
    const prompt = allPrompts.find(p => p.id === editingPromptId);
    if (prompt) {
      prompt.title = title;
      prompt.template = template;
      prompt.category = category;
    }
  } else {
    // 新建prompt
    const newPrompt: Prompt = {
      id: generateUUID(),
      title,
      template,
      category,
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
    showNotification(getMessage('exportFailedMessage', { error: errorMessage }), 'error');
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
        if (!confirm(getMessage('confirmImportWithDuplicates', { count: duplicateCount }))) {
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
      
      showNotification(getMessage('importSuccessMessage', { count: newPrompts.length }), 'success');
      closeImportExportModal();
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = (error as Error).message;
      showNotification(getMessage('importFailedMessage', { error: errorMessage }), 'error');
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
    setupEventListeners();
    
    console.debug('Options page initialized successfully');
  } catch (error) {
    console.error('Error initializing options page:', error);
    showNotification(getMessage('initializationFailed'), 'error');
  }
}

// 全局函数已移除，现在使用事件监听器代替内联事件处理器

// 当DOM加载完成时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}