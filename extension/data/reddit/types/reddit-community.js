/**
 * TypeScript type definitions for WGU Reddit community raw data
 */
/**
 * Type guard to check if an object is a valid RedditCommunity
 */
export function isRedditCommunity(obj) {
    return (typeof obj === 'object' &&
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
        obj.tags.every((tag) => typeof tag === 'string') &&
        Array.isArray(obj.relevantCourses) &&
        obj.relevantCourses.every((course) => typeof course === 'string') &&
        (obj.memberCount === undefined || (typeof obj.memberCount === 'number' && obj.memberCount >= 0)) &&
        (obj.lastUpdated === undefined || typeof obj.lastUpdated === 'string') &&
        (obj.verified === undefined || typeof obj.verified === 'boolean'));
}
