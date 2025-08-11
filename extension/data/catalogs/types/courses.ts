/**
 * TypeScript types for WGU Courses aggregate data
 */

/** Single course record as normalized in the aggregate */
export interface NormalizedCourse {
  /** Lowercase course code used as key (e.g., "c182") */
  id: string;
  /** Original course code (e.g., "C182") */
  code: string;
  /** Course display name/title */
  name: string;
  /** Optional long description */
  description?: string;
  /** Common course number mapping (when available) */
  ccn?: string;
  /** Competency units (when available) */
  competencyUnits?: number;
  /** Catalog versions where this course appears */
  catalogVersions: string[];
  /** Most recent catalog date where this course was seen */
  lastUpdated: string;
}

/** Complete courses aggregate output */
export interface CoursesOutput {
  metadata: {
    /** ISO timestamp when file was generated */
    generatedAt: string;
    /** Total number of unique courses */
    totalCourses: number;
    /** All catalog versions included in aggregation */
    catalogVersionsIncluded: string[];
    /** Human-readable description */
    description: string;
  };
  /** Courses keyed by normalized lowercase id (e.g., "c182") */
  courses: Record<string, NormalizedCourse>;
}

/** Type guard for a course */
export function isCourse(obj: any): obj is NormalizedCourse {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.catalogVersions) &&
    typeof obj.lastUpdated === 'string'
  );
}

/** Type guard for courses aggregate */
export function isCoursesOutput(obj: any): obj is CoursesOutput {
  return (
    typeof obj === 'object' &&
    obj?.metadata &&
    typeof obj.metadata.totalCourses === 'number' &&
    obj?.courses &&
    typeof obj.courses === 'object'
  );
}
