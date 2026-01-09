import {z} from "zod";

export const WguConnectGroupRawSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  full_name: z.string().optional(),
  category: z.string().optional(),
  course_codes: z.array(z.string()).optional(),
  url: z.string().url(),
  discussions_url: z.string().url().optional(),
  resources_url: z.string().url().optional(),
  verified: z.boolean().optional(),
});

export type WguConnectGroupRaw = z.infer<typeof WguConnectGroupRawSchema>;

export const WguConnectGroupsArraySchema = z.array(WguConnectGroupRawSchema);

export function assertWguConnectGroupRaw(input: unknown): asserts input is WguConnectGroupRaw {
  WguConnectGroupRawSchema.parse(input);
}

export function assertWguConnectGroupsArray(input: unknown): asserts input is WguConnectGroupRaw[] {
  WguConnectGroupsArraySchema.parse(input);
}
