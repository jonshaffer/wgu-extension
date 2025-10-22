# WGU Extension - Firebase Functions Workspace

**Firebase Cloud Functions** providing GraphQL API and backend services for the WGU Extension ecosystem.

## Workspace Overview

This workspace contains serverless functions that power the GraphQL API for community data access and administrative operations.

> 📊 **[View Current Status Dashboard](STATUS.md)** - Live implementation progress, known issues, and deployment readiness

## Architecture

### GraphQL API Implementation

The project uses **GraphQL Yoga** with persisted queries for security and performance:

- **Public API** (`publicApi`): Read-only access to community data with persisted query allowlist
- **Admin API** (`adminApi`): Protected endpoint for data management operations

### Key Components

#### HTTP Functions (`src/http/`)
- **graphql-public.ts**: Public GraphQL endpoint with persisted queries
- **graphql-admin.ts**: Admin GraphQL endpoint with authentication
- **export-data.ts**: Data export utility for backups
- **process-suggestions.ts**: Process community data suggestions

#### GraphQL Layer (`src/graphql/`)
- **public-schema.ts**: Public API schema definition
- **admin-schema.ts**: Admin API schema definition
- **public-resolvers.ts**: Resolvers for public queries
- **admin-resolvers.ts**: Resolvers for admin operations
- **allowlist.json**: Whitelisted queries for security
- **types.ts**: TypeScript type definitions

#### Core Libraries (`src/lib/`)
- **data-queries.ts**: Firestore query functions
- **data-transformation.ts**: Data transformation utilities
- **auth.ts**: Authentication middleware
- **firebase-admin-db.ts**: Multi-database Firestore setup
- **suggestion-model.ts**: Suggestion data models
- **suggestion-transformations.ts**: Suggestion processing logic

## Build Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Development with emulators
npm run serve              # With data persistence
npm run serve:fresh        # Clean start
npm run serve:dvc         # With DVC data

# Deploy to Firebase
npm run deploy

# View logs
npm run logs

# Run tests
npm test                   # All tests
npm run test:integration   # Integration tests only
```

## GraphQL API

### Public Endpoint
```
https://{region}-{project-id}.cloudfunctions.net/publicApi
```

#### Available Queries
- `ping`: Health check
- `search`: Full-text search across all community types
- `searchSubreddits`: Multi-subreddit Reddit search
- `courses`: List courses with pagination
- `course`: Get specific course details
- `discordServers`: List Discord servers
- `redditCommunities`: List Reddit communities
- `wguConnectGroups`: List WGU Connect groups
- `studentGroups`: List student groups
- `getCommunitiesForCourse`: Get all communities for a course (V2)

#### Example Query
```graphql
query GetCommunitiesForCourseV2($courseCode: String!) {
  getCommunitiesForCourse(courseCode: $courseCode) {
    courseCode
    courseName
    discord {
      id
      name
      inviteUrl
      memberCount
    }
    reddit {
      id
      name
      url
      subscriberCount
    }
    wguConnect {
      id
      name
      memberCount
    }
    studentGroups {
      id
      name
      type
      websiteUrl
    }
  }
}
```

### Admin Endpoint
```
https://{region}-{project-id}.cloudfunctions.net/adminApi
```

Protected endpoint for data management operations including:
- Processing suggestions
- Data updates
- Backup operations

## Security Features

### Persisted Queries
Only pre-approved queries in `allowlist.json` can be executed on the public endpoint:

```typescript
// Queries must be whitelisted
const allowedQueries = require('./allowlist.json');
```

### Rate Limiting
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Storage**: Firestore rate limit tracking

### CORS Policy
```typescript
const corsOptions = {
  origin: [
    /^https:\/\/.*\.wgu\.edu$/,
    /^chrome-extension:\/\/[a-z]{32}$/,
    /^moz-extension:\/\/[a-f0-9-]{36}$/
  ],
  credentials: true
};
```

## Data Architecture

### Dual Database Setup

1. **Default Database**: Main community data
   - `courses`: Course catalog
   - `discord-servers`: Discord communities
   - `reddit-communities`: Subreddit data
   - `wgu-connect-groups`: WGU Connect groups
   - `student-groups`: Student organizations
   - `course-community-mappings`: Course-to-community relationships

2. **Admin Database**: Meta and administrative data
   - `suggestions`: Community data suggestions
   - `change-history`: Audit trail
   - `moderation-queue`: Pending changes

### Course-Community Mappings

The `course-community-mappings` collection links courses to their communities:

```typescript
{
  courseCode: "C172",
  courseName: "Network and Security Foundations",
  discord: ["server-id-1", "server-id-2"],
  reddit: ["WGU", "WGU_CompSci"],
  wguConnect: "group-id",
  studentGroups: ["group-id-1", "group-id-2"]
}
```

## Testing

### Available Test Scripts

```bash
# Comprehensive GraphQL tests
./test-graphql-comprehensive.sh

# Community features tests
./test-community-features.sh

# GraphQL client tests
tsx scripts/test-graphql-client.ts
```

### Testing with Emulators

```bash
# Start emulators with seeded data
npm run serve

# Run tests in another terminal
./test-graphql-comprehensive.sh
```

See `TESTING.md` for detailed testing documentation.

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start emulators
npm run serve

# GraphQL endpoints:
# Public: http://localhost:5001/{project-id}/us-central1/publicApi
# Admin: http://localhost:5001/{project-id}/us-central1/adminApi
```

### Environment Variables
Configure in Firebase console or `.env` for local development:
- `ADMIN_API_KEY`: Admin endpoint authentication
- `REDDIT_CLIENT_ID`: Reddit API credentials
- `REDDIT_CLIENT_SECRET`: Reddit API credentials

## Deployment

### Deploy Functions
```bash
# Deploy all functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:publicApi
```

### CI/CD Integration
GitHub Actions automatically:
1. Run tests on PR
2. Build TypeScript
3. Deploy to Firebase on merge to main

## Monitoring

### Logging
```bash
# View all logs
npm run logs

# Filter by function
firebase functions:log --only publicApi

# Follow logs
firebase functions:log --follow
```

### Performance Monitoring
- GraphQL query complexity limits
- Depth limiting to prevent abuse
- Response time tracking
- Error rate monitoring

## GraphQL Client Package

The `@wgu-extension/graphql-client` package provides typed access to the API:

```typescript
import { createClient, getCommunitiesForCourseV2 } from '@wgu-extension/graphql-client';

const client = createClient({ 
  endpoint: 'https://publicapi.cloudfunctions.net/publicApi' 
});

const communities = await getCommunitiesForCourseV2('C172', client);
```

## Best Practices

1. **Query Optimization**: Use DataLoader pattern for batch loading
2. **Caching**: Implement caching at resolver level
3. **Error Handling**: Return partial data when possible
4. **Type Safety**: Use generated types from GraphQL schema
5. **Security**: Always validate and sanitize inputs
6. **Performance**: Monitor query complexity and depth