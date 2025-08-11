/**
 * Content-script integration helpers for WGU Student Groups page
 */

import { extractWGUStudentGroups, isWGUStudentGroupsDirectoryPage } from './wgu-student-groups-extractor.js';

export function tryExtractStudentGroups(): void {
  if (!isWGUStudentGroupsDirectoryPage(document)) return;
  const data = extractWGUStudentGroups();
  if (data) {
    console.log('[WGU Student Groups] Extracted', data.total, 'groups');
    // Hook for messaging pipeline if needed later
    // chrome.runtime?.sendMessage?.({ type: 'wgu-student-groups:data', payload: data });
  }
}

if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  tryExtractStudentGroups();
} else if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', tryExtractStudentGroups);
}
