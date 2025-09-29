/**
 * Article Data Manager
 * Manages article data storage and retrieval using chrome.storage.local
 */

export interface StoredArticleData {
  id: string;
  title: string;
  content: string;
  autoPublish: boolean;
  timestamp: number;
  sourceTabId?: number;
}

export interface ArticleDataStorage {
  [key: string]: StoredArticleData;
}

const STORAGE_KEY_PREFIX = 'wechat_to_zhihu_';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_STORED_ITEMS = 10; // Maximum number of items to keep

/**
 * Generates a unique ID for article data
 * @returns Unique identifier string
 */
export function generateDataId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${STORAGE_KEY_PREFIX}${timestamp}_${random}`;
}

/**
 * Stores article data in chrome.storage.local
 * @param articleData The article data to store
 * @returns Promise that resolves to the storage key
 */
export async function storeArticleData(articleData: Omit<StoredArticleData, 'id' | 'timestamp'>): Promise<string> {
  try {
    const id = generateDataId();
    const dataToStore: StoredArticleData = {
      ...articleData,
      id,
      timestamp: Date.now()
    };

    console.log('[Article Data Manager] 💾 Storing article data:', {
      id,
      titleLength: articleData.title.length,
      contentLength: articleData.content.length,
      autoPublish: articleData.autoPublish,
      timestamp: new Date(dataToStore.timestamp).toISOString()
    });

    // Store the data
    await chrome.storage.local.set({
      [id]: dataToStore
    });

    // Clean expired data and limit storage
    await cleanExpiredData();
    await limitStoredItems();

    console.log('[Article Data Manager] ✅ Article data stored successfully with key:', id);
    return id;

  } catch (error) {
    console.error('[Article Data Manager] ❌ Failed to store article data:', error);
    throw new Error(`Failed to store article data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the latest article data from storage
 * @param deleteAfterRead Whether to delete the data after reading (default: true)
 * @returns Promise that resolves to the latest article data or null
 */
export async function getLatestArticleData(deleteAfterRead: boolean = true): Promise<StoredArticleData | null> {
  try {
    console.log('[Article Data Manager] 🔍 Getting latest article data...');

    // Get all stored data
    const allData = await chrome.storage.local.get(null);
    
    // Filter article data by key prefix
    const articleDataEntries = Object.entries(allData)
      .filter(([key]) => key.startsWith(STORAGE_KEY_PREFIX))
      .map(([key, value]) => ({ key, data: value as StoredArticleData }));

    console.log('[Article Data Manager] 📊 Found stored items:', articleDataEntries.length);

    if (articleDataEntries.length === 0) {
      console.log('[Article Data Manager] ❌ No article data found in storage');
      return null;
    }

    // Sort by timestamp (newest first)
    articleDataEntries.sort((a, b) => b.data.timestamp - a.data.timestamp);
    
    const latestEntry = articleDataEntries[0];
    const latestData = latestEntry.data;

    console.log('[Article Data Manager] ✅ Retrieved latest article data:', {
      id: latestData.id,
      titleLength: latestData.title.length,
      contentLength: latestData.content.length,
      autoPublish: latestData.autoPublish,
      timestamp: new Date(latestData.timestamp).toISOString(),
      age: `${Math.round((Date.now() - latestData.timestamp) / 1000)}s ago`
    });

    // Delete the data after reading if requested
    if (deleteAfterRead) {
      console.log('[Article Data Manager] 🗑️ Deleting data after read:', latestEntry.key);
      await chrome.storage.local.remove(latestEntry.key);
    }

    return latestData;

  } catch (error) {
    console.error('[Article Data Manager] ❌ Failed to get article data:', error);
    throw new Error(`Failed to get article data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleans expired article data (older than 24 hours)
 * @returns Promise that resolves to the number of cleaned items
 */
export async function cleanExpiredData(): Promise<number> {
  try {
    console.log('[Article Data Manager] 🧹 Starting cleanup of expired data...');

    const now = Date.now();
    const allData = await chrome.storage.local.get(null);
    
    // Find expired items
    const expiredKeys: string[] = [];
    
    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const data = value as StoredArticleData;
        const age = now - data.timestamp;
        
        if (age > EXPIRY_TIME) {
          expiredKeys.push(key);
          console.log('[Article Data Manager] 🗑️ Found expired item:', {
            key,
            age: `${Math.round(age / (60 * 60 * 1000))} hours`,
            timestamp: new Date(data.timestamp).toISOString()
          });
        }
      }
    }

    // Remove expired items
    if (expiredKeys.length > 0) {
      await chrome.storage.local.remove(expiredKeys);
      console.log('[Article Data Manager] ✅ Cleaned up expired items:', expiredKeys.length);
    } else {
      console.log('[Article Data Manager] ✅ No expired items found');
    }

    return expiredKeys.length;

  } catch (error) {
    console.error('[Article Data Manager] ❌ Failed to clean expired data:', error);
    return 0;
  }
}

/**
 * Limits the number of stored items to prevent storage bloat
 * @returns Promise that resolves when cleanup is complete
 */
async function limitStoredItems(): Promise<void> {
  try {
    const allData = await chrome.storage.local.get(null);
    
    // Get all article data entries sorted by timestamp (newest first)
    const articleDataEntries = Object.entries(allData)
      .filter(([key]) => key.startsWith(STORAGE_KEY_PREFIX))
      .map(([key, value]) => ({ key, data: value as StoredArticleData }))
      .sort((a, b) => b.data.timestamp - a.data.timestamp);

    // Remove excess items (keep only MAX_STORED_ITEMS)
    if (articleDataEntries.length > MAX_STORED_ITEMS) {
      const itemsToRemove = articleDataEntries
        .slice(MAX_STORED_ITEMS)
        .map(entry => entry.key);

      await chrome.storage.local.remove(itemsToRemove);
      console.log('[Article Data Manager] 🗑️ Removed excess items to maintain limit:', itemsToRemove.length);
    }

  } catch (error) {
    console.error('[Article Data Manager] ❌ Failed to limit stored items:', error);
  }
}

/**
 * Gets all stored article data (for debugging)
 * @returns Promise that resolves to all stored article data
 */
export async function getAllStoredData(): Promise<StoredArticleData[]> {
  try {
    const allData = await chrome.storage.local.get(null);
    
    return Object.entries(allData)
      .filter(([key]) => key.startsWith(STORAGE_KEY_PREFIX))
      .map(([, value]) => value as StoredArticleData)
      .sort((a, b) => b.timestamp - a.timestamp);

  } catch (error) {
    console.error('[Article Data Manager] ❌ Failed to get all stored data:', error);
    return [];
  }
}

/**
 * Clears all stored article data (for debugging/cleanup)
 * @returns Promise that resolves when all data is cleared
 */
export async function clearAllData(): Promise<void> {
  try {
    const allData = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log('[Article Data Manager] 🗑️ Cleared all stored article data:', keysToRemove.length);
    }

  } catch (error) {
    console.error('[Article Data Manager] ❌ Failed to clear all data:', error);
  }
}
