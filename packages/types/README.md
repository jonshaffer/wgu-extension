# @wgu-extension/types

Shared TypeScript types and Zod schemas for WGU Extension data.

This package exposes runtime-validated schemas (zod) and inferred TS types for:
- Discord raw community files (server + channels)
- Reddit community descriptors
 - Parsed WGU Catalog data (courses, degree plans, metadata)

SearchDoc is intentionally excluded; define it within your site app.

## Install

npm install @wgu-extension/types zod

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
