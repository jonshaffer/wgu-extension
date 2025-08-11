#!/usr/bin/env tsx

/**
 * WGU Catalog Page Checker
 * 
 * Scrapes the WGU institutional catalog page to:
 * 1. Verify the page URL is still valid
 * 2. Extract the current catalog URL and filename
 * 3. Validate our URL patterns are still correct
 * 4. Detect any structural changes to the page
 */

import https from 'https';
import { URL } from 'url';

// Configuration
const WGU_CATALOG_PAGE_URL = 'https://www.wgu.edu/about/institutional-catalog.html';
const EXPECTED_BASE_URL = 'https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog';
const TIMEOUT_MS = 30000;

interface CatalogPageInfo {
  pageUrl: string;
  pageAccessible: boolean;
  currentCatalogUrl?: string;
  currentCatalogFilename?: string;
  currentCatalogTitle?: string;
  extractedYear?: string;
  extractedMonth?: string;
  baseUrlMatches: boolean;
  urlPatternValid: boolean;
  pageStructureValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Fetch HTML content from URL
 */
async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'WGU-Extension-Catalog-Checker/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity'
      },
      timeout: TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });

    req.end();
  });
}

/**
 * Extract catalog information from HTML
 */
function extractCatalogInfo(html: string): Partial<CatalogPageInfo> {
  const info: Partial<CatalogPageInfo> = {
    errors: [],
    warnings: []
  };

  // Look for "Current Edition" section
  const currentEditionRegex = /<h2[^>]*>.*?Current Edition.*?<\/h2>/i;
  const currentEditionMatch = html.match(currentEditionRegex);
  
  if (!currentEditionMatch) {
    info.errors!.push('Could not find "Current Edition" section on page');
    info.pageStructureValid = false;
    return info;
  }

  // Extract the section containing the current catalog link
  // Look for the next <p> tag after "Current Edition" that contains a link
  const sectionRegex = /<h2[^>]*>.*?Current Edition.*?<\/h2>[\s\S]*?<p[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/p>/i;
  const sectionMatch = html.match(sectionRegex);

  if (!sectionMatch) {
    info.errors!.push('Could not extract catalog link from Current Edition section');
    info.pageStructureValid = false;
    return info;
  }

  const catalogPath = sectionMatch[1];
  const catalogTitle = sectionMatch[2].trim();

  // Handle relative URLs
  let catalogUrl = catalogPath;
  if (catalogPath.startsWith('/')) {
    catalogUrl = 'https://www.wgu.edu' + catalogPath;
  }

  info.currentCatalogUrl = catalogUrl;
  info.currentCatalogTitle = catalogTitle;
  info.pageStructureValid = true;

  // Extract filename from URL
  const urlParts = catalogUrl.split('/');
  info.currentCatalogFilename = urlParts[urlParts.length - 1];

  // Check if base URL matches expected pattern
  info.baseUrlMatches = catalogUrl.startsWith(EXPECTED_BASE_URL);

  // Extract year and month from URL or filename
  const yearMonthRegex = /(\d{4})\/.*?catalog.*?(\w+).*?(\d{4})|catalog.*?(\w+).*?(\d{4})|catalog.*?(\d{4}).*?(\d{2})/i;
  const yearMonthMatch = catalogUrl.match(yearMonthRegex) || info.currentCatalogFilename!.match(yearMonthRegex);
  
  if (yearMonthMatch) {
    // Try different capture groups based on the pattern matched
    if (yearMonthMatch[1] && yearMonthMatch[2] && yearMonthMatch[3]) {
      // Pattern: 2025/catalog-august-2025.pdf
      info.extractedYear = yearMonthMatch[1] || yearMonthMatch[3];
      info.extractedMonth = yearMonthMatch[2];
    } else if (yearMonthMatch[4] && yearMonthMatch[5]) {
      // Pattern: catalog-august2025.pdf
      info.extractedMonth = yearMonthMatch[4];
      info.extractedYear = yearMonthMatch[5];
    } else if (yearMonthMatch[6] && yearMonthMatch[7]) {
      // Pattern: catalog-2025-08.pdf
      info.extractedYear = yearMonthMatch[6];
      const monthNumber = parseInt(yearMonthMatch[7]);
      const months = ['january', 'february', 'march', 'april', 'may', 'june',
                     'july', 'august', 'september', 'october', 'november', 'december'];
      info.extractedMonth = months[monthNumber - 1];
    }
  }

  // Validate URL pattern matches our expectations
  const validPatterns = [
    /catalog-\d{4}-\d{2}\.pdf$/,           // catalog-2025-08.pdf
    /catalog-\w+\d{4}\.pdf$/,              // catalog-august2025.pdf
    /catalog-current-\d{4}-\d{2}-\d{2}\.pdf$/, // catalog-current-2025-08-09.pdf
    /catalog-\w+-\d{4}\.pdf$/              // catalog-august-2025.pdf
  ];

  info.urlPatternValid = validPatterns.some(pattern => 
    pattern.test(info.currentCatalogFilename!)
  );

  if (!info.urlPatternValid) {
    info.warnings!.push(`Catalog filename "${info.currentCatalogFilename}" doesn't match expected patterns`);
  }

  if (!info.baseUrlMatches) {
    info.warnings!.push(`Catalog base URL has changed. Expected: ${EXPECTED_BASE_URL}, Got: ${catalogUrl.substring(0, EXPECTED_BASE_URL.length)}`);
  }

  return info;
}

/**
 * Main page checking function
 */
async function checkCatalogPage(): Promise<CatalogPageInfo> {
  console.log('🔍 WGU Catalog Page Checker Starting...');
  console.log(`📄 Checking page: ${WGU_CATALOG_PAGE_URL}`);

  const result: CatalogPageInfo = {
    pageUrl: WGU_CATALOG_PAGE_URL,
    pageAccessible: false,
    baseUrlMatches: false,
    urlPatternValid: false,
    pageStructureValid: false,
    errors: [],
    warnings: []
  };

  try {
    // Fetch the catalog page
    console.log('📥 Fetching catalog page...');
    const html = await fetchHtml(WGU_CATALOG_PAGE_URL);
    result.pageAccessible = true;
    console.log(`✅ Page accessible (${(html.length / 1024).toFixed(1)}KB)`);

    // Extract catalog information
    console.log('🔍 Extracting catalog information...');
    const catalogInfo = extractCatalogInfo(html);
    Object.assign(result, catalogInfo);

    if (result.currentCatalogUrl) {
      console.log(`📄 Current catalog: ${result.currentCatalogTitle}`);
      console.log(`🔗 Catalog URL: ${result.currentCatalogUrl}`);
      console.log(`📋 Filename: ${result.currentCatalogFilename}`);
      
      if (result.extractedYear && result.extractedMonth) {
        console.log(`📅 Extracted date: ${result.extractedMonth} ${result.extractedYear}`);
      }
    }

  } catch (error) {
    result.pageAccessible = false;
    result.errors.push(`Failed to fetch catalog page: ${error}`);
    console.error(`❌ ${error}`);
  }

  // Validation summary
  console.log('\n📊 VALIDATION RESULTS');
  console.log(`✅ Page accessible: ${result.pageAccessible}`);
  console.log(`✅ Page structure valid: ${result.pageStructureValid}`);
  console.log(`✅ Base URL matches: ${result.baseUrlMatches}`);
  console.log(`✅ URL pattern valid: ${result.urlPatternValid}`);

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(error => console.log(`   ❌ ${error}`));
  }

  return result;
}

/**
 * Generate summary report
 */
function generateReport(info: CatalogPageInfo): string {
  let report = `# WGU Catalog Page Check Report\n\n`;
  report += `**Check Date:** ${new Date().toISOString()}\n`;
  report += `**Page URL:** ${info.pageUrl}\n\n`;

  // Status
  report += `## 📊 Status\n\n`;
  report += `| Check | Status | Details |\n`;
  report += `|-------|--------|----------|\n`;
  report += `| Page Accessible | ${info.pageAccessible ? '✅' : '❌'} | ${info.pageAccessible ? 'OK' : 'Failed'} |\n`;
  report += `| Page Structure | ${info.pageStructureValid ? '✅' : '❌'} | ${info.pageStructureValid ? 'Valid' : 'Invalid'} |\n`;
  report += `| Base URL Match | ${info.baseUrlMatches ? '✅' : '⚠️'} | ${info.baseUrlMatches ? 'Expected' : 'Changed'} |\n`;
  report += `| URL Pattern | ${info.urlPatternValid ? '✅' : '⚠️'} | ${info.urlPatternValid ? 'Known pattern' : 'New pattern'} |\n\n`;

  // Current catalog info
  if (info.currentCatalogUrl) {
    report += `## 📄 Current Catalog\n\n`;
    report += `**Title:** ${info.currentCatalogTitle}\n`;
    report += `**URL:** ${info.currentCatalogUrl}\n`;
    report += `**Filename:** ${info.currentCatalogFilename}\n`;
    
    if (info.extractedYear && info.extractedMonth) {
      report += `**Date:** ${info.extractedMonth} ${info.extractedYear}\n`;
    }
    report += `\n`;
  }

  // Issues
  if (info.warnings.length > 0 || info.errors.length > 0) {
    report += `## ⚠️ Issues\n\n`;
    
    if (info.errors.length > 0) {
      report += `### ❌ Errors\n`;
      info.errors.forEach(error => report += `- ${error}\n`);
      report += `\n`;
    }
    
    if (info.warnings.length > 0) {
      report += `### ⚠️ Warnings\n`;
      info.warnings.forEach(warning => report += `- ${warning}\n`);
      report += `\n`;
    }
  }

  // Recommendations
  if (!info.pageAccessible || !info.pageStructureValid) {
    report += `## 🔧 Recommendations\n\n`;
    report += `- [ ] Verify WGU catalog page URL hasn't changed\n`;
    report += `- [ ] Check if page structure has been updated\n`;
    report += `- [ ] Update catalog checker patterns if needed\n`;
    report += `- [ ] Test catalog download functionality\n\n`;
  } else if (!info.baseUrlMatches || !info.urlPatternValid) {
    report += `## 🔧 Recommendations\n\n`;
    report += `- [ ] Update catalog checker URL patterns\n`;
    report += `- [ ] Test with new URL structure\n`;
    report += `- [ ] Verify downloads still work\n\n`;
  } else {
    report += `## ✅ All Checks Passed\n\n`;
    report += `The WGU catalog page structure and URLs match expected patterns.\n\n`;
  }

  return report;
}

/**
 * CLI interface
 */
async function main() {
  try {
    const info = await checkCatalogPage();
    
    // Save results
    const resultsFile = 'catalog-page-check-results.json';
    const reportFile = 'catalog-page-check-report.md';
    
    await Promise.all([
      import('fs').then(fs => fs.promises.writeFile(resultsFile, JSON.stringify(info, null, 2))),
      import('fs').then(fs => fs.promises.writeFile(reportFile, generateReport(info)))
    ]);
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    console.log(`📋 Report saved to: ${reportFile}`);

    // Exit with appropriate code
    if (info.errors.length > 0) {
      console.log('\n❌ Page check failed with errors');
      process.exit(1);
    } else if (info.warnings.length > 0) {
      console.log('\n⚠️  Page check completed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ Page check completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { checkCatalogPage, CatalogPageInfo };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
