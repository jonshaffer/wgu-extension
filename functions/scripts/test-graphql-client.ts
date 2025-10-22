#!/usr/bin/env tsx

/**
 * Test script for GraphQL client functionality
 * Tests the new community features using the @wgu-extension/graphql-client package
 */

import { 
  createClient, 
  getCourses, 
  getCommunitiesForCourseV2,
  searchCommunities,
  withCache,
  type CourseCommunitiesResponse 
} from '@wgu-extension/graphql-client';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Helper to log with color
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

// Create client
const endpoint = process.env.GRAPHQL_ENDPOINT || 'http://localhost:5001/wgu-extension-site-prod/us-central1/publicApi';
const client = createClient({ endpoint });

// Test courses
const testCourses = ['C172', 'C182', 'C195', 'C867', 'C482'];

async function testGetCourses() {
  log.section('Testing getCourses');
  
  try {
    const courses = await getCourses(client);
    log.success(`Retrieved ${courses.length} courses`);
    
    // Show first 5 courses
    console.log('Sample courses:');
    courses.slice(0, 5).forEach(course => {
      console.log(`  - ${course.courseCode}: ${course.name}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Failed to get courses: ${error}`);
    return false;
  }
}

async function testSearchCommunities() {
  log.section('Testing searchCommunities');
  
  try {
    const results = await searchCommunities('python', 10, client);
    log.success(`Found ${results.length} communities for "python"`);
    
    // Group by type
    const byType = results.reduce((acc, item) => {
      const type = item.type.toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Results by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Failed to search communities: ${error}`);
    return false;
  }
}

async function testGetCommunitiesForCourse(courseCode: string) {
  log.info(`Testing getCommunitiesForCourse for ${courseCode}`);
  
  try {
    const communities = await getCommunitiesForCourseV2(courseCode, client);
    
    if (!communities) {
      log.warning(`No communities found for ${courseCode}`);
      return true;
    }
    
    // Log summary
    const summary = {
      course: `${communities.courseCode} - ${communities.courseName || 'Unknown'}`,
      discord: communities.discord.length,
      reddit: communities.reddit.length,
      wguConnect: communities.wguConnect ? 1 : 0,
      studentGroups: communities.studentGroups.length
    };
    
    console.log(`  Course: ${summary.course}`);
    console.log(`  Discord servers: ${summary.discord}`);
    console.log(`  Reddit communities: ${summary.reddit}`);
    console.log(`  WGU Connect: ${summary.wguConnect}`);
    console.log(`  Student groups: ${summary.studentGroups}`);
    
    // Show details if any communities exist
    if (communities.discord.length > 0) {
      console.log('\n  Discord servers:');
      communities.discord.forEach(server => {
        console.log(`    - ${server.name} (${server.memberCount} members)`);
      });
    }
    
    if (communities.reddit.length > 0) {
      console.log('\n  Reddit communities:');
      communities.reddit.forEach(reddit => {
        console.log(`    - r/${reddit.name} (${reddit.subscriberCount} subscribers)`);
      });
    }
    
    if (communities.wguConnect) {
      console.log(`\n  WGU Connect: ${communities.wguConnect.name}`);
    }
    
    if (communities.studentGroups.length > 0) {
      console.log('\n  Student groups:');
      communities.studentGroups.forEach(group => {
        console.log(`    - ${group.name} (${group.type})`);
      });
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to get communities for ${courseCode}: ${error}`);
    return false;
  }
}

async function testCaching() {
  log.section('Testing caching functionality');
  
  // Create cached version
  const cachedGetCommunities = withCache(getCommunitiesForCourseV2, 5000); // 5 second cache
  
  try {
    // First call - should hit the API
    const start1 = Date.now();
    await cachedGetCommunities('C172', client);
    const time1 = Date.now() - start1;
    log.info(`First call took ${time1}ms`);
    
    // Second call - should use cache
    const start2 = Date.now();
    await cachedGetCommunities('C172', client);
    const time2 = Date.now() - start2;
    log.info(`Second call took ${time2}ms (cached)`);
    
    if (time2 < time1 / 2) {
      log.success('Caching is working correctly');
    } else {
      log.warning('Cache might not be working as expected');
    }
    
    return true;
  } catch (error) {
    log.error(`Caching test failed: ${error}`);
    return false;
  }
}

async function testErrorHandling() {
  log.section('Testing error handling');
  
  try {
    // Test with invalid course code
    const result = await getCommunitiesForCourseV2('INVALID999', client);
    
    if (!result || (result.discord.length === 0 && result.reddit.length === 0)) {
      log.success('Invalid course code handled gracefully');
      return true;
    } else {
      log.warning('Unexpected result for invalid course code');
      return false;
    }
  } catch (error) {
    log.success(`Error thrown as expected: ${error}`);
    return true;
  }
}

async function runAllTests() {
  console.log(`${colors.bright}GraphQL Client Test Suite${colors.reset}`);
  console.log(`Endpoint: ${endpoint}\n`);
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Run tests
  const tests = [
    testGetCourses,
    testSearchCommunities,
    () => testGetCommunitiesForCourse('C172'),
    () => testGetCommunitiesForCourse('C867'),
    () => testGetCommunitiesForCourse('C195'),
    testCaching,
    testErrorHandling
  ];
  
  for (const test of tests) {
    totalTests++;
    if (await test()) {
      passedTests++;
    }
  }
  
  // Summary
  log.section('Test Summary');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
  
  if (passedTests === totalTests) {
    log.success('\nAll tests passed! 🎉');
    process.exit(0);
  } else {
    log.error('\nSome tests failed.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite failed: ${error}`);
  process.exit(1);
});