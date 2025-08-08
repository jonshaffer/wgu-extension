import { storage } from '@wxt-dev/storage';
import { ENABLE_REDDIT_INTEGRATION } from '@/utils/storage.constants';

export default defineContentScript({
  matches: ['https://www.reddit.com/r/WGU*', 'https://old.reddit.com/r/WGU*', 'https://new.reddit.com/r/WGU*'],
  runAt: 'document_end',

  async main(ctx) {
    console.log('WGU Extension: Reddit content script loaded');

    // Check if Reddit integration is enabled
    const isRedditEnabled = await storage.getItem<boolean>(ENABLE_REDDIT_INTEGRATION);
    if (isRedditEnabled === false) {
      console.log('WGU Extension: Reddit integration disabled by user');
      return;
    }

    // Extract subreddit from URL
    function parseRedditUrl(): { subreddit: string; isPost: boolean; postId?: string } | null {
      const urlMatch = window.location.pathname.match(/^\/r\/([^\/]+)(?:\/comments\/([^\/]+))?/);
      if (!urlMatch) {
        console.log('WGU Extension: Not on a Reddit subreddit page');
        return null;
      }
      
      return {
        subreddit: urlMatch[1],
        isPost: !!urlMatch[2],
        postId: urlMatch[2]
      };
    }

    // Load Reddit communities from extension assets
    async function loadRedditCommunities() {
      try {
        const response = await fetch(browser.runtime.getURL('reddit-communities.json'));
        if (!response.ok) {
          throw new Error(`Failed to load Reddit communities: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('WGU Extension: Error loading Reddit communities:', error);
        return null;
      }
    }

    // Check if current subreddit is whitelisted
    function isWhitelisted(subreddit: string, communities: any): boolean {
      if (!communities?.settings?.enable_reddit_integration) {
        console.log('WGU Extension: Reddit integration disabled in config');
        return false;
      }

      if (communities.settings.require_community_whitelist) {
        const isAllowed = Object.values(communities.communities || {}).some((community: any) => 
          community.name === `r/${subreddit}`
        );
        console.log(`WGU Extension: Subreddit r/${subreddit} ${isAllowed ? 'is' : 'is not'} whitelisted`);
        return isAllowed;
      }

      return true;
    }

    // Detect course codes in Reddit posts and comments
    function detectCourseCodes(): string[] {
      const courseCodes: Set<string> = new Set();
      const coursePattern = /\b([A-Z]\d{3,4})\b/gi;

      // Check post title
      const titleElement = document.querySelector('[data-test-id="post-content"] h1, .title, [slot="title"]');
      if (titleElement) {
        const matches = titleElement.textContent?.match(coursePattern);
        if (matches) {
          matches.forEach(code => courseCodes.add(code.toUpperCase()));
        }
      }

      // Check post content
      const contentElements = document.querySelectorAll('[data-test-id="post-content"] p, .usertext-body p, .md p');
      contentElements.forEach(element => {
        const matches = element.textContent?.match(coursePattern);
        if (matches) {
          matches.forEach(code => courseCodes.add(code.toUpperCase()));
        }
      });

      // Check comments (first few visible ones)
      const commentElements = document.querySelectorAll('.comment .usertext-body, [data-testid="comment"] p');
      Array.from(commentElements).slice(0, 10).forEach(element => {
        const matches = element.textContent?.match(coursePattern);
        if (matches) {
          matches.forEach(code => courseCodes.add(code.toUpperCase()));
        }
      });

      return Array.from(courseCodes);
    }

    // Create WGU helper panel for Reddit
    function createWguHelperPanel(subreddit: string, courseCodes: string[], isPost: boolean) {
      const panelId = 'wgu-extension-reddit-panel';
      
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
        background: #1a1a1b;
        border: 1px solid #343536;
        border-radius: 8px;
        padding: 12px;
        color: #d7dadc;
        font-family: 'Noto Sans', Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 9999;
        max-width: 300px;
        min-width: 250px;
      `;

      let content = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <img src="${browser.runtime.getURL('icons/16.png')}" style="height: 20px; margin-right: 8px;">
          <strong>WGU Extension</strong>
        </div>
      `;

      content += `
        <div style="margin-bottom: 8px;">
          <strong>Subreddit:</strong> r/${subreddit}
        </div>
      `;

      if (courseCodes.length > 0) {
        content += `
          <div style="margin-bottom: 8px;">
            <strong>Detected Courses:</strong>
          </div>
        `;

        courseCodes.forEach(courseCode => {
          content += `
            <div style="margin-bottom: 4px;">
              <a href="https://my.wgu.edu/courses/course/${courseCode}" 
                 target="_blank" 
                 style="color: #ff4500; text-decoration: none; font-size: 12px;">
                📚 ${courseCode} - View Course Page
              </a>
            </div>
          `;
        });
      } else {
        content += `
          <div style="margin-bottom: 8px; color: #818384; font-size: 12px;">
            No WGU course codes detected in this ${isPost ? 'post' : 'page'}
          </div>
        `;
      }

      // Add helpful links
      content += `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #343536;">
          <div style="font-size: 12px; color: #818384; margin-bottom: 4px;">Quick Links:</div>
          <div style="margin-bottom: 4px;">
            <a href="https://my.wgu.edu" target="_blank" style="color: #ff4500; text-decoration: none; font-size: 12px;">
              🎓 WGU Portal
            </a>
          </div>
          <div style="margin-bottom: 4px;">
            <a href="https://my.wgu.edu/coaching-report" target="_blank" style="color: #ff4500; text-decoration: none; font-size: 12px;">
              📊 Coaching Report
            </a>
          </div>
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
        color: #818384;
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

      // Auto-hide after 15 seconds
      setTimeout(() => {
        if (panel && panel.parentNode) {
          panel.style.opacity = '0.4';
        }
      }, 15000);
    }

    // Main execution
    async function initialize() {
      const urlInfo = parseRedditUrl();
      if (!urlInfo) {
        return;
      }

      const redditCommunities = await loadRedditCommunities();
      if (!redditCommunities) {
        console.error('WGU Extension: Could not load Reddit communities');
        return;
      }

      if (!isWhitelisted(urlInfo.subreddit, redditCommunities)) {
        console.log('WGU Extension: Subreddit not whitelisted, extension inactive');
        return;
      }

      console.log('WGU Extension: Activating on whitelisted Reddit community');
      
      // Wait for Reddit to load content (Reddit is SPA)
      setTimeout(() => {
        const courseCodes = detectCourseCodes();
        createWguHelperPanel(urlInfo.subreddit, courseCodes, urlInfo.isPost);
      }, 2000);
    }

    // Handle navigation changes in Reddit (SPA routing)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('WGU Extension: Reddit navigation detected');
        setTimeout(initialize, 1500); // Delay for Reddit to load new content
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