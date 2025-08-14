// Client exports
export { createClient, defaultClient } from './client.js';
export type { ClientConfig } from './client.js';

// Query exports
export * from './queries.js';

// Type exports
export * from './types.js';

// Convenience functions
export { getCourses, getCommunitiesForCourse, searchCommunities } from './api.js';