/**
 * TypeScript types for WGU Degree Programs aggregate data
 */

export interface DegreePlan {
  name: string;
  title: string;
  description: string;
  courses: string[];
  totalCUs: number;
  /** Program code (e.g., BSHR, BSBA, MSITM) */
  programCode?: string;
  /** Effective date when this degree plan version went live (YYYYMM format) */
  effectiveDate?: string;
  /** Version identifier for tracking changes over time */
  version?: string;
}

export interface DegreePlanVersion {
  /** Program code (e.g., BSHR, BSBA, MSITM) */
  programCode: string;
  /** Effective date when this version went live (YYYYMM format) */
  effectiveDate: string;
  /** Degree plan data for this version */
  plan: DegreePlan;
  /** Which catalog this version was found in */
  catalogSource: string;
}

export interface CatalogData {
  courses: Record<string, any>;
  degreePlans: Record<string, DegreePlan>;
  metadata: {
    catalogDate?: string;
    version?: string;
  };
}

/**
 * Normalized degree program for the extension
 * Uses kebab-case IDs for consistent programmatic access
 */
export interface NormalizedDegreeProgram {
  /** Normalized kebab-case ID (e.g., "bachelor-of-science-computer-science") */
  id: string;
  /** Original display name from catalog */
  name: string;
  /** Degree title (may be same as name) */
  title: string;
  /** Program description */
  description: string;
  /** Program code (e.g., BSHR, BSBA, MSITM) */
  programCode?: string;
  /** Total competency units required (from most recent version) */
  totalCUs: number;
  /** Array of course codes for this degree (from most recent version) */
  courses: string[];
  /** All versions of this degree plan tracked by effective date */
  versions: Record<string, DegreePlanVersion>;
  /** Catalog versions where this degree appears */
  catalogVersions: string[];
  /** Most recent catalog date where this degree was found */
  lastUpdated: string;
  /** Most recent effective date (YYYYMM) */
  currentVersion: string;
}

/**
 * Complete degree programs aggregate output
 */
export interface DegreeProgramsOutput {
  metadata: {
    /** ISO timestamp when file was generated */
    generatedAt: string;
    /** Total number of degree programs */
    totalPrograms: number;
    /** All catalog versions included in aggregation */
    catalogVersionsIncluded: string[];
    /** Human-readable description */
    description: string;
  };
  /** Degree programs keyed by normalized ID */
  degrees: Record<string, NormalizedDegreeProgram>;
}

/**
 * Student's selected degree preference for extension settings
 */
export interface StudentDegreeSelection {
  /** Selected degree ID (normalized key) */
  degreeId: string;
  /** Display name for UI */
  degreeName: string;
  /** When the selection was made */
  selectedAt: string;
  /** Optional: Which catalog version they're following */
  catalogVersion?: string;
}

/**
 * Type guard to check if an object is a valid degree program
 */
export function isDegreeProgram(obj: any): obj is NormalizedDegreeProgram {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.totalCUs === 'number' &&
    Array.isArray(obj.courses) &&
    Array.isArray(obj.catalogVersions)
  );
}

/**
 * Type guard to check if an object is a valid degree programs output
 */
export function isDegreeProgramsOutput(obj: any): obj is DegreeProgramsOutput {
  return (
    typeof obj === 'object' &&
    obj.metadata &&
    typeof obj.metadata.totalPrograms === 'number' &&
    obj.degrees &&
    typeof obj.degrees === 'object'
  );
}