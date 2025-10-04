/**
 * Zhihu Publisher Content Script
 * Automatically fills article title and content into Zhihu editor
 */

/* INLINE:dom */
/* INLINE:events */
/* INLINE:notify */
/* INLINE:article-data-manager */

// 性能调试开关与时间日志工具
const DEBUG_TIME = true;
function logTime(label: string, base: number = 0) {
  if (!DEBUG_TIME) return 0;
  const now = performance.now();
  const delta = (now - base).toFixed(1);
  console.log(`[Perf] ${label}: ${delta} ms`);
  return now;
}

interface ArticleData {
  title: string;
  content: string;
  autoPublish: boolean;
}

let isInitialized = false;
let articleData: ArticleData | null = null;

/**
 * Gets localized message
 * @param key Message key
 * @returns Localized message or key as fallback
 */
function getMessage(key: string): string {
  try {
    return chrome.i18n.getMessage(key) || key;
  } catch {
    return key;
  }
}

/**
 * Gets article data from chrome.storage.local
 * @returns Promise that resolves with article data
 */
async function getStoredArticleData(): Promise<ArticleData> {
  try {
    console.log('[Data Manager] 🔍 Getting article data from storage...');
    
    // Get the latest article data from storage
    const storedData = await getLatestArticleData(true); // Delete after reading
    
    if (!storedData) {
      throw new Error('No article data found in storage');
    }
    
    console.log('[Data Manager] ✅ Retrieved article data from storage:', {
      titleLength: storedData.title.length,
      contentLength: storedData.content.length,
      autoPublish: storedData.autoPublish,
      timestamp: new Date(storedData.timestamp).toISOString(),
      age: `${Math.round((Date.now() - storedData.timestamp) / 1000)}s ago`
    });
    
    // Convert StoredArticleData to ArticleData interface
    const articleData: ArticleData = {
      title: storedData.title,
      content: storedData.content,
      autoPublish: storedData.autoPublish
    };
    
    return articleData;
    
  } catch (error) {
    console.error('[Data Manager] ❌ Failed to get article data from storage:', error);
    throw new Error(`Failed to get article data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fills the article title
 * @param title The title to fill
 */
async function fillTitle(title: string): Promise<void> {
  try {
    showInfo('正在填充标题...');
    
    // Wait for title input to appear using intelligent monitoring
    console.log('Monitoring for title input...');
    const titleInput = await waitForElement<HTMLInputElement | HTMLTextAreaElement>('input[placeholder*="标题"], textarea[placeholder*="标题"], input[placeholder*="title"], textarea[placeholder*="title"]', 15000);
    
    if (!titleInput) {
      throw new Error('未找到标题输入框');
    }
    
    console.log('Found title input:', titleInput);
    
    // Focus and fill title with minimal delays
    console.log('Focusing title input...');
    simulateFocus(titleInput);
    
    // Only add minimal delay if element isn't already focused
    if (document.activeElement !== titleInput) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Typing title...');
    simulateType(titleInput, title);
    
    // Minimal verification delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('Title filled successfully');
    
  } catch (error) {
    console.error('Failed to fill title:', error);
    throw new Error(`填充标题失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Fills the article content
 * @param content The HTML content to fill
 */
async function fillContent(content: string): Promise<void> {
  try {
    const perfStart = DEBUG_TIME ? logTime('fillContent_start') : 0;
    showInfo('正在填充内容...');
    
    // 定义 Zhihu 编辑器唯一 selector
    const EDITOR_SELECTOR = '.public-DraftEditor-content[contenteditable="true"]';
    
    // Step 1: Try to find and click the placeholder to activate the editor
    let placeholderActivated = false;
    try {
      console.log('Looking for Zhihu placeholder element...');
      const placeholderSelectors = [
        '.public-DraftEditorPlaceholder-inner',
        '.PostEditor-placeholder',
        '.DraftEditor-placeholder',
        '[class*="placeholder"]'
      ];
      
      for (const selector of placeholderSelectors) {
        try {
          const placeholder = await waitForElement<HTMLElement>(selector, 2000);
          if (placeholder) {
            console.log('Found placeholder element:', placeholder);
            console.log('Placeholder text:', placeholder.textContent);
            
            // Click the placeholder to activate the editor
            simulateClick(placeholder);
            placeholderActivated = true;
            console.log('Placeholder clicked, monitoring for editor...');
            if (DEBUG_TIME) logTime('placeholder_found', perfStart);
            break;
          }
        } catch {
          // Continue to next selector
        }
      }
    } catch (error) {
      console.log('No placeholder found, will try direct editor access');
      if (DEBUG_TIME) logTime('placeholder_timeout', perfStart);
    }
    
    // Step 2: Wait for content editor to appear using新版快速策略
    let contentEditor: HTMLElement | null = null;

    // 2.1 立即同步查询
    contentEditor = document.querySelector<HTMLElement>(EDITOR_SELECTOR);
    if (contentEditor) {
      if (DEBUG_TIME) logTime('editor_found_sync', perfStart);
    } else {
      // 2.2 使用短等待
      try {
        contentEditor = await waitForVisibleElement<HTMLElement>(EDITOR_SELECTOR, 1500);
        if (contentEditor && DEBUG_TIME) logTime('editor_found_fast', perfStart);
      } catch {
        if (DEBUG_TIME) logTime('editor_fast_timeout', perfStart);
      }
    }

    // 2.3 若仍未找到，使用并行 Promise.any 在多个 selector 上等待 500ms
    if (!contentEditor) {
      const fallbackSelectors = [
        EDITOR_SELECTOR,
        '.PostEditor-wrapper [contenteditable="true"]',
        '.PostEditor-root [contenteditable="true"]',
        '.ProseMirror',
        '.DraftEditor-editorContainer [contenteditable="true"]',
        '.DraftEditor-root [contenteditable="true"]',
        '.ql-editor',
        '.note-editable',
        '.editor-content',
        '.rich-editor [contenteditable="true"]'
      ];
      try {
        contentEditor = await Promise.any(
          fallbackSelectors.map(sel => waitForVisibleElement<HTMLElement>(sel, 500))
        );
        if (DEBUG_TIME) logTime('editor_found_any', perfStart);
      } catch (aggregateErr) {
        if (DEBUG_TIME) logTime('editor_timeout_any', perfStart);
      }
    }

    // 2.4 最后手动在 PostEditor 容器内查找
    if (!contentEditor) {
      try {
        const postEditor = document.querySelector('.PostEditor-wrapper, .PostEditor-root');
        if (postEditor) {
          const editableElement = postEditor.querySelector('[contenteditable="true"]');
          if (editableElement) {
            contentEditor = editableElement as HTMLElement;
            if (DEBUG_TIME) logTime('editor_found_fallback', perfStart);
          }
        }
      } catch (error) {
        console.warn('Failed to find editor in PostEditor:', error);
      }
    }
    
    if (!contentEditor) {
      throw new Error('未找到内容编辑器');
    }
    
    console.log('Found content editor:', contentEditor);
    console.log('Editor tag name:', contentEditor.tagName);
    console.log('Editor classes:', contentEditor.className);
    
    // Step 3: Focus the editor and wait for it to be ready
    console.log('Focusing content editor...');
    simulateFocus(contentEditor);
    
    // Use a minimal delay only if the editor isn't already focused
    if (document.activeElement !== contentEditor) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (DEBUG_TIME) logTime('focus_done', perfStart);
    
    // Step 4: Copy HTML to clipboard and ask user to paste
    try {
      await writeToClipboard(content); // function from events.ts
      console.log('HTML 已写入剪贴板');
    } catch (err) {
      console.warn('写剪贴板失败，提示用户手动复制', err);
    }

    showPasteHint();
    if (DEBUG_TIME) logTime('await_user_paste_start', perfStart);
    try {
      await waitForUserPaste(content.length, contentEditor);
      if (DEBUG_TIME) logTime('await_user_paste_done', perfStart);
      console.log('检测到用户粘贴，继续流程');
    } catch (err) {
      hidePasteHint();
      throw new Error('等待用户粘贴超时');
    }
    hidePasteHint();
 
    console.log('Content filled successfully');
    if (DEBUG_TIME) {
      logTime('verification_done', perfStart);
      logTime('fillContent_end', perfStart);
    }
    
  } catch (error) {
    console.error('Failed to fill content:', error);
    throw new Error(`填充内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Clicks the publish button
 */
async function clickPublishButton(): Promise<void> {
  try {
    showInfo('正在发布文章...');
    
    // Wait for publish button to appear
    let publishButton: HTMLButtonElement | null = null;
    
    // Try to find publish button with different methods
    const buttonSelectors = [
      'button:has-text("发布")',
      'button:has-text("发表")',
      'button:has-text("提交")',
      'button[data-testid*="publish"]',
      'button[data-testid*="submit"]',
      '.publish-btn',
      '.submit-btn'
    ];
    
    // First try to find by text content
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent?.trim().toLowerCase() || '';
      if (text.includes('发布') || text.includes('发表') || text.includes('提交') || 
          text.includes('publish') || text.includes('post') || text.includes('submit')) {
        publishButton = button as HTMLButtonElement;
        break;
      }
    }
    
    // If not found, try other selectors
    if (!publishButton) {
      for (const selector of buttonSelectors) {
        try {
          publishButton = await waitForElement<HTMLButtonElement>(selector.replace(':has-text(', '[').replace(')', ']'), 2000);
          if (publishButton) break;
        } catch {
          // Continue to next selector
        }
      }
    }
    
    if (!publishButton) {
      throw new Error('未找到发布按钮');
    }
    
    console.log('Found publish button:', publishButton);
    
    // Click the publish button
    simulateClick(publishButton);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for confirmation dialog and click if present
    setTimeout(async () => {
      try {
        const confirmButtons = document.querySelectorAll('button');
        for (const button of confirmButtons) {
          const text = button.textContent?.trim().toLowerCase() || '';
          if (text.includes('确认') || text.includes('发布') || text.includes('confirm') || text.includes('publish')) {
            console.log('Found confirmation button, clicking:', button);
            simulateClick(button as HTMLButtonElement);
            break;
          }
        }
      } catch (error) {
        console.warn('No confirmation dialog found or error clicking:', error);
      }
    }, 2000);
    
    console.log('Publish button clicked');
    
  } catch (error) {
    console.error('Failed to click publish button:', error);
    throw new Error(`发布失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Main publishing workflow
 */
async function publishArticle(data: ArticleData): Promise<void> {
  try {
    console.log('Starting article publishing workflow...');
    
    // Step 1: Fill title
    await fillTitle(data.title);
    showInfo('标题填充完成');
    
    // Step 2: Fill content
    await fillContent(data.content);
    showInfo('内容填充完成');
    
    // Step 3: Auto publish if enabled
    if (data.autoPublish) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit before publishing
      await clickPublishButton();
      showSuccess(getMessage('publishSuccessToast') || '文章发布成功！');
    } else {
      showSuccess('文章内容已填充完成，请手动发布');
    }
    
    console.log('Article publishing workflow completed');
    
  } catch (error) {
    console.error('Publishing workflow failed:', error);
    showError(getMessage('publishErrorToast') || `发布失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Initializes the Zhihu publisher
 */
async function initialize(): Promise<void> {
  if (isInitialized) {
    console.log('[Zhihu Publisher] Already initialized, skipping...');
    return;
  }
  
  try {
    console.log('[Zhihu Publisher] 🚀 Starting initialization...');
    console.log('[Zhihu Publisher] Current URL:', window.location.href);
    console.log('[Zhihu Publisher] Document ready state:', document.readyState);
    console.log('[Zhihu Publisher] Timestamp:', new Date().toISOString());
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      console.log('[Zhihu Publisher] ⏳ Waiting for DOMContentLoaded...');
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
      console.log('[Zhihu Publisher] ✅ DOMContentLoaded fired');
    } else {
      console.log('[Zhihu Publisher] ✅ Document already ready');
    }
    
    // Get article data from storage
    showInfo('获取文章数据...');
    console.log('[Zhihu Publisher] ⏳ Getting article data from storage...');
    articleData = await getStoredArticleData();
    
    console.log('[Zhihu Publisher] ✅ Received article data:', {
      titleLength: articleData.title.length,
      contentLength: articleData.content.length,
      autoPublish: articleData.autoPublish,
      timestamp: new Date().toISOString()
    });
    
    // Wait a bit for page to fully load
    console.log('[Zhihu Publisher] ⏳ Waiting 2 seconds for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start publishing workflow
    console.log('[Zhihu Publisher] 🚀 Starting publishing workflow...');
    await publishArticle(articleData);
    
    isInitialized = true;
    console.log('[Zhihu Publisher] ✅ Zhihu publisher initialized successfully');
    
  } catch (error) {
    console.error('[Zhihu Publisher] ❌ Failed to initialize Zhihu publisher:', error);
    console.error('[Zhihu Publisher] Error details:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    showError(`初始化失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Checks if we should run on this page
 */
function shouldRun(): boolean {
  console.log('[Zhihu Publisher] 🔍 Checking if should run...');
  console.log('[Zhihu Publisher] Current hostname:', window.location.hostname);
  console.log('[Zhihu Publisher] Current pathname:', window.location.pathname);
  console.log('[Zhihu Publisher] Full URL:', window.location.href);
  
  // Check if we're on Zhihu write page
  const isZhihuWrite = window.location.hostname === 'zhuanlan.zhihu.com' && 
                       window.location.pathname.startsWith('/write');
  
  console.log('[Zhihu Publisher] Is Zhihu write page:', isZhihuWrite);
  return isZhihuWrite;
}

// ===== Paste assist UI =====
function showPasteHint(): void {
  // 根据操作系统显示正确的快捷键提示
  const isMac = /mac/i.test(navigator.platform);
  const modifierKey = isMac ? 'Cmd' : 'Ctrl';
  const hintText = `正文已复制，请在编辑器中按 ${modifierKey}+V 粘贴`;

  // 使用showNotification替代showInfo，确保跳动动画生效
  showNotification(hintText, {
    type: 'info',
    duration: 8000,
    position: 'top-right',
    exclusive: true  // 启用独占模式（跳动动画 + 阻止其他通知）
  });
}

function hidePasteHint(): void {
  // 主动隐藏独占通知（粘贴提示）
  const existingNotifications = document.querySelectorAll('[data-exclusive="true"]');
  existingNotifications.forEach(notification => {
    const element = notification as HTMLElement;
    // 移除独占通知
    element.remove();
  });
}

function waitForUserPaste(expectedLen: number, editor: HTMLElement, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const isMac = /mac/i.test(navigator.platform);
    const modifierKey = isMac ? 'metaKey' : 'ctrlKey';
    const keyCode = 'V';

    const handler = (e: KeyboardEvent) => {
      // 检测 Ctrl+V (Windows/Linux) 或 Cmd+V (Mac)
      if (e[modifierKey] && e.key.toLowerCase() === keyCode.toLowerCase() && !e.altKey && !e.shiftKey) {
        // 立即隐藏粘贴提示并显示粘贴成功提示
        hidePasteHint();
        showSuccess(getMessage('pasteSuccessToast') || '内容粘贴成功');

        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      document.removeEventListener('keydown', handler);
      clearTimeout(timerId);
    };

    document.addEventListener('keydown', handler, { once: false });
    const timerId = setTimeout(() => {
      cleanup();
      reject(new Error('粘贴超时'));
    }, timeout);
  });
}

// Entry point
console.log('[Zhihu Publisher] 🎯 Script loaded at:', new Date().toISOString());
console.log('[Zhihu Publisher] User agent:', navigator.userAgent);

if (shouldRun()) {
  console.log('[Zhihu Publisher] ✅ Should run - starting initialization');
  initialize();
} else {
  console.log('[Zhihu Publisher] ❌ Not running - not on Zhihu write page');
}
