#!/usr/bin/env node

/**
 * Generate store release notes from CHANGELOG.md
 *
 * This script extracts the changelog section for a specific version
 * and formats it for different browser extension stores.
 *
 * Usage:
 *   node scripts/generate-store-release-notes.js <version> [--store=chrome|firefox|edge|all]
 *
 * Examples:
 *   node scripts/generate-store-release-notes.js 1.2.3
 *   node scripts/generate-store-release-notes.js 1.2.3 --store=chrome
 *   node scripts/generate-store-release-notes.js 1.2.3 --store=all
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const OUTPUT_DIR = path.join(__dirname, '..', '.output', 'release-notes');

// Store-specific character limits and formatting rules
const STORE_LIMITS = {
  chrome: {
    maxLength: 500,
    allowMarkdown: false,
    allowEmoji: true,
    name: 'Chrome Web Store'
  },
  firefox: {
    maxLength: 5000,
    allowMarkdown: true,
    allowEmoji: true,
    name: 'Firefox Add-ons'
  },
  edge: {
    maxLength: 5000,
    allowMarkdown: true,
    allowEmoji: true,
    name: 'Microsoft Edge Add-ons'
  }
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Error: Version number required');
    console.error('Usage: node scripts/generate-store-release-notes.js <version> [--store=chrome|firefox|edge|all]');
    process.exit(1);
  }

  const version = args[0].replace(/^v/, ''); // Remove 'v' prefix if present
  const storeArg = args.find(arg => arg.startsWith('--store='));
  const store = storeArg ? storeArg.split('=')[1] : 'all';

  if (store !== 'all' && !STORE_LIMITS[store]) {
    console.error(`Error: Invalid store "${store}". Must be one of: chrome, firefox, edge, all`);
    process.exit(1);
  }

  return { version, store };
}

/**
 * Extract changelog section for a specific version
 */
function extractChangelogSection(version) {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    throw new Error(`CHANGELOG.md not found at ${CHANGELOG_PATH}`);
  }

  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

  // Match version header (e.g., "## [1.2.3]" or "## 1.2.3")
  const versionPattern = new RegExp(`##\\s+\\[?${version.replace(/\./g, '\\.')}\\]?[^\\n]*\\n([\\s\\S]*?)(?=##\\s+\\[?\\d|$)`, 'i');
  const match = changelog.match(versionPattern);

  if (!match) {
    throw new Error(`Version ${version} not found in CHANGELOG.md`);
  }

  return match[1].trim();
}

/**
 * Convert changelog markdown to plain text
 */
function markdownToPlainText(markdown) {
  return markdown
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[^`]+```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract features, fixes, and breaking changes
 */
function categorizeChanges(changelogText) {
  const lines = changelogText.split('\n');
  const categories = {
    features: [],
    fixes: [],
    breaking: [],
    other: []
  };

  let currentCategory = 'other';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Detect category headers
    if (/^###?\s+Features?/i.test(trimmed)) {
      currentCategory = 'features';
      continue;
    } else if (/^###?\s+(Bug\s*)?Fixes?/i.test(trimmed)) {
      currentCategory = 'fixes';
      continue;
    } else if (/^###?\s+Breaking\s+Changes?/i.test(trimmed)) {
      currentCategory = 'breaking';
      continue;
    } else if (/^###?\s+/.test(trimmed)) {
      currentCategory = 'other';
      continue;
    }

    // Add to current category
    if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
      const text = trimmed.replace(/^[*-]\s+/, '').trim();
      if (text) {
        categories[currentCategory].push(text);
      }
    }
  }

  return categories;
}

/**
 * Format changelog for specific store
 */
function formatForStore(changelogText, store, version) {
  const config = STORE_LIMITS[store];
  const categories = categorizeChanges(changelogText);

  let formatted = '';

  // Add "What's New" header
  formatted += `What's New in ${version}\n\n`;

  // Add breaking changes first (if any)
  if (categories.breaking.length > 0) {
    formatted += '⚠️ BREAKING CHANGES:\n';
    categories.breaking.forEach(change => {
      const text = config.allowMarkdown ? change : markdownToPlainText(change);
      formatted += `• ${text}\n`;
    });
    formatted += '\n';
  }

  // Add features
  if (categories.features.length > 0) {
    formatted += config.allowMarkdown ? '**New Features:**\n' : 'New Features:\n';
    categories.features.forEach(change => {
      const text = config.allowMarkdown ? change : markdownToPlainText(change);
      formatted += `• ${text}\n`;
    });
    formatted += '\n';
  }

  // Add fixes
  if (categories.fixes.length > 0) {
    formatted += config.allowMarkdown ? '**Bug Fixes:**\n' : 'Bug Fixes:\n';
    categories.fixes.forEach(change => {
      const text = config.allowMarkdown ? change : markdownToPlainText(change);
      formatted += `• ${text}\n`;
    });
    formatted += '\n';
  }

  // Add other changes
  if (categories.other.length > 0) {
    formatted += config.allowMarkdown ? '**Other Changes:**\n' : 'Other Changes:\n';
    categories.other.forEach(change => {
      const text = config.allowMarkdown ? change : markdownToPlainText(change);
      formatted += `• ${text}\n`;
    });
    formatted += '\n';
  }

  // Trim to store's character limit
  if (formatted.length > config.maxLength) {
    formatted = formatted.substring(0, config.maxLength - 50).trim();
    formatted += '\n\n...and more! See full changelog on GitHub.';
  }

  return formatted.trim();
}

/**
 * Generate release notes for all stores or specific store
 */
function generateReleaseNotes(version, store) {
  console.log(`Generating release notes for version ${version}...`);

  // Extract changelog section
  const changelogText = extractChangelogSection(version);
  console.log(`✓ Extracted changelog section for v${version}`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate notes for requested store(s)
  const stores = store === 'all' ? Object.keys(STORE_LIMITS) : [store];
  const results = {};

  for (const storeName of stores) {
    const formatted = formatForStore(changelogText, storeName, version);
    const outputPath = path.join(OUTPUT_DIR, `${storeName}-${version}.txt`);

    fs.writeFileSync(outputPath, formatted, 'utf8');
    results[storeName] = {
      path: outputPath,
      length: formatted.length,
      limit: STORE_LIMITS[storeName].maxLength
    };

    console.log(`✓ Generated ${STORE_LIMITS[storeName].name} release notes: ${outputPath}`);
    console.log(`  (${formatted.length} / ${STORE_LIMITS[storeName].maxLength} characters)`);
  }

  return results;
}

/**
 * Display generated release notes
 */
function displayResults(results, version) {
  console.log('\n' + '='.repeat(80));
  console.log(`Release Notes Generated for v${version}`);
  console.log('='.repeat(80) + '\n');

  for (const [store, info] of Object.entries(results)) {
    console.log(`${STORE_LIMITS[store].name}:`);
    console.log(`  File: ${info.path}`);
    console.log(`  Size: ${info.length} / ${info.limit} characters`);

    const content = fs.readFileSync(info.path, 'utf8');
    console.log('\n' + '-'.repeat(80));
    console.log(content);
    console.log('-'.repeat(80) + '\n');
  }

  console.log('Next steps:');
  console.log('1. Review generated release notes');
  console.log('2. Manually copy to store dashboards during submission');
  console.log('3. Or use these files in automated submission workflows\n');
}

/**
 * Main function
 */
function main() {
  try {
    const { version, store } = parseArgs();
    const results = generateReleaseNotes(version, store);
    displayResults(results, version);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  extractChangelogSection,
  categorizeChanges,
  formatForStore,
  markdownToPlainText
};
