/**
 * Base Catalog Parser
 * 
 * Abstract base class for all catalog parsers
 */

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { 
  Course, 
  DegreePlan, 
  ParsedCatalog,
  CatalogMetadata,
  ValidationIssue 
} from '../../_shared/types/catalog';
import { Logger } from '../../_shared/types/common';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export abstract class BaseCatalogParser {
  protected filename: string;
  protected fullText: string = '';
  protected startTime: number = 0;
  protected totalPages: number = 0;
  protected logger: Logger;
  protected pdfInfo: any = {};

  constructor(filename: string, logger?: Logger) {
    this.filename = filename;
    this.logger = logger || {
      info: (msg: string) => console.log(`[Parser] ${msg}`),
      warn: (msg: string) => console.warn(`[Parser] WARN: ${msg}`),
      error: (msg: string, err?: Error) => console.error(`[Parser] ERROR: ${msg}`, err),
      debug: (msg: string) => console.debug(`[Parser] DEBUG: ${msg}`)
    };
  }

  /**
   * Parse PDF and extract text content
   */
  async loadPDF(filePath: string): Promise<void> {
    this.logger.info(`Loading PDF: ${this.filename}`);
    this.startTime = Date.now();

    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    this.fullText = pdfData.text;
    this.totalPages = pdfData.numpages;
    this.pdfInfo = {
      title: pdfData.info?.Title,
      version: pdfData.version,
      pages: pdfData.numpages,
      producer: pdfData.info?.Producer,
      creationDate: pdfData.info?.CreationDate
    };

    this.logger.info(`PDF loaded: ${this.totalPages} pages, ${this.fullText.length} characters`);
  }

  /**
   * Main parsing method - must be implemented by subclasses
   */
  abstract parseCatalog(filePath: string, outputPath?: string): Promise<ParsedCatalog>;

  /**
   * Parse courses - must be implemented by subclasses
   */
  protected abstract parseCourses(): Course[];

  /**
   * Parse degree plans - must be implemented by subclasses
   */
  protected abstract parseDegreePlans(): DegreePlan[];

  /**
   * Validate parsing results
   */
  protected validateResults(courses: Course[], degreePlans: DegreePlan[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for empty results
    if (courses.length === 0) {
      issues.push({
        type: 'missing_data',
        severity: 'error',
        message: 'No courses found',
        location: 'courses'
      });
    }

    // Check for courses without essential data
    courses.forEach(course => {
      if (!course.courseCode) {
        issues.push({
          type: 'missing_data',
          severity: 'error',
          message: 'Course missing code',
          location: 'course',
          details: course
        });
      }
      if (!course.courseName) {
        issues.push({
          type: 'missing_data',
          severity: 'warning',
          message: `Course ${course.courseCode} missing name`,
          location: `course.${course.courseCode}`
        });
      }
    });

    // Check degree plans
    const allPlanCourses = new Set<string>();
    degreePlans.forEach(plan => {
      if (!plan.name) {
        issues.push({
          type: 'missing_data',
          severity: 'error',
          message: 'Degree plan missing name',
          location: 'degreePlan',
          details: plan
        });
      }
      plan.courses?.forEach(code => allPlanCourses.add(code));
    });

    // Check for orphaned courses in degree plans
    const courseCodes = new Set(courses.map(c => c.courseCode));
    const missingCourses = Array.from(allPlanCourses).filter(code => !courseCodes.has(code));
    
    if (missingCourses.length > 0) {
      issues.push({
        type: 'missing_data',
        severity: 'warning',
        message: `${missingCourses.length} courses referenced in degree plans but not found`,
        location: 'degreePlans',
        details: missingCourses
      });
    }

    return issues;
  }

  /**
   * Calculate statistics
   */
  protected calculateStatistics(parsedCatalog: ParsedCatalog): ParsedCatalog['metadata']['statistics'] {
    const courses = Object.values(parsedCatalog.courses);
    const coursesWithCCN = courses.filter(c => c.ccn).length;
    const coursesWithCUs = courses.filter(c => c.competencyUnits).length;
    const coursesWithDesc = courses.filter(c => c.description).length;

    // Count by prefix
    const coursesByPrefix: Record<string, number> = {};
    courses.forEach(course => {
      const prefix = course.courseCode?.[0] || 'Unknown';
      coursesByPrefix[prefix] = (coursesByPrefix[prefix] || 0) + 1;
    });

    return {
      coursesFound: courses.length,
      degreePlansFound: Object.keys(parsedCatalog.degreePlans).length,
      standaloneCourses: Object.keys(parsedCatalog.standaloneCourses || {}).length,
      certificatePrograms: Object.keys(parsedCatalog.certificatePrograms || {}).length,
      programOutcomes: Object.keys(parsedCatalog.programOutcomes || {}).length,
      ccnCoverage: Math.round((coursesWithCCN / courses.length) * 100) || 0,
      cuCoverage: Math.round((coursesWithCUs / courses.length) * 100) || 0,
      coursesByPrefix,
      dataQuality: {
        coursesWithDescription: coursesWithDesc,
        coursesWithCCN: coursesWithCCN,
        coursesWithCUs: coursesWithCUs,
        completeCourseRecords: courses.filter(c => c.ccn && c.competencyUnits && c.description).length,
        problematicCourseCodeCount: courses.filter(c => !c.courseCode || !/^[A-Z]\d{3,4}[A-Z]?$/.test(c.courseCode)).length
      }
    };
  }

  /**
   * Detect course type based on various indicators
   */
  protected detectCourseType(courseCode: string, courseName?: string, ccn?: string, description?: string): Course['courseType'] {
    const nameUpper = courseName?.toUpperCase() || '';
    const descUpper = description?.toUpperCase() || '';
    const combined = `${nameUpper} ${descUpper}`;

    if (combined.includes('INDEPENDENT STUDY') || combined.includes('SELF-STUDY')) {
      return 'independent-study';
    }
    if (combined.includes('FLEXIBLE') || combined.includes('COMPETENCY-BASED')) {
      return 'flexible-learning';
    }
    return 'degree-plan';
  }
}