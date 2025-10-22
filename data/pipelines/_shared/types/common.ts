/**
 * Common Types
 * 
 * Shared type definitions used across multiple data types
 */

// ========== Hierarchy Types (used by Discord, Reddit, etc) ==========
export type HierarchyLevel = 'university' | 'college' | 'program' | 'course' | 'community';

export type College = 'technology' | 'healthcare' | 'business' | 'education';

export interface Hierarchy {
  level: HierarchyLevel;
  college?: College;
  program?: string;
  courseCode?: string;
}

// ========== Validation Types ==========
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: Record<string, any>;
}

export interface ValidationIssue {
  type: 'missing_data' | 'invalid_format' | 'duplicate' | 'outdated' | 'other';
  severity: 'error' | 'warning' | 'info';
  location?: string;
  message: string;
  details?: any;
}

// ========== Health Monitoring Types ==========
export interface HealthMetrics {
  success: boolean;
  timestamp: string;
  metrics: Record<string, number>;
  warnings: string[];
  errors: string[];
}

export type HealthTrend = 'stable' | 'improving' | 'degrading';

// ========== Parser Types ==========
export interface ParserFormat {
  version: string;
  strategy: string;
  characteristics: Record<string, any>;
}

export interface ParsingReport {
  filename: string;
  parsedAt: string;
  parserVersion: string;
  success: boolean;
  summary: Record<string, any>;
  issues: ValidationIssue[];
}

// ========== Config Types ==========
export interface LogLevel {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: Error) => void;
  debug: (message: string) => void;
}

// ========== Community Types ==========
export interface CommunityBase {
  id: string;
  name: string;
  description?: string;
  url?: string;
  verified?: boolean;
  lastChecked?: string;
  courseRelevance?: string[]; // Array of course codes
}

// ========== Data Processing Types ==========
export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface BatchProcessingOptions {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

// ========== Metadata Types ==========
export interface DataSourceMetadata {
  source: string;
  version?: string;
  extractedAt: string;
  processedAt?: string;
  recordCount?: number;
}