/**
 * Unified Catalog Parsing Reporting Library
 * 
 * Combines analysis and reporting functionality for catalog parsing results.
 * Provides both detailed analytics and README generation capabilities.
 */

import fs from 'fs/promises';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { config as appConfig } from './config.js';

// Enhanced interface that supports both legacy and new parser data
export interface ParsedCatalogData {
  courses: Record<string, any>;
  degreePlans: Record<string, any>;
  standaloneCourses?: Record<string, any>;
  certificatePrograms?: Record<string, any>;
  programOutcomes?: Record<string, any>;
  courseBundles?: any[];
  metadata?: {
    catalogDate: string;
    parserVersion: string;
    parsedAt: string;
    totalPages: number;
    parsingTimeMs: number;
    pdf?: {
      title?: string;
      version?: string;
      pages: number;
    };
    statistics: {
      coursesFound: number;
      degreePlansFound: number;
      standaloneCourses?: number;
      certificatePrograms?: number;
      programOutcomes?: number;
      ccnCoverage: number;
      cuCoverage: number;
    };
  };
}

export interface YearStats {
  catalogs: number;
  totalCourses: number;
  totalPlans: number;
  coursesWithCCN: number;
  coursesWithCU: number;
  avgProcessingTime: number;
  successRate: number;
  // Enhanced stats
  totalStandaloneCourses: number;
  totalCertificates: number;
  totalProgramOutcomes: number;
  enhancedParsers: number;
}

export interface OverallStats {
  totalCatalogs: number;
  totalCourses: number;
  totalPlans: number;
  coursesWithCCN: number;
  coursesWithCU: number;
  catalogsWithCourses: number;
  catalogsWithPlans: number;
  uniqueCourses: Set<string>;
  // Enhanced stats
  totalStandaloneCourses: number;
  totalCertificates: number;
  totalProgramOutcomes: number;
  enhancedCatalogs: number;
  courseFormats: {
    withDescription: number;
    withCCN: number;
    withCompetencyUnits: number;
    complete: number;
  };
}

export class CatalogReporter {
  private parsedDir: string;
  
  constructor() {
    this.parsedDir = appConfig.getConfig().paths.parsedDirectory;
  }

  /**
   * Get all parsed catalog files
   */
  private getParsedFiles(): string[] {
    return readdirSync(this.parsedDir)
      .filter(f => f.endsWith('.json') && !['courses.json', 'degree-programs.json'].includes(f))
      .sort();
  }

  /**
   * Load and parse a catalog file
   */
  private loadCatalogData(filePath: string): ParsedCatalogData | null {
    try {
      const raw = readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as ParsedCatalogData;
    } catch (error) {
      console.warn(`⚠️  Could not load ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Generate comprehensive parsing analytics
   */
  public async generateAnalytics(): Promise<{
    yearStats: Record<string, YearStats>;
    overallStats: OverallStats;
    files: string[];
  }> {
    const files = this.getParsedFiles();
    const yearStats: Record<string, YearStats> = {};
    
    const overallStats: OverallStats = {
      totalCatalogs: 0,
      totalCourses: 0,
      totalPlans: 0,
      coursesWithCCN: 0,
      coursesWithCU: 0,
      catalogsWithCourses: 0,
      catalogsWithPlans: 0,
      uniqueCourses: new Set<string>(),
      totalStandaloneCourses: 0,
      totalCertificates: 0,
      totalProgramOutcomes: 0,
      enhancedCatalogs: 0,
      courseFormats: {
        withDescription: 0,
        withCCN: 0,
        withCompetencyUnits: 0,
        complete: 0
      }
    };

    for (const file of files) {
      const filePath = path.join(this.parsedDir, file);
      const data = this.loadCatalogData(filePath);
      if (!data) continue;

      const yearMatch = file.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : 'unknown';
      
      if (!yearStats[year]) {
        yearStats[year] = {
          catalogs: 0,
          totalCourses: 0,
          totalPlans: 0,
          coursesWithCCN: 0,
          coursesWithCU: 0,
          avgProcessingTime: 0,
          successRate: 0,
          totalStandaloneCourses: 0,
          totalCertificates: 0,
          totalProgramOutcomes: 0,
          enhancedParsers: 0
        };
      }

      const courses = Object.values(data.courses || {});
      const plans = Object.values(data.degreePlans || {});
      
      // Check if this is an enhanced parser
      const isEnhanced = data.metadata?.parserVersion?.includes('-enhanced') || 
                        data.standaloneCourses || data.certificatePrograms || data.programOutcomes;
      
      yearStats[year].catalogs++;
      yearStats[year].totalCourses += courses.length;
      yearStats[year].totalPlans += plans.length;
      
      if (isEnhanced) {
        yearStats[year].enhancedParsers++;
        overallStats.enhancedCatalogs++;
      }

      // Enhanced data tracking
      if (data.standaloneCourses) {
        const standaloneCount = Object.keys(data.standaloneCourses).length;
        yearStats[year].totalStandaloneCourses += standaloneCount;
        overallStats.totalStandaloneCourses += standaloneCount;
      }

      if (data.certificatePrograms) {
        const certCount = Object.keys(data.certificatePrograms).length;
        yearStats[year].totalCertificates += certCount;
        overallStats.totalCertificates += certCount;
      }

      if (data.programOutcomes) {
        const outcomeCount = Object.keys(data.programOutcomes).length;
        yearStats[year].totalProgramOutcomes += outcomeCount;
        overallStats.totalProgramOutcomes += outcomeCount;
      }

      // Analyze course quality
      courses.forEach((course: any) => {
        overallStats.uniqueCourses.add(course.courseCode);
        
        if (course.ccn) {
          yearStats[year].coursesWithCCN++;
          overallStats.coursesWithCCN++;
          overallStats.courseFormats.withCCN++;
        }
        
        if (course.competencyUnits || course.totalCUs) {
          yearStats[year].coursesWithCU++;
          overallStats.coursesWithCU++;
          overallStats.courseFormats.withCompetencyUnits++;
        }
        
        if (course.description && course.description.length > 30) {
          overallStats.courseFormats.withDescription++;
        }
        
        if (course.courseCode && course.courseName && 
            course.description && course.description.length > 30) {
          overallStats.courseFormats.complete++;
        }
      });
      
      overallStats.totalCatalogs++;
      overallStats.totalCourses += courses.length;
      overallStats.totalPlans += plans.length;
      
      if (courses.length > 0) overallStats.catalogsWithCourses++;
      if (plans.length > 0) overallStats.catalogsWithPlans++;
    }

    return { yearStats, overallStats, files };
  }

  /**
   * Generate detailed console analytics report
   */
  public async printAnalyticsReport(): Promise<void> {
    console.log('🔍 Analyzing Current Parsing State');
    console.log('='.repeat(60));
    
    const { yearStats, overallStats, files } = await this.generateAnalytics();
    
    console.log(`📁 Found ${files.length} parsed catalog files\n`);
    
    // Display year-by-year stats
    const years = Object.keys(yearStats).sort();
    console.log('📊 Year-by-Year Analysis:');
    console.log('-'.repeat(90));
    console.log('Year | Catalogs | Courses | Plans | CCN% | CU% | Enhanced | Outcomes | Certs');
    console.log('-'.repeat(90));
    
    for (const year of years) {
      const stats = yearStats[year];
      const ccnPercent = stats.totalCourses > 0 ? Math.round((stats.coursesWithCCN / stats.totalCourses) * 100) : 0;
      const cuPercent = stats.totalCourses > 0 ? Math.round((stats.coursesWithCU / stats.totalCourses) * 100) : 0;
      
      console.log(
        `${year} | ${String(stats.catalogs).padStart(8)} | ${String(stats.totalCourses).padStart(7)} | ${String(stats.totalPlans).padStart(5)} | ${String(ccnPercent).padStart(3)}% | ${String(cuPercent).padStart(2)}% | ${String(stats.enhancedParsers).padStart(8)} | ${String(stats.totalProgramOutcomes).padStart(8)} | ${String(stats.totalCertificates).padStart(5)}`
      );
    }
    
    console.log('-'.repeat(90));
    
    // Overall summary
    console.log('\n📈 Overall Statistics:');
    console.log('-'.repeat(50));
    console.log(`📚 Total Catalogs: ${overallStats.totalCatalogs}`);
    console.log(`🎓 Total Courses: ${overallStats.totalCourses}`);
    console.log(`📋 Unique Courses: ${overallStats.uniqueCourses.size}`);
    console.log(`🏫 Degree Plans: ${overallStats.totalPlans}`);
    console.log(`🏆 Program Outcomes: ${overallStats.totalProgramOutcomes} (NEW!)`);
    console.log(`📜 Certificate Programs: ${overallStats.totalCertificates}`);
    console.log(`📖 Standalone Courses: ${overallStats.totalStandaloneCourses}`);
    console.log(`⚡ Enhanced Catalogs: ${overallStats.enhancedCatalogs}/${overallStats.totalCatalogs}`);
    
    const ccnCoverage = overallStats.totalCourses > 0 ? Math.round((overallStats.coursesWithCCN / overallStats.totalCourses) * 100) : 0;
    const cuCoverage = overallStats.totalCourses > 0 ? Math.round((overallStats.coursesWithCU / overallStats.totalCourses) * 100) : 0;
    const completenessPct = overallStats.totalCourses > 0 ? Math.round((overallStats.courseFormats.complete / overallStats.totalCourses) * 100) : 0;
    
    console.log(`\n📊 Quality Metrics:`);
    console.log(`CCN Coverage: ${ccnCoverage}%`);
    console.log(`CU Coverage: ${cuCoverage}%`);
    console.log(`Complete Course Records: ${completenessPct}%`);
    console.log(`Catalogs with Courses: ${overallStats.catalogsWithCourses}/${overallStats.totalCatalogs}`);
    console.log(`Catalogs with Degree Plans: ${overallStats.catalogsWithPlans}/${overallStats.totalCatalogs}`);
  }

  /**
   * Shorten parser version names for better table formatting
   */
  private shortenParser(version: string): string {
    return version
      .replace('v2.1-current-enhanced', 'v2.1-enh')
      .replace('v2.1-current', 'v2.1')
      .replace('-enhanced', '-enh')
      .replace('v2.0-', 'v2.0-')
      .substring(0, 12); // Limit to 12 chars max
  }

  /**
   * Generate README table for the most recent catalogs
   */
  public async generateReadmeTable(limit: number = 20): Promise<string> {
    const files = this.getParsedFiles();
    const rows: Array<{ name: string; meta: ParsedCatalogData['metadata']; file: string }> = [];

    for (const f of files) {
      const filePath = path.join(this.parsedDir, f);
      const data = this.loadCatalogData(filePath);
      if (!data?.metadata) continue;
      rows.push({ name: f, meta: data.metadata, file: f });
    }

    if (!rows.length) {
      return '| File | Status |\n|------|--------|\n| No catalogs | Run parser first |';
    }

    // Sort newest first by parsedAt if present, else by name
    rows.sort((a, b) => {
      const da = Date.parse(a.meta?.parsedAt || '');
      const db = Date.parse(b.meta?.parsedAt || '');
      if (!isNaN(da) && !isNaN(db)) return db - da;
      return b.name.localeCompare(a.name);
    });

    const limitedRows = rows.slice(0, limit);
    
    const header = `| File | Date | Pages | Courses | Plans | Outcomes | Certs | CCN% | CU% | Parser | Enhanced |
|------|------|-------|---------|-------|----------|-------|------:|----:|--------|----------|`;

    const lines = limitedRows.map(({ name, meta }) => {
      const pdf = meta?.pdf || ({ pages: meta?.totalPages } as ParsedCatalogData['metadata']['pdf']);
      const stats = meta?.statistics || { coursesFound: 0, degreePlansFound: 0, ccnCoverage: 0, cuCoverage: 0 };
      const outcomes = stats.programOutcomes || 0;
      const certs = stats.certificatePrograms || 0;
      const enhanced = meta?.parserVersion?.includes('-enhanced') || outcomes > 0 || certs > 0 ? '✅' : '';
      
      // Add quality alerts for low coverage
      const ccnAlert = stats.ccnCoverage < 90 ? '⚠️' : '';
      const cuAlert = stats.cuCoverage < 60 ? '⚠️' : '';
      
      const parserVersion = this.shortenParser(meta?.parserVersion || '');
      
      return `| ${name} | ${meta?.catalogDate || ''} | ${meta?.totalPages || 0} | ${stats.coursesFound} | ${stats.degreePlansFound} | ${outcomes} | ${certs} | ${stats.ccnCoverage}%${ccnAlert} | ${stats.cuCoverage}%${cuAlert} | ${parserVersion} | ${enhanced} |`;
    });

    return [header, ...lines].join('\n');
  }

  /**
   * Update README.md with parsing results
   */
  public async updateReadme(): Promise<void> {
    // Get README path relative to the catalogs directory
    const readmePath = path.join(path.dirname(this.parsedDir), 'README.md');
    let content = await fs.readFile(readmePath, 'utf-8');
    
    const table = await this.generateReadmeTable();
    const { overallStats } = await this.generateAnalytics();
    
    const ccnCoverage = overallStats.totalCourses > 0 ? Math.round((overallStats.coursesWithCCN / overallStats.totalCourses) * 100) : 0;
    const cuCoverage = overallStats.totalCourses > 0 ? Math.round((overallStats.coursesWithCU / overallStats.totalCourses) * 100) : 0;
    
    const newSection = `## Parsing Results

> 🚀 **Enhanced Parser**: Now extracts **program learning outcomes** and **certificate information** in addition to courses and degree plans.

### Recent Catalogs (Latest 20)

**Legend**: *Outcomes* = Program learning outcomes | *Certs* = Certificate programs | *Enhanced* = ✅ includes new parser features | ⚠️ = Quality alert

${table}

### Latest Enhancements ✨
- **Program Outcomes**: ${overallStats.totalProgramOutcomes} learning outcomes extracted from enhanced catalogs
- **Enhanced Course Codes**: Support for certificate-specific formats (PACA101, UTH, DCADA, etc.)
- **Quality Maintained**: ${ccnCoverage}% CCN coverage, ${cuCoverage}% CU coverage across all catalogs

### Summary Statistics
- **Total Catalogs**: ${overallStats.totalCatalogs} (2017-2025)
- **Total Courses**: ${overallStats.totalCourses.toLocaleString()}
- **Unique Courses**: ${overallStats.uniqueCourses.size.toLocaleString()}
- **Degree Plans**: ${overallStats.totalPlans.toLocaleString()}  
- **Program Outcomes**: ${overallStats.totalProgramOutcomes} ✨ *NEW*
- **Enhanced Catalogs**: ${overallStats.enhancedCatalogs}/${overallStats.totalCatalogs}

### Quality Metrics
- **CCN Coverage**: ${ccnCoverage}% ${ccnCoverage < 90 ? '⚠️' : '✅'} *(Target: ≥90%)*
- **CU Coverage**: ${cuCoverage}% ${cuCoverage < 60 ? '⚠️' : '✅'} *(Target: ≥60%)*
- **Complete Records**: ${Math.round((overallStats.courseFormats.complete / overallStats.totalCourses) * 100)}% *(Code + Name + Description)*

### Usage Examples
\`\`\`typescript
// Load enhanced catalog data
const catalog = JSON.parse(fs.readFileSync('parsed/catalog-2025-08.json'));

// Access program outcomes (NEW!)
const accountingOutcomes = catalog.programOutcomes['B.S. Accounting'];
console.log(accountingOutcomes.outcomes.length); // 5 learning outcomes

// Traditional course data (maintained)
const course = catalog.courses['C182'];
console.log(course.courseName, course.ccn, course.competencyUnits);
\`\`\`

*Updated: ${new Date().toISOString().split('T')[0]} | Enhanced Parser: v2.1-enh*
`;

    if (content.includes('## Parsing Results')) {
      const idx = content.indexOf('## Parsing Results');
      const tail = content.slice(idx);
      const nextIdx = tail.indexOf('\n## ');
      if (nextIdx > -1) {
        const before = content.slice(0, idx);
        const after = tail.slice(nextIdx + 1);
        content = before + newSection + '\n' + after;
      } else {
        content = content.slice(0, idx) + newSection;
      }
    } else {
      if (!content.endsWith('\n')) content += '\n';
      content += '\n' + newSection;
    }

    await fs.writeFile(readmePath, content);
    console.log('✅ README.md updated with parsing results');
  }

  /**
   * Utility to sanitize text for markdown tables
   */
  private sanitize(value?: string): string {
    if (!value) return '';
    return value.replace(/[\r\n|]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

// Export convenience functions
export async function generateAnalytics() {
  const reporter = new CatalogReporter();
  return await reporter.generateAnalytics();
}

export async function printAnalyticsReport() {
  const reporter = new CatalogReporter();
  return await reporter.printAnalyticsReport();
}

export async function updateReadme() {
  const reporter = new CatalogReporter();
  return await reporter.updateReadme();
}