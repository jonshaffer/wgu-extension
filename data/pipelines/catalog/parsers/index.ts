/**
 * Catalog Parsers Export
 * 
 * Central export point for all catalog parsers
 */

// Export detector for automatic parser selection
export { getParser, CATALOG_FORMATS } from './detector';
export type { CatalogFormat } from './detector';

// Export base parser for extension
export { BaseCatalogParser } from './base-parser';

// Export parser modules
export { CourseParser } from './modules/course-parser';
export { DegreePlanParser } from './modules/degree-plan-parser';
export { StandaloneParser } from './modules/standalone-parser';

// Export version-specific parsers
export { V21EnhancedStructuredParser } from './v2.1-enhanced-structured';

// Export the unified parser (for backward compatibility)
export { CatalogParserUnified } from './unified';

// Re-export types from shared location
export type {
  Course,
  CourseType,
  DegreePlan,
  ParsedCatalog,
  StandaloneCourse,
  CertificateProgram,
  ProgramOutcome,
  CourseBundleInfo,
  CatalogMetadata,
  CatalogStatistics,
  NormalizedCourse
} from '../../_shared/types/catalog';

export type {
  ValidationIssue,
  ParsingReport,
  Logger
} from '../../_shared/types/common';