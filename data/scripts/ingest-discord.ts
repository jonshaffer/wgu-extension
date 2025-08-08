#!/usr/bin/env node

/**
 * Discord Data Ingestion Script
 * 
 * Ingests Discord community data into individual discord.{id}.json files.
 * Each file contains a single community with an empty channels array.
 * Currently supports manual data entry with plans for Discord API integration.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { DiscordCommunityFile, DiscordData } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const DISCORD_DIR = resolve(DATA_DIR, 'discord');

async function ingestDiscordData(): Promise<void> {
  console.log('🔵 Starting Discord data ingestion...');

  // For now, we'll use manually curated data
  // TODO: Integrate with Discord API for automated channel discovery
  
  const communities: DiscordCommunityFile[] = [
    {
      id: "948943218063265822",
      name: "WGU Computer Science",
      description: "Official WGU Computer Science student community",
      inviteUrl: "https://discord.gg/westerngovernors",
      hierarchy: {
        level: 'college',
        college: 'technology'
      },
      channels: [] // Start with empty channels array
    },
    {
      id: "123456789012345678", // Example ID
      name: "WGU Cybersecurity",
      description: "WGU Cybersecurity and Information Assurance students",
      inviteUrl: "https://discord.gg/wgu-cybersecurity",
      hierarchy: {
        level: 'program',
        college: 'technology',
        program: 'Cybersecurity and Information Assurance'
      },
      channels: [] // Start with empty channels array
    }
  ];

  // Ensure Discord directory exists
  await fs.mkdir(DISCORD_DIR, { recursive: true });

  // Write individual files for each Discord community (clean filenames)
  const createdFiles: string[] = [];
  
  for (const community of communities) {
    const filename = `${community.id}.json`;
    const filepath = resolve(DISCORD_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(community, null, 2));
    createdFiles.push(filename);
  }

  console.log(`✅ Discord data saved:`);
  console.log(`   - Individual files in discord/: ${createdFiles.join(', ')}`);
  console.log(`   - ${communities.length} communities`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDiscordData().catch(console.error);
}

export { ingestDiscordData };
