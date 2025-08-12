// Emulator seeding script: Seeds essential data for local development
// Usage: FIRESTORE_EMULATOR_HOST=localhost:8080 npm run seed:emulator

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';

// Initialize Firebase Admin for emulator
initializeApp({ 
  credential: applicationDefault(), 
  projectId: 'demo-wgu-extension' // Use demo project for emulator
});
const db = getFirestore();

console.log('[emulator] Using Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080');

async function pathExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function seedCollection(collectionName: string, sourcePath: string, idField: string) {
  if (!(await pathExists(sourcePath))) {
    console.warn(`Skip ${collectionName}: source not found ${sourcePath}`);
    return;
  }

  console.log(`Seeding ${collectionName} from ${sourcePath}`);
  const files = await fs.readdir(sourcePath);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const batch = db.batch();
  let count = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(sourcePath, file);
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    
    const docId = data[idField] || path.basename(file, '.json');
    batch.set(db.collection(collectionName).doc(docId), {
      ...data,
      seedTimestamp: new Date().toISOString()
    });
    count++;
  }

  await batch.commit();
  console.log(`  Seeded ${count} documents to ${collectionName}`);
}

async function seedUnifiedData() {
  const unifiedPath = path.join(__dirname, '../data/processed/unified-community-data.json');
  if (await pathExists(unifiedPath)) {
    console.log('Seeding unified community data');
    const data = JSON.parse(await fs.readFile(unifiedPath, 'utf8'));
    
    await db.collection('public').doc('unifiedCommunityData').set({
      ...data,
      updatedAt: new Date().toISOString(),
      source: 'emulator-seed'
    });
    console.log('  Seeded unified community data');
  }
}

async function main() {
  console.log('🌱 Seeding Firestore emulator with community data...\n');
  
  const root = __dirname;
  
  // Seed essential collections (skip heavy catalog data for emulator)
  await seedCollection('discord', path.join(root, '../data/discord/raw'), 'id');
  await seedCollection('reddit-communities', path.join(root, '../data/reddit/raw'), 'subreddit');
  await seedCollection('wgu-connect-groups', path.join(root, '../data/wgu-connect/raw'), 'id');
  await seedCollection('wgu-student-groups', path.join(root, '../data/wgu-student-groups/raw'), 'id');
  
  // Seed just a few sample catalogs for testing (not all 101)
  const catalogPath = path.join(root, '../data/catalogs/parsed');
  if (await pathExists(catalogPath)) {
    console.log('Seeding sample catalogs (latest 3 for testing)');
    const catalogFiles = (await fs.readdir(catalogPath))
      .filter(f => f.startsWith('catalog-') && f.endsWith('.json'))
      .sort()
      .slice(-3); // Just the 3 most recent catalogs
    
    const batch = db.batch();
    for (const file of catalogFiles) {
      const content = JSON.parse(await fs.readFile(path.join(catalogPath, file), 'utf8'));
      const match = file.match(/catalog-(\\d{4}-\\d{2})\\.json$/);
      if (match) {
        const monthKey = match[1];
        batch.set(db.collection('catalogs').doc(monthKey), {
          id: monthKey,
          snapshot: content,
          createdAt: new Date().toISOString()
        });
      }
    }
    await batch.commit();
    console.log(`  Seeded ${catalogFiles.length} sample catalogs`);
  }
  
  // Seed unified data
  await seedUnifiedData();
  
  console.log('\n✅ Emulator seeding complete!');
  console.log('\nSeeded collections:');
  console.log('  - discord: Discord communities with channels');
  console.log('  - reddit-communities: Reddit subreddits');
  console.log('  - wgu-connect-groups: WGU Connect study groups');
  console.log('  - wgu-student-groups: WGU student organizations');
  console.log('  - catalogs: Sample course catalogs (latest 3)');
  console.log('  - public/unifiedCommunityData: Unified search data');
}

main().catch(err => {
  console.error('❌ Emulator seeding failed:', err);
  process.exit(1);
});