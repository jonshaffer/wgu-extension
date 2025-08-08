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

export type College = 'technology' | 'health' | 'business' | 'education';

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
  channels: DiscordChannel[];
  lastUpdated?: string; // Added during processing from git history
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

// Individual Discord community file structure
export interface DiscordCommunityFile extends DiscordCommunity {
  // This represents a single discord.{id}.json file
}

// Legacy structure for backward compatibility
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
  lastUpdated?: string; // Added during processing from git history
}

// Individual Reddit community file structure
export interface RedditCommunityFile extends Omit<RedditCommunity, 'lastUpdated'> {
  // This represents a single {subreddit}.json file without lastUpdated
}

// Legacy structure for backward compatibility
export interface RedditData {
  communities: RedditCommunity[];
}

// ===============================
// WGU Connect Data Types
// ===============================

export interface WguConnectGroup {
  id: string;
  name: string;
  full_name: string;
  category: string;
  course_codes: string[]; // Multiple courses may share a group
  url: string;
  discussions_url: string;
  resources_url: string;
  verified: boolean;
  lastUpdated?: string; // Added during processing from git history
}

// Individual WGU Connect group file structure
export interface WguConnectGroupFile extends WguConnectGroup {
  // This represents a single wgu-connect/{id}.json file
}

export interface WguConnectData {
  groups: WguConnectGroup[];
}

// ===============================
// WGU Student Groups Data Types
// ===============================

export interface WguStudentGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  type: 'open' | 'closed'; // Whether group is open to all students or has restrictions
  access_requirements?: string; // Description of requirements for closed groups
  target_audience?: string; // Description of who the group is for
  lastUpdated?: string; // Added during processing from git history
}

// Individual WGU Student Group file structure
export interface WguStudentGroupFile extends WguStudentGroup {
  // This represents a single wgu-student-groups/{id}.json file
}

export interface WguStudentGroupsData {
  groups: WguStudentGroup[];
}

// ===============================
// Unified/Processed Data Types
// ===============================

export interface CommunityLink {
  name: string;
  url: string;
  type: 'discord' | 'reddit' | 'wgu-connect' | 'wgu-student-groups';
  description?: string;
  memberCount?: number;
  lastUpdated?: string; // Added during processing from git history
}

export interface CourseCommunitiesMappings {
  courseCode: string;
  discord?: CommunityLink[];
  reddit?: CommunityLink[];
  wguConnect?: CommunityLink[];
  wguStudentGroups?: CommunityLink[];
}

export interface ProcessedCommunityData {
  courseMappings: CourseCommunitiesMappings[];
  universityLevel: {
    discord: CommunityLink[];
    reddit: CommunityLink[];
    wguStudentGroups: CommunityLink[];
  };
  collegeLevel: Record<College, {
    discord: CommunityLink[];
    reddit: CommunityLink[];
    wguStudentGroups: CommunityLink[];
  }>;
  discordServers: string[]; // Array of Discord server IDs for content script matching
  lastUpdated: string;
}

// ===============================
// Raw Data Container Types
// ===============================

export interface RawDataContainer {
  discord: DiscordData;
  reddit: RedditData;
  wguConnect: WguConnectData;
  wguStudentGroups: WguStudentGroupsData;
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
    wguStudentGroups: {
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
