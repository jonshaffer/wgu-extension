import {z} from "zod";

export const WguStudentGroupRawSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  url: z.string().url(),
  type: z.enum(["open", "closed", "private"]),
  access_requirements: z.string().optional(),
  target_audience: z.string().optional(),
  member_count: z.number().int().positive().optional(),
});

export type WguStudentGroupRaw = z.infer<typeof WguStudentGroupRawSchema>;

export const WguStudentGroupsArraySchema = z.array(WguStudentGroupRawSchema);

export function assertWguStudentGroupRaw(input: unknown): asserts input is WguStudentGroupRaw {
  WguStudentGroupRawSchema.parse(input);
}

export function assertWguStudentGroupsArray(input: unknown): asserts input is WguStudentGroupRaw[] {
  WguStudentGroupsArraySchema.parse(input);
}
