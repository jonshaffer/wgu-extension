# Unified Community Data Processing

This directory contains tools and data for creating unified community datasets from all WGU community sources.

## Directory Structure

- `processed/` - Final unified community data combining all sources
- `scripts/` - Transformation and unification scripts  
- `community-data.ts` - TypeScript type definitions for unified data structures

## Data Sources Combined

The unified data combines processed data from:
- Reddit communities (6 subreddits)
- Discord communities  
- WGU Connect course communities (12 courses)
- WGU Student Groups and organizations (2 groups)

## Usage

Run the transformation script to create unified community data:
```bash
npx tsx scripts/transform-unified.ts
```

## Output

- `processed/unified-community-data.json` - Final unified dataset for the extension