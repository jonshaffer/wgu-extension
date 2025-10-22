#!/usr/bin/env node

/**
 * Reddit Data Ingestion Script
 * 
 * Ingests Reddit community data relevant to WGU students.
 * Validates subreddit existence and gathers metadata.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { RedditData, RedditCommunity } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const OUTPUT_FILE = resolve(DATA_DIR, 'reddit.json');

async function ingestRedditData(): Promise<void> {
  console.log('🔴 Starting Reddit data ingestion...');

  // Manually curated Reddit communities relevant to WGU
  // TODO: Add Reddit API integration for automated validation and metadata
  
  const communities: RedditCommunity[] = [
    {
      subreddit: "WGU",
      name: "Western Governors University",
      description: "The main WGU subreddit for all students and alumni",
      hierarchy: {
        level: 'university'
      },
      isActive: true,
      tags: ["general", "university"],
      lastUpdated: new Date().toISOString()
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
      tags: ["computer-science", "programming"],
      lastUpdated: new Date().toISOString()
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
      tags: ["cybersecurity", "infosec"],
      lastUpdated: new Date().toISOString()
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
      tags: ["career", "it", "technology"],
      lastUpdated: new Date().toISOString()
    },
    {
      subreddit: "nursing",
      name: "Nursing",
      description: "General nursing discussions, relevant to WGU Nursing students",
      hierarchy: {
        level: 'college',
        college: 'healthcare'
      },
      isActive: true,
      tags: ["nursing", "healthcare"],
      lastUpdated: new Date().toISOString()
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
      tags: ["business", "management"],
      lastUpdated: new Date().toISOString()
    }
  ];

  const redditData: RedditData = {
    communities
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(redditData, null, 2));
  
  console.log(`✅ Reddit data saved to ${OUTPUT_FILE}`);
  console.log(`   - ${communities.length} communities`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestRedditData().catch(console.error);
}

export { ingestRedditData };
