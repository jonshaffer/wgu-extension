/**
 * Cloud Function to process approved suggestions
 * This is triggered by admin actions or can be called directly
 */

import {onRequest} from "firebase-functions/v2/https";
import {adminDb} from "../lib/firebase-admin-db.js";
import {applySuggestion} from "../lib/suggestion-transformations.js";
import {SUGGESTION_COLLECTIONS} from "../lib/suggestion-model.js";
import {requireAdmin} from "../lib/auth-utils.js";

export const processSuggestionsApi = onRequest(
  {
    cors: false,
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== "POST") {
        response.status(405).json({error: "Method not allowed"});
        return;
      }

      // Require admin authentication
      const authInfo = await requireAdmin(request);
      console.log(`Processing suggestions requested by: ${authInfo.userEmail || authInfo.userId}`);

      const {suggestionIds, action} = request.body;

      if (!suggestionIds || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
        response.status(400).json({error: "suggestionIds array is required"});
        return;
      }

      if (!action || !["apply", "reject"].includes(action)) {
        response.status(400).json({error: "action must be \"apply\" or \"reject\""});
        return;
      }

      const results = {
        successful: [] as string[],
        failed: [] as { id: string; error: string }[],
      };

      for (const suggestionId of suggestionIds) {
        try {
          if (action === "apply") {
            // Apply the suggestion
            const result = await applySuggestion(suggestionId);

            if (result.success) {
              results.successful.push(suggestionId);
            } else {
              results.failed.push({
                id: suggestionId,
                error: result.errors?.join(", ") || "Unknown error",
              });
            }
          } else {
            // Reject the suggestion
            await adminDb
              .collection(SUGGESTION_COLLECTIONS.SUGGESTIONS)
              .doc(suggestionId)
              .update({
                status: "rejected",
                rejectedAt: new Date(),
                rejectedBy: {
                  userId: authInfo.userId,
                  email: authInfo.userEmail,
                },
              });

            results.successful.push(suggestionId);
          }

          // Log the action
          await adminDb.collection(SUGGESTION_COLLECTIONS.AUDIT_LOG).add({
            action: `suggestion_${action}`,
            entityType: "suggestion",
            entityId: suggestionId,
            userId: authInfo.userId,
            userEmail: authInfo.userEmail,
            timestamp: new Date(),
          });
        } catch (error: any) {
          console.error(`Error processing suggestion ${suggestionId}:`, error);
          results.failed.push({
            id: suggestionId,
            error: error.message || "Processing failed",
          });
        }
      }

      response.status(200).json({
        action,
        results,
        summary: {
          total: suggestionIds.length,
          successful: results.successful.length,
          failed: results.failed.length,
        },
      });
    } catch (error: any) {
      console.error("Error in processSuggestions:", error);
      response.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);
