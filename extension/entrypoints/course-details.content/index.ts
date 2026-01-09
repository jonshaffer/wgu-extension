import {storage} from "@wxt-dev/storage";
import {ENABLE_COURSE_COMMUNITIES} from "@/utils/storage.constants";
import {extractCourseCode} from "@/utils/course-utils";
import {createCommunitiesPanel} from "@/utils/communities-panel";
import {createSearchPanel} from "@/utils/search-panel";

export default defineContentScript({
  matches: ["https://my.wgu.edu/courses/course/*"],
  runAt: "document_end",

  async main(ctx) {
    console.log("Course Details Content Script Loaded");

    // Check if course communities feature is enabled
    const isCommunitiesEnabled = await storage.getItem<boolean>(ENABLE_COURSE_COMMUNITIES);
    if (isCommunitiesEnabled === false) {
      console.log("WGU Extension: Course communities disabled by user");
      return;
    }

    // Enhanced SPA navigation detection using WXT's built-in event
    ctx.addEventListener(window, "wxt:locationchange", ({newUrl}) => {
      console.log("WGU SPA Navigation detected!");
      setTimeout(() => injectCommunityComponents(), 1000);
    });

    async function injectCommunityComponents() {
      const courseCode = await extractCourseCode();
      if (!courseCode) return;

      // Find the right-side-container where search buttons are typically placed
      const rightSideContainer = document.querySelector(".right-side-container");
      if (!rightSideContainer) {
        console.warn("right-side-container not found. Cannot inject community components.");
        return;
      }

      // Remove existing panels if they exist
      const existingCommunitiesPanel = document.getElementById("wgu-ext-community-panel-wrapper");
      const existingSearchPanel = document.getElementById("wgu-ext-search-panel-wrapper");
      if (existingCommunitiesPanel) existingCommunitiesPanel.remove();
      if (existingSearchPanel) existingSearchPanel.remove();

      // Find the mat-accordion container for the communities panel
      const accordion = document.querySelector("mat-accordion");
      if (accordion) {
        // Create and inject the communities panel
        const iconUrl = browser.runtime.getURL("/icons/128.png");
        const communitiesPanel = await createCommunitiesPanel(courseCode, undefined, iconUrl);
        accordion.appendChild(communitiesPanel);
        console.log("Communities panel injected into sidebar.");
      }

      // Create and inject the search panel
      const searchPanel = createSearchPanel(courseCode, true);

      // Find where to place the search panel (after the original course search button or at the end)
      const originalSearchButton = rightSideContainer.querySelector(".course-btns");
      if (originalSearchButton) {
        // Hide the original search button and insert our panel after it
        (originalSearchButton as HTMLElement).style.display = "none";
        originalSearchButton.parentNode?.insertBefore(searchPanel, originalSearchButton.nextSibling);
      } else {
        // Just append to the end of the container
        rightSideContainer.appendChild(searchPanel);
      }

      console.log("Search panel injected into sidebar.");
    }

    // Initial injection
    setTimeout(() => injectCommunityComponents(), 1500);
  },
});
