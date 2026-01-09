/**
 * Utility functions for extracting course information from WGU pages
 */

/**
 * Wait for an element to appear in the DOM and have content
 */
export function waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
  return new Promise((resolve) => {
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim()) {
        console.log(`Found element ${selector} with content: "${element.textContent.trim()}"`);
        return element;
      }
      return null;
    };

    const element = checkElement();
    if (element) {
      resolve(element);
      return;
    }

    console.log(`Setting up observer for ${selector}`);
    let checkCount = 0;
    const observer = new MutationObserver((mutations, obs) => {
      checkCount++;
      console.log(`Mutation observed for ${selector} (check #${checkCount})`);
      const element = checkElement();
      if (element) {
        console.log(`Successfully found ${selector} after ${checkCount} mutations`);
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true, // This is important - watches for text content changes
      attributes: false,
    });

    // Also set up a polling fallback
    const pollInterval = setInterval(() => {
      const element = checkElement();
      if (element) {
        observer.disconnect();
        clearInterval(pollInterval);
        console.log(`Found ${selector} via polling`);
        resolve(element);
      }
    }, 500);

    // Timeout after specified time
    setTimeout(() => {
      observer.disconnect();
      clearInterval(pollInterval);
      console.log(`Timeout reached for ${selector}`);
      resolve(null);
    }, timeout);
  });
}

/**
 * Try multiple selectors to find an element with content
 */
export function findElementBySelectors(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim()) {
      return element;
    }
  }
  return null;
}

/**
 * Extract course code from various page elements
 */
export async function extractCourseCode(): Promise<string | null> {
  console.log("Attempting to extract course code...");

  // List of possible selectors for course titles, ordered by preference
  const titleSelectors = [
    ".view-title", // Original selector
    "[data-testid=\"course-title\"]", // Potential test ID
    ".course-title", // Alternative class name
    "h1", // Generic h1 (less reliable)
    ".page-title", // Generic page title
    ".header-title", // Header title
    ".course-header h1", // Course header h1
    ".course-info .title", // Course info title
  ];

  // First try to find elements immediately
  console.log("Checking for elements immediately...");
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim()) {
      console.log(`Found element immediately: ${selector} with content: "${element.textContent.trim()}"`);
      const courseCode = extractCourseCodeFromText(element.textContent);
      if (courseCode) {
        console.log("Found course code immediately:", courseCode);
        return courseCode;
      }
    }
  }

  // If not found immediately, wait for each selector in order
  console.log("Course title not found immediately, waiting for elements to load...");

  for (const selector of titleSelectors) {
    console.log(`Waiting for selector: ${selector}`);
    const waitedElement = await waitForElement(selector, 3000); // Shorter timeout per selector

    if (waitedElement && waitedElement.textContent) {
      const courseCode = extractCourseCodeFromText(waitedElement.textContent);
      if (courseCode) {
        console.log(`Found course code after waiting for ${selector}:`, courseCode);
        return courseCode;
      }
    }
  }

  // As a last resort, try to extract from URL
  const urlCourseCode = extractCourseCodeFromURL();
  if (urlCourseCode) {
    console.log("Extracted course code from URL:", urlCourseCode);
    return urlCourseCode;
  }

  // If all else fails, try to find it in any text on the page
  const pageCourseCode = extractCourseCodeFromPage();
  if (pageCourseCode) {
    console.log("Found course code in page content:", pageCourseCode);
    return pageCourseCode;
  }

  console.warn("Could not extract course code from any source");
  return null;
}

/**
 * Extract course code from a text string
 */
export function extractCourseCodeFromText(text: string): string | null {
  const trimmedText = text.trim();
  console.log(`Attempting to extract course code from text: "${trimmedText}"`);

  // WGU course codes are always 1 letter + 3 numbers (e.g., C950, D333, etc.)
  const patterns = [
    /\s*-\s*([A-Z]\d{3})\s*$/, // "- C950" at the end
    /\s+([A-Z]\d{3})\s*$/, // "C950" at the end after spaces
    /\b([A-Z]\d{3})\b/, // Word boundary pattern
    /(?:^|\s)([A-Z]\d{3})(?:\s|$)/, // Start/end of word pattern
    /([A-Z]\d{3})/, // Any occurrence (most permissive)
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = trimmedText.match(pattern);
    console.log(`Pattern ${i + 1} (${pattern}): ${match ? `matched "${match[1]}"` : "no match"}`);

    if (match && match[1]) {
      const courseCode = match[1];
      console.log(`Valid WGU course code found: ${courseCode}`);
      return courseCode;
    }
  }

  console.log("No course code found in text");
  return null;
}

/**
 * Try to extract course code from the current URL
 */
export function extractCourseCodeFromURL(): string | null {
  const url = window.location.pathname;

  // Look for WGU course codes (1 letter + 3 numbers) in URL patterns
  const urlPatterns = [
    /\/courses?\/course\/([A-Z]\d{3})/i,
    /\/course\/([A-Z]\d{3})/i,
    /courseCode=([A-Z]\d{3})/i,
    /\/([A-Z]\d{3})\//i, // Course code in URL path
  ];

  for (const pattern of urlPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Search the entire page for course code patterns
 */
export function extractCourseCodeFromPage(): string | null {
  const bodyText = document.body.textContent || "";

  // Look for WGU course codes (1 letter + 3 numbers) in page text
  const patterns = [
    /(?:Course|Subject):\s*([A-Z]\d{3})/i,
    /(?:Code|ID):\s*([A-Z]\d{3})/i,
    /([A-Z]\d{3})/g, // Simple WGU format as fallback
  ];

  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}
