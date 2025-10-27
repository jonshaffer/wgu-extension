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
 * @param {string} sourceCollection - The source collection name
 * @param {string} sourceDocId - The source document ID
 * @param {string} targetCollection - The target collection name
 * @param {string} targetDocId - Optional target document ID
 * @return {Promise<void>}
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

  const data = sourceDoc.data();
  if (!data) {
    throw new Error("Source document has no data");
  }
  const docId = targetDocId || sourceDocId;

  // Remove admin-specific fields before copying
  // Extract only the reviewedBy field that we need
  const {reviewedBy} = data;

  // Create public data by omitting admin-specific fields
  const adminFields = [
    "submittedBy",
    "reviewNotes",
    "validationErrors",
    "version",
    "previousVersionId",
  ];
  const publicData = Object.fromEntries(
    Object.entries(data).filter(([key]) => !adminFields.includes(key))
  );

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
 * @param {Array} operations - Array of copy operations
 * @return {Promise<Object>} Batch operation results
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
    } catch (error: unknown) {
      results.failed.push({
        id: op.sourceDocId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
