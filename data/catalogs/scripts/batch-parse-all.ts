#!/usr/bin/env tsx
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const pdfsDir = path.join(__dirname, '../pdfs');
const parsedDir = path.join(__dirname, '../parsed');

// Get all PDF files
const pdfFiles = fs.readdirSync(pdfsDir)
  .filter(file => file.endsWith('.pdf') && file.startsWith('catalog-'))
  .sort();

console.log(`📚 Found ${pdfFiles.length} PDF files to parse\n`);

let successful = 0;
let failed = 0;
const failures: string[] = [];

// Parse each PDF
for (const [index, pdfFile] of pdfFiles.entries()) {
  const pdfPath = path.join(pdfsDir, pdfFile);
  const baseName = path.basename(pdfFile, '.pdf');
  const reportPath = path.join(parsedDir, `${baseName}.report.json`);
  
  // Check if report already exists
  if (fs.existsSync(reportPath)) {
    console.log(`⏭️  [${index + 1}/${pdfFiles.length}] Skipping ${pdfFile} - report already exists`);
    successful++;
    continue;
  }
  
  console.log(`🔄 [${index + 1}/${pdfFiles.length}] Parsing ${pdfFile}...`);
  
  try {
    // Run the parser
    execSync(`tsx ${path.join(__dirname, 'catalog-parser-unified.ts')} "${pdfPath}"`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    // Verify report was created
    if (fs.existsSync(reportPath)) {
      console.log(`✅ Successfully parsed ${pdfFile}`);
      successful++;
    } else {
      console.log(`❌ Failed to generate report for ${pdfFile}`);
      failed++;
      failures.push(pdfFile);
    }
  } catch (error) {
    console.error(`❌ Error parsing ${pdfFile}:`, error.message);
    failed++;
    failures.push(pdfFile);
  }
}

// Summary
console.log('\n📊 Parsing Summary:');
console.log(`✅ Successful: ${successful}`);
console.log(`❌ Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\n❌ Failed catalogs:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}

console.log('\n✨ All catalogs parsed successfully!');