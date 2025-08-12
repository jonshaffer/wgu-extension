#!/usr/bin/env npx tsx

/**
 * Unified Catalog Reporting Tool
 * 
 * Combines functionality from analyze-parsing-state.ts and generate-parsing-report.ts
 * Provides comprehensive analytics and README generation capabilities.
 */

import { CatalogReporter, printAnalyticsReport, updateReadme } from './lib/reporting.js';

interface CLIOptions {
  analytics?: boolean;
  readme?: boolean;
  all?: boolean;
  help?: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
  for (const arg of args) {
    switch (arg) {
      case '--analytics':
      case '-a':
        options.analytics = true;
        break;
      case '--readme':
      case '-r':
        options.readme = true;
        break;
      case '--all':
        options.all = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }
  
  // Default to analytics if no specific option provided
  if (!options.analytics && !options.readme && !options.all && !options.help) {
    options.analytics = true;
  }
  
  return options;
}

function printHelp() {
  console.log(`
🔍 WGU Catalog Reporting Tool

USAGE:
  npx tsx scripts/catalog-reporting.ts [OPTIONS]

OPTIONS:
  -a, --analytics    Display detailed parsing analytics (default)
  -r, --readme       Update README.md with parsing results table
      --all          Run both analytics and README update
  -h, --help         Show this help message

EXAMPLES:
  npx tsx scripts/catalog-reporting.ts                    # Show analytics
  npx tsx scripts/catalog-reporting.ts --analytics        # Show detailed analytics
  npx tsx scripts/catalog-reporting.ts --readme          # Update README.md
  npx tsx scripts/catalog-reporting.ts --all             # Do both
  
FEATURES:
  📊 Enhanced Analytics
    - Year-by-year parsing statistics
    - Quality metrics (CCN/CU coverage)
    - Enhanced parser tracking (program outcomes, certificates)
    - Overall dataset summaries
    
  📋 README Integration
    - Auto-generated parsing results table
    - Recent catalog summaries
    - Quality metrics display
    - Enhanced parser indicators

ABOUT:
  This tool replaces analyze-parsing-state.ts and generate-parsing-report.ts
  with a unified reporting system that supports both legacy and enhanced
  catalog parsing data.
`);
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help) {
    printHelp();
    return;
  }
  
  try {
    if (options.all) {
      console.log('🚀 Running comprehensive catalog reporting...\n');
      
      console.log('1️⃣  Generating Analytics Report');
      console.log('='.repeat(50));
      await printAnalyticsReport();
      
      console.log('\n\n2️⃣  Updating README.md');
      console.log('='.repeat(50));
      await updateReadme();
      
      console.log('\n✅ Comprehensive reporting complete!');
      
    } else if (options.readme) {
      console.log('📋 Updating README.md with parsing results...\n');
      await updateReadme();
      
    } else {
      // Default: analytics
      await printAnalyticsReport();
    }
    
  } catch (error) {
    console.error('❌ Error during reporting:', error);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main as runReporting };