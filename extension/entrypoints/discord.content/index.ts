import {storage} from "@wxt-dev/storage";
import {ENABLE_DISCORD_INTEGRATION} from "@/utils/storage.constants";
import {discordCollectionEnabled, discordData} from "../../utils/storage";
import {DiscordExtractor, isWGUDiscordServer} from "../../data/discord/collect/discord-extractor";
import {loadCommunityData} from "@/utils/community-data";

// Use a permissive match and gate via whitelist at runtime
const discordCommunities = ["https://discord.com/channels/*/*"];

export default defineContentScript({
  matches: [...discordCommunities],
  runAt: "document_end",

  async main(ctx) {
    console.log("WGU Extension: Discord content script loaded");

    // Check if Discord integration is enabled
    const isDiscordEnabled = await storage.getItem<boolean>(ENABLE_DISCORD_INTEGRATION);
    if (isDiscordEnabled === false) {
      console.log("WGU Extension: Discord integration disabled by user");
      return;
    }

    // Extract server ID and channel ID from URL
    function parseDiscordUrl(): { serverId: string; channelId: string } | null {
      const urlMatch = window.location.pathname.match(/^\/channels\/(\d+)\/(\d+)$/);
      if (!urlMatch) {
        console.log("WGU Extension: Not on a Discord channel page");
        return null;
      }

      return {
        serverId: urlMatch[1],
        channelId: urlMatch[2],
      };
    }

    // Load unified community data remotely
    async function loadUnifiedData() {
      try {
        const {unifiedData} = await loadCommunityData();
        return unifiedData;
      } catch (error) {
        console.error("WGU Extension: Error loading unified community data:", error);
        return null;
      }
    }

    // Check if current server is whitelisted
    async function isServerWhitelisted(serverId: string): Promise<boolean> {
      const unified = await loadUnifiedData();
      const servers = unified?.discordServers || [];
      // Extract server IDs from Community objects
      const serverIds = servers.map((server: any) => server.id || server.serverId);
      return serverIds.includes(serverId);
    }

    console.log("WGU Extension: Discord integration loaded, basic functionality active");

    const urlInfo = parseDiscordUrl();
    if (!urlInfo) return;

    const isWhitelisted = await isServerWhitelisted(urlInfo.serverId);
    if (!isWhitelisted) {
      console.log("WGU Extension: Server not whitelisted");
      return;
    }

    console.log("WGU Extension: Valid Discord server detected, ready for enhancement");

    // Initialize data collection if enabled
    await initializeDataCollection(ctx, urlInfo);

    // Data collection functionality
    async function initializeDataCollection(ctx: any, urlInfo: { serverId: string; channelId: string }) {
      const collectionEnabled = await discordCollectionEnabled.getValue();
      if (!collectionEnabled) {
        console.log("WGU Extension: Discord data collection disabled");
        return;
      }

      console.log("WGU Extension: Initializing Discord data collection");

      // Create Discord extractor
      const extractor = new DiscordExtractor();

      // Set up periodic collection (every 30 seconds)
      let collectionInterval: number | null = null;
      let lastCollectionTime = 0;
      const COLLECTION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

      const collectData = async () => {
        const now = Date.now();
        if (now - lastCollectionTime < COLLECTION_COOLDOWN) {
          return; // Skip if too soon
        }

        try {
          const serverData = await extractor.extractServerData();
          if (!serverData) {
            console.log("WGU Extension: No Discord server data to collect");
            return;
          }

          // Only collect if this appears to be a WGU-related server
          if (!isWGUDiscordServer(serverData.serverId || "")) {
            console.log("WGU Extension: Server does not appear WGU-related");
            return;
          }

          console.log("WGU Extension: Collecting Discord server data", serverData);

          // Save to storage
          const currentData = await discordData.getValue();
          const updatedData = {
            ...currentData,
            servers: {
              ...currentData.servers,
              [serverData.serverId]: {
                ...serverData,
                collectedAt: new Date().toISOString(),
              },
            },
            lastCollection: new Date().toISOString(),
          };

          await discordData.setValue(updatedData);

          // Notify background script
          if (typeof browser !== "undefined" && browser.runtime) {
            browser.runtime.sendMessage({
              type: "DISCORD_DATA_COLLECTED",
              data: {
                serverId: serverData.serverId,
                serverName: serverData.serverName,
                channelCount: serverData.channels.length,
                memberCount: serverData.members.length,
                collectedAt: new Date().toISOString(),
              },
            }).catch(() => {
            // Background script might not be listening, that's OK
            });
          } else if ((globalThis as any).chrome?.runtime) {
            (globalThis as any).chrome.runtime.sendMessage({
              type: "DISCORD_DATA_COLLECTED",
              data: {
                serverId: serverData.serverId,
                serverName: serverData.serverName,
                channelCount: serverData.channels.length,
                memberCount: serverData.members.length,
                collectedAt: new Date().toISOString(),
              },
            });
          }

          lastCollectionTime = now;
        } catch (error) {
          console.error("WGU Extension: Error collecting Discord data:", error);
        }
      };

      // Initial collection after a short delay
      ctx.setTimeout(() => collectData(), 3000);

      // Set up periodic collection
      collectionInterval = ctx.setInterval(collectData, 30000);

      // Clean up on context invalidation
      ctx.onInvalidated(() => {
        if (collectionInterval) {
          clearInterval(collectionInterval);
        }
      });
    }
  },
});
