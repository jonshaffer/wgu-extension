#!/usr/bin/env npx tsx

import { existsSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';

/**
 * Clean up redundant parsed JSON files that don't follow the standard format
 */
class ParsedFileCleaner {
  private parsedDir: string;

  constructor() {
    this.parsedDir = join(process.cwd(), 'historical', 'parsed');
  }

  /**
   * Find redundant files to remove
   */
  findRedundantFiles(): { toRemove: string[], toKeep: string[], conflicts: string[] } {
    const toRemove: string[] = [];
    const toKeep: string[] = [];
    const conflicts: string[] = [];

    if (!existsSync(this.parsedDir)) {
      logger.warn('ParsedFileCleaner', `Parsed directory not found: ${this.parsedDir}`);
      return { toRemove, toKeep, conflicts };
    }

    const files = readdirSync(this.parsedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      if (file.endsWith('-parsed.json')) {
        // Check if there's a corresponding standardized file
        const standardName = file.replace('-parsed.json', '.json');
        const standardPath = join(this.parsedDir, standardName);
        
        if (existsSync(standardPath)) {
          // Compare file sizes to detect potential differences
          const parsedPath = join(this.parsedDir, file);
          const parsedSize = statSync(parsedPath).size;
          const standardSize = statSync(standardPath).size;
          
          if (parsedSize === standardSize) {
            toRemove.push(file);
          } else {
            conflicts.push(`${file} (${parsedSize}b) vs ${standardName} (${standardSize}b)`);
          }
        } else {
          toKeep.push(`${file} (no standard equivalent)`);
        }
      } else if (file.includes('-january-') || file.includes('-february-') || 
                 file.includes('-march-') || file.includes('-april-') ||
                 file.includes('-may-') || file.includes('-june-') ||
                 file.includes('-july-') || file.includes('-august-') ||
                 file.includes('-september-') || file.includes('-october-') ||
                 file.includes('-november-') || file.includes('-december-')) {
        // Legacy word-month files that weren't standardized
        toRemove.push(file);
      }
    }

    return { toRemove, toKeep, conflicts };
  }

  /**
   * Preview what would be cleaned up
   */
  preview(): void {
    const { toRemove, toKeep, conflicts } = this.findRedundantFiles();

    console.log(`\n🧹 PARSED FILE CLEANUP PREVIEW`);
    console.log(`=`.repeat(60));

    if (toRemove.length > 0) {
      console.log(`\n❌ Files to remove (${toRemove.length}):`);
      toRemove.forEach(file => {
        console.log(`  - ${file}`);
      });
    }

    if (conflicts.length > 0) {
      console.log(`\n⚠️  Conflicts requiring manual review (${conflicts.length}):`);
      conflicts.forEach(conflict => {
        console.log(`  - ${conflict}`);
      });
    }

    if (toKeep.length > 0) {
      console.log(`\n📋 Files to keep (${toKeep.length}):`);
      toKeep.forEach(file => {
        console.log(`  - ${file}`);
      });
    }

    if (toRemove.length === 0 && conflicts.length === 0) {
      console.log(`\n✅ No redundant files found - cleanup not needed`);
    } else {
      console.log(`\n📊 Summary:`);
      console.log(`  🗑️  To remove: ${toRemove.length} files`);
      console.log(`  ⚠️  Conflicts: ${conflicts.length} files`);
      console.log(`  📋 To keep: ${toKeep.length} files`);
      
      if (conflicts.length === 0) {
        console.log(`\n🚀 Ready to execute cleanup with: --execute`);
      } else {
        console.log(`\n⚠️  Resolve conflicts before running cleanup`);
      }
    }
  }

  /**
   * Execute the cleanup
   */
  executeCleanup(): boolean {
    const { toRemove, conflicts } = this.findRedundantFiles();

    if (conflicts.length > 0) {
      logger.error('ParsedFileCleaner', `Cannot proceed with cleanup - ${conflicts.length} conflicts detected`);
      console.log(`❌ Cleanup aborted due to conflicts. Review manually first.`);
      return false;
    }

    if (toRemove.length === 0) {
      logger.info('ParsedFileCleaner', 'No files need cleanup');
      console.log('✅ No redundant files found');
      return true;
    }

    console.log(`\n🧹 EXECUTING PARSED FILE CLEANUP`);
    console.log(`=`.repeat(50));

    let successful = 0;
    let failed = 0;

    for (const file of toRemove) {
      try {
        const filePath = join(this.parsedDir, file);
        unlinkSync(filePath);
        
        logger.info('ParsedFileCleaner', `Removed redundant file: ${file}`);
        console.log(`🗑️  Removed: ${file}`);
        successful++;
        
      } catch (error) {
        logger.error('ParsedFileCleaner', `Failed to remove ${file}`, undefined, error instanceof Error ? error : new Error(String(error)));
        console.log(`❌ Failed to remove: ${file}`);
        failed++;
      }
    }

    console.log(`\n📊 CLEANUP COMPLETE`);
    console.log(`=`.repeat(30));
    console.log(`✅ Removed: ${successful} files`);
    console.log(`❌ Failed: ${failed} files`);
    console.log(`📁 Total processed: ${toRemove.length} files`);

    if (successful > 0) {
      console.log(`\n🎉 Cleanup successful! Parsed directory now has standardized filenames only.`);
    }

    return failed === 0;
  }
}

// Main execution
async function main() {
  const action = process.argv[2];
  const cleaner = new ParsedFileCleaner();

  try {
    switch (action) {
      case 'preview':
        cleaner.preview();
        break;
      case 'execute':
        const success = cleaner.executeCleanup();
        process.exit(success ? 0 : 1);
        break;
      default:
        console.log('📋 Parsed File Cleanup Tool');
        console.log('Usage:');
        console.log('  npx tsx cleanup-redundant-parsed.ts preview  - Show what would be cleaned');
        console.log('  npx tsx cleanup-redundant-parsed.ts execute  - Execute the cleanup');
        break;
    }
  } catch (error) {
    logger.error('ParsedFileCleaner', 'Cleanup tool failed', undefined, error instanceof Error ? error : new Error(String(error)));
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ParsedFileCleaner };
