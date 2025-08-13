#!/usr/bin/env tsx
/**
 * Upload academic registry data (courses and degree programs) to Firestore
 * This script is meant to be run in CI after DVC pulls and processes catalog data
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_PATH environment variable not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function uploadAcademicRegistry() {
  console.log('📚 Uploading academic registry data to Firestore...\n');

  // Upload courses
  const coursesPath = resolve(__dirname, '../catalogs/processed/courses.json');
  if (!existsSync(coursesPath)) {
    console.error('❌ Courses file not found. Run: npm run catalog:generate-processed');
    process.exit(1);
  }

  console.log('📖 Reading courses data...');
  const coursesData = JSON.parse(readFileSync(coursesPath, 'utf-8'));

  console.log('📤 Uploading courses to Firestore...');
  await db.collection('academic-registry').doc('courses').set({
    ...coursesData,
    uploadedAt: new Date().toISOString(),
  });

  console.log(`✅ Uploaded ${Object.keys(coursesData.courses || {}).length} courses`);

  // Upload degree programs
  const programsPath = resolve(__dirname, '../catalogs/processed/degree-programs.json');
  if (!existsSync(programsPath)) {
    console.error('❌ Degree programs file not found. Run: npm run catalog:generate-processed');
    process.exit(1);
  }

  console.log('\n📖 Reading degree programs data...');
  const programsData = JSON.parse(readFileSync(programsPath, 'utf-8'));

  console.log('📤 Uploading degree programs to Firestore...');
  await db.collection('academic-registry').doc('degree-programs').set({
    ...programsData,
    uploadedAt: new Date().toISOString(),
  });

  console.log(`✅ Uploaded ${Object.keys(programsData.programs || {}).length} degree programs`);

  console.log('\n✨ Academic registry data uploaded successfully!');
}

uploadAcademicRegistry().catch(console.error);