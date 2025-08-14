import { GraphQLClient } from 'graphql-request';
import { GET_COURSES, GET_COMMUNITIES_FOR_COURSE, GET_COMMUNITIES } from './queries.js';
import type { 
  GetCoursesResponse, 
  GetCommunitiesResponse,
  Course,
  SearchResult
} from './types.js';

/**
 * Convenience function to get courses
 */
export async function getCourses(
  client: GraphQLClient,
  limit = 50,
  offset = 0
): Promise<Course[]> {
  const data = await client.request<GetCoursesResponse>(GET_COURSES, { limit, offset });
  return data.courses.items;
}

/**
 * Convenience function to get communities for a course
 */
export async function getCommunitiesForCourse(
  client: GraphQLClient,
  courseCode: string
): Promise<SearchResult[]> {
  const data = await client.request<GetCommunitiesResponse>(
    GET_COMMUNITIES_FOR_COURSE,
    { courseCode }
  );
  return data.search.results;
}

/**
 * Convenience function to search communities
 */
export async function searchCommunities(
  client: GraphQLClient,
  query: string,
  limit = 100
): Promise<SearchResult[]> {
  const data = await client.request<GetCommunitiesResponse>(
    GET_COMMUNITIES,
    { query, limit }
  );
  return data.search.results;
}