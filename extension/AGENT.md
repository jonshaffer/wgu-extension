# WGU Extension - Browser Extension Workspace

**Browser extension built with WXT framework** for enhancing WGU student experience.

## Workspace Overview

This workspace contains the browser extension code that runs on WGU domains to provide enhanced UI and community data integration.

## Build Commands

```bash
# Development with hot reload
npm run dev

# Production build
npm run build:prod

# Build with fresh community data
npm run build:prod:with-data

# Package for browser stores
npm run release
```

## Architecture

### WXT Framework
- **Content Scripts**: Inject into WGU pages (`entrypoints/*.content/`)
- **Background Worker**: Cross-tab communication (`entrypoints/background/`)
- **Popup/Options**: Extension UI (`entrypoints/popup/`, `entrypoints/options/`)

### Data Processing Pipeline
```bash
# Ingest all data sources
npm run data:ingest

# Individual data sources
npm run data:ingest:discord
npm run data:ingest:reddit  
npm run data:ingest:wgu-connect
npm run data:ingest:catalog
```

### Component Structure
- **UI Components**: `components/ui/` (Radix UI primitives)
- **Feature Components**: `components/course-details/`
- **Utils**: `utils/` (business logic helpers)

## Data Sources

### Community Data (`data/`)
1. **Catalogs**: WGU course catalogs (PDF parsing)
2. **Discord**: Community Discord servers  
3. **Reddit**: WGU subreddit communities
4. **WGU Connect**: Official study groups
5. **WGU Student Groups**: Student organizations

### Validation & Processing
```bash
# Validate data integrity
npm run data:validate:discord
npm run data:validate:reddit

# Check catalog parsing
npm run catalog:check
```

## Development

### Content Script Injection
- **Course Details**: Enhance course pages with community links
- **Discord Integration**: Extract server information
- **Reddit Integration**: Display relevant subreddits

### Storage
- Uses `@wxt-dev/storage` for persistent settings
- Community data stored in `public/data/`

### Types Package
```bash
# Build shared types
npm run types:build

# Publish for local development  
npm run types:publish:local
```

## Testing

### Manual Testing
1. Run `npm run dev`
2. Load unpacked extension in browser
3. Navigate to WGU domains
4. Check developer console for errors

### Data Testing
```bash
# Test data extraction
npm run data:test:wgu-student-groups

# Validate schema compliance
npm run data:validate:discord --check-invites
```

## Extension Permissions

- **Host Permissions**: `*.wgu.edu`, `wgu.edu`
- **Storage**: Local extension storage
- **Background**: Service worker for cross-tab communication

## Security

- **CSP**: Strict Content Security Policy
- **Data Privacy**: No personal data collection
- **Permissions**: Minimal required permissions only