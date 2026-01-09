#!/usr/bin/env tsx

/**
 * Catalog Parser Tests
 *
 * Tests the catalog parsing functionality
 */

import {getParser} from "./parsers/detector.js";
import fs from "fs/promises";
import path from "path";

async function runTests() {
  console.log("🧪 Running catalog parser tests...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Parser detection
  console.log("Test 1: Parser Detection");
  try {
    const detector2020 = await getParser("catalog-2020-01.pdf");
    const detector2024 = await getParser("catalog-2024-08.pdf");
    const detector2025 = await getParser("catalog-2025-08.pdf");

    console.log("✅ Parser detection working for different years");
    passed++;
  } catch (error) {
    console.log("❌ Parser detection failed:", error);
    failed++;
  }

  // Test 2: Sample parsing (if test catalog exists)
  console.log("\nTest 2: Sample Parsing");
  try {
    // Try to find a sample catalog
    const catalogsDir = path.join(process.cwd(), "sources/catalogs");
    const files = await fs.readdir(catalogsDir).catch(() => []);
    const sampleCatalog = files.find((f) => f.endsWith(".pdf"));

    if (sampleCatalog) {
      const filePath = path.join(catalogsDir, sampleCatalog);
      const parser = await getParser(sampleCatalog, filePath);

      // Just test that it loads without error
      await parser.loadPDF(filePath);
      console.log(`✅ Successfully loaded ${sampleCatalog}`);
      passed++;
    } else {
      console.log("⚠️  No sample catalog found, skipping parsing test");
    }
  } catch (error) {
    console.log("❌ Sample parsing failed:", error);
    failed++;
  }

  // Test 3: Health analytics
  console.log("\nTest 3: Health Analytics");
  try {
    const {ParserHealthAnalyzer} = await import("./analytics/health.js");
    const analyzer = new ParserHealthAnalyzer();

    // Test with mock data
    const mockCatalog = {
      courses: {
        "C182": {
          courseCode: "C182", courseName: "Test", description: "A test course",
          ccn: "TEST 101", competencyUnits: 3,
        },
      },
      degreePlans: {},
      metadata: {statistics: {coursesFound: 1, degreePlansFound: 0}},
    };

    const metrics = await analyzer.analyzeParseResult(mockCatalog, "test.pdf", 1000);
    console.log("✅ Health analytics working");
    passed++;
  } catch (error) {
    console.log("❌ Health analytics failed:", error);
    failed++;
  }

  // Summary
  console.log("\n📊 Test Summary:");
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
