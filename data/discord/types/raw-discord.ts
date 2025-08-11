/**
 * TypeScript type definitions for WGU Discord raw community files (data/discord/raw/*)
 */

export type DiscordHierarchyLevel = 'university' | 'college' | 'program' | 'course' | 'community';

export interface DiscordHierarchy {
  level: DiscordHierarchyLevel;
  college?: 'technology' | 'healthcare' | 'business' | 'education';
  program?: string;
  courseCode?: string;
}

export type DiscordChannelType = 'text' | 'voice' | 'forum';

export interface DiscordChannel {
  id: string;
  name: string;
  description?: string;
  communityId: string; // Discord server (guild) ID
  type: DiscordChannelType;
  courseRelevance?: string[]; // Course codes like C950, D276
  tags?: string[]; // e.g., "Core", "Upper Division"
}

export interface DiscordCommunity {
  id: string; // Discord guild ID
  name: string;
  description?: string;
  inviteUrl?: string;
  hierarchy: DiscordHierarchy;
}

// Individual raw file structure in data/discord/raw/*.json
export interface DiscordCommunityFile extends DiscordCommunity {
  channels: DiscordChannel[];
}

// Type guard for basic validation
export function isDiscordCommunityFile(obj: any): obj is DiscordCommunityFile {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.hierarchy === 'object' &&
    Array.isArray(obj.channels) &&
    obj.channels.every((ch: any) =>
      ch &&
      typeof ch.id === 'string' &&
      typeof ch.name === 'string' &&
      typeof ch.communityId === 'string' &&
      ['text', 'voice', 'forum'].includes(ch.type)
    )
  );
}
