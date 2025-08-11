/**
 * Discord Content Script Integration
 * 
 * Functions to be integrated into the extension's Discord content script
 * Handles automatic detection and collection of WGU Discord data
 */

import { extractDiscordData, isWGUDiscordServer, DiscordServerData } from './discord-extractor.js';

/**
 * Configuration for Discord data collection
 */
export const DISCORD_CONFIG = {
  // How often to check for Discord data (ms)
  COLLECTION_INTERVAL: 30000, // 30 seconds
  
  // Minimum time between collections from same server (ms)
  COLLECTION_COOLDOWN: 300000, // 5 minutes
  
  // Storage key for collected data
  STORAGE_KEY: 'wgu_discord_data',
  
  // URLs that trigger collection
  TRIGGER_PATTERNS: [
    /^https:\/\/discord\.com\/channels\/\d+/,
    /^https:\/\/discordapp\.com\/channels\/\d+/
  ]
};

/**
 * Storage manager for collected Discord data
 */
class DiscordDataStorage {
  private storageKey = DISCORD_CONFIG.STORAGE_KEY;
  private collectionHistory = new Map<string, number>();

  /**
   * Save Discord server data to extension storage
   */
  async saveData(serverData: DiscordServerData): Promise<void> {
    try {
      // Get existing data
      const existing = await this.loadData();
      
      // Update or add server data
      const updated = {
        ...existing,
        servers: {
          ...existing.servers,
          [serverData.serverId]: {
            ...serverData,
            lastUpdated: serverData.extractedAt
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

      console.log(`[WGU Extension] Saved Discord data for server: ${serverData.serverName}`);
      
    } catch (error) {
      console.error('[WGU Extension] Failed to save Discord data:', error);
    }
  }

  /**
   * Load all stored Discord data
   */
  async loadData(): Promise<{ servers: Record<string, DiscordServerData>, lastCollection?: string }> {
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

      return data || { servers: {} };
      
    } catch (error) {
      console.error('[WGU Extension] Failed to load Discord data:', error);
      return { servers: {} };
    }
  }

  /**
   * Check if server was recently collected (within cooldown period)
   */
  isRecentlyCollected(serverId: string): boolean {
    const lastCollection = this.collectionHistory.get(serverId);
    if (!lastCollection) return false;
    
    const timeDiff = Date.now() - lastCollection;
    return timeDiff < DISCORD_CONFIG.COLLECTION_COOLDOWN;
  }

  /**
   * Record collection time for server
   */
  recordCollection(serverId: string): void {
    this.collectionHistory.set(serverId, Date.now());
  }
}

/**
 * Main Discord data collector class
 */
export class DiscordDataCollector {
  private storage = new DiscordDataStorage();
  private isCollecting = false;
  private intervalId: number | null = null;

  /**
   * Initialize the Discord data collector
   */
  async initialize(): Promise<void> {
    console.log('[WGU Extension] Initializing Discord data collector...');
    
    // Check if we're on a Discord page
    if (!this.isDiscordPage()) {
      return;
    }

    // Start monitoring for Discord data
    this.startMonitoring();
    
    // Collect initial data if on WGU server
    setTimeout(() => this.collectDataIfNeeded(), 2000); // Wait for page load
  }

  /**
   * Check if current page is Discord
   */
  private isDiscordPage(): boolean {
    return DISCORD_CONFIG.TRIGGER_PATTERNS.some(pattern => 
      pattern.test(window.location.href)
    );
  }

  /**
   * Start monitoring for Discord data collection opportunities
   */
  private startMonitoring(): void {
    // Monitor URL changes
    let currentUrl = window.location.href;
    
    this.intervalId = window.setInterval(() => {
      // Check for URL changes (SPA navigation)
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (this.isDiscordPage()) {
          setTimeout(() => this.collectDataIfNeeded(), 2000); // Wait for new page load
        }
      }
      
      // Periodic collection check
      this.collectDataIfNeeded();
      
    }, DISCORD_CONFIG.COLLECTION_INTERVAL);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Collect Discord data if conditions are met
   */
  private async collectDataIfNeeded(): Promise<void> {
    if (this.isCollecting) return;

    try {
      this.isCollecting = true;

      // Check if this is a WGU-related Discord server
      if (!isWGUDiscordServer()) {
        return;
      }

      // Extract server data
      const serverData = extractDiscordData();
      if (!serverData) {
        return;
      }

      // Check cooldown
      if (this.storage.isRecentlyCollected(serverData.serverId)) {
        return;
      }

      // Save the data
      await this.storage.saveData(serverData);
      this.storage.recordCollection(serverData.serverId);

      // Notify extension background script
      this.notifyDataCollected(serverData);

    } catch (error) {
      console.error('[WGU Extension] Error collecting Discord data:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  /**
   * Notify extension that data was collected
   */
  private notifyDataCollected(serverData: DiscordServerData): void {
    // Send message to extension background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'DISCORD_DATA_COLLECTED',
        data: {
          serverId: serverData.serverId,
          serverName: serverData.serverName,
          channelCount: serverData.channels.length,
          memberCount: serverData.members.length,
          collectedAt: serverData.extractedAt
        }
      }).catch(error => {
        // Background script might not be listening, that's OK
        console.log('[WGU Extension] Background script not available:', error.message);
      });
    }

    // Also dispatch custom event for other parts of the extension
    window.dispatchEvent(new CustomEvent('wgu-discord-data-collected', {
      detail: serverData
    }));
  }

  /**
   * Manually trigger data collection
   */
  async collectNow(): Promise<DiscordServerData | null> {
    const serverData = extractDiscordData();
    if (serverData && isWGUDiscordServer()) {
      await this.storage.saveData(serverData);
      this.notifyDataCollected(serverData);
      return serverData;
    }
    return null;
  }
}

/**
 * Auto-initialize if in browser extension context
 */
export function initializeDiscordCollection(): DiscordDataCollector {
  const collector = new DiscordDataCollector();
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => collector.initialize());
  } else {
    collector.initialize();
  }
  
  return collector;
}

// Export for content script usage
export { DiscordDataStorage };