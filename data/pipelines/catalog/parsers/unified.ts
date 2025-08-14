#!/usr/bin/env node

/**
 * Unified WGU Catalog Parser - Production Version
 * 
 * Automatically detects catalog version and applies appropriate parsing strategy
 * Works with our actual file structure in /data/catalogs/
 * Enhanced with production logging, configuration, and error handling
 */

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './lib/config.js';

// Dynamic course type detection - no hardcoded lists needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Simple console logger
const logger = {
  info: (msg: string) => console.log(`[CatalogParser] ${msg}`),
  error: (msg: string) => console.error(`[CatalogParser] ERROR: ${msg}`),
  warn: (msg: string) => console.warn(`[CatalogParser] WARN: ${msg}`)
};

interface ValidationIssue {
  type: 'missing_course' | 'duplicate_course' | 'invalid_format' | 'missing_data';
  severity: 'error' | 'warning';
  location: string;
  message: string;
  details?: any;
}

interface ParsingReport {
  filename: string;
  parsedAt: string;
  parserVersion: string;
  summary: {
    totalCourses: number;
    totalDegreePlans: number;
    totalProgramOutcomes: number;
    ccnCoverage: number;
    cuCoverage: number;
    validationIssues: number;
    parsingDuration: number;
  };
  validation: {
    degreePlanCourseValidation: {
      totalCoursesInPlans: number;
      uniqueCoursesInPlans: number;
      coursesFoundInCatalog: number;
      missingCourses: string[];
      validationRate: number;
    };
    dataCompleteness: {
      coursesWithAllFields: number;
      coursesWithDescription: number;
      coursesWithCCN: number;
      coursesWithCUs: number;
      degreePlansWithTotalCUs: number;
    };
    issues: ValidationIssue[];
  };
  statistics: any; // Full statistics from metadata
  processingDetails: {
    pdfInfo: any;
    formatDetected: string;
    patternsUsed: string[];
    enhancedFeaturesUsed: string[];
  };
}

interface ParsedCatalog {
  courses: Record<string, Course>;
  degreePlans: Record<string, DegreePlan>;
  standaloneCourses?: Record<string, StandaloneCourse>;
  certificatePrograms?: Record<string, CertificateProgram>;
  programOutcomes?: Record<string, ProgramOutcome>;
  courseBundles?: CourseBundleInfo[];
  metadata: {
    catalogDate: string;
    parserVersion: string;
    parsedAt: string;
    totalPages: number;
    parsingTimeMs: number;
    pdf?: {
      title?: string;
      version?: string;
      pages: number;
    };
    statistics: {
      coursesFound: number;
      degreePlansFound: number;
      standaloneCourses: number;
      certificatePrograms: number;
      programOutcomes: number;
      ccnCoverage: number;
      cuCoverage: number;
      // Enhanced statistics
      coursesByPrefix?: Record<string, number>;
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
        problematicCourseCodeCount?: number;
      };
    };
  };
}

type CourseType = 'degree-plan' | 'independent-study' | 'flexible-learning';

interface Course {
  courseCode: string;
  courseName: string;
  ccn?: string;
  competencyUnits?: number;
  description?: string;
  prerequisites?: string[];
  pageNumber?: number;
  courseType?: CourseType;
}

interface DegreePlan {
  name: string;
  title?: string; // For JSON output compatibility
  code?: string;
  totalCUs?: number;
  courses: string[];
  description?: string;
  /** Program code (e.g., BSHR, BSBA, MSITM) */
  programCode?: string;
  /** Effective date when this degree plan version went live (YYYYMM format) */
  effectiveDate?: string;
  /** Version identifier for tracking changes over time */
  version?: string;
  /** School categorization */
  school?: 'Business' | 'Health' | 'Technology' | 'Education';
  /** Program outcomes/learning goals */
  programOutcomes?: string[];
}

// New interfaces for enhanced parsing capabilities

interface StandaloneCourse {
  courseCode: string;
  courseName: string;
  ccn?: string;
  competencyUnits?: number;
  description?: string;
  priceRange: { min: number; max: number };
  accessDuration: string; // "2-3 months"
  stackableTowards?: string[]; // Relevant degree programs
}

interface CertificateProgram {
  name: string;
  price: number;
  totalCUs: number;
  courses: string[];
  description: string;
  duration: string; // "3-18 months"
  prerequisites?: string[];
  technologyStack?: string[];
}

interface CourseBundleInfo {
  priceRange: { min: number; max: number };
  duration: string;
  accessType: string;
}

interface ProgramOutcome {
  school: 'Business' | 'Health' | 'Technology' | 'Education';
  program: string;
  outcomes: {
    outcome: string;
    category?: 'technical' | 'professional' | 'analytical';
  }[];
}

class CatalogParserUnified {
  private filename: string;
  private fullText: string = '';
  private totalPages: number = 0;
  private startTime: number = 0;
  private outputPath: string = '';
  private pdfInfo?: {
    title?: string;
    version?: string;
    pages: number;
  };

  constructor(filename: string) {
    this.filename = filename;
  }

  /**
   * Detect catalog format based on filename and content patterns
   */
  private detectCatalogFormat(): { version: string; era: string; strategy: string } {
    const filename = this.filename.toLowerCase();
    
    // Extract year from filename
    const yearMatch = filename.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    if (year <= 2020) {
      return {
        version: 'v1.0-legacy',
        era: `${year} (Legacy)`,
        strategy: 'legacy-embedded-ccn'
      };
    } else if (year <= 2023) {
      return {
        version: 'v2.0-modern',
        era: `${year} (Modern)`,
        strategy: 'structured-tables'
      };
    } else {
      return {
        version: 'v2.1-current',
        era: `${year} (Current)`,
        strategy: 'enhanced-structured'
      };
    }
  }

  /**
   * Parse PDF and extract text content
   */
  private async loadPDF(filePath: string): Promise<void> {
    console.log(`📖 Loading PDF: ${this.filename}`);
    this.startTime = Date.now();
    
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      this.fullText = data.text;
      this.totalPages = data.numpages;
      
      console.log(`✅ Loaded ${this.totalPages} pages, ${this.fullText.length} characters`);

      // Extract PDF metadata for "More Info" style fields
      try {
        // Version from header e.g., %PDF-1.7
        const header = dataBuffer.subarray(0, 32).toString('utf8');
        const versionMatch = header.match(/%PDF-([0-9]\.[0-9]+)/);
        const version = versionMatch ? versionMatch[1] : (data as any).version;

        // Title from info or XMP metadata
        let title: string | undefined = (data as any).info?.Title;
        if (!title && (data as any).metadata && typeof (data as any).metadata.get === 'function') {
          const dcTitle = (data as any).metadata.get('dc:title');
          if (typeof dcTitle === 'string') title = dcTitle;
          else if (dcTitle && typeof dcTitle === 'object' && Array.isArray(dcTitle.items) && dcTitle.items.length > 0) {
            title = dcTitle.items[0];
          }
        }

        const textChunk = dataBuffer.toString('latin1');

        this.pdfInfo = {
          title,
          version,
          pages: this.totalPages
        };
      } catch (metaErr) {
        // Non-fatal – continue without pdfInfo
        this.pdfInfo = {
          pages: this.totalPages
        };
      }
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error}`);
    }
  }

  /**
   * Enhanced legacy parser for 2017-2020 catalogs
   * Enhanced to handle multiple legacy format variations
   */
  private parseCoursesLegacy(): Course[] {
    console.log(`🔍 Parsing courses using legacy format...`);
    
    // Extract CCN and CU mappings first
    const { ccnMap, cuMap } = this.extractCCNAndCUMappings();
    
    // Extract detailed descriptions
    const detailedDescriptions = this.extractDetailedDescriptions();
    
    const courses: Course[] = [];
    const foundCodes = new Set<string>();
    
    // Pattern 1: Full format "C123 - SUBJ 1234 - Course Name - Description"
    const pattern1 = /\b([A-Z]\d{3}[A-Z]?)\s*-\s*([A-Z]{2,4}\s+\d{3,4})\s*-\s*([^-\n\r]+?)\s*-\s*([^\n\r]+)/g;
    const matches1 = [...this.fullText.matchAll(pattern1)];
    console.log(`Pattern 1 (C100 - SUBJ 1234 - Name - Desc): ${matches1.length} matches`);
    
    for (const match of matches1) {
      const courseCode = match[1].trim();
      const ccn = match[2].trim();
      const courseName = match[3].trim();
      const description = match[4].trim();
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        // Detect course type dynamically
        const courseType = this.detectCourseType(courseCode, courseName, ccn, finalDescription);
        
        courses.push({
          courseCode,
          courseName,
          ccn,
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription,
          courseType
        });
      }
    }
    
    // Pattern 2: No CCN format "C123 - Course Name - Description"
    const pattern2 = /\b([A-Z]\d{3}[A-Z]?)\s*-\s*([^-\n\r\d][^-\n\r]{15,80}?)\s*-\s*([^\n\r]{30,})/g;
    const matches2 = [...this.fullText.matchAll(pattern2)];
    console.log(`Pattern 2 (C100 - Name - Desc): ${matches2.length} matches`);
    
    for (const match of matches2) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const description = match[3].trim();
      
      // Note: No longer filtering 'A' courses - let dynamic detection handle classification
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        // Detect course type dynamically
        const courseType = this.detectCourseType(courseCode, courseName, ccnMap.get(courseCode), finalDescription);
        
        courses.push({
          courseCode,
          courseName,
          ccn: ccnMap.get(courseCode),
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription,
          courseType
        });
      }
    }
    
    // Pattern 3: Table format "C123\s+Course Name\s+Description" (newline or tab separated)
    const pattern3 = /\b([A-Z]\d{3}[A-Z]?)\s*\n\s*([^C\d\n\r][^\n\r]{15,80})\s*\n\s*([^C\d\n\r][^\n\r]{30,})/g;
    const matches3 = [...this.fullText.matchAll(pattern3)];
    console.log(`Pattern 3 (Table format): ${matches3.length} matches`);
    
    for (const match of matches3) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const description = match[3].trim();
      
      // Note: No longer filtering 'A' courses - let dynamic detection handle classification
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        // Detect course type dynamically
        const courseType = this.detectCourseType(courseCode, courseName, ccnMap.get(courseCode), finalDescription);
        
        courses.push({
          courseCode,
          courseName,
          ccn: ccnMap.get(courseCode),
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription,
          courseType
        });
      }
    }
    
    // Pattern 4: Simple format "C123 Course Name" followed by paragraph
    const pattern4 = /\b([A-Z]\d{3}[A-Z]?)\s+([^C\d\n\r][^\n\r]{15,80}?)(?:\s*\n\s*)([^C\d\n\r][^\n\r]{50,}?(?=\n\s*[A-Z]\d{3}|\n\s*$|$))/g;
    const matches4 = [...this.fullText.matchAll(pattern4)];
    console.log(`Pattern 4 (Simple format): ${matches4.length} matches`);
    
    for (const match of matches4) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const description = match[3].trim();
      
      // Note: No longer filtering 'A' courses - let dynamic detection handle classification
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        // Detect course type dynamically
        const courseType = this.detectCourseType(courseCode, courseName, ccnMap.get(courseCode), finalDescription);
        
        courses.push({
          courseCode,
          courseName,
          ccn: ccnMap.get(courseCode),
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription,
          courseType
        });
      }
    }
    
    // Pattern 5: CCN embedded in course name "C123 Course Name SUBJ 1234"
    const pattern5 = /\b([A-Z]\d{3}[A-Z]?)\s+([^C\d\n\r][^\n\r]*?)\s+([A-Z]{2,4}\s+\d{3,4})(?:\s*-\s*|\s*\n\s*)([^\n\r]{30,})/g;
    const matches5 = [...this.fullText.matchAll(pattern5)];
    console.log(`Pattern 5 (CCN embedded): ${matches5.length} matches`);
    
    for (const match of matches5) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const ccn = match[3].trim();
      const description = match[4].trim();
      
      // Note: No longer filtering 'A' courses - let dynamic detection handle classification
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        courses.push({
          courseCode,
          courseName,
          ccn,
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription
        });
      }
    }
    
    console.log(`✅ Found ${courses.length} courses using enhanced legacy parser`);
    return courses;
  }

  /**
   * Extract CCN and CU mappings from the catalog - Enhanced for 100% coverage
   */
  private extractCCNAndCUMappings(): { ccnMap: Map<string, string>, cuMap: Map<string, number> } {
    const ccnMap = new Map<string, string>();
    const cuMap = new Map<string, number>();
    
    // Pattern 1: CCN followed by course code (MGMT 3000C715)
    const ccnPattern = /([A-Z]{2,6}\s+\d{3,4}[A-Z]?)([A-Z]\d{3,4}[A-Z]?)(?=[A-Z][a-z]|\d)/g;
    const ccnMatches = [...this.fullText.matchAll(ccnPattern)];
    
    for (const match of ccnMatches) {
      const ccn = match[1].trim();
      const courseCode = match[2].trim();
      ccnMap.set(courseCode, ccn);
    }
    
    // Pattern 2: Course code followed by CCN in parentheses or nearby
    // Example: "C234 - Workforce Planning: Recruitment and Selection (HRM 3200)"
    const ccnParenPattern = /([A-Z]\d{3,4}[A-Z]?)[^\n]*?\(?([A-Z]{2,6}\s+\d{3,4}[A-Z]?)\)?/g;
    const ccnParenMatches = [...this.fullText.matchAll(ccnParenPattern)];
    
    for (const match of ccnParenMatches) {
      const courseCode = match[1].trim();
      const ccn = match[2].trim();
      if (!ccnMap.has(courseCode)) {
        ccnMap.set(courseCode, ccn);
      }
    }
    
    // Pattern 3: Look for CCN near course codes in course descriptions
    const courseCodePattern = /([A-Z]\d{3,4}[A-Z]?)/g;
    const allCourseCodes = [...this.fullText.matchAll(courseCodePattern)].map(m => m[1]);
    
    for (const courseCode of new Set(allCourseCodes)) {
      if (ccnMap.has(courseCode)) continue;
      
      // Find all instances of this course code
      const courseRegex = new RegExp(`\\b${courseCode}\\b`, 'g');
      const instances = [...this.fullText.matchAll(courseRegex)];
      
      for (const instance of instances) {
        // Look for CCN in surrounding context (500 chars)
        const contextStart = Math.max(0, instance.index - 250);
        const contextEnd = Math.min(this.fullText.length, instance.index + 250);
        const context = this.fullText.slice(contextStart, contextEnd);
        
        const ccnInContext = context.match(/([A-Z]{2,6}\s+\d{3,4}[A-Z]?)/);
        if (ccnInContext && ccnInContext[1] !== courseCode) {
          ccnMap.set(courseCode, ccnInContext[1].trim());
          break;
        }
      }
    }
    
    // Enhanced CU extraction patterns
    
    // Pattern A: Course table format using known course codes
    // Format: CCN CourseCode Description CUs Term
    // Example: "MGMT 3000C715Organizational Behavior31" -> CUs=3, Term=1
    for (const courseCode of ccnMap.keys()) {
      if (cuMap.has(courseCode)) continue;
      
      // Look for pattern like "C715Organizational Behavior31" where last digit is term, second-to-last is CUs
      const regex = new RegExp(`${courseCode}[A-Za-z\\s&,.\-:()'/]+?(\\d{1,2})(\\d{1})(?=\\s*$|\\s*\\n|[A-Z]{2,6}\\s+\\d{3,4})`, 'g');
      const matches = [...this.fullText.matchAll(regex)];
      
      for (const match of matches) {
        const competencyUnits = parseInt(match[1]);
        const term = parseInt(match[2]);
        
        // Validate: CUs should be 1-12, Term should be 1-4
        if (competencyUnits > 0 && competencyUnits <= 12 && term >= 1 && term <= 4) {
          cuMap.set(courseCode, competencyUnits);
          break;
        }
      }
    }
    
    // Pattern B: Explicit CU statements in descriptions
    const cuPattern = /([A-Z]\d{3,4}[A-Z]?)[^0-9]*?(\d+)\s*(?:competency\s*units?|CUs?|credit)/gi;
    const cuMatches = [...this.fullText.matchAll(cuPattern)];
    
    for (const match of cuMatches) {
      const courseCode = match[1].trim();
      const competencyUnits = parseInt(match[2]);
      
      if (competencyUnits > 0 && competencyUnits <= 12) {
        cuMap.set(courseCode, competencyUnits);
      }
    }
    
    // Pattern C: Course code followed by description ending with CU number
    // Example: "C234 - Workforce Planning: Recruitment and Selection 3"
    const endNumberPattern = /([A-Z]\d{3,4}[A-Z]?)\s*-\s*[^0-9\n]+?(\d{1,2})\s*$/gm;
    const endNumberMatches = [...this.fullText.matchAll(endNumberPattern)];
    
    for (const match of endNumberMatches) {
      const courseCode = match[1].trim();
      const competencyUnits = parseInt(match[2]);
      
      if (competencyUnits > 0 && competencyUnits <= 12 && !cuMap.has(courseCode)) {
        cuMap.set(courseCode, competencyUnits);
      }
    }
    
    // Pattern D: Context-based CU extraction for missing courses
    for (const courseCode of new Set(allCourseCodes)) {
      if (cuMap.has(courseCode)) continue;
      
      // Find course mentions and look for numbers in context
      const courseRegex = new RegExp(`\\b${courseCode}\\b`, 'g');
      const instances = [...this.fullText.matchAll(courseRegex)];
      
      for (const instance of instances) {
        const contextStart = Math.max(0, instance.index - 100);
        const contextEnd = Math.min(this.fullText.length, instance.index + 200);
        const context = this.fullText.slice(contextStart, contextEnd);
        
        // Look for standalone numbers that could be CUs
        const numberMatches = context.match(/(\d{1,2})(?:\s|$|\n)/g);
        if (numberMatches) {
          const numbers = numberMatches.map(n => parseInt(n.trim())).filter(n => n > 0 && n <= 12);
          if (numbers.length > 0) {
            // Take the most common CU value (3-6 are most common)
            const preferredCU = numbers.find(n => n >= 3 && n <= 6) || numbers[0];
            cuMap.set(courseCode, preferredCU);
            break;
          }
        }
      }
    }
    
    // Pattern E: HIGH CONFIDENCE ONLY CCN assignments for verified course types
    // REMOVED: All synthetic/guessed CCN assignments to prevent student confusion
    // Only assign CCNs when we have solid evidence from the PDF
    
    // Pattern F: HIGH CONFIDENCE ONLY CU assignments
    // Only assign CUs for specific courses where we have strong evidence
    for (const courseCode of new Set(allCourseCodes)) {
      if (cuMap.has(courseCode)) continue;
      
      // Only assign CUs for capstone courses we're absolutely certain about
      if (courseCode === 'C216' || courseCode === 'C218' || courseCode === 'C219' || courseCode === 'C498') {
        // These are definitely capstone courses based on their descriptions
        cuMap.set(courseCode, 4);
      }
      // REMOVED: All other default CU assignments to prevent guessing
      // Better to have missing data than wrong data that misleads students
    }
    
    console.log(`📊 Extracted ${ccnMap.size} CCN mappings and ${cuMap.size} CU mappings`);
    return { ccnMap, cuMap };
  }

  /**
   * Extract detailed course descriptions from the catalog
   * Pattern: "C141 - EDUC 5220 - Instructional Planning and Presentation in Elementary Education - Detailed description..."
   */
  private extractDetailedDescriptions(): Map<string, string> {
    const detailedDescriptions = new Map<string, string>();
    
    // Pattern for detailed descriptions: Course - CCN - Name - Description
    const detailedPattern = /([A-Z]\d{3,4}[A-Z]?)\s*-\s*([A-Z]{2,4}\s+\d{3,5}[A-Z]?)\s*-\s*([^-]+?)\s*-\s*([^C]\S.*?)(?=\s+[A-Z]\d{3,4}[A-Z]?\s*-|$)/gs;
    const matches = [...this.fullText.matchAll(detailedPattern)];
    
    console.log(`📖 Found ${matches.length} detailed course descriptions`);
    
    for (const match of matches) {
      const courseCode = match[1].trim();
      const ccn = match[2].trim();
      const courseName = match[3].trim();
      const description = match[4].trim();
      
      // Combine CCN, name and description for complete detailed description
      const fullDescription = `${ccn} - ${courseName} - ${description}`;
      detailedDescriptions.set(courseCode, fullDescription);
    }
    
    return detailedDescriptions;
  }

  /**
   * Parse courses using modern format (2021+)
   * Pattern: "C100 - Course Name - Description" and "D627Public Health Education and Promotion34"
   */
  private parseCoursesModern(): Course[] {
    console.log(`🔍 Parsing courses using modern format...`);
    
    // Extract CCN and CU mappings first
    const { ccnMap, cuMap } = this.extractCCNAndCUMappings();
    
    // Extract detailed descriptions
    const detailedDescriptions = this.extractDetailedDescriptions();
    
    const courses: Course[] = [];
    
    // Pattern 1: Standard format "C100 - Course Name - Description"
    const standardPattern = /\b([A-Z]\d{3,4}[A-Z]?)\s*-\s*([^-\n\r]+?)\s*-\s*([^\n\r]+)/g;
    const standardMatches = [...this.fullText.matchAll(standardPattern)];
    
    console.log(`Found ${standardMatches.length} standard modern course patterns`);
    
    for (const match of standardMatches) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const description = match[3].trim();
      
      // Get CCN and CU from mappings, fallback to description parsing
      const ccn = ccnMap.get(courseCode);
      let competencyUnits = cuMap.get(courseCode);
      
      if (!competencyUnits) {
        const cuMatch = description.match(/(\d+)\s*(?:credit|competency|cu)/i);
        competencyUnits = cuMatch ? parseInt(cuMatch[1]) : undefined;
      }
      
      // Use detailed description if available, otherwise use current description
      const finalDescription = detailedDescriptions.get(courseCode) || 
                              (description.length > 50 ? description : undefined);
      
      // Detect course type dynamically
      const courseType = this.detectCourseType(courseCode, courseName, ccn, finalDescription);
      
      courses.push({
        courseCode,
        courseName,
        description: finalDescription,
        ccn,
        competencyUnits,
        courseType
      });
    }
    
    // Pattern 2: Concatenated format "D627Public Health Education and Promotion34" (CUs=3, Term=4)
    // Handle both cases: "D627Public..." and "D627PPublic..." where P might be separate or attached
    const concatPattern = /\b([A-Z]\d{3,4}[A-Z]?)([A-Za-z\s&,.\-:()'/]+?)(\d{1,2})(\d{1})(?=\s|$|\n|[A-Z]{2,6}\s+\d{3,4})/g;
    const concatMatches = [...this.fullText.matchAll(concatPattern)];
    
    console.log(`Found ${concatMatches.length} concatenated modern course patterns`);
    
    for (const match of concatMatches) {
      const courseCode = match[1].trim();
      let courseName = match[2].trim();
      const competencyUnits = parseInt(match[3]);
      const term = parseInt(match[4]);
      
      // Fix common truncation issues
      if (courseName.startsWith('ublic Health')) {
        courseName = 'P' + courseName; // Fix "ublic Health" -> "Public Health"
      }
      if (courseName.startsWith('roject Management')) {
        courseName = 'P' + courseName; // Fix "roject Management" -> "Project Management"
      }
      if (courseName.startsWith('roblem Solving')) {
        courseName = 'P' + courseName; // Fix "roblem Solving" -> "Problem Solving"
      }
      
      // Validate: CUs should be 1-12, Term should be 1-4
      if (competencyUnits < 1 || competencyUnits > 12 || term < 1 || term > 4) continue;
      
      // Skip if we already have this course
      if (courses.find(c => c.courseCode === courseCode)) continue;
      
      // Skip if the course name is too short (likely false positive)
      if (courseName.length < 10) continue;
      
      // Note: No longer filtering 'A' courses - let dynamic detection handle classification
      
      // Get CCN from mappings
      const ccn = ccnMap.get(courseCode);
      
      // Use detailed description if available
      const finalDescription = detailedDescriptions.get(courseCode);
      
      // Detect course type dynamically
      const courseType = this.detectCourseType(courseCode, courseName, ccn, finalDescription);
      
      courses.push({
        courseCode,
        courseName,
        description: finalDescription,
        ccn,
        competencyUnits,
        courseType
      });
    }
    
    // Pattern 3: Bullet point format "•Course Name (C123A)" 
    const bulletPattern = /•([^(]+?)\s*\(([A-Z]\d{3,4}[A-Z]?)\)/g;
    const bulletMatches = [...this.fullText.matchAll(bulletPattern)];
    
    console.log(`Found ${bulletMatches.length} bullet point course patterns`);
    
    for (const match of bulletMatches) {
      const courseName = match[1].trim();
      const courseCode = match[2].trim();
      
      // Skip if we already have this course
      if (courses.find(c => c.courseCode === courseCode)) continue;
      
      // Get CCN and CU from mappings
      const ccn = ccnMap.get(courseCode);
      const competencyUnits = cuMap.get(courseCode);
      
      // Use detailed description if available
      const finalDescription = detailedDescriptions.get(courseCode);
      
      // Detect course type dynamically
      const courseType = this.detectCourseType(courseCode, courseName, ccn, finalDescription);
      
      courses.push({
        courseCode,
        courseName,
        description: finalDescription,
        ccn,
        competencyUnits,
        courseType
      });
    }
    
    console.log(`✅ Found ${courses.length} courses using modern parser`);
    return courses;
  }

  /**
   * Parse degree plans from catalog with enhanced pattern matching for legacy catalogs
   */
  private parseDegreePlans(): DegreePlan[] {
    console.log(`🔍 Parsing degree plans...`);
    
    const plans: DegreePlan[] = [];
    const foundNames = new Set<string>();
    
    // Enhanced pattern for structured degree plans like in the image
    this.parseStructuredDegreePlans(plans, foundNames);
    
    // Fallback to existing patterns for other formats
    this.parseGenericDegreePlans(plans, foundNames);
    
    console.log(`✅ Found ${plans.length} enhanced degree plans`);
    return plans;
  }

  /**
   * Parse structured degree plans with tables (like BSBAIT format)
   */
  private parseStructuredDegreePlans(plans: DegreePlan[], foundNames: Set<string>) {
    // Pattern 1: Look for specific "Bachelor of Science Business Administration" format like in the image
    const bsbaPattern = /(Bachelor of Science Business Administration,\s*[^,\n]+)\s*\n\s*((?:The[\s\S]*?)(?=\n\s*CCN|\n\s*Course|\n\s*Bachelor|Total|$))/gi;
    const bsbaMatches = [...this.fullText.matchAll(bsbaPattern)];
    
    console.log(`Found ${bsbaMatches.length} BSBA structured degree patterns`);
    
    for (const match of bsbaMatches) {
      const degreeName = match[1].trim();
      let description = match[2] ? match[2].trim() : '';
      
      // Enhanced description cleaning
      description = description
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .replace(/\s*Total\s*CUs?\s*:?\s*\d+.*$/i, '') // Remove total CUs from description
        .replace(/\s*CCN\s+Course.*$/i, '') // Remove table headers from description
        .trim();
      
      // Extract concentration-specific information from degree name
      const concentrationMatch = degreeName.match(/Bachelor of Science Business Administration,\s*(.+)/);
      if (concentrationMatch && description.startsWith('The Bachelor of Science in Business Administration')) {
        const concentration = concentrationMatch[1].trim();
        description = `${description} This program specializes in ${concentration}.`;
      }
      
      if (foundNames.has(degreeName)) continue;
      foundNames.add(degreeName);
      
      // Find the course table following this degree (expand search range)
      const contextStart = match.index!;
      const contextEnd = Math.min(this.fullText.length, contextStart + 10000); // Even larger range for multi-page plans
      const planContext = this.fullText.slice(contextStart, contextEnd);
      
      // Parse course table with metadata
      const { courses, totalCUs, programCode, effectiveDate } = this.parseCourseTable(planContext);
      
      // For structured degree plans, include if we have either courses OR totalCUs
      if (courses.length > 0 || totalCUs) {
        plans.push({
          name: degreeName,
          title: degreeName, // Add title field for JSON output
          description: description,
          courses: courses,
          totalCUs: totalCUs,
          programCode: programCode,
          effectiveDate: effectiveDate,
          version: effectiveDate // Use effective date as version identifier
        });
        
        console.log(`📚 Parsed BSBA plan: ${degreeName} (${courses.length} courses, ${totalCUs || 'unknown'} CUs)`);
      }
    }
    
    // Pattern 2: Enhanced general pattern for other degree types
    const generalPattern = /((?:Bachelor|Master|Associate) of (?:Science|Arts|Business|Applied Science|Engineering|Fine Arts)(?:\s+in\s+[\w\s,&-]+?)?(?:,\s*[\w\s,&-]+?)?)\s*\n\s*((?:The[\s\S]*?)(?=\n\s*CCN|\n\s*Course|\n\s*Bachelor|Total|$))/gi;
    const generalMatches = [...this.fullText.matchAll(generalPattern)];
    
    console.log(`Found ${generalMatches.length} general structured degree patterns`);
    
    for (const match of generalMatches) {
      const degreeName = match[1].trim();
      let description = match[2] ? match[2].trim() : '';
      
      // Skip if we already processed this degree
      if (foundNames.has(degreeName)) continue;
      
      // Validate degree name - must be a complete degree title
      if (degreeName.length < 20 || !degreeName.includes(' of ')) continue;
      
      foundNames.add(degreeName);
      
      // Enhanced description cleaning
      description = description
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .replace(/\s*Total\s*CUs?\s*:?\s*\d+.*$/i, '') // Remove total CUs from description
        .replace(/\s*CCN\s+Course.*$/i, '') // Remove table headers from description
        .trim();
      
      // Extract specialization information from degree name if present
      const specializationMatch = degreeName.match(/(Bachelor|Master|Associate) of (?:Science|Arts|Business|Applied Science|Engineering|Fine Arts)(?:\s+in\s+([\w\s,&-]+?))?(?:,\s*([\w\s,&-]+?))?/);
      if (specializationMatch) {
        const field = specializationMatch[2];
        const specialization = specializationMatch[3];
        
        if (specialization && description) {
          description = `${description} This program focuses on ${specialization.toLowerCase()}.`;
        } else if (field && description) {
          description = `${description} This program is designed for students pursuing careers in ${field.toLowerCase()}.`;
        }
      }
      
      // Find course table
      const contextStart = match.index!;
      const contextEnd = Math.min(this.fullText.length, contextStart + 10000);
      const planContext = this.fullText.slice(contextStart, contextEnd);
      
      const { courses, totalCUs, programCode, effectiveDate } = this.parseCourseTable(planContext);
      
      // For structured degree plans, include if we have either courses OR totalCUs
      if (courses.length > 0 || totalCUs) {
        plans.push({
          name: degreeName,
          title: degreeName,
          description: description,
          courses: courses,
          totalCUs: totalCUs,
          programCode: programCode,
          effectiveDate: effectiveDate,
          version: effectiveDate
        });
        
        console.log(`📚 Parsed general structured plan: ${degreeName} (${courses.length} courses, ${totalCUs || 'unknown'} CUs)`);
      }
    }
  }

  /**
   * Parse course table from degree plan context
   */
  private parseCourseTable(context: string): { courses: string[], totalCUs?: number, programCode?: string, effectiveDate?: string } {
    const courses: string[] = [];
    let totalCUs: number | undefined;
    
    // Look for various table header formats (updated to match actual PDF format)
    const tableHeaderPatterns = [
      /CCN\s+Course\s+Number\s+Course\s+Description\s+CUs\s+Term/i,
      /CCN\s+Course Number\s+Course Description\s+CUs\s+Term/i,
      /Course\s+Number\s+Course\s+Description\s+CUs\s+Term/i,
      /CCN\s+Course\s+Description\s+CUs\s+Term/i,
      // New patterns from actual PDF - concatenated format
      /CCNCourse\s*NumberCourse\s*DescriptionCUsTerm/i,
      /CCNCourseNumberCourseDescriptionCUsTerm/i,
      // Flexible patterns with possible spacing variations
      /CCN.*?Course.*?Number.*?Course.*?Description.*?CUs.*?Term/is,
      /Course.*?Number.*?Course.*?Description.*?CUs.*?Term/is
    ];
    
    const hasTableHeaders = tableHeaderPatterns.some(pattern => pattern.test(context));
    
    if (hasTableHeaders) {
      console.log(`📋 Found tabular course format with headers`);
      
      // Enhanced patterns based on actual PDF format analysis
      const courseRowPatterns = [
        // Pattern 1: Actual PDF format - CCN CourseCode Description CUs Term (concatenated)
        // Example: "MGMT 3000C715Organizational Behavior31" -> CCN="MGMT 3000", Course="C715", Desc="Organizational Behavior", CUs="3", Term="1"
        /([A-Z]{2,6}\s+\d{3,4})([A-Z]\d{3,4}[A-Z]?)([A-Za-z0-9\s:,.\-&'()\/]+?)(\d{1,2})(\d{1})(?=\s*$|\s*\n|[A-Z]{2,6}\s+\d{3,4})/gm,
        
        // Pattern 2: With some spacing variations
        // Example: "MGMT 3000 C715 Organizational Behavior 3 1" -> CUs="3", Term="1"
        /([A-Z]{2,6}\s+\d{3,4})\s+([A-Z]\d{3,4}[A-Z]?)\s+([A-Za-z0-9\s:,.\-&'()\/]+?)\s+(\d{1,2})\s+(\d{1})(?=\s*$|\s*\n)/gm,
        
        // Pattern 3: Biology screenshot format - grouped layout
        // Example: "BIO 3010 D877 General Biology II 3 1"
        /^([A-Z]{2,6}\s+\d{3,4})\s+([A-Z]\d{3,4}[A-Z]?)\s+([A-Za-z0-9\s:,.\-&'()\/]+?)\s+(\d{1,2})\s+(\d{1,2})\s*$/gm,
        
        // Pattern 4: More flexible with variable whitespace
        /([A-Z]{2,6}\s+\d{3,4})\s+([A-Z]\d{3,4}[A-Z]?)\s+([^\d\n]+?)\s+(\d{1,2})\s+(\d{1,2})(?=\s|$|\n)/g,
        
        // Pattern 5: Handle PDF text extraction quirks - tabs/spaces mixed
        /([A-Z]{2,6}\s+\d{3,4})[\s\t]+([A-Z]\d{3,4}[A-Z]?)[\s\t]+([^\t\n\d]+?)[\s\t]+(\d{1,2})[\s\t]+(\d{1,2})/g,
        
        // Pattern 6: Course code extraction from structured lines (fallback)
        /^[A-Z]{2,6}\s+\d{3,4}\s+([A-Z]\d{3,4}[A-Z]?)\s+/gm,
        
        // Pattern 7: Alternative layout - course code first
        /^([A-Z]\d{3,4}[A-Z]?)\s+([A-Z]{2,6}\s+\d{3,4})\s+([A-Za-z0-9\s:,.\-&'()\/]+?)\s+(\d{1,2})\s+(\d{1,2})\s*$/gm
      ];
      
      let bestPatternIndex = -1;
      let maxCourses = 0;
      
      // Try each pattern and use the one that finds the most valid courses
      for (let i = 0; i < courseRowPatterns.length; i++) {
        const pattern = courseRowPatterns[i];
        const tempCourses: string[] = [];
        const courseMatches = [...context.matchAll(pattern)];
        
        console.log(`Pattern ${i + 1}: Found ${courseMatches.length} potential course matches`);
        
        for (const match of courseMatches) {
          let courseCode: string;
          
          if (i === 5) { // Pattern 6 (course code only)
            courseCode = match[1].trim();
          } else if (i === 6) { // Pattern 7 (course code first)
            courseCode = match[1].trim();
          } else {
            courseCode = match[2].trim();
          }
          
          // FIX: Handle concatenated course codes (e.g., "C715O" should be "C715")
          // When PDF concatenates columns: "C715Organizational" becomes "C715O"
          const concatenatedMatch = courseCode.match(/^([A-Z]\d{3,4})([A-Z][a-z]?)/);
          if (concatenatedMatch) {
            // Extract just the course code part
            courseCode = concatenatedMatch[1];
            console.log(`  Fixed concatenated code: ${match[2]} → ${courseCode}`);
          }
          
          // Validate course code format (enhanced to support alternative formats)
          if (this.isValidCourseCode(courseCode) && !tempCourses.includes(courseCode)) {
            tempCourses.push(courseCode);
          }
        }
        
        console.log(`  -> Pattern ${i + 1} extracted ${tempCourses.length} valid courses`);
        
        // Use the pattern that finds the most courses
        if (tempCourses.length > maxCourses) {
          maxCourses = tempCourses.length;
          bestPatternIndex = i;
          courses.length = 0; // Clear previous results
          courses.push(...tempCourses);
        }
      }
      
      if (courses.length > 0) {
        console.log(`Successfully extracted ${courses.length} courses using pattern ${bestPatternIndex + 1}`);
      } else {
        // Enhanced fallback: Extract from table-like lines with better recognition
        console.log(`Fallback: Extracting from table-like lines`);
        const lines = context.split('\n');
        
        for (const line of lines) {
          // Skip header lines and empty lines
          if (/CCN|Course Number|Course Description|^\s*$|Total.*CUs/i.test(line)) continue;
          
          // Look for lines that contain both CCN and course code patterns
          const ccnMatch = line.match(/([A-Z]{2,6}\s+\d{3,4})/);
          const courseMatch = line.match(/\b([A-Z]\d{3,4}[A-Z]?)\b/);
          
          if (ccnMatch && courseMatch) {
            let courseCode = courseMatch[1];
            
            // FIX: Handle concatenated course codes
            const concatenatedMatch = courseCode.match(/^([A-Z]\d{3,4})([A-Z][a-z]?)/);
            if (concatenatedMatch) {
              courseCode = concatenatedMatch[1];
            }
            
            if (this.isValidCourseCode(courseCode) && !courses.includes(courseCode)) {
              courses.push(courseCode);
            }
          }
          // Also try lines that start with CCN pattern and contain course code
          else if (/^[A-Z]{2,6}\s+\d{3,4}/.test(line)) {
            const courseCodeMatch = line.match(/\b([A-Z]\d{3,4}[A-Z]?)\b/);
            if (courseCodeMatch && this.isValidCourseCode(courseCodeMatch[1]) && !courses.includes(courseCodeMatch[1])) {
              courses.push(courseCodeMatch[1]);
            }
          }
        }
        
        console.log(`Fallback extraction found ${courses.length} courses`);
      }
      
    } else {
      console.log(`No table headers found, using enhanced simple extraction`);
      
      // Enhanced simple extraction with better context awareness
      const lines = context.split('\n');
      let inTableLikeSection = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        
        // Detect if we're in a table-like section
        if (/^[A-Z]{2,6}\s+\d{3,4}/.test(line) || inTableLikeSection) {
          inTableLikeSection = true;
          
          // Look for course code patterns in current and next line
          const courseMatches = line.match(/\b([A-Z]\d{3,4}[A-Z]?)\b/g) || [];
          const nextCourseMatches = nextLine.match(/\b([A-Z]\d{3,4}[A-Z]?)\b/g) || [];
          
          [...courseMatches, ...nextCourseMatches].forEach(courseCode => {
            if (/^[A-Z]\d{3,4}[A-Z]?$/.test(courseCode) && !courses.includes(courseCode)) {
              courses.push(courseCode);
            }
          });
          
          // Stop if we hit a clear end of table
          if (/Total.*CUs|^\s*$|^[A-Z][a-z].*[a-z]$/.test(line) && !line.match(/^[A-Z]{2,6}\s+\d{3,4}/)) {
            inTableLikeSection = false;
          }
        }
      }
      
      // Fallback to original simple extraction if nothing found
      if (courses.length === 0) {
        const courseMatches = [...context.matchAll(/\b([A-Z]{1,4}\d{3,4}[A-Z]*)\b/g)];
        const uniqueCourses = [...new Set(courseMatches.map(m => m[1]))]
          .filter(code => /^[A-Z]\d{3,4}[A-Z]?$/.test(code)); // Validate format
        courses.push(...uniqueCourses);
      }
      
      console.log(`Enhanced simple extraction found ${courses.length} courses`);
    }
    
    // Look for total CUs with various formats
    const totalCUPatterns = [
      /TOTAL CUs?\s*:?\s*(\d{2,3})/i,
      /Total\s+CUs?\s*:?\s*(\d{2,3})/i,
      /(\d{2,3})\s+CUs?\s*total/i,
      /Total\s+Credit\s+Units?\s*:?\s*(\d{2,3})/i,
      /Total\s+Competency\s+Units?\s*:?\s*(\d{2,3})/i
    ];
    
    for (const pattern of totalCUPatterns) {
      const totalMatch = context.match(pattern);
      if (totalMatch) {
        totalCUs = parseInt(totalMatch[1]);
        console.log(`Found total CUs: ${totalCUs}`);
        break;
      }
    }
    
    // Parse degree plan metadata from footer (program code and effective date)
    let programCode: string | undefined;
    let effectiveDate: string | undefined;
    
    // Look for footer pattern like: "BSHR    202509    Total CUs:    117"
    // Pattern captures: program code, date (YYYYMM), and total CUs
    const footerMetadataPatterns = [
      // Standard footer format from screenshot
      /([A-Z]{2,8})\s+(\d{6})\s+Total\s+CUs?\s*:?\s*(\d{2,3})/i,
      // Alternative formats with varying spacing
      /([A-Z]{2,8})\s*(\d{6})\s*Total\s+CUs?\s*:?\s*(\d{2,3})/i,
      // With potential line breaks
      /([A-Z]{2,8})\s*\n?\s*(\d{6})\s*\n?\s*Total\s+CUs?\s*:?\s*(\d{2,3})/i,
      // Black box format (might be styled differently in PDF)
      /([A-Z]{2,8})\s+(\d{6})\s+(\d{2,3})/,
      // Certificate and flexible program code format (allows numbers)
      /([A-Z]{2,8}\d?)\s+(\d{6})\s+Total\s+CUs?\s*:?\s*(\d{2,3})/i,
      /([A-Z]{2,8}\d?)\s+(\d{6})\s+(\d{2,3})/,
    ];
    
    for (const pattern of footerMetadataPatterns) {
      const footerMatch = context.match(pattern);
      if (footerMatch) {
        programCode = footerMatch[1].trim();
        effectiveDate = footerMatch[2].trim();
        
        // If we didn't find totalCUs from the table patterns, use the footer value
        if (!totalCUs && footerMatch[3]) {
          totalCUs = parseInt(footerMatch[3]);
        }
        
        console.log(`📋 Found degree plan metadata: Program=${programCode}, EffectiveDate=${effectiveDate}, TotalCUs=${totalCUs}`);
        break;
      }
    }
    
    // Validate effective date format (should be YYYYMM)
    if (effectiveDate && !/^\d{6}$/.test(effectiveDate)) {
      console.warn(`⚠️  Invalid effective date format: ${effectiveDate} (expected YYYYMM)`);
      effectiveDate = undefined;
    }
    
    // Validate program code format (should be 2-8 capital letters, optionally ending with 1 digit)
    if (programCode && !/^[A-Z]{2,8}\d?$/.test(programCode)) {
      console.warn(`⚠️  Invalid program code format: ${programCode} (expected 2-8 capital letters with optional digit)`);
      programCode = undefined;
    }
    
    return { courses, totalCUs, programCode, effectiveDate };
  }

  /**
   * Parse generic degree plans (existing logic)
   */
  private parseGenericDegreePlans(plans: DegreePlan[], foundNames: Set<string>) {
    // Helper function to clean and validate program names
    const cleanProgramName = (name: string): string | null => {
      // Clean whitespace and newlines
      let cleaned = name.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
      
      // Remove specific trailing fragments we've seen
      cleaned = cleaned.replace(/\s+(capstone|is the culminating|program to design|that improves public health|candidates|program).*$/i, '');
      
      // Must start with a degree type
      if (!/^(Bachelor|Master|Associate|Certificate)/i.test(cleaned)) return null;
      
      // Must be reasonable length
      if (cleaned.length < 15 || cleaned.length > 120) return null;
      
      // Filter out obvious non-degree fragments
      if (/^(certificate and may also|Master of Arts in Teaching candidates)$/i.test(cleaned)) return null;
      
      return cleaned;
    };
    
    // Pattern 1: Complete program titles (most reliable)
    const completePattern = /((?:Bachelor|Master|Associate)\s+of\s+(?:Science|Arts|Engineering|Business|Applied Science|Fine Arts)(?:\s+in\s+[A-Za-z\s,&-]+?)?(?:\s+with\s+[A-Za-z\s,&-]+?)?(?:\s+\([^)]+\))?)/gi;
    const completeMatches = [...this.fullText.matchAll(completePattern)];
    console.log(`Found ${completeMatches.length} complete degree title patterns`);
    
    for (const match of completeMatches) {
      const cleanName = cleanProgramName(match[1]);
      if (!cleanName || foundNames.has(cleanName)) continue;
      
      foundNames.add(cleanName);
      
      // Try to find associated courses for this plan
      const planContext = this.fullText.slice(
        Math.max(0, match.index! - 1500),
        Math.min(this.fullText.length, match.index! + 3000)
      );
      
      // Look for description paragraph near the degree title
      const descriptionPattern = new RegExp(`${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([^\\n]*(?:\\n[^\\n]*){0,5}?)(?=\\n\\s*CCN|\\n\\s*Course|$)`, 'i');
      const descMatch = planContext.match(descriptionPattern);
      const description = descMatch ? descMatch[1].trim() : undefined;
      
      const { courses, totalCUs, programCode, effectiveDate } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) { // Require at least 3 courses for a valid program
        plans.push({
          name: cleanName,
          title: cleanName,
          description,
          courses,
          totalCUs,
          programCode,
          effectiveDate,
          version: effectiveDate
        });
      }
    }
    
    // Pattern 2: Table of contents style (program listings)
    const tocPattern = /((?:Bachelor|Master|Associate|Certificate)[^\n\r]{15,80}?)\.{3,}/gi;
    const tocMatches = [...this.fullText.matchAll(tocPattern)];
    console.log(`Found ${tocMatches.length} table-of-contents style patterns`);
    
    for (const match of tocMatches) {
      let name = match[1].trim();
      
      // Clean up common TOC artifacts
      name = name
        .replace(/\.{3,}.*$/, '') // Remove trailing dots
        .replace(/\s+\d+$/, '')   // Remove trailing page numbers
        .trim();
      
      const cleanName = cleanProgramName(name);
      if (!cleanName || foundNames.has(cleanName)) continue;
      
      foundNames.add(cleanName);
      
      // Find courses in surrounding context
      const planContext = this.fullText.slice(
        Math.max(0, match.index! - 1000),
        Math.min(this.fullText.length, match.index! + 2000)
      );
      
      const { courses, totalCUs, programCode, effectiveDate } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) {
        plans.push({
          name: cleanName,
          title: cleanName,
          courses,
          totalCUs,
          programCode,
          effectiveDate,
          version: effectiveDate
        });
      }
    }
    
    // Pattern 3: Header-style program names (lines that start with degree keywords)
    const headerPattern = /^((?:Bachelor|Master|Associate|Certificate)[^\n\r]{20,100})$/gmi;
    const headerMatches = [...this.fullText.matchAll(headerPattern)];
    console.log(`Found ${headerMatches.length} header-style patterns`);
    
    for (const match of headerMatches) {
      const cleanName = cleanProgramName(match[1]);
      if (!cleanName || foundNames.has(cleanName)) continue;
      
      foundNames.add(cleanName);
      
      const planContext = this.fullText.slice(
        Math.max(0, match.index! - 500),
        Math.min(this.fullText.length, match.index! + 2500)
      );
      
      const { courses, totalCUs, programCode, effectiveDate } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) {
        plans.push({
          name: cleanName,
          courses,
          totalCUs,
          programCode,
          effectiveDate,
          version: effectiveDate
        });
      }
    }
    
    // Pattern 4: Specific WGU program format variations
    const wguPattern = /((?:Bachelor|Master|Associate)\s+of\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+in\s+[A-Z][a-z\s,&-]+?)?(?:\s+-\s+[A-Z][a-z\s,&-]+?)?)/gi;
    const wguMatches = [...this.fullText.matchAll(wguPattern)];
    console.log(`Found ${wguMatches.length} WGU-specific patterns`);
    
    for (const match of wguMatches) {
      const cleanName = cleanProgramName(match[1]);
      if (!cleanName || foundNames.has(cleanName)) continue;
      
      foundNames.add(cleanName);
      
      const planContext = this.fullText.slice(
        Math.max(0, match.index! - 1000),
        Math.min(this.fullText.length, match.index! + 2000)
      );
      
      const { courses, totalCUs, programCode, effectiveDate } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) {
        plans.push({
          name: cleanName,
          title: cleanName,
          courses,
          totalCUs,
          programCode,
          effectiveDate,
          version: effectiveDate
        });
      }
    }
  }

  /**
   * Detect course type based on catalog context and patterns
   */
  private detectCourseType(courseCode: string, courseName: string, ccn?: string, description?: string): CourseType {
    // Pattern 1: Independent Study Courses (courses ending in 'A')
    if (courseCode.endsWith('A') && /^[A-Z]\d{3,4}A$/.test(courseCode)) {
      // Additional validation: Check if base course exists in catalog
      const baseCourse = courseCode.slice(0, -1);
      const baseCourseExists = this.fullText.includes(baseCourse + ' ') || this.fullText.includes(baseCourse + '\n');
      
      // Look for independent study indicators in context
      const courseRegex = new RegExp(`\\b${courseCode}\\b`, 'g');
      const instances = [...this.fullText.matchAll(courseRegex)];
      
      for (const instance of instances) {
        const contextStart = Math.max(0, instance.index! - 200);
        const contextEnd = Math.min(this.fullText.length, instance.index! + 200);
        const context = this.fullText.slice(contextStart, contextEnd).toLowerCase();
        
        // Look for independent study indicators
        const independentStudyIndicators = [
          'independent study',
          'standalone',
          'single course',
          'continuing education',
          'professional development',
          'non-degree',
          'certificate program'
        ];
        
        if (independentStudyIndicators.some(indicator => context.includes(indicator))) {
          return 'independent-study';
        }
      }
      
      // If it ends in A but we can't confirm it's independent study, check if base course exists
      if (baseCourseExists) {
        return 'independent-study';
      }
    }
    
    // Pattern 2: Flexible Learning Courses (non-standard course codes)
    const standardCodePattern = /^[A-Z]\d{3,4}[A-Z]?$/;
    if (!standardCodePattern.test(courseCode)) {
      // Check for various non-standard patterns
      const flexiblePatterns = [
        /^[A-Z]{3,4}\d+$/,        // ENG1, HIS101, MAT201
        /^[A-Z]{2,4}[A-Z]\d+$/,   // PACA101
        /^[A-Z]{3,6}$/,           // UTH
        /^[A-Z]+\d+[A-Z]+$/       // CTI1AT
      ];
      
      if (flexiblePatterns.some(pattern => pattern.test(courseCode))) {
        // Look for flexible learning indicators in context
        const courseRegex = new RegExp(`\\b${courseCode}\\b`, 'g');
        const instances = [...this.fullText.matchAll(courseRegex)];
        
        for (const instance of instances) {
          const contextStart = Math.max(0, instance.index! - 150);
          const contextEnd = Math.min(this.fullText.length, instance.index! + 150);
          const context = this.fullText.slice(contextStart, contextEnd).toLowerCase();
          
          const flexibleIndicators = [
            'flexible',
            'alternative',
            'competency-based',
            'prior learning',
            'assessment',
            'portfolio',
            'experience-based'
          ];
          
          if (flexibleIndicators.some(indicator => context.includes(indicator))) {
            return 'flexible-learning';
          }
        }
        
        return 'flexible-learning';
      }
    }
    
    // Pattern 3: Degree Plan Courses (default for standard course codes)
    // Look for degree plan context
    const courseRegex = new RegExp(`\\b${courseCode}\\b`, 'g');
    const instances = [...this.fullText.matchAll(courseRegex)];
    
    for (const instance of instances) {
      const contextStart = Math.max(0, instance.index! - 300);
      const contextEnd = Math.min(this.fullText.length, instance.index! + 300);
      const context = this.fullText.slice(contextStart, contextEnd).toLowerCase();
      
      // Look for degree plan indicators
      const degreePlanIndicators = [
        'bachelor',
        'master',
        'degree',
        'program requirements',
        'general education',
        'major requirements',
        'required courses',
        'capstone',
        'total cus'
      ];
      
      if (degreePlanIndicators.some(indicator => context.includes(indicator))) {
        return 'degree-plan';
      }
    }
    
    // Default: assume degree-plan for standard course codes
    return 'degree-plan';
  }

  /**
   * Parse standalone courses and certificates with pricing information
   */
  private parseStandaloneCourses(): { 
    courses: Record<string, StandaloneCourse>, 
    certificates: Record<string, CertificateProgram>,
    bundles: CourseBundleInfo[]
  } {
    console.log(`🔍 Parsing standalone courses and certificates...`);
    
    const courses: Record<string, StandaloneCourse> = {};
    const certificates: Record<string, CertificateProgram> = {};
    const bundles: CourseBundleInfo[] = [];
    
    // Find standalone courses section - starting from the course list before pricing
    const standaloneMatch = this.fullText.match(/•[^•]*?\([A-Z]+\d*[A-Z]*\)[^]*?Certificates[^]*?For more information on certificates/i);
    if (!standaloneMatch) {
      console.log('❌ Standalone courses section not found');
      return { courses, certificates, bundles };
    }
    
    const standaloneText = standaloneMatch[0];
    
    // Parse single course pricing
    const pricingMatch = standaloneText.match(/Single courses cost \$(\d+)\s*-\s*\$(\d+) for (\w+) to (\w+) months/i);
    if (pricingMatch) {
      const priceRange = { min: parseInt(pricingMatch[1]), max: parseInt(pricingMatch[2]) };
      const accessDuration = `${pricingMatch[3]}-${pricingMatch[4]} months`;
      
      console.log(`💰 Found pricing: $${priceRange.min}-${priceRange.max} for ${accessDuration}`);
      
      // Parse individual courses with enhanced course code pattern
      const coursePattern = /•\s*([^(]+?)\s*\(([A-Z]\d{3,4}[A-Z]?|[A-Z]{2,6}\d+[A-Z]*|[A-Z]{3,6})\)/g;
      const courseMatches = [...standaloneText.matchAll(coursePattern)];
      
      console.log(`Found ${courseMatches.length} standalone course listings`);
      
      for (const match of courseMatches) {
        const courseName = match[1].trim();
        const courseCode = match[2].trim();
        
        courses[courseCode] = {
          courseCode,
          courseName,
          priceRange,
          accessDuration,
          stackableTowards: [] // Can be enhanced later by cross-referencing with degree plans
        };
      }
    }
    
    // Parse course bundles
    const bundleMatch = standaloneText.match(/Course bundles cost \$(\d+)\s*-\s*\$(\d+) for (\w+) to (\w+) months/i);
    if (bundleMatch) {
      bundles.push({
        priceRange: { min: parseInt(bundleMatch[1]), max: parseInt(bundleMatch[2]) },
        duration: `${bundleMatch[3]}-${bundleMatch[4]} months`,
        accessType: 'bundle'
      });
    }
    
    // Parse certificate programs with pricing
    const certificateSection = standaloneText.match(/Certificates([\s\S]*?)(?=For more information|Course Descriptions|$)/i);
    if (certificateSection) {
      const certificateText = certificateSection[1];
      
      // Pattern: Certificate Name – $Price
      const certPattern = /•\s*([^–]+)–\s*\$(\d+(?:,\d+)?)/g;
      const certMatches = [...certificateText.matchAll(certPattern)];
      
      console.log(`Found ${certMatches.length} certificate programs with pricing`);
      
      for (const match of certMatches) {
        const name = match[1].trim();
        const price = parseInt(match[2].replace(',', ''));
        
        certificates[name] = {
          name,
          price,
          totalCUs: 0, // Will be enhanced later
          courses: [],
          description: '',
          duration: '3-18 months' // Default based on analysis
        };
      }
      
      // Parse certificate duration information
      const durationMatch = certificateText.match(/Certificates are (\d+) to (\d+) months in length and consist of between (\d+) and (\d+) competency units/);
      if (durationMatch) {
        const minMonths = parseInt(durationMatch[1]);
        const maxMonths = parseInt(durationMatch[2]);
        const minCUs = parseInt(durationMatch[3]);
        const maxCUs = parseInt(durationMatch[4]);
        
        // Update all certificates with duration info
        Object.values(certificates).forEach(cert => {
          cert.duration = `${minMonths}-${maxMonths} months`;
          if (!cert.totalCUs) cert.totalCUs = minCUs; // Default to minimum if not found elsewhere
        });
        
        console.log(`📊 Certificates: ${minMonths}-${maxMonths} months, ${minCUs}-${maxCUs} CUs`);
      }
    }
    
    console.log(`✅ Parsed ${Object.keys(courses).length} standalone courses, ${Object.keys(certificates).length} certificates, ${bundles.length} bundle options`);
    
    return { courses, certificates, bundles };
  }

  /**
   * Parse program outcomes from catalog
   */
  private parseProgramOutcomes(): Record<string, ProgramOutcome> {
    console.log(`🔍 Parsing program outcomes...`);
    
    const outcomes: Record<string, ProgramOutcome> = {};
    
    // Find Program Outcomes section - from "Program Outcomes" header to Course Descriptions
    const outcomesMatch = this.fullText.match(/Program Outcomes\s*School of Business[^]*?(?=Course Descriptions|$)/i);
    if (!outcomesMatch) {
      console.log('❌ Program Outcomes section not found');
      return outcomes;
    }
    
    const outcomesText = outcomesMatch[0];
    
    // Parse by school sections
    const schools = ['School of Business', 'School of Technology', 'Leavitt School of Health', 'School of Education'];
    
    for (const schoolName of schools) {
      const school = schoolName.replace('School of ', '').replace('Leavitt School of Health', 'Health') as 'Business' | 'Health' | 'Technology' | 'Education';
      
      const schoolMatch = outcomesText.match(new RegExp(`${schoolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=School of|Leavitt School|$)`, 'i'));
      if (!schoolMatch) continue;
      
      const schoolText = schoolMatch[1];
      
      // Parse program sections within school
      const programPattern = /(B\.[AS]\.|M\.[AS]\.|MBA|M\.Ed\.|Post-Master's Certificate|Certificate:)\s*([^\n]+)/g;
      const programMatches = [...schoolText.matchAll(programPattern)];
      
      console.log(`Found ${programMatches.length} programs in ${schoolName}`);
      
      for (const programMatch of programMatches) {
        const programType = programMatch[1].trim();
        const programName = programMatch[2].trim();
        const fullProgramName = `${programType} ${programName}`;
        
        // Find outcomes for this program
        const programIndex = programMatch.index!;
        const nextProgramMatch = schoolText.slice(programIndex + 1).match(/(B\.[AS]\.|M\.[AS]\.|MBA|M\.Ed\.|Post-Master's Certificate|Certificate:)/);
        const programEndIndex = nextProgramMatch ? programIndex + 1 + nextProgramMatch.index! : schoolText.length;
        
        const programText = schoolText.slice(programIndex, programEndIndex);
        
        // Extract outcome statements
        const outcomePattern = /•\s*The graduate (explains|interprets|applies|describes|analyzes|completes|reports|demonstrates|discusses|creates|evaluates|defines|compares|recommends)[^.•]+\./g;
        const outcomeMatches = [...programText.matchAll(outcomePattern)];
        
        if (outcomeMatches.length > 0) {
          outcomes[fullProgramName] = {
            school,
            program: fullProgramName,
            outcomes: outcomeMatches.map(match => ({
              outcome: match[0].replace('•', '').trim(),
              category: this.categorizeOutcome(match[1])
            }))
          };
          
          console.log(`📚 ${fullProgramName}: ${outcomeMatches.length} outcomes`);
        }
      }
    }
    
    console.log(`✅ Parsed outcomes for ${Object.keys(outcomes).length} programs`);
    
    return outcomes;
  }

  /**
   * Categorize learning outcome by action verb
   */
  private categorizeOutcome(verb: string): 'technical' | 'professional' | 'analytical' {
    const technicalVerbs = ['applies', 'completes', 'demonstrates', 'creates'];
    const professionalVerbs = ['recommends', 'discusses', 'reports'];
    const analyticalVerbs = ['explains', 'interprets', 'analyzes', 'evaluates', 'compares', 'describes', 'defines'];
    
    if (technicalVerbs.includes(verb.toLowerCase())) return 'technical';
    if (professionalVerbs.includes(verb.toLowerCase())) return 'professional';
    return 'analytical';
  }

  /**
   * Enhanced course code validation supporting alternative formats
   */
  private isValidCourseCode(code: string): boolean {
    // Enhanced pattern for alternative course codes
    const patterns = [
      /^[A-Z]\d{3,4}[A-Z]?$/,        // Standard: C123, D456A
      /^[A-Z]{2,6}\d+[A-Z]*$/,       // Certificate: PACA101, DCDV
      /^[A-Z]{3,6}$/,                // Special: UTH, ENG1
      /^DC[A-Z]{2,4}$/               // Certificate specific: DCADA
    ];
    
    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Calculate enhanced parsing statistics
   */
  private calculateStats(
    courses: Course[], 
    degreePlans: DegreePlan[],
    standaloneCourses?: Record<string, StandaloneCourse>,
    certificates?: Record<string, CertificateProgram>,
    outcomes?: Record<string, ProgramOutcome>
  ) {
    const ccnCoverage = courses.filter(c => c.ccn).length / courses.length * 100;
    const cuCoverage = courses.filter(c => c.competencyUnits).length / courses.length * 100;
    
    // Course prefix distribution
    const coursesByPrefix: Record<string, number> = {};
    courses.forEach(course => {
      const prefix = course.courseCode.charAt(0);
      coursesByPrefix[prefix] = (coursesByPrefix[prefix] || 0) + 1;
    });
    
    // Degree plan statistics
    const allPlanCourses: string[] = [];
    const uniquePlanCourses = new Set<string>();
    let schoolDistribution: Record<string, number> = {};
    
    degreePlans.forEach(plan => {
      plan.courses?.forEach(code => {
        allPlanCourses.push(code);
        uniquePlanCourses.add(code);
      });
      
      if (plan.school) {
        schoolDistribution[plan.school] = (schoolDistribution[plan.school] || 0) + 1;
      }
    });
    
    const degreePlanStatistics = {
      totalCourses: allPlanCourses.length,
      uniqueCourses: uniquePlanCourses.size,
      averageCoursesPerPlan: Math.round(allPlanCourses.length / (degreePlans.length || 1)),
      plansWithTotalCUs: degreePlans.filter(p => p.totalCUs).length,
      schoolDistribution: Object.keys(schoolDistribution).length > 0 ? schoolDistribution : undefined
    };
    
    // Data quality metrics
    const dataQuality = {
      coursesWithDescription: courses.filter(c => c.description && c.description.length > 30).length,
      coursesWithCCN: courses.filter(c => c.ccn).length,
      coursesWithCUs: courses.filter(c => c.competencyUnits).length,
      completeCourseRecords: courses.filter(c => 
        c.courseCode && c.courseName && c.description && c.description.length > 30
      ).length,
      problematicCourseCodeCount: allPlanCourses.filter(code => 
        code.match(/^[A-Z]\d{3,4}[A-Z][a-z]/)
      ).length
    };
    
    return {
      coursesFound: courses.length,
      degreePlansFound: degreePlans.length,
      standaloneCourses: standaloneCourses ? Object.keys(standaloneCourses).length : 0,
      certificatePrograms: certificates ? Object.keys(certificates).length : 0,
      programOutcomes: outcomes ? Object.keys(outcomes).length : 0,
      ccnCoverage: Math.round(ccnCoverage),
      cuCoverage: Math.round(cuCoverage),
      coursesByPrefix,
      degreePlanStatistics,
      dataQuality
    };
  }

  /**
   * Validate degree plan courses against course catalog
   */
  private validateDegreePlanCourses(
    courses: Record<string, Course>, 
    degreePlans: Record<string, DegreePlan>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const missingCourses = new Set<string>();
    const allPlanCourses = new Set<string>();
    
    Object.entries(degreePlans).forEach(([planKey, plan]) => {
      plan.courses?.forEach(courseCode => {
        allPlanCourses.add(courseCode);
        
        if (!courses[courseCode]) {
          missingCourses.add(courseCode);
          
          if (!issues.some(i => i.details?.courseCode === courseCode)) {
            issues.push({
              type: 'missing_course',
              severity: 'error',
              location: `DegreePlan: ${plan.name}`,
              message: `Course ${courseCode} referenced in degree plan but not found in course catalog`,
              details: { courseCode, planName: plan.name, planKey }
            });
          }
        }
      });
      
      // Check for missing total CUs
      if (!plan.totalCUs) {
        issues.push({
          type: 'missing_data',
          severity: 'warning',
          location: `DegreePlan: ${plan.name}`,
          message: 'Degree plan missing total CUs',
          details: { planName: plan.name, planKey }
        });
      }
    });
    
    // Log validation summary
    const validationRate = ((allPlanCourses.size - missingCourses.size) / allPlanCourses.size * 100).toFixed(1);
    console.log(`\n🔍 Degree Plan Validation:`);
    console.log(`Total unique courses in plans: ${allPlanCourses.size}`);
    console.log(`Courses found in catalog: ${allPlanCourses.size - missingCourses.size}`);
    console.log(`Missing courses: ${missingCourses.size}`);
    console.log(`Validation rate: ${validationRate}%`);
    
    if (missingCourses.size > 0) {
      console.log(`\n⚠️  Missing courses: ${Array.from(missingCourses).slice(0, 10).join(', ')}${missingCourses.size > 10 ? '...' : ''}`);
    }
    
    return issues;
  }

  /**
   * Generate comprehensive parsing report
   */
  private generateParsingReport(
    catalog: ParsedCatalog,
    validationIssues: ValidationIssue[],
    filename: string,
    format: { era: string, version: string }
  ): ParsingReport {
    const courses = Object.values(catalog.courses);
    const degreePlans = Object.values(catalog.degreePlans);
    
    // Calculate degree plan validation stats
    const allPlanCourses = new Set<string>();
    const missingCourses = new Set<string>();
    
    degreePlans.forEach(plan => {
      plan.courses?.forEach(courseCode => {
        allPlanCourses.add(courseCode);
        if (!catalog.courses[courseCode]) {
          missingCourses.add(courseCode);
        }
      });
    });
    
    const report: ParsingReport = {
      filename: filename,
      parsedAt: catalog.metadata.parsedAt,
      parserVersion: catalog.metadata.parserVersion,
      summary: {
        totalCourses: catalog.metadata.statistics.coursesFound,
        totalDegreePlans: catalog.metadata.statistics.degreePlansFound,
        totalProgramOutcomes: catalog.metadata.statistics.programOutcomes || 0,
        ccnCoverage: catalog.metadata.statistics.ccnCoverage,
        cuCoverage: catalog.metadata.statistics.cuCoverage,
        validationIssues: validationIssues.length,
        parsingDuration: catalog.metadata.parsingTimeMs
      },
      validation: {
        degreePlanCourseValidation: {
          totalCoursesInPlans: allPlanCourses.size,
          uniqueCoursesInPlans: allPlanCourses.size,
          coursesFoundInCatalog: allPlanCourses.size - missingCourses.size,
          missingCourses: Array.from(missingCourses).sort(),
          validationRate: parseFloat(((allPlanCourses.size - missingCourses.size) / allPlanCourses.size * 100).toFixed(1))
        },
        dataCompleteness: {
          coursesWithAllFields: courses.filter(c => 
            c.courseCode && c.courseName && c.description && c.ccn && c.competencyUnits
          ).length,
          coursesWithDescription: catalog.metadata.statistics.dataQuality?.coursesWithDescription || 0,
          coursesWithCCN: catalog.metadata.statistics.dataQuality?.coursesWithCCN || 0,
          coursesWithCUs: catalog.metadata.statistics.dataQuality?.coursesWithCUs || 0,
          degreePlansWithTotalCUs: catalog.metadata.statistics.degreePlanStatistics?.plansWithTotalCUs || 0
        },
        issues: validationIssues
      },
      statistics: catalog.metadata.statistics,
      processingDetails: {
        pdfInfo: catalog.metadata.pdf,
        formatDetected: format.era,
        patternsUsed: [], // Could be enhanced to track which patterns were used
        enhancedFeaturesUsed: []
      }
    };
    
    // Track enhanced features used
    if (catalog.programOutcomes && Object.keys(catalog.programOutcomes).length > 0) {
      report.processingDetails.enhancedFeaturesUsed.push('program_outcomes');
    }
    if (catalog.standaloneCourses && Object.keys(catalog.standaloneCourses).length > 0) {
      report.processingDetails.enhancedFeaturesUsed.push('standalone_courses');
    }
    if (catalog.certificatePrograms && Object.keys(catalog.certificatePrograms).length > 0) {
      report.processingDetails.enhancedFeaturesUsed.push('certificate_programs');
    }
    
    return report;
  }

  /**
   * Main parsing method
   */
  async parseCatalog(filePath: string, outputPath?: string): Promise<ParsedCatalog> {
    await this.loadPDF(filePath);
    
    // Set output path if provided
    if (outputPath) {
      this.outputPath = outputPath;
    }
    
    const format = this.detectCatalogFormat();
    console.log(`🔧 Detected format: ${format.version} (${format.era})`);
    console.log(`📋 Strategy: ${format.strategy}`);
    
    let coursesArray: Course[];
    if (format.version.startsWith('v1.0')) {
      coursesArray = this.parseCoursesLegacy();
    } else {
      coursesArray = this.parseCoursesModern();
    }
    
    const degreePlansArray = this.parseDegreePlans();
    
    // Parse new data types
    const standaloneData = this.parseStandaloneCourses();
    const programOutcomesData = this.parseProgramOutcomes();
    
    const stats = this.calculateStats(
      coursesArray, 
      degreePlansArray, 
      standaloneData.courses,
      standaloneData.certificates,
      programOutcomesData
    );
    const parsingTimeMs = Date.now() - this.startTime;
    
    // Convert arrays to objects with keys
    const courses: Record<string, Course> = {};
    coursesArray.forEach(course => {
      courses[course.courseCode] = course;
    });
    
    const degreePlans: Record<string, DegreePlan> = {};
    degreePlansArray.forEach((plan, index) => {
      const key = plan.code || `plan_${index}`;
      degreePlans[key] = plan;
    });
    
    const parsedCatalog: ParsedCatalog = {
      courses,
      degreePlans,
      standaloneCourses: standaloneData.courses,
      certificatePrograms: standaloneData.certificates,
      programOutcomes: programOutcomesData,
      courseBundles: standaloneData.bundles,
      metadata: {
        catalogDate: format.era,
        parserVersion: `${format.version}-enhanced`,
        parsedAt: new Date().toISOString(),
        totalPages: this.totalPages,
        parsingTimeMs,
        pdf: this.pdfInfo,
        statistics: stats
      }
    };
    
    // Perform validation
    console.log('\n🔍 Performing post-parsing validation...');
    const validationIssues = this.validateDegreePlanCourses(courses, degreePlans);
    
    // Generate and save parsing report
    const report = this.generateParsingReport(parsedCatalog, validationIssues, this.filename, format);
    const reportPath = path.join(path.dirname(this.outputPath), `${path.basename(this.outputPath, '.json')}.report.json`);
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📊 Parsing report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`⚠️  Could not save parsing report: ${error}`);
    }
    
    return parsedCatalog;
  }
}

/**
 * Parse a single catalog file with enhanced production error handling
 */
export async function parseSingleCatalog(filename: string): Promise<boolean> {
  const appConfig = config.getConfig();
  let retryCount = 0;
  const maxRetries = appConfig.parsing.maxRetries;

  // Handle both absolute and relative paths
  // If relative, resolve from the current working directory to avoid duplicating repo subpaths
  let filePath: string;
  if (path.isAbsolute(filename)) {
    filePath = filename;
  } else {
    filePath = path.resolve(process.cwd(), filename);
  }

  while (retryCount <= maxRetries) {
    try {
  logger.info(`Parsing ${path.basename(filePath)}...`);
      
      // Validate file exists and is readable
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`File not accessible: ${filePath}`);
      }

      // Check file size constraints
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      if (fileSizeMB > appConfig.download.maxFileSizeMB) {
        throw new Error(`File too large: ${fileSizeMB.toFixed(1)}MB > ${appConfig.download.maxFileSizeMB}MB`);
      }

      const parser = new CatalogParserUnified(path.basename(filePath));
      
      // Set timeout for parsing operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Parsing timeout')), appConfig.parsing.timeoutMs);
      });

      // Generate output path in the organized structure
      const baseFilename = path.basename(filename, '.pdf');
  const outputPath = path.join(appConfig.paths.parsedDirectory, `${baseFilename}.json`);
      
      const parsePromise = parser.parseCatalog(filePath, outputPath);
      const result = await Promise.race([parsePromise, timeoutPromise]) as ParsedCatalog;
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Save with appropriate formatting
      const jsonContent = JSON.stringify(result, null, appConfig.parsing.outputIndentation);
      await fs.writeFile(outputPath, jsonContent);

      // Log success with statistics
  logger.info(`Parsed ${path.basename(filePath)} -> ${path.basename(outputPath)} (courses=${result.metadata.statistics.coursesFound}, plans=${result.metadata.statistics.degreePlansFound}, CCN=${result.metadata.statistics.ccnCoverage}%, CU=${result.metadata.statistics.cuCoverage}%)`);

      console.log(`\n📊 PARSING COMPLETE`);
      console.log(`=`.repeat(50));
      console.log(`📁 Input: ${path.basename(filename)}`);
      console.log(`💾 Output: ${path.basename(outputPath)}`);
      console.log(`🔧 Parser: ${result.metadata.parserVersion}`);
      console.log(`📅 Date: ${result.metadata.catalogDate}`);
      console.log(`📚 Courses: ${result.metadata.statistics.coursesFound}`);
      console.log(`🎓 Degree Plans: ${result.metadata.statistics.degreePlansFound}`);
      console.log(`📋 CCN Coverage: ${result.metadata.statistics.ccnCoverage}%`);
      console.log(`⭐ CU Coverage: ${result.metadata.statistics.cuCoverage}%`);
      console.log(`⏱️  Processing Time: ${result.metadata.parsingTimeMs}ms`);

      return true;

    } catch (error) {
      retryCount++;
      const isLastAttempt = retryCount > maxRetries;
      
      if (isLastAttempt) {
  logger.error(`Failed to parse ${path.basename(filePath)}: ${(error as Error).message}`);
        console.error(`❌ Error parsing ${filename}:`, error);
        return false;
      } else {
  logger.warn(`Parse attempt ${retryCount} failed for ${path.basename(filePath)}, retrying...`);
        
        // Wait before retry with exponential backoff
        const delay = appConfig.parsing.retryDelayMs * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return false;
}

/**
 * Parse all available catalogs with production monitoring
 */
export async function parseAllCatalogs(): Promise<void> {
  const appConfig = config.getConfig();
  
  try {
    logger.info('Starting batch processing of all catalogs');
    
    console.log(`🚀 Starting Unified Catalog Parser`);
    console.log(`=`.repeat(60));
    
    // Get catalog files from historical directory
    const catalogsPath = appConfig.paths.catalogsDirectory;
    const files = await fs.readdir(catalogsPath);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      logger.warn(`No PDF files found in ${catalogsPath}`);
      console.log(`📁 No PDF catalogs found in ${catalogsPath}`);
      return;
    }

  logger.info(`Found ${pdfFiles.length} PDF catalogs to process in ${catalogsPath}`);

    console.log(`📁 Found ${pdfFiles.length} PDF catalogs to parse`);

    // Process files in batches for memory management
    const batchSize = appConfig.parsing.batchSize;
    const totalBatches = Math.ceil(pdfFiles.length / batchSize);
    let totalSuccessful = 0;
    let totalFailed = 0;
    const sortedFiles = pdfFiles.sort();

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, sortedFiles.length);
      const batchFiles = sortedFiles.slice(batchStart, batchEnd);
      
  logger.info(`Processing batch ${batchIndex + 1}/${totalBatches} (${batchFiles.length} files)`);

      // Process batch sequentially to control memory usage
      let batchSuccessful = 0;
      let batchFailed = 0;

      for (const filename of batchFiles) {
        console.log(`\n${'='.repeat(60)}`);
        const fullPath = path.join(catalogsPath, filename);
        const success = await parseSingleCatalog(fullPath);
        
        if (success) {
          batchSuccessful++;
          totalSuccessful++;
        } else {
          batchFailed++;
          totalFailed++;
        }
      }

  logger.info(`Batch ${batchIndex + 1} completed: successful=${batchSuccessful}, failed=${batchFailed}`);

      // Memory cleanup between batches
      if (global.gc) {
        global.gc();
      }

      // Brief pause between batches to prevent resource exhaustion
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final summary
    const successRate = (totalSuccessful / pdfFiles.length) * 100;
  logger.info(`Batch processing completed: total=${pdfFiles.length}, successful=${totalSuccessful}, failed=${totalFailed}, successRate=${successRate.toFixed(1)}%`);

    console.log(`\n🎉 Completed parsing ${pdfFiles.length} catalogs!`);
    console.log(`✅ Successful: ${totalSuccessful}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);

    if (totalFailed > 0) {
      logger.warn(`${totalFailed} files failed to parse. Check logs for details.`);
    }

  } catch (error) {
  logger.error(`Critical error in batch processing: ${(error as Error).message}`);
    console.error(`❌ Error in batch parsing:`, error);
    throw error;
  }
}

// Enhanced CLI interface with production features
async function main() {
  const appConfig = config.getConfig();
  
  try {
    // Validate configuration
    const configValidation = config.validateConfig();
    if (!configValidation.isValid) {
  logger.error('Invalid configuration detected');
      console.error('❌ Configuration validation failed:');
      configValidation.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Log startup information
  logger.info(`Starting WGU Catalog Parser v2.0-production (env=${appConfig.environment}, node=${process.version}, mem=${appConfig.parsing.memoryLimitMB}MB)`);

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      await parseAllCatalogs();
    } else if (args[0] === '--help' || args[0] === '-h') {
      console.log(`
WGU Catalog Parser - Production Version

Usage:
  npx tsx catalog-parser-unified.ts                    # Parse all PDF catalogs
  npx tsx catalog-parser-unified.ts [filename.pdf]     # Parse specific catalog
  npx tsx catalog-parser-unified.ts --config          # Show current configuration
  npx tsx catalog-parser-unified.ts --health          # Run health check
  npx tsx catalog-parser-unified.ts --help             # Show this help

Examples:
  npx tsx catalog-parser-unified.ts
  npx tsx catalog-parser-unified.ts catalog-2025-08.pdf
  npx tsx catalog-parser-unified.ts --config

Features:
  • Automatic format detection (legacy vs. modern catalogs)
  • Enhanced error handling with configurable retries
  • Production logging with multiple levels
  • Configuration management with validation
  • Memory management and batch processing
  • Comprehensive statistics and monitoring
`);
    } else if (args[0] === '--config') {
      console.log('Current Configuration:');
      console.log(config.exportConfig());
    } else if (args[0] === '--health') {
      logger.info('Running health check...');
      
      // Check configuration
      const configHealth = config.validateConfig();
      
      // Check directory access
      const catalogsDir = appConfig.paths.catalogsDirectory;
      const parsedDir = appConfig.paths.parsedDirectory;
      
      const directoryChecks = await Promise.allSettled([
        fs.access(catalogsDir, fs.constants.R_OK),
        fs.access(parsedDir, fs.constants.W_OK).catch(() => 
          fs.mkdir(parsedDir, { recursive: true }))
      ]);

      const healthStatus = {
        overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        config: configHealth,
        directories: {
          catalogsReadable: directoryChecks[0].status === 'fulfilled',
          parsedWritable: directoryChecks[1].status === 'fulfilled',
          catalogsPath: catalogsDir,
          parsedPath: parsedDir
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          limit: appConfig.parsing.memoryLimitMB
        },
        parser: {
          version: 'v2.0-production',
          environment: appConfig.environment
        }
      };

      // Determine overall health
      if (!configHealth.isValid || 
          !healthStatus.directories.catalogsReadable || 
          !healthStatus.directories.parsedWritable) {
        healthStatus.overall = 'unhealthy';
      }

      console.log('Health Check Results:');
      console.log(JSON.stringify(healthStatus, null, 2));
      
      if (healthStatus.overall === 'healthy') {
        console.log('✅ System is healthy and ready for operation');
      } else {
        console.log('❌ System has health issues - check configuration and directory permissions');
      }
      
      process.exit(healthStatus.overall === 'healthy' ? 0 : 1);
    } else {
      const success = await parseSingleCatalog(args[0]);
      process.exit(success ? 0 : 1);
    }

  } catch (error) {
  logger.error(`Unhandled error in main process: ${(error as Error).message}`);
    console.error('❌ Critical error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for module usage
export { CatalogParserUnified };
