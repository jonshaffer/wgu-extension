#!/usr/bin/env tsx
/**
 * Upload WGU Student Groups data to Firestore
 * This script uploads the processed WGU Student Groups data
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

async function uploadWguStudentGroups() {
  const dataPath = resolve(__dirname, "../wgu-student-groups/processed/wgu-student-groups.json");

  if (!existsSync(dataPath)) {
    console.error("❌ WGU Student Groups data not found. Run: npm run ingest:wgu-student-groups");
    process.exit(1);
  }

  console.log("📖 Reading WGU Student Groups data...");
  const data = JSON.parse(readFileSync(dataPath, "utf-8"));

  console.log("📤 Uploading to Firestore...");
  await db.collection("public").doc("wguStudentGroups").set({
    ...data,
    uploadedAt: new Date().toISOString(),
  });

  console.log("✅ WGU Student Groups data uploaded:");
  console.log(`   👥 Groups: ${data.groups?.length || 0}`);
  console.log(`   📊 Categories: ${Object.keys(data.byCategory || {}).length}`);
}

uploadWguStudentGroups().catch(console.error);
