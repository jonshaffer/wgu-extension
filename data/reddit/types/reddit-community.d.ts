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
export declare function isRedditCommunity(obj: any): obj is RedditCommunity;
/**
 * Array of RedditCommunity objects
 */
export type RedditCommunityCollection = RedditCommunity[];
