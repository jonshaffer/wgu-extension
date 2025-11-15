/**
 * Type declarations for Discord extractor module
 * This module is used for extracting Discord server data
 */

export class DiscordExtractor {
  constructor(serverId?: string);
  extractServerData(): Promise<any>;
  isResourcesChannel(channelId: string): boolean;
  extractResourceData(channelId: string): Promise<any>;
}

export function isWGUDiscordServer(serverId: string): boolean;
