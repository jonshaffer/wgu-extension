# Release Management

This project uses [Release Please](https://github.com/googleapis/release-please) for automated release management based on [Conventional Commits](https://www.conventionalcommits.org/).

## How It Works

1. **Conventional Commits**: Use conventional commit messages for all changes
2. **Automated PRs**: Release Please automatically creates release PRs when new commits are pushed to `main`
3. **Version Bumping**: Semantic versions are automatically calculated based on commit types
4. **Store Submission**: When a release is created, the extension is automatically built and submitted to Chrome Web Store and Firefox Add-ons. Microsoft Edge Add-ons submission is supported and runs when secrets are configured.

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
   - Update `package.json` version
   - Create a release PR
5. **Review & Merge**: Review the generated release PR and merge it
6. **Automatic Release**: When the release PR is merged:
   - A GitHub release is created
   - Extension artifacts are built and attached
   - The extension is automatically submitted to Chrome and Firefox stores
   - If Edge Add-ons credentials are configured, the Edge package is uploaded and published

## Manual Operations

### Build Release Locally

```bash
npm run release
```

### Check What Would Be Released

The release PR will show you exactly what changes will be included and what the new version will be.

## Configuration Files

- `release-please-config.json` - Release Please configuration
- `.release-please-manifest.json` - Current version tracking
- `CHANGELOG.md` - Automatically generated changelog
- `.github/workflows/release-please.yml` - Release automation workflow

## Store Secrets

The following GitHub secrets are required for automatic store submission:

### Chrome Web Store
- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

### Firefox Add-ons
- `FIREFOX_EXTENSION_ID`
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

### Microsoft Edge Add-ons (optional)
- `EDGE_PRODUCT_ID`
- `EDGE_CLIENT_ID`
- `EDGE_CLIENT_SECRET`
- `EDGE_TENANT_ID`

Notes:
- Edge submission uses the official edge-addons-cli. The access token URL is constructed from your Azure AD tenant ID.
- All store submissions run under the `production` environment in GitHub for extra protection.

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
