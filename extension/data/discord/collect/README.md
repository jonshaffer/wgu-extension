# Discord Data Collection

This directory contains scripts for collecting WGU-related Discord data from Discord servers when users visit them in their browser.

## Overview

The Discord collection system automatically detects when users visit WGU-related Discord servers and extracts community data including channels, members, and server information.

## Files

### discord-extractor.ts
**Core extraction logic for Discord data**

- Extracts server information (name, ID, channels, members)
- Identifies WGU-related channels based on names and course codes
- Detects course codes in channel names (e.g., C123, IT-4770, etc.)
- Provides utilities for server and channel identification

**Key Classes:**
- `DiscordExtractor` - Main extraction class
- `DiscordServerData` - Type definition for server data
- `DiscordChannel` - Type definition for channel data

### content-script-integration.ts
**Integration layer for extension content scripts**

- Automatic detection of WGU Discord servers
- Periodic data collection with cooldown management
- Extension storage integration
- Background script communication
- Event-driven data collection

**Key Classes:**
- `DiscordDataCollector` - Main collection orchestrator
- `DiscordDataStorage` - Handles extension storage operations

### examples/
**Sample Discord HTML structure for testing**

- Contains example Discord page HTML for parser development
- Used for testing extraction logic against real Discord markup

## Integration with Extension

### Content Script Usage

```typescript
import { initializeDiscordCollection } from './data/discord/collect/content-script-integration.js';

// Auto-initialize Discord data collection
const collector = initializeDiscordCollection();

// Manual collection
const data = await collector.collectNow();
```

### Background Script Integration

```typescript
// Listen for Discord data collection events
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DISCORD_DATA_COLLECTED') {
    console.log('New Discord data collected:', message.data);
    // Process or forward the data
  }
});
```

## Data Collection Strategy

### Automatic Detection
- Monitors Discord URLs: `discord.com/channels/{serverId}/{channelId}`
- Identifies WGU servers by name patterns and channel analysis
- Collects data every 30 seconds with 5-minute cooldown per server

### WGU Server Detection
Servers are identified as WGU-related if they have:
- Server name containing "WGU", "Western Governors", etc.
- Channels with WGU-related keywords
- Channels with course codes (C123, IT4770, etc.)

### Data Collected
- **Server Info**: ID, name, URL
- **Channels**: Name, type, course codes, WGU relevance
- **Members**: Online users, usernames, roles
- **Metadata**: Collection timestamp, extraction details

## Privacy & Ethics

- Only collects publicly visible Discord information
- No message content or private channel data
- User consent through extension installation
- Data used only for WGU community mapping
- Respects Discord's terms of service

## Storage Format

Data is stored in extension local storage:

```json
{
  "servers": {
    "1234567890": {
      "serverId": "1234567890",
      "serverName": "WGU Computer Science",
      "channels": [...],
      "members": [...],
      "extractedAt": "2025-08-10T...",
      "url": "https://discord.com/channels/..."
    }
  },
  "lastCollection": "2025-08-10T..."
}
```

## Development & Testing

Run extraction on sample data:
```bash
# Test with example HTML
npx tsx data/discord/collect/test-extraction.ts
```

## Future Enhancements

- Message sentiment analysis
- Course-specific activity tracking
- Integration with Reddit/WGU Connect data
- Real-time activity monitoring
- Advanced member role detection