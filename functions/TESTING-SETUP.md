# Firebase Functions Testing Setup

This document describes the comprehensive testing infrastructure for the Firebase Functions, including local testing, CI/CD integration, and validation testing.

## Overview

The testing setup includes:
- **Unit tests** for individual functions and validation schemas
- **Integration tests** with Firebase emulators
- **End-to-end GraphQL API tests**
- **Validation tests** for input schemas
- **GitHub Actions CI/CD** with automated testing

## Quick Start

### Local Testing

1. **Start Firebase emulators**:
   ```bash
   cd functions
   npm run serve:fresh  # Clean start
   # OR
   npm run serve        # With data persistence
   ```

2. **Run all tests**:
   ```bash
   npm test
   ```

3. **Run specific test suites**:
   ```bash
   # Unit tests only
   npm test -- --testMatch="**/*.test.ts" --testPathIgnorePatterns="integration"
   
   # Integration tests only
   npm test -- --testMatch="**/*.integration.test.ts"
   
   # With coverage
   npm run test:coverage
   ```

## Test Files

### Unit Tests

#### `src/test/validation-schemas.test.ts`
Tests all Zod validation schemas:
- Discord server input validation
- Reddit community input validation
- Course input validation
- Degree plan input validation
- Custom validators (Discord IDs, Reddit URLs, etc.)

### Integration Tests

#### `src/test/admin-resolvers.integration.test.ts`
Tests all admin GraphQL mutations with real Firestore:
- Authentication and authorization
- CRUD operations for all entities
- Input validation integration
- Change history logging
- Error handling

### Test Scripts

#### `test-admin-api.sh`
Manual testing script for admin API:
```bash
./test-admin-api.sh
```
Tests all admin mutations with various inputs and validation cases.

#### `test-validation.sh`
Comprehensive validation testing:
```bash
./test-validation.sh
```
Tests edge cases and validation rules for all input types.

#### `test-graphql-comprehensive.sh`
Tests all GraphQL queries:
```bash
./test-graphql-comprehensive.sh
```

## Test Data Management

### Seeding Test Data

Use the `seed-test-data.ts` script to populate the emulator:

```bash
# Standard dataset (default)
npm run seed:test-data

# Minimal dataset (for CI)
npm run seed:test-data minimal

# Full dataset (comprehensive testing)
npm run seed:test-data full
```

### Dataset Types

1. **Minimal**: 2 courses, 1 Discord server, 1 Reddit community
   - Used in CI/CD for fast tests
   - Basic functionality testing

2. **Standard**: 4 courses, 2 Discord servers, 2 Reddit communities
   - Default for local development
   - Covers main use cases

3. **Full**: 6+ courses, 3+ Discord servers, 4+ Reddit communities
   - Comprehensive testing
   - Edge cases and performance testing

## GitHub Actions CI

### Enhanced Workflow

The `firebase-functions-ci-enhanced.yml` workflow includes:

1. **Parallel job execution**:
   - Lint and type checking
   - Unit tests with coverage
   - Integration tests with emulators
   - GraphQL client tests

2. **Matrix testing**:
   - Tests with both minimal and standard datasets
   - Ensures compatibility across data scenarios

3. **Test reporting**:
   - Coverage reports via Codecov
   - PR comments with test results
   - Artifact uploads for debugging

### Running in CI

The workflow automatically runs on:
- Push to main, develop, or feat/* branches
- Pull requests to main or develop
- Manual workflow dispatch

## Docker Testing (Optional)

For consistent testing across environments:

```bash
# Run tests in Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Clean up
docker-compose -f docker-compose.test.yml down -v
```

## Writing New Tests

### Unit Test Example

```typescript
import { describe, expect, test } from "@jest/globals";
import { myFunction } from "../lib/my-module";

describe("My Module", () => {
  test("should handle valid input", () => {
    const result = myFunction("valid");
    expect(result).toBe("expected");
  });
});
```

### Integration Test Example

```typescript
import { describe, expect, test, beforeEach } from "@jest/globals";
import { adminResolvers } from "../graphql/admin-resolvers";
import { defaultDb } from '../lib/firebase-admin-db';

describe("My Integration Test", () => {
  beforeEach(async () => {
    // Clear test data
    const snapshot = await defaultDb.collection('test').get();
    const batch = defaultDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  test("should create document", async () => {
    // Test implementation
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Always clean up test data
3. **Meaningful Names**: Use descriptive test names
4. **Error Cases**: Test both success and failure paths
5. **Validation**: Test edge cases for all validators
6. **Async Handling**: Use proper async/await patterns

## Troubleshooting

### Common Issues

1. **Emulator not starting**:
   ```bash
   # Check if ports are in use
   lsof -ti:8181 | xargs kill -9
   lsof -ti:5001 | xargs kill -9
   ```

2. **Test timeouts**:
   - Increase timeout in jest.config.js
   - Check emulator startup time

3. **Type errors**:
   ```bash
   # Rebuild types
   npm run build --workspace=data
   npm run build --workspace=functions
   ```

4. **Validation test failures**:
   - Check if schemas match GraphQL types
   - Verify error messages in validation-schemas.ts

## Coverage Goals

Target coverage metrics:
- **Overall**: 80%+
- **Resolvers**: 90%+
- **Validation**: 95%+
- **Utilities**: 70%+

Check current coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```