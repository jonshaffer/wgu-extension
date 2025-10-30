/**
 * Test Data Factory
 *
 * Provides factory functions for creating test data for all entity types.
 * Factories return valid Firestore document data with sensible defaults.
 *
 * Usage:
 * ```typescript
 * const course = createCourse({ courseCode: "C172", name: "Network Security" });
 * const discord = createDiscordServer({ name: "WGU CS Community" });
 * ```
 */

import * as admin from "firebase-admin";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CourseData {
  courseCode: string;
  name: string;
  description?: string;
  units?: number;
  competencyUnits?: number;
  level?: "undergraduate" | "graduate";
  type?: "general" | "certification" | "capstone";
  prerequisites?: string[];
  firstSeenCatalog?: string;
  lastSeenCatalog?: string;
  catalogHistory?: string[];
  communities?: {
    discord?: Array<{ serverId: string; channelIds: string[] }>;
    reddit?: Array<{ subredditId: string; relevance: string }>;
    wguConnect?: { groupId: string };
  };
  popularityScore?: number;
  difficultyRating?: number;
  lastUpdated?: Date | admin.firestore.Timestamp;
}

export interface DiscordServerData {
  id: string;
  name: string;
  description?: string;
  inviteUrl?: string;
  icon?: string;
  memberCount?: number;
  channels?: Array<{
    id: string;
    name: string;
    type: string;
    associatedCourses?: string[];
  }>;
  tags?: string[];
  verified?: boolean;
  lastUpdated?: Date | admin.firestore.Timestamp;
}

export interface RedditCommunityData {
  id: string;
  name: string;
  description?: string;
  url?: string;
  subscriberCount?: number;
  type?: "main" | "program" | "course" | "community";
  associatedPrograms?: string[];
  associatedCourses?: string[];
  tags?: string[];
  active?: boolean;
  lastUpdated?: Date | admin.firestore.Timestamp;
}

export interface WguConnectGroupData {
  id: string;
  groupId: string;
  name: string;
  courseCode?: string;
  description?: string;
  memberCount?: number;
  postCount?: number;
  lastActivity?: Date | admin.firestore.Timestamp;
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    url: string;
    upvotes?: number;
  }>;
}

export interface StudentGroupData {
  id: string;
  studentGroupId: string;
  name: string;
  description?: string;
  category?: "academic" | "social" | "professional";
  memberCount?: number;
  platform?: "discord" | "website" | "facebook" | "slack";
  joinUrl?: string;
  courseMappings?: string[];
  icon?: string;
  banner?: string;
  isOfficial?: boolean;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  lastChecked?: Date | admin.firestore.Timestamp;
}

export interface DegreeProgramData {
  id: string;
  code: string;
  name: string;
  description?: string;
  level?: "associate" | "bachelor" | "master" | "doctorate";
  college?: string;
  totalUnits?: number;
  courses?: Array<{
    courseCode: string;
    type: "core" | "elective";
    term?: number;
  }>;
  firstSeenCatalog?: string;
  lastSeenCatalog?: string;
  catalogHistory?: string[];
  communities?: {
    discord?: Array<{ serverId: string }>;
    reddit?: Array<{ subredditId: string }>;
  };
  stats?: {
    averageCompletionTime?: number;
    popularCourseSequences?: string[];
  };
  lastUpdated?: Date | admin.firestore.Timestamp;
}

export interface CourseCommunityMappingData {
  courseCode: string;
  courseName: string;
  discord?: string[];
  reddit?: string[];
  wguConnect?: string | null;
  studentGroups?: string[];
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a course document for testing
 */
export function createCourse(overrides: Partial<CourseData> = {}): CourseData {
  const defaults: CourseData = {
    courseCode: "C000",
    name: "Test Course",
    description: "A test course for integration testing",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    prerequisites: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [],
      reddit: [],
    },
    popularityScore: 50,
    difficultyRating: 2.5,
    lastUpdated: new Date(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a Discord server document for testing
 */
export function createDiscordServer(
  overrides: Partial<DiscordServerData> = {}
): DiscordServerData {
  const defaults: DiscordServerData = {
    id: "123456789012345678",
    name: "Test Discord Server",
    description: "A test Discord server",
    inviteUrl: "https://discord.gg/test",
    icon: "https://example.com/icon.png",
    memberCount: 1000,
    channels: [],
    tags: [],
    verified: false,
    lastUpdated: new Date(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a Reddit community document for testing
 */
export function createRedditCommunity(
  overrides: Partial<RedditCommunityData> = {}
): RedditCommunityData {
  const defaults: RedditCommunityData = {
    id: "WGU",
    name: "Western Governors University",
    description: "Test Reddit community",
    url: "https://reddit.com/r/WGU",
    subscriberCount: 10000,
    type: "main",
    associatedPrograms: [],
    associatedCourses: [],
    tags: [],
    active: true,
    lastUpdated: new Date(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a WGU Connect group document for testing
 */
export function createWguConnectGroup(
  overrides: Partial<WguConnectGroupData> = {}
): WguConnectGroupData {
  const defaults: WguConnectGroupData = {
    id: "test-group",
    groupId: "test-group",
    name: "Test Study Group",
    courseCode: undefined,
    description: "A test study group",
    memberCount: 50,
    postCount: 100,
    lastActivity: new Date(),
    resources: [],
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a student group document for testing
 */
export function createStudentGroup(
  overrides: Partial<StudentGroupData> = {}
): StudentGroupData {
  const defaults: StudentGroupData = {
    id: "test-student-group",
    studentGroupId: "test-student-group",
    name: "Test Student Group",
    description: "A test student group",
    category: "academic",
    memberCount: 100,
    platform: "website",
    joinUrl: "https://example.com/test-group",
    courseMappings: [],
    isOfficial: false,
    socialLinks: [],
    lastChecked: new Date(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a degree program document for testing
 */
export function createDegreeProgram(
  overrides: Partial<DegreeProgramData> = {}
): DegreeProgramData {
  const defaults: DegreeProgramData = {
    id: "test-degree",
    code: "TEST",
    name: "Test Degree Program",
    description: "A test degree program",
    level: "bachelor",
    college: "Test College",
    totalUnits: 120,
    courses: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [],
      reddit: [],
    },
    stats: {},
    lastUpdated: new Date(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a course-community mapping document for testing
 */
export function createCourseCommunityMapping(
  overrides: Partial<CourseCommunityMappingData> = {}
): CourseCommunityMappingData {
  const defaults: CourseCommunityMappingData = {
    courseCode: "C000",
    courseName: "Test Course",
    discord: [],
    reddit: [],
    wguConnect: null,
    studentGroups: [],
  };

  return { ...defaults, ...overrides };
}

// ============================================================================
// Batch Creation Helpers
// ============================================================================

/**
 * Create multiple courses at once
 */
export function createCourses(count: number, baseOverrides: Partial<CourseData> = {}): CourseData[] {
  return Array.from({ length: count }, (_, i) =>
    createCourse({
      courseCode: `C${(100 + i).toString().padStart(3, '0')}`,
      name: `Test Course ${i + 1}`,
      ...baseOverrides,
    })
  );
}

/**
 * Create multiple Discord servers at once
 */
export function createDiscordServers(
  count: number,
  baseOverrides: Partial<DiscordServerData> = {}
): DiscordServerData[] {
  return Array.from({ length: count }, (_, i) => {
    const id = (BigInt("123456789012345678") + BigInt(i)).toString();
    return createDiscordServer({
      id,
      name: `Test Discord Server ${i + 1}`,
      ...baseOverrides,
    });
  });
}

/**
 * Create multiple Reddit communities at once
 */
export function createRedditCommunities(
  count: number,
  baseOverrides: Partial<RedditCommunityData> = {}
): RedditCommunityData[] {
  return Array.from({ length: count }, (_, i) =>
    createRedditCommunity({
      id: `TestSubreddit${i + 1}`,
      name: `Test Subreddit ${i + 1}`,
      ...baseOverrides,
    })
  );
}

// ============================================================================
// Realistic Data Builders
// ============================================================================

/**
 * Create a realistic WGU course with full community mappings
 */
export function createRealisticCourse(courseCode: string): {
  course: CourseData;
  discord: DiscordServerData;
  wguConnect: WguConnectGroupData;
  mapping: CourseCommunityMappingData;
} {
  const courseName = `${courseCode} - Test Course`;
  const discordId = "987654321098765432";
  const groupId = `${courseCode.toLowerCase()}-study`;

  const course = createCourse({
    courseCode,
    name: courseName,
    description: `This is a realistic test course for ${courseCode}`,
    communities: {
      discord: [{ serverId: discordId, channelIds: ["channel-1"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }],
      wguConnect: { groupId },
    },
  });

  const discord = createDiscordServer({
    id: discordId,
    name: `WGU ${courseCode} Community`,
    channels: [
      {
        id: "channel-1",
        name: `${courseCode.toLowerCase()}-discussion`,
        type: "course",
        associatedCourses: [courseCode],
      },
    ],
  });

  const wguConnect = createWguConnectGroup({
    id: groupId,
    groupId,
    name: `${courseCode} Study Group`,
    courseCode,
  });

  const mapping = createCourseCommunityMapping({
    courseCode,
    courseName,
    discord: [discordId],
    reddit: ["WGU"],
    wguConnect: groupId,
  });

  return { course, discord, wguConnect, mapping };
}

/**
 * Create a complete test dataset with interrelated entities
 */
export function createCompleteTestDataset() {
  const c172 = createRealisticCourse("C172");
  const c173 = createRealisticCourse("C173");
  const c175 = createRealisticCourse("C175");

  const degreeProgram = createDegreeProgram({
    id: "bs-computer-science",
    code: "BSCS",
    name: "Bachelor of Science, Computer Science",
    courses: [
      { courseCode: "C172", type: "core", term: 1 },
      { courseCode: "C173", type: "core", term: 1 },
      { courseCode: "C175", type: "core", term: 2 },
    ],
  });

  const mainReddit = createRedditCommunity({
    id: "WGU",
    name: "Western Governors University",
    associatedCourses: ["C172", "C173", "C175"],
  });

  return {
    courses: [c172.course, c173.course, c175.course],
    discordServers: [c172.discord, c173.discord, c175.discord],
    wguConnectGroups: [c172.wguConnect, c173.wguConnect, c175.wguConnect],
    courseCommunityMappings: [c172.mapping, c173.mapping, c175.mapping],
    degreePrograms: [degreeProgram],
    redditCommunities: [mainReddit],
  };
}
