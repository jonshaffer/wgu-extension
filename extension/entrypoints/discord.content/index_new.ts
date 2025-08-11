import { storage } from '@wxt-dev/storage';
import { ENABLE_DISCORD_INTEGRATION } from '@/utils/storage.constants';

// Define known Discord servers for WGU communities
const KNOWN_DISCORD_SERVERS = [
  "1063853854413836499", // WGU CS Discord
  "948943218063265822"   // WGU Computer Science
];

const discordCommunities = KNOWN_DISCORD_SERVERS.map(serverId => 
  `https://discord.com/channels/${serverId}/*`
);

export default defineContentScript({
  matches: [...discordCommunities],
  runAt: 'document_end',

  async main(ctx) {
    console.log('WGU Extension: Discord content script loaded');

    // Check if Discord integration is enabled
    const isDiscordEnabled = await storage.getItem<boolean>(ENABLE_DISCORD_INTEGRATION);
    if (isDiscordEnabled === false) {
      console.log('WGU Extension: Discord integration disabled by user');
      return;
    }

    // Extract server ID and channel ID from URL
    function parseDiscordUrl(): { serverId: string; channelId: string } | null {
      const urlMatch = window.location.pathname.match(/^\/channels\/(\d+)\/(\d+)$/);
      if (!urlMatch) {
        console.log('WGU Extension: Not on a Discord channel page');
        return null;
      }
      
      return {
        serverId: urlMatch[1],
        channelId: urlMatch[2]
      };
    }

    // Load unified community data from extension assets
    async function loadUnifiedData() {
      try {
        const response = await fetch(browser.runtime.getURL('unified-community-data.json' as any));
        if (!response.ok) {
          throw new Error(`Failed to load unified data: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('WGU Extension: Error loading unified community data:', error);
        return null;
      }
    }

    // Check if current server is whitelisted
    async function isServerWhitelisted(serverId: string): Promise<boolean> {
      return KNOWN_DISCORD_SERVERS.includes(serverId);
    }

    // Simple implementation for now - we'll enhance this later
    console.log('WGU Extension: Discord integration loaded, basic functionality active');
    
    const urlInfo = parseDiscordUrl();
    if (!urlInfo) return;

    const isWhitelisted = await isServerWhitelisted(urlInfo.serverId);
    if (!isWhitelisted) {
      console.log('WGU Extension: Server not whitelisted');
      return;
    }

    console.log('WGU Extension: Valid Discord server detected, ready for enhancement');
  }
});
