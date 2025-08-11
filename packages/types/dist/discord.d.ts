import { z } from 'zod';
export declare const DiscordHierarchyLevelSchema: z.ZodEnum<["university", "college", "program", "course", "community"]>;
export declare const DiscordHierarchySchema: z.ZodObject<{
    level: z.ZodEnum<["university", "college", "program", "course", "community"]>;
    college: z.ZodOptional<z.ZodEnum<["technology", "healthcare", "business", "education"]>>;
    program: z.ZodOptional<z.ZodString>;
    courseCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    level: "university" | "college" | "program" | "course" | "community";
    college?: "technology" | "healthcare" | "business" | "education" | undefined;
    program?: string | undefined;
    courseCode?: string | undefined;
}, {
    level: "university" | "college" | "program" | "course" | "community";
    college?: "technology" | "healthcare" | "business" | "education" | undefined;
    program?: string | undefined;
    courseCode?: string | undefined;
}>;
export declare const DiscordChannelTypeSchema: z.ZodEnum<["text", "voice", "forum"]>;
export declare const DiscordChannelSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    communityId: z.ZodString;
    type: z.ZodEnum<["text", "voice", "forum"]>;
    courseRelevance: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "voice" | "forum";
    id: string;
    name: string;
    communityId: string;
    description?: string | undefined;
    courseRelevance?: string[] | undefined;
    tags?: string[] | undefined;
}, {
    type: "text" | "voice" | "forum";
    id: string;
    name: string;
    communityId: string;
    description?: string | undefined;
    courseRelevance?: string[] | undefined;
    tags?: string[] | undefined;
}>;
export declare const DiscordCommunitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    inviteUrl: z.ZodOptional<z.ZodString>;
    hierarchy: z.ZodObject<{
        level: z.ZodEnum<["university", "college", "program", "course", "community"]>;
        college: z.ZodOptional<z.ZodEnum<["technology", "healthcare", "business", "education"]>>;
        program: z.ZodOptional<z.ZodString>;
        courseCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    }, {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    hierarchy: {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    };
    description?: string | undefined;
    inviteUrl?: string | undefined;
}, {
    id: string;
    name: string;
    hierarchy: {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    };
    description?: string | undefined;
    inviteUrl?: string | undefined;
}>;
export declare const DiscordCommunityFileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    inviteUrl: z.ZodOptional<z.ZodString>;
    hierarchy: z.ZodObject<{
        level: z.ZodEnum<["university", "college", "program", "course", "community"]>;
        college: z.ZodOptional<z.ZodEnum<["technology", "healthcare", "business", "education"]>>;
        program: z.ZodOptional<z.ZodString>;
        courseCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    }, {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    }>;
} & {
    channels: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        communityId: z.ZodString;
        type: z.ZodEnum<["text", "voice", "forum"]>;
        courseRelevance: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "voice" | "forum";
        id: string;
        name: string;
        communityId: string;
        description?: string | undefined;
        courseRelevance?: string[] | undefined;
        tags?: string[] | undefined;
    }, {
        type: "text" | "voice" | "forum";
        id: string;
        name: string;
        communityId: string;
        description?: string | undefined;
        courseRelevance?: string[] | undefined;
        tags?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    hierarchy: {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    };
    channels: {
        type: "text" | "voice" | "forum";
        id: string;
        name: string;
        communityId: string;
        description?: string | undefined;
        courseRelevance?: string[] | undefined;
        tags?: string[] | undefined;
    }[];
    description?: string | undefined;
    inviteUrl?: string | undefined;
}, {
    id: string;
    name: string;
    hierarchy: {
        level: "university" | "college" | "program" | "course" | "community";
        college?: "technology" | "healthcare" | "business" | "education" | undefined;
        program?: string | undefined;
        courseCode?: string | undefined;
    };
    channels: {
        type: "text" | "voice" | "forum";
        id: string;
        name: string;
        communityId: string;
        description?: string | undefined;
        courseRelevance?: string[] | undefined;
        tags?: string[] | undefined;
    }[];
    description?: string | undefined;
    inviteUrl?: string | undefined;
}>;
export type DiscordHierarchyLevel = z.infer<typeof DiscordHierarchyLevelSchema>;
export type DiscordHierarchy = z.infer<typeof DiscordHierarchySchema>;
export type DiscordChannelType = z.infer<typeof DiscordChannelTypeSchema>;
export type DiscordChannel = z.infer<typeof DiscordChannelSchema>;
export type DiscordCommunity = z.infer<typeof DiscordCommunitySchema>;
export type DiscordCommunityFile = z.infer<typeof DiscordCommunityFileSchema>;
