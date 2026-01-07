/**
 * GraphQL types for the site
 * Re-exports from shared packages and adds site-specific types
 */

// Import shared types from packages
import type {
  Course,
  CourseList,
  SearchResult,
  SearchResponse,
  DegreePlan,
  DegreePlanList,
  GetCoursesResponse,
  GetCommunitiesResponse,
  GetDegreePlansResponse,
  CommunityType,
} from "../../../functions/lib/graphql/index";

// Re-export shared types
export type {
  Course,
  CourseList,
  SearchResult,
  SearchResponse,
  DegreePlan,
  DegreePlanList,
  GetCoursesResponse,
  GetCommunitiesResponse,
  GetDegreePlansResponse,
  CommunityType,
};

// Site-specific types for extended queries
export interface DiscordServer {
  serverId: string;
  name: string;
  invite: string;
  description?: string;
  memberCount?: number;
  onlineCount?: number;
  icon?: string;
  banner?: string;
  courseMappings?: string[];
  features?: string[];
  boostLevel?: number;
  verificationLevel?: string;
  categories?: DiscordCategory[];
  lastChecked?: string;
}

export interface DiscordCategory {
  id: string;
  name: string;
  channels: DiscordChannel[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface RedditCommunity {
  subredditName: string;
  displayName: string;
  title?: string;
  description?: string;
  subscriberCount?: number;
  activeUserCount?: number;
  courseMappings?: string[];
  icon?: string;
  banner?: string;
  isNsfw?: boolean;
  rules?: RedditRule[];
  lastChecked?: string;
}

export interface RedditRule {
  name: string;
  description?: string;
}

export interface WguConnectGroup {
  groupId: string;
  name: string;
  courseCode?: string;
  description?: string;
  memberCount?: number;
  postCount?: number;
  lastActivity?: string;
  resources?: WguConnectResource[];
}

export interface WguConnectResource {
  id: string;
  title: string;
  type: string;
  url?: string;
  author?: string;
  timestamp?: string;
  upvotes?: number;
}

export interface StudentGroup {
  studentGroupId: string;
  name: string;
  description?: string;
  category?: string;
  memberCount?: number;
  platform?: string;
  joinUrl?: string;
  courseMappings?: string[];
  icon?: string;
  banner?: string;
  isOfficial?: boolean;
  socialLinks?: SocialLink[];
  lastChecked?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

// Advanced search types
export interface SearchFilter {
  field: string;
  operator: string;
  value: string;
}

export interface AdvancedSearchResult extends SearchResult {
  icon?: string;
  platform?: string;
  memberCount?: number;
  competencyUnits?: number;
  college?: string;
  degreeType?: string;
  serverId?: string;
  subredditName?: string;
  groupId?: string;
  degreeId?: string;
  studentGroupId?: string;
}

// Response types for site-specific queries
export interface DiscordServersResponse {
  discordServers: {
    items: DiscordServer[];
    totalCount: number;
  };
}

export interface RedditCommunitiesResponse {
  redditCommunities: {
    items: RedditCommunity[];
    totalCount: number;
  };
}

export interface StudentGroupsResponse {
  studentGroups: {
    items: StudentGroup[];
    totalCount: number;
  };
}
