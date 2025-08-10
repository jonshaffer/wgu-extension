# Discord Data Processing

This directory contains tools and data for processing WGU Discord community data.

## Directory Structure

- `raw/` - Raw Discord community data
- `processed/` - Processed and normalized community data  
- `scripts/` - Processing and ingestion scripts

## Data Sources

- WGU Discord servers and communities
- Course-specific Discord channels
- Study groups and collaboration spaces

## Usage

Run the ingestion script to process raw Discord data:
```bash
npx tsx scripts/ingest-discord.ts
```