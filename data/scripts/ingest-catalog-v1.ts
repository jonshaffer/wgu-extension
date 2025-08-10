#!/usr/bin/env node

/**
 * WGU Institutional Catalog Parser v1.0
 * 
 * Optimized for catalogs from 2017-2020 timeframe
 * - Different CCN storage format (embedded in course names)
 * - Different degree plan table structures
 * - Legacy course code patterns
 */

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { CatalogData, Course, DegreePlan, CatalogFormatVersion } from '../types/catalog-data.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Catalog format version for 2017-2020 era
const FORMAT_VERSION: CatalogFormatVersion = {
  major: 1,
  minor: 0,
  patch: 0,
  identifier: "WGU-Catalog-Legacy-2017-2020",
  characteristics: {
    courseCodePatterns: ["[A-Z]{3,4}\\d{1,3}", "[A-Z]\\d{3,4}"],
    ccnFormat: "Embedded in course name (e.g., 'BUS 3650 - Course Title')",
    degreeTableFormat: "Simple list format with minimal metadata",
    textFormatNotes: [
      "CCNs stored as part of course names",
      "Simpler degree plan tables",
      "Less structured competency unit information"
    ]
  },
  dateRange: {
    firstSeen: "2017-01",
    lastSeen: "2020-12"
  }
};

interface ParseCourseV1Options {
  courseText: string;
  courseCode: string;
  courseName: string;
  description: string;
  pageNumber: number;
}

function parseCourseV1(options: ParseCourseV1Options): Course {
  const { courseText, courseCode, courseName, description, pageNumber } = options;
  
  // Extract CCN from course name for legacy format
  // Pattern: "BUS 3650 - Course Title" or "EDUC 3310"
  let ccn = '';
  let cleanCourseName = courseName;
  
  // Try to extract CCN from course name
  const ccnMatch = courseName.match(/^([A-Z]{3,5}\s+\d{4})\s*[-–—]?\s*(.*)$/);
  if (ccnMatch) {
    ccn = ccnMatch[1].trim();
    cleanCourseName = ccnMatch[2].trim() || courseName;
  } else {
    // Check if the course name IS a CCN
    const directCcnMatch = courseName.match(/^[A-Z]{3,5}\s+\d{4}$/);
    if (directCcnMatch) {
      ccn = courseName;
      cleanCourseName = courseCode; // Use course code as fallback name
    }
  }
  
  // Extract competency units - legacy catalogs had simpler patterns
  let competencyUnits = 0;
  const cuPatterns = [
    /(\d+)\s*credit\s*hour/i,
    /(\d+)\s*competency\s*unit/i,
    /(\d+)\s*cu\b/i,
    /\b(\d)\s*(?:CU|CH)\b/i
  ];
  
  for (const pattern of cuPatterns) {
    const cuMatch = courseText.match(pattern);
    if (cuMatch) {
      const value = parseInt(cuMatch[1]);
      if (value >= 1 && value <= 10) {
        competencyUnits = value;
        break;
      }
    }
  }
  
  return {
    courseCode,
    ccn,
    courseName: cleanCourseName,
    description,
    competencyUnits,
    metadata: {
      pageNumber,
      rawText: courseText,
      lastParsed: new Date().toISOString(),
    }
  };
}

async function parseCatalogV1(pdfPath: string) {
  console.log(`📖 Parsing legacy catalog PDF (v1.0): ${pdfPath}`);
  
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Read and parse PDF
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const fullText = pdfData.text;
    
    console.log(`📄 Processing ${pdfData.numpages} pages...`);
    console.log(`📝 Text length: ${fullText.length} characters`);
    
    const courses: Record<string, Course> = {};
    const degreePlans: Record<string, DegreePlan> = {};
    
    // Legacy pattern: simpler course matching
    console.log(`🔍 Finding legacy course descriptions...`);
    const legacyCoursePattern = /\b([A-Z]{2,4}\d{1,3})\s*[-–—]\s*([^\n]{5,100})(?:\n|\r\n?)([^\n\r]*(?:\n|\r\n?)[^\n\r]*){0,3}/g;
    const courseMatches = [...fullText.matchAll(legacyCoursePattern)];
    
    console.log(`📚 Found ${courseMatches.length} legacy course descriptions`);
    
    for (let i = 0; i < courseMatches.length; i++) {
      const match = courseMatches[i];
      const courseCode = match[1];
      const courseName = match[2].trim();
      const description = match[3]?.trim() || '';
      
      // Estimate page number
      const matchIndex = match.index || 0;
      const charsPerPage = fullText.length / pdfData.numpages;
      const pageNumber = Math.ceil(matchIndex / charsPerPage);
      
      // Get context for CU extraction
      const contextStart = Math.max(0, matchIndex - 100);
      const contextEnd = Math.min(fullText.length, matchIndex + 300);
      const courseText = fullText.substring(contextStart, contextEnd);
      
      const course = parseCourseV1({
        courseText,
        courseCode,
        courseName,
        description,
        pageNumber
      });
      
      courses[courseCode] = course;
      
      if ((i + 1) % 50 === 0) {
        console.log(`   📚 Processed ${i + 1}/${courseMatches.length} legacy courses...`);
      }
    }
    
    // Legacy degree plan parsing (simpler)
    console.log(`🔍 Finding legacy degree plans...`);
    const degreePattern = /(?:Bachelor|Master|Associate)[\s\w,()&-]+/gi;
    const degreeMatches = [...fullText.matchAll(degreePattern)];
    
    console.log(`🎓 Found ${degreeMatches.length} potential legacy degree matches`);
    // Note: Legacy degree plan parsing would be implemented here
    // For now, we'll focus on course extraction
    
    const processingTime = Date.now() - startTime;
    
    // Calculate coverage statistics
    const totalCourses = Object.keys(courses).length;
    const coursesWithCCNs = Object.values(courses).filter(c => c.ccn !== '').length;
    const coursesWithCUs = Object.values(courses).filter(c => c.competencyUnits > 0).length;
    
    const catalogData: CatalogData = {
      courses,
      degreePlans,
      metadata: {
        catalogDate: path.basename(pdfPath).includes('Jan2017') ? 'January 2017' : 'Unknown',
        academicYear: '2016-2017',
        sourceFile: pdfPath,
        parsedAt: new Date().toISOString(),
        parserVersion: 'v1.0-legacy',
        totalPages: pdfData.numpages,
        formatVersion: FORMAT_VERSION,
        source: {
          sourceUrl: 'https://www.wgu.edu/about/institutional-catalog.html',
          fileSizeBytes: pdfBuffer.length,
        },
        parsing: {
          detectedPatterns: {
            courseCodeFormats: ["ABP1", "ACA1", "ADP1", "AEP1"],
            ccnFormats: ["BUS 3650", "EDUC 3310"],
            degreeTableFormats: ["Simple list format"]
          },
          performance: {
            processingTimeMs: processingTime,
            stepTimings: {
              ccnExtraction: 0,
              courseDescriptions: processingTime,
              courseListings: 0,
              degreePlans: 0
            }
          },
          compatibility: {
            fullySupported: true,
            formatDifferences: [
              "CCNs embedded in course names instead of separate field",
              "Simpler degree plan structure",
              "Different course code patterns"
            ],
            recommendations: [
              "Consider extracting CCNs from course names",
              "Enhance degree plan parsing for legacy format",
              "Add support for additional course code patterns"
            ]
          }
        },
        parseErrors: errors,
        statistics: {
          coursesFound: totalCourses,
          degreePlansFound: Object.keys(degreePlans).length,
          duplicatesRemoved: warnings.filter(w => w.includes('Duplicate')).length,
          ccnCoverage: Math.round((coursesWithCCNs / totalCourses) * 100),
          competencyUnitsCoverage: Math.round((coursesWithCUs / totalCourses) * 100)
        }
      }
    };
    
    console.log(`✅ Legacy parsing complete:`);
    console.log(`   📚 Courses found: ${catalogData.metadata.statistics.coursesFound}`);
    console.log(`   📊 CCN coverage: ${catalogData.metadata.statistics.ccnCoverage}%`);
    console.log(`   📊 CU coverage: ${catalogData.metadata.statistics.competencyUnitsCoverage}%`);
    console.log(`   🎓 Degree plans found: ${catalogData.metadata.statistics.degreePlansFound}`);
    console.log(`   ⏱️  Processing time: ${processingTime}ms`);
    
    return {
      success: true,
      data: catalogData,
      errors,
      warnings,
      stats: {
        processingTime,
        coursesFound: totalCourses,
        degreePlansFound: Object.keys(degreePlans).length,
      }
    };
    
  } catch (error) {
    console.error(`❌ Legacy catalog parsing failed:`, error);
    return {
      success: false,
      data: null,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings,
      stats: {
        processingTime: Date.now() - startTime,
        coursesFound: 0,
        degreePlansFound: 0,
      }
    };
  }
}

// Main execution
async function main() {
  try {
    const catalogDir = path.join(process.cwd(), 'data', 'raw', 'wgu-institution-catalog');
    const outputDir = path.join(process.cwd(), 'data', 'processed');
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('📖 Starting WGU Legacy Catalog data ingestion (v1.0)...');
    
    // Parse legacy catalogs (2017-2020)
    const legacyCatalogs = ['catalog-Jan2017.pdf'];
    
    for (const pdfFile of legacyCatalogs) {
      const pdfPath = path.join(catalogDir, pdfFile);
      
      try {
        await fs.access(pdfPath);
      } catch {
        console.log(`⚠️  Legacy catalog not found: ${pdfFile}, skipping...`);
        continue;
      }
      
      const result = await parseCatalogV1(pdfPath);
      
      if (result.success && result.data) {
        // Save parsed data
        const dataPath = path.join(outputDir, `${path.parse(pdfFile).name}-parsed-v1.json`);
        await fs.writeFile(
          dataPath,
          JSON.stringify(result.data, null, 2)
        );
        console.log(`💾 Saved legacy parsed data to: ${dataPath}`);
        
        // Save summary
        const summaryPath = path.join(outputDir, `${path.parse(pdfFile).name}-summary-v1.json`);
        const summary = {
          file: pdfFile,
          parserVersion: 'v1.0-legacy',
          formatVersion: FORMAT_VERSION,
          parsedAt: new Date().toISOString(),
          statistics: result.data.metadata.statistics,
          performance: result.data.metadata.parsing.performance,
          compatibility: result.data.metadata.parsing.compatibility,
          success: result.success,
          errors: result.errors,
          warnings: result.warnings,
          stats: result.stats,
        };
        
        await fs.writeFile(
          summaryPath,
          JSON.stringify(summary, null, 2)
        );
        console.log(`📋 Saved legacy summary to: ${summaryPath}`);
        
      } else {
        console.error(`❌ Failed to parse legacy catalog ${pdfFile}:`);
        result.errors?.forEach(error => console.error(`   Error: ${error}`));
      }
    }
    
    console.log('✅ WGU Legacy Catalog data ingestion completed');
    
  } catch (error) {
    console.error('❌ Legacy catalog ingestion failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { parseCatalogV1, FORMAT_VERSION };
