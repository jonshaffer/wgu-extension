# WGU Extension Architecture

## Overview

The WGU Extension is a monorepo containing multiple interconnected workspaces that work together to provide community resources for WGU students.

## Data Flow Architecture

```
Raw Data Sources → Local Parsing → CI/CD Pipeline → Firestore → GraphQL API → Consumers
                                         ↓                              ↓
                                    Contributors               Extension/Site/Dev Cache
```

## Workspaces

### 1. `data/` - Data Processing Hub
- **Purpose**: Parse PDFs, validate community data, define types
- **Key Features**:
  - PDF parsing for WGU catalogs
  - Community data validation
  - TypeScript types as npm package
  - Local development cache

### 2. `functions/` - Backend Services
- **Purpose**: Firebase Functions, GraphQL API
- **Key Features**:
  - GraphQL endpoint for all data queries
  - Publishes schema and types
  - Firestore integration

### 3. `graphql-client/` - Client Library
- **Purpose**: Simplified GraphQL access
- **Key Features**:
  - Pre-configured client
  - Type-safe queries
  - Built-in caching

### 4. `extension/` - Browser Extension
- **Purpose**: Enhance WGU web pages
- **Key Features**:
  - Content script injection
  - GraphQL data fetching (with feature flag)
  - Community resource display

### 5. `site/` - Public Website
- **Purpose**: Documentation and resource discovery
- **Key Features**:
  - React Router v7
  - Apollo Client for GraphQL
  - Advanced search capabilities

## Key Design Decisions

### 1. Firestore as Single Source of Truth
- All data lives in Firestore
- No more static JSON files
- Real-time updates possible

### 2. GraphQL API Layer
- Unified data access pattern
- Type safety across all consumers
- Flexible querying

### 3. CI/CD Automation
- Contributors submit parsing logic
- CI validates and uploads to Firestore
- No manual deployment needed

### 4. Package-based Type Sharing
- `@wgu-extension/data`: Core types
- `@wgu-extension/functions`: GraphQL types
- `@wgu-extension/graphql-client`: Client utilities

## Development Workflow

### For Contributors
1. Fork and clone repository
2. Run `make dev-setup` in data/
3. Improve parsing logic
4. Submit PR
5. CI handles the rest

### For Maintainers
1. Review PR with CI results
2. Merge to trigger upload
3. Monitor Firestore health

## Environment Configuration

### Extension
```env
# Enable GraphQL (during migration)
VITE_USE_GRAPHQL=true

# Custom endpoint for development
VITE_GRAPHQL_ENDPOINT=http://localhost:5001/project/us-central1/graphql
```

### Functions
```env
# Handled by Firebase deployment
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json
```

### Site
```env
# GraphQL endpoint configuration
VITE_GRAPHQL_ENV=local|production
```

## Migration Path

The architecture supports gradual migration:

1. **Phase 1**: GraphQL infrastructure (✅ Complete)
2. **Phase 2**: Extension uses GraphQL with feature flag (✅ Complete)
3. **Phase 3**: CI/CD for automated uploads (✅ Complete)
4. **Phase 4**: Remove static file generation (✅ Complete)
5. **Phase 5**: Documentation and cleanup (✅ Complete)

## Security Considerations

- No personal data collection
- Public data only (Discord servers, Reddit communities)
- Service accounts for CI/CD
- Minimal extension permissions

## Performance Optimizations

- GraphQL query batching
- Client-side caching (1 hour default)
- Firestore indexes for fast queries
- CDN for static assets

## Future Enhancements

1. **Real-time Updates**: WebSocket subscriptions
2. **User Contributions**: Direct data submission
3. **Analytics**: Usage tracking and insights
4. **Mobile App**: React Native client