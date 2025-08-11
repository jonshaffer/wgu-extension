/**
 * WGU Connect Data Extractor
 * 
 * Extracts resource data from WGU Connect community pages
 * Handles SPA navigation and tab changes via mutation observation
 */

export interface WGUConnectResourceData {
  groupId: string;
  groupName: string;
  resources: WGUConnectResource[];
  activeTab: string;
  extractedAt: string;
  url: string;
}

export interface WGUConnectResource {
  id: string;
  title: string;
  category: string;
  type: 'resource' | 'announcement' | 'recording' | 'tip';
  imageUrl?: string;
  link?: string;
}

/**
 * Main extractor class for WGU Connect resources
 */
export class WGUConnectExtractor {
  private groupIdPattern = /\/groups\/([^\/]+)/;
  private observer: MutationObserver | null = null;

  /**
   * Extracts group ID from current WGU Connect URL
   */
  getGroupId(): string | null {
    const match = window.location.pathname.match(this.groupIdPattern);
    return match?.[1] || null;
  }

  /**
   * Extracts group name from WGU Connect UI
   */
  getGroupName(): string {
    // Look for group title in various possible locations
    const titleSelectors = [
      'h1[class*="title"]',
      '[class*="group-title"]', 
      '[class*="header"] h1',
      'h1',
      '[data-testid="group-title"]'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Unknown Group';
  }

  /**
   * Gets the currently active tab name
   */
  getActiveTab(): string {
    const activeTab = document.querySelector('.group-resources-nav [aria-selected="true"]');
    return activeTab?.textContent?.trim() || 'Unknown Tab';
  }

  /**
   * Extracts resources from the resources container
   */
  extractResources(): WGUConnectResource[] {
    const resources: WGUConnectResource[] = [];
    
    // Look for resource cards container
    const resourceContainer = document.querySelector('.resources-card__container__ShEmi') ||
                             document.querySelector('[role="list"]') ||
                             document.querySelector('.group-r-tile-container');
    
    if (!resourceContainer) {
      console.log('[WGU Connect] No resource container found');
      return resources;
    }

    // Extract resource cards
    const resourceCards = resourceContainer.querySelectorAll('[role="listitem"], .ant-card');
    
    resourceCards.forEach((card, index) => {
      const resource = this.extractResourceFromCard(card as HTMLElement, index);
      if (resource) {
        resources.push(resource);
      }
    });

    return resources;
  }

  /**
   * Extracts resource data from individual card element
   */
  private extractResourceFromCard(card: HTMLElement, index: number): WGUConnectResource | null {
    try {
      // Extract title
      const titleElement = card.querySelector('.resource-card__head-container-title__hqT6q span span') ||
                           card.querySelector('h2 span') ||
                           card.querySelector('[class*="title"]');
      
      const title = titleElement?.textContent?.trim();
      if (!title) return null;

      // Extract resource ID from various possible locations
      let resourceId = card.id || 
                       card.getAttribute('data-id') ||
                       card.getAttribute('data-resource-id');
      
      // Try to extract ID from nested elements or URL patterns
      if (!resourceId) {
        const idElement = card.querySelector('[data-id]') ||
                         card.querySelector('[id^="resource"]') ||
                         card.querySelector('a[href*="/resource/"]');
        
        if (idElement) {
          resourceId = idElement.getAttribute('data-id') ||
                      idElement.id ||
                      idElement.getAttribute('href')?.match(/\/resource\/(\d+)/)?.[1];
        }
      }
      
      // Fallback to index-based ID
      if (!resourceId) {
        resourceId = `resource_${index}`;
      }

      // Extract category from tag
      const categoryElement = card.querySelector('.ant-tag') ||
                             card.querySelector('[class*="chip"]') ||
                             card.querySelector('[class*="category"]');
      
      const category = categoryElement?.textContent?.trim() || 'Uncategorized';

      // Extract image URL
      const imageElement = card.querySelector('img');
      const imageUrl = imageElement?.getAttribute('src');

      // Extract link (if available - might be in click handler or data attributes)
      const linkElement = card.querySelector('a[href]') ||
                         card.querySelector('[role="link"]') ||
                         card.querySelector('[data-href]') ||
                         card.querySelector('[data-url]');
      
      let link = linkElement?.getAttribute('href') ||
                 linkElement?.getAttribute('data-href') ||
                 linkElement?.getAttribute('data-url');
      
      // If no direct link found, check for click handler patterns
      if (!link) {
        const clickableElement = card.querySelector('[tabindex="0"][role="link"]') ||
                                 card.querySelector('.resource-card__head-container-title__hqT6q');
        
        if (clickableElement) {
          // Try to extract resource ID from card structure for link construction
          const resourceIdMatch = resourceId.match(/\d+/);
          if (resourceIdMatch) {
            // Construct potential resource link based on WGU Connect patterns
            const groupId = this.getGroupId();
            link = `https://wguconnect.wgu.edu/hub/wgu-connect/groups/${groupId}/resource/${resourceIdMatch[0]}`;
          }
        }
      }
      
      // Ensure link is absolute if it exists
      if (link && !link.startsWith('http')) {
        if (link.startsWith('/')) {
          link = `https://wguconnect.wgu.edu${link}`;
        } else {
          link = `https://wguconnect.wgu.edu/${link}`;
        }
      }

      // Determine resource type based on category or tab context
      const resourceType = this.determineResourceType(category, title);

      return {
        id: resourceId,
        title,
        category,
        type: resourceType,
        imageUrl,
        link
      };

    } catch (error) {
      console.error('[WGU Connect] Error extracting resource from card:', error);
      return null;
    }
  }

  /**
   * Determines resource type based on category and title
   */
  private determineResourceType(category: string, title: string): WGUConnectResource['type'] {
    const lowerCategory = category.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerCategory.includes('announcement') || lowerTitle.includes('announcement')) {
      return 'announcement';
    }
    if (lowerCategory.includes('recording') || lowerTitle.includes('recording')) {
      return 'recording';
    }
    if (lowerCategory.includes('tip') || lowerTitle.includes('tip')) {
      return 'tip';
    }
    
    return 'resource';
  }

  /**
   * Main extraction method - returns complete resource data
   */
  extractResourceData(): WGUConnectResourceData | null {
    const groupId = this.getGroupId();
    if (!groupId) {
      console.log('[WGU Connect] No group ID found in URL');
      return null;
    }

    return {
      groupId,
      groupName: this.getGroupName(),
      resources: this.extractResources(),
      activeTab: this.getActiveTab(),
      extractedAt: new Date().toISOString(),
      url: window.location.href
    };
  }

  /**
   * Sets up mutation observer to watch for SPA tab changes
   */
  setupTabChangeObserver(callback: (data: WGUConnectResourceData | null) => void): void {
    // Clean up existing observer
    if (this.observer) {
      this.observer.disconnect();
    }

    // Create new mutation observer
    this.observer = new MutationObserver((mutations) => {
      let shouldTriggerExtraction = false;

      mutations.forEach((mutation) => {
        // Check for changes in tab selection
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-selected') {
          shouldTriggerExtraction = true;
        }
        
        // Check for changes in resource container
        if (mutation.type === 'childList') {
          const target = mutation.target as Element;
          if (target.matches('.resources-card__container__ShEmi, [role="list"], .group-r-tile-container') ||
              target.closest('.resources-card__container__ShEmi, [role="list"], .group-r-tile-container')) {
            shouldTriggerExtraction = true;
          }
        }
      });

      if (shouldTriggerExtraction) {
        // Delay extraction to allow DOM to settle
        setTimeout(() => {
          const data = this.extractResourceData();
          callback(data);
        }, 500);
      }
    });

    // Start observing
    const targetElement = document.querySelector('.groups-resources-notshrink') || document.body;
    
    this.observer.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-selected', 'class']
    });

    console.log('[WGU Connect] Mutation observer setup complete');
  }

  /**
   * Stops the mutation observer
   */
  stopObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Checks if current page is a WGU Connect resources page
   */
  isResourcesPage(): boolean {
    return window.location.pathname.includes('/resources') ||
           document.querySelector('.group-resources-nav') !== null ||
           document.querySelector('.resources-card__container__ShEmi') !== null;
  }
}

/**
 * Utility function for easy extraction from content scripts
 */
export function extractWGUConnectData(): WGUConnectResourceData | null {
  const extractor = new WGUConnectExtractor();
  return extractor.extractResourceData();
}

/**
 * Checks if current page is a WGU Connect group resources page
 */
export function isWGUConnectResourcesPage(): boolean {
  const extractor = new WGUConnectExtractor();
  return extractor.isResourcesPage();
}