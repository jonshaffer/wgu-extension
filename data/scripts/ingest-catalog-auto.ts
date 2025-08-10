#!/usr/bin/env node

/**
 * WGU Institutional Catalog Parser Dispatcher
 * 
 * Automatically selects the appropriate parser version based on catalog date/format
 */

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { parseCatalogV1, FORMAT_VERSION as V1_FORMAT } from './ingest-catalog-v1.js';

const require = createRequire(import.meta.url);

interface CatalogInfo {
  filename: string;
  path: string;
  estimatedDate: Date;
  suggestedParser: 'v1' | 'v2' | 'v3';
  reason: string;
}

function detectCatalogVersion(filename: string): CatalogInfo {
  const catalogPath = path.join(process.cwd(), 'data', 'raw', 'wgu-institution-catalog', filename);
  
  // Extract date from filename
  let estimatedDate = new Date();
  let suggestedParser: 'v1' | 'v2' | 'v3' = 'v2'; // default to current
  let reason = 'Default to current parser';
  
  // Parse date patterns from filename
  const datePatterns = [
    { pattern: /Jan2017/i, date: new Date('2017-01-01'), parser: 'v1' as const },
    { pattern: /(\w+)[-_]?(\d{4})/i, date: null, parser: 'v2' as const },
    { pattern: /(\d{4})[-_]?(\w+)/i, date: null, parser: 'v2' as const },
  ];
  
  for (const { pattern, date, parser } of datePatterns) {
    const match = filename.match(pattern);
    if (match && date) {
      estimatedDate = date;
      suggestedParser = parser;
      reason = `Date pattern matched: ${match[0]}`;
      break;
    }
  }
  
  // Apply version rules based on date
  if (estimatedDate < new Date('2021-01-01')) {
    suggestedParser = 'v1';
    reason = `Legacy catalog (pre-2021): ${estimatedDate.getFullYear()}`;
  } else if (estimatedDate < new Date('2024-01-01')) {
    suggestedParser = 'v2';
    reason = `Modern catalog (2021-2023): ${estimatedDate.getFullYear()}`;
  } else {
    suggestedParser = 'v2'; // Current parser handles 2024+
    reason = `Current catalog (2024+): ${estimatedDate.getFullYear()}`;
  }
  
  return {
    filename,
    path: catalogPath,
    estimatedDate,
    suggestedParser,
    reason
  };
}

async function parseCatalogWithAutoDetection(catalogInfo: CatalogInfo) {
  console.log(`📅 Catalog: ${catalogInfo.filename}`);
  console.log(`📋 Estimated date: ${catalogInfo.estimatedDate.toISOString().split('T')[0]}`);
  console.log(`🔧 Selected parser: ${catalogInfo.suggestedParser} (${catalogInfo.reason})`);
  
  switch (catalogInfo.suggestedParser) {
    case 'v1':
      console.log(`   📖 Using legacy parser v1.0 for catalog from ${catalogInfo.estimatedDate.getFullYear()}`);
      return await parseCatalogV1(catalogInfo.path);
      
    case 'v2':
    default:
      console.log(`   📖 Using modern parser v2.0 for catalog from ${catalogInfo.estimatedDate.getFullYear()}`);
      // For now, we'll create a simple wrapper since the current parser processes all files
      // In the future, this could be enhanced to call the modern parser directly
      console.log(`   ℹ️  Note: Modern parser processes all catalogs in directory`);
      return {
        success: true,
        data: null,
        errors: [],
        warnings: ['Modern parser not yet integrated with auto-detection'],
        stats: { processingTime: 0, coursesFound: 0, degreePlansFound: 0 }
      };
  }
}

async function main() {
  try {
    const catalogDir = path.join(process.cwd(), 'data', 'raw', 'wgu-institution-catalog');
    const outputDir = path.join(process.cwd(), 'data', 'processed');
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('📖 Starting WGU Catalog Auto-Detection and Parsing...');
    console.log('🔍 Scanning for catalog files...');
    
    // Get all PDF files in catalog directory
    const files = await fs.readdir(catalogDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('❌ No PDF catalog files found in data/raw/wgu-institution-catalog/');
      return;
    }
    
    console.log(`📚 Found ${pdfFiles.length} catalog file(s): ${pdfFiles.join(', ')}`);
    console.log('');
    
    const results = [];
    
    for (const pdfFile of pdfFiles) {
      try {
        // Detect appropriate parser version
        const catalogInfo = detectCatalogVersion(pdfFile);
        
        // Parse with detected version
        const result = await parseCatalogWithAutoDetection(catalogInfo);
        
        if (result.success && result.data) {
          // Save parsed data with version suffix
          const baseName = path.parse(pdfFile).name;
          const versionSuffix = catalogInfo.suggestedParser === 'v1' ? '-v1' : '';
          
          const dataPath = path.join(outputDir, `${baseName}-parsed${versionSuffix}.json`);
          await fs.writeFile(
            dataPath,
            JSON.stringify(result.data, null, 2)
          );
          console.log(`💾 Saved parsed data to: ${dataPath}`);
          
          // Save summary with metadata about parser selection
          const summaryPath = path.join(outputDir, `${baseName}-summary${versionSuffix}.json`);
          const summary = {
            file: pdfFile,
            catalogInfo,
            parserVersion: catalogInfo.suggestedParser,
            formatVersion: catalogInfo.suggestedParser === 'v1' ? V1_FORMAT : result.data.metadata.formatVersion,
            parsedAt: new Date().toISOString(),
            statistics: result.data.metadata.statistics,
            performance: result.data.metadata.parsing?.performance || { processingTimeMs: result.stats?.processingTime || 0 },
            compatibility: result.data.metadata.parsing?.compatibility || {
              fullySupported: true,
              formatDifferences: [],
              recommendations: []
            },
            success: result.success,
            errors: result.errors,
            warnings: result.warnings,
            stats: result.stats,
          };
          
          await fs.writeFile(
            summaryPath,
            JSON.stringify(summary, null, 2)
          );
          console.log(`📋 Saved summary to: ${summaryPath}`);
          
          results.push({
            file: pdfFile,
            success: true,
            parser: catalogInfo.suggestedParser,
            statistics: result.data.metadata.statistics
          });
          
        } else {
          console.error(`❌ Failed to parse ${pdfFile}:`);
          result.errors?.forEach(error => console.error(`   Error: ${error}`));
          
          results.push({
            file: pdfFile,
            success: false,
            parser: catalogInfo.suggestedParser,
            errors: result.errors
          });
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error processing ${pdfFile}:`, error);
        results.push({
          file: pdfFile,
          success: false,
          parser: 'unknown',
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }
    
    // Print summary of all results
    console.log('📊 Parsing Summary:');
    console.log('═'.repeat(60));
    
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const stats = result.statistics;
      
      console.log(`${status} ${result.file} (${result.parser})`);
      
      if (result.success && stats) {
        console.log(`   📚 Courses: ${stats.coursesFound}`);
        console.log(`   📊 CCN Coverage: ${stats.ccnCoverage}%`);
        console.log(`   📊 CU Coverage: ${stats.competencyUnitsCoverage}%`);
        console.log(`   🎓 Degree Plans: ${stats.degreePlansFound}`);
      } else if (result.errors) {
        console.log(`   ❌ Errors: ${result.errors.length}`);
      }
    }
    
    console.log('');
    console.log('✅ WGU Catalog Auto-Detection and Parsing completed');
    
  } catch (error) {
    console.error('❌ Catalog parsing failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { detectCatalogVersion, parseCatalogWithAutoDetection };
