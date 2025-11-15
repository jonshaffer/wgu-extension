#!/usr/bin/env node
/**
 * Build dependency validation script
 * Ensures all platform-specific dependencies are properly installed
 * Updated to work with pnpm's .pnpm store structure
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const REQUIRED_WORKSPACES = ['site']; // Only check site workspace for CSS build tools
const CRITICAL_DEPENDENCIES = [
  {
    name: '@tailwindcss/oxide',
    platforms: ['@tailwindcss/oxide-linux-x64-gnu', '@tailwindcss/oxide-darwin-arm64', '@tailwindcss/oxide-darwin-x64'],
    installCommand: 'pnpm install @tailwindcss/oxide-linux-x64-gnu --no-save'
  },
  {
    name: 'lightningcss',
    platforms: ['lightningcss-linux-x64-gnu', 'lightningcss-darwin-arm64', 'lightningcss-darwin-x64'],
    installCommand: 'pnpm rebuild lightningcss --build-from-source',
    checkPath: 'lightningcss/lightningcss.linux-x64-gnu.node'
  },
  {
    name: 'esbuild',
    platforms: ['@esbuild/linux-x64', '@esbuild/darwin-arm64', '@esbuild/darwin-x64'],
    installCommand: 'pnpm install @esbuild/linux-x64 --no-save'
  }
];

/**
 * Find a package in pnpm's .pnpm store
 */
function findInPnpmStore(packageName, rootDir) {
  const pnpmStoreDir = path.join(rootDir, 'node_modules', '.pnpm');

  if (!fs.existsSync(pnpmStoreDir)) {
    return null;
  }

  try {
    // Read all directories in .pnpm store
    const entries = fs.readdirSync(pnpmStoreDir, { withFileTypes: true });

    // Find directories matching the package name pattern
    const packagePattern = packageName.replace('@', '').replace('/', '+');
    const matchingDirs = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => entry.name.startsWith(packagePattern + '@') || entry.name === packagePattern)
      .map(entry => path.join(pnpmStoreDir, entry.name, 'node_modules', packageName));

    // Return the first valid match
    for (const dir of matchingDirs) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }
  } catch (error) {
    // Ignore errors and continue
  }

  return null;
}

function checkWorkspaceDependencies(workspace) {
  const workspacePath = path.join(process.cwd(), workspace);
  const nodeModulesPath = path.join(workspacePath, 'node_modules');
  const rootNodeModulesPath = path.join(process.cwd(), 'node_modules');
  const rootDir = process.cwd();

  console.log(`🔍 Checking dependencies in ${workspace}...`);

  // Check both workspace and root node_modules (for hoisted dependencies)
  if (!fs.existsSync(nodeModulesPath) && !fs.existsSync(rootNodeModulesPath)) {
    throw new Error(`node_modules not found in ${workspace} or root. Run pnpm install first.`);
  }

  const issues = [];

  // Check critical dependencies
  for (const dep of CRITICAL_DEPENDENCIES) {
    // Check in multiple locations: workspace, root, and pnpm store
    const depPaths = [
      path.join(nodeModulesPath, dep.name),
      path.join(rootNodeModulesPath, dep.name),
      findInPnpmStore(dep.name, rootDir),
      findInPnpmStore(dep.name, workspacePath)
    ].filter(Boolean);

    const depPath = depPaths.find(p => fs.existsSync(p));
    if (!depPath) {
      issues.push({
        dependency: dep.name,
        issue: 'Package not found',
        suggestion: `pnpm install ${dep.name}`,
        workspace
      });
      continue;
    }

    // Check for platform-specific binaries in all possible locations
    let hasValidPlatform = false;

    if (dep.checkPath) {
      // Custom path check (e.g., for lightningcss native binary)
      const binaryPaths = [
        path.join(nodeModulesPath, dep.checkPath),
        path.join(rootNodeModulesPath, dep.checkPath),
        depPath ? path.join(depPath, '..', dep.checkPath.split('/').slice(1).join('/')) : null
      ].filter(Boolean);
      hasValidPlatform = binaryPaths.some(p => fs.existsSync(p));
    } else {
      // Standard platform package check in multiple locations including pnpm store
      const checkLocations = [
        nodeModulesPath,
        rootNodeModulesPath,
        path.join(rootDir, 'node_modules', '.pnpm'),
        path.join(workspacePath, 'node_modules', '.pnpm')
      ].filter(p => fs.existsSync(p));

      hasValidPlatform = checkLocations.some(location => {
        // For pnpm store, search recursively in the .pnpm directory
        if (location.endsWith('.pnpm')) {
          try {
            const entries = fs.readdirSync(location, { withFileTypes: true });
            return dep.platforms.some(platform => {
              const platformPattern = platform.replace('@', '').replace('/', '+');
              return entries.some(entry =>
                entry.isDirectory() && entry.name.startsWith(platformPattern)
              );
            });
          } catch {
            return false;
          }
        }
        // For regular node_modules, check directly
        return dep.platforms.some(platform =>
          fs.existsSync(path.join(location, platform))
        );
      });
    }

    if (!hasValidPlatform) {
      console.warn(`⚠️  No platform-specific binaries found for ${dep.name} in ${workspace}`);
      console.warn(`   Expected one of: ${dep.platforms.join(', ')}`);

      issues.push({
        dependency: dep.name,
        issue: 'Platform-specific binary missing',
        suggestion: dep.installCommand,
        workspace,
        platforms: dep.platforms
      });
    } else {
      console.log(`✅ ${dep.name} platform dependencies OK in ${workspace}`);
    }
  }

  return issues;
}

function main() {
  console.log('🚀 Validating build dependencies...');
  console.log(`Platform: ${os.platform()}-${os.arch()}`);
  console.log(`CI Environment: ${process.env.CI === 'true' ? 'Yes' : 'No'}`);
  console.log('');
  
  try {
    const allIssues = [];
    
    for (const workspace of REQUIRED_WORKSPACES) {
      const issues = checkWorkspaceDependencies(workspace);
      allIssues.push(...issues);
    }
    
    if (allIssues.length === 0) {
      console.log('');
      console.log('✅ All dependency validations passed!');
      process.exit(0);
    }
    
    // Handle issues
    console.log('');
    console.error('❌ Dependency validation issues found:');
    console.error('');
    
    const criticalIssues = allIssues.filter(issue => 
      process.env.CI === 'true' && issue.issue === 'Platform-specific binary missing'
    );
    
    allIssues.forEach((issue, index) => {
      console.error(`${index + 1}. ${issue.dependency} in ${issue.workspace}:`);
      console.error(`   Issue: ${issue.issue}`);
      console.error(`   Solution: ${issue.suggestion}`);
      if (issue.platforms) {
        console.error(`   Expected platforms: ${issue.platforms.join(', ')}`);
      }
      console.error('');
    });
    
    console.error('💡 Quick fix commands:');
    console.error('   pnpm install --frozen-lockfile --include=optional --foreground-scripts');
    console.error('   pnpm rebuild lightningcss --build-from-source');
    console.error('   pnpm install @tailwindcss/oxide-linux-x64-gnu --no-save');
    console.error('   pnpm install @esbuild/linux-x64 --no-save');
    console.error('');

    if (criticalIssues.length > 0 && process.env.CI === 'true') {
      console.error('💥 Critical issues found in CI environment. Failing build.');
      process.exit(1);
    } else if (process.env.CI !== 'true') {
      console.warn('⚠️  Issues found but not in CI. Please fix before deploying.');
      process.exit(0);
    } else {
      console.log('✅ No critical issues for current environment.');
      process.exit(0);
    }
  } catch (error) {
    console.error('');
    console.error('💥 Unexpected error during validation:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('💡 Try running:');
    console.error('   pnpm install --frozen-lockfile --include=optional');
    console.error('   pnpm install @tailwindcss/oxide-linux-x64-gnu --no-save');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}