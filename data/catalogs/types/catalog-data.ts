// Canonical TypeScript types for parsed WGU catalog data
// Note: These are based on our current parser outputs and may evolve.
// Keep JSON Schema in sync (catalog-data.schema.json).

export interface CourseMetadata {
	pageNumber?: number;
	rawText?: string;
	lastParsed?: string; // ISO date-time
}

export type CourseLevel = 'undergraduate' | 'graduate';
export type CourseType = 'degree-plan' | 'independent-study' | 'flexible-learning';

export interface Course {
	courseCode: string; // e.g., C182
	ccn?: string; // Course Control Number when present
	courseName: string;
	description?: string;
	competencyUnits?: number; // CU
	prerequisites?: string[]; // list of course codes or free-text markers
	level?: CourseLevel;
	courseType?: CourseType; // detected from catalog context
	academicArea?: string; // college/area grouping when detected
	metadata?: CourseMetadata;
}

export type DegreeCourseType = 'required' | 'elective' | 'capstone';

export interface DegreePlanCourse {
	courseCode: string;
	recommendedTerm?: number;
	type: DegreeCourseType;
	category?: string; // emphasis, GE, program requirement, etc.
	notes?: string;
}

export type DegreeType = 'bachelor' | 'master' | 'doctorate' | 'certificate';

export interface DegreePlanMetadata {
	catalogYear?: string;
	pageNumber?: number;
	rawText?: string;
	lastParsed?: string; // ISO date-time
}

export interface DegreePlan {
	degreeId: string; // program code or slug
	degreeName: string;
	college: string; // e.g., College of IT
	degreeType: DegreeType;
	totalCompetencyUnits: number;
	courses: DegreePlanCourse[]; // flattened ordered plan
	generalEducation?: DegreePlanCourse[];
	programRequirements?: DegreePlanCourse[];
	capstone?: DegreePlanCourse[];
	metadata?: DegreePlanMetadata;
}

export interface CatalogFormatCharacteristics {
	courseCodePatterns: string[]; // regex or human-readable notes
	ccnFormat: string; // pattern notes
	degreeTableFormat: string; // parsing approach identifier
	textFormatNotes: string[]; // miscellaneous
}

export interface CatalogFormatDateRange {
	firstSeen?: string; // YYYY-MM or ISO date
	lastSeen?: string;  // YYYY-MM or ISO date
}

export interface CatalogFormatVersion {
	major: number;
	minor: number;
	patch: number;
	identifier: string; // human name for characteristics grouping
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
	ccnCoverage: number; // 0-100
	competencyUnitsCoverage: number; // 0-100
}

export interface Metadata {
	catalogDate: string; // e.g., 2024-08
	academicYear: string; // e.g., 2024-2025
	sourceFile: string; // path to pdf used
	parsedAt: string; // ISO date-time
	parserVersion: string; // semver of our parser
	totalPages: number;
	formatVersion: CatalogFormatVersion;
	source?: CatalogSourceMeta;
	parsing?: ParsingMeta;
	parseErrors?: string[];
	statistics: CatalogStatistics;
}

export interface CatalogData {
	courses: Record<string, Course>; // keyed by courseCode
	degreePlans: Record<string, DegreePlan>; // keyed by degreeId
	metadata: Metadata;
}

// Type guards (lightweight)
export function isCatalogData(value: unknown): value is CatalogData {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Partial<CatalogData>;
	return (
		!!v.courses && typeof v.courses === 'object' &&
		!!v.degreePlans && typeof v.degreePlans === 'object' &&
		!!v.metadata && typeof v.metadata === 'object'
	);
}

// Parser configuration and result types (compat shim for existing scripts)
export interface CatalogParserConfig {
	pdfPath: string;
	outputDir: string;
	options: {
		extractDescriptions: boolean;
		parseDegreePlans: boolean;
		includeRawText: boolean;
		maxPages: number; // 0 = all
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
