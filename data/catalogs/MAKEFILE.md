# WGU Catalog Makefile Documentation

## Overview
The Makefile provides a centralized command interface for all catalog management operations.

## Quick Start
```bash
# Show all available commands
make help

# Common workflows
make fetch-current        # Download latest catalog
make parse-latest         # Parse the most recent PDF
make report              # Generate analytics report
make stats               # Quick statistics overview
```

## Key Features
- **Color-coded output** for better readability
- **Comprehensive help** with examples
- **Error handling** with clear messages
- **Shortcuts** for common commands (p, r, v, c)
- **Workflows** for complex multi-step processes

## Command Categories

### Parsing
- `parse FILE=path/to/pdf` - Parse single catalog
- `parse-all` - Parse all PDFs
- `parse-latest` - Parse most recent catalog

### Catalog Management
- `fetch-current` - Download current catalog
- `check-new` - Check for new releases
- `ingest` - Full ingestion pipeline

### Reporting & Analytics
- `report` - Full analytics report
- `report-analytics` - Display analytics
- `report-readme` - Update README
- `inventory` - File inventory
- `stats` - Quick statistics

### Validation & Testing
- `validate FILE=catalog-name` - Validate parsed data
- `test` - Run all tests
- `test-catalog FILE=pdf` - Test specific catalog

### Workflows
- `workflow-monthly` - Complete monthly update
- `workflow-new-catalog FILE=pdf` - Process new catalog
- `workflow-quality-check` - Quality validation

## Implementation Notes
- Uses `tsx` directly (no `npx` needed)
- All paths relative to catalogs directory
- Color escape codes for terminal output
- Proper error handling with exit codes