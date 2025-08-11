#!/usr/bin/env npx tsx

import { readFileSync, readdirSync } from 'fs';
import path, { join, dirname } from 'path';
import { config as appConfig } from './lib/config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ParsedData {
  courses: Record<string, any>;
  degreePlans: Record<string, any>;
  metadata?: {
    statistics?: {
      coursesFound: number;
      degreePlansFound: number;
      ccnCoverage: number;
      cuCoverage: number;
    };
  };
}

async function analyzeParsingState() {
  console.log('🔍 Analyzing Current Parsing State');
  console.log('=' .repeat(60));
  
  // Get all parsed JSON files from configured parsed directory
  const parsedDir = appConfig.getConfig().paths.parsedDirectory;
  const files = readdirSync(parsedDir)
    .filter(f => f.endsWith('-parsed.json'))
    .sort();
  
  console.log(`📁 Found ${files.length} parsed catalog files\n`);
  
  // Track statistics by year
  const yearStats: Record<string, {
    catalogs: number;
    totalCourses: number;
    totalPlans: number;
    coursesWithCCN: number;
    coursesWithCU: number;
    avgProcessingTime: number;
    successRate: number;
  }> = {};
  
  let overallStats = {
    totalCatalogs: 0,
    totalCourses: 0,
    totalPlans: 0,
    coursesWithCCN: 0,
    coursesWithCU: 0,
    catalogsWithCourses: 0,
    catalogsWithPlans: 0,
    uniqueCourses: new Set<string>(),
    courseFormats: {
      withDescription: 0,
      withCCN: 0,
      withCompetencyUnits: 0,
      complete: 0  // has all fields
    }
  };
  
  console.log('📊 Analyzing by Year:');
  console.log('-'.repeat(80));
  
  for (const file of files) {
    try {
      const filePath = join(parsedDir, file);
      const data: ParsedData = JSON.parse(readFileSync(filePath, 'utf8'));
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
          successRate: 0
        };
      }
      
      const courses = Object.values(data.courses || {});
      const plans = Object.values(data.degreePlans || {});
      
      yearStats[year].catalogs++;
      yearStats[year].totalCourses += courses.length;
      yearStats[year].totalPlans += plans.length;
      
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
        
        // Complete course has code, name, and description
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
      
    } catch (error) {
      console.log(`❌ Error reading ${file}: ${error}`);
    }
  }
  
  // Display year-by-year stats
  const years = Object.keys(yearStats).sort();
  console.log('Year | Catalogs | Courses | Plans | CCN% | CU% | Avg Courses/Catalog');
  console.log('-'.repeat(80));
  
  for (const year of years) {
    const stats = yearStats[year];
    const ccnPercent = stats.totalCourses > 0 ? Math.round((stats.coursesWithCCN / stats.totalCourses) * 100) : 0;
    const cuPercent = stats.totalCourses > 0 ? Math.round((stats.coursesWithCU / stats.totalCourses) * 100) : 0;
    const avgCourses = Math.round(stats.totalCourses / stats.catalogs);
    
    console.log(
      `${year} | ${String(stats.catalogs).padStart(8)} | ${String(stats.totalCourses).padStart(7)} | ${String(stats.totalPlans).padStart(5)} | ${String(ccnPercent).padStart(3)}% | ${String(cuPercent).padStart(2)}% | ${String(avgCourses).padStart(15)}`
    );
  }
  
  console.log('-'.repeat(80));
  
  // Overall summary
  console.log('\n📈 OVERALL PARSING STATE SUMMARY');
  console.log('=' .repeat(60));
  console.log(`📁 Total Catalogs Processed: ${overallStats.totalCatalogs}`);
  console.log(`📚 Total Course Entries: ${overallStats.totalCourses.toLocaleString()}`);
  console.log(`🆔 Unique Course Codes: ${overallStats.uniqueCourses.size.toLocaleString()}`);
  console.log(`🎓 Total Degree Plans: ${overallStats.totalPlans}`);
  console.log();
  
  console.log('✅ SUCCESS RATES:');
  console.log(`   Catalogs with Courses: ${overallStats.catalogsWithCourses}/${overallStats.totalCatalogs} (${Math.round((overallStats.catalogsWithCourses/overallStats.totalCatalogs)*100)}%)`);
  console.log(`   Catalogs with Plans: ${overallStats.catalogsWithPlans}/${overallStats.totalCatalogs} (${Math.round((overallStats.catalogsWithPlans/overallStats.totalCatalogs)*100)}%)`);
  console.log();
  
  console.log('📊 COURSE DATA QUALITY:');
  const totalCourses = overallStats.totalCourses;
  console.log(`   Complete Courses: ${overallStats.courseFormats.complete.toLocaleString()}/${totalCourses.toLocaleString()} (${Math.round((overallStats.courseFormats.complete/totalCourses)*100)}%)`);
  console.log(`   With Descriptions: ${overallStats.courseFormats.withDescription.toLocaleString()}/${totalCourses.toLocaleString()} (${Math.round((overallStats.courseFormats.withDescription/totalCourses)*100)}%)`);
  console.log(`   With CCN Numbers: ${overallStats.courseFormats.withCCN.toLocaleString()}/${totalCourses.toLocaleString()} (${Math.round((overallStats.courseFormats.withCCN/totalCourses)*100)}%)`);
  console.log(`   With Credit Units: ${overallStats.courseFormats.withCompetencyUnits.toLocaleString()}/${totalCourses.toLocaleString()} (${Math.round((overallStats.courseFormats.withCompetencyUnits/totalCourses)*100)}%)`);
  console.log();
  
  // Sample some recent courses to show quality
  console.log('🔍 RECENT COURSE SAMPLE QUALITY:');
  const recentFile = files.find(f => f.includes('2024-december')) || files[files.length - 1];
  if (recentFile) {
    const recentFilePath = join(parsedDir, recentFile);
    const recentData: ParsedData = JSON.parse(readFileSync(recentFilePath, 'utf8'));
    const sampleCourses = Object.values(recentData.courses).slice(0, 3);
    
    console.log(`   From: ${recentFile}`);
    sampleCourses.forEach((course: any, i) => {
      console.log(`   ${i + 1}. ${course.courseCode} - ${course.courseName}`);
      if (course.ccn) console.log(`      CCN: ${course.ccn}`);
      if (course.description) console.log(`      Desc: ${course.description.substring(0, 80)}...`);
      if (course.competencyUnits) console.log(`      CUs: ${course.competencyUnits}`);
    });
  }
  
  console.log('\n🎓 DEGREE PLAN SAMPLE QUALITY:');
  if (recentFile) {
    const recentFilePath = join(parsedDir, recentFile);
    const recentData: ParsedData = JSON.parse(readFileSync(recentFilePath, 'utf8'));
    const samplePlans = Object.values(recentData.degreePlans).slice(0, 3);
    
    samplePlans.forEach((plan: any, i) => {
      console.log(`   ${i + 1}. "${plan.name}"`);
      console.log(`      Courses: ${plan.courses.slice(0, 5).join(', ')}${plan.courses.length > 5 ? '...' : ''} (${plan.courses.length} total)`);
    });
  }
  
  console.log('\n🚨 AREAS FOR IMPROVEMENT:');
  const improvements = [];
  
  if (overallStats.courseFormats.withCCN / totalCourses < 0.1) {
    improvements.push('❌ CCN coverage is very low (<10%)');
  }
  
  if (overallStats.courseFormats.withCompetencyUnits / totalCourses < 0.1) {
    improvements.push('❌ Credit Unit extraction is very low (<10%)');
  }
  
  if (overallStats.catalogsWithCourses < overallStats.totalCatalogs) {
    improvements.push(`❌ ${overallStats.totalCatalogs - overallStats.catalogsWithCourses} catalogs have no courses`);
  }
  
  // Check if degree plans look like fragments
  if (recentFile) {
    const recentFilePath = join(parsedDir, recentFile);
    const recentData: ParsedData = JSON.parse(readFileSync(recentFilePath, 'utf8'));
    const planNames = Object.values(recentData.degreePlans).map((p: any) => p.name);
    const fragmentPlans = planNames.filter((name: string) => 
      name.length < 50 && !name.toLowerCase().includes('bachelor') && 
      !name.toLowerCase().includes('master') && !name.toLowerCase().includes('certificate')
    );
    
    if (fragmentPlans.length > planNames.length * 0.5) {
      improvements.push('❌ Degree plans appear to be text fragments rather than proper program names');
    }
  }
  
  if (improvements.length === 0) {
    console.log('✅ Parsing appears to be working excellently!');
    console.log('✅ Course extraction is comprehensive');
    console.log('✅ Data quality is high');
  } else {
    improvements.forEach(improvement => console.log(improvement));
  }
  
  console.log('\n🎯 NEXT PRIORITIES:');
  if (improvements.length > 0) {
    console.log('1. Fix degree plan parsing to extract proper program names');
    if (overallStats.courseFormats.withCompetencyUnits / totalCourses < 0.5) {
      console.log('2. Improve competency unit extraction');
    }
    if (overallStats.courseFormats.withCCN / totalCourses < 0.3) {
      console.log('3. Consider enhancing CCN extraction for more catalogs');
    }
  } else {
    console.log('1. Data quality optimization');
    console.log('2. Create comprehensive course evolution analysis');
    console.log('3. Build program tracking across years');
  }
}

analyzeParsingState().catch(console.error);
