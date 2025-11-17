/**
 * Shared Test Fixtures
 *
 * Pre-built test data objects that can be reused across multiple tests.
 * These fixtures use the factory functions to create consistent, realistic test data.
 *
 * Usage:
 * ```typescript
 * import { FIXTURES } from './fixtures/shared-fixtures';
 * await db.collection('courses').doc(FIXTURES.courses.c172.courseCode).set(FIXTURES.courses.c172);
 * ```
 */

import {
  createCourse,
  createDiscordServer,
  createRedditCommunity,
  createWguConnectGroup,
  createStudentGroup,
  createDegreeProgram,
  createCourseCommunityMapping,
} from "./test-data-factory";

// ============================================================================
// Course Fixtures
// ============================================================================

export const COURSES = {
  // Networking & Security course
  c172: createCourse({
    courseCode: "C172",
    name: "Network and Security - Foundations",
    description:
      "This course introduces students to the components of a computer network and the concepts and methods used in network security.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    communities: {
      discord: [{ serverId: "wgu-cyber-club", channelIds: ["c172-channel"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }],
      wguConnect: { groupId: "c172-study" },
    },
    popularityScore: 85,
    difficultyRating: 3.5,
  }),

  // Programming course
  c173: createCourse({
    courseCode: "C173",
    name: "Scripting and Programming - Foundations",
    description:
      "This course provides an introduction to programming covering data structures, algorithms, and programming paradigms.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    communities: {
      discord: [{ serverId: "wgu-compsci", channelIds: ["c173-channel"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }],
    },
    popularityScore: 80,
    difficultyRating: 3.0,
  }),

  // Data Management course
  c175: createCourse({
    courseCode: "C175",
    name: "Data Management - Foundations",
    description:
      "This course covers the fundamentals of data management systems.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    communities: {
      discord: [{ serverId: "wgu-compsci", channelIds: ["c175-channel"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }],
    },
    popularityScore: 75,
    difficultyRating: 2.8,
  }),

  // Graduate-level course
  c950: createCourse({
    courseCode: "C950",
    name: "Data Structures and Algorithms II",
    description:
      "Advanced coverage of data structures and algorithmic analysis.",
    units: 4,
    competencyUnits: 4,
    level: "graduate",
    type: "general",
    prerequisites: ["C949"],
    popularityScore: 70,
    difficultyRating: 4.2,
  }),

  // Certification course
  c172Cert: createCourse({
    courseCode: "C172C",
    name: "Network+ Certification",
    description: "Preparation for CompTIA Network+ certification exam.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "certification",
    popularityScore: 65,
    difficultyRating: 3.8,
  }),
};

// ============================================================================
// Discord Server Fixtures
// ============================================================================

export const DISCORD_SERVERS = {
  cyberClub: createDiscordServer({
    id: "wgu-cyber-club",
    name: "WGU Cyber Security Club",
    description: "A community for WGU cybersecurity students and alumni",
    inviteUrl: "https://discord.gg/wgucyber",
    icon: "https://example.com/icon.png",
    memberCount: 5000,
    channels: [
      {
        id: "c172-channel",
        name: "c172-network-security",
        type: "course",
        associatedCourses: ["C172"],
      },
      {
        id: "general-cyber",
        name: "general-cybersecurity",
        type: "text",
      },
    ],
    tags: ["cybersecurity", "official"],
    verified: true,
  }),

  compSci: createDiscordServer({
    id: "wgu-compsci",
    name: "WGU Computer Science",
    description: "Community for Computer Science students at WGU",
    inviteUrl: "https://discord.gg/wgucs",
    memberCount: 3500,
    channels: [
      {
        id: "c173-channel",
        name: "c173-programming",
        type: "course",
        associatedCourses: ["C173"],
      },
      {
        id: "c175-channel",
        name: "c175-data-mgmt",
        type: "course",
        associatedCourses: ["C175"],
      },
    ],
    tags: ["computer-science", "official"],
    verified: true,
  }),

  unofficial: createDiscordServer({
    id: "123456789012345678",
    name: "Unofficial WGU Study Group",
    description: "Community-run study group",
    inviteUrl: "https://discord.gg/unofficial",
    memberCount: 500,
    channels: [],
    tags: ["community"],
    verified: false,
  }),
};

// ============================================================================
// Reddit Community Fixtures
// ============================================================================

export const REDDIT_COMMUNITIES = {
  wgu: createRedditCommunity({
    id: "WGU",
    name: "Western Governors University",
    description: "Main WGU subreddit",
    url: "https://reddit.com/r/WGU",
    subscriberCount: 50000,
    type: "main",
    associatedPrograms: ["bs-computer-science"],
    associatedCourses: ["C172", "C173", "C175"],
    tags: ["general", "official"],
    active: true,
  }),

  wguCs: createRedditCommunity({
    id: "WGU_CompSci",
    name: "WGU Computer Science",
    description: "Computer Science program subreddit",
    url: "https://reddit.com/r/WGU_CompSci",
    subscriberCount: 15000,
    type: "program",
    associatedPrograms: ["bs-computer-science"],
    associatedCourses: ["C173", "C175"],
    tags: ["computer-science"],
    active: true,
  }),

  wguCyber: createRedditCommunity({
    id: "WGUCyberSecurity",
    name: "WGU Cybersecurity",
    description: "Cybersecurity program subreddit",
    url: "https://reddit.com/r/WGUCyberSecurity",
    subscriberCount: 12000,
    type: "program",
    associatedCourses: ["C172"],
    tags: ["cybersecurity"],
    active: true,
  }),
};

// ============================================================================
// WGU Connect Group Fixtures
// ============================================================================

export const WGU_CONNECT_GROUPS = {
  c172Study: createWguConnectGroup({
    id: "c172-study",
    groupId: "c172-study",
    name: "C172 Network and Security Study Group",
    courseCode: "C172",
    description: "Study group for Network and Security Foundations course",
    memberCount: 150,
    postCount: 300,
    resources: [
      {
        id: "res-1",
        title: "Study Guide for C172",
        type: "document",
        url: "https://example.com/c172-guide",
        upvotes: 42,
      },
    ],
  }),

  c173Study: createWguConnectGroup({
    id: "c173-study",
    groupId: "c173-study",
    name: "C173 Programming Study Group",
    courseCode: "C173",
    description: "Study group for Scripting and Programming course",
    memberCount: 200,
    postCount: 450,
  }),
};

// ============================================================================
// Student Group Fixtures
// ============================================================================

export const STUDENT_GROUPS = {
  csClub: createStudentGroup({
    id: "cs-club",
    studentGroupId: "cs-club",
    name: "Computer Science Club",
    description: "WGU Computer Science student organization",
    category: "academic",
    memberCount: 1200,
    platform: "website",
    joinUrl: "https://example.com/cs-club",
    courseMappings: ["C172", "C173", "C175"],
    isOfficial: false,
    socialLinks: [
      { platform: "website", url: "https://example.com/cs-club" },
      { platform: "discord", url: "https://discord.gg/wgucs" },
    ],
  }),

  cyberClub: createStudentGroup({
    id: "cyber-club",
    studentGroupId: "cyber-club",
    name: "Cybersecurity Club",
    description: "WGU Cybersecurity student organization",
    category: "academic",
    memberCount: 800,
    platform: "website",
    joinUrl: "https://example.com/cyber-club",
    courseMappings: ["C172"],
    isOfficial: false,
    socialLinks: [{ platform: "website", url: "https://example.com/cyber-club" }],
  }),
};

// ============================================================================
// Degree Program Fixtures
// ============================================================================

export const DEGREE_PROGRAMS = {
  bsCs: createDegreeProgram({
    id: "bs-computer-science",
    code: "BSCS",
    name: "Bachelor of Science, Computer Science",
    description: "WGU's computer science program",
    level: "bachelor",
    college: "College of Information Technology",
    totalUnits: 122,
    courses: [
      { courseCode: "C172", type: "core", term: 1 },
      { courseCode: "C173", type: "core", term: 1 },
      { courseCode: "C175", type: "core", term: 2 },
    ],
    communities: {
      discord: [{ serverId: "wgu-compsci" }],
      reddit: [{ subredditId: "WGU" }, { subredditId: "WGU_CompSci" }],
    },
    stats: {
      averageCompletionTime: 24,
      popularCourseSequences: ["C172-C173"],
    },
  }),

  bsCyber: createDegreeProgram({
    id: "bs-cybersecurity",
    code: "BSCY",
    name: "Bachelor of Science, Cybersecurity and Information Assurance",
    description: "WGU's cybersecurity program",
    level: "bachelor",
    college: "College of Information Technology",
    totalUnits: 120,
    courses: [{ courseCode: "C172", type: "core", term: 1 }],
  }),
};

// ============================================================================
// Course-Community Mapping Fixtures
// ============================================================================

export const COURSE_COMMUNITY_MAPPINGS = {
  c172: createCourseCommunityMapping({
    courseCode: "C172",
    courseName: "Network and Security - Foundations",
    discord: ["wgu-cyber-club"],
    reddit: ["WGU", "WGUCyberSecurity"],
    wguConnect: "c172-study",
    studentGroups: ["cyber-club"],
  }),

  c173: createCourseCommunityMapping({
    courseCode: "C173",
    courseName: "Scripting and Programming - Foundations",
    discord: ["wgu-compsci"],
    reddit: ["WGU", "WGU_CompSci"],
    wguConnect: "c173-study",
    studentGroups: ["cs-club"],
  }),

  c175: createCourseCommunityMapping({
    courseCode: "C175",
    courseName: "Data Management - Foundations",
    discord: ["wgu-compsci"],
    reddit: ["WGU", "WGU_CompSci"],
    wguConnect: null,
    studentGroups: ["cs-club"],
  }),
};

// ============================================================================
// Consolidated Fixtures Object
// ============================================================================

/**
 * All test fixtures in one convenient object.
 * Use these for consistent test data across all integration tests.
 */
export const FIXTURES = {
  courses: COURSES,
  discordServers: DISCORD_SERVERS,
  redditCommunities: REDDIT_COMMUNITIES,
  wguConnectGroups: WGU_CONNECT_GROUPS,
  studentGroups: STUDENT_GROUPS,
  degreePrograms: DEGREE_PROGRAMS,
  courseCommunityMappings: COURSE_COMMUNITY_MAPPINGS,
};

// ============================================================================
// Fixture Collections (for bulk seeding)
// ============================================================================

/**
 * Get all courses as an array
 */
export function getAllCourses() {
  return Object.values(COURSES);
}

/**
 * Get all Discord servers as an array
 */
export function getAllDiscordServers() {
  return Object.values(DISCORD_SERVERS);
}

/**
 * Get all Reddit communities as an array
 */
export function getAllRedditCommunities() {
  return Object.values(REDDIT_COMMUNITIES);
}

/**
 * Get all WGU Connect groups as an array
 */
export function getAllWguConnectGroups() {
  return Object.values(WGU_CONNECT_GROUPS);
}

/**
 * Get all student groups as an array
 */
export function getAllStudentGroups() {
  return Object.values(STUDENT_GROUPS);
}

/**
 * Get all degree programs as an array
 */
export function getAllDegreePrograms() {
  return Object.values(DEGREE_PROGRAMS);
}

/**
 * Get all course-community mappings as an array
 */
export function getAllCourseCommunityMappings() {
  return Object.values(COURSE_COMMUNITY_MAPPINGS);
}

/**
 * Get a complete minimal dataset (for fast tests)
 */
export function getMinimalDataset() {
  return {
    courses: [COURSES.c172, COURSES.c173],
    discordServers: [DISCORD_SERVERS.compSci],
    redditCommunities: [REDDIT_COMMUNITIES.wgu],
    wguConnectGroups: [WGU_CONNECT_GROUPS.c172Study],
    studentGroups: [],
    degreePrograms: [DEGREE_PROGRAMS.bsCs],
    courseCommunityMappings: [
      COURSE_COMMUNITY_MAPPINGS.c172,
      COURSE_COMMUNITY_MAPPINGS.c173,
    ],
  };
}

/**
 * Get a complete standard dataset (for comprehensive tests)
 */
export function getStandardDataset() {
  return {
    courses: getAllCourses(),
    discordServers: getAllDiscordServers(),
    redditCommunities: getAllRedditCommunities(),
    wguConnectGroups: getAllWguConnectGroups(),
    studentGroups: getAllStudentGroups(),
    degreePrograms: getAllDegreePrograms(),
    courseCommunityMappings: getAllCourseCommunityMappings(),
  };
}
