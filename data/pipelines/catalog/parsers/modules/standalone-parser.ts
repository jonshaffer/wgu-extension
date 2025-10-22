/**
 * Standalone Courses and Certificates Parser Module
 * 
 * Handles extraction of standalone courses, certificates, and program outcomes
 */

import { 
  StandaloneCourse, 
  CertificateProgram, 
  ProgramOutcome,
  CourseBundleInfo 
} from '../../../_shared/types/catalog';
import { Logger } from '../../../_shared/types/common';

export class StandaloneParser {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Parse standalone courses from catalog
   */
  parseStandaloneCourses(fullText: string): { 
    courses: Record<string, StandaloneCourse>; 
    bundles: CourseBundleInfo[] 
  } {
    const courses: Record<string, StandaloneCourse> = {};
    const bundles: CourseBundleInfo[] = [];
    
    // Find standalone courses section
    const sectionMatch = fullText.match(/Standalone\s+Courses?\s*\n([\s\S]*?)(?=\n\s*(?:Certificate|Course\s+Descriptions|©|\Z))/i);
    
    if (!sectionMatch) {
      this.logger.info('No standalone courses section found');
      return { courses, bundles };
    }
    
    const sectionText = sectionMatch[1];
    
    // Extract bundle info if present
    const bundleMatch = sectionText.match(/Bundle\s+pricing.*?(\$[\d,]+)\s*[-–]\s*(\$[\d,]+)/i);
    if (bundleMatch) {
      const priceRange = {
        min: parseInt(bundleMatch[1].replace(/[$,]/g, '')),
        max: parseInt(bundleMatch[2].replace(/[$,]/g, ''))
      };
      
      const durationMatch = sectionText.match(/(\d+)\s*months?\s+access/i);
      const duration = durationMatch ? `${durationMatch[1]} months` : undefined;
      
      bundles.push({
        priceRange,
        duration,
        accessType: 'Self-paced',
        courses: [] // Will be populated from standalone courses
      });
    }
    
    // Parse individual standalone courses
    const coursePattern = /([A-Z]\d{3,4}[A-Z]?)\s*[-–]\s*([^$\n]+?)\s*\$?([\d,]+)(?:\s*\((\d+)\s*CUs?\))?/g;
    const matches = [...sectionText.matchAll(coursePattern)];
    
    for (const match of matches) {
      const courseCode = match[1].trim();
      const courseName = match[2].trim();
      const price = parseInt(match[3].replace(/,/g, ''));
      const competencyUnits = match[4] ? parseInt(match[4]) : undefined;
      
      courses[courseCode] = {
        courseCode,
        courseName,
        price,
        competencyUnits,
        accessType: 'Self-paced'
      };
      
      // Add to bundle courses
      if (bundles.length > 0) {
        bundles[0].courses.push(courseCode);
      }
    }
    
    this.logger.info(`Found ${Object.keys(courses).length} standalone courses`);
    return { courses, bundles };
  }

  /**
   * Parse certificate programs
   */
  parseCertificatePrograms(fullText: string): Record<string, CertificateProgram> {
    const certificates: Record<string, CertificateProgram> = {};
    
    // Find certificate programs section
    const sectionMatch = fullText.match(/Certificate\s+Programs?\s*\n([\s\S]*?)(?=\n\s*(?:Course\s+Descriptions|Standalone|©|\Z))/i);
    
    if (!sectionMatch) {
      this.logger.info('No certificate programs section found');
      return certificates;
    }
    
    const sectionText = sectionMatch[1];
    
    // Parse certificate programs
    // Pattern: "Certificate Name - Description... $2,995 (12 CUs)"
    const certPattern = /([^$\n]+?)\s*[-–]\s*([^$\n]+?)\s*\$?([\d,]+)(?:\s*\((\d+)\s*CUs?\))?/g;
    const matches = [...sectionText.matchAll(certPattern)];
    
    let index = 0;
    for (const match of matches) {
      const name = match[1].trim();
      const description = match[2].trim();
      const price = parseInt(match[3].replace(/,/g, ''));
      const totalCUs = match[4] ? parseInt(match[4]) : undefined;
      
      // Generate a code based on name
      const code = `CERT${index + 1}`;
      
      // Extract courses if mentioned
      const courses: string[] = [];
      const coursePattern = /([A-Z]\d{3,4}[A-Z]?)/g;
      const courseMatches = [...description.matchAll(coursePattern)];
      
      for (const courseMatch of courseMatches) {
        courses.push(courseMatch[1]);
      }
      
      certificates[code] = {
        code,
        name,
        description,
        price,
        totalCUs,
        courses: courses.length > 0 ? courses : undefined
      };
      
      index++;
    }
    
    this.logger.info(`Found ${Object.keys(certificates).length} certificate programs`);
    return certificates;
  }

  /**
   * Parse program outcomes
   */
  parseProgramOutcomes(fullText: string): Record<string, ProgramOutcome> {
    const outcomes: Record<string, ProgramOutcome> = {};
    
    // Find program outcomes section
    const sectionMatch = fullText.match(/Program\s+Outcomes?\s*\n([\s\S]*?)(?=\n\s*(?:Course\s+Descriptions|Certificate|©|\Z))/i);
    
    if (!sectionMatch) {
      this.logger.info('No program outcomes section found');
      return outcomes;
    }
    
    const sectionText = sectionMatch[1];
    
    // Parse by school sections
    const schools: Array<'Business' | 'Health' | 'Technology' | 'Education'> = 
      ['Business', 'Health', 'Technology', 'Education'];
    
    for (const school of schools) {
      const schoolPattern = new RegExp(`School\\s+of\\s+${school}\\s*\\n([\\s\\S]*?)(?=\\nSchool\\s+of|\\Z)`, 'i');
      const schoolMatch = sectionText.match(schoolPattern);
      
      if (schoolMatch) {
        const schoolText = schoolMatch[1];
        
        // Parse individual programs
        const programPattern = /(Bachelor|Master|Doctor)\s+of\s+[^:\n]+(?:\s+in\s+[^:\n]+)?:\s*\n([\s\S]*?)(?=\n(?:Bachelor|Master|Doctor)\s+of|\n\s*School|\Z)/gi;
        const programMatches = [...schoolText.matchAll(programPattern)];
        
        for (const programMatch of programMatches) {
          const programName = programMatch[0].split(':')[0].trim();
          const outcomeText = programMatch[2];
          
          // Extract individual outcomes
          const outcomeList: Array<{ outcome: string; category?: 'technical' | 'professional' | 'analytical' }> = [];
          
          // Pattern for bulleted outcomes
          const bulletPattern = /[•·▪]\s*([^\n•·▪]+)/g;
          const bulletMatches = [...outcomeText.matchAll(bulletPattern)];
          
          for (const bulletMatch of bulletMatches) {
            const outcome = bulletMatch[1].trim();
            
            // Categorize outcome based on keywords
            let category: 'technical' | 'professional' | 'analytical' | undefined;
            const outcomeLower = outcome.toLowerCase();
            
            if (outcomeLower.includes('technical') || outcomeLower.includes('programming') || outcomeLower.includes('software')) {
              category = 'technical';
            } else if (outcomeLower.includes('professional') || outcomeLower.includes('communication') || outcomeLower.includes('leadership')) {
              category = 'professional';
            } else if (outcomeLower.includes('analytical') || outcomeLower.includes('analysis') || outcomeLower.includes('research')) {
              category = 'analytical';
            }
            
            outcomeList.push({ outcome, category });
          }
          
          const key = `${school}_${programName.replace(/\s+/g, '_')}`;
          outcomes[key] = {
            school,
            program: programName,
            outcomes: outcomeList
          };
        }
      }
    }
    
    this.logger.info(`Found ${Object.keys(outcomes).length} program outcomes`);
    return outcomes;
  }
}