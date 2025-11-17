/**
 * Test Fixtures - Main Export
 *
 * Central export for all test fixtures and utilities.
 * Import everything you need from this single file.
 *
 * Usage:
 * ```typescript
 * import {
 *   FIXTURES,
 *   createCourse,
 *   seedCollection,
 *   clearAllCollections,
 *   assertGraphQLSuccess,
 *   EXPECTED_RESPONSES
 * } from './fixtures';
 * ```
 */

// Export everything from test-data-factory
export * from "./test-data-factory";

// Export everything from shared-fixtures
export * from "./shared-fixtures";

// Export everything from graphql-responses
export * from "./graphql-responses";

// Export everything from test-helpers
export * from "./test-helpers";
