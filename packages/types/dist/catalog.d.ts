import { z } from 'zod';
export declare const CourseMetadataSchema: z.ZodObject<{
    pageNumber: z.ZodOptional<z.ZodNumber>;
    rawText: z.ZodOptional<z.ZodString>;
    lastParsed: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pageNumber?: number | undefined;
    rawText?: string | undefined;
    lastParsed?: string | undefined;
}, {
    pageNumber?: number | undefined;
    rawText?: string | undefined;
    lastParsed?: string | undefined;
}>;
export declare const CourseLevelSchema: z.ZodEnum<["undergraduate", "graduate"]>;
export declare const CourseSchema: z.ZodObject<{
    courseCode: z.ZodString;
    ccn: z.ZodOptional<z.ZodString>;
    courseName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    competencyUnits: z.ZodOptional<z.ZodNumber>;
    prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    level: z.ZodOptional<z.ZodEnum<["undergraduate", "graduate"]>>;
    academicArea: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        pageNumber: z.ZodOptional<z.ZodNumber>;
        rawText: z.ZodOptional<z.ZodString>;
        lastParsed: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
    }, {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    courseCode: string;
    courseName: string;
    metadata?: {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
    } | undefined;
    ccn?: string | undefined;
    description?: string | undefined;
    competencyUnits?: number | undefined;
    prerequisites?: string[] | undefined;
    level?: "undergraduate" | "graduate" | undefined;
    academicArea?: string | undefined;
}, {
    courseCode: string;
    courseName: string;
    metadata?: {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
    } | undefined;
    ccn?: string | undefined;
    description?: string | undefined;
    competencyUnits?: number | undefined;
    prerequisites?: string[] | undefined;
    level?: "undergraduate" | "graduate" | undefined;
    academicArea?: string | undefined;
}>;
export type Course = z.infer<typeof CourseSchema>;
export declare const DegreeCourseTypeSchema: z.ZodEnum<["required", "elective", "capstone"]>;
export declare const DegreePlanCourseSchema: z.ZodObject<{
    courseCode: z.ZodString;
    recommendedTerm: z.ZodOptional<z.ZodNumber>;
    type: z.ZodEnum<["required", "elective", "capstone"]>;
    category: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "required" | "elective" | "capstone";
    courseCode: string;
    recommendedTerm?: number | undefined;
    category?: string | undefined;
    notes?: string | undefined;
}, {
    type: "required" | "elective" | "capstone";
    courseCode: string;
    recommendedTerm?: number | undefined;
    category?: string | undefined;
    notes?: string | undefined;
}>;
export type DegreePlanCourse = z.infer<typeof DegreePlanCourseSchema>;
export declare const DegreeTypeSchema: z.ZodEnum<["bachelor", "master", "doctorate", "certificate"]>;
export declare const DegreePlanMetadataSchema: z.ZodObject<{
    catalogYear: z.ZodOptional<z.ZodString>;
    pageNumber: z.ZodOptional<z.ZodNumber>;
    rawText: z.ZodOptional<z.ZodString>;
    lastParsed: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pageNumber?: number | undefined;
    rawText?: string | undefined;
    lastParsed?: string | undefined;
    catalogYear?: string | undefined;
}, {
    pageNumber?: number | undefined;
    rawText?: string | undefined;
    lastParsed?: string | undefined;
    catalogYear?: string | undefined;
}>;
export declare const DegreePlanSchema: z.ZodObject<{
    degreeId: z.ZodString;
    degreeName: z.ZodString;
    college: z.ZodString;
    degreeType: z.ZodEnum<["bachelor", "master", "doctorate", "certificate"]>;
    totalCompetencyUnits: z.ZodNumber;
    courses: z.ZodArray<z.ZodObject<{
        courseCode: z.ZodString;
        recommendedTerm: z.ZodOptional<z.ZodNumber>;
        type: z.ZodEnum<["required", "elective", "capstone"]>;
        category: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }>, "many">;
    generalEducation: z.ZodOptional<z.ZodArray<z.ZodObject<{
        courseCode: z.ZodString;
        recommendedTerm: z.ZodOptional<z.ZodNumber>;
        type: z.ZodEnum<["required", "elective", "capstone"]>;
        category: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }>, "many">>;
    programRequirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
        courseCode: z.ZodString;
        recommendedTerm: z.ZodOptional<z.ZodNumber>;
        type: z.ZodEnum<["required", "elective", "capstone"]>;
        category: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }>, "many">>;
    capstone: z.ZodOptional<z.ZodArray<z.ZodObject<{
        courseCode: z.ZodString;
        recommendedTerm: z.ZodOptional<z.ZodNumber>;
        type: z.ZodEnum<["required", "elective", "capstone"]>;
        category: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }, {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }>, "many">>;
    metadata: z.ZodOptional<z.ZodObject<{
        catalogYear: z.ZodOptional<z.ZodString>;
        pageNumber: z.ZodOptional<z.ZodNumber>;
        rawText: z.ZodOptional<z.ZodString>;
        lastParsed: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
        catalogYear?: string | undefined;
    }, {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
        catalogYear?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    college: string;
    courses: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[];
    degreeId: string;
    degreeName: string;
    degreeType: "bachelor" | "master" | "doctorate" | "certificate";
    totalCompetencyUnits: number;
    capstone?: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
    metadata?: {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
        catalogYear?: string | undefined;
    } | undefined;
    generalEducation?: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
    programRequirements?: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
}, {
    college: string;
    courses: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[];
    degreeId: string;
    degreeName: string;
    degreeType: "bachelor" | "master" | "doctorate" | "certificate";
    totalCompetencyUnits: number;
    capstone?: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
    metadata?: {
        pageNumber?: number | undefined;
        rawText?: string | undefined;
        lastParsed?: string | undefined;
        catalogYear?: string | undefined;
    } | undefined;
    generalEducation?: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
    programRequirements?: {
        type: "required" | "elective" | "capstone";
        courseCode: string;
        recommendedTerm?: number | undefined;
        category?: string | undefined;
        notes?: string | undefined;
    }[] | undefined;
}>;
export type DegreePlan = z.infer<typeof DegreePlanSchema>;
export declare const CatalogFormatCharacteristicsSchema: z.ZodObject<{
    courseCodePatterns: z.ZodArray<z.ZodString, "many">;
    ccnFormat: z.ZodString;
    degreeTableFormat: z.ZodString;
    textFormatNotes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    courseCodePatterns: string[];
    ccnFormat: string;
    degreeTableFormat: string;
    textFormatNotes: string[];
}, {
    courseCodePatterns: string[];
    ccnFormat: string;
    degreeTableFormat: string;
    textFormatNotes: string[];
}>;
export declare const CatalogFormatDateRangeSchema: z.ZodObject<{
    firstSeen: z.ZodOptional<z.ZodString>;
    lastSeen: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstSeen?: string | undefined;
    lastSeen?: string | undefined;
}, {
    firstSeen?: string | undefined;
    lastSeen?: string | undefined;
}>;
export declare const CatalogFormatVersionSchema: z.ZodObject<{
    major: z.ZodNumber;
    minor: z.ZodNumber;
    patch: z.ZodNumber;
    identifier: z.ZodString;
    characteristics: z.ZodObject<{
        courseCodePatterns: z.ZodArray<z.ZodString, "many">;
        ccnFormat: z.ZodString;
        degreeTableFormat: z.ZodString;
        textFormatNotes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        courseCodePatterns: string[];
        ccnFormat: string;
        degreeTableFormat: string;
        textFormatNotes: string[];
    }, {
        courseCodePatterns: string[];
        ccnFormat: string;
        degreeTableFormat: string;
        textFormatNotes: string[];
    }>;
    dateRange: z.ZodObject<{
        firstSeen: z.ZodOptional<z.ZodString>;
        lastSeen: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstSeen?: string | undefined;
        lastSeen?: string | undefined;
    }, {
        firstSeen?: string | undefined;
        lastSeen?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    major: number;
    minor: number;
    patch: number;
    identifier: string;
    characteristics: {
        courseCodePatterns: string[];
        ccnFormat: string;
        degreeTableFormat: string;
        textFormatNotes: string[];
    };
    dateRange: {
        firstSeen?: string | undefined;
        lastSeen?: string | undefined;
    };
}, {
    major: number;
    minor: number;
    patch: number;
    identifier: string;
    characteristics: {
        courseCodePatterns: string[];
        ccnFormat: string;
        degreeTableFormat: string;
        textFormatNotes: string[];
    };
    dateRange: {
        firstSeen?: string | undefined;
        lastSeen?: string | undefined;
    };
}>;
export type CatalogFormatVersion = z.infer<typeof CatalogFormatVersionSchema>;
export declare const ParseDetectedPatternsSchema: z.ZodObject<{
    courseCodeFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ccnFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    degreeTableFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    courseCodeFormats?: string[] | undefined;
    ccnFormats?: string[] | undefined;
    degreeTableFormats?: string[] | undefined;
}, {
    courseCodeFormats?: string[] | undefined;
    ccnFormats?: string[] | undefined;
    degreeTableFormats?: string[] | undefined;
}>;
export declare const ParsePerformanceStepTimingsSchema: z.ZodObject<{
    ccnExtraction: z.ZodOptional<z.ZodNumber>;
    courseDescriptions: z.ZodOptional<z.ZodNumber>;
    courseListings: z.ZodOptional<z.ZodNumber>;
    degreePlans: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    degreePlans?: number | undefined;
    ccnExtraction?: number | undefined;
    courseDescriptions?: number | undefined;
    courseListings?: number | undefined;
}, {
    degreePlans?: number | undefined;
    ccnExtraction?: number | undefined;
    courseDescriptions?: number | undefined;
    courseListings?: number | undefined;
}>;
export declare const ParsePerformanceSchema: z.ZodObject<{
    processingTimeMs: z.ZodOptional<z.ZodNumber>;
    stepTimings: z.ZodOptional<z.ZodObject<{
        ccnExtraction: z.ZodOptional<z.ZodNumber>;
        courseDescriptions: z.ZodOptional<z.ZodNumber>;
        courseListings: z.ZodOptional<z.ZodNumber>;
        degreePlans: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        degreePlans?: number | undefined;
        ccnExtraction?: number | undefined;
        courseDescriptions?: number | undefined;
        courseListings?: number | undefined;
    }, {
        degreePlans?: number | undefined;
        ccnExtraction?: number | undefined;
        courseDescriptions?: number | undefined;
        courseListings?: number | undefined;
    }>>;
    memoryUsageMB: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    processingTimeMs?: number | undefined;
    stepTimings?: {
        degreePlans?: number | undefined;
        ccnExtraction?: number | undefined;
        courseDescriptions?: number | undefined;
        courseListings?: number | undefined;
    } | undefined;
    memoryUsageMB?: number | undefined;
}, {
    processingTimeMs?: number | undefined;
    stepTimings?: {
        degreePlans?: number | undefined;
        ccnExtraction?: number | undefined;
        courseDescriptions?: number | undefined;
        courseListings?: number | undefined;
    } | undefined;
    memoryUsageMB?: number | undefined;
}>;
export declare const ParseCompatibilitySchema: z.ZodObject<{
    fullySupported: z.ZodOptional<z.ZodBoolean>;
    formatDifferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    fullySupported?: boolean | undefined;
    formatDifferences?: string[] | undefined;
    recommendations?: string[] | undefined;
}, {
    fullySupported?: boolean | undefined;
    formatDifferences?: string[] | undefined;
    recommendations?: string[] | undefined;
}>;
export declare const ParsingMetaSchema: z.ZodObject<{
    detectedPatterns: z.ZodOptional<z.ZodObject<{
        courseCodeFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ccnFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        degreeTableFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseCodeFormats?: string[] | undefined;
        ccnFormats?: string[] | undefined;
        degreeTableFormats?: string[] | undefined;
    }, {
        courseCodeFormats?: string[] | undefined;
        ccnFormats?: string[] | undefined;
        degreeTableFormats?: string[] | undefined;
    }>>;
    performance: z.ZodOptional<z.ZodObject<{
        processingTimeMs: z.ZodOptional<z.ZodNumber>;
        stepTimings: z.ZodOptional<z.ZodObject<{
            ccnExtraction: z.ZodOptional<z.ZodNumber>;
            courseDescriptions: z.ZodOptional<z.ZodNumber>;
            courseListings: z.ZodOptional<z.ZodNumber>;
            degreePlans: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            degreePlans?: number | undefined;
            ccnExtraction?: number | undefined;
            courseDescriptions?: number | undefined;
            courseListings?: number | undefined;
        }, {
            degreePlans?: number | undefined;
            ccnExtraction?: number | undefined;
            courseDescriptions?: number | undefined;
            courseListings?: number | undefined;
        }>>;
        memoryUsageMB: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        processingTimeMs?: number | undefined;
        stepTimings?: {
            degreePlans?: number | undefined;
            ccnExtraction?: number | undefined;
            courseDescriptions?: number | undefined;
            courseListings?: number | undefined;
        } | undefined;
        memoryUsageMB?: number | undefined;
    }, {
        processingTimeMs?: number | undefined;
        stepTimings?: {
            degreePlans?: number | undefined;
            ccnExtraction?: number | undefined;
            courseDescriptions?: number | undefined;
            courseListings?: number | undefined;
        } | undefined;
        memoryUsageMB?: number | undefined;
    }>>;
    compatibility: z.ZodOptional<z.ZodObject<{
        fullySupported: z.ZodOptional<z.ZodBoolean>;
        formatDifferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        fullySupported?: boolean | undefined;
        formatDifferences?: string[] | undefined;
        recommendations?: string[] | undefined;
    }, {
        fullySupported?: boolean | undefined;
        formatDifferences?: string[] | undefined;
        recommendations?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    detectedPatterns?: {
        courseCodeFormats?: string[] | undefined;
        ccnFormats?: string[] | undefined;
        degreeTableFormats?: string[] | undefined;
    } | undefined;
    performance?: {
        processingTimeMs?: number | undefined;
        stepTimings?: {
            degreePlans?: number | undefined;
            ccnExtraction?: number | undefined;
            courseDescriptions?: number | undefined;
            courseListings?: number | undefined;
        } | undefined;
        memoryUsageMB?: number | undefined;
    } | undefined;
    compatibility?: {
        fullySupported?: boolean | undefined;
        formatDifferences?: string[] | undefined;
        recommendations?: string[] | undefined;
    } | undefined;
}, {
    detectedPatterns?: {
        courseCodeFormats?: string[] | undefined;
        ccnFormats?: string[] | undefined;
        degreeTableFormats?: string[] | undefined;
    } | undefined;
    performance?: {
        processingTimeMs?: number | undefined;
        stepTimings?: {
            degreePlans?: number | undefined;
            ccnExtraction?: number | undefined;
            courseDescriptions?: number | undefined;
            courseListings?: number | undefined;
        } | undefined;
        memoryUsageMB?: number | undefined;
    } | undefined;
    compatibility?: {
        fullySupported?: boolean | undefined;
        formatDifferences?: string[] | undefined;
        recommendations?: string[] | undefined;
    } | undefined;
}>;
export declare const CatalogSourceMetaSchema: z.ZodObject<{
    sourceUrl: z.ZodOptional<z.ZodString>;
    fileSizeBytes: z.ZodOptional<z.ZodNumber>;
    pdfCreationDate: z.ZodOptional<z.ZodString>;
    pdfModificationDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sourceUrl?: string | undefined;
    fileSizeBytes?: number | undefined;
    pdfCreationDate?: string | undefined;
    pdfModificationDate?: string | undefined;
}, {
    sourceUrl?: string | undefined;
    fileSizeBytes?: number | undefined;
    pdfCreationDate?: string | undefined;
    pdfModificationDate?: string | undefined;
}>;
export declare const CatalogStatisticsSchema: z.ZodObject<{
    coursesFound: z.ZodNumber;
    degreePlansFound: z.ZodNumber;
    duplicatesRemoved: z.ZodNumber;
    ccnCoverage: z.ZodNumber;
    competencyUnitsCoverage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    coursesFound: number;
    degreePlansFound: number;
    duplicatesRemoved: number;
    ccnCoverage: number;
    competencyUnitsCoverage: number;
}, {
    coursesFound: number;
    degreePlansFound: number;
    duplicatesRemoved: number;
    ccnCoverage: number;
    competencyUnitsCoverage: number;
}>;
export declare const MetadataSchema: z.ZodObject<{
    catalogDate: z.ZodString;
    academicYear: z.ZodString;
    sourceFile: z.ZodString;
    parsedAt: z.ZodString;
    parserVersion: z.ZodString;
    totalPages: z.ZodNumber;
    formatVersion: z.ZodObject<{
        major: z.ZodNumber;
        minor: z.ZodNumber;
        patch: z.ZodNumber;
        identifier: z.ZodString;
        characteristics: z.ZodObject<{
            courseCodePatterns: z.ZodArray<z.ZodString, "many">;
            ccnFormat: z.ZodString;
            degreeTableFormat: z.ZodString;
            textFormatNotes: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            courseCodePatterns: string[];
            ccnFormat: string;
            degreeTableFormat: string;
            textFormatNotes: string[];
        }, {
            courseCodePatterns: string[];
            ccnFormat: string;
            degreeTableFormat: string;
            textFormatNotes: string[];
        }>;
        dateRange: z.ZodObject<{
            firstSeen: z.ZodOptional<z.ZodString>;
            lastSeen: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            firstSeen?: string | undefined;
            lastSeen?: string | undefined;
        }, {
            firstSeen?: string | undefined;
            lastSeen?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        major: number;
        minor: number;
        patch: number;
        identifier: string;
        characteristics: {
            courseCodePatterns: string[];
            ccnFormat: string;
            degreeTableFormat: string;
            textFormatNotes: string[];
        };
        dateRange: {
            firstSeen?: string | undefined;
            lastSeen?: string | undefined;
        };
    }, {
        major: number;
        minor: number;
        patch: number;
        identifier: string;
        characteristics: {
            courseCodePatterns: string[];
            ccnFormat: string;
            degreeTableFormat: string;
            textFormatNotes: string[];
        };
        dateRange: {
            firstSeen?: string | undefined;
            lastSeen?: string | undefined;
        };
    }>;
    source: z.ZodOptional<z.ZodObject<{
        sourceUrl: z.ZodOptional<z.ZodString>;
        fileSizeBytes: z.ZodOptional<z.ZodNumber>;
        pdfCreationDate: z.ZodOptional<z.ZodString>;
        pdfModificationDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        sourceUrl?: string | undefined;
        fileSizeBytes?: number | undefined;
        pdfCreationDate?: string | undefined;
        pdfModificationDate?: string | undefined;
    }, {
        sourceUrl?: string | undefined;
        fileSizeBytes?: number | undefined;
        pdfCreationDate?: string | undefined;
        pdfModificationDate?: string | undefined;
    }>>;
    parsing: z.ZodOptional<z.ZodObject<{
        detectedPatterns: z.ZodOptional<z.ZodObject<{
            courseCodeFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            ccnFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            degreeTableFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            courseCodeFormats?: string[] | undefined;
            ccnFormats?: string[] | undefined;
            degreeTableFormats?: string[] | undefined;
        }, {
            courseCodeFormats?: string[] | undefined;
            ccnFormats?: string[] | undefined;
            degreeTableFormats?: string[] | undefined;
        }>>;
        performance: z.ZodOptional<z.ZodObject<{
            processingTimeMs: z.ZodOptional<z.ZodNumber>;
            stepTimings: z.ZodOptional<z.ZodObject<{
                ccnExtraction: z.ZodOptional<z.ZodNumber>;
                courseDescriptions: z.ZodOptional<z.ZodNumber>;
                courseListings: z.ZodOptional<z.ZodNumber>;
                degreePlans: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            }, {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            }>>;
            memoryUsageMB: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            processingTimeMs?: number | undefined;
            stepTimings?: {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            } | undefined;
            memoryUsageMB?: number | undefined;
        }, {
            processingTimeMs?: number | undefined;
            stepTimings?: {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            } | undefined;
            memoryUsageMB?: number | undefined;
        }>>;
        compatibility: z.ZodOptional<z.ZodObject<{
            fullySupported: z.ZodOptional<z.ZodBoolean>;
            formatDifferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            fullySupported?: boolean | undefined;
            formatDifferences?: string[] | undefined;
            recommendations?: string[] | undefined;
        }, {
            fullySupported?: boolean | undefined;
            formatDifferences?: string[] | undefined;
            recommendations?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        detectedPatterns?: {
            courseCodeFormats?: string[] | undefined;
            ccnFormats?: string[] | undefined;
            degreeTableFormats?: string[] | undefined;
        } | undefined;
        performance?: {
            processingTimeMs?: number | undefined;
            stepTimings?: {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            } | undefined;
            memoryUsageMB?: number | undefined;
        } | undefined;
        compatibility?: {
            fullySupported?: boolean | undefined;
            formatDifferences?: string[] | undefined;
            recommendations?: string[] | undefined;
        } | undefined;
    }, {
        detectedPatterns?: {
            courseCodeFormats?: string[] | undefined;
            ccnFormats?: string[] | undefined;
            degreeTableFormats?: string[] | undefined;
        } | undefined;
        performance?: {
            processingTimeMs?: number | undefined;
            stepTimings?: {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            } | undefined;
            memoryUsageMB?: number | undefined;
        } | undefined;
        compatibility?: {
            fullySupported?: boolean | undefined;
            formatDifferences?: string[] | undefined;
            recommendations?: string[] | undefined;
        } | undefined;
    }>>;
    parseErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    statistics: z.ZodObject<{
        coursesFound: z.ZodNumber;
        degreePlansFound: z.ZodNumber;
        duplicatesRemoved: z.ZodNumber;
        ccnCoverage: z.ZodNumber;
        competencyUnitsCoverage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        coursesFound: number;
        degreePlansFound: number;
        duplicatesRemoved: number;
        ccnCoverage: number;
        competencyUnitsCoverage: number;
    }, {
        coursesFound: number;
        degreePlansFound: number;
        duplicatesRemoved: number;
        ccnCoverage: number;
        competencyUnitsCoverage: number;
    }>;
}, "strip", z.ZodTypeAny, {
    catalogDate: string;
    academicYear: string;
    sourceFile: string;
    parsedAt: string;
    parserVersion: string;
    totalPages: number;
    formatVersion: {
        major: number;
        minor: number;
        patch: number;
        identifier: string;
        characteristics: {
            courseCodePatterns: string[];
            ccnFormat: string;
            degreeTableFormat: string;
            textFormatNotes: string[];
        };
        dateRange: {
            firstSeen?: string | undefined;
            lastSeen?: string | undefined;
        };
    };
    statistics: {
        coursesFound: number;
        degreePlansFound: number;
        duplicatesRemoved: number;
        ccnCoverage: number;
        competencyUnitsCoverage: number;
    };
    source?: {
        sourceUrl?: string | undefined;
        fileSizeBytes?: number | undefined;
        pdfCreationDate?: string | undefined;
        pdfModificationDate?: string | undefined;
    } | undefined;
    parsing?: {
        detectedPatterns?: {
            courseCodeFormats?: string[] | undefined;
            ccnFormats?: string[] | undefined;
            degreeTableFormats?: string[] | undefined;
        } | undefined;
        performance?: {
            processingTimeMs?: number | undefined;
            stepTimings?: {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            } | undefined;
            memoryUsageMB?: number | undefined;
        } | undefined;
        compatibility?: {
            fullySupported?: boolean | undefined;
            formatDifferences?: string[] | undefined;
            recommendations?: string[] | undefined;
        } | undefined;
    } | undefined;
    parseErrors?: string[] | undefined;
}, {
    catalogDate: string;
    academicYear: string;
    sourceFile: string;
    parsedAt: string;
    parserVersion: string;
    totalPages: number;
    formatVersion: {
        major: number;
        minor: number;
        patch: number;
        identifier: string;
        characteristics: {
            courseCodePatterns: string[];
            ccnFormat: string;
            degreeTableFormat: string;
            textFormatNotes: string[];
        };
        dateRange: {
            firstSeen?: string | undefined;
            lastSeen?: string | undefined;
        };
    };
    statistics: {
        coursesFound: number;
        degreePlansFound: number;
        duplicatesRemoved: number;
        ccnCoverage: number;
        competencyUnitsCoverage: number;
    };
    source?: {
        sourceUrl?: string | undefined;
        fileSizeBytes?: number | undefined;
        pdfCreationDate?: string | undefined;
        pdfModificationDate?: string | undefined;
    } | undefined;
    parsing?: {
        detectedPatterns?: {
            courseCodeFormats?: string[] | undefined;
            ccnFormats?: string[] | undefined;
            degreeTableFormats?: string[] | undefined;
        } | undefined;
        performance?: {
            processingTimeMs?: number | undefined;
            stepTimings?: {
                degreePlans?: number | undefined;
                ccnExtraction?: number | undefined;
                courseDescriptions?: number | undefined;
                courseListings?: number | undefined;
            } | undefined;
            memoryUsageMB?: number | undefined;
        } | undefined;
        compatibility?: {
            fullySupported?: boolean | undefined;
            formatDifferences?: string[] | undefined;
            recommendations?: string[] | undefined;
        } | undefined;
    } | undefined;
    parseErrors?: string[] | undefined;
}>;
export type Metadata = z.infer<typeof MetadataSchema>;
export declare const CatalogDataSchema: z.ZodObject<{
    courses: z.ZodRecord<z.ZodString, z.ZodObject<{
        courseCode: z.ZodString;
        ccn: z.ZodOptional<z.ZodString>;
        courseName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        competencyUnits: z.ZodOptional<z.ZodNumber>;
        prerequisites: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        level: z.ZodOptional<z.ZodEnum<["undergraduate", "graduate"]>>;
        academicArea: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            pageNumber: z.ZodOptional<z.ZodNumber>;
            rawText: z.ZodOptional<z.ZodString>;
            lastParsed: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
        }, {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        courseCode: string;
        courseName: string;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
        } | undefined;
        ccn?: string | undefined;
        description?: string | undefined;
        competencyUnits?: number | undefined;
        prerequisites?: string[] | undefined;
        level?: "undergraduate" | "graduate" | undefined;
        academicArea?: string | undefined;
    }, {
        courseCode: string;
        courseName: string;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
        } | undefined;
        ccn?: string | undefined;
        description?: string | undefined;
        competencyUnits?: number | undefined;
        prerequisites?: string[] | undefined;
        level?: "undergraduate" | "graduate" | undefined;
        academicArea?: string | undefined;
    }>>;
    degreePlans: z.ZodRecord<z.ZodString, z.ZodObject<{
        degreeId: z.ZodString;
        degreeName: z.ZodString;
        college: z.ZodString;
        degreeType: z.ZodEnum<["bachelor", "master", "doctorate", "certificate"]>;
        totalCompetencyUnits: z.ZodNumber;
        courses: z.ZodArray<z.ZodObject<{
            courseCode: z.ZodString;
            recommendedTerm: z.ZodOptional<z.ZodNumber>;
            type: z.ZodEnum<["required", "elective", "capstone"]>;
            category: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }>, "many">;
        generalEducation: z.ZodOptional<z.ZodArray<z.ZodObject<{
            courseCode: z.ZodString;
            recommendedTerm: z.ZodOptional<z.ZodNumber>;
            type: z.ZodEnum<["required", "elective", "capstone"]>;
            category: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }>, "many">>;
        programRequirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
            courseCode: z.ZodString;
            recommendedTerm: z.ZodOptional<z.ZodNumber>;
            type: z.ZodEnum<["required", "elective", "capstone"]>;
            category: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }>, "many">>;
        capstone: z.ZodOptional<z.ZodArray<z.ZodObject<{
            courseCode: z.ZodString;
            recommendedTerm: z.ZodOptional<z.ZodNumber>;
            type: z.ZodEnum<["required", "elective", "capstone"]>;
            category: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }, {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }>, "many">>;
        metadata: z.ZodOptional<z.ZodObject<{
            catalogYear: z.ZodOptional<z.ZodString>;
            pageNumber: z.ZodOptional<z.ZodNumber>;
            rawText: z.ZodOptional<z.ZodString>;
            lastParsed: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
            catalogYear?: string | undefined;
        }, {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
            catalogYear?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        college: string;
        courses: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[];
        degreeId: string;
        degreeName: string;
        degreeType: "bachelor" | "master" | "doctorate" | "certificate";
        totalCompetencyUnits: number;
        capstone?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
            catalogYear?: string | undefined;
        } | undefined;
        generalEducation?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        programRequirements?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
    }, {
        college: string;
        courses: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[];
        degreeId: string;
        degreeName: string;
        degreeType: "bachelor" | "master" | "doctorate" | "certificate";
        totalCompetencyUnits: number;
        capstone?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
            catalogYear?: string | undefined;
        } | undefined;
        generalEducation?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        programRequirements?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
    }>>;
    metadata: z.ZodObject<{
        catalogDate: z.ZodString;
        academicYear: z.ZodString;
        sourceFile: z.ZodString;
        parsedAt: z.ZodString;
        parserVersion: z.ZodString;
        totalPages: z.ZodNumber;
        formatVersion: z.ZodObject<{
            major: z.ZodNumber;
            minor: z.ZodNumber;
            patch: z.ZodNumber;
            identifier: z.ZodString;
            characteristics: z.ZodObject<{
                courseCodePatterns: z.ZodArray<z.ZodString, "many">;
                ccnFormat: z.ZodString;
                degreeTableFormat: z.ZodString;
                textFormatNotes: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            }, {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            }>;
            dateRange: z.ZodObject<{
                firstSeen: z.ZodOptional<z.ZodString>;
                lastSeen: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            }, {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            major: number;
            minor: number;
            patch: number;
            identifier: string;
            characteristics: {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            };
            dateRange: {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            };
        }, {
            major: number;
            minor: number;
            patch: number;
            identifier: string;
            characteristics: {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            };
            dateRange: {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            };
        }>;
        source: z.ZodOptional<z.ZodObject<{
            sourceUrl: z.ZodOptional<z.ZodString>;
            fileSizeBytes: z.ZodOptional<z.ZodNumber>;
            pdfCreationDate: z.ZodOptional<z.ZodString>;
            pdfModificationDate: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            sourceUrl?: string | undefined;
            fileSizeBytes?: number | undefined;
            pdfCreationDate?: string | undefined;
            pdfModificationDate?: string | undefined;
        }, {
            sourceUrl?: string | undefined;
            fileSizeBytes?: number | undefined;
            pdfCreationDate?: string | undefined;
            pdfModificationDate?: string | undefined;
        }>>;
        parsing: z.ZodOptional<z.ZodObject<{
            detectedPatterns: z.ZodOptional<z.ZodObject<{
                courseCodeFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                ccnFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                degreeTableFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            }, {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            }>>;
            performance: z.ZodOptional<z.ZodObject<{
                processingTimeMs: z.ZodOptional<z.ZodNumber>;
                stepTimings: z.ZodOptional<z.ZodObject<{
                    ccnExtraction: z.ZodOptional<z.ZodNumber>;
                    courseDescriptions: z.ZodOptional<z.ZodNumber>;
                    courseListings: z.ZodOptional<z.ZodNumber>;
                    degreePlans: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                }, {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                }>>;
                memoryUsageMB: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            }, {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            }>>;
            compatibility: z.ZodOptional<z.ZodObject<{
                fullySupported: z.ZodOptional<z.ZodBoolean>;
                formatDifferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            }, {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            detectedPatterns?: {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            } | undefined;
            performance?: {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            } | undefined;
            compatibility?: {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            } | undefined;
        }, {
            detectedPatterns?: {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            } | undefined;
            performance?: {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            } | undefined;
            compatibility?: {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            } | undefined;
        }>>;
        parseErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        statistics: z.ZodObject<{
            coursesFound: z.ZodNumber;
            degreePlansFound: z.ZodNumber;
            duplicatesRemoved: z.ZodNumber;
            ccnCoverage: z.ZodNumber;
            competencyUnitsCoverage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            coursesFound: number;
            degreePlansFound: number;
            duplicatesRemoved: number;
            ccnCoverage: number;
            competencyUnitsCoverage: number;
        }, {
            coursesFound: number;
            degreePlansFound: number;
            duplicatesRemoved: number;
            ccnCoverage: number;
            competencyUnitsCoverage: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        catalogDate: string;
        academicYear: string;
        sourceFile: string;
        parsedAt: string;
        parserVersion: string;
        totalPages: number;
        formatVersion: {
            major: number;
            minor: number;
            patch: number;
            identifier: string;
            characteristics: {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            };
            dateRange: {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            };
        };
        statistics: {
            coursesFound: number;
            degreePlansFound: number;
            duplicatesRemoved: number;
            ccnCoverage: number;
            competencyUnitsCoverage: number;
        };
        source?: {
            sourceUrl?: string | undefined;
            fileSizeBytes?: number | undefined;
            pdfCreationDate?: string | undefined;
            pdfModificationDate?: string | undefined;
        } | undefined;
        parsing?: {
            detectedPatterns?: {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            } | undefined;
            performance?: {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            } | undefined;
            compatibility?: {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            } | undefined;
        } | undefined;
        parseErrors?: string[] | undefined;
    }, {
        catalogDate: string;
        academicYear: string;
        sourceFile: string;
        parsedAt: string;
        parserVersion: string;
        totalPages: number;
        formatVersion: {
            major: number;
            minor: number;
            patch: number;
            identifier: string;
            characteristics: {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            };
            dateRange: {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            };
        };
        statistics: {
            coursesFound: number;
            degreePlansFound: number;
            duplicatesRemoved: number;
            ccnCoverage: number;
            competencyUnitsCoverage: number;
        };
        source?: {
            sourceUrl?: string | undefined;
            fileSizeBytes?: number | undefined;
            pdfCreationDate?: string | undefined;
            pdfModificationDate?: string | undefined;
        } | undefined;
        parsing?: {
            detectedPatterns?: {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            } | undefined;
            performance?: {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            } | undefined;
            compatibility?: {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            } | undefined;
        } | undefined;
        parseErrors?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    courses: Record<string, {
        courseCode: string;
        courseName: string;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
        } | undefined;
        ccn?: string | undefined;
        description?: string | undefined;
        competencyUnits?: number | undefined;
        prerequisites?: string[] | undefined;
        level?: "undergraduate" | "graduate" | undefined;
        academicArea?: string | undefined;
    }>;
    degreePlans: Record<string, {
        college: string;
        courses: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[];
        degreeId: string;
        degreeName: string;
        degreeType: "bachelor" | "master" | "doctorate" | "certificate";
        totalCompetencyUnits: number;
        capstone?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
            catalogYear?: string | undefined;
        } | undefined;
        generalEducation?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        programRequirements?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
    }>;
    metadata: {
        catalogDate: string;
        academicYear: string;
        sourceFile: string;
        parsedAt: string;
        parserVersion: string;
        totalPages: number;
        formatVersion: {
            major: number;
            minor: number;
            patch: number;
            identifier: string;
            characteristics: {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            };
            dateRange: {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            };
        };
        statistics: {
            coursesFound: number;
            degreePlansFound: number;
            duplicatesRemoved: number;
            ccnCoverage: number;
            competencyUnitsCoverage: number;
        };
        source?: {
            sourceUrl?: string | undefined;
            fileSizeBytes?: number | undefined;
            pdfCreationDate?: string | undefined;
            pdfModificationDate?: string | undefined;
        } | undefined;
        parsing?: {
            detectedPatterns?: {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            } | undefined;
            performance?: {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            } | undefined;
            compatibility?: {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            } | undefined;
        } | undefined;
        parseErrors?: string[] | undefined;
    };
}, {
    courses: Record<string, {
        courseCode: string;
        courseName: string;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
        } | undefined;
        ccn?: string | undefined;
        description?: string | undefined;
        competencyUnits?: number | undefined;
        prerequisites?: string[] | undefined;
        level?: "undergraduate" | "graduate" | undefined;
        academicArea?: string | undefined;
    }>;
    degreePlans: Record<string, {
        college: string;
        courses: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[];
        degreeId: string;
        degreeName: string;
        degreeType: "bachelor" | "master" | "doctorate" | "certificate";
        totalCompetencyUnits: number;
        capstone?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        metadata?: {
            pageNumber?: number | undefined;
            rawText?: string | undefined;
            lastParsed?: string | undefined;
            catalogYear?: string | undefined;
        } | undefined;
        generalEducation?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        programRequirements?: {
            type: "required" | "elective" | "capstone";
            courseCode: string;
            recommendedTerm?: number | undefined;
            category?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
    }>;
    metadata: {
        catalogDate: string;
        academicYear: string;
        sourceFile: string;
        parsedAt: string;
        parserVersion: string;
        totalPages: number;
        formatVersion: {
            major: number;
            minor: number;
            patch: number;
            identifier: string;
            characteristics: {
                courseCodePatterns: string[];
                ccnFormat: string;
                degreeTableFormat: string;
                textFormatNotes: string[];
            };
            dateRange: {
                firstSeen?: string | undefined;
                lastSeen?: string | undefined;
            };
        };
        statistics: {
            coursesFound: number;
            degreePlansFound: number;
            duplicatesRemoved: number;
            ccnCoverage: number;
            competencyUnitsCoverage: number;
        };
        source?: {
            sourceUrl?: string | undefined;
            fileSizeBytes?: number | undefined;
            pdfCreationDate?: string | undefined;
            pdfModificationDate?: string | undefined;
        } | undefined;
        parsing?: {
            detectedPatterns?: {
                courseCodeFormats?: string[] | undefined;
                ccnFormats?: string[] | undefined;
                degreeTableFormats?: string[] | undefined;
            } | undefined;
            performance?: {
                processingTimeMs?: number | undefined;
                stepTimings?: {
                    degreePlans?: number | undefined;
                    ccnExtraction?: number | undefined;
                    courseDescriptions?: number | undefined;
                    courseListings?: number | undefined;
                } | undefined;
                memoryUsageMB?: number | undefined;
            } | undefined;
            compatibility?: {
                fullySupported?: boolean | undefined;
                formatDifferences?: string[] | undefined;
                recommendations?: string[] | undefined;
            } | undefined;
        } | undefined;
        parseErrors?: string[] | undefined;
    };
}>;
export type CatalogData = z.infer<typeof CatalogDataSchema>;
export declare function assertCatalogData(value: unknown): asserts value is CatalogData;
