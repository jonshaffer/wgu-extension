/**
 * TypeScript type definitions for WGU Reddit community raw data
 */

export type HierarchyLevel = 'university' | 'college' | 'program' | 'course' | 'community';

export interface RedditCommunityHierarchy {
  level: HierarchyLevel;
}

export interface RedditCommunity {
  /** The subreddit name (without r/ prefix) */
  subreddit: string;
  
  /** The display name of the subreddit (with r/ prefix) */
  name: string;
  
  /** The subreddit description from Reddit */
  description: string;
  
  /** The hierarchical level of the subreddit */
  hierarchy: RedditCommunityHierarchy;
  
  /** Whether the subreddit is currently active */
  isActive: boolean;
  
  /** Tags associated with the subreddit */
  tags: string[];
  
  /** Array of course codes relevant to this subreddit */
  relevantCourses: string[];
  
  /** Number of subreddit members from Reddit API */
  memberCount?: number;
  
  /** ISO timestamp of when the data was last updated from Reddit */
  lastUpdated?: string;
  
  /** Whether the subreddit data has been verified against Reddit API */
  verified?: boolean;
}

/**
 * Type guard to check if an object is a valid RedditCommunity
 */
export function isRedditCommunity(obj: any): obj is RedditCommunity {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.subreddit === 'string' &&
    typeof obj.name === 'string' &&
    obj.name.startsWith('r/') &&
    typeof obj.description === 'string' &&
    typeof obj.hierarchy === 'object' &&
    typeof obj.hierarchy.level === 'string' &&
    ['university', 'college', 'program', 'course', 'community'].includes(obj.hierarchy.level) &&
    typeof obj.isActive === 'boolean' &&
    Array.isArray(obj.tags) &&
    obj.tags.every((tag: any) => typeof tag === 'string') &&
    Array.isArray(obj.relevantCourses) &&
    obj.relevantCourses.every((course: any) => typeof course === 'string') &&
    (obj.memberCount === undefined || (typeof obj.memberCount === 'number' && obj.memberCount >= 0)) &&
    (obj.lastUpdated === undefined || typeof obj.lastUpdated === 'string') &&
    (obj.verified === undefined || typeof obj.verified === 'boolean')
  );
}

/**
 * Array of RedditCommunity objects
 */
export type RedditCommunityCollection = RedditCommunity[];