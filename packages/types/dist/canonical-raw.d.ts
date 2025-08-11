// Ambient type declarations to reference repo-internal canonical raw types without importing outside rootDir.
// This file intentionally uses declare module with import() types to avoid adding external sources to the program.

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="typescript" />

declare module '@wgu-extension/types/canonical-raw' {
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
}
