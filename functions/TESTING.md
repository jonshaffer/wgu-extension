# Firebase Functions Testing Guide

This guide covers both manual testing with emulators and automated integration testing for the Firebase Functions workspace.

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install --workspace=functions
   ```

2. **Ensure Data is Available** (for manual testing with real data)
   ```bash
   npm run dvc:pull --workspace=extension
   npm run catalog:generate-processed --workspace=extension
   ```

## Testing Approaches

### 1. Manual Testing with Emulators

This approach allows you to test the functions interactively with real data.

#### Start the Emulators with Data Persistence
```bash
cd functions
npm run serve:dvc   # Pulls latest test data from DVC and starts with persistence
# OR
npm run serve       # Starts with local data persistence (imports previous data, exports on exit)
# OR
npm run serve:fresh # Starts with clean slate (no import/export)
```

This starts:
- Functions emulator at `http://localhost:5001`
- Firestore emulator at `http://localhost:8181`

#### Test Data Management with DVC
The emulator test data is now managed with DVC for consistency across environments:

```bash
cd functions
npm run dvc:pull    # Pull latest test data from DVC
npm run test:seed   # Regenerate test data locally
npm run dvc:push    # Push updated test data to DVC (after seeding)
```

#### Data Persistence
The emulator automatically:
- **Imports** data from `./emulator-data` on startup (if it exists)
- **Exports** data to `./emulator-data` on clean shutdown (Ctrl+C)
- **DVC tracks** the emulator-data directory for version control

#### Managing Emulator Data
```bash
# Manually export current emulator state
npm run emulator:export

# Clear all emulator data
npm run emulator:clear

# Start fresh without persistence
npm run serve:fresh
```

This loads data from:
- Academic registry (courses and degree programs)
- Discord communities
- Reddit communities  
- WGU Student Groups
- WGU Connect groups

#### Test the GraphQL Endpoint

The GraphQL endpoint will be available at:
```
http://localhost:5001/[project-id]/us-central1/graphql
```

You can test using:
- **Browser**: Navigate to the URL to use GraphQL Playground (if enabled)
- **curl**: Send POST requests with GraphQL queries
- **Postman/Insomnia**: Import GraphQL schema and test interactively

Example curl command:
```bash
curl -X POST \
  http://localhost:5001/demo-test/us-central1/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query { search(query: \"C172\") { totalCount results { name courseCode } } }"
  }'
```

### 2. Automated Integration Testing

This approach uses Jest and firebase-functions-test for automated testing.

#### Run All Tests
```bash
cd functions
npm test
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```

#### Run Integration Tests Only
```bash
npm run test:integration
```

This command:
1. Starts the Firestore emulator
2. Runs only integration test files (`*.integration.test.ts`)
3. Shuts down the emulator after tests complete

#### Run Tests with Coverage
```bash
npm run test:coverage
```

#### Run Tests with Full Emulator Suite
```bash
npm run test:emulator
```

This command:
1. Builds the TypeScript code
2. Starts both Functions and Firestore emulators
3. Runs all tests
4. Shuts down emulators after completion

## Test Structure

### Unit Tests
Located in `src/test/*.test.ts`
- Test individual functions and resolvers
- Mock external dependencies
- Fast execution

### Integration Tests
Located in `src/test/*.integration.test.ts`
- Test with real Firestore emulator
- Seed test data before each test suite
- Test complete workflows

### Test Fixtures
Located in `src/test/fixtures/`
- `graphql-queries.ts`: Reusable GraphQL queries and variables

## Example Test Queries

### Search for Courses
```graphql
query SearchCourse {
  search(query: "C172") {
    totalCount
    results {
      type
      name
      courseCode
      competencyUnits
    }
  }
}
```

### Search Across Collections
```graphql
query SearchAll {
  search(query: "network", limit: 10) {
    totalCount
    results {
      type
      name
      platform
      url
      memberCount
    }
  }
}
```

### Search Degree Programs
```graphql
query SearchDegrees {
  search(query: "computer science") {
    results {
      type
      name
      college
      degreeType
    }
  }
}
```

## Writing New Tests

### Integration Test Example
```typescript
import {describe, test, expect} from "@jest/globals";
import {searchResolver} from "../graphql/search-resolver";

describe("New Feature Tests", () => {
  test("should handle new search criteria", async () => {
    const result = await searchResolver(
      undefined,
      {query: "test query", limit: 5}
    );
    
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.results).toBeInstanceOf(Array);
  });
});
```

### Using Test Fixtures
```typescript
import {SEARCH_QUERIES, SEARCH_VARIABLES} from "./fixtures/graphql-queries";

test("should search using fixtures", async () => {
  const response = await request(app)
    .post("/graphql")
    .send({
      query: SEARCH_QUERIES.searchByCourseCode,
      variables: SEARCH_VARIABLES.courseSearch
    });
    
  expect(response.body.data).toBeDefined();
});
```

## Debugging Tests

### View Emulator UI
When emulators are running, visit:
- Firestore UI: `http://localhost:4000`
- Functions logs: Check terminal output

### Debug in VS Code
1. Add breakpoints in test files
2. Use "Debug Jest Tests" configuration
3. Or run: `node --inspect-brk node_modules/.bin/jest --runInBand`

### Common Issues

**Port Already in Use**
```bash
# Kill processes on ports
lsof -ti:5001 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

**Emulator Not Starting**
- Check Firebase CLI is installed: `firebase --version`
- Ensure Java is installed (required for emulators)

**Tests Timing Out**
- Increase timeout in `jest.config.js`
- Check emulator startup time
- Ensure async operations complete

## CI/CD Integration

For GitHub Actions or other CI:
```yaml
- name: Install dependencies
  run: npm ci --workspace=functions

- name: Run tests
  run: npm run test:integration --workspace=functions
```

## Best Practices

1. **Isolate Test Data**: Each test suite should set up and tear down its own data
2. **Use Descriptive Names**: Test names should clearly indicate what they test
3. **Test Edge Cases**: Include tests for empty results, errors, and limits
4. **Keep Tests Fast**: Mock external services when possible
5. **Maintain Test Data**: Keep test fixtures minimal but representative