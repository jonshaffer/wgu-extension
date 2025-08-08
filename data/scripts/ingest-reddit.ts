#!/usr/bin/env node

/**
 * Reddit Data Ingestion Script
 * 
 * Validates existing Reddit community data files in data/raw/reddit/
 * To add new communities, create JSON files directly in the directory.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { RedditCommunityFile } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const REDDIT_DIR = resolve(DATA_DIR, 'reddit');

async function ingestRedditData(): Promise<void> {
  console.log('🔴 Starting Reddit data ingestion...');

  // Ensure Reddit directory exists
  await fs.mkdir(REDDIT_DIR, { recursive: true });

  console.log('📥 Reddit data ingestion now validates existing files');
  console.log('💡 To add new Reddit communities, create JSON files directly in data/raw/reddit/');
  
  // Validate existing files
  await validateExistingFiles();
}

async function validateExistingFiles(): Promise<void> {
  try {
    const existingFiles = await fs.readdir(REDDIT_DIR);
    const jsonFiles = existingFiles.filter(f => f.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} existing Reddit community files:`);
    
    for (const filename of jsonFiles) {
      const filePath = resolve(REDDIT_DIR, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const communityData: RedditCommunityFile = JSON.parse(content);
        
        if (!communityData.subreddit || !communityData.name || !communityData.hierarchy) {
          console.warn(`⚠️  Warning: File ${filename} is missing required fields`);
        } else {
          console.log(`✅ Validated: ${communityData.name} (r/${communityData.subreddit})`);
        }
      } catch (error) {
        console.error(`❌ Error validating ${filename}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error validating existing files:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestRedditData().catch(console.error);
}

export { ingestRedditData };
