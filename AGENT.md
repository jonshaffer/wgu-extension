# WGU Extension Monorepo

**Unofficial WGU Extension** - Adds simple UI changes to WGU pages. Student-made tool for WGU students. Not endorsed by WGU.

This is a monorepo containing:
- **extension/**: Browser extension built with WXT framework (@extension/manifest.json)
- **functions/**: Firebase Cloud Functions for backend services (@firebase.json)  
- **site/**: React Router website for public documentation

## Key Configuration Files
- **@package.json**: Root workspace configuration with all npm scripts
- **@firebase.json**: Firebase deployment configuration
- **@extension/manifest.json**: Browser extension permissions and settings
- **@extension/wxt.config.ts**: WXT framework configuration
- **@flake.nix**: Development environment specification

## Project Structure

```
wgu-extension/
├── data/                     # Community data collection & processing
│   ├── catalogs/            # WGU catalog parsing & storage
│   ├── discord/             # Discord server data collection
│   ├── reddit/              # Reddit community data collection
│   ├── wgu-connect/         # WGU Connect resource extraction
│   ├── wgu-student-groups/  # Student groups extraction
│   ├── unified/             # Unified community data transformation
│   └── types/               # Shared TypeScript types (published to npm)
├── extension/               # Browser extension (WXT)
│   ├── components/          # React components (Radix UI + Tailwind)
│   ├── entrypoints/         # WXT entry points for different contexts
│   └── public/              # Static assets and generated community data
├── functions/               # Firebase Cloud Functions
│   └── src/                 # TypeScript source for HTTP endpoints
└── site/                    # React Router website
    └── app/                 # Routes and components
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
- **Data Access**: GraphQL API via feature flag (migrating from static files)

### Data Processing Pipeline
- **Collection**: Contributors submit parsing logic via PRs
- **Validation**: CI/CD runs parsers and validates output
- **Processing**: Automated upload to Firestore on merge
- **Storage**: Firestore as single source of truth

### Monorepo Structure
- **Workspaces**: npm workspaces for data, extension, functions, site, graphql-client
- **Types Package**: Shared types from @wgu-extension/data and @wgu-extension/functions
- **Scripts**: Cross-workspace automation in root package.json

### API Architecture
- **GraphQL Endpoint**: Unified data access via Firebase Functions
- **Type Safety**: Types flow from functions → graphql-client → consumers
- **Caching**: Built-in client-side caching for performance

### Data Workspace
The data workspace (@wgu-extension/data) handles all community data collection, processing, and shared types:
- **Directory structure**: `data/{source}/raw/` for raw data, `data/{source}/types/` for schemas
- **Shared types**: `data/types/` contains TypeScript types and Zod schemas published to npm
- **Scripts**: Validation, ingestion, and transformation scripts for each data source
- **Output**: Generates unified data to `extension/public/data/` for extension use

## Testing Guidelines

### Data Validation
```bash
# Validate Discord data
npm run validate:discord --workspace=data

# Validate Reddit communities  
npm run validate:reddit --workspace=data

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

This project uses Nix flakes with direnv to provide a consistent development environment. The following software is automatically available when you enter the project directory:

#### Core Development Tools
- **Node.js 22**: JavaScript runtime (v22.x)
- **npm**: Node package manager (latest)
- **pnpm**: Fast, disk space efficient package manager
- **yarn**: Alternative package manager

#### Language Tools
- **TypeScript**: Type-safe JavaScript compiler
- **TypeScript Language Server**: IDE integration for TypeScript
- **VS Code Language Servers**: Language support for various file types
- **Prettier**: Code formatter
- **ESLint**: JavaScript/TypeScript linter
- **tsx**: TypeScript execution for scripts

#### Firebase & Cloud
- **Firebase Tools**: Deploy and manage Firebase services

#### PDF Processing
- **Poppler**: PDF rendering library for manipulating PDFs
- **Poppler Utils**: Command-line utilities for PDF processing

#### Version Control
- **Git**: Distributed version control
- **DVC**: Data Version Control for large files (PDFs, JSON)
- **GitHub CLI (gh)**: Interact with GitHub from the command line

#### Utilities
- **jq**: Command-line JSON processor
- **curl**: Transfer data with URLs
- **tree**: Display directory structure
- **ripgrep (rg)**: Fast text search tool
- **fd**: Fast and user-friendly alternative to find

### Installation
```bash
# With direnv installed, the environment loads automatically
cd wgu-extension
direnv allow

# Install all dependencies
npm install

# Prepare extension development
npm run postinstall --workspace=extension
```

### Verifying Setup
```bash
# Check all tools are available
node --version  # Should show v22.x
npm --version   # Should show v10.x
firebase --version  # Should show Firebase CLI version

# Verify workspaces
npm run typecheck  # Should complete without errors
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
- **DVC**: Data Version Control for large files (catalogs, PDFs)
- **AJV**: JSON Schema validation
- **pdf-parse**: Extract text from WGU catalog PDFs
- **tsx**: TypeScript execution for scripts

### Deployment
- **Firebase**: Functions and hosting
- **GitHub Actions**: CI/CD pipelines
- **Release Please**: Automated versioning and releases

## Common Tasks

### Adding New Community Data
1. Add raw data to appropriate `data/{source}/raw/` directory
2. Update JSON schema in `data/{source}/types/`  
3. Run validation: `npm run validate:{source} --workspace=data`
4. Process data: `npm run transform --workspace=data`

### Updating Extension UI
1. Modify components in `extension/components/`
2. Test with `npm run dev:extension`
3. Build production: `npm run build:prod --workspace=extension`

### Adding Firebase Functions
1. Create function in `functions/src/http/`
2. Export in `functions/src/index.ts`
3. Test locally: `npm run serve --workspace=functions`
4. Deploy: `npm run deploy --workspace=functions`

## API Documentation

### Firebase Functions Endpoints

#### GraphQL API
- **Endpoint**: `/graphql`
- **Method**: POST
- **Purpose**: Query unified community data from Firestore
- **Authentication**: None (public read-only)
- **Schema**: See @functions/src/graphql/schema.ts

#### Discord Ingestion
- **Endpoint**: `/ingest-discord`
- **Method**: POST
- **Purpose**: Process Discord server data
- **Authentication**: API key required
- **Rate Limit**: 10 requests per minute

#### Search API
- **Function**: `search`
- **Type**: Callable function
- **Purpose**: Search across community resources (Discord, Reddit, WGU Connect)
- **Implementation**: @functions/src/index.ts

### Extension Content Scripts

#### Search Panel
- **Entry**: @extension/entrypoints/content/search-panel.tsx
- **Domains**: `*.wgu.edu`
- **Purpose**: Inject course search UI into WGU pages

#### Course Enhancements
- **Entry**: @extension/entrypoints/content/course-page.tsx
- **Purpose**: Add community links and resources to course pages

## Error Handling & Troubleshooting

### Common Development Issues

#### Extension Not Loading
```bash
# Check manifest is valid
npm run build:extension
# Look for errors in browser console (chrome://extensions)
```

#### TypeScript Errors
```bash
# Clean and rebuild
npm run clean --workspaces
npm install
npm run typecheck
```

#### Firebase Functions Failing
```bash
# Check logs
firebase functions:log
# Test locally with emulator
npm run serve --workspace=functions
```

#### PDF Parsing Issues
```bash
# Ensure poppler is available
which pdftotext  # Should show path
# Check PDF is valid
pdfinfo data/catalogs/pdfs/catalog-YYYY-MM.pdf
```

### Rate Limiting
- Discord API: 10 requests/minute per IP
- Reddit API: Follow Reddit's rate limits
- Firebase Functions: Custom rate limiting implemented

## Performance Guidelines

### Extension Performance
- **Bundle Size**: Keep under 5MB for fast loading
- **Content Scripts**: Minimize DOM mutations, use React efficiently
- **Storage**: Use extension storage API, not localStorage
- **Background Worker**: Avoid heavy computation, use message passing

### Data Processing
- **Catalog Parsing**: Process in batches to avoid memory issues
- **JSON Validation**: Stream large files when possible
- **Firebase Queries**: Use proper indexes (@firestore.indexes.json)

### Build Performance
```bash
# Production build with optimizations
npm run build:prod --workspace=extension

# Check bundle size
npm run analyze --workspace=extension
```

## Deployment Workflow

### Extension Deployment

#### Development Build
1. Push to feature branch
2. GitHub Actions builds automatically
3. Download artifact from Actions tab
4. Load unpacked extension for testing

#### Production Release
1. Merge to main branch
2. Create release tag: `git tag v1.2.3`
3. Push tag: `git push origin v1.2.3`
4. GitHub Actions creates release
5. Upload to Chrome Web Store / Firefox Add-ons

### Firebase Deployment

#### Functions
```bash
# Deploy all functions
npm run deploy --workspace=functions

# Deploy specific function
firebase deploy --only functions:graphql
```

#### Firestore Rules
```bash
# Test rules
npm run test:rules --workspace=functions

# Deploy rules
firebase deploy --only firestore:rules
```

### Site Deployment
```bash
# Build and deploy to Firebase Hosting
npm run build --workspace=site
firebase deploy --only hosting
```

## Contributing Guidelines for AI Agents

### Before Making Changes
1. Read relevant existing code to understand patterns
2. Check @package.json for available scripts
3. Run `npm run typecheck` to ensure type safety
4. Respect existing code style (Prettier will auto-format)

### Making Code Changes
1. **Always** run type checking before committing
2. **Never** commit secrets or API keys
3. **Follow** existing patterns in nearby code
4. **Test** changes locally with `npm run dev`
5. **Update** tests if modifying functionality

### Data Modifications
1. Validate JSON with schemas: `npm run data:validate`
2. Keep raw data in `*/raw/` directories
3. Process data to `*/parsed/` directories
4. Update types in `*/types/` when schema changes

### Commit Messages
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation only
- `chore:` Maintenance tasks
- `refactor:` Code restructuring

### Testing Requirements
- Extension: Manual testing with dev build
- Functions: Unit tests + emulator testing
- Data: Schema validation must pass

## Security Considerations

### Sensitive Files
- **Never** commit `.env` files
- **Never** expose Firebase service account keys
- **Never** include user personal data in commits

### API Keys
- Store in GitHub Secrets for Actions
- Use Firebase Config for runtime secrets
- Document required environment variables in `.env.example`

### Extension Security
- Minimal permissions in @extension/manifest.json
- Content Security Policy enforced
- No eval() or inline scripts
- Sanitize all user inputs