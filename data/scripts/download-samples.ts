#!/usr/bin/env tsx

/**
 * Download Sample Data
 * 
 * Downloads sample data from Firestore or creates mock data
 * This is called by dev-setup.ts
 */

import fs from 'fs/promises';
import path from 'path';

async function downloadSamples() {
  console.log('📥 Preparing sample data...\n');
  
  // For now, we just ensure the dev-cache directory has data
  // In the future, this could pull from Firestore
  
  const devCacheDir = path.join(process.cwd(), 'dev-cache');
  
  try {
    const files = await fs.readdir(devCacheDir);
    const hasData = files.some(f => f.endsWith('.json'));
    
    if (hasData) {
      console.log('✅ Sample data already exists');
      return;
    }
  } catch {
    // Directory doesn't exist
  }
  
  console.log('⚠️  No sample data found');
  console.log('   Run "npm run dev-setup" to create sample data');
}

downloadSamples().catch(console.error);