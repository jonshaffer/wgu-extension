#!/usr/bin/env tsx

/**
 * WGU Catalog Checker
 * 
 * Checks for new WGU institutional catalogs and downloads them automatically.
 * Can be run locally or in CI/CD environments.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import https from 'https';
import { URL } from 'url';

// Configuration
const WGU_CATALOG_BASE_URL = 'https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog';
const CATALOG_DIR = './data/catalogs/pdfs';
const TIMEOUT_MS = 30000;

// Month names for filename patterns
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

interface CatalogCandidate {
  url: string;
  filename: string;
  pattern: string;
}

interface CheckResult {
  date: string;
  newCatalogs: string[];
  totalCatalogs: number;
  checkedUrls: string[];
  errors: string[];
}

/**
 * Check if a URL exists (returns 200 status)
 */
async function checkUrlExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Download a file from URL
 */
async function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.open(filepath, 'w').then(handle => handle.createWriteStream());
    
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      file.then(stream => {
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          resolve();
        });
        stream.on('error', reject);
      }).catch(reject);
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error(`Download timeout for ${url}`));
    });
  });
}

/**
 * Get list of existing catalog files
 */
async function getExistingCatalogs(): Promise<string[]> {
  try {
    const files = await fs.readdir(CATALOG_DIR);
    return files
      .filter(f => f.endsWith('.pdf'))
      .map(f => f.replace('.pdf', ''));
  } catch (error) {
    console.warn('📂 Catalog directory not found, will be created');
    return [];
  }
}

/**
 * Generate catalog candidates to check
 */
function generateCatalogCandidates(): CatalogCandidate[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Check current month and previous month
  const monthsToCheck = [
    { year: currentYear, month: currentMonth },
    { year: currentMonth === 1 ? currentYear - 1 : currentYear, month: currentMonth === 1 ? 12 : currentMonth - 1 },
  ];

  const candidates: CatalogCandidate[] = [];

  for (const { year, month } of monthsToCheck) {
    const monthStr = String(month).padStart(2, '0');
    const monthName = MONTH_NAMES[month - 1];

    // Pattern 1: catalog-YYYY-MM.pdf
    candidates.push({
      url: `${WGU_CATALOG_BASE_URL}/${year}/catalog-${year}-${monthStr}.pdf`,
      filename: `catalog-${year}-${monthStr}.pdf`,
      pattern: 'numeric'
    });

    // Pattern 2: catalog-monthYYYY.pdf
    candidates.push({
      url: `${WGU_CATALOG_BASE_URL}/${year}/catalog-${monthName}${year}.pdf`,
      filename: `catalog-${monthName}${year}.pdf`,
      pattern: 'month-name'
    });

    // Pattern 3: catalog-current-YYYY-MM-DD.pdf (for very recent)
    if (year === currentYear) {
      const day = String(now.getDate()).padStart(2, '0');
      candidates.push({
        url: `${WGU_CATALOG_BASE_URL}/${year}/catalog-current-${year}-${monthStr}-${day}.pdf`,
        filename: `catalog-current-${year}-${monthStr}-${day}.pdf`,
        pattern: 'current-date'
      });
    }
  }

  return candidates;
}

/**
 * Main catalog checking function
 */
async function checkForNewCatalogs(): Promise<CheckResult> {
  console.log('🔍 WGU Catalog Checker Starting...');
  console.log(`📅 Checking for catalogs as of ${new Date().toISOString()}`);

  // First, validate the catalog page structure
  console.log('🔍 Validating catalog page structure...');
  try {
    const { checkCatalogPage } = await import('./check-wgu-catalog-page.js');
    const pageInfo = await checkCatalogPage();
    
    if (!pageInfo.pageAccessible || !pageInfo.pageStructureValid) {
      console.warn('⚠️ WGU catalog page validation failed, proceeding with standard checks');
    } else if (pageInfo.currentCatalogUrl && pageInfo.currentCatalogFilename) {
      console.log(`📄 Current catalog on WGU site: ${pageInfo.currentCatalogFilename}`);
      
      // Add the current catalog from the page to our check list if it's not already there
      const currentFromPage = pageInfo.currentCatalogFilename.replace('.pdf', '');
      console.log(`🎯 Will prioritize checking: ${currentFromPage}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not validate catalog page, proceeding with standard checks:', error);
  }

  // Ensure catalog directory exists
  await fs.mkdir(CATALOG_DIR, { recursive: true });

  const existingCatalogs = await getExistingCatalogs();
  const candidates = generateCatalogCandidates();
  
  console.log(`📁 Found ${existingCatalogs.length} existing catalogs`);
  console.log(`🎯 Checking ${candidates.length} potential new catalogs...`);

  const result: CheckResult = {
    date: new Date().toISOString(),
    newCatalogs: [],
    totalCatalogs: existingCatalogs.length,
    checkedUrls: [],
    errors: []
  };

  // Filter out candidates that already exist
  const newCandidates = candidates.filter(c => 
    !existingCatalogs.includes(c.filename.replace('.pdf', ''))
  );

  if (newCandidates.length === 0) {
    console.log('✅ All potential catalogs already exist locally');
    return result;
  }

  console.log(`🔍 Checking ${newCandidates.length} new candidates:`);

  // Check each candidate
  for (const candidate of newCandidates) {
    console.log(`   🔗 ${candidate.pattern}: ${candidate.filename}`);
    result.checkedUrls.push(candidate.url);

    try {
      const exists = await checkUrlExists(candidate.url);
      if (exists) {
        console.log(`   ✅ Found: ${candidate.filename}`);

        // Determine standardized filename (catalog-YYYY-MM.pdf)
        let standardizedFilename = candidate.filename;
        const numericMatch = candidate.filename.match(/^catalog-(\d{4})-(\d{2})\.pdf$/i);
        const monthNameMatch = candidate.filename.match(/^catalog-([a-z]+)(\d{4})\.pdf$/i);
        const currentDateMatch = candidate.filename.match(/^catalog-current-(\d{4})-(\d{2})-(\d{2})\.pdf$/i);

        if (numericMatch) {
          const [, year, month] = numericMatch;
          standardizedFilename = `catalog-${year}-${month}.pdf`;
        } else if (monthNameMatch) {
          const [, monthName, year] = monthNameMatch;
          const MONTH_NAMES = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          const idx = MONTH_NAMES.indexOf(monthName.toLowerCase());
          if (idx !== -1) {
            const month = String(idx + 1).padStart(2, '0');
            standardizedFilename = `catalog-${year}-${month}.pdf`;
          }
        } else if (currentDateMatch) {
          const [, year, month] = currentDateMatch;
          standardizedFilename = `catalog-${year}-${month}.pdf`;
        }

        // If a standardized file already exists, skip downloading duplicate
        const standardizedPath = resolve(CATALOG_DIR, standardizedFilename);
        try {
          const st = await fs.stat(standardizedPath);
          if (st && st.size > 0) {
            console.log(`   📄 Already have standardized file: ${standardizedFilename} — skipping download`);
            result.totalCatalogs++;
            continue;
          }
        } catch {
          // File does not exist -> proceed to download
        }

        // Download directly to standardized path
        console.log(`   📥 Downloading to: ${standardizedPath}`);
        await downloadFile(candidate.url, standardizedPath);
        
        // Verify the download
        const stats = await fs.stat(standardizedPath);
        if (stats.size < 1000) {
          throw new Error('Downloaded file is too small (< 1KB)');
        }
        
        console.log(`   ✅ Downloaded: ${standardizedFilename} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
        result.newCatalogs.push(standardizedFilename);
        result.totalCatalogs++;
      } else {
        console.log(`   ❌ Not found: ${candidate.filename}`);
      }
    } catch (error) {
      const errorMsg = `Failed to process ${candidate.filename}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      
      // Clean up partial download
      const filepath = resolve(CATALOG_DIR, candidate.filename);
      try {
        await fs.unlink(filepath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // Summary
  console.log('\n📊 SUMMARY');
  console.log(`✅ New catalogs found: ${result.newCatalogs.length}`);
  console.log(`📁 Total catalogs: ${result.totalCatalogs}`);
  console.log(`🔍 URLs checked: ${result.checkedUrls.length}`);
  console.log(`❌ Errors: ${result.errors.length}`);

  if (result.newCatalogs.length > 0) {
    console.log('\n🎉 NEW CATALOGS:');
    result.newCatalogs.forEach(catalog => console.log(`   📄 ${catalog}`));
  }

  if (result.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    result.errors.forEach(error => console.log(`   ❌ ${error}`));
  }

  return result;
}

/**
 * CLI interface
 */
async function main() {
  try {
    const result = await checkForNewCatalogs();
    
    // Write results to file for CI/CD
    const resultsFile = 'catalog-check-results.json';
    await fs.writeFile(resultsFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);

    // Exit with appropriate code
    if (result.errors.length > 0) {
      console.log('\n⚠️  Some errors occurred during checking');
      process.exit(1);
    } else if (result.newCatalogs.length > 0) {
      console.log('\n🎉 New catalogs found and downloaded successfully!');
      process.exit(0);
    } else {
      console.log('\n✅ No new catalogs found - everything up to date');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkForNewCatalogs };
