# WGU Extension - Firebase Functions Workspace

**Firebase Cloud Functions** providing backend services for the WGU Extension ecosystem.

## Workspace Overview

This workspace contains serverless functions for data ingestion, validation, and API endpoints.

## Build Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Development with emulators
npm run serve

# Deploy to Firebase
npm run deploy

# View logs
npm run logs
```

## Architecture

### HTTP Functions (`src/http/`)
- **ingest-discord.ts**: Endpoint for Discord data collection
- **ingest-wgu-connect.ts**: Endpoint for WGU Connect resource extraction

### Core Libraries (`src/lib/`)
- **cors.ts**: CORS configuration for web requests
- **firebase.ts**: Firebase Admin initialization  
- **rate-limit.ts**: Request rate limiting
- **storage.ts**: Cloud Storage operations
- **validation.ts**: Data validation utilities

## Development

### Local Development
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Start emulators
npm run serve

# Test endpoints at:
# http://localhost:5001/{project-id}/us-central1/ingestDiscord
# http://localhost:5001/{project-id}/us-central1/ingestWguConnect
```

### Configuration
- **Firebase Project**: Configured in `../../firebase.json`
- **Environment**: Use Firebase Functions config for production secrets
- **CORS**: Restricted to extension origins

## API Endpoints

### POST /ingestDiscord
Processes Discord server data extraction requests.

**Headers:**
```
Content-Type: application/json
Origin: chrome-extension://{extension-id}
```

**Body:**
```json
{
  "serverId": "string",
  "serverData": { /* Discord server metadata */ }
}
```

### POST /ingestWguConnect  
Processes WGU Connect resource extraction requests.

**Headers:**
```
Content-Type: application/json
Origin: chrome-extension://{extension-id}
```

**Body:**
```json
{
  "groupId": "string", 
  "resources": [ /* WGU Connect resources */ ]
}
```

## Security

### Rate Limiting
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Storage**: Firestore for rate limit tracking

### CORS Policy
```typescript
const allowedOrigins = [
  /^chrome-extension:\/\/[a-z]{32}$/,
  /^moz-extension:\/\/[a-f0-9-]{36}$/
];
```

### Validation
- **Input Sanitization**: All request bodies validated
- **Schema Validation**: JSON Schema enforcement
- **Error Handling**: Secure error responses

## Storage

### Firestore Collections
- **discord-servers**: Discord server metadata
- **wgu-connect-groups**: WGU Connect group resources  
- **rate-limits**: Request rate limiting data

### Cloud Storage Buckets
- **Raw Data**: JSON files from data extraction
- **Processed Data**: Validated and transformed data

## Deployment

### Environment Setup
1. Configure Firebase project: `firebase use {project-id}`
2. Set environment variables in Firebase console
3. Deploy: `npm run deploy`

### CI/CD
- **GitHub Actions**: Automated deployment on main branch
- **Testing**: Functions emulator in CI pipeline
- **Security**: Dependency scanning and audit

## Monitoring

### Logging
```bash
# View recent logs
npm run logs

# Filter by function
firebase functions:log --only ingestDiscord
```

### Error Tracking
- **Firebase Crashlytics**: Error reporting
- **Custom Metrics**: Request success/failure rates
- **Alerts**: Function timeout and error alerts