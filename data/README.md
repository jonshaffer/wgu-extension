# WGU Extension Data Directory

This directory contains all data processing infrastructure for the WGU Extension, organized by data source with a unified processing pipeline.

## Structure

Each data source has its own self-contained directory:

- **catalogs/** - WGU Institutional Catalogs (101+ historical catalogs)
- **reddit/** - Reddit Communities (6 subreddits) 
- **discord/** - Discord Communities
- **wgu-connect/** - WGU Connect Course Communities (12 courses)
- **wgu-student-groups/** - Student Organizations (2 groups)
- **unified/** - Unified Community Data Processing

## Base Scripts

### run-data-pipeline.ts
**Purpose**: Main orchestrator that runs the complete data pipeline

**Process**:
1. **Ingestion Phase**: Processes raw data from all sources
2. **Transformation Phase**: Creates unified community dataset
3. **Output**: Final unified-community-data.json for extension

**Usage**:
```bash
npx tsx data/run-data-pipeline.ts
```

## Architecture

Each directory follows a consistent pattern:
- `raw/` - Source data files
- `processed/` - Normalized output data  
- `scripts/` - Processing and ingestion scripts
- `README.md` - Documentation and usage
- Type definitions (where applicable)

The main pipeline orchestrator coordinates processing across all sources while maintaining clear separation of concerns.

## Future

Course Descriptions & Course of Study
https://app.sharebase.com/#/folder/6002/share/138-4wgYt3vWGssTwqC11wc--K-ggKp8

All Degree Programs (to get Program Guides)
https://www.wgu.edu/online-degree-programs.html
