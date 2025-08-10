# Reddit Data Processing

This directory contains tools and data for processing WGU-related Reddit communities.

## Directory Structure

- `raw/` - Raw Reddit data from various WGU subreddits
- `processed/` - Processed and normalized community data
- `scripts/` - Processing and ingestion scripts

## Data Sources

- r/WGU - Main WGU community
- r/WGU_CompSci - Computer Science students
- r/WGU_IT - IT students  
- r/WGU_Business - Business students
- r/WGU_Cybersecurity - Cybersecurity students
- r/WGU_Teachers - Education students

## Usage

Run the ingestion script to process raw Reddit data:
```bash
npx tsx scripts/ingest-reddit.ts
```