/**
 * WGU Connect Content Script Integration
 * 
 * Functions to be integrated into the extension's WGU Connect content script
 * Handles SPA tab changes and automatic resource collection
 */

import { extractWGUConnectData, isWGUConnectResourcesPage, WGUConnectResourceData, WGUConnectExtractor } from './wgu-connect-extractor.js';

// Minimal global declaration for Chrome extension typings in this isolated module
declare const chrome: undefined | {
  storage?: { local: { set: (data: any) => Promise<void>; get: (keys: any) => Promise<any> } };
  runtime?: { sendMessage: (msg: any) => Promise<void> };
};

/**
 * Configuration for WGU Connect data collection
 */
export const WGU_CONNECT_CONFIG = {
  // How often to check for data changes (ms)
  COLLECTION_INTERVAL: 15000, // 15 seconds
  
  // Minimum time between collections from same group (ms)
  COLLECTION_COOLDOWN: 120000, // 2 minutes
  
  // Storage key for collected data
  STORAGE_KEY: 'wgu_connect_data',
  
  // URLs that trigger collection
  TRIGGER_PATTERNS: [
    /^https:\/\/wguconnect\.wgu\.edu\/hub\/wgu-connect\/groups\/.+\/resources/,
    /^https:\/\/wguconnect\.wgu\.edu.*resources/
  ]
};

/**
 * Storage manager for collected WGU Connect data
 */
class WGUConnectDataStorage {
  private storageKey = WGU_CONNECT_CONFIG.STORAGE_KEY;
  private collectionHistory = new Map<string, number>();

  /**
   * Save WGU Connect resource data to extension storage
   */
  async saveData(resourceData: WGUConnectResourceData): Promise<void> {
    try {
      // Get existing data
      const existing = await this.loadData();
      
      // Create unique key for this group/tab combination
      const dataKey = `${resourceData.groupId}_${resourceData.activeTab}`;
      
      // Build a reference index for this group's resources by human-friendly path
      const referenceIndex = (resourceData.resources || []).reduce((acc, r) => {
        if (r.referencePath) {
          acc[r.referencePath.key] = {
            tab: r.referencePath.tab,
            title: r.referencePath.title,
            id: r.id,
            link: r.link,
            type: r.type
          };
        }
        return acc;
      }, {} as Record<string, { tab: string; title: string; id: string; link?: string; type: string }>);

      // Update or add resource data
      const updated = {
        ...existing,
        groups: {
          ...existing.groups,
          [resourceData.groupId]: {
            ...existing.groups[resourceData.groupId],
            groupName: resourceData.groupName,
            // Merge/extend existing reference index
            referenceIndex: {
              ...(existing.groups?.[resourceData.groupId]?.referenceIndex || {}),
              ...referenceIndex
            },
            tabs: {
              ...existing.groups[resourceData.groupId]?.tabs,
              [resourceData.activeTab]: {
                resources: resourceData.resources,
                lastUpdated: resourceData.extractedAt,
                url: resourceData.url,
                activeTabId: resourceData.activeTabId,
                activeTabPanelId: resourceData.activeTabPanelId
              }
            }
          }
        },
        lastCollection: new Date().toISOString()
      };

      // Save to extension storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.storageKey]: updated });
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem(this.storageKey, JSON.stringify(updated));
      }

      console.log(`[WGU Extension] Saved WGU Connect data: ${resourceData.groupName} - ${resourceData.activeTab} (${resourceData.resources.length} resources)`);
      
    } catch (error) {
      console.error('[WGU Extension] Failed to save WGU Connect data:', error);
    }
  }

  /**
   * Load all stored WGU Connect data
   */
  async loadData(): Promise<{ groups: Record<string, any>, lastCollection?: string }> {
    try {
      let data;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(this.storageKey);
        data = result[this.storageKey];
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem(this.storageKey);
        data = stored ? JSON.parse(stored) : null;
      }

      return data || { groups: {} };
      
    } catch (error) {
      console.error('[WGU Extension] Failed to load WGU Connect data:', error);
      return { groups: {} };
    }
  }

  /**
   * Check if group/tab was recently collected (within cooldown period)
   */
  isRecentlyCollected(groupId: string, tab: string): boolean {
    const key = `${groupId}_${tab}`;
    const lastCollection = this.collectionHistory.get(key);
    if (!lastCollection) return false;
    
    const timeDiff = Date.now() - lastCollection;
    return timeDiff < WGU_CONNECT_CONFIG.COLLECTION_COOLDOWN;
  }

  /**
   * Record collection time for group/tab
   */
  recordCollection(groupId: string, tab: string): void {
    const key = `${groupId}_${tab}`;
    this.collectionHistory.set(key, Date.now());
  }
}

/**
 * Main WGU Connect data collector class
 */
export class WGUConnectDataCollector {
  private storage = new WGUConnectDataStorage();
  private extractor = new WGUConnectExtractor();
  private isCollecting = false;
  private intervalId: number | null = null;

  /**
   * Initialize the WGU Connect data collector
   */
  async initialize(): Promise<void> {
    console.log('[WGU Extension] Initializing WGU Connect data collector...');
    
    // Check if we're on a WGU Connect resources page
    if (!this.isWGUConnectPage()) {
      return;
    }

    // Start monitoring for data collection
    this.startMonitoring();
    
    // Set up mutation observer for SPA tab changes
    this.setupSPAObserver();
    
    // Collect initial data
    setTimeout(() => this.collectDataIfNeeded(), 2000); // Wait for page load
  }

  /**
   * Check if current page is WGU Connect resources page
   */
  private isWGUConnectPage(): boolean {
    return WGU_CONNECT_CONFIG.TRIGGER_PATTERNS.some(pattern => 
      pattern.test(window.location.href)
    ) || isWGUConnectResourcesPage();
  }

  /**
   * Start monitoring for data collection opportunities
   */
  private startMonitoring(): void {
    // Monitor URL changes (though URL might not change for SPA tabs)
    let currentUrl = window.location.href;
    
    this.intervalId = window.setInterval(() => {
      // Check for URL changes
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (this.isWGUConnectPage()) {
          setTimeout(() => this.collectDataIfNeeded(), 2000);
        }
      }
      
      // Periodic collection check
      this.collectDataIfNeeded();
      
    }, WGU_CONNECT_CONFIG.COLLECTION_INTERVAL);
  }

  /**
   * Setup mutation observer for SPA tab changes
   */
  private setupSPAObserver(): void {
    this.extractor.setupTabChangeObserver((data) => {
      if (data) {
        console.log(`[WGU Extension] Tab changed to: ${data.activeTab}`);
        this.processCollectedData(data);
      }
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.extractor.stopObserver();
  }

  /**
   * Collect WGU Connect data if conditions are met
   */
  private async collectDataIfNeeded(): Promise<void> {
    if (this.isCollecting || !this.isWGUConnectPage()) {
      return;
    }

    try {
      this.isCollecting = true;

      // Extract resource data
      const resourceData = extractWGUConnectData();
      if (!resourceData) {
        return;
      }

      // Check cooldown
      if (this.storage.isRecentlyCollected(resourceData.groupId, resourceData.activeTab)) {
        return;
      }

      // Process the collected data
      await this.processCollectedData(resourceData);

    } catch (error) {
      console.error('[WGU Extension] Error collecting WGU Connect data:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Process and save collected data
   */
  private async processCollectedData(resourceData: WGUConnectResourceData): Promise<void> {
    // Save the data
    await this.storage.saveData(resourceData);
    this.storage.recordCollection(resourceData.groupId, resourceData.activeTab);

    // Notify extension background script
    this.notifyDataCollected(resourceData);
  }

  /**
   * Notify extension that data was collected
   */
  private notifyDataCollected(resourceData: WGUConnectResourceData): void {
    // Send message to extension background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'WGU_CONNECT_DATA_COLLECTED',
        data: {
          groupId: resourceData.groupId,
          groupName: resourceData.groupName,
          activeTab: resourceData.activeTab,
          resourceCount: resourceData.resources.length,
          collectedAt: resourceData.extractedAt
        }
  }).catch((error: any) => {
        // Background script might not be listening, that's OK
        console.log('[WGU Extension] Background script not available:', error.message);
      });
    }

    // Dispatch custom event for other parts of the extension
    window.dispatchEvent(new CustomEvent('wgu-connect-data-collected', {
      detail: resourceData
    }));
  }

  /**
   * Manually trigger data collection
   */
  async collectNow(): Promise<WGUConnectResourceData | null> {
    const resourceData = extractWGUConnectData();
    if (resourceData) {
      await this.processCollectedData(resourceData);
      return resourceData;
    }
    return null;
  }

  /**
   * Force collection of all available tabs
   */
  async collectAllTabs(): Promise<WGUConnectResourceData[]> {
    const collectedData: WGUConnectResourceData[] = [];
    
    // Get all tab buttons
    const tabButtons = document.querySelectorAll('.group-resources-nav button[role="tab"]');
    
    for (const button of Array.from(tabButtons)) {
      // Click tab to activate it
      (button as HTMLElement).click();
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract data from this tab
      const data = extractWGUConnectData();
      if (data) {
        await this.processCollectedData(data);
        collectedData.push(data);
      }
    }
    
    return collectedData;
  }
}

/**
 * Auto-initialize if in browser extension context
 */
export function initializeWGUConnectCollection(): WGUConnectDataCollector {
  const collector = new WGUConnectDataCollector();
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => collector.initialize());
  } else {
    collector.initialize();
  }
  
  return collector;
}

// Export for content script usage
export { WGUConnectDataStorage };