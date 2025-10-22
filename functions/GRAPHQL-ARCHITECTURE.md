# GraphQL Architecture Documentation

## Overview

The WGU Extension uses a dual GraphQL architecture:
- **Public GraphQL** (`/graphql/public`) - Read-only, heavily cached, persisted queries for browser extension
- **Admin GraphQL** (`/graphql/admin`) - Full CRUD operations for internal tools and data management

> 📊 **[Implementation Status](STATUS.md)** - View current progress, issues, and deployment readiness

## Architecture Decision

### Public GraphQL Requirements
- **Browser Extension Compatible**: Handles CORS issues with Firefox `moz-extension://` URIs
- **Security Focused**: GET-only persisted queries, no introspection, strict rate limiting
- **Performance Optimized**: Heavy caching, CDN-friendly, bounded query complexity
- **Multi-subreddit Search**: Support for searching across multiple Reddit communities

### Admin GraphQL Requirements  
- **Full CRUD Operations**: Complete data management capabilities
- **Authentication Required**: OIDC/JWT protected endpoints
- **Internal Use Only**: Never exposed to browser extensions
- **Comprehensive Mutations**: Data ingestion, updates, deletions

## Implementation Plan

### Phase 1: GraphQL Yoga Migration ✅
- [x] Migrate from current GraphQL implementation to GraphQL Yoga
- [x] Add plugins for security (depth limiting, complexity analysis)
- [x] Implement dual endpoint structure

### Phase 2: Public Endpoint Hardening ✅
- [x] Implement persisted queries with allowlist
- [x] Add GET-only enforcer  
- [x] Configure CORS for browser extensions (`Access-Control-Allow-Origin: *`)
- [x] Add query complexity budgets and pagination caps

### Phase 3: Multi-subreddit Search ✅
- [x] Extend search resolver to handle multiple subreddit queries
- [x] Add GraphQL schema for Reddit multi-subreddit search
- [x] Add sorting options (new, hot, top with time windows)
- [ ] Implement actual Reddit API integration (currently returns mock data)
- [ ] Cache search results appropriately

### Phase 4: Admin Endpoint ✅
- [x] Create separate admin schema with full mutations
- [x] Implement authentication middleware
- [x] Add data ingestion endpoints structure
- [ ] Implement actual mutation resolvers (currently throw "Not implemented" errors)

## Security Model

### Public Endpoint Security
```typescript
// Security layers for /graphql/public
- GET requests only
- Persisted queries with SHA256 allowlist  
- Query depth limit: 6 levels
- Complexity budget: 300 points
- Pagination cap: 50 items max
- Response size limit: 2MB
- Request timeout: 5 seconds
- Rate limiting: 120 req/min per IP
```

### Admin Endpoint Security
```typescript
// Security layers for /graphql/admin
- POST/GET requests allowed
- JWT/OIDC authentication required
- Role-based access control
- Audit logging for all mutations
- Higher complexity budgets for admin operations
- Internal network access only
```

## Multi-subreddit Search Implementation

### Reddit API Integration
Based on Reddit Data API capabilities:

```http
# Search multiple specific subreddits
GET https://oauth.reddit.com/r/WGU+wgustudents+WGU_CompSci/search
  ?q=degree%20plan
  &restrict_sr=on
  &sort=top
  &t=week
  &limit=50
```

### GraphQL Schema Extension
```graphql
type Query {
  # Multi-subreddit search
  searchRedditPosts(
    subreddits: [String!]!
    query: String!
    sort: RedditSortType = NEW
    timeWindow: RedditTimeWindow = WEEK
    first: Int = 10
  ): RedditSearchConnection!
}

enum RedditSortType {
  NEW
  HOT
  TOP
  RELEVANCE
  COMMENTS
}

enum RedditTimeWindow {
  HOUR
  DAY
  WEEK
  MONTH
  YEAR
  ALL
}

type RedditSearchConnection {
  edges: [RedditPostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}
```

## Caching Strategy

### Public Endpoint Caching
```http
# Course catalog data
Cache-Control: public, max-age=3600, stale-while-revalidate=86400

# Reddit search results  
Cache-Control: public, max-age=60, stale-while-revalidate=600

# Community data
Cache-Control: public, max-age=300, stale-while-revalidate=1800
```

### ETag Generation
```typescript
// ETag = hash(schemaVersion + queryHash + normalizedVariables + datasetVersion)
function generateETag(query: string, variables: object, dataVersion: string): string {
  const content = JSON.stringify({
    schema: SCHEMA_VERSION,
    query: hash(query),
    variables: normalizeVariables(variables),
    data: dataVersion
  });
  return `"${createHash('sha256').update(content).digest('hex')}"`;
}
```

## Technology Stack

### Core Libraries
- **GraphQL Yoga**: Modern GraphQL server with plugin ecosystem
- **graphql-depth-limit**: Query depth limiting
- **graphql-query-complexity**: Complexity analysis and budgeting
- **Zod**: Runtime variable validation for persisted queries

### Security Plugins
- **graphql-armor**: Additional GraphQL security hardening
- **express-rate-limit**: Rate limiting middleware
- **cors**: CORS configuration for browser extensions

## File Structure
```
functions/src/
├── graphql/
│   ├── public-schema.ts       # Public read-only schema
│   ├── public-resolvers.ts    # Public resolvers
│   ├── admin-schema.ts        # Full admin schema with mutations
│   ├── admin-resolvers.ts     # Admin resolvers with mutations
│   ├── reddit-search-resolver.ts # Multi-subreddit search implementation
│   ├── allowlist.json         # Persisted queries allowlist
│   ├── search-resolver.ts     # Existing search resolver
│   ├── resolvers.ts           # Legacy resolvers
│   ├── typeDefs.ts           # Legacy type definitions
│   └── types.ts              # Shared GraphQL types
├── http/
│   ├── graphql-public.ts      # Public GraphQL endpoint (GET-only, persisted queries)
│   ├── graphql-admin.ts       # Admin GraphQL endpoint (authenticated)
│   └── graphql.ts            # Legacy GraphQL endpoint (will be deprecated)
├── lib/
│   ├── auth.ts               # Admin authentication middleware
│   └── cors.ts               # CORS configuration
```

## Environment Variables
```bash
# GraphQL Configuration
GRAPHQL_SCHEMA_VERSION=1.0.0
GRAPHQL_COMPLEXITY_BUDGET=300
GRAPHQL_DEPTH_LIMIT=6
GRAPHQL_RATE_LIMIT=120

# Reddit API Configuration  
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=wgu-extension/1.0.0

# Admin Authentication
ADMIN_JWT_SECRET=your_jwt_secret
ADMIN_OIDC_ISSUER=https://your-auth-provider.com
```

## Deployment Configuration

### CDN Setup (Cloudflare/AWS CloudFront)
```yaml
# Cache behaviors for /graphql/public
paths:
  - path: "/graphql/public*"
    methods: ["GET"]
    cache_policy: "GraphQLPublicCache"
    origin_request_policy: "GraphQLCorsHeaders"
    
cache_policies:
  GraphQLPublicCache:
    ttl: 60
    compress: true
    query_strings: "hash,variables"
```

### Rate Limiting (Gateway Level)
```yaml
rate_limits:
  public_graphql:
    path: "/graphql/public"
    burst: 120
    sustained: 60
    per: "ip"
    
  admin_graphql:
    path: "/graphql/admin"  
    burst: 1000
    sustained: 300
    per: "authenticated_user"
```

## Monitoring & Observability

### Key Metrics
- Query complexity distribution
- Response time percentiles (p50, p95, p99)
- Cache hit rates
- Rate limit violations
- Error rates by operation
- Multi-subreddit search performance

### Logging Structure
```typescript
interface GraphQLRequestLog {
  operation_name: string;
  query_hash: string;
  complexity: number;
  depth: number;
  variables_shape: string; // No actual values
  response_time_ms: number;
  cache_status: 'hit' | 'miss' | 'stale';
  ip_hash: string; // /24 subnet hash for privacy
  user_agent_bucket: string;
  errors?: string[];
}
```

## Testing Strategy

### Public Endpoint Tests
- Persisted query validation
- Complexity budget enforcement  
- Rate limiting behavior
- CORS headers verification
- Multi-subreddit search functionality

### Admin Endpoint Tests  
- Authentication requirement
- Authorization levels
- Mutation operations
- Data ingestion workflows

## Migration Path

### Phase 1: Dual Implementation
1. Keep existing GraphQL endpoint operational
2. Add new Yoga-based endpoints alongside
3. Test with subset of traffic

### Phase 2: Extension Update
1. Update browser extension to use new public endpoint
2. Monitor performance and error rates  
3. Gradual rollout with feature flags

### Phase 3: Admin Tooling
1. Build admin GraphQL operations
2. Create management interface
3. Migrate data ingestion to admin endpoint

### Phase 4: Cleanup
1. Remove old GraphQL implementation
2. Clean up unused dependencies
3. Update documentation

## Related Documentation
- [Reddit Search API](./REDDIT-SEARCH.md) - Detailed Reddit API integration
- [Security Guidelines](./SECURITY.md) - Security implementation details
- [Caching Strategy](./CACHING.md) - CDN and application caching
- [Monitoring Setup](./MONITORING.md) - Observability configuration