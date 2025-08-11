/**
 * Degree Programs Aggregator Library
 * 
 * Generates consolidated degree programs from parsed catalog data
 * Converts degree names to normalized JSON keys for programmatic access
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

export interface DegreePlan {
  name: string;
  title: string;
  description: string;
  courses: string[];
  totalCUs: number;
}

export interface CatalogData {
  courses: Record<string, any>;
  degreePlans: Record<string, DegreePlan>;
  metadata: {
    catalogDate?: string;
    version?: string;
  };
}

export interface NormalizedDegreeProgram {
  id: string;           // normalized key (e.g., "bachelor-of-science-computer-science")
  name: string;         // original display name
  title: string;        // degree title
  description: string;  // program description
  totalCUs: number;     // total competency units
  courses: string[];    // array of course codes
  catalogVersions: string[];  // versions where this degree appears
  lastUpdated: string;  // most recent catalog date
}

export interface DegreeProgramsOutput {
  metadata: {
    generatedAt: string;
    totalPrograms: number;
    catalogVersionsIncluded: string[];
    description: string;
  };
  degrees: Record<string, NormalizedDegreeProgram>;
}

/**
 * Convert degree name to normalized JSON key
 * Examples:
 * "Bachelor of Science, Computer Science" -> "bachelor-of-science-computer-science"  
 * "Master of Business Administration" -> "master-of-business-administration"
 */
export function normalizeDegreeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove punctuation except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

/**
 * Extract catalog date from filename
 */
export function getCatalogDate(filename: string): string {
  const match = filename.match(/catalog-(\d{4}-\d{2})\.json/);
  return match ? match[1] : filename.replace('.json', '');
}

/**
 * Aggregate degree programs from multiple catalog data objects
 */
export function aggregateDegreePrograms(
  catalogs: Map<string, CatalogData>
): Record<string, NormalizedDegreeProgram> {
  const programs = new Map<string, NormalizedDegreeProgram>();
  
  for (const [catalogDate, catalog] of catalogs) {
    if (!catalog.degreePlans) continue;
    
    for (const [planKey, plan] of Object.entries(catalog.degreePlans)) {
      const normalizedId = normalizeDegreeName(plan.name);
      
      if (programs.has(normalizedId)) {
        // Update existing program
        const existing = programs.get(normalizedId)!;
        existing.catalogVersions.push(catalogDate);
        existing.lastUpdated = catalogDate;
        
        // Update with most recent/complete data
        if (plan.courses && plan.courses.length > existing.courses.length) {
          existing.courses = [...plan.courses];
          existing.totalCUs = plan.totalCUs;
          existing.description = plan.description || existing.description;
        }
      } else {
        // Create new program entry
        programs.set(normalizedId, {
          id: normalizedId,
          name: plan.name,
          title: plan.title || plan.name,
          description: plan.description || '',
          totalCUs: plan.totalCUs || 0,
          courses: plan.courses || [],
          catalogVersions: [catalogDate],
          lastUpdated: catalogDate
        });
      }
    }
  }
  
  // Convert to sorted object
  const sortedPrograms: Record<string, NormalizedDegreeProgram> = {};
  const sortedKeys = Array.from(programs.keys()).sort((a, b) => {
    const nameA = programs.get(a)!.name;
    const nameB = programs.get(b)!.name;
    return nameA.localeCompare(nameB);
  });
  
  for (const key of sortedKeys) {
    sortedPrograms[key] = programs.get(key)!;
  }
  
  return sortedPrograms;
}

/**
 * Generate degree programs aggregate from all parsed catalogs
 */
export function generateDegreeProgramsAggregate(
  parsedDir: string,
  outputFile: string
): DegreeProgramsOutput {
  const catalogs = new Map<string, CatalogData>();
  
  // Load all parsed catalog files
  const files = readdirSync(parsedDir)
    .filter((f: string) => f.endsWith('.json'))
    .sort();
    
  for (const file of files) {
    try {
      const filePath = resolve(parsedDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8')) as CatalogData;
      const catalogDate = getCatalogDate(file);
      
      if (!data.metadata) data.metadata = {};
      data.metadata.catalogDate = catalogDate;
      
      catalogs.set(catalogDate, data);
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  }
  
  if (catalogs.size === 0) {
    throw new Error('No catalog files found in parsed directory');
  }
  
  const degrees = aggregateDegreePrograms(catalogs);
  
  const output: DegreeProgramsOutput = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalPrograms: Object.keys(degrees).length,
      catalogVersionsIncluded: Array.from(catalogs.keys()).sort(),
      description: "Aggregate WGU degree programs from all available catalog versions. Programs are keyed by normalized degree names for programmatic access in the browser extension."
    },
    degrees
  };
  
  // Write the output file
  writeFileSync(outputFile, JSON.stringify(output, null, 2) + '\n');
  
  return output;
}