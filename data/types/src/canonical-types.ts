// Canonical type aliases referencing data/*/types without name conflicts.
// These are type-only aliases and introduce no runtime dependency.
// Note: Publishing this package to npm with these aliases will reference
// repo-relative paths in .d.ts. For external consumers, prefer the Zod types.

// Discord
export type CanonicalDiscordHierarchyLevel = import('../../../data/discord/types/raw-discord').DiscordHierarchyLevel;
export type CanonicalDiscordHierarchy = import('../../../data/discord/types/raw-discord').DiscordHierarchy;
export type CanonicalDiscordChannelType = import('../../../data/discord/types/raw-discord').DiscordChannelType;
export type CanonicalDiscordChannel = import('../../../data/discord/types/raw-discord').DiscordChannel;
export type CanonicalDiscordCommunity = import('../../../data/discord/types/raw-discord').DiscordCommunity;
export type CanonicalDiscordCommunityFile = import('../../../data/discord/types/raw-discord').DiscordCommunityFile;

// Reddit
export type CanonicalRedditCommunity = import('../../../data/reddit/types/reddit-community').RedditCommunity;

// Catalogs
export type CanonicalCatalogCourse = import('../../../data/catalogs/types/catalog-data').Course;
export type CanonicalCatalogDegreePlan = import('../../../data/catalogs/types/catalog-data').DegreePlan;
export type CanonicalCatalogDegreePlanCourse = import('../../../data/catalogs/types/catalog-data').DegreePlanCourse;
export type CanonicalCatalogFormatVersion = import('../../../data/catalogs/types/catalog-data').CatalogFormatVersion;
export type CanonicalCatalogMetadata = import('../../../data/catalogs/types/catalog-data').Metadata;
export type CanonicalCatalogData = import('../../../data/catalogs/types/catalog-data').CatalogData;
