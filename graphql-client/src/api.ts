import { GraphQLClient } from 'graphql-request';
import { GET_COURSES, GET_COMMUNITIES_FOR_COURSE_QUERY, GET_COMMUNITIES_QUERY, GET_COMMUNITIES_FOR_COURSE_QUERY_V2 } from './queries.js';
import type { 
  GetCoursesResponse, 
  GetCommunitiesResponse,
  GetCommunitiesForCourseV2Response,
  Course,
  SearchResult,
  CourseCommunitiesResponse
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
    GET_COMMUNITIES_FOR_COURSE_QUERY,
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
    GET_COMMUNITIES_QUERY,
    { query, limit }
  );
  return data.search.results;
}

/**
 * Get all communities for a course (V2 - includes Discord, Reddit, WGU Connect, and Student Groups)
 */
export async function getCommunitiesForCourseV2(
  client: GraphQLClient,
  courseCode: string
): Promise<CourseCommunitiesResponse> {
  const data = await client.request<GetCommunitiesForCourseV2Response>(
    GET_COMMUNITIES_FOR_COURSE_QUERY_V2,
    { courseCode }
  );
  return data.getCommunitiesForCourse;
}