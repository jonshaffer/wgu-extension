import { type StorageArea, type StorageItemKey } from "@wxt-dev/storage"

const defaultStorageArea: StorageArea = "sync";

// Settings
export const SHOW_REPORT_PERCENTAGE: StorageItemKey = `${defaultStorageArea}:showReportPercentage`;
export const APP_THEME: StorageItemKey = `${defaultStorageArea}:appTheme`;

// Community Integration Settings
export const ENABLE_DISCORD_INTEGRATION: StorageItemKey = `${defaultStorageArea}:enableDiscordIntegration`;
export const ENABLE_REDDIT_INTEGRATION: StorageItemKey = `${defaultStorageArea}:enableRedditIntegration`;
export const ENABLE_WGU_CONNECT_INTEGRATION: StorageItemKey = `${defaultStorageArea}:enableWguConnectIntegration`;
export const ENABLE_COURSE_COMMUNITIES: StorageItemKey = `${defaultStorageArea}:enableCourseCommunities`;
