# GraphQL API Deployment Guide

## Overview

This guide covers deploying the dual GraphQL architecture with public read-only and admin authenticated endpoints.

> ⚠️ **[Check Deployment Readiness](STATUS.md#-deployment-readiness)** - Validate prerequisites and resolve blockers before deployment

## Prerequisites

- Firebase CLI installed and authenticated
- Node.js 22+ with npm
- Access to Firebase project with Functions enabled
- Environment variables configured

## Build Process

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Environment Configuration

#### Development Environment
```bash
# functions/.env.development
NODE_ENV=development
ADMIN_EMAILS=admin@example.com,dev@example.com
ALLOWED_ORIGINS=chrome-extension://,moz-extension://,http://localhost
ADMIN_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Production Environment  
Set via Firebase Functions config:
```bash
firebase functions:config:set \
  graphql.schema_version="1.0.0" \
  graphql.complexity_budget="300" \
  graphql.depth_limit="6" \
  graphql.rate_limit="120" \
  admin.emails="admin@wgu-extension.com" \
  reddit.client_id="your_reddit_client_id" \
  reddit.client_secret="your_reddit_client_secret"
```

### 3. Build TypeScript
```bash
npm run build
```

### 4. Deploy to Firebase
```bash
# Deploy all functions
npm run deploy

# Deploy specific functions
firebase deploy --only functions:graphqlPublic
firebase deploy --only functions:graphqlAdmin
```

## Function Endpoints

After deployment, your functions will be available at:
- **Public GraphQL**: `https://us-central1-{project-id}.cloudfunctions.net/graphqlPublic`
- **Admin GraphQL**: `https://us-central1-{project-id}.cloudfunctions.net/graphqlAdmin`

## CDN Configuration (Optional)

### Cloudflare Setup

1. Add Firebase Functions domain to Cloudflare
2. Configure cache rules:

```yaml
# Cache Configuration
- path: "/graphqlPublic*" 
  methods: ["GET"]
  cache_level: "cache_everything"
  edge_cache_ttl: 60
  browser_cache_ttl: 60
  
- path: "/graphqlAdmin*"
  methods: ["GET", "POST"]  
  cache_level: "bypass"
```

3. Add security rules:
```yaml
# Rate Limiting
- path: "/graphqlPublic*"
  rate_limit:
    threshold: 120
    period: 60
    action: "block"
    
- path: "/graphqlAdmin*"  
  rate_limit:
    threshold: 1000
    period: 60
    action: "challenge"
```

### AWS CloudFront Setup

```yaml
# Distribution Configuration
origin_domain: us-central1-{project-id}.cloudfunctions.net
behaviors:
  - path_pattern: "/graphqlPublic*"
    compress: true
    cache_policy_id: "managed-caching-optimized"
    allowed_methods: ["GET", "HEAD", "OPTIONS"]
    
  - path_pattern: "/graphqlAdmin*"
    compress: true  
    cache_policy_id: "managed-caching-disabled"
    allowed_methods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
```

## Security Configuration

### Firestore Security Rules

```javascript
// firebase/firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access to community data
    match /discord_servers/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /reddit_communities/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /reddit_posts/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Admin-only collections
    match /admin_users/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /ingestion_logs/{document} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Function Security

Both functions use security middlewares:
- **Rate limiting**: IP-based request throttling
- **CORS validation**: Origin checking for browser requests
- **Query complexity**: Computational budget limits
- **Depth limiting**: Prevents deeply nested queries

Admin function additionally requires:
- **Authentication**: JWT token validation
- **Authorization**: Admin role verification

## Monitoring Setup

### Firebase Performance Monitoring

```typescript
// Enable in functions/src/index.ts
import { initializeApp } from 'firebase-admin/app';
import { getPerformance } from 'firebase-admin/performance';

const app = initializeApp();
const perf = getPerformance(app);
```

### Custom Metrics

```typescript
// functions/src/lib/metrics.ts
import { logger } from 'firebase-functions/v2';

export function logGraphQLMetrics(operation: string, duration: number, complexity: number) {
  logger.info('graphql_request', {
    operation_name: operation,
    duration_ms: duration,
    query_complexity: complexity,
    timestamp: new Date().toISOString()
  });
}
```

### Alerting Rules

```yaml
# Firebase Alerts Configuration
alerts:
  - name: "GraphQL Error Rate High"
    condition: "error_rate > 5%"
    duration: "5m"
    notification_channels: ["email", "slack"]
    
  - name: "GraphQL Response Time High"  
    condition: "p95_latency > 2000ms"
    duration: "10m"
    notification_channels: ["email"]
```

## Performance Optimization

### Function Configuration

```typescript
// Optimized function settings
export const graphqlPublic = onRequest({
  memory: '512MB',      // Sufficient for read operations
  timeoutSeconds: 10,   // Fast timeout for public queries
  maxInstances: 100,    // Scale for browser extension usage
  cors: false           // Handle CORS manually
});

export const graphqlAdmin = onRequest({
  memory: '1GB',        // More memory for complex operations  
  timeoutSeconds: 60,   // Longer timeout for admin operations
  maxInstances: 10,     // Lower concurrency for admin
  cors: false
});
```

### Database Indexes

```json
// firebase/firestore.indexes.json  
{
  "indexes": [
    {
      "collectionGroup": "reddit_posts",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "subreddit", "order": "ASCENDING"},
        {"fieldPath": "created", "order": "DESCENDING"}  
      ]
    },
    {
      "collectionGroup": "reddit_posts",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "subreddit", "order": "ASCENDING"},
        {"fieldPath": "score", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "discord_servers",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "tags", "arrayConfig": "CONTAINS"},
        {"fieldPath": "memberCount", "order": "DESCENDING"}
      ]  
    }
  ],
  "fieldOverrides": []
}
```

## Testing Deployment

### Public Endpoint Test

```bash
# Test GET with persisted query
curl -X GET "https://us-central1-{project-id}.cloudfunctions.net/graphqlPublic?hash=ping_query_hash&variables={}"

# Should return: {"data":{"ping":"pong"}}
```

### Admin Endpoint Test

```bash
# Test authentication required
curl -X POST "https://us-central1-{project-id}.cloudfunctions.net/graphqlAdmin" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ ping }"}'
  
# Should return: 401 Unauthorized

# Test with auth token  
curl -X POST "https://us-central1-{project-id}.cloudfunctions.net/graphqlAdmin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "{ ping }"}'
  
# Should return: {"data":{"ping":"pong"}}
```

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Test public endpoint
artillery quick --count 100 --num 10 "https://us-central1-{project-id}.cloudfunctions.net/graphqlPublic?hash=ping_query_hash&variables={}"

# Test admin endpoint (with auth)
artillery run admin-load-test.yml
```

## Rollback Strategy

### Version Rollback
```bash
# List recent deployments
firebase functions:log --only graphqlPublic

# Rollback to previous version
firebase functions:rollback graphqlPublic
firebase functions:rollback graphqlAdmin
```

### Traffic Switching
```typescript  
// Feature flag in function
const USE_NEW_ENDPOINT = process.env.FEATURE_NEW_ENDPOINT === 'true';

if (USE_NEW_ENDPOINT) {
  return newGraphQLHandler(request);
} else {
  return legacyGraphQLHandler(request);
}
```

### Database Rollback
- Firestore automatically versions documents
- Use database backups for major rollbacks
- Test schema changes in development first

## Troubleshooting

### Common Issues

#### 1. CORS Errors in Browser Extension
```typescript
// Ensure proper CORS headers
response.headers.set('Access-Control-Allow-Origin', '*');
response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
```

#### 2. Authentication Failures
```typescript
// Check admin user configuration
const isAdmin = await checkAdminPermissions(uid, email);
console.log('Admin check result:', { uid, email, isAdmin });
```

#### 3. Query Complexity Errors
```json
// Adjust complexity budget in config
{
  "graphql": {
    "complexity_budget": "500"
  }
}
```

#### 4. Rate Limiting Issues
```typescript
// Check rate limit configuration
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 120, // requests per window
  message: 'Too many requests'
};
```

### Debug Mode

Enable debug logging:
```bash
firebase functions:config:set debug.enabled=true
firebase deploy --only functions
```

View logs:
```bash  
# Real-time logs
firebase functions:log --only graphqlPublic

# Specific time range
firebase functions:log --only graphqlAdmin --since 2h
```

## Maintenance

### Regular Tasks
- **Weekly**: Review error rates and performance metrics
- **Monthly**: Update dependencies and security patches  
- **Quarterly**: Performance optimization and capacity planning
- **Annually**: Security audit and architecture review

### Monitoring Checklist
- [ ] Function error rates < 1%
- [ ] Average response time < 500ms
- [ ] Cache hit rate > 80%
- [ ] Rate limit violations < 0.1%
- [ ] Admin authentication working
- [ ] Reddit API integration healthy

### Backup Strategy
- **Functions**: Code is backed up in Git repository
- **Configuration**: Functions config exported monthly
- **Database**: Automatic Firestore backups enabled
- **Logs**: CloudWatch/Firebase logs retained for 30 days