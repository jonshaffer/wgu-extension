# Release Management

This project uses [Release Please](https://github.com/googleapis/release-please) for automated release management based on [Conventional Commits](https://www.conventionalcommits.org/).

> 📚 **Comprehensive Documentation Available**
> - [Release Strategy Guide](./RELEASE-STRATEGY.md) - Complete release workflows, platform requirements, and emergency procedures
> - [Deployment Runbook](./DEPLOYMENT-RUNBOOK.md) - Step-by-step deployment procedures for all components

## How It Works

1. **Conventional Commits**: Use conventional commit messages for all changes
2. **Automated PRs**: Release Please automatically creates release PRs when new commits are pushed to `main`
3. **Version Bumping**: Semantic versions are automatically calculated based on commit types
4. **Automated Deployments**: When a release is created:
   - Extension is built and submitted to Chrome, Firefox, and Edge stores (requires approval)
   - NPM packages (`@wgu-extension/data`, `@wgu-extension/graphql-client`) are published automatically
   - Firebase Functions are deployed to production (requires approval)
   - Firebase Hosting (site) is deployed to production (requires approval)

## Commit Message Format

Use the following format for your commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat:` - A new feature (bumps minor version)
- `fix:` - A bug fix (bumps patch version)
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `build:` - Changes to build system or dependencies
- `ci:` - Changes to CI configuration
- `chore:` - Maintenance tasks

### Breaking Changes

Add `!` after the type to indicate a breaking change (bumps major version):

```
feat!: remove deprecated API endpoints
```

## Examples

```bash
# Feature addition (minor version bump)
git commit -m "feat: add Discord integration to course details panel"

# Bug fix (patch version bump)
git commit -m "fix: resolve course code extraction for WGU format"

# Breaking change (major version bump)
git commit -m "feat!: redesign community panel API"

# Documentation update (no version bump)
git commit -m "docs: update installation instructions"

# Build system change (no version bump)
git commit -m "build: update WXT to latest version"
```

## Release Process

1. **Make Changes**: Develop your features/fixes on feature branches
2. **Create PR**: Open a pull request against `main` with conventional commit messages
3. **Merge PR**: After review, merge the PR to `main`
4. **Automatic Release PR**: Release Please will automatically:
   - Analyze the new commits
   - Calculate the next version based on conventional commits
   - Update `CHANGELOG.md`
   - Update `package.json` version in all workspaces
   - Create a release PR
5. **Review & Merge**: Review the generated release PR and merge it
6. **Automatic Release**: When the release PR is merged:
   - A GitHub release is created with generated release notes
   - Extension artifacts are built and attached to the release
   - The following automated workflows are triggered (in parallel):

   **NPM Packages (Fully Automated):**
   - `@wgu-extension/data` is published to npm
   - `@wgu-extension/graphql-client` is published to npm
   - Skips if version already published

   **Browser Extension Stores (Requires Approval):**
   - **Approval Gate**: `store-submission` environment (5-minute wait for reviewers)
   - After approval, submits to:
     - Chrome Web Store (review time: 1-3 days)
     - Firefox Add-ons (review time: 1-7 days)
     - Microsoft Edge Add-ons (review time: 3-7 days)
   - Gracefully skips stores with missing credentials

   **Firebase Functions (Requires Approval):**
   - **Approval Gate**: `production-firebase` environment (10-minute wait for reviewers)
   - After approval, deploys all functions to production
   - Runs smoke tests to verify deployment
   - Automatically rolls back on verification failure

   **Firebase Hosting (Requires Approval):**
   - **Approval Gate**: `production-firebase` environment (10-minute wait for reviewers)
   - After approval, deploys site to Firebase Hosting
   - Runs smoke tests to verify deployment
   - Automatically rolls back on verification failure

## Approval Gates

### Approving Deployments

When a release is created, certain deployments require manual approval via GitHub Environments:

**Store Submission Approval:**
1. Navigate to [GitHub Actions](https://github.com/jonshaffer/wgu-extension/actions)
2. Find the "Release Please" workflow run
3. Click on the `store-submission` job
4. Review the extension changes and version
5. Click "Review pending deployments"
6. Check the `store-submission` environment box
7. Click "Approve and deploy"

**Firebase Deployment Approval:**
1. Follow steps 1-4 above for `deploy-functions` or `deploy-hosting` jobs
2. Review the changes being deployed
3. Check the `production-firebase` environment box
4. Click "Approve and deploy"

**Using GitHub CLI:**
```bash
# List pending runs
gh run list --workflow=release-please.yml

# Approve specific deployment
gh run approve <RUN_ID>
```

**Important Notes:**
- Only repository maintainers can approve deployments
- Wait timers are configured (5 min for stores, 10 min for Firebase)
- Auto-approval occurs if no action is taken within the wait period
- For emergency deployments, approve immediately to skip wait timer

### Emergency Override

For critical hotfixes requiring immediate deployment:

```bash
# Skip all approval gates and deploy immediately
gh run approve <RUN_ID>

# Or manually deploy
cd functions && pnpm run deploy --force
firebase deploy --only hosting --force
```

See [Deployment Runbook](./DEPLOYMENT-RUNBOOK.md#emergency-hotfix-deployment) for complete emergency procedures.

## Manual Operations

### Build Release Locally

```bash
npm run release
```

### Generate Store Release Notes

```bash
# Generate release notes for all stores
node scripts/generate-store-release-notes.js 1.2.3

# Generate for specific store
node scripts/generate-store-release-notes.js 1.2.3 --store=chrome
node scripts/generate-store-release-notes.js 1.2.3 --store=firefox
node scripts/generate-store-release-notes.js 1.2.3 --store=edge
```

Output will be saved to `.output/release-notes/`

### Check What Would Be Released

The release PR will show you exactly what changes will be included and what the new version will be.

## Configuration Files

- `release-please-config.json` - Release Please configuration
- `.release-please-manifest.json` - Current version tracking
- `CHANGELOG.md` - Automatically generated changelog
- `.github/workflows/release-please.yml` - Release automation workflow

## Required Secrets

The following GitHub secrets are required for automated deployments:

### NPM Publishing
- `NPM_TOKEN` - NPM authentication token with publish access to `@wgu-extension` scope

### Chrome Web Store
- `CHROME_EXTENSION_ID` - Extension ID from Chrome Web Store
- `CHROME_CLIENT_ID` - OAuth client ID
- `CHROME_CLIENT_SECRET` - OAuth client secret
- `CHROME_REFRESH_TOKEN` - OAuth refresh token

### Firefox Add-ons
- `FIREFOX_EXTENSION_ID` - Extension UUID from AMO
- `FIREFOX_JWT_ISSUER` - API key (JWT issuer)
- `FIREFOX_JWT_SECRET` - API secret

### Microsoft Edge Add-ons (optional)
- `EDGE_PRODUCT_ID` - Product ID from Partner Center
- `EDGE_CLIENT_ID` - Azure AD client ID
- `EDGE_CLIENT_SECRET` - Azure AD client secret
- `EDGE_TENANT_ID` - Azure AD tenant ID

### Firebase
- `FIREBASE_TOKEN` - Firebase CI token (generate with `firebase login:ci`)
- `FIREBASE_PROJECT_ID` - Firebase project ID

**Notes:**
- Edge submission uses the official edge-addons-cli. The access token URL is constructed from your Azure AD tenant ID.
- Store submissions run under the `store-submission` environment for approval protection.
- Firebase deployments run under the `production-firebase` environment for approval protection.
- Missing store credentials will gracefully skip that store without failing the workflow.

## Manual Publish Workflow

You can manually trigger store submissions with the "Publish to Web Stores" workflow. This is useful for hotfixes, re-submissions, or testing.

Inputs:
- `chrome` (boolean): Submit to Chrome Web Store
- `firefox` (boolean): Submit to Firefox Add-ons
- `edge` (boolean): Submit to Microsoft Edge Add-ons
- `mode` (choice): Build mode (`production`, `preview`, `development`)

Behavior:
- The workflow builds and zips artifacts for Chrome, Firefox, and Edge.
- Each submission step checks whether the necessary secrets are configured; if not, it skips gracefully.

## Environment Protection

Store submission uses the `production` environment for additional security. Make sure to configure environment protection rules in your repository settings if needed.
