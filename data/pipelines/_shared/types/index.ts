/**
 * Shared Types Export
 * 
 * Central export point for all shared type definitions
 */

// Export all common types
export * from './common';

// Export catalog-specific types
export * from './catalog';

// Export analytics and monitoring types
export * from './analytics';

// Re-export commonly used types for convenience
export type {
  // Common types
  HierarchyLevel,
  College,
  Hierarchy,
  ValidationResult,
  ValidationIssue,
  Logger,
  CommunityBase,
  ProcessingResult,
  
  // Catalog types
  Course,
  CourseType,
  DegreePlan,
  ParsedCatalog,
  CatalogMetadata,
  CatalogStatistics,
  
  // Analytics types
  ParserHealthMetrics,
  HealthTrend,
  ParsingReport
} from './index';