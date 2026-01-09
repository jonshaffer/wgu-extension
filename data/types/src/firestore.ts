import {z} from "zod";
import {DiscordCommunityFileSchema} from "./discord.js";
import {WguStudentGroupRawSchema} from "./wgu-student-groups.js";

// Firestore document schemas - these include additional fields added during sync

export const FirestoreDiscordCommunitySchema = DiscordCommunityFileSchema;

export const FirestoreWguStudentGroupSchema = WguStudentGroupRawSchema;

export const FirestoreWguConnectGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  full_name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url(),
  course_codes: z.array(z.string()),
  lastUpdated: z.string().datetime().optional(),
});

export const FirestoreRedditCommunitySchema = z.object({
  subreddit: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  subscribers: z.number().int().nonnegative().optional(),
  hierarchy: z.object({
    level: z.enum(["university", "college", "program", "course", "community"]),
    college: z.enum(["technology", "health", "business", "education"]).optional(),
  }),
  relevantCourses: z.array(z.string()).optional(),
  lastUpdated: z.string().datetime().optional(),
});

export const FirestoreCatalogMonthSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  snapshot: z.object({
    courses: z.array(z.object({
      code: z.string(),
      title: z.string(),
      credits: z.number().optional(),
      description: z.string().optional(),
    })).optional(),
    degreePrograms: z.array(z.object({
      code: z.string(),
      title: z.string(),
      college: z.string().optional(),
      level: z.string().optional(),
    })).optional(),
  }),
  report: z.object({
    filename: z.string(),
    parsedAt: z.string().datetime(),
    parserVersion: z.string(),
    summary: z.object({
      totalCourses: z.number(),
      totalDegreePlans: z.number(),
      totalProgramOutcomes: z.number().optional(),
      ccnCoverage: z.number().optional(),
      cuCoverage: z.number().optional(),
      validationIssues: z.number().optional(),
      parsingDuration: z.number().optional(),
    }),
    validation: z.object({
      degreePlanCourseValidation: z.object({
        totalCoursesInPlans: z.number(),
        uniqueCoursesInPlans: z.number(),
        coursesFoundInCatalog: z.number(),
        missingCourses: z.array(z.string()),
        validationRate: z.number(),
      }).optional(),
      dataCompleteness: z.record(z.string(), z.number()).optional(),
      issues: z.array(z.object({
        type: z.string(),
        severity: z.enum(["error", "warning", "info"]),
        location: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.any()).optional(),
      })).optional(),
    }).optional(),
    statistics: z.record(z.string(), z.any()).optional(),
    processingDetails: z.record(z.string(), z.any()).optional(),
  }).optional(),
  createdAt: z.string().datetime(),
});


// Type exports
export type FirestoreDiscordCommunity = z.infer<typeof FirestoreDiscordCommunitySchema>;
export type FirestoreWguStudentGroup = z.infer<typeof FirestoreWguStudentGroupSchema>;
export type FirestoreWguConnectGroup = z.infer<typeof FirestoreWguConnectGroupSchema>;
export type FirestoreRedditCommunity = z.infer<typeof FirestoreRedditCommunitySchema>;
export type FirestoreCatalogMonth = z.infer<typeof FirestoreCatalogMonthSchema>;
