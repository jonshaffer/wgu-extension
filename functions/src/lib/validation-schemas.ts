/**
 * Input Validation Schemas for GraphQL Mutations
 *
 * Uses Zod for runtime type validation with comprehensive error messages
 */

import {z} from "zod";
import {GraphQLError} from "graphql";

// ==========================================
// CUSTOM VALIDATORS
// ==========================================

/**
 * Discord Snowflake ID validator
 * Discord IDs are 17-20 digit numbers as strings
 */
const discordIdSchema = z.string()
  .regex(/^\d{17,20}$/, "Invalid Discord ID format (must be 17-20 digits)");

/**
 * Discord invite URL validator
 * Accepts: discord.gg/xyz, discord.com/invite/xyz, https://discord.gg/xyz
 */
const discordInviteUrlSchema = z.string()
  .regex(
    /^(https?:\/\/)?(discord\.(gg|com\/invite)\/[\w-]+)$/i,
    "Invalid Discord invite URL format"
  );

/**
 * Reddit subreddit name validator
 * No spaces, special chars except underscore, 3-21 chars
 */
const subredditNameSchema = z.string()
  .min(3, "Subreddit name must be at least 3 characters")
  .max(21, "Subreddit name must be at most 21 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Subreddit name can only contain letters, numbers, and underscores");

/**
 * Reddit URL validator
 */
const redditUrlSchema = z.string()
  .regex(
    /^https?:\/\/(www\.)?(old\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/?$/i,
    "Invalid Reddit URL format"
  );

/**
 * Course code validator
 * Format: Letter + 3 digits (e.g., C779, D123)
 */
const courseCodeSchema = z.string()
  .regex(/^[A-Z]\d{3}$/, "Course code must be a letter followed by 3 digits (e.g., C779)");

/**
 * Degree program ID validator
 * Kebab-case format (e.g., bs-computer-science)
 */
const degreeProgramIdSchema = z.string()
  .regex(/^[a-z]+(-[a-z]+)*$/,
    "Degree program ID must be in kebab-case (e.g., bs-computer-science)");

/**
 * Degree code validator
 * Uppercase alphanumeric (e.g., BSCS, MBA)
 */
const degreeCodeSchema = z.string()
  .min(2, "Degree code must be at least 2 characters")
  .max(10, "Degree code must be at most 10 characters")
  .regex(/^[A-Z0-9]+$/, "Degree code must be uppercase alphanumeric");

/**
 * Tag validator
 */
const tagSchema = z.string()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag must be at most 50 characters")
  .regex(/^[a-zA-Z0-9-_]+$/, "Tags can only contain letters, numbers, hyphens, and underscores");


// ==========================================
// DISCORD SERVER SCHEMAS
// ==========================================

export const discordServerInputSchema = z.object({
  serverId: discordIdSchema,
  name: z.string()
    .min(2, "Server name must be at least 2 characters")
    .max(100, "Server name must be at most 100 characters"),
  description: z.string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  inviteUrl: discordInviteUrlSchema,
  memberCount: z.number()
    .int("Member count must be an integer")
    .nonnegative("Member count cannot be negative")
    .max(1000000, "Member count seems unrealistic")
    .optional()
    .nullable(),
  channels: z.array(z.object({
    id: discordIdSchema,
    name: z.string().min(1).max(100),
    type: z.enum(["course", "general", "study-group", "other"]),
    associatedCourses: z.array(courseCodeSchema).optional(),
  })).max(100, "Cannot have more than 100 channels").optional(),
  tags: z.array(tagSchema)
    .max(10, "Cannot have more than 10 tags")
    .optional()
    .default([]),
  verified: z.boolean().optional().default(false),
});

export const discordServerUpdateInputSchema = discordServerInputSchema
  .partial()
  .omit({serverId: true})
  .refine(
    (data) => Object.keys(data).length > 0,
    {message: "At least one field must be provided for update"}
  );

// ==========================================
// REDDIT COMMUNITY SCHEMAS
// ==========================================

export const redditCommunityInputSchema = z.object({
  subreddit: subredditNameSchema,
  name: z.string()
    .min(3, "Community name must be at least 3 characters")
    .max(100, "Community name must be at most 100 characters"),
  description: z.string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  url: redditUrlSchema,
  subscriberCount: z.number()
    .int("Subscriber count must be an integer")
    .nonnegative("Subscriber count cannot be negative")
    .max(50000000, "Subscriber count seems unrealistic")
    .optional()
    .nullable(),
  type: z.enum(["main", "program-specific", "course-specific"])
    .optional()
    .default("main"),
  associatedPrograms: z.array(degreeProgramIdSchema)
    .max(20, "Cannot associate with more than 20 programs")
    .optional()
    .default([]),
  associatedCourses: z.array(courseCodeSchema)
    .max(50, "Cannot associate with more than 50 courses")
    .optional()
    .default([]),
  tags: z.array(tagSchema)
    .max(10, "Cannot have more than 10 tags")
    .optional()
    .default([]),
  active: z.boolean().optional().default(true),
});

export const redditCommunityUpdateInputSchema = redditCommunityInputSchema
  .partial()
  .omit({subreddit: true})
  .refine(
    (data) => Object.keys(data).length > 0,
    {message: "At least one field must be provided for update"}
  );

// ==========================================
// COURSE SCHEMAS
// ==========================================

export const courseInputSchema = z.object({
  courseCode: courseCodeSchema,
  name: z.string()
    .min(5, "Course name must be at least 5 characters")
    .max(200, "Course name must be at most 200 characters"),
  description: z.string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  units: z.number()
    .int("Units must be an integer")
    .min(1, "Units must be at least 1")
    .max(12, "Units must be at most 12"),
  level: z.enum(["undergraduate", "graduate"])
    .optional()
    .default("undergraduate"),
  type: z.enum(["general", "major", "elective"])
    .optional()
    .default("general"),
  prerequisites: z.array(courseCodeSchema)
    .max(10, "Cannot have more than 10 prerequisites")
    .optional()
    .default([]),
  communities: z.object({
    discord: z.array(z.object({
      serverId: discordIdSchema,
      channelIds: z.array(discordIdSchema).optional(),
    })).optional().default([]),
    reddit: z.array(z.object({
      subredditId: subredditNameSchema,
      relevance: z.enum(["direct", "program", "general"]),
    })).optional().default([]),
    wguConnect: z.object({
      groupId: z.string(),
    }).optional().nullable(),
  }).optional(),
  popularityScore: z.number()
    .min(0, "Popularity score cannot be negative")
    .max(100, "Popularity score must be at most 100")
    .optional()
    .default(0),
  difficultyRating: z.number()
    .min(1, "Difficulty rating must be at least 1")
    .max(5, "Difficulty rating must be at most 5")
    .optional()
    .nullable(),
});

// ==========================================
// DEGREE PLAN SCHEMAS
// ==========================================

export const degreePlanInputSchema = z.object({
  id: degreeProgramIdSchema,
  code: degreeCodeSchema,
  name: z.string()
    .min(5, "Degree name must be at least 5 characters")
    .max(200, "Degree name must be at most 200 characters"),
  description: z.string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  level: z.enum(["bachelor", "master"])
    .optional()
    .default("bachelor"),
  college: z.string()
    .min(5, "College name must be at least 5 characters")
    .max(100, "College name must be at most 100 characters"),
  totalUnits: z.number()
    .int("Total units must be an integer")
    .min(60, "Total units must be at least 60")
    .max(180, "Total units must be at most 180"),
  courses: z.array(z.object({
    courseCode: courseCodeSchema,
    type: z.enum(["core", "general-education", "elective"]),
    term: z.number().int().min(1).max(12).optional(),
  }))
    .min(1, "Degree plan must have at least 1 course")
    .max(100, "Degree plan cannot have more than 100 courses")
    .optional()
    .default([]),
  communities: z.object({
    discord: z.array(z.object({
      serverId: discordIdSchema,
    })).optional().default([]),
    reddit: z.array(z.object({
      subredditId: subredditNameSchema,
    })).optional().default([]),
  }).optional(),
  stats: z.object({
    averageCompletionTime: z.number()
      .min(1, "Average completion time must be at least 1 month")
      .max(120, "Average completion time seems unrealistic")
      .optional(),
    popularCourseSequences: z.array(
      z.array(courseCodeSchema).min(2).max(10)
    ).optional(),
  }).optional().nullable(),
});

// ==========================================
// ERROR FORMATTING UTILITIES
// ==========================================

/**
 * Convert Zod validation errors to GraphQL errors
 * @param {z.ZodError} error - The Zod validation error
 * @return {GraphQLError} The formatted GraphQL error
 */
export function formatZodError(error: z.ZodError): GraphQLError {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join(".");
    return `${path}: ${issue.message}`;
  });

  return new GraphQLError(
    `Validation failed: ${issues.join("; ")}`,
    {
      extensions: {
        code: "BAD_USER_INPUT",
        validationErrors: error.issues,
      },
    }
  );
}

/**
 * Validate input with a Zod schema and return parsed data or throw GraphQL error
 * @param {z.ZodSchema<T>} schema - The Zod schema to validate against
 * @param {unknown} input - The input data to validate
 * @param {string} context - The context for validation errors
 * @return {T} The validated and parsed data
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  context?: string
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw formatZodError(error);
    }
    throw new GraphQLError(
      `${context ? `${context}: ` : ""}Validation failed`,
      {
        extensions: {code: "INTERNAL_SERVER_ERROR"},
      }
    );
  }
}

// ==========================================
// EXPORTED VALIDATION FUNCTIONS
// ==========================================

export const validateDiscordServerInput = (input: unknown) =>
  validateInput(discordServerInputSchema, input, "Discord server input");

export const validateDiscordServerUpdateInput = (input: unknown) =>
  validateInput(discordServerUpdateInputSchema, input, "Discord server update");

export const validateRedditCommunityInput = (input: unknown) =>
  validateInput(redditCommunityInputSchema, input, "Reddit community input");

export const validateRedditCommunityUpdateInput = (input: unknown) =>
  validateInput(redditCommunityUpdateInputSchema, input, "Reddit community update");

export const validateCourseInput = (input: unknown) =>
  validateInput(courseInputSchema, input, "Course input");

export const validateDegreePlanInput = (input: unknown) =>
  validateInput(degreePlanInputSchema, input, "Degree plan input");

// ==========================================
// TYPE EXPORTS
// ==========================================

export type DiscordServerInput = z.infer<typeof discordServerInputSchema>;
export type DiscordServerUpdateInput = z.infer<typeof discordServerUpdateInputSchema>;
export type RedditCommunityInput = z.infer<typeof redditCommunityInputSchema>;
export type RedditCommunityUpdateInput = z.infer<typeof redditCommunityUpdateInputSchema>;
export type CourseInput = z.infer<typeof courseInputSchema>;
export type DegreePlanInput = z.infer<typeof degreePlanInputSchema>;
