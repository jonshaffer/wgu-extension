#!/usr/bin/env node

/**
 * WGU Student Groups Data Ingestion Script
 * 
 * Ingests WGU Student Groups data for university-level communities.
 * Creates individual JSON files for each group in data/raw/wgu-student-groups/
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { WguStudentGroupFile } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'raw/wgu-student-groups');

async function ingestWguStudentGroupsData(): Promise<void> {
  console.log('🟢 Starting WGU Student Groups data ingestion...');

  // Ensure output directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Note: Individual files are already created manually from real WGU Student Groups data
  // This script would be used if we were fetching from an API or other data source
  
  const existingFiles = await fs.readdir(DATA_DIR);
  const jsonFiles = existingFiles.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} existing WGU Student Group files:`);
  for (const file of jsonFiles) {
    console.log(`  - ${file}`);
  }

  // Validate each file structure
  for (const filename of jsonFiles) {
    const filePath = resolve(DATA_DIR, filename);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const groupData: WguStudentGroupFile = JSON.parse(content);
      
      // Basic validation
      if (!groupData.id || !groupData.name || !groupData.category || !groupData.url) {
        console.warn(`⚠️  Warning: File ${filename} is missing required fields`);
      } else {
        console.log(`✅ Validated: ${groupData.name} (${groupData.type} group)`);
      }
    } catch (error) {
      console.error(`❌ Error validating ${filename}:`, error);
    }
  }

  console.log('✅ WGU Student Groups data ingestion completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestWguStudentGroupsData().catch(console.error);
}

export { ingestWguStudentGroupsData };
