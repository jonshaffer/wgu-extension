export default defineContentScript({
  matches: ['https://discord.com/channels/*/*'],
  runAt: 'document_end',

  async main(ctx) {
    console.log('WGU Extension: Discord content script loaded');

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

    // Load whitelist from extension assets
    async function loadWhitelist() {
      try {
        const response = await fetch(browser.runtime.getURL('assets/discord-whitelist.json'));
        if (!response.ok) {
          throw new Error(`Failed to load whitelist: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('WGU Extension: Error loading Discord whitelist:', error);
        return null;
      }
    }

    // Load Discord channels mapping from extension assets
    async function loadDiscordChannels() {
      try {
        const response = await fetch(browser.runtime.getURL('assets/discord-channels.json'));
        if (!response.ok) {
          throw new Error(`Failed to load Discord channels: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('WGU Extension: Error loading Discord channels:', error);
        return null;
      }
    }

    // Check if current server is whitelisted
    function isWhitelisted(serverId: string, whitelist: any): boolean {
      if (!whitelist?.settings?.enable_discord_integration) {
        console.log('WGU Extension: Discord integration disabled');
        return false;
      }

      if (whitelist.settings.require_whitelist) {
        const isAllowed = whitelist.communities && whitelist.communities[serverId];
        console.log(`WGU Extension: Server ${serverId} ${isAllowed ? 'is' : 'is not'} whitelisted`);
        return !!isAllowed;
      }

      return true;
    }

    // Validate current channel exists in our Discord channels mapping
    function validateChannelInMapping(serverId: string, channelId: string, discordChannels: any): { isValid: boolean; channelInfo: any | null; courseCode: string | null } {
      if (!discordChannels || discordChannels.server_id !== serverId) {
        console.log('WGU Extension: Discord channels mapping not found or server ID mismatch');
        return { isValid: false, channelInfo: null, courseCode: null };
      }

      // Check active channels
      for (const [courseCode, channelInfo] of Object.entries(discordChannels.channels || {})) {
        if ((channelInfo as any).id === channelId) {
          console.log(`WGU Extension: Found channel ${channelId} mapped to course ${courseCode}`);
          return { isValid: true, channelInfo, courseCode };
        }
      }

      // Check retired channels
      for (const [courseCode, channelInfo] of Object.entries(discordChannels.retired_courses || {})) {
        if ((channelInfo as any).id === channelId) {
          console.log(`WGU Extension: Found retired channel ${channelId} mapped to course ${courseCode}`);
          return { isValid: true, channelInfo, courseCode: `${courseCode} (Retired)` };
        }
      }

      console.log(`WGU Extension: Channel ${channelId} not found in our mapping`);
      return { isValid: false, channelInfo: null, courseCode: null };
    }

    // Find course code from channel name (extracted from Discord DOM) - Fallback method
    function extractCourseCodeFromChannel(): string | null {
      // Look for course code patterns in channel names
      const channelNameElement = document.querySelector('[data-list-item-id^="channels___"] .name__');
      if (channelNameElement) {
        const channelName = channelNameElement.textContent || '';
        console.log('WGU Extension: Channel name found:', channelName);
        
        // Match patterns like "c950-dsa-2", "d333-ethics", etc.
        const courseMatch = channelName.match(/([a-z]\d{3,4})/i);
        if (courseMatch) {
          const courseCode = courseMatch[1].toUpperCase();
          console.log('WGU Extension: Extracted course code from DOM:', courseCode);
          return courseCode;
        }
      }

      // Fallback: try to extract from URL or other elements
      const breadcrumbElements = document.querySelectorAll('[class*="breadcrumb"] [class*="name"]');
      for (const element of breadcrumbElements) {
        const text = element.textContent || '';
        const courseMatch = text.match(/([a-z]\d{3,4})/i);
        if (courseMatch) {
          const courseCode = courseMatch[1].toUpperCase();
          console.log('WGU Extension: Found course code in breadcrumb:', courseCode);
          return courseCode;
        }
      }

      console.log('WGU Extension: No course code found in Discord DOM');
      return null;
    }

    // Create WGU info panel for Discord
    function createWguInfoPanel(serverId: string, channelId: string, courseCode: string | null, channelInfo: any | null = null) {
      const panelId = 'wgu-extension-discord-panel';
      
      // Remove existing panel
      const existingPanel = document.getElementById(panelId);
      if (existingPanel) {
        existingPanel.remove();
      }

      // Create panel
      const panel = document.createElement('div');
      panel.id = panelId;
      panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #2f3136;
        border: 1px solid #40444b;
        border-radius: 8px;
        padding: 12px;
        color: #dcddde;
        font-family: Whitney, Helvetica Neue, Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 9999;
        max-width: 300px;
        min-width: 250px;
      `;

      let content = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <img src="${browser.runtime.getURL('assets/icon.png')}" style="height: 20px; margin-right: 8px;">
          <strong>WGU Extension</strong>
        </div>
      `;

      if (courseCode) {
        content += `
          <div style="margin-bottom: 8px;">
            <strong>Course:</strong> ${courseCode}
          </div>
        `;

        // Show full course title if we have channel info from our mapping
        if (channelInfo?.full_name) {
          content += `
            <div style="margin-bottom: 8px; font-size: 12px; color: #b9bbbe;">
              ${channelInfo.full_name}
            </div>
          `;
        }

        // Show validation status
        const validationStatus = channelInfo ? '✅ Verified Channel' : '⚠️ Unverified Channel';
        const validationColor = channelInfo ? '#43b581' : '#faa61a';
        content += `
          <div style="margin-bottom: 8px; font-size: 11px; color: ${validationColor};">
            ${validationStatus}
          </div>
        `;

        content += `
          <div style="margin-bottom: 8px;">
            <a href="https://my.wgu.edu/courses/course/${courseCode.replace(' (Retired)', '')}" 
               target="_blank" 
               style="color: #00aff4; text-decoration: none;">
              📚 View Course Page
            </a>
          </div>
        `;
      } else {
        content += `
          <div style="margin-bottom: 8px; color: #b9bbbe;">
            No course detected in this channel
          </div>
          <div style="margin-bottom: 8px; font-size: 11px; color: #faa61a;">
            ⚠️ Channel not in WGU mapping
          </div>
        `;
      }

      content += `
        <div style="font-size: 12px; color: #72767d;">
          Server: ${serverId.slice(-4)}... | Channel: ${channelId.slice(-4)}...
        </div>
      `;

      panel.innerHTML = content;

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: #b9bbbe;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      closeBtn.onclick = () => panel.remove();
      panel.appendChild(closeBtn);

      document.body.appendChild(panel);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (panel && panel.parentNode) {
          panel.style.opacity = '0.3';
        }
      }, 10000);
    }

    // Main execution
    async function initialize() {
      const urlInfo = parseDiscordUrl();
      if (!urlInfo) {
        return;
      }

      const whitelist = await loadWhitelist();
      if (!whitelist) {
        console.error('WGU Extension: Could not load whitelist');
        return;
      }

      if (!isWhitelisted(urlInfo.serverId, whitelist)) {
        console.log('WGU Extension: Server not whitelisted, extension inactive');
        return;
      }

      const discordChannels = await loadDiscordChannels();
      if (!discordChannels) {
        console.error('WGU Extension: Could not load Discord channels mapping');
        return;
      }

      console.log('WGU Extension: Activating on whitelisted Discord server');
      
      // Wait for Discord to load channel content
      setTimeout(() => {
        // First, validate the channel exists in our mapping
        const validation = validateChannelInMapping(urlInfo.serverId, urlInfo.channelId, discordChannels);
        
        if (validation.isValid && validation.courseCode) {
          // Use the course code from our mapping (most reliable)
          console.log(`WGU Extension: Using mapped course code: ${validation.courseCode}`);
          createWguInfoPanel(urlInfo.serverId, urlInfo.channelId, validation.courseCode, validation.channelInfo);
        } else {
          // Fallback: try to extract course code from DOM
          const fallbackCourseCode = extractCourseCodeFromChannel();
          if (fallbackCourseCode) {
            console.log(`WGU Extension: Using fallback course code: ${fallbackCourseCode} (channel not in mapping)`);
            createWguInfoPanel(urlInfo.serverId, urlInfo.channelId, fallbackCourseCode, null);
          } else {
            console.log('WGU Extension: Channel not in mapping and no course code detected in DOM');
            // Still show panel but with no course info
            createWguInfoPanel(urlInfo.serverId, urlInfo.channelId, null, null);
          }
        }
      }, 2000);
    }

    // Handle navigation changes in Discord (SPA routing)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('WGU Extension: Discord navigation detected');
        setTimeout(initialize, 1000); // Delay for Discord to load new content
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial load
    initialize();
  },
});