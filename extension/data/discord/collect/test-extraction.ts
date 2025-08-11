#!/usr/bin/env tsx

/**
 * Test Discord Data Extraction
 * 
 * Tests the Discord extractor against sample HTML files
 */

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { DiscordExtractor } from './discord-extractor.js';

/**
 * Mock DOM environment for testing
 */
function setupMockDOM(htmlContent: string, url: string = 'https://discord.com/channels/1234567890/9876543210') {
  const dom = new JSDOM(htmlContent, { url });
  
  // Set up global DOM objects
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).location = dom.window.location;
  
  return dom;
}

/**
 * Test extraction with sample HTML
 */
async function testExtraction() {
  console.log('🔍 Testing Discord Data Extraction...\n');

  try {
    // Load sample HTML
    const sampleHtml = readFileSync('./examples/discord.com-channels-{serverId}-{channelId}.html', 'utf-8');
    
    // Setup DOM
    setupMockDOM(sampleHtml);
    
    // Create extractor
    const extractor = new DiscordExtractor();
    
    // Test individual methods
    console.log('📋 Testing individual extraction methods:');
    console.log('Server ID:', extractor.getServerId());
    console.log('Channel ID:', extractor.getChannelId());
    console.log('Server Name:', extractor.getServerName());
    
    // Extract channels
    const channels = extractor.extractChannels();
    console.log(`\n📺 Found ${channels.length} channels:`);
    channels.forEach(channel => {
      console.log(`  - ${channel.name} (${channel.type}) ${channel.isWGURelated ? '✓ WGU-related' : ''} ${channel.courseCode ? `[${channel.courseCode}]` : ''}`);
    });
    
    // Extract members
    const members = extractor.extractMembers();
    console.log(`\n👥 Found ${members.length} members`);
    
    // Full extraction
    console.log('\n🔄 Testing full extraction:');
    const serverData = extractor.extractServerData();
    
    if (serverData) {
      console.log(`✅ Successfully extracted data for server: ${serverData.serverName}`);
      console.log(`   - ${serverData.channels.length} channels`);
      console.log(`   - ${serverData.members.length} members`);
      console.log(`   - ${serverData.channels.filter(c => c.isWGURelated).length} WGU-related channels`);
      console.log(`   - Extracted at: ${serverData.extractedAt}`);
      
      // Test WGU detection
      const wguChannels = serverData.channels.filter(c => c.isWGURelated);
      if (wguChannels.length > 0) {
        console.log('\n🎓 WGU-related channels found:');
        wguChannels.forEach(channel => {
          console.log(`  - ${channel.name} ${channel.courseCode ? `[${channel.courseCode}]` : ''}`);
        });
      }
      
    } else {
      console.log('❌ No server data extracted');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test WGU server detection
 */
function testWGUDetection() {
  console.log('\n🎓 Testing WGU server detection...');
  
  const testCases = [
    { name: 'WGU Computer Science', expected: true },
    { name: 'Western Governors University', expected: true },
    { name: 'WGU Students Hub', expected: true },
    { name: 'Random Gaming Server', expected: false },
    { name: 'Study Group', expected: false }
  ];
  
  testCases.forEach(testCase => {
    // Mock a simple DOM with server name
    const html = `<h1 class="title">${testCase.name}</h1>`;
    setupMockDOM(html);
    
    const extractor = new DiscordExtractor();
    const detectedName = extractor.getServerName();
    const result = detectedName === testCase.name ? '✅' : '❌';
    
    console.log(`  ${result} "${testCase.name}" → detected as: "${detectedName}"`);
  });
}

/**
 * Test course code extraction
 */
function testCourseCodeExtraction() {
  console.log('\n📚 Testing course code extraction...');
  
  const testChannelNames = [
    '🔶│session',
    'c123-programming',
    'IT-4770-discussion', 
    'C850 Emerging Technologies',
    'D387-advanced-java',
    'general-chat',
    'WGU-C195-project-help',
    'capstone-c971'
  ];
  
  testChannelNames.forEach(channelName => {
    const html = `<div class="name">${channelName}</div>`;
    setupMockDOM(html);
    
    const extractor = new DiscordExtractor();
    // Access private method via any cast for testing
    const courseCode = (extractor as any).extractCourseCode(channelName);
    const isWGU = (extractor as any).isWGURelated(channelName);
    
    console.log(`  "${channelName}" → Course: ${courseCode || 'none'}, WGU: ${isWGU ? '✓' : '✗'}`);
  });
}

// Run tests
async function runAllTests() {
  await testExtraction();
  testWGUDetection();
  testCourseCodeExtraction();
  
  console.log('\n✨ Testing complete!');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testExtraction, testWGUDetection, testCourseCodeExtraction };