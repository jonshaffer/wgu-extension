#!/usr/bin/env node

/**
 * Unified Data Transformation Script
 * 
 * Transforms raw community data into the processed format used by the extension.
 * Creates course-specific mappings and hierarchical organization.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { 
  DiscordData, 
  RedditData, 
  WguConnectData,
  ProcessedCommunityData,
  CourseCommunitiesMappings,
  CommunityLink,
  College 
} from '../types/community-data.js';

const RAW_DIR = resolve(process.cwd(), 'data/raw');
const PROCESSED_DIR = resolve(process.cwd(), 'data/processed');

async function loadRawData() {
  const [discordData, redditData, wguConnectData] = await Promise.all([
    fs.readFile(resolve(RAW_DIR, 'discord.json'), 'utf-8').then(d => JSON.parse(d) as DiscordData),
    fs.readFile(resolve(RAW_DIR, 'reddit.json'), 'utf-8').then(d => JSON.parse(d) as RedditData),
    fs.readFile(resolve(RAW_DIR, 'wgu-connect.json'), 'utf-8').then(d => JSON.parse(d) as WguConnectData)
  ]);

  return { discordData, redditData, wguConnectData };
}

function transformDiscordToLinks(discordData: DiscordData): CommunityLink[] {
  return discordData.communities.map(community => ({
    name: community.name,
    url: community.inviteUrl,
    type: 'discord' as const,
    description: community.description,
    memberCount: community.memberCount
  }));
}

function transformRedditToLinks(redditData: RedditData): CommunityLink[] {
  return redditData.communities.map(community => ({
    name: community.name,
    url: `https://reddit.com/r/${community.subreddit}`,
    type: 'reddit' as const,
    description: community.description,
    memberCount: community.subscribers
  }));
}

function transformWguConnectToLinks(wguConnectData: WguConnectData): CommunityLink[] {
  return wguConnectData.groups.map(group => ({
    name: group.name,
    url: group.url,
    type: 'wgu-connect' as const,
    description: group.description,
    memberCount: group.memberCount
  }));
}

function createCourseMappings(
  discordData: DiscordData,
  redditData: RedditData,
  wguConnectData: WguConnectData
): CourseCommunitiesMappings[] {
  const courseMap = new Map<string, CourseCommunitiesMappings>();

  // Process Discord channels for course-specific mappings
  discordData.channels.forEach(channel => {
    if (channel.courseRelevance) {
      channel.courseRelevance.forEach(courseCode => {
        if (!courseMap.has(courseCode)) {
          courseMap.set(courseCode, { courseCode, discord: [], reddit: [], wguConnect: [] });
        }
        
        const community = discordData.communities.find(c => c.id === channel.communityId);
        if (community) {
          courseMap.get(courseCode)!.discord!.push({
            name: `${community.name} - ${channel.name}`,
            url: community.inviteUrl,
            type: 'discord',
            description: channel.description
          });
        }
      });
    }
  });

  // Process Reddit communities for course-specific mappings
  redditData.communities.forEach(community => {
    if (community.relevantCourses) {
      community.relevantCourses.forEach(courseCode => {
        if (!courseMap.has(courseCode)) {
          courseMap.set(courseCode, { courseCode, discord: [], reddit: [], wguConnect: [] });
        }
        
        courseMap.get(courseCode)!.reddit!.push({
          name: community.name,
          url: `https://reddit.com/r/${community.subreddit}`,
          type: 'reddit',
          description: community.description
        });
      });
    }
  });

  // Process WGU Connect groups for course-specific mappings
  wguConnectData.groups.forEach(group => {
    group.courseCodes.forEach(courseCode => {
      if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, { courseCode, discord: [], reddit: [], wguConnect: [] });
      }
      
      courseMap.get(courseCode)!.wguConnect!.push({
        name: group.name,
        url: group.url,
        type: 'wgu-connect',
        description: group.description
      });
    });
  });

  return Array.from(courseMap.values());
}

function organizeByHierarchy(
  discordData: DiscordData,
  redditData: RedditData
) {
  const universityLevel = {
    discord: discordData.communities
      .filter(c => c.hierarchy.level === 'university')
      .map(c => transformDiscordToLinks({ communities: [c], channels: [] })[0]),
    reddit: redditData.communities
      .filter(c => c.hierarchy.level === 'university')
      .map(c => transformRedditToLinks({ communities: [c] })[0])
  };

  const colleges: College[] = ['technology', 'healthcare', 'business', 'education'];
  const collegeLevel = colleges.reduce((acc, college) => {
    acc[college] = {
      discord: discordData.communities
        .filter(c => c.hierarchy.college === college)
        .map(c => transformDiscordToLinks({ communities: [c], channels: [] })[0]),
      reddit: redditData.communities
        .filter(c => c.hierarchy.college === college)
        .map(c => transformRedditToLinks({ communities: [c] })[0])
    };
    return acc;
  }, {} as Record<College, { discord: CommunityLink[]; reddit: CommunityLink[]; }>);

  return { universityLevel, collegeLevel };
}

async function transformUnifiedData(): Promise<void> {
  console.log('🔄 Starting unified data transformation...');

  const { discordData, redditData, wguConnectData } = await loadRawData();

  // Create course-specific mappings
  const courseMappings = createCourseMappings(discordData, redditData, wguConnectData);

  // Organize by hierarchy
  const { universityLevel, collegeLevel } = organizeByHierarchy(discordData, redditData);

  const processedData: ProcessedCommunityData = {
    courseMappings,
    universityLevel,
    collegeLevel,
    lastUpdated: new Date().toISOString()
  };

  // Save processed data
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
  await fs.writeFile(
    resolve(PROCESSED_DIR, 'unified-community-data.json'),
    JSON.stringify(processedData, null, 2)
  );

  // Note: Extension should use production search endpoint, not local files

  console.log(`✅ Unified transformation complete`);
  console.log(`   - Processed data: ${resolve(PROCESSED_DIR, 'unified-community-data.json')}`);
  console.log(`   - Course mappings: ${courseMappings.length} courses`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  transformUnifiedData().catch(console.error);
}

export { transformUnifiedData };
