#!/usr/bin/env tsx

/**
 * Catalog Comparison Tool
 * 
 * Compares a new catalog with the most recent existing catalog
 * and generates a detailed diff report for PR descriptions.
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';

interface CatalogData {
  filename: string;
  date: string;
  courses: Record<string, any>;
  degreePlans: Record<string, any>;
  metadata?: {
    totalCourses?: number;
    totalDegreePlans?: number;
    coursesWithCCN?: number;
    [key: string]: any;
  };
}

interface ComparisonResult {
  summary: {
    newCatalog: string;
    previousCatalog: string;
    dateRange: string;
  };
  courses: {
    added: string[];
    removed: string[];
    modified: string[];
    totalNew: number;
    totalPrevious: number;
    totalChange: number;
  };
  degreePlans: {
    added: string[];
    removed: string[];
    modified: string[];
    totalNew: number;
    totalPrevious: number;
    totalChange: number;
  };
  metadata: {
    ccnCoverage: {
      new: number;
      previous: number;
      change: number;
    };
  };
  significantChanges: string[];
}

/**
 * Parse catalog filename to extract date
 */
function parseFilenameDate(filename: string): Date | null {
  // catalog-2025-08.pdf -> 2025-08
  const numericMatch = filename.match(/catalog-(\d{4})-(\d{2})\.pdf/);
  if (numericMatch) {
    return new Date(`${numericMatch[1]}-${numericMatch[2]}-01`);
  }

  // catalog-august2025.pdf -> 2025-08
  const monthMatch = filename.match(/catalog-(\w+)(\d{4})\.pdf/);
  if (monthMatch) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
                   'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = months.indexOf(monthMatch[1].toLowerCase());
    if (monthIndex >= 0) {
      return new Date(`${monthMatch[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`);
    }
  }

  // catalog-current-2025-08-09.pdf -> 2025-08-09
  const currentMatch = filename.match(/catalog-current-(\d{4})-(\d{2})-(\d{2})\.pdf/);
  if (currentMatch) {
    return new Date(`${currentMatch[1]}-${currentMatch[2]}-${currentMatch[3]}`);
  }

  return null;
}

/**
 * Load catalog data from parsed JSON
 */
async function loadCatalogData(filename: string): Promise<CatalogData | null> {
  const pdfName = filename.replace('.pdf', '');
  const jsonPath = resolve('./data/catalogs/historical/parsed', `${pdfName}.json`);
  
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    return {
      filename,
      date: parseFilenameDate(filename)?.toISOString() || 'unknown',
      courses: data.courses || {},
      degreePlans: data.degreePlans || {},
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.warn(`Could not load parsed data for ${filename}: ${error}`);
    return null;
  }
}

/**
 * Find the most recent catalog before the new ones
 */
async function findMostRecentCatalog(excludeFiles: string[]): Promise<string | null> {
  const catalogDir = './data/catalogs/historical/pdfs';
  const files = await fs.readdir(catalogDir);
  
  const catalogFiles = files
    .filter(f => f.endsWith('.pdf'))
    .filter(f => !excludeFiles.includes(f))
    .map(f => ({
      filename: f,
      date: parseFilenameDate(f)
    }))
    .filter(f => f.date !== null)
    .sort((a, b) => b.date!.getTime() - a.date!.getTime());

  return catalogFiles.length > 0 ? catalogFiles[0].filename : null;
}

/**
 * Compare two catalog datasets
 */
function compareCatalogs(newCatalog: CatalogData, previousCatalog: CatalogData): ComparisonResult {
  // Course comparison
  const newCourses = new Set(Object.keys(newCatalog.courses));
  const previousCourses = new Set(Object.keys(previousCatalog.courses));
  
  const coursesAdded = Array.from(newCourses).filter(c => !previousCourses.has(c));
  const coursesRemoved = Array.from(previousCourses).filter(c => !newCourses.has(c));
  const coursesModified: string[] = [];
  
  // Check for modified courses
  for (const courseCode of newCourses) {
    if (previousCourses.has(courseCode)) {
      const newCourse = newCatalog.courses[courseCode];
      const prevCourse = previousCatalog.courses[courseCode];
      
      if (JSON.stringify(newCourse) !== JSON.stringify(prevCourse)) {
        coursesModified.push(courseCode);
      }
    }
  }

  // Degree plan comparison
  const newPlans = new Set(Object.keys(newCatalog.degreePlans));
  const previousPlans = new Set(Object.keys(previousCatalog.degreePlans));
  
  const plansAdded = Array.from(newPlans).filter(p => !previousPlans.has(p));
  const plansRemoved = Array.from(previousPlans).filter(p => !newPlans.has(p));
  const plansModified: string[] = [];
  
  // Check for modified degree plans
  for (const planId of newPlans) {
    if (previousPlans.has(planId)) {
      const newPlan = newCatalog.degreePlans[planId];
      const prevPlan = previousCatalog.degreePlans[planId];
      
      if (JSON.stringify(newPlan) !== JSON.stringify(prevPlan)) {
        plansModified.push(planId);
      }
    }
  }

  // Metadata comparison
  const newCCNCount = Object.values(newCatalog.courses).filter((c: any) => c.ccn).length;
  const prevCCNCount = Object.values(previousCatalog.courses).filter((c: any) => c.ccn).length;
  const newCCNPercentage = newCourses.size > 0 ? (newCCNCount / newCourses.size) * 100 : 0;
  const prevCCNPercentage = previousCourses.size > 0 ? (prevCCNCount / previousCourses.size) * 100 : 0;

  // Detect significant changes
  const significantChanges: string[] = [];
  
  if (coursesAdded.length > 5) {
    significantChanges.push(`🆕 ${coursesAdded.length} new courses added`);
  }
  if (coursesRemoved.length > 5) {
    significantChanges.push(`🗑️ ${coursesRemoved.length} courses removed`);
  }
  if (plansAdded.length > 0) {
    significantChanges.push(`🎓 ${plansAdded.length} new degree plan(s) added`);
  }
  if (plansRemoved.length > 0) {
    significantChanges.push(`📚 ${plansRemoved.length} degree plan(s) removed`);
  }
  if (Math.abs(newCCNPercentage - prevCCNPercentage) > 5) {
    significantChanges.push(`📊 CCN coverage changed by ${(newCCNPercentage - prevCCNPercentage).toFixed(1)}%`);
  }

  return {
    summary: {
      newCatalog: newCatalog.filename,
      previousCatalog: previousCatalog.filename,
      dateRange: `${parseFilenameDate(previousCatalog.filename)?.toISOString().split('T')[0]} → ${parseFilenameDate(newCatalog.filename)?.toISOString().split('T')[0]}`
    },
    courses: {
      added: coursesAdded,
      removed: coursesRemoved,
      modified: coursesModified,
      totalNew: newCourses.size,
      totalPrevious: previousCourses.size,
      totalChange: newCourses.size - previousCourses.size
    },
    degreePlans: {
      added: plansAdded,
      removed: plansRemoved,
      modified: plansModified,
      totalNew: newPlans.size,
      totalPrevious: previousPlans.size,
      totalChange: newPlans.size - previousPlans.size
    },
    metadata: {
      ccnCoverage: {
        new: Math.round(newCCNPercentage),
        previous: Math.round(prevCCNPercentage),
        change: Math.round(newCCNPercentage - prevCCNPercentage)
      }
    },
    significantChanges
  };
}

/**
 * Generate markdown comparison report
 */
function generateComparisonMarkdown(comparison: ComparisonResult): string {
  const { summary, courses, degreePlans, metadata, significantChanges } = comparison;
  
  let markdown = `### 📊 Catalog Comparison Report\n\n`;
  markdown += `**Period:** ${summary.dateRange}\n`;
  markdown += `**Previous:** \`${summary.previousCatalog}\`\n`;
  markdown += `**New:** \`${summary.newCatalog}\`\n\n`;

  // Significant changes highlight
  if (significantChanges.length > 0) {
    markdown += `#### 🎯 Significant Changes\n`;
    significantChanges.forEach(change => {
      markdown += `- ${change}\n`;
    });
    markdown += `\n`;
  }

  // Course changes
  markdown += `#### 📚 Course Changes\n`;
  markdown += `| Metric | Previous | New | Change |\n`;
  markdown += `|--------|----------|-----|--------|\n`;
  markdown += `| Total Courses | ${courses.totalPrevious} | ${courses.totalNew} | ${courses.totalChange >= 0 ? '+' : ''}${courses.totalChange} |\n`;
  markdown += `| CCN Coverage | ${metadata.ccnCoverage.previous}% | ${metadata.ccnCoverage.new}% | ${metadata.ccnCoverage.change >= 0 ? '+' : ''}${metadata.ccnCoverage.change}% |\n\n`;

  if (courses.added.length > 0) {
    markdown += `**🆕 New Courses (${courses.added.length}):**\n`;
    if (courses.added.length <= 10) {
      markdown += courses.added.map(c => `- \`${c}\``).join('\n') + '\n\n';
    } else {
      markdown += courses.added.slice(0, 10).map(c => `- \`${c}\``).join('\n');
      markdown += `\n- ... and ${courses.added.length - 10} more\n\n`;
    }
  }

  if (courses.removed.length > 0) {
    markdown += `**🗑️ Removed Courses (${courses.removed.length}):**\n`;
    if (courses.removed.length <= 10) {
      markdown += courses.removed.map(c => `- \`${c}\``).join('\n') + '\n\n';
    } else {
      markdown += courses.removed.slice(0, 10).map(c => `- \`${c}\``).join('\n');
      markdown += `\n- ... and ${courses.removed.length - 10} more\n\n`;
    }
  }

  if (courses.modified.length > 0) {
    markdown += `**✏️ Modified Courses (${courses.modified.length}):**\n`;
    if (courses.modified.length <= 10) {
      markdown += courses.modified.map(c => `- \`${c}\``).join('\n') + '\n\n';
    } else {
      markdown += courses.modified.slice(0, 10).map(c => `- \`${c}\``).join('\n');
      markdown += `\n- ... and ${courses.modified.length - 10} more\n\n`;
    }
  }

  // Degree plan changes
  markdown += `#### 🎓 Degree Plan Changes\n`;
  markdown += `| Metric | Previous | New | Change |\n`;
  markdown += `|--------|----------|-----|--------|\n`;
  markdown += `| Total Plans | ${degreePlans.totalPrevious} | ${degreePlans.totalNew} | ${degreePlans.totalChange >= 0 ? '+' : ''}${degreePlans.totalChange} |\n\n`;

  if (degreePlans.added.length > 0) {
    markdown += `**🆕 New Degree Plans (${degreePlans.added.length}):**\n`;
    markdown += degreePlans.added.map(p => `- \`${p}\``).join('\n') + '\n\n';
  }

  if (degreePlans.removed.length > 0) {
    markdown += `**🗑️ Removed Degree Plans (${degreePlans.removed.length}):**\n`;
    markdown += degreePlans.removed.map(p => `- \`${p}\``).join('\n') + '\n\n';
  }

  if (degreePlans.modified.length > 0) {
    markdown += `**✏️ Modified Degree Plans (${degreePlans.modified.length}):**\n`;
    markdown += degreePlans.modified.map(p => `- \`${p}\``).join('\n') + '\n\n';
  }

  // Summary
  if (courses.added.length === 0 && courses.removed.length === 0 && 
      degreePlans.added.length === 0 && degreePlans.removed.length === 0 &&
      courses.modified.length === 0 && degreePlans.modified.length === 0) {
    markdown += `#### ✅ No Structural Changes\n`;
    markdown += `The new catalog appears to contain the same courses and degree plans as the previous version. Changes may be limited to course descriptions, requirements, or other metadata.\n\n`;
  }

  return markdown;
}

/**
 * Main comparison function
 */
async function compareCatalogWithPrevious(newCatalogFiles: string[]): Promise<string> {
  console.log('📊 Generating catalog comparison...');
  
  if (newCatalogFiles.length === 0) {
    return '';
  }

  // For now, compare the first new catalog with the most recent existing one
  const newCatalogFile = newCatalogFiles[0];
  console.log(`🆕 New catalog: ${newCatalogFile}`);

  const previousCatalogFile = await findMostRecentCatalog(newCatalogFiles);
  if (!previousCatalogFile) {
    console.log('⚠️ No previous catalog found for comparison');
    return `### 📊 Catalog Comparison\n\n⚠️ No previous catalog available for comparison. This appears to be the first catalog in the collection.\n\n`;
  }

  console.log(`📋 Previous catalog: ${previousCatalogFile}`);

  // Load catalog data
  const newCatalog = await loadCatalogData(newCatalogFile);
  const previousCatalog = await loadCatalogData(previousCatalogFile);

  if (!newCatalog || !previousCatalog) {
    console.log('❌ Could not load catalog data for comparison');
    return `### 📊 Catalog Comparison\n\n❌ Could not load parsed catalog data for comparison. Catalogs may need to be processed first.\n\n`;
  }

  // Perform comparison
  const comparison = compareCatalogs(newCatalog, previousCatalog);
  
  // Generate markdown report
  const report = generateComparisonMarkdown(comparison);
  
  console.log('✅ Catalog comparison completed');
  return report;
}

// Export for use in other scripts
export { compareCatalogWithPrevious };

// CLI interface
async function main() {
  const newCatalogs = process.argv.slice(2);
  if (newCatalogs.length === 0) {
    console.error('Usage: tsx compare-catalogs.ts <new-catalog-file> [additional-files...]');
    process.exit(1);
  }

  try {
    const report = await compareCatalogWithPrevious(newCatalogs);
    console.log('\n' + report);
  } catch (error) {
    console.error('❌ Error generating comparison:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
