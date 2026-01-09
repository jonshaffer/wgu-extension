import {z} from "zod";

export const DiscordHierarchyLevelSchema = z.enum([
  "university",
  "college",
  "program",
  "course",
  "community",
]);

export const DiscordHierarchySchema = z.object({
  level: DiscordHierarchyLevelSchema,
  college: z.enum(["technology", "healthcare", "business", "education"]).optional(),
  program: z.string().optional(),
  courseCode: z.string().optional(),
});

export const DiscordChannelTypeSchema = z.enum(["text", "voice", "forum"]);

export const DiscordChannelSchema = z.object({
  id: z.string().regex(/^\d{10,}$/),
  name: z.string().min(1),
  description: z.string().optional(),
  communityId: z.string().regex(/^\d{10,}$/),
  type: DiscordChannelTypeSchema,
  courseRelevance: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const DiscordCommunitySchema = z.object({
  id: z.string().regex(/^\d{10,}$/),
  name: z.string().min(1),
  description: z.string().optional(),
  inviteUrl: z.string().url().optional(),
  hierarchy: DiscordHierarchySchema,
});

export const DiscordCommunityFileSchema = DiscordCommunitySchema.extend({
  channels: z.array(DiscordChannelSchema),
});

export type DiscordHierarchyLevel = z.infer<typeof DiscordHierarchyLevelSchema>;
export type DiscordHierarchy = z.infer<typeof DiscordHierarchySchema>;
export type DiscordChannelType = z.infer<typeof DiscordChannelTypeSchema>;
export type DiscordChannel = z.infer<typeof DiscordChannelSchema>;
export type DiscordCommunity = z.infer<typeof DiscordCommunitySchema>;
export type DiscordCommunityFile = z.infer<typeof DiscordCommunityFileSchema>;
