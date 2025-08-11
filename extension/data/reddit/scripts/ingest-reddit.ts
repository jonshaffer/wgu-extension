#!/usr/bin/env tsx

/**
 * Reddit Data Ingestion Script
 * 
 * Processes Reddit community raw data files into a single processed file
 * - Validates raw data files
 * - Consolidates into single JSON output
 * - Ensures lowercase file naming
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import { RedditCommunity, isRedditCommunity } from '../types/index.js';

const RAW_DIR = resolve(process.cwd(), 'data/reddit/raw');
const PROCESSED_DIR = resolve(process.cwd(), 'data/reddit/processed');
const OUTPUT_FILE = resolve(PROCESSED_DIR, 'communities.json');

interface ProcessedRedditData {
  communities: RedditCommunity[];
  metadata: {
    totalCommunities: number;
    lastProcessed: string;
    sourceFiles: string[];
  };
}

async function ingestRedditData(): Promise<void> {
  console.log('🔴 Starting Reddit data ingestion...');

  // Ensure directories exist
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(PROCESSED_DIR, { recursive: true });

  // Process raw files into single output
  await processRawFiles();
}

async function processRawFiles(): Promise<void> {
  try {
    const existingFiles = await fs.readdir(RAW_DIR);
    const jsonFiles = existingFiles.filter(f => f.endsWith('.json')).sort();
    
    if (jsonFiles.length === 0) {
      console.warn('⚠️  No JSON files found in raw directory');
      return;
    }

    console.log(`📥 Processing ${jsonFiles.length} Reddit community files...`);
    
    const communities: RedditCommunity[] = [];
    const errors: string[] = [];
    const sourceFiles: string[] = [];

    for (const filename of jsonFiles) {
      console.log(`   Processing ${filename}...`);
      
      // Check lowercase naming convention
      if (filename !== filename.toLowerCase()) {
        errors.push(`File ${filename} should be lowercase`);
        continue;
      }

      const filePath = resolve(RAW_DIR, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const communityData = JSON.parse(content);
        
        // Validate using type guard
        if (!isRedditCommunity(communityData)) {
          errors.push(`File ${filename} has invalid structure`);
          console.error(`❌ Invalid structure: ${filename}`);
          continue;
        }

        // Additional filename validation - should match subreddit name (lowercase)
        const expectedFilename = `${communityData.subreddit.toLowerCase()}.json`;
        if (filename !== expectedFilename) {
          errors.push(`File ${filename} should be named ${expectedFilename} to match subreddit ${communityData.subreddit}`);
        }

        communities.push(communityData);
        sourceFiles.push(filename);
        console.log(`   ✅ ${communityData.name} (r/${communityData.subreddit})`);
        
      } catch (error) {
        const errorMsg = `Error processing ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      console.error(`\n❌ Found ${errors.length} errors:`);
      errors.forEach(error => console.error(`   - ${error}`));
      
      if (communities.length === 0) {
        console.error('No valid communities found, aborting...');
        process.exit(1);
      }
    }

    // Sort communities by hierarchy and name
    communities.sort((a, b) => {
      const hierarchyOrder = { university: 0, college: 1, program: 2, course: 3, community: 4 };
      const aOrder = hierarchyOrder[a.hierarchy.level as keyof typeof hierarchyOrder] ?? 5;
      const bOrder = hierarchyOrder[b.hierarchy.level as keyof typeof hierarchyOrder] ?? 5;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      return a.name.localeCompare(b.name);
    });

    // Create processed output
    const processedData: ProcessedRedditData = {
      communities,
      metadata: {
        totalCommunities: communities.length,
        lastProcessed: new Date().toISOString(),
        sourceFiles
      }
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(processedData, null, 2) + '\n', 'utf-8');
    
    console.log(`\n✅ Reddit data processed successfully!`);
    console.log(`   📁 Output: ${OUTPUT_FILE}`);
    console.log(`   📊 Communities: ${communities.length}`);
    console.log(`   📂 Source files: ${sourceFiles.length}`);
    
    // Summary by hierarchy level
    const byLevel = communities.reduce((acc, comm) => {
      acc[comm.hierarchy.level] = (acc[comm.hierarchy.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`   📈 By level:`);
    Object.entries(byLevel).forEach(([level, count]) => {
      console.log(`      ${level}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error processing raw files:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestRedditData().catch(console.error);
}

export { ingestRedditData };
