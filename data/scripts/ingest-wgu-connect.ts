#!/usr/bin/env node

/**
 * WGU Connect Data Ingestion Script
 * 
 * Ingests WGU Connect group data for course-specific communities.
 * Creates individual JSON files for each group in data/raw/wgu-connect/
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { WguConnectGroupFile } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw/wgu-connect');

async function ingestWguConnectData(): Promise<void> {
  console.log('🟣 Starting WGU Connect data ingestion...');

  // Ensure output directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Note: Individual files are already created manually from real WGU Connect data
  // This script would be used if we were fetching from an API or other data source
  
  const existingFiles = await fs.readdir(DATA_DIR);
  const jsonFiles = existingFiles.filter(f => f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} existing WGU Connect group files:`);
  for (const file of jsonFiles) {
    console.log(`  - ${file}`);
  }

  // Validate each file structure
  for (const filename of jsonFiles) {
    const filePath = resolve(DATA_DIR, filename);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const groupData: WguConnectGroupFile = JSON.parse(content);
      
      // Basic validation
      if (!groupData.id || !groupData.name || !groupData.course_codes) {
        console.warn(`⚠️  Warning: File ${filename} is missing required fields`);
      } else {
        console.log(`✅ Validated: ${groupData.name} (${groupData.course_codes.join(', ')})`);
      }
    } catch (error) {
      console.error(`❌ Error validating ${filename}:`, error);
    }
  }

  console.log('✅ WGU Connect data ingestion completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestWguConnectData().catch(console.error);
}

export { ingestWguConnectData };
