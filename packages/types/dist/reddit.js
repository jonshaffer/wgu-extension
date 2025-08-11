import { z } from 'zod';
export const RedditHierarchyLevelSchema = z.enum([
    'university',
    'college',
    'program',
    'community',
]);
export const RedditCommunitySchema = z.object({
    subreddit: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    hierarchy: z.object({
        level: RedditHierarchyLevelSchema,
    }),
    isActive: z.boolean(),
    tags: z.array(z.string()).default([]),
    relevantCourses: z.array(z.string()).default([]),
    memberCount: z.number().int().nonnegative().optional(),
    lastUpdated: z.string().optional(),
    verified: z.boolean().optional(),
});
