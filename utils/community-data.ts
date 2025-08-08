/**
 * Utility for loading community data in both development and production
 */

// Import unified JSON data directly for development/fallback
import unifiedCommunityData from '@/public/data/unified-community-data.json';

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
      if (debugMode) console.log('Using unified community data (local files)');
      return {
        unifiedData: unifiedCommunityData
      };
    }

    // Try extension context (production or when forced)
    if (debugMode) {
      console.log('Attempting to fetch unified data from extension URLs');
      console.log('Extension ID:', browser.runtime.id);
    }
    
    const unifiedUrl = browser.runtime.getURL('data/unified-community-data.json' as any);
    
    console.log('Unified data URL:', unifiedUrl);
    
    const unifiedData = await fetch(unifiedUrl).then(r => r.json());

    console.log('Successfully loaded unified community data from extension URLs');
    return { unifiedData };
    
  } catch (error) {
    console.warn('Failed to load from extension URLs, falling back to imported unified data:', error);
    // Fallback to imported data if URL fetching fails
    return {
      unifiedData: unifiedCommunityData
    };
  }
}

/**
 * Interface for community data structure
 */
export interface CommunityData {
  unifiedData: typeof unifiedCommunityData;
}
