import { storage } from '@wxt-dev/storage';
import { ENABLE_COURSE_COMMUNITIES } from '@/utils/storage.constants';
import { extractCourseCode } from '@/utils/course-utils';

const GITHUB_COMMUNITIES_BASE_URL = 'https://raw.githubusercontent.com/jonshaffer/wgu-extension/main/assets/communities/'; // Note the trailing slash
const CACHED_COMMUNITIES_KEY_PREFIX = 'cachedCommunityMappings_';
const LAST_FETCH_TIMESTAMP_KEY_PREFIX = 'lastFetchTimestamp_';
const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000;

const CTA_CONTRIBUTE_URL = 'https://github.com/jonshaffer/wgu-extension/tree/main/assets/communities';

// Define an interface for community link structure for clarity

// Special object to indicate that a course-specific JSON file was not found (404)
const COURSE_FILE_NOT_FOUND = { status: 'not_found_on_github' };
interface CommunityLink {
  name: string;
  url: string;
}

interface CourseCommunityMappings {
  discord?: CommunityLink[];
  reddit?: CommunityLink[];
  // other?: CommunityLink[]; // For future expansion
}

// SVG Icons (as strings)
const DISCORD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="height: 13px; max-width: 17px; margin-right: 4px; display: inline-block; position: relative; top: 3px; fill: #5865F2;"><path d="M524.5 69.8a1.5 1.5 0 0 0 -.8-.7A485.1 485.1 0 0 0 404.1 32a1.8 1.8 0 0 0 -1.9 .9 337.5 337.5 0 0 0 -14.9 30.6 447.8 447.8 0 0 0 -134.4 0 309.5 309.5 0 0 0 -15.1-30.6 1.9 1.9 0 0 0 -1.9-.9A483.7 483.7 0 0 0 116.1 69.1a1.7 1.7 0 0 0 -.8 .7C39.1 183.7 18.2 294.7 28.4 404.4a2 2 0 0 0 .8 1.4A487.7 487.7 0 0 0 176 479.9a1.9 1.9 0 0 0 2.1-.7A348.2 348.2 0 0 0 208.1 430.4a1.9 1.9 0 0 0 -1-2.6 321.2 321.2 0 0 1 -45.9-21.9 1.9 1.9 0 0 1 -.2-3.1c3.1-2.3 6.2-4.7 9.1-7.1a1.8 1.8 0 0 1 1.9-.3c96.2 43.9 200.4 43.9 295.5 0a1.8 1.8 0 0 1 1.9 .2c2.9 2.4 6 4.9 9.1 7.2a1.9 1.9 0 0 1 -.2 3.1 301.4 301.4 0 0 1 -45.9 21.8 1.9 1.9 0 0 0 -1 2.6 391.1 391.1 0 0 0 30 48.8 1.9 1.9 0 0 0 2.1 .7A486 486 0 0 0 610.7 405.7a1.9 1.9 0 0 0 .8-1.4C623.7 277.6 590.9 167.5 524.5 69.8zM222.5 337.6c-29 0-52.8-26.6-52.8-59.2S193.1 219.1 222.5 219.1c29.7 0 53.3 26.8 52.8 59.2C275.3 311 251.9 337.6 222.5 337.6zm195.4 0c-29 0-52.8-26.6-52.8-59.2S388.4 219.1 417.9 219.1c29.7 0 53.3 26.8 52.8 59.2C470.7 311 447.5 337.6 417.9 337.6z"></path></svg>`;
const REDDIT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="height: 17px; max-width: 17px; display: inline-block; position: relative; top: 3px; margin-right: 4px; fill: #FF4500;"><path d="M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32zM305.9 166.4c20.6 0 37.3-16.7 37.3-37.3s-16.7-37.3-37.3-37.3c-18 0-33.1 12.8-36.6 29.8c-30.2 3.2-53.8 28.8-53.8 59.9l0 .2c-32.8 1.4-62.8 10.7-86.6 25.5c-8.8-6.8-19.9-10.9-32-10.9c-28.9 0-52.3 23.4-52.3 52.3c0 21 12.3 39 30.1 47.4c1.7 60.7 67.9 109.6 149.3 109.6s147.6-48.9 149.3-109.7c17.7-8.4 29.9-26.4 29.9-47.3c0-28.9-23.4-52.3-52.3-52.3c-12 0-23 4-31.9 10.8c-24-14.9-54.3-24.2-87.5-25.4l0-.1c0-22.2 16.5-40.7 37.9-43.7l0 0c3.9 16.5 18.7 28.7 36.3 28.7zM155 248.1c14.6 0 25.8 15.4 25 34.4s-11.8 25.9-26.5 25.9s-27.5-7.7-26.6-26.7s13.5-33.5 28.1-33.5zm166.4 33.5c.9 19-12 26.7-26.6 26.7s-25.6-6.9-26.5-25.9c-.9-19 10.3-34.4 25-34.4s27.3 14.6 28.1 33.5zm-42.1 49.6c-9 21.5-30.3 36.7-55.1 36.7s-46.1-15.1-55.1-36.7c-1.1-2.6 .7-5.4 3.4-5.7c16.1-1.6 33.5-2.5 51.7-2.5s35.6 .9 51.7 2.5c2.7 .3 4.5 3.1 3.4 5.7z"></path></svg>`;
const WGU_CONNECT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 16px; max-width: 16px; display: inline-block; position: relative; top: 2px; margin-right: 4px; fill: #0073e6;"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9H21ZM21 10H9V15H12V22H15V18H18V22H21V10Z"></path></svg>`;
const WGU_ICON_URL = browser.runtime.getURL('/icon-ext.png' as any);


export default defineContentScript({
  matches: ['https://my.wgu.edu/courses/course/*'],
  runAt: 'document_end',

  async main(ctx) {
    console.log('🎯 Course Details Content Script Loaded on:', window.location.href);

    // Enhanced SPA navigation detection using WXT's built-in event
    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      console.log('📍 WGU SPA Navigation detected via wxt:locationchange!');
      console.log('  To:', newUrl);
      
      // Re-run our main logic after navigation
      setTimeout(() => initCourseDetails(ctx), 100);
    });

    // Fallback: polling detection for edge cases
    let lastUrl = window.location.href;
    const checkForNavigation = () => {
      if (window.location.href !== lastUrl) {
        console.log('📍 WGU SPA Navigation detected via polling fallback!');
        console.log('  From:', lastUrl);
        console.log('  To:', window.location.href);
        lastUrl = window.location.href;
        
        // Re-run our main logic after navigation
        setTimeout(() => initCourseDetails(ctx), 100);
      }
    };
    
    // Check for navigation every 1000ms (less frequent since we have wxt:locationchange)
    const navigationWatcher = ctx.setInterval(checkForNavigation, 1000);

    // Run the main initialization
    await initCourseDetails(ctx);
  }
});

async function initCourseDetails(ctx: any) {
    console.log('🚀 Initializing course details for:', window.location.href);

    // Check if course communities feature is enabled
    const isCommunitiesEnabled = await storage.getItem<boolean>(ENABLE_COURSE_COMMUNITIES);
    if (isCommunitiesEnabled === false) {
      console.log('WGU Extension: Course communities disabled by user');
      return;
    }


    async function fetchAndCacheCommunityMappings(courseCode: string): Promise<any | null | typeof COURSE_FILE_NOT_FOUND> {
      const lowerCaseCourseCode = courseCode.toLowerCase();
      const fetchUrl = `${GITHUB_COMMUNITIES_BASE_URL}${lowerCaseCourseCode}.json`;
      console.log(`Attempting to fetch community mappings from: ${fetchUrl}`);

      try {
        const response = await fetch(fetchUrl);

        if (response.status === 404) {
          console.warn(`Course-specific community file not found (404) for ${courseCode} at ${fetchUrl}`);
          // Clear any potentially stale cache for this specific course if its file is now reported as not found.
          await browser.storage.local.remove([
            `${CACHED_COMMUNITIES_KEY_PREFIX}${lowerCaseCourseCode}`,
            `${LAST_FETCH_TIMESTAMP_KEY_PREFIX}${lowerCaseCourseCode}`
          ]);
          return COURSE_FILE_NOT_FOUND;
        }

        if (!response.ok) {
          throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText} for URL: ${fetchUrl}`);
        }

        const mappings = await response.json();
        await browser.storage.local.set({
          [`${CACHED_COMMUNITIES_KEY_PREFIX}${lowerCaseCourseCode}`]: mappings,
          [`${LAST_FETCH_TIMESTAMP_KEY_PREFIX}${lowerCaseCourseCode}`]: Date.now(),
        });
        console.log(`Successfully fetched and cached mappings for ${courseCode} from GitHub.`);
        return mappings;
      } catch (error) {
        console.error(`Error fetching community mappings for ${courseCode} from GitHub:`, error);
        return null; // Indicates a general fetch failure (not a 404)
      }
    }

async function loadCommunityMappings(courseCode: string): Promise<any | null | typeof COURSE_FILE_NOT_FOUND> {
  const lowerCaseCourseCode = courseCode.toLowerCase();
  const cacheKey = `${CACHED_COMMUNITIES_KEY_PREFIX}${lowerCaseCourseCode}`;
  const timestampKey = `${LAST_FETCH_TIMESTAMP_KEY_PREFIX}${lowerCaseCourseCode}`;

  let cachedData;
  let lastFetchTime;

  try {
    const result = await browser.storage.local.get([cacheKey, timestampKey]);
    cachedData = result[cacheKey];
    lastFetchTime = result[timestampKey];
  } catch (e) {
    console.error(`Error reading from storage for ${courseCode}:`, e);
    // Treat as cache miss if storage read fails, initialized downstream
  }

  const now = Date.now();

  if (cachedData && lastFetchTime && (now - lastFetchTime < ONE_DAY_MS)) {
    console.log(`Using cached community mappings for ${courseCode} (less than a day old).`);
    return cachedData;
  }

  // If cache is stale or not present, attempt to fetch
  console.log(cachedData ? `Cached community mappings for ${courseCode} are stale.` : `No cached community mappings found for ${courseCode}. Attempting to fetch from GitHub.`);

  // Pass courseCode to fetchAndCacheCommunityMappings
  // fetchAndCacheCommunityMappings itself handles lowercasing for the URL construction.
  const freshFetchResult = await fetchAndCacheCommunityMappings(courseCode);

  if (freshFetchResult === COURSE_FILE_NOT_FOUND) {
    console.log(`Community file not found on GitHub for ${courseCode}.`);
    return COURSE_FILE_NOT_FOUND; // Propagate "not found" status
  }

  if (freshFetchResult !== null) { // Successfully fetched fresh data
    console.log(`Successfully fetched fresh data for ${courseCode}.`);
    return freshFetchResult;
  }

  // Fetch failed (freshFetchResult is null), but there might be stale data
  if (cachedData) {
    console.log(`GitHub fetch failed for ${courseCode}, but using stale cached data.`);
    return cachedData;
  }

  // Fetch failed and no cache whatsoever
  console.log(`GitHub fetch failed for ${courseCode} and no cached data available.`);
  return null;
}

    function generateLinkListItem(link: CommunityLink, iconSvg: string): string {
      return `
        <li _ngcontent-ng-c2827564221="">
          ${iconSvg}
          ${link.name}: <a href="${link.url}" target="_blank">link</a>
        </li>
      `;
    }

    function generateCommunityPanelHTML(courseId: string, mappings: CourseCommunityMappings | null | typeof COURSE_FILE_NOT_FOUND): string {
      let panelBodyContent = '';

      if (mappings === COURSE_FILE_NOT_FOUND) {
        panelBodyContent = `
          <div _ngcontent-ng-c2827564221="" class="expansion-content" style="border-radius: 0 0 5px 5px; padding: 15px; text-align: center;">
            <p>Community links for <strong>${courseId}</strong> haven't been added yet.</p>
            <p><a href="${CTA_CONTRIBUTE_URL}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">Want to help? Click here to contribute!</a></p>
          </div>
        `;
      } else if (mappings && mappings !== COURSE_FILE_NOT_FOUND && typeof mappings === 'object' && 'discord' in mappings) {
        const communityMappings = mappings as CourseCommunityMappings;
        let listItems = '';
        if (communityMappings.discord) {
          communityMappings.discord.forEach((link: CommunityLink) => {
            listItems += generateLinkListItem(link, DISCORD_ICON_SVG);
          });
        }
        if (communityMappings.reddit) {
          communityMappings.reddit.forEach((link: CommunityLink) => {
            listItems += generateLinkListItem(link, REDDIT_ICON_SVG);
          });
        }

        if (!listItems) {
          panelBodyContent = `
            <div _ngcontent-ng-c2827564221="" class="expansion-content" style="border-radius: 0 0 5px 5px; padding: 15px;">
              No specific links currently listed for ${courseId}.
            </div>
          `;
        } else {
          panelBodyContent = `
            <div _ngcontent-ng-c2827564221="" class="expansion-content" style="border-radius: 0 0 5px 5px;">
              <ul _ngcontent-ng-c2827564221="" class="tipsAnnouncmentList">
                ${listItems}
              </ul>
            </div>
          `;
        }
      } else { // Mappings object exists but is empty, or other unhandled cases
        panelBodyContent = `
          <div _ngcontent-ng-c2827564221="" class="expansion-content" style="border-radius: 0 0 5px 5px; padding: 15px;">
            Community link information for ${courseId} is currently unavailable.
          </div>
        `;
      }

      const panelId = `wgu-ext-community-panel-${courseId}`;
      const childId = `wgu-ext-community-child-${courseId}`;

      // The overall panel structure (header) remains the same.
      return `
        <mat-expansion-panel _ngcontent-ng-c2827564221="" class="mat-expansion-panel mat-elevation-z0 mat-expansion-panel-animations-enabled mat-expanded mat-expansion-panel-spacing">
          <mat-expansion-panel-header _ngcontent-ng-c2827564221="" role="button" class="mat-expansion-panel-header mat-focus-indicator mat-expansion-toggle-indicator-after mat-expanded" id="${panelId}-header" tabindex="0" aria-controls="${childId}" aria-expanded="true" aria-disabled="false" style="height: 40px;cursor: default;border-radius: 5px 5px 0 0;">
            <span class="mat-content">
              <img src="${WGU_ICON_URL}" style="height: 25px; margin-right: 10px;">
              <mat-panel-title _ngcontent-ng-c2827564221="" class="mat-expansion-panel-header-title">
                <span _ngcontent-ng-c2827564221="" class="accordion-title">Outside Community</span>
              </mat-panel-title>
            </span>
          </mat-expansion-panel-header>
          <div class="mat-expansion-panel-content-wrapper" style="visibility: visible;">
            <div role="region" class="mat-expansion-panel-content" id="${childId}" aria-labelledby="${panelId}-header">
              <div class="mat-expansion-panel-body">
                ${panelBodyContent}
              </div>
            </div>
          </div>
        </mat-expansion-panel>
      `;
    }

    // Load our extension's community data
    async function loadExtensionCommunityData() {
      try {
        console.log('Loading extension community data...');
        console.log('Extension ID:', browser.runtime.id);
        
        const discordUrl = browser.runtime.getURL('discord-whitelist.json' as any);
        const redditUrl = browser.runtime.getURL('reddit-communities.json' as any);
        const wguConnectUrl = browser.runtime.getURL('wgu-connect-groups.json' as any);
        
        console.log('Discord URL:', discordUrl);
        console.log('Reddit URL:', redditUrl);
        console.log('WGU Connect URL:', wguConnectUrl);
        
        const [discordData, redditData, wguConnectData] = await Promise.all([
          fetch(discordUrl).then(r => r.json()),
          fetch(redditUrl).then(r => r.json()),
          fetch(wguConnectUrl).then(r => r.json())
        ]);
        return { discordData, redditData, wguConnectData };
      } catch (error) {
        console.error('Error loading extension community data:', error);
        return null;
      }
    }

    // Find relevant communities for the current course
    function findRelevantCommunities(courseCode: string, communityData: any): any[] {
      const communities: any[] = [];

      // Discord communities
      if (communityData.discordData?.communities) {
        Object.values(communityData.discordData.communities).forEach((community: any) => {
          communities.push({
            type: 'discord',
            name: community.name,
            url: `https://discord.com/channels/${community.id}`,
            icon: DISCORD_ICON_SVG
          });
        });
      }

      // Reddit communities  
      if (communityData.redditData?.communities) {
        Object.values(communityData.redditData.communities).forEach((community: any) => {
          communities.push({
            type: 'reddit',
            name: community.name,
            url: community.url,
            icon: REDDIT_ICON_SVG
          });
        });
      }

      // WGU Connect groups for this course
      if (communityData.wguConnectData?.groups) {
        Object.values(communityData.wguConnectData.groups).forEach((group: any) => {
          if (group.course_codes && group.course_codes.includes(courseCode.toUpperCase())) {
            communities.push({
              type: 'wgu-connect',
              name: `${group.name} - Discussions`,
              url: group.discussions_url,
              icon: WGU_CONNECT_ICON_SVG
            });
            communities.push({
              type: 'wgu-connect', 
              name: `${group.name} - Resources`,
              url: group.resources_url,
              icon: WGU_CONNECT_ICON_SVG
            });
          }
        });
      }

      return communities;
    }

    // Generate new communities panel HTML
    function generateCommunitiesSectionHTML(courseCode: string, communities: any[]) {
      const panelId = `wgu-ext-communities-panel-${courseCode}`;
      const childId = `wgu-ext-communities-child-${courseCode}`;

      let communityLinks = '';
      if (communities.length > 0) {
        communities.forEach(community => {
          communityLinks += `
            <div style="margin-bottom: 8px;">
              ${community.icon}
              <a href="${community.url}" target="_blank" style="color: #0073e6; text-decoration: none;">
                ${community.name}
              </a>
            </div>
          `;
        });
      } else {
        communityLinks = `
          <div style="color: #666; font-size: 14px; text-align: center; padding: 10px;">
            No communities found for ${courseCode}
          </div>
        `;
      }

      return `
        <mat-expansion-panel _ngcontent-ng-c2637661723="" class="mat-expansion-panel mat-elevation-z0 mat-expansion-panel-animations-enabled">
          <mat-expansion-panel-header _ngcontent-ng-c2637661723="" role="button" class="mat-expansion-panel-header mat-focus-indicator mat-expansion-toggle-indicator-after" id="${panelId}-header" tabindex="0" aria-controls="${childId}" aria-expanded="false" aria-disabled="false" style="height: 40px;">
            <span class="mat-content">
              <mat-panel-title _ngcontent-ng-c2637661723="" class="mat-expansion-panel-header-title">
                <span _ngcontent-ng-c2637661723="" class="accordion-title">Communities</span>
              </mat-panel-title>
            </span>
            <span class="mat-expansion-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"></path>
              </svg>
            </span>
          </mat-expansion-panel-header>
          <div class="mat-expansion-panel-content-wrapper" inert="">
            <div role="region" class="mat-expansion-panel-content" id="${childId}" aria-labelledby="${panelId}-header">
              <div class="mat-expansion-panel-body">
                <div _ngcontent-ng-c2637661723="" class="expansion-content" style="padding: 15px;">
                  ${communityLinks}
                </div>
              </div>
            </div>
          </div>
        </mat-expansion-panel>
      `;
    }

    function injectCommunitiesSection(htmlString: string) {
      // Find the mat-accordion container
      const accordion = document.querySelector('mat-accordion');
      if (accordion) {
        // Remove existing communities panel if it exists
        const existingPanel = document.getElementById('wgu-ext-communities-section');
        if (existingPanel) {
          existingPanel.remove();
        }

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.id = 'wgu-ext-communities-section';
        wrapper.innerHTML = htmlString;

        // Insert after the last expansion panel
        accordion.appendChild(wrapper.firstElementChild!);
        console.log('Communities section injected into sidebar.');
      } else {
        console.warn('mat-accordion not found. Cannot inject communities section.');
      }
    }

    function injectHTML(htmlString: string) {
      const targetContainer = document.querySelector('.right-side-container');
      if (targetContainer) {
        const currentPanel = document.getElementById('wgu-ext-community-panel-wrapper');
        if(currentPanel) {
            currentPanel.remove();
        }
        const panelWrapper = document.createElement('div');
        panelWrapper.id = 'wgu-ext-community-panel-wrapper';
        panelWrapper.innerHTML = htmlString;
        targetContainer.appendChild(panelWrapper);
        console.log('Community links panel injected.');
      } else {
        console.warn('.right-side-container not found. Cannot inject HTML.');
      }
    }

    // --- Main script execution flow ---
    const courseCode = await extractCourseCode();

    if (courseCode) {
      // Load extension community data and inject new communities section
      const communityData = await loadExtensionCommunityData();
      if (communityData) {
        const relevantCommunities = findRelevantCommunities(courseCode, communityData);
        const communitiesSectionHtml = generateCommunitiesSectionHTML(courseCode, relevantCommunities);
        
        // Wait a bit for Angular to finish rendering the sidebar
        setTimeout(() => {
          injectCommunitiesSection(communitiesSectionHtml);
        }, 1000);
      }

      // Keep the existing community panel functionality
      const mappingResult = await loadCommunityMappings(courseCode);

      if (mappingResult === null) { // General fetch error, no cache
        console.log(`No community links panel will be displayed for ${courseCode} due to fetch error and no cache.`);
      } else {
        // This includes COURSE_FILE_NOT_FOUND or actual mappings
        // generateCommunityPanelHTML can handle COURSE_FILE_NOT_FOUND directly
        console.log(`Displaying community panel for ${courseCode}. Status/Mappings:`, mappingResult);
        const panelHtml = generateCommunityPanelHTML(courseCode, mappingResult);
        // panelHtml should always be a string, even if it's an empty panel or CTA
        // The old check `if (panelHtml)` was for when generateCommunityPanelHTML could return "" for no links.
        // Now, it always returns a full panel structure or the CTA.
        injectHTML(panelHtml);
      }
    }
}
