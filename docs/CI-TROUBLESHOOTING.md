# CI/CD Troubleshooting Guide

This guide helps resolve common CI/CD issues in the WGU Extension monorepo.

## Platform-Specific Binary Issues

### Problem: Missing Platform Binaries
**Symptoms:**
- `Cannot find module '@tailwindcss/oxide-linux-x64-gnu'`
- `Cannot find module '../lightningcss.linux-x64-gnu.node'`
- `The package "@esbuild/linux-x64" could not be found`

**Root Cause:**
Native dependencies require platform-specific binaries that may not install correctly in CI environments.

**Solution:**
Our CI workflows include enhanced dependency installation:

```bash
# Enhanced CI dependency installation
npm ci --include=optional --foreground-scripts
npm rebuild lightningcss --build-from-source --verbose
npm install @tailwindcss/oxide-linux-x64-gnu --no-save --legacy-peer-deps
npm install lightningcss-linux-x64-gnu --no-save --legacy-peer-deps
npm install @esbuild/linux-x64 --no-save --legacy-peer-deps
```

## Validation Script

### Build Dependency Validation
Run the validation script to check platform dependencies:

```bash
node scripts/validate-build-dependencies.js
```

**Script Features:**
- Checks both workspace and root `node_modules`
- Validates platform-specific binaries
- Provides specific installation commands
- Fails CI builds only for critical issues

## Common CI Failures

### 1. graphql-client-tests Failure
**Symptoms:** Platform binary validation fails in CI
**Solution:** Enhanced dependency installation in `firebase-functions-ci-enhanced.yml`

### 2. test Job Failure (WXT Extension)
**Symptoms:** Build fails during extension compilation
**Solution:** Enhanced dependency installation in `wxt-extension-ci.yml`

### 3. test-summary Failure
**Symptoms:** Cascading failure from upstream jobs
**Solution:** Fix underlying dependency issues in other jobs

## Environment Variables

Set these environment variables for better CI behavior:

```bash
npm_config_target_arch=x64
npm_config_target_platform=linux
npm_config_optional=true
```

## Workspace-Specific Issues

### Site Workspace Dependencies
The `site` workspace uses Tailwind CSS 4.x which requires:
- `@tailwindcss/oxide-linux-x64-gnu`
- `lightningcss-linux-x64-gnu`

### Extension Workspace Dependencies
The `extension` workspace may require:
- `@esbuild/linux-x64`
- Platform-specific build tools

## Quick Fixes

### Local Development
```bash
# Fix missing platform binaries locally
npm ci --include=optional
npm rebuild lightningcss --build-from-source
npm install @tailwindcss/oxide-linux-x64-gnu --no-save
```

### CI Environment
The enhanced workflows automatically handle these issues, but if problems persist:

1. Check that the workflow includes enhanced dependency installation
2. Verify environment variables are set correctly
3. Ensure `--legacy-peer-deps` flag is used for compatibility

## Prevention

### New Dependencies
When adding new native dependencies:

1. Test in CI environment
2. Add platform-specific installation if needed
3. Update validation script if necessary
4. Document any special requirements

### Workflow Updates
Keep these installation patterns consistent across all workflows:
- `wxt-extension-ci.yml`
- `firebase-functions-ci-enhanced.yml`
- `site-ci.yml`

## Monitoring

### CI Success Rates
Monitor CI failure patterns to identify:
- Recurring platform binary issues
- New dependencies causing problems
- Environment-specific failures

### Build Performance
Track installation time for:
- Dependency caching effectiveness
- Platform binary download speed
- Rebuild command performance

## Community Solutions

These fixes are based on proven community solutions from:
- [esbuild GitHub Issues](https://github.com/evanw/esbuild/issues/1646)
- [Tailwind CSS Discussions](https://github.com/tailwindlabs/tailwindcss/discussions)
- [lightningcss Issues](https://github.com/parcel-bundler/lightningcss/issues)

## Support

If CI issues persist:
1. Check recent GitHub Actions logs
2. Compare with successful runs
3. Verify dependency versions
4. Test fixes in a fork first