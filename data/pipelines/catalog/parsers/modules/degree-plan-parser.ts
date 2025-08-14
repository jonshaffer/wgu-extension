/**
 * Degree Plan Parser Module
 * 
 * Handles extraction and parsing of degree plans from catalog text
 */

import { DegreePlan } from '../../../_shared/types/catalog';
import { Logger } from '../../../_shared/types/common';

export class DegreePlanParser {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Parse all degree plans from catalog
   */
  parseDegreePlans(fullText: string): DegreePlan[] {
    const plans: DegreePlan[] = [];
    
    // Pattern 1: Standard degree plan format
    // "Bachelor of Science in Computer Science" followed by course table
    const degreePattern = /(Bachelor|Master|Associate|Doctor)\s+of\s+[^.]+?(?:\s+in\s+[^.]+?)?(?:\s*\([^)]+\))?\s*\n([\s\S]*?)(?=\n(?:Bachelor|Master|Associate|Doctor)\s+of\s+|\n\s*(?:Certificate|Standalone|Course\s+Descriptions)|\Z)/gi;
    
    const matches = [...fullText.matchAll(degreePattern)];
    this.logger.info(`Found ${matches.length} degree plan patterns`);
    
    for (const match of matches) {
      const fullName = match[0].split('\n')[0].trim();
      const planContent = match[2];
      
      // Extract program code if present
      const codeMatch = fullName.match(/\(([A-Z]+)\)/);
      const code = codeMatch ? codeMatch[1] : undefined;
      
      // Extract courses from the plan content
      const courses = this.extractCoursesFromPlan(planContent);
      
      // Calculate total CUs if possible
      const totalCUs = this.extractTotalCUs(planContent);
      
      // Determine school
      const school = this.determineSchool(fullName);
      
      plans.push({
        name: fullName,
        code,
        courses,
        totalCUs,
        school
      });
    }
    
    // Pattern 2: Table-based degree plans
    const tablePlans = this.parseTableBasedPlans(fullText);
    plans.push(...tablePlans);
    
    return this.deduplicatePlans(plans);
  }

  /**
   * Extract courses from degree plan content
   */
  private extractCoursesFromPlan(planContent: string): string[] {
    const courses: string[] = [];
    
    // Pattern 1: Course code at start of line
    const coursePattern = /^([A-Z]\d{3,4}[A-Z]?)\s/gm;
    const matches = [...planContent.matchAll(coursePattern)];
    
    for (const match of matches) {
      courses.push(match[1]);
    }
    
    // Pattern 2: Course codes in tables
    const tablePattern = /([A-Z]\d{3,4}[A-Z]?)\s+\d+\s+[A-Za-z]/g;
    const tableMatches = [...planContent.matchAll(tablePattern)];
    
    for (const match of tableMatches) {
      if (!courses.includes(match[1])) {
        courses.push(match[1]);
      }
    }
    
    return courses;
  }

  /**
   * Parse table-based degree plans (newer format)
   */
  private parseTableBasedPlans(fullText: string): DegreePlan[] {
    const plans: DegreePlan[] = [];
    
    // Look for degree plan tables with headers
    const tablePattern = /Program:\s*([^\n]+)\s*\n[\s\S]*?CCN\s+Course\s+Number\s+Course\s+Description[\s\S]*?(?=\nProgram:|\n\s*Certificate|\Z)/gi;
    const matches = [...fullText.matchAll(tablePattern)];
    
    for (const match of matches) {
      const programName = match[1].trim();
      const tableContent = match[0];
      
      // Extract courses from table
      const courses: string[] = [];
      const courseRowPattern = /[A-Z]{2,4}\s+\d{3,5}[A-Z]?\s+([A-Z]\d{3,4}[A-Z]?)\s+/g;
      const courseMatches = [...tableContent.matchAll(courseRowPattern)];
      
      for (const courseMatch of courseMatches) {
        courses.push(courseMatch[1]);
      }
      
      // Extract total CUs if present
      const totalCUs = this.extractTotalCUs(tableContent);
      
      plans.push({
        name: programName,
        courses,
        totalCUs,
        school: this.determineSchool(programName)
      });
    }
    
    return plans;
  }

  /**
   * Extract total CUs from plan content
   */
  private extractTotalCUs(content: string): number | undefined {
    // Pattern 1: "Total: 120 CUs"
    const totalPattern = /Total:?\s*(\d+)\s*(?:CUs?|competency units?|credits?)/i;
    const match = content.match(totalPattern);
    
    if (match) {
      return parseInt(match[1]);
    }
    
    // Pattern 2: "120 competency units required"
    const requiredPattern = /(\d+)\s*(?:competency units?|CUs?|credits?)\s*required/i;
    const requiredMatch = content.match(requiredPattern);
    
    if (requiredMatch) {
      return parseInt(requiredMatch[1]);
    }
    
    return undefined;
  }

  /**
   * Determine school based on program name
   */
  private determineSchool(programName: string): string | undefined {
    const nameLower = programName.toLowerCase();
    
    if (nameLower.includes('technology') || nameLower.includes('computer') || nameLower.includes('software') || nameLower.includes('data') || nameLower.includes('cyber')) {
      return 'School of Technology';
    }
    if (nameLower.includes('business') || nameLower.includes('management') || nameLower.includes('marketing') || nameLower.includes('accounting') || nameLower.includes('mba')) {
      return 'School of Business';
    }
    if (nameLower.includes('health') || nameLower.includes('nursing') || nameLower.includes('medical')) {
      return 'School of Health';
    }
    if (nameLower.includes('education') || nameLower.includes('teaching') || nameLower.includes('curriculum')) {
      return 'School of Education';
    }
    
    return undefined;
  }

  /**
   * Deduplicate degree plans
   */
  private deduplicatePlans(plans: DegreePlan[]): DegreePlan[] {
    const seen = new Map<string, DegreePlan>();
    
    for (const plan of plans) {
      const key = plan.name.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (!seen.has(key)) {
        seen.set(key, plan);
      } else {
        // Merge data if we have duplicates
        const existing = seen.get(key)!;
        
        // Use the plan with more courses
        if (plan.courses && plan.courses.length > (existing.courses?.length || 0)) {
          seen.set(key, plan);
        } else if (plan.totalCUs && !existing.totalCUs) {
          // Add totalCUs if missing
          existing.totalCUs = plan.totalCUs;
        }
      }
    }
    
    return Array.from(seen.values());
  }
}