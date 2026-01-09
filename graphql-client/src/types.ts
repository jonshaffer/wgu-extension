/**
 * Re-export GraphQL types from the functions package
 */
export {
  // Base types
  Course,
  CourseList,
  SearchResult,
  SearchResponse,
  DegreePlan,
  DegreePlanList,
  DiscordServer,
  RedditCommunity,
  WguConnectGroup,
  StudentGroup,
  CourseCommunitiesResponse,

  // Response types
  GetCoursesResponse,
  GetCommunitiesResponse,
  GetDegreePlansResponse,

  // Enum types
  CommunityType,
} from "@wgu-extension/functions/graphql";

// Import types for use in interface definition
import type {SearchResult as SR, CommunityType as CT, CourseCommunitiesResponse as CCR} from "@wgu-extension/functions/graphql";

// Additional convenience types
export interface Community extends SR {
  type: CT;
}

export interface GetCommunitiesForCourseV2Response {
  getCommunitiesForCourse: CCR;
}
