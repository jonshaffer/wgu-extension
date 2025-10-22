#!/usr/bin/env tsx
/**
 * Firestore Emulator Data Management
 * 
 * This script manages Firestore data for local emulator development.
 * It can backup/restore data using Firebase Storage.
 * 
 * Usage:
 *   # Upload current emulator data to Firebase Storage
 *   npm run seed:emulator backup
 *   
 *   # Download backup from Firebase Storage to emulator
 *   npm run seed:emulator restore [backup-name]
 *   
 *   # Import existing local export
 *   npm run seed:emulator import <path-to-export>
 *   
 *   # Transform data with relationships
 *   npm run seed:emulator transform
 *   
 *   # Export emulator data
 *   npm run seed:emulator export
 *   
 *   # List available backups
 *   npm run seed:emulator list
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// import { getStorage } from 'firebase-admin/storage'; // No longer needed - using gcloud CLI
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';

const execAsync = promisify(exec);

// Configuration
const EMULATOR_DATA_DIR = path.join(__dirname, '../emulator-data');
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8181';
const PRODUCTION_PROJECT = process.env.GCLOUD_PROJECT || 'wgu-extension-site-prod';
const STORAGE_BUCKET = `${PRODUCTION_PROJECT}.firebasestorage.app`; // Firebase Storage bucket
const BACKUP_PREFIX = 'firestore-backups/';

// Command line arguments
const command = process.argv[2];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function initializeFirebaseAdmin() {
  const apps = (global as any).apps || [];
  if (!apps.length) {
    // Check if we're in emulator mode
    const isEmulator = process.env.FIRESTORE_EMULATOR_HOST;
    
    const config: any = {
      projectId: PRODUCTION_PROJECT
    };
    
    // Only add credentials if not using emulator or if doing Storage operations
    if (!isEmulator || process.argv[2] === 'backup' || process.argv[2] === 'restore' || process.argv[2] === 'list') {
      // Use Firebase CLI authentication (applicationDefault uses CLI auth)
      console.log('🔐 Using Firebase CLI authentication...');
      try {
        config.credential = applicationDefault();
      } catch (error) {
        console.warn('⚠️  Could not load application default credentials');
        console.warn('   Make sure you\'re logged in: firebase login');
      }
      config.storageBucket = STORAGE_BUCKET;
    }
    
    const app = initializeApp(config);
    (global as any).apps = [app];
    return app;
  }
  return apps[0];
}

function initializeFirestore(useEmulator = false): FirebaseFirestore.Firestore {
  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
  }
  initializeFirebaseAdmin();
  return getFirestore();
}

// Note: getStorageBucket() no longer needed - using gcloud CLI directly
// function getStorageBucket() {
//   initializeFirebaseAdmin();
//   return getStorage().bucket(STORAGE_BUCKET);
// }

// ==========================================
// BACKUP USING GCLOUD FIRESTORE EXPORT
// ==========================================

async function backupToStorage() {
  console.log('📤 Backing up emulator data using gcloud firestore export...\n');
  
  try {
    // First export current emulator state to local files
    console.log('📦 Exporting current emulator state...');
    const { stdout, stderr } = await execAsync(
      'firebase emulators:export ./emulator-data --force',
      { cwd: path.join(__dirname, '..') }
    );
    
    if (stderr && !stderr.includes('Export complete')) {
      console.warn('Export warning:', stderr);
    }
    
    // Create a timestamp for the backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `gs://${STORAGE_BUCKET}/emulator-backups/${timestamp}`;
    
    // Create tar archive of emulator data
    console.log('📦 Creating backup archive...');
    const backupName = `emulator-backup-${timestamp}.tar.gz`;
    const tempFile = path.join(__dirname, `../${backupName}`);
    
    await tar.create(
      {
        gzip: true,
        file: tempFile,
        cwd: path.dirname(EMULATOR_DATA_DIR)
      },
      [path.basename(EMULATOR_DATA_DIR)]
    );
    
    // Upload to Firebase Storage using gcloud
    console.log('☁️  Uploading backup to Firebase Storage...');
    const { stdout: uploadOutput, stderr: uploadError } = await execAsync(
      `gcloud storage cp ${tempFile} gs://${STORAGE_BUCKET}/emulator-backups/`
    );
    
    if (uploadError && !uploadError.includes('Operation completed')) {
      console.warn('Upload warning:', uploadError);
    }
    
    // Clean up temp file
    await fs.unlink(tempFile);
    
    console.log('\n✅ Backup complete!');
    console.log(`📍 Backup name: ${backupName}`);
    console.log(`☁️  Storage path: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// ==========================================
// RESTORE FROM FIREBASE STORAGE
// ==========================================

async function restoreFromStorage() {
  console.log('📥 Restoring emulator data from Firebase Storage...\n');
  
  const backupName = process.argv[3];
  
  try {
    // If no backup name provided, get the latest
    let fileToRestore = backupName;
    if (!fileToRestore) {
      console.log('🔍 Finding latest backup...');
      try {
        const { stdout, stderr } = await execAsync(
          `gcloud storage ls gs://${STORAGE_BUCKET}/emulator-backups/`
        );
        
        if (stderr && stderr.includes('matched no objects')) {
          console.error('❌ No backups found in Firebase Storage');
          process.exit(1);
        }
        
        const files = stdout.trim().split('\n').filter(line => line.includes('emulator-backup-'));
        
        if (files.length === 0) {
          console.error('❌ No backups found in Firebase Storage');
          process.exit(1);
        }
        
        // Sort by name (which includes timestamp) and get the latest
        files.sort((a, b) => b.localeCompare(a));
        fileToRestore = path.basename(files[0]);
        console.log(`   Found: ${fileToRestore}`);
      } catch (error: any) {
        if (error.message.includes('matched no objects')) {
          console.error('❌ No backups found in Firebase Storage');
          process.exit(1);
        }
        throw error;
      }
    }
    
    // Download the backup
    const remotePath = `gs://${STORAGE_BUCKET}/emulator-backups/${fileToRestore}`;
    const tempFile = path.join(__dirname, `../${fileToRestore}`);
    
    console.log('☁️  Downloading backup...');
    const { stdout: downloadOutput, stderr: downloadError } = await execAsync(
      `gcloud storage cp ${remotePath} ${tempFile}`
    );
    
    if (downloadError && !downloadError.includes('Operation completed')) {
      console.warn('Download warning:', downloadError);
    }
    
    // Clear existing emulator data
    console.log('🗑️  Clearing existing emulator data...');
    if (await pathExists(EMULATOR_DATA_DIR)) {
      await fs.rm(EMULATOR_DATA_DIR, { recursive: true, force: true });
    }
    
    // Extract the backup
    console.log('📦 Extracting backup...');
    await tar.extract({
      file: tempFile,
      cwd: path.dirname(EMULATOR_DATA_DIR)
    });
    
    // Clean up temp file
    await fs.unlink(tempFile);
    
    console.log('\n✅ Restore complete!');
    console.log(`📁 Emulator data restored to: ${EMULATOR_DATA_DIR}`);
    console.log('   Start the emulator with: npm run serve --workspace=functions');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// ==========================================
// LIST AVAILABLE BACKUPS
// ==========================================

async function listBackups() {
  console.log('📋 Available backups in Firebase Storage:\n');
  
  try {
    // First get basic list
    const { stdout: listOutput, stderr: listError } = await execAsync(
      `gcloud storage ls gs://${STORAGE_BUCKET}/emulator-backups/`
    );
    
    if (listError && listError.includes('matched no objects')) {
      console.log('   No backups found');
      return;
    } else if (listError && !listError.includes('Listed')) {
      console.warn('List warning:', listError);
    }
    
    const backupFiles = listOutput.trim().split('\n')
      .filter(line => line.includes('emulator-backup-'))
      .sort((a, b) => b.localeCompare(a)); // Sort newest first
    
    if (backupFiles.length === 0) {
      console.log('   No backups found');
      return;
    }
    
    // Get detailed info for each file
    for (const filePath of backupFiles) {
      try {
        const { stdout: statOutput } = await execAsync(
          `gcloud storage stat ${filePath}`
        );
        
        const name = path.basename(filePath);
        const sizeMatch = statOutput.match(/Content-Length:\s*(\d+)/);
        const timeMatch = statOutput.match(/Creation time:\s*(.+)/);
        
        const size = sizeMatch 
          ? `${(parseInt(sizeMatch[1]) / 1024 / 1024).toFixed(2)} MB`
          : 'Unknown size';
        const created = timeMatch ? timeMatch[1].trim() : 'Unknown date';
        
        console.log(`📦 ${name}`);
        console.log(`   Size: ${size}`);
        console.log(`   Created: ${created}`);
        console.log('');
      } catch (statError) {
        const name = path.basename(filePath);
        console.log(`📦 ${name}`);
        console.log('   Size: Unable to get details');
        console.log('');
      }
    }
    
    console.log(`Total backups: ${backupFiles.length}`);
    
  } catch (error: any) {
    if (error.message.includes('matched no objects')) {
      console.log('   No backups found');
      return;
    }
    console.error('❌ Failed to list backups:', error);
    throw error;
  }
}

// ==========================================
// IMPORT EXISTING EXPORT (PROGRAMMATIC)
// ==========================================

async function importExistingExport() {
  console.log('🚀 Importing existing Firestore export to emulator...\n');
  
  const exportPath = process.argv[3];
  if (!exportPath) {
    console.error('❌ Please provide the path to the Firestore export');
    console.error('   Usage: npm run seed:emulator import <path-to-export>');
    process.exit(1);
  }
  
  try {
    // Check if export exists
    if (!await pathExists(exportPath)) {
      console.error(`❌ Export not found at: ${exportPath}`);
      process.exit(1);
    }
    
    // Check if emulator is running by connecting to it
    console.log('🔍 Checking emulator connection...');
    const db = initializeFirestore(true);
    
    try {
      // Test connection
      await db.collection('_test').limit(1).get();
      console.log('✅ Connected to running emulator');
    } catch (error) {
      console.error('❌ Cannot connect to emulator. Make sure it\'s running on', EMULATOR_HOST);
      process.exit(1);
    }
    
    console.log('🗑️  Clearing existing emulator data...');
    await clearAllCollections(db);
    
    console.log('📦 Importing from backup...');
    await importBackupData(exportPath, db);
    
    console.log('\n✅ Import complete!');
    console.log('   Emulator data restored from backup');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Clear all collections in the emulator
async function clearAllCollections(db: FirebaseFirestore.Firestore) {
  try {
    const collections = await db.listCollections();
    console.log(`   Found ${collections.length} collections to clear`);
    
    for (const collection of collections) {
      console.log(`   Clearing ${collection.id}...`);
      await deleteCollection(db, collection.id);
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not clear all collections:', error);
  }
}

// Delete all documents in a collection
async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string) {
  const batchSize = 100;
  const collectionRef = db.collection(collectionPath);
  
  let query = collectionRef.limit(batchSize);
  let snapshot = await query.get();
  
  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    snapshot = await query.get();
  }
}

// Import backup data by using firebase CLI to import while emulator is running
async function importBackupData(exportPath: string, db: FirebaseFirestore.Firestore) {
  try {
    // Use Firebase CLI to import data to the running emulator
    console.log('   Importing data using Firebase CLI...');
    
    const { stdout, stderr } = await execAsync(
      `firebase firestore:delete --all-collections --yes --project=${PRODUCTION_PROJECT}`,
      { env: { ...process.env, FIRESTORE_EMULATOR_HOST: EMULATOR_HOST } }
    );
    
    if (stderr && !stderr.includes('Successfully')) {
      console.warn('   Clear warning:', stderr);
    }
    
    // For Firebase exports, we need to restart with import
    // Copy export to emulator-data for restart
    console.log('📋 Copying export to emulator-data...');
    
    if (await pathExists(EMULATOR_DATA_DIR)) {
      await fs.rm(EMULATOR_DATA_DIR, { recursive: true, force: true });
    }
    
    await fs.mkdir(EMULATOR_DATA_DIR, { recursive: true });
    await execAsync(`cp -r ${exportPath}/* ${EMULATOR_DATA_DIR}/`);
    
    console.log('   ⚠️  Firebase exports require emulator restart to import.');
    console.log('   The data has been prepared. Restart with:');
    console.log('   firebase emulators:start --import=./emulator-data');
    
  } catch (error) {
    console.error('   Using fallback file-based import...');
    
    // Fallback: prepare file-based import
    if (await pathExists(EMULATOR_DATA_DIR)) {
      await fs.rm(EMULATOR_DATA_DIR, { recursive: true, force: true });
    }
    
    await fs.mkdir(EMULATOR_DATA_DIR, { recursive: true });
    await execAsync(`cp -r ${exportPath}/* ${EMULATOR_DATA_DIR}/`);
  }
}

// ==========================================
// TRANSFORM FUNCTIONS
// ==========================================

async function runTransformations() {
  console.log('🔄 Running data transformations...\n');
  
  // Ensure emulator is running
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error('❌ FIRESTORE_EMULATOR_HOST not set');
    console.error('   Make sure the emulator is running: npm run serve --workspace=functions');
    process.exit(1);
  }
  
  try {
    const { runTransformationPipeline } = await import('../src/lib/data-transformation');
    await runTransformationPipeline();
    console.log('\n✅ Transformations complete!');
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  Transformation pipeline already exists in src/lib/data-transformation.ts');
      console.log('   Running transformations...');
      
      // Initialize Firestore with emulator
      const db = initializeFirestore(true);
      
      // Run transformations directly
      try {
        const transformModule = require('../src/lib/data-transformation');
        await transformModule.runTransformationPipeline();
        console.log('\n✅ Transformations complete!');
      } catch (innerError) {
        console.error('❌ Transformation failed:', innerError);
        throw innerError;
      }
    } else {
      console.error('❌ Transformation failed:', error);
      throw error;
    }
  }
}

// ==========================================
// EXPORT EMULATOR DATA
// ==========================================

async function exportEmulatorData() {
  console.log('📦 Exporting emulator data for persistence...\n');
  
  try {
    // Export using Firebase CLI
    const { stdout, stderr } = await execAsync(
      'firebase emulators:export ./emulator-data --force',
      { cwd: path.join(__dirname, '..') }
    );
    
    if (stderr && !stderr.includes('Export complete')) {
      console.warn('Export warning:', stderr);
    }
    
    console.log('✅ Emulator data exported to ./emulator-data');
    console.log('   This data will be automatically loaded next time you start the emulator');
  } catch (error) {
    console.error('❌ Failed to export emulator data:', error);
    console.error('   Make sure Firebase emulator is running with: npm run serve --workspace=functions');
    process.exit(1);
  }
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  try {
    switch (command) {
      case 'backup':
        await backupToStorage();
        break;
        
      case 'restore':
        await restoreFromStorage();
        break;
        
      case 'list':
        await listBackups();
        break;
        
      case 'import':
        await importExistingExport();
        break;
        
      case 'transform':
        await runTransformations();
        break;
        
      case 'export':
        await exportEmulatorData();
        break;
        
      default:
        console.log('🚀 Firestore Emulator Data Management\n');
        console.log('Usage:');
        console.log('  npm run seed:emulator backup        - Backup emulator data to Firebase Storage');
        console.log('  npm run seed:emulator restore       - Restore latest backup from Firebase Storage');
        console.log('  npm run seed:emulator restore <name>- Restore specific backup');
        console.log('  npm run seed:emulator list          - List available backups');
        console.log('  npm run seed:emulator import <path> - Import local export');
        console.log('  npm run seed:emulator transform     - Run data transformations');
        console.log('  npm run seed:emulator export        - Export emulator state');
        console.log('\nEnvironment variables:');
        console.log('  GOOGLE_APPLICATION_CREDENTIALS - Path to service account JSON');
        console.log('  FIRESTORE_EMULATOR_HOST       - Emulator host (default: localhost:8181)');
        console.log('  GCLOUD_PROJECT                - Firebase project ID');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}