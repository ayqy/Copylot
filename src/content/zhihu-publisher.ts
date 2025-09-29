/**
 * Zhihu Publisher Content Script
 * Automatically fills article title and content into Zhihu editor
 */

/* INLINE:dom */
/* INLINE:events */
/* INLINE:notify */

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
 * Waits for article data to be available
 * @returns Promise that resolves with article data
 */
function waitForArticleData(): Promise<ArticleData> {
  return new Promise((resolve, reject) => {
    // Check if data is already available
    const existingData = (window as any).wechatToZhihuData;
    if (existingData) {
      resolve(existingData);
      return;
    }
    
    // Set up timeout
    const timeout = setTimeout(() => {
      window.removeEventListener('wechatToZhihuDataReady', eventListener);
      reject(new Error('Article data not received within timeout'));
    }, 10000);
    
    // Listen for data ready event
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      clearTimeout(timeout);
      window.removeEventListener('wechatToZhihuDataReady', eventListener);
      resolve(customEvent.detail);
    };
    
    window.addEventListener('wechatToZhihuDataReady', eventListener);
  });
}

/**
 * Fills the article title
 * @param title The title to fill
 */
async function fillTitle(title: string): Promise<void> {
  try {
    showInfo('正在填充标题...');
    
    // Wait for title input to appear
    const titleInput = await waitForElement<HTMLInputElement | HTMLTextAreaElement>('input[placeholder*="标题"], textarea[placeholder*="标题"], input[placeholder*="title"], textarea[placeholder*="title"]', 15000);
    
    if (!titleInput) {
      throw new Error('未找到标题输入框');
    }
    
    console.log('Found title input:', titleInput);
    
    // Focus and fill title
    simulateFocus(titleInput);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    simulateType(titleInput, title);
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    showInfo('正在填充内容...');
    
    // Wait for content editor to appear
    // Try multiple selectors for different types of editors
    const editorSelectors = [
      '.ProseMirror',
      '.DraftEditor-editorContainer [contenteditable="true"]',
      '.DraftEditor-root [contenteditable="true"]',
      '[contenteditable="true"]',
      '.ql-editor',
      '.note-editable',
      '.editor-content',
      '.rich-editor [contenteditable="true"]'
    ];
    
    let contentEditor: HTMLElement | null = null;
    
    for (const selector of editorSelectors) {
      try {
        contentEditor = await waitForVisibleElement<HTMLElement>(selector, 3000);
        if (contentEditor) {
          console.log('Found content editor with selector:', selector);
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    if (!contentEditor) {
      throw new Error('未找到内容编辑器');
    }
    
    console.log('Found content editor:', contentEditor);
    
    // Focus the editor
    simulateFocus(contentEditor);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to paste content
    simulatePaste(contentEditor, content);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify content was inserted
    if (contentEditor.innerHTML.length < 100) {
      console.warn('Content may not have been inserted properly, trying alternative method');
      
      // Alternative method: set innerHTML directly
      contentEditor.innerHTML = content;
      
      // Dispatch input event to notify editor
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
      });
      contentEditor.dispatchEvent(inputEvent);
    }
    
    console.log('Content filled successfully');
    
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
  if (isInitialized) return;
  
  try {
    console.log('Initializing Zhihu publisher...');
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    
    // Wait for article data
    showInfo('等待文章数据...');
    articleData = await waitForArticleData();
    
    console.log('Received article data:', {
      titleLength: articleData.title.length,
      contentLength: articleData.content.length,
      autoPublish: articleData.autoPublish
    });
    
    // Wait a bit for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start publishing workflow
    await publishArticle(articleData);
    
    isInitialized = true;
    console.log('Zhihu publisher initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Zhihu publisher:', error);
    showError(`初始化失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * Checks if we should run on this page
 */
function shouldRun(): boolean {
  // Check if we're on Zhihu write page
  const isZhihuWrite = window.location.hostname === 'zhuanlan.zhihu.com' && 
                       window.location.pathname.startsWith('/write');
  
  return isZhihuWrite;
}

// Entry point
if (shouldRun()) {
  initialize();
} else {
  console.log('Zhihu publisher not running - not on Zhihu write page');
}
