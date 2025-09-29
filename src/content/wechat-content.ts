/**
 * WeChat Article Content Script
 * Extracts article title and content from WeChat public account articles
 */

/* INLINE:settings-manager */
/* INLINE:notify */

let isInitialized = false;
let settings: any = null;

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
 * Extracts article title from the page
 * @returns Article title or empty string
 */
function extractArticleTitle(): string {
  // Try multiple selectors for WeChat article title
  const titleSelectors = [
    '#activity-name',
    '.rich_media_title',
    'h1',
    '.title',
    '[data-role="title"]',
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.textContent?.trim()) {
      return titleElement.textContent.trim();
    }
  }
  
  // Fallback to page title
  return document.title || '';
}

/**
 * Extracts article content HTML from the page
 * @returns Article content HTML
 */
function extractArticleContent(): string {
  // Try multiple selectors for WeChat article content
  const contentSelectors = [
    '#js_content',
    '.rich_media_content',
    '.rich_media_area_primary',
    '.article-content',
    '[data-role="content"]',
  ];
  
  for (const selector of contentSelectors) {
    const contentElement = document.querySelector(selector);
    if (contentElement && contentElement.innerHTML?.trim()) {
      return contentElement.innerHTML.trim();
    }
  }
  
  // Fallback to body content if specific selectors fail
  const bodyContent = document.body.innerHTML;
  return bodyContent || '';
}

/**
 * Creates and injects the publish button
 */
function createPublishButton(): void {
  // Avoid duplicate buttons
  if (document.querySelector('#wechat-to-zhihu-button')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'wechat-to-zhihu-button';
  button.textContent = getMessage('publishButtonText') || '发布到知乎';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #0066CC;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Add hover effects
  button.addEventListener('mouseenter', () => {
    button.style.background = '#0052A3';
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.background = '#0066CC';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 8px rgba(0, 102, 204, 0.3)';
  });
  
  // Add click handler
  button.addEventListener('click', handlePublishClick);
  
  // Inject into page
  document.body.appendChild(button);
  
  console.log('WeChat to Zhihu publish button created');
}

/**
 * Handles publish button click
 */
async function handlePublishClick(): Promise<void> {
  const button = document.querySelector('#wechat-to-zhihu-button') as HTMLButtonElement;
  if (!button) return;
  
  // Show loading state
  const originalText = button.textContent;
  button.textContent = getMessage('publishingToast') || '正在发布...';
  button.disabled = true;
  button.style.background = '#888';
  
  try {
    // Extract article data
    const title = extractArticleTitle();
    const content = extractArticleContent();
    
    if (!title.trim()) {
      throw new Error('无法提取文章标题');
    }
    
    if (!content.trim()) {
      throw new Error('无法提取文章内容');
    }
    
    console.log('Extracted article data:', { 
      titleLength: title.length, 
      contentLength: content.length 
    });
    
    // Send to background script
    const response = await chrome.runtime.sendMessage({
      type: 'WECHAT_ARTICLE_DATA',
      title,
      content,
      autoPublish: settings?.autoPublish || false,
      autoCloseOriginal: settings?.autoCloseOriginal || false,
    });
    
    if (response && response.success) {
      showSuccess(getMessage('publishSuccessToast') || '正在跳转到知乎...');
      
      // Auto close original page if setting is enabled
      if (settings?.autoCloseOriginal) {
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    } else {
      throw new Error(response?.error || '发送到后台失败');
    }
    
  } catch (error) {
    console.error('Failed to publish article:', error);
    showError(getMessage('publishErrorToast') || `发布失败：${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    // Restore button state
    button.textContent = originalText;
    button.disabled = false;
    button.style.background = '#0066CC';
  }
}

/**
 * Initializes the content script
 */
async function initialize(): Promise<void> {
  if (isInitialized) return;
  
  try {
    console.log('Initializing WeChat content script...');
    
    // Load settings
    settings = await getSettings();
    console.log('Settings loaded:', settings);
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    
    // Additional wait for dynamic content
    setTimeout(() => {
      createPublishButton();
    }, 1000);
    
    isInitialized = true;
    console.log('WeChat content script initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize WeChat content script:', error);
  }
}

/**
 * Checks if we should run on this page
 */
function shouldRun(): boolean {
  // Check if we're on a WeChat article page
  const isWeChatDomain = window.location.hostname === 'mp.weixin.qq.com';
  
  if (!isWeChatDomain) {
    return false;
  }
  
  // Additional checks to ensure it's an article page
  const hasArticleIndicators = 
    document.querySelector('#activity-name') ||
    document.querySelector('#js_content') ||
    document.querySelector('.rich_media_title') ||
    document.title.includes('微信公众平台');
  
  return !!hasArticleIndicators;
}

// Entry point
if (shouldRun()) {
  initialize();
} else {
  console.log('WeChat content script not running - not a WeChat article page');
}
