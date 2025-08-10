# WGU Connect Resource Collection

This directory contains scripts for collecting WGU Connect resource data from group pages when users visit them in their browser.

## Overview

The WGU Connect collection system automatically detects when users visit WGU Connect group resource pages and extracts resource data including titles, categories, and links. It handles Single Page Application (SPA) behavior with mutation observation to detect tab changes.

## Key Features

### 🔄 SPA Tab Change Detection
- **Mutation Observer**: Monitors DOM changes for tab switches
- **No URL Changes**: Handles tab navigation that doesn't change the URL
- **Real-time Collection**: Automatically extracts data when users click tabs

### 📊 Resource Extraction
- **Resource Cards**: Extracts title, category, type from resource cards
- **Multiple Tabs**: Supports "Course Resources", "WGU Resources", "Tips", "Announcements", "Cohort Recordings"
- **Smart Categorization**: Automatically determines resource type
- **Enhanced Link Extraction**: Captures resource links from multiple sources:
  - Direct `href` attributes on anchor tags
  - Data attributes (`data-href`, `data-url`)
  - Resource IDs for constructed URLs
  - Automatic absolute URL conversion

## Files

### wgu-connect-extractor.ts
**Core extraction logic for WGU Connect resources**

- Extracts group information and active tab
- Parses resource cards from the resources container
- Handles SPA mutation observation for tab changes
- Provides utilities for resource identification

**Key Classes:**
- `WGUConnectExtractor` - Main extraction class
- `WGUConnectResourceData` - Type definition for group resource data
- `WGUConnectResource` - Type definition for individual resources

### content-script-integration.ts
**Integration layer for extension content scripts**

- Automatic detection of WGU Connect resource pages
- SPA-aware data collection with tab change monitoring
- Extension storage integration with group/tab organization
- Background script communication

**Key Classes:**
- `WGUConnectDataCollector` - Main collection orchestrator
- `WGUConnectDataStorage` - Handles extension storage operations

### examples/
**Sample WGU Connect HTML structure**

- Contains example resource page HTML for parser development
- Shows the structure of resource cards and navigation tabs

## Integration with Extension

### Content Script Usage

```typescript
import { initializeWGUConnectCollection } from './data/wgu-connect/collect/content-script-integration.js';

// Auto-initialize WGU Connect data collection
const collector = initializeWGUConnectCollection();

// Manual collection
const data = await collector.collectNow();

// Collect all tabs
const allTabData = await collector.collectAllTabs();
```

### Background Script Integration

```typescript
// Listen for WGU Connect data collection events
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WGU_CONNECT_DATA_COLLECTED') {
    console.log('New WGU Connect data collected:', message.data);
    // Process or forward the data
  }
});
```

## Data Collection Strategy

### SPA Handling
- **Mutation Observer**: Watches for `aria-selected` changes on tab buttons
- **Resource Container Monitoring**: Detects changes in resource card container
- **Delayed Extraction**: Waits 500ms after changes for DOM to settle
- **Automatic Tab Detection**: Identifies active tab and extracts accordingly

### Collection Triggers
- Page load on resource pages
- Tab clicks (via mutation observation)
- Periodic checks (15-second intervals)
- Manual collection requests

### Data Collected Per Tab
- **Group Info**: ID, name, URL
- **Resources**: Title, category, type, image URL, **resource link**
- **Metadata**: Active tab, collection timestamp
- **Resource Types**: 'resource', 'announcement', 'recording', 'tip'
- **Link Sources**: Direct links, data attributes, constructed URLs from IDs

## Storage Format

Data is stored in extension local storage organized by group and tab:

```json
{
  "groups": {
    "c851d281-linux-foundations": {
      "groupName": "Linux Foundations",
      "tabs": {
        "WGU Resources": {
          "resources": [
            {
              "id": "130951",
              "title": "ACC Live Event Flyers (August 2025)",
              "category": "WGU Resources",
              "type": "resource",
              "imageUrl": "https://...",
              "link": "https://wguconnect.wgu.edu/hub/resource/130951"
            }
          ],
          "lastUpdated": "2025-08-10T...",
          "url": "https://wguconnect.wgu.edu/..."
        },
        "Course Resources": { ... },
        "Tips": { ... }
      }
    }
  },
  "lastCollection": "2025-08-10T..."
}
```

## URL Patterns

Monitors these WGU Connect URLs:
- `wguconnect.wgu.edu/hub/wgu-connect/groups/{groupId}/resources`
- Any WGU Connect URL containing "resources"

## SPA Technical Details

### Tab Navigation Detection
The system handles WGU Connect's SPA behavior where clicking tabs in `.group-resources-nav` doesn't change the URL:

1. **Mutation Observer Setup**: Watches the resources container and navigation
2. **Attribute Monitoring**: Detects `aria-selected="true"` changes on tab buttons
3. **Content Monitoring**: Watches for changes in `.resources-card__container__ShEmi`
4. **Delayed Processing**: Waits for DOM updates before extracting new data

### Resource Card Structure
Resources are extracted from this structure:
```html
<div class="resources-card__container__ShEmi" role="list">
  <div role="listitem" class="ant-card resource-card__CYRbS">
    <div class="ant-card-body">
      <h2 class="resource-card__head-container-title__hqT6q">
        <span tabindex="0" role="link">
          <span>Resource Title</span>
        </span>
      </h2>
      <div class="ant-tag">Category</div>
    </div>
  </div>
</div>
```

## Privacy & Ethics

- Only collects publicly visible resource information
- **No personal student data** (bookmarks, personal preferences, etc.)
- No private group content or personal interactions
- User consent through extension installation
- Data used for community resource mapping only
- Respects WGU Connect's terms of service

## Development & Testing

Test extraction on sample data:
```bash
# Test with example HTML
npx tsx data/wgu-connect/collect/test-extraction.ts
```

## Future Enhancements

- Resource usage analytics
- Cross-group resource comparison
- Integration with course catalog data
- Resource recommendation system
- Advanced categorization and tagging