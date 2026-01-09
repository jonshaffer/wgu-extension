import {z} from "zod";

// Normalized degree program shape as produced by the degree-programs aggregator
export const NormalizedDegreeProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  totalCUs: z.number().nonnegative(),
  courses: z.array(z.string()),
  catalogVersions: z.array(z.string()),
  lastUpdated: z.string(),
});

export type NormalizedDegreeProgram = z.infer<typeof NormalizedDegreeProgramSchema>;

export const DegreeProgramsOutputMetadataSchema = z.object({
  generatedAt: z.string(),
  totalPrograms: z.number().nonnegative(),
  catalogVersionsIncluded: z.array(z.string()),
  description: z.string(),
});

export const DegreeProgramsOutputSchema = z.object({
  metadata: DegreeProgramsOutputMetadataSchema,
  degrees: z.record(z.string(), NormalizedDegreeProgramSchema),
});

export type DegreeProgramsOutput = z.infer<typeof DegreeProgramsOutputSchema>;

export function assertDegreeProgramsOutput(value: unknown): asserts value is DegreeProgramsOutput {
  DegreeProgramsOutputSchema.parse(value);
}
