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
    communityId: string;
    type: DiscordChannelType;
    courseRelevance?: string[];
    tags?: string[];
}
export interface DiscordCommunity {
    id: string;
    name: string;
    description?: string;
    inviteUrl?: string;
    hierarchy: DiscordHierarchy;
}
export interface DiscordCommunityFile extends DiscordCommunity {
    channels: DiscordChannel[];
}
export declare function isDiscordCommunityFile(obj: any): obj is DiscordCommunityFile;
