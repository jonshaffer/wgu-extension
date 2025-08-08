#!/usr/bin/env node

/**
 * Reddit Data Ingestion Script
 * 
 * Ingests Reddit community data into individual {subreddit}.json files.
 * Each file contains a single subreddit community.
 * Validates subreddit existence and gathers metadata.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { RedditData, RedditCommunityFile } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const REDDIT_DIR = resolve(DATA_DIR, 'reddit');

async function ingestRedditData(): Promise<void> {
  console.log('🔴 Starting Reddit data ingestion...');

  // Manually curated Reddit communities relevant to WGU
  // TODO: Add Reddit API integration for automated validation and metadata
  
  const communities: RedditCommunityFile[] = [
    {
      subreddit: "WGU",
      name: "Western Governors University",
      description: "The main WGU subreddit for all students and alumni",
      hierarchy: {
        level: 'university'
      },
      isActive: true,
      tags: ["general", "university"]
    },
    {
      subreddit: "WGU_CompSci",
      name: "WGU Computer Science",
      description: "Computer Science degree program discussions",
      hierarchy: {
        level: 'program',
        college: 'technology',
        program: 'Computer Science'
      },
      isActive: true,
      relevantCourses: ["C950", "C777", "C482", "C195"],
      tags: ["computer-science", "programming"]
    },
    {
      subreddit: "cybersecurity",
      name: "Cybersecurity",
      description: "General cybersecurity discussions, relevant to WGU Cybersecurity students",
      hierarchy: {
        level: 'program',
        college: 'technology',
        program: 'Cybersecurity and Information Assurance'
      },
      isActive: true,
      tags: ["cybersecurity", "infosec"]
    },
    {
      subreddit: "ITCareerQuestions",
      name: "IT Career Questions",
      description: "Career advice for IT professionals, relevant to WGU IT students",
      hierarchy: {
        level: 'college',
        college: 'technology'
      },
      isActive: true,
      tags: ["career", "it", "technology"]
    },
    {
      subreddit: "nursing",
      name: "Nursing",
      description: "General nursing discussions, relevant to WGU Nursing students",
      hierarchy: {
        level: 'college',
        college: 'health'
      },
      isActive: true,
      tags: ["nursing", "health"]
    },
    {
      subreddit: "businessmajors",
      name: "Business Majors",
      description: "Discussions for business students, relevant to WGU Business programs",
      hierarchy: {
        level: 'college',
        college: 'business'
      },
      isActive: true,
      tags: ["business", "majors"]
    }
  ];

  // Ensure Reddit directory exists
  await fs.mkdir(REDDIT_DIR, { recursive: true });

  // Write individual files for each Reddit community
  const createdFiles: string[] = [];
  
  for (const community of communities) {
    const filename = `${community.subreddit}.json`;
    const filepath = resolve(REDDIT_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(community, null, 2));
    createdFiles.push(filename);
  }

  console.log(`✅ Reddit data saved:`);
  console.log(`   - Individual files in reddit/: ${createdFiles.join(', ')}`);
  console.log(`   - ${communities.length} communities`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestRedditData().catch(console.error);
}

export { ingestRedditData };
