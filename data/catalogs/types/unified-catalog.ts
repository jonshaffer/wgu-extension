// Unified Catalog Data Structure
// Comprehensive structure for organizing multiple catalogs over time

import { Course, DegreePlan } from './catalog-data.js';

export interface UnifiedCourse extends Course {
  /** Historical course data across catalogs */
  history: {
    /** First catalog where this course appeared */
    firstSeen: string;
    /** Last catalog where this course appeared */  
    lastSeen: string;
    /** All catalog versions where this course appeared */
    catalogVersions: string[];
    /** Changes over time (if course details changed) */
    changes?: Array<{
      catalogVersion: string;
      field: keyof Course;
      oldValue: any;
      newValue: any;
    }>;
  };
  /** Related course variants (e.g., C180 <-> C180A) */
  relatedCourses?: string[];
}

export interface UnifiedDegreePlan extends Omit<DegreePlan, 'courses'> {
  /** Course codes in this degree plan */
  courses: string[];
  /** Historical tracking */
  history: {
    firstSeen: string;
    lastSeen: string;
    catalogVersions: string[];
    /** Track major changes to degree requirements */
    majorChanges?: Array<{
      catalogVersion: string;
      changeType: 'courses-added' | 'courses-removed' | 'cu-changed' | 'name-changed';
      details: string;
      coursesAdded?: string[];
      coursesRemoved?: string[];
    }>;
  };
}

export interface CollegeData {
  /** Full college name */
  name: string;
  /** Short identifier */
  code?: string;
  /** Bachelor's degree programs */
  degrees: {
    bachelors: Record<string, Record<string, UnifiedDegreePlan>>; // programCode -> effectiveDate -> plan
    masters: Record<string, Record<string, UnifiedDegreePlan>>;
    doctorate: Record<string, Record<string, UnifiedDegreePlan>>;
  };
  /** Certificate programs */
  certificates: Record<string, Record<string, UnifiedDegreePlan>>; // programCode -> effectiveDate -> plan
  /** Courses primarily associated with this college */
  primaryCourses: string[]; // course codes
}

export interface CatalogTimeline {
  /** Catalog version (e.g., "2025-08") */
  version: string;
  /** Academic year */
  academicYear: string;
  /** When catalog was effective */
  effectiveDate: string;
  /** Parser metadata */
  parsingMetadata: {
    parsedAt: string;
    parserVersion: string;
    totalPages: number;
    statistics: {
      coursesFound: number;
      degreePlansFound: number;
      ccnCoverage: number;
      cuCoverage: number;
    };
  };
  /** Notable changes in this catalog */
  changes?: {
    newCourses: string[];
    removedCourses: string[];
    modifiedCourses: string[];
    newDegreePlans: Array<{ programCode: string; name: string }>;
    modifiedDegreePlans: Array<{ programCode: string; changeType: string }>;
  };
}

export interface GlobalStatistics {
  totalCourses: number;
  totalDegreePlans: number;
  totalColleges: number;
  courseTypeDistribution: {
    'degree-plan': number;
    'independent-study': number; 
    'flexible-learning': number;
    unclassified: number;
  };
  degreeTypeDistribution: {
    bachelor: number;
    master: number;
    doctorate: number;
    certificate: number;
  };
  /** Courses with multiple variants (e.g., C180/C180A) */
  coursesWithVariants: number;
  /** Programs that have changed over time */
  programsWithHistoricalChanges: number;
}

export interface UnifiedCatalogData {
  metadata: {
    generatedAt: string;
    catalogVersionsIncluded: string[];
    dateRange: {
      earliest: string;
      latest: string;
    };
    unificationVersion: string;
    statistics: GlobalStatistics;
  };
  
  /** All courses across all catalogs */
  courses: Record<string, UnifiedCourse>; // courseCode -> course
  
  /** Degree plans organized by program and time */
  degreePlans: Record<string, Record<string, UnifiedDegreePlan>>; // programCode -> effectiveDate -> plan
  
  /** College-based organization */
  colleges: Record<string, CollegeData>; // collegeName -> data
  
  /** Timeline of all catalog versions */
  timeline: CatalogTimeline[];
  
  /** Cross-references for navigation */
  crossReferences: {
    /** Course code to degree plans that include it */
    coursesToPrograms: Record<string, Array<{ programCode: string; effectiveDate: string }>>;
    /** Program code to college */
    programsToColleges: Record<string, string>;
    /** CCN to course codes (multiple courses can have same CCN) */
    ccnToCourses: Record<string, string[]>;
    /** Academic area to courses */
    areasToCourses: Record<string, string[]>;
  };
}

// Additional utility types for working with the unified data

export interface CourseEvolution {
  courseCode: string;
  timeline: Array<{
    catalogVersion: string;
    course: Course;
  }>;
  changesOverTime: Array<{
    catalogVersion: string;
    field: keyof Course;
    oldValue: any;
    newValue: any;
  }>;
}

export interface DegreePlanEvolution {
  programCode: string;
  degreeName: string;
  timeline: Array<{
    catalogVersion: string;
    effectiveDate: string;
    plan: UnifiedDegreePlan;
  }>;
  majorChanges: Array<{
    fromVersion: string;
    toVersion: string;
    changeType: 'courses' | 'requirements' | 'cu-total' | 'name';
    summary: string;
  }>;
}

// Type guards
export function isUnifiedCatalogData(value: unknown): value is UnifiedCatalogData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<UnifiedCatalogData>;
  return (
    !!v.metadata &&
    !!v.courses && typeof v.courses === 'object' &&
    !!v.degreePlans && typeof v.degreePlans === 'object' &&
    !!v.colleges && typeof v.colleges === 'object' &&
    !!v.timeline && Array.isArray(v.timeline) &&
    !!v.crossReferences && typeof v.crossReferences === 'object'
  );
}

export function isUnifiedCourse(value: unknown): value is UnifiedCourse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<UnifiedCourse>;
  return (
    typeof v.courseCode === 'string' &&
    typeof v.courseName === 'string' &&
    !!v.history && typeof v.history === 'object' &&
    Array.isArray(v.history.catalogVersions)
  );
}