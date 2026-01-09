#!/usr/bin/env tsx
/**
 * Upload catalog summary to Firestore
 * This script is meant to be run in CI after DVC pulls and processes catalog data
 */

import {readFileSync, existsSync} from "fs";
import {resolve, dirname} from "path";
import {fileURLToPath} from "url";
import {initializeApp, cert} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_PATH environment variable not set");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function uploadCatalogData() {
  const catalogPath = resolve(__dirname, "../unified/catalog-summary.json");

  if (!existsSync(catalogPath)) {
    console.error("❌ Catalog summary not found. Run: npm run generate:catalog-summary");
    process.exit(1);
  }

  console.log("📖 Reading catalog data...");
  const catalogData = JSON.parse(readFileSync(catalogPath, "utf-8"));

  console.log("📤 Uploading to Firestore...");
  await db.collection("public").doc("catalogData").set({
    ...catalogData,
    uploadedAt: new Date().toISOString(),
  });

  console.log("✅ Catalog data uploaded to Firestore:");
  console.log(`   📚 Courses: ${catalogData.courses?.length || 0}`);
  console.log(`   🎓 Degree Plans: ${catalogData.degreePlans?.length || 0}`);
}

uploadCatalogData().catch(console.error);
