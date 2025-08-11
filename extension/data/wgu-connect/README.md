# WGU Connect Data Processing

This directory contains tools and data for processing WGU Connect community data.

## Directory Structure

- `raw/` - Raw WGU Connect course and community data
- `processed/` - Processed and normalized community data
- `scripts/` - Processing and ingestion scripts

## Data Sources

- Course-specific WGU Connect communities
- Study groups and collaboration spaces
- Course discussions and resources

## Usage

Run the ingestion script to process raw WGU Connect data:
```bash
npx tsx scripts/ingest-wgu-connect.ts
```