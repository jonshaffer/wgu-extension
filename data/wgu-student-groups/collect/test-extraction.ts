#!/usr/bin/env tsx

/**
 * Test WGU Student Groups Extraction
 *
 * Uses JSDOM to parse the provided example HTML and prints structured output
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { extractStudentGroupsFromDocument, isWGUStudentGroupsDirectoryPage } from './wgu-student-groups-extractor.js';

function setupMockDOM(html: string, url = 'https://cm.wgu.edu/t5/grouphubs/page/node-display-id/category:GroupHubs') {
  const dom = new JSDOM(html, { url });
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).location = dom.window.location;
  return dom;
}

async function run() {
  console.log('🔍 Testing WGU Student Groups extraction...');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const samplePath = resolve(__dirname, 'examples', 'cm.wgu.edu-t5-grouphubs-page-node-display-id-category:GroupHubs.html');
  const sample = readFileSync(samplePath, 'utf-8');

  setupMockDOM(sample);

  console.log('Is directory page:', isWGUStudentGroupsDirectoryPage(document));

  const data = extractStudentGroupsFromDocument(document);
  console.log(`Found ${data.total} groups`);

  // Print a compact summary
  for (const g of data.groups) {
    console.log(`- ${g.name}`);
    console.log(`  id: ${g.id}`);
    console.log(`  uid: ${g.groupUid}`);
    console.log(`  type: ${g.membershipType}`);
    console.log(`  members: ${g.membershipCount ?? 'n/a'} topics: ${g.topicCount ?? 'n/a'}`);
    console.log(`  url: ${g.url}`);
    if (g.imageUrl) console.log(`  img: ${g.imageUrl}`);
    if (g.description) console.log(`  desc: ${g.description.slice(0, 80)}${g.description.length > 80 ? '…' : ''}`);
  }

  console.log('\n✅ Extraction test complete');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error('❌ Test failed', e);
    process.exit(1);
  });
}
