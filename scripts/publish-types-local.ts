#!/usr/bin/env tsx

/**
 * Local Types Package Publisher
 * 
 * Publishes @wgu-extension/types to npm with a local development tag
 * Uses format: {version}-local.{timestamp}
 * Tagged with 'local' to differentiate from 'latest' and 'next'
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const PACKAGES_DIR = resolve(process.cwd(), 'packages/types');
const PACKAGE_JSON_PATH = resolve(PACKAGES_DIR, 'package.json');

interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

function runCommand(cmd: string, cwd?: string): string {
  try {
    return execSync(cmd, { 
      cwd: cwd || process.cwd(), 
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'inherit']
    });
  } catch (error) {
    console.error(`❌ Command failed: ${cmd}`);
    process.exit(1);
  }
}

function runCommandAsync(cmd: string, args: string[], cwd?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function publishTypesLocal(isDryRun: boolean = false) {
  console.log('📦 Publishing @wgu-extension/types locally...');
  
  // Read current package.json
  const packageJson: PackageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  const originalVersion = packageJson.version;
  
  console.log(`📋 Current version: ${originalVersion}`);

  // Generate local version with timestamp
  const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp for shorter format
  const localVersion = `${originalVersion}-local.${timestamp}`;
  
  console.log(`🏷️  Local version: ${localVersion}`);

  // Check if local version already exists (only if package exists on npm)
  try {
    execSync(`npm view ${packageJson.name} version`, { 
      stdio: ['ignore', 'ignore', 'ignore']
    });
    // Package exists, check specific version
    try {
      const existingVersion = execSync(`npm view ${packageJson.name}@${localVersion} version`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      if (existingVersion) {
        console.log(`⚠️  Version ${localVersion} already exists on npm, skipping...`);
        return;
      }
    } catch {
      // Specific version doesn't exist, continue
    }
  } catch {
    // Package doesn't exist on npm yet, continue
    console.log('📋 Package not yet published to npm, will be first publish');
  }

  // Build the package
  console.log('🔨 Building package...');
  runCommand('npm run build', PACKAGES_DIR);

  // Update package.json with local version (no git tag)
  console.log(`📝 Updating package.json to ${localVersion}...`);
  packageJson.version = localVersion;
  writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

  try {
    if (isDryRun) {
      console.log('🧪 Dry run mode - would publish with:');
      console.log(`   Version: ${localVersion}`);
      console.log(`   Tag: local`);
      console.log('   Running npm publish --dry-run...');
      
      await runCommandAsync('npm', ['publish', '--access', 'public', '--tag', 'local', '--dry-run'], PACKAGES_DIR);
      
      console.log('✅ Dry run completed successfully');
    } else {
      // Verify npm authentication
      console.log('🔐 Verifying npm authentication...');
      try {
        const whoami = runCommand('npm whoami').trim();
        console.log(`   Authenticated as: ${whoami}`);
      } catch {
        console.error('❌ Not authenticated to npm. Run: npm login');
        return;
      }

      // Publish to npm with 'local' tag
      console.log(`🚀 Publishing to npm (tag: local)...`);
      await runCommandAsync('npm', ['publish', '--access', 'public', '--tag', 'local'], PACKAGES_DIR);
      
      console.log(`✅ Successfully published ${packageJson.name}@${localVersion}`);
      console.log(`📥 Install with: npm install ${packageJson.name}@local`);
      console.log(`📥 Or specific: npm install ${packageJson.name}@${localVersion}`);
    }

  } catch (error) {
    console.error('❌ Publish failed:', error);
    throw error;
  } finally {
    // Restore original version
    console.log(`🔄 Restoring original version: ${originalVersion}`);
    packageJson.version = originalVersion;
    writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
📦 @wgu-extension/types Local Publisher

Publishes the types package to npm with a local development tag.

Usage: npm run types:publish:local [options]

Options:
  --dry-run, -d    Run without actually publishing (test mode)
  --help, -h       Show this help message

Examples:
  npm run types:publish:local           # Publish to npm with 'local' tag
  npm run types:publish:local:dry       # Test the publish process

Local versions use format: {version}-local.{timestamp}
Published with npm tag 'local' to avoid conflicts with 'latest' and 'next'
`);
    return;
  }

  try {
    await publishTypesLocal(isDryRun);
  } catch (error) {
    console.error('❌ Local publishing failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { publishTypesLocal };