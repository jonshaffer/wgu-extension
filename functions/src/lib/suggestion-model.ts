/**
 * Suggestion and Change Request Data Model
 *
 * This file defines the data model for community-submitted suggestions
 * and change requests that are stored in a separate Firestore database
 */

// ==========================================
// SUGGESTION TYPES
// ==========================================

export type SuggestionType =
  | "course_add"
  | "course_update"
  | "course_delete"
  | "discord_add"
  | "discord_update"
  | "discord_delete"
  | "reddit_add"
  | "reddit_update"
  | "reddit_delete"
  | "wgu_connect_add"
  | "wgu_connect_update"
  | "wgu_connect_delete"
  | "degree_update"
  | "community_mapping";

export type SuggestionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "applied"
  | "archived";

export type ChangeOperation = "add" | "update" | "delete";

// ==========================================
// BASE SUGGESTION INTERFACE
// ==========================================

export interface BaseSuggestion {
  id: string;
  type: SuggestionType;
  operation: ChangeOperation;
  status: SuggestionStatus;

  // Submitter info
  submittedBy: {
    userId?: string; // Optional for anonymous submissions
    email?: string;
    displayName?: string;
    isAdmin?: boolean;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  appliedAt?: Date;

  // Review process
  reviewedBy?: {
    userId: string;
    email: string;
    displayName: string;
  };
  reviewNotes?: string;
  rejectionReason?: string;

  // Version control
  version: number;
  previousVersionId?: string;

  // Metadata
  title: string;
  description: string;
  rationale?: string;
  tags: string[];
  priority: "low" | "medium" | "high";

  // Validation
  validationErrors?: ValidationError[];
  validationPassed?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

// ==========================================
// SPECIFIC SUGGESTION TYPES
// ==========================================

export interface CourseSuggestion extends BaseSuggestion {
  type: "course_add" | "course_update" | "course_delete";
  targetId?: string; // Course code for updates/deletes

  data: {
    courseCode: string;
    name: string;
    description?: string;
    units: number;
    level: "undergraduate" | "graduate";
    type: "general" | "major" | "elective";
    prerequisites?: string[];

    // For updates, track what changed
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  };
}

export interface DiscordServerSuggestion extends BaseSuggestion {
  type: "discord_add" | "discord_update" | "discord_delete";
  targetId?: string; // Server ID for updates/deletes

  data: {
    serverId?: string;
    name: string;
    description?: string;
    inviteUrl: string;
    channels?: {
      name: string;
      type: "course" | "general" | "study-group" | "other";
      associatedCourses?: string[];
    }[];
    tags: string[];
    verified?: boolean;

    // Evidence of server legitimacy
    evidence?: {
      memberCount?: number;
      screenshotUrls?: string[];
      verificationNotes?: string;
    };
  };
}

export interface RedditCommunitySuggestion extends BaseSuggestion {
  type: "reddit_add" | "reddit_update" | "reddit_delete";
  targetId?: string; // Subreddit name for updates/deletes

  data: {
    subredditName: string;
    displayName: string;
    description?: string;
    subscriberCount?: number;
    type: "main" | "program-specific" | "course-specific";
    associatedPrograms?: string[];
    associatedCourses?: string[];
    tags: string[];

    // Verification
    isNsfw?: boolean;
    isQuarantined?: boolean;
    verificationStatus?: "verified" | "unverified" | "suspicious";
  };
}

export interface CommunityMappingSuggestion extends BaseSuggestion {
  type: "community_mapping";

  data: {
    courseCode: string;
    community: {
      type: "discord" | "reddit" | "wgu-connect";
      id: string;
      name: string;
    };
    action: "add" | "remove" | "update";
    relevance: "direct" | "program" | "general";
    confidence: number; // 0-1
    rationale: string;
  };
}

// Union type for all suggestions
export type Suggestion =
  | CourseSuggestion
  | DiscordServerSuggestion
  | RedditCommunitySuggestion
  | CommunityMappingSuggestion;

// ==========================================
// APPROVAL WORKFLOW
// ==========================================

export interface ApprovalWorkflow {
  id: string;
  suggestionId: string;
  suggestionType: SuggestionType;

  // Workflow stages
  stages: WorkflowStage[];
  currentStageIndex: number;

  // Overall status
  status: "active" | "completed" | "cancelled";
  outcome?: "approved" | "rejected";

  // Timestamps
  startedAt: Date;
  completedAt?: Date;

  // Requirements
  requiredApprovals: number;
  currentApprovals: number;
  approvers: Approver[];
}

export interface WorkflowStage {
  name: string;
  type: "validation" | "review" | "approval" | "application";
  status: "pending" | "in_progress" | "completed" | "failed";

  startedAt?: Date;
  completedAt?: Date;

  // Stage-specific data
  validationResults?: ValidationResult[];
  reviewComments?: ReviewComment[];
  approvalVotes?: ApprovalVote[];
  applicationResult?: ApplicationResult;
}

export interface Approver {
  userId: string;
  email: string;
  role: "admin" | "moderator" | "trusted_contributor";
  canApprove: boolean;
}

export interface ValidationResult {
  validator: string; // Name of validation function
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  timestamp: Date;
}

export interface ReviewComment {
  userId: string;
  displayName: string;
  comment: string;
  timestamp: Date;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface ApprovalVote {
  userId: string;
  displayName: string;
  vote: "approve" | "reject" | "abstain";
  reason?: string;
  timestamp: Date;
}

export interface ApplicationResult {
  success: boolean;
  appliedChanges?: string[];
  errors?: string[];
  rollbackable: boolean;
  rollbackId?: string;
}

// ==========================================
// BATCH OPERATIONS
// ==========================================

export interface SuggestionBatch {
  id: string;
  title: string;
  description: string;
  suggestionIds: string[];

  status: "draft" | "submitted" | "processing" | "completed";

  submittedBy: {
    userId: string;
    email: string;
    displayName: string;
  };

  createdAt: Date;
  submittedAt?: Date;
  completedAt?: Date;

  // Batch results
  results?: {
    successful: string[];
    failed: Array<{
      suggestionId: string;
      error: string;
    }>;
  };
}

// ==========================================
// ANALYTICS & METRICS
// ==========================================

export interface SuggestionMetrics {
  id: string; // Date-based ID like "2024-01"
  period: "day" | "week" | "month";
  periodStart: Date;
  periodEnd: Date;

  // Counts by type
  totalSuggestions: number;
  byType: Record<SuggestionType, number>;
  byStatus: Record<SuggestionStatus, number>;
  byOperation: Record<ChangeOperation, number>;

  // User metrics
  uniqueSubmitters: number;
  topSubmitters: Array<{
    userId: string;
    displayName: string;
    count: number;
  }>;

  // Approval metrics
  approvalRate: number;
  averageReviewTime: number; // in hours
  averageApprovalTime: number; // in hours

  // Quality metrics
  validationPassRate: number;
  implementationSuccessRate: number;
}

// ==========================================
// FIRESTORE COLLECTIONS (Suggestions DB)
// ==========================================

export const SUGGESTION_COLLECTIONS = {
  // Core collections
  SUGGESTIONS: "suggestions",
  WORKFLOWS: "approval-workflows",
  BATCHES: "suggestion-batches",

  // Analytics
  METRICS: "suggestion-metrics",
  AUDIT_LOG: "audit-log",

  // Configuration
  VALIDATORS: "validators",
  PERMISSIONS: "permissions",
} as const;

// ==========================================
// PERMISSIONS MODEL
// ==========================================

export interface UserPermissions {
  userId: string;
  email: string;
  displayName: string;

  roles: Array<"admin" | "moderator" | "trusted_contributor" | "contributor">;

  permissions: {
    canSubmitSuggestions: boolean;
    canReviewSuggestions: boolean;
    canApproveSuggestions: boolean;
    canApplySuggestions: boolean;
    canDeleteSuggestions: boolean;
    canManagePermissions: boolean;

    // Type-specific permissions
    allowedSuggestionTypes?: SuggestionType[];
    deniedSuggestionTypes?: SuggestionType[];
  };

  // Rate limits
  rateLimits?: {
    maxSuggestionsPerDay?: number;
    maxSuggestionsPerWeek?: number;
    maxBatchSize?: number;
  };

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
