import { type StorageArea, type StorageItemKey } from "@wxt-dev/storage"

const defaultStorageArea: StorageArea = "sync";

// Settings
export const SHOW_REPORT_PERCENTAGE: StorageItemKey = `${defaultStorageArea}:showReportPercentage`;
export const APP_THEME: StorageItemKey = `${defaultStorageArea}:appTheme`;
