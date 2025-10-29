# WXT + React

This template should help get you started developing with React in WXT.

## Getting Started

1. Install dependencies: `pnpm install`
2. (Optional) Set up environment: `cp .env.example .env.local`
3. Start development: `pnpm rundev`
4. Build for production: `pnpm runbuild`

## Development Configuration

## Development Configuration

### Build Modes & Environment Files

WXT automatically loads the appropriate `.env` file based on the build mode:

```bash
# Development (pnpm rundev)
.env.development        # Auto-loaded, uses local JSON files

# Production (pnpm runbuild)  
.env.production         # Auto-loaded, uses extension URLs

# Preview (pnpm runbuild:preview)
.env.preview            # Custom mode for testing production behavior

# Personal overrides (any mode)
.env.local              # Gitignored, highest priority
```

### Available Scripts

```bash
# Development
pnpm rundev             # Start dev server (development mode)
pnpm rundev:firefox     # Dev server for Firefox

# Building
pnpm runbuild           # Production build
pnpm runbuild:dev       # Development build  
pnpm runbuild:preview   # Preview build (test production behavior)
pnpm runbuild:prod      # Explicit production build

# Packaging
pnpm runzip             # Create Chrome store ZIP (production)
pnpm runzip:firefox     # Create Firefox store ZIP (production)
pnpm runzip:preview     # Create preview ZIP
```

### Configuration Variables

Set these in your `.env` files or `.env.local`:

```bash
# Community data loading
WXT_USE_LOCAL_COURSE_FILES=true    # Use local JSON files
WXT_FORCE_EXTENSION_CONTEXT=true   # Force extension URLs
WXT_DEBUG_MODE=true                # Enable debug logging
```

### Quick Setup

1. **Basic development**: No setup needed - just run `pnpm rundev`
2. **Custom settings**: Copy `.env.example` to `.env.local` and modify
3. **Test production**: Run `pnpm runbuild:preview`

### CI/CD Pipeline

The GitHub Actions workflow automatically:

- **PR/Push to feat branches**: Runs tests + builds preview artifacts
- **Push to develop**: Runs tests + builds preview artifacts  
- **Push to main**: Runs tests + builds production artifacts
- **Release Please**: Automated releases based on conventional commits

### Releases

This project uses automated releases via [Release Please](https://github.com/googleapis/release-please):

- Use [conventional commit messages](https://www.conventionalcommits.org/) 
- Release Please automatically creates release PRs
- Merging release PRs triggers automated store submission
- See [docs/RELEASES.md](docs/RELEASES.md) for detailed information

**Example commit messages:**
```bash
feat: add new Discord integration
fix: resolve course code extraction issue  
feat!: breaking API changes
```
