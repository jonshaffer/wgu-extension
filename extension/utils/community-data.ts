/**
 * Utility for loading community data
 * Switches between GraphQL API and static files based on feature flag
 */
import { useGraphQLData } from './feature-flags';
import { loadCommunityDataGraphQL as loadGraphQLData } from './community-data-graphql';

export async function loadCommunityData() {
  // Use GraphQL if feature flag is enabled
  if (useGraphQLData()) {
    return loadGraphQLData();
  }
  
  // Legacy mode - return empty data
  console.warn('GraphQL data fetching is disabled. Enable VITE_USE_GRAPHQL to fetch live data.');
  return { 
    unifiedData: { 
      courses: {},
      discordServers: [], 
      communities: {}, 
      reddit: {}, 
      wguConnect: {},
      courseMappings: [] 
    } 
  };
}
