import {GraphQLError} from "graphql";
import {adminDb} from "../lib/firebase-admin-db.js";
import {
  CourseSuggestion,
  DiscordServerSuggestion,
  RedditCommunitySuggestion,
  CommunityMappingSuggestion,
  SUGGESTION_COLLECTIONS,
  ValidationError,
} from "../lib/suggestion-model.js";

interface Context {
  user?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  };
}

// Input types matching GraphQL schema
interface CourseSuggestionInput {
  operation: "ADD" | "UPDATE" | "DELETE";
  targetCourseCode?: string;
  courseCode: string;
  name: string;
  description?: string;
  units: number;
  level: "UNDERGRADUATE" | "GRADUATE";
  type: "GENERAL" | "MAJOR" | "ELECTIVE";
  prerequisites?: string[];
  rationale: string;
}

interface DiscordSuggestionInput {
  operation: "ADD" | "UPDATE" | "DELETE";
  targetServerId?: string;
  name: string;
  description?: string;
  inviteUrl: string;
  channels?: Array<{
    name: string;
    type: string;
    associatedCourses?: string[];
  }>;
  tags: string[];
  rationale: string;
  evidence?: {
    memberCount?: number;
    screenshotUrls?: string[];
    verificationNotes?: string;
  };
}

interface RedditSuggestionInput {
  operation: "ADD" | "UPDATE" | "DELETE";
  targetSubreddit?: string;
  subredditName: string;
  displayName: string;
  description?: string;
  type: "MAIN" | "PROGRAM_SPECIFIC" | "COURSE_SPECIFIC";
  associatedPrograms?: string[];
  associatedCourses?: string[];
  tags: string[];
  rationale: string;
}

interface CommunityMappingInput {
  courseCode: string;
  communityType: "DISCORD" | "REDDIT" | "WGU_CONNECT";
  communityId: string;
  communityName: string;
  action: "ADD" | "REMOVE" | "UPDATE";
  relevance: "DIRECT" | "PROGRAM" | "GENERAL";
  confidence: number;
  rationale: string;
}

// Validation functions
function validateCourseSuggestion(input: CourseSuggestionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Course code validation
  if (!input.courseCode.match(/^[A-Z]+\d+$/)) {
    errors.push({
      field: "courseCode",
      message: "Course code must be uppercase letters followed by numbers (e.g., C779)",
      severity: "error",
    });
  }

  // Operation-specific validation
  if (input.operation === "UPDATE" || input.operation === "DELETE") {
    if (!input.targetCourseCode) {
      errors.push({
        field: "targetCourseCode",
        message: "Target course code is required for update/delete operations",
        severity: "error",
      });
    }
  }

  // Units validation
  if (input.units < 1 || input.units > 12) {
    errors.push({
      field: "units",
      message: "Course units must be between 1 and 12",
      severity: "error",
    });
  }

  // Name validation
  if (input.name.length < 3 || input.name.length > 200) {
    errors.push({
      field: "name",
      message: "Course name must be between 3 and 200 characters",
      severity: "error",
    });
  }

  return errors;
}

function validateDiscordSuggestion(input: DiscordSuggestionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Discord invite URL validation
  const discordPattern =
    /^https?:\/\/(discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+)$/;
  if (!input.inviteUrl.match(discordPattern)) {
    errors.push({
      field: "inviteUrl",
      message: "Invalid Discord invite URL format",
      severity: "error",
    });
  }

  // Operation-specific validation
  if (input.operation === "UPDATE" || input.operation === "DELETE") {
    if (!input.targetServerId) {
      errors.push({
        field: "targetServerId",
        message: "Target server ID is required for update/delete operations",
        severity: "error",
      });
    }
  }

  // Evidence for new servers
  if (input.operation === "ADD" && (!input.evidence || !input.evidence.memberCount)) {
    errors.push({
      field: "evidence.memberCount",
      message: "Member count is recommended for new server suggestions",
      severity: "warning",
    });
  }

  return errors;
}

function validateRedditSuggestion(input: RedditSuggestionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Subreddit name validation
  if (!input.subredditName.match(/^[A-Za-z0-9][A-Za-z0-9_]{2,20}$/)) {
    errors.push({
      field: "subredditName",
      message: "Invalid subreddit name format",
      severity: "error",
    });
  }

  // Operation-specific validation
  if (input.operation === "UPDATE" || input.operation === "DELETE") {
    if (!input.targetSubreddit) {
      errors.push({
        field: "targetSubreddit",
        message: "Target subreddit is required for update/delete operations",
        severity: "error",
      });
    }
  }

  return errors;
}

function validateCommunityMapping(input: CommunityMappingInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Course code validation
  if (!input.courseCode.match(/^[A-Z]+\d+$/)) {
    errors.push({
      field: "courseCode",
      message: "Invalid course code format",
      severity: "error",
    });
  }

  // Confidence validation
  if (input.confidence < 0 || input.confidence > 1) {
    errors.push({
      field: "confidence",
      message: "Confidence must be between 0 and 1",
      severity: "error",
    });
  }

  return errors;
}

// Resolver functions
export async function submitCourseSuggestion(
  _parent: unknown,
  {input}: { input: CourseSuggestionInput },
  context: Context
) {
  // Check authentication
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {code: "UNAUTHENTICATED"},
    });
  }

  // Validate input
  const validationErrors = validateCourseSuggestion(input);
  if (validationErrors.some((e) => e.severity === "error")) {
    return {
      success: false,
      suggestionId: null,
      message: "Validation failed",
      validationErrors,
    };
  }

  try {
    // Create suggestion document
    const suggestionRef = adminDb.collection(SUGGESTION_COLLECTIONS.SUGGESTIONS).doc();
    const suggestion: CourseSuggestion = {
      id: suggestionRef.id,
      type: `course_${input.operation.toLowerCase()}` as any,
      operation: input.operation.toLowerCase() as any,
      status: "draft",
      submittedBy: {
        userId: context.user.uid,
        email: context.user.email,
        isAdmin: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      title: `${input.operation} course ${input.courseCode}`,
      description: input.rationale,
      rationale: input.rationale,
      tags: ["course", input.level.toLowerCase()],
      priority: "medium",
      targetId: input.targetCourseCode,
      data: {
        courseCode: input.courseCode,
        name: input.name,
        description: input.description,
        units: input.units,
        level: input.level.toLowerCase() as any,
        type: input.type.toLowerCase() as any,
        prerequisites: input.prerequisites || [],
      },
      validationErrors,
      validationPassed: !validationErrors.some((e) => e.severity === "error"),
    };

    await suggestionRef.set(suggestion);

    // Log to audit
    await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
      action: "suggestion_created",
      entityType: "course",
      entityId: suggestionRef.id,
      userId: context.user.uid,
      timestamp: new Date(),
      details: {
        operation: input.operation,
        courseCode: input.courseCode,
      },
    });

    return {
      success: true,
      suggestionId: suggestionRef.id,
      message: "Course suggestion created successfully",
      validationErrors,
    };
  } catch (error: any) {
    console.error("Error creating course suggestion:", error);
    throw new GraphQLError("Failed to create suggestion", {
      extensions: {code: "INTERNAL_ERROR"},
    });
  }
}

export async function submitDiscordSuggestion(
  _parent: unknown,
  {input}: { input: DiscordSuggestionInput },
  context: Context
) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {code: "UNAUTHENTICATED"},
    });
  }

  const validationErrors = validateDiscordSuggestion(input);
  if (validationErrors.some((e) => e.severity === "error")) {
    return {
      success: false,
      suggestionId: null,
      message: "Validation failed",
      validationErrors,
    };
  }

  try {
    const suggestionRef = adminDb.collection(SUGGESTION_COLLECTIONS.SUGGESTIONS).doc();
    const suggestion: DiscordServerSuggestion = {
      id: suggestionRef.id,
      type: `discord_${input.operation.toLowerCase()}` as any,
      operation: input.operation.toLowerCase() as any,
      status: "draft",
      submittedBy: {
        userId: context.user.uid,
        email: context.user.email,
        isAdmin: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      title: `${input.operation} Discord server: ${input.name}`,
      description: input.rationale,
      rationale: input.rationale,
      tags: ["discord", ...input.tags],
      priority: "medium",
      targetId: input.targetServerId,
      data: {
        serverId: input.targetServerId,
        name: input.name,
        description: input.description,
        inviteUrl: input.inviteUrl,
        channels: input.channels?.map((ch) => ({
          ...ch,
          type: ch.type as any,
        })),
        tags: input.tags,
        evidence: input.evidence,
      },
      validationErrors,
      validationPassed: !validationErrors.some((e) => e.severity === "error"),
    };

    await suggestionRef.set(suggestion);

    await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
      action: "suggestion_created",
      entityType: "discord",
      entityId: suggestionRef.id,
      userId: context.user.uid,
      timestamp: new Date(),
      details: {
        operation: input.operation,
        serverName: input.name,
      },
    });

    return {
      success: true,
      suggestionId: suggestionRef.id,
      message: "Discord server suggestion created successfully",
      validationErrors,
    };
  } catch (error: any) {
    console.error("Error creating Discord suggestion:", error);
    throw new GraphQLError("Failed to create suggestion", {
      extensions: {code: "INTERNAL_ERROR"},
    });
  }
}

export async function submitRedditSuggestion(
  _parent: unknown,
  {input}: { input: RedditSuggestionInput },
  context: Context
) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {code: "UNAUTHENTICATED"},
    });
  }

  const validationErrors = validateRedditSuggestion(input);
  if (validationErrors.some((e) => e.severity === "error")) {
    return {
      success: false,
      suggestionId: null,
      message: "Validation failed",
      validationErrors,
    };
  }

  try {
    const suggestionRef = adminDb.collection(SUGGESTION_COLLECTIONS.SUGGESTIONS).doc();
    const suggestion: RedditCommunitySuggestion = {
      id: suggestionRef.id,
      type: `reddit_${input.operation.toLowerCase()}` as any,
      operation: input.operation.toLowerCase() as any,
      status: "draft",
      submittedBy: {
        userId: context.user.uid,
        email: context.user.email,
        isAdmin: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      title: `${input.operation} Reddit community: r/${input.subredditName}`,
      description: input.rationale,
      rationale: input.rationale,
      tags: ["reddit", ...input.tags],
      priority: "medium",
      targetId: input.targetSubreddit,
      data: {
        subredditName: input.subredditName,
        displayName: input.displayName,
        description: input.description,
        type: input.type.toLowerCase().replace("_", "-") as any,
        associatedPrograms: input.associatedPrograms || [],
        associatedCourses: input.associatedCourses || [],
        tags: input.tags,
      },
      validationErrors,
      validationPassed: !validationErrors.some((e) => e.severity === "error"),
    };

    await suggestionRef.set(suggestion);

    await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
      action: "suggestion_created",
      entityType: "reddit",
      entityId: suggestionRef.id,
      userId: context.user.uid,
      timestamp: new Date(),
      details: {
        operation: input.operation,
        subreddit: input.subredditName,
      },
    });

    return {
      success: true,
      suggestionId: suggestionRef.id,
      message: "Reddit community suggestion created successfully",
      validationErrors,
    };
  } catch (error: any) {
    console.error("Error creating Reddit suggestion:", error);
    throw new GraphQLError("Failed to create suggestion", {
      extensions: {code: "INTERNAL_ERROR"},
    });
  }
}

export async function submitCommunityMapping(
  _parent: unknown,
  {input}: { input: CommunityMappingInput },
  context: Context
) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {code: "UNAUTHENTICATED"},
    });
  }

  const validationErrors = validateCommunityMapping(input);
  if (validationErrors.some((e) => e.severity === "error")) {
    return {
      success: false,
      suggestionId: null,
      message: "Validation failed",
      validationErrors,
    };
  }

  try {
    const suggestionRef = adminDb.collection(SUGGESTION_COLLECTIONS.SUGGESTIONS).doc();
    const suggestion: CommunityMappingSuggestion = {
      id: suggestionRef.id,
      type: "community_mapping",
      operation: input.action.toLowerCase() === "remove" ?
        "delete" :
        input.action.toLowerCase() as any,
      status: "draft",
      submittedBy: {
        userId: context.user.uid,
        email: context.user.email,
        isAdmin: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      title: `${input.action} ${input.communityType} mapping for ${input.courseCode}`,
      description: input.rationale,
      rationale: input.rationale,
      tags: ["mapping", input.communityType.toLowerCase()],
      priority: "medium",
      data: {
        courseCode: input.courseCode,
        community: {
          type: input.communityType.toLowerCase() as any,
          id: input.communityId,
          name: input.communityName,
        },
        action: input.action.toLowerCase() as any,
        relevance: input.relevance.toLowerCase() as any,
        confidence: input.confidence,
        rationale: input.rationale,
      },
      validationErrors,
      validationPassed: !validationErrors.some((e) => e.severity === "error"),
    };

    await suggestionRef.set(suggestion);

    await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
      action: "suggestion_created",
      entityType: "mapping",
      entityId: suggestionRef.id,
      userId: context.user.uid,
      timestamp: new Date(),
      details: {
        courseCode: input.courseCode,
        communityType: input.communityType,
        communityId: input.communityId,
      },
    });

    return {
      success: true,
      suggestionId: suggestionRef.id,
      message: "Community mapping suggestion created successfully",
      validationErrors,
    };
  } catch (error: any) {
    console.error("Error creating mapping suggestion:", error);
    throw new GraphQLError("Failed to create suggestion", {
      extensions: {code: "INTERNAL_ERROR"},
    });
  }
}
