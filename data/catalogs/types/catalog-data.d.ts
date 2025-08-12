export interface CourseMetadata {
    pageNumber?: number;
    rawText?: string;
    lastParsed?: string;
}
export type CourseLevel = 'undergraduate' | 'graduate';
export interface Course {
    courseCode: string;
    ccn?: string;
    courseName: string;
    description?: string;
    competencyUnits?: number;
    prerequisites?: string[];
    level?: CourseLevel;
    academicArea?: string;
    metadata?: CourseMetadata;
}
export type DegreeCourseType = 'required' | 'elective' | 'capstone';
export interface DegreePlanCourse {
    courseCode: string;
    recommendedTerm?: number;
    type: DegreeCourseType;
    category?: string;
    notes?: string;
}
export type DegreeType = 'bachelor' | 'master' | 'doctorate' | 'certificate';
export interface DegreePlanMetadata {
    catalogYear?: string;
    pageNumber?: number;
    rawText?: string;
    lastParsed?: string;
}
export interface DegreePlan {
    degreeId: string;
    degreeName: string;
    college: string;
    degreeType: DegreeType;
    totalCompetencyUnits: number;
    courses: DegreePlanCourse[];
    generalEducation?: DegreePlanCourse[];
    programRequirements?: DegreePlanCourse[];
    capstone?: DegreePlanCourse[];
    metadata?: DegreePlanMetadata;
}
export interface CatalogFormatCharacteristics {
    courseCodePatterns: string[];
    ccnFormat: string;
    degreeTableFormat: string;
    textFormatNotes: string[];
}
export interface CatalogFormatDateRange {
    firstSeen?: string;
    lastSeen?: string;
}
export interface CatalogFormatVersion {
    major: number;
    minor: number;
    patch: number;
    identifier: string;
    characteristics: CatalogFormatCharacteristics;
    dateRange: CatalogFormatDateRange;
}
export interface ParseDetectedPatterns {
    courseCodeFormats?: string[];
    ccnFormats?: string[];
    degreeTableFormats?: string[];
}
export interface ParsePerformanceStepTimings {
    ccnExtraction?: number;
    courseDescriptions?: number;
    courseListings?: number;
    degreePlans?: number;
}
export interface ParsePerformance {
    processingTimeMs?: number;
    stepTimings?: ParsePerformanceStepTimings;
    memoryUsageMB?: number;
}
export interface ParseCompatibility {
    fullySupported?: boolean;
    formatDifferences?: string[];
    recommendations?: string[];
}
export interface ParsingMeta {
    detectedPatterns?: ParseDetectedPatterns;
    performance?: ParsePerformance;
    compatibility?: ParseCompatibility;
}
export interface CatalogSourceMeta {
    sourceUrl?: string;
    fileSizeBytes?: number;
    pdfCreationDate?: string;
    pdfModificationDate?: string;
}
export interface CatalogStatistics {
    coursesFound: number;
    degreePlansFound: number;
    duplicatesRemoved: number;
    ccnCoverage: number;
    competencyUnitsCoverage: number;
}
export interface Metadata {
    catalogDate: string;
    academicYear: string;
    sourceFile: string;
    parsedAt: string;
    parserVersion: string;
    totalPages: number;
    formatVersion: CatalogFormatVersion;
    source?: CatalogSourceMeta;
    parsing?: ParsingMeta;
    parseErrors?: string[];
    statistics: CatalogStatistics;
}
export interface CatalogData {
    courses: Record<string, Course>;
    degreePlans: Record<string, DegreePlan>;
    metadata: Metadata;
}
export declare function isCatalogData(value: unknown): value is CatalogData;
export interface CatalogParserConfig {
    pdfPath: string;
    outputDir: string;
    options: {
        extractDescriptions: boolean;
        parseDegreePlans: boolean;
        includeRawText: boolean;
        maxPages: number;
        validateData: boolean;
    };
    patterns: {
        courseCode: RegExp;
        ccn: RegExp;
        competencyUnits: RegExp;
        degreePlan: RegExp;
    };
}
export interface ParseResult {
    success: boolean;
    data?: CatalogData;
    errors?: string[];
    warnings?: string[];
    stats: {
        processingTime: number;
        pagesProcessed: number;
        itemsExtracted: {
            courses: number;
            degreePlans: number;
        };
    };
}
