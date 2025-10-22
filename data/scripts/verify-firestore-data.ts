#!/usr/bin/env tsx
/**
 * Verify Firestore data against the manifest
 * Checks that all expected collections and documents exist with correct structure
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH environment variable not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.GCLOUD_PROJECT || serviceAccount.project_id || 'wgu-extension-site-prod',
});

const db = getFirestore();

interface ManifestDocument {
  description: string;
  source: string;
  fields: string[];
}

interface ManifestCollection {
  description: string;
  documents: Record<string, ManifestDocument>;
}

interface Manifest {
  collections: Record<string, ManifestCollection>;
  searchableCollections: string[];
}

async function verifyFirestoreData() {
  const manifestPath = resolve(__dirname, '../firestore-manifest.json');
  
  if (!existsSync(manifestPath)) {
    console.error('❌ Firestore manifest not found at:', manifestPath);
    process.exit(1);
  }

  console.log('📖 Reading Firestore manifest...');
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  console.log('\n🔍 Verifying Firestore collections...\n');

  let totalChecks = 0;
  let passedChecks = 0;
  const issues: string[] = [];

  // Check each collection
  for (const [collectionName, collectionDef] of Object.entries(manifest.collections)) {
    console.log(`📁 Collection: ${collectionName}`);
    console.log(`   ${collectionDef.description}`);

    for (const [docName, docDef] of Object.entries(collectionDef.documents)) {
      totalChecks++;
      
      // Handle parameterized document names
      const isParameterized = docName.includes('{');
      
      if (isParameterized) {
        console.log(`   📄 Document pattern: ${docName} (parameterized)`);
        
        // For parameterized docs, check if collection has any documents
        try {
          const snapshot = await db.collection(collectionName).limit(1).get();
          if (snapshot.empty) {
            console.log(`      ⚠️  No documents found`);
            issues.push(`${collectionName}: No documents found`);
          } else {
            console.log(`      ✅ Documents exist`);
            passedChecks++;
          }
        } catch (error) {
          console.log(`      ❌ Error accessing collection: ${error}`);
          issues.push(`${collectionName}: ${error}`);
        }
      } else {
        console.log(`   📄 Document: ${docName}`);
        
        try {
          const docRef = db.collection(collectionName).doc(docName);
          const docSnap = await docRef.get();
          
          if (!docSnap.exists) {
            console.log(`      ❌ Document not found`);
            issues.push(`${collectionName}/${docName}: Document not found`);
          } else {
            const data = docSnap.data() || {};
            console.log(`      ✅ Document exists`);
            
            // Check expected fields
            const missingFields = docDef.fields.filter(field => !(field in data));
            if (missingFields.length > 0) {
              console.log(`      ⚠️  Missing fields: ${missingFields.join(', ')}`);
              issues.push(`${collectionName}/${docName}: Missing fields: ${missingFields.join(', ')}`);
            } else {
              console.log(`      ✅ All expected fields present`);
              passedChecks++;
            }
            
            // Show document stats
            const dataKeys = Object.keys(data);
            console.log(`      📊 Total fields: ${dataKeys.length}`);
            
            // Special handling for collections with items
            if (data.courses && typeof data.courses === 'object') {
              console.log(`      📚 Courses: ${Object.keys(data.courses).length}`);
            }
            if (data.programs && typeof data.programs === 'object') {
              console.log(`      🎓 Programs: ${Object.keys(data.programs).length}`);
            }
            if (Array.isArray(data.courseMappings)) {
              console.log(`      🔗 Course mappings: ${data.courseMappings.length}`);
            }
            if (Array.isArray(data.groups)) {
              console.log(`      👥 Groups: ${data.groups.length}`);
            }
          }
        } catch (error) {
          console.log(`      ❌ Error: ${error}`);
          issues.push(`${collectionName}/${docName}: ${error}`);
        }
      }
    }
    console.log('');
  }

  // Summary
  console.log('📊 Verification Summary:');
  console.log(`   Total checks: ${totalChecks}`);
  console.log(`   Passed: ${passedChecks}`);
  console.log(`   Issues: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Check searchable collections
  console.log('\n🔍 Verifying searchable collections:');
  for (const searchPath of manifest.searchableCollections) {
    console.log(`   ${searchPath}`);
  }

  console.log('\n✅ Verification complete!');
}

verifyFirestoreData().catch(console.error);