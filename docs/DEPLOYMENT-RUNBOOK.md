# Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying all components of the WGU Extension monorepo. Use this guide for both routine releases and emergency deployments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Standard Release Deployment](#standard-release-deployment)
- [Browser Extension Deployment](#browser-extension-deployment)
- [NPM Package Publishing](#npm-package-publishing)
- [Firebase Functions Deployment](#firebase-functions-deployment)
- [Firebase Hosting Deployment](#firebase-hosting-deployment)
- [Emergency Hotfix Deployment](#emergency-hotfix-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Verification Checklist](#verification-checklist)

---

## Prerequisites

### Required Access

- [ ] GitHub repository write access
- [ ] GitHub Environment approval permissions
- [ ] Firebase project owner/editor role
- [ ] NPM organization publish access
- [ ] Chrome Web Store developer account
- [ ] Firefox Add-ons developer account
- [ ] Microsoft Edge Partner Center access

### Required Tools

```bash
# Verify installed tools
node --version          # Should be v22+
pnpm --version         # Should be v9+
firebase --version     # Firebase CLI
gh --version          # GitHub CLI
```

### Required Secrets

Verify all required secrets are configured in GitHub repository settings:

```bash
# NPM Publishing
NPM_TOKEN

# Chrome Web Store
CHROME_EXTENSION_ID
CHROME_CLIENT_ID
CHROME_CLIENT_SECRET
CHROME_REFRESH_TOKEN

# Firefox Add-ons
FIREFOX_EXTENSION_ID
FIREFOX_JWT_ISSUER
FIREFOX_JWT_SECRET

# Microsoft Edge Add-ons
EDGE_PRODUCT_ID
EDGE_CLIENT_ID
EDGE_CLIENT_SECRET
EDGE_TENANT_ID
```

### Environment Setup

```bash
# Clone repository
git clone https://github.com/jonshaffer/wgu-extension.git
cd wgu-extension

# Install dependencies
pnpm install

# Verify build works
pnpm run typecheck
pnpm run lint
pnpm run build
```

---

## Standard Release Deployment

**Use Case:** Regular feature releases following the normal workflow

**Estimated Time:** 30-60 minutes (plus store review time)

### Step 1: Verify Pre-Release Checklist

```bash
# 1. Ensure all tests pass
pnpm run typecheck
pnpm run lint
pnpm --filter=functions run test

# 2. Check current version
cat .release-please-manifest.json | jq

# 3. Verify CHANGELOG is up to date (Release Please handles this)
cat CHANGELOG.md | head -n 50

# 4. Check for pending PRs
gh pr list
```

### Step 2: Trigger Release

**Option A: Via Release Please (Recommended)**

Release Please automatically creates release PRs when conventional commits are merged to `main`.

```bash
# 1. Check if release PR exists
gh pr list --label "autorelease: pending"

# 2. Review the release PR
gh pr view <PR_NUMBER>

# 3. Review changes
gh pr diff <PR_NUMBER>

# 4. Merge the release PR
gh pr merge <PR_NUMBER> --squash
```

**Option B: Manual Tag (Not Recommended)**

Only use for emergency releases or if Release Please is broken.

```bash
# 1. Bump version in all package.json files
# ... manually edit files ...

# 2. Update CHANGELOG.md
# ... manually edit ...

# 3. Commit and tag
git add .
git commit -m "chore(release): release v1.2.3"
git tag v1.2.3
git push origin main --tags
```

### Step 3: Monitor Automatic Workflows

After merging the release PR, GitHub Actions automatically triggers:

```bash
# Watch workflow progress
gh run watch

# Or view in browser
open "https://github.com/jonshaffer/wgu-extension/actions"
```

**Expected Workflows:**
1. `build-release` - Builds extension artifacts
2. `publish-data-final` - Publishes @wgu-extension/data to NPM
3. `publish-graphql-client` - Publishes @wgu-extension/graphql-client to NPM
4. `store-submission` - Waits for approval to submit to stores
5. `deploy-functions` - Waits for approval to deploy Firebase Functions
6. `deploy-hosting` - Waits for approval to deploy Firebase Hosting

### Step 4: Approve Deployment Gates

**Store Submission Approval:**

```bash
# 1. Navigate to pending deployment
open "https://github.com/jonshaffer/wgu-extension/actions"

# 2. Click on the "store-submission" job
# 3. Click "Review pending deployments"
# 4. Check "store-submission" environment
# 5. Click "Approve and deploy"
```

**Manual Approval (Alternative):**
```bash
# Find the pending run
gh run list --workflow=release-please.yml

# Approve specific run
gh run approve <RUN_ID>
```

**Firebase Deployment Approval:**

Repeat the same process for `production-firebase` environment.

### Step 5: Verify Store Submissions

**Chrome Web Store:**
```bash
# Check submission status
open "https://chrome.google.com/webstore/devconsole"

# Expected timeline: 1-3 days
```

**Firefox Add-ons:**
```bash
# Check submission status
open "https://addons.mozilla.org/developers/"

# Expected timeline: 1-7 days
```

**Microsoft Edge:**
```bash
# Check submission status
open "https://partner.microsoft.com/dashboard/microsoftedge/overview"

# Expected timeline: 3-7 days
```

### Step 6: Verify NPM Packages

```bash
# Verify @wgu-extension/data
npm view @wgu-extension/data version
npm view @wgu-extension/data

# Verify @wgu-extension/graphql-client
npm view @wgu-extension/graphql-client version
npm view @wgu-extension/graphql-client

# Test installation
npm install @wgu-extension/data@latest
npm install @wgu-extension/graphql-client@latest
```

### Step 7: Verify Firebase Deployments

**Functions:**
```bash
# Check deployed functions
firebase functions:list

# Test public API
curl https://us-central1-<PROJECT_ID>.cloudfunctions.net/publicApi \
  -H "Content-Type: application/json" \
  -d '{"query": "query { ping }"}'

# Expected: {"data":{"ping":"pong"}}

# Check logs for errors
firebase functions:log --only publicApi --lines 50
```

**Hosting:**
```bash
# Check hosting status
firebase hosting:releases

# Verify site is live
curl -I https://<PROJECT_ID>.web.app/

# Expected: 200 OK

# Test in browser
open "https://<PROJECT_ID>.web.app/"
```

### Step 8: Post-Deployment Verification

```bash
# Run smoke tests
./scripts/smoke-tests.sh

# Check for errors in logs
firebase functions:log --only publicApi,adminApi --lines 100

# Monitor error rates in Firebase Console
open "https://console.firebase.google.com/project/<PROJECT_ID>/functions/list"
```

### Step 9: Communication

```bash
# 1. Update release notes in GitHub
gh release view v1.2.3 --web

# 2. Announce release (if public)
# - Post to Discord server
# - Update website
# - Social media (if applicable)

# 3. Close related issues
gh issue list --label "pending-release"
```

---

## Browser Extension Deployment

**Use Case:** Deploy extension to browser stores (standalone, outside of standard release)

### Manual Deployment to Chrome Web Store

```bash
# 1. Navigate to extension workspace
cd extension

# 2. Build production version
pnpm run build:prod

# 3. Create Chrome ZIP
pnpm run zip

# 4. Submit to Chrome Web Store
npx wxt submit --chrome-zip .output/*-chrome.zip

# 5. Verify in Chrome Web Store Developer Dashboard
open "https://chrome.google.com/webstore/devconsole"
```

**Environment Variables Required:**
```bash
CHROME_EXTENSION_ID=<your_extension_id>
CHROME_CLIENT_ID=<your_client_id>
CHROME_CLIENT_SECRET=<your_client_secret>
CHROME_REFRESH_TOKEN=<your_refresh_token>
```

### Manual Deployment to Firefox Add-ons

```bash
# 1. Navigate to extension workspace
cd extension

# 2. Build production version
pnpm run build:prod

# 3. Create Firefox ZIP
pnpm run zip:firefox

# 4. Submit to Firefox Add-ons with sources
npx wxt submit \
  --firefox-zip .output/*-firefox.zip \
  --firefox-sources-zip .output/*-sources.zip

# 5. Verify in AMO Developer Hub
open "https://addons.mozilla.org/developers/"
```

**Environment Variables Required:**
```bash
FIREFOX_EXTENSION_ID=<your_extension_uuid>
FIREFOX_JWT_ISSUER=<your_jwt_issuer>
FIREFOX_JWT_SECRET=<your_jwt_secret>
```

### Manual Deployment to Microsoft Edge Add-ons

```bash
# 1. Navigate to extension workspace
cd extension

# 2. Build production version
pnpm run build:prod

# 3. Create Edge ZIP
pnpm run zip:edge

# 4. Submit to Edge Add-ons
npm exec --yes edge-addons-cli@1.12.0 upload \
  --product-id "${EDGE_PRODUCT_ID}" \
  --zip ".output/*-edge.zip" \
  --client-id "${EDGE_CLIENT_ID}" \
  --client-secret "${EDGE_CLIENT_SECRET}" \
  --access-token-url "https://login.microsoftonline.com/${EDGE_TENANT_ID}/oauth2/v2.0/token" \
  --wait-for-publish

# 5. Verify in Partner Center
open "https://partner.microsoft.com/dashboard/microsoftedge/overview"
```

**Environment Variables Required:**
```bash
EDGE_PRODUCT_ID=<your_product_id>
EDGE_CLIENT_ID=<your_client_id>
EDGE_CLIENT_SECRET=<your_client_secret>
EDGE_TENANT_ID=<your_tenant_id>
```

### Verification After Store Submission

```bash
# 1. Check submission status in store dashboards
# 2. Wait for email confirmation
# 3. Review any feedback from store reviewers
# 4. Monitor for rejection emails
# 5. If approved, verify extension is live in store
```

---

## NPM Package Publishing

**Use Case:** Publish or re-publish NPM packages manually

### Publishing @wgu-extension/data

```bash
# 1. Navigate to data workspace
cd data

# 2. Verify version in package.json
cat package.json | jq '.version'

# 3. Build types
pnpm run types:build

# 4. Test build
pnpm pack

# 5. Publish to NPM
pnpm publish --access public --no-git-checks

# 6. Verify published
npm view @wgu-extension/data version
```

**Troubleshooting:**
```bash
# If version already exists
npm unpublish @wgu-extension/data@1.2.3 --force
# Note: Only within 72 hours of publish

# If authentication fails
npm login
npm whoami
```

### Publishing @wgu-extension/graphql-client

```bash
# 1. Navigate to graphql-client workspace
cd graphql-client

# 2. Ensure dependencies are built
cd ../functions && pnpm run build
cd ../graphql-client

# 3. Verify version in package.json
cat package.json | jq '.version'

# 4. Build library
pnpm run build

# 5. Test build
pnpm pack

# 6. Publish to NPM
pnpm publish --access public --no-git-checks

# 7. Verify published
npm view @wgu-extension/graphql-client version
```

---

## Firebase Functions Deployment

**Use Case:** Deploy Firebase Functions manually

### Prerequisites

```bash
# 1. Authenticate with Firebase
firebase login

# 2. Select project
firebase use --add
# Select project from list

# 3. Verify project
firebase projects:list
```

### Deployment Steps

```bash
# 1. Navigate to functions workspace
cd functions

# 2. Install dependencies
pnpm install

# 3. Run type check
pnpm run typecheck

# 4. Run tests
pnpm run test

# 5. Build TypeScript
pnpm run build

# 6. Deploy all functions
pnpm run deploy

# Or deploy specific function
firebase deploy --only functions:publicApi
firebase deploy --only functions:adminApi
```

### Deployment with Firestore Rules

```bash
# Deploy functions and Firestore rules together
firebase deploy --only functions,firestore:rules

# Deploy only rules
firebase deploy --only firestore:rules
```

### Verification

```bash
# 1. List deployed functions
firebase functions:list

# 2. Test public API
curl https://us-central1-<PROJECT_ID>.cloudfunctions.net/publicApi \
  -H "Content-Type: application/json" \
  -d '{"query": "query { ping }"}'

# 3. Check logs
firebase functions:log

# 4. Monitor function metrics
open "https://console.firebase.google.com/project/<PROJECT_ID>/functions/list"
```

### Common Issues

**Build Errors:**
```bash
# Clear build cache
rm -rf functions/lib
pnpm run build

# If still failing, clean install
rm -rf functions/node_modules
pnpm install
```

**Deployment Timeout:**
```bash
# Increase timeout
firebase deploy --only functions --timeout 15m
```

**Permission Denied:**
```bash
# Re-authenticate
firebase login --reauth

# Check project permissions
firebase projects:list
```

---

## Firebase Hosting Deployment

**Use Case:** Deploy website to Firebase Hosting

### Prerequisites

```bash
# Same as Firebase Functions
firebase login
firebase use --add
```

### Deployment Steps

```bash
# 1. Navigate to site workspace
cd site

# 2. Install dependencies
pnpm install

# 3. Run type check
pnpm run typecheck

# 4. Build production site
pnpm run build

# 5. Preview locally (optional)
firebase serve --only hosting

# 6. Deploy to Firebase Hosting
firebase deploy --only hosting

# Or from root
cd ..
pnpm --filter=site run build
firebase deploy --only hosting
```

### Verification

```bash
# 1. Check hosting releases
firebase hosting:releases

# 2. Verify site is live
curl -I https://<PROJECT_ID>.web.app/

# 3. Test in browser
open "https://<PROJECT_ID>.web.app/"

# 4. Check analytics
open "https://console.firebase.google.com/project/<PROJECT_ID>/hosting/sites"
```

### Deploy to Specific Channel

```bash
# Deploy to preview channel
firebase hosting:channel:deploy preview

# Get preview URL
firebase hosting:channel:open preview

# Deploy to production from channel
firebase hosting:clone <CHANNEL_ID>:live
```

---

## Emergency Hotfix Deployment

**Use Case:** Critical bug requires immediate fix bypassing normal release process

**Estimated Time:** 15-30 minutes

### Prerequisites

- [ ] Bug confirmed as critical (P0/P1 severity)
- [ ] Hotfix tested locally
- [ ] Stakeholders notified
- [ ] Incident tracking started

### Step 1: Create Hotfix Branch

```bash
# 1. Ensure you're on latest main
git checkout main
git pull origin main

# 2. Create hotfix branch
git checkout -b hotfix/critical-bug-description

# 3. Make minimal fix
# ... edit files ...

# 4. Test locally
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm --filter=extension run dev  # If extension bug
pnpm --filter=functions run serve  # If function bug
```

### Step 2: Commit and Push

```bash
# 1. Commit with conventional commit
git add .
git commit -m "fix!: critical bug in X causing Y"

# 2. Push branch
git push origin hotfix/critical-bug-description

# 3. Create PR
gh pr create \
  --title "HOTFIX: Critical bug fix" \
  --body "Emergency fix for critical bug. Details: ..." \
  --label "priority: critical,type: hotfix"
```

### Step 3: Expedited Review

```bash
# 1. Request immediate review
gh pr review --approve  # If you have permission

# 2. Merge immediately
gh pr merge --squash --admin

# Note: Use --admin flag to bypass branch protection if necessary
```

### Step 4: Create Emergency Release

```bash
# 1. Release Please will create release PR automatically
# Wait a few minutes for workflow to run

# 2. Find and merge release PR
gh pr list --label "autorelease: pending"
gh pr merge <PR_NUMBER> --squash

# Or manually create release if Release Please is broken
git tag v1.2.4
git push origin v1.2.4
```

### Step 5: Expedite Deployments

**Browser Extension:**
```bash
# 1. Approve store submission immediately
gh run list --workflow=release-please.yml
gh run approve <RUN_ID>

# 2. Request expedited review from stores
# - Chrome: Use developer support form
# - Firefox: Reply to submission email with urgent tag
# - Edge: Contact Partner Center support

# 3. Consider temporary rollback while waiting
# See "Rollback Procedures" below
```

**Firebase Functions:**
```bash
# 1. Approve deployment immediately
gh run approve <RUN_ID>

# Or deploy manually
cd functions
pnpm run deploy --force

# 2. Verify deployment
firebase functions:log --only publicApi,adminApi
```

**Firebase Hosting:**
```bash
# 1. Approve deployment immediately
gh run approve <RUN_ID>

# Or deploy manually
cd site
pnpm run build
firebase deploy --only hosting --force
```

**NPM Packages:**
```bash
# Publish immediately (should be automatic)
# If not, manually publish
cd data && pnpm publish --access public --no-git-checks
cd graphql-client && pnpm publish --access public --no-git-checks
```

### Step 6: Verify Fix

```bash
# Run full verification checklist
# See "Verification Checklist" section below

# Monitor for additional issues
firebase functions:log --follow
```

### Step 7: Post-Mortem

```bash
# 1. Document incident
# Create post-mortem document with:
# - Timeline of events
# - Root cause analysis
# - Impact assessment
# - Action items to prevent recurrence

# 2. Update tests to catch regression
# ... add new tests ...

# 3. Review and update runbook if needed
```

---

## Rollback Procedures

### Browser Extension Rollback

**Note:** Cannot rollback published extensions. Must submit new version.

```bash
# 1. Find previous working version
git tag -l | grep extension

# 2. Checkout previous version
git checkout <PREVIOUS_TAG>

# 3. Build and submit
cd extension
pnpm run build:prod
pnpm run zip
pnpm run zip:firefox
pnpm run zip:edge

# 4. Submit to stores (manual approval recommended)
npx wxt submit --chrome-zip .output/*-chrome.zip
```

**Temporary Workaround:**
```bash
# 1. Update store listing to warn users
# 2. Provide manual downgrade instructions
# 3. Communicate via social media/discord
```

### Firebase Functions Rollback

```bash
# Option 1: Redeploy previous version
git checkout <PREVIOUS_TAG>
cd functions
pnpm install
pnpm run build
pnpm run deploy

# Option 2: Use Firebase Console
# 1. Open Firebase Console
# 2. Go to Functions
# 3. Select function
# 4. Click "Rollback" button

# Verify rollback
firebase functions:log
curl https://us-central1-<PROJECT_ID>.cloudfunctions.net/publicApi \
  -H "Content-Type: application/json" \
  -d '{"query": "query { ping }"}'
```

### Firebase Hosting Rollback

```bash
# List recent releases
firebase hosting:releases

# Rollback to previous release
firebase hosting:rollback

# Or specific release
firebase hosting:rollback <RELEASE_ID>

# Verify rollback
curl -I https://<PROJECT_ID>.web.app/
open "https://<PROJECT_ID>.web.app/"
```

### NPM Package Rollback

```bash
# Option 1: Deprecate bad version
npm deprecate @wgu-extension/data@1.2.3 "Critical bug, use 1.2.2 instead"
npm deprecate @wgu-extension/graphql-client@1.2.3 "Critical bug, use 1.2.2 instead"

# Option 2: Unpublish (within 72 hours only)
npm unpublish @wgu-extension/data@1.2.3 --force
npm unpublish @wgu-extension/graphql-client@1.2.3 --force

# Option 3: Publish new patch version
# ... fix bug ...
cd data
pnpm version patch
pnpm publish --access public
```

### Firestore Data Rollback

**Note:** Only possible if backups exist

```bash
# List available backups
gcloud firestore operations list

# Import from backup
gcloud firestore import gs://wgu-extension-backups/YYYY-MM-DD

# Or use Firebase Console
open "https://console.firebase.google.com/project/<PROJECT_ID>/firestore/data"
```

---

## Verification Checklist

### Post-Deployment Verification

After any deployment, verify the following:

#### Browser Extension

- [ ] Extension builds without errors
- [ ] Extension loads in browser
- [ ] Content scripts inject on target pages
- [ ] GraphQL queries work
- [ ] Storage persists correctly
- [ ] UI renders properly
- [ ] No console errors
- [ ] Permissions are minimal
- [ ] Store listing is accurate

**Manual Testing:**
```bash
# 1. Load unpacked extension
cd extension/.output/chrome-mv3

# 2. Test on WGU pages
open "https://my.wgu.edu"

# 3. Check developer console for errors
# 4. Test search functionality
# 5. Verify community data loads
```

#### Firebase Functions

- [ ] All functions deploy successfully
- [ ] Health check (ping) responds
- [ ] Sample queries return data
- [ ] Error handling works
- [ ] Rate limiting enforced
- [ ] CORS headers correct
- [ ] Authentication works (admin endpoints)
- [ ] Logs show no errors
- [ ] Performance is acceptable (<500ms P95)

**Smoke Tests:**
```bash
# Health check
curl https://us-central1-<PROJECT_ID>.cloudfunctions.net/publicApi \
  -H "Content-Type: application/json" \
  -d '{"query": "query { ping }"}'

# Sample query
curl https://us-central1-<PROJECT_ID>.cloudfunctions.net/publicApi \
  -H "Content-Type: application/json" \
  -d '{"query": "query { courses(limit: 1) { items { courseCode name } } }"}'

# Error handling
curl https://us-central1-<PROJECT_ID>.cloudfunctions.net/publicApi \
  -H "Content-Type: application/json" \
  -d '{"query": "invalid query"}'

# Check logs
firebase functions:log --only publicApi --lines 20
```

#### Firebase Hosting

- [ ] Site builds without errors
- [ ] Homepage loads
- [ ] All routes work
- [ ] GraphQL client connects
- [ ] Search functionality works
- [ ] Mobile responsive
- [ ] No broken links
- [ ] Assets load (images, fonts)
- [ ] Performance is good (Lighthouse >90)

**Smoke Tests:**
```bash
# Homepage
curl -I https://<PROJECT_ID>.web.app/

# Test routes
curl -I https://<PROJECT_ID>.web.app/search
curl -I https://<PROJECT_ID>.web.app/courses

# Lighthouse audit
npx lighthouse https://<PROJECT_ID>.web.app/ --view
```

#### NPM Packages

- [ ] Package published to npm
- [ ] Correct version number
- [ ] All files included
- [ ] Package installs successfully
- [ ] Types export correctly
- [ ] No dependencies missing
- [ ] README is accurate
- [ ] License is correct

**Verification:**
```bash
# Check published
npm view @wgu-extension/data
npm view @wgu-extension/graphql-client

# Test install
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install @wgu-extension/data@latest
npm install @wgu-extension/graphql-client@latest

# Test import
node -e "const data = require('@wgu-extension/data'); console.log(data);"

# Check types
npx tsc --noEmit test.ts
```

### Monitoring After Deployment

**First 30 Minutes:**
- [ ] Watch Firebase Functions logs for errors
- [ ] Monitor error rates in Firebase Console
- [ ] Check GitHub Actions for failures
- [ ] Monitor store submission status

**First 24 Hours:**
- [ ] Review Firebase Analytics
- [ ] Check for new GitHub issues
- [ ] Monitor store review status
- [ ] Review user feedback (if any)

**First Week:**
- [ ] Verify store approval and publication
- [ ] Monitor crash reports
- [ ] Review performance metrics
- [ ] Check for regression issues

---

## Additional Resources

- [Release Strategy Documentation](./RELEASE-STRATEGY.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [CI/CD Troubleshooting](./CI-TROUBLESHOOTING.md)
- [Conventional Commits Guide](./RELEASES.md)

---

*Last Updated: 2025-01-18*
*For questions or issues, contact the maintainers*
