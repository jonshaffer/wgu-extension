# Contributing to WGU Extension Data

Thank you for your interest in improving the WGU Extension! This guide will help you contribute to our data collection and processing efforts.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/[your-fork]/wgu-extension.git
cd wgu-extension/data

# Install dependencies
pnpm install

# Set up local development data
pnpm rundev-setup

# Run tests
npm test
```

## 📁 Project Structure

```
data/
├── sources/          # Raw data (PDFs, community lists)
├── pipelines/        # Data processing code
├── collection/       # Browser extension features
├── dev-cache/        # Local development data (git-ignored)
└── experiments/      # Try new ideas here!
```

## 🎯 Ways to Contribute

### 1. 📚 Improve Catalog Parsing (Intermediate/Advanced)

Help us extract course data from WGU's PDF catalogs!

**Location:** `pipelines/catalog/`

**Skills:** TypeScript, PDF parsing, Regular expressions

**Tasks:**
- Improve parsing accuracy for course descriptions
- Handle edge cases in degree plan tables
- Add support for new catalog formats

**Getting Started:**
```bash
# Test the parser
pnpm runtest:parser -- sources/catalogs/catalog-2025-08.pdf

# See parsing report
cat analytics/reports/catalog-2025-08-*.json
```

**Example:** Fix truncated course descriptions
```typescript
// In pipelines/catalog/parsers/unified.ts
// Current pattern stops at newlines:
const pattern = /([A-Z]\d{3,4}[A-Z]?)\s*-\s*([^-]+?)\s*-\s*([^\n\r]+)/g;

// Better pattern for multi-line descriptions:
const pattern = /([A-Z]\d{3,4}[A-Z]?)\s*-\s*([^-]+?)\s*-\s*([\s\S]+?)(?=\n[A-Z]\d{3,4}[A-Z]?\s*-|$)/g;
```

### 2. 💬 Add Community Data (Beginner)

Help students find Discord servers and subreddits!

**Location:** `sources/discord/`, `sources/reddit/`

**Skills:** JSON editing, Basic research

**Tasks:**
- Add new Discord servers for courses
- Update subreddit information
- Verify community links still work

**Getting Started:**
```bash
# Check current Discord data
cat sources/discord/servers.json

# Validate your changes
pnpm runvalidate:discord
```

**Example:** Add a new Discord server
```json
// In sources/discord/servers.json
{
  "servers": [
    {
      "name": "WGU Computer Science",
      "invite": "wgu-compsci",
      "description": "Unofficial CS student community",
      "courses": ["C182", "C867", "C958"],
      "verified": true
    }
  ]
}
```

### 3. 🔍 Browser Extension Features (Intermediate)

Help students discover resources automatically!

**Location:** `collection/`

**Skills:** TypeScript, DOM manipulation, Browser APIs

**Tasks:**
- Auto-detect course pages and suggest communities
- Extract WGU Connect group info
- Create UI for resource suggestions

**Getting Started:**
```bash
# Test collection logic
pnpm runtest:collection

# Build for extension
pnpm runbuild:collection
```

**Example:** Detect course code on page
```typescript
// In collection/discord/suggest.ts
export function detectCourseCode(): string | null {
  // Find course code in page title or breadcrumbs
  const title = document.querySelector('h1')?.textContent;
  const match = title?.match(/([A-Z]\d{3,4}[A-Z]?)/);
  return match ? match[1] : null;
}
```

### 4. ✅ Data Validation (Beginner/Intermediate)

Ensure our data stays accurate!

**Location:** `pipelines/*/validate.ts`

**Skills:** TypeScript, API integration

**Tasks:**
- Check Discord invite links
- Verify subreddit exists via Reddit API
- Validate course codes against catalog

**Getting Started:**
```bash
# Run all validators
pnpm runvalidate:all

# Run specific validator
pnpm runvalidate:discord
```

### 5. 📊 Analytics & Monitoring (Advanced)

Track data quality over time!

**Location:** `pipelines/catalog/analytics/`, `monitors/`

**Skills:** TypeScript, Data analysis, Visualization

**Tasks:**
- Create parser drift detection
- Build health dashboards
- Set up automated alerts

## 🧪 Testing Your Changes

### 1. Run Tests
```bash
# All tests
npm test

# Specific area
pnpm runtest:catalog
pnpm runtest:communities
pnpm runtest:collection
```

### 2. Validate Data
```bash
# Check your changes don't break anything
pnpm runvalidate:all
```

### 3. Preview Output
```bash
# See how your changes affect the final data
pnpm runpreview
```

## 📝 Submitting Changes

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b add-discord-servers
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test thoroughly**
   ```bash
   pnpm test
   pnpm runvalidate:all
   ```

5. **Commit with clear message**
   ```bash
   git commit -m "feat: add 5 new Discord servers for IT courses"
   ```

6. **Push and create PR**
   ```bash
   git push origin add-discord-servers
   ```

## 🚀 What Happens Next (CI/CD)

When you submit a PR:

1. **Automatic Validation**: GitHub Actions run your changes
   - Parsers execute on any new PDFs
   - Data validation checks run
   - Results appear as PR comments

2. **Review Process**: 
   - Check the bot's comment for parsing results
   - Fix any validation errors
   - Maintainers review your changes

3. **After Merge**:
   - Your changes automatically upload to Firestore
   - Live in production within minutes!
   - No manual deployment needed

**Note**: You don't need Firestore access - just submit good parsing logic and the CI/CD handles the rest!

## 🏗️ Working on Experiments

If you're trying something new:

1. Create experiment directory:
   ```bash
   mkdir experiments/my-new-parser
   ```

2. Document what you're testing:
   ```markdown
   # experiments/my-new-parser/README.md
   Testing: New approach for parsing course prerequisites
   Goal: Extract prereq relationships from catalog
   ```

3. When it works, propose moving to `pipelines/`

## 💡 Tips for Success

### For Beginners
- Start with adding community data
- Run validators to understand data structure
- Ask questions in GitHub issues!

### For Parser Work
- Use `experiments/` to try new approaches
- Keep the old parser working while developing
- Add analytics to track improvements

### For Collection Features
- Test on real WGU pages
- Consider offline functionality
- Keep UI minimal and helpful

## 🤝 Code Style

- **TypeScript:** Strict mode, explicit types
- **Formatting:** Prettier (runs automatically)
- **Commits:** Conventional commits (feat:, fix:, docs:)
- **Tests:** Write tests for new features

## ❓ Getting Help

- **Questions:** Open a GitHub issue
- **Discussions:** Use GitHub Discussions
- **Bugs:** Include reproduction steps

## 🎉 Recognition

Contributors are recognized in:
- GitHub contributors page
- Extension credits
- Release notes

Thank you for helping WGU students succeed! 🚀