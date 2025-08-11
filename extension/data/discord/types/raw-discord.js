/**
 * TypeScript type definitions for WGU Discord raw community files (data/discord/raw/*)
 */
// Type guard for basic validation
export function isDiscordCommunityFile(obj) {
    return (obj &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.hierarchy === 'object' &&
        Array.isArray(obj.channels) &&
        obj.channels.every((ch) => ch &&
            typeof ch.id === 'string' &&
            typeof ch.name === 'string' &&
            typeof ch.communityId === 'string' &&
            ['text', 'voice', 'forum'].includes(ch.type)));
}
