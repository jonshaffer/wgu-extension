#!/usr/bin/env npx tsx

/**
 * WGU Current Catalog Fetcher & Parser
 * 
 * Fetches the latest catalog from WGU's official website,
 * parses it with our unified parser, and tests the results.
 * 
 * Usage:
 *   npx tsx fetch-current-catalog.ts
 *   npx tsx fetch-current-catalog.ts --parse-only  # Skip download, just parse existing
 *   npx tsx fetch-current-catalog.ts --test-only   # Skip download/parse, just test
 */

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { config as appConfig } from './lib/config';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

// WGU Catalog URLs (these may need to be updated)
const WGU_CATALOG_URLS = {
  current: 'https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/2025/catalog-january2025.pdf',
  october2024: 'https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/2024/catalog-october2024.pdf',
  march2024: 'https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/2024/catalog-march2024.pdf',
  may2024: 'https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/2024/catalog-may2024.pdf',
  // Fallback - check the main catalog page
  catalogPage: 'https://www.wgu.edu/about/institutional-catalog.html'
};

interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  url?: string;
}

interface ParseResult {
  success: boolean;
  outputPath?: string;
  coursesFound?: number;
  degreePlansFound?: number;
  ccnCoverage?: number;
  cuCoverage?: number;
  error?: string;
}

interface TestResult {
  success: boolean;
  issues: string[];
  quality: {
    coursesWithDescriptions: number;
    coursesWithCCN: number;
    coursesWithCU: number;
    totalCourses: number;
  };
}

/**
 * Download the current WGU catalog
 */
async function downloadCurrentCatalog(): Promise<DownloadResult> {
  console.log('📥 Downloading current WGU catalog...');
  
  const timestamp = new Date().toISOString().split('T')[0];
  const outputPath = path.join(__dirname, `catalog-current-${timestamp}.pdf`);
  
  // Try catalogs in order of preference (newest first)
  for (const [type, urlValue] of Object.entries(WGU_CATALOG_URLS)) {
    if (type === 'catalogPage') continue; // Skip the webpage link
    
    const url = urlValue as string;
    console.log(`🔗 Trying ${type} catalog: ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ Failed to fetch ${type} catalog: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('pdf')) {
        console.log(`❌ ${type} catalog is not a PDF: ${contentType}`);
        continue;
      }
      
      const buffer = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));
      
      const stats = await fs.stat(outputPath);
      console.log(`✅ Downloaded ${type} catalog: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return {
        success: true,
        filePath: outputPath,
        url
      };
      
    } catch (error) {
      console.log(`❌ Error downloading ${type} catalog:`, error);
      continue;
    }
  }
  
  return {
    success: false,
    error: 'Failed to download catalog from any known URL'
  };
}

/**
 * Parse the downloaded catalog using our unified parser
 */
async function parseCurrentCatalog(catalogPath: string): Promise<ParseResult> {
  console.log('🔍 Parsing current catalog...');
  
  try {
    // Use our unified parser
  const parserPath = path.join(__dirname, 'catalog-parser-unified.ts');
    const command = `npx tsx "${parserPath}" "${catalogPath}"`;
    
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf-8' });
    
    // Extract results from output
    const coursesMatch = output.match(/📚 Courses: (\d+)/);
    const plansMatch = output.match(/🎓 Degree Plans: (\d+)/);
    const ccnMatch = output.match(/📋 CCN Coverage: (\d+)%/);
    const cuMatch = output.match(/⭐ CU Coverage: (\d+)%/);
    const outputMatch = output.match(/💾 Output: (.+\.json)/);
    
    return {
      success: true,
      outputPath: outputMatch?.[1],
      coursesFound: coursesMatch ? parseInt(coursesMatch[1]) : 0,
      degreePlansFound: plansMatch ? parseInt(plansMatch[1]) : 0,
      ccnCoverage: ccnMatch ? parseInt(ccnMatch[1]) : 0,
      cuCoverage: cuMatch ? parseInt(cuMatch[1]) : 0
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test the parsed catalog data quality
 */
async function testParsedCatalog(parsedPath: string): Promise<TestResult> {
  console.log('🧪 Testing parsed catalog quality...');
  
  try {
    const data = JSON.parse(await fs.readFile(parsedPath, 'utf-8'));
    const issues: string[] = [];
    
    const courses = data.courses || {};
    const totalCourses = Object.keys(courses).length;
    
    let coursesWithDescriptions = 0;
    let coursesWithCCN = 0;
    let coursesWithCU = 0;
    
    for (const [courseCode, course] of Object.entries(courses) as [string, any][]) {
      if (course.description) coursesWithDescriptions++;
      if (course.ccn) coursesWithCCN++;
      if (course.competencyUnits) coursesWithCU++;
      
      // Check for data quality issues
      if (!course.courseName) {
        issues.push(`Course ${courseCode} missing courseName`);
      }
      
      if (course.courseName && course.courseName.length < 10) {
        issues.push(`Course ${courseCode} has very short name: "${course.courseName}"`);
      }
      
      if (course.description && course.description.length < 50) {
        issues.push(`Course ${courseCode} has very short description`);
      }
    }
    
    // Overall quality checks
    const descriptionRate = (coursesWithDescriptions / totalCourses) * 100;
    const ccnRate = (coursesWithCCN / totalCourses) * 100;
    const cuRate = (coursesWithCU / totalCourses) * 100;
    
    if (descriptionRate < 80) {
      issues.push(`Low description coverage: ${descriptionRate.toFixed(1)}%`);
    }
    
    if (ccnRate < 50) {
      issues.push(`Low CCN coverage: ${ccnRate.toFixed(1)}%`);
    }
    
    if (cuRate < 50) {
      issues.push(`Low CU coverage: ${cuRate.toFixed(1)}%`);
    }
    
    return {
      success: issues.length === 0,
      issues,
      quality: {
        coursesWithDescriptions,
        coursesWithCCN,
        coursesWithCU,
        totalCourses
      }
    };
    
  } catch (error) {
    return {
      success: false,
      issues: [`Failed to read/parse file: ${error}`],
      quality: { coursesWithDescriptions: 0, coursesWithCCN: 0, coursesWithCU: 0, totalCourses: 0 }
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const parseOnly = args.includes('--parse-only');
  const testOnly = args.includes('--test-only');
  
  console.log('🚀 WGU Current Catalog Fetcher & Parser');
  console.log('=====================================');
  
  let catalogPath: string | undefined;
  let parsedPath: string;
  
  if (testOnly) {
    // Find the most recent parsed catalog in configured parsed directory
    const parsedDir = appConfig.getConfig().paths.parsedDirectory;
    const files = await fs.readdir(parsedDir);
    const parsedFiles = files
      .filter(f => f.startsWith('catalog-') && f.endsWith('.json'))
      .sort();

    if (parsedFiles.length === 0) {
      console.error(`❌ No parsed catalog JSON found in ${parsedDir}. Run without --test-only first.`);
      process.exit(1);
    }

    parsedPath = path.join(parsedDir, parsedFiles[parsedFiles.length - 1]);
    console.log(`📄 Using existing parsed catalog: ${path.basename(parsedPath)}`);
    
  } else {
    // Download step
    if (!parseOnly) {
      const downloadResult = await downloadCurrentCatalog();
      
      if (!downloadResult.success) {
        console.error('❌ Failed to download current catalog:', downloadResult.error);
        process.exit(1);
      }
      
      catalogPath = downloadResult.filePath!;
      console.log(`✅ Downloaded: ${path.basename(catalogPath)}`);
    } else {
      // Find the most recent downloaded catalog
      const files = await fs.readdir(__dirname);
      const catalogFiles = files.filter(f => f.startsWith('catalog-current-') && f.endsWith('.pdf'));
      
      if (catalogFiles.length === 0) {
        console.error('❌ No current catalog PDF found. Run without --parse-only first.');
        process.exit(1);
      }
      
      catalogPath = path.join(__dirname, catalogFiles.sort().pop()!);
      console.log(`📄 Using existing catalog: ${path.basename(catalogPath)}`);
    }
    
    // Parse step
    const parseResult = await parseCurrentCatalog(catalogPath);
    
    if (!parseResult.success) {
      console.error('❌ Failed to parse catalog:', parseResult.error);
      process.exit(1);
    }
    
    parsedPath = parseResult.outputPath!;
    console.log('✅ Parsing completed successfully!');
    console.log(`📊 Results: ${parseResult.coursesFound} courses, ${parseResult.degreePlansFound} degree plans`);
    console.log(`📋 CCN Coverage: ${parseResult.ccnCoverage}%, CU Coverage: ${parseResult.cuCoverage}%`);
  }
  
  // Test step
  const testResult = await testParsedCatalog(parsedPath);
  
  console.log('\n🧪 QUALITY TEST RESULTS:');
  console.log('========================');
  console.log(`📚 Total Courses: ${testResult.quality.totalCourses}`);
  console.log(`📝 With Descriptions: ${testResult.quality.coursesWithDescriptions} (${((testResult.quality.coursesWithDescriptions / testResult.quality.totalCourses) * 100).toFixed(1)}%)`);
  console.log(`🏷️  With CCN: ${testResult.quality.coursesWithCCN} (${((testResult.quality.coursesWithCCN / testResult.quality.totalCourses) * 100).toFixed(1)}%)`);
  console.log(`⭐ With CU: ${testResult.quality.coursesWithCU} (${((testResult.quality.coursesWithCU / testResult.quality.totalCourses) * 100).toFixed(1)}%)`);
  
  if (testResult.issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    testResult.issues.forEach(issue => console.log(`   • ${issue}`));
  } else {
    console.log('\n✅ All quality checks passed!');
  }
  
  console.log('\n🎉 Current catalog processing completed!');
  
  if (!testOnly) {
    console.log(`📁 Files created:`);
    if (!parseOnly && catalogPath) console.log(`   • ${path.basename(catalogPath)} (PDF)`);
    console.log(`   • ${path.basename(parsedPath)} (JSON)`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
