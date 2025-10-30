# Functions Integration Testing Guide

This guide covers the testing infrastructure for the WGU Extension Firebase Functions workspace.

## Table of Contents

- [Overview](#overview)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Fixtures](#test-fixtures)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)

## Overview

The functions workspace uses **Jest** for testing with a comprehensive set of utilities and fixtures to make writing integration tests easier and more maintainable.

### Test Types

- **Unit Tests** (`*.test.ts`): Test individual functions and resolvers in isolation with mocks
- **Integration Tests** (`*.integration.test.ts`): Test complete workflows with Firebase emulators

### Key Features

- ✅ Shared test fixtures for consistent data across tests
- ✅ Helper utilities for common operations (seeding, assertions, cleanup)
- ✅ Factory functions for creating test data
- ✅ Standardized cleanup patterns with `beforeEach`
- ✅ Mock context builders for authentication testing
- ✅ GraphQL response shape assertions

## Test Organization

```
functions/src/test/
├── fixtures/                      # Shared test infrastructure
│   ├── index.ts                  # Main export (import from here)
│   ├── test-data-factory.ts      # Factory functions for creating test data
│   ├── shared-fixtures.ts        # Pre-built test data objects
│   ├── graphql-responses.ts      # Expected response shapes
│   └── test-helpers.ts           # Assertion and seeding utilities
├── setup.ts                       # Global test setup (emulator detection)
├── *.integration.test.ts          # Integration tests
└── *.test.ts                      # Unit tests
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm run test:unit
```

### Integration Tests Only
```bash
pnpm run test:integration
```

### Watch Mode
```bash
pnpm run test:watch
```

### Coverage Report
```bash
pnpm run test:coverage
```

### Debug Mode
```bash
# Debug all tests
pnpm run test:debug

# Debug integration tests only
pnpm run test:integration:debug
```

Then attach your debugger (Chrome DevTools or VS Code) to the inspector port.

## Writing Tests

### Basic Integration Test Structure

```typescript
import { describe, expect, test, beforeAll, beforeEach, afterAll } from "@jest/globals";
import * as admin from "firebase-admin";

// Import fixtures and utilities
import {
  FIXTURES,
  getMinimalDataset,
  clearAllCollections,
  seedDataset,
  assertGraphQLSuccess,
  COLLECTIONS,
} from "./fixtures";

describe("My Integration Tests", () => {
  let db: admin.firestore.Firestore;

  beforeAll(async () => {
    // Initialize Firebase
    db = admin.firestore();
  });

  beforeEach(async () => {
    // Clear and seed data for each test
    await clearAllCollections(db);

    const dataset = getMinimalDataset();
    await seedDataset(db, {
      [COLLECTIONS.COURSES]: dataset.courses,
      [COLLECTIONS.DISCORD_SERVERS]: dataset.discordServers,
    }, {
      [COLLECTIONS.COURSES]: (c) => c.courseCode,
      [COLLECTIONS.DISCORD_SERVERS]: (d) => d.id,
    });
  });

  afterAll(async () => {
    await clearAllCollections(db);
  });

  test("my test case", async () => {
    // Test implementation
  });
});
```

### Using Factory Functions

```typescript
import { createCourse, createDiscordServer } from "./fixtures";

// Create custom test data
const customCourse = createCourse({
  courseCode: "C999",
  name: "My Custom Course",
  units: 4,
});

// Create multiple courses
const courses = Array.from({ length: 5 }, (_, i) =>
  createCourse({ courseCode: `C${100 + i}` })
);
```

### Using Shared Fixtures

```typescript
import { FIXTURES } from "./fixtures";

// Use pre-built fixtures
const c172 = FIXTURES.courses.c172;
const cyberClub = FIXTURES.discordServers.cyberClub;
const wgu = FIXTURES.redditCommunities.wgu;
```

### Using Helper Utilities

```typescript
import {
  seedCollection,
  clearCollection,
  assertDocumentExists,
  assertGraphQLSuccess,
} from "./fixtures";

// Seed a collection
await seedCollection(db, COLLECTIONS.COURSES, {
  "C172": FIXTURES.courses.c172,
  "C173": FIXTURES.courses.c173,
});

// Clear a collection
await clearCollection(db, COLLECTIONS.COURSES);

// Assert document exists
await assertDocumentExists(db, COLLECTIONS.COURSES, "C172");

// Assert GraphQL response success
assertGraphQLSuccess(response);
```

## Test Fixtures

### Pre-Built Fixtures

The `FIXTURES` object contains ready-to-use test data:

```typescript
import { FIXTURES } from "./fixtures";

// Courses
FIXTURES.courses.c172         // Network & Security course
FIXTURES.courses.c173         // Programming course
FIXTURES.courses.c175         // Data Management course

// Discord Servers
FIXTURES.discordServers.cyberClub    // Cyber Security Discord
FIXTURES.discordServers.compSci      // Computer Science Discord

// Reddit Communities
FIXTURES.redditCommunities.wgu       // Main WGU subreddit
FIXTURES.redditCommunities.wguCs     // CS program subreddit

// And more...
```

### Dataset Helpers

```typescript
import { getMinimalDataset, getStandardDataset } from "./fixtures";

// Minimal dataset (fast tests)
const minimal = getMinimalDataset();
// Returns: { courses: [c172, c173], discordServers: [...], ... }

// Standard dataset (comprehensive tests)
const standard = getStandardDataset();
// Returns all fixtures
```

### Factory Functions

Create custom test data with sensible defaults:

```typescript
import {
  createCourse,
  createDiscordServer,
  createRedditCommunity,
  createWguConnectGroup,
  createStudentGroup,
  createDegreeProgram,
} from "./fixtures";

const course = createCourse({
  courseCode: "C999",
  name: "Custom Course",
  // Other fields have sensible defaults
});
```

## Test Utilities

### Database Operations

```typescript
import {
  clearAllCollections,
  clearCollection,
  clearCollections,
  seedCollection,
  seedCollectionArray,
  seedDataset,
} from "./fixtures";

// Clear all test collections
await clearAllCollections(db);

// Clear specific collections
await clearCollections(db, [COLLECTIONS.COURSES, COLLECTIONS.DISCORD_SERVERS]);

// Seed a collection with object
await seedCollection(db, COLLECTIONS.COURSES, {
  "C172": courseData,
  "C173": courseData2,
});

// Seed a collection with array
await seedCollectionArray(db, COLLECTIONS.COURSES, [course1, course2], (c) => c.courseCode);
```

### Assertions

```typescript
import {
  assertGraphQLSuccess,
  assertGraphQLError,
  assertGraphQLErrorMessage,
  assertSearchResultStructure,
  assertDocumentExists,
  assertDocumentData,
  assertCollectionCount,
} from "./fixtures";

// GraphQL assertions
assertGraphQLSuccess(response);
assertGraphQLError(response);
assertGraphQLErrorMessage(response, /authentication/i);

// Search assertions
assertSearchResultStructure(result);

// Firestore assertions
await assertDocumentExists(db, COLLECTIONS.COURSES, "C172");
await assertDocumentData(db, COLLECTIONS.COURSES, "C172", { name: "Network Security" });
await assertCollectionCount(db, COLLECTIONS.COURSES, 3);
```

### Mock Contexts

```typescript
import {
  createAdminContext,
  createUserContext,
  createUnauthenticatedContext,
} from "./fixtures";

const adminCtx = createAdminContext();
const userCtx = createUserContext();
const noAuthCtx = createUnauthenticatedContext();

// Use in tests
await adminResolvers.Mutation.ingestData(null, { input }, adminCtx);
```

## Best Practices

### 1. Use `beforeEach` for Test Isolation

```typescript
beforeEach(async () => {
  await clearAllCollections(db);
  // Seed fresh data for each test
});
```

### 2. Use Minimal Datasets for Speed

```typescript
// ✅ Good: Fast, focused test
const dataset = getMinimalDataset();

// ❌ Avoid: Slow, over-seeding
await seedDataset(db, getAllData());
```

### 3. Use Shared Fixtures for Common Data

```typescript
// ✅ Good: Reusable, consistent
const course = FIXTURES.courses.c172;

// ❌ Avoid: Duplication, inconsistency
const course = { courseCode: "C172", name: "...", /* hardcoded data */ };
```

### 4. Use Factory Functions for Custom Data

```typescript
// ✅ Good: Flexible, maintainable
const course = createCourse({ courseCode: "C999", name: "Custom" });

// ❌ Avoid: Missing fields, fragile
const course = { courseCode: "C999", name: "Custom" };
```

### 5. Use Assertion Utilities

```typescript
// ✅ Good: Clear, reusable
assertGraphQLSuccess(response);
await assertDocumentExists(db, COLLECTIONS.COURSES, "C172");

// ❌ Avoid: Verbose, repetitive
expect(response.body.errors).toBeUndefined();
expect(response.body.data).toBeDefined();
const doc = await db.collection(COLLECTIONS.COURSES).doc("C172").get();
expect(doc.exists).toBe(true);
```

### 6. Group Related Tests

```typescript
describe("Course Queries", () => {
  describe("getCourse", () => {
    test("should return course by code", async () => { /* ... */ });
    test("should return null for missing course", async () => { /* ... */ });
  });

  describe("courses", () => {
    test("should list all courses", async () => { /* ... */ });
    test("should respect pagination", async () => { /* ... */ });
  });
});
```

## Debugging

### Debug a Specific Test

```bash
# Start debugger
pnpm run test:debug

# In debugger, set breakpoint and run:
jest --testNamePattern="should search for courses"
```

### Debug with VS Code

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/functions/node_modules/.bin/jest",
  "args": ["--runInBand", "--testMatch", "**/*.integration.test.ts"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "env": {
    "FIRESTORE_EMULATOR_HOST": "localhost:8181"
  }
}
```

### Enable Verbose Logging

```typescript
import { logTestSection, logTestData } from "./fixtures";

logTestSection("Testing Course Queries");
logTestData("Response", response.body);
```

## Troubleshooting

### Tests Timing Out

**Problem**: Tests exceed 120s timeout

**Solutions**:
- Reduce test data (use `getMinimalDataset()`)
- Check emulator is running: `firebase emulators:start`
- Increase timeout: `test("...", async () => { ... }, 180000);`

### Emulator Connection Issues

**Problem**: `FIRESTORE_EMULATOR_HOST not defined`

**Solutions**:
- Set environment variable: `export FIRESTORE_EMULATOR_HOST=localhost:8181`
- Use test script: `pnpm run test:integration` (sets automatically)

### Stale Data Between Tests

**Problem**: Tests fail due to leftover data

**Solutions**:
- Use `beforeEach` cleanup: `await clearAllCollections(db);`
- Don't use `beforeAll` for seeding (leads to state pollution)

### Import Errors

**Problem**: Cannot find module `./fixtures`

**Solutions**:
- Ensure proper import path: `import { ... } from "./fixtures";`
- Check TypeScript compilation: `pnpm run build`

### Type Errors

**Problem**: TypeScript errors in test files

**Solutions**:
- Run type check: `pnpm run typecheck`
- Ensure `@types/jest` is installed
- Check imports match exported types

## Examples

See the following files for complete examples:

- `search.integration.test.ts` - Search resolver tests with fixtures
- `admin-resolvers.integration.test.ts` - Admin mutation tests with auth contexts
- `graphql.integration.test.ts` - Full GraphQL endpoint tests

## Contributing

When adding new tests:

1. ✅ Use shared fixtures when possible
2. ✅ Use helper utilities for common operations
3. ✅ Follow the `beforeEach` cleanup pattern
4. ✅ Add new fixtures to `shared-fixtures.ts` if reusable
5. ✅ Document complex test setups
6. ✅ Keep tests focused and isolated
