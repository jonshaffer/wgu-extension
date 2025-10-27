// Canonical type aliases referencing data/*/types without name conflicts.
// These are type-only aliases and introduce no runtime dependency.
// Note: Publishing this package to npm with these aliases will reference
// repo-relative paths in .d.ts. For external consumers, prefer the Zod types.

// Discord
export type CanonicalDiscordHierarchyLevel = import('../../../data/discord/types/raw-discord.js').DiscordHierarchyLevel;
export type CanonicalDiscordHierarchy = import('../../../data/discord/types/raw-discord.js').DiscordHierarchy;
export type CanonicalDiscordChannelType = import('../../../data/discord/types/raw-discord.js').DiscordChannelType;
export type CanonicalDiscordChannel = import('../../../data/discord/types/raw-discord.js').DiscordChannel;
export type CanonicalDiscordCommunity = import('../../../data/discord/types/raw-discord.js').DiscordCommunity;
export type CanonicalDiscordCommunityFile = import('../../../data/discord/types/raw-discord.js').DiscordCommunityFile;

// Reddit
export type CanonicalRedditCommunity = import('../../../data/reddit/types/reddit-community.js').RedditCommunity;

// Catalogs
export type CanonicalCatalogCourse = import('../../../data/catalogs/types/catalog-data.js').Course;
export type CanonicalCatalogDegreePlan = import('../../../data/catalogs/types/catalog-data.js').DegreePlan;
export type CanonicalCatalogDegreePlanCourse = import('../../../data/catalogs/types/catalog-data.js').DegreePlanCourse;
export type CanonicalCatalogFormatVersion = import('../../../data/catalogs/types/catalog-data.js').CatalogFormatVersion;
export type CanonicalCatalogMetadata = import('../../../data/catalogs/types/catalog-data.js').Metadata;
export type CanonicalCatalogData = import('../../../data/catalogs/types/catalog-data.js').CatalogData;
