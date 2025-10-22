/**
 * Firebase Admin Database Connection
 * Connects to the separate 'admin' Firestore database for suggestions and metadata
 */

import {getFirestore} from "firebase-admin/firestore";
import {initializeApp, getApps} from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

// Get reference to the admin database
export const adminDb = getFirestore("admin");

// Helper to get the default database (for reference)
export const defaultDb = getFirestore();

// Database names for clarity
export const DATABASES = {
  DEFAULT: "(default)",
  ADMIN: "admin",
} as const;

/**
 * Helper function to copy approved suggestions to the default database
 */
export async function copyToDefaultDatabase(
  sourceCollection: string,
  sourceDocId: string,
  targetCollection: string,
  targetDocId?: string
): Promise<void> {
  const sourceDoc = await adminDb.collection(sourceCollection).doc(sourceDocId).get();

  if (!sourceDoc.exists) {
    throw new Error("Source document not found");
  }

  const data = sourceDoc.data()!;
  const docId = targetDocId || sourceDocId;

  // Remove admin-specific fields before copying
  const {
    submittedBy,
    reviewedBy,
    reviewNotes,
    validationErrors,
    version,
    previousVersionId,
    ...publicData
  } = data;

  await defaultDb.collection(targetCollection).doc(docId).set({
    ...publicData,
    // Add metadata about the suggestion origin
    _metadata: {
      sourceDatabase: "admin",
      sourceSuggestionId: sourceDocId,
      appliedAt: new Date(),
      appliedBy: reviewedBy,
    },
  });
}

/**
 * Batch copy multiple approved suggestions
 */
export async function batchCopyToDefaultDatabase(
  operations: Array<{
    sourceCollection: string;
    sourceDocId: string;
    targetCollection: string;
    targetDocId?: string;
  }>
): Promise<{ successful: string[]; failed: Array<{ id: string; error: string }> }> {
  const results = {
    successful: [] as string[],
    failed: [] as Array<{ id: string; error: string }>,
  };

  for (const op of operations) {
    try {
      await copyToDefaultDatabase(
        op.sourceCollection,
        op.sourceDocId,
        op.targetCollection,
        op.targetDocId
      );
      results.successful.push(op.sourceDocId);
    } catch (error: any) {
      results.failed.push({
        id: op.sourceDocId,
        error: error.message || "Unknown error",
      });
    }
  }

  return results;
}
