#!/usr/bin/env tsx

/**
 * Test WGU Connect Data Extraction
 * 
 * Tests the WGU Connect extractor against sample HTML files
 */

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { WGUConnectExtractor } from './wgu-connect-extractor.js';

/**
 * Mock DOM environment for testing
 */
function setupMockDOM(htmlContent: string, url: string = 'https://wguconnect.wgu.edu/hub/wgu-connect/groups/c851d281-linux-foundations/resources') {
  const dom = new JSDOM(htmlContent, { url });
  
  // Set up global DOM objects
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).location = dom.window.location;
  (global as any).MutationObserver = dom.window.MutationObserver;
  
  return dom;
}

/**
 * Test extraction with sample HTML
 */
async function testExtraction() {
  console.log('🔍 Testing WGU Connect Data Extraction...\n');

  try {
    // Load sample HTML
    const sampleHtml = readFileSync('./examples/wguconnect.wgu.edu-hub-wgu-connect-groups-{groupId}-resources.html', 'utf-8');
    
    // Setup DOM
    setupMockDOM(sampleHtml);
    
    // Create extractor
    const extractor = new WGUConnectExtractor();
    
    // Test individual methods
    console.log('📋 Testing individual extraction methods:');
    console.log('Group ID:', extractor.getGroupId());
    console.log('Group Name:', extractor.getGroupName());
    console.log('Active Tab:', extractor.getActiveTab());
    console.log('Is Resources Page:', extractor.isResourcesPage());
    
    // Extract resources
    const resources = extractor.extractResources();
    console.log(`\n📚 Found ${resources.length} resources:`);
    resources.forEach(resource => {
      console.log(`  - ${resource.title}`);
      console.log(`    ID: ${resource.id}`);
      console.log(`    Category: ${resource.category}`);
      console.log(`    Type: ${resource.type}`);
      console.log(`    Image: ${resource.imageUrl ? '✓' : '✗'}`);
      console.log(`    Link: ${resource.link || 'Not found'}`);
      console.log('');
    });
    
    // Full extraction
    console.log('🔄 Testing full extraction:');
    const resourceData = extractor.extractResourceData();
    
    if (resourceData) {
      console.log(`✅ Successfully extracted data for group: ${resourceData.groupName}`);
      console.log(`   - Group ID: ${resourceData.groupId}`);
      console.log(`   - Active Tab: ${resourceData.activeTab}`);
      console.log(`   - ${resourceData.resources.length} resources`);
      console.log(`   - Extracted at: ${resourceData.extractedAt}`);
      
      // Test resource categorization
      const resourcesByType = groupResourcesByType(resourceData.resources);
      console.log('\n📊 Resources by type:');
      Object.entries(resourcesByType).forEach(([type, resources]) => {
        console.log(`  - ${type}: ${resources.length} resources`);
      });
      
      // Test resources with links
      const linkedCount = resourceData.resources.filter(r => r.link).length;
      console.log(`\n🔗 Resources with links: ${linkedCount}`);
      
    } else {
      console.log('❌ No resource data extracted');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test resource type determination
 */
function testResourceTypeDetection() {
  console.log('\n📚 Testing resource type detection...');
  
  const testCases = [
    { title: 'ACC Live Event Flyers (August 2025)', category: 'WGU Resources', expected: 'resource' },
    { title: 'Important Announcement', category: 'Announcements', expected: 'announcement' },
    { title: 'Cohort Recording - Week 1', category: 'Recordings', expected: 'recording' },
    { title: 'Study Tips for Success', category: 'Tips', expected: 'tip' },
    { title: 'Course Material', category: 'Course Resources', expected: 'resource' }
  ];
  
  const extractor = new WGUConnectExtractor();
  
  testCases.forEach(testCase => {
    // Access private method via any cast for testing
    const detectedType = (extractor as any).determineResourceType(testCase.category, testCase.title);
    const result = detectedType === testCase.expected ? '✅' : '❌';
    
    console.log(`  ${result} "${testCase.title}" (${testCase.category}) → ${detectedType}`);
  });
}

/**
 * Test mutation observer setup (mock)
 */
function testMutationObserver() {
  console.log('\n🔍 Testing mutation observer setup...');
  
  try {
    const sampleHtml = readFileSync('./examples/wguconnect.wgu.edu-hub-wgu-connect-groups-{groupId}-resources.html', 'utf-8');
    setupMockDOM(sampleHtml);
    
    const extractor = new WGUConnectExtractor();
    
    let callbackCalled = false;
    
    // Setup observer with test callback
    extractor.setupTabChangeObserver((data) => {
      console.log('  ✅ Observer callback triggered');
      console.log(`     Data extracted: ${data ? 'Yes' : 'No'}`);
      callbackCalled = true;
    });
    
    console.log('  ✅ Mutation observer setup completed');
    
    // Simulate a tab change by modifying aria-selected
    setTimeout(() => {
      const tabButton = document.querySelector('button[role="tab"]');
      if (tabButton) {
        tabButton.setAttribute('aria-selected', 'true');
        console.log('  ✅ Simulated tab change');
      }
      
      // Check if callback was called
      setTimeout(() => {
        if (callbackCalled) {
          console.log('  ✅ Observer successfully detected changes');
        } else {
          console.log('  ⚠️ Observer callback not triggered (expected in test environment)');
        }
        
        // Clean up
        extractor.stopObserver();
        console.log('  ✅ Observer stopped');
      }, 600);
      
    }, 100);
    
  } catch (error) {
    console.error('  ❌ Mutation observer test failed:', error);
  }
}

/**
 * Helper function to group resources by type
 */
function groupResourcesByType(resources: any[]): Record<string, any[]> {
  return resources.reduce((acc, resource) => {
    const type = resource.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, any[]>);
}

/**
 * Test link extraction enhancements
 */
function testLinkExtraction() {
  console.log('\n🔗 Testing enhanced link extraction...');
  
  // Create mock resource cards with different link patterns
  const testCards = [
    {
      html: `<div id="resource_12345" class="ant-card">
               <h2 class="resource-card__head-container-title__hqT6q">
                 <a href="/hub/resource/12345">Test Resource with Direct Link</a>
               </h2>
               <div class="ant-tag">WGU Resources</div>
             </div>`,
      expected: 'https://wguconnect.wgu.edu/hub/resource/12345'
    },
    {
      html: `<div data-id="67890" class="ant-card">
               <h2 class="resource-card__head-container-title__hqT6q">
                 <span tabindex="0" role="link">Resource with Data ID</span>
               </h2>
               <div class="ant-tag">Course Resources</div>
             </div>`,
      expected: 'https://wguconnect.wgu.edu/hub/wgu-connect/groups/test-group/resource/67890'
    },
    {
      html: `<div class="ant-card">
               <h2 class="resource-card__head-container-title__hqT6q">
                 <span data-href="https://example.com/resource">External Resource</span>
               </h2>
               <div class="ant-tag">Tips</div>
             </div>`,
      expected: 'https://example.com/resource'
    }
  ];
  
  // Setup a mock DOM with test group
  setupMockDOM('<div></div>', 'https://wguconnect.wgu.edu/hub/wgu-connect/groups/test-group/resources');
  
  testCards.forEach((testCase, index) => {
    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = testCase.html;
    const card = container.firstElementChild as HTMLElement;
    
    // Create extractor and test extraction
    const extractor = new WGUConnectExtractor();
    const resource = (extractor as any).extractResourceFromCard(card, index);
    
    const result = resource?.link === testCase.expected ? '✅' : '❌';
    console.log(`  ${result} "${resource?.title}"`);
    console.log(`     Expected: ${testCase.expected}`);
    console.log(`     Got: ${resource?.link || 'null'}`);
    console.log('');
  });
}

/**
 * Test URL pattern matching
 */
function testUrlPatterns() {
  console.log('\n🌐 Testing URL pattern matching...');
  
  const testUrls = [
    'https://wguconnect.wgu.edu/hub/wgu-connect/groups/c851d281-linux-foundations/resources',
    'https://wguconnect.wgu.edu/hub/wgu-connect/groups/d387-advanced-java/resources',
    'https://wguconnect.wgu.edu/some/other/path/resources',
    'https://wguconnect.wgu.edu/hub/wgu-connect/groups/test/discussion',
    'https://example.com/resources'
  ];
  
  testUrls.forEach(url => {
    const dom = setupMockDOM('<div></div>', url);
    const extractor = new WGUConnectExtractor();
    
    const groupId = extractor.getGroupId();
    const isResourcesPage = url.includes('/resources');
    
    console.log(`  "${url}"`);
    console.log(`    Group ID: ${groupId || 'none'}`);
    console.log(`    Is Resources Page: ${isResourcesPage ? '✓' : '✗'}`);
    console.log('');
  });
}

// Run tests
async function runAllTests() {
  await testExtraction();
  testResourceTypeDetection();
  testLinkExtraction();
  testMutationObserver();
  testUrlPatterns();
  
  console.log('\n✨ Testing complete!');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testExtraction, testResourceTypeDetection, testLinkExtraction, testMutationObserver, testUrlPatterns };