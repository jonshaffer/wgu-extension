#!/usr/bin/env tsx
/**
 * Generate processed catalog data (courses and degree programs)
 * Outputs to catalogs/processed/ directory for DVC tracking
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateCoursesAggregate } from './lib/courses-aggregator.js';
import { generateDegreeProgramsAggregate } from './lib/degree-programs-aggregator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PARSED_DIR = resolve(__dirname, '../parsed');
const PROCESSED_DIR = resolve(__dirname, '../processed');

async function main() {
  console.log('📚 Generating processed catalog data...\n');

  // Generate courses.json
  console.log('🎓 Processing courses...');
  const coursesOutput = resolve(PROCESSED_DIR, 'courses.json');
  try {
    const coursesData = generateCoursesAggregate(PARSED_DIR, coursesOutput);
    console.log(`✅ Generated courses.json with ${coursesData.metadata.totalCourses} unique courses`);
    console.log(`   From ${coursesData.metadata.catalogVersionsIncluded.length} catalog versions`);
  } catch (error) {
    console.error('❌ Failed to generate courses:', error);
  }

  // Generate degree-programs.json
  console.log('\n📋 Processing degree programs...');
  const degreeProgramsOutput = resolve(PROCESSED_DIR, 'degree-programs.json');
  try {
    const programsData = generateDegreeProgramsAggregate(PARSED_DIR, degreeProgramsOutput);
    console.log(`✅ Generated degree-programs.json with ${programsData.metadata.totalPrograms} unique programs`);
    console.log(`   From ${programsData.metadata.catalogVersionsIncluded.length} catalog versions`);
  } catch (error) {
    console.error('❌ Failed to generate degree programs:', error);
  }

  console.log('\n✨ Done! Processed data saved to catalogs/processed/');
}

main().catch(console.error);