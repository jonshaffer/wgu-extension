import { storage } from '@wxt-dev/storage';
import { ENABLE_WGU_CONNECT_INTEGRATION } from '@/utils/storage.constants';

export default defineContentScript({
  matches: ['https://wguconnect.wgu.edu/*'],
  runAt: 'document_end',

  async main(ctx) {
    console.log('WGU Extension: WGU Connect content script loaded');

    // Check if WGU Connect integration is enabled
    const isWguConnectEnabled = await storage.getItem<boolean>(ENABLE_WGU_CONNECT_INTEGRATION);
    if (isWguConnectEnabled === false) {
      console.log('WGU Extension: WGU Connect integration disabled by user');
      return;
    }

    // Load WGU Connect groups from extension assets
    async function loadWguConnectGroups() {
      try {
        const response = await fetch(browser.runtime.getURL('wgu-connect-groups.json'));
        if (!response.ok) {
          throw new Error(`Failed to load WGU Connect groups: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('WGU Extension: Error loading WGU Connect groups:', error);
        return null;
      }
    }

    // Get current group info from URL
    function getCurrentGroupInfo(wguConnectGroups: any): { groupId: string; groupData: any } | null {
      const urlMatch = window.location.pathname.match(/\/groups\/([^\/]+)/);
      if (!urlMatch) {
        return null;
      }

      const groupId = urlMatch[1];
      const groupData = wguConnectGroups?.groups?.[groupId];

      if (groupData) {
        return { groupId, groupData };
      }

      return null;
    }

    // Detect course codes in Connect posts and discussions
    function detectCourseCodes(): string[] {
      const courseCodes: Set<string> = new Set();
      const coursePattern = /\b([A-Z]\d{3,4})\b/gi;

      // Check post titles and content
      const contentElements = document.querySelectorAll('h1, h2, h3, h4, p, .post-content, .discussion-title, .topic-title');
      contentElements.forEach(element => {
        const matches = element.textContent?.match(coursePattern);
        if (matches) {
          matches.forEach(code => courseCodes.add(code.toUpperCase()));
        }
      });

      return Array.from(courseCodes);
    }

    // Find related groups for detected course codes
    function findRelatedGroups(courseCodes: string[], wguConnectGroups: any): any[] {
      if (!wguConnectGroups?.groups) return [];

      const relatedGroups: any[] = [];
      const currentUrl = window.location.href;

      Object.entries(wguConnectGroups.groups).forEach(([groupId, groupData]: [string, any]) => {
        // Skip if this is the current group
        if (currentUrl.includes(groupId)) return;

        // Check if any detected course code matches this group's course codes
        const hasMatchingCourse = groupData.course_codes?.some((code: string) => 
          courseCodes.includes(code.toUpperCase())
        );

        if (hasMatchingCourse) {
          relatedGroups.push({ groupId, ...groupData });
        }
      });

      return relatedGroups;
    }

    // Extract current context info from WGU Connect
    function getConnectContext(): { section: string; topic?: string } {
      const url = window.location.href;
      let section = 'WGU Connect';
      
      // Try to determine the section from URL patterns
      if (url.includes('/discussions')) {
        section = 'Discussions';
      } else if (url.includes('/groups')) {
        section = 'Groups';
      } else if (url.includes('/calendar')) {
        section = 'Calendar';
      } else if (url.includes('/profile')) {
        section = 'Profile';
      } else if (url.includes('/messages')) {
        section = 'Messages';
      }

      // Try to get topic/group name from page
      const topicElement = document.querySelector('h1, .page-title, .group-title, .discussion-title');
      const topic = topicElement?.textContent?.trim() || undefined;

      return { section, topic };
    }

    // Create WGU helper panel for Connect
    function createWguConnectPanel(courseCodes: string[], context: { section: string; topic?: string }, currentGroup: any = null, relatedGroups: any[] = []) {
      const panelId = 'wgu-extension-connect-panel';
      
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
        background: #ffffff;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        padding: 12px;
        color: #333;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 320px;
        min-width: 280px;
      `;

      let content = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <img src="${browser.runtime.getURL('icons/16.png')}" style="height: 20px; margin-right: 8px;">
          <strong style="color: #0073e6;">WGU Extension</strong>
        </div>
      `;

      // Show current group info if available
      if (currentGroup) {
        content += `
          <div style="margin-bottom: 8px; font-size: 12px; background: #f0f8ff; padding: 6px; border-radius: 4px;">
            <strong style="color: #0073e6;">Current Group:</strong> ${currentGroup.groupData.name}
          </div>
        `;

        if (currentGroup.groupData.course_codes?.length > 0) {
          content += `
            <div style="margin-bottom: 8px; font-size: 11px; color: #666;">
              <strong>Covers:</strong> ${currentGroup.groupData.course_codes.join(', ')}
            </div>
          `;
        }

        // Add quick links for discussions and resources
        content += `
          <div style="margin-bottom: 8px; font-size: 12px;">
            <a href="${currentGroup.groupData.discussions_url}" style="color: #0073e6; text-decoration: none; margin-right: 8px;">
              💬 Discussions
            </a>
            <a href="${currentGroup.groupData.resources_url}" style="color: #0073e6; text-decoration: none;">
              📚 Resources
            </a>
          </div>
        `;
      } else {
        content += `
          <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
            <strong>Section:</strong> ${context.section}
          </div>
        `;

        if (context.topic) {
          content += `
            <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
              <strong>Topic:</strong> ${context.topic.length > 50 ? context.topic.substring(0, 50) + '...' : context.topic}
            </div>
          `;
        }
      }

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
                 style="color: #0073e6; text-decoration: none; font-size: 12px;">
                📚 ${courseCode} - View Course Page
              </a>
            </div>
          `;
        });
      } else {
        content += `
          <div style="margin-bottom: 8px; color: #666; font-size: 12px;">
            No WGU course codes detected on this page
          </div>
        `;
      }

      // Show related groups if any
      if (relatedGroups.length > 0) {
        content += `
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e1e5e9;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px; font-weight: bold;">Related Groups:</div>
        `;

        relatedGroups.slice(0, 3).forEach(group => { // Show max 3 related groups
          content += `
            <div style="margin-bottom: 4px; font-size: 11px;">
              <a href="${group.url}" style="color: #0073e6; text-decoration: none;">
                🏫 ${group.name}
              </a>
            </div>
          `;
        });

        content += `</div>`;
      }

      // Add helpful Connect-specific links
      content += `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e1e5e9;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Quick Links:</div>
          <div style="margin-bottom: 4px;">
            <a href="https://my.wgu.edu" target="_blank" style="color: #0073e6; text-decoration: none; font-size: 12px;">
              🎓 WGU Portal
            </a>
          </div>
          <div style="margin-bottom: 4px;">
            <a href="https://my.wgu.edu/coaching-report" target="_blank" style="color: #0073e6; text-decoration: none; font-size: 12px;">
              📊 Coaching Report
            </a>
          </div>
          <div style="margin-bottom: 4px;">
            <a href="https://connect.wgu.edu/discussions" target="_blank" style="color: #0073e6; text-decoration: none; font-size: 12px;">
              💬 Connect Discussions
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
        color: #666;
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

    // Add course code highlighter
    function highlightCourseCodes() {
      const coursePattern = /\b([A-Z]\d{3,4})\b/g;
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Skip script, style, and already processed nodes
            const parent = node.parentElement;
            if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || 
                parent.classList.contains('wgu-extension-highlighted')) {
              return NodeFilter.FILTER_REJECT;
            }
            return coursePattern.test(node.textContent || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const nodesToReplace: { node: Text, parent: Element, html: string }[] = [];

      let node;
      while (node = walker.nextNode()) {
        const textNode = node as Text;
        const parent = textNode.parentElement!;
        const text = textNode.textContent || '';
        
        const highlightedText = text.replace(coursePattern, (match) => {
          return `<a href="https://my.wgu.edu/courses/course/${match}" target="_blank" 
                     style="background: #fff3cd; color: #856404; text-decoration: none; padding: 1px 3px; border-radius: 3px; font-weight: 500;"
                     title="Open ${match} course page">${match}</a>`;
        });

        if (highlightedText !== text) {
          nodesToReplace.push({ node: textNode, parent, html: highlightedText });
        }
      }

      // Apply replacements
      nodesToReplace.forEach(({ node, parent, html }) => {
        const wrapper = document.createElement('span');
        wrapper.className = 'wgu-extension-highlighted';
        wrapper.innerHTML = html;
        parent.replaceChild(wrapper, node);
      });
    }

    // Main execution
    async function initialize() {
      console.log('WGU Extension: Activating on WGU Connect');
      
      const wguConnectGroups = await loadWguConnectGroups();
      if (!wguConnectGroups) {
        console.error('WGU Extension: Could not load WGU Connect groups data');
        return;
      }

      // Wait for Connect to load content
      setTimeout(() => {
        const courseCodes = detectCourseCodes();
        const context = getConnectContext();
        const currentGroup = getCurrentGroupInfo(wguConnectGroups);
        
        // If we're in a group, use its course codes; otherwise use detected ones
        let effectiveCourseCodes = courseCodes;
        if (currentGroup?.groupData?.course_codes) {
          effectiveCourseCodes = [...new Set([...courseCodes, ...currentGroup.groupData.course_codes])];
        }
        
        const relatedGroups = findRelatedGroups(effectiveCourseCodes, wguConnectGroups);
        
        createWguConnectPanel(effectiveCourseCodes, context, currentGroup, relatedGroups);
        highlightCourseCodes();
      }, 2000);
    }

    // Handle navigation changes in WGU Connect (SPA-like behavior)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('WGU Extension: WGU Connect navigation detected');
        setTimeout(initialize, 1500); // Delay for Connect to load new content
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