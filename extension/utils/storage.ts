/**
 * Storage configuration for WGU Extension data collection
 */

import {storage} from "#imports";

// Data collection settings
export const dataCollectionEnabled = storage.defineItem<boolean>("local:dataCollectionEnabled", {
  fallback: false, // Default disabled for privacy
});

export const discordCollectionEnabled = storage.defineItem<boolean>("local:discordCollectionEnabled", {
  fallback: false,
});

export const wguConnectCollectionEnabled = storage.defineItem<boolean>("local:wguConnectCollectionEnabled", {
  fallback: false,
});

// Data storage for collected information
export const discordData = storage.defineItem<any>("local:discordData", {
  fallback: {servers: {}, lastCollection: null},
});

export const wguConnectData = storage.defineItem<any>("local:wguConnectData", {
  fallback: {groups: {}, lastCollection: null},
});

// Per-scope (groupId:tab) weekly throttle timestamps for WGU Connect ingestion
export const wguConnectIngestHistory = storage.defineItem<Record<string, string>>("local:wguConnectIngestHistory", {
  fallback: {},
});

// User preferences
export const extensionVersion = storage.defineItem<string>("local:extensionVersion", {
  fallback: "1.0.0",
});

export const firstInstall = storage.defineItem<boolean>("local:firstInstall", {
  fallback: true,
});
