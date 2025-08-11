import { z } from 'zod';
export const CourseMetadataSchema = z.object({
    pageNumber: z.number().int().positive().optional(),
    rawText: z.string().optional(),
    lastParsed: z.string().optional(),
});
export const CourseLevelSchema = z.enum(['undergraduate', 'graduate']);
export const CourseSchema = z.object({
    courseCode: z.string().min(1),
    ccn: z.string().optional(),
    courseName: z.string().min(1),
    description: z.string().optional(),
    competencyUnits: z.number().nonnegative().optional(),
    prerequisites: z.array(z.string()).optional(),
    level: CourseLevelSchema.optional(),
    academicArea: z.string().optional(),
    metadata: CourseMetadataSchema.optional(),
});
export const DegreeCourseTypeSchema = z.enum(['required', 'elective', 'capstone']);
export const DegreePlanCourseSchema = z.object({
    courseCode: z.string().min(1),
    recommendedTerm: z.number().int().positive().optional(),
    type: DegreeCourseTypeSchema,
    category: z.string().optional(),
    notes: z.string().optional(),
});
export const DegreeTypeSchema = z.enum(['bachelor', 'master', 'doctorate', 'certificate']);
export const DegreePlanMetadataSchema = z.object({
    catalogYear: z.string().optional(),
    pageNumber: z.number().int().positive().optional(),
    rawText: z.string().optional(),
    lastParsed: z.string().optional(),
});
export const DegreePlanSchema = z.object({
    degreeId: z.string().min(1),
    degreeName: z.string().min(1),
    college: z.string().min(1),
    degreeType: DegreeTypeSchema,
    totalCompetencyUnits: z.number().nonnegative(),
    courses: z.array(DegreePlanCourseSchema),
    generalEducation: z.array(DegreePlanCourseSchema).optional(),
    programRequirements: z.array(DegreePlanCourseSchema).optional(),
    capstone: z.array(DegreePlanCourseSchema).optional(),
    metadata: DegreePlanMetadataSchema.optional(),
});
export const CatalogFormatCharacteristicsSchema = z.object({
    courseCodePatterns: z.array(z.string()),
    ccnFormat: z.string(),
    degreeTableFormat: z.string(),
    textFormatNotes: z.array(z.string()),
});
export const CatalogFormatDateRangeSchema = z.object({
    firstSeen: z.string().optional(),
    lastSeen: z.string().optional(),
});
export const CatalogFormatVersionSchema = z.object({
    major: z.number().nonnegative(),
    minor: z.number().nonnegative(),
    patch: z.number().nonnegative(),
    identifier: z.string(),
    characteristics: CatalogFormatCharacteristicsSchema,
    dateRange: CatalogFormatDateRangeSchema,
});
export const ParseDetectedPatternsSchema = z.object({
    courseCodeFormats: z.array(z.string()).optional(),
    ccnFormats: z.array(z.string()).optional(),
    degreeTableFormats: z.array(z.string()).optional(),
});
export const ParsePerformanceStepTimingsSchema = z.object({
    ccnExtraction: z.number().nonnegative().optional(),
    courseDescriptions: z.number().nonnegative().optional(),
    courseListings: z.number().nonnegative().optional(),
    degreePlans: z.number().nonnegative().optional(),
});
export const ParsePerformanceSchema = z.object({
    processingTimeMs: z.number().nonnegative().optional(),
    stepTimings: ParsePerformanceStepTimingsSchema.optional(),
    memoryUsageMB: z.number().nonnegative().optional(),
});
export const ParseCompatibilitySchema = z.object({
    fullySupported: z.boolean().optional(),
    formatDifferences: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
});
export const ParsingMetaSchema = z.object({
    detectedPatterns: ParseDetectedPatternsSchema.optional(),
    performance: ParsePerformanceSchema.optional(),
    compatibility: ParseCompatibilitySchema.optional(),
});
export const CatalogSourceMetaSchema = z.object({
    sourceUrl: z.string().optional(),
    fileSizeBytes: z.number().nonnegative().optional(),
    pdfCreationDate: z.string().optional(),
    pdfModificationDate: z.string().optional(),
});
export const CatalogStatisticsSchema = z.object({
    coursesFound: z.number().nonnegative(),
    degreePlansFound: z.number().nonnegative(),
    duplicatesRemoved: z.number().nonnegative(),
    ccnCoverage: z.number().min(0).max(100),
    competencyUnitsCoverage: z.number().min(0).max(100),
});
export const MetadataSchema = z.object({
    catalogDate: z.string(),
    academicYear: z.string(),
    sourceFile: z.string(),
    parsedAt: z.string(),
    parserVersion: z.string(),
    totalPages: z.number().int().positive(),
    formatVersion: CatalogFormatVersionSchema,
    source: CatalogSourceMetaSchema.optional(),
    parsing: ParsingMetaSchema.optional(),
    parseErrors: z.array(z.string()).optional(),
    statistics: CatalogStatisticsSchema,
});
export const CatalogDataSchema = z.object({
    courses: z.record(CourseSchema),
    degreePlans: z.record(DegreePlanSchema),
    metadata: MetadataSchema,
});
export function assertCatalogData(value) {
    CatalogDataSchema.parse(value);
}
