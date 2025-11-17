/**
 * Type declarations for WGU Connect extractor module
 * This module is used for extracting WGU Connect group data
 */

export class WGUConnectExtractor {
  constructor();
  extractGroupData(): Promise<any>;
  isResourcesPage(): boolean;
  extractResourceData(): Promise<any>;
  setupTabChangeObserver(callback: (data: unknown) => void): void;
  stopObserver(): void;
}
