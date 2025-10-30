/**
 * Test Helper Utilities
 *
 * Provides utility functions for seeding, cleaning, and asserting on test data.
 * These helpers standardize common test operations and reduce boilerplate.
 *
 * Usage:
 * ```typescript
 * import { seedCollection, clearAllCollections, assertGraphQLSuccess } from './fixtures/test-helpers';
 *
 * beforeEach(async () => {
 *   await clearAllCollections(db);
 *   await seedCollection(db, 'courses', FIXTURES.courses);
 * });
 * ```
 */

import * as admin from "firebase-admin";
import { expect } from "@jest/globals";

// ============================================================================
// Constants
// ============================================================================

/**
 * Standard Firestore collection names
 */
export const COLLECTIONS = {
  COURSES: "courses",
  DISCORD_SERVERS: "discord-servers",
  REDDIT_COMMUNITIES: "reddit-communities",
  DEGREE_PROGRAMS: "degree-programs",
  WGU_CONNECT_GROUPS: "wgu-connect-groups",
  WGU_STUDENT_GROUPS: "wgu-student-groups",
  COURSE_COMMUNITY_MAPPINGS: "course-community-mappings",
  CHANGE_HISTORY: "change-history",
} as const;

/**
 * All collection names as an array
 */
export const ALL_COLLECTIONS = Object.values(COLLECTIONS);

// ============================================================================
// Database Cleanup Utilities
// ============================================================================

/**
 * Clear a single Firestore collection
 * @param db Firestore instance
 * @param collectionName Name of the collection to clear
 */
export async function clearCollection(
  db: admin.firestore.Firestore,
  collectionName: string
): Promise<void> {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

/**
 * Clear multiple Firestore collections
 * @param db Firestore instance
 * @param collectionNames Array of collection names to clear
 */
export async function clearCollections(
  db: admin.firestore.Firestore,
  collectionNames: string[]
): Promise<void> {
  for (const collectionName of collectionNames) {
    await clearCollection(db, collectionName);
  }
}

/**
 * Clear all standard test collections
 * @param db Firestore instance
 */
export async function clearAllCollections(
  db: admin.firestore.Firestore
): Promise<void> {
  await clearCollections(db, ALL_COLLECTIONS);
  console.log("🧹 Cleared all test collections");
}

// ============================================================================
// Database Seeding Utilities
// ============================================================================

/**
 * Seed a single Firestore collection with data
 * @param db Firestore instance
 * @param collectionName Name of the collection to seed
 * @param data Object with document IDs as keys and document data as values
 */
export async function seedCollection<T extends Record<string, any>>(
  db: admin.firestore.Firestore,
  collectionName: string,
  data: Record<string, T>
): Promise<void> {
  const batch = db.batch();
  let count = 0;

  for (const [docId, docData] of Object.entries(data)) {
    const ref = db.collection(collectionName).doc(docId);
    batch.set(ref, docData);
    count++;

    // Firestore batch limit is 500 operations
    if (count >= 500) {
      await batch.commit();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✅ Seeded ${Object.keys(data).length} documents to ${collectionName}`);
}

/**
 * Seed a collection with an array of data (generates auto IDs)
 * @param db Firestore instance
 * @param collectionName Name of the collection to seed
 * @param data Array of document data
 * @param getDocId Optional function to extract document ID from data
 */
export async function seedCollectionArray<T extends Record<string, any>>(
  db: admin.firestore.Firestore,
  collectionName: string,
  data: T[],
  getDocId?: (item: T) => string
): Promise<void> {
  const batch = db.batch();
  let count = 0;

  for (const item of data) {
    const docId = getDocId ? getDocId(item) : db.collection(collectionName).doc().id;
    const ref = db.collection(collectionName).doc(docId);
    batch.set(ref, item);
    count++;

    // Firestore batch limit is 500 operations
    if (count >= 500) {
      await batch.commit();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✅ Seeded ${data.length} documents to ${collectionName}`);
}

/**
 * Seed multiple collections at once
 * @param db Firestore instance
 * @param collections Object mapping collection names to data objects
 */
export async function seedMultipleCollections(
  db: admin.firestore.Firestore,
  collections: Record<string, Record<string, any>>
): Promise<void> {
  for (const [collectionName, data] of Object.entries(collections)) {
    await seedCollection(db, collectionName, data);
  }
}

/**
 * Seed a complete dataset (object with arrays)
 * @param db Firestore instance
 * @param dataset Object with collection names as keys and arrays as values
 * @param getDocIds Optional mapping of collection names to ID extractor functions
 */
export async function seedDataset(
  db: admin.firestore.Firestore,
  dataset: Record<string, any[]>,
  getDocIds?: Record<string, (item: any) => string>
): Promise<void> {
  for (const [collectionName, data] of Object.entries(dataset)) {
    const getDocId = getDocIds?.[collectionName];
    await seedCollectionArray(db, collectionName, data, getDocId);
  }
}

// ============================================================================
// GraphQL Response Assertions
// ============================================================================

/**
 * Assert that a GraphQL response indicates success (no errors)
 * @param response The GraphQL response object
 */
export function assertGraphQLSuccess(response: any): void {
  expect(response.body.errors).toBeUndefined();
  expect(response.body.data).toBeDefined();
}

/**
 * Assert that a GraphQL response contains errors
 * @param response The GraphQL response object
 */
export function assertGraphQLError(response: any): void {
  expect(response.body.errors).toBeDefined();
  expect(response.body.errors).toBeInstanceOf(Array);
  expect(response.body.errors.length).toBeGreaterThan(0);
}

/**
 * Assert that a GraphQL response contains a specific error message
 * @param response The GraphQL response object
 * @param messagePattern String or RegExp to match against error messages
 */
export function assertGraphQLErrorMessage(
  response: any,
  messagePattern: string | RegExp
): void {
  assertGraphQLError(response);
  const errorMessages = response.body.errors.map((e: any) => e.message);
  const hasMatch = errorMessages.some((msg: string) =>
    typeof messagePattern === "string"
      ? msg.includes(messagePattern)
      : messagePattern.test(msg)
  );
  expect(hasMatch).toBe(true);
}

/**
 * Assert that a search result has the expected structure
 * @param result Search result object
 */
export function assertSearchResultStructure(result: any): void {
  expect(result).toHaveProperty("totalCount");
  expect(result).toHaveProperty("results");
  expect(result.totalCount).toBeGreaterThanOrEqual(0);
  expect(result.results).toBeInstanceOf(Array);
}

/**
 * Assert that a search result item has required fields
 * @param item Search result item
 */
export function assertSearchResultItem(item: any): void {
  expect(item).toHaveProperty("type");
  expect(item).toHaveProperty("id");
  expect(item).toHaveProperty("title");
  expect(["course", "discord", "reddit", "wguConnect", "studentGroup", "degree", "community"]).toContain(
    item.type
  );
}

// ============================================================================
// Firestore State Assertions
// ============================================================================

/**
 * Assert that a document exists in Firestore
 * @param db Firestore instance
 * @param collectionName Collection name
 * @param docId Document ID
 */
export async function assertDocumentExists(
  db: admin.firestore.Firestore,
  collectionName: string,
  docId: string
): Promise<admin.firestore.DocumentSnapshot> {
  const doc = await db.collection(collectionName).doc(docId).get();
  expect(doc.exists).toBe(true);
  return doc;
}

/**
 * Assert that a document does not exist in Firestore
 * @param db Firestore instance
 * @param collectionName Collection name
 * @param docId Document ID
 */
export async function assertDocumentNotExists(
  db: admin.firestore.Firestore,
  collectionName: string,
  docId: string
): Promise<void> {
  const doc = await db.collection(collectionName).doc(docId).get();
  expect(doc.exists).toBe(false);
}

/**
 * Assert that a document has specific field values
 * @param db Firestore instance
 * @param collectionName Collection name
 * @param docId Document ID
 * @param expectedData Expected field values
 */
export async function assertDocumentData(
  db: admin.firestore.Firestore,
  collectionName: string,
  docId: string,
  expectedData: Record<string, any>
): Promise<void> {
  const doc = await assertDocumentExists(db, collectionName, docId);
  const data = doc.data();
  expect(data).toMatchObject(expectedData);
}

/**
 * Assert that a collection has a specific number of documents
 * @param db Firestore instance
 * @param collectionName Collection name
 * @param expectedCount Expected document count
 */
export async function assertCollectionCount(
  db: admin.firestore.Firestore,
  collectionName: string,
  expectedCount: number
): Promise<void> {
  const snapshot = await db.collection(collectionName).get();
  expect(snapshot.size).toBe(expectedCount);
}

/**
 * Assert that a collection is empty
 * @param db Firestore instance
 * @param collectionName Collection name
 */
export async function assertCollectionEmpty(
  db: admin.firestore.Firestore,
  collectionName: string
): Promise<void> {
  await assertCollectionCount(db, collectionName, 0);
}

// ============================================================================
// Data Query Utilities
// ============================================================================

/**
 * Get all documents from a collection
 * @param db Firestore instance
 * @param collectionName Collection name
 * @returns Array of document data objects
 */
export async function getAllDocuments<T = any>(
  db: admin.firestore.Firestore,
  collectionName: string
): Promise<T[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Get a single document by ID
 * @param db Firestore instance
 * @param collectionName Collection name
 * @param docId Document ID
 * @returns Document data or null if not found
 */
export async function getDocument<T = any>(
  db: admin.firestore.Firestore,
  collectionName: string,
  docId: string
): Promise<T | null> {
  const doc = await db.collection(collectionName).doc(docId).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as T) : null;
}

/**
 * Check if a document exists
 * @param db Firestore instance
 * @param collectionName Collection name
 * @param docId Document ID
 * @returns True if document exists
 */
export async function documentExists(
  db: admin.firestore.Firestore,
  collectionName: string,
  docId: string
): Promise<boolean> {
  const doc = await db.collection(collectionName).doc(docId).get();
  return doc.exists;
}

// ============================================================================
// Test Data Utilities
// ============================================================================

/**
 * Wait for a condition to be true (useful for async operations)
 * @param condition Function that returns true when condition is met
 * @param timeoutMs Maximum time to wait in milliseconds
 * @param checkIntervalMs How often to check the condition
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeoutMs: number = 5000,
  checkIntervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Create a snapshot-friendly version of an object (removes timestamps, etc.)
 * @param obj Object to sanitize
 * @param fieldsToRemove Fields to remove (default: timestamps)
 */
export function sanitizeForSnapshot(
  obj: any,
  fieldsToRemove: string[] = ["lastUpdated", "createdAt", "timestamp"]
): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForSnapshot(item, fieldsToRemove));
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!fieldsToRemove.includes(key)) {
        sanitized[key] = sanitizeForSnapshot(value, fieldsToRemove);
      }
    }
    return sanitized;
  }

  return obj;
}

// ============================================================================
// Mock Context Builders
// ============================================================================

/**
 * Create a mock admin user context for testing
 */
export function createAdminContext() {
  return {
    user: {
      uid: "test-admin-user",
      email: "admin@test.com",
      role: "admin",
      permissions: ["read", "write", "delete", "ingest"],
    },
  };
}

/**
 * Create a mock regular user context for testing
 */
export function createUserContext() {
  return {
    user: {
      uid: "test-regular-user",
      email: "user@test.com",
      role: "user",
      permissions: ["read"],
    },
  };
}

/**
 * Create a mock unauthenticated context for testing
 */
export function createUnauthenticatedContext() {
  return {
    user: null,
  };
}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Log test section header
 */
export function logTestSection(message: string): void {
  console.log(`\n${"=".repeat(60)}\n${message}\n${"=".repeat(60)}`);
}

/**
 * Log test data for debugging
 */
export function logTestData(label: string, data: any): void {
  console.log(`\n📊 ${label}:`);
  console.log(JSON.stringify(data, null, 2));
}
