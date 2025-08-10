/**
 * Discord Data Extractor
 * 
 * Extracts WGU-related data from Discord server pages
 * Designed to be imported into extension content scripts
 */

export interface DiscordServerData {
  serverId: string;
  serverName: string;
  channels: DiscordChannel[];
  members: DiscordMember[];
  extractedAt: string;
  url: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | 'thread';
  category?: string;
  position?: number;
  isWGURelated: boolean;
  courseCode?: string; // Extracted from channel name if present
}

export interface DiscordMember {
  id: string;
  username: string;
  displayName?: string;
  roles: string[];
  isOnline: boolean;
  joinedAt?: string;
}

/**
 * Main extractor class for Discord data
 */
export class DiscordExtractor {
  private serverIdPattern = /\/channels\/(\d+)(?:\/(\d+))?/;
  private courseCodePattern = /\b([A-Z]{1,4}\d{1,4}[A-Z]?)\b/g;

  /**
   * Extracts server ID from current Discord URL
   */
  getServerId(): string | null {
    const match = window.location.pathname.match(this.serverIdPattern);
    return match?.[1] || null;
  }

  /**
   * Extracts channel ID from current Discord URL
   */
  getChannelId(): string | null {
    const match = window.location.pathname.match(this.serverIdPattern);
    return match?.[2] || null;
  }

  /**
   * Extracts server name from Discord UI
   */
  getServerName(): string {
    const serverNameElement = document.querySelector('[data-dnd-name]')?.closest('[class*="guild"]')?.querySelector('[class*="name"]');
    const headerElement = document.querySelector('h1[class*="title"]');
    const guildNameElement = document.querySelector('[class*="guildName"]');
    
    return serverNameElement?.textContent?.trim() || 
           headerElement?.textContent?.trim() || 
           guildNameElement?.textContent?.trim() || 
           'Unknown Server';
  }

  /**
   * Extracts all channels from the server
   */
  extractChannels(): DiscordChannel[] {
    const channels: DiscordChannel[] = [];
    
    // Look for channel list container
    const channelList = document.querySelector('[aria-label="Channels"]') || 
                       document.querySelector('[class*="scroller"][class*="content"]');
    
    if (!channelList) return channels;

    // Extract text channels
    const textChannels = channelList.querySelectorAll('[class*="containerDefault"], [class*="channel"]');
    textChannels.forEach((channelEl, index) => {
      const nameEl = channelEl.querySelector('[class*="name"]') as HTMLElement;
      const linkEl = channelEl.querySelector('a[data-list-item-id]') as HTMLAnchorElement;
      
      if (nameEl && linkEl) {
        const channelName = nameEl.textContent?.trim() || '';
        const channelId = this.extractChannelIdFromDataAttr(linkEl.getAttribute('data-list-item-id'));
        const isVoice = linkEl.getAttribute('aria-label')?.includes('voice channel') || false;
        const courseCode = this.extractCourseCode(channelName);
        
        channels.push({
          id: channelId || `channel_${index}`,
          name: channelName,
          type: isVoice ? 'voice' : 'text',
          position: index,
          isWGURelated: this.isWGURelated(channelName),
          courseCode
        });
      }
    });

    return channels;
  }

  /**
   * Extracts online members list
   */
  extractMembers(): DiscordMember[] {
    const members: DiscordMember[] = [];
    
    // Look for member list
    const memberList = document.querySelector('[class*="members"]') || 
                       document.querySelector('[aria-label="Members"]');
    
    if (!memberList) return members;

    const memberElements = memberList.querySelectorAll('[class*="member"]');
    memberElements.forEach((memberEl, index) => {
      const usernameEl = memberEl.querySelector('[class*="username"]') as HTMLElement;
      const avatarEl = memberEl.querySelector('[class*="avatar"]') as HTMLElement;
      
      if (usernameEl) {
        const username = usernameEl.textContent?.trim() || '';
        const isOnline = memberEl.querySelector('[class*="statusOnline"]') !== null;
        
        members.push({
          id: `member_${index}`,
          username,
          displayName: username,
          roles: [], // Would need additional extraction logic
          isOnline
        });
      }
    });

    return members;
  }

  /**
   * Checks if channel name is WGU-related
   */
  private isWGURelated(channelName: string): boolean {
    const wguKeywords = [
      'wgu', 'western', 'governors', 'university',
      'degree', 'course', 'study', 'student',
      'capstone', 'oa', 'pa', 'proctored'
    ];
    
    const hasWguKeyword = wguKeywords.some(keyword => 
      channelName.toLowerCase().includes(keyword)
    );
    
    const hasCourseCode = this.courseCodePattern.test(channelName);
    
    return hasWguKeyword || hasCourseCode;
  }

  /**
   * Extracts course code from channel name
   */
  private extractCourseCode(channelName: string): string | undefined {
    const matches = channelName.match(this.courseCodePattern);
    return matches?.[0];
  }

  /**
   * Extracts channel ID from Discord's data attribute
   */
  private extractChannelIdFromDataAttr(dataAttr: string | null): string | null {
    if (!dataAttr) return null;
    // Format: "channels___1234689989057450106"
    const match = dataAttr.match(/channels___(\d+)/);
    return match?.[1] || null;
  }

  /**
   * Main extraction method - returns complete server data
   */
  extractServerData(): DiscordServerData | null {
    const serverId = this.getServerId();
    if (!serverId) return null;

    return {
      serverId,
      serverName: this.getServerName(),
      channels: this.extractChannels(),
      members: this.extractMembers(),
      extractedAt: new Date().toISOString(),
      url: window.location.href
    };
  }
}

/**
 * Utility function for easy extraction from content scripts
 */
export function extractDiscordData(): DiscordServerData | null {
  const extractor = new DiscordExtractor();
  return extractor.extractServerData();
}

/**
 * Checks if current page is a WGU-related Discord server
 */
export function isWGUDiscordServer(): boolean {
  const extractor = new DiscordExtractor();
  const serverName = extractor.getServerName();
  const channels = extractor.extractChannels();
  
  const serverNameHasWGU = /wgu|western.*governors/i.test(serverName);
  const hasWGUChannels = channels.some(channel => channel.isWGURelated);
  
  return serverNameHasWGU || hasWGUChannels;
}