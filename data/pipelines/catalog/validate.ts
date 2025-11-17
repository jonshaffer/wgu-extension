#!/usr/bin/env tsx

/**
 * Catalog Data Validator
 * 
 * Validates parsed catalog data for quality and completeness
 */

import fs from 'fs/promises';
import path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalCourses: number;
    coursesWithAllFields: number;
    coursesWithCCN: number;
    coursesWithDescription: number;
    avgDescriptionLength: number;
  };
}

async function validateCatalogData(filePath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Check required structure
    if (!data.courses || typeof data.courses !== 'object') {
      errors.push('Missing or invalid courses object');
    }
    
    if (!data.metadata) {
      warnings.push('Missing metadata');
    }
    
    // Analyze courses
    const courses = Object.values(data.courses || {}) as any[];
    let coursesWithAllFields = 0;
    let coursesWithCCN = 0;
    let coursesWithDescription = 0;
    let totalDescLength = 0;
    
    courses.forEach((course, index) => {
      // Required fields
      if (!course.courseCode) {
        errors.push(`Course at index ${index} missing courseCode`);
      }
      if (!course.courseName) {
        errors.push(`Course ${course.courseCode || index} missing courseName`);
      }
      
      // Track completeness
      if (course.courseCode && course.courseName && course.description && course.ccn) {
        coursesWithAllFields++;
      }
      
      if (course.ccn) coursesWithCCN++;
      
      if (course.description) {
        coursesWithDescription++;
        totalDescLength += course.description.length;
        
        // Warn about short descriptions
        if (course.description.length < 50) {
          warnings.push(`Course ${course.courseCode} has very short description (${course.description.length} chars)`);
        }
      }
    });
    
    const avgDescriptionLength = coursesWithDescription > 0 
      ? Math.round(totalDescLength / coursesWithDescription)
      : 0;
    
    // Quality checks
    const ccnCoverage = (coursesWithCCN / courses.length) * 100;
    if (ccnCoverage < 80) {
      warnings.push(`Low CCN coverage: ${ccnCoverage.toFixed(1)}%`);
    }
    
    const descCoverage = (coursesWithDescription / courses.length) * 100;
    if (descCoverage < 90) {
      warnings.push(`Low description coverage: ${descCoverage.toFixed(1)}%`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalCourses: courses.length,
        coursesWithAllFields,
        coursesWithCCN,
        coursesWithDescription,
        avgDescriptionLength
      }
    };
    
  } catch (error) {
    errors.push(`Failed to read/parse file: ${error}`);
    return {
      valid: false,
      errors,
      warnings,
      stats: {
        totalCourses: 0,
        coursesWithAllFields: 0,
        coursesWithCCN: 0,
        coursesWithDescription: 0,
        avgDescriptionLength: 0
      }
    };
  }
}

async function main() {
  console.log('📚 Validating catalog data...\n');
  
  // Find all parsed catalog files
  const parsedDir = path.join(process.cwd(), 'sources/catalogs');
  let files: string[] = [];
  
  try {
    files = await fs.readdir(parsedDir);
    files = files.filter(f => f.endsWith('.json') && !f.includes('.report.'));
  } catch {
    console.log('⚠️  No parsed catalogs found in sources/catalogs/');
    console.log('   Run catalog parsing first: make parse-latest');
    process.exit(1);
  }
  
  let allValid = true;
  
  for (const file of files) {
    console.log(`\n📄 Validating ${file}`);
    console.log('─'.repeat(50));
    
    const result = await validateCatalogData(path.join(parsedDir, file));
    
    if (!result.valid) {
      allValid = false;
      console.log('❌ Validation FAILED');
      result.errors.forEach(err => console.log(`   ERROR: ${err}`));
    } else {
      console.log('✅ Validation PASSED');
    }
    
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    
    console.log('📊 Statistics:');
    console.log(`   Total courses: ${result.stats.totalCourses}`);
    console.log(`   Complete records: ${result.stats.coursesWithAllFields}`);
    console.log(`   CCN coverage: ${(result.stats.coursesWithCCN / result.stats.totalCourses * 100).toFixed(1)}%`);
    console.log(`   Avg description: ${result.stats.avgDescriptionLength} chars`);
  }
  
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All catalogs validated successfully!');
  } else {
    console.log('❌ Some catalogs failed validation');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateCatalogData };
export type { ValidationResult };