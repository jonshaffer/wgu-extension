#!/usr/bin/env node

/**
 * Main Data Pipeline Orchestrator
 * 
 * Runs the complete data pipeline: ingestion → transformation → output
 */

import { ingestDiscordData } from '../discord/scripts/ingest-discord.js';
import { ingestRedditData } from '../reddit/scripts/ingest-reddit.js';
import { ingestWguConnectData } from '../wgu-connect/scripts/ingest-wgu-connect.js';
import { ingestWguStudentGroupsData } from '../wgu-student-groups/scripts/ingest-wgu-student-groups.js';
import { ingestCatalogData } from './ingest-catalog.js';
import { transformUnifiedData } from '../unified/scripts/transform-unified.js';

async function runDataPipeline(): Promise<void> {
  console.log('🚀 Starting Community Data Pipeline...\n');

  try {
    // Phase 1: Ingestion
    console.log('📥 Phase 1: Data Ingestion');
    await Promise.all([
      ingestDiscordData(),
      ingestRedditData(),
      ingestWguConnectData(),
      ingestWguStudentGroupsData(),
      ingestCatalogData()
    ]);
    console.log('✅ Ingestion complete\n');

    // Phase 2: Transformation
    console.log('🔄 Phase 2: Data Transformation');
    await transformUnifiedData();
    console.log('✅ Transformation complete\n');

    console.log('🎉 Community Data Pipeline completed successfully!');
    console.log('\nNext steps:');
    console.log('  - Review generated files in public/');
    console.log('  - Extension can now use unified-community-data.json');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDataPipeline();
}

export { runDataPipeline };
