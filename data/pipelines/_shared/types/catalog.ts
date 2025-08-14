/**
 * Catalog Data Types
 * 
 * Type definitions for WGU catalog data structures
 */

// ========== Course Types ==========
export type CourseType = 'degree-plan' | 'independent-study' | 'flexible-learning';

export interface Course {
  courseCode: string;
  courseName: string;
  description?: string;
  ccn?: string;                    // Course Catalog Number (e.g., "ITEC 1010")
  competencyUnits?: number;
  courseType?: CourseType;
  prerequisites?: string[];         // Array of course codes
  corequisites?: string[];         // Array of course codes
  alternateVersions?: string[];    // e.g., C182 might have OA/PA versions
}

// ========== Degree Plan Types ==========
export interface DegreePlan {
  code?: string;                   // Program code (e.g., "BSCS")
  name: string;                    // Full program name
  title?: string;                  // For JSON output compatibility
  school?: string;                 // School of Technology, etc.
  courses?: string[];              // Ordered list of course codes
  totalCUs?: number;               // Total competency units required
  yearExtracted?: number;          // Year this plan was extracted
  requirementsUrl?: string;
  
  // Enhanced plan fields
  programCode?: string;
  effectiveDate?: string;
  version?: string;
  tracks?: Array<{
    name: string;
    courses: string[];
    requiredCUs?: number;
  }>;
  
  // Metadata from parsing
  pageNumber?: number;
  rawDegreeText?: string;
}

// ========== Standalone & Certificate Types ==========
export interface StandaloneCourse {
  courseCode: string;
  courseName: string;
  description?: string;
  price: number;
  competencyUnits?: number;
  prerequisites?: string[];
  ccn?: string;
  duration?: string;               // e.g., "3 months"
  accessType?: string;             // e.g., "Self-paced"
}

export interface CertificateProgram {
  code?: string;
  name: string;
  description?: string;
  price: number;
  courses?: string[];
  totalCUs?: number;
  url?: string;
  duration?: string;
  targetAudience?: string;
}

// ========== Bundle & Outcome Types ==========
export interface CourseBundleInfo {
  bundleName?: string;
  courses: string[];
  description?: string;
  priceRange?: { min: number; max: number };
  duration?: string;
  accessType?: string;
}

export interface ProgramOutcome {
  school?: 'Business' | 'Health' | 'Technology' | 'Education';
  program: string;
  outcomes: string[] | Array<{
    outcome: string;
    category?: 'technical' | 'professional' | 'analytical';
  }>;
}

// ========== Main Catalog Structure ==========
export interface ParsedCatalog {
  courses: Record<string, Course>;
  degreePlans: Record<string, DegreePlan>;
  standaloneCourses?: Record<string, StandaloneCourse>;
  certificatePrograms?: Record<string, CertificateProgram>;
  programOutcomes?: Record<string, ProgramOutcome>;
  courseBundles?: CourseBundleInfo[];
  metadata: CatalogMetadata;
}

// ========== Metadata Types ==========
export interface CatalogMetadata {
  catalogDate: string;             // e.g., "2025-08"
  parserVersion: string;           // e.g., "v2.1-enhanced"
  parsedAt: string;                // ISO date string
  totalPages: number;
  parsingTimeMs: number;
  pdf?: {
    title?: string;
    version?: string;
    pages: number;
    producer?: string;
    creationDate?: string;
  };
  statistics: CatalogStatistics;
  detectedPatterns?: {
    courseCodeFormats?: string[];
    ccnFormats?: string[];
    degreeTableFormats?: string[];
  };
}

export interface CatalogStatistics {
  coursesFound: number;
  degreePlansFound: number;
  standaloneCourses?: number;
  certificatePrograms?: number;
  programOutcomes?: number;
  ccnCoverage: number;             // Percentage
  cuCoverage: number;              // Percentage
  coursesByPrefix?: Record<string, number>;  // e.g., { "C": 168, "D": 648 }
  
  degreePlanStatistics?: {
    totalCourses: number;
    uniqueCourses: number;
    averageCoursesPerPlan: number;
    plansWithTotalCUs: number;
    schoolDistribution?: Record<string, number>;
  };
  
  dataQuality?: {
    coursesWithDescription: number;
    coursesWithCCN: number;
    coursesWithCUs: number;
    completeCourseRecords: number;
    problematicCourseCodeCount: number;
  };
}

// ========== Parser-Specific Types ==========
export interface CatalogFormat {
  version: string;                 // e.g., "v1.0", "v2.0", "v2.1"
  strategy: string;                // e.g., "embedded-ccn", "structured-tables"
  parserModule: string;            // Path to parser module
  characteristics: {
    yearRange: [number, number];
    contentPatterns: string[];
    tableFormat: string;
  };
}

// ========== Aggregator Types (for combining multiple catalogs) ==========
export interface NormalizedCourse {
  id: string;                      // Normalized key (lowercase code, e.g., "c182")
  code: string;                    // Original course code (e.g., "C182")
  name: string;                    // Course name/title
  description?: string;
  ccn?: string;
  competencyUnits?: number;
  versions: string[];              // Catalog versions where this course appears
  lastUpdated: string;             // ISO date string
}