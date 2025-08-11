/**
 * Community Data Type Definitions
 * 
 * This file defines the TypeScript interfaces for all community data sources
 * including Discord, Reddit, and WGU Connect.
 */

// ===============================
// Hierarchy and Organization Types
// ===============================

export type OrganizationLevel = 'university' | 'college' | 'program' | 'course';

export type College = 'technology' | 'healthcare' | 'business' | 'education';

export interface WguHierarchy {
  level: OrganizationLevel;
  college?: College;
  program?: string;
  courseCode?: string;
}

// ===============================
// Discord Data Types
// ===============================

export interface DiscordCommunity {
  id: string;
  name: string;
  description: string;
  inviteUrl: string;
  hierarchy: WguHierarchy;
  isVerified: boolean;
  memberCount?: number;
  lastUpdated: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  description?: string;
  communityId: string;
  type: 'text' | 'voice' | 'forum';
  courseRelevance?: string[]; // Course codes this channel is relevant to
  tags?: string[];
}

export interface DiscordData {
  communities: DiscordCommunity[];
  channels: DiscordChannel[];
}

// ===============================
// Reddit Data Types  
// ===============================

export interface RedditCommunity {
  subreddit: string; // Without r/ prefix
  name: string;
  description: string;
  hierarchy: WguHierarchy;
  subscribers?: number;
  isActive: boolean;
  relevantCourses?: string[]; // Course codes
  tags?: string[];
  lastUpdated: string;
}

export interface RedditData {
  communities: RedditCommunity[];
}

// ===============================
// WGU Connect Data Types
// ===============================

export interface WguConnectGroup {
  id: string;
  name: string;
  description: string;
  url: string;
  courseCodes: string[]; // Multiple courses may share a group
  isActive: boolean;
  memberCount?: number;
  lastUpdated: string;
}

export interface WguConnectData {
  groups: WguConnectGroup[];
}

// ===============================
// Unified/Processed Data Types
// ===============================

export interface CommunityLink {
  name: string;
  url: string;
  type: 'discord' | 'reddit' | 'wgu-connect';
  description?: string;
  memberCount?: number;
}

export interface CourseCommunitiesMappings {
  courseCode: string;
  discord?: CommunityLink[];
  reddit?: CommunityLink[];
  wguConnect?: CommunityLink[];
}

export interface ProcessedCommunityData {
  courseMappings: CourseCommunitiesMappings[];
  universityLevel: {
    discord: CommunityLink[];
    reddit: CommunityLink[];
  };
  collegeLevel: Record<College, {
    discord: CommunityLink[];
    reddit: CommunityLink[];
  }>;
  lastUpdated: string;
}

// ===============================
// Raw Data Container Types
// ===============================

export interface RawDataContainer {
  discord: DiscordData;
  reddit: RedditData;
  wguConnect: WguConnectData;
  metadata: {
    lastIngestion: string;
    version: string;
  };
}

// ===============================
// Data Pipeline Types
// ===============================

export interface IngestionConfig {
  sources: {
    discord: {
      enabled: boolean;
      apiKey?: string;
      communities: string[]; // Community IDs to ingest
    };
    reddit: {
      enabled: boolean;
      subreddits: string[]; // Subreddits to validate
    };
    wguConnect: {
      enabled: boolean;
      manualMode: boolean; // Whether to use manual data entry vs scraping
    };
  };
}

export interface TransformationConfig {
  courseCodeMapping: Record<string, {
    college: College;
    program: string;
    title: string;
  }>;
  hierarchyRules: {
    discord: Record<string, WguHierarchy>;
    reddit: Record<string, WguHierarchy>;
  };
}
