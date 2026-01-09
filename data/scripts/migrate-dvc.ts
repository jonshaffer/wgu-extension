#!/usr/bin/env tsx

/**
 * DVC Migration Script
 *
 * Updates DVC tracking for the new directory structure
 */

import {execSync} from "child_process";
import fs from "fs/promises";
import path from "path";

async function migrateDVC() {
  console.log("🔄 Migrating DVC files to new structure...\n");

  // Define the migrations
  const migrations = [
    {from: "catalogs/pdfs/", to: "sources/catalogs/"},
    {from: "discord/raw/", to: "sources/discord/"},
    {from: "reddit/raw/", to: "sources/reddit/"},
    {from: "wgu-connect/raw/", to: "sources/wgu-connect/"},
  ];

  for (const {from, to} of migrations) {
    console.log(`📁 Migrating ${from} → ${to}`);

    try {
      // Check if source directory exists
      await fs.access(from);

      // List all files in the source directory
      const files = await fs.readdir(from);
      const dataFiles = files.filter((f) => !f.endsWith(".dvc"));

      for (const file of dataFiles) {
        const sourcePath = path.join(from, file);
        const destPath = path.join(to, file);

        // Check if file is tracked by DVC
        try {
          execSync(`dvc status ${sourcePath}`, {encoding: "utf-8"});

          // File is tracked, add it to new location
          console.log(`  📄 Adding ${file} to DVC at new location...`);
          execSync(`dvc add ${destPath}`, {encoding: "utf-8"});

          // Remove old DVC file
          const oldDvcFile = `${sourcePath}.dvc`;
          if (await fs.access(oldDvcFile).then(() => true).catch(() => false)) {
            await fs.unlink(oldDvcFile);
            console.log(`  🗑️  Removed old DVC file: ${oldDvcFile}`);
          }
        } catch {
          // File not tracked by DVC, skip
          console.log(`  ⏭️  ${file} not tracked by DVC, skipping...`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Source directory ${from} not found, skipping...`);
    }
  }

  console.log("\n✅ DVC migration complete!");
  console.log("\n📝 Next steps:");
  console.log("  1. Review the changes: git status");
  console.log("  2. Commit the new .dvc files: git add sources/**/*.dvc && git commit -m \"chore: migrate DVC files to new structure\"");
  console.log("  3. Push DVC data: dvc push");
}

// Run the migration
migrateDVC().catch(console.error);
