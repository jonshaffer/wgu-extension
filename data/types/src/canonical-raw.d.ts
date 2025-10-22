// Ambient type declarations to reference repo-internal canonical raw types without importing outside rootDir.
// This file intentionally uses declare module with import() types to avoid adding external sources to the program.

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="typescript" />

declare module '@wgu-extension/data/canonical-raw' {
  // Discord
  export type CanonicalDiscordHierarchyLevel = import('../../discord/types/raw-discord').DiscordHierarchyLevel;
  export type CanonicalDiscordHierarchy = import('../../discord/types/raw-discord').DiscordHierarchy;
  export type CanonicalDiscordChannelType = import('../../discord/types/raw-discord').DiscordChannelType;
  export type CanonicalDiscordChannel = import('../../discord/types/raw-discord').DiscordChannel;
  export type CanonicalDiscordCommunity = import('../../discord/types/raw-discord').DiscordCommunity;
  export type CanonicalDiscordCommunityFile = import('../../discord/types/raw-discord').DiscordCommunityFile;

  // Reddit
  export type CanonicalRedditCommunity = import('../../reddit/types/reddit-community').RedditCommunity;

  // Catalogs
  export type CanonicalCatalogCourse = import('../../catalogs/types/catalog-data').Course;
  export type CanonicalCatalogDegreePlan = import('../../catalogs/types/catalog-data').DegreePlan;
  export type CanonicalCatalogDegreePlanCourse = import('../../catalogs/types/catalog-data').DegreePlanCourse;
  export type CanonicalCatalogFormatVersion = import('../../catalogs/types/catalog-data').CatalogFormatVersion;
  export type CanonicalCatalogMetadata = import('../../catalogs/types/catalog-data').Metadata;
  export type CanonicalCatalogData = import('../../catalogs/types/catalog-data').CatalogData;
}
