/**
 * TypeScript types that match the GraphQL schema
 * These are exported for use by consumers of the API
 */

// Base types
export interface Course {
  code: string;
  courseCode?: string; // For backward compatibility
  name: string;
  description?: string;
  competencyUnits?: number;
  units?: number; // For backward compatibility
  level?: string;
  discord?: DiscordServer[];
  reddit?: RedditCommunity[];
  wguConnect?: WguConnectGroup;
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

// Community types
export interface DiscordServer {
  id: string;
  name: string;
  description?: string;
  inviteUrl: string;
  memberCount?: number;
  channels?: DiscordChannel[];
  tags: string[];
  verified: boolean;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: string;
  associatedCourses?: string[];
}

export interface RedditCommunity {
  id: string;
  name: string;
  description?: string;
  url: string;
  subscriberCount?: number;
  type: string;
  associatedPrograms?: string[];
  associatedCourses?: string[];
  tags: string[];
  active: boolean;
}

export interface WguConnectGroup {
  id: string;
  courseCode: string;
  name: string;
  description?: string;
  resources: WguConnectResource[];
  memberCount?: number;
}

export interface WguConnectResource {
  id: string;
  title: string;
  type: string;
  url: string;
  upvotes?: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  description?: string;
  type: string;
  contactEmail?: string;
  websiteUrl?: string;
  tags: string[];
  active: boolean;
}

export interface CourseCommunitiesResponse {
  courseCode: string;
  courseName?: string;
  discord: DiscordServer[];
  reddit: RedditCommunity[];
  wguConnect?: WguConnectGroup;
  studentGroups: StudentGroup[];
}

// Enum for community types
export type CommunityType = "discord" | "reddit" | "wgu-connect" | "student-group";
