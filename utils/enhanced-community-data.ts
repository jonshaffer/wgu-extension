/**
 * Enhanced Community Data Utilities
 * 
 * Provides utilities for loading and working with the new community data structure.
 * Maintains backward compatibility with existing extension code.
 */

import type { 
  ProcessedCommunityData, 
  CourseCommunitiesMappings,
  CommunityLink,
  College 
} from '../data/types/community-data';

// Re-export types for convenience
export type { CommunityLink, CourseCommunitiesMappings, ProcessedCommunityData };

/**
 * Legacy interface for backward compatibility
 */
export interface LegacyCommunityMapping {
  discord?: CommunityLink[];
  reddit?: CommunityLink[];
  wguConnect?: CommunityLink[];
}

/**
 * Enhanced community data loader with multiple data sources
 */
export class CommunityDataManager {
  private processedData: ProcessedCommunityData | null = null;
  private lastLoaded: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Load the processed community data
   */
  async loadProcessedData(): Promise<ProcessedCommunityData> {
    const now = Date.now();
    
    if (this.processedData && (now - this.lastLoaded) < this.cacheTimeout) {
      return this.processedData;
    }

    try {
      // Try to load from processed data first
      const response = await fetch(browser.runtime.getURL('data/processed/unified-community-data.json' as any));
      if (response.ok) {
        this.processedData = await response.json();
        this.lastLoaded = now;
        return this.processedData!;
      }
    } catch (error) {
      console.warn('Could not load processed community data:', error);
    }

    // Fallback: create basic structure
    this.processedData = {
      courseMappings: [],
      universityLevel: { discord: [], reddit: [] },
      collegeLevel: {
        technology: { discord: [], reddit: [] },
        health: { discord: [], reddit: [] },
        business: { discord: [], reddit: [] },
        education: { discord: [], reddit: [] }
      },
      lastUpdated: new Date().toISOString()
    };

    return this.processedData;
  }

  /**
   * Get community links for a specific course (backward compatible)
   */
  async getCourseCommunitiesLegacy(courseCode: string): Promise<LegacyCommunityMapping | null> {
    const data = await this.loadProcessedData();
    const courseMapping = data.courseMappings.find(
      mapping => mapping.courseCode.toLowerCase() === courseCode.toLowerCase()
    );

    if (!courseMapping) {
      return null;
    }

    return {
      discord: courseMapping.discord,
      reddit: courseMapping.reddit,
      wguConnect: courseMapping.wguConnect
    };
  }

  /**
   * Get community links for a specific course
   */
  async getCourseCommunities(courseCode: string): Promise<CourseCommunitiesMappings | null> {
    const data = await this.loadProcessedData();
    return data.courseMappings.find(
      mapping => mapping.courseCode.toLowerCase() === courseCode.toLowerCase()
    ) || null;
  }

  /**
   * Get university-level communities
   */
  async getUniversityCommunities(): Promise<{ discord: CommunityLink[]; reddit: CommunityLink[]; }> {
    const data = await this.loadProcessedData();
    return data.universityLevel;
  }

  /**
   * Get college-level communities
   */
  async getCollegeCommunities(college: College): Promise<{ discord: CommunityLink[]; reddit: CommunityLink[]; }> {
    const data = await this.loadProcessedData();
    return data.collegeLevel[college] || { discord: [], reddit: [] };
  }

  /**
   * Get all communities for a course, including hierarchical fallbacks
   */
  async getEnhancedCourseCommunities(
    courseCode: string, 
    college?: College
  ): Promise<{
    course: CourseCommunitiesMappings | null;
    college: { discord: CommunityLink[]; reddit: CommunityLink[]; };
    university: { discord: CommunityLink[]; reddit: CommunityLink[]; };
  }> {
    const [courseData, collegeData, universityData] = await Promise.all([
      this.getCourseCommunities(courseCode),
      college ? this.getCollegeCommunities(college) : { discord: [], reddit: [] },
      this.getUniversityCommunities()
    ]);

    return {
      course: courseData,
      college: collegeData,
      university: universityData
    };
  }

  /**
   * Search communities by tags or keywords
   */
  async searchCommunities(query: string): Promise<CommunityLink[]> {
    const data = await this.loadProcessedData();
    const results: CommunityLink[] = [];
    const queryLower = query.toLowerCase();

    // Search through all course mappings
    data.courseMappings.forEach(mapping => {
      [mapping.discord, mapping.reddit, mapping.wguConnect].forEach(links => {
        links?.forEach(link => {
          if (
            link.name.toLowerCase().includes(queryLower) ||
            link.description?.toLowerCase().includes(queryLower)
          ) {
            results.push(link);
          }
        });
      });
    });

    // Search university and college level
    [data.universityLevel.discord, data.universityLevel.reddit].forEach(links => {
      links.forEach(link => {
        if (
          link.name.toLowerCase().includes(queryLower) ||
          link.description?.toLowerCase().includes(queryLower)
        ) {
          results.push(link);
        }
      });
    });

    Object.values(data.collegeLevel).forEach(college => {
      [college.discord, college.reddit].forEach(links => {
        links.forEach(link => {
          if (
            link.name.toLowerCase().includes(queryLower) ||
            link.description?.toLowerCase().includes(queryLower)
          ) {
            results.push(link);
          }
        });
      });
    });

    // Remove duplicates based on URL
    const unique = results.filter((link, index, arr) => 
      arr.findIndex(l => l.url === link.url) === index
    );

    return unique;
  }
}

// Singleton instance for use throughout the extension
export const communityDataManager = new CommunityDataManager();

/**
 * Backward compatible function for existing code
 */
export async function loadCommunityMappings(courseCode: string): Promise<LegacyCommunityMapping | null> {
  return communityDataManager.getCourseCommunitiesLegacy(courseCode);
}
