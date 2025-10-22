#!/usr/bin/env node

/**
 * Discord Data Ingestion Script
 * 
 * Ingests Discord community and channel data.
 * Currently supports manual data entry with plans for Discord API integration.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { DiscordData, DiscordCommunity, DiscordChannel } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const OUTPUT_FILE = resolve(DATA_DIR, 'discord.json');

async function ingestDiscordData(): Promise<void> {
  console.log('🔵 Starting Discord data ingestion...');

  // For now, we'll use manually curated data
  // TODO: Integrate with Discord API for automated channel discovery
  
  const communities: DiscordCommunity[] = [
    {
      id: "948943218063265822",
      name: "WGU Computer Science",
      description: "Official WGU Computer Science student community",
      inviteUrl: "https://discord.gg/westerngovernors",
      hierarchy: {
        level: 'college',
        college: 'technology'
      },
      isVerified: true,
      lastUpdated: new Date().toISOString()
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
      isVerified: true,
      lastUpdated: new Date().toISOString()
    }
  ];

  const channels: DiscordChannel[] = [
    {
      id: "948943218063265825",
      name: "c950-data-structures-algorithms",
      description: "Discussion for C950 - Data Structures and Algorithms",
      communityId: "948943218063265822",
      type: "text",
      courseRelevance: ["C950"],
      tags: ["algorithms", "data-structures", "python"]
    },
    {
      id: "948943218063265826",
      name: "c777-web-development-applications",
      description: "Discussion for C777 - Web Development Applications",
      communityId: "948943218063265822",
      type: "text",
      courseRelevance: ["C777"],
      tags: ["web-development", "javascript", "html", "css"]
    }
  ];

  const discordData: DiscordData = {
    communities,
    channels
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(discordData, null, 2));
  
  console.log(`✅ Discord data saved to ${OUTPUT_FILE}`);
  console.log(`   - ${communities.length} communities`);
  console.log(`   - ${channels.length} channels`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDiscordData().catch(console.error);
}

export { ingestDiscordData };
