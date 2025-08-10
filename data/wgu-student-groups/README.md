# WGU Student Groups Data Processing

This directory contains tools and data for processing WGU student organization and club data.

## Directory Structure

- `raw/` - Raw WGU student group and organization data
- `processed/` - Processed and normalized community data
- `scripts/` - Processing and ingestion scripts

## Data Sources

- Official WGU student organizations
- Student clubs and special interest groups
- Professional organizations with WGU chapters

## Usage

Run the ingestion script to process raw student group data:
```bash
npx tsx scripts/ingest-wgu-student-groups.ts
```