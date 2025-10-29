# @wgu-extension/graphql-client

GraphQL client library for the WGU Extension API.

## Installation

```bash
pnpm install @wgu-extension/graphql-client
```

## Usage

```typescript
import { 
  createClient, 
  getCourses, 
  getCommunitiesForCourse,
  withCache 
} from '@wgu-extension/graphql-client';

// Use the default client
const courses = await getCourses();

// Or create a custom client
const client = createClient({
  endpoint: 'http://localhost:5001/project/graphql',
  headers: {
    'Authorization': 'Bearer token'
  }
});

// Get communities for a specific course
const communities = await getCommunitiesForCourse('C182', client);

// Add caching (useful in browser environments)
const cachedGetCourses = withCache(getCourses, 60 * 60 * 1000); // 1 hour cache
const courses = await cachedGetCourses();
```

## API

### Client Creation

- `createClient(config?)` - Create a new GraphQL client
- `defaultClient` - Pre-configured client instance

### Query Functions

- `getCourses(client?, limit?, offset?)` - Get all courses
- `getCommunitiesForCourse(courseCode, client?)` - Get communities for a course
- `searchCommunities(query?, limit?, client?)` - Search all communities

### Utilities

- `withCache(fn, ttlMs?)` - Add caching to any async function

### Types

All GraphQL types are imported from `@wgu-extension/functions` and re-exported:

- `Course`
- `Community`
- `SearchResult`
- `DegreePlan`
- etc.

## Development

```bash
# Build the package
pnpm runbuild

# Watch mode
pnpm rundev

# Type check
pnpm runtypecheck
```