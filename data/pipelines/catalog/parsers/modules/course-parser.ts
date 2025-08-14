/**
 * Course Parser Module
 * 
 * Handles extraction and parsing of courses from catalog text
 */

import { Course, CourseType } from '../../../_shared/types/catalog';
import { Logger } from '../../../_shared/types/common';

export class CourseParser {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Parse courses using legacy format (embedded CCN)
   */
  parseCoursesLegacy(fullText: string, detectCourseType: (code: string, name?: string, ccn?: string, desc?: string) => CourseType): Course[] {
    const courses: Course[] = [];
    
    // Legacy pattern: "C182 - Introduction to IT (3 credits) [COMP 1001]"
    const legacyPattern = /([A-Z]\d{3,4}[A-Z]?)\s*[-–]\s*([^(\n]+?)\s*\((\d+)\s*(?:credit|competency unit)s?\)\s*(?:\[([A-Z]{2,4}\s+\d{3,5}[A-Z]?)\])?/g;
    
    const matches = [...fullText.matchAll(legacyPattern)];
    this.logger.info(`Found ${matches.length} legacy format courses`);
    
    for (const match of matches) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const competencyUnits = parseInt(match[3]);
      const ccn = match[4]?.trim();
      
      const courseType = detectCourseType(courseCode, courseName, ccn);
      
      courses.push({
        courseCode,
        courseName,
        competencyUnits,
        ccn,
        courseType
      });
    }
    
    return courses;
  }

  /**
   * Parse courses using modern format (structured tables)
   */
  parseCoursesModern(fullText: string, ccnMap: Map<string, string>, cuMap: Map<string, number>, detailedDescriptions: Map<string, string>, detectCourseType: (code: string, name?: string, ccn?: string, desc?: string) => CourseType): Course[] {
    const courses: Course[] = [];
    
    // Pattern 1: Standard format "C100 - Course Name - Description"
    const standardPattern = /\b([A-Z]\d{3,4}[A-Z]?)\s*-\s*([^-\n\r]+?)\s*-\s*([^\n\r]+)/g;
    const standardMatches = [...fullText.matchAll(standardPattern)];
    
    this.logger.info(`Found ${standardMatches.length} standard modern course patterns`);
    
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
      const courseType = detectCourseType(courseCode, courseName, ccn, finalDescription);
      
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
    const concatPattern = /\b([A-Z]\d{3,4}[A-Z]?)([A-Za-z\s&,.\-:()'/]+?)(\d{1,2})(\d{1})(?=\s|$|\n|[A-Z]{2,6}\s+\d{3,4})/g;
    const concatMatches = [...fullText.matchAll(concatPattern)];
    
    this.logger.info(`Found ${concatMatches.length} concatenated modern course patterns`);
    
    for (const match of concatMatches) {
      const courseCode = match[1].trim();
      let courseName = match[2].trim();
      const competencyUnits = parseInt(match[3]);
      const term = parseInt(match[4]);
      
      // Fix common truncation issues
      courseName = this.fixTruncatedCourseName(courseName);
      
      const ccn = ccnMap.get(courseCode);
      const description = detailedDescriptions.get(courseCode);
      const courseType = detectCourseType(courseCode, courseName, ccn, description);
      
      courses.push({
        courseCode,
        courseName,
        description,
        ccn,
        competencyUnits,
        courseType
      });
    }
    
    return courses;
  }

  /**
   * Extract CCN mappings from degree plan tables
   */
  extractCCNMappings(fullText: string): Map<string, string> {
    const ccnMap = new Map<string, string>();
    
    // Look for CCN tables in degree plans
    const tablePattern = /CCN\s+Course(?:\s+Number)?\s+Course\s+Description[\s\S]*?(?=\n\s*\n|\Z)/gi;
    const tableMatches = [...fullText.matchAll(tablePattern)];
    
    for (const tableMatch of tableMatches) {
      const tableText = tableMatch[0];
      
      // Extract rows from table
      const rowPattern = /([A-Z]{2,4}\s+\d{3,5}[A-Z]?)\s+([A-Z]\d{3,4}[A-Z]?)\s+(.+?)(?=\n[A-Z]{2,4}\s+\d{3,5}|\n\s*\n|\Z)/gs;
      const rowMatches = [...tableText.matchAll(rowPattern)];
      
      for (const rowMatch of rowMatches) {
        const ccn = rowMatch[1].replace(/\s+/g, ' ').trim();
        const courseCode = rowMatch[2].trim();
        ccnMap.set(courseCode, ccn);
      }
    }
    
    this.logger.info(`Extracted ${ccnMap.size} CCN mappings from degree plan tables`);
    return ccnMap;
  }

  /**
   * Extract CU mappings from tables
   */
  extractCUMappings(fullText: string): Map<string, number> {
    const cuMap = new Map<string, number>();
    
    // Pattern for CU in tables: "C182  3  Introduction to IT"
    const cuPattern = /([A-Z]\d{3,4}[A-Z]?)\s+(\d{1,2})\s+[A-Z][a-zA-Z\s&,.\-:()'/]+/g;
    const matches = [...fullText.matchAll(cuPattern)];
    
    for (const match of matches) {
      const courseCode = match[1].trim();
      const cus = parseInt(match[2]);
      if (cus > 0 && cus <= 12) { // Reasonable CU range
        cuMap.set(courseCode, cus);
      }
    }
    
    this.logger.info(`Extracted ${cuMap.size} CU mappings`);
    return cuMap;
  }

  /**
   * Extract detailed course descriptions from Course Descriptions section
   */
  extractDetailedDescriptions(fullText: string): Map<string, string> {
    const descriptions = new Map<string, string>();
    
    // Find Course Descriptions section
    const sectionMatch = fullText.match(/Course\s+Descriptions\s*\n([\s\S]*?)(?=\n\s*(?:Instructor|Faculty|©|\Z))/i);
    if (!sectionMatch) {
      this.logger.warn('Could not find Course Descriptions section');
      return descriptions;
    }
    
    const sectionText = sectionMatch[1];
    
    // Pattern: "C182 - Introduction to IT - This course introduces..."
    const descPattern = /([A-Z]\d{3,4}[A-Z]?)\s*[-–]\s*([^-\n]+?)\s*[-–]\s*([\s\S]+?)(?=\n[A-Z]\d{3,4}[A-Z]?\s*[-–]|\n\s*\n|\Z)/g;
    const matches = [...sectionText.matchAll(descPattern)];
    
    for (const match of matches) {
      const courseCode = match[1].trim();
      const description = match[3].trim()
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\d+\s*\n/g, '') // Remove page numbers
        .replace(/©.*?University.*?\d+/g, ''); // Remove copyright
      
      if (description.length > 20) {
        descriptions.set(courseCode, description);
      }
    }
    
    this.logger.info(`Extracted ${descriptions.size} detailed course descriptions`);
    return descriptions;
  }

  /**
   * Fix common course name truncation issues
   */
  private fixTruncatedCourseName(courseName: string): string {
    const fixes: Record<string, string> = {
      'ublic Health': 'Public Health',
      'roject Management': 'Project Management',
      'roblem Solving': 'Problem Solving',
      'usiness': 'Business',
      'anagement': 'Management',
      'ommunication': 'Communication',
      'undamentals': 'Fundamentals',
      'ntroduction': 'Introduction',
      'evelopment': 'Development',
      'rogramming': 'Programming'
    };
    
    for (const [truncated, fixed] of Object.entries(fixes)) {
      if (courseName.startsWith(truncated)) {
        return fixed + courseName.substring(truncated.length);
      }
    }
    
    return courseName;
  }
}