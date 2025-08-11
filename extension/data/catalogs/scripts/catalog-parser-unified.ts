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

interface ParsedCatalog {
  courses: Record<string, Course>;
  degreePlans: Record<string, DegreePlan>;
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
      ccnCoverage: number;
      cuCoverage: number;
    };
  };
}

interface Course {
  courseCode: string;
  courseName: string;
  ccn?: string;
  competencyUnits?: number;
  description?: string;
  prerequisites?: string[];
  pageNumber?: number;
}

interface DegreePlan {
  name: string;
  title?: string; // For JSON output compatibility
  code?: string;
  totalCUs?: number;
  courses: string[];
  description?: string;
}

class CatalogParserUnified {
  private filename: string;
  private fullText: string = '';
  private totalPages: number = 0;
  private startTime: number = 0;
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
        
        courses.push({
          courseCode,
          courseName,
          ccn,
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription
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
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        courses.push({
          courseCode,
          courseName,
          ccn: ccnMap.get(courseCode),
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription
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
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        courses.push({
          courseCode,
          courseName,
          ccn: ccnMap.get(courseCode),
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription
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
      
      if (!foundCodes.has(courseCode)) {
        foundCodes.add(courseCode);
        
        // Use detailed description if available, otherwise use current description
        const finalDescription = detailedDescriptions.get(courseCode) || 
                                (description.length > 30 ? description : undefined);
        
        courses.push({
          courseCode,
          courseName,
          ccn: ccnMap.get(courseCode),
          competencyUnits: cuMap.get(courseCode),
          description: finalDescription
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
   * Extract CCN and CU mappings from the catalog
   */
  private extractCCNAndCUMappings(): { ccnMap: Map<string, string>, cuMap: Map<string, number> } {
    const ccnMap = new Map<string, string>();
    const cuMap = new Map<string, number>();
    
    // Pattern 1: CCN followed by course code (MGMT 3000C715)
    const ccnPattern = /([A-Z]{2,4}\s+\d{3,4})([A-Z]\d{3,4}[A-Z]?)(?=[A-Z][a-z]|\d)/g;
    const ccnMatches = [...this.fullText.matchAll(ccnPattern)];
    
    for (const match of ccnMatches) {
      const ccn = match[1].trim();
      const courseCode = match[2].trim();
      ccnMap.set(courseCode, ccn);
    }
    
    // Pattern 2: Course table format using known course codes
    for (const courseCode of ccnMap.keys()) {
      // Look for pattern like "C715Organizational Behavior31"
      const regex = new RegExp(`${courseCode}[A-Za-z\\s&,-]+?(\\d{1,2})(?=\\d|$)`, 'g');
      const matches = [...this.fullText.matchAll(regex)];
      
      for (const match of matches) {
        const competencyUnits = parseInt(match[1]);
        if (competencyUnits > 0 && competencyUnits <= 12) {
          cuMap.set(courseCode, competencyUnits);
          break; // Take the first valid match for this course
        }
      }
    }
    
    // Pattern 3: Explicit CU statements in descriptions
    const cuPattern = /([A-Z]\d{3,4}[A-Z]?)[^0-9]*?(\d+)\s*(?:competency\s*units?|CUs?|credit)/gi;
    const cuMatches = [...this.fullText.matchAll(cuPattern)];
    
    for (const match of cuMatches) {
      const courseCode = match[1].trim();
      const competencyUnits = parseInt(match[2]);
      
      if (competencyUnits > 0 && competencyUnits <= 12) {
        cuMap.set(courseCode, competencyUnits);
      }
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
      
      courses.push({
        courseCode,
        courseName,
        description: finalDescription,
        ccn,
        competencyUnits
      });
    }
    
    // Pattern 2: Concatenated format "D627Public Health Education and Promotion34"
    const concatPattern = /\b([A-Z]\d{3,4}[A-Z]?)([A-Za-z\s]+?)(\d{1,2})(?=\s|$|\n)/g;
    const concatMatches = [...this.fullText.matchAll(concatPattern)];
    
    console.log(`Found ${concatMatches.length} concatenated modern course patterns`);
    
    for (const match of concatMatches) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const competencyUnits = parseInt(match[3]);
      
      // Skip if we already have this course
      if (courses.find(c => c.courseCode === courseCode)) continue;
      
      // Skip if the course name is too short (likely false positive)
      if (courseName.length < 10) continue;
      
      // Get CCN from mappings
      const ccn = ccnMap.get(courseCode);
      
      // Use detailed description if available
      const finalDescription = detailedDescriptions.get(courseCode);
      
      courses.push({
        courseCode,
        courseName,
        description: finalDescription,
        ccn,
        competencyUnits
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
      
      courses.push({
        courseCode,
        courseName,
        description: finalDescription,
        ccn,
        competencyUnits
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
      
      // Parse course table
      const { courses, totalCUs } = this.parseCourseTable(planContext);
      
      // For structured degree plans, include if we have either courses OR totalCUs
      if (courses.length > 0 || totalCUs) {
        plans.push({
          name: degreeName,
          title: degreeName, // Add title field for JSON output
          description: description,
          courses: courses,
          totalCUs: totalCUs
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
      
      const { courses, totalCUs } = this.parseCourseTable(planContext);
      
      // For structured degree plans, include if we have either courses OR totalCUs
      if (courses.length > 0 || totalCUs) {
        plans.push({
          name: degreeName,
          title: degreeName,
          description: description,
          courses: courses,
          totalCUs: totalCUs
        });
        
        console.log(`📚 Parsed general structured plan: ${degreeName} (${courses.length} courses, ${totalCUs || 'unknown'} CUs)`);
      }
    }
  }

  /**
   * Parse course table from degree plan context
   */
  private parseCourseTable(context: string): { courses: string[], totalCUs?: number } {
    const courses: string[] = [];
    let totalCUs: number | undefined;
    
    // Look for various table header formats
    const tableHeaderPatterns = [
      /CCN\s+Course Number\s+Course Description\s+CUs\s+Term/i,
      /CCN\s+Course\s+Number\s+Course\s+Description\s+CUs\s+Term/i,
      /Course\s+Number\s+Course\s+Description\s+CUs\s+Term/i,
      /CCN\s+Course\s+Description\s+CUs\s+Term/i
    ];
    
    const hasTableHeaders = tableHeaderPatterns.some(pattern => pattern.test(context));
    
    if (hasTableHeaders) {
      console.log(`📋 Found tabular course format with headers`);
      
      // Enhanced patterns that handle PDF text spacing irregularities
      const courseRowPatterns = [
        // Pattern 1: Standard BSBA format: CCN | Course Code | Description | CUs | Term
        /^([A-Z]{2,6}\s+\d{3,4})\s+([A-Z]\d{3,4}[A-Z]?)\s+([A-Za-z\s:,.\-&'()]+?)\s+(\d{1,2})\s+(\d{1,2})\s*$/gm,
        
        // Pattern 2: More flexible spacing with non-greedy matching
        /([A-Z]{2,6}\s+\d{3,4})\s+([A-Z]\d{3,4}[A-Z]?)\s+([A-Za-z\s:,.\-&'()]+?)\s+(\d{1,2})\s+(\d{1,2})(?=\s|$|\n)/g,
        
        // Pattern 3: Handle cases with extra whitespace/tabs
        /([A-Z]{2,6}\s+\d{3,4})\s+([A-Z]\d{3,4}[A-Z]?)\s+([^\t\n]+?)\s+(\d{1,2})\s+(\d{1,2})/g,
        
        // Pattern 4: Course code extraction from structured lines (fallback)
        /^[A-Z]{2,6}\s+\d{3,4}\s+([A-Z]\d{3,4}[A-Z]?)\s+/gm
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
          
          if (i === 3) { // Pattern 4 (course code only)
            courseCode = match[1].trim();
          } else {
            courseCode = match[2].trim();
          }
          
          // Validate course code format (must be like C123, D456, QHT1, etc.)
          if (/^[A-Z]\d{3,4}[A-Z]?$/.test(courseCode) && !tempCourses.includes(courseCode)) {
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
        // Ultimate fallback: Extract from table-like lines
        console.log(`Fallback: Extracting from table-like lines`);
        const lines = context.split('\n');
        
        for (const line of lines) {
          // Skip header lines and empty lines
          if (/CCN|Course Number|Course Description|^\s*$/i.test(line)) continue;
          
          // Look for lines that start with CCN pattern and contain course code
          if (/^[A-Z]{2,6}\s+\d{3,4}/.test(line)) {
            const courseMatch = line.match(/\b([A-Z]\d{3,4}[A-Z]?)\b/);
            if (courseMatch && /^[A-Z]\d{3,4}[A-Z]?$/.test(courseMatch[1]) && !courses.includes(courseMatch[1])) {
              courses.push(courseMatch[1]);
            }
          }
        }
        
        console.log(`Fallback extraction found ${courses.length} courses`);
      }
      
    } else {
      console.log(`No table headers found, using simple extraction`);
      // Fallback to simple course code extraction for non-tabular formats
      const courseMatches = [...context.matchAll(/\b([A-Z]{1,4}\d{3,4}[A-Z]*)\b/g)];
      const uniqueCourses = [...new Set(courseMatches.map(m => m[1]))]
        .filter(code => /^[A-Z]\d{3,4}[A-Z]?$/.test(code)); // Validate format
      courses.push(...uniqueCourses);
      console.log(`Simple extraction found ${courses.length} courses`);
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
    
    return { courses, totalCUs };
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
      
      const { courses, totalCUs } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) { // Require at least 3 courses for a valid program
        plans.push({
          name: cleanName,
          title: cleanName,
          description,
          courses,
          totalCUs
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
      
      const { courses, totalCUs } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) {
        plans.push({
          name: cleanName,
          title: cleanName,
          courses,
          totalCUs
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
      
      const { courses, totalCUs } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) {
        plans.push({
          name: cleanName,
          courses,
          totalCUs
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
      
      const { courses, totalCUs } = this.parseCourseTable(planContext);
      
      if (courses.length >= 3) {
        plans.push({
          name: cleanName,
          title: cleanName,
          courses,
          totalCUs
        });
      }
    }
  }

  /**
   * Calculate parsing statistics
   */
  private calculateStats(courses: Course[], degreePlans: DegreePlan[]) {
    const ccnCoverage = courses.filter(c => c.ccn).length / courses.length * 100;
    const cuCoverage = courses.filter(c => c.competencyUnits).length / courses.length * 100;
    
    return {
      coursesFound: courses.length,
      degreePlansFound: degreePlans.length,
      ccnCoverage: Math.round(ccnCoverage),
      cuCoverage: Math.round(cuCoverage)
    };
  }

  /**
   * Main parsing method
   */
  async parseCatalog(filePath: string): Promise<ParsedCatalog> {
    await this.loadPDF(filePath);
    
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
    const stats = this.calculateStats(coursesArray, degreePlansArray);
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
    
    return {
      courses,
      degreePlans,
      metadata: {
        catalogDate: format.era,
        parserVersion: format.version,
        parsedAt: new Date().toISOString(),
        totalPages: this.totalPages,
        parsingTimeMs,
  pdf: this.pdfInfo,
        statistics: stats
      }
    };
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

      const parsePromise = parser.parseCatalog(filePath);
      const result = await Promise.race([parsePromise, timeoutPromise]) as ParsedCatalog;
      
      // Generate output path in the organized structure
      const baseFilename = path.basename(filename, '.pdf');
  const outputPath = path.join(appConfig.paths.parsedDirectory, `${baseFilename}.json`);
      
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
