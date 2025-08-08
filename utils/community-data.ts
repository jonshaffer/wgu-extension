/**
 * Utility for loading community data in both development and production
 */

// Import JSON data directly for development/fallback
import discordWhitelist from '@/public/discord-whitelist.json';
import redditCommunities from '@/public/reddit-communities.json';
import wguConnectGroups from '@/public/wgu-connect-groups.json';

/**
 * Load community data with configurable behavior via .env files
 */
export async function loadCommunityData() {
  try {
    // Use native WXT environment variables (loaded from .env files)
    // Default to sensible fallbacks if not set
    const useLocalFiles = import.meta.env.WXT_USE_LOCAL_COURSE_FILES === 'true' || 
                         (import.meta.env.WXT_USE_LOCAL_COURSE_FILES === undefined && import.meta.env.DEV);
    const forceExtensionContext = import.meta.env.WXT_FORCE_EXTENSION_CONTEXT === 'true';
    const debugMode = import.meta.env.WXT_DEBUG_MODE === 'true';
    
    if (debugMode) {
      console.log('Community Data Config:');
      console.log('- Use Local Files:', useLocalFiles);
      console.log('- Force Extension Context:', forceExtensionContext);
      console.log('- Development Mode:', import.meta.env.DEV);
      console.log('- Build Mode:', import.meta.env.MODE);
      console.log('- Debug Mode:', debugMode);
      console.log('- WXT_USE_LOCAL_COURSE_FILES:', import.meta.env.WXT_USE_LOCAL_COURSE_FILES);
      console.log('- WXT_FORCE_EXTENSION_CONTEXT:', import.meta.env.WXT_FORCE_EXTENSION_CONTEXT);
    }
    
    // Use local files if configured or in development (unless forced to use extension context)
    if (useLocalFiles && !forceExtensionContext) {
      if (debugMode) console.log('Using imported JSON data (local files)');
      return {
        discordData: discordWhitelist,
        redditData: redditCommunities,
        wguConnectData: wguConnectGroups
      };
    }

    // Try extension context (production or when forced)
    if (debugMode) {
      console.log('Attempting to fetch from extension URLs');
      console.log('Extension ID:', browser.runtime.id);
    }
    
    const discordUrl = browser.runtime.getURL('discord-whitelist.json' as any);
    const redditUrl = browser.runtime.getURL('reddit-communities.json' as any);
    const wguConnectUrl = browser.runtime.getURL('wgu-connect-groups.json' as any);
    
    console.log('Discord URL:', discordUrl);
    console.log('Reddit URL:', redditUrl);
    console.log('WGU Connect URL:', wguConnectUrl);
    
    const [discordData, redditData, wguConnectData] = await Promise.all([
      fetch(discordUrl).then(r => r.json()),
      fetch(redditUrl).then(r => r.json()),
      fetch(wguConnectUrl).then(r => r.json())
    ]);

    console.log('Successfully loaded community data from extension URLs');
    return { discordData, redditData, wguConnectData };
    
  } catch (error) {
    console.warn('Failed to load from extension URLs, falling back to imported data:', error);
    // Fallback to imported data if URL fetching fails
    return {
      discordData: discordWhitelist,
      redditData: redditCommunities,
      wguConnectData: wguConnectGroups
    };
  }
}

/**
 * Interface for community data structure
 */
export interface CommunityData {
  discordData: typeof discordWhitelist;
  redditData: typeof redditCommunities;
  wguConnectData: typeof wguConnectGroups;
}
