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

// Paths relative to the extension/ workspace root when run via `npm -w unofficial-wgu-extension run data:ingest:discord`
const RAW_DIR = resolve(process.cwd(), 'discord/raw');
const PROCESSED_DIR = resolve(process.cwd(), 'discord/processed');
const PROCESSED_FILE = resolve(PROCESSED_DIR, 'communities.json');

async function ingestDiscordData(): Promise<void> {
  console.log('🔵 Starting Discord data ingestion...');

  // Ensure Discord directory exists
  await fs.mkdir(RAW_DIR, { recursive: true });

  console.log('📥 Discord data ingestion now validates existing files');
  console.log('💡 To add new Discord communities, create JSON files directly in data/discord/raw/');
  
  // Validate existing files
  await validateExistingFiles();

  // Build processed communities aggregate
  await generateProcessedCommunities();
}

async function validateExistingFiles(): Promise<void> {
  try {
    const existingFiles = await fs.readdir(RAW_DIR);
    const jsonFiles = existingFiles.filter(f => f.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} existing Discord community files:`);
    
    for (const filename of jsonFiles) {
      const filePath = resolve(RAW_DIR, filename);
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

type ChannelType = 'text' | 'voice' | 'forum';

interface ProcessedCommunity {
  id: string;
  name: string;
  description?: string;
  inviteUrl?: string;
  hierarchy: DiscordCommunityFile['hierarchy'];
  channelCounts: { total: number; text: number; voice: number; forum: number };
  coursesMentioned: string[];
  tags: string[];
}

interface ProcessedCommunitiesOutput {
  metadata: {
    generatedAt: string;
    totalCommunities: number;
    totalChannels: number;
    description: string;
  };
  communities: Record<string, ProcessedCommunity>;
}

async function generateProcessedCommunities(): Promise<void> {
  try {
    await fs.mkdir(PROCESSED_DIR, { recursive: true });
    const entries = await fs.readdir(RAW_DIR);
    const files = entries.filter(f => f.endsWith('.json'));

    const communities: Record<string, ProcessedCommunity> = {};
    let totalChannels = 0;

    for (const filename of files) {
      const filePath = resolve(RAW_DIR, filename);
      try {
        const parsed = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        if (!isDiscordCommunityFile(parsed)) continue;
        const data: DiscordCommunityFile = parsed;

        const counts: Record<ChannelType, number> = { text: 0, voice: 0, forum: 0 } as const as Record<ChannelType, number>;
        const tags = new Set<string>();
        const courses = new Set<string>();

        for (const ch of data.channels) {
          totalChannels++;
          if (ch.type in counts) counts[ch.type as ChannelType] += 1;
          ch.tags?.forEach(t => tags.add(t));
          ch.courseRelevance?.forEach(c => courses.add(c.toUpperCase()));
        }

        communities[data.id] = {
          id: data.id,
          name: data.name,
          description: data.description,
          inviteUrl: data.inviteUrl,
          hierarchy: data.hierarchy,
          channelCounts: {
            total: data.channels.length,
            text: counts.text || 0,
            voice: counts.voice || 0,
            forum: counts.forum || 0,
          },
          coursesMentioned: Array.from(courses).sort(),
          tags: Array.from(tags).sort(),
        };
      } catch (err) {
        console.warn(`⚠️  Skipping invalid JSON file: ${filename}`, err);
      }
    }

    const output: ProcessedCommunitiesOutput = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalCommunities: Object.keys(communities).length,
        totalChannels,
        description: 'Processed summary of Discord communities with channel counts, tags, and course mentions.'
      },
      communities,
    };

    await fs.writeFile(PROCESSED_FILE, JSON.stringify(output, null, 2) + '\n');
    console.log(`🟢 Wrote processed Discord communities -> ${PROCESSED_FILE}`);
  } catch (error) {
    console.error('❌ Error generating processed communities:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDiscordData().catch(console.error);
}

export { ingestDiscordData };
