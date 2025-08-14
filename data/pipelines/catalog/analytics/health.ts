/**
 * Catalog Parser Health Analytics
 * 
 * Monitors parser performance and alerts on degradation.
 * Tracks metrics over time to detect when PDF format changes.
 */

import fs from 'fs/promises';
import path from 'path';

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
    ccnCoverage: number; // percentage
    descriptionCoverage: number; // percentage
    
    // Quality metrics
    avgDescriptionLength: number;
    shortDescriptions: number; // < 50 chars
    missingFromDegreePlans: number;
    
    // Performance metrics
    parseTimeMs: number;
    pdfPages: number;
    coursesPerPage: number;
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

export class ParserHealthAnalyzer {
  private historyDir: string;
  private alertThresholds = {
    ccnCoverage: 85, // Alert if CCN coverage drops below 85%
    descriptionCoverage: 90, // Alert if descriptions drop below 90%
    avgDescriptionLength: 100, // Alert if avg length < 100 chars
    parseTimeMs: 30000, // Alert if parsing takes > 30 seconds
  };

  constructor(historyDir: string = 'analytics/reports') {
    this.historyDir = historyDir;
  }

  /**
   * Analyze parsing results and generate health metrics
   */
  async analyzeParseResult(
    parsedCatalog: any,
    filename: string,
    parseTimeMs: number
  ): Promise<ParserHealthMetrics> {
    const courses = Object.values(parsedCatalog.courses || {}) as any[];
    const degreePlans = Object.values(parsedCatalog.degreePlans || {}) as any[];
    
    // Calculate coverage metrics
    const coursesWithCCN = courses.filter(c => c.ccn).length;
    const coursesWithDesc = courses.filter(c => c.description && c.description.length > 0).length;
    const coursesWithCUs = courses.filter(c => c.competencyUnits).length;
    
    // Calculate description quality
    const descLengths = courses
      .filter(c => c.description)
      .map(c => c.description.length);
    const avgDescLength = descLengths.length > 0 
      ? Math.round(descLengths.reduce((a, b) => a + b, 0) / descLengths.length)
      : 0;
    const shortDescs = descLengths.filter(len => len < 50).length;
    
    // Check degree plan coverage
    const allPlanCourses = new Set<string>();
    degreePlans.forEach(plan => {
      (plan.courses || []).forEach((code: string) => allPlanCourses.add(code));
    });
    const missingCourses = Array.from(allPlanCourses).filter(
      code => !parsedCatalog.courses[code]
    ).length;
    
    // Generate warnings
    const warnings = [];
    if (coursesWithCCN / courses.length * 100 < this.alertThresholds.ccnCoverage) {
      warnings.push(`Low CCN coverage: ${(coursesWithCCN / courses.length * 100).toFixed(1)}%`);
    }
    if (avgDescLength < this.alertThresholds.avgDescriptionLength) {
      warnings.push(`Short average description length: ${avgDescLength} chars`);
    }
    if (parseTimeMs > this.alertThresholds.parseTimeMs) {
      warnings.push(`Slow parse time: ${(parseTimeMs / 1000).toFixed(1)}s`);
    }
    if (missingCourses > 10) {
      warnings.push(`${missingCourses} courses referenced in degree plans but not found`);
    }
    
    const metrics: ParserHealthMetrics = {
      filename,
      parsedAt: new Date().toISOString(),
      parserVersion: parsedCatalog.metadata?.parserVersion || 'unknown',
      success: courses.length > 0,
      metrics: {
        coursesFound: courses.length,
        coursesWithCCN,
        coursesWithDescription: coursesWithDesc,
        coursesWithCUs,
        ccnCoverage: Math.round(coursesWithCCN / courses.length * 100),
        descriptionCoverage: Math.round(coursesWithDesc / courses.length * 100),
        avgDescriptionLength: avgDescLength,
        shortDescriptions: shortDescs,
        missingFromDegreePlans: missingCourses,
        parseTimeMs,
        pdfPages: parsedCatalog.metadata?.totalPages || 0,
        coursesPerPage: parsedCatalog.metadata?.totalPages 
          ? courses.length / parsedCatalog.metadata.totalPages 
          : 0
      },
      warnings,
      errors: []
    };
    
    // Save metrics
    await this.saveMetrics(metrics);
    
    return metrics;
  }

  /**
   * Compare with previous parsing to detect trends
   */
  async detectTrends(currentMetrics: ParserHealthMetrics): Promise<HealthTrend[]> {
    const history = await this.getHistory(currentMetrics.filename);
    if (history.length < 2) return [];
    
    const previous = history[history.length - 2];
    const trends: HealthTrend[] = [];
    
    // Check key metrics
    const metricsToCheck = [
      { key: 'ccnCoverage', name: 'CCN Coverage' },
      { key: 'descriptionCoverage', name: 'Description Coverage' },
      { key: 'avgDescriptionLength', name: 'Avg Description Length' },
      { key: 'coursesFound', name: 'Total Courses' }
    ];
    
    for (const { key, name } of metricsToCheck) {
      const current = (currentMetrics.metrics as any)[key];
      const prev = (previous.metrics as any)[key];
      const change = ((current - prev) / prev) * 100;
      
      let trend: 'stable' | 'improving' | 'degrading' = 'stable';
      if (Math.abs(change) < 1) {
        trend = 'stable';
      } else if (change > 0) {
        trend = key === 'shortDescriptions' ? 'degrading' : 'improving';
      } else {
        trend = key === 'shortDescriptions' ? 'improving' : 'degrading';
      }
      
      trends.push({
        metric: name,
        trend,
        currentValue: current,
        previousValue: prev,
        changePercent: change
      });
    }
    
    return trends;
  }

  /**
   * Generate alert if metrics are concerning
   */
  async checkAlerts(metrics: ParserHealthMetrics): Promise<string[]> {
    const alerts: string[] = [];
    const trends = await this.detectTrends(metrics);
    
    // Check absolute thresholds
    if (metrics.metrics.ccnCoverage < this.alertThresholds.ccnCoverage) {
      alerts.push(`🚨 CCN coverage critically low: ${metrics.metrics.ccnCoverage}%`);
    }
    
    // Check trends
    const degradingTrends = trends.filter(t => t.trend === 'degrading' && Math.abs(t.changePercent) > 5);
    for (const trend of degradingTrends) {
      alerts.push(`📉 ${trend.metric} degrading: ${trend.changePercent.toFixed(1)}% decrease`);
    }
    
    // Check for format changes
    const history = await this.getHistory(metrics.filename);
    if (history.length > 3) {
      const recentAvg = history.slice(-3).reduce((sum, h) => sum + h.metrics.coursesFound, 0) / 3;
      if (Math.abs(metrics.metrics.coursesFound - recentAvg) / recentAvg > 0.1) {
        alerts.push(`⚠️  Significant course count change detected - possible format change`);
      }
    }
    
    return alerts;
  }

  /**
   * Save metrics to history
   */
  private async saveMetrics(metrics: ParserHealthMetrics): Promise<void> {
    await fs.mkdir(this.historyDir, { recursive: true });
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `${path.basename(metrics.filename, '.pdf')}-${date}.json`;
    const filepath = path.join(this.historyDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(metrics, null, 2));
  }

  /**
   * Get parsing history for a catalog
   */
  private async getHistory(filename: string): Promise<ParserHealthMetrics[]> {
    try {
      const files = await fs.readdir(this.historyDir);
      const prefix = path.basename(filename, '.pdf');
      const historyFiles = files
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .sort();
      
      const history: ParserHealthMetrics[] = [];
      for (const file of historyFiles) {
        const content = await fs.readFile(path.join(this.historyDir, file), 'utf-8');
        history.push(JSON.parse(content));
      }
      
      return history;
    } catch {
      return [];
    }
  }

  /**
   * Generate health report
   */
  async generateReport(metrics: ParserHealthMetrics): Promise<string> {
    const trends = await this.detectTrends(metrics);
    const alerts = await this.checkAlerts(metrics);
    
    let report = `
# Parser Health Report
File: ${metrics.filename}
Date: ${new Date(metrics.parsedAt).toLocaleString()}
Parser: ${metrics.parserVersion}

## Metrics Summary
- Courses Found: ${metrics.metrics.coursesFound}
- CCN Coverage: ${metrics.metrics.ccnCoverage}%
- Description Coverage: ${metrics.metrics.descriptionCoverage}%
- Avg Description Length: ${metrics.metrics.avgDescriptionLength} chars
- Parse Time: ${(metrics.metrics.parseTimeMs / 1000).toFixed(1)}s

## Warnings (${metrics.warnings.length})
${metrics.warnings.map(w => `- ${w}`).join('\n') || 'None'}

## Trends
${trends.map(t => `- ${t.metric}: ${t.trend} (${t.changePercent.toFixed(1)}% change)`).join('\n') || 'No history available'}

## Alerts (${alerts.length})
${alerts.join('\n') || 'None'}
`;
    
    return report;
  }
}