import {z} from "zod";

// Normalized course as produced by the courses aggregator
export const NormalizedCourseSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  ccn: z.string().optional(),
  competencyUnits: z.number().nonnegative().optional(),
  catalogVersions: z.array(z.string()),
  lastUpdated: z.string(),
});

export type NormalizedCourse = z.infer<typeof NormalizedCourseSchema>;

export const CoursesOutputMetadataSchema = z.object({
  generatedAt: z.string(),
  totalCourses: z.number().nonnegative(),
  catalogVersionsIncluded: z.array(z.string()),
  description: z.string(),
});

export const CoursesOutputSchema = z.object({
  metadata: CoursesOutputMetadataSchema,
  courses: z.record(z.string(), NormalizedCourseSchema),
});

export type CoursesOutput = z.infer<typeof CoursesOutputSchema>;

export function assertCoursesOutput(value: unknown): asserts value is CoursesOutput {
  CoursesOutputSchema.parse(value);
}
