#!/usr/bin/env node

/**
 * Unified WGU Catalog Parser - Refactored Version
 * 
 * This is a transitional file that imports from shared types
 * while maintaining compatibility with existing code
 */

import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './lib/config.js';

// Import shared types
import { 
  Course, 
  DegreePlan, 
  ParsedCatalog,
  StandaloneCourse,
  CertificateProgram,
  ProgramOutcome,
  CourseBundleInfo,
  CourseType
} from '../../_shared/types/catalog';
import { 
  ValidationIssue,
  ParsingReport,
  Logger 
} from '../../_shared/types/common';

// Re-export the original unified parser for now
export { CatalogParserUnified } from './unified.js';

// Export types for compatibility
export type {
  Course,
  CourseType,
  DegreePlan,
  ParsedCatalog,
  StandaloneCourse,
  CertificateProgram,
  ProgramOutcome,
  CourseBundleInfo,
  ValidationIssue,
  ParsingReport
};