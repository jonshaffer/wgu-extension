#!/usr/bin/env node

/**
 * Discord Data Ingestion Script
 * 
 * Ingests Discord community data from public source files and creates
 * individual discord.{id}.json files and channel mappings.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { DiscordCommunityFile } from '../types/raw-discord.ts';
import { isDiscordCommunityFile } from '../types/raw-discord.ts';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const DISCORD_DIR = resolve(DATA_DIR, 'discord');

async function ingestDiscordData(): Promise<void> {
  console.log('🔵 Starting Discord data ingestion...');

  // Ensure Discord directory exists
  await fs.mkdir(DISCORD_DIR, { recursive: true });

  console.log('📥 Discord data ingestion now validates existing files');
  console.log('💡 To add new Discord communities, create JSON files directly in data/raw/discord/');
  
  // Validate existing files
  await validateExistingFiles();
}

async function validateExistingFiles(): Promise<void> {
  try {
    const existingFiles = await fs.readdir(DISCORD_DIR);
    const jsonFiles = existingFiles.filter(f => f.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} existing Discord community files:`);
    
    for (const filename of jsonFiles) {
      const filePath = resolve(DISCORD_DIR, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (!isDiscordCommunityFile(parsed)) {
          console.warn(`⚠️  Warning: File ${filename} is missing required fields or has invalid structure`);
          continue;
        }
        const communityData: DiscordCommunityFile = parsed;
        console.log(`✅ Validated: ${communityData.name} (${communityData.channels?.length || 0} channels)`);
      } catch (error) {
        console.error(`❌ Error validating ${filename}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error validating existing files:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDiscordData().catch(console.error);
}

export { ingestDiscordData };
