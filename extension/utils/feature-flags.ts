/**
 * Feature flags for gradual rollout of new features
 */

// Check if we should use GraphQL for data fetching
// Can be controlled via environment variable or extension settings
export const useGraphQLData = () => {
  // During development, check environment variable
  if (import.meta.env.VITE_USE_GRAPHQL === 'true') {
    return true;
  }
  
  // In production, could check extension storage for user preference
  // For now, default to false to maintain existing behavior
  return false;
};