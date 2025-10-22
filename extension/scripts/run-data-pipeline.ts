#!/usr/bin/env node

/**
 * Main Data Pipeline Orchestrator
 * 
 * Runs the complete data pipeline: ingestion → transformation → output
 */

import { ingestDiscordData } from './ingest-discord.js';
import { ingestRedditData } from './ingest-reddit.js';
import { ingestWguConnectData } from './ingest-wgu-connect.js';
import { transformUnifiedData } from './transform-unified.js';

async function runDataPipeline(): Promise<void> {
  console.log('🚀 Starting Community Data Pipeline...\n');

  try {
    // Phase 1: Ingestion
    console.log('📥 Phase 1: Data Ingestion');
    await Promise.all([
      ingestDiscordData(),
      ingestRedditData(),
      ingestWguConnectData()
    ]);
    console.log('✅ Ingestion complete\n');

    // Phase 2: Transformation
    console.log('🔄 Phase 2: Data Transformation');
    await transformUnifiedData();
    console.log('✅ Transformation complete\n');

    console.log('🎉 Community Data Pipeline completed successfully!');
    console.log('\nNext steps:');
    console.log('  - Review generated files in data/processed/');
    console.log('  - Sync data to Firestore using functions/sync-github-to-firestore.ts');
    console.log('  - Extension will use production search endpoint');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDataPipeline();
}

export { runDataPipeline };
