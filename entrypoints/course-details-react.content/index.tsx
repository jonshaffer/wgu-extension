import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from '@wxt-dev/storage';
import { ENABLE_COURSE_COMMUNITIES } from '@/utils/storage.constants';
import { extractCourseCode } from '@/utils/course-utils';
import { loadCommunityData } from '@/utils/community-data';
import { CommunitiesPanel } from '@/components/course-details/CommunitiesPanel';
import { SearchPanel } from '@/components/course-details/SearchPanel';

// SVG Icons
const DISCORD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="height: 13px; max-width: 17px; margin-right: 4px; display: inline-block; position: relative; top: 3px; fill: #5865F2;"><path d="M524.5 69.8a1.5 1.5 0 0 0 -.8-.7A485.1 485.1 0 0 0 404.1 32a1.8 1.8 0 0 0 -1.9 .9 337.5 337.5 0 0 0 -14.9 30.6 447.8 447.8 0 0 0 -134.4 0 309.5 309.5 0 0 0 -15.1-30.6 1.9 1.9 0 0 0 -1.9-.9A483.7 483.7 0 0 0 116.1 69.1a1.7 1.7 0 0 0 -.8 .7C39.1 183.7 18.2 294.7 28.4 404.4a2 2 0 0 0 .8 1.4A487.7 487.7 0 0 0 176 479.9a1.9 1.9 0 0 0 2.1-.7A348.2 348.2 0 0 0 208.1 430.4a1.9 1.9 0 0 0 -1-2.6 321.2 321.2 0 0 1 -45.9-21.9 1.9 1.9 0 0 1 -.2-3.1c3.1-2.3 6.2-4.7 9.1-7.1a1.8 1.8 0 0 1 1.9-.3c96.2 43.9 200.4 43.9 295.5 0a1.8 1.8 0 0 1 1.9 .2c2.9 2.4 6 4.9 9.1 7.2a1.9 1.9 0 0 1 -.2 3.1 301.4 301.4 0 0 1 -45.9 21.8 1.9 1.9 0 0 0 -1 2.6 391.1 391.1 0 0 0 30 48.8 1.9 1.9 0 0 0 2.1 .7A486 486 0 0 0 610.7 405.7a1.9 1.9 0 0 0 .8-1.4C623.7 277.6 590.9 167.5 524.5 69.8zM222.5 337.6c-29 0-52.8-26.6-52.8-59.2S193.1 219.1 222.5 219.1c29.7 0 53.3 26.8 52.8 59.2C275.3 311 251.9 337.6 222.5 337.6zm195.4 0c-29 0-52.8-26.6-52.8-59.2S388.4 219.1 417.9 219.1c29.7 0 53.3 26.8 52.8 59.2C470.7 311 447.5 337.6 417.9 337.6z"></path></svg>`;
const REDDIT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="height: 17px; max-width: 17px; display: inline-block; position: relative; top: 3px; margin-right: 4px; fill: #FF4500;"><path d="M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32zM305.9 166.4c20.6 0 37.3-16.7 37.3-37.3s-16.7-37.3-37.3-37.3c-18 0-33.1 12.8-36.6 29.8c-30.2 3.2-53.8 28.8-53.8 59.9l0 .2c-32.8 1.4-62.8 10.7-86.6 25.5c-8.8-6.8-19.9-10.9-32-10.9c-28.9 0-52.3 23.4-52.3 52.3c0 21 12.3 39 30.1 47.4c1.7 60.7 67.9 109.6 149.3 109.6s147.6-48.9 149.3-109.7c17.7-8.4 29.9-26.4 29.9-47.3c0-28.9-23.4-52.3-52.3-52.3c-12 0-23 4-31.9 10.8c-24-14.9-54.3-24.2-87.5-25.4l0-.1c0-22.2 16.5-40.7 37.9-43.7l0 0c3.9 16.5 18.7 28.7 36.3 28.7zM155 248.1c14.6 0 25.8 15.4 25 34.4s-11.8 25.9-26.5 25.9s-27.5-7.7-26.6-26.7s13.5-33.5 28.1-33.5zm166.4 33.5c.9 19-12 26.7-26.6 26.7s-25.6-6.9-26.5-25.9c-.9-19 10.3-34.4 25-34.4s27.3 14.6 28.1 33.5zm-42.1 49.6c-9 21.5-30.3 36.7-55.1 36.7s-46.1-15.1-55.1-36.7c-1.1-2.6 .7-5.4 3.4-5.7c16.1-1.6 33.5-2.5 51.7-2.5s35.6 .9 51.7 2.5c2.7 .3 4.5 3.1 3.4 5.7z"></path></svg>`;
const WGU_CONNECT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 16px; max-width: 16px; display: inline-block; position: relative; top: 2px; margin-right: 4px; fill: #0073e6;"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9H21ZM21 10H9V15H12V22H15V18H18V22H21V10Z"></path></svg>`;

interface CommunityLink {
  type: 'discord' | 'reddit' | 'wgu-connect';
  name: string;
  url: string;
  icon: string;
}

export default defineContentScript({
  matches: ['https://my.wgu.edu/courses/course/*'],
  runAt: 'document_end',

  async main(ctx) {
    console.log('Course Details React Content Script Loaded');

    // Check if course communities feature is enabled
    const isCommunitiesEnabled = await storage.getItem<boolean>(ENABLE_COURSE_COMMUNITIES);
    if (isCommunitiesEnabled === false) {
      console.log('WGU Extension: Course communities disabled by user');
      return;
    }

    function findRelevantCommunities(courseCode: string, communityData: any): CommunityLink[] {
      const communities: CommunityLink[] = [];

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

    function injectCommunityComponents(courseCode: string, communities: CommunityLink[]) {
      // Find the right-side-container where search buttons are typically placed
      const rightSideContainer = document.querySelector('.right-side-container');
      if (!rightSideContainer) {
        console.warn('right-side-container not found. Cannot inject community components.');
        return;
      }

      // Remove existing panels if they exist
      const existingCommunitiesPanel = document.getElementById('wgu-ext-communities-react-panel');
      const existingSearchPanel = document.getElementById('wgu-ext-search-react-panel');
      if (existingCommunitiesPanel) existingCommunitiesPanel.remove();
      if (existingSearchPanel) existingSearchPanel.remove();

      // Find the mat-accordion container for the communities panel
      const accordion = document.querySelector('mat-accordion');
      if (accordion) {
        // Create communities panel container
        const communitiesContainer = document.createElement('div');
        communitiesContainer.id = 'wgu-ext-communities-react-panel';
        communitiesContainer.style.cssText = `
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: rgba(0, 0, 0, 0.87);
          background: white;
          border-radius: 4px;
          box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
          margin-bottom: 16px;
        `;

        // Insert the communities container into the accordion
        accordion.appendChild(communitiesContainer);

        // Create React root and render the communities panel
        const communitiesRoot = ReactDOM.createRoot(communitiesContainer);
        communitiesRoot.render(
          <CommunitiesPanel 
            courseCode={courseCode}
            communities={communities}
            defaultExpanded={false}
          />
        );

        console.log('Communities React panel injected into sidebar.');
      }

      // Create search panel container and place it after the accordion
      const searchContainer = document.createElement('div');
      searchContainer.id = 'wgu-ext-search-react-panel';
      searchContainer.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: rgba(0, 0, 0, 0.87);
        background: white;
        border-radius: 4px;
        box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
        margin-top: 12px;
      `;

      // Find where to place the search panel (after the original course search button or at the end)
      const originalSearchButton = rightSideContainer.querySelector('.course-btns');
      if (originalSearchButton) {
        // Replace/hide the original search button and insert our panel
        (originalSearchButton as HTMLElement).style.display = 'none';
        originalSearchButton.parentNode?.insertBefore(searchContainer, originalSearchButton.nextSibling);
      } else {
        // Just append to the end of the container
        rightSideContainer.appendChild(searchContainer);
      }

      // Create React root and render the search panel
      const searchRoot = ReactDOM.createRoot(searchContainer);
      searchRoot.render(
        <SearchPanel 
          courseCode={courseCode}
          showDefaultSearch={true}
        />
      );

      console.log('Search React panel injected into sidebar.');
    }

    // Main execution
    const courseCode = await extractCourseCode();
    if (!courseCode) return;

    // Wait a bit longer for extension context to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    const communityData = await loadCommunityData();
    if (!communityData) return;

    const relevantCommunities = findRelevantCommunities(courseCode, communityData);

    // Wait for Angular to finish rendering the sidebar
    setTimeout(() => {
      injectCommunityComponents(courseCode, relevantCommunities);
    }, 1500);
  },
});