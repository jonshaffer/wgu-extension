/**
 * WGU Extension Data Model
 *
 * This file defines the comprehensive data model for the WGU Extension,
 * separating core data from derived data and establishing relationships.
 */

// ==========================================
// CORE DATA ENTITIES (Source of Truth)
// ==========================================

/**
 * Institution Catalog - Raw catalog data from WGU
 * This is the primary source for course and degree information
 */
export interface InstitutionCatalog {
  id: string; // e.g., "catalog-2025-08"
  date: string; // e.g., "2025-08"
  version: string;
  metadata: {
    totalCourses: number;
    totalDegrees: number;
    lastUpdated: Date;
    sourceUrl?: string;
  };
  rawData: any; // Original parsed catalog data
}

/**
 * Discord Server - Community Discord servers
 */
export interface DiscordServer {
  id: string; // Discord server ID
  name: string;
  description?: string;
  inviteUrl: string;
  memberCount?: number;
  channels?: {
    id: string;
    name: string;
    type: "course" | "general" | "study-group" | "other";
    associatedCourses?: string[]; // Course codes
  }[];
  tags: string[]; // e.g., ["computer-science", "official", "study-group"]
  verified: boolean;
  lastUpdated: Date;
}

/**
 * Reddit Community - Subreddit information
 */
export interface RedditCommunity {
  id: string; // Subreddit name (without r/)
  name: string; // Display name
  description?: string;
  url: string;
  subscriberCount?: number;
  type: "main" | "program-specific" | "course-specific";
  associatedPrograms?: string[]; // Degree program IDs
  associatedCourses?: string[]; // Course codes
  tags: string[];
  active: boolean;
  lastUpdated: Date;
}

/**
 * WGU Connect Group - Official WGU study groups
 */
export interface WguConnectGroup {
  id: string;
  courseCode: string;
  name: string;
  description?: string;
  resources: {
    id: string;
    title: string;
    type: "document" | "video" | "link" | "discussion";
    url: string;
    upvotes?: number;
  }[];
  memberCount?: number;
  lastActivity?: Date;
  lastUpdated: Date;
}

/**
 * WGU Student Group - Student organizations
 */
export interface WguStudentGroup {
  id: string;
  name: string;
  description?: string;
  type: "academic" | "social" | "professional" | "diversity";
  contactEmail?: string;
  websiteUrl?: string;
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  tags: string[];
  active: boolean;
  lastUpdated: Date;
}

// ==========================================
// DERIVED DATA ENTITIES (Transformed/Indexed)
// ==========================================

/**
 * Course - Normalized course data extracted from catalogs
 * This is derived from InstitutionCatalog data
 */
export interface Course {
  courseCode: string; // Primary key (e.g., "C779")
  name: string;
  description?: string;
  units: number;
  level: "undergraduate" | "graduate";
  type: "general" | "major" | "elective";
  prerequisites?: string[]; // Course codes

  // Metadata
  firstSeenCatalog: string; // catalog ID
  lastSeenCatalog: string; // catalog ID
  catalogHistory: {
    catalogId: string;
    changes?: string[]; // What changed in this catalog
  }[];

  // Associations (populated during transformation)
  communities: {
    discord: {
      serverId: string;
      channelIds?: string[];
    }[];
    reddit: {
      subredditId: string;
      relevance: "direct" | "program" | "general";
    }[];
    wguConnect?: {
      groupId: string;
    };
  };

  // Computed fields
  popularityScore?: number; // Based on community activity
  difficultyRating?: number; // Based on community feedback

  lastUpdated: Date;
}

/**
 * Degree Program - Normalized degree data
 * This is derived from InstitutionCatalog data
 */
export interface DegreeProgram {
  id: string; // e.g., "bs-computer-science"
  code: string; // e.g., "BSCS"
  name: string;
  description?: string;
  level: "bachelor" | "master";
  college: string;
  totalUnits: number;

  // Course requirements
  courses: {
    courseCode: string;
    type: "core" | "general-education" | "elective";
    term?: number; // Suggested term
  }[];

  // Catalog tracking
  firstSeenCatalog: string;
  lastSeenCatalog: string;
  catalogHistory: {
    catalogId: string;
    changes?: string[];
  }[];

  // Associations
  communities: {
    discord: {
      serverId: string;
    }[];
    reddit: {
      subredditId: string;
    }[];
  };

  // Statistics
  stats?: {
    averageCompletionTime?: number; // months
    popularCourseSequences?: string[][]; // Common course orderings
  };

  lastUpdated: Date;
}

/**
 * Community Resource Index - Search-optimized view
 * This combines all community resources for efficient querying
 */
export interface CommunityResourceIndex {
  id: string; // Composite key
  type: "discord" | "reddit" | "wgu-connect" | "student-group";
  resourceId: string; // ID in the source collection

  // Denormalized fields for search
  title: string;
  description?: string;
  url?: string;

  // Associations
  courseCodes: string[]; // All associated courses
  programIds: string[]; // All associated programs
  tags: string[]; // All tags

  // Metadata
  popularity: number; // Calculated metric
  verified: boolean;
  active: boolean;
  lastUpdated: Date;
}

// ==========================================
// RELATIONSHIP MAPPINGS
// ==========================================

/**
 * Course Community Mapping - Pre-computed associations
 * This is generated during the transformation pipeline
 */
export interface CourseCommunityMapping {
  courseCode: string;

  communities: {
    primary: {
      // Most relevant community for this course
      type: "discord" | "reddit" | "wgu-connect";
      id: string;
      confidence: number; // 0-1, how confident we are in this match
    };

    all: Array<{
      type: "discord" | "reddit" | "wgu-connect" | "student-group";
      id: string;
      relevance: "direct" | "program" | "general";
      confidence: number;
    }>;
  };

  // Reddit-specific
  topRedditPosts?: Array<{
    postId: string;
    title: string;
    url: string;
    score: number;
    commentCount: number;
    createdAt: Date;
  }>;

  lastUpdated: Date;
}

// ==========================================
// QUERY HELPERS
// ==========================================

/**
 * Student Course View - What students see for a course
 * This combines all relevant data for a course
 */
export interface StudentCourseView {
  course: Course;
  degree?: DegreeProgram; // If viewing in context of a degree

  communities: {
    wguConnect?: WguConnectGroup;
    discord: Array<{
      server: DiscordServer;
      channels?: DiscordServer["channels"];
    }>;
    reddit: Array<{
      community: RedditCommunity;
      topPosts?: CourseCommunityMapping["topRedditPosts"];
    }>;
    studentGroups: WguStudentGroup[];
  };

  insights?: {
    enrollmentTrend?: "increasing" | "stable" | "decreasing";
    commonPairings?: string[]; // Courses often taken together
    tipFromCommunity?: string; // AI-extracted tip
  };
}

// ==========================================
// TRANSFORMATION PIPELINE TYPES
// ==========================================

export interface TransformationJob {
  id: string;
  type: "catalog-extract" | "community-mapping" | "index-update";
  status: "pending" | "running" | "completed" | "failed";

  input: {
    source: string; // Collection name
    documentIds?: string[];
    options?: Record<string, any>;
  };

  output?: {
    documentsProcessed: number;
    documentsCreated: number;
    documentsUpdated: number;
    errors?: Array<{
      documentId: string;
      error: string;
    }>;
  };

  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ==========================================
// FIRESTORE COLLECTION NAMES
// ==========================================

export const COLLECTIONS = {
  // Core data (source of truth)
  INSTITUTION_CATALOGS: "institution-catalogs",
  DISCORD_SERVERS: "discord-servers",
  REDDIT_COMMUNITIES: "reddit-communities",
  WGU_CONNECT_GROUPS: "wgu-connect-groups",
  WGU_STUDENT_GROUPS: "wgu-student-groups",

  // Derived data (generated from core)
  COURSES: "courses",
  DEGREE_PROGRAMS: "degree-programs",
  COMMUNITY_INDEX: "community-resource-index",
  COURSE_MAPPINGS: "course-community-mappings",

  // System
  TRANSFORMATION_JOBS: "transformation-jobs",
  CACHE: "cache",
} as const;
