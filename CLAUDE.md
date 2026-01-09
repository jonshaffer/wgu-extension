# WGU Extension Monorepo

**Unofficial WGU Extension** - Adds simple UI changes to WGU pages. Student-made tool for WGU students. Not endorsed by WGU.

This is a monorepo containing:
- **extension/**: Browser extension built with WXT framework (@extension/manifest.json)
- **functions/**: Firebase Cloud Functions for backend services (@firebase.json)  
- **site/**: React Router website for public documentation

## Project Governance

This project follows [GitHub Spec Kit](https://github.com/github/spec-kit) principles:

- **🏛️ [Project Constitution](.specify/memory/constitution.md)** - Core principles, coding standards, and technical decision-making processes
- **📋 [Feature Specifications](specs/)** - Detailed specifications for all major features
- **📝 [Templates](.specify/templates/)** - Templates for specifications and technical decisions
- **📦 [Archived Features](.specify-archive/features/)** - Legacy feature documentation

**IMPORTANT**: Before making significant changes, consult the constitution for established standards and create specifications for new features.

## Key Configuration Files
- **@package.json**: Root workspace configuration with all pnpm scripts
- **@firebase.json**: Firebase deployment configuration (dual databases)
- **@extension/manifest.json**: Browser extension permissions and settings
- **@extension/wxt.config.ts**: WXT framework configuration
- **@flake.nix**: Development environment specification
- **@functions/src/graphql/allowlist.json**: Whitelisted GraphQL queries

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
├── site/                    # React Router website
│   └── app/                 # Routes and components
├── graphql-client/          # GraphQL client library (npm package)
│   └── src/                 # Client code with caching and types
└── firebase/                # Firebase configuration
    ├── firestore.rules      # Security rules for default database
    └── firestore-admin.rules # Security rules for admin database
```

## Build Commands

### Development
```bash
# Extension development (with hot reload)
pnpm run dev:extension

# Functions development (with emulator)
pnpm run dev:functions

# Website development
pnpm run dev:site

# All workspaces
pnpm run dev
```

### Building
```bash
# Build all workspaces
pnpm run build

# Build specific workspace
pnpm run build:extension
pnpm run build:functions
pnpm run build:site

# Extension production build with data
pnpm run build:prod:with-data --workspace=extension
```

### Testing & Quality
```bash
# Type check all workspaces
pnpm run typecheck

# Lint all workspaces  
pnpm run lint

# Data validation
pnpm run data:validate:discord --workspace=extension
pnpm run data:validate:reddit --workspace=extension
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
- **Workspaces**: pnpm workspaces for data, extension, functions, site, graphql-client
- **Types Package**: Shared types from @wgu-extension/data and @wgu-extension/functions
- **Scripts**: Cross-workspace automation in root package.json

### API Architecture
- **GraphQL Endpoints**: 
  - Public API (`publicApi`): Read-only access with persisted queries
  - Admin API (`adminApi`): Protected data management operations
- **GraphQL Yoga**: Modern GraphQL server with security features
- **Type Safety**: Types flow from functions → graphql-client → consumers
- **Persisted Queries**: Only whitelisted queries allowed for security
- **Caching**: Built-in client-side caching for performance

> 📊 **[Functions Status Dashboard](functions/STATUS.md)** - Track GraphQL implementation progress and deployment readiness

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
pnpm run validate:discord --workspace=data

# Validate Reddit communities  
pnpm run validate:reddit --workspace=data

# Test catalog parsing
pnpm run catalog:check --workspace=extension
```

### Extension Testing
- **Manual**: Use `pnpm run dev:extension` with browser developer tools
- **Data Pipeline**: Test with `pnpm run data:ingest --workspace=extension`

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
pnpm install

# Prepare extension development
pnpm run postinstall --workspace=extension
```

### Verifying Setup
```bash
# Check all tools are available
node --version  # Should show v22.x
npm --version   # Should show v10.x
firebase --version  # Should show Firebase CLI version

# Verify workspaces
pnpm run typecheck  # Should complete without errors
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
pnpm run types:publish:local --workspace=extension

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
3. Run validation: `pnpm run validate:{source} --workspace=data`
4. Process data: `pnpm run transform --workspace=data`

### Updating Extension UI
1. Modify components in `extension/components/`
2. Test with `pnpm run dev:extension`
3. Build production: `pnpm run build:prod --workspace=extension`

### Adding Firebase Functions
1. Create function in `functions/src/http/`
2. Export in `functions/src/index.ts`
3. Test locally: `pnpm run serve --workspace=functions`
4. Deploy: `pnpm run deploy --workspace=functions`

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
pnpm run build:extension
# Look for errors in browser console (chrome://extensions)
```

#### TypeScript Errors
```bash
# Clean and rebuild
pnpm run clean --workspaces
pnpm install
pnpm run typecheck
```

#### Firebase Functions Failing
```bash
# Check logs
firebase functions:log
# Test locally with emulator
pnpm run serve --workspace=functions
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
pnpm run build:prod --workspace=extension

# Check bundle size
pnpm run analyze --workspace=extension
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
pnpm run deploy --workspace=functions

# Deploy specific functions
firebase deploy --only functions:publicApi
firebase deploy --only functions:adminApi
```

#### Firestore Rules
```bash
# Test rules
pnpm run test:rules --workspace=functions

# Deploy rules
firebase deploy --only firestore:rules
```

### Site Deployment
```bash
# Build and deploy to Firebase Hosting
pnpm run build --workspace=site
firebase deploy --only hosting
```

## Contributing Guidelines for AI Agents

### Before Making Changes
1. **Review the [Project Constitution](.specify/memory/constitution.md)** for coding standards and principles
2. **Check existing [Feature Specifications](specs/)** to understand current architecture
3. **Create specifications for new features** using [templates](.specify/templates/) before implementation
4. Read relevant existing code to understand patterns
5. Check @package.json for available scripts
6. Run `pnpm run typecheck` to ensure type safety
7. Respect existing code style (Prettier will auto-format)

### Making Code Changes
1. **Always** run type checking before committing
2. **Never** commit secrets or API keys
3. **Follow** existing patterns in nearby code
4. **Test** changes locally with `pnpm run dev`
5. **Update** tests if modifying functionality

### Data Modifications
1. Validate JSON with schemas: `pnpm run data:validate`
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

## CI/CD Troubleshooting

### Common CI Issues

#### Platform-Specific Binary Errors
**Symptoms**: `Cannot find module '../lightningcss.linux-x64-gnu.node'` or similar platform binary errors

**Solution**:
```bash
# Enhanced dependency installation for CI
pnpm install --frozen-lockfile --include=optional --foreground-scripts
npm rebuild lightningcss --build-from-source --verbose
pnpm install @tailwindcss/oxide-linux-x64-gnu --no-save
pnpm install @esbuild/linux-x64 --no-save
```

**Environment Variables for CI**:
```bash
export npm_config_target_arch=x64
export npm_config_target_platform=linux
export npm_config_optional=true
```

#### Build Dependency Validation
**Command**: `node scripts/validate-build-dependencies.js`

**Common Fixes**:
- **Missing @tailwindcss/oxide**: `pnpm install @tailwindcss/oxide-linux-x64-gnu --no-save`
- **Missing lightningcss binary**: `npm rebuild lightningcss --build-from-source --verbose`
- **Missing esbuild binary**: `pnpm install @esbuild/linux-x64 --no-save`

#### Codecov Upload Issues
**Symptoms**: Rate limiting or upload timeouts

**Current Setup**: 
- Coverage uploads are non-blocking (`continue-on-error: true`)
- Uses `CODECOV_TOKEN` secret for authentication
- Fails gracefully without blocking CI success

### CI Workflow Status
- **Functions CI** (`functions-ci.yml`): Consolidated workflow with lint, type check, unit tests, integration tests, GraphQL client tests, and production build
- **Site CI** (`site-ci.yml`): Platform binaries handled automatically
- **Extension CI** (`wxt-extension-ci.yml`): Build testing for Chrome, Firefox, Edge
- **Data CD** (`data-cd.yml`, `community-data-cd.yml`): Catalog and community data processing

### Workflow Architecture
```
functions-ci.yml:
  lint-and-type-check → unit-tests → graphql-client-tests
                      → integration-tests (matrix: minimal, standard)
                      unit-tests + integration-tests → build-production
                      All tests → test-summary (PR comments)

wxt-extension-ci.yml:
  test → build-preview
       → build-production

site-ci.yml:
  test → build-preview
       → build-production
```

### Key Features
- **Dependency Validation**: `pnpm run validate:dependencies` runs in Functions CI
- **Consolidated Functions CI**: Single workflow replaces firebase-functions-ci.yml + firebase-functions-ci-enhanced.yml
- **Standardized pnpm**: All workflows use pnpm with frozen-lockfile
- **Major Version Pins**: GitHub Actions pinned to major versions with Dependabot updates
- **Coverage Integration**: Codecov uploads with non-blocking failures

### Troubleshooting Steps
1. **Check CI logs** for specific error messages
2. **Run validation script** locally: `node scripts/validate-build-dependencies.js`
3. **Manual binary installation** if validation fails
4. **Review platform compatibility** for new dependencies
5. **Consult [CI Error Analysis](docs/ci-error-analysis-review.md)** for detailed solutions

### Prevention
- Always test new dependencies in CI environment
- Use `pnpm install --frozen-lockfile --include=optional` for consistent installs
- Add platform-specific dependencies to validation script
- Monitor CI success rates and build times
- Dependabot configured for monthly grouped updates (see `.github/dependabot.yml`)