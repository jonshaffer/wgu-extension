#!/usr/bin/env tsx

/**
 * Generate Health Report for Catalog Parsing
 * 
 * Creates a detailed health report after parsing a catalog
 */

import fs from 'fs/promises';
import path from 'path';
import { ParserHealthAnalyzer } from './health.js';

interface ReportOptions {
  format?: 'markdown' | 'json' | 'both';
  outputDir?: string;
  includeHistory?: boolean;
}

async function generateHealthReport(catalogFile: string, options: ReportOptions = {}) {
  const {
    format = 'markdown',
    outputDir = 'analytics/reports',
    includeHistory = true
  } = options;

  const filename = path.basename(catalogFile);
  const baseFilename = filename.replace('.pdf', '');
  
  console.log(`📊 Generating health report for ${filename}...`);

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Load the parsed catalog data
    const parsedPath = path.join('sources/catalogs', `${baseFilename}.json`);
    let parsedData;
    
    try {
      const content = await fs.readFile(parsedPath, 'utf-8');
      parsedData = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Could not find parsed data at ${parsedPath}`);
      console.error('   Run catalog parsing first: make parse-catalog FILE=' + catalogFile);
      process.exit(1);
    }

    // Create health analyzer
    const analyzer = new ParserHealthAnalyzer(outputDir);

    // Analyze the parsed data
    const metrics = await analyzer.analyzeParseResult(
      parsedData,
      filename,
      parsedData.metadata?.parsingTimeMs || 0
    );

    // Generate reports
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'markdown' || format === 'both') {
      const mdReport = await analyzer.generateReport(metrics);
      const mdPath = path.join(outputDir, `${baseFilename}-${timestamp}.md`);
      await fs.writeFile(mdPath, mdReport);
      console.log(`📝 Markdown report saved: ${mdPath}`);
    }

    if (format === 'json' || format === 'both') {
      const jsonPath = path.join(outputDir, `${baseFilename}-${timestamp}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(metrics, null, 2));
      console.log(`📊 JSON metrics saved: ${jsonPath}`);
    }

    // Check for alerts
    const alerts = await analyzer.checkAlerts(metrics);
    if (alerts.length > 0) {
      console.log('\n⚠️  Health Alerts:');
      alerts.forEach(alert => console.log(`   - ${alert}`));
    }

    // Show summary
    console.log('\n📈 Health Summary:');
    console.log(`   Courses: ${metrics.metrics.coursesFound}`);
    console.log(`   CCN Coverage: ${metrics.metrics.ccnCoverage}%`);
    console.log(`   Description Coverage: ${metrics.metrics.descriptionCoverage}%`);
    console.log(`   Parse Time: ${(metrics.metrics.parseTimeMs / 1000).toFixed(1)}s`);
    console.log(`   Warnings: ${metrics.warnings.length}`);
    console.log(`   Errors: ${metrics.errors.length}`);

    // Generate comparison report if history exists
    if (includeHistory) {
      const trends = await analyzer.detectTrends(metrics);
      if (trends.length > 0) {
        console.log('\n📊 Trends:');
        trends.forEach(trend => {
          const icon = trend.trend === 'improving' ? '📈' : 
                       trend.trend === 'degrading' ? '📉' : '➡️';
          console.log(`   ${icon} ${trend.metric}: ${trend.changePercent.toFixed(1)}% change`);
        });
      }
    }

    console.log('\n✅ Health report complete!');

  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: generate-report.ts <catalog-file> [--format=markdown|json|both] [--output-dir=path]');
    console.error('Example: generate-report.ts sources/catalogs/catalog-2025-08.pdf --format=both');
    process.exit(1);
  }

  const catalogFile = args[0];
  const options: ReportOptions = {};

  // Parse options
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as any;
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg === '--no-history') {
      options.includeHistory = false;
    }
  });

  await generateHealthReport(catalogFile, options);
}

// Export for programmatic use
export { generateHealthReport };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}