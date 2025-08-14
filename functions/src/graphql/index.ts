/**
 * GraphQL schema and types exports
 * This module is published for use by API consumers
 */

// Export the raw schema
export { typeDefs } from './typeDefs.js';

// Export resolvers
export { resolvers } from './resolvers.js';
export { searchResolver } from './search-resolver.js';

// Export TypeScript types
export * from './types.js';

// Export commonly used queries as strings for convenience
export const queries = {
  GET_COURSES: `
    query GetCourses($limit: Int = 50, $offset: Int = 0) {
      courses(limit: $limit, offset: $offset) {
        items {
          courseCode
          name
          description
          units
          level
        }
        totalCount
      }
    }
  `,
  
  GET_COMMUNITIES: `
    query GetCommunities($query: String = "", $limit: Int = 100) {
      search(query: $query, limit: $limit) {
        results {
          type
          id
          title
          description
          url
          courseCode
          tags
        }
        totalCount
      }
    }
  `,
  
  GET_COMMUNITIES_FOR_COURSE: `
    query GetCommunitiesForCourse($courseCode: String!) {
      search(query: $courseCode, limit: 50) {
        results {
          type
          id
          title
          description
          url
          courseCode
          tags
        }
        totalCount
      }
    }
  `,
  
  GET_DEGREE_PLANS: `
    query GetDegreePlans($limit: Int = 50, $offset: Int = 0) {
      degreePlans(limit: $limit, offset: $offset) {
        items {
          id
          name
          description
          totalCUs
          courses
        }
        totalCount
      }
    }
  `
};