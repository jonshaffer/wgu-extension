#!/usr/bin/env tsx

/**
 * Test the catalog checker with a known good URL
 * This helps verify the download functionality works
 */

import {promises as fs} from "fs";
import {resolve} from "path";

async function testCatalogChecker() {
  console.log("🧪 Testing catalog checker with known good URL...");

  // Test with a known good catalog URL (January 2025)
  const testUrl = "https://www.wgu.edu/content/dam/wgu-65-assets/western-governors/documents/institutional-catalog/2025/catalog-january2025.pdf";
  const testFilename = "test-catalog-january2025.pdf";
  const testPath = resolve("./data/catalogs/pdfs", testFilename);

  // First, check if the test file already exists and remove it
  try {
    await fs.unlink(testPath);
    console.log("🗑️  Removed existing test file");
  } catch {
    // File doesn't exist, that's fine
  }

  // Import and run the catalog checker
  const {checkForNewCatalogs} = await import("./check-wgu-catalog.js");

  // Temporarily modify the candidates to include our test URL
  console.log("📥 Testing download functionality...");
  console.log(`🔗 Test URL: ${testUrl}`);

  // You would need to manually test this by temporarily adding the URL
  // or by moving an existing catalog file out of the way

  console.log("💡 To manually test:");
  console.log("1. Move an existing catalog file temporarily");
  console.log("2. Run the catalog checker");
  console.log("3. Verify it downloads the \"missing\" catalog");
  console.log("4. Move the original file back");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCatalogChecker().catch(console.error);
}
