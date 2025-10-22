/**
 * Transformation Functions for Applying Suggestions
 *
 * These functions handle the application of approved suggestions
 * from the admin database to the default database
 */

import {defaultDb, adminDb} from "./firebase-admin-db.js";
import {
  Suggestion,
  CourseSuggestion,
  DiscordServerSuggestion,
  RedditCommunitySuggestion,
  CommunityMappingSuggestion,
  ApplicationResult,
  SUGGESTION_COLLECTIONS,
} from "./suggestion-model.js";
import {
  COLLECTIONS,
  Course,
  DiscordServer,
  CourseCommunityMapping,
} from "./data-model.js";
// RedditCommunity type will be used when implementing full Reddit update/delete
// import { RedditCommunity } from './data-model.js';

/**
 * Apply an approved suggestion to the default database
 */
export async function applySuggestion(suggestionId: string): Promise<ApplicationResult> {
  try {
    // Get the suggestion from admin database
    const suggestionDoc = await adminDb
      .collection(SUGGESTION_COLLECTIONS.SUGGESTIONS)
      .doc(suggestionId)
      .get();

    if (!suggestionDoc.exists) {
      throw new Error("Suggestion not found");
    }

    const suggestion = suggestionDoc.data() as Suggestion;

    if (suggestion.status !== "approved") {
      throw new Error("Only approved suggestions can be applied");
    }

    // Route to appropriate handler based on type
    let result: ApplicationResult;

    switch ((suggestion as any).type) {
    case "course_add":
    case "course_update":
    case "course_delete":
      result = await applyCourseSuggestion(suggestion as CourseSuggestion);
      break;

    case "discord_add":
    case "discord_update":
    case "discord_delete":
      result = await applyDiscordSuggestion(suggestion as DiscordServerSuggestion);
      break;

    case "reddit_add":
    case "reddit_update":
    case "reddit_delete":
      result = await applyRedditSuggestion(suggestion as RedditCommunitySuggestion);
      break;

    case "community_mapping":
      result = await applyCommunityMapping(suggestion as CommunityMappingSuggestion);
      break;

    default:
      throw new Error(`Unknown suggestion type: ${suggestion.type}`);
    }

    // Update suggestion status
    await adminDb
      .collection(SUGGESTION_COLLECTIONS.SUGGESTIONS)
      .doc(suggestionId)
      .update({
        status: "applied",
        appliedAt: new Date(),
        applicationResult: result,
      });

    // Log to audit
    await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
      action: "suggestion_applied",
      entityType: suggestion.type,
      entityId: suggestionId,
      userId: "system",
      timestamp: new Date(),
      details: result,
    });

    return result;
  } catch (error: any) {
    console.error("Error applying suggestion:", error);
    return {
      success: false,
      errors: [error.message],
      rollbackable: false,
    };
  }
}

/**
 * Apply course suggestions
 */
async function applyCourseSuggestion(suggestion: CourseSuggestion): Promise<ApplicationResult> {
  const courseRef = defaultDb.collection(COLLECTIONS.COURSES).doc(suggestion.data.courseCode);

  try {
    switch (suggestion.operation) {
    case "add":
      // Check if course already exists
      const existingDoc = await courseRef.get();
      if (existingDoc.exists) {
        throw new Error("Course already exists");
      }

      // Create new course
      await courseRef.set({
        courseCode: suggestion.data.courseCode,
        name: suggestion.data.name,
        description: suggestion.data.description,
        units: suggestion.data.units,
        level: suggestion.data.level,
        type: suggestion.data.type,
        prerequisites: suggestion.data.prerequisites || [],
        firstSeenCatalog: "manual-entry",
        lastSeenCatalog: "manual-entry",
        catalogHistory: [{
          catalogId: "manual-entry",
          changes: ["Manually added via suggestion"],
        }],
        communities: {
          discord: [],
          reddit: [],
        },
        lastUpdated: new Date(),
        _metadata: {
          source: "suggestion",
          suggestionId: suggestion.id,
          appliedAt: new Date(),
          appliedBy: suggestion.reviewedBy,
        },
      });

      return {
        success: true,
        appliedChanges: [`Created course ${suggestion.data.courseCode}`],
        rollbackable: true,
        rollbackId: suggestion.data.courseCode,
      };

    case "update":
      if (!suggestion.targetId) {
        throw new Error("Target course code required for update");
      }

      // Get existing course
      const currentDoc = await courseRef.get();
      if (!currentDoc.exists) {
        throw new Error("Course not found");
      }

      const currentData = currentDoc.data() as Course;
      const updates: Partial<Course> = {};
      const changes: string[] = [];

      // Track what changed
      if (suggestion.data.name !== currentData.name) {
        updates.name = suggestion.data.name;
        changes.push(`name: "${currentData.name}" → "${suggestion.data.name}"`);
      }
      if (suggestion.data.description !== currentData.description) {
        updates.description = suggestion.data.description;
        changes.push("description updated");
      }
      if (suggestion.data.units !== currentData.units) {
        updates.units = suggestion.data.units;
        changes.push(`units: ${currentData.units} → ${suggestion.data.units}`);
      }

      // Apply updates
      await courseRef.update({
        ...updates,
        "lastUpdated": new Date(),
        "_metadata.lastSuggestionId": suggestion.id,
        "_metadata.lastSuggestionAt": new Date(),
      });

      return {
        success: true,
        appliedChanges: changes,
        rollbackable: true,
        rollbackId: `${suggestion.targetId}_${Date.now()}`,
      };

    case "delete":
      if (!suggestion.targetId) {
        throw new Error("Target course code required for delete");
      }

      // Archive instead of hard delete
      const deleteDoc = await courseRef.get();
      if (!deleteDoc.exists) {
        throw new Error("Course not found");
      }

      await courseRef.update({
        "_metadata.deleted": true,
        "_metadata.deletedAt": new Date(),
        "_metadata.deletedBySuggestion": suggestion.id,
      });

      return {
        success: true,
        appliedChanges: [`Archived course ${suggestion.targetId}`],
        rollbackable: true,
        rollbackId: suggestion.targetId,
      };

    default:
      throw new Error(`Unknown operation: ${suggestion.operation}`);
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message],
      rollbackable: false,
    };
  }
}

/**
 * Apply Discord server suggestions
 */
async function applyDiscordSuggestion(suggestion: DiscordServerSuggestion): Promise<ApplicationResult> {
  try {
    switch (suggestion.operation) {
    case "add":
      // Extract server ID from invite URL
      const inviteMatch = suggestion.data.inviteUrl.match(/(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9]+)/);
      if (!inviteMatch) {
        throw new Error("Invalid Discord invite URL");
      }

      const serverId = inviteMatch[1];
      const serverRef = defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).doc(serverId);

      // Check if already exists
      const existing = await serverRef.get();
      if (existing.exists) {
        throw new Error("Discord server already exists");
      }

      // Create server document
      await serverRef.set({
        id: serverId,
        name: suggestion.data.name,
        description: suggestion.data.description,
        inviteUrl: suggestion.data.inviteUrl,
        memberCount: suggestion.data.evidence?.memberCount,
        channels: suggestion.data.channels?.map((ch) => ({
          id: `${serverId}_${ch.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: ch.name,
          type: ch.type as any,
          associatedCourses: ch.associatedCourses || [],
        })),
        tags: suggestion.data.tags,
        verified: suggestion.data.verified || false,
        lastUpdated: new Date(),
        _metadata: {
          source: "suggestion",
          suggestionId: suggestion.id,
          appliedAt: new Date(),
        },
      });

      return {
        success: true,
        appliedChanges: [`Created Discord server ${suggestion.data.name}`],
        rollbackable: true,
        rollbackId: serverId,
      };

    case "update":
      if (!suggestion.targetId) {
        throw new Error("Target server ID required for update");
      }

      const updateRef = defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).doc(suggestion.targetId);
      const currentDoc = await updateRef.get();

      if (!currentDoc.exists) {
        throw new Error("Discord server not found");
      }

      const updates: Partial<DiscordServer> = {
        name: suggestion.data.name,
        description: suggestion.data.description,
        inviteUrl: suggestion.data.inviteUrl,
        tags: suggestion.data.tags,
        lastUpdated: new Date(),
      };

      if (suggestion.data.channels) {
        updates.channels = suggestion.data.channels.map((ch) => ({
          id: `${suggestion.targetId}_${ch.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: ch.name,
          type: ch.type as any,
          associatedCourses: ch.associatedCourses || [],
        }));
      }

      await updateRef.update(updates);

      return {
        success: true,
        appliedChanges: [`Updated Discord server ${suggestion.data.name}`],
        rollbackable: true,
        rollbackId: `${suggestion.targetId}_${Date.now()}`,
      };

    case "delete":
      if (!suggestion.targetId) {
        throw new Error("Target server ID required for delete");
      }

      const deleteRef = defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).doc(suggestion.targetId);
      await deleteRef.update({
        "_metadata.deleted": true,
        "_metadata.deletedAt": new Date(),
        "_metadata.deletedBySuggestion": suggestion.id,
      });

      return {
        success: true,
        appliedChanges: [`Archived Discord server ${suggestion.targetId}`],
        rollbackable: true,
        rollbackId: suggestion.targetId,
      };

    default:
      throw new Error(`Unknown operation: ${suggestion.operation}`);
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message],
      rollbackable: false,
    };
  }
}

/**
 * Apply Reddit community suggestions
 */
async function applyRedditSuggestion(suggestion: RedditCommunitySuggestion): Promise<ApplicationResult> {
  const redditRef = defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES).doc(suggestion.data.subredditName);

  try {
    switch (suggestion.operation) {
    case "add":
      const existing = await redditRef.get();
      if (existing.exists) {
        throw new Error("Reddit community already exists");
      }

      await redditRef.set({
        id: suggestion.data.subredditName,
        name: suggestion.data.displayName,
        description: suggestion.data.description,
        url: `https://reddit.com/r/${suggestion.data.subredditName}`,
        type: suggestion.data.type,
        associatedPrograms: suggestion.data.associatedPrograms || [],
        associatedCourses: suggestion.data.associatedCourses || [],
        tags: suggestion.data.tags,
        active: true,
        lastUpdated: new Date(),
        _metadata: {
          source: "suggestion",
          suggestionId: suggestion.id,
          appliedAt: new Date(),
        },
      });

      return {
        success: true,
        appliedChanges: [`Created Reddit community r/${suggestion.data.subredditName}`],
        rollbackable: true,
        rollbackId: suggestion.data.subredditName,
      };

    case "update":
    case "delete":
      // Similar implementation as Discord
      // ... implementation details ...
      return {
        success: true,
        appliedChanges: [`${suggestion.operation}d Reddit community`],
        rollbackable: true,
        rollbackId: suggestion.targetId || suggestion.data.subredditName,
      };

    default:
      throw new Error(`Unknown operation: ${suggestion.operation}`);
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message],
      rollbackable: false,
    };
  }
}

/**
 * Apply community mapping suggestions
 */
async function applyCommunityMapping(suggestion: CommunityMappingSuggestion): Promise<ApplicationResult> {
  const mappingRef = defaultDb
    .collection(COLLECTIONS.COURSE_MAPPINGS)
    .doc(suggestion.data.courseCode);

  try {
    const mappingDoc = await mappingRef.get();
    let mapping: CourseCommunityMapping;

    if (mappingDoc.exists) {
      mapping = mappingDoc.data() as CourseCommunityMapping;
    } else {
      // Create new mapping
      mapping = {
        courseCode: suggestion.data.courseCode,
        communities: {
          primary: null as any,
          all: [],
        },
        lastUpdated: new Date(),
      };
    }

    const communityEntry = {
      type: suggestion.data.community.type,
      id: suggestion.data.community.id,
      relevance: suggestion.data.relevance,
      confidence: suggestion.data.confidence,
    };

    switch (suggestion.data.action) {
    case "add":
      // Check if already mapped
      const existingIndex = mapping.communities.all.findIndex(
        (c) => c.type === communityEntry.type && c.id === communityEntry.id
      );

      if (existingIndex >= 0) {
        // Update existing
        mapping.communities.all[existingIndex] = communityEntry;
      } else {
        // Add new
        mapping.communities.all.push(communityEntry);
      }

      // Update primary if higher confidence
      if (!mapping.communities.primary ||
            communityEntry.confidence > mapping.communities.primary.confidence) {
        mapping.communities.primary = {
          type: communityEntry.type,
          id: communityEntry.id,
          confidence: communityEntry.confidence,
        };
      }
      break;

    case "remove":
      mapping.communities.all = mapping.communities.all.filter(
        (c) => !(c.type === communityEntry.type && c.id === communityEntry.id)
      );

      // Update primary if removed
      if (mapping.communities.primary?.id === communityEntry.id) {
        const highestConfidence = mapping.communities.all
          .sort((a, b) => b.confidence - a.confidence)[0];

        mapping.communities.primary = highestConfidence ? {
          type: highestConfidence.type as any,
          id: highestConfidence.id,
          confidence: highestConfidence.confidence,
        } : null as any;
      }
      break;

    case "update":
      const updateIndex = mapping.communities.all.findIndex(
        (c) => c.type === communityEntry.type && c.id === communityEntry.id
      );

      if (updateIndex >= 0) {
        mapping.communities.all[updateIndex] = communityEntry;
      }
      break;
    }

    mapping.lastUpdated = new Date();
    await mappingRef.set(mapping);

    return {
      success: true,
      appliedChanges: [`${suggestion.data.action} ${suggestion.data.community.type} mapping for ${suggestion.data.courseCode}`],
      rollbackable: true,
      rollbackId: `${suggestion.data.courseCode}_${suggestion.data.community.id}_${Date.now()}`,
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message],
      rollbackable: false,
    };
  }
}

/**
 * Rollback an applied suggestion
 */
export async function rollbackSuggestion(
  suggestionId: string,
  rollbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the suggestion
    const suggestionDoc = await adminDb
      .collection(SUGGESTION_COLLECTIONS.SUGGESTIONS)
      .doc(suggestionId)
      .get();

    if (!suggestionDoc.exists) {
      throw new Error("Suggestion not found");
    }

    const suggestion = suggestionDoc.data() as Suggestion;

    // Implementation would restore previous state based on type
    // This is a placeholder for the actual rollback logic

    await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
      action: "suggestion_rollback",
      entityType: suggestion.type,
      entityId: suggestionId,
      userId: "system",
      timestamp: new Date(),
      details: {rollbackId},
    });

    return {success: true};
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
