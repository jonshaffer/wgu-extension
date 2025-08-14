/**
 * Analytics Types
 * 
 * Type definitions for health monitoring and analytics
 */

import { ValidationIssue } from './common';

// ========== Parser Health Types ==========
export interface ParserHealthMetrics {
  filename: string;
  parsedAt: string;
  parserVersion: string;
  success: boolean;
  metrics: {
    // Coverage metrics
    coursesFound: number;
    coursesWithCCN: number;
    coursesWithDescription: number;
    coursesWithCUs: number;
    ccnCoverage: number;          // percentage
    descriptionCoverage: number;  // percentage
    
    // Quality metrics
    avgDescriptionLength: number;
    shortDescriptions: number;    // < 50 chars
    missingFromDegreePlans: number;
    
    // Performance metrics
    parseTimeMs: number;
    pdfPages: number;
    coursesPerPage: number;
    memoryUsedMB?: number;
  };
  warnings: string[];
  errors: string[];
}

export interface HealthTrend {
  metric: string;
  trend: 'stable' | 'improving' | 'degrading';
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

export interface HealthAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  metric?: string;
  threshold?: number;
  actualValue?: number;
  timestamp: string;
}

// ========== Parsing Report Types ==========
export interface ParsingReport {
  filename: string;
  parsedAt: string;
  parserVersion: string;
  summary: {
    totalCourses: number;
    totalDegreePlans: number;
    totalStandaloneCourses?: number;
    totalCertificates?: number;
    processingTimeMs: number;
    memoryPeakMB?: number;
  };
  format: {
    detected: string;
    confidence: number;
    fallback?: boolean;
  };
  coverage: {
    ccn: { found: number; missing: number; percentage: number };
    descriptions: { found: number; missing: number; percentage: number };
    competencyUnits: { found: number; missing: number; percentage: number };
  };
  dataQuality: {
    duplicateCourses: string[];
    invalidCourseCodes: string[];
    shortDescriptions: Array<{ code: string; length: number }>;
    missingFromPlans: string[];
    orphanedCourses: string[];
  };
  validationIssues: ValidationIssue[];
  performanceMetrics: {
    steps: Record<string, number>;  // Step name -> duration in ms
    totalTimeMs: number;
    peakMemoryMB?: number;
  };
}

// ========== Monitoring Config Types ==========
export interface MonitoringConfig {
  enableHealthChecks: boolean;
  healthCheckIntervalMs: number;
  enableMetrics: boolean;
  metricsRetentionDays: number;
  alerting: {
    enabled: boolean;
    thresholds: {
      ccnCoverage: number;        // Alert if drops below %
      descriptionCoverage: number;
      parseTimeMs: number;        // Alert if exceeds ms
      errorCount: number;         // Alert if exceeds count
    };
    notificationChannels?: string[];
  };
  reporting: {
    generateAfterParse: boolean;
    includeDetailedStats: boolean;
    outputFormat: 'json' | 'html' | 'both';
  };
}

// ========== Aggregate Analytics Types ==========
export interface CatalogParsingHistory {
  catalogFile: string;
  history: ParserHealthMetrics[];
  trends: HealthTrend[];
  alerts: HealthAlert[];
  lastUpdated: string;
}

export interface ParserPerformanceStats {
  averageParseTimeMs: number;
  medianParseTimeMs: number;
  maxParseTimeMs: number;
  minParseTimeMs: number;
  totalParses: number;
  successRate: number;
  byVersion: Record<string, {
    count: number;
    avgTimeMs: number;
    successRate: number;
  }>;
}