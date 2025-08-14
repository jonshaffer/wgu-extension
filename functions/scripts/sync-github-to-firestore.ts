// Starter sync script: Syncs open source data from local repo to Firestore
// Usage: Run in CI/CD or locally after updating data files
// Notes:
//  - Keeps repo (GitHub) as source of truth; Firestore is a synchronized cache.
//  - Supports either a single aggregate JSON file or a directory of per-item JSON files.
//  - Uses dynamic imports for ESM Zod schema modules from the extension workspace while this
//    functions package remains CommonJS.
//  - Requires DVC pull for catalog files (large JSON files stored in Google Drive)

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
// Explicit .env loading (in case direnv didn't run). Safe no-op if already loaded.
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
try {
  // Dynamically require to avoid adding a prod dependency if not installed.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch {/* dotenv optional */}
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';

// Lazy-loaded Zod schemas (dynamic import to avoid ESM/CJS mismatch)
let WguConnectGroupRawSchema: any;
let RedditCommunitySchema: any;
let DiscordCommunityFileSchema: any; // community file with channels
let WguStudentGroupRawSchema: any;

// Initialize Firebase Admin with optional env-provided service account JSON
function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  // Support pointing to a file instead of embedding JSON in .env
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      const raw = require('fs').readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
      process.env.FIREBASE_SERVICE_ACCOUNT = raw;
    } catch (e) {
      console.warn('Could not read FIREBASE_SERVICE_ACCOUNT_FILE:', e);
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (!sa.project_id && projectId) sa.project_id = projectId; // ensure project id
      initializeApp({ credential: cert(sa as any), projectId: sa.project_id || projectId });
      return;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env var. Falling back to applicationDefault()', e);
    }
  }

  initializeApp({ credential: applicationDefault(), projectId });
  if (!projectId) {
    console.warn('[firebase] No FIREBASE_PROJECT_ID set (or GOOGLE_CLOUD_PROJECT). Firestore Admin may fail.');
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('[firebase] No credentials provided (FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS).');
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('[firebase] Using Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST);
  }
}
initFirebase();
const db = getFirestore();

// Utility: load schemas dynamically
async function loadSchemas() {
  if (WguConnectGroupRawSchema) return; // already loaded
  let typesMod: any;
  try {
    // Prefer dynamic import (ESM) when available
    typesMod = await import('@wgu-extension/data');
  } catch (primaryErr) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      typesMod = require('@wgu-extension/data');
    } catch (cjsErr) {
      const possible = [
        path.join(__dirname, '../data/types/dist/index.js'),
      ];
      for (const p of possible) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          typesMod = require(p);
          console.log(`Loaded types module via fallback path: ${p}`);
          break;
        } catch {
          /* continue */
        }
      }
      if (!typesMod) {
        console.error('Failed to load @wgu-extension/data. Build it with: npm run types:build');
        console.error('Primary ESM error:', primaryErr);
        console.error('CJS require error:', cjsErr);
        throw primaryErr;
      }
    }
  }
  WguConnectGroupRawSchema = typesMod.WguConnectGroupRawSchema;
  RedditCommunitySchema = typesMod.RedditCommunitySchema;
  DiscordCommunityFileSchema = typesMod.DiscordCommunityFileSchema;
  WguStudentGroupRawSchema = typesMod.WguStudentGroupRawSchema;
}

type ZodSchema = { parse: (data: unknown) => any; safeParse?: (data: unknown) => any };

async function pathExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}


// Sync function for each collection
interface SyncConfig<T extends Record<string, any>> {
  collection: string;
  sourcePath: string; // file or directory
  schema: ZodSchema;
  idField: string;
  transform?: (items: T[] | Array<{ id: string; content: string; data: any }>) => T[] | Array<{ id: string; content: string; data: any }>; // optional transform
}

function buildSyncConfigs(): SyncConfig<any>[] {
  const root = __dirname; // dist/lib when compiled; relies on relative '../../'
  return [
    // Catalogs: each parsed monthly catalog file -> one document named YYYY-MM
    {
      collection: 'catalogs',
      sourcePath: path.join(root, '../../data/catalogs/parsed'),
      schema: { // custom schema parse wrapper for monthly catalog file structure
        parse: (data: any) => data, // trust file structure; could add zod if defined later
      },
      idField: '__FILENAME__',
      transform: (files: any[]) => files, // no-op; handled specially in syncCollection
    },
    
    // New Collection-Based Approach: Individual documents for better performance
    {
      collection: 'courses',
      sourcePath: path.join(root, '../../data/catalogs/processed/courses.json'),
      schema: { parse: (data: any) => data },
      idField: 'courseCode',
      transform: (files: any[]) => {
        console.log('Transforming courses for collection-based sync');
        const coursesFile = files.find(f => f.id === 'courses');
        if (!coursesFile?.data?.courses) return [];
        
        const transformedDocs = [];
        const coursesData = coursesFile.data.courses;
        const metadata = coursesFile.data.metadata;
        
        // Add individual course documents
        for (const [courseCode, courseData] of Object.entries(coursesData)) {
          transformedDocs.push({
            id: courseCode,
            data: {
              courseCode,
              ...courseData as any,
              collection: 'courses'
            },
            content: JSON.stringify({ courseCode, ...courseData })
          });
        }
        
        // Add metadata document
        transformedDocs.push({
          id: 'metadata',
          data: {
            totalCourses: Object.keys(coursesData).length,
            lastUpdated: metadata.generatedAt,
            catalogVersionsIncluded: metadata.catalogVersionsIncluded,
            statistics: {
              total: Object.keys(coursesData).length,
              // Add more stats as needed
            },
            collection: 'courses',
            type: 'metadata'
          },
          content: JSON.stringify({
            totalCourses: Object.keys(coursesData).length,
            lastUpdated: metadata.generatedAt,
            catalogVersionsIncluded: metadata.catalogVersionsIncluded
          })
        });
        
        console.log(`Created ${transformedDocs.length} documents (${transformedDocs.length - 1} courses + 1 metadata)`);
        return transformedDocs;
      }
    },
    {
      collection: 'degree-plans',
      sourcePath: path.join(root, '../../data/catalogs/processed/degree-programs.json'),
      schema: { parse: (data: any) => data },
      idField: 'programCode',
      transform: (files: any[]) => {
        console.log('Transforming degree programs for collection-based sync');
        const degreesFile = files.find(f => f.id === 'degree-programs');
        if (!degreesFile?.data?.degrees) return [];
        
        const transformedDocs = [];
        const degreesData = degreesFile.data.degrees;
        const metadata = degreesFile.data.metadata;
        
        // Add individual degree program documents
        for (const [programCode, degreeData] of Object.entries(degreesData)) {
          transformedDocs.push({
            id: programCode,
            data: {
              programCode,
              ...degreeData as any,
              collection: 'degree-plans'
            },
            content: JSON.stringify({ programCode, ...degreeData })
          });
        }
        
        // Add metadata document
        transformedDocs.push({
          id: 'metadata',
          data: {
            totalPrograms: Object.keys(degreesData).length,
            lastUpdated: metadata.generatedAt,
            catalogVersionsIncluded: metadata.catalogVersionsIncluded,
            statistics: {
              total: Object.keys(degreesData).length,
              // Add more stats as needed
            },
            collection: 'degree-plans',
            type: 'metadata'
          },
          content: JSON.stringify({
            totalPrograms: Object.keys(degreesData).length,
            lastUpdated: metadata.generatedAt,
            catalogVersionsIncluded: metadata.catalogVersionsIncluded
          })
        });
        
        console.log(`Created ${transformedDocs.length} documents (${transformedDocs.length - 1} degree programs + 1 metadata)`);
        return transformedDocs;
      }
    },
    {
      collection: 'wgu-connect-groups',
      sourcePath: path.join(root, '../../data/wgu-connect/raw'),
      schema: WguConnectGroupRawSchema, // individual files are single objects
      idField: 'id',
    },
    {
      collection: 'reddit-communities',
      sourcePath: path.join(root, '../../data/reddit/raw'),
      schema: RedditCommunitySchema,
      idField: 'subreddit',
    },
    {
      // Store Discord communities (supporting multiple Discord servers)
      collection: 'discord',
      sourcePath: path.join(root, '../../data/discord/raw'),
      schema: DiscordCommunityFileSchema, // validate community + channels structure
      idField: 'id',
      // No transform needed - store communities directly with their channels
    },
    {
      collection: 'wgu-student-groups',
      sourcePath: path.join(root, '../../data/wgu-student-groups/raw'),
      schema: WguStudentGroupRawSchema,
      idField: 'id',
    },
  ];
}

// Mathematical Transfer pattern implementation with hash-based change detection
async function syncCollection<T extends Record<string, any>>({ 
  collection, 
  sourcePath, 
  schema, 
  idField, 
  transform 
}: SyncConfig<T>) {
  if (!(await pathExists(sourcePath))) {
    console.warn(`Skip ${collection}: source not found ${sourcePath}`);
    return;
  }

  console.log(`Syncing ${collection} from ${sourcePath} (Mathematical Transfer pattern)`);
  
  // Phase 1: Load and process source data
  let sourceFiles: Array<{ id: string; content: string; data: any }> = [];

  // Special handling for different collection types
  if (collection === 'catalogs') {
    console.log('  Syncing all catalogs with reports (hash-based efficiency)');
    const dirEntries = await fs.readdir(sourcePath);
    const catalogFiles = dirEntries
      .filter(f => f.startsWith('catalog-') && f.endsWith('.json') && !f.includes('.report.'))
      .sort(); // All catalogs, sorted chronologically

    for (const fname of catalogFiles) {
      const filePath = path.join(sourcePath, fname);
      const content = await fs.readFile(filePath, 'utf8');
      const raw = JSON.parse(content);
      const match = fname.match(/catalog-(\d{4}-\d{2})\.json$/);
      if (match) {
        const monthKey = match[1];
        
        // Also load the corresponding report file
        const reportPath = path.join(sourcePath, `catalog-${monthKey}.report.json`);
        let report = null;
        try {
          if (await pathExists(reportPath)) {
            const reportContent = await fs.readFile(reportPath, 'utf8');
            report = JSON.parse(reportContent);
          }
        } catch (e) {
          console.warn(`    Could not load report for ${monthKey}:`, e instanceof Error ? e.message : String(e));
        }
        
        // Combine content hash includes both catalog and report data
        const combinedContent = JSON.stringify({ catalog: raw, report });
        
        sourceFiles.push({
          id: monthKey,
          content: combinedContent,
          data: { 
            id: monthKey, 
            snapshot: raw, 
            report,
            createdAt: new Date().toISOString() 
          }
        });
      }
    }
  } else if (collection === 'courses' || collection === 'degree-plans') {
    // Special handling for single-file collections that get transformed into multiple documents
    console.log(`  Loading single file for ${collection} collection`);
    const content = await fs.readFile(sourcePath, 'utf8');
    const data = JSON.parse(content);
    const fileName = path.basename(sourcePath, '.json');
    sourceFiles.push({ id: fileName, content, data });
  } else {
    // For standard collections, read individual files from directory
    const isDir = (await fs.stat(sourcePath)).isDirectory();
    if (isDir) {
      const files = await fs.readdir(sourcePath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(sourcePath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        const docId = data[idField] || path.basename(file, '.json');
        sourceFiles.push({ id: docId, content, data });
      }
    } else {
      // Single file collection (like the new courses/degree-plans)
      const content = await fs.readFile(sourcePath, 'utf8');
      const data = JSON.parse(content);
      const fileName = path.basename(sourcePath, '.json');
      sourceFiles.push({ id: fileName, content, data });
    }
  }

  // Apply transform if specified
  if (transform && collection !== 'catalogs') {
    if (collection === 'courses' || collection === 'degree-plans') {
      // Collection-based transform: convert single file into multiple documents
      console.log(`  Applying collection-based transform for ${collection}`);
      sourceFiles = transform(sourceFiles) as Array<{ id: string; content: string; data: any }>;
      console.log(`  Transform created ${sourceFiles.length} documents for ${collection} collection`);
    } else {
      // Standard transform for other collections
      const transformedItems = transform(sourceFiles.map(f => f.data)) as any[];
      sourceFiles = transformedItems.map((item) => ({
        id: String(item[idField]),
        content: JSON.stringify(item),
        data: item
      }));
    }
  }

  // Phase 2: Mathematical Transfer - calculate differences via hash comparison
  const bulkWriter = db.bulkWriter();
  const sourceManifest = new Set<string>();
  let updatedCount = 0;
  let skippedCount = 0;

  // Configure bulk writer for optimal performance
  bulkWriter.onWriteError((error) => {
    if (error.failedAttempts < 3) {
      console.warn(`  Retrying write for ${error.documentRef.path}: ${error.code}`);
      return true;
    }
    console.error(`  Failed write for ${error.documentRef.path} after ${error.failedAttempts} attempts:`, error);
    return false;
  });

  console.log(`  Checking ${sourceFiles.length} source files for changes...`);

  for (const sourceFile of sourceFiles) {
    sourceManifest.add(sourceFile.id);
    
    // Calculate content hash (mathematical difference detection)
    const contentHash = crypto.createHash('sha256').update(sourceFile.content).digest('hex');
    
    // Check if document exists and compare hash
    const docRef = db.collection(collection).doc(sourceFile.id);
    const existingDoc = await docRef.get();
    
    if (!existingDoc.exists || existingDoc.data()?.contentHash !== contentHash) {
      // Content differs - update document
      bulkWriter.set(docRef, {
        ...sourceFile.data,
        contentHash,
        lastSynced: new Date().toISOString(),
        syncSource: 'mathematical-transfer'
      });
      updatedCount++;
      console.log(`  ✓ ${sourceFile.id} (content changed)`);
    } else {
      // Content identical - skip update
      skippedCount++;
      console.log(`  → ${sourceFile.id} (unchanged)`);
    }
  }

  // Phase 3: Cleanup - remove documents not in source manifest
  console.log(`  Checking for documents to remove...`);
  const existingDocs = await db.collection(collection).get();
  let deletedCount = 0;

  for (const doc of existingDocs.docs) {
    if (!sourceManifest.has(doc.id)) {
      bulkWriter.delete(doc.ref);
      deletedCount++;
      console.log(`  ✗ ${doc.id} (removed from source)`);
    }
  }

  // Execute all operations
  await bulkWriter.close();

  console.log(`  Mathematical Transfer complete: ${updatedCount} updated, ${skippedCount} skipped, ${deletedCount} deleted`);
}

async function main() {
  // Pull catalog files from DVC before syncing
  console.log('Pulling catalog files from DVC...');
  try {
    // Change to the root directory where DVC is initialized
    const rootDir = path.resolve(__dirname, '../../');
    execSync('dvc pull', { 
      cwd: rootDir,
      stdio: 'inherit' 
    });
    console.log('DVC pull completed successfully');
  } catch (error) {
    console.warn('DVC pull failed (may not be available in CI/CD):', error);
    // Continue anyway - files might already be present
  }

  await loadSchemas();
  const configs = buildSyncConfigs();
  for (const config of configs) {
    await syncCollection(config);
  }
  
  
  console.log('All collections synced.');
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
