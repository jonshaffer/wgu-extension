/**
 * TypeScript types that match the GraphQL schema
 * These are exported for use by consumers of the API
 */

// Base types
export interface Course {
  courseCode: string;
  name: string;
  description?: string;
  units?: number;
  level?: string;
}

export interface CourseList {
  items: Course[];
  totalCount: number;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description?: string;
  url?: string;
  courseCode?: string;
  tags?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

export interface DegreePlan {
  id: string;
  name: string;
  description?: string;
  totalCUs?: number;
  courses?: string[];
}

export interface DegreePlanList {
  items: DegreePlan[];
  totalCount: number;
}

// Query types
export interface Query {
  ping: string;
  search(args: { query: string; limit?: number }): SearchResponse;
  courses(args: { limit?: number; offset?: number }): CourseList;
  degreePlans(args: { limit?: number; offset?: number }): DegreePlanList;
}

// Response types for GraphQL operations
export interface GetCoursesResponse {
  courses: CourseList;
}

export interface GetCommunitiesResponse {
  search: SearchResponse;
}

export interface GetDegreePlansResponse {
  degreePlans: DegreePlanList;
}

// Enum for community types
export type CommunityType = 'discord' | 'reddit' | 'wgu-connect' | 'student-group';