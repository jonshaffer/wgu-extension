# Community Data Management

This directory contains all community data management for the WGU Extension, including data ingestion, transformation, and the resulting processed files.

## Directory Structure

```
data/
├── scripts/           # Data pipeline scripts
│   ├── ingest-discord.ts        # Discord community data ingestion
│   ├── ingest-reddit.ts         # Reddit community data ingestion  
│   ├── ingest-wgu-connect.ts    # WGU Connect group data ingestion
│   ├── transform-unified.ts     # Data transformation pipeline
│   └── run-data-pipeline.ts     # Main orchestrator script
├── types/            # TypeScript type definitions
│   └── community-data.ts        # All community data schemas
├── raw/              # Raw ingested data (JSON files)
│   ├── discord/      # Individual Discord community files
│   │   ├── {id}.json            # One file per Discord community (by ID)
│   │   └── ...
│   ├── reddit/       # Individual Reddit community files
│   │   ├── {subreddit}.json     # One file per subreddit
│   │   └── ...
│   └── wgu-connect.json         # Combined WGU Connect groups
└── processed/        # Processed data ready for extension use
```

## Data Pipeline

The data pipeline follows an **ingestion → transformation → utilization** cycle:

### 1. Ingestion Phase
- `npm run data:ingest` - Run complete pipeline (recommended)
- `npm run data:ingest:discord` - Ingest Discord data only
- `npm run data:ingest:reddit` - Ingest Reddit data only  
- `npm run data:ingest:wgu-connect` - Ingest WGU Connect data only

### 2. Transformation Phase
- `npm run data:transform` - Transform raw data to processed format

### 3. Utilization
- Processed data is consumed by `utils/enhanced-community-data.ts`
- Extension loads data via `browser.runtime.getURL()` at runtime

## Data Sources

### Discord Communities
- **University Level**: WGU main Discord server
- **College Level**: College-specific Discord servers
- **Course Level**: Course-specific channels within servers

### Reddit Communities  
- **University Level**: r/WGU main subreddit
- **College Level**: College-specific subreddits
- **Course Level**: Course-specific posts/megathreads

### WGU Connect Groups
- **Course Level**: Official WGU Connect course groups
- **Study Groups**: Student-created study groups

## Data Format

All processed data follows a hierarchical structure:
- **University Level**: Communities for all WGU students
- **College Level**: Communities specific to colleges (IT, Business, etc.)
- **Course Level**: Communities specific to individual courses

### Git-Based Timestamps
- **Raw Data**: No timestamps (managed by git history)
- **Processed Data**: `lastUpdated` field added during transformation using git commit history
- **Fallback**: Current timestamp if git history unavailable

## Development

1. **Add New Data**: Edit the ingestion scripts to add new communities
2. **Update Schema**: Modify `types/community-data.ts` for new data structures
3. **Transform Logic**: Update `transform-unified.ts` for new processing needs
4. **Test Pipeline**: Run `npm run data:ingest` to validate changes

## Notes

- Raw data files are gitignored to avoid committing sensitive data
- Processed data is included in the extension build
- All scripts support both manual curation and future API integration
- TypeScript provides compile-time validation of data structures
- Discord communities stored as individual `{id}.json` files in `raw/discord/`
- Reddit communities stored as individual `{subreddit}.json` files in `raw/reddit/`
- No legacy combined files - each community is self-contained
