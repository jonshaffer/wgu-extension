# @wgu-extension/types

Shared TypeScript types and Zod schemas for WGU Extension data.

This package exposes runtime-validated schemas (zod) and inferred TS types for:
- Discord raw community files (server + channels)
- Reddit community descriptors
 - Parsed WGU Catalog data (courses, degree plans, metadata)

SearchDoc is intentionally excluded; define it within your site app.

## Install

```bash
# Install latest stable release
npm install @wgu-extension/types zod

# Install prerelease version (from PRs)
npm install @wgu-extension/types@next zod

# Install local development version
npm install @wgu-extension/types@local zod
```

## Version Tags

- **`latest`** - Stable releases (default)
- **`next`** - Prerelease versions from release PRs (`{version}-next.{sha}`)  
- **`local`** - Local development builds (`{version}-local.{timestamp}`)

## Usage

import { DiscordCommunityFileSchema, type DiscordCommunityFile } from '@wgu-extension/types';

const parsed = DiscordCommunityFileSchema.safeParse(data);
if (!parsed.success) throw new Error('invalid');
const community: DiscordCommunityFile = parsed.data;

// Catalogs
import { CatalogDataSchema, type CatalogData } from '@wgu-extension/types';
const catalog: CatalogData = CatalogDataSchema.parse(catalogJson);

## Build / Publish

- Builds to ESM with .d.ts
- Prepublish runs `tsc`
