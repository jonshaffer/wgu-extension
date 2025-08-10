#!/usr/bin/env npx tsx

/**
 * Catalog File Standardization Tool
 * Standardizes catalog filenames to YYYY-MM format for proper ordering
 */

import { readdirSync, renameSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createComponentLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const logger = createComponentLogger('CatalogStandardizer');

// Month name to number mapping
const MONTH_MAP: Record<string, string> = {
  'january': '01',
  'february': '02',
  'march': '03',
  'april': '04',
  'may': '05',
  'june': '06',
  'july': '07',
  'august': '08',
  'september': '09',
  'october': '10',
  'november': '11',
  'december': '12'
};

interface FileRename {
  oldName: string;
  newName: string;
  directory: string;
  reason: string;
}

export class CatalogStandardizer {
  private catalogsDir: string;
  private parsedDir: string;

  constructor() {
    this.catalogsDir = join(__dirname, '..', 'historical', 'pdfs');
    this.parsedDir = join(__dirname, '..', 'historical', 'parsed');
  }

  /**
   * Standardize a catalog filename to YYYY-MM format
   */
  standardizeFilename(filename: string): { standardized: string; wasChanged: boolean; reason: string } {
    // Skip already standardized files (YYYY-MM format)
    const standardPattern = /^catalog-(\d{4})-(\d{2})(-.*)?\.pdf$/;
    if (standardPattern.test(filename)) {
      return { standardized: filename, wasChanged: false, reason: 'Already standardized' };
    }

    // Extract year from filename
    const yearMatch = filename.match(/catalog-(\d{4})-/);
    if (!yearMatch) {
      return { standardized: filename, wasChanged: false, reason: 'No year found' };
    }
    
    const year = yearMatch[1];
    let month = '';
    let suffix = '';
    let reason = '';

    // Handle month name patterns
    for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
      const monthPattern = new RegExp(`catalog-${year}-(${monthName})(\\.pdf)?$`, 'i');
      const match = filename.match(monthPattern);
      
      if (match) {
        month = monthNum;
        reason = `Converted ${monthName} to ${monthNum}`;
        break;
      }
    }

    // Handle specific patterns we've seen
    if (!month) {
      // Handle patterns like "catalog-2017-current.pdf" 
      if (filename.includes('-current')) {
        const currentDate = new Date();
        month = String(currentDate.getMonth() + 1).padStart(2, '0');
        suffix = '-current';
        reason = `Current catalog assigned to month ${month}`;
      }
      // Handle patterns like "catalog-2017-fall.pdf"
      else if (filename.includes('-fall')) {
        month = '09'; // September for fall semester
        suffix = '-fall';
        reason = 'Fall semester assigned to September (09)';
      }
      // Handle patterns like "catalog-2017-spring.pdf"
      else if (filename.includes('-spring')) {
        month = '03'; // March for spring semester
        suffix = '-spring';
        reason = 'Spring semester assigned to March (03)';
      }
      // Handle patterns like "catalog-2017-summer.pdf"
      else if (filename.includes('-summer')) {
        month = '06'; // June for summer semester
        suffix = '-summer';
        reason = 'Summer semester assigned to June (06)';
      }
      // Handle numeric patterns that might not be zero-padded
      else {
        const numericMatch = filename.match(new RegExp(`catalog-${year}-(\\d{1,2})(\\.pdf)?$`));
        if (numericMatch) {
          month = numericMatch[1].padStart(2, '0');
          reason = `Zero-padded month ${numericMatch[1]} to ${month}`;
        }
      }
    }

    if (!month) {
      return { standardized: filename, wasChanged: false, reason: 'Could not determine month' };
    }

    const extension = filename.endsWith('.pdf') ? '.pdf' : '';
    const standardized = `catalog-${year}-${month}${suffix}${extension}`;
    
    return { 
      standardized, 
      wasChanged: standardized !== filename, 
      reason 
    };
  }

  /**
   * Find all files that need to be renamed
   */
  findFilesToRename(): FileRename[] {
    const renames: FileRename[] = [];
    const conflicts = new Map<string, string[]>(); // target -> [source files]

    // Check PDF files
    if (existsSync(this.catalogsDir)) {
      const pdfFiles = readdirSync(this.catalogsDir).filter(f => f.endsWith('.pdf'));
      
      for (const filename of pdfFiles) {
        const result = this.standardizeFilename(filename);
        
        if (result.wasChanged) {
          // Check for conflicts
          if (!conflicts.has(result.standardized)) {
            conflicts.set(result.standardized, []);
          }
          conflicts.get(result.standardized)!.push(filename);
          
          renames.push({
            oldName: filename,
            newName: result.standardized,
            directory: this.catalogsDir,
            reason: result.reason
          });
        }
      }
    }

    // Handle conflicts by adding suffixes
    for (const [target, sources] of conflicts) {
      if (sources.length > 1) {
        // Sort sources to ensure consistent ordering
        sources.sort();
        
        // If target already exists, start with suffix -2
        const targetExists = existsSync(join(this.catalogsDir, target));
        let suffixStart = targetExists ? 2 : 1;
        
        // Update renames with suffixes for conflicting files
        for (let i = (targetExists ? 0 : 1); i < sources.length; i++) {
          const sourceFile = sources[i];
          const renameIndex = renames.findIndex(r => r.oldName === sourceFile);
          
          if (renameIndex !== -1) {
            const originalName = renames[renameIndex].newName;
            const baseName = originalName.replace('.pdf', '');
            const suffix = suffixStart + i - (targetExists ? 0 : 1);
            
            renames[renameIndex].newName = `${baseName}-v${suffix}.pdf`;
            renames[renameIndex].reason += ` (conflict resolved with -v${suffix})`;
          }
        }
      }
    }

    // Check corresponding JSON files
    if (existsSync(this.parsedDir)) {
      const jsonFiles = readdirSync(this.parsedDir).filter(f => f.endsWith('.json'));
      
      for (const filename of jsonFiles) {
        // Convert JSON filename to PDF format for standardization
        const pdfName = filename.replace('.json', '.pdf').replace('-parsed', '');
        const result = this.standardizeFilename(pdfName);
        
        if (result.wasChanged) {
          // Convert back to JSON format, maintaining any version suffix
          let newJsonName = result.standardized.replace('.pdf', '.json');
          
          // Check if the corresponding PDF rename has a version suffix
          const pdfRename = renames.find(r => r.oldName === pdfName);
          if (pdfRename && pdfRename.newName.includes('-v')) {
            const versionSuffix = pdfRename.newName.match(/-v\d+/);
            if (versionSuffix) {
              newJsonName = newJsonName.replace('.json', `${versionSuffix[0]}.json`);
            }
          }
          
          renames.push({
            oldName: filename,
            newName: newJsonName,
            directory: this.parsedDir,
            reason: `JSON: ${result.reason}`
          });
        }
      }
    }

    return renames;
  }

  /**
   * Preview all proposed renames
   */
  previewRenames(): void {
    const renames = this.findFilesToRename();
    
    if (renames.length === 0) {
      logger.info('No files need to be renamed - all catalogs are already standardized!');
      console.log('✅ All catalog files are already in standard YYYY-MM format');
      return;
    }

    console.log(`\n📋 CATALOG STANDARDIZATION PREVIEW`);
    console.log(`=`.repeat(80));
    console.log(`Found ${renames.length} files that need to be renamed:\n`);

    // Group by directory
    const pdfRenames = renames.filter(r => r.directory.includes('pdfs'));
    const jsonRenames = renames.filter(r => r.directory.includes('parsed'));

    if (pdfRenames.length > 0) {
      console.log(`📁 PDF Catalogs (${pdfRenames.length} files):`);
      console.log(`${'Old Name'.padEnd(35)} → ${'New Name'.padEnd(35)} | Reason`);
      console.log(`${'-'.repeat(35)} → ${'-'.repeat(35)} | ${'-'.repeat(30)}`);
      
      for (const rename of pdfRenames) {
        console.log(`${rename.oldName.padEnd(35)} → ${rename.newName.padEnd(35)} | ${rename.reason}`);
      }
      console.log('');
    }

    if (jsonRenames.length > 0) {
      console.log(`📄 Parsed JSON Files (${jsonRenames.length} files):`);
      console.log(`${'Old Name'.padEnd(40)} → ${'New Name'.padEnd(40)} | Reason`);
      console.log(`${'-'.repeat(40)} → ${'-'.repeat(40)} | ${'-'.repeat(25)}`);
      
      for (const rename of jsonRenames) {
        console.log(`${rename.oldName.padEnd(40)} → ${rename.newName.padEnd(40)} | ${rename.reason}`);
      }
      console.log('');
    }

    console.log(`📊 Summary:`);
    console.log(`   PDF files to rename: ${pdfRenames.length}`);
    console.log(`   JSON files to rename: ${jsonRenames.length}`);
    console.log(`   Total operations: ${renames.length}`);
    console.log(`\n💡 Run with --execute to perform the renames`);
  }

  /**
   * Execute all standardization renames
   */
  executeRenames(): boolean {
    const renames = this.findFilesToRename();
    
    if (renames.length === 0) {
      logger.info('No files need to be renamed');
      console.log('✅ All files are already standardized');
      return true;
    }

    console.log(`\n🔄 EXECUTING CATALOG STANDARDIZATION`);
    console.log(`=`.repeat(60));

    let successful = 0;
    let failed = 0;

    for (const rename of renames) {
      try {
        const oldPath = join(rename.directory, rename.oldName);
        const newPath = join(rename.directory, rename.newName);

        // Check if target already exists
        if (existsSync(newPath)) {
          logger.warn(`Target file already exists: ${rename.newName}`);
          console.log(`⚠️  Skipped ${rename.oldName} → ${rename.newName} (target exists)`);
          failed++;
          continue;
        }

        // Perform the rename
        renameSync(oldPath, newPath);
        
        logger.info(`Renamed ${rename.oldName} → ${rename.newName}`, { 
          reason: rename.reason,
          directory: rename.directory.split('/').pop()
        });
        
        console.log(`✅ ${rename.oldName} → ${rename.newName}`);
        successful++;

      } catch (error) {
        logger.error(`Failed to rename ${rename.oldName}`, { 
          error: error instanceof Error ? error.message : String(error),
          newName: rename.newName 
        });
        
        console.log(`❌ Failed: ${rename.oldName} → ${rename.newName}`);
        failed++;
      }
    }

    console.log(`\n📊 STANDARDIZATION COMPLETE`);
    console.log(`=`.repeat(40));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Total: ${renames.length}`);

    if (successful > 0) {
      console.log(`\n🎉 Catalog files have been standardized to YYYY-MM format!`);
      console.log(`📋 Files will now sort chronologically by name`);
    }

    return failed === 0;
  }

  /**
   * Verify standardization results
   */
  verifyStandardization(): void {
    console.log(`\n🔍 VERIFYING STANDARDIZATION`);
    console.log(`=`.repeat(50));

    // Check PDF files
    const pdfFiles = existsSync(this.catalogsDir) ? 
      readdirSync(this.catalogsDir).filter(f => f.endsWith('.pdf')) : [];
    
    const standardPdfs = pdfFiles.filter(f => /^catalog-\d{4}-\d{2}(-.*)?\.pdf$/.test(f));
    const nonStandardPdfs = pdfFiles.filter(f => !/^catalog-\d{4}-\d{2}(-.*)?\.pdf$/.test(f));

    console.log(`📁 PDF Catalogs:`);
    console.log(`   ✅ Standardized: ${standardPdfs.length}`);
    console.log(`   ❌ Non-standard: ${nonStandardPdfs.length}`);

    if (nonStandardPdfs.length > 0) {
      console.log(`   Non-standard files:`);
      nonStandardPdfs.forEach(f => console.log(`      • ${f}`));
    }

    // Check JSON files
    const jsonFiles = existsSync(this.parsedDir) ? 
      readdirSync(this.parsedDir).filter(f => f.endsWith('.json')) : [];
    
    const standardJsons = jsonFiles.filter(f => /^catalog-\d{4}-\d{2}(-.*)?\.json$/.test(f));
    const nonStandardJsons = jsonFiles.filter(f => !/^catalog-\d{4}-\d{2}(-.*)?\.json$/.test(f));

    console.log(`\n📄 Parsed JSON Files:`);
    console.log(`   ✅ Standardized: ${standardJsons.length}`);
    console.log(`   ❌ Non-standard: ${nonStandardJsons.length}`);

    if (nonStandardJsons.length > 0) {
      console.log(`   Non-standard files:`);
      nonStandardJsons.forEach(f => console.log(`      • ${f}`));
    }

    // Show sample chronological ordering
    const sortedFiles = [...standardPdfs].sort();
    console.log(`\n📅 Sample Chronological Order (first 10):`);
    sortedFiles.slice(0, 10).forEach((f, i) => {
      console.log(`   ${i + 1}. ${f}`);
    });

    if (nonStandardPdfs.length === 0 && nonStandardJsons.length === 0) {
      console.log(`\n🎉 All files are properly standardized!`);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const standardizer = new CatalogStandardizer();

  switch (command) {
    case 'preview':
    case 'show':
    case 'list':
      standardizer.previewRenames();
      break;

    case 'execute':
    case 'run':
    case 'apply':
      console.log('🚀 Starting catalog standardization...');
      const success = standardizer.executeRenames();
      process.exit(success ? 0 : 1);
      break;

    case 'verify':
    case 'check':
      standardizer.verifyStandardization();
      break;

    default:
      console.log('WGU Catalog Standardization Tool');
      console.log('');
      console.log('Usage: npx tsx standardize-catalogs.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  preview   - Show what files would be renamed (default)');
      console.log('  execute   - Perform the standardization');
      console.log('  verify    - Check current standardization status');
      console.log('');
      console.log('Examples:');
      console.log('  npx tsx standardize-catalogs.ts preview   # Show preview');
      console.log('  npx tsx standardize-catalogs.ts execute   # Execute renames');
      console.log('  npx tsx standardize-catalogs.ts verify    # Check results');
      console.log('');
      console.log('Standardizes catalog filenames to YYYY-MM format for proper ordering');
  }
}
