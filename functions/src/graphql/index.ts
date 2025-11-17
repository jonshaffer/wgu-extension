/**
 * GraphQL schema and types exports
 * This module is published for use by API consumers
 */

// Export the raw schema
export {typeDefs} from "./typeDefs.js";

// Export resolvers
export {resolvers} from "./resolvers.js";
export {searchResolver} from "./search-resolver.js";

// Export TypeScript types
export * from "./types.js";

// Export all queries from the allowlist
export * from "./queries.js";

// Re-export legacy queries object for backwards compatibility
import {
  GET_COURSES,
  GET_COMMUNITIES,
  GET_COMMUNITIES_FOR_COURSE,
  GET_DEGREE_PLANS,
  GET_COMMUNITIES_FOR_COURSE_V2,
  GET_COURSE_BY_CODE,
} from "./queries.js";
export const queries = {
  GET_COURSES,
  GET_COMMUNITIES,
  GET_COMMUNITIES_FOR_COURSE,
  GET_DEGREE_PLANS,
};

// Export all query constants explicitly for bundler compatibility
// (Rollup/Vite may not properly resolve wildcard re-exports)
export {
  GET_COURSES,
  GET_COMMUNITIES,
  GET_COMMUNITIES_FOR_COURSE,
  GET_COMMUNITIES_FOR_COURSE_V2,
  GET_DEGREE_PLANS,
  GET_COURSE_BY_CODE,
};
