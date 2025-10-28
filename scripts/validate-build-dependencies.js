#!/usr/bin/env node
/**
 * Build dependency validation script
 * Ensures all platform-specific dependencies are properly installed
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REQUIRED_WORKSPACES = ['extension', 'site'];
const CRITICAL_DEPENDENCIES = [
  { 
    name: 'lightningcss', 
    platforms: ['lightningcss-linux-x64-gnu', 'lightningcss-darwin-arm64', 'lightningcss-darwin-x64'] 
  },
  { 
    name: '@tailwindcss/oxide', 
    platforms: ['@tailwindcss/oxide-linux-x64-gnu', '@tailwindcss/oxide-darwin-arm64', '@tailwindcss/oxide-darwin-x64'] 
  }
];

function checkWorkspaceDependencies(workspace) {
  const workspacePath = path.join(process.cwd(), workspace);
  const nodeModulesPath = path.join(workspacePath, 'node_modules');
  
  console.log(`🔍 Checking dependencies in ${workspace}...`);
  
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error(`node_modules not found in ${workspace}. Run npm install first.`);
  }
  
  // Check critical dependencies
  for (const dep of CRITICAL_DEPENDENCIES) {
    const depPath = path.join(nodeModulesPath, dep.name);
    if (!fs.existsSync(depPath)) {
      throw new Error(`Critical dependency ${dep.name} not found in ${workspace}`);
    }
    
    // Check for at least one platform-specific binary
    const hasValidPlatform = dep.platforms.some(platform => 
      fs.existsSync(path.join(nodeModulesPath, platform))
    );
    
    if (!hasValidPlatform) {
      console.warn(`⚠️  No platform-specific binaries found for ${dep.name} in ${workspace}`);
      console.warn(`   Expected one of: ${dep.platforms.join(', ')}`);
      
      // In CI, this is critical
      if (process.env.CI === 'true') {
        throw new Error(`Platform-specific binary missing for ${dep.name} in CI environment`);
      }
    } else {
      console.log(`✅ ${dep.name} platform dependencies OK in ${workspace}`);
    }
  }
}

function main() {
  console.log('🚀 Validating build dependencies...');
  console.log(`Platform: ${os.platform()}-${os.arch()}`);
  console.log(`CI Environment: ${process.env.CI === 'true' ? 'Yes' : 'No'}`);
  console.log('');
  
  try {
    for (const workspace of REQUIRED_WORKSPACES) {
      checkWorkspaceDependencies(workspace);
    }
    
    console.log('');
    console.log('✅ All dependency validations passed!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Dependency validation failed:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('💡 Try running:');
    console.error('   npm ci --include=optional');
    console.error('   npm install lightningcss-linux-x64-gnu --no-save  # For CI environments');
    console.error('   npm install @tailwindcss/oxide-linux-x64-gnu --no-save  # For CI environments');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}