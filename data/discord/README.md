# Discord Data Processing

This directory contains tools and data for processing WGU Discord community data, including live collection from Discord servers.

## Directory Structure

- `collect/` - **NEW** - Live data collection from Discord servers  
  - Scripts for extracting data from Discord when users visit WGU servers
  - Content script integration for browser extension
  - Automatic WGU server detection and data extraction
- `raw/` - Raw Discord community data
- `processed/` - Processed and normalized community data  
- `scripts/` - Processing and ingestion scripts

## Data Collection

### Live Collection (Extension)
The collect system automatically gathers Discord data when users visit WGU-related Discord servers:

```typescript
import { initializeDiscordCollection } from './collect/content-script-integration.js';

// Auto-initialize in content script
const collector = initializeDiscordCollection();
```

### Manual Processing
Run the ingestion script to process existing raw Discord data:
```bash
npx tsx scripts/ingest-discord.ts
```

## Data Sources

- **Live**: WGU Discord servers visited by extension users
- **Static**: Pre-collected Discord community data
- Course-specific Discord channels and study groups
- WGU student collaboration spaces

## Features

- 🔄 **Automatic WGU server detection** - Identifies servers by name and channel analysis
- 📊 **Channel analysis** - Extracts course codes and WGU-related content
- 👥 **Member tracking** - Online member counts and activity
- 🎯 **Privacy-focused** - Only public data, no message content
- ⏰ **Smart collection** - Cooldown periods to avoid over-collection