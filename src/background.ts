import { getSettings } from './shared/settings-manager';

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('WeChat to Zhihu Publisher extension installed/updated:', details.reason);

  // Initialize settings on first install
  if (details.reason === 'install') {
    console.log('First install - initializing settings...');
    await getSettings(); // This will create default settings
    console.log('Settings initialized successfully');
  }

  // Handle updates
  if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    console.log(`Updated from version ${previousVersion}`);

    // Ensure settings are compatible with new version
    await getSettings(); // This will merge with defaults if needed
    console.log('Settings migrated successfully');
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('WeChat to Zhihu Publisher extension started');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.debug('Background received message:', message, 'from', sender);

  // Handle different message types
  switch (message.type) {
    case 'WECHAT_ARTICLE_DATA':
      handleWeChatArticleData(message, sender, sendResponse);
      return true; // Indicate async response

    case 'ping':
      sendResponse({ success: true, message: 'pong' });
      break;

    case 'error-report':
      console.error('Error reported from content script:', message.error);
      sendResponse({ success: true });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true;
});

/**
 * Handles WeChat article data and creates Zhihu tab
 */
async function handleWeChatArticleData(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
  try {
    const { title, content, autoPublish, autoCloseOriginal } = message;
    
    console.log('Received WeChat article data:', {
      titleLength: title?.length || 0,
      contentLength: content?.length || 0,
      autoPublish,
      autoCloseOriginal
    });
    
    if (!title || !content) {
      throw new Error('Missing article title or content');
    }
    
    // Create new Zhihu tab
    const zhihuTab = await chrome.tabs.create({
      url: 'https://zhuanlan.zhihu.com/write',
      active: true
    });
    
    if (!zhihuTab.id) {
      throw new Error('Failed to create Zhihu tab');
    }
    
    // Wait for tab to load and inject publisher script
    const tabUpdateListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (tabId === zhihuTab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);
        
        // Inject the publisher script with article data
        chrome.scripting.executeScript({
          target: { tabId: zhihuTab.id! },
          func: injectArticleData,
          args: [{ title, content, autoPublish }]
        }).catch(error => {
          console.error('Failed to inject publisher script:', error);
        });
      }
    };
    
    chrome.tabs.onUpdated.addListener(tabUpdateListener);
    
    // Auto close original tab if setting is enabled
    if (autoCloseOriginal && sender.tab?.id) {
      setTimeout(() => {
        chrome.tabs.remove(sender.tab!.id!).catch(error => {
          console.warn('Failed to close original tab:', error);
        });
      }, 2000);
    }
    
    sendResponse({ success: true });
    
  } catch (error) {
    console.error('Failed to handle WeChat article data:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Function to be injected into Zhihu page
 */
function injectArticleData(articleData: { title: string; content: string; autoPublish: boolean }) {
  // This function will be executed in the Zhihu page context
  console.log('Article data injected into Zhihu page:', {
    titleLength: articleData.title.length,
    contentLength: articleData.content.length,
    autoPublish: articleData.autoPublish
  });
  
  // Store data in window for zhihu-publisher content script to access
  (window as any).wechatToZhihuData = articleData;
  
  // Dispatch custom event to notify content script
  window.dispatchEvent(new CustomEvent('wechatToZhihuDataReady', {
    detail: articleData
  }));
}

// Handle storage changes for cross-device sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.copilot_settings && namespace === 'sync') {
    console.debug('Settings synced from another device');
  }
});

console.log('WeChat to Zhihu Publisher background script loaded');
