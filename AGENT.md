# WGU Extension Monorepo

**Unofficial WGU Extension** - Adds simple UI changes to WGU pages. Student-made tool for WGU students. Not endorsed by WGU.

This is a monorepo containing:
- **extension/**: Browser extension built with WXT framework
- **functions/**: Firebase Cloud Functions for backend services  
- **site/**: React Router website for public documentation

## Project Structure

```
wgu-extension/
├── extension/                 # Browser extension (WXT)
│   ├── data/                 # Community data collection & processing
│   │   ├── catalogs/         # WGU catalog parsing & storage
│   │   ├── discord/          # Discord server data collection
│   │   ├── reddit/           # Reddit community data collection
│   │   ├── wgu-connect/      # WGU Connect resource extraction
│   │   └── unified/          # Unified community data
│   ├── components/           # React components (Radix UI + Tailwind)
│   ├── entrypoints/          # WXT entry points for different contexts
│   ├── packages/types/       # Shared TypeScript types (published to npm)
│   └── public/               # Static community/course data
├── functions/                # Firebase Cloud Functions
│   └── src/                  # TypeScript source for HTTP endpoints
└── site/                     # React Router website
    └── app/                  # Routes and components
```

## Build Commands

### Development
```bash
# Extension development (with hot reload)
npm run dev:extension

# Functions development (with emulator)
npm run dev:functions

# Website development
npm run dev:site

# All workspaces
npm run dev
```

### Building
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:extension
npm run build:functions
npm run build:site

# Extension production build with data
npm run build:prod:with-data --workspace=extension
```

### Testing & Quality
```bash
# Type check all workspaces
npm run typecheck

# Lint all workspaces  
npm run lint

# Data validation
npm run data:validate:discord --workspace=extension
npm run data:validate:reddit --workspace=extension
```

## Code Style & Conventions

### TypeScript
- **Version**: 5.8.x
- **Strict mode**: Enabled
- **Style**: Functional components, explicit types, no `any`

### React
- **Version**: 19.x
- **Framework**: WXT (extension), React Router (site)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4.x
- **Patterns**: 
  - Functional components with hooks
  - Custom hooks for business logic
  - Context for global state

### File Organization
- **Components**: Pascal case (`SearchPanel.tsx`)
- **Utilities**: Kebab case (`course-utils.ts`)
- **Types**: Interface files in dedicated `types/` directories
- **Data**: JSON Schema validation with runtime type guards

## Architecture Patterns

### Browser Extension (WXT)
- **Content Scripts**: Inject UI into WGU pages
- **Background Worker**: Handle cross-tab communication  
- **Storage**: `@wxt-dev/storage` for persistent data
- **Entrypoints**: Separate contexts for different WGU domains

### Data Processing Pipeline
- **Collection**: Extract data from WGU sources (catalogs, Discord, Reddit)
- **Validation**: JSON Schema + AJV runtime validation
- **Processing**: Transform raw data into unified format
- **Storage**: Local JSON + Firebase for backup

### Monorepo Structure
- **Workspaces**: npm workspaces for extension, functions, site
- **Types Package**: Shared types published to npm with local development tags
- **Scripts**: Cross-workspace automation in root package.json

## Testing Guidelines

### Data Validation
```bash
# Validate Discord data
npm run data:validate:discord --workspace=extension

# Validate Reddit communities  
npm run data:validate:reddit --workspace=extension

# Test catalog parsing
npm run catalog:check --workspace=extension
```

### Extension Testing
- **Manual**: Use `npm run dev:extension` with browser developer tools
- **Data Pipeline**: Test with `npm run data:ingest --workspace=extension`

## Security Considerations

### Data Privacy
- **No Personal Data**: Only collect public community information
- **Discord Privacy**: Extract server metadata only, no user content
- **Reddit Privacy**: Public subreddit data only

### Extension Permissions
- **Minimal Permissions**: Only request access to WGU domains
- **Content Security Policy**: Strict CSP in manifest
- **Storage**: Use extension storage APIs, not web storage

### API Security
- **Firebase Rules**: Secure Firestore access rules
- **CORS**: Restrict origins for function endpoints
- **Rate Limiting**: Implement request rate limiting

## Development Setup

### Prerequisites
```bash
# Node.js 22+ and npm 10+
node --version  # >= 22.0.0
npm --version   # >= 10.0.0
```

### Installation
```bash
# Install all dependencies
npm install

# Prepare extension development
npm run postinstall --workspace=extension
```

### Environment Variables
```bash
# Extension (copy from .env.example)
cp extension/.env.example extension/.env.development

# Functions (Firebase config)
# Configure Firebase project in firebase.json
```

## Data Processing

### Community Data Sources
1. **WGU Catalogs**: PDF parsing for course information  
2. **Discord**: Server discovery and resource extraction
3. **Reddit**: Subreddit communities and discussions
4. **WGU Connect**: Official study groups and resources

### Data Validation
- **JSON Schema**: Strict validation for all data types
- **Runtime Guards**: TypeScript type guards for safety
- **Automated Checks**: GitHub Actions validate data integrity

## Release Process

### Types Package (NPM)
```bash
# Local development
npm run types:publish:local --workspace=extension

# Production release (automated via GitHub Actions)
# Triggered by conventional commits and release-please
```

### Extension Release
- **Development**: Automatic builds on feature branches
- **Production**: Manual release via GitHub Actions
- **Stores**: Chrome Web Store, Firefox Add-ons

## Tools & Integrations

### Build Tools
- **WXT**: Extension development framework
- **Vite**: Fast build tool and dev server  
- **TypeScript**: Type safety and modern JS features
- **Tailwind**: Utility-first CSS framework

### Data Tools
- **AJV**: JSON Schema validation
- **pdf-parse**: Extract text from WGU catalog PDFs
- **tsx**: TypeScript execution for scripts

### Deployment
- **Firebase**: Functions and hosting
- **GitHub Actions**: CI/CD pipelines
- **Release Please**: Automated versioning and releases

## Common Tasks

### Adding New Community Data
1. Add raw data to appropriate `data/*/raw/` directory
2. Update JSON schema in `data/*/types/`  
3. Run validation: `npm run data:validate:* --workspace=extension`
4. Process data: `npm run data:transform --workspace=extension`

### Updating Extension UI
1. Modify components in `extension/components/`
2. Test with `npm run dev:extension`
3. Build production: `npm run build:prod --workspace=extension`

### Adding Firebase Functions
1. Create function in `functions/src/http/`
2. Export in `functions/src/index.ts`
3. Test locally: `npm run serve --workspace=functions`
4. Deploy: `npm run deploy --workspace=functions`