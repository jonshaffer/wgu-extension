/**
 * GraphQL Response Shape Fixtures
 *
 * Expected response shapes for GraphQL queries.
 * Use these for assertions and snapshot testing.
 *
 * Usage:
 * ```typescript
 * import { EXPECTED_RESPONSES } from './fixtures/graphql-responses';
 * expect(response.data).toMatchObject(EXPECTED_RESPONSES.search.structure);
 * ```
 */

// ============================================================================
// Search Response Shapes
// ============================================================================

export const SEARCH_RESPONSE_SHAPE = {
  data: {
    search: {
      totalCount: expect.any(Number),
      results: expect.any(Array),
    },
  },
};

export const SEARCH_RESULT_ITEM_SHAPE = {
  type: expect.stringMatching(/^(course|discord|reddit|wguConnect|studentGroup|degree)$/),
  id: expect.any(String),
  title: expect.any(String),
};

export const SEARCH_RESULT_ITEM_FULL_SHAPE = {
  ...SEARCH_RESULT_ITEM_SHAPE,
  // Optional fields - can be string, undefined, or null
};

// ============================================================================
// Course Response Shapes
// ============================================================================

export const COURSE_BASIC_SHAPE = {
  courseCode: expect.any(String),
  name: expect.any(String),
};

export const COURSE_FULL_SHAPE = {
  courseCode: expect.any(String),
  name: expect.any(String),
  // Optional fields: description, units, level, competencyUnits
};

export const COURSES_LIST_RESPONSE_SHAPE = {
  data: {
    courses: {
      items: expect.any(Array),
      totalCount: expect.any(Number),
    },
  },
};

export const COURSE_DETAIL_RESPONSE_SHAPE = {
  data: {
    course: {
      courseCode: expect.any(String),
      name: expect.any(String),
      // Optional fields: prerequisites, corequisites, description, etc.
    },
  },
};

// ============================================================================
// Discord Server Response Shapes
// ============================================================================

export const DISCORD_SERVER_BASIC_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: memberCount
};

export const DISCORD_SERVER_FULL_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: description, inviteUrl, icon, categories, memberCount
};

export const DISCORD_SERVERS_LIST_RESPONSE_SHAPE = {
  data: {
    discordServers: {
      items: expect.any(Array),
      totalCount: expect.any(Number),
    },
  },
};

// ============================================================================
// Reddit Community Response Shapes
// ============================================================================

export const REDDIT_COMMUNITY_BASIC_SHAPE = {
  name: expect.any(String),
  // Optional: subscriberCount
};

export const REDDIT_COMMUNITY_FULL_SHAPE = {
  name: expect.any(String),
  // Optional: description, isActive, college, subscriberCount
};

export const REDDIT_COMMUNITIES_LIST_RESPONSE_SHAPE = {
  data: {
    redditCommunities: {
      items: expect.any(Array),
      totalCount: expect.any(Number),
    },
  },
};

// ============================================================================
// WGU Connect Group Response Shapes
// ============================================================================

export const WGU_CONNECT_GROUP_BASIC_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: courseCode
};

export const WGU_CONNECT_GROUP_FULL_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: description, memberCount, lastActivity, courseCode
};

// ============================================================================
// Student Group Response Shapes
// ============================================================================

export const STUDENT_GROUP_BASIC_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: type
};

export const STUDENT_GROUP_FULL_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: platform, memberCount, description, tags, type
};

// ============================================================================
// Degree Program Response Shapes
// ============================================================================

export const DEGREE_PROGRAM_BASIC_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: description
};

export const DEGREE_PROGRAM_FULL_SHAPE = {
  id: expect.any(String),
  name: expect.any(String),
  // Optional: college, degreeType, totalCUs, courses, description
};

// ============================================================================
// Communities for Course Response Shape (V2)
// ============================================================================

export const COMMUNITIES_FOR_COURSE_V2_SHAPE = {
  data: {
    getCommunitiesForCourse: {
      courseCode: expect.any(String),
      courseName: expect.any(String),
      // Optional arrays: discord, reddit, wguConnect, studentGroups
    },
  },
};

// ============================================================================
// Error Response Shapes
// ============================================================================

export const GRAPHQL_ERROR_RESPONSE_SHAPE = {
  errors: expect.arrayContaining([
    expect.objectContaining({
      message: expect.any(String),
    }),
  ]),
};

export const AUTHENTICATION_ERROR_SHAPE = {
  errors: expect.arrayContaining([
    expect.objectContaining({
      message: expect.stringMatching(/authentication|unauthorized|unauthenticated/i),
    }),
  ]),
};

export const AUTHORIZATION_ERROR_SHAPE = {
  errors: expect.arrayContaining([
    expect.objectContaining({
      message: expect.stringMatching(/authorization|forbidden|permission/i),
    }),
  ]),
};

export const VALIDATION_ERROR_SHAPE = {
  errors: expect.arrayContaining([
    expect.objectContaining({
      message: expect.stringMatching(/validation|invalid|required/i),
    }),
  ]),
};

// ============================================================================
// Consolidated Expected Responses Object
// ============================================================================

/**
 * All expected response shapes in one convenient object.
 * Use these for assertions in your tests.
 */
export const EXPECTED_RESPONSES = {
  search: {
    structure: SEARCH_RESPONSE_SHAPE,
    resultItem: SEARCH_RESULT_ITEM_SHAPE,
    resultItemFull: SEARCH_RESULT_ITEM_FULL_SHAPE,
  },
  course: {
    basic: COURSE_BASIC_SHAPE,
    full: COURSE_FULL_SHAPE,
    list: COURSES_LIST_RESPONSE_SHAPE,
    detail: COURSE_DETAIL_RESPONSE_SHAPE,
  },
  discord: {
    basic: DISCORD_SERVER_BASIC_SHAPE,
    full: DISCORD_SERVER_FULL_SHAPE,
    list: DISCORD_SERVERS_LIST_RESPONSE_SHAPE,
  },
  reddit: {
    basic: REDDIT_COMMUNITY_BASIC_SHAPE,
    full: REDDIT_COMMUNITY_FULL_SHAPE,
    list: REDDIT_COMMUNITIES_LIST_RESPONSE_SHAPE,
  },
  wguConnect: {
    basic: WGU_CONNECT_GROUP_BASIC_SHAPE,
    full: WGU_CONNECT_GROUP_FULL_SHAPE,
  },
  studentGroup: {
    basic: STUDENT_GROUP_BASIC_SHAPE,
    full: STUDENT_GROUP_FULL_SHAPE,
  },
  degreeProgram: {
    basic: DEGREE_PROGRAM_BASIC_SHAPE,
    full: DEGREE_PROGRAM_FULL_SHAPE,
  },
  communitiesForCourse: {
    v2: COMMUNITIES_FOR_COURSE_V2_SHAPE,
  },
  errors: {
    generic: GRAPHQL_ERROR_RESPONSE_SHAPE,
    authentication: AUTHENTICATION_ERROR_SHAPE,
    authorization: AUTHORIZATION_ERROR_SHAPE,
    validation: VALIDATION_ERROR_SHAPE,
  },
};

/**
 * Helper function to check if a field is one of multiple types
 * Use in tests like: expect(isOneOf(value, [String, null])).toBe(true)
 */
export function isOneOf(value: any, types: any[]): boolean {
  return types.some((type) => {
    if (type === null) return value === null;
    if (type === undefined) return value === undefined;
    if (type === String) return typeof value === "string";
    if (type === Number) return typeof value === "number";
    if (type === Boolean) return typeof value === "boolean";
    if (type === Array) return Array.isArray(value);
    return value instanceof type;
  });
}
