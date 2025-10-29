#!/usr/bin/env node

/**
 * Validates commit messages follow conventional commit format
 * Format: type(scope?): message
 *
 * Valid types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
 *
 * Examples:
 *   ✓ feat: add new feature
 *   ✓ fix(auth): resolve login issue
 *   ✓ docs: update README
 *   ✗ Added new feature (no type)
 *   ✗ feat add feature (missing colon)
 */

const fs = require('fs');
const path = require('path');

// Valid commit types based on conventional commits
const VALID_TYPES = [
  'feat',     // New feature
  'fix',      // Bug fix
  'docs',     // Documentation only
  'style',    // Code style changes (formatting, missing semi-colons, etc)
  'refactor', // Code refactoring
  'test',     // Adding or updating tests
  'chore',    // Maintenance tasks
  'perf',     // Performance improvements
  'ci',       // CI/CD changes
  'build',    // Build system changes
  'revert'    // Revert a previous commit
];

// Conventional commit regex pattern
// Format: type(scope?): message
const COMMIT_PATTERN = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{3,}$/;

function validateCommitMessage(message) {
  // Remove comments (lines starting with #)
  const lines = message.split('\n').filter(line => !line.startsWith('#'));
  const commitMessage = lines[0];

  if (!commitMessage || commitMessage.trim().length === 0) {
    return {
      valid: false,
      error: 'Commit message cannot be empty'
    };
  }

  // Test against conventional commit pattern
  if (!COMMIT_PATTERN.test(commitMessage)) {
    return {
      valid: false,
      error: `Commit message does not follow conventional commit format.

Expected format: type(scope?): message

Valid types: ${VALID_TYPES.join(', ')}

Examples:
  ✓ feat: add user authentication
  ✓ fix(api): resolve data fetching issue
  ✓ docs: update installation guide
  ✓ chore(deps): update dependencies

Your message: "${commitMessage}"`
    };
  }

  return { valid: true };
}

// Main execution
const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('Error: Commit message file path not provided');
  process.exit(1);
}

const commitMsgPath = path.resolve(commitMsgFile);

if (!fs.existsSync(commitMsgPath)) {
  console.error(`Error: Commit message file not found: ${commitMsgPath}`);
  process.exit(1);
}

const commitMessage = fs.readFileSync(commitMsgPath, 'utf-8');
const result = validateCommitMessage(commitMessage);

if (!result.valid) {
  console.error('\n❌ Invalid commit message\n');
  console.error(result.error);
  console.error('\nCommit aborted. Please fix your commit message and try again.\n');
  process.exit(1);
}

console.log('✓ Commit message follows conventional commit format');
process.exit(0);
