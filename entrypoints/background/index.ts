import { dataCollectionEnabled, discordData, wguConnectData, extensionVersion } from '../../utils/storage';

export default defineBackground(() => {
  console.log('WGU Extension: Background script loaded');

  // Handle data collection messages from content scripts
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    try {
      // Check if data collection is enabled
      const collectionEnabled = await dataCollectionEnabled.getValue();
      if (!collectionEnabled) {
        console.log('WGU Extension: Data collection disabled, ignoring message');
        return;
      }

      switch (message.type) {
        case 'DISCORD_DATA_COLLECTED':
          await handleDiscordDataCollected(message.data, sender);
          break;
        
        case 'WGU_CONNECT_DATA_COLLECTED':
          await handleWGUConnectDataCollected(message.data, sender);
          break;
        
        case 'GET_COLLECTION_STATUS':
          sendResponse({
            dataCollectionEnabled: collectionEnabled,
            lastDiscordCollection: (await discordData.getValue()).lastCollection,
            lastWGUConnectCollection: (await wguConnectData.getValue()).lastCollection
          });
          break;
        
        default:
          console.log('WGU Extension: Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('WGU Extension: Error handling message:', error);
    }
  });

  // Handle Discord data collection
  async function handleDiscordDataCollected(data: any, sender: any) {
    console.log('WGU Extension: Discord data collected from tab', sender.tab?.id, data);
    
    // Log collection event
    logDataCollection('discord', data);
  }

  // Handle WGU Connect data collection
  async function handleWGUConnectDataCollected(data: any, sender: any) {
    console.log('WGU Extension: WGU Connect data collected from tab', sender.tab?.id, data);
    
    // Log collection event
    logDataCollection('wgu-connect', data);
  }

  // Log data collection events for monitoring
  function logDataCollection(source: string, data: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      source,
      summary: {
        ...data,
        // Remove sensitive data for logging
        details: undefined,
        resources: data.resources ? `${data.resources.length} items` : undefined
      }
    };
    
    console.log('WGU Extension: Data collection logged:', logEntry);
  }

  // Handle extension installation and updates
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log('WGU Extension: Installation event:', details);
    
    if (details.reason === 'install') {
      console.log('WGU Extension: First-time installation');
      
      // Set initial version
      const manifest = browser.runtime.getManifest();
      await extensionVersion.setValue(manifest.version);
      
      // Open options page for first-time setup
      browser.tabs.create({
        url: browser.runtime.getURL('options.html')
      });
    } else if (details.reason === 'update') {
      console.log('WGU Extension: Updated to new version');
      
      // Update version
      const manifest = browser.runtime.getManifest();
      await extensionVersion.setValue(manifest.version);
    }
  });

  // Handle extension startup
  browser.runtime.onStartup.addListener(() => {
    console.log('WGU Extension: Extension started');
  });

  console.log('WGU Extension: Background script initialized');
});