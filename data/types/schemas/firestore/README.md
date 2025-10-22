# Firestore Schemas

This directory contains JSON schemas for documents stored in Firestore collections.

## Collections

### `discord`
- **Schema**: `discord-community.schema.json`
- **Documents**: Discord communities with embedded channels
- **ID**: Discord server ID (e.g., `600152872767979523`)
- **Purpose**: Store complete Discord server information including all channels

### `wgu-student-groups`
- **Schema**: `wgu-student-group.schema.json`
- **Documents**: WGU student organizations and clubs
- **ID**: Group identifier (e.g., `cybersecurity-club`)
- **Purpose**: Store information about official WGU student groups

### `wgu-connect-groups`
- **Schema**: Uses existing `wgu-connect-group.schema.json` from `../../../wgu-connect/types/`
- **Documents**: WGU Connect study groups
- **ID**: Group identifier
- **Purpose**: Store WGU Connect course-specific study groups

### `reddit-communities`
- **Schema**: Uses existing `reddit-community.schema.json` from `../../../reddit/types/`
- **Documents**: Reddit communities relevant to WGU
- **ID**: Subreddit name (e.g., `WGU_CompSci`)
- **Purpose**: Store Reddit community information

### `catalogs`
- **Schema**: `catalog-month.schema.json`
- **Documents**: Monthly WGU course catalog snapshots
- **ID**: Month identifier (e.g., `2025-08`)
- **Purpose**: Store historical course catalog data by month


## Schema Validation

All schemas follow JSON Schema Draft 07 specification and include:
- Required fields validation
- Type checking
- Format validation (URLs, dates)
- Enum constraints where applicable
- Pattern matching for IDs

## Usage

These schemas are used by:
- `functions/sync-github-to-firestore.ts` for data validation during sync
- Firebase Functions for runtime validation
- GraphQL resolvers for type safety
- Extension content scripts for data structure verification