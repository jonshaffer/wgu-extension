#!/usr/bin/env node
/**
 * Build dependency validation script
 * Ensures all platform-specific dependencies are properly installed
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REQUIRED_WORKSPACES = ['site']; // Only check site workspace for CSS build tools
const CRITICAL_DEPENDENCIES = [
  { 
    name: '@tailwindcss/oxide', 
    platforms: ['@tailwindcss/oxide-linux-x64-gnu', '@tailwindcss/oxide-darwin-arm64', '@tailwindcss/oxide-darwin-x64'],
    installCommand: 'npm install @tailwindcss/oxide-linux-x64-gnu --no-save'
  },
  {
    name: 'lightningcss',
    platforms: ['lightningcss-linux-x64-gnu', 'lightningcss-darwin-arm64', 'lightningcss-darwin-x64'],
    installCommand: 'npm rebuild lightningcss --build-from-source --verbose',
    checkPath: 'lightningcss/lightningcss.linux-x64-gnu.node'
  },
  {
    name: 'esbuild',
    platforms: ['@esbuild/linux-x64', '@esbuild/darwin-arm64', '@esbuild/darwin-x64'],
    installCommand: 'npm install @esbuild/linux-x64 --no-save'
  }
];

function checkWorkspaceDependencies(workspace) {
  const workspacePath = path.join(process.cwd(), workspace);
  const nodeModulesPath = path.join(workspacePath, 'node_modules');
  
  console.log(`🔍 Checking dependencies in ${workspace}...`);
  
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error(`node_modules not found in ${workspace}. Run npm install first.`);
  }
  
  const issues = [];
  
  // Check critical dependencies
  for (const dep of CRITICAL_DEPENDENCIES) {
    const depPath = path.join(nodeModulesPath, dep.name);
    if (!fs.existsSync(depPath)) {
      issues.push({
        dependency: dep.name,
        issue: 'Package not found',
        suggestion: `npm install ${dep.name}`,
        workspace
      });
      continue;
    }
    
    // Check for platform-specific binaries
    let hasValidPlatform = false;
    
    if (dep.checkPath) {
      // Custom path check (e.g., for lightningcss native binary)
      const binaryPath = path.join(nodeModulesPath, dep.checkPath);
      hasValidPlatform = fs.existsSync(binaryPath);
    } else {
      // Standard platform package check
      hasValidPlatform = dep.platforms.some(platform => 
        fs.existsSync(path.join(nodeModulesPath, platform))
      );
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
    console.error('   npm ci --include=optional --foreground-scripts');
    console.error('   npm rebuild lightningcss --build-from-source --verbose');
    console.error('   npm install @tailwindcss/oxide-linux-x64-gnu --no-save');
    console.error('   npm install @esbuild/linux-x64 --no-save');
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
    console.error('   npm ci --include=optional');
    console.error('   npm install @tailwindcss/oxide-linux-x64-gnu --no-save');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}