import { z } from 'zod';
export declare const RedditHierarchyLevelSchema: z.ZodEnum<["university", "college", "program", "community"]>;
export declare const RedditCommunitySchema: z.ZodObject<{
    subreddit: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    hierarchy: z.ZodObject<{
        level: z.ZodEnum<["university", "college", "program", "community"]>;
    }, "strip", z.ZodTypeAny, {
        level: "university" | "college" | "program" | "community";
    }, {
        level: "university" | "college" | "program" | "community";
    }>;
    isActive: z.ZodBoolean;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    relevantCourses: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    memberCount: z.ZodOptional<z.ZodNumber>;
    lastUpdated: z.ZodOptional<z.ZodString>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    tags: string[];
    hierarchy: {
        level: "university" | "college" | "program" | "community";
    };
    subreddit: string;
    isActive: boolean;
    relevantCourses: string[];
    memberCount?: number | undefined;
    lastUpdated?: string | undefined;
    verified?: boolean | undefined;
}, {
    name: string;
    description: string;
    hierarchy: {
        level: "university" | "college" | "program" | "community";
    };
    subreddit: string;
    isActive: boolean;
    tags?: string[] | undefined;
    relevantCourses?: string[] | undefined;
    memberCount?: number | undefined;
    lastUpdated?: string | undefined;
    verified?: boolean | undefined;
}>;
export type RedditCommunity = z.infer<typeof RedditCommunitySchema>;
