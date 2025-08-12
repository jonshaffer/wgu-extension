#!/usr/bin/env node

/**
 * Unified Data Transformation Script
 * 
 * Transforms raw community data into the processed format used by the extension.
 * Creates course-specific mappings and hierarchical organization.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import type { 
  DiscordData, 
  DiscordCommunityFile,
  RedditData, 
  RedditCommunityFile,
  WguConnectData,
  WguConnectGroupFile,
  WguStudentGroupsData,
  WguStudentGroupFile,
  ProcessedCommunityData,
  CourseCommunitiesMappings,
  CommunityLink,
  College 
} from '../types/community-data.js';

const DISCORD_DIR = resolve(process.cwd(), 'discord', 'raw');
const REDDIT_DIR = resolve(process.cwd(), 'reddit', 'raw');
const PROCESSED_DIR = resolve(process.cwd(), 'processed');
const PUBLIC_DATA_DIR = resolve(process.cwd(), '../extension/public/data');
const PUBLIC_COURSES_DIR = resolve(PUBLIC_DATA_DIR, 'courses');

/**
 * Get the last git commit timestamp for a file
 */
function getFileLastUpdated(filePath: string): string {
  try {
    // Get the last commit date for the specific file
    const timestamp = execSync(`git log -1 --format="%ci" -- "${filePath}"`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    
    if (timestamp) {
      return new Date(timestamp).toISOString();
    }
  } catch (error) {
    // File might not be in git yet, or git not available
    console.warn(`Could not get git timestamp for ${filePath}:`, error);
  }
  
  // Fallback to current time
  return new Date().toISOString();
}

async function loadRawData() {
  // Load Discord data - check for individual files first, fallback to legacy
  let discordData: DiscordData;
  
  try {
    // Load individual Discord community files from discord/ directory
    const discordFiles = await fs.readdir(DISCORD_DIR).catch(() => []);
    const validDiscordFiles = discordFiles.filter(f => f.endsWith('.json'));
    
    if (validDiscordFiles.length > 0) {
      // Load individual Discord community files and add git timestamps
      const communities = await Promise.all(
        validDiscordFiles.map(async (file) => {
          const filePath = resolve(DISCORD_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const community = JSON.parse(content) as DiscordCommunityFile;
          
          // Add lastUpdated from git commit history
          return {
            ...community,
            lastUpdated: getFileLastUpdated(filePath)
          };
        })
      );
      
      discordData = {
        communities,
        channels: communities.flatMap(c => c.channels)
      };
    } else {
      discordData = { communities: [], channels: [] };
    }
  } catch (error) {
    console.warn('Could not load Discord data:', error);
    discordData = { communities: [], channels: [] };
  }

  // Load Reddit data - check for individual files first, fallback to legacy
  let redditData: RedditData;
  
  try {
    // Look for individual {subreddit}.json files in reddit/ directory
    const redditFiles = await fs.readdir(REDDIT_DIR).catch(() => []);
    const validRedditFiles = redditFiles.filter(f => f.endsWith('.json'));
    
    if (validRedditFiles.length > 0) {
      // Load individual Reddit community files and add git timestamps
      const communities = await Promise.all(
        validRedditFiles.map(async (file) => {
          const filePath = resolve(REDDIT_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const community = JSON.parse(content) as RedditCommunityFile;
          
          // Add lastUpdated from git commit history
          return {
            ...community,
            lastUpdated: getFileLastUpdated(filePath)
          };
        })
      );
      
      redditData = { communities };
    } else {
      // Fallback to legacy reddit.json file
      const legacyFile = resolve(RAW_DIR, 'reddit.json');
      if (await fs.access(legacyFile).then(() => true).catch(() => false)) {
        const content = await fs.readFile(legacyFile, 'utf-8');
        redditData = JSON.parse(content) as RedditData;
      } else {
        redditData = { communities: [] };
      }
    }
  } catch (error) {
    console.warn('Could not load Reddit data:', error);
    redditData = { communities: [] };
  }

  // Load WGU Connect data from individual files
  let wguConnectData: WguConnectData = { groups: [] };
  try {
    const wguConnectDir = resolve(process.cwd(), 'wgu-connect', 'raw');
    const wguConnectFiles = await fs.readdir(wguConnectDir);
    const jsonFiles = wguConnectFiles.filter(f => f.endsWith('.json'));
    
    const groups = await Promise.all(
      jsonFiles.map(async (filename) => {
        const filePath = resolve(wguConnectDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const groupData: WguConnectGroupFile = JSON.parse(content);
        
        // Add git timestamp if available
        const timestamp = getFileLastUpdated(filePath);
        if (timestamp) {
          groupData.lastUpdated = timestamp;
        }
        
        return groupData;
      })
    );
    
    wguConnectData = { groups };
  } catch (error) {
    console.warn('Could not load WGU Connect data:', error);
  }

  // Load WGU Student Groups data from individual files
  let wguStudentGroupsData: WguStudentGroupsData = { groups: [] };
  try {
    const wguStudentGroupsDir = resolve(process.cwd(), 'wgu-student-groups', 'raw');
    const wguStudentGroupsFiles = await fs.readdir(wguStudentGroupsDir);
    const jsonFiles = wguStudentGroupsFiles.filter(f => f.endsWith('.json'));
    
    const groups = await Promise.all(
      jsonFiles.map(async (filename) => {
        const filePath = resolve(wguStudentGroupsDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const groupData: WguStudentGroupFile = JSON.parse(content);
        
        // Add git timestamp if available
        const timestamp = getFileLastUpdated(filePath);
        if (timestamp) {
          groupData.lastUpdated = timestamp;
        }
        
        return groupData;
      })
    );
    
    wguStudentGroupsData = { groups };
  } catch (error) {
    console.warn('Could not load WGU Student Groups data:', error);
  }

  return { discordData, redditData, wguConnectData, wguStudentGroupsData };
}

function transformDiscordToLinks(discordData: DiscordData): CommunityLink[] {
  return discordData.communities.map(community => ({
    name: community.name,
    url: community.inviteUrl,
    type: 'discord' as const,
    description: community.description,
    lastUpdated: community.lastUpdated
  }));
}

function transformRedditToLinks(redditData: RedditData): CommunityLink[] {
  return redditData.communities.map(community => ({
    name: community.name,
    url: `https://reddit.com/r/${community.subreddit}`,
    type: 'reddit' as const,
    description: community.description,
    memberCount: community.subscribers,
    lastUpdated: community.lastUpdated
  }));
}

function transformWguConnectToLinks(wguConnectData: WguConnectData): CommunityLink[] {
  return wguConnectData.groups.map(group => ({
    name: group.name,
    url: group.url,
    type: 'wgu-connect' as const,
    description: group.full_name,
    lastUpdated: group.lastUpdated
  }));
}

function transformWguStudentGroupsToLinks(wguStudentGroupsData: WguStudentGroupsData): CommunityLink[] {
  return wguStudentGroupsData.groups.map(group => ({
    name: group.name,
    url: group.url,
    type: 'wgu-student-groups' as const,
    description: group.description,
    lastUpdated: group.lastUpdated
  }));
}

function createCourseMappings(
  discordData: DiscordData,
  redditData: RedditData,
  wguConnectData: WguConnectData,
  wguStudentGroupsData: WguStudentGroupsData
): CourseCommunitiesMappings[] {
  const courseMap = new Map<string, CourseCommunitiesMappings>();

  // Process Discord channels for course-specific mappings
  discordData.channels.forEach(channel => {
    if (channel.courseRelevance) {
      channel.courseRelevance.forEach(courseCode => {
        if (!courseMap.has(courseCode)) {
          courseMap.set(courseCode, { courseCode, discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] });
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
          courseMap.set(courseCode, { courseCode, discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] });
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
    group.course_codes.forEach((courseCode: string) => {
      if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, { courseCode, discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] });
      }
      
      courseMap.get(courseCode)!.wguConnect!.push({
        name: group.name,
        url: group.url,
        type: 'wgu-connect',
        description: group.full_name,
        lastUpdated: group.lastUpdated
      });
    });
  });

  // Note: WGU Student Groups are typically university-level and not course-specific,
  // so they are not processed here but in the organizeByHierarchy function

  return Array.from(courseMap.values());
}

function organizeByHierarchy(
  discordData: DiscordData,
  redditData: RedditData,
  wguStudentGroupsData: WguStudentGroupsData
) {
  const universityLevel = {
    discord: discordData.communities
      .filter(c => c.hierarchy.level === 'university')
      .map(c => transformDiscordToLinks({ communities: [c], channels: [] })[0]),
    reddit: redditData.communities
      .filter(c => c.hierarchy.level === 'university')
      .map(c => transformRedditToLinks({ communities: [c] })[0]),
    wguStudentGroups: transformWguStudentGroupsToLinks(wguStudentGroupsData)
  };

  const colleges: College[] = ['technology', 'health', 'business', 'education'];
  const collegeLevel = colleges.reduce((acc, college) => {
    acc[college] = {
      discord: discordData.communities
        .filter(c => c.hierarchy.college === college)
        .map(c => transformDiscordToLinks({ communities: [c], channels: [] })[0]),
      reddit: redditData.communities
        .filter(c => c.hierarchy.college === college)
        .map(c => transformRedditToLinks({ communities: [c] })[0]),
      wguStudentGroups: [] // Student groups are typically university-level, not college-specific
    };
    return acc;
  }, {} as Record<College, { discord: CommunityLink[]; reddit: CommunityLink[]; wguStudentGroups: CommunityLink[]; }>);

  return { universityLevel, collegeLevel };
}

async function transformUnifiedData(): Promise<void> {
  console.log('🔄 Starting unified data transformation...');

  const { discordData, redditData, wguConnectData, wguStudentGroupsData } = await loadRawData();

  // Create course-specific mappings
  const courseMappings = createCourseMappings(discordData, redditData, wguConnectData, wguStudentGroupsData);

  // Organize by hierarchy
  const { universityLevel, collegeLevel } = organizeByHierarchy(discordData, redditData, wguStudentGroupsData);

  // Extract Discord server IDs for content script matching
  const discordServers = Array.from(new Set(discordData.communities.map(c => c.id)));

  const processedData: ProcessedCommunityData = {
    courseMappings,
    universityLevel,
    collegeLevel,
    discordServers,
    lastUpdated: new Date().toISOString()
  };

  // Save processed data
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
  await fs.writeFile(
    resolve(PROCESSED_DIR, 'unified-community-data.json'),
    JSON.stringify(processedData, null, 2)
  );

  // Copy unified data to public directory for extension use
  await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true });
  await fs.writeFile(
    resolve(PUBLIC_DATA_DIR, 'unified-community-data.json'),
    JSON.stringify(processedData, null, 2)
  );

  // Generate individual course files for extension use
  await fs.mkdir(PUBLIC_COURSES_DIR, { recursive: true });
  for (const courseMapping of courseMappings) {
    const courseFormat = {
      discord: courseMapping.discord || [],
      reddit: courseMapping.reddit || [],
      wguConnect: courseMapping.wguConnect || [],
      wguStudentGroups: courseMapping.wguStudentGroups || []
    };
    
    await fs.writeFile(
      resolve(PUBLIC_COURSES_DIR, `${courseMapping.courseCode.toLowerCase()}.json`),
      JSON.stringify(courseFormat, null, 2)
    );
  }


  console.log(`✅ Unified transformation complete`);
  console.log(`   - Processed data: ${resolve(PROCESSED_DIR, 'unified-community-data.json')}`);
  console.log(`   - Public data: ${resolve(PUBLIC_DATA_DIR, 'unified-community-data.json')}`);
  console.log(`   - Course files: ${resolve(PUBLIC_COURSES_DIR)} (${courseMappings.length} courses)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  transformUnifiedData().catch(console.error);
}

export { transformUnifiedData };
