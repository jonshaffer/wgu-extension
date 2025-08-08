#!/usr/bin/env node

/**
 * WGU Connect Data Ingestion Script
 * 
 * Ingests WGU Connect group data for course-specific communities.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { WguConnectData, WguConnectGroup } from '../types/community-data.js';

const DATA_DIR = resolve(process.cwd(), 'data/raw');
const OUTPUT_FILE = resolve(DATA_DIR, 'wgu-connect.json');

async function ingestWguConnectData(): Promise<void> {
  console.log('🟣 Starting WGU Connect data ingestion...');

  // WGU Connect groups mapped to courses
  // Some groups may cover multiple related courses
  
  const groups: WguConnectGroup[] = [
    {
      id: "c950-data-structures",
      name: "C950 - Data Structures and Algorithms",
      description: "Study group for C950 course",
      url: "https://my.wgu.edu/groups/c950-data-structures",
      courseCodes: ["C950"],
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "c777-web-development",
      name: "C777 - Web Development Applications",
      description: "Study group for C777 course",
      url: "https://my.wgu.edu/groups/c777-web-development",
      courseCodes: ["C777"],
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "programming-fundamentals",
      name: "Programming Fundamentals Study Group",
      description: "Multi-course group for programming basics",
      url: "https://my.wgu.edu/groups/programming-fundamentals",
      courseCodes: ["C482", "C195"], // Multiple courses
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "cybersecurity-specialization",
      name: "Cybersecurity and Information Assurance",
      description: "Group for cybersecurity degree students",
      url: "https://my.wgu.edu/groups/cybersecurity",
      courseCodes: ["C836", "C837", "C838"], // Example cybersecurity courses
      isActive: true,
      lastUpdated: new Date().toISOString()
    }
  ];

  const wguConnectData: WguConnectData = {
    groups
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(wguConnectData, null, 2));
  
  console.log(`✅ WGU Connect data saved to ${OUTPUT_FILE}`);
  console.log(`   - ${groups.length} groups`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestWguConnectData().catch(console.error);
}

export { ingestWguConnectData };
