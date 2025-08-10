/**
 * WGU Institutional Catalog Data Types
 * 
 * Types for parsing and working with WGU catalog PDFs including
 * course information, degree plans, and institutional data.
 */

// ===============================
// Course Information Types
// ===============================

export interface Course {
  /** Course Code (e.g., "C950", "D387") */
  courseCode: string;
  
  /** Course Control Number - unique identifier */
  ccn: string;
  
  /** Full course name */
  courseName: string;
  
  /** Course description from catalog */
  description: string;
  
  /** Competency Units (credit hours equivalent) */
  competencyUnits: number;
  
  /** Prerequisites if any */
  prerequisites?: string[];
  
  /** Course level (undergraduate, graduate, etc.) */
  level?: 'undergraduate' | 'graduate';
  
  /** Academic area/department */
  academicArea?: string;
  
  /** Additional metadata from catalog parsing */
  metadata?: {
    /** Page number where course was found in PDF */
    pageNumber?: number;
    
    /** Raw text section from PDF */
    rawText?: string;
    
    /** Last updated timestamp */
    lastParsed?: string;
  };
}

// ===============================
// Degree Plan Types
// ===============================

export interface DegreePlanCourse {
  /** Reference to course code */
  courseCode: string;
  
  /** Term/semester when course is typically taken */
  recommendedTerm?: number;
  
  /** Whether course is required or elective */
  type: 'required' | 'elective' | 'capstone';
  
  /** Category within degree plan */
  category?: string;
  
  /** Any special notes about this course in the degree plan */
  notes?: string;
}

export interface DegreePlan {
  /** Unique identifier for the degree */
  degreeId: string;
  
  /** Full degree name */
  degreeName: string;
  
  /** College/school offering the degree */
  college: string;
  
  /** Degree type */
  degreeType: 'bachelor' | 'master' | 'doctorate' | 'certificate';
  
  /** Total competency units required */
  totalCompetencyUnits: number;
  
  /** All courses in the degree plan */
  courses: DegreePlanCourse[];
  
  /** General education requirements */
  generalEducation?: DegreePlanCourse[];
  
  /** Program-specific requirements */
  programRequirements?: DegreePlanCourse[];
  
  /** Capstone/final project requirements */
  capstone?: DegreePlanCourse[];
  
  /** Additional metadata */
  metadata?: {
    /** Catalog year this plan is from */
    catalogYear?: string;
    
    /** Page number where degree plan was found */
    pageNumber?: number;
    
    /** Raw text section from PDF */
    rawText?: string;
    
    /** Last updated timestamp */
    lastParsed?: string;
  };
}

// ===============================
// Catalog Format Version Types
// ===============================

export interface CatalogFormatVersion {
  /** Major version number (e.g., 1, 2, 3) */
  major: number;
  
  /** Minor version number (e.g., 0, 1, 2) */
  minor: number;
  
  /** Patch version number (e.g., 0, 1, 2) */
  patch: number;
  
  /** Human-readable format identifier */
  identifier: string;
  
  /** Known characteristics of this format version */
  characteristics: {
    /** Course code patterns used */
    courseCodePatterns: string[];
    
    /** How CCNs are presented */
    ccnFormat: string;
    
    /** How degree plans are structured */
    degreeTableFormat: string;
    
    /** Text encoding/format peculiarities */
    textFormatNotes: string[];
  };
  
  /** Date range this format was used */
  dateRange: {
    /** First known catalog using this format */
    firstSeen?: string;
    
    /** Last known catalog using this format */
    lastSeen?: string;
  };
}

// ===============================
// Catalog Structure Types
// ===============================

export interface CatalogData {
  /** All courses found in catalog */
  courses: Record<string, Course>;
  
  /** All degree plans found in catalog */
  degreePlans: Record<string, DegreePlan>;
  
    /** Catalog metadata and processing information */
  metadata: {
    /** Catalog effective date/period */
    catalogDate: string;
    
    /** Academic year this catalog covers */
    academicYear: string;
    
    /** Source PDF filename */
    sourceFile: string;
    
    /** When this catalog was parsed */
    parsedAt: string;
    
    /** Parser version used */
    parserVersion: string;
    
    /** Total pages processed */
    totalPages: number;
    
    /** Catalog format version detected */
    formatVersion: CatalogFormatVersion;
    
    /** Source information */
    source: {
      /** URL where catalog was obtained */
      sourceUrl?: string;
      
      /** File size in bytes */
      fileSizeBytes?: number;
      
      /** PDF creation date if available */
      pdfCreationDate?: string;
      
      /** PDF modification date if available */
      pdfModificationDate?: string;
    };
    
    /** Parsing process details */
    parsing: {
      /** Patterns and formats detected */
      detectedPatterns: {
        /** Course code patterns found */
        courseCodeFormats: string[];
        
        /** CCN patterns found */
        ccnFormats: string[];
        
        /** Degree plan table formats */
        degreeTableFormats: string[];
      };
      
      /** Parser performance metrics */
      performance: {
        /** Total processing time in milliseconds */
        processingTimeMs: number;
        
        /** Time spent per major step */
        stepTimings: {
          ccnExtraction: number;
          courseDescriptions: number;
          courseListings: number;
          degreePlans: number;
        };
        
        /** Memory usage if available */
        memoryUsageMB?: number;
      };
      
      /** Compatibility and warnings */
      compatibility: {
        /** Whether this catalog format is fully supported */
        fullySupported: boolean;
        
        /** Known format differences from current version */
        formatDifferences: string[];
        
        /** Suggestions for format-specific improvements */
        recommendations: string[];
      };
    };
    
    /** Any parsing errors or warnings */
    parseErrors?: string[];
    
    /** Statistics about parsing */
    statistics: {
      coursesFound: number;
      degreePlansFound: number;
      duplicatesRemoved: number;
      ccnCoverage: number; // percentage
      competencyUnitsCoverage: number; // percentage
    };
  };
}

// ===============================
// Parser Configuration Types
// ===============================

export interface CatalogParserConfig {
  /** PDF file path to parse */
  pdfPath: string;
  
  /** Output directory for processed data */
  outputDir: string;
  
  /** Parsing options */
  options: {
    /** Whether to extract course descriptions */
    extractDescriptions: boolean;
    
    /** Whether to parse degree plans */
    parseDegreePlans: boolean;
    
    /** Whether to include raw text in output */
    includeRawText: boolean;
    
    /** Maximum pages to process (0 = all) */
    maxPages: number;
    
    /** Whether to validate parsed data */
    validateData: boolean;
  };
  
  /** Regex patterns for parsing */
  patterns: {
    /** Pattern to match course codes */
    courseCode: RegExp;
    
    /** Pattern to match CCN numbers */
    ccn: RegExp;
    
    /** Pattern to match competency units */
    competencyUnits: RegExp;
    
    /** Pattern to match degree plan sections */
    degreePlan: RegExp;
  };
}

// ===============================
// Parser Result Types
// ===============================

export interface ParseResult {
  /** Whether parsing was successful */
  success: boolean;
  
  /** Parsed catalog data */
  data?: CatalogData;
  
  /** Any errors encountered */
  errors?: string[];
  
  /** Warnings about data quality */
  warnings?: string[];
  
  /** Processing statistics */
  stats: {
    /** Time taken to parse */
    processingTime: number;
    
    /** Pages processed */
    pagesProcessed: number;
    
    /** Items extracted */
    itemsExtracted: {
      courses: number;
      degreePlans: number;
    };
  };
}

// ===============================
// Export Types
// ===============================

// All types are already exported above with their declarations
