#!/usr/bin/env tsx

/**
 * Development Setup Script
 * 
 * Downloads sample data for contributors to work with locally
 * without needing Firestore access or DVC setup.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { populateDevCache } from './populate-dev-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function setupDevEnvironment() {
  console.log('🚀 Setting up development environment...\n');

  // Create dev-cache directory
  const devCacheDir = path.join(rootDir, 'dev-cache');
  await fs.mkdir(devCacheDir, { recursive: true });

  // Check if force flag is set
  const force = process.argv.includes('--force');

  // Check if sample data already exists
  try {
    const files = await fs.readdir(devCacheDir);
    const hasData = files.some(f => f.endsWith('.json') || f.endsWith('.pdf'));
    
    if (hasData && !force) {
      console.log('✅ Sample data already exists in dev-cache/');
      console.log('   Run with --force to re-download\n');
      return;
    }
  } catch {
    // Directory doesn't exist or is empty
  }

  console.log('📥 Fetching live data from GraphQL API...\n');

  try {
    // Try to populate from GraphQL API
    await populateDevCache();
    console.log('\n✅ Development environment ready with live data!');
  } catch (error) {
    console.warn('\n⚠️  Could not fetch live data from GraphQL API');
    console.log('   Creating sample data instead...\n');
    
    // Fall back to creating sample data
    const sampleCourses = {
    "C182": {
      "courseCode": "C182",
      "courseName": "Introduction to IT",
      "description": "This course introduces students to information technology as a discipline and the various roles and functions of the IT department as business support. Students are presented with various IT disciplines including systems and services, network and security, scripting and programming, data management, and the business of IT, with a survey of technologies in every area and how they relate to each other and to the business.",
      "ccn": "ITEC 1010",
      "competencyUnits": 4,
      "courseType": "degree-plan"
    },
    "C867": {
      "courseCode": "C867",
      "courseName": "Scripting and Programming - Applications",
      "description": "This course provides an introduction to programming covering data structures, algorithms, and programming paradigms. The course presents the student with the concept of an object as well as the object-oriented paradigm and its benefits. A survey of languages is covered and the distinction between interpreted and compiled languages is introduced.",
      "ccn": "COMP 1671",
      "competencyUnits": 4,
      "courseType": "degree-plan"
    },
    "C958": {
      "courseCode": "C958",
      "courseName": "Calculus I",
      "description": "This course covers single-variable calculus including limits, derivatives, and integrals with applications. Topics include exponential, logarithmic, and trigonometric functions. Students will learn to apply calculus to solve real-world problems in their field of study.",
      "ccn": "MATH 1210",
      "competencyUnits": 4,
      "courseType": "degree-plan"
    }
  };

  await fs.writeFile(
    path.join(devCacheDir, 'courses.json'),
    JSON.stringify(sampleCourses, null, 2)
  );
  console.log('✅ Created sample courses.json');

  // Create sample community data
  const sampleCommunities = {
    "discord": [
      {
        "name": "WGU Computer Science",
        "invite": "wgu-compsci",
        "description": "Unofficial CS student community",
        "courses": ["C182", "C867", "C958"],
        "memberCount": 5000,
        "verified": true
      },
      {
        "name": "WGU IT",
        "invite": "wguit",
        "description": "IT students helping each other",
        "courses": ["C182", "C867"],
        "memberCount": 8000,
        "verified": true
      }
    ],
    "reddit": [
      {
        "name": "WGU",
        "url": "https://reddit.com/r/WGU",
        "description": "Main WGU subreddit",
        "subscribers": 150000,
        "courses": ["all"],
        "verified": true
      },
      {
        "name": "WGU_CompSci",
        "url": "https://reddit.com/r/WGU_CompSci",
        "description": "Computer Science program discussion",
        "subscribers": 25000,
        "courses": ["C867", "C958"],
        "verified": true
      }
    ]
  };

  await fs.writeFile(
    path.join(devCacheDir, 'communities.json'),
    JSON.stringify(sampleCommunities, null, 2)
  );
  console.log('✅ Created sample communities.json');

  // Create a minimal test catalog PDF info
  const catalogInfo = {
    "filename": "test-catalog.pdf",
    "note": "For actual PDF parsing tests, use any catalog from sources/catalogs/",
    "sampleParsedData": {
      "metadata": {
        "catalogDate": "2025-08",
        "totalPages": 350,
        "parserVersion": "v2.1-enhanced"
      },
      "statistics": {
        "coursesFound": 829,
        "degreePlansFound": 180,
        "ccnCoverage": 93,
        "cuCoverage": 66
      }
    }
  };

  await fs.writeFile(
    path.join(devCacheDir, 'test-catalog-info.json'),
    JSON.stringify(catalogInfo, null, 2)
  );
  console.log('✅ Created test catalog info');

  // Create sample Firestore schemas
  const firestoreSchemas = {
    "collections": {
      "courses": {
        "description": "All WGU courses from catalogs",
        "fields": {
          "courseCode": "string",
          "courseName": "string",
          "description": "string",
          "ccn": "string?",
          "competencyUnits": "number?",
          "lastUpdated": "timestamp"
        }
      },
      "communities": {
        "description": "Discord servers and Reddit communities",
        "fields": {
          "type": "discord|reddit",
          "name": "string",
          "url": "string",
          "courses": "string[]",
          "verified": "boolean",
          "lastChecked": "timestamp"
        }
      }
    }
  };

  await fs.writeFile(
    path.join(devCacheDir, 'firestore-schemas.json'),
    JSON.stringify(firestoreSchemas, null, 2)
  );
  console.log('✅ Created Firestore schema reference');

    console.log('\n✅ Development environment ready!');
    console.log('\n📁 Sample data created in: dev-cache/');
    console.log('   - courses.json: Sample course data');
    console.log('   - communities.json: Sample Discord/Reddit data');
    console.log('   - test-catalog-info.json: Info about catalog parsing');
    console.log('   - firestore-schemas.json: Database schema reference');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run "make test" to verify your setup');
    console.log('   2. See CONTRIBUTING.md for how to help');
    console.log('   3. Try "make parse-catalog FILE=sources/catalogs/[any-catalog].pdf"');
  } // End of catch block
}

// Run the setup
setupDevEnvironment().catch(console.error);