#!/usr/bin/env tsx

/**
 * Catalog Parser CLI
 *
 * Parses WGU catalog PDFs and generates structured data
 */

import {getParser} from "./parsers/detector.js";
import {ParserHealthAnalyzer} from "./analytics/health.js";
import path from "path";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: parse.ts <catalog-pdf-path>");
    console.error("Example: parse.ts sources/catalogs/catalog-2025-08.pdf");
    process.exit(1);
  }

  const filePath = args[0];
  const filename = path.basename(filePath);

  console.log(`📚 Parsing catalog: ${filename}\n`);

  try {
    // Get appropriate parser based on catalog format
    const parser = await getParser(filename, filePath);

    // Parse the catalog
    const startTime = Date.now();
    const result = await parser.parseCatalog(filePath);
    const parseTime = Date.now() - startTime;

    // Analyze health
    const healthAnalyzer = new ParserHealthAnalyzer();
    const healthMetrics = await healthAnalyzer.analyzeParseResult(
      result,
      filename,
      parseTime
    );

    // Check for alerts
    const alerts = await healthAnalyzer.checkAlerts(healthMetrics);
    if (alerts.length > 0) {
      console.log("\n⚠️  Alerts:");
      alerts.forEach((alert) => console.log(alert));
    }

    // Generate report
    const report = await healthAnalyzer.generateReport(healthMetrics);
    console.log("\n📊 Health Report:");
    console.log(report);

    console.log("\n✅ Parsing complete!");
    console.log(`   Courses: ${result.metadata.statistics.coursesFound}`);
    console.log(`   Degree Plans: ${result.metadata.statistics.degreePlansFound}`);
    console.log(`   Parse Time: ${(parseTime / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error("❌ Parsing failed:", error);
    process.exit(1);
  }
}

main();
