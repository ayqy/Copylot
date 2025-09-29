import { getSettings } from './shared/settings-manager';
import { storeArticleData, cleanExpiredData } from './shared/article-data-manager';

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

  // Clean expired article data on install/update
  try {
    const cleanedCount = await cleanExpiredData();
    console.log('Cleaned expired article data on install/update:', cleanedCount);
  } catch (error) {
    console.warn('Failed to clean expired data on install/update:', error);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('WeChat to Zhihu Publisher extension started');

  // Clean expired article data on startup
  try {
    const cleanedCount = await cleanExpiredData();
    console.log('Cleaned expired article data on startup:', cleanedCount);
  } catch (error) {
    console.warn('Failed to clean expired data on startup:', error);
  }
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
    console.log('[Background] 📥 Received WeChat article data message:', message);
    console.log('[Background] Sender info:', sender);
    
    const { title, content, autoPublish, autoCloseOriginal } = message;
    
    console.log('[Background] 📊 Article data received:', {
      titleLength: title?.length || 0,
      contentLength: content?.length || 0,
      autoPublish,
      autoCloseOriginal,
      timestamp: new Date().toISOString()
    });
    
    if (!title || !content) {
      console.error('[Background] ❌ Missing article title or content');
      throw new Error('Missing article title or content');
    }
    
    // Store article data in chrome.storage.local
    console.log('[Background] 💾 Storing article data...');
    const storageKey = await storeArticleData({
      title,
      content,
      autoPublish,
      sourceTabId: sender.tab?.id
    });
    
    console.log('[Background] ✅ Article data stored with key:', storageKey);
    
    // Create new Zhihu tab
    console.log('[Background] 🚀 Creating new Zhihu tab...');
    const zhihuTab = await chrome.tabs.create({
      url: 'https://zhuanlan.zhihu.com/write',
      active: true
    });
    
    console.log('[Background] 📄 Zhihu tab created:', zhihuTab);
    
    if (!zhihuTab.id) {
      console.error('[Background] ❌ Failed to create Zhihu tab - no tab ID');
      throw new Error('Failed to create Zhihu tab');
    }
    
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


// Handle storage changes for cross-device sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.copilot_settings && namespace === 'sync') {
    console.debug('Settings synced from another device');
  }
});

console.log('WeChat to Zhihu Publisher background script loaded');
