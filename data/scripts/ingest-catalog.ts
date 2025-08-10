#!/usr/bin/env node

/**
 * WGU Institutional Catalog     // Parse competency units from degree plan mappings or fallback to text patterns
    let competencyUnits = cuMappings.get(courseCode) || 0;
    
    // Debug: Log CU mapping for spec    // Pattern: Account for concatenated format from PDF parsing
    // Format: "MGMT 3000C715Organizational Behavior31" OR "MATH 5210AOA2Number Sense and Functions41"
    // Where "31" means 3 CUs in term 1, "41" means 4 CUs in term 1
    const degreeTablePattern = /([A-Z]{3,5}\s+\d{4})([A-Z]{1,3}\d{1,4}[A-Z]*)[A-Za-z\s]*?(\d{2})(?=\s|\n|$)/g;
    const ccnMatches = [...fullText.matchAll(degreeTablePattern)];courses
    if (['C715', 'D072', 'C716'].includes(courseCode)) {
      console.log(`D    // Second pass: Find course listings with CU information and update existing courses
    console.log(`🔍 Second pass: Finding course listings with CU data...`);
    
    // Look for patterns like "COURSE_CODE - Course Name 31" or "COURSE_CODE - Course Name (3 CU)"
    const courseListingPattern = /\b([A-Z]{1,3}\d{1,4}[A-Z]*)\s*[-–—]\s*([^\n\r]+?)(?:\s+([1-9])\s*(?:CU|$|\d{4}))?/g;
    const listingMatches = [...fullText.matchAll(courseListingPattern)]; ${courseCode} CU mapping: ${cuMappings.get(courseCode) || 'none'}`);
    }
    
    // If no CU from degree plan, try to extract from course description
    if (competencyUnits === 0) {
      const cuMatch = courseText.match(/(\d+)\s*credit/i) || 
                     courseText.match(/(\d+)\s*competency\s*unit/i) ||
                     courseText.match(/(\d+)\s*cu[^a-z]/i);
      if (cuMatch) {
        competencyUnits = parseInt(cuMatch[1]);
      }
    }rser
 * 
 * Parses WGU catalog PDFs to extract course information and degree plans.
 * Generates structured data for use in the WGU extension.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

// Import pdf-parse using require for compatibility
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Type for PDF parse result
interface PDFData {
  numpages: number;
  text: string;
  info: any;
  metadata: any;
}
import type {
  Course,
  DegreePlan,
  DegreePlanCourse,
  CatalogData,
  CatalogParserConfig,
  ParseResult
} from '../types/catalog-data.js';

const RAW_DIR = resolve(process.cwd(), 'data/raw/wgu-institution-catalog');
const OUTPUT_DIR = resolve(process.cwd(), 'data/processed');

// Default parser configuration
const DEFAULT_CONFIG: CatalogParserConfig = {
  pdfPath: '',
  outputDir: OUTPUT_DIR,
  options: {
    extractDescriptions: true,
    parseDegreePlans: true,
    includeRawText: false,
    maxPages: 0, // Process all pages
    validateData: true,
  },
  patterns: {
    // More specific WGU course code patterns
    courseCode: /\b([A-Z]\d{3,4}[A-Z]*)\s*[-–—]\s*([^\n]+)/g,
    
    // CCN pattern - look for course control numbers
    ccn: /(?:CCN|Course Control Number)[:\s]*(\d+)/gi,
    
    // Competency Units - look for various formats
    competencyUnits: /(\d+(?:\.\d+)?)\s*(?:CU|Competency Units?|Credit Units?|credits?)/gi,
    
    // Degree plan section headers - more comprehensive
    degreePlan: /(?:Bachelor|Master|Associate|Certificate).*?(?:of\s+)?(?:Science|Arts|Applied Science|Business|Education|Technology).*?(?:in\s+)?.*?(?:Degree|Program)/gi,
  }
};

/**
 * Parse a single course entry from text
 */
function parseCourse(text: string, pageNumber: number): Course | null {
  // Look for course code followed by dash and title (already working well based on debug)
  const courseMatch = text.match(/\b([A-Z]\d{3,4}[A-Z]*)\s*[-–—]\s*([^\n\r]+)/);
  if (!courseMatch) return null;
  
  const courseCode = courseMatch[1];
  let courseName = courseMatch[2].trim();
  
  // Clean up course name - remove trailing dots and extra text
  courseName = courseName.replace(/\.$/, ''); // Remove trailing dot
  courseName = courseName.split(/\s*[-–—]\s*/)[0]; // Take only first part if multiple dashes
  
  // Extract CCN if present in the context
  const ccnMatch = text.match(/(?:CCN|Course Control Number)[:\s]*(\d+)/i);
  const ccn = ccnMatch ? ccnMatch[1] : '';
  
  // Extract competency units - look for patterns like "(3)" or "3 CU"
  let competencyUnits = 0;
  
  // First try to find CU in parentheses (common pattern)
  const cuParenMatch = courseName.match(/\((\d+(?:\.\d+)?)\)/);
  if (cuParenMatch) {
    competencyUnits = parseFloat(cuParenMatch[1]);
    // Remove the CU info from course name
    courseName = courseName.replace(/\s*\(\d+(?:\.\d+)?\)\s*/, '').trim();
  } else {
    // Try other CU patterns in the surrounding text
    const cuMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:CU|Competency Units?|Credit Units?)/i);
    if (cuMatch) {
      competencyUnits = parseFloat(cuMatch[1]);
    }
  }
  
  // Extract description - look for text after the course line
  let description = '';
  const lines = text.split(/\n|\r\n?/);
  const courseLineIndex = lines.findIndex(line => line.includes(courseCode));
  
  if (courseLineIndex >= 0 && courseLineIndex < lines.length - 1) {
    // Get next few lines as description
    for (let i = courseLineIndex + 1; i < Math.min(courseLineIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      
      // Stop if we hit another course code, empty line, or major section
      if (!line || 
          /\b[A-Z]\d{3,4}[A-Z]*\s*[-–—]/.test(line) || 
          /^[A-Z\s]+:?\s*$/.test(line) ||
          line.length < 10) {
        break;
      }
      
      description += (description ? ' ' : '') + line;
    }
  }
  
  // Don't return courses with no meaningful data
  if (!courseName || courseName.length < 3) {
    return null;
  }
  
  return {
    courseCode,
    ccn,
    courseName,
    description: description.trim(),
    competencyUnits,
    metadata: {
      pageNumber,
      rawText: text.substring(0, 500), // Limit raw text size
      lastParsed: new Date().toISOString(),
    }
  };
}

/**
 * Parse degree plan information from text
 */
function parseDegreePlan(text: string, pageNumber: number): DegreePlan | null {
  // Look for degree titles - typically in all caps or title case with "Bachelor" or "Master"
  const degreeMatch = text.match(/(?:Bachelor of|Master of|BS in|MS in|Bachelor's|Master's)[\s\w,()&-]+/i);
  if (!degreeMatch) return null;
  
  const degreeName = degreeMatch[0].trim();
  const degreeId = degreeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Find all course codes mentioned in this degree plan section
  const courseMatches = text.matchAll(/\b([A-Z]\d{3,4}[A-Z]*)\b/g);
  const courses: DegreePlanCourse[] = [];
  
  for (const match of courseMatches) {
    const courseCode = match[1];
    // Check if already added
    if (!courses.find(c => c.courseCode === courseCode)) {
      courses.push({
        courseCode,
        type: 'required', // Default, could be refined with more parsing
      });
    }
  }
  
  // Try to extract total competency units for the degree
  const totalCUMatch = text.match(/(?:Total|Minimum|Program)[\s\w]*:?\s*(\d+)\s*(?:CU|Competency Units|Credit Units)/i);
  const totalCompetencyUnits = totalCUMatch ? parseInt(totalCUMatch[1]) : 0;
  
  // Only return if we found courses
  if (courses.length === 0) {
    return null;
  }
  
  return {
    degreeId,
    degreeName,
    college: 'Unknown', // Would need more sophisticated parsing
    degreeType: degreeName.toLowerCase().includes('bachelor') ? 'bachelor' : 
                degreeName.toLowerCase().includes('master') ? 'master' : 'certificate',
    totalCompetencyUnits,
    courses,
    metadata: {
      pageNumber,
      rawText: text,
      lastParsed: new Date().toISOString(),
    }
  };
}

/**
 * Parse catalog PDF and extract structured data
 */
async function parseCatalogPDF(pdfPath: string, config: CatalogParserConfig): Promise<ParseResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    console.log(`📖 Parsing catalog PDF: ${pdfPath}`);
    
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfData: PDFData = await pdf(pdfBuffer);
    
    console.log(`📄 Processing ${pdfData.numpages} pages...`);
    
    const courses: Record<string, Course> = {};
    const degreePlans: Record<string, DegreePlan> = {};
    
    const fullText = pdfData.text;
    
    console.log(`📝 Text length: ${fullText.length} characters`);
    
    // Step 0: Extract CCN mappings and competency units from degree plan tables
    console.log(`🔍 Extracting CCN mappings and competency units...`);
    const ccnMappings = new Map<string, string>();
    const cuMappings = new Map<string, number>();
    
    // Pattern: Account for concatenated format from PDF parsing
    // Format: "MGMT 3000C715Organizational Behavior31" 
    // Where "31" means 3 CUs in term 1
    const degreeTablePattern = /([A-Z]{3,5}\s+\d{4})\s*([A-Z]\d{3,4})[^0-9]*?(\d{2})/g;
    const ccnMatches = [...fullText.matchAll(degreeTablePattern)];
    
    for (const match of ccnMatches) {
      const ccn = match[1].trim();
      const courseCode = match[2];
      const cuTerm = match[3]; // e.g., "31" = 3 CUs, term 1
      
      // Parse CUs and term from the two-digit number
      const cus = Math.floor(parseInt(cuTerm) / 10); // First digit = CUs
      const term = parseInt(cuTerm) % 10; // Second digit = term
      
      // Only map if we have a valid course code format and reasonable CU values
      if (courseCode.match(/^[A-Z]{1,3}\d{1,4}[A-Z]*$/) && cus >= 1 && cus <= 10 && term >= 1 && term <= 9) {
        ccnMappings.set(courseCode, ccn);
        cuMappings.set(courseCode, cus);
      }
    }
    
    console.log(`📋 Found ${ccnMappings.size} CCN mappings and ${cuMappings.size} CU mappings`);
    
    // Add known mappings from degree plans that may not be captured by pattern matching
    const knownMappings = new Map([
      ['AOA2', { ccn: 'MATH 5210', cus: 4 }],
      ['AUA2', { ccn: 'MATH 5220', cus: 4 }],
      ['AVA2', { ccn: 'MATH 5230', cus: 4 }],
      ['MFT2', { ccn: 'EDUC 6836', cus: 2 }],
      ['QTT2', { ccn: 'MATH 5710', cus: 2 }],
      ['OPT2', { ccn: 'EDUC 6320', cus: 2 }],
      ['C224', { ccn: 'EDUC 5111', cus: 2 }],
      ['C225', { ccn: 'EDUC 5112', cus: 2 }],
      ['C226', { ccn: 'EDUC 5113', cus: 2 }],
      ['C227', { ccn: 'EDUC 5114', cus: 2 }],
      ['C635', { ccn: 'EDUC 6029', cus: 6 }],
    ]);
    
    // Apply known mappings
    for (const [courseCode, data] of knownMappings) {
      ccnMappings.set(courseCode, data.ccn);
      cuMappings.set(courseCode, data.cus);
    }
    
    console.log(`📋 After adding known mappings: ${ccnMappings.size} CCN mappings and ${cuMappings.size} CU mappings`);
    
    // Debug: show a few sample mappings
    if (ccnMappings.size > 0) {
      const samples = Array.from(ccnMappings.entries()).slice(0, 5);
      const cuSamples = samples.map(([course, ccn]) => `${course}→${ccn}(${cuMappings.get(course)}CU)`);
      console.log(`   Sample mappings: ${cuSamples.join(', ')}`);
    }
    
    // First pass: Find all detailed course descriptions (these have better data)
    console.log(`🔍 First pass: Finding detailed course descriptions...`);
    const detailedCoursePattern = /\b([A-Z]{1,3}\d{1,4}[A-Z]*)\s*[-–—]\s*([^\n]{10,100})\s*[-–—]\s*([^\n]{100,})/g;
    const detailedMatches = [...fullText.matchAll(detailedCoursePattern)];
    
    console.log(`� Found ${detailedMatches.length} detailed course descriptions`);
    
    for (let i = 0; i < detailedMatches.length; i++) {
      const match = detailedMatches[i];
      const courseCode = match[1];
      const courseName = match[2].trim();
      const description = match[3].trim();
      
      // Estimate page number
      const matchIndex = match.index || 0;
      const charsPerPage = fullText.length / pdfData.numpages;
      const pageNumber = Math.ceil(matchIndex / charsPerPage);
      
      // Extract competency units from the context around the match
      const contextStart = Math.max(0, matchIndex - 200);
      const contextEnd = Math.min(fullText.length, matchIndex + 500);
      const context = fullText.substring(contextStart, contextEnd);
      
      // Parse competency units from degree plan mappings or fallback to text patterns
      let competencyUnits = cuMappings.get(courseCode) || 0;
      
      // Debug: Log CU mapping for specific courses
      if (['C715', 'D072', 'C716', 'AOA2', 'AUA2', 'AVA2', 'MFT2', 'QTT2', 'OPT2'].includes(courseCode)) {
        console.log(`DEBUG: ${courseCode} CU mapping: ${cuMappings.get(courseCode) || 'none'}`);
      }
      
      // If no CU from degree plan, try to extract from context
      if (competencyUnits === 0) {
        // Look for CU patterns in context - be more specific about the patterns
        const cuPatterns = [
          /\b(\d+)\s*CU\b/i,                          // "3 CU"
          /\b(\d+)\s*Competency Units?\b/i,           // "3 Competency Units"
          /(?:^|\s)(\d)\s*$/m,                        // Single digit at end of line
          /(?:^|\s)([1-9])\s*(?:\d{4}|Term|$)/m       // Single digit followed by year or "Term"
        ];
        
        for (const pattern of cuPatterns) {
          const cuMatch = context.match(pattern);
          if (cuMatch) {
            const value = parseInt(cuMatch[1]);
            // Only accept reasonable CU values (1-6 typically)
            if (value >= 1 && value <= 10) {
              competencyUnits = value;
              break;
            }
          }
        }
      }
      
      courses[courseCode] = {
        courseCode,
        ccn: ccnMappings.get(courseCode) || '', // Use CCN mapping if available
        courseName,
        description,
        competencyUnits,
        metadata: {
          pageNumber,
          rawText: context.substring(0, 500),
          lastParsed: new Date().toISOString(),
        }
      };
      
      if ((i + 1) % 50 === 0) {
        console.log(`   📚 Processed ${i + 1}/${detailedMatches.length} detailed courses...`);
      }
    }
    
    // Second pass: Find course listings with CU information and update existing courses
    console.log(`🔍 Second pass: Finding course listings with CU data...`);
    
    // Look for patterns like "COURSE_CODE - Course Name 31" or "COURSE_CODE - Course Name (3 CU)"
    const courseListingPattern = /\b([A-Z]\d{3,4}[A-Z]*)\s*[-–—]\s*([^\n\r]+?)(?:\s+([1-9])\s*(?:CU|$|\d{4}))?/g;
    const listingMatches = [...fullText.matchAll(courseListingPattern)];
    
    console.log(`📋 Found ${listingMatches.length} course listings`);
    
    for (const match of listingMatches) {
      const courseCode = match[1];
      const courseName = match[2].trim();
      const cuValue = match[3] ? parseInt(match[3]) : 0;
      
      if (courses[courseCode]) {
        // Update existing course with CU info - prioritize degree plan mappings
        const mappedCUs = cuMappings.get(courseCode);
        if (mappedCUs && courses[courseCode].competencyUnits === 0) {
          courses[courseCode].competencyUnits = mappedCUs;
        } else if (cuValue > 0 && cuValue <= 10 && courses[courseCode].competencyUnits === 0) {
          courses[courseCode].competencyUnits = cuValue;
        }
        
        // Update existing course CCN if we don't have it yet
        if (!courses[courseCode].ccn && ccnMappings.has(courseCode)) {
          courses[courseCode].ccn = ccnMappings.get(courseCode) || '';
        }
        
        // Use the shorter, cleaner course name if the current one is too long
        if (courseName.length < courses[courseCode].courseName.length && courseName.length > 5) {
          courses[courseCode].courseName = courseName;
        }
      } else {
        // Create new course entry if we don't have it yet
        const matchIndex = match.index || 0;
        const charsPerPage = fullText.length / pdfData.numpages;
        const pageNumber = Math.ceil(matchIndex / charsPerPage);
        
        courses[courseCode] = {
          courseCode,
          ccn: ccnMappings.get(courseCode) || '',
          courseName,
          description: '',
          competencyUnits: cuMappings.get(courseCode) || (cuValue > 0 && cuValue <= 10 ? cuValue : 0),
          metadata: {
            pageNumber,
            rawText: match[0],
            lastParsed: new Date().toISOString(),
          }
        };
      }
    }
    
    // Third pass: Find degree plans
    console.log(`🔍 Third pass: Finding degree plans...`);
    
    const degreeMatches = [...fullText.matchAll(/(?:Bachelor of|Master of|BS in|MS in|Bachelor's|Master's)[\s\w,()&-]+/gi)];
    console.log(`🎓 Found ${degreeMatches.length} potential degree matches`);
    
    for (let i = 0; i < Math.min(degreeMatches.length, 100); i++) { // Process more degree matches
      const match = degreeMatches[i];
      
      const matchIndex = match.index || 0;
      const contextStart = Math.max(0, matchIndex - 1000);
      const contextEnd = Math.min(fullText.length, matchIndex + 2000);
      const context = fullText.substring(contextStart, contextEnd);
      
      const charsPerPage = fullText.length / pdfData.numpages;
      const pageNumber = Math.ceil(matchIndex / charsPerPage);
      
      const degreePlan = parseDegreePlan(context, pageNumber);
      if (degreePlan) {
        if (degreePlans[degreePlan.degreeId]) {
          warnings.push(`Duplicate degree plan found: ${degreePlan.degreeName}`);
        } else {
          degreePlans[degreePlan.degreeId] = degreePlan;
        }
      }
      
      if ((i + 1) % 20 === 0) {
        console.log(`   🎓 Processed ${i + 1}/100 degree matches...`);
      }
    }
    
    // Final pass: Add any missing known courses
    console.log(`🔍 Final pass: Adding any missing known courses...`);
    let addedCourses = 0;
    for (const [courseCode, data] of knownMappings) {
      if (!courses[courseCode]) {
        courses[courseCode] = {
          courseCode,
          ccn: data.ccn,
          courseName: `${courseCode} Course`, // Generic name for missing courses
          description: '',
          competencyUnits: data.cus,
          metadata: {
            pageNumber: 0,
            rawText: `Known course mapping: ${courseCode} -> ${data.ccn}`,
            lastParsed: new Date().toISOString(),
          }
        };
        addedCourses++;
      }
    }
    if (addedCourses > 0) {
      console.log(`   📚 Added ${addedCourses} missing known courses`);
    }

    const processingTime = Date.now() - startTime;    // Create catalog data structure
    const catalogData: CatalogData = {
      courses,
      degreePlans,
      metadata: {
        catalogDate: 'August 2025', // Could be extracted from PDF metadata
        academicYear: '2025-2026',
        sourceFile: pdfPath,
        parsedAt: new Date().toISOString(),
        parserVersion: '1.0.0',
        totalPages: pdfData.numpages,
        parseErrors: errors,
        statistics: {
          coursesFound: Object.keys(courses).length,
          degreePlansFound: Object.keys(degreePlans).length,
          duplicatesRemoved: warnings.filter(w => w.includes('Duplicate')).length,
        }
      }
    };
    
    console.log(`✅ Parsing complete:`);
    console.log(`   📚 Courses found: ${catalogData.metadata.statistics.coursesFound}`);
    console.log(`   🎓 Degree plans found: ${catalogData.metadata.statistics.degreePlansFound}`);
    console.log(`   ⏱️  Processing time: ${processingTime}ms`);
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${warnings.length}`);
    }
    
    return {
      success: true,
      data: catalogData,
      errors,
      warnings,
      stats: {
        processingTime,
        pagesProcessed: pdfData.numpages,
        itemsExtracted: {
          courses: catalogData.metadata.statistics.coursesFound,
          degreePlans: catalogData.metadata.statistics.degreePlansFound,
        }
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to parse PDF: ${errorMessage}`);
    
    return {
      success: false,
      data: {
        courses: {},
        degreePlans: {},
        metadata: {
          catalogDate: 'August 2025',
          academicYear: '2025-2026',
          sourceFile: pdfPath,
          parsedAt: new Date().toISOString(),
          parserVersion: '1.0.0',
          totalPages: 0,
          parseErrors: errors,
          statistics: {
            coursesFound: 0,
            degreePlansFound: 0,
            duplicatesRemoved: 0,
          }
        }
      },
      errors,
      warnings,
      stats: {
        processingTime: Date.now() - startTime,
        pagesProcessed: 0,
        itemsExtracted: {
          courses: 0,
          degreePlans: 0,
        }
      }
    };
  }
}

/**
 * Main catalog ingestion function
 */
async function ingestCatalogData(): Promise<void> {
  console.log('📖 Starting WGU Catalog data ingestion...');
  
  try {
    // Find PDF files in the catalog directory
    const files = await fs.readdir(RAW_DIR);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('⚠️  No PDF files found in catalog directory');
      return;
    }
    
    console.log(`Found ${pdfFiles.length} PDF file(s): ${pdfFiles.join(', ')}`);
    
    // Process each PDF file
    for (const pdfFile of pdfFiles) {
      const pdfPath = resolve(RAW_DIR, pdfFile);
      const config: CatalogParserConfig = {
        ...DEFAULT_CONFIG,
        pdfPath,
      };
      
      const result = await parseCatalogPDF(pdfPath, config);
      
      if (result.success && result.data) {
        // Save parsed data
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        
        const outputFile = pdfFile.replace('.pdf', '-parsed.json');
        const outputPath = resolve(OUTPUT_DIR, outputFile);
        
        await fs.writeFile(
          outputPath,
          JSON.stringify(result.data, null, 2)
        );
        
        console.log(`💾 Saved parsed data to: ${outputPath}`);
        
        // Also save a summary file
        const summaryFile = pdfFile.replace('.pdf', '-summary.json');
        const summaryPath = resolve(OUTPUT_DIR, summaryFile);
        
        const summary = {
          metadata: result.data.metadata,
          courseCodes: Object.keys(result.data.courses).sort(),
          degreeIds: Object.keys(result.data.degreePlans).sort(),
          parseResult: {
            success: result.success,
            errors: result.errors,
            warnings: result.warnings,
            stats: result.stats,
          }
        };
        
        await fs.writeFile(
          summaryPath,
          JSON.stringify(summary, null, 2)
        );
        
        console.log(`📋 Saved summary to: ${summaryPath}`);
        
      } else {
        console.error(`❌ Failed to parse ${pdfFile}:`);
        result.errors?.forEach(error => console.error(`   Error: ${error}`));
      }
    }
    
    console.log('✅ WGU Catalog data ingestion completed');
    
  } catch (error) {
    console.error('❌ Catalog ingestion failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestCatalogData();
}

export { ingestCatalogData, parseCatalogPDF };
